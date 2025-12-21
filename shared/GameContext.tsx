'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Player, GameModes, RoomState, TriviaStages, TriviaSettings } from './types';
import { Events, createGenericEventHandlers, createGenericEventEmitters } from './events';
import { TriviaEvents, createTriviaEventHandlers, createTriviaEventEmitters } from './trivia/events';

interface GameContextType {
    // Core State
    roomID: string;
    setRoomID: (id: string) => void;
    name: string;
    setName: (newName: string) => void;
    host: boolean;
    setHost: (host: boolean) => void;
    players: Player[];
    setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
    playerID: number;
    setPlayerID: (id: number) => void;
    socket: WebSocket | null;
    setSocket: (socket: WebSocket | null) => void;
    
    // Gamemode State
    gamemode: GameModes;
    setGamemode: (mode: GameModes) => void;
    roomState: RoomState | null;
    setRoomState: (state: RoomState) => void;
    
    // Generic Events
    submitUpdateGameMode: (gamemode: GameModes) => void;
    
    // Trivia Events
    submitGuess: (guess: string) => void;
    submitUpdateStage: (newStage: TriviaStages) => void;
    submitUpdateQuestion: () => void;
    submitUpdateSettings: (settings: TriviaSettings) => void;
    submitRestart: () => void;
    
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
    // Core State
    const [roomID, setRoomID] = useState("");
    const [name, setName] = useState("");
    const [host, setHost] = useState(false);
    const [players, setPlayers] = useState<Player[]>([]);
    const [playerID, setPlayerID] = useState(0);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    
    // Gamemode State
    const [gamemode, setGamemode] = useState<GameModes>(GameModes.Default);
    const [roomState, setRoomState] = useState<RoomState | null>(null);

    // Create event handlers and emitters
    const genericHandlers = createGenericEventHandlers({
        setPlayerID,
        setHost,
        setPlayers,
        setGamemode,
        setRoomState,
        name,
    });

    const genericEmitters = createGenericEventEmitters(socket);

    const triviaHandlers = createTriviaEventHandlers({
        setPlayers,
        setRoomState,
        roomState,
    });

    const triviaEmitters = createTriviaEventEmitters(socket, {
        playerID,
        roomState,
    });

    // Initialize random name
    useEffect(() => {
        const randomName = `Guest#${Math.floor(Math.random() * 5000 + 1)}`;
        setName(randomName);
    }, []);

    // WebSocket message handler
    useEffect(() => {
        if (!socket) return;

        const handleMessage = (event: MessageEvent) => {
            const message = JSON.parse(event.data);
            const { type, data, state } = message;

            // Generic events
            switch (type) {
                case Events.Join:
                    genericHandlers.handleJoin(data, state);
                    return;
                case Events.OtherJoin:
                    genericHandlers.handleOtherJoin(data);
                    return;
                case Events.Quit:
                    genericHandlers.handleQuit(data);
                    return;
                case Events.UpdateGameMode:
                    genericHandlers.handleUpdateGameMode(state);
                    return;
                case Events.Error:
                    console.error('Server error:', data?.message);
                    return;
            }

            // Trivia events
            switch (type) {
                case TriviaEvents.UpdateStage:
                case TriviaEvents.UpdateQuestion:
                case TriviaEvents.UpdateSettings:
                    triviaHandlers.handleStateUpdate(state);
                    return;
                case TriviaEvents.CorrectAnswer:
                    triviaHandlers.handleCorrectAnswer(data);
                    return;
                case TriviaEvents.IncorrectAnswer:
                    triviaHandlers.handleIncorrectAnswer(data);
                    return;
                case TriviaEvents.Restart:
                    triviaHandlers.handleRestart(state);
                    return;
            }

            console.warn('Unknown message type:', type);
        };

        socket.addEventListener('message', handleMessage);
        return () => socket.removeEventListener('message', handleMessage);
    }, [socket, name, roomState]);

    const getPlayerData = (id: number): Player | undefined => {
        return players.find(player => player.playerID === id);
    };

    const value: GameContextType = {
        // Core State
        roomID,
        setRoomID,
        name,
        setName,
        host,
        setHost,
        players,
        setPlayers,
        playerID,
        setPlayerID,
        socket,
        setSocket,
        
        // Gamemode State
        gamemode,
        setGamemode,
        roomState,
        setRoomState,
        
        // Generic Events
        submitUpdateGameMode: genericEmitters.submitUpdateGameMode,
        
        // Trivia Events
        submitGuess: triviaEmitters.submitGuess,
        submitUpdateStage: triviaEmitters.submitUpdateStage,
        submitUpdateQuestion: triviaEmitters.submitUpdateQuestion,
        submitUpdateSettings: triviaEmitters.submitUpdateSettings,
        submitRestart: triviaEmitters.submitRestart,
        
        // Utility
        getPlayerData,
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
};