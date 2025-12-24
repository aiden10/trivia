import { useGameContext } from "@/shared/GameContext";
import { GamemodeOptions } from "@/shared/types";
import PlayerList from "@/components/PlayerList";
import Back from "@/components/Back";
export default function DefaultScreen() {
    const { host, submitUpdateGameMode } = useGameContext();

    return (
        <div className="flex flex-col items-center gap-6 min-h-screen bg-dots px-4 py-6 pt-24 md:pt-6">
            <Back inRoom={false}/>
            <h1 className="title font-bartle bg-dots">
                Gamemodes
            </h1>

            <div className="w-full max-w-2xl">
                <PlayerList />
            </div>

            <div className="w-full max-w-2xl mt-6 pb-6">
                {host ? (
                    <div className="grid gap-4">
                        {GamemodeOptions.map((gm) => (
                            <button
                                key={gm.id}
                                onClick={() => submitUpdateGameMode(gm.id)}
                                className="btn-primary w-full py-6 flex flex-col items-center gap-2"
                            >
                                <span className="text-2xl font-semibold">{gm.name}</span>
                                <span className="text-[16px] opacity-80 font-opensans font-light italic">{gm.description}</span>
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