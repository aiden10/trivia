
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from server.models import Room, Player, Events
from server.utils import broadcast, generate_room_id, get_question
from server.events import handle_restart, handle_update_question, handle_update_stage, handle_correct_answer, handle_update_difficulties

origins = [
    "http://localhost",
    "http://localhost:3000",
]

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rooms = {}

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await websocket.accept()
    player = None
    room: Room = None
    
    try:
        if room_id.lower() in rooms:
            room = rooms[room_id.lower()]
        else:
            await websocket.send_text(json.dumps({
                "type": "error", 
                "message": "Room not found"
            }))
            
            return

        player_info_data = await websocket.receive_text()
        player_info = json.loads(player_info_data)
        
        player = Player(player_info["name"], room.player_index, websocket)
        
        host = len(room.players) == 0
        print(f'stage: {room.current_stage}')
        await websocket.send_text(json.dumps({
            "type": Events.Join.value,
            "data": {
                "playerID": room.player_index,
                "host": host,
                "existingPlayers": [{"playerID": p.id, "playerName": p.name, "score": p.score} for p in room.players.values()],
                "stage": room.current_stage,
                "questionBody": room.current_question.body,
                "questionValue": room.current_question.value,
                "questionOptions": room.current_question.options,
                "questionAnswer": room.current_question.answer,
            }
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
            
            match message["type"]:
                case Events.Restart.value:
                    await handle_restart(message, room)
                case Events.UpdateQuestion.value:
                    await handle_update_question(room)
                case Events.UpdateStage.value:
                    await handle_update_stage(message, room)
                case Events.CorrectAnswer.value:
                    await handle_correct_answer(message, room)
                case Events.UpdateDifficulties.value:
                    await handle_update_difficulties(message, room)

    except WebSocketDisconnect:
        if player and room:
            if player.id in room.players:
                room.players.pop(player.id)
                
                await broadcast({
                    "type": Events.Quit.value,
                    "data": {"playerID": player.id}
                }, room)
                
                if len(room.players) == 0:
                    print("Room closed")
                    rooms.pop(room_id, None)
            print(f"players: {len(room.players.values())}")
    
    except Exception as e:
        print(f"WebSocket error: {e}")

@app.post("/rooms/create")
async def create_room():    
    room_id = generate_room_id()
    new_room = Room(room_id)
    new_room.current_question = get_question(new_room)
    rooms[room_id] = new_room
    return JSONResponse(
        content={"room_id": room_id}, 
        status_code=200
    )

@app.get("/rooms")
async def get_rooms():
    return {"rooms": rooms}
