import { Player, RoomState, GameModes } from './types';

// === Generic Events (not gamemode-specific) ===
export enum Events {
    Join = "join",
    OtherJoin = "otherJoin",
    Quit = "quit",
    UpdateGameMode = "updateGameMode",
    Error = "error",
}

// === Event Response Types ===
export interface JoinResponse {
    playerID: number;
    host: boolean;
}

export interface OtherJoinResponse {
    playerName: string;
    playerID: number;
}

export interface QuitResponse {
    playerID: number;
}

// === Generic Event Handlers ===
export interface GenericEventDeps {
    setPlayerID: (id: number) => void;
    setHost: (host: boolean) => void;
    setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
    setGamemode: (mode: GameModes) => void;
    setRoomState: (state: RoomState) => void;
    name: string;
}

export const createGenericEventHandlers = (deps: GenericEventDeps) => ({
    handleJoin: (data: JoinResponse, state: RoomState) => {
        deps.setPlayerID(data.playerID);
        deps.setHost(data.host);
        deps.setRoomState(state);
        
        // Build player list from state + self
        const existingPlayers: Player[] = state.players.map(p => ({
            playerID: p.playerID,
            playerName: p.playerName,
            score: p.score,
            guess: "",
            guessedCorrectly: false
        }));
        
        const myPlayer: Player = {
            playerID: data.playerID,
            playerName: deps.name,
            score: 0,
            guess: "",
            guessedCorrectly: false
        };
        
        deps.setPlayers([myPlayer, ...existingPlayers]);
        deps.setGamemode(state.gamemode as GameModes);
    },

    handleOtherJoin: (data: OtherJoinResponse) => {
        const newPlayer: Player = {
            playerID: data.playerID,
            playerName: data.playerName,
            score: 0,
            guess: "",
            guessedCorrectly: false
        };
        deps.setPlayers(prev => [...prev, newPlayer]);
    },

    handleQuit: (data: QuitResponse) => {
        deps.setPlayers(prev => prev.filter(p => p.playerID !== data.playerID));
    },

    handleUpdateGameMode: (state: RoomState) => {
        deps.setRoomState(state);
        deps.setGamemode(state.gamemode as GameModes);
    },
});

// === Generic Event Emitters ===
export const createGenericEventEmitters = (socket: WebSocket | null) => ({
    submitUpdateGameMode: (gamemode: GameModes) => {
        if (socket) {
            socket.send(JSON.stringify({
                type: Events.UpdateGameMode,
                data: { gamemode },
            }));
        }
    },
});