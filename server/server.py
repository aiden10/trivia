import json
import random
import asyncio
import itertools
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from server.models import Room, Player, Events, TriviaEvents, GameModes, CreateRoomBody, PeopleEvents, RotanikaEvents, PeopleBPEvents, ObscureEvents
from server.utils import (
    broadcast, generate_room_id, send_state, add_system_message,
)
from server.stats import Stats
from server.events import (
    handle_message, handle_update_gamemode, handle_transfer_host,
    handle_request_state,
)
from server.trivia_events import (
    handle_restart as handle_trivia_restart,
    handle_guess as handle_trivia_guess,
    handle_update_stage as handle_trivia_update_stage,
    handle_update_question as handle_trivia_update_question,
    handle_update_settings as handle_trivia_update_settings
)
from server.people_events import (
    handle_restart as handle_people_restart,
    handle_guess as handle_people_guess,
    handle_update_stage as handle_people_update_stage,
    handle_update_properties as handle_people_update_properties,
    handle_update_settings as handle_people_update_settings
)
from server.rotanika_events import (
    handle_restart as handle_rotanika_restart,
    handle_update_stage as handle_rotanika_update_stage,
    handle_set_secret as handle_rotanika_set_secret,
    handle_ask_question as handle_rotanika_ask_question,
    handle_answer_question as handle_rotanika_answer_question,
    handle_update_settings as handle_rotanika_update_settings,
    handle_player_disconnect as handle_rotanika_player_disconnect
)
from server.peopleBP_events import (
    handle_restart as handle_peopleBP_restart,
    handle_guess as handle_peopleBP_guess,
    handle_update_stage as handle_peopleBP_update_stage,
    handle_update_properties as handle_peopleBP_update_properties,
    handle_update_settings as handle_peopleBP_update_settings,
    handle_timeout as handle_peopleBP_timeout,
    handle_player_disconnect as handle_peopleBP_player_disconnect
)
from server.obscure_events import (
    handle_restart as handle_obscure_restart,
    handle_submit as handle_obscure_submit,
    handle_reveal as handle_obscure_reveal,
    handle_update_stage as handle_obscure_update_stage,
    handle_update_settings as handle_obscure_update_settings,
    handle_player_disconnect as handle_obscure_player_disconnect
)

SONG_PREVIEWS_DIR = Path(__file__).parent / "song_previews"

origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://mtrivia.vercel.app",
    "https://room-games.vercel.app",
    "https://trivia.aiden.photo",
    "*",
]

stats = Stats()

@asynccontextmanager
async def lifespan(app: FastAPI):
    async def periodic_stats_write():
        while True:
            await asyncio.sleep(30)
            await stats.write_to_db()
    
    task = asyncio.create_task(periodic_stats_write())
    
    try:
        yield
    finally:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
        try:
            await stats.write_to_db()
        finally:
            stats.close()
        
app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rooms: dict[str, Room] = {}

DISCONNECT_GRACE_SECONDS = 20
LEAVE_CONFIRM_SECONDS = 3
SESSION_REPLACED_CODE = 4001
CONNECTION_EPOCHS = itertools.count(1)


def choose_new_host(room: Room) -> Player | None:
    candidates = [p for p in room.players.values() if p.connected]
    if not candidates:
        candidates = list(room.players.values())
    if not candidates:
        return None

    new_host = random.choice(candidates)
    for player in room.players.values():
        player.host = player.id == new_host.id
    room.host_id = new_host.id
    add_system_message(room, f"{new_host.name} is now the host")
    return new_host


