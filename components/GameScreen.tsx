import { useGameContext } from "@/shared/GameContext";
import { GameModes } from "@/shared/types";
import NameSelect from "./NameSelect";
import DefaultScreen from "./gamemodes/default/DefaultScreen";
import TriviaScreen from "./gamemodes/trivia/TriviaScreen";

export default function GameScreen() {
    const { gamemode } = useGameContext();

    const renderGamemodeScreen = () => {
        switch (gamemode) {
            case GameModes.Trivia:
                return <TriviaScreen />;
            case GameModes.Default:
            default:
                return <DefaultScreen />;
        }
    };

    return (
        <div>
            <NameSelect />
            <div className="bg-indigo-700 min-h-screen w-full p-4">
                {renderGamemodeScreen()}
            </div>
        </div>
    );
}