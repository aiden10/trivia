import { useGameContext } from '@/shared/GameContext';

interface OptionProps {
    option: string;
    canGuess: boolean;
    setCanGuess: (value: boolean) => void;
    setFeedback: (feedback: 'correct' | 'incorrect' | null) => void;
}

export default function Option({ option, canGuess, setCanGuess, setFeedback }: OptionProps) {
    const { question, playerID, setPlayers, submitCorrectAnswer } = useGameContext();

    const handleGuess = () => {
        if (!canGuess || !question) return;
        setCanGuess(false);

        const isCorrect = option.toLowerCase() === question.answer.toLowerCase();
        
        if (isCorrect) {
            setFeedback('correct');
            setPlayers(prev => {
                return prev.map(player => {
                    if (player.playerID === playerID) {
                        return {
                            ...player,
                            guessedCorrectly: true
                        };
                    }
                    return player;
                });
            });
            submitCorrectAnswer();
        } else {
            setFeedback('incorrect');
        }
    };

    return <button
        className='btn-primary h-full w-full disabled:cursor-not-allowed 
        disabled:hover:opacity-75 disabled:opacity-50'
        disabled={!canGuess}
        onClick={handleGuess}>
        {option}
    </button>
}