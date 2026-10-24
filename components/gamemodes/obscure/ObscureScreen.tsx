import { useGameContext } from "@/shared/GameContext";
import { ObscureStages } from "@/shared/types";
import Lobby from "./stages/Lobby";
import PromptDisplay from "./stages/PromptDisplay";
import Submitting from "./stages/Submitting";
import Reveal from "./stages/Reveal";
import Results from "./stages/Results";

export default function ObscureScreen() {
    const { roomState } = useGameContext();

    const currentStage = roomState?.obscureState?.currentStage ?? ObscureStages.Lobby;

    return (
        <>
            {currentStage === ObscureStages.Lobby && <Lobby />}
            {currentStage === ObscureStages.PromptDisplay && <PromptDisplay />}
            {currentStage === ObscureStages.Submitting && <Submitting />}
            {currentStage === ObscureStages.Reveal && <Reveal />}
            {currentStage === ObscureStages.Results && <Results />}
        </>
    );
}
