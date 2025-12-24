
import { useRouter } from "next/navigation";
import { useGameContext } from '@/shared/GameContext';
import { GameModes } from "@/shared/types";

export default function Back(props: {inRoom: boolean}) {
    const router = useRouter();
    const { 
        host, 
        submitUpdateGameMode, 
    } = useGameContext();
    
    if (props.inRoom && !host) return <></>;

    return <button
        className="btn-primary absolute left-0 top-0 m-4 md:w-fit w-1/3 font-bold font-bartle"
            onClick={() => {
                if (props.inRoom && host) submitUpdateGameMode(GameModes.Default);
                else if (!props.inRoom && !host) router.push("/"); 
            }}
        >
        BACK
    </button>
}