import { useGameContext } from "@/shared/GameContext";
import { PeopleBPStages } from "@/shared/types";
import Lobby from "./stages/Lobby";
import Game from "./stages/Game";
import Results from "./stages/Results";

export default function PeopleBPScreen() {
    const { roomState } = useGameContext();
    
    const currentStage = roomState?.peopleBPState?.currentStage ?? PeopleBPStages.Lobby;
    return (
        <>
            {currentStage === PeopleBPStages.Lobby && <Lobby />}
            {currentStage === PeopleBPStages.Game && <Game />}
            {currentStage === PeopleBPStages.Results && <Results />}
        </>
    );
}