import asyncio

from server.utils import broadcast, send_state, restart_base
from server.models import (
    ObscureEvents,
    ObscureStages,
    ObscureState,
    ObscurePrompt,
    ObscureSubmission,
    ObscureGuess,
    Room,
)
from server.obscure_prompts import (
    calculate_popularity,
    fetch_entity,
    generate_prompt,
    get_page_views_many,
    leaf,
    validate_entity,
)

ROUND_POINTS = 10


# Helpers

def _prompt_rule(state: ObscureState) -> dict:
    """The validation rule for the round's current prompt."""
    if not state.current_prompt:
        return {}
    prompt_leaf = leaf(state.current_prompt.id)
    if not prompt_leaf:
        return {}
    rule = dict(prompt_leaf["rule"])
    if prompt_leaf.get("dynamic_country"):
        rule["country"] = state.current_prompt.country_id
    return rule


def _start_round(room: Room, state: ObscureState):
    prompt = generate_prompt(state.prompts)
    state.current_prompt = ObscurePrompt(
        id=prompt["id"],
        general=prompt["general"],
        specifier=prompt["specifier"],
        text=prompt["text"],
        country_id=prompt["country_id"],
        country_name=prompt["country_name"],
    )
    state.submissions = []
    state.round_results = []
    state.round_number += 1
    state.current_stage = ObscureStages.PromptDisplay.value
    for player in room.players.values():
        player.guess = ""


def _invalid(player_id: int, reason: str, incorrect_guess: str = "") -> dict:
    data = {"playerID": player_id, "reason": reason}
    if incorrect_guess:
        data["incorrectGuess"] = incorrect_guess
    return {
        "type": ObscureEvents.InvalidAnswer.value,
        "data": data,
    }


async def _reveal(room: Room):
    state = room.obscure_state
    if not state or state.current_stage != ObscureStages.Submitting.value:
        return

    # Flip the stage before the (slow) page-view requests so late submissions
    # can't slip into this round while scores are being computed.
    state.current_stage = ObscureStages.Reveal.value

    submissions = state.submissions
    views = await asyncio.to_thread(get_page_views_many, [
        (submission.views_site, submission.views_title)
        for submission in submissions
    ])

    for submission, page_views in zip(submissions, views):
        submission.page_views = page_views
        submission.popularity = calculate_popularity(
            submission.sitelinks,
            page_views,
            state.sitelink_weight,
            state.pageview_weight,
        )

    ranked = sorted(submissions, key=lambda s: s.popularity)

    if ranked:
        lowest_popularity = ranked[0].popularity
        for submission in ranked:
            # Everyone who picked the least popular answer scores.  Identical
            # answers (or genuinely tied popularity) share the points.
            if abs(submission.popularity - lowest_popularity) < 1e-9:
                submission.points = ROUND_POINTS
                player = room.players.get(submission.player_id)
                if player:
                    player.score += ROUND_POINTS

    for submission in ranked:
        player = room.players.get(submission.player_id)
        if player:
            player.guess = submission.entity_name
        if submission.entity_id not in state.used_entities:
            state.used_entities.append(submission.entity_id)
        state.guess_history.append(ObscureGuess(
            player_id=submission.player_id,
            player_name=(
                submission.player_name
                or (player.name if player else f"Player {submission.player_id}")
            ),
            entity_id=submission.entity_id,
            entity_name=submission.entity_name,
            popularity=submission.popularity,
            points=submission.points,
            round_number=state.round_number,
        ))

    state.round_results = ranked

    await send_state(room, ObscureEvents.Reveal.value)

# Incoming events

async def handle_submit(message: dict, room: Room):
    data = message.get("data", {})
    player_id = data.get("playerID")
    entity_id = str(data.get("entityId") or data.get("guess") or "").strip()

    state = room.obscure_state
    if not state or state.current_stage != ObscureStages.Submitting.value:
        return
    if player_id not in room.players:
        return

    round_number = state.round_number
    prompt_id = state.current_prompt.id if state.current_prompt else None

    def still_valid() -> bool:
        return (
            room.obscure_state is state
            and state.current_stage == ObscureStages.Submitting.value
            and state.round_number == round_number
            and (state.current_prompt.id if state.current_prompt else None) == prompt_id
            and player_id in room.players
        )

    if any(submission.player_id == player_id for submission in state.submissions):
        await broadcast(_invalid(player_id, "alreadySubmitted"), room)
        return

    if not entity_id.startswith("Q"):
        await broadcast(_invalid(player_id, "notEntity"), room)
        return

    if entity_id in state.used_entities:
        await broadcast(_invalid(player_id, "alreadyUsed"), room)
        return

    entity = await asyncio.to_thread(fetch_entity, entity_id)
    if not still_valid():
        return
    if not entity:
        await broadcast(_invalid(player_id, "notEntity"), room)
        return

    is_valid = await asyncio.to_thread(validate_entity, entity_id, _prompt_rule(state))
    if not still_valid():
        return
    if not is_valid:
        # Show the rejected attempt on the player list (muted) instead of
        # interrupting with a toast, matching PeopleGuesser.
        room.players[player_id].guess = entity["label"]
        await broadcast(_invalid(player_id, "doesNotMatch", entity["label"]), room)
        return

    # The player could have submitted another answer while the Wikidata
    # request was in flight.
    if any(submission.player_id == player_id for submission in state.submissions):
        await broadcast(_invalid(player_id, "alreadySubmitted"), room)
        return

    state.submissions.append(ObscureSubmission(
        player_id=player_id,
        player_name=room.players[player_id].name,
        entity_id=entity_id,
        entity_name=entity["label"],
        sitelinks=entity["sitelinks"],
        views_site=entity["views_site"],
        views_title=entity["views_title"],
    ))
    # Clear any previously rejected guess now that a valid answer is in.
    room.players[player_id].guess = ""

    await broadcast({
        "type": ObscureEvents.Submission.value,
        "data": {"playerID": player_id},
        "state": room.to_dict(),
    }, room)

    if len(state.submissions) >= len(room.players):
        await _reveal(room)


