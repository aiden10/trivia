import json
import random
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from models import Room, Player, Events, TriviaEvents, GameModes, CreateRoomBody, PeopleEvents
from utils import broadcast, generate_room_id
from events import handle_message, handle_update_gamemode
from trivia_events import (
    handle_restart as handle_trivia_restart,
    handle_guess as handle_trivia_guess,
    handle_update_stage as handle_trivia_update_stage,
    handle_update_question as handle_trivia_update_question,
    handle_update_settings as handle_trivia_update_settings
)
from people_events import (
    handle_restart as handle_people_restart,
    handle_guess as handle_people_guess,
    handle_update_stage as handle_people_update_stage,
    handle_update_properties as handle_people_update_properties,
    handle_update_settings as handle_people_update_settings
)

origins = [
    "http://localhost",
    "http://localhost:3000",
    "https://mtrivia.vercel.app",
    "*"
]

app = FastAPI()
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
    """Handle trivia-specific events."""
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
        is_host = len(room.players) == 0
        
        if is_host:
            room.host_id = room.player_index
        
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

    except WebSocketDisconnect:
        if player and room:
            if player.id in room.players:
                room.players.pop(player.id)
                
                await broadcast({
                    "type": Events.Quit.value,
                    "data": {"playerID": player.id}
                }, room)
                
                if player.id == room.host_id and len(room.players) > 0:
                    await broadcast({
                        "type": Events.UpdateHost.value,
                        "data": {"newHostID": random.choice(room.players.keys())}
                    })
                
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