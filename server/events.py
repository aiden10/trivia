import json

from server.utils import *
from server.models import * 

GAMEMODE_NAMES = {
    GameModes.Trivia.value: "Trivia",
    GameModes.PeopleGuesser.value: "PeopleGuesser",
    GameModes.Rotanika.value: "20Q",
    GameModes.PeopleBP.value: "PeopleGuesser: Bomb Party",
    GameModes.Obscure.value: "Obscure",
}

async def handle_update_gamemode(message: dict, room: Room):
    """Switch the room's gamemode and initialize appropriate state."""
    data = message.get("data", {})
    gamemode = data.get("gamemode", GameModes.Default.value)
    
    room.gamemode = gamemode
    clear_stage_timer(room)
    
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

    if gamemode == GameModes.Obscure.value:
        room.obscure_state = ObscureState()

    # Reset scores and guesses
    restart_base(room)

    if gamemode == GameModes.Default.value:
        add_system_message(room, "Returned to the gamemode menu")
    else:
        add_system_message(room, f"Gamemode changed to {GAMEMODE_NAMES.get(gamemode, gamemode)}")
    
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

async def handle_transfer_host(message: dict, room: Room, player: Player):
    data = message.get("data", {})
    target_id = data.get("playerID")

    if player.id != room.host_id or target_id not in room.players:
        return
    if target_id == room.host_id or not room.players[target_id].connected:
        return

    room.players[room.host_id].host = False
    room.players[target_id].host = True
    room.host_id = target_id
    add_system_message(room, f"{room.players[target_id].name} is now the host")

    await broadcast({
        "type": Events.UpdateHost.value,
        "data": {"newHostID": target_id},
        "state": room.to_dict()
    }, room)

async def handle_request_state(room: Room, player: Player):
    if not player.socket:
        return
    try:
        await player.socket.send_text(json.dumps({
            "type": Events.Join.value,
            "data": {
                "playerID": player.id,
                "host": player.host,
                "reconnected": True,
                "connectionEpoch": player.connection_epoch,
            },
            "state": room.to_dict(),
        }))
    except Exception:
        pass