import { useParams } from 'next/navigation';
import { useGameContext } from "@/shared/GameContext";
import { useState, useEffect } from "react";
import { useWebSocket } from '@/shared/hooks';
import Back from './Back';
export default function NameSelect() {
    const params = useParams();
    const paramID = params?.id;
    const { name, setName, roomID, setRoomID } = useGameContext();
    
    const [tempName, setTempName] = useState(name);
    const [hasJoined, setHasJoined] = useState(false);
    const [visible, setVisible] = useState("visible");

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
    
    const { isConnected, error } = useWebSocket(
        hasJoined ? roomID : "", 
        hasJoined ? tempName : ""
    );
    
    if (error) {
        return (
            <div className="fixed inset-0 bg-stone-900 bg-dots z-10 overflow-hidden flex flex-col items-center justify-center gap-12 px-4">
                <h1 className="title font-bartle bg-dots px-4 py-2 mb-0">Room Not Found</h1>
                <p className="text-white/75 text-xl font-inter uppercase bg-red-900/20 p-4 italic">room <b>{roomID}</b> does not exist</p>
                <button
                    className="btn-primary uppercase md:w-1/2 w-full"
                    onClick={() => window.location.href = '/'}
                >
                    Back to Home
                </button>
            </div>
        );
    }

    if (hasJoined && !isConnected) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }
    
    if (!hasJoined) {
        return (
            <div className={`fixed inset-0 bg-stone-900 bg-dots z-10 overflow-hidden ${visible}`}>
                <Back inRoom={false}/>                
                <div className="flex flex-col justify-center items-center h-full space-y-6 text-white px-4">
                    <h1 className='title font-bartle bg-dots px-4 py-2 w-full max-w-md text-center'>name</h1>
                    <input 
                        type="text"
                        className='input-primary md:w-md w-full'
                        value={tempName}
                        onChange={(e) => setTempName(e.currentTarget.value)}
                    />
                    <button
                        className="btn-primary w-full max-w-md uppercase"
                        disabled={!tempName.trim()}
                        onClick={() => {
                            setName(tempName);
                            setHasJoined(true);
                            setVisible("collapse");
                        }}
                    >
                        Join
                    </button>
                </div>
            </div>
        );
    }

    return null;
}