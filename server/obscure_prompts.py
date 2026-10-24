"""Prompt catalog, Wikidata validation and popularity scoring for the Obscure gamemode.

Prompt catalog
--------------
Every prompt is a leaf made of a general descriptor (e.g. "Movie") and an
optional specifier (e.g. "Horror").  Generals with ``standalone`` set can also
be used on their own (e.g. "Restaurant").  Adding a new prompt only requires
adding an entry to ``OBSCURE_CATALOG`` below - the settings UI is generated
from it automatically.

A prompt's ``rule`` is a small, declarative description of the Wikidata
constraints an answer has to satisfy.  Supported keys:

    instance_of       item is an instance/subclass of one of these QIDs
    genre             item's genre (P136) is one of these QIDs (or a subclass)
    instance_or_genre either of the two above
    instance_or_occupation
                      item is one of the listed classes OR has one of the
                      listed occupations (e.g. musicians are often just
                      "instance of: human")
    occupation        item has one of these occupations (P106)
    published_before  item has a publication date (P577) before this year
    publisher         item was published by one of these entities (P123)
    narrative_universe item belongs to one of these fictional universes (P1080)
    capital_of        item is the capital of something (P1376)
    capital_city      item is a capital city (P31) or capital of something
    country           dynamically added for "City in {country}" prompts (P17)

Rules can be combined by adding keys to the same dict.

Validation is done with a single SPARQL ASK query per submission and cached
in-process, so repeated answers during a session are cheap.
"""

import json
import math
import random
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta
from urllib.parse import quote

import requests

WIKIDATA_API = "https://www.wikidata.org/w/api.php"
SPARQL_URL = "https://query.wikidata.org/sparql"
USER_AGENT = "mTrivia/1.0 (obscure gamemode)"
SPARQL_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "application/sparql-results+json",
}

# Wikidata QIDs

Q_FILM = "Q11424"
Q_TV_SERIES = "Q5398426"
Q_TV_PROGRAM = "Q15416"
Q_RESTAURANT = "Q11707"
Q_MUSICAL_GROUP = "Q215380"
Q_MUSICAL_ENSEMBLE = "Q2088357"
Q_MUSICIAN = "Q639669"
Q_SINGER = "Q177220"
Q_COMPOSER = "Q36834"
Q_CAPITAL_CITY = "Q5119"
Q_CITY = "Q515"
Q_BOOK = "Q571"
Q_NOVEL = "Q8261"
Q_LITERARY_WORK = "Q7725634"
Q_WRITTEN_WORK = "Q47461344"
Q_CHARACTER = "Q95074"
Q_FICTIONAL_HUMAN = "Q15632617"
Q_FILM_CHARACTER = "Q15773347"
Q_COMICS_CHARACTER = "Q1114461"
Q_VIDEO_GAME_CHARACTER = "Q1569167"
Q_ANIME_CHARACTER = "Q80447738"
Q_LITERARY_CHARACTER = "Q3658341"
Q_PROGRAMMING_LANGUAGE = "Q9143"
Q_AIRLINE = "Q46970"
Q_VEGETABLE = "Q11004"
Q_FRUIT = "Q3314483"

Q_HORROR_FILM = "Q200092"
Q_COMEDY_FILM = "Q157443"
Q_ROMANCE_FILM = "Q1054574"
Q_ACTION_FILM = "Q188473"
Q_ADVENTURE_FILM = "Q319221"
Q_ANIMATED_FILM = "Q202866"
Q_FANTASY_FILM = "Q157394"

Q_HORROR_TV = "Q20220309"
Q_COMEDY_TV = "Q9335576"
Q_ROMANCE_TV = "Q84270297"
Q_ACTION_TV = "Q343782"
Q_ADVENTURE_TV = "Q56064758"
Q_FANTASY_TV = "Q98526245"
Q_ANIMATED_SERIES = "Q581714"

Q_METAL = "Q38848"
Q_HIP_HOP = "Q11401"
Q_POP = "Q37073"
Q_INDIE = "Q42201"
Q_INDIE_ROCK = "Q183504"
Q_INDIE_POP = "Q842324"
Q_ROCK = "Q11399"
Q_FOLK = "Q43343"
Q_COUNTRY_MUSIC = "Q83440"

Q_COMIC_BOOK = "Q1760610"
Q_COMIC = "Q1004"
Q_YOUNG_ADULT_LITERATURE = "Q1233720"
Q_YOUNG_ADULT_FICTION = "Q111984153"
Q_CHILDRENS_LITERATURE = "Q131539"

