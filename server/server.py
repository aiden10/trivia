import json
import random
import asyncio
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from server.models import Room, Player, Events, TriviaEvents, GameModes, CreateRoomBody, PeopleEvents, RotanikaEvents, PeopleBPEvents
from server.utils import broadcast, generate_room_id, send_state
from server.stats import Stats
from server.events import handle_message, handle_update_gamemode
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

SONG_PREVIEWS_DIR = Path(__file__).parent / "song_previews"

origins = [
    "http://localhost",
    "http://localhost:3000",
    "https://mtrivia.vercel.app",
    "*"
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
        await stats.write_to_db()
        
app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rooms: dict[str, Room] = {}

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
            
@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await websocket.accept()
    player = None
    room: Room = None
    
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
        
        player = Player(player_info["name"], room.player_index, websocket)
        await stats.on_join()
        is_host = len(room.players) == 0
        
        if is_host:
            player.host = True
            room.host_id = room.player_index
            
        if room.gamemode == GameModes.PeopleBP.value and room.peopleBP_state:
            player.lives = room.peopleBP_state.starting_lives
        
        await websocket.send_text(json.dumps({
            "type": Events.Join.value,
            "data": {
                "playerID": room.player_index,
                "host": is_host,
            },
            "state": room.to_dict()
        }))
        
        await broadcast({
            "type": Events.OtherJoin.value,
            "data": {
                "playerName": player_info["name"],
                "playerID": room.player_index
            }
        }, room, websocket)
        
        room.players[room.player_index] = player
        room.player_index += 1

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

    except WebSocketDisconnect:
        if player and room:
            if player.id in room.players:
                room.players.pop(player.id)
                await stats.on_exit()
                if room.gamemode == GameModes.Rotanika.value:
                    await handle_rotanika_player_disconnect(room, player.id)
                if room.gamemode == GameModes.PeopleBP.value:
                    await handle_peopleBP_player_disconnect(room, player.id)

                if player.id == room.host_id and len(room.players) > 0:
                    new_host = random.choice(list(room.players.keys()))
                    await broadcast({
                        "type": Events.UpdateHost.value,
                        "data": {"newHostID": new_host}
                    }, room)
                    room.players[new_host].host = True
                    room.host_id = new_host
                
                await send_state(room, Events.Quit.value)                
                
                if len(room.players) == 0:
                    print(f"Room {room_id} closed - no players remaining")
                    rooms.pop(room_id.lower(), None)
            
            print(f"Room {room_id}: {len(room.players)} players remaining")
    
    except Exception as e:
        print(f"WebSocket error: {e}")
        import traceback
        traceback.print_exc()

@app.post("/rooms/create")
async def create_room(create_room_body: CreateRoomBody):    
    room_id = generate_room_id(rooms)
    new_room = Room(room_id, create_room_body.password)
    rooms[room_id] = new_room
    return JSONResponse(
        content={"room_id": room_id}, 
        status_code=200
    )

@app.get("/rooms")
async def get_rooms():
    return {
        "rooms": {
            room_id: room.to_dict() 
            for room_id, room in rooms.items()
        }
    }

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