async def finalize_player_removal(room: Room, player: Player):
    """Remove a player for good and notify the room."""
    if room.players.get(player.id) is not player:
        return

    room.players.pop(player.id, None)
    socket = player.socket
    player.socket = None
    player.connected = False
    player.leaving = False
    player.leave_task = None

    if socket is not None:
        try:
            await socket.close(code=4000, reason="Left room")
        except Exception:
            pass

    await stats.on_exit()
    await stats.write_to_db()

    if room.gamemode == GameModes.Rotanika.value:
        await handle_rotanika_player_disconnect(room, player.id)
    if room.gamemode == GameModes.PeopleBP.value:
        await handle_peopleBP_player_disconnect(room, player.id)
    if room.gamemode == GameModes.Obscure.value:
        await handle_obscure_player_disconnect(room, player.id)

    was_host = player.id == room.host_id
    if was_host:
        player.host = False

    add_system_message(room, f"{player.name} left the room")
    if was_host and room.players:
        choose_new_host(room)

    if not room.players:
        rooms.pop(room.id.lower(), None)
        print(f"Room {room.id} closed - no players remaining")
        return

    await send_state(room, Events.UpdatePlayers.value)


async def remove_player_after_grace(room: Room, player: Player):
    """Remove a player after an unexpected disconnect, unless they return."""
    try:
        await asyncio.sleep(DISCONNECT_GRACE_SECONDS)
    except asyncio.CancelledError:
        return

    if player.connected or room.players.get(player.id) is not player:
        return

    await finalize_player_removal(room, player)


async def remove_player_after_leave(room: Room, player: Player):
    """A page was closed/navigated away; give reloads a short window."""
    try:
        await asyncio.sleep(LEAVE_CONFIRM_SECONDS)
    except asyncio.CancelledError:
        return

    if room.players.get(player.id) is not player:
        return
    if player.connected and not player.leaving:
        return

    await finalize_player_removal(room, player)


async def mark_player_disconnected(room: Room, player: Player, websocket: WebSocket):
    if player.socket is not websocket or not player.connected:
        return

    player.connected = False
    player.socket = None

    # The browser already told us this page was closing. Don't show the
    # "reconnecting" grace period - the leave task will remove them shortly.
    if player.leaving:
        await send_state(room, Events.UpdatePlayers.value)
        return

    add_system_message(room, f"{player.name} lost connection")
    await send_state(room, Events.UpdatePlayers.value)

    if player.connected or player.leaving or player.leave_task:
        return
    if player.disconnect_task:
        player.disconnect_task.cancel()
    player.disconnect_task = asyncio.create_task(remove_player_after_grace(room, player))


async def handle_generic_event(message: dict, room: Room, player: Player) -> bool:
    """
    Handle generic (non-gamemode-specific) events.
    Returns True if the event was handled, False otherwise.
    """
    event_type = message.get("type")
    
    match event_type:
        case Events.UpdateGameMode.value:
            await handle_update_gamemode(message, room)
            return True
        case Events.ChatMessage.value:
            await handle_message(message, room)
            return True
        case Events.TransferHost.value:
            await handle_transfer_host(message, room, player)
            return True
        case Events.RequestState.value:
            await handle_request_state(room, player)
            return True
    return False


async def handle_trivia_event(message: dict, room: Room):
    event_type = message.get("type")
    
    match event_type:
        case TriviaEvents.Restart.value:
            await handle_trivia_restart(message, room)
        case TriviaEvents.UpdateQuestion.value:
            await handle_trivia_update_question(room)
        case TriviaEvents.UpdateStage.value:
            await handle_trivia_update_stage(message, room)
        case TriviaEvents.HandleGuess.value:
            await handle_trivia_guess(message, room)
        case TriviaEvents.UpdateSettings.value:
            await handle_trivia_update_settings(message, room)


async def handle_people_event(message: dict, room: Room):
    event_type = message.get("type")
    match event_type:
        case PeopleEvents.Restart.value:
            await handle_people_restart(message, room)
        case PeopleEvents.UpdateProperties.value:
            await handle_people_update_properties(room)
        case PeopleEvents.UpdateStage.value:
            await handle_people_update_stage(message, room)
        case PeopleEvents.HandleGuess.value:
            await handle_people_guess(message, room)
        case PeopleEvents.UpdateSettings.value:
            await handle_people_update_settings(message, room)

