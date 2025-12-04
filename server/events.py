
from server.utils import *
from server.models import * 

async def handle_restart(message, room: Room):
    data = message["data"]
    room.current_question = None
    room.easy = data["easy"]
    room.medium = data["medium"]
    room.hard = data["hard"]
    
    for player in room.players.values():
        player.score = 0

    await broadcast({
        "type": Events.Restart.value,
        "data": {}
    }, room)

async def handle_update_question(room: Room):
    new_question = get_question(room)
    room.current_question = new_question
    await broadcast({
        "type": Events.UpdateQuestion.value,
        "data": {"body": new_question.body, "value": new_question.value, "options": new_question.options, "answer": new_question.answer}
    }, room)    
    
async def handle_correct_answer(message, room: Room):
    data = message["data"]
    room.players[data["playerID"]].score += data["value"]
    await broadcast({
        "type": Events.CorrectAnswer.value,
        "data": {"playerID": data["playerID"], "value": data["value"]}
    }, room)

async def handle_update_stage(message, room: Room):
    data = message["data"]
    room.current_stage = Stages(data["newStage"])
    await broadcast({
        "type": Events.UpdateStage.value,
        "data": {"newStage": data["newStage"]}
    }, room)

async def handle_update_difficulties(message, room: Room):
    data = message["data"]
    if data["easy"]: room.easy = True
    if data["medium"]: room.medium = True
    if data["hard"]: room.hard = True
    # a bit weird but this just sets a new question and sends it to all players
    await handle_update_question(room)