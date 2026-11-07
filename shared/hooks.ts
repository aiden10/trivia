'use client'

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameContext } from './GameContext';
import { SOCKET_URL } from './constants';
import { getPlayerSessionId, sendLeaveRoom } from './utils';

export const useWebSocket = (roomId: string, playerName: string) => {
    const { setSocket } = useGameContext();
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [hasConnected, setHasConnected] = useState(false);
    const [reconnecting, setReconnecting] = useState(false);

    const socketRef = useRef<WebSocket | null>(null);
    const reconnectAttempts = useRef(0);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const intentionalClose = useRef(false);
    const fatalError = useRef(false);
    const sessionId = useRef("");
    const connectionEpoch = useRef(0);

    useEffect(() => {
        sessionId.current = roomId ? getPlayerSessionId(roomId) : "";
        connectionEpoch.current = 0;
    }, [roomId]);

    useEffect(() => {
        if (!roomId) return;

        const handlePageHide = () => {
            sendLeaveRoom(roomId, sessionId.current, connectionEpoch.current);
        };

        window.addEventListener('pagehide', handlePageHide);
        return () => window.removeEventListener('pagehide', handlePageHide);
    }, [roomId]);

    const connect = useCallback(() => {
        if (!roomId || !playerName) return;
        if (socketRef.current && socketRef.current.readyState <= WebSocket.OPEN) return;

        try {
            const ws = new WebSocket(`${SOCKET_URL}/${roomId}`);
            socketRef.current = ws;
            // Register the socket with the game context immediately so no
            // messages are missed between the open event and React effects.
            setSocket(ws);

            ws.onopen = () => {
                if (socketRef.current !== ws) return;

                reconnectAttempts.current = 0;
                setIsConnected(true);
                setHasConnected(true);
                setReconnecting(false);

                ws.send(JSON.stringify({
                    name: playerName,
                    sessionId: sessionId.current,
                }));

                // Ask for a fresh snapshot after the join. This guarantees the
                // exact current stage/timers even if an earlier message was
                // missed while React was still mounting.
                setTimeout(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: "requestState" }));
                    }
                }, 250);
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === "join") {
                        const epoch = message.data?.connectionEpoch;
                        if (typeof epoch === 'number') {
                            connectionEpoch.current = epoch;
                        }
                    }
                    if (message.type === "error") {
                        fatalError.current = true;
                        setError(message.message ?? "Unable to join room");
                        setIsConnected(false);
                        setReconnecting(false);
                        ws.close(1000, 'Room not found');
                    }
                } catch {
                    // Ignore non-JSON messages.
                }
            };

            ws.onclose = (event) => {
                if (socketRef.current !== ws) return;
                socketRef.current = null;
                setSocket(null);
                setIsConnected(false);

                if (intentionalClose.current || fatalError.current) {
                    setReconnecting(false);
                    return;
                }

                if (event.code === 4001) {
                    fatalError.current = true;
                    setError("This room was opened in another tab");
                    setReconnecting(false);
                    return;
                }

                setReconnecting(true);
                const delay = Math.min(5000, 500 * Math.pow(2, Math.min(reconnectAttempts.current, 4)));
                reconnectAttempts.current += 1;

                if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
                reconnectTimer.current = setTimeout(() => {
                    reconnectTimer.current = null;
                    connect();
                }, delay);
            };

            ws.onerror = () => {
                // onclose handles retries.
            };
        } catch (err) {
            console.error('Failed to create WebSocket connection:', err);
            setReconnecting(true);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, playerName, setSocket]);

    const reconnect = useCallback(() => {
        if (reconnectTimer.current) {
            clearTimeout(reconnectTimer.current);
            reconnectTimer.current = null;
        }
        reconnectAttempts.current = 0;
        intentionalClose.current = false;
        fatalError.current = false;
        setError(null);
        setReconnecting(true);
        connect();
    }, [connect]);

    useEffect(() => {
        if (!roomId || !playerName) return;

        intentionalClose.current = false;
        fatalError.current = false;
        connect();

        return () => {
            intentionalClose.current = true;
            sendLeaveRoom(roomId, sessionId.current, connectionEpoch.current);
            if (reconnectTimer.current) {
                clearTimeout(reconnectTimer.current);
                reconnectTimer.current = null;
            }
            const socket = socketRef.current;
            socketRef.current = null;
            if (socket) {
                socket.close(1000, 'Component unmounting');
            }
        };
    }, [roomId, playerName, connect]);

    return {
        isConnected,
        hasConnected,
        reconnecting,
        error,
        reconnect,
    };
};
