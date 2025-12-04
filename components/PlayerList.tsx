import { useGameContext } from "@/shared/GameContext";

export default function PlayerList() {
    const { players } = useGameContext();
    
    const sortedPlayers = [...players].sort((a, b) => {
        if (a.score < b.score) return 1;
        if (a.score > b.score) return -1;
        return 0;
    });

    return (
        <div className="flex-col bg-blue-600 rounded-md text-shadow-[0_0.9px_0.9px_rgba(0,0,0,0.7)] border-black border-4">
            {sortedPlayers.map((player, index) => (
                <div key={index} className=" flex flex-row justify-between items-center py-2 px-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[24px] font-bold text-black">#{index + 1}</span>
                        <h2 className="text-[24px] text-cyan-100 ml-2">{player.playerName}</h2>
                    </div>
                    <h1 className="text-[24px] font-bold text-sky-600 md:ml-5">{player.score}</h1>
                </div>
            ))}
        </div>
    );
}