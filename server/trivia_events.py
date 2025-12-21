from .utils import broadcast, send_state, get_question
from .models import Room, TriviaEvents, TriviaStages, QUESTION_VALUE, TriviaCategories

async def handle_restart(message: dict, room: Room):
    """Reset the game - clear scores and get a new question."""
    for player in room.players.values():
        player.score = 0
        player.can_score = True

    if room.gamemode_state:
        room.gamemode_state.current_question = get_question(room)
        room.gamemode_state.current_stage = TriviaStages.QuestionDisplay.value
    
    await send_state(room, TriviaEvents.Restart.value)

async def handle_guess(message: dict, room: Room):
    """Handle a player's guess - check if it matches any accepted answer."""
    data = message.get("data", {})
    guess = data.get("guess", "").lower().strip()
    guesser_id = data.get("playerID")
    
    if guesser_id not in room.players:
        return
    
    player = room.players[guesser_id]
    
    if not room.gamemode_state or not room.gamemode_state.current_question:
        return
    
    accepted_answers = [a.lower().strip() for a in room.gamemode_state.current_question.answers]
    
    if guess in accepted_answers and player.can_score:
        player.score += QUESTION_VALUE
        player.can_score = False
        
        await broadcast({
            "type": TriviaEvents.CorrectAnswer.value,
            "data": {
                "playerID": player.id,
                "value": QUESTION_VALUE
            }
        }, room)
    
    elif guess not in accepted_answers:
        await broadcast({
            "type": TriviaEvents.IncorrectAnswer.value,
            "data": {
                "playerID": player.id,
                "guess": guess
            }
        }, room)    
        
async def handle_update_stage(message: dict, room: Room):
    """Update the current game stage."""
    data = message.get("data", {})
    new_stage = data.get("newStage", 0)
    
    if room.gamemode_state:
        room.gamemode_state.current_stage = new_stage
    
    # Reset can_score for all players when going to a new question
    if new_stage == TriviaStages.QuestionDisplay.value:
        for p in room.players.values():
            p.can_score = True
    
    await send_state(room, TriviaEvents.UpdateStage.value)

async def handle_update_question(room: Room):
    """Get and broadcast a new question."""
    if room.gamemode_state:
        room.gamemode_state.current_question = get_question(room)
    
    await send_state(room, TriviaEvents.UpdateQuestion.value)

async def handle_update_settings(message: dict, room: Room):
    """Update trivia game settings."""
    data = message.get("data", {})
    
    if not room.gamemode_state:
        return
    
    if "categories" in data:
        categories_str = data.get("categories", [])
        categories = []
        for cat_str in categories_str:
            try:
                categories.append(TriviaCategories(cat_str))
            except ValueError:
                pass
        room.gamemode_state.categories = categories
        room.gamemode_state.current_question = get_question(room)
    
    if "duration" in data:
        room.gamemode_state.question_duration = data["duration"]
    
    if "winningScore" in data:
        room.gamemode_state.winning_score = data["winningScore"]
    
    await send_state(room, TriviaEvents.UpdateSettings.value)