from server.utils import broadcast, send_state, get_question, restart_base, strip_parentheses
from server.models import (
    Room, TriviaEvents, TriviaStages, QUESTION_VALUE, SONG_VALUE,
    TriviaCategories, ImageCategories, SongCategories
)
from rapidfuzz import process, fuzz

FUZZY_THRESHOLD = 70
SONG_FUZZY_THRESHOLD = 85

async def handle_restart(message: dict, room: Room):
    restart_base(room)
    
    if room.trivia_state:
        room.trivia_state.current_question = get_question(room)
        room.trivia_state.current_stage = TriviaStages.QuestionDisplay.value
    
    await send_state(room, TriviaEvents.Restart.value)

async def handle_guess(message: dict, room: Room):
    data = message.get("data", {})
    guess = data.get("guess", "").lower().strip()
    guesser_id = data.get("playerID")
    
    if guesser_id not in room.players:
        return
    
    player = room.players[guesser_id]
    
    if not room.trivia_state or not room.trivia_state.current_question:
        return
    
    player.guess = guess
    question = room.trivia_state.current_question
    
    # Song question
    if question.song_state:
        song_state = question.song_state
        points_earned = 0
        guess_type = None
        
        # Check song name (if player hasn't guessed it yet)
        if not player.guessed_song:
            song_name = strip_parentheses(song_state.song_name).lower()
            result = process.extractOne(guess, [song_name], scorer=fuzz.token_set_ratio)
            if result and result[1] >= SONG_FUZZY_THRESHOLD:
                player.guessed_song = True
                points_earned += SONG_VALUE
                guess_type = "song"
        
        # Check artist (if player hasn't guessed it yet)
        if not player.guessed_artist:
            artist = song_state.artist.lower()
            result = process.extractOne(guess, [artist], scorer=fuzz.token_set_ratio)
            if result and result[1] >= SONG_FUZZY_THRESHOLD:
                player.guessed_artist = True
                points_earned += SONG_VALUE
                guess_type = "artist" if guess_type is None else "both"
        
        if points_earned > 0:
            player.score += points_earned
            player.correct_guesses.append(guess)
            
            await broadcast({
                "type": TriviaEvents.CorrectAnswer.value,
                "data": {
                    "playerID": player.id,
                    "value": points_earned,
                    "guessType": guess_type,
                    "guessedSong": player.guessed_song,
                    "guessedArtist": player.guessed_artist
                }
            }, room)
            
            # Check if all players have guessed both
            for p in room.players.values():
                if not p.guessed_song or not p.guessed_artist:
                    return
                
                room.trivia_state.current_stage = TriviaStages.Reveal.value
                await send_state(room, TriviaEvents.UpdateStage.value)
        else:
            await broadcast({
                "type": TriviaEvents.IncorrectAnswer.value,
                "data": {"playerID": player.id, "guess": guess}
            }, room)
        return
    
    # Text/image question
    accepted_answers = [a.lower().strip() for a in question.answers if 'disambiguation' not in a]
    result = process.extractOne(guess, accepted_answers, scorer=fuzz.token_set_ratio)
    
    is_correct = result and result[1] >= FUZZY_THRESHOLD
    
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

        # Check if all players have guessed correctly
        if all(not p.can_score for p in room.players.values()):
            room.trivia_state.current_stage = TriviaStages.Reveal.value
            await send_state(room, TriviaEvents.UpdateStage.value)
    
    elif guess not in accepted_answers:
        await broadcast({
            "type": TriviaEvents.IncorrectAnswer.value,
            "data": {"playerID": player.id, "guess": guess}
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
            p.guessed_artist = False
            p.guessed_song = False
    
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
        
    if "songCategories" in data:
        song_categories_str = data.get("songCategories", [])
        song_categories = []
        for cat_str in song_categories_str:
            try:
                song_categories.append(SongCategories(cat_str))
            except ValueError:
                pass
        room.trivia_state.song_categories = song_categories
        room.trivia_state.current_question = get_question(room)

    if "questionDuration" in data:
        room.trivia_state.question_duration = data["duration"]
    
    if "winningScore" in data:
        room.trivia_state.winning_score = data["winningScore"]
    
    await send_state(room, TriviaEvents.UpdateSettings.value)