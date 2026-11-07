import { useParams } from 'next/navigation';
import { useGameContext } from "@/shared/GameContext";
import { useState, useEffect } from "react";
import { useWebSocket } from '@/shared/hooks';
import Back from './Back';
import Loading from './Loading';
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
    
    const { isConnected, hasConnected, reconnecting, error, reconnect } = useWebSocket(
        hasJoined ? roomID : "", 
        hasJoined ? tempName : ""
    );
    
    if (error) {
        return (
            <div className="fixed inset-0 bg-stone-900 bg-dots z-10 overflow-hidden flex flex-col items-center justify-center gap-8 px-4">
                <h1 className="title font-bartle bg-dots px-4 py-2 mb-0">Connection Problem</h1>
                <p className="text-white/75 text-xl font-inter uppercase bg-red-900/20 p-4 italic text-center">{error}</p>
                <div className="flex flex-col md:flex-row gap-4 w-full max-w-md">
                    <button
                        className="btn-primary uppercase flex-1"
                        onClick={reconnect}
                    >
                        Try Again
                    </button>
                    <button
                        className="btn-primary uppercase flex-1"
                        onClick={() => window.location.href = '/'}
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    if (hasJoined && !isConnected) {
        if (!hasConnected && !reconnecting) {
            return <Loading />
        }

        return (
            <div className="fixed inset-0 bg-stone-900 bg-dots z-10 overflow-hidden flex flex-col items-center justify-center gap-8 px-4">
                <h1 className="title font-bartle bg-dots px-4 py-2 mb-0">Connection Lost</h1>
                <p className="text-white/75 text-xl font-inter uppercase bg-red-900/20 p-4 italic text-center">
                    {reconnecting ? 'Trying to reconnect to' : 'Disconnected from'} room <b>{roomID}</b>
                </p>
                <button
                    className="btn-primary uppercase w-full max-w-md"
                    onClick={reconnect}
                >
                    {reconnecting ? 'Retry Now' : 'Reconnect'}
                </button>
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