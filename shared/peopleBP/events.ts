import { Player, PeopleBPStages, PeopleBPSettings, RoomState } from "@/shared/types";
import { playSound, showToast } from "../utils";

export enum PeopleBPEvents {
    UpdateStage = "updateStage_peopleBP",
    UpdateProperties = "updateProperties_peopleBP",
    UpdateSettings = "updateSettings_peopleBP",
    HandleGuess = "handleGuess_peopleBP",
    CorrectAnswer = "correctAnswer_peopleBP",
    IncorrectAnswer = "incorrectAnswer_peopleBP",
    Timeout = "timeout_peopleBP",
    Restart = "restart_peopleBP",
}

export interface PeopleBPEventDeps {
    setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
    setRoomState: (state: RoomState) => void;
    roomState: RoomState | null;
    playerID: number;
}

export const createPeopleBPEventHandlers = (deps: PeopleBPEventDeps) => ({
    handleStateUpdate: (state: RoomState) => {
        deps.setRoomState(state);
        
        // Sync players from state
        if (state.players) {
            deps.setPlayers(prev => {
                return prev.map(p => {
                    const serverPlayer = state.players.find(sp => sp.playerID === p.playerID);
                    if (serverPlayer) {
                        return { 
                            ...p, 
                            score: serverPlayer.score, 
                            guess: serverPlayer.guess, 
                            lives: serverPlayer.lives,
                            correctGuesses: serverPlayer.correctGuesses 
                        };
                    }
                    return p;
                });
            });
        }
        
        if (state.peopleBPState?.currentStage === PeopleBPStages.Results) {
            deps.setPlayers(prev => prev.map(p => ({ ...p, guess: "", guessedCorrectly: false })));
        }
    },

    handleCorrectAnswer: (data: { playerID: number; correctGuess: string }, state: RoomState) => {
        if (deps.playerID === data.playerID)
            showToast(`Correct! ${data.correctGuess}`, { type: 'success' });
        playSound("correct2.wav");

        deps.setRoomState(state);
        
        deps.setPlayers(prev => prev.map(player => {
            if (player.playerID === data.playerID) {
                return {
                    ...player,
                    guess: data.correctGuess,
                    correctGuesses: [...(player.correctGuesses || []), data.correctGuess],
                };
            }
            return player;
        }));
    },

    handleIncorrectAnswer: (data: { playerID: number; incorrectGuess: string; reason?: string }) => {
        if (deps.playerID === data.playerID) {
            if (data.reason === "alreadyGuessed") {
                showToast("This person has already been guessed", { type: 'error' });
            } else if (data.reason === "notEntity") {
                showToast("Not a valid person", { type: 'error' });
            } else {
                playSound("wrong.wav");
                showToast(`${data.incorrectGuess} doesn't match!`, { type: 'error' });
            }
        }
        
        deps.setPlayers(prev => prev.map(player => {
            if (player.playerID === data.playerID && !data.reason) {
                return {
                    ...player,
                    guess: data.incorrectGuess,
                };
            }
            return player;
        }));
    },
    
    handleTimeout: (state: RoomState) => {
        deps.setRoomState(state);        
        playSound("explosion.wav");
        
        // Update player lives
        deps.setPlayers(prev => prev.map(player => {
            const serverPlayer = state.players.find(sp => sp.playerID === player.playerID);
            if (serverPlayer) {
                return {
                    ...player,
                    lives: serverPlayer.lives,
                };
            }
            return player;
        }));
    },

    handleRestart: (state: RoomState) => {
        deps.setRoomState(state);
        deps.setPlayers(prev => prev.map(p => {
            const serverPlayer = state.players.find(sp => sp.playerID === p.playerID);
            return { 
                ...p, 
                score: 0, 
                lives: serverPlayer?.lives ?? 3,
                guessedCorrectly: false, 
                correctGuesses: [],
                guess: ""
            };
        }));
    },
});

export interface PeopleBPEmitterDeps {
    playerID: number;
    roomState: RoomState | null;
}

export const createPeopleBPEventEmitters = (socket: WebSocket | null, deps: PeopleBPEmitterDeps) => ({
    submitGuess: (guessID: string) => {
        if (socket) {
            socket.send(JSON.stringify({
                type: PeopleBPEvents.HandleGuess,
                data: { guess: guessID, playerID: deps.playerID },
            }));
        }
    },

    submitTimeout: () => {
        if (socket) {
            socket.send(JSON.stringify({
                type: PeopleBPEvents.Timeout,
                data: { playerID: deps.playerID },
            }));
        }
    },

    submitUpdateStage: (newStage: PeopleBPStages) => {
        if (socket) {
            socket.send(JSON.stringify({
                type: PeopleBPEvents.UpdateStage,
                data: { newStage },
            }));
        }
    },

    submitUpdateProperties: () => {
        if (socket) {
            socket.send(JSON.stringify({
                type: PeopleBPEvents.UpdateProperties,
            }));
        }
    },

    submitUpdateSettings: (settings: PeopleBPSettings) => {
        if (socket) {
            socket.send(JSON.stringify({
                type: PeopleBPEvents.UpdateSettings,
                data: settings,
            }));
        }
    },

    submitRestart: () => {
        if (socket) {
            socket.send(JSON.stringify({
                type: PeopleBPEvents.Restart,
            }));
        }
    },
});