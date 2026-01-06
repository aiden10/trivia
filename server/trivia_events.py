from server.utils import broadcast, send_state, get_question
from server.models import Room, TriviaEvents, TriviaStages, QUESTION_VALUE, TriviaCategories, ImageCategories
from rapidfuzz import process, fuzz

FUZZY_THRESHOLD = 70

async def handle_restart(message: dict, room: Room):
    """Reset the game - clear scores and get a new question."""
    for player in room.players.values():
        player.score = 0
        player.guess = ""
        player.correct_guesses = []
        player.can_score = True

    if room.trivia_state:
        room.trivia_state.current_question = get_question(room)
        room.trivia_state.current_stage = TriviaStages.QuestionDisplay.value
    
    await send_state(room, TriviaEvents.Restart.value)

async def handle_guess(message: dict, room: Room):
    """Handle a player's guess - check if it matches any accepted answer."""
    data = message.get("data", {})
    guess = data.get("guess", "").lower().strip()
    guesser_id = data.get("playerID")
    
    if guesser_id not in room.players:
        return
    
    player = room.players[guesser_id]
    
    if not room.trivia_state or not room.trivia_state.current_question:
        return
    player.guess = guess
    accepted_answers = [a.lower().strip() for a in room.trivia_state.current_question.answers if 'disambiguation' not in a]
    result = process.extractOne(
        guess, 
        accepted_answers, 
        scorer=fuzz.token_set_ratio
    )
    is_correct = False
    if result:
        _, score, _ = result
        if score >= FUZZY_THRESHOLD:
            is_correct = True
    
    if is_correct and player.can_score:
        player.score += QUESTION_VALUE
        player.can_score = False
        player.correct_guesses.append(guess)
        
        await broadcast({
            "type": TriviaEvents.CorrectAnswer.value,
            "data": {
                "playerID": player.id,
                "value": QUESTION_VALUE
            }
        }, room)

        # Check if all players have guessed correctly already
        for p in room.players.values():
            if p.can_score:
                return
            
        room.trivia_state.current_stage = TriviaStages.Reveal.value
        await send_state(room, TriviaEvents.UpdateStage.value)
    
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
    
    if room.trivia_state:
        room.trivia_state.current_stage = new_stage
    
    # Reset player state based on stage
    for p in room.players.values():
        if new_stage == TriviaStages.QuestionDisplay.value or new_stage == TriviaStages.Results.value:
            p.correct_guesses = []
            p.guess = ""
            p.can_score = True
    
    await send_state(room, TriviaEvents.UpdateStage.value)
    
async def handle_update_question(room: Room):
    """Get and broadcast a new question."""
    if room.trivia_state:
        room.trivia_state.current_question = get_question(room)
    
    await send_state(room, TriviaEvents.UpdateQuestion.value)

async def handle_update_settings(message: dict, room: Room):
    """Update trivia game settings."""
    data = message.get("data", {})
    
    if not room.trivia_state:
        return
    
    if "categories" in data:
        categories_str = data.get("categories", [])
        categories = []
        for cat_str in categories_str:
            try:
                categories.append(TriviaCategories(cat_str))
            except ValueError:
                pass
        room.trivia_state.categories = categories
        room.trivia_state.current_question = get_question(room)
    
    if "imageCategories" in data:
        image_categories_str = data.get("imageCategories", [])
        image_categories = []
        for cat_str in image_categories_str:
            try:
                image_categories.append(ImageCategories(cat_str))
            except ValueError:
                pass
        room.trivia_state.image_categories = image_categories
        room.trivia_state.current_question = get_question(room)
    
    if "duration" in data:
        room.trivia_state.question_duration = data["duration"]
    
    if "winningScore" in data:
        room.trivia_state.winning_score = data["winningScore"]
    
    await send_state(room, TriviaEvents.UpdateSettings.value)