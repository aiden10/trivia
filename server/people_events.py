
import requests
from utils import broadcast, send_state, get_properties, is_subclass_of_category
from models import Room, PeopleEvents, PeopleStages, PeopleProperties, QUESTION_VALUE

async def handle_restart(message: dict, room: Room):
    for player in room.players.values():
        player.score = 0
        player.guess = ""
        player.correct_guesses = []
        player.can_score = True

    if room.people_state:
        room.people_state.already_guessed = []
        room.people_state.current_properties = get_properties(room)
        room.people_state.current_stage = PeopleStages.PropertiesDisplay.value
    
    await send_state(room, PeopleEvents.Restart.value)

PROPERTY_SEX = "P21"
PROPERTY_OCCUPATION = "P106"
PROPERTY_CITIZENSHIP = "P27"
PROPERTY_CONTINENT = "P30"

SEX_MAPPING = {
    PeopleProperties.Male: "Q6581097",
    PeopleProperties.Female: "Q6581072",
}

CONTINENT_MAPPING = {
    PeopleProperties.Asia: "Q48",
    PeopleProperties.NorthAmerica: "Q49",
    PeopleProperties.SouthAmerica: "Q18",
    PeopleProperties.Europe: "Q46",
    PeopleProperties.Africa: "Q15",
    PeopleProperties.Oceania: "Q55643",
}

OCCUPATION_MAPPING = {
    PeopleProperties.Athlete: "Q2066131",
    PeopleProperties.Politician: "Q82955",
    PeopleProperties.Actor: "Q33999",
    PeopleProperties.Musician: "Q639669",
    PeopleProperties.Scientist: "Q901",
    PeopleProperties.Author: "Q482980",
}

def get_entity_data(entity_id: str) -> dict | None:
    """Fetch entity data from Wikidata API."""
    url = "https://www.wikidata.org/w/api.php"
    params = {
        "action": "wbgetentities",
        "ids": entity_id,
        "props": "claims|labels",
        "languages": "en",
        "format": "json",
    }
    headers = {'User-Agent': 'aiden10trivia/1.0'}
    
    try:
        response = requests.get(url, params=params, headers=headers)
        data = response.json()
        return data.get("entities", {}).get(entity_id)
    except Exception:
        return None

def get_claim_values(entity: dict, property_id: str) -> list[str]:
    """Extract Q IDs from a property's claims."""
    claims = entity.get("claims", {}).get(property_id, [])
    values = []
    for claim in claims:
        mainsnak = claim.get("mainsnak", {})
        datavalue = mainsnak.get("datavalue", {})
        if datavalue.get("type") == "wikibase-entityid":
            values.append(datavalue["value"]["id"])
    return values

def check_sex_property(entity: dict, required_property: PeopleProperties) -> bool:
    """Check if entity matches a sex property (Male/Female)."""
    sex_values = get_claim_values(entity, PROPERTY_SEX)
    required_q_id = SEX_MAPPING.get(required_property)
    return required_q_id in sex_values

def check_continent_property(entity: dict, required_property: PeopleProperties) -> bool:
    """Check if entity's citizenship is in the required continent."""
    citizenship_ids = get_claim_values(entity, PROPERTY_CITIZENSHIP)
    required_continent_id = CONTINENT_MAPPING.get(required_property)
    
    # For each country of citizenship, check if it's in the required continent
    for country_id in citizenship_ids:
        country_entity = get_entity_data(country_id)
        if country_entity:
            continent_ids = get_claim_values(country_entity, PROPERTY_CONTINENT)
            if required_continent_id in continent_ids:
                return True
    return False

def check_occupation_property(entity: dict, required_property: PeopleProperties) -> bool:
    """Check if entity has an occupation that matches or is a subclass of the required occupation."""
    occupation_ids = get_claim_values(entity, PROPERTY_OCCUPATION)
    required_occupation_id = OCCUPATION_MAPPING.get(required_property)
    
    if required_occupation_id in occupation_ids:
        return True
    
    for occ_id in occupation_ids:
        if is_subclass_of_category(occ_id, required_occupation_id):
            return True
    
    return False

def check_property_match(entity: dict, prop: PeopleProperties) -> bool:
    """Check if an entity matches a single property."""
    if prop in SEX_MAPPING:
        return check_sex_property(entity, prop)
    elif prop in CONTINENT_MAPPING:
        return check_continent_property(entity, prop)
    elif prop in OCCUPATION_MAPPING:
        return check_occupation_property(entity, prop)
    return False

async def handle_guess(message: dict, room: Room):
    """Handle a player's guess - check if the person matches all current properties."""
    data = message.get("data", {})
    guess_id = data.get("guess", "")
    guesser_id = data.get("playerID")
    
    if guesser_id not in room.players:
        return
    
    player = room.players[guesser_id]
    
    if not room.people_state or not room.people_state.current_properties:
        return
    
    if guess_id in room.people_state.already_guessed:
        await broadcast({
            "type": PeopleEvents.IncorrectAnswer.value,
            "data": {
                "playerID": player.id,
                "incorrectGuess": "",
                "reason": "alreadyGuessed" 
            }
        }, room)
        return
    
    entity = get_entity_data(guess_id)
    if not entity:
        await broadcast({
            "type": PeopleEvents.IncorrectAnswer.value,
            "data": {
                "playerID": player.id,
                "incorrectGuess": "",
                "reason": "notEntity"
            }
        }, room)
        return
    
    guess_name = entity.get("labels", {}).get("en", {}).get("value", guess_id)
    player.guess = guess_name
    
    is_correct = all(
        check_property_match(entity, prop) 
        for prop in room.people_state.current_properties
    )
    
    if is_correct:
        player.score += QUESTION_VALUE
        player.correct_guesses.append(guess_name)
        room.people_state.already_guessed.append(guess_id)
        
        await broadcast({
            "type": PeopleEvents.CorrectAnswer.value,
            "data": {
                "playerID": player.id,
                "correctGuess": guess_name,
                "value": QUESTION_VALUE
            }
        }, room)
    else:
        await broadcast({
            "type": PeopleEvents.IncorrectAnswer.value,
            "data": {
                "playerID": player.id,
                "incorrectGuess": guess_name,
                "reason": ""
            }
        }, room)
        
async def handle_update_stage(message: dict, room: Room):
    """Update the current game stage."""
    data = message.get("data", {})
    new_stage = data.get("newStage", 0)
    
    if room.people_state:
        room.people_state.current_stage = new_stage
        room.people_state.already_guessed = []
        
    if new_stage == PeopleStages.PropertiesDisplay.value:
        for p in room.players.values():
            p.guess = ""
            p.correct_guesses = []
            p.can_score = True
    
    await send_state(room, PeopleEvents.UpdateStage.value)

async def handle_update_properties(room: Room):
    """Get and broadcast new properties."""
    if room.people_state:
        room.people_state.current_properties = get_properties(room)
    
    await send_state(room, PeopleEvents.UpdateProperties.value)

async def handle_update_settings(message: dict, room: Room):
    """Update game settings."""
    data = message.get("data", {})
    
    if not room.people_state:
        return
    
    if "properties" in data:
        properties_str = data.get("properties", [])
        properties = []
        for p_str in properties_str:
            try:
                properties.append(PeopleProperties(p_str))
            except ValueError:
                pass
            
        room.people_state.properties = properties
        room.people_state.current_properties = get_properties(room)
    
    if "duration" in data:
        room.people_state.question_duration = data["duration"]
    
    if "winningScore" in data:
        room.people_state.winning_score = data["winningScore"]
    
    await send_state(room, PeopleEvents.UpdateSettings.value)