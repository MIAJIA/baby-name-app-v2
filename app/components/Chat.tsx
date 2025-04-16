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

// 在组件外部添加一个Modal组件来显示收藏的名字
// 在FavoritesModal组件前定义localStorage键
const STORAGE_KEY_LIKED = 'callme-liked-names';
const STORAGE_KEY_DISLIKED = 'callme-disliked-names';

const FavoritesModal: React.FC<{
    show: boolean;
    onClose: () => void;
    likedNames: string[];
    dislikedNames: string[];
    onRemove: (name: string, type: 'liked' | 'disliked') => void;
}> = ({ show, onClose, likedNames, dislikedNames, onRemove }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">已收藏的名字</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {likedNames.length === 0 && dislikedNames.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">你还没有收藏任何名字</p>
                    ) : (
                        <>
                            {likedNames.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-medium text-gray-700 mb-2">❤️ 喜欢的名字</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {likedNames.map(name => (
                                            <div key={name} className="bg-red-50 text-red-700 rounded-lg p-2 flex justify-between items-center">
                                                <span className="font-medium">{name}</span>
                                                <button
                                                    onClick={() => onRemove(name, 'liked')}
                                                    className="text-red-400 hover:text-red-600"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {dislikedNames.length > 0 && (
                                <div>
                                    <h3 className="font-medium text-gray-700 mb-2">🚫 不喜欢的名字</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {dislikedNames.map(name => (
                                            <div key={name} className="bg-gray-100 text-gray-700 rounded-lg p-2 flex justify-between items-center">
                                                <span className="font-medium">{name}</span>
                                                <button
                                                    onClick={() => onRemove(name, 'disliked')}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
                <div className="p-4 border-t">
                    <button
                        onClick={() => {
                            localStorage.removeItem(STORAGE_KEY_LIKED);
                            localStorage.removeItem(STORAGE_KEY_DISLIKED);
                            onRemove('', 'liked'); // 触发父组件的状态更新
                            onClose();
                        }}
                        className="w-full py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                        清空所有收藏
                    </button>
                </div>
            </div>
        </div>
    );
};

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
    const [likedNames, setLikedNames] = useState<string[]>([]);
    const [dislikedNames, setDislikedNames] = useState<string[]>([]);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [mobileView, setMobileView] = useState<'chat' | 'recommendations'>('chat');
    const [showFavorites, setShowFavorites] = useState(false);

    // 初始化时从localStorage加载用户偏好
    React.useEffect(() => {
        try {
            const savedLikedNames = localStorage.getItem(STORAGE_KEY_LIKED);
            if (savedLikedNames) {
                setLikedNames(JSON.parse(savedLikedNames));
            }

            const savedDislikedNames = localStorage.getItem(STORAGE_KEY_DISLIKED);
            if (savedDislikedNames) {
                setDislikedNames(JSON.parse(savedDislikedNames));
            }
        } catch (error) {
            console.error('Error loading name preferences from localStorage:', error);
        }
    }, []);
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

    const handleSelectName = async (name: string, index: number, action: 'like' | 'dislike') => {
        try {
            // 添加调试日志
            console.log("Selected name:", name, "at index:", index, "action:", action);
            console.log("Available recommendations:", recommendations);

            // 根据动作更新喜欢/不喜欢的名字列表
            let updatedLikedNames = [...likedNames];
            let updatedDislikedNames = [...dislikedNames];

            if (action === 'like') {
                // 将名字添加到喜欢列表
                if (!likedNames.includes(name)) {
                    updatedLikedNames = [...likedNames, name];
                    setLikedNames(updatedLikedNames);
                }
                // 如果之前不喜欢，现在移除
                if (dislikedNames.includes(name)) {
                    updatedDislikedNames = dislikedNames.filter(n => n !== name);
                    setDislikedNames(updatedDislikedNames);
                }
            } else {
                // 将名字添加到不喜欢列表
                if (!dislikedNames.includes(name)) {
                    updatedDislikedNames = [...dislikedNames, name];
                    setDislikedNames(updatedDislikedNames);
                }
                // 如果之前喜欢，现在移除
                if (likedNames.includes(name)) {
                    updatedLikedNames = likedNames.filter(n => n !== name);
                    setLikedNames(updatedLikedNames);
                }
            }

            // 更新localStorage
            try {
                localStorage.setItem(STORAGE_KEY_LIKED, JSON.stringify(updatedLikedNames));
                localStorage.setItem(STORAGE_KEY_DISLIKED, JSON.stringify(updatedDislikedNames));
            } catch (error) {
                console.error('Error saving preferences to localStorage:', error);
            }

            // 不要在喜欢/不喜欢功能时显示卡片
            // 由于现在支持多选，不再每次选择都发送消息
            // 单击喜欢/不喜欢按钮不再立即发送消息和清除推荐
        } catch (err) {
            console.error("Error in handleSelectName:", err);
        }
    };

    // 添加新函数用于显示名字详情卡片
    const showNameDetails = (name: string, index: number) => {
        try {
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
                console.log("Selected name info for details:", nameInfo);

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
        } catch (err) {
            console.error("Error in showNameDetails:", err);
            // 使用备用数据确保卡片仍然显示
            setSelectedNameInfo({
                name: name,
                meaning: "一个美丽而有意义的名字",
                styleTags: ["优雅", "独特"]
            });
        }
    };

    // 添加处理用户偏好提交的函数
    const handleSubmitPreferences = async (likedIndexes: number[], dislikedIndexes: number[]) => {
        setIsLoading(true);

        try {
            // 构建一个描述用户偏好的消息
            let preferenceMessage = "我喜欢";

            // 提取喜欢和不喜欢的名字
            const likedNameValues = likedIndexes.map(index => recommendations[index]?.name).filter(Boolean) as string[];
            const dislikedNameValues = dislikedIndexes.map(index => recommendations[index]?.name).filter(Boolean) as string[];

            // 添加喜欢的名字
            if (likedIndexes.length > 0) {
                preferenceMessage += likedNameValues.map(name => ` "${name}"`).join(",");

                if (dislikedIndexes.length > 0) {
                    preferenceMessage += "，但不太喜欢";
                }
            }

            // 添加不喜欢的名字
            if (dislikedIndexes.length > 0) {
                preferenceMessage += dislikedNameValues.map(name => ` "${name}"`).join(",");
            }

            preferenceMessage += "。请根据我的偏好推荐更多名字。";

            // 创建用户消息
            const newMessage: Message = {
                id: Date.now().toString(),
                text: preferenceMessage,
                sender: 'user'
            };

            setMessages(prev => [...prev, newMessage]);

            // 更新全局的喜欢/不喜欢列表
            const updatedLikedNames = Array.from(new Set([...likedNames, ...likedNameValues]));
            const updatedDislikedNames = Array.from(new Set([...dislikedNames, ...dislikedNameValues]));

            // 确保喜欢和不喜欢列表互斥
            const finalLikedNames = updatedLikedNames.filter(name => !updatedDislikedNames.includes(name));
            const finalDislikedNames = updatedDislikedNames.filter(name => !updatedLikedNames.includes(name));

            setLikedNames(finalLikedNames);
            setDislikedNames(finalDislikedNames);

            // 更新localStorage
            try {
                localStorage.setItem(STORAGE_KEY_LIKED, JSON.stringify(finalLikedNames));
                localStorage.setItem(STORAGE_KEY_DISLIKED, JSON.stringify(finalDislikedNames));
            } catch (error) {
                console.error('Error saving preferences to localStorage:', error);
            }

            // 发送API请求获取个性化推荐
            await sendMessageToAPI(preferenceMessage);
        } catch (error) {
            console.error('Failed to submit preferences:', error);
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

    const closeNameCard = () => {
        setSelectedNameInfo(null);
    };

    const refreshRecommendations = async () => {
        setIsLoading(true);
        try {
            await sendMessageToAPI("请给我一批新的名字推荐");
        } catch (error) {
            console.error('Failed to refresh recommendations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 函数用于切换移动端视图
    const toggleMobileView = () => {
        setMobileView(prev => prev === 'chat' ? 'recommendations' : 'chat');
    };

    // 处理从收藏中删除名字
    const handleRemoveFromFavorites = (name: string, type: 'liked' | 'disliked') => {
        if (type === 'liked') {
            const updatedLikedNames = name ? likedNames.filter(n => n !== name) : [];
            setLikedNames(updatedLikedNames);
            localStorage.setItem(STORAGE_KEY_LIKED, JSON.stringify(updatedLikedNames));
        } else {
            const updatedDislikedNames = name ? dislikedNames.filter(n => n !== name) : [];
            setDislikedNames(updatedDislikedNames);
            localStorage.setItem(STORAGE_KEY_DISLIKED, JSON.stringify(updatedDislikedNames));
        }
    };

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="flex flex-col md:flex-row h-[100dvh] bg-gradient-to-b from-blue-50 to-purple-50">
                {/* 收藏名字弹窗 */}
                <FavoritesModal
                    show={showFavorites}
                    onClose={() => setShowFavorites(false)}
                    likedNames={likedNames}
                    dislikedNames={dislikedNames}
                    onRemove={handleRemoveFromFavorites}
                />

                {/* 移动端标签切换 */}
                {hasRecommendations && (
                    <div className="flex md:hidden sticky top-0 z-20 bg-white shadow-sm">
                        <button
                            onClick={() => setMobileView('chat')}
                            className={`flex-1 py-3 text-center ${mobileView === 'chat' ? 'text-purple-700 font-semibold border-b-2 border-purple-600' : 'text-gray-500'}`}
                        >
                            聊天对话
                        </button>
                        <button
                            onClick={() => setMobileView('recommendations')}
                            className={`flex-1 py-3 text-center ${mobileView === 'recommendations' ? 'text-purple-700 font-semibold border-b-2 border-purple-600' : 'text-gray-500'}`}
                        >
                            名字推荐
                            {hasRecommendations && <span className="ml-1 inline-block bg-purple-100 text-purple-600 rounded-full w-6 h-6 text-xs leading-6">{recommendations.length}</span>}
                        </button>
                    </div>
                )}

                {/* 聊天区域 - 左侧 */}
                <div className={`flex flex-col ${hasRecommendations ? 'md:w-1/2 lg:w-3/5' : 'w-full'} ${hasRecommendations && mobileView === 'recommendations' ? 'hidden md:flex' : 'flex'}`}>
                    {/* 聊天头部 */}
                    <div className="bg-white shadow-sm p-4 flex items-center">
                        <div className="flex-1">
                            <Link href="/?utm_source=chat_header">
                                <h1 className="text-xl font-semibold text-purple-700">Callme-英文名灵感馆</h1>
                            </Link>
                            <p className="text-sm text-gray-500">More than a name. A line we leave behind.</p>
                        </div>
                        {/* 收藏夹按钮 */}
                        <button
                            onClick={() => setShowFavorites(true)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                            title="查看已收藏的名字"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="font-medium">{likedNames.length}</span>
                        </button>
                    </div>

                    {/* 消息容器 - 添加padding-bottom来为固定定位的输入框留出空间 */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                        {messages.map((message) => (
                            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] rounded-2xl p-4 ${message.sender === 'user'
                                    ? 'bg-purple-600 text-white rounded-br-none'
                                    : 'bg-white shadow-md rounded-bl-none'
                                    }`}>
                                    {message.sender === 'user' ? (
                                        <p className="text-white">{message.text}</p>
                                    ) : (
                                        <div className="markdown-content text-gray-800">
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

                    {/* 展示名字卡片 */}
                    {selectedNameInfo && (
                        <NameCard
                            name={selectedNameInfo.name}
                            meaning={selectedNameInfo.meaning}
                            styleTags={selectedNameInfo.styleTags}
                            onClose={closeNameCard}
                        />
                    )}

                    {/* 输入区域 - 固定在聊天区底部 */}
                    <div className={`fixed bottom-0 left-0 right-0 md:right-auto md:w-1/2 lg:w-3/5 bg-white p-4 shadow-lg border-t border-gray-200 pb-safe ${hasRecommendations && mobileView === 'recommendations' ? 'hidden md:block' : 'block'}`}>
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

                            {/* 移动端添加切换按钮 */}
                            {hasRecommendations && (
                                <button
                                    onClick={toggleMobileView}
                                    className="md:hidden bg-purple-100 text-purple-700 rounded-full p-3"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>


                {/* 名字推荐区域 - 右侧 */}
                {hasRecommendations && (
                    <div className={`md:w-1/2 lg:w-2/5 ${mobileView === 'recommendations' ? 'block' : 'hidden md:block'}`}>
                        <NameRecommendations
                            recommendations={recommendations}
                            onSelectName={handleSelectName}
                            onRefresh={refreshRecommendations}
                            onSubmitPreferences={handleSubmitPreferences}
                            onViewDetails={showNameDetails}
                        />

                        {/* 移动设备返回聊天按钮 */}
                        <div className="fixed bottom-4 right-4 md:hidden">
                            <button
                                onClick={toggleMobileView}
                                className="bg-purple-600 text-white rounded-full p-4 shadow-lg"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Suspense>
    );
};

export default Chat;