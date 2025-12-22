import { useGameContext } from "@/shared/GameContext";
import { PeopleStages } from "@/shared/types";
import Lobby from "./stages/Lobby";
import GuessingPeriod from "./stages/GuessingPeriod";
import PropertiesDisplay from "./stages/PropertiesDisplay";
import Results from "./stages/Results";

export default function PeopleScreen() {
    const { roomState } = useGameContext();
    
    const currentStage = roomState?.peopleState?.currentStage ?? PeopleStages.Lobby;
    return (
        <>
            {currentStage === PeopleStages.Lobby && <Lobby />}
            {currentStage === PeopleStages.PropertiesDisplay && <PropertiesDisplay />}
            {currentStage === PeopleStages.GuessingPeriod && <GuessingPeriod />}
            {currentStage === PeopleStages.Results && <Results />}
        </>
    );
}