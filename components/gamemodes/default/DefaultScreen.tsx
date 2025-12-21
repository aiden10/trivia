import { useGameContext } from "@/shared/GameContext";
import { GameModes } from "@/shared/types";
import PlayerList from "@/components/PlayerList";
import { useRouter } from "next/navigation";

export default function DefaultScreen() {
    const { host, submitUpdateGameMode } = useGameContext();
    const router = useRouter();

    const gamemodeOptions = [
        { 
            id: GameModes.Trivia, 
            name: "Trivia", 
            description: "Answer questions by typing your guess" 
        },
    ];

    return (
        <div className="flex flex-col items-center gap-6 p-4 min-h-screen">
            <svg 
                className="w-4 h-4 md:w-8 md:h-8 absolute left-0 top-0 m-2 md:m-4 hover:cursor-pointer hover:opacity-50"
                onClick={() => router.push('/')}
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 122.88 108.06"
            >
                <path d="M63.94,24.28a14.28,14.28,0,0,0-20.36-20L4.1,44.42a14.27,14.27,0,0,0,0,20l38.69,39.35a14.27,14.27,0,0,0,20.35-20L48.06,68.41l60.66-.29a14.27,14.27,0,1,0-.23-28.54l-59.85.28,15.3-15.58Z"/>
            </svg>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Select a Gamemode
            </h1>

            <div className="w-full max-w-2xl">
                <PlayerList />
            </div>

            <div className="w-full max-w-2xl mt-6">
                {host ? (
                    <div className="grid gap-4">
                        {gamemodeOptions.map((gm) => (
                            <button
                                key={gm.id}
                                onClick={() => submitUpdateGameMode(gm.id)}
                                className="btn-primary w-full py-6 flex flex-col items-center gap-2"
                            >
                                <span className="text-2xl font-bold">{gm.name}</span>
                                <span className="text-sm opacity-80">{gm.description}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white">
                            Waiting for host to select a gamemode...
                        </h2>
                    </div>
                )}
            </div>
        </div>
    );
}