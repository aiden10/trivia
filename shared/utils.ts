import { CREATE_ROOM_ENDPOINT } from './constants';

export interface CreateRoomResponse {
    room_id: string;
}

export async function createRoom(): Promise<CreateRoomResponse> {
    try {
        const response = await fetch(CREATE_ROOM_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to create room: ${response.statusText}`);
        }

        return await response.json();
    } 
    catch (error) {
        console.error('Error creating room:', error);
        throw error;
    }
}