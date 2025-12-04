
'use client'

import { useEffect, useRef } from 'react';
import { useGameContext } from './GameContext';
import { SOCKET_URL } from './constants';

export const useWebSocket = (roomId: string, playerName: string) => {
    const { setSocket, socket } = useGameContext();
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

            ws.onclose = (event) => {
                console.log('WebSocket disconnected:', event.reason);
                setSocket(null);
                
                // Attempt to reconnect if not a clean close
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
                setSocket(null);
            }
        };
    }, [roomId, playerName]);

    const disconnect = () => {
        if (socket) {
            socket.close(1000, 'Manual disconnect');
            setSocket(null);
        }
    };
    return { connect, disconnect, isConnected: socket?.readyState === WebSocket.OPEN };
};
