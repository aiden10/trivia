'use client'
import { useEffect, useState } from 'react';
import { useGameContext } from '@/shared/GameContext';
import { useRouter } from 'next/navigation';
import { createRoom, getPublicRooms } from '@/shared/utils';
import { GamemodeOptions, GameModes, PublicRoom } from '@/shared/types';
import Loading from '@/components/Loading';

const modeName = (gamemode: string) => {
    if (gamemode === GameModes.Default) return 'Choosing gamemode';
    return GamemodeOptions.find(option => option.id === gamemode)?.name ?? gamemode;
};

export default function Home() {
    const { roomID, setRoomID } = useGameContext();
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [isPublic, setIsPublic] = useState(true);
    const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
    const [roomsLoaded, setRoomsLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const loadRooms = async () => {
            try {
                const rooms = await getPublicRooms();
                if (!cancelled) {
                    setPublicRooms(rooms);
                    setRoomsLoaded(true);
                }
            }
            catch {
                if (!cancelled) setRoomsLoaded(true);
            }
        };

        loadRooms();
        const interval = setInterval(loadRooms, 5000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);
    
    return (
        <>
            {isCreating && <Loading />}
            <div className='flex flex-col items-center min-h-screen bg-dots gap-8 py-8 md:justify-center'>
                <h1 className='title font-bartle md:text-[80px] text-[48px] md:mt-0 mt-8'>ROOM GAMES</h1>
                
                {/* Create Room Section */}
                <div className='flex flex-col items-center gap-4 md:w-1/2 w-full px-4'>
                    <label className='flex items-center gap-3 text-white/70 font-inter uppercase text-sm cursor-pointer self-start'>
                        <input
                            type='checkbox'
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            className='settings-checkbox'
                        />
                        Show room in public list
                    </label>
                    <button 
                        className='btn-primary w-full uppercase'
                        disabled={isCreating}
                        onClick={async () => {
                            setIsCreating(true);
                            try {
                                const id = (await createRoom(isPublic)).room_id;
                                setRoomID(id);
                                router.push(`/game/${id}`);
                            } catch (error) {
                                console.error('Failed to create room:', error);
                                setIsCreating(false);
                            }
                        }}
                    >
                        Create Room
                    </button>
                </div>
                
                {/* Join Room Section */}
                <div className='flex flex-col items-center gap-4 md:w-1/2 w-full px-4'>
                    <div className='flex flex-col w-full'>
                        <p className='text-white uppercase bg-white/50 font-inter text-[24px]
                         md:text-[28px] mb-2 text-right px-2 font-light
                        '>Room Code</p>
                        <input
                            type="text"
                            className='input-primary w-full uppercase'
                            placeholder='abcd'
                            onInput={(e) => setRoomID(e.currentTarget.value)}
                        />
                    </div>
                    <button
                        className='btn-primary w-full uppercase'
                        disabled={roomID === ""}
                        onClick={() => router.push(`/game/${roomID}`)}
                    >
                        Join Room
                    </button>
                </div>

                {/* Public Rooms */}
                <div className='flex flex-col gap-3 md:w-1/2 w-full px-4 pb-8'>
                    <div className='flex items-end justify-between gap-4'>
                        <h2 className='heading2 mb-0'>Public Rooms</h2>
                        <span className='text-white/40 font-inter text-xs uppercase'>
                            {publicRooms.length} open
                        </span>
                    </div>

                    <div className='flex flex-col border-2 border-white/75 bg-neutral-900/80'>
                        {!roomsLoaded && (
                            <p className='text-white/50 font-inter p-4 text-center animate-pulse'>
                                Loading rooms...
                            </p>
                        )}
                        {roomsLoaded && publicRooms.length === 0 && (
                            <p className='text-white/50 font-inter p-4 text-center'>
                                No public rooms right now
                            </p>
                        )}
                        {publicRooms.map(room => (
                            <button
                                key={room.roomId}
                                onClick={() => router.push(`/game/${room.roomId}`)}
                                className='flex items-center justify-between gap-4 p-3 border-b border-white/10
                                    last:border-b-0 hover:bg-white/10 transition-colors text-left cursor-pointer'
                            >
                                <div className='flex flex-col min-w-0'>
                                    <span className='text-white font-bartle text-xl uppercase'>
                                        {room.roomId}
                                    </span>
                                    <span className='text-white/50 font-inter text-sm truncate'>
                                        {modeName(room.gamemode)}
                                        {room.hostName ? ` · ${room.hostName}` : ''}
                                    </span>
                                </div>
                                <div className='flex items-center gap-3 shrink-0'>
                                    <div className='text-right'>
                                        <p className='text-white/80 font-inter text-sm'>
                                            {room.connectedPlayerCount}/{room.playerCount} online
                                        </p>
                                        <p className='text-white/40 font-inter text-xs uppercase'>
                                            {room.stage > 0 ? room.stageName : 'Lobby'}
                                        </p>
                                    </div>
                                    <span className='text-white/60 text-xl'>→</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
