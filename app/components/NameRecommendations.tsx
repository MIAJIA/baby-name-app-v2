import React, { useState } from 'react';

// 扩展推荐名字接口，包含更多详细信息
interface NameRecommendation {
    name: string;
    description: string;
    meaning?: string;        // 可以从描述中提取
    styleTags?: string[];    // 风格标签
    matchReason?: string;    // 推荐理由
}

interface NameRecommendationsProps {
    recommendations: NameRecommendation[];
    onSelectName: (name: string, index: number) => void;
}

const NameRecommendations: React.FC<NameRecommendationsProps> = ({ recommendations, onSelectName }) => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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
        const styleTags = [
            ['文艺范', '小众', '有深度', '古典', '现代', '中性风', '冷门', '温柔感', '强韧感', '学术风'][Math.floor(Math.random() * 10)],
            ['好记', '易发音', '国际化', '有故事感', '简洁', '优雅', '独特', '鲜明', '内涵', '诗意'][Math.floor(Math.random() * 10)],
            ['积极', '灵动', '稳重', '热情', '睿智', '勇敢', '温暖', '自信', '和善', '真诚'][Math.floor(Math.random() * 10)]
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
        const matchReason = matchReasons[Math.floor(Math.random() * matchReasons.length)];

        return {
            ...rec,
            meaning,
            styleTags,
            matchReason
        };
    });

    const handleSelectName = (name: string, index: number) => {
        console.log(`选择了名字: ${name}，索引: ${index}`);
        setSelectedIndex(index);
        onSelectName(name, index);
    };

    return (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mt-4 mb-24 shadow-md">
            <h3 className="text-lg font-semibold text-purple-700 mb-3"> 哪一个是你最喜欢的名字？</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enhancedRecommendations.map((rec, index) => {
                    const isSelected = selectedIndex === index;
                    const emoji = emojis[index % emojis.length];

                    return (
                        <div
                            key={index}
                            className={`bg-white rounded-xl p-4 shadow transition-all duration-200 cursor-pointer
                                      ${isSelected
                                          ? 'border-2 border-purple-500 shadow-md'
                                          : 'border border-gray-100 hover:border-purple-300 hover:shadow-md'}`}
                            onClick={() => handleSelectName(rec.name, index)}
                        >
                            <div className="flex flex-col">
                                {/* 名字部分 */}
                                <div className="flex items-center mb-2">
                                    <div className="text-2xl mr-2">
                                        {emoji}
                                    </div>
                                    <h4 className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                        {rec.name}
                                    </h4>
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
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default NameRecommendations;