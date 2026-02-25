import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";

interface ChatMessage {
    id: number;
    text: string;
    sender: "user" | "support";
    timestamp: Date;
}

const Help: React.FC = () => {

    const [showChat, setShowChat] = useState(false);

    const [chatInput, setChatInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    useEffect(() => {
        if (showChat && messages.length === 0) {
            setIsTyping(true);
            const timer = setTimeout(() => {
                setMessages([
                    {
                        id: 1,
                        text: "Hello! 👋 Welcome to support. How can I help you today?",
                        sender: "support",
                        timestamp: new Date(),
                    },
                ]);
                setIsTyping(false);
            }, 1000);
            return () => clearTimeout(timer);
        }
        if (showChat) {
            chatInputRef.current?.focus();
        }
    }, [showChat]);

    const handleSendMessage = () => {
        if (!chatInput.trim()) return;

        const userMsg: ChatMessage = {
            id: messages.length + 1,
            text: chatInput.trim(),
            sender: "user",
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setChatInput("");

        setIsTyping(true);
        setTimeout(() => {
            const replies = [
                "Thank you for reaching out! Let me look into that for you.",
                "I understand your concern. Our team will assist you shortly.",
                "That's a great question! Let me find the best answer for you.",
                "I've noted your query. A specialist will follow up with you soon.",
                "Thanks for your patience! We're working on resolving this.",
            ];
            const reply: ChatMessage = {
                id: messages.length + 2,
                text: replies[Math.floor(Math.random() * replies.length)],
                sender: "support",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, reply]);
            setIsTyping(false);
        }, 1500);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };






    return (
        <>
            {/* Header */}
            <div className="mb-[25px]">
                <h2 className="text-xl font-bold text-black dark:text-white mb-1">
                    Help & Support
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    Find answers to common questions and get support.
                </p>
            </div>

            {/* Contact Support Banner */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 mb-[25px] text-white">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <i className="material-symbols-outlined text-[28px]">support_agent</i>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-1 !text-white">Need More Help?</h3>
                            <p className="text-sm text-white/90">
                                Our support team is here to assist you 24/7
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowChat(true)}
                        className="bg-white text-primary-600 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-100 transition-all"
                    >
                        Contact Support
                    </button>
                </div>
            </div>

            {/* Contact Details */}
            <div className="mb-[25px]">
                <div className="flex flex-col gap-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center shrink-0">
                            <i className="material-symbols-outlined text-primary-600 dark:text-primary-400 text-[20px]">location_on</i>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-black dark:text-white mb-1">Address:</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                Delhi, India
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center shrink-0">
                            <i className="material-symbols-outlined text-primary-600 dark:text-primary-400 text-[20px]">call</i>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-black dark:text-white mb-1">Phone:</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                +91-129-491-4295
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center shrink-0">
                            <i className="material-symbols-outlined text-primary-600 dark:text-primary-400 text-[20px]">mail</i>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-black dark:text-white mb-1">Email:</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                trigreexam123@gmail.com
                            </p>
                        </div>
                    </div>
                </div>
            </div>


            {/* Chat Support Widget - rendered via Portal to bypass parent transform */}
            {showChat && ReactDOM.createPortal(
                <div
                    className="fixed bottom-6 right-6 z-50 flex flex-col w-[calc(100%-3rem)] md:w-[380px] h-[520px] max-h-[calc(100vh-6rem)] rounded-2xl overflow-hidden shadow-2xl"
                    style={{
                        animation: "chatSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.06)",
                    }}
                >
                    {/* Chat Header */}
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-4 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                    <i className="material-symbols-outlined text-white text-[22px]">support_agent</i>
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-primary-500"></div>
                            </div>
                            <div>
                                <h4 className="text-lg font-bold mb-1 !text-white">Support Team</h4>
                                <p className="text-white/70 text-xs">Online • Typically replies instantly</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowChat(false)}
                            className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                        >
                            <i className="material-symbols-outlined text-[22px]">close</i>
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#080f1f]" style={{ scrollbarWidth: "thin" }}>
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div className={`flex items-end gap-2 max-w-[85%] ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                                    {msg.sender === "support" && (
                                        <div className="w-7 h-7 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center shrink-0 mb-5">
                                            <i className="material-symbols-outlined text-primary-600 dark:text-primary-400 text-[14px]">support_agent</i>
                                        </div>
                                    )}
                                    <div>
                                        <div
                                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.sender === "user"
                                                ? "bg-primary-500 text-white rounded-br-md"
                                                : "bg-white dark:bg-[#0c1427] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-[#172036] rounded-bl-md"
                                                }`}
                                        >
                                            {msg.text}
                                        </div>
                                        <p className={`text-[10px] text-gray-400 mt-1 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                                            {formatTime(msg.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="flex items-end gap-2">
                                <div className="w-7 h-7 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center shrink-0">
                                    <i className="material-symbols-outlined text-primary-600 dark:text-primary-400 text-[14px]">support_agent</i>
                                </div>
                                <div className="bg-white dark:bg-[#0c1427] border border-gray-100 dark:border-[#172036] px-4 py-3 rounded-2xl rounded-bl-md">
                                    <div className="flex gap-1.5">
                                        <span className="w-2 h-2 bg-gray-300 dark:bg-gray-500 rounded-full" style={{ animation: "typingDot 1.4s infinite ease-in-out", animationDelay: "0s" }}></span>
                                        <span className="w-2 h-2 bg-gray-300 dark:bg-gray-500 rounded-full" style={{ animation: "typingDot 1.4s infinite ease-in-out", animationDelay: "0.2s" }}></span>
                                        <span className="w-2 h-2 bg-gray-300 dark:bg-gray-500 rounded-full" style={{ animation: "typingDot 1.4s infinite ease-in-out", animationDelay: "0.4s" }}></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="bg-white dark:bg-[#0c1427] border-t border-gray-100 dark:border-[#172036] px-4 py-3 shrink-0">
                        <div className="flex items-center gap-2">
                            <input
                                ref={chatInputRef}
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                placeholder="Type your message..."
                                className="flex-1 bg-gray-50 dark:bg-[#080f1f] text-sm text-black dark:text-white px-4 py-2.5 rounded-full outline-none border border-gray-100 dark:border-[#172036] focus:border-primary-400 transition-all placeholder:text-gray-400"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!chatInput.trim()}
                                className="w-10 h-10 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-all shrink-0"
                            >
                                <i className="material-symbols-outlined text-[20px]">send</i>
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 text-center mt-2">
                            Powered by Support Team • Available 24/7
                        </p>
                    </div>
                </div>,
                document.body
            )}



            {/* CSS Animations */}
            <style>{`
                @keyframes chatSlideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                @keyframes typingDot {
                    0%, 60%, 100% {
                        transform: translateY(0);
                        opacity: 0.4;
                    }
                    30% {
                        transform: translateY(-4px);
                        opacity: 1;
                    }
                }
            `}</style>
        </>
    );
};

export default Help;