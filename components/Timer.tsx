export default function Timer({ remainingTime, duration }: { remainingTime: number; duration: number }) {
    const progressPercentage = (remainingTime / duration) * 100;

    return (
        <div className='flex flex-col items-center w-full max-w-8xl gap-2 bg-neutral-900 bg-dots p-4 border-white border-2'>
            <p className='text-white text-2xl font-bartle'>{remainingTime} s</p>
            <div className='w-full h-1 bg-black overflow-hidden'>
                <div 
                    className='h-full bg-white transition-all duration-100 ease-linear'
                    style={{ width: `${progressPercentage}%` }}
                />
            </div>
        </div>
    );
}