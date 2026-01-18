export default function PeopleRules() {
    return (
        <div className="w-full bg-neutral-900 border-4 border-white p-6 md:p-10 font-inter">
            <p className="text-white/50 md:text-[24px] text-[16px] uppercase tracking-wide font-bartle mb-4">PeopleGuesser</p>
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">Rules</h1>

            <h2 className="text-white text-xl md:text-2xl font-semibold mb-4 border-b-2 border-white">
                Guess people based on the prompt to score.
            </h2>

            <p className="text-white/60 mb-2">Example Prompt</p>
            <div className="bg-black/40 border border-white/20 p-4 mb-4 bg-dots">
                <div className="flex items-center gap-2">
                    <span className="text-white border-2 border-white/60 p-2 text-center">Male</span>
                    <span className="text-white border-2 border-white/60 p-2 text-center">Actor</span>
                </div>
            </div>

            <h2 className="text-white text-xl md:text-2xl font-semibold mb-4 border-b-2 border-white">
                Guess as many valid people as you can before the timer runs out.
            </h2>

            <div className="bg-black/40 border border-white/20 p-4 mb-6 space-y-3 bg-dots">
                <div className="flex flex-col gap-2">
                    <p className="text-green-500">Leonardo DiCaprio ✓</p>
                    <p className="text-red-500">Leonardo Dicaprio X (invalid, was already guessed)</p>
                    <p className="text-green-500">Robert De Niro ✓</p>
                </div>
            </div>

            <h2 className="text-white text-xl md:text-2xl font-semibold mb-4 border-b-2 border-white">
                Scoring
            </h2>

            <ul className="text-white/80 space-y-2 list-disc list-inside mb-6">
                <li>10 points per correct person guessed</li>
                <li>The same person cannot be guessed more than once per game</li>
            </ul>

            <h2 className="text-white text-2xl md:text-4xl font-semibold max-w-[80%] py-2 border-t-2 border-white">
                The player who reaches the winning score first wins!
            </h2>
        </div>
    )
}