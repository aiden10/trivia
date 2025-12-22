from pydantic import BaseModel
from fastapi import WebSocket
from enum import Enum
from typing import Optional

QUESTION_VALUE = 10

class GameModes(Enum):
    Default = "default"
    Trivia = "trivia"
    PeopleGuesser = "people"

class TriviaStages(Enum):
    Lobby = 0
    QuestionDisplay = 1
    Reveal = 2
    Results = 3

class PeopleStages(Enum):
    Lobby = 0
    PropertiesDisplay = 1
    GuessingPeriod = 2
    Results = 3

class Events(Enum):
    Quit = "quit"
    Join = "join"
    OtherJoin = "otherJoin"
    UpdateGameMode = "updateGameMode"
    UpdateScores = "updateScores"
    ChatMessage = "chatMessage"

class TriviaEvents(Enum):
    UpdateStage = "updateStage_trivia"
    UpdateQuestion = "updateQuestion_trivia"
    UpdateSettings = "updateSettings_trivia"
    HandleGuess = "handleGuess_trivia"
    CorrectAnswer = "correctAnswer_trivia"
    IncorrectAnswer = "incorrectAnswer_trivia"
    Restart = "restart_trivia"

class PeopleEvents(Enum):
    UpdateStage = "updateStage_people"
    UpdateProperties = "updateProperties_people"
    UpdateSettings = "updateSettings_people"
    HandleGuess = "handleGuess_people"
    CorrectAnswer = "correctAnswer_people"
    IncorrectAnswer = "incorrectAnswer_people"
    Restart = "restart_people"

class TriviaCategories(Enum):
    History = "history"
    Literature = "literature"
    Geography = "geography"
    Movies = "movies"
    Games = "video_games_and_board_games"
    PopCulture = "pop_culture"
    Science = "science_and_nature"
    Music = "music"             
    Sports = "sports"            
    FoodDrink = "food_and_drink" 
    TV = "television"            
    Art = "art_and_architecture" 
    Miscellaneous = "miscellaneous"

class PeopleProperties(Enum):
    Male = "male"
    Female = "female"
    Asia = "asia"
    NorthAmerica = "north_america"
    SouthAmerica = "south_america"
    Europe = "europe"
    Africa = "africa"
    Oceania = "oceania"
    Athlete = "athlete"
    Actor = "actor"
    Politician = "politician"
    Musician = "musician"
    Scientist = "scientist"
    Author = "author"

class TriviaQuestion(BaseModel):
    body: str
    answers: list[str]

    def to_dict(self) -> dict:
        return {
            "body": self.body,
            "answer": self.answers[0] if len(self.answers) > 0 else ""
        }

class TriviaState(BaseModel):
    current_question: Optional[TriviaQuestion] = None
    current_stage: int = TriviaStages.Lobby.value
    question_duration: int = 15
    show_incorrect: bool = True
    winning_score: int = 100
    categories: list[TriviaCategories] = [c for c in TriviaCategories]
    
    def to_dict(self) -> dict:
        return {
            "currentQuestion": self.current_question.to_dict() if self.current_question else None,
            "currentStage": self.current_stage,
            "showIncorrect": self.show_incorrect,
            "settings": {
                "questionDuration": self.question_duration,
                "categories": [c.value for c in self.categories],
                "questionValue": QUESTION_VALUE,
                "winningScore": self.winning_score
            }
        }
        
class PeopleState(BaseModel):
    current_properties: list[PeopleProperties] = []
    current_stage: int = PeopleStages.Lobby.value
    question_duration: int = 15
    show_incorrect: bool = True
    winning_score: int = 150
    properties: list[PeopleProperties] = [p for p in PeopleProperties]
    combination_lower_bound: int = 2
    combination_upper_bound: int = 2
    already_guessed: list[str] = []
    
    def to_dict(self) -> dict:
        return {
            "currentProperties": [cp.value for cp in self.current_properties],
            "currentStage": self.current_stage,
            "settings": {
                "questionDuration": self.question_duration,
                "showIncorrect": self.show_incorrect,
                "properties": [p.value for p in self.properties],
                "questionValue": QUESTION_VALUE,
                "winningScore": self.winning_score,
                "combinationLowerBound": self.combination_lower_bound,
                "combinationUpperBound": self.combination_upper_bound,
            }
        }

class Player:
    def __init__(self, name: str, id: int, socket: WebSocket):
        self.name = name
        self.id = id
        self.guess = ""
        self.correct_guesses = []
        self.score = 0
        self.can_score = True
        self.socket = socket

    def to_dict(self) -> dict:
        return {
            "playerID": self.id,
            "playerName": self.name,
            "score": self.score,
            "guess": self.guess,
            "correctGuesses": self.correct_guesses
        }

class CreateRoomBody(BaseModel):
    password: str

class Room:
    def __init__(self, id: str, password: str):
        self.id = id
        self.player_index = 0
        self.host_id = 0
        self.players: dict[int, Player] = {}
        self.gamemode: str = GameModes.Default.value
        self.trivia_state: Optional[TriviaState] = None
        self.people_state: Optional[PeopleState] = None
        self.password = password
        self.messages = []

    def to_dict(self) -> dict:
        return {
            "roomId": self.id,
            "hostId": self.host_id,
            "players": [p.to_dict() for p in self.players.values()],
            "gamemode": self.gamemode,
            "triviaState": self.trivia_state.to_dict() if self.trivia_state else None,
            "peopleState": self.people_state.to_dict() if self.people_state else None,
        }