async def handle_reveal(message: dict, room: Room):
    """Host timer expired - score the round and show the results."""
    await _reveal(room)


async def handle_update_stage(message: dict, room: Room):
    data = message.get("data", {})
    new_stage = int(data.get("newStage", 0))

    state = room.obscure_state
    if not state:
        return

    # Ignore duplicate stage events (e.g. a double-clicked start button).
    if new_stage == state.current_stage:
        return

    if new_stage == ObscureStages.PromptDisplay.value:
        # Obscure needs at least two players.
        if state.current_stage == ObscureStages.Lobby.value and len(room.players) < 2:
            return

        # Advance from the reveal to the next round, or finish the game if a
        # player has reached the winning score.
        if state.current_stage == ObscureStages.Reveal.value:
            winner = any(
                player.score >= state.winning_score
                for player in room.players.values()
            )
            if winner:
                state.current_stage = ObscureStages.Results.value
            else:
                _start_round(room, state)
        else:
            _start_round(room, state)
    elif new_stage == ObscureStages.Submitting.value:
        state.current_stage = ObscureStages.Submitting.value
    elif new_stage == ObscureStages.Results.value:
        state.current_stage = ObscureStages.Results.value
    elif new_stage == ObscureStages.Lobby.value:
        state.current_stage = ObscureStages.Lobby.value

    await send_state(room, ObscureEvents.UpdateStage.value)


async def handle_update_settings(message: dict, room: Room):
    data = message.get("data", {})

    state = room.obscure_state
    if not state:
        return

    if "duration" in data:
        state.duration = max(5, min(300, int(data["duration"])))

    if "winningScore" in data:
        state.winning_score = max(10, min(1000, int(data["winningScore"])))

    if "sitelinkWeight" in data:
        state.sitelink_weight = max(0.0, min(1.0, float(data["sitelinkWeight"])))

    if "pageviewWeight" in data:
        state.pageview_weight = max(0.0, min(1.0, float(data["pageviewWeight"])))

    if "prompts" in data:
        requested = data.get("prompts") or []
        valid = [prompt_id for prompt_id in requested if leaf(prompt_id)]
        # Never let the host disable every prompt.
        if valid:
            state.prompts = valid

    await send_state(room, ObscureEvents.UpdateSettings.value)


async def handle_restart(message: dict, room: Room):
    state = room.obscure_state
    if not state or len(room.players) < 2:
        return

    # Restart is only meaningful from the final results screen; this also
    # makes a double-clicked "Play Again" button harmless.
    if state.current_stage != ObscureStages.Results.value:
        return

    restart_base(room)
    state.used_entities = []
    state.submissions = []
    state.round_results = []
    state.guess_history = []
    state.round_number = 0
    state.current_prompt = None
    _start_round(room, state)

    await send_state(room, ObscureEvents.Restart.value)


async def handle_player_disconnect(room: Room, player_id: int):
    state = room.obscure_state
    if not state:
        return

    # A player has already been removed from room.players by the caller.  If
    # that leaves only one player the game can't continue, so end it and send
    # everyone back to the lobby (same behaviour as 20Q).
    if len(room.players) <= 1:
        restart_base(room)
        state.current_stage = ObscureStages.Lobby.value
        state.current_prompt = None
        state.submissions = []
        state.round_results = []
        state.guess_history = []
        state.round_number = 0
        state.used_entities = []
        await send_state(room, ObscureEvents.UpdateStage.value)
        return

    # Only adjust the current round while players can still submit.  Once the
    # reveal has started the results are already being computed.
    if state.current_stage != ObscureStages.Submitting.value:
        return

    # Drop the disconnected player's submission for the current round.
    state.submissions = [
        submission for submission in state.submissions
        if submission.player_id != player_id
    ]

    if room.players and len(state.submissions) >= len(room.players):
        await _reveal(room)
