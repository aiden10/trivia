'use client'

import { useEffect, useRef, useState } from "react";
import { useGameContext } from "@/shared/GameContext";
import WikidataSearch from "@/components/WikidataSearch";
import Timer from "@/components/Timer";

export default function Submitting() {
    const {
        host,
        roomState,
        players,
        playerID,
        submitObscureEntity,
        submitObscureReveal,
    } = useGameContext();

    const obscureState = roomState?.obscureState;
    const prompt = obscureState?.currentPrompt;
    const submissions = obscureState?.submissions ?? [];
    const roundNumber = obscureState?.roundNumber ?? 1;
    const duration = obscureState?.settings.duration ?? 45;

    const [remainingTime, setRemainingTime] = useState(duration);
    const endTimeRef = useRef<number>(Date.now() + duration * 1000);
    const revealedRef = useRef(false);
    const submitRevealRef = useRef(submitObscureReveal);
    submitRevealRef.current = submitObscureReveal;

    const mySubmission = submissions.find(submission => submission.playerId === playerID);

    // Reset the timer whenever a new round starts (or the duration changes).
    useEffect(() => {
        endTimeRef.current = Date.now() + duration * 1000;
        setRemainingTime(duration);
        revealedRef.current = false;
    }, [roundNumber, duration]);

    // Countdown. The host is responsible for telling the server that time is up.
    useEffect(() => {
        const interval = setInterval(() => {
            const timeLeft = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
            setRemainingTime(timeLeft);

            if (timeLeft === 0) {
                clearInterval(interval);
                if (!revealedRef.current) {
                    revealedRef.current = true;
                    if (host) submitRevealRef.current();
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, [host, roundNumber, duration]);

    return (
        <div className="w-full flex flex-col min-h-screen gap-y-5 p-4 bg-lines">
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6">

                {/* Prompt */}
                <h1 className="heading1 bg-dots uppercase text-center break-words">
                    {prompt?.text ?? 'Loading prompt...'}
                </h1>

                {/* Search / submitted answer */}
                {mySubmission ? (
                    <div className="w-full bg-neutral-900 border-2 border-emerald-500 p-4 text-center">
                        <p className="text-emerald-400 font-inter uppercase text-sm mb-1">
                            Submitted
                        </p>
                        <p className="text-white font-inter text-2xl">
                            {mySubmission.entityName}
                        </p>
                    </div>
                ) : (
                    <div className="w-full">
                        <WikidataSearch
                            onSelect={(id) => submitObscureEntity(id)}
                            placeholder={remainingTime === 0 ? "Time's up..." : "Search for something that matches..."}
                            disabled={remainingTime === 0}
                            className="max-w-none"
                        />
                    </div>
                )}

                <Timer remainingTime={remainingTime} duration={duration} />
            </div>

            {/* Submission status */}
            <div className="w-full max-w-4xl mx-auto mt-6">
                <div className="bg-neutral-900 border-2 border-white">
                    <div className="flex items-center justify-between p-3 border-b border-white/30 bg-black/50">
                        <h3 className="text-white font-inter uppercase text-sm">
                            Players
                        </h3>
                        <span className="text-white/60 font-inter text-sm">
                            {submissions.length} / {players.length} submitted
                        </span>
                    </div>

                    <div className="divide-y divide-white/10">
                        {players.map(player => {
                            const hasSubmitted = submissions.some(
                                submission => submission.playerId === player.playerID
                            );

                            return (
                                <div
                                    key={player.playerID}
                                    className="p-3 flex justify-between items-center gap-3"
                                >
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-inter truncate">
                                                {player.playerName}
                                                {player.playerID === playerID && (
                                                    <span className="ml-2 text-xs bg-white text-black px-1.5 py-0.5">
                                                        YOU
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        {!hasSubmitted && player.guess && (
                                            <p className="text-white/40 font-inter text-sm italic font-thin truncate ml-1">
                                                {player.guess}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className="text-white/50 font-inter text-sm">
                                            {player.score} pts
                                        </span>
                                        {hasSubmitted && (
                                            <span className="text-emerald-400 font-inter text-sm uppercase">
                                                Submitted
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
