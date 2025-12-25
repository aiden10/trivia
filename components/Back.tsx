
import { useGameContext } from '@/shared/GameContext';
import { GameModes } from "@/shared/types";
import { useEffect, useState } from "react";

export default function Back(props: {inRoom: boolean}) {
    const [text, setText] = useState("BACK");
    const { 
        host, 
        submitUpdateGameMode, 
    } = useGameContext();
    useEffect(() => {
        if (!props.inRoom) {
            setText("EXIT");
        }
    }, [props.inRoom]);
    if (props.inRoom && !host) return <></>;

    return <button
        className="btn-primary absolute left-0 top-0 m-4 md:w-fit w-1/3 font-bold font-bartle"
            onClick={() => {
                if (props.inRoom && host) submitUpdateGameMode(GameModes.Default);
                else if (!props.inRoom) window.location.href = '/';
            }}
        >
        {text}
    </button>
}