import { useEffect, useMemo, useState, useRef } from "react";
import { useGameContext } from "@/shared/GameContext";
import type { Message } from "@/shared/types";

export default function ChatWindow() {
    const [isOpen, setOpen] = useState(false);
    const [messageText, setMessageText] = useState("");
    const { submitMessage, name, roomState } = useGameContext();
    const chatRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const messages = useMemo(() => roomState?.messages ?? [], [roomState?.messages]);
    const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
    const [unread, setUnread] = useState<boolean>(false);
    const [lastMessageCount, setLastMessageCount] = useState<number>(0);

    useEffect(() => {
        if (isOpen) {
            setUnread(false);
            setLastMessageCount(messages.length);
        } else if (messages.length > lastMessageCount) {
            setUnread(true);
        }
    }, [messages.length, isOpen, lastMessageCount]);

    useEffect(() => {
        setPendingMessages(prev => prev.filter(pending =>
            !messages.some(message =>
                !message.system
                && message.sender === pending.sender
                && message.body === pending.body
            )
        ));
    }, [messages]);

    useEffect(() => {
        if (!isOpen) return;
        const element = scrollRef.current;
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    }, [messages.length, pendingMessages.length, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (chatRef.current && !chatRef.current.contains(event.target as Node) && isOpen) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const body = messageText.trim();
        if (!body) return;
        setPendingMessages(prev => [...prev, { sender: name, body }]);
        submitMessage(name, body);
        setMessageText("");
    };

    return (
        <div ref={chatRef} className={`${isOpen ? 'translate-x-0' : 'md:translate-x-[90%] translate-x-[85%]'} 
            fixed right-0 top-0 h-screen flex items-end transition-transform duration-300 z-5`}>
            
            {/* Toggle Button */}
            <button 
                onClick={() => setOpen(!isOpen)}
                aria-label={isOpen ? "Close chat" : "Open chat"}
                title={isOpen ? "Close chat" : "Open chat"}
                className="self-end mb-4 bg-stone-900 p-2 hover:cursor-pointer flex flex-col items-center gap-2
                    rounded-l-lg hover:bg-stone-600 transition-colors border-l-2 border-y-2 border-white/75">
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={2} 
                    stroke="white" 
                    className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                <svg 
                    viewBox="0 0 10 10" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-2 h-2">
                    <circle 
                        cx="5" 
                        cy="5" 
                        r="5" 
                        fill={unread ? "#ef4444" : "rgba(255, 255, 255, 0.25)"} 
                    />
                </svg>
            </button>

            {/* Chat Panel */}
            <div className="w-[50vw] md:w-[25vw] h-[60%] md:h-full bg-stone-900 shadow-xl border-b-4 md:border-b-0 border-l-4 border-white/75
                flex flex-col">
                
                <div className="border-white/75 border-b-2 bg-stone-950 bg-lines">
                    <h2 className="title font-inter ml-2 mb-0 bg-black/0">Messages</h2>
                </div>
                
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2">
                    {messages?.map((message, i) => (
                        message.system ? (
                            <div
                                key={i}
                                className="py-2 my-1 border-y border-white/10 text-center"
                            >
                                <p className="text-amber-200/60 text-[11px] md:text-[13px] font-inter uppercase tracking-wide">
                                    {message.body}
                                </p>
                            </div>
                        ) : (
                            <div
                                className="flex gap-2 py-2 min-w-0 border-b-2 border-stone-700/50"
                                key={i}>
                                <p className="font-bold text-[12px] md:text-[16px] font-inter text-white/90 whitespace-nowrap">
                                    {message.sender}:
                                </p>
                                <p className="text-white/75 text-[12px] md:text-[16px] font-light break-words font-inter flex-1 min-w-0">
                                    {message.body}
                                </p>
                            </div>
                        )
                    ))}
                    {pendingMessages.map((message, i) => (
                        <div
                            className="flex gap-2 py-2 min-w-0 border-b-2 border-stone-700/50 opacity-50"
                            key={`pending-${i}`}
                        >
                            <p className="font-bold text-[12px] md:text-[16px] font-inter text-white/90 whitespace-nowrap">
                                {message.sender}:
                            </p>
                            <p className="text-white/75 text-[12px] md:text-[16px] font-light break-words font-inter flex-1 min-w-0">
                                {message.body}
                            </p>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleSubmit} className="p-2">
                    <input 
                        type="text" 
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        placeholder="Say something..."
                        className="input-primary font-inter text-[16px] w-full"
                    />
                </form>            
            </div>
        </div>
    );
}