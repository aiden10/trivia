'use client'

import { useState } from 'react';
import { useGameContext } from '@/shared/GameContext';
import PlayerList from '@/components/PlayerList';
import Back from '@/components/Back';

export default function Picking() {
    const { 
        roomState, 
        playerID, 
        players,
        submitRotanikaSetSecret 
    } = useGameContext();

    const rotanikaState = roomState?.rotanikaState;
    const pickerId = rotanikaState?.pickerId;
    const isPicker = playerID === pickerId;
    
    const pickerName = players.find(p => p.playerID === pickerId)?.playerName ?? 'Unknown';

    const [secret, setSecret] = useState('');

    const handleSubmitSecret = (e: React.FormEvent) => {
        e.preventDefault();
        if (!secret.trim()) return;
        submitRotanikaSetSecret(secret.trim());
    };

    return (
        <div className="game-screen bg-dots">
            <Back inRoom={true}/>
            <h1 className="title font-bartle bg-dots">Rotanika</h1>

            <div className="w-full max-w-2xl flex flex-col items-center gap-6">
                {isPicker ? (
                    <>
                        <h2 className="heading1 bg-dots">
                            You are the Picker
                        </h2>
                        <p className="text-white text-lg text-center font-inter">
                            Think of a person or thing for others to guess.
                            <br />
                            Make sure it's something that can be guessed, but not too easily!
                        </p>
                        
                        <form onSubmit={handleSubmitSecret} className="w-full">
                            <div className="flex flex-col gap-4">
                                <input
                                    type="text"
                                    value={secret}
                                    onChange={(e) => setSecret(e.target.value)}
                                    placeholder="Enter your secret thing..."
                                    autoFocus
                                    className="input-primary"
                                />
                                
                                <button
                                    type="submit"
                                    disabled={!secret.trim()}
                                    className="btn-primary w-full text-xl py-3 disabled:opacity-50 uppercase"
                                >
                                    Confirm Secret
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <>
                        <h2 className="heading1 bg-dots">
                            {pickerName} is picking...
                        </h2>
                        <p className="text-white text-lg text-center font-inter animate-pulse">
                            Waiting for the picker to think of something...
                        </p>
                    </>
                )}
            </div>

            <div className='w-full max-w-4xl mx-auto mt-10'>
                <PlayerList />
            </div>
        </div>
    );
}