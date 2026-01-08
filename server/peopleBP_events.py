import random
from server.utils import broadcast, send_state, get_properties, restart_base
from server.models import Room, PeopleBPEvents, PeopleBPStages, PeopleProperties, PeopleBPState
from server.wikidata import get_entity_data, check_all_properties

def get_next_guesser(room: Room) -> int | None:
    if not room.peopleBP_state:
        return None
    
    alive_players = [pid for pid in room.players.keys() if room.players[pid].lives > 0]
    player_list = list(room.players.keys())
    if len(alive_players) <= 1:
        return None
    
    current = room.peopleBP_state.current_guesser
    
    # Find next alive player after current
    try:
        current_idx = player_list.index(current)
    except ValueError:
        # Current guesser not in order, start from beginning
        return alive_players[0] if alive_players else None
    
    # Look for next alive player
    for i in range(1, len(player_list) + 1):
        next_idx = (current_idx + i) % len(player_list)
        next_player = player_list[next_idx]
        if next_player in room.players and room.players[next_player].lives > 0:
            return next_player
    
    return None

def get_alive_players_count(room: Room) -> int:
    return sum(1 for p in room.players.values() if p.lives > 0)


def get_last_alive_player(room: Room) -> int | None:
    for p in room.players.values():
        if p.lives > 0:
            return p.id


async def handle_restart(message: dict, room: Room):
    if not room.peopleBP_state:
        return
    
    room.peopleBP_state.current_guesser = random.choice(list(room.players.keys()))
    
    restart_base(room)
    
    room.peopleBP_state.already_guessed = []
    room.peopleBP_state.current_properties = get_properties(room, PeopleBPState)
    room.peopleBP_state.current_stage = PeopleBPStages.Game.value
    room.peopleBP_state.winner = None
    
    await send_state(room, PeopleBPEvents.Restart.value)

async def handle_guess(message: dict, room: Room):
    data = message.get("data", {})
    guess_id = data.get("guess", "")
    guesser_id = data.get("playerID")
    
    if guesser_id not in room.players:
        return
    
    player = room.players[guesser_id]
    
    if not room.peopleBP_state or not room.peopleBP_state.current_properties:
        return
    
    # Only the current guesser can guess
    if guesser_id != room.peopleBP_state.current_guesser:
        return
        
    # Fetch entity data
    entity = get_entity_data(guess_id)
    if not entity:
        await broadcast({
            "type": PeopleBPEvents.IncorrectAnswer.value,
            "data": {
                "playerID": player.id,
                "incorrectGuess": "",
                "reason": "notEntity"
            }
        }, room)
        return
    
    guess_name = entity.get("labels", {}).get("en", {}).get("value", guess_id)
    player.guess = guess_name
    
    # Check if already guessed
    if guess_id in room.peopleBP_state.already_guessed:
        await broadcast({
            "type": PeopleBPEvents.IncorrectAnswer.value,
            "data": {
                "playerID": player.id,
                "incorrectGuess": guess_name,
                "reason": "alreadyGuessed"
            }
        }, room)
        return

    # Check if guess matches all properties
    is_correct = check_all_properties(entity, room.peopleBP_state.current_properties)
    
    if is_correct:
        player.correct_guesses.append(guess_name)
        player.guess = guess_name
        room.peopleBP_state.already_guessed.append(guess_id)
        
        # Move to next guesser and get new properties
        next_guesser = get_next_guesser(room)
        room.peopleBP_state.current_guesser = next_guesser
        room.peopleBP_state.current_properties = get_properties(room, PeopleBPState)
        
        await broadcast({
            "type": PeopleBPEvents.CorrectAnswer.value,
            "data": {
                "playerID": player.id,
                "correctGuess": guess_name,
            },
            "state": room.to_dict()
        }, room)
    else:
        await broadcast({
            "type": PeopleBPEvents.IncorrectAnswer.value,
            "data": {
                "playerID": player.id,
                "incorrectGuess": guess_name
            }
        }, room)