async def handle_rotanika_event(message: dict, room: Room):
    event_type = message.get("type")
    match event_type:
        case RotanikaEvents.Restart.value:
            await handle_rotanika_restart(message, room)
        case RotanikaEvents.UpdateStage.value:
            await handle_rotanika_update_stage(message, room)
        case RotanikaEvents.SetSecret.value:
            await handle_rotanika_set_secret(message, room)
        case RotanikaEvents.AskQuestion.value:
            await handle_rotanika_ask_question(message, room)
        case RotanikaEvents.AnswerQuestion.value:
            await handle_rotanika_answer_question(message, room)
        case RotanikaEvents.UpdateSettings.value:
            await handle_rotanika_update_settings(message, room)
            
async def handle_peopleBP_event(message: dict, room: Room):
    event_type = message.get("type")
    match event_type:
        case PeopleBPEvents.Restart.value:
            await handle_peopleBP_restart(message, room)
        case PeopleBPEvents.UpdateProperties.value:
            await handle_peopleBP_update_properties(room)
        case PeopleBPEvents.UpdateStage.value:
            await handle_peopleBP_update_stage(message, room)
        case PeopleBPEvents.HandleGuess.value:
            await handle_peopleBP_guess(message, room)
        case PeopleBPEvents.UpdateSettings.value:
            await handle_peopleBP_update_settings(message, room)
        case PeopleBPEvents.Timeout.value:
            await handle_peopleBP_timeout(message, room)

async def handle_obscure_event(message: dict, room: Room):
    event_type = message.get("type")
    match event_type:
        case ObscureEvents.Restart.value:
            await handle_obscure_restart(message, room)
        case ObscureEvents.UpdateStage.value:
            await handle_obscure_update_stage(message, room)
        case ObscureEvents.SubmitEntity.value:
            await handle_obscure_submit(message, room)
        case ObscureEvents.Reveal.value:
            await handle_obscure_reveal(message, room)
        case ObscureEvents.UpdateSettings.value:
            await handle_obscure_update_settings(message, room)
            
@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await websocket.accept()
    player: Player | None = None
    room: Room | None = None
    
    try:
        room_key = room_id.lower()
        if room_key not in rooms:
            await websocket.send_text(json.dumps({
                "type": "error", 
                "message": "Room not found"
            }))
            await websocket.close()
            return
        
        room = rooms[room_key]

        player_info_data = await websocket.receive_text()
        player_info = json.loads(player_info_data)
        session_id = str(player_info.get("sessionId") or "")
        name = str(player_info.get("name") or "Player").strip()[:40] or "Player"

        existing_player = next(
            (p for p in room.players.values() if session_id and p.session_id == session_id),
            None,
        )
        reconnected = existing_player is not None

        if existing_player:
            player = existing_player
            player.name = name
            player.connected = True
            player.connection_epoch = next(CONNECTION_EPOCHS)
            player.leaving = False
            player.host = player.id == room.host_id
            if player.disconnect_task:
                player.disconnect_task.cancel()
                player.disconnect_task = None
            if player.leave_task:
                player.leave_task.cancel()
                player.leave_task = None

            old_socket = player.socket
            player.socket = websocket
            if old_socket is not None and old_socket is not websocket:
                try:
                    await old_socket.close(
                        code=SESSION_REPLACED_CODE,
                        reason="Session opened in another tab",
                    )
                except Exception:
                    pass
            add_system_message(room, f"{player.name} reconnected")
        else:
            player = Player(name, room.player_index, websocket, session_id)
            player.connection_epoch = next(CONNECTION_EPOCHS)
            room.players[player.id] = player
            room.player_index += 1
            await stats.on_join()

            if not room.players or room.host_id not in room.players or not any(p.host for p in room.players.values()):
                player.host = True
                room.host_id = player.id
            
            if room.gamemode == GameModes.PeopleBP.value and room.peopleBP_state:
                player.lives = room.peopleBP_state.starting_lives

            add_system_message(room, f"{name} joined the room")
        
        await websocket.send_text(json.dumps({
            "type": Events.Join.value,
            "data": {
                "playerID": player.id,
                "host": player.host,
                "reconnected": reconnected,
                "connectionEpoch": player.connection_epoch,
            },
            "state": room.to_dict()
        }))
        
        await broadcast({
            "type": Events.OtherJoin.value,
            "data": {
                "playerName": player.name,
                "playerID": player.id,
                "host": player.host,
                "reconnected": reconnected,
            }
        }, room, websocket)

        await send_state(room, Events.UpdatePlayers.value)

        while True:
            request_data = await websocket.receive_text()
            message = json.loads(request_data)
            
            # try to handle as a generic event first
            handled = await handle_generic_event(message, room, player)
            
            # If not a generic event, route to gamemode-specific handler
            if not handled:
                match room.gamemode:
                    case GameModes.Trivia.value:
                        await handle_trivia_event(message, room)
                    case GameModes.PeopleGuesser.value:
                        await handle_people_event(message, room)
                    case GameModes.Rotanika.value:
                        await handle_rotanika_event(message, room)
                    case GameModes.PeopleBP.value:
                        await handle_peopleBP_event(message, room)
                    case GameModes.Obscure.value:
                        await handle_obscure_event(message, room)

    except WebSocketDisconnect:
        if player and room:
            await mark_player_disconnected(room, player, websocket)
            print(f"Room {room_id}: {len(room.players)} players remaining")
    
    except Exception as e:
        print(f"WebSocket error: {e}")
        import traceback
        traceback.print_exc()
        if player and room:
            await mark_player_disconnected(room, player, websocket)