Q_MARVEL_UNIVERSE = "Q931597"
Q_EARTH_616 = "Q2246088"
Q_DC_UNIVERSE = "Q1152150"


# Prompt catalog

OBSCURE_CATALOG: list[dict] = [
    {
        "id": "movie",
        "name": "Movie",
        "standalone": False,
        "rule": {"instance_of": [Q_FILM]},
        "specifiers": [
            {"id": "horror", "name": "Horror Movie", "rule": {"instance_or_genre": [Q_HORROR_FILM]}},
            {"id": "comedy", "name": "Comedy Movie", "rule": {"instance_or_genre": [Q_COMEDY_FILM]}},
            {"id": "romance", "name": "Romance Movie", "rule": {"instance_or_genre": [Q_ROMANCE_FILM]}},
            {"id": "action_adventure", "name": "Action & Adventure Movie", "rule": {"instance_or_genre": [Q_ACTION_FILM, Q_ADVENTURE_FILM]}},
            {"id": "animated", "name": "Animated Movie", "rule": {"instance_or_genre": [Q_ANIMATED_FILM]}},
            {"id": "fantasy", "name": "Fantasy Movie", "rule": {"instance_or_genre": [Q_FANTASY_FILM]}},
        ],
    },
    {
        "id": "tv_show",
        "name": "TV Show",
        "standalone": False,
        "rule": {"instance_of": [Q_TV_SERIES, Q_TV_PROGRAM]},
        "specifiers": [
            {"id": "horror", "name": "Horror TV Show", "rule": {"instance_or_genre": [Q_HORROR_TV]}},
            {"id": "comedy", "name": "Comedy TV Show", "rule": {"instance_or_genre": [Q_COMEDY_TV]}},
            {"id": "romance", "name": "Romance TV Show", "rule": {"instance_or_genre": [Q_ROMANCE_TV]}},
            {"id": "action_adventure", "name": "Action & Adventure TV Show", "rule": {"instance_or_genre": [Q_ACTION_TV, Q_ADVENTURE_TV]}},
            {"id": "animated", "name": "Animated TV Show", "rule": {"instance_or_genre": [Q_ANIMATED_SERIES]}},
            {"id": "fantasy", "name": "Fantasy TV Show", "rule": {"instance_or_genre": [Q_FANTASY_TV]}},
        ],
    },
    {
        "id": "restaurant",
        "name": "Restaurant",
        "standalone": True,
        "rule": {"instance_of": [Q_RESTAURANT]},
    },
    {
        "id": "musical_artist",
        "name": "Musical Artist / Band",
        "standalone": False,
        "rule": {
            "instance_or_occupation": {
                "instance_of": [Q_MUSICAL_GROUP, Q_MUSICAL_ENSEMBLE, Q_MUSICIAN, Q_SINGER],
                "occupation": [Q_MUSICIAN, Q_SINGER, Q_COMPOSER],
            }
        },
        "specifiers": [
            {"id": "metal", "name": "Metal Musical Artist / Band", "rule": {"genre": [Q_METAL]}},
            {"id": "hip_hop", "name": "Hip Hop Musical Artist / Band", "rule": {"genre": [Q_HIP_HOP]}},
            {"id": "pop", "name": "Pop Musical Artist / Band", "rule": {"genre": [Q_POP]}},
            {"id": "indie", "name": "Indie Musical Artist / Band", "rule": {"genre": [Q_INDIE, Q_INDIE_ROCK, Q_INDIE_POP]}},
            {"id": "rock", "name": "Rock Musical Artist / Band", "rule": {"genre": [Q_ROCK]}},
            {"id": "folk_country", "name": "Folk / Country Musical Artist / Band", "rule": {"genre": [Q_FOLK, Q_COUNTRY_MUSIC]}},
        ],
    },
    {
        "id": "capital_city",
        "name": "Capital City",
        "standalone": True,
        "rule": {"capital_city": True},
    },
    {
        "id": "city",
        "name": "City",
        "standalone": True,
        "dynamic_country": True,
        "text": "City in {country}",
        "rule": {"instance_of": [Q_CITY]},
    },
    {
        "id": "book",
        "name": "Book",
        "standalone": False,
        "rule": {"instance_of": [Q_BOOK, Q_NOVEL, Q_LITERARY_WORK, Q_WRITTEN_WORK]},
        "specifiers": [
            {"id": "comic", "name": "Comic Book", "rule": {"instance_or_genre": [Q_COMIC_BOOK, Q_COMIC]}},
            {"id": "young_adult", "name": "Young Adult Book", "rule": {"instance_or_genre": [Q_YOUNG_ADULT_LITERATURE, Q_YOUNG_ADULT_FICTION]}},
            {"id": "childrens", "name": "Children's Book", "rule": {"instance_or_genre": [Q_CHILDRENS_LITERATURE]}},
            {"id": "before_1900", "name": "Book Published Before 1900", "rule": {"published_before": 1900}},
            {"id": "before_1200", "name": "Book Published Before 1200", "rule": {"published_before": 1200}},
        ],
    },
    {
        "id": "character",
        "name": "Character",
        "standalone": False,
        "rule": {
            "instance_of": [
                Q_CHARACTER,
                Q_FICTIONAL_HUMAN,
                Q_FILM_CHARACTER,
                Q_COMICS_CHARACTER,
                Q_VIDEO_GAME_CHARACTER,
                Q_ANIME_CHARACTER,
                Q_LITERARY_CHARACTER,
            ]
        },
        "specifiers": [
            {"id": "marvel", "name": "Marvel Character", "rule": {"narrative_universe": [Q_MARVEL_UNIVERSE, Q_EARTH_616]}},
            {"id": "dc", "name": "DC Character", "rule": {"narrative_universe": [Q_DC_UNIVERSE]}},
            {"id": "video_game", "name": "Video Game Character", "rule": {"instance_or_genre": [Q_VIDEO_GAME_CHARACTER]}},
            {"id": "anime", "name": "Anime Character", "rule": {"instance_or_genre": [Q_ANIME_CHARACTER]}},
            {"id": "literary", "name": "Literary Character", "rule": {"instance_or_genre": [Q_LITERARY_CHARACTER]}},
            {"id": "comic", "name": "Comic Character", "rule": {"instance_or_genre": [Q_COMICS_CHARACTER]}},
        ],
    },
    {
        "id": "programming_language",
        "name": "Programming Language",
        "standalone": True,
        "rule": {"instance_of": [Q_PROGRAMMING_LANGUAGE]},
    },
    {
        "id": "airline",
        "name": "Airline",
        "standalone": True,
        "rule": {"instance_of": [Q_AIRLINE]},
    },
    {
        "id": "vegetable",
        "name": "Vegetable",
        "standalone": True,
        "rule": {"instance_of": [Q_VEGETABLE]},
    },
    {
        "id": "fruit",
        "name": "Fruit",
        "standalone": True,
        "rule": {"instance_of": [Q_FRUIT]},
    },
]

