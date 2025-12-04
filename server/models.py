from pydantic import BaseModel
from fastapi import WebSocket
from enum import Enum

class Stages(Enum):
    Lobby = 0
    QuestionDisplay = 1
    Reveal = 2
    Results = 3

class Events(Enum):
    Quit = "quit"
    Restart = "restart"
    Join = "join"
    OtherJoin = "otherJoin"
    UpdateQuestion = "updateQuestion"
    UpdateStage = "updateStage"
    UpdateScores = "updateScores"
    UpdateDifficulties = "updateDifficulties"
    UpdateQuestionDuration = "updateQuestionDuration"
    CorrectAnswer = "correctAnswer"

class PlayerInfo(BaseModel):
    name: str

class Question(BaseModel):
    body: str
    value: int
    options: list[str]
    answer: str

class Player:
    def __init__(self, name: str, id: int, socket: WebSocket):
        self.name = name
        self.id = id
        self.score = 0
        self.socket = socket

class Room:
    def __init__(self, id: str):
        self.id = id
        self.player_index = 0
        self.players = {}
        self.current_question: Question = None
        self.question_duration = 15 # seconds
        self.current_stage: Stages = Stages.Lobby.value
        self.easy = True
        self.medium = True
        self.hard = True
