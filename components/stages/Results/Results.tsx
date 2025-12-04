
'use client'

import { useGameContext } from "@/shared/GameContext";
import Leaderboard from "./Leaderboard";

export default function ResultsStage() {
    const { host, submitRestart, submitUpdateDifficulties } = useGameContext();

    return <div className="flex flex-col gap-y-10">
        <Leaderboard/>
        <div className={`flex flex-row ${host? "visible" : "invisible"} md:gap-x-5 gap-x-2 items-center md:max-w-1/2`}>
            <button className="p-1 hover:cursor-pointer hover:opacity-75 bg-blue-600 border-4 rounded-md md:text-[24px]"
                onClick={() => submitRestart(true, true, true)}
            >
                New Game
            </button>
            <p className="md:text-[24px] p-1">easy:</p>
            <p className="md:text-[24px] p-1">medium:</p>
            <p className="md:text-[24px] p-1">hard:</p>
        </div>
    </div>
}