# Fallback countries used if the SPARQL request for the country list fails.
FALLBACK_COUNTRIES = [
    ("Q30", "United States"),
    ("Q145", "United Kingdom"),
    ("Q142", "France"),
    ("Q183", "Germany"),
    ("Q38", "Italy"),
    ("Q29", "Spain"),
    ("Q45", "Portugal"),
    ("Q55", "Netherlands"),
    ("Q31", "Belgium"),
    ("Q39", "Switzerland"),
    ("Q40", "Austria"),
    ("Q34", "Sweden"),
    ("Q20", "Norway"),
    ("Q35", "Denmark"),
    ("Q33", "Finland"),
    ("Q36", "Poland"),
    ("Q213", "Czech Republic"),
    ("Q41", "Greece"),
    ("Q27", "Ireland"),
    ("Q43", "Turkey"),
    ("Q159", "Russia"),
    ("Q212", "Ukraine"),
    ("Q16", "Canada"),
    ("Q96", "Mexico"),
    ("Q155", "Brazil"),
    ("Q414", "Argentina"),
    ("Q298", "Chile"),
    ("Q739", "Colombia"),
    ("Q419", "Peru"),
    ("Q148", "China"),
    ("Q17", "Japan"),
    ("Q884", "South Korea"),
    ("Q668", "India"),
    ("Q843", "Pakistan"),
    ("Q252", "Indonesia"),
    ("Q869", "Thailand"),
    ("Q881", "Vietnam"),
    ("Q928", "Philippines"),
    ("Q408", "Australia"),
    ("Q664", "New Zealand"),
    ("Q79", "Egypt"),
    ("Q258", "South Africa"),
    ("Q1033", "Nigeria"),
    ("Q717", "Kenya"),
    ("Q1028", "Morocco"),
    ("Q851", "Saudi Arabia"),
    ("Q801", "Israel"),
    ("Q794", "Iran"),
    ("Q796", "Iraq"),
    ("Q878", "United Arab Emirates"),
]

