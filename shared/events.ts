import { Player, RoomState, GameModes } from './types';

export enum Events {
    Join = "join",
    OtherJoin = "otherJoin",
    Quit = "quit",
    UpdateGameMode = "updateGameMode",
    UpdateHost = "updateHost",
    TransferHost = "transferHost",
    UpdatePlayers = "updatePlayers",
    RequestState = "requestState",
    StateSync = "stateSync",
    Error = "error",
    ChatMessage = "chatMessage"
}

export interface JoinResponse {
    playerID: number;
    host: boolean;
    reconnected?: boolean;
}

export interface OtherJoinResponse {
    playerName: string;
    playerID: number;
    host?: boolean;
    reconnected?: boolean;
}

export interface GenericEventDeps {
    setPlayerID: (id: number) => void;
    setHost: (host: boolean) => void;
    setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
    setGamemode: (mode: GameModes) => void;
    setRoomState: (state: RoomState) => void;
    name: string;
    getPlayerID: () => number;
}

const applyRoomState = (
    deps: GenericEventDeps,
    state: RoomState
) => {
    deps.setRoomState(state);
    deps.setPlayers(state.players);
    deps.setGamemode(state.gamemode as GameModes);
    deps.setHost(state.hostId === deps.getPlayerID());
};

export const createGenericEventHandlers = (deps: GenericEventDeps) => ({
    handleJoin: (data: JoinResponse, state: RoomState) => {
        deps.setPlayerID(data.playerID);
        deps.setHost(data.host || state.hostId === data.playerID);
        deps.setRoomState(state);
        deps.setPlayers(state.players);
        deps.setGamemode(state.gamemode as GameModes);
    },

    handleOtherJoin: (data: OtherJoinResponse) => {
        deps.setPlayers(prev => {
            const existing = prev.find(p => p.playerID === data.playerID);
            if (existing) {
                return prev.map(p => p.playerID === data.playerID
                    ? { ...p, playerName: data.playerName, host: data.host ?? p.host, connected: true }
                    : p
                );
            }

            const newPlayer: Player = {
                playerID: data.playerID,
                playerName: data.playerName,
                score: 0,
                guess: "",
                lives: 0,
                host: data.host ?? false,
                connected: true,
                correctGuesses: [],
                guessedCorrectly: false,
                guessedArtist: false,
                guessedSong: false
            };
            return [...prev, newPlayer];
        });
    },

    handleQuit: (state: RoomState) => {
        applyRoomState(deps, state);
    },

    handleUpdateGameMode: (state: RoomState) => {
        applyRoomState(deps, state);
    },

    handleUpdateHost: (data: {newHostID: number}, state?: RoomState) => {
        deps.setHost(data.newHostID === deps.getPlayerID());
        if (state) {
            applyRoomState(deps, state);
        } else {
            deps.setPlayers(prev => prev.map(p => ({
                ...p,
                host: p.playerID === data.newHostID,
            })));
        }
    },

    handleUpdatePlayers: (state: RoomState) => {
        applyRoomState(deps, state);
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

    submitTransferHost: (playerID: number) => {
        if (socket) {
            socket.send(JSON.stringify({
                type: Events.TransferHost,
                data: { playerID },
            }));
        }
    },

    submitRequestState: () => {
        if (socket) {
            socket.send(JSON.stringify({ type: Events.RequestState }));
        }
    },
});