async def handle_timeout(message: dict, room: Room):
    data = message.get("data", {})
    player_id = data.get("playerID")
    
    if not room.peopleBP_state:
        return
    
    if player_id != room.peopleBP_state.current_guesser:
        return
    
    if player_id not in room.players:
        return
    
    player = room.players[player_id]
    player.lives -= 1
    
    # Check if game is over (only one player left with lives)
    alive_count = get_alive_players_count(room)
    
    if alive_count <= 1:
        # Game over - find the winner
        winner_id = get_last_alive_player(room)
        room.peopleBP_state.winner = winner_id
        room.peopleBP_state.current_stage = PeopleBPStages.Results.value
        
        await send_state(room, PeopleBPEvents.Timeout.value)
        await send_state(room, PeopleBPEvents.UpdateStage.value)
        return
    
    # Move to next guesser and get new properties
    next_guesser = get_next_guesser(room)
    room.peopleBP_state.current_guesser = next_guesser
    room.peopleBP_state.current_properties = get_properties(room, PeopleBPState)
        
    await send_state(room, PeopleBPEvents.Timeout.value)


async def handle_update_stage(message: dict, room: Room):
    data = message.get("data", {})
    new_stage = data.get("newStage", 0)
    
    if not room.peopleBP_state:
        return
    
    room.peopleBP_state.current_stage = new_stage
    
    if new_stage == PeopleBPStages.Game.value or new_stage == PeopleBPStages.Results.value:
        room.peopleBP_state.already_guessed = []
        for p in room.players.values():
            p.guess = ""
            p.correct_guesses = []
            
    await send_state(room, PeopleBPEvents.UpdateStage.value)


async def handle_update_properties(room: Room):
    if room.peopleBP_state:
        room.peopleBP_state.current_properties = get_properties(room, PeopleBPState)
    
    await send_state(room, PeopleBPEvents.UpdateProperties.value)


async def handle_update_settings(message: dict, room: Room):
    data = message.get("data", {})
    
    if not room.peopleBP_state:
        return
    
    if "properties" in data:
        properties_str = data.get("properties", [])
        properties = []
        for p_str in properties_str:
            try:
                properties.append(PeopleProperties(p_str))
            except ValueError:
                pass
        room.peopleBP_state.properties = properties
        room.peopleBP_state.current_properties = get_properties(room, PeopleBPState)
    
    if "minDuration" in data:
        room.peopleBP_state.min_duration = data["minDuration"]
    
    if "maxDuration" in data:
        room.peopleBP_state.max_duration = data["maxDuration"]
    
    if "startingLives" in data:
        room.peopleBP_state.starting_lives = data["startingLives"]
    
    if "combinationLowerBound" in data:
        room.peopleBP_state.combination_lower_bound = data["combinationLowerBound"]
    
    if "combinationUpperBound" in data:
        room.peopleBP_state.combination_upper_bound = data["combinationUpperBound"]
    
    await send_state(room, PeopleBPEvents.UpdateSettings.value)


async def handle_player_disconnect(room: Room, player_id: int):
    if not room.peopleBP_state:
        print("returning early")
        return
        
    # If it was their turn, move to next player
    if room.peopleBP_state.current_guesser == player_id:
        next_guesser = get_next_guesser(room)
        if next_guesser:
            room.peopleBP_state.current_guesser = next_guesser
            room.peopleBP_state.current_properties = get_properties(room, PeopleBPState)
            await send_state(room, PeopleBPEvents.UpdateProperties.value)
    
    # Check if game is over 
    alive_count = get_alive_players_count(room)
    if alive_count <= 1:
        winner_id = get_last_alive_player(room)
        room.peopleBP_state.winner = winner_id
        room.peopleBP_state.current_stage = PeopleBPStages.Results.value
        await send_state(room, PeopleBPEvents.UpdateStage.value)