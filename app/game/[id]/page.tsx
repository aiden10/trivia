
'use client'

import { GameProvider } from "@/shared/GameContext";
import GameScreen from "@/components/GameScreen";

export default function GamePage() {

    return (
        <GameProvider>
            <GameScreen />
        </GameProvider>
    );
}