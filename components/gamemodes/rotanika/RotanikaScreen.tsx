import { useGameContext } from "@/shared/GameContext";
import { RotanikaStages } from "@/shared/types";
import Lobby from "./stages/Lobby";
import Picking from "./stages/Picking";
import GuessingPeriod from "./stages/GuessingPeriod";
import Results from "./stages/Results";

export default function RotanikaScreen() {
    const { roomState } = useGameContext();
    
    const currentStage = roomState?.rotanikaState?.currentStage ?? RotanikaStages.Lobby;

    return (
        <>
            {currentStage === RotanikaStages.Lobby && <Lobby />}
            {currentStage === RotanikaStages.Picking && <Picking />}
            {currentStage === RotanikaStages.GuessingPeriod && <GuessingPeriod />}
            {currentStage === RotanikaStages.Results && <Results />}
        </>
    );
}