# Catalog helpers

_catalog_by_id: dict[str, dict] | None = None
_leaf_by_general: dict[str, list[dict]] = {}


def _index_catalog():
    global _catalog_by_id
    if _catalog_by_id is not None:
        return

    catalog: dict[str, dict] = {}
    for general in OBSCURE_CATALOG:
        leaves: list[dict] = []
        if general.get("standalone"):
            leaves.append({
                "id": general["id"],
                "general": general["id"],
                "specifier": None,
                "text": general.get("text", general["name"]),
                "rule": general.get("rule", {}),
                "dynamic_country": general.get("dynamic_country", False),
            })
        for specifier in general.get("specifiers", []):
            leaves.append({
                "id": f"{general['id']}:{specifier['id']}",
                "general": general["id"],
                "specifier": specifier["id"],
                "text": specifier["name"],
                "rule": {**general.get("rule", {}), **specifier.get("rule", {})},
                "dynamic_country": False,
            })
        _leaf_by_general[general["id"]] = leaves
        for leaf in leaves:
            catalog[leaf["id"]] = leaf

    _catalog_by_id = catalog


def default_prompt_ids() -> list[str]:
    """All prompts enabled by default (every leaf in the catalog)."""
    _index_catalog()
    return list(_catalog_by_id.keys())


def leaf(prompt_id: str) -> dict | None:
    _index_catalog()
    return _catalog_by_id.get(prompt_id)


def catalog_dict() -> list[dict]:
    """Catalog shape consumed by the settings UI."""
    _index_catalog()
    groups = []
    for general in OBSCURE_CATALOG:
        groups.append({
            "id": general["id"],
            "name": general["name"],
            "prompts": [
                {"id": leaf["id"], "name": leaf["text"]}
                for leaf in _leaf_by_general.get(general["id"], [])
            ],
        })
    return groups


def _enabled_prompt_groups(enabled: list[str] | None) -> list[list[dict]]:
    """Enabled prompt leaves, grouped by their general descriptor.

    Each group is equally likely to be rolled.  An enabled specifier is then
    picked uniformly inside the chosen group.  This stops prompt groups with
    many specifiers (e.g. Movie) from being more common than standalone
    prompts with only one option (e.g. Restaurant).
    """
    _index_catalog()
    valid = {pid for pid in (enabled or []) if pid in _catalog_by_id}
    if not valid:
        valid = set(_catalog_by_id.keys())

    groups: list[list[dict]] = []
    for general in OBSCURE_CATALOG:
        leaves = [
            leaf for leaf in _leaf_by_general.get(general["id"], [])
            if leaf["id"] in valid
        ]
        if leaves:
            groups.append(leaves)
    return groups


def generate_prompt(enabled: list[str] | None) -> dict:
    """Pick a general descriptor, then a specifier within it if needed."""
    _index_catalog()
    leaves = random.choice(_enabled_prompt_groups(enabled))
    chosen = random.choice(leaves)

    prompt = {
        "id": chosen["id"],
        "general": chosen["general"],
        "specifier": chosen["specifier"],
        "text": chosen["text"],
        "country_id": None,
        "country_name": None,
        "rule": dict(chosen["rule"]),
    }

    if chosen.get("dynamic_country"):
        country_id, country_name = random.choice(_get_countries())
        prompt["country_id"] = country_id
        prompt["country_name"] = country_name
        prompt["text"] = chosen["text"].format(country=country_name)
        prompt["rule"]["country"] = country_id

    return prompt


# Country list (for "City in {country}")

_countries: list[tuple[str, str]] | None = None
_country_lock = threading.Lock()


def _get_countries() -> list[tuple[str, str]]:
    global _countries
    if _countries:
        return _countries

    with _country_lock:
        if _countries:
            return _countries
        try:
            query = """
            SELECT ?country ?countryLabel WHERE {
              { ?country wdt:P31 wd:Q3624078 } UNION { ?country wdt:P31 wd:Q6256 }
              ?country wikibase:sitelinks ?links .
              FILTER(?links > 40)
              FILTER NOT EXISTS { ?country wdt:P576 ?dissolved }
              SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
            }
            """
            response = requests.get(
                SPARQL_URL,
                params={"query": query, "format": "json"},
                headers=SPARQL_HEADERS,
                timeout=30,
            )
            response.raise_for_status()
            bindings = response.json().get("results", {}).get("bindings", [])
            seen = set()
            countries = []
            for row in bindings:
                qid = row["country"]["value"].rsplit("/", 1)[-1]
                label = row.get("countryLabel", {}).get("value", qid)
                if qid in seen:
                    continue
                seen.add(qid)
                countries.append((qid, label))
            _countries = countries or FALLBACK_COUNTRIES
        except Exception as e:
            print(f"[obscure] Failed to fetch country list, using fallback: {e}")
            _countries = FALLBACK_COUNTRIES
        return _countries


