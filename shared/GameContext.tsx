
'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Stages, Player, Question } from './types';
import { createEventHandlers, createEventEmitters, EventDependencies, Events } from './events';

interface GameContextType {
    // State
    roomID: string;
    setRoomID: (id: string) => void;
    name: string;
    setName: (newName: string) => void;
    question: Question | null;
    setQuestion: (newQuestion: Question) => void;
    questionDuration: number;
    setQuestionDuration: (newDurection: number) => void;
    winningScore: number;
    setWinningScore: (newWinningScore: number) => void;
    host: boolean;
    setHost: (host: boolean) => void;
    stage: Stages;
    setStage: (stage: Stages) => void;
    players: Player[];
    setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
    playerID: number;
    setPlayerID: (id: number) => void;
    socket: WebSocket | null;
    setSocket: (socket: WebSocket | null) => void;
    
    // Events
    submitRestart: (easy: boolean, medium: boolean, hard: boolean) => void;
    submitUpdateStage: (newStage: Stages) => void;
    submitUpdateQuestion: () => void;
    submitUpdateDifficulties: (easy: boolean, medium: boolean, hard: boolean) => void;
    submitUpdateQuestionDuration: (duration: number) => void;
    submitCorrectAnswer: () => void;
    
    // Utility
    getPlayerData: (id: number) => Player | undefined;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGameContext = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGameContext must be used within a GameProvider');
    }
    return context;
};

interface GameProviderProps {
    children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
    const [roomID, setRoomID] = useState("");
    const [name, setName] = useState("");
    const [question, setQuestion] = useState<Question | null>(null);
    const [questionDuration, setQuestionDuration] = useState(15);
    const [winningScore, setWinningScore] = useState(100);
    const [host, setHost] = useState(false);
    const [stage, setStage] = useState<Stages>(Stages.Lobby);
    const [players, setPlayers] = useState<Player[]>([]);
    const [playerID, setPlayerID] = useState(0);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const deps: EventDependencies = {
        setPlayerID,
        setHost,
        setPlayers,
        setStage,
        setQuestion,
        setQuestionDuration,
        name,
        players,
        playerID,
        question
    };

    const emitters = createEventEmitters(socket, deps);
    const handlers = createEventHandlers(deps);

    useEffect(() => {
        const randomName = `Guest#${Math.floor(Math.random() * 5000 + 1)}`;
        setName(randomName);
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleMessage = (event: MessageEvent) => {
            const message = JSON.parse(event.data);
            
            switch (message.type) {
                case Events.Join:
                    handlers.handleJoin(message.data);
                    break;
                case Events.OtherJoin:
                    handlers.handleOtherJoin(message.data);
                    break;
                case Events.Quit:
                    handlers.handleQuit(message.data);
                    break;
                case Events.UpdateScores:
                    handlers.handleUpdateScores(message.data);
                    break;
                case Events.UpdateStage:
                    handlers.handleUpdateStage(message.data);
                    break;
                case Events.Restart:
                    handlers.handleRestart();
                    break;
                case Events.UpdateQuestion:
                    handlers.handleUpdateQuestion(message.data);
                    break;
                case Events.CorrectAnswer:
                    handlers.handleCorrectAnswer(message.data);
                    break;
                default:
                    console.warn('Unknown message type:', message.type);
            }
        };

        socket.addEventListener('message', handleMessage);
    
        return () => {
            socket.removeEventListener('message', handleMessage);
        };
    }, [socket]);

    const getPlayerData = (id: number): Player | undefined => {
        return players.find(player => player.playerID === id);
    };

    const value: GameContextType = {
        roomID,
        setRoomID,
        name,
        setName,
        question,
        setQuestion,
        questionDuration,
        setQuestionDuration,
        winningScore,
        setWinningScore,
        host,
        setHost,
        stage,
        setStage,
        players,
        setPlayers,
        playerID,
        setPlayerID,
        socket,
        setSocket,
        submitRestart: emitters.submitRestart,
        submitUpdateStage: emitters.submitUpdateStage,
        submitUpdateQuestion: emitters.submitUpdateQuestion,
        submitCorrectAnswer: emitters.submitCorrectAnswer,
        submitUpdateDifficulties: emitters.submitUpdateDifficulties,
        submitUpdateQuestionDuration: emitters.submitUpdateQuestionDuration,
        getPlayerData
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
};