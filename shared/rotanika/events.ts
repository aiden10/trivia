import { Player, RotanikaStages, RotanikaSettings, RoomState } from "@/shared/types";
import { playSound } from "../utils";

export enum RotanikaEvents {
    UpdateStage = "updateStage_rotanika",
    SetSecret = "setSecret_rotanika",
    AskQuestion = "askQuestion_rotanika",
    AnswerQuestion = "answerQuestion_rotanika",
    UpdateSettings = "updateSettings_rotanika",
    MakeDecidingGuess = "makeDecidingGuess_rotanika",
    GuessResult = "guessResult_rotanika",
    Restart = "restart_rotanika",
}

export interface RotanikaEventDeps {
    setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
    setRoomState: (state: RoomState) => void;
    roomState: RoomState | null;
    playerID: number;
}

export const createRotanikaEventHandlers = (deps: RotanikaEventDeps) => ({
    handleStateUpdate: (state: RoomState) => {
        deps.setRoomState(state);
        
        if (state.players) {
            deps.setPlayers(prev => {
                return prev.map(p => {
                    const serverPlayer = state.players.find(sp => sp.playerID === p.playerID);
                    if (serverPlayer) {
                        return { ...p, score: serverPlayer.score, guess: serverPlayer.guess };
                    }
                    return p;
                });
            });
        }
    },

    handleGuessResult: (data: { 
        correct: boolean; 
        guesserID: number; 
        secret: string;
        winReason: 'guessed' | 'maxReached' | 'minNotReached' | null;
    }) => {
        if (data.correct && deps.playerID === data.guesserID) {
            playSound("correct.wav");
        }
        
        if (deps.roomState) {
            deps.setRoomState({
                ...deps.roomState,
                rotanikaState: deps.roomState.rotanikaState ? {
                    ...deps.roomState.rotanikaState,
                    secretThing: data.secret
                } : null
            });
            console.log(`set secretThing to: ${data.secret}`);
        }
    },

    handleRestart: (state: RoomState) => {
        deps.setRoomState(state);
        deps.setPlayers(prev => prev.map(p => ({ ...p, score: 0 })));
    },
});

export interface RotanikaEmitterDeps {
    playerID: number;
    roomState: RoomState | null;
}

export const createRotanikaEventEmitters = (socket: WebSocket | null, deps: RotanikaEmitterDeps) => ({
    submitSetSecret: (secret: string) => {
        if (socket) {
            socket.send(JSON.stringify({
                type: RotanikaEvents.SetSecret,
                data: { secret, playerID: deps.playerID },
            }));
        }
    },

    submitAskQuestion: (question: string, isDeciding: boolean) => {
        if (socket) {
            socket.send(JSON.stringify({
                type: RotanikaEvents.AskQuestion,
                data: { question, isDeciding, playerID: deps.playerID },
            }));
        }
    },

    submitAnswerQuestion: (answer: 'yes' | 'no' | 'unsure') => {
        if (socket) {
            socket.send(JSON.stringify({
                type: RotanikaEvents.AnswerQuestion,
                data: { answer, playerID: deps.playerID },
            }));
        }
    },

    submitUpdateStage: (newStage: RotanikaStages) => {
        if (socket) {
            socket.send(JSON.stringify({
                type: RotanikaEvents.UpdateStage,
                data: { newStage },
            }));
        }
    },

    submitUpdateSettings: (settings: RotanikaSettings) => {
        if (socket) {
            socket.send(JSON.stringify({
                type: RotanikaEvents.UpdateSettings,
                data: settings,
            }));
        }
    },

    submitRestart: () => {
        if (socket) {
            socket.send(JSON.stringify({
                type: RotanikaEvents.Restart,
            }));
        }
    },
});