'use client'
import { useGameContext } from '@/shared/GameContext';
import { useRouter } from 'next/navigation';
import { createRoom } from '@/shared/utils';

export default function Home() {
    const { roomID, setRoomID } = useGameContext();
    const router = useRouter();
    
    return (
        <div className='flex flex-col items-center w-screen h-screen bg-dots gap-8 md:justify-center justify-normal'>
            <h1 className='title font-bartle md:text-[80px] text-[48px] md:mt-0 mt-16'>ROOM GAMES</h1>
            
            {/* Create Room Section */}
            <div className='flex flex-col items-center gap-4 md:w-1/2 w-full px-4'>
                <button 
                    className='btn-primary w-full uppercase'
                    onClick={async () => {
                        const id = (await createRoom()).room_id;
                        setRoomID(id);
                        router.push(`/game/${id}`);
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
        </div>
    );
}