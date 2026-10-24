import { Player, ObscureStages, ObscureSettings, RoomState } from "@/shared/types";
import { playSound, showToast } from "../utils";

export enum ObscureEvents {
    UpdateStage = "updateStage_obscure",
    UpdateSettings = "updateSettings_obscure",
    SubmitEntity = "submitEntity_obscure",
    Submission = "submission_obscure",
    InvalidAnswer = "invalidAnswer_obscure",
    Reveal = "reveal_obscure",
    Restart = "restart_obscure",
}

export interface ObscureEventDeps {
    setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
    setRoomState: (state: RoomState) => void;
    roomState: RoomState | null;
    playerID: number;
}

const syncPlayers = (
    state: RoomState,
    setPlayers: React.Dispatch<React.SetStateAction<Player[]>>
) => {
    if (!state.players) return;

    setPlayers(prev => prev.map(player => {
        const serverPlayer = state.players.find(sp => sp.playerID === player.playerID);
        return serverPlayer ? { ...player, ...serverPlayer } : player;
    }));
};

export const createObscureEventHandlers = (deps: ObscureEventDeps) => ({
    handleStateUpdate: (state: RoomState) => {
        deps.setRoomState(state);
        syncPlayers(state, deps.setPlayers);

        if (state.obscureState?.currentStage === ObscureStages.PromptDisplay) {
            deps.setPlayers(prev => prev.map(p => ({ ...p, guess: "" })));
        }
    },

    handleSubmission: (data: { playerID: number }, state: RoomState) => {
        deps.setRoomState(state);
        syncPlayers(state, deps.setPlayers);

        if (data.playerID === deps.playerID) {
            playSound("pop.wav");
        }
    },

    handleInvalidAnswer: (data: { playerID: number; reason: string; incorrectGuess?: string }) => {
        // Like PeopleGuesser, the rejected guess is shown on every player's
        // list (muted) instead of interrupting with a toast.
        if (data.reason === "doesNotMatch") {
            deps.setPlayers(prev => prev.map(player => (
                player.playerID === data.playerID
                    ? { ...player, guess: data.incorrectGuess ?? "" }
                    : player
            )));
        }

        if (data.playerID !== deps.playerID) return;

        switch (data.reason) {
            case "alreadySubmitted":
                showToast("You already submitted an answer this round", { type: 'info' });
                break;
            case "alreadyUsed":
                showToast("That answer was already used in a previous round", { type: 'error' });
                break;
            case "notEntity":
                showToast("That isn't a valid Wikidata item", { type: 'error' });
                break;
            case "doesNotMatch":
                // Displayed on the player list; no toast.
                break;
            default:
                showToast("That answer can't be used", { type: 'error' });
        }
    },

    handleReveal: (state: RoomState) => {
        deps.setRoomState(state);
        syncPlayers(state, deps.setPlayers);

        const myResult = state.obscureState?.roundResults.find(
            result => result.playerId === deps.playerID
        );

        if (myResult?.points) {
            playSound("correct2.wav");
            showToast(`Least popular! +${myResult.points}`, { type: 'success' });
        } else if (myResult) {
            playSound("wrong.wav");
        }
    },

    handleRestart: (state: RoomState) => {
        deps.setRoomState(state);
        deps.setPlayers(prev => prev.map(p => ({
            ...p,
            score: 0,
            guess: "",
            correctGuesses: [],
            guessedCorrectly: false,
        })));
    },
});

export interface ObscureEmitterDeps {
    playerID: number;
    roomState: RoomState | null;
}

export const createObscureEventEmitters = (socket: WebSocket | null, deps: ObscureEmitterDeps) => ({
    submitEntity: (entityId: string) => {
        if (socket) {
            socket.send(JSON.stringify({
                type: ObscureEvents.SubmitEntity,
                data: { entityId, playerID: deps.playerID },
            }));
        }
    },

    submitReveal: () => {
        if (socket) {
            socket.send(JSON.stringify({
                type: ObscureEvents.Reveal,
            }));
        }
    },

    submitUpdateStage: (newStage: ObscureStages) => {
        if (socket) {
            socket.send(JSON.stringify({
                type: ObscureEvents.UpdateStage,
                data: { newStage },
            }));
        }
    },

    submitUpdateSettings: (settings: ObscureSettings) => {
        if (socket) {
            socket.send(JSON.stringify({
                type: ObscureEvents.UpdateSettings,
                data: settings,
            }));
        }
    },

    submitRestart: () => {
        if (socket) {
            socket.send(JSON.stringify({
                type: ObscureEvents.Restart,
            }));
        }
    },
});
