'use client'
import { useGameContext } from '@/shared/GameContext';
import { useRouter } from 'next/navigation';
import { createRoom } from '@/shared/utils';

export default function Home() {
    const { roomID, setRoomID } = useGameContext();
    const router = useRouter();
    
    return (
        <div className='flex flex-col items-center justify-center w-screen h-screen bg-indigo-700 gap-8'>
            <h1 className='text-6xl md:text-7xl text-cyan-50 mb-8 drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.3)] font-semibold'>wwtbam</h1>
            
            {/* Create Room Section */}
            <div className='flex flex-col items-center gap-4 w-full max-w-2xl px-4'>
                <button 
                    className='btn-primary w-full'
                    onClick={async () => {
                        const id = (await createRoom()).room_id;
                        setRoomID(id);
                        console.log(`ROOM ID: ${id}`);
                        router.push(`/game/${id}`)
                    }}
                >
                    create room
                </button>
            </div>
            
            {/* Join Room Section */}
            <div className='flex flex-col items-center gap-4 w-full max-w-2xl px-4'>
                <div className='flex flex-col items-center w-full'>
                    <p className='text-cyan-50 text-[24px] md:text-[28px] mb-2 drop-shadow-[0_0.5px_0.5px_rgba(0,0,0,0.7)]
                    font-semibold'>room id</p>
                    <input
                        type="text"
                        className='text-center input-primary w-full'
                        defaultValue={""}
                        placeholder='room code'
                        onInput={(e) => setRoomID(e.currentTarget.value)}
                    />
                </div>
                <button
                    className='btn-primary w-full'
                    disabled={roomID === ""}
                    onClick={() => router.push(`/game/${roomID}`)}
                >
                    join room
                </button>
            </div>
        </div>
    );
}