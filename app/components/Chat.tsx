import React, { useState, Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatHistoryItem, Role } from '@/app/lib/types';
import { trackMessage, trackQuickReply } from '@/app/utils/analytics';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import NameRecommendations from './NameRecommendations';
import NameCard from './NameCard';
import VersionDisplay from './VersionDisplay';
import { useVersion } from '@/app/hooks/useVersion';

interface Message {
    id: string;
    text: string;
    sender: Role;
    quickReplies?: string[];
}

const initialMessageOptions = [
    {
        text: "有时候给孩子或者自己取个英文名，感觉比写论文还难 😅 你现在是想帮谁起名字呢？",
        quickReplies: [
            '给宝宝起名',
            '给朋友起名',
            '给自己起名',
            '给学生起名'
        ]
    },
    {
        text: "你希望这个名字传达什么感觉？✨ 比如有寓意、有文化感，还是念出来就很顺耳那种？",
        quickReplies: [
            '有寓意的名字',
            '发音好听',
            '不要太常见',
            '像某部电影角色'
        ]
    },
    {
        text: "名字这种东西，选好了是加分神器，选不好...可能一辈子都在纠正发音 🙈 你现在有点想法了吗？",
        quickReplies: [
            '我有点想法',
            '不知道从哪开始',
            '先给我点灵感',
            '我想听听你的建议'
        ]
    },
    {
        text: "如果你在为一个特别的人取名，我懂这份纠结 🫶 我们可以慢慢聊，一起找点灵感。",
        quickReplies: [
            '好的，慢慢来',
            '我希望名字特别',
            '不希望撞名',
            '我想让名字有故事感'
        ]
    },
    {
        text: "想起一个既特别又不出戏的英文名其实挺难的…不过我们一起慢慢来，别怕取名压力山大 🧠💡",
        quickReplies: [
            '风格偏好',
            '跟中文名有关',
            '取名场景',
            '随便聊聊试试看'
        ]
    }
];


