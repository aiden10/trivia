import json
import random
import string
import os
import time
import redis
import requests
from pydantic import BaseModel
from google import genai
from google.genai import types
from dotenv import load_dotenv
from pathlib import Path
from fastapi import WebSocket
from models import Room, TriviaQuestion, TriviaCategories, ImageCategories, PeopleProperties, NON_PEOPLE_IMAGE_CATEGORIES

MAIN_QUESTIONS_FILE = Path(__file__).parent / "questions.json"
CATEGORIES_DIR = Path(__file__).parent / "categories"
IMAGES_DIR = Path(__file__).parent / "images"
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)
QUESTIONS = {}
IMAGE_QUESTIONS = {}

redis_client = redis.Redis(
    host=os.getenv("REDIS_ENDPOINT"),
    port=19579,
    decode_responses=True,
    username="default",
    password=os.getenv("REDIS_PASSWORD"),
)

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
        
def load_images_for_category(category: ImageCategories) -> dict:
    """Load image questions from a category JSON file."""
    file_path = IMAGES_DIR / f"{category.value}.json"
    if file_path.exists():
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def load_all_images():
    """Load all image questions from all image category files."""
    for category in ImageCategories:
        IMAGE_QUESTIONS[category.value] = load_images_for_category(category)
        
def get_name_variations(full_name: str) -> list[str]:
    answers = [full_name.lower()]
    
    parts = full_name.split()
    
    if len(parts) > 1:
        answers.append(parts[-1].lower())
    
    return list(set(answers))

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
    """Get a random question based on room's selected categories (text or image)."""
    if not room.trivia_state:
        return TriviaQuestion(body="Error: No trivia state", answers=[])
    
    text_questions = []
    image_questions = []
    
    # Text-based questions
    if room.trivia_state.categories:
        for category in room.trivia_state.categories:
            if category.value in QUESTIONS:
                for q in QUESTIONS[category.value].values():
                    text_questions.append(q)
    
    # Image-based questions
    if room.trivia_state.image_categories:
        for category in room.trivia_state.image_categories:
            if category.value in IMAGE_QUESTIONS:
                for item_id, item in IMAGE_QUESTIONS[category.value].items():
                    image_questions.append({
                        "name": item["name"],
                        "image": item["image"],
                        "category": category.value
                    })
    
    all_questions = []
    
    for q in text_questions:
        all_questions.append(("text", q))
    
    for q in image_questions:
        all_questions.append(("image", q))
    
    if not all_questions:
        return TriviaQuestion(body="Error: No questions available", answers=[])
    
    question_type, chosen = random.choice(all_questions)
    
    if question_type == "text":
        return TriviaQuestion(
            body=chosen.get("q", chosen.get("body", "")),
            answers=chosen.get("a", chosen.get("answers", [])),
            image=None
        )
    else:
        is_person_category = chosen["category"] not in NON_PEOPLE_IMAGE_CATEGORIES
        question_text = "Who is this?" if is_person_category else "What is this?"

        return TriviaQuestion(
            body=question_text,
            answers=get_name_variations(chosen["name"]),
            image=chosen["image"]
        )

def get_properties(room: Room) -> list[PeopleProperties]:
    if not room.people_state or not room.people_state.properties:
        return []
    
    lower = room.people_state.combination_lower_bound
    upper = room.people_state.combination_upper_bound
    
    if lower > upper:
        size = lower
    elif lower == upper:
        size = lower
    else:
        size = random.randint(lower, upper)
    
    size = min(size, len(room.people_state.properties))
    
    genders = {PeopleProperties.Male, PeopleProperties.Female}
    continents = {
        PeopleProperties.Asia, PeopleProperties.NorthAmerica, 
        PeopleProperties.SouthAmerica, PeopleProperties.Europe, 
        PeopleProperties.Africa, PeopleProperties.Oceania
    }
    
    available = list(room.people_state.properties)
    selected: list[PeopleProperties] = []
    
    for _ in range(size):
        if not available:
            break
        
        choice = random.choice(available)
        selected.append(choice)
        available.remove(choice)
        
        if choice in genders:
            available = [p for p in available if p not in genders]
        
        if choice in continents:
            available = [p for p in available if p not in continents]
    
    return selected