@app.post("/rooms/create")
async def create_room(create_room_body: CreateRoomBody):    
    room_id = generate_room_id(rooms)
    new_room = Room(room_id, create_room_body.password, create_room_body.is_public)
    rooms[room_id] = new_room
    return JSONResponse(
        content={"room_id": room_id}, 
        status_code=200
    )

@app.post("/rooms/{room_id}/leave")
async def leave_room(room_id: str, session_id: str = "", connection_epoch: int = -1):
    """Called by sendBeacon when the page is closed or navigated away."""
    room = rooms.get(room_id.lower())
    if not room:
        return {"ok": True}

    player = next(
        (
            p for p in room.players.values()
            if session_id and p.session_id == session_id
        ),
        None,
    )
    if not player or player.connection_epoch != connection_epoch:
        return {"ok": True}

    # A reconnect from the next page load wins over the old page's beacon.
    if player.leave_task:
        return {"ok": True}

    if player.disconnect_task:
        player.disconnect_task.cancel()
        player.disconnect_task = None

    # The socket may have closed before this beacon reached us. Replace the
    # temporary "lost connection" entry with a clean leave.
    if (
        room.messages
        and room.messages[-1].system
        and room.messages[-1].body == f"{player.name} lost connection"
    ):
        room.messages.pop()

    player.leaving = True
    player.leave_task = asyncio.create_task(remove_player_after_leave(room, player))
    await send_state(room, Events.UpdatePlayers.value)
    return {"ok": True}

@app.get("/rooms")
async def get_rooms():
    public_rooms = [
        room.to_public_dict()
        for room in rooms.values()
        if room.is_public
        and room.players
        and any(player.connected for player in room.players.values())
    ]
    public_rooms.sort(key=lambda room: room["createdAt"], reverse=True)
    return {"rooms": public_rooms}

@app.get("/rooms/{room_id}")
async def get_room(room_id: str):
    room_key = room_id.lower()
    if room_key in rooms:
        return {"room": rooms[room_key].to_dict()}
    return JSONResponse(
        content={"error": "Room not found"},
        status_code=404
    )

@app.get("/songs/{song_id}")
async def get_song_file(song_id: int):
    file_path = SONG_PREVIEWS_DIR / f"{song_id}.mp3"
    if file_path.exists():
        return FileResponse(file_path, media_type="audio/mpeg")
    return JSONResponse(content={"error": "Song not found"}, status_code=404)

@app.get("/stats")
async def get_stats():
    return await stats.to_dict()
