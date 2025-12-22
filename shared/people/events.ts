import { Player, PeopleStages, PeopleSettings, RoomState } from "@/shared/types";
import { playSound, showToast } from "../utils";

export enum PeopleEvents {
    UpdateStage = "updateStage_people",
    UpdateProperties = "updateProperties_people",
    UpdateSettings = "updateSettings_people",
    HandleGuess = "handleGuess_people",
    CorrectAnswer = "correctAnswer_people",
    IncorrectAnswer = "incorrectAnswer_people",
    Restart = "restart_people",
}

export interface PeopleEventDeps {
    setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
    setRoomState: (state: RoomState) => void;
    roomState: RoomState | null;
    playerID: number;
}

export const createPeopleEventHandlers = (deps: PeopleEventDeps) => ({
    handleStateUpdate: (state: RoomState) => {
        deps.setRoomState(state);
        
        // Sync players from state
        if (state.players) {
            deps.setPlayers(prev => {
                return prev.map(p => {
                    const serverPlayer = state.players.find(sp => sp.playerID === p.playerID);
                    if (serverPlayer) {
                        return { ...p, score: serverPlayer.score, guess: serverPlayer.guess, correctGuesses: serverPlayer.correctGuesses };
                    }
                    return p;
                });
            });
        }
        
        if (state.peopleState?.currentStage === PeopleStages.PropertiesDisplay) {
            deps.setPlayers(prev => prev.map(p => ({ ...p, guess: "", guessedCorrectly: false })));
        }
    },

    handleCorrectAnswer: (data: {playerID: number; value: number, correctGuess: string}) => {
        if (deps.playerID === data.playerID) {
            playSound("correct.wav");
            showToast(`Correct! +${data.value}`, { type: 'success' });
        }

        deps.setPlayers(prev => prev.map(player => {
            if (player.playerID === data.playerID) {
                return {
                    ...player,
                    score: player.score + data.value,
                    guess: "",
                    correctGuesses: [...(player.correctGuesses || []), data.correctGuess],
                    guessedCorrectly: true,
                };
            }
            return player;
        }));
    },

    handleIncorrectAnswer: (data: { playerID: number; incorrectGuess: string, reason: string }) => {
        if (deps.playerID === data.playerID) {
            if (data.reason === "alreadyGuessed") {
                showToast("This person has already been guessed", { type: 'error' });
            } else if (data.reason === "notEntity") {
                showToast("Not a person", { type: 'error' });
            }
        }
        
        deps.setPlayers(prev => prev.map(player => {
            if (player.playerID === data.playerID && data.reason === "") {
                return {
                    ...player,
                    guess: data.incorrectGuess,
                };
            }
            return player;
        }));
    },

    handleRestart: (state: RoomState) => {
        deps.setRoomState(state);
        deps.setPlayers(prev => prev.map(p => ({ ...p, score: 0, guessedCorrectly: false, correctGuesses: [] })));
    },
});

export interface PeopleEmitterDeps {
    playerID: number;
    roomState: RoomState | null;
}

export const createPeopleEventEmitters = (socket: WebSocket | null, deps: PeopleEmitterDeps) => ({
    submitGuess: (guessID: string) => {
        if (socket) {
            socket.send(JSON.stringify({
                type: PeopleEvents.HandleGuess,
                data: { guess: guessID, playerID: deps.playerID },
            }));
        }
    },

    submitUpdateStage: (newStage: PeopleStages) => {
        if (socket) {
            socket.send(JSON.stringify({
                type: PeopleEvents.UpdateStage,
                data: { newStage },
            }));
        }
    },

    submitUpdateProperties: () => {
        if (socket) {
            socket.send(JSON.stringify({
                type: PeopleEvents.UpdateProperties,
            }));
        }
    },

    submitUpdateSettings: (settings: PeopleSettings) => {
        if (socket) {
            socket.send(JSON.stringify({
                type: PeopleEvents.UpdateSettings,
                data: settings,
            }));
        }
    },

    submitRestart: () => {
        if (socket) {
            socket.send(JSON.stringify({
                type: PeopleEvents.Restart,
            }));
        }
    },
});