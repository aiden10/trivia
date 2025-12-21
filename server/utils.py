import json
import random
import string
from pathlib import Path
from fastapi import WebSocket
from .models import Room, TriviaQuestion, TriviaCategories

MAIN_QUESTIONS_FILE = Path(__file__).parent / "questions.json"
CATEGORIES_DIR = Path(__file__).parent / "categories"
QUESTIONS = {}

def load_questions_for_category(category: TriviaCategories) -> list[dict]:
    """Load questions from a category JSON file."""
    file_path = CATEGORIES_DIR / f"{category.value}.json"
    if file_path.exists():
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def load_all_questions():
    """Load all questions from all category files."""
    for category in TriviaCategories:
        QUESTIONS[category.value] = load_questions_for_category(category)

async def broadcast(data: dict, room: Room, sender: WebSocket = None):
    if not room.players:
        return
        
    message = json.dumps(data)
    
    for player in room.players.values():
        if player.socket != sender:
            try:
                await player.socket.send_text(message)
            except:
                pass

async def send_state(room: Room, event: str):
    """Send the full room state to all players."""
    await broadcast({
        "type": event,
        "state": room.to_dict()
    }, room)

def get_question(room: Room) -> TriviaQuestion:
    """Get a random question based on room's selected categories."""
    if room.gamemode_state and room.gamemode_state.categories:
        possible_questions = []
        for category in room.gamemode_state.categories:
            possible_questions.extend(QUESTIONS[category.value])
        
        if possible_questions:
            chosen = random.choice(possible_questions)
            return TriviaQuestion(
                body=chosen.get("q", chosen.get("body", "")),
                answers=chosen.get("a", chosen.get("answers", []))
            )
        
    return TriviaQuestion(
        body="Error: Failed to load question",
        answers=[]
    )

def generate_room_id(rooms) -> str:
    id = ''.join(random.choices(string.ascii_lowercase, k=4))
    while id in rooms:
        id = ''.join(random.choices(string.ascii_lowercase, k=4))
    
    return id  

load_all_questions()