def generate_room_id(rooms) -> str:
    id = ''.join(random.choices(string.ascii_lowercase, k=4))
    while id in rooms:
        id = ''.join(random.choices(string.ascii_lowercase, k=4))
    
    return id  

class ProcessedQuestion(BaseModel):
    id: str
    categories: list[TriviaCategories]
    normalized_answers: list[str]

class BatchResponse(BaseModel):
    questions: list[ProcessedQuestion]
    
CATEGORY_LIST = [c.value for c in TriviaCategories]

def categorize_questions():
    client = genai.Client(api_key=os.getenv("GEMINI_KEY"))
    
    with open("questions.json", "r", encoding="utf-8") as f:
        all_questions = json.load(f)

    output_file = "cleaned_questions.jsonl"
    
    already_processed_ids = set()
    if os.path.exists(output_file):
        with open(output_file, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    already_processed_ids.add(json.loads(line)["id"])
                except json.JSONDecodeError:
                    continue

    remaining_questions = [q for q in all_questions if q["id"] not in already_processed_ids]
    print(f"Resuming: {len(already_processed_ids)} done, {len(remaining_questions)} to go.")

    batch_size = 20
    for i in range(0, len(remaining_questions), batch_size):
        batch = remaining_questions[i:i + batch_size]
        
        prompt = f"Process this batch of trivia data. Verify facts and clean: {json.dumps(batch)}"

        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=(
                        f"You are an expert trivia curator for a competitive multiplayer game. "
                        f"Use ONLY these categories: {CATEGORY_LIST}. "
                        "\n\nCRITICAL DATA INTEGRITY RULES:\n"
                        "1. GROUNDING: If the provided answer list ('a') contains gibberish, religious rants, or unrelated text, IGNORE IT. Use your internal knowledge to provide the correct factual answer.\n"
                        "2. DISCARD: Omit any questions that are riddles, logic puzzles, or require visual/audio components.\n"
                        "3. MULTIPLE CATEGORIES: Assign all relevant categories (e.g., a movie about a musician gets ['movies', 'music', 'pop_culture']).\n"
                        "4. NAME RULE: If the answer is a person, 'normalized_answers' MUST include: [Full Name, Last Name Only, Common Nicknames].\n"
                        "5. FORMATTING: Use lowercase only. No 'a', 'an', or 'the' at the start. Use only standard US keyboard characters (no accents).\n"
                        "6. NUMBERS: Include both digits and words (e.g., ['7', 'seven'])."
                    ),
                    response_mime_type="application/json",
                    response_schema=BatchResponse,
                    temperature=0.0,
                )
            )
            
            if response.parsed and response.parsed.questions:
                with open(output_file, "a", encoding="utf-8") as f:
                    for q_out in response.parsed.questions:
                        line = q_out.model_dump_json() if hasattr(q_out, 'model_dump_json') else q_out.json()
                        f.write(line + "\n")
                
                current_total = len(already_processed_ids) + i + len(batch)
                print(f"Batch {i//batch_size + 1} saved. Total: {current_total}/{len(all_questions)}")
            
            time.sleep(0.5) 

        except Exception as e:
            print(f"Error at batch starting index {i}: {e}")
            print("Progress saved. You can restart the script to resume.")
            break

