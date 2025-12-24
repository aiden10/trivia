import { useGameContext } from "@/shared/GameContext";
import { GameModes } from "@/shared/types";
import NameSelect from "./NameSelect";
import DefaultScreen from "./gamemodes/default/DefaultScreen";
import TriviaScreen from "./gamemodes/trivia/TriviaScreen";
import PeopleScreen from "./gamemodes/people/PeopleScreen";

export default function GameScreen() {
    const { gamemode } = useGameContext();

    const renderGamemodeScreen = () => {
        switch (gamemode) {
            case GameModes.Trivia:
                return <TriviaScreen />;
            case GameModes.PeopleGuesser:
                return <PeopleScreen />;
            case GameModes.Default:
            default:
                return <DefaultScreen />;
        }
    };

    return (
        <div>
            <NameSelect />
            <div className="bg-stone-900 min-h-screen w-full">
                {renderGamemodeScreen()}
            </div>
        </div>
    );
}