import React, { useState } from 'react';
import { ChatHistoryItem } from '@/app/lib/types';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'assistant';
    quickReplies?: string[];
}

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "你好！我是你的宝宝起名助手。你想先看看男宝宝名字、女宝宝名字，还是想要一些通用建议呢？",
            sender: 'assistant',
            quickReplies: ['男宝宝名字', '女宝宝名字', '随机推荐']
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const sendMessageToAPI = async (content: string) => {
        // Convert messages to ChatHistoryItem format
        const chatHistory: ChatHistoryItem[] = messages.map(msg => ({
            role: msg.sender,
            content: msg.text
        }));

        const response = await fetch('/api/v1/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chatContent: content,
                chatHistory: chatHistory
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get response from server');
        }

        const data = await response.json();
        
        const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: data.chatContent,
            sender: 'assistant',
            quickReplies: data.quickReplies
        };
        setMessages(prev => [...prev, assistantMessage]);
    };

    const handleSend = async () => {
        if (!inputText.trim() || isLoading) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user'
        };

        setMessages([...messages, newMessage]);
        setInputText('');
        setIsLoading(true);
        
        try {
            await sendMessageToAPI(inputText);
        } catch (error) {
            console.error('Failed to send message:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: '抱歉，发生了错误，请稍后再试。',
                sender: 'assistant'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickReply = async (reply: string) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            text: reply,
            sender: 'user'
        };

        setMessages(prev => [...prev, newMessage]);
        setIsLoading(true);
        
        try {
            await sendMessageToAPI(reply);
        } catch (error) {
            console.error('Failed to send message:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: '抱歉，发生了错误，请稍后再试。',
                sender: 'assistant'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-b from-blue-50 to-purple-50">
            {/* 聊天头部 */}
            <div className="bg-white shadow-sm p-4 flex items-center">
                <div className="flex-1">
                    <h1 className="text-xl font-semibold text-purple-700">宝宝起名助手</h1>
                    <p className="text-sm text-gray-500">为你的宝宝找个好名字</p>
                </div>
            </div>

            {/* 消息容器 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-4 ${
                            message.sender === 'user' 
                                ? 'bg-purple-600 text-white rounded-br-none' 
                                : 'bg-white shadow-md rounded-bl-none'
                        }`}>
                            <p className={message.sender === 'user' ? 'text-white' : 'text-gray-800'}>
                                {message.text}
                            </p>
                            {message.quickReplies && message.quickReplies.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {message.quickReplies.map((reply) => (
                                        <button
                                            key={reply}
                                            onClick={() => handleQuickReply(reply)}
                                            className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm hover:bg-purple-200 transition-colors"
                                        >
                                            {reply}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white shadow-md rounded-2xl p-4 rounded-bl-none">
                            <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 输入区域 */}
            <div className="bg-white p-4 shadow-lg">
                <div className="flex items-center gap-2 max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="输入你的想法..."
                        disabled={isLoading}
                        className="flex-1 rounded-full px-6 py-3 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading}
                        className="bg-purple-600 text-white rounded-full p-3 hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat; 