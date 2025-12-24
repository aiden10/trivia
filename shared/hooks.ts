'use client'

import { useEffect, useRef, useState } from 'react';
import { useGameContext } from './GameContext';
import { SOCKET_URL } from './constants';

export const useWebSocket = (roomId: string, playerName: string) => {
    const { setSocket, socket } = useGameContext();
    const [error, setError] = useState<string | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    const reconnectDelay = 1000;

    const connect = () => {
        try {
            const ws = new WebSocket(`${SOCKET_URL}/${roomId}`);

            ws.onopen = () => {
                console.log('WebSocket connected');
                reconnectAttempts.current = 0;
                
                ws.send(JSON.stringify({
                    name: playerName
                }));
                
                setSocket(ws);
            };

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                if (message.type === "error") {
                    setError(message.message);
                    ws.close(1000, 'Room not found');
                }
            };

            ws.onclose = (event) => {
                console.log('WebSocket disconnected:', event.reason);
                setSocket(null);
                
                if (event.reason === 'Room not found') {
                    return;
                }
                
                if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
                    setTimeout(() => {
                        reconnectAttempts.current++;
                        console.log(`Reconnection attempt ${reconnectAttempts.current}`);
                        connect();
                    }, reconnectDelay * Math.pow(2, reconnectAttempts.current));
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

        } 
        catch (error) {
            console.error('Failed to create WebSocket connection:', error);
        }
    };

    useEffect(() => {
        if (roomId && playerName) {
            connect();
        }

        return () => {
            if (socket) {
                socket.close(1000, 'Component unmounting');
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, playerName]);

    return { 
        isConnected: socket !== null && socket.readyState === WebSocket.OPEN,
        error 
    };
};