# Wikidata entity helpers

def fetch_entity(entity_id: str) -> dict | None:
    """Fetch label, sitelinks and the best wiki article for an entity."""
    params = {
        "action": "wbgetentities",
        "ids": entity_id,
        "props": "labels|sitelinks",
        "languages": "en",
        "format": "json",
    }
    try:
        response = requests.get(
            WIKIDATA_API,
            params=params,
            headers={"User-Agent": USER_AGENT},
            timeout=15,
        )
        response.raise_for_status()
        entity = response.json().get("entities", {}).get(entity_id)
        if not entity or entity.get("missing") is not None:
            return None

        label = (
            entity.get("labels", {}).get("en", {}).get("value")
            or entity_id
        )
        sitelinks = entity.get("sitelinks", {}) or {}

        # Prefer the English Wikipedia article, otherwise any Wikipedia.
        site, title = _pick_article(sitelinks)

        return {
            "id": entity_id,
            "label": label,
            "sitelinks": _count_sitelinks(sitelinks),
            "views_site": site,
            "views_title": title,
        }
    except Exception as e:
        print(f"[obscure] Failed to fetch entity {entity_id}: {e}")
        return None


def _pick_article(sitelinks: dict) -> tuple[str | None, str | None]:
    if "enwiki" in sitelinks:
        return "enwiki", sitelinks["enwiki"].get("title")
    for site, link in sitelinks.items():
        if site.endswith("wiki") and site not in {
            "commonswiki", "specieswiki", "wikidatawiki", "mediawikiwiki",
        }:
            return site, link.get("title")
    return None, None


def _count_sitelinks(sitelinks: dict) -> int:
    return sum(
        1 for site in sitelinks
        if site not in {"commonswiki", "specieswiki", "mediawikiwiki"}
    )


# Validation

_ask_cache: dict[tuple[str, str], bool] = {}
_ask_lock = threading.Lock()


def _class_path(entity_id: str, target: str) -> str:
    return f"wd:{entity_id} (wdt:P31|wdt:P279)/wdt:P279* wd:{target}"


def _genre_path(entity_id: str, target: str) -> str:
    return f"wd:{entity_id} wdt:P136/wdt:P279* wd:{target}"


def _or(clauses: list[str]) -> str:
    return " UNION ".join(f"{{ {clause} }}" for clause in clauses)


def _rule_conditions(entity_id: str, rule: dict) -> list[str]:
    conditions: list[str] = []

    if rule.get("instance_of"):
        conditions.append("{ " + _or([
            _class_path(entity_id, target) for target in rule["instance_of"]
        ]) + " }")

    if rule.get("genre"):
        conditions.append("{ " + _or([
            _genre_path(entity_id, target) for target in rule["genre"]
        ]) + " }")

    if rule.get("instance_or_genre"):
        target_clauses = [
            _class_path(entity_id, target) for target in rule["instance_or_genre"]
        ] + [
            _genre_path(entity_id, target) for target in rule["instance_or_genre"]
        ]
        conditions.append("{ " + _or(target_clauses) + " }")

    if rule.get("occupation"):
        conditions.append("{ " + _or([
            f"wd:{entity_id} wdt:P106/wdt:P279* wd:{target}"
            for target in rule["occupation"]
        ]) + " }")

    if rule.get("instance_or_occupation"):
        spec = rule["instance_or_occupation"]
        clauses = [
            _class_path(entity_id, target)
            for target in spec.get("instance_of", [])
        ] + [
            f"wd:{entity_id} wdt:P106/wdt:P279* wd:{target}"
            for target in spec.get("occupation", [])
        ]
        conditions.append("{ " + _or(clauses) + " }")

    if rule.get("publisher"):
        conditions.append("{ " + _or([
            f"wd:{entity_id} wdt:P123/wdt:P279* wd:{target}"
            for target in rule["publisher"]
        ]) + " }")

    if rule.get("narrative_universe"):
        conditions.append("{ " + _or([
            f"wd:{entity_id} wdt:P1080/wdt:P279* wd:{target}"
            for target in rule["narrative_universe"]
        ]) + " }")

    if rule.get("capital_of"):
        conditions.append(f"{{ wd:{entity_id} wdt:P1376 ?capitalOf }}")

    if rule.get("capital_city"):
        conditions.append("{ " + _or([
            _class_path(entity_id, Q_CAPITAL_CITY),
            f"wd:{entity_id} wdt:P1376 ?capitalOf",
        ]) + " }")

    if rule.get("country"):
        conditions.append(f"{{ wd:{entity_id} wdt:P131*/wdt:P17 wd:{rule['country']} }}")

    if rule.get("published_before"):
        conditions.append(
            f"{{ wd:{entity_id} wdt:P577 ?published . "
            f"FILTER(YEAR(?published) < {int(rule['published_before'])}) }}"
        )

    return conditions


