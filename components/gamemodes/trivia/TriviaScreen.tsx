import { useGameContext } from "@/shared/GameContext";
import { TriviaStages } from "@/shared/types";
import Lobby from "./stages/Lobby";
import QuestionDisplay from "./stages/QuestionDisplay";
import Reveal from "./stages/Reveal";
import Results from "./stages/Results";

export default function TriviaScreen() {
    const { roomState } = useGameContext();
    
    const currentStage = roomState?.triviaState?.currentStage ?? TriviaStages.Lobby;

    return (
        <>
            {currentStage === TriviaStages.Lobby && <Lobby />}
            {currentStage === TriviaStages.QuestionDisplay && <QuestionDisplay />}
            {currentStage === TriviaStages.Reveal && <Reveal />}
            {currentStage === TriviaStages.Results && <Results />}
        </>
    );
}