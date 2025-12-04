import { useGameContext } from '@/shared/GameContext';

interface OptionProps {
    option: string;
    canGuess: boolean;
    setCanGuess: (value: boolean) => void;
}

export default function Option({ option, canGuess, setCanGuess }: OptionProps) {
    const { question, playerID, setPlayers, submitCorrectAnswer } = useGameContext();

    const handleGuess = () => {
        if (!canGuess || !question) return;
        setCanGuess(false);

        const isCorrect = option.toLowerCase() === question.answer.toLowerCase();
        if (isCorrect) {
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
        }
    };

    return <button
        className='hover:opacity-75 hover:cursor-pointer p-3 disabled:cursor-not-allowed disabled:opacity-50 bg-amber-50'
        disabled={!canGuess}
        onClick={handleGuess}>
        {option}
    </button>
}