def _rule_to_sparql(entity_id: str, rule: dict) -> str | None:
    conditions = _rule_conditions(entity_id, rule)
    if not conditions:
        return None
    return " . ".join(conditions)


def matches_rule(entity_id: str, rule: dict) -> bool:
    """Return True if the entity satisfies all constraints in ``rule``."""
    if not entity_id.startswith("Q"):
        return False

    cache_key = (entity_id, json.dumps(rule, sort_keys=True))
    with _ask_lock:
        cached = _ask_cache.get(cache_key)
    if cached is not None:
        return cached

    body = _rule_to_sparql(entity_id, rule)
    if not body:
        print(f"[obscure] Prompt has no validation rule for {entity_id}; rejecting")
        return False

    query = f"ASK {{ {body} }}"
    result = False
    try:
        response = requests.get(
            SPARQL_URL,
            params={"query": query, "format": "json"},
            headers=SPARQL_HEADERS,
            timeout=30,
        )
        response.raise_for_status()
        result = bool(response.json().get("boolean"))
    except Exception as e:
        print(f"[obscure] Validation query failed for {entity_id}: {e}")

    with _ask_lock:
        if len(_ask_cache) > 10000:
            _ask_cache.clear()
        _ask_cache[cache_key] = result
    return result


def validate_entity(entity_id: str, rule: dict) -> bool:
    return matches_rule(entity_id, rule)


# Popularity

_views_cache: dict[tuple[str, str], int] = {}
_views_lock = threading.Lock()


def _last_months_range(months: int = 12) -> tuple[str, str]:
    today = date.today().replace(day=1)
    end = today - timedelta(days=1)  # last day of previous month
    end_first = end.replace(day=1)

    year, month = end_first.year, end_first.month
    month -= months - 1
    while month <= 0:
        month += 12
        year -= 1
    start = date(year, month, 1)

    return start.strftime("%Y%m%d"), end.strftime("%Y%m%d")


def get_page_views(site: str | None, title: str | None) -> int:
    """Total page views over the last 12 full months (0 if unavailable)."""
    if not site or not title or not site.endswith("wiki"):
        return 0

    cache_key = (site, title)
    with _views_lock:
        cached = _views_cache.get(cache_key)
    if cached is not None:
        return cached

    lang = site[:-4]
    if not lang:
        return 0

    start, end = _last_months_range(12)
    url = (
        "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/"
        f"{lang}.wikipedia/all-access/user/{quote(title.replace(' ', '_'), safe='')}"
        f"/monthly/{start}/{end}"
    )

    views = 0
    try:
        response = requests.get(
            url, headers={"User-Agent": USER_AGENT}, timeout=15
        )
        if response.status_code == 200:
            items = response.json().get("items", [])
            views = sum(int(item.get("views", 0)) for item in items)
    except Exception as e:
        print(f"[obscure] Page view fetch failed for {site}:{title}: {e}")

    with _views_lock:
        if len(_views_cache) > 10000:
            _views_cache.clear()
        _views_cache[cache_key] = views
    return views


def calculate_popularity(
    sitelinks: int,
    page_views: int,
    sitelink_weight: float,
    pageview_weight: float,
) -> float:
    return (
        sitelink_weight * sitelinks
        + pageview_weight * math.log(page_views + 1)
    )


def get_page_views_many(articles: list[tuple[str | None, str | None]]) -> list[int]:
    """Fetch several articles' page views concurrently."""
    if not articles:
        return []
    unique = list(dict.fromkeys(articles))
    with ThreadPoolExecutor(max_workers=min(8, len(unique))) as executor:
        results = list(executor.map(lambda a: get_page_views(*a), unique))
    by_article = dict(zip(unique, results))
    return [by_article[a] for a in articles]
