import requests
from server.models import PeopleProperties
from server.utils import is_subclass_of_category

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
    claims = entity.get("claims", {}).get(property_id, [])
    values = []
    for claim in claims:
        mainsnak = claim.get("mainsnak", {})
        datavalue = mainsnak.get("datavalue", {})
        if datavalue.get("type") == "wikibase-entityid":
            values.append(datavalue["value"]["id"])
    return values

def check_sex_property(entity: dict, required_property: PeopleProperties) -> bool:
    sex_values = get_claim_values(entity, PROPERTY_SEX)
    required_q_id = SEX_MAPPING.get(required_property)
    return required_q_id in sex_values

def check_continent_property(entity: dict, required_property: PeopleProperties) -> bool:
    citizenship_ids = get_claim_values(entity, PROPERTY_CITIZENSHIP)
    required_continent_id = CONTINENT_MAPPING.get(required_property)
    
    for country_id in citizenship_ids:
        country_entity = get_entity_data(country_id)
        if country_entity:
            continent_ids = get_claim_values(country_entity, PROPERTY_CONTINENT)
            if required_continent_id in continent_ids:
                return True
    return False

def check_occupation_property(entity: dict, required_property: PeopleProperties) -> bool:
    
    occupation_ids = get_claim_values(entity, PROPERTY_OCCUPATION)
    required_occupation_id = OCCUPATION_MAPPING.get(required_property)
    
    if required_occupation_id in occupation_ids:
        return True
    
    for occ_id in occupation_ids:
        if is_subclass_of_category(occ_id, required_occupation_id):
            return True
    
    return False

def check_property_match(entity: dict, prop: PeopleProperties) -> bool:
    if prop in SEX_MAPPING:
        return check_sex_property(entity, prop)
    elif prop in CONTINENT_MAPPING:
        return check_continent_property(entity, prop)
    elif prop in OCCUPATION_MAPPING:
        return check_occupation_property(entity, prop)
    return False

def check_all_properties(entity: dict, properties: list[PeopleProperties]) -> bool:
    return all(check_property_match(entity, prop) for prop in properties)