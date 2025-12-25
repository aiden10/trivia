from utils import *
from models import * 

async def handle_update_gamemode(message: dict, room: Room):
    """Switch the room's gamemode and initialize appropriate state."""
    data = message.get("data", {})
    gamemode = data.get("gamemode", GameModes.Default.value)
    
    room.gamemode = gamemode
    
    if gamemode == GameModes.Trivia.value:
        room.trivia_state = TriviaState()
        room.trivia_state.current_question = get_question(room)
    
    if gamemode == GameModes.PeopleGuesser.value:
        room.people_state = PeopleState()
        room.people_state.current_properties = get_properties(room)
        
    if gamemode == GameModes.Rotanika.value:
        room.rotanika_state = RotanikaState()
    
    await broadcast({
        "type": Events.UpdateGameMode.value,
        "state": room.to_dict()
    }, room)

async def handle_message(message: dict, room: Room):
    data = message.get("data", {})
    if "message" in data:
        sender = room.players[data["sender"]].name
        message_text = data["message"]
        room.messages.append({"sender": sender, "message": message_text})
        await broadcast({
            "type": Events.ChatMessage.value,
            "message": message_text,
            "sender": sender
        })