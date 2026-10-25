'use client'

import { useEffect, useRef } from "react";
import { useGameContext } from "@/shared/GameContext";
import { ObscureStages } from "@/shared/types";

const REVEAL_DURATION = 8;

export default function Reveal() {
    const {
        host,
        roomState,
        players,
        playerID,
        submitObscureUpdateStage,
    } = useGameContext();

    const submitStageRef = useRef(submitObscureUpdateStage);
    submitStageRef.current = submitObscureUpdateStage;

    const obscureState = roomState?.obscureState;
    const prompt = obscureState?.currentPrompt;
    const results = obscureState?.roundResults ?? [];
    const roundNumber = obscureState?.roundNumber ?? 1;

    const missingPlayers = players.filter(
        player => !results.some(result => result.playerId === player.playerID)
    );

    useEffect(() => {
        if (!host) return;

        const timeout = setTimeout(() => {
            submitStageRef.current(ObscureStages.PromptDisplay);
        }, REVEAL_DURATION * 1000);

        return () => clearTimeout(timeout);
    }, [host, roundNumber]);

    return (
        <div className="w-full flex flex-col min-h-screen gap-y-6 p-4 bg-lines">
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-3">
                <h1 className="heading1 bg-dots uppercase text-center break-words">
                    {prompt?.text ?? 'Prompt'}
                </h1>
            </div>

            <div className="w-full max-w-4xl mx-auto flex flex-col gap-3">
                {results.length === 0 && (
                    <div className="bg-neutral-900 border-2 border-white p-6 text-center">
                        <p className="text-white/70 font-inter text-xl">
                            Nobody submitted an answer this round.
                        </p>
                    </div>
                )}

                {results.map((result, index) => {
                    const player = players.find(p => p.playerID === result.playerId);
                    const isRoundWinner = result.points > 0;
                    const isMe = result.playerId === playerID;

                    return (
                        <div
                            key={result.playerId}
                            className={`border-2 transition-all p-4 ${
                                isRoundWinner
                                    ? 'bg-emerald-900/50 border-emerald-500'
                                    : 'bg-neutral-900 border-white/50'
                            }`}
                        >
                            <div className="flex flex-row justify-between items-start gap-4">
                                <div className="flex flex-col flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-white/50 font-inter text-sm">
                                            #{index + 1}
                                        </span>
                                        <span className="text-white font-inter text-xl truncate">
                                            {player?.playerName ?? `Player ${result.playerId}`}
                                        </span>
                                        {isMe && (
                                            <span className="bg-white text-black text-xs px-2 py-0.5">
                                                YOU
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-white/80 font-inter text-lg mt-1 truncate">
                                        {result.entityName}
                                    </p>

                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-white/50 font-inter text-sm">
                                        <span>{result.sitelinks} sitelinks</span>
                                        <span>{result.pageViews.toLocaleString()} page views</span>
                                        <span>popularity {result.popularity.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end">
                                    {isRoundWinner && (
                                        <span className="text-emerald-400 font-inter text-2xl font-bold whitespace-nowrap">
                                            +{result.points}
                                        </span>
                                    )}
                                    <span className="text-white/40 font-inter text-xs whitespace-nowrap">
                                        total {player?.score ?? 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {missingPlayers.length > 0 && (
                    <div className="bg-neutral-900 border-2 border-white/30 p-4">
                        <p className="text-white/40 font-inter uppercase text-sm mb-2">
                            No answer
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {missingPlayers.map(player => (
                                <span
                                    key={player.playerID}
                                    className="text-white/50 font-inter text-sm border border-white/20 px-2 py-1"
                                >
                                    {player.playerName}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
