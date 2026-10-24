export default function ObscureRules() {
    return (
        <div className="w-full bg-neutral-900 border-4 border-white p-6 md:p-10 font-inter">
            <p className="text-white/50 md:text-[24px] text-[16px] uppercase tracking-wide font-bartle mb-4">Obscure</p>
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">Rules</h1>

            <h2 className="text-white text-xl md:text-2xl font-semibold mb-4 border-b-2 border-white">
                Find the least popular answer for a given prompt
            </h2>

            <p className="text-white/60 mb-2">Example Prompt</p>
            <div className="bg-black/40 border border-white/20 p-4 mb-4 bg-dots">
                <div className="flex items-center gap-2">
                    <span className="text-white border-2 border-white/60 p-2 text-center">Horror</span>
                    <span className="text-white border-2 border-white/60 p-2 text-center">Movie</span>
                </div>
            </div>

            <div className="bg-black/40 border border-white/20 p-4 mb-6 space-y-3 bg-dots">
                <div className="flex flex-col gap-2">
                    <p className="text-white/60">Search Wikidata for a Horror Movie...</p>
                    <p className="text-red-400">The Conjuring (popularity 64.1) - 0 points</p>
                    <p className="text-green-500">The Witch (popularity 21.7) +10 points</p>
                </div>
            </div>

            <h2 className="text-white text-xl md:text-2xl font-semibold mb-4 border-b-2 border-white">
                Popularity calculation
            </h2>

            <div className="bg-black/40 border border-white/20 p-4 mb-4">
                <p className="text-white font-mono text-sm md:text-base">
                    popularity = w<sub>1</sub> × sitelinks + w<sub>2</sub> × ln(page views + 1)
                </p>
                <p className="text-white/60 text-sm mt-2">
                    Page views are counted over the last 12 months.
                </p>
            </div>

            <h2 className="text-white text-md md:text-md font-semibold max-w-[80%] py-2 border-t-2 border-white">
                First player to the winning score wins.
            </h2>
            <h2 className="text-white text-md md:text-md font-semibold max-w-[80%] py-2 border-t-2 border-white">
                Requires at least 2 players.
            </h2>
        </div>
    )
}