const Chat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [hasRecommendations, setHasRecommendations] = useState(false);
    const [selectedNameInfo, setSelectedNameInfo] = useState<{
        name: string;
        meaning: string;
        styleTags: string[];
    } | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const version = useVersion();

    // Initialize chat with backend
    React.useEffect(() => {
        const initializeChat = async () => {
            try {
                const response = await fetch('/api/v1/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        chatContent: '',
                        chatHistory: []
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to initialize chat');
                }

                const data = await response.json();
                const initialMessage: Message = {
                    id: '1',
                    text: data.chatContent,
                    sender: 'assistant',
                    quickReplies: data.quickReplies
                };
                setMessages([initialMessage]);

                // Update URL with variant if present
                if (data.variant !== undefined) {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('variant', data.variant.toString());
                    router.push(`/?${params.toString()}`);
                }

                if (data.recommendations && data.hasRecommendations) {
                    setRecommendations(data.recommendations);
                    setHasRecommendations(true);
                } else {
                    setHasRecommendations(false);
                }
            } catch (error) {
                console.error('Failed to initialize chat:', error);
            }
        };

        initializeChat();
    }, [router, searchParams]);

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

        if (data.recommendations && data.hasRecommendations) {
            setRecommendations(data.recommendations);
            setHasRecommendations(true);
        } else {
            setHasRecommendations(false);
        }
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

        // Track user message
        trackMessage(inputText, 'user_message', version);

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

        // Track quick reply selection
        trackQuickReply(reply, version);

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

    const handleSelectName = async (name: string, index: number) => {
        try {
            // 添加调试日志
            console.log("Selected name:", name, "at index:", index);
            console.log("Available recommendations:", recommendations);

            // 安全获取名字信息
            if (!recommendations || recommendations.length === 0 || !recommendations[index]) {
                console.error("No recommendation found at index", index);
                // 使用备用数据
                setSelectedNameInfo({
                    name: name,
                    meaning: "这个名字有着独特的含义和历史",
                    styleTags: ["优雅", "独特", "有内涵"]
                });
            } else {
                // 从推荐中获取名字的详细信息
                const nameInfo = recommendations[index];
                console.log("Selected name info:", nameInfo);

                // 增强型数据获取
                const enhancedStyleTags = nameInfo.styleTags ||
                                        (nameInfo.description ?
                                            ["优雅", "个性", "国际化"] :
                                            []);

                // 保存用户选择的名字信息以显示命名卡片
                setSelectedNameInfo({
                    name: nameInfo.name,
                    meaning: nameInfo.meaning || nameInfo.description || `${name} 是一个非常有魅力的名字`,
                    styleTags: enhancedStyleTags
                });
            }

            // 继续现有的代码 - 向API发送消息等
            const message = `我选择 ${name} 这个名字，请详细解释一下它的含义、历史和适用场景。`;

            const newMessage: Message = {
                id: Date.now().toString(),
                text: message,
                sender: 'user'
            };

            setMessages(prev => [...prev, newMessage]);
            setIsLoading(true);

            // 清除推荐，因为用户已经做出选择
            setHasRecommendations(false);

            try {
                await sendMessageToAPI(message);
            } catch (error) {
                console.error('Failed to send name selection:', error);
                const errorMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    text: '抱歉，发生了错误，请稍后再试。',
                    sender: 'assistant'
                };
                setMessages(prev => [...prev, errorMessage]);
            } finally {
                setIsLoading(false);
            }
        } catch (err) {
            console.error("Error in handleSelectName:", err);
            // 使用备用数据确保卡片仍然显示
            setSelectedNameInfo({
                name: name,
                meaning: "一个美丽而有意义的名字",
                styleTags: ["优雅", "独特"]
            });
        }
    };

    const closeNameCard = () => {
        setSelectedNameInfo(null);
    };

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="flex flex-col h-[100dvh] bg-gradient-to-b from-blue-50 to-purple-50">
                {/* 聊天头部 */}
                <div className="bg-white shadow-sm p-4 flex items-center">
                    <div className="flex-1">
                        <Link href="/?utm_source=chat_header">
                            <h1 className="text-xl font-semibold text-purple-700">Callme-本名 <VersionDisplay /></h1>

                        </Link>
                        <p className="text-sm text-gray-500">如果只说一个词，你想别人怎么记住你？</p>
                        <p className="text-sm text-gray-500">More than a name. A line we leave behind.</p>
                    </div>
                </div>

                {/* 消息容器 - 添加padding-bottom来为固定定位的输入框留出空间 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                    {messages.map((message) => (
                        <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl p-4 ${
                                message.sender === 'user'
                                    ? 'bg-purple-600 text-white rounded-br-none'
                                    : 'bg-white shadow-md rounded-bl-none'
                            }`}>
                                {message.sender === 'user' ? (
                                    <p className="text-white">{message.text}</p>
                                ) : (
                                    <div className={`markdown-content ${message.sender === 'user' as Role ? 'text-white' : message.sender === 'assistant' as Role ? 'text-gray-800' : ''}`}>
                                        <ReactMarkdown>
                                            {message.text}
                                        </ReactMarkdown>
                                    </div>
                                )}
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

                {/* Add the recommendations component */}
                {hasRecommendations && (
                    <NameRecommendations
                        recommendations={recommendations}
                        onSelectName={handleSelectName}
                    />
                )}

                {/* 展示名字卡片 */}
                {selectedNameInfo && (
                    <NameCard
                        name={selectedNameInfo.name}
                        meaning={selectedNameInfo.meaning}
                        styleTags={selectedNameInfo.styleTags}
                        onClose={closeNameCard}
                    />
                )}

                {/* 输入区域 - 使用fixed定位 */}
                <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg border-t border-gray-200 pb-safe">
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
        </Suspense>
    );
};

export default Chat;