import { useState } from "react";
import { useGameContext } from "@/shared/GameContext";
import { GameModes } from "@/shared/types";
import NameSelect from "./NameSelect";
import ChatWindow from "./ChatWindow";
import GameRules from "./GameRules";
import DefaultScreen from "./gamemodes/default/DefaultScreen";
import TriviaScreen from "./gamemodes/trivia/TriviaScreen";
import PeopleScreen from "./gamemodes/people/PeopleScreen";
import RotanikaScreen from "./gamemodes/rotanika/RotanikaScreen";
import PeopleBPScreen from "./gamemodes/peopleBP/PeopleBPScreen";

export default function GameScreen() {
    const { gamemode } = useGameContext();
    const [rulesOpen, setRulesOpen] = useState(false);

    const renderGamemodeScreen = () => {
        switch (gamemode) {
            case GameModes.Trivia:
                return <TriviaScreen />;
            case GameModes.PeopleGuesser:
                return <PeopleScreen />;
            case GameModes.Rotanika:
                return <RotanikaScreen />;
            case GameModes.PeopleBP:
                return <PeopleBPScreen />;
            case GameModes.Default:
            default:
                return <DefaultScreen />;
        }
    };

    return (
        <div>
            <NameSelect />
            <ChatWindow />
            {rulesOpen && <GameRules gamemode={gamemode} onClose={() => setRulesOpen(false)}/>}
            {gamemode !== GameModes.Default && <svg
                className="fixed right-10 top-0 m-4 cursor-pointer hover:opacity-80 transition-opacity z-2 bg-blue-950 rounded-4xl"
                onClick={() => setRulesOpen(true)}
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
                <path d="M12 16V12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="8" r="0.5" fill="white" stroke="white" strokeWidth="1.5"/>
                <title>Game Rules</title>
            </svg>}
            <div className="bg-stone-900 min-h-screen w-full">
                {renderGamemodeScreen()}
            </div>
        </div>
    );
}