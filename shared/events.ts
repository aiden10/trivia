import { Player, RoomState, GameModes } from './types';

export enum Events {
    Join = "join",
    OtherJoin = "otherJoin",
    Quit = "quit",
    UpdateGameMode = "updateGameMode",
    UpdateHost = "updateHost",
    Error = "error",
    ChatMessage = "chatMessage"
}

export interface JoinResponse {
    playerID: number;
    host: boolean;
}

export interface OtherJoinResponse {
    playerName: string;
    playerID: number;
}

export interface GenericEventDeps {
    setPlayerID: (id: number) => void;
    setHost: (host: boolean) => void;
    setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
    setGamemode: (mode: GameModes) => void;
    setRoomState: (state: RoomState) => void;
    name: string;
    playerID: number;
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
            guess: p.guess,
            lives: p.lives,
            host: p.host,
            correctGuesses: p.correctGuesses,
            guessedCorrectly: p.guessedCorrectly,
            guessedArtist: p.guessedArtist,
            guessedSong: p.guessedSong
        }));
        
        const myPlayer: Player = {
            playerID: data.playerID,
            playerName: deps.name,
            score: 0,
            guess: "",
            lives: 0,
            host: data.host,
            correctGuesses: [],
            guessedCorrectly: false,
            guessedArtist: false,
            guessedSong: false
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
            lives: 0,
            host: false,
            correctGuesses: [],
            guessedCorrectly: false,
            guessedArtist: false,
            guessedSong: false
        };
        deps.setPlayers(prev => [...prev, newPlayer]);
    },

    handleQuit: (state: RoomState) => {
        deps.setPlayers(state.players);
    },

    handleUpdateGameMode: (state: RoomState) => {
        deps.setRoomState(state);
        deps.setGamemode(state.gamemode as GameModes);
        deps.setPlayers(state.players);
    },

    handleUpdateHost: (data: {newHostID: number}) => {
        if (data.newHostID === deps.playerID) deps.setHost(true);
    },
    handleMessage: (state: RoomState) => {
        deps.setRoomState(state);
    }
});

export const createGenericEventEmitters = (socket: WebSocket | null) => ({
    submitUpdateGameMode: (gamemode: GameModes) => {
        if (socket) {
            socket.send(JSON.stringify({
                type: Events.UpdateGameMode,
                data: { gamemode },
            }));
        }
    },
    
    submitMessage: (sender: string, body: string) => {
        if (socket) {
            socket.send(JSON.stringify({
                type: Events.ChatMessage,
                data: { sender: sender, body: body },
            }));
        }
    },
});