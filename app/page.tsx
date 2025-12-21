
'use client'

import { GameProvider } from '@/shared/GameContext';
import Home from '@/components/gamemodes/default/Home';

export default function App() {

    return <GameProvider>
        <Home/>
    </GameProvider>
}