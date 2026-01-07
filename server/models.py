from pydantic import BaseModel
from fastapi import WebSocket
from enum import Enum
from typing import Optional

QUESTION_VALUE = 10

class GameModes(Enum):
    Default = "default"
    Trivia = "trivia"
    PeopleGuesser = "people"
    Rotanika = "rotanika"
    PeopleBP = "peopleBP"

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
    
class RotanikaStages(Enum):
    Lobby = 0
    Picking = 1
    GuessingPeriod = 2
    Results = 3
    
class PeopleBPStages(Enum):
    Lobby = 0
    Game = 1
    Results = 2

class Events(Enum):
    Quit = "quit"
    Join = "join"
    OtherJoin = "otherJoin"
    UpdateGameMode = "updateGameMode"
    UpdateScores = "updateScores"
    UpdateHost = "updateHost"
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
    
class RotanikaEvents(Enum):
    UpdateStage = "updateStage_rotanika"
    SetSecret = "setSecret_rotanika"
    AskQuestion = "askQuestion_rotanika"
    AnswerQuestion = "answerQuestion_rotanika"
    UpdateSettings = "updateSettings_rotanika"
    GuessResult = "guessResult_rotanika"
    Restart = "restart_rotanika"

class PeopleBPEvents(Enum):
    UpdateStage = "updateStage_peopleBP"
    UpdateProperties = "updateProperties_peopleBP"
    UpdateSettings = "updateSettings_peopleBP"
    HandleGuess = "handleGuess_peopleBP"
    CorrectAnswer = "correctAnswer_peopleBP"
    IncorrectAnswer = "incorrectAnswer_peopleBP"
    Timeout = "timeout_peopleBP"
    Restart = "restart_peopleBP"

class TriviaCategories(Enum):
    History = "history"
    Literature = "literature"
    Geography = "geography"
    Movies = "movies"
    Games = "games"
    PopCulture = "pop_culture"
    Science = "science_and_nature"
    Music = "music"             
    Sports = "sports"            
    FoodDrink = "food_and_drink" 
    TV = "television"            
    Art = "art_and_architecture" 
    Miscellaneous = "miscellaneous"
    
class ImageCategories(Enum):
    Dishes = "dishes"
    Basketball = "basketball"
    Philosophers = "philosophers"
    Attractions = "attractions"
    Flags = "flags"
    Paintings = "paintings"
    Musicians = "musicians"
    Characters = "characters"
    
IMAGE_PROMPTS = {
    ImageCategories.Dishes.value: "What is this dish?",
    ImageCategories.Basketball.value: "Who is this basketball player?",
    ImageCategories.Philosophers.value: "Who is this philosopher?",
    ImageCategories.Flags.value: "What country's flag is this?",
    ImageCategories.Attractions.value: "What is this attraction?",
    ImageCategories.Paintings.value: "What is this painting?",
    ImageCategories.Characters.value: "Who is this character?",
    ImageCategories.Musicians.value: "Who is this artist?",
}

PEOPLE_CATEGORIES = [
    ImageCategories.Basketball.value, 
    ImageCategories.Philosophers.value, 
    ImageCategories.Characters.value,
    ImageCategories.Musicians.value
]

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
    image: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "body": self.body,
            "answer": self.answers[0] if len(self.answers) > 0 else "",
            "image": self.image
        }
        
class RotanikaQuestion(BaseModel):
    text: str
    answer: Optional[str] = None  # 'yes', 'no', 'unsure', or None
    is_deciding: bool = False
    asked_by: int = 0
    turn_number: int = 0

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "answer": self.answer,
            "isDeciding": self.is_deciding,
            "askedBy": self.asked_by,
            "turnNumber": self.turn_number
        }

class TriviaState(BaseModel):
    current_question: Optional[TriviaQuestion] = None
    current_stage: int = TriviaStages.Lobby.value
    question_duration: int = 15
    show_incorrect: bool = True
    winning_score: int = 100
    categories: list[TriviaCategories] = [c for c in TriviaCategories]
    image_categories: list[ImageCategories] = [c for c in ImageCategories]
    
    def to_dict(self) -> dict:
        return {
            "currentQuestion": self.current_question.to_dict() if self.current_question else None,
            "currentStage": self.current_stage,
            "showIncorrect": self.show_incorrect,
            "settings": {
                "questionDuration": self.question_duration,
                "categories": [c.value for c in self.categories],
                "imageCategories": [c.value for c in self.image_categories],
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
        
class RotanikaState(BaseModel):
    current_stage: int = RotanikaStages.Lobby.value
    picker_id: int = 0
    secret_thing: Optional[str] = None
    questions: list[RotanikaQuestion] = []
    current_asker: int = 0
    current_question: Optional[str] = None
    waiting_for_answer: bool = False
    min_questions: int = 5
    max_questions: int = 20
    winner: Optional[int] = None
    win_reason: Optional[str] = None  # 'guessed', 'maxReached', 'minNotReached'
    guesser_ids: list[int] = []  # Players who can ask questions (non-pickers)
    current_guesser_index: int = 0

    def to_dict(self) -> dict:
        return {
            "currentStage": self.current_stage,
            "pickerId": self.picker_id,
            "secretThing": self.secret_thing,
            "questions": [q.to_dict() for q in self.questions],
            "currentAsker": self.current_asker,
            "currentQuestion": self.current_question,
            "waitingForAnswer": self.waiting_for_answer,
            "winner": self.winner,
            "winReason": self.win_reason,
            "settings": {
                "minQuestions": self.min_questions,
                "maxQuestions": self.max_questions,
                "pickerId": self.picker_id
            }
        }

class PeopleBPState(BaseModel):
    current_stage: int = PeopleBPStages.Lobby.value
    properties: list[PeopleProperties] = [p for p in PeopleProperties]
    current_properties: list[PeopleProperties] = []
    current_guesser: int = 0
    min_duration: int = 8
    max_duration: int = 25
    combination_lower_bound: int = 1
    combination_upper_bound: int = 2
    starting_lives: int = 5
    already_guessed: list[str] = []
    winner: int | None = None
    
    def to_dict(self) -> dict:
        return {
            "currentStage": self.current_stage,
            "currentProperties": [cp.value for cp in self.current_properties],
            "currentGuesser": self.current_guesser,
            "winner": self.winner,
            "settings": {
                "minDuration": self.min_duration,
                "maxDuration": self.max_duration,
                "startingLives": self.starting_lives,
                "properties": [p.value for p in self.properties],
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
        self.lives = 0
        self.can_score = True
        self.socket = socket

    def to_dict(self) -> dict:
        return {
            "playerID": self.id,
            "playerName": self.name,
            "score": self.score,
            "guess": self.guess,
            "lives": self.lives,
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
        self.rotanika_state: Optional[RotanikaState] = None
        self.peopleBP_state: Optional[PeopleBPState] = None
        self.password = password
        self.messages = []

    def to_dict(self) -> dict:
        return {
            "roomId": self.id,
            "hostId": self.host_id,
            "players": [p.to_dict() for p in self.players.values()],
            "messages": self.messages,
            "gamemode": self.gamemode,
            "triviaState": self.trivia_state.to_dict() if self.trivia_state else None,
            "peopleState": self.people_state.to_dict() if self.people_state else None,
            "rotanikaState": self.rotanika_state.to_dict() if self.rotanika_state else None,
            "peopleBPState": self.peopleBP_state.to_dict() if self.peopleBP_state else None
        }