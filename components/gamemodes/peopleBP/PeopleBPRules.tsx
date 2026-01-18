export default function PeopleBPRules() {
    return (
        <div className="w-full bg-neutral-900 border-4 border-white p-6 md:p-10 font-inter">
            <p className="text-white/50 md:text-[24px] text-[16px] uppercase tracking-wide font-bartle mb-4">PeopleGuesser: Bomb Party</p>
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">Rules</h1>

            <h2 className="text-white text-xl md:text-2xl font-semibold mb-2 border-b-2 border-white">
                Setup
            </h2>
            <div className="text-white/60 text-sm space-y-2 mb-4">
                <p>Each player starts with lives</p>
                <p>A random prompt is shown on each player's turn</p>
                <p>A player's turn lasts for a random amount of time (exact range set by host)</p>
            </div>

            <h2 className="text-white text-xl md:text-2xl font-semibold mb-4 border-b-2 border-white">
                Guess people based on the prompt on your turn.
            </h2>

            <p className="text-white/60 mb-2">Example Prompt</p>
            <div className="bg-black/40 border border-white/20 p-4 mb-4 bg-dots">
                <div className="flex items-center gap-2">
                    <span className="text-white border-2 border-white/60 p-2 text-center">Male</span>
                    <span className="text-white border-2 border-white/60 p-2 text-center">Actor</span>
                </div>
            </div>

            <h2 className="text-white text-xl md:text-2xl font-semibold mb-4 border-b-2 border-white">
                Guess a valid person before the timer runs out.
            </h2>

            <div className="bg-black/40 border border-white/20 p-4 space-y-3 bg-dots">
                <div className="flex flex-col gap-2">
                    <p className="text-green-500">Leonardo DiCaprio ✓</p>
                </div>
            </div>
            <p className="text-sm text-white/60 mt-2 mb-6">Failing to do so results in the loss of a life.</p>

            <h2 className="text-white text-2xl md:text-4xl font-semibold max-w-[80%] py-2 border-t-2 border-white">
                The last player alive wins!
            </h2>
        </div>
    )
}