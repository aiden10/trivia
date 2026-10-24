'use client'

import { useGameContext } from "@/shared/GameContext";
import { ObscureSettings as ObscureSettingsType } from "@/shared/types";
import Leaderboard from "@/components/Leaderboard";
import ObscureSettings from "../ObscureSettings";
import Back from "@/components/Back";

export default function Results() {
    const {
        host,
        players,
        roomState,
        submitObscureRestart,
        submitObscureUpdateSettings,
    } = useGameContext();

    const obscureState = roomState?.obscureState;
    const canStart = players.length >= 2;
    const mostObscure = obscureState?.mostObscure ?? [];

    const topScore = players.length > 0
        ? Math.max(...players.map(player => player.score))
        : 0;
    const winners = players.filter(player => player.score === topScore);

    const handleSettingsChange = (settings: ObscureSettingsType) => {
        submitObscureUpdateSettings(settings);
    };

    return (
        <div className="game-screen bg-lines">
            <Back inRoom={true}/>
            <h1 className="title font-bartle bg-dots">Game Over</h1>

            {winners.length > 0 && (
                <div className="w-full max-w-2xl bg-gradient-to-b from-amber-900/50 to-neutral-900
                    border-2 border-amber-500 p-8 md:p-12 text-center">
                    <p className="text-amber-400 text-2xl font-inter uppercase mb-4">
                        {winners.length > 1 ? "Winners" : "Winner"}
                    </p>
                    <h2 className="text-white text-[24px] md:text-[42px] font-bartle mb-4">
                        {winners.map(player => player.playerName).join(" & ")}
                    </h2>
                    <p className="text-white/80 font-inter text-xl">
                        {topScore} {topScore === 1 ? 'point' : 'points'}
                    </p>
                </div>
            )}

            {mostObscure.length > 0 && (
                <div className="w-full max-w-3xl bg-neutral-900 border-2 border-white font-inter">
                    <div className="flex items-baseline justify-between gap-4 p-3 border-b border-white/30 bg-black/50">
                        <h2 className="text-white uppercase text-sm">Most Obscure Guesses</h2>
                    </div>

                    <div className="divide-y divide-white/10">
                        {mostObscure.map((guess, index) => (
                            <div
                                key={`${guess.roundNumber}-${guess.playerId}-${guess.entityId}`}
                                className="p-3 flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-y-3 gap-x-4 min-w-0">
                                    <span className={`font-bartle text-md w-7 ml-4 ${index === 0 ? 'text-emerald-400' : 'text-white/30'}`}>
                                        #{index + 1}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-white font-inter truncate">
                                            {guess.entityName}
                                        </p>
                                        <p className="text-white/50 font-inter text-sm truncate">
                                            {guess.playerName}
                                            <span className="text-white/30"> · Round {guess.roundNumber}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right whitespace-nowrap">
                                    <p className={`font-inter text-lg ${index === 0 ? 'text-emerald-400' : 'text-white'}`}>
                                        {guess.popularity.toFixed(2)}
                                    </p>
                                    <p className="text-white/40 font-inter text-[10px] uppercase">
                                        popularity
                                    </p>
                                    {guess.points > 0 && (
                                        <p className="text-emerald-400 font-inter text-xs">
                                            +{guess.points} pts
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Leaderboard />

            {host ? (
                <div className="flex flex-col gap-4 md:w-2/3 w-full mt-4">
                    <ObscureSettings
                        host={host}
                        settings={obscureState?.settings}
                        catalog={obscureState?.catalog}
                        onSettingsChange={handleSettingsChange}
                    />

                    {!canStart && (
                        <p className="text-amber-400/75 text-center mt-4 font-inter font-light italic bg-amber-400/30 py-2">
                            Need at least 2 players to start
                        </p>
                    )}
                    <button
                        onClick={() => submitObscureRestart()}
                        disabled={!canStart}
                        className="btn-primary w-full text-2xl py-4 mt-4 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Play Again
                    </button>
                </div>
            ) : (
                <h2 className="text-2xl font-bold text-white mb-3 animate-pulse">
                    Waiting for host...
                </h2>
            )}
        </div>
    );
}
