import React, { useState, useEffect } from 'react';

// 扩展推荐名字接口，包含更多详细信息
interface NameRecommendation {
    name: string;
    description: string;
    meaning?: string;        // 可以从描述中提取
    styleTags?: string[];    // 风格标签
    matchReason?: string;    // 推荐理由
    popularity?: string;     // 流行度
    pronunciation?: string;  // 发音指南
}

interface NameRecommendationsProps {
    recommendations: NameRecommendation[];
    onSelectName: (name: string, index: number, action: 'like' | 'dislike') => void;
    onRefresh: () => void;
    onSubmitPreferences: (likedIndexes: number[], dislikedIndexes: number[]) => void;
    onViewDetails?: (name: string, index: number) => void; // 添加查看详情回调
}

const NameRecommendations: React.FC<NameRecommendationsProps> = ({
    recommendations,
    onSelectName,
    onRefresh,
    onSubmitPreferences,
    onViewDetails
}) => {
    const [likedNames, setLikedNames] = useState<number[]>([]);
    const [dislikedNames, setDislikedNames] = useState<number[]>([]);
    const [expandedView, setExpandedView] = useState<boolean>(false);
    const [filterTag, setFilterTag] = useState<string | null>(null);

    // 定义localStorage的key
    const STORAGE_KEY_LIKED = 'callme-liked-names';
    const STORAGE_KEY_DISLIKED = 'callme-disliked-names';

    // 从localStorage读取已保存的喜欢/不喜欢数据
    useEffect(() => {
        try {
            // 恢复喜欢的名字
            const savedLikedNames = localStorage.getItem(STORAGE_KEY_LIKED);
            if (savedLikedNames) {
                const savedLikedData = JSON.parse(savedLikedNames);

                // 如果推荐列表和存储的列表有匹配项，恢复索引选择状态
                if (recommendations && recommendations.length > 0) {
                    const likedIndices: number[] = [];

                    recommendations.forEach((rec, index) => {
                        if (savedLikedData.includes(rec.name)) {
                            likedIndices.push(index);
                        }
                    });

                    setLikedNames(likedIndices);
                }
            }

            // 恢复不喜欢的名字
            const savedDislikedNames = localStorage.getItem(STORAGE_KEY_DISLIKED);
            if (savedDislikedNames) {
                const savedDislikedData = JSON.parse(savedDislikedNames);

                // 如果推荐列表和存储的列表有匹配项，恢复索引选择状态
                if (recommendations && recommendations.length > 0) {
                    const dislikedIndices: number[] = [];

                    recommendations.forEach((rec, index) => {
                        if (savedDislikedData.includes(rec.name)) {
                            dislikedIndices.push(index);
                        }
                    });

                    setDislikedNames(dislikedIndices);
                }
            }
        } catch (error) {
            console.error('Error loading preferences from localStorage:', error);
        }
    }, [recommendations]);

    // 将喜欢/不喜欢的名字保存到localStorage的函数
    const savePreferencesToStorage = (likes: number[], dislikes: number[]) => {
        try {
            const likedNameValues = likes.map(index => recommendations[index]?.name).filter(Boolean);
            const dislikedNameValues = dislikes.map(index => recommendations[index]?.name).filter(Boolean);

            // 从已有存储中读取数据，然后添加新数据
            const existingLikedNames = JSON.parse(localStorage.getItem(STORAGE_KEY_LIKED) || '[]');
            const existingDislikedNames = JSON.parse(localStorage.getItem(STORAGE_KEY_DISLIKED) || '[]');

            // 合并并去重
            const updatedLikedNames = Array.from(new Set([...existingLikedNames, ...likedNameValues]));
            const updatedDislikedNames = Array.from(new Set([...existingDislikedNames, ...dislikedNameValues]));

            // 将不喜欢的名字从喜欢列表中移除，反之亦然
            const finalLikedNames = updatedLikedNames.filter(name => !updatedDislikedNames.includes(name));
            const finalDislikedNames = updatedDislikedNames.filter(name => !updatedLikedNames.includes(name));

            localStorage.setItem(STORAGE_KEY_LIKED, JSON.stringify(finalLikedNames));
            localStorage.setItem(STORAGE_KEY_DISLIKED, JSON.stringify(finalDislikedNames));
        } catch (error) {
            console.error('Error saving preferences to localStorage:', error);
        }
    };

    if (!recommendations || recommendations.length === 0) return null;

    // 为不同的名字分配不同的emoji
    const emojis = ['✨', '🌟', '💫', '⭐', '🔆', '🌈', '🎯', '🎭', '🍀', '💎', '🌺', '🦋'];

    // 从描述中提取更多信息
    const enhancedRecommendations = recommendations.map(rec => {
        // 提取寓意/来源 (通常在描述的开头，以"意为"或"源自"等词语开始)
        const meaningMatch = rec.description.match(/(源自|来自|意为)([^，。]+)/);
        const meaning = meaningMatch
            ? meaningMatch[0]
            : "独特含义";

        // 生成随机风格标签 (实际应用中应该从AI返回中提取)
        const styleTags = rec.styleTags || [
            ['文艺范', '小众', '有深度', '古典', '现代', '中性风', '冷门', '温柔感', '强韧感', '学术风', "搞怪", "成熟"][Math.floor(Math.random() * 10)],
            ['好记', '易发音', '国际化', '有故事感', '简洁', '优雅', '灵动', '鲜明', '内涵', '诗意'][Math.floor(Math.random() * 10)],
            ["有文化底蕴的名字",
                "诗经里的名字",
                "清冷古风",
                "文艺",
                "有宿命感的名字",
                "有诗意",
                "大气磅礴的名字",
                "高级"][Math.floor(Math.random() * 10)],
            ['历史感', '未来感', '自然', '科技', '人文', '艺术', '经典', '前卫', '中西结合', '跨文化'][Math.floor(Math.random() * 10)],
            ["女主名字",
                "男主名字",
                "冷门好听的名字",
                "不烂大街的名字",
                "稀有名字",
                "简易名字",
                "单音节",
                "普通名字",
                "有个性的名字",
                "好叫的名字"][Math.floor(Math.random() * 10)],
            ['易读', '易写', '有韵律有节奏', '简短', '精致'][Math.floor(Math.random() * 10)]
        ];

        // 生成个性化匹配理由
        const matchReasons = [
            "符合你想要的寓意感 💭",
            "这个独特性很符合你的喜好 ✨",
            "跟你的审美风格超搭 👌",
            "很好地平衡了独特感和好记性 🎯",
            "有你期望的内涵和气质 ✅",
            "既有深度又不会太难读 🔍",
            "这个名字自带光环感 💫"
        ];
        const matchReason = rec.matchReason || matchReasons[Math.floor(Math.random() * matchReasons.length)];

        return {
            ...rec,
            meaning: rec.meaning || meaning,
            styleTags: styleTags,
            matchReason: matchReason
        };
    });

    // 处理喜欢/不喜欢按钮点击
    const handleLikeDislike = (index: number, action: 'like' | 'dislike') => {
        let newLikedNames = [...likedNames];
        let newDislikedNames = [...dislikedNames];

        if (action === 'like') {
            // 如果已经在不喜欢列表中，先移除
            if (dislikedNames.includes(index)) {
                newDislikedNames = dislikedNames.filter(i => i !== index);
            }

            // 切换喜欢状态
            if (likedNames.includes(index)) {
                newLikedNames = likedNames.filter(i => i !== index);
            } else {
                newLikedNames = [...likedNames, index];
            }
        } else {
            // 如果已经在喜欢列表中，先移除
            if (likedNames.includes(index)) {
                newLikedNames = likedNames.filter(i => i !== index);
            }

            // 切换不喜欢状态
            if (dislikedNames.includes(index)) {
                newDislikedNames = dislikedNames.filter(i => i !== index);
            } else {
                newDislikedNames = [...dislikedNames, index];
            }
        }

        // 更新状态
        setLikedNames(newLikedNames);
        setDislikedNames(newDislikedNames);

        // 保存到localStorage
        savePreferencesToStorage(newLikedNames, newDislikedNames);

        // 调用回调通知父组件
        onSelectName(enhancedRecommendations[index].name, index, action);
    };

    // 提交用户偏好，获取新的推荐
    const handleSubmitPreferences = () => {
        onSubmitPreferences(likedNames, dislikedNames);
        // 不再重置状态，这样用户的选择会一直保持
        // setLikedNames([]);
        // setDislikedNames([]);
    };

    // 清除选择按钮 - 也清除localStorage
    const handleClearPreferences = () => {
        setLikedNames([]);
        setDislikedNames([]);
        // 清除localStorage
        localStorage.removeItem(STORAGE_KEY_LIKED);
        localStorage.removeItem(STORAGE_KEY_DISLIKED);
    };

    // 切换展开/折叠视图
    const toggleExpandedView = () => {
        setExpandedView(!expandedView);
    };

    // 生成所有标签的集合用于筛选
    const allTags = new Set<string>();
    enhancedRecommendations.forEach(rec => {
        rec.styleTags?.forEach(tag => allTags.add(tag));
    });

    // 筛选后的推荐列表
    const filteredRecommendations = filterTag
        ? enhancedRecommendations.filter(rec => rec.styleTags?.includes(filterTag))
        : enhancedRecommendations;

    // 展示的推荐列表：展开模式显示全部，折叠模式只显示前5个
    const displayRecommendations = expandedView
        ? filteredRecommendations
        : filteredRecommendations.slice(0, 5);

    return (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-3 sticky top-0 bg-gradient-to-r from-purple-50 to-blue-50 py-2 z-10">
                <h3 className="text-lg font-semibold text-purple-700">名字灵感墙 🧠✨</h3>
                <button
                    onClick={toggleExpandedView}
                    className="text-purple-600 hover:text-purple-800 transition-colors"
                >
                    {expandedView ? '收起' : '查看更多 →'}
                </button>
            </div>

            {/* 帮助提示 */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 rounded-r-md sticky top-12 z-10">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-800">
                            快速选择：<span className="font-bold">👍 喜欢</span>或<span className="font-bold">👎 排除</span>多个名字，然后点击底部按钮获取更精准推荐！
                        </p>
                    </div>
                </div>
            </div>

            {/* 筛选器 - 仅在展开模式显示 */}
            {expandedView && (
                <div className="mb-4 flex flex-wrap gap-2 sticky top-32 bg-gradient-to-r from-purple-50 to-blue-50 py-2 z-10">
                    <span className="text-sm text-gray-600">按风格筛选:</span>
                    <button
                        onClick={() => setFilterTag(null)}
                        className={`text-xs px-2 py-1 rounded-full ${!filterTag ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                        全部
                    </button>
                    {Array.from(allTags).map(tag => (
                        <button
                            key={tag}
                            onClick={() => setFilterTag(tag)}
                            className={`text-xs px-2 py-1 rounded-full ${filterTag === tag ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {displayRecommendations.map((rec, index) => {
                    const emoji = emojis[index % emojis.length];
                    const isLiked = likedNames.includes(index);
                    const isDisliked = dislikedNames.includes(index);

                    return (
                        <div
                            key={index}
                            className={`bg-white rounded-xl p-4 shadow transition-all duration-200
                                ${isLiked
                                    ? 'border-2 border-red-400 ring-2 ring-red-200'
                                    : isDisliked
                                        ? 'border-2 border-gray-400 opacity-75'
                                        : 'border border-transparent hover:border-purple-200'}`}
                        >
                            <div className="flex flex-col">
                                {/* 名字部分 */}
                                <div className="flex items-center mb-2">
                                    <div className="text-2xl mr-2">
                                        {emoji}
                                    </div>
                                    <h4
                                        className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent cursor-pointer hover:opacity-80"
                                        onClick={() => onViewDetails && onViewDetails(rec.name, index)}
                                    >
                                        {rec.name}
                                    </h4>
                                    {/* 选择状态徽章 */}
                                    {isLiked && (
                                        <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">已喜欢</span>
                                    )}
                                    {isDisliked && (
                                        <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">已排除</span>
                                    )}
                                </div>

                                {/* 寓意部分 */}
                                <div className="mb-2 text-gray-700">
                                    <span className="font-medium">寓意：</span>
                                    {rec.meaning}
                                </div>

                                {/* 风格标签 */}
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {rec.styleTags?.map((tag, i) => (
                                        <span
                                            key={i}
                                            className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>

                                {/* 匹配理由 */}
                                <div className="mt-1 pt-2 border-t border-gray-100 text-gray-700">
                                    <span className="font-medium">为你推荐：</span>
                                    {rec.matchReason}
                                </div>

                                {/* 喜欢/不喜欢按钮 */}
                                <div className="flex justify-between mt-4">
                                    <button
                                        onClick={() => handleLikeDislike(index, 'like')}
                                        className={`px-3 py-1 rounded-full transition-colors ${
                                            isLiked
                                                ? 'bg-red-100 text-red-600 font-semibold ring-1 ring-red-300'
                                                : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                                        }`}
                                    >
                                        {isLiked ? '❤️ 已喜欢' : '🤍 喜欢'}
                                    </button>
                                    <button
                                        onClick={() => handleLikeDislike(index, 'dislike')}
                                        className={`px-3 py-1 rounded-full transition-colors ${
                                            isDisliked
                                                ? 'bg-gray-200 text-gray-600 font-semibold ring-1 ring-gray-300'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        {isDisliked ? '✓ 已排除' : '🙅 不喜欢'}
                                    </button>
                                </div>

                                {/* 查看详情按钮 */}
                                {onViewDetails && (
                                    <button
                                        onClick={() => onViewDetails(rec.name, index)}
                                        className="w-full mt-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                        查看详情 →
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 底部功能按钮 */}
            <div className="flex flex-col gap-3 mt-6 sticky bottom-0 bg-gradient-to-r from-purple-50 to-blue-50 pt-3 pb-1 z-10">
                {/* 选择提示 - 当用户有选择时显示 */}
                {(likedNames.length > 0 || dislikedNames.length > 0) && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-center mb-2">
                        <p className="text-blue-700">
                            已选择 {likedNames.length > 0 ? <span className="font-bold">{likedNames.length}个喜欢</span> : null}
                            {likedNames.length > 0 && dislikedNames.length > 0 ? ' 和 ' : null}
                            {dislikedNames.length > 0 ? <span className="font-bold">{dislikedNames.length}个不喜欢</span> : null} 的名字
                        </p>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onRefresh}
                        className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg px-4 py-3 transition-colors"
                    >
                        换一批灵感
                    </button>
                    <button
                        onClick={handleSubmitPreferences}
                        className={`flex-1 rounded-lg px-4 py-3 transition-all transform ${likedNames.length > 0 || dislikedNames.length > 0
                            ? 'bg-purple-600 text-white hover:bg-purple-700 hover:scale-105 shadow-md'
                            : 'bg-purple-200 text-purple-500 cursor-not-allowed'}`}
                        disabled={likedNames.length === 0 && dislikedNames.length === 0}
                    >
                        <div className="flex items-center justify-center">
                            <span className="mr-2">根据喜好推荐</span>
                            {likedNames.length > 0 || dislikedNames.length > 0 ? (
                                <span className="bg-white text-purple-600 rounded-full px-2 py-0.5 text-sm font-bold">
                                    {likedNames.length + dislikedNames.length}
                                </span>
                            ) : null}
                        </div>
                    </button>
                </div>

                {/* 清除选择按钮 - 当有选择但未提交时显示 */}
                {(likedNames.length > 0 || dislikedNames.length > 0) && (
                    <button
                        onClick={handleClearPreferences}
                        className="text-center text-gray-500 hover:text-gray-700 mt-2 text-sm"
                    >
                        清除所有选择
                    </button>
                )}
            </div>
        </div>
    );
};

export default NameRecommendations;