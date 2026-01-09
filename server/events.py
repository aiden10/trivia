from server.utils import *
from server.models import * 

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
        room.people_state.current_properties = get_properties(room, PeopleState)
        
    if gamemode == GameModes.Rotanika.value:
        room.rotanika_state = RotanikaState()
        
    if gamemode == GameModes.PeopleBP.value:
        room.peopleBP_state = PeopleBPState()
        room.peopleBP_state.current_guesser = random.choice(list(room.players.keys()))
        room.peopleBP_state.current_properties = get_properties(room, PeopleBPState)
        for p in room.players.values(): p.lives = room.peopleBP_state.starting_lives

    # Reset scores and guesses
    restart_base(room)
    
    await broadcast({
        "type": Events.UpdateGameMode.value,
        "state": room.to_dict()
    }, room)

async def handle_message(message: dict, room: Room):
    data = message.get("data", {})
    sender = data["sender"]
    body = data["body"]
    room.messages.append(Message(sender=sender, body=body))
    await send_state(room, Events.ChatMessage.value)