'use client'

import { useEffect, useRef } from "react";
import { useGameContext } from "@/shared/GameContext";
import { ObscureStages } from "@/shared/types";

const PROMPT_DISPLAY_DURATION = 2500;

export default function PromptDisplay() {
    const {
        host,
        roomState,
        submitObscureUpdateStage,
    } = useGameContext();

    const submitStageRef = useRef(submitObscureUpdateStage);
    submitStageRef.current = submitObscureUpdateStage;

    const obscureState = roomState?.obscureState;
    const prompt = obscureState?.currentPrompt;

    useEffect(() => {
        if (!host) return;

        const timeout = setTimeout(() => {
            submitStageRef.current(ObscureStages.Submitting);
        }, PROMPT_DISPLAY_DURATION);

        return () => clearTimeout(timeout);
    }, [host]);

    if (!prompt) {
        return (
            <div className="w-full flex flex-col min-h-screen gap-y-8 p-4 bg-lines items-center justify-center">
                <p className="text-white/70 font-inter animate-pulse">Loading prompt...</p>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col min-h-screen gap-y-8 p-4 bg-lines items-center justify-center">
            <div className="w-full max-w-6xl bg-neutral-900 border-4 border-white p-8 md:p-12 bg-dots">
                <h1 className="text-white text-center font-bartle text-[32px] md:text-[64px] leading-tight uppercase break-words">
                    {prompt.text}
                </h1>
            </div>
        </div>
    );
}
