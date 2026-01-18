export default function RotanikaRules() {
    return (
        <div className="w-full bg-neutral-900 border-4 border-white p-6 md:p-10 font-inter">
            <p className="text-white/50 text-4xl uppercase tracking-wide font-bartle">20Q</p>
            <a href="https://en.wikipedia.org/wiki/Twenty_questions" target="_blank" className="text-blue-300/60 text-sm mb-8 hover:border-b-2
                 border-blue-500 transition-all duration-100 hover:opacity-85">
                (twenty questions)
            </a>
            <h1 className="text-white text-4xl md:text-5xl font-bold my-4">Rules</h1>

            <h2 className="text-white text-xl md:text-2xl font-semibold mb-4 border-b-2 border-white">
                A player (picker) chooses a secret thing or person.
            </h2>

            <p className="text-white/60 text-sm mb-4">
                Other players then take turns asking the picker yes/no questions.
            </p>

            <h2 className="text-white text-xl md:text-2xl font-semibold mb-4 border-b-2 border-white">
                Deciding Questions
            </h2>

            <p className="text-white/60 text-sm mb-4">
                When a guesser thinks they know the secret, they can ask a deciding question.
            </p>
            <p className="text-white/60 text-sm mb-4">
                If the deciding question is correct, the game ends, otherwise it continues.
            </p>

            <h2 className="text-white text-xl md:text-2xl font-semibold mb-4 border-b-2 border-white">
                Winning
            </h2>
            <p className="text-white/60 text-sm mb-2">
                If guessers guess the secret before the max number of questions are asked, they win
            </p>
            <p className="text-white/60 text-sm">
                If the guessers fail to guess the secret, the picker wins
            </p>
        </div>
    )
}