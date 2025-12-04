import { useGameContext } from "@/shared/GameContext"
import { Stages } from "@/shared/types";
import { useState } from "react";

export default function Lobby() {
    const { 
        host, 
        setQuestionDuration, 
        setWinningScore, 
        submitUpdateDifficulties, 
        submitUpdateStage, 
        submitUpdateQuestionDuration 
    } = useGameContext();

    const [easy, setEasy] = useState(true);
    const [medium, setMedium] = useState(true);
    const [hard, setHard] = useState(true);

    const handleWinningScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value)) {
            setWinningScore(value);
        }
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value)) {
            setQuestionDuration(value);
            submitUpdateQuestionDuration(value);
        }
    };

    return <div>
        <button
            onClick={() => submitUpdateStage(Stages.QuestionDisplay)}    
        >
            Start Game
        </button>
        <label>
            Winning Score:
            <input
                type="number"
                min="5"
                max="9999"
                placeholder="150"
                step={5}
                onChange={handleWinningScoreChange}
                disabled={!host}
            />
        </label>

        <label>
            Question Duration (seconds):
            <input
                type="number"
                min="3"
                max="120"
                placeholder="30"
                step={5}
                onChange={handleDurationChange}
                disabled={!host}
            />
        </label>

        <div>
            <label>
                <input
                    type="checkbox"
                    checked={easy}
                    onChange={(e) => {
                        setEasy(e.target.checked);
                        submitUpdateDifficulties(e.target.checked, medium, hard);
                    }}
                    disabled={!host}
                />
                Easy
            </label>

            <label>
                <input
                    type="checkbox"
                    checked={medium}
                    onChange={(e) => {
                        setMedium(e.target.checked);
                        submitUpdateDifficulties(easy, e.target.checked, hard);
                    }}
                    disabled={!host}
                />
                Medium
            </label>

            <label>
                <input
                    type="checkbox"
                    checked={hard}
                    onChange={(e) => {
                        setHard(e.target.checked);
                        submitUpdateDifficulties(easy, medium, e.target.checked);
                    }}
                    disabled={!host}
                />
                Hard
            </label>
        </div>
        <p>easy questions: 5 points</p>
        <p>medium questions: 10 points</p>
        <p>hard questions: 15 points</p>
    </div>
}