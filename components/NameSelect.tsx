import { useParams } from 'next/navigation';
import { useGameContext } from "@/shared/GameContext";
import { useState, useEffect } from "react";
import { useWebSocket } from '@/shared/hooks';
import { useRouter } from "next/navigation";

export default function NameSelect() {
    const params = useParams();
    const paramID = params?.id;
    const { name, setName, roomID, setRoomID } = useGameContext();
    
    const [tempName, setTempName] = useState(name);
    const [hasJoined, setHasJoined] = useState(false);
    const [visible, setVisible] = useState("visible");
    const router = useRouter();

    useEffect(() => {
        if (!paramID) return;

        const idFromURL = Array.isArray(paramID) ? paramID[0] : paramID;
        if (idFromURL !== "") {
            setRoomID(idFromURL);
        }
    }, [paramID, setRoomID]);

    useEffect(() => {
        if (!name) return;
        setTempName(prev => (prev === "" ? name : prev));
    }, [name]);
    
    const { isConnected } = useWebSocket(
        hasJoined ? roomID : "", 
        hasJoined ? tempName : ""
    );

    if (hasJoined && !isConnected) {
        return <div>Connecting...</div>;
    }

    if (!hasJoined) {
        return (
            <div className={`absolute inset-0 bg-indigo-700 z-10 ${visible}`}>
                <svg 
                    className="w-8 h-8 absolute left-0 top-0 m-4 hover:cursor-pointer hover:opacity-50"
                    onClick={() => router.push('/')}
                    xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 108.06"><path d="M63.94,24.28a14.28,14.28,0,0,0-20.36-20L4.1,44.42a14.27,14.27,0,0,0,0,20l38.69,39.35a14.27,14.27,0,0,0,20.35-20L48.06,68.41l60.66-.29a14.27,14.27,0,1,0-.23-28.54l-59.85.28,15.3-15.58Z"/></svg>
                
                <div className="flex flex-col justify-center place-items-center min-h-screen space-y-10 text-cyan-50 z-15">
                    <h1 className='text-[48px] bg-indigo-800 drop-shadow-[0_0.9px_0.9px_rgba(0,0,0,0.7)]'>enter a name</h1>
                    <input 
                        type="text"
                        className='bg-blue-600 p-2 hover:opacity-85 text-cyan-50 text-[24px]
                         place-self-center text-shadow-[0_0.9px_0.9px_rgba(0,0,0,0.7)] 
                         border-4 rounded-md focus:outline-none focus:border-white border-black'
                        value={tempName}
                        onChange={(e) => setTempName(e.currentTarget.value)}
                    />
                    <button
                        className="btn-primary"
                        disabled={!tempName.trim()}
                        onClick={() => {
                            setName(tempName);
                            setHasJoined(true);
                            setVisible("collapse");
                        }}
                    >
                        join
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
