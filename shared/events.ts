import { Stages, Player, Question } from './types';

interface EventResponses {
    join: {
        playerID: number;
        host: boolean;
        existingPlayers: Player[];
        questionBody: string;
        questionValue: number;
        questionOptions: string[];
        questionAnswer: string;
        stage: Stages;
    };
    otherJoin: {
        playerName: string;
        playerID: number;
    };
    quit: {
        playerID: number;
    };
    updateScores: {
        newScores: Array<{playerID: number; newScore: number}>;
    };
    updateStage: {
        newStage: Stages;
    };
    // restart: {
    //     easy: boolean;
    //     medium: boolean;
    //     hard: boolean;
    // };
    updateQuestion: {
        body: string;
        value: number;
        options: string[];
        answer: string;
    };
    correctAnswer: {
        playerID: number;
        value: number;
    };
};

export interface EventDependencies {
    setPlayerID: (id: number) => void;
    setHost: (host: boolean) => void;
    setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
    setStage: (stage: Stages) => void;
    setQuestion: (newQuestion: Question) => void;
    name: string;
    players: Player[];
    playerID: number;
    question: Question | null;
};

export enum Events {
    Join = "join",
    OtherJoin = "otherJoin",
    Quit = "quit",
    UpdateQuestion = "updateQuestion",
    UpdateScores = "updateScores",
    UpdateStage = "updateStage",
    UpdateDifficulties = "updateDifficulties",
    Restart = "restart",
    CorrectAnswer = "correctAnswer"
};

export const createEventHandlers = (deps: EventDependencies) => ({
    handleJoin: (eventData: EventResponses[Events.Join]) => {
        deps.setPlayerID(eventData.playerID);
        deps.setHost(eventData.host);
        const myPlayer: Player = {
            playerID: eventData.playerID,
            playerName: deps.name,
            score: 0,
            guessedCorrectly: false
        };
        deps.setPlayers([myPlayer, ...eventData.existingPlayers]);
        deps.setQuestion({
            body: eventData.questionBody, 
            value: eventData.questionValue, 
            options: eventData.questionOptions, 
            answer: eventData.questionAnswer});
        deps.setStage(eventData.stage);
    },

    handleOtherJoin: (eventData: EventResponses[Events.OtherJoin]) => {
        const newPlayer: Player = {
            playerID: eventData.playerID,
            playerName: eventData.playerName,
            score: 0,
            guessedCorrectly: false
        };
        deps.setPlayers(prev => [...prev, newPlayer]);
    },

    handleQuit: (eventData: EventResponses[Events.Quit]) => {
        deps.setPlayers(prev => prev.filter(player => player.playerID !== eventData.playerID));
    },

    handleUpdateQuestion: (eventData: EventResponses[Events.UpdateQuestion]) => {
        deps.setQuestion({
            body: eventData.body,
            value: eventData.value,
            options: eventData.options,
            answer: eventData.answer
        });
        console.log(eventData.answer);
    },

    handleUpdateScores: (eventData: EventResponses[Events.UpdateScores]) => {
        deps.setPlayers(prev => {
            const updatedPlayers = [...prev];
            eventData.newScores.forEach(scorePair => {
                const playerIndex = updatedPlayers.findIndex(
                    player => player.playerID === scorePair.playerID
                );
                if (playerIndex !== -1) {
                    updatedPlayers[playerIndex] = {
                        ...updatedPlayers[playerIndex],
                        score: scorePair.newScore
                    };
                }
            });
            return updatedPlayers;
        });
    },

    handleUpdateStage: (eventData: EventResponses[Events.UpdateStage]) => {
        deps.setStage(eventData.newStage);
        
        // reset the correctlyGuessed states for new question
        if (eventData.newStage === Stages.QuestionDisplay) {
            deps.setPlayers(prev => prev.map(p => ({...p, guessedCorrectly: false})));
        }
    },

    handleRestart: () => {
        deps.setPlayers(prev => prev.map(p => ({ ...p, score: 0 })));
        deps.setStage(Stages.Lobby);
    },

    handleCorrectAnswer: (eventData: EventResponses[Events.CorrectAnswer]) => {        
        deps.setPlayers(prev => {
            return prev.map(player => {
                if (player.playerID === eventData.playerID) {
                    return {
                        ...player,
                        score: player.score + eventData.value,
                        guessedCorrectly: true
                    };
                }
                return player;
            });
        });
    }
});

export const createEventEmitters = (socket: WebSocket | null, deps: EventDependencies) => ({
    submitRestart: (easy: boolean, medium: boolean, hard: boolean) => {
        if (socket) {
            socket.send(JSON.stringify({
                type: Events.Restart,
                data: { easy, medium, hard }
            }));
        }
    },

    submitUpdateStage: (newStage: Stages) => {
        if (socket) {
            socket.send(JSON.stringify({
                type: Events.UpdateStage,
                data: { newStage: newStage }
            }));
        }
    },

    submitUpdateQuestion: () => {
        if (socket) {
            socket.send(JSON.stringify({
                type: Events.UpdateQuestion
            }));
        }
    },

    submitUpdateDifficulties: (easy: boolean, medium: boolean, hard: boolean) => {
        if (socket) {
            socket.send(JSON.stringify({
                type: Events.UpdateDifficulties,
                data: {easy: easy, medium: medium, hard: hard}
            }));
        }
    },

    submitCorrectAnswer: () => {
        if (socket) {
            socket.send(JSON.stringify({
                type: Events.CorrectAnswer,
                data: {playerID: deps.playerID, value: deps.question?.value}
            }));
        }
    }
});