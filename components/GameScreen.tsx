
import { useGameContext } from "@/shared/GameContext"
import { Stages } from "@/shared/types";
import Lobby from "./stages/Lobby/Lobby";
import QuestionDisplay from "./stages/QuestionDisplay/QuestionDisplay";
import Reveal from "./stages/Reveal/Reveal";
import Results from "./stages/Results/Results";
import NameSelect from "./NameSelect";

export default function GameScreen() {
    const { stage } = useGameContext();

return <div>
        <NameSelect/>
        <div className="bg-indigo-700 min-h-screen w-full p-4 gap-y-5 flex flex-col">
            {stage == Stages.Lobby && <Lobby />}
            {stage == Stages.QuestionDisplay && <QuestionDisplay />}
            {stage == Stages.Reveal && <Reveal />}
            {stage == Stages.Results && <Results />}
        </div>
    </div>
}