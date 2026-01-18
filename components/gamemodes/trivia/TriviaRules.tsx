export default function TriviaRules() {
    return (
        <div className="w-full bg-neutral-900 border-4 border-white p-6 md:p-10 font-inter">
            <p className="text-white/50 text-xl uppercase tracking-wide font-bartle">Trivia</p>
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-8">Rules</h1>

            <h2 className="text-white text-xl md:text-2xl font-semibold mb-4 border-b-2 border-white">
                Answer questions to earn points.
            </h2>

            <p className="text-white/60 mb-2">Example Question</p>
            <div className="bg-black/40 border border-white/20 p-4 mb-4 bg-dots">
                <span className="text-white">What is the capital of France?</span>
            </div>

            <p className="text-white/60 text-sm mb-4">
                Questions can be text, images, or music.
            </p>

            <h2 className="text-white text-xl md:text-2xl font-semibold mb-4 border-b-2 border-white">
                Type your answer before the timer runs out.
            </h2>

            {/* Answer example */}
            <div className="bg-black/40 border border-white/20 p-4 mb-2 space-y-3 bg-dots">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-red-500 font-mono">+0</span>
                        <span className="text-red-400">London</span>
                    </div>
                    <span className="text-red-500 text-sm">WRONG</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-green-500 font-mono">+10</span>
                        <span className="text-green-400">Paris</span>
                    </div>
                    <span className="text-green-500 text-sm">CORRECT</span>
                </div>
            </div>
            <p className="text-sm text-white/60 mt-2">You have an unlimited amount of guesses until you get it.</p>
            <p className="text-sm text-white/60 mt-2 mb-6">But keep in mind other players can see your incorrect guesses!</p>

            <h2 className="text-white text-xl md:text-2xl font-semibold mb-4 border-b-2 border-white">
                Scoring
            </h2>

            <ul className="text-white/80 space-y-2 list-disc list-inside mb-6">
                <li>Text/Images: 10 points per correct answer</li>
                <li>Song Name/Artist: 5 points each</li>
            </ul>

            <h2 className="text-white text-2xl md:text-4xl font-semibold max-w-[80%] py-2 border-t-2 border-white">
                The player who reaches the winning score first wins!
            </h2>
        </div>
    )
}