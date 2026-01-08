import { Player, TriviaStages, TriviaSettings, RoomState } from "@/shared/types";
import { playSound } from "../utils";

// === Trivia-specific Events ===
export enum TriviaEvents {
    UpdateStage = "updateStage_trivia",
    UpdateQuestion = "updateQuestion_trivia",
    UpdateSettings = "updateSettings_trivia",
    HandleGuess = "handleGuess_trivia",
    CorrectAnswer = "correctAnswer_trivia",
    IncorrectAnswer = "incorrectAnswer_trivia",
    Restart = "restart_trivia",
}

export interface TriviaEventDeps {
    setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
    setRoomState: (state: RoomState) => void;
    roomState: RoomState | null;
    playerID: number;
}

export const createTriviaEventHandlers = (deps: TriviaEventDeps) => ({
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
                            correctGuesses: serverPlayer.correctGuesses,
                            guessedArtist: serverPlayer.guessedArtist,
                            guessedSong: serverPlayer.guessedSong
                        };
                    }
                    return p;
                });
            });
        }
        
        if (state.triviaState?.currentStage === TriviaStages.QuestionDisplay || state.triviaState?.currentStage === TriviaStages.Reveal) {
            deps.setPlayers(prev => prev.map(p => ({ ...p, guess: "", guessedCorrectly: false, guessedArtist: false, guessedSong: false})));
        }
    },

    handleCorrectAnswer: (data: {
        playerID: number;
        value: number;
        guessType?: string;
        guessedSong?: boolean;
        guessedArtist?: boolean;
    }) => {
        playSound("pop.wav");

        deps.setPlayers(prev => prev.map(player => {
            if (player.playerID === data.playerID) {
                const isSongQuestion = data.guessType !== undefined;
                return {
                    ...player,
                    score: player.score + data.value,
                    guess: "",
                    guessedCorrectly: isSongQuestion? (
                        (data.guessedArtist ?? player.guessedArtist) 
                        && (data.guessedSong ?? player.guessedSong)
                    ) : true,
                    guessedArtist: data.guessedArtist ?? player.guessedArtist, 
                    guessedSong: data.guessedSong ?? player.guessedSong
                };
            }
            return player;
        }));
    },

    handleIncorrectAnswer: (data: { playerID: number; guess: string }) => {
        deps.setPlayers(prev => prev.map(player => {
            if (player.playerID === data.playerID) {
                return {
                    ...player,
                    guess: data.guess,
                };
            }
            return player;
        }));
    },

    handleRestart: (state: RoomState) => {
        deps.setRoomState(state);
        deps.setPlayers(prev => prev.map(p => ({ ...p, score: 0, guessedCorrectly: false })));
    },
});

export interface TriviaEmitterDeps {
    playerID: number;
    roomState: RoomState | null;
}

export const createTriviaEventEmitters = (socket: WebSocket | null, deps: TriviaEmitterDeps) => ({
    submitGuess: (guess: string) => {
        if (socket) {
            socket.send(JSON.stringify({
                type: TriviaEvents.HandleGuess,
                data: { guess, playerID: deps.playerID },
            }));
        }
    },

    submitUpdateStage: (newStage: TriviaStages) => {
        if (socket) {
            socket.send(JSON.stringify({
                type: TriviaEvents.UpdateStage,
                data: { newStage },
            }));
        }
    },

    submitUpdateQuestion: () => {
        if (socket) {
            socket.send(JSON.stringify({
                type: TriviaEvents.UpdateQuestion,
            }));
        }
    },

    submitUpdateSettings: (settings: TriviaSettings) => {
        if (socket) {
            socket.send(JSON.stringify({
                type: TriviaEvents.UpdateSettings,
                data: settings,
            }));
        }
    },

    submitRestart: () => {
        if (socket) {
            socket.send(JSON.stringify({
                type: TriviaEvents.Restart,
            }));
        }
    },
});