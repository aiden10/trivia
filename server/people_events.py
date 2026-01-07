
from server.utils import broadcast, send_state, get_properties
from server.models import Room, PeopleEvents, PeopleStages, PeopleProperties, QUESTION_VALUE, PeopleState
from server.wikidata import get_entity_data, check_all_properties

async def handle_restart(message: dict, room: Room):
    for player in room.players.values():
        player.score = 0
        player.guess = ""
        player.correct_guesses = []
        player.can_score = True

    if room.people_state:
        room.people_state.already_guessed = []
        room.people_state.current_properties = get_properties(room, PeopleState)
        room.people_state.current_stage = PeopleStages.PropertiesDisplay.value
    
    await send_state(room, PeopleEvents.Restart.value)


async def handle_guess(message: dict, room: Room):
    """Handle a player's guess - check if the person matches all current properties."""
    data = message.get("data", {})
    guess_id = data.get("guess", "")
    guesser_id = data.get("playerID")
    
    if guesser_id not in room.players:
        return
    
    player = room.players[guesser_id]
    
    if not room.people_state or not room.people_state.current_properties:
        return
    
    if guess_id in room.people_state.already_guessed:
        await broadcast({
            "type": PeopleEvents.IncorrectAnswer.value,
            "data": {
                "playerID": player.id,
                "incorrectGuess": "",
                "reason": "alreadyGuessed" 
            }
        }, room)
        return
    
    entity = get_entity_data(guess_id)
    if not entity:
        await broadcast({
            "type": PeopleEvents.IncorrectAnswer.value,
            "data": {
                "playerID": player.id,
                "incorrectGuess": "",
                "reason": "notEntity"
            }
        }, room)
        return
    
    guess_name = entity.get("labels", {}).get("en", {}).get("value", guess_id)
    player.guess = guess_name
    
    is_correct = check_all_properties(entity, room.people_state.current_properties)
    
    if is_correct:
        player.score += QUESTION_VALUE
        player.correct_guesses.append(guess_name)
        room.people_state.already_guessed.append(guess_id)
        
        await broadcast({
            "type": PeopleEvents.CorrectAnswer.value,
            "data": {
                "playerID": player.id,
                "correctGuess": guess_name,
                "value": QUESTION_VALUE
            }
        }, room)
    else:
        await broadcast({
            "type": PeopleEvents.IncorrectAnswer.value,
            "data": {
                "playerID": player.id,
                "incorrectGuess": guess_name,
                "reason": ""
            }
        }, room)
        
async def handle_update_stage(message: dict, room: Room):
    """Update the current game stage."""
    data = message.get("data", {})
    new_stage = data.get("newStage", 0)
    
    if room.people_state:
        room.people_state.current_stage = new_stage
        room.people_state.already_guessed = []
        
    if new_stage == PeopleStages.PropertiesDisplay.value:
        for p in room.players.values():
            p.guess = ""
            p.correct_guesses = []
            p.can_score = True
            
    if new_stage == PeopleStages.Results.value:
        for p in room.players.values():
            p.guess = ""
            p.correct_guesses = []

    await send_state(room, PeopleEvents.UpdateStage.value)

async def handle_update_properties(room: Room):
    """Get and broadcast new properties."""
    if room.people_state:
        room.people_state.current_properties = get_properties(room, PeopleState)
    
    await send_state(room, PeopleEvents.UpdateProperties.value)

async def handle_update_settings(message: dict, room: Room):
    """Update game settings."""
    data = message.get("data", {})
    
    if not room.people_state:
        return
    
    if "properties" in data:
        properties_str = data.get("properties", [])
        properties = []
        for p_str in properties_str:
            try:
                properties.append(PeopleProperties(p_str))
            except ValueError:
                pass
            
        room.people_state.properties = properties
        room.people_state.current_properties = get_properties(room, PeopleState)
    
    if "duration" in data:
        room.people_state.question_duration = data["duration"]
    
    if "winningScore" in data:
        room.people_state.winning_score = data["winningScore"]
    
    await send_state(room, PeopleEvents.UpdateSettings.value)