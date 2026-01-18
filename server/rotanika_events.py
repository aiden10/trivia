import random
from server.utils import broadcast, send_state, restart_base
from server.models import Room, RotanikaEvents, RotanikaStages, RotanikaQuestion

async def handle_restart(message: dict, room: Room):
    restart_base(room)
    
    if room.rotanika_state:
        room.rotanika_state.current_stage = RotanikaStages.Lobby.value
        room.rotanika_state.secret_thing = None
        room.rotanika_state.questions = []
        room.rotanika_state.current_question = None
        room.rotanika_state.waiting_for_answer = False
        room.rotanika_state.winner = None
        room.rotanika_state.win_reason = None
    
    await send_state(room, RotanikaEvents.Restart.value)

async def handle_update_stage(message: dict, room: Room):
    data = message.get("data", {})
    new_stage = data.get("newStage", 0)
    
    if not room.rotanika_state:
        return
    
    room.rotanika_state.current_stage = new_stage
    
    # When moving to Picking stage, select the picker
    if new_stage == RotanikaStages.Picking.value:
        player_ids = list(room.players.keys())
        
        # Use configured picker or pick randomly
        configured_picker = room.rotanika_state.picker_id
        if configured_picker in player_ids:
            room.rotanika_state.picker_id = configured_picker
        else:
            room.rotanika_state.picker_id = random.choice(player_ids)
        
        # Set up guesser rotation (everyone except picker)
        room.rotanika_state.guesser_ids = [
            pid for pid in list(room.players.keys()) if pid != room.rotanika_state.picker_id
        ]
        random.shuffle(room.rotanika_state.guesser_ids)
        room.rotanika_state.current_guesser_index = 0
        
        if room.rotanika_state.guesser_ids:
            room.rotanika_state.current_asker = room.rotanika_state.guesser_ids[0]
    
    await send_state(room, RotanikaEvents.UpdateStage.value)

async def handle_set_secret(message: dict, room: Room):
    data = message.get("data", {})
    secret = data.get("secret", "")
    player_id = data.get("playerID")
    
    if not room.rotanika_state:
        return
    
    # Only the picker can set the secret
    if player_id != room.rotanika_state.picker_id:
        return
    
    room.rotanika_state.secret_thing = secret
    room.rotanika_state.current_stage = RotanikaStages.GuessingPeriod.value
    room.rotanika_state.questions = []
    room.rotanika_state.waiting_for_answer = False
    
    await send_state(room, RotanikaEvents.UpdateStage.value)

async def handle_ask_question(message: dict, room: Room):
    data = message.get("data", {})
    question_text = data.get("question", "")
    is_deciding = data.get("isDeciding", False)
    player_id = data.get("playerID")
    
    if not room.rotanika_state:
        return
    
    # Only current asker can ask
    if player_id != room.rotanika_state.current_asker:
        return
    
    # Create the question
    question = RotanikaQuestion(
        text=question_text,
        is_deciding=is_deciding,
        asked_by=player_id,
        turn_number=len(room.rotanika_state.questions) + 1
    )
    
    room.rotanika_state.questions.append(question)
    room.rotanika_state.current_question = question_text
    room.rotanika_state.waiting_for_answer = True
    
    await send_state(room, RotanikaEvents.AskQuestion.value)

async def handle_answer_question(message: dict, room: Room):
    data = message.get("data", {})
    answer = data.get("answer")  # 'yes', 'no', 'unsure'
    player_id = data.get("playerID")
    
    if not room.rotanika_state:
        return
    
    # Only picker can answer
    if player_id != room.rotanika_state.picker_id:
        return
    
    if not room.rotanika_state.questions:
        return
    
    # Update the last question with the answer
    last_question = room.rotanika_state.questions[-1]
    last_question.answer = answer
    
    room.rotanika_state.waiting_for_answer = False
    room.rotanika_state.current_question = None
    
    if last_question.is_deciding:
        if answer == 'yes':
            room.rotanika_state.winner = last_question.asked_by            
            room.rotanika_state.win_reason = 'guessed'
            
            room.rotanika_state.current_stage = RotanikaStages.Results.value
            await broadcast({
                "type": RotanikaEvents.GuessResult.value,
                "data": {
                    "correct": True,
                    "guesserID": player_id,
                    "secret": room.rotanika_state.secret_thing,
                    "winReason": room.rotanika_state.win_reason
                }
            }, room)
            await send_state(room, RotanikaEvents.UpdateStage.value)
            return
    
    # Check if max questions reached
    if len(room.rotanika_state.questions) >= room.rotanika_state.max_questions:
        room.rotanika_state.win_reason = 'maxReached'
        room.rotanika_state.winner = None 
        room.rotanika_state.current_stage = RotanikaStages.Results.value
        await broadcast({
            "type": RotanikaEvents.GuessResult.value,
            "data": {
                "correct": False,
                "guesserID": player_id,
                "secret": room.rotanika_state.secret_thing,
                "winReason": room.rotanika_state.win_reason
            }
        }, room)
        await send_state(room, RotanikaEvents.UpdateStage.value)
        return
    
    # Move to next asker
    room.rotanika_state.current_guesser_index = (
        (room.rotanika_state.current_guesser_index + 1) % 
        len(room.rotanika_state.guesser_ids)
    )
    room.rotanika_state.current_asker = room.rotanika_state.guesser_ids[room.rotanika_state.current_guesser_index]
    
    await send_state(room, RotanikaEvents.AnswerQuestion.value)

async def handle_update_settings(message: dict, room: Room):
    data = message.get("data", {})
    
    if not room.rotanika_state:
        return
    
    if "minQuestions" in data:
        room.rotanika_state.min_questions = data["minQuestions"]
    
    if "maxQuestions" in data:
        room.rotanika_state.max_questions = data["maxQuestions"]
    
    if "pickerId" in data:
        room.rotanika_state.picker_id = data["pickerId"]
    
    await send_state(room, RotanikaEvents.UpdateSettings.value)
    
async def handle_player_disconnect(room: Room, player_id: int):
    if not room.rotanika_state:
        return
    
    # If picker leaves or only 1 player, reset to lobby
    if player_id == room.rotanika_state.picker_id or len(room.players) == 1:
        room.rotanika_state.current_stage = RotanikaStages.Lobby.value
        room.rotanika_state.secret_thing = None
        room.rotanika_state.questions = []
        room.rotanika_state.current_question = None
        room.rotanika_state.waiting_for_answer = False
        await send_state(room, RotanikaEvents.UpdateStage.value)
        return
    
    # If in guessing period and someone leaves
    if room.rotanika_state.current_stage == RotanikaStages.GuessingPeriod.value:
        # Update guesser list to remove disconnected player
        room.rotanika_state.guesser_ids = [
            pid for pid in list(room.players.keys()) if pid != room.rotanika_state.picker_id
        ]
        
        # If current asker left, move to next asker
        if player_id == room.rotanika_state.current_asker:
            if room.rotanika_state.guesser_ids:
                # Find the next valid asker
                try:
                    current_index = room.rotanika_state.guesser_ids.index(player_id)
                except ValueError:
                    current_index = room.rotanika_state.current_guesser_index
                
                room.rotanika_state.current_guesser_index = current_index % len(room.rotanika_state.guesser_ids)
                room.rotanika_state.current_asker = room.rotanika_state.guesser_ids[room.rotanika_state.current_guesser_index]
                
                await send_state(room, RotanikaEvents.UpdateStage.value)
