import json
import csv
import random
import string
from fastapi import WebSocket
from models import *

EASY_VALUE = 5
MEDIUM_VALUE = 10
HARD_VALUE = 15

easy_questions = json.load(open("questions/easy.json", "r", encoding="utf-8"))
medium_questions = json.load(open("questions/medium.json", "r", encoding="utf-8"))
hard_questions = json.load(open("questions/hard.json", "r", encoding="utf-8"))

async def broadcast(data: dict, room: Room, sender: WebSocket = None):
    """Broadcast message to all players in room except sender"""
    for player in room.players.values():
        if player.socket != sender:
            try:
                await player.socket.send_text(json.dumps(data))
            except Exception as e:
                print(f"Error sending message to player {player.id}: {e}")
                
def get_question(room: Room) -> Question:
    random_easy = random.choice(easy_questions)
    random_medium = random.choice(medium_questions)
    random_hard = random.choice(hard_questions)
    possible = []
    if room.easy: possible.append(random_easy)
    if room.medium: possible.append(random_medium)
    if room.hard: possible.append(random_hard)
    chosen = random.choice(possible)
    return Question(
        body=chosen["body"],
        value=chosen["value"],
        options=chosen["options"],
        answer=chosen["answer"]
    )

def generate_room_id():
    return ''.join(random.choices(string.ascii_lowercase, k=4))

def divide_csv():
    """Divide questions into easy, medium, and hard based on value"""
    easy = []      # 100-1000
    medium = []    # 2000-16000
    hard = []      # 16000+
    
    with open("../questions.csv", "r", encoding="utf-8") as csvf:
        reader = csv.reader(csvf)
        next(reader)
        option_prefixes = ["A: ", "B: ", "C: ", "D: "]
        
        for row in reader:
            try:
                value = int(row[4])
                
                raw_options = row[5].split(", ")
                new_options = []
                for option in raw_options:
                    cleaned = option
                    for prefix in option_prefixes:
                        cleaned = cleaned.replace(prefix, "")
                    new_options.append(cleaned)
                
                answer = row[6]
                for prefix in option_prefixes:
                    answer = answer.replace(prefix, "")
                
                question_data = {
                    "body": row[1].split("?")[0] + "?",
                    "value": value,
                    "options": new_options,
                    "answer": answer
                }
                
                if value <= 1000:
                    question_data["value"] = EASY_VALUE
                    easy.append(question_data)
                elif value <= 16000:
                    question_data["value"] = MEDIUM_VALUE
                    medium.append(question_data)
                else:
                    question_data["value"] = HARD_VALUE
                    hard.append(question_data)
            except (ValueError, IndexError) as e:
                print(f"Skipping invalid row: {e}")
    
    with open("questions/easy.json", "w", encoding="utf-8") as f:
        json.dump(easy, f, indent=2, ensure_ascii=False)
    
    with open("questions/medium.json", "w", encoding="utf-8") as f:
        json.dump(medium, f, indent=2, ensure_ascii=False)
    
    with open("questions/hard.json", "w", encoding="utf-8") as f:
        json.dump(hard, f, indent=2, ensure_ascii=False)
    
    print(f"Easy: {len(easy)}, Medium: {len(medium)}, Hard: {len(hard)}")

