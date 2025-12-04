
'use client'

import { GameProvider } from '@/shared/GameContext';
import Home from '@/components/stages/Home/Home';

export default function App() {

    return <GameProvider>
        <Home/>
    </GameProvider>
}