def populate_categories():
    category_map = {
        "history": {},
        "literature": {},
        "geography": {},
        "movies": {},
        "video_games_and_board_games": {},
        "pop_culture": {},
        "science_and_nature": {},
        "music": {},
        "sports": {},
        "food_and_drink": {},
        "television": {},
        "art_and_architecture": {},
        "miscellaneous": {},
    }
    question_map = json.load(open("formatted_questions.json", "r", encoding="utf-8"))
    
    with open("cleaned_questions.jsonl", "r", encoding="utf-8") as f:
        lines = f.readlines()
        for line in lines:
            data = json.loads(line.strip())
            id = data["id"]
            categories = data["categories"]
            extra_answers = data["normalized_answers"]
            question = question_map[id]["q"]
            answers = list(set(question_map[id]["a"] + extra_answers))
            for c in categories:
                category_map[c][id] = {"q": question, "a": answers}
    
    for k in category_map.keys():
        with open(f"categories/{k}.json", "w", encoding="utf-8") as out:
            json.dump(category_map[k], out, indent=4)
        
def reformat_questions():
    reformatted_questions = {}
    with open("questions.json", "r", encoding="utf-8") as f:
        questions = json.load(f)
        for question in questions:
            id = question["id"]
            q = question["q"]
            a = question["a"]
            reformatted_questions[id] = {"q": q, "a": a}

        with open("formatted_questions.json", "w", encoding="utf-8") as out:
            json.dump(reformatted_questions, out)
            
def is_subclass_of_category(specific_occ_id: str, target_gen_id: str) -> bool:
    cached_parents = redis_client.smembers(f"occ:{specific_occ_id}")
    if cached_parents:
        return target_gen_id in cached_parents

    query = f"""
    ASK {{
      wd:{specific_occ_id} wdt:P279* wd:{target_gen_id} .
    }}
    """
    url = "https://query.wikidata.org/sparql"
    headers = {'User-Agent': 'MyTriviaApp/1.0', 'Accept': 'application/sparql-results+json'}
    
    response = requests.get(url, params={'query': query}, headers=headers)
    if response.json().get("boolean"):
        redis_client.sadd(f"occ:{specific_occ_id}", target_gen_id)
        return True
    
    return False

def fetch_wikidata_trivia(category_id, category_name, is_person=False, min_sitelinks=15):
    url = "https://query.wikidata.org/sparql"
    results_dict = {}
    limit = 100
    offset = 0
    
    headers = {
        'User-Agent': 'mTrivia/1.0',
        'Accept': 'application/sparql-results+json'
    }

    if not os.path.exists('images'):
        os.makedirs('images')

    while True:
        print(f"Fetching {category_name}: items {offset} to {offset + limit}...")
        
        if is_person:
            category_filter = f"""
                ?item wdt:P31 wd:Q5;
                      wdt:P106 wd:{category_id}.
            """
        else:
            category_filter = f"?item wdt:P31 wd:{category_id}."

        query = f"""
        SELECT ?item ?itemLabel ?image ?sitelinks WHERE {{
          {category_filter}
          ?item wdt:P18 ?image.
          ?item wikibase:sitelinks ?sitelinks.
          FILTER(?sitelinks > {min_sitelinks})
          SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
        }}
        ORDER BY DESC(?sitelinks)
        LIMIT {limit}
        OFFSET {offset}
        """

        try:
            response = requests.get(url, params={'query': query, 'format': 'json'}, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            bindings = data.get('results', {}).get('bindings', [])
            
            if not bindings:
                print(f"Finished. Total items found: {len(results_dict)}")
                break

            for row in bindings:
                item_id = row['item']['value'].split('/')[-1]
                if item_id == row['itemLabel']['value']: 
                    continue
                results_dict[item_id] = {
                    "name": row['itemLabel']['value'],
                    "image": row['image']['value']
                }

            offset += limit
            time.sleep(1)

        except Exception as e:
            print(f"Error fetching data at offset {offset}: {e}")
            break

    filename = f"images/{category_name}.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(results_dict, f, indent=4)
    
    print(f"Saved to {filename}")

fetch_wikidata_trivia("Q4964182", "philosophers", is_person=True, min_sitelinks=65)

load_all_questions()
load_all_images()