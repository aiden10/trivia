import { GameModes } from "@/shared/types"
import TriviaRules from "./gamemodes/trivia/TriviaRules"
import RotanikaRules from "./gamemodes/rotanika/RotanikaRules"
import PeopleRules from "./gamemodes/people/PeopleRules"
import PeopleBPRules from "./gamemodes/peopleBP/PeopleBPRules"
import { useRef, useEffect } from "react"

export default function GameRules({ gamemode, onClose }: { gamemode: GameModes, onClose: () => void }) {
    const modalRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);
    
    if (gamemode === GameModes.Default) return;

    return (
        <div className="inset-0 bg-black/70 fixed z-10 flex items-center justify-center p-4">
            <div ref={modalRef} className="w-full max-w-2xl max-h-[80%] md:max-h-[90vh] overflow-y-auto">
                {gamemode === GameModes.Trivia && <TriviaRules />}
                {gamemode === GameModes.PeopleGuesser && <PeopleRules />}
                {gamemode === GameModes.Rotanika && <RotanikaRules />}
                {gamemode === GameModes.PeopleBP && <PeopleBPRules />}
            </div>
        </div>
    )
}