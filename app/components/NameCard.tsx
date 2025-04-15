import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';

// 定义不同类型的文化内容
interface CulturalContent {
    type: 'literature' | 'poem' | 'mythology' | 'quote' | 'acrostic';
    icon: string;
    label: string;
    content: string;
    source?: string;
}

interface NameCardProps {
    name: string;
    chineseName?: string;
    meaning: string;
    styleTags: string[];
    onClose: () => void;
}

const NameCard: React.FC<NameCardProps> = ({
    name,
    chineseName = "",
    meaning,
    styleTags = [],
    onClose
}) => {
    // 引用卡片元素以便导出图片
    const cardRef = useRef<HTMLDivElement>(null);

    // 生成不同类型的文化内容
    const culturalContents: CulturalContent[] = [
        {
            type: 'literature',
            icon: '📚',
            label: '文学引用',
            content: `"The name ${name} reminded me of stars - how they burn bright against the darkness, guiding lost souls home."`,
            source: '— The Celestial Names, Modern Poetry'
        },
        {
            type: 'poem',
            icon: '📝',
            label: 'AI愿景诗句',
            content: `"You carry ${name} not just in name, but in the way you illuminate paths for others, bringing warmth to cold places."`,
        },
        {
            type: 'mythology',
            icon: '🌠',
            label: '神话/历史引用',
            content: `In ancient traditions, ${name} was associated with wisdom and inner light, believed to bring protection to its bearer.`,
        },
        {
            type: 'quote',
            icon: '🧑‍🎓',
            label: '名人语录',
            content: `"Our names are the light by which others find us in the darkness of existence."`,
            source: '— Arthur Schopenhauer'
        },
        {
            type: 'acrostic',
            icon: '🧩',
            label: '名字字母诗',
            content: name.split('').map(letter =>
                `${letter.toUpperCase()} – ${getWordForLetter(letter)}`
            ).join('\n')
        }
    ];

    // 当前选择的文化内容类型
    const [selectedContent, setSelectedContent] = useState<CulturalContent>(culturalContents[0]);

    // 导出卡片为图片
    const exportAsImage = async () => {
        if (cardRef.current) {
            try {
                const dataUrl = await toPng(cardRef.current, { quality: 0.95 });
                const link = document.createElement('a');
                link.download = `${name}-name-card.png`;
                link.href = dataUrl;
                link.click();
            } catch (error) {
                console.error('Error exporting image:', error);
            }
        }
    };

    // 渐变背景样式 - 根据名字生成独特的渐变
    const gradientStyle = {
        background: `linear-gradient(135deg, ${getColorFromName(name, 0.4)}, ${getColorFromName(name.split('').reverse().join(''), 0.7)})`,
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* 卡片头部 */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-purple-700">你的专属命名卡</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 卡片内容 - 可导出部分 */}
                <div className="p-6" ref={cardRef}>
                    {/* 渐变背景与名字展示 */}
                    <div
                        className="rounded-lg p-8 mb-6 text-center relative overflow-hidden"
                        style={gradientStyle}
                    >
                        <div className="relative z-10">
                            <h1 className="text-4xl font-bold text-white mb-2 tracking-wider">{name}</h1>
                            {chineseName && (
                                <h2 className="text-2xl text-white opacity-90 mb-4">{chineseName}</h2>
                            )}
                            <div className="flex flex-wrap justify-center gap-2 mt-4">
                                {styleTags.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="bg-white bg-opacity-30 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* 装饰元素 */}
                        <div className="absolute top-0 right-0 opacity-10 text-white text-9xl font-bold">
                            {name.charAt(0)}
                        </div>
                    </div>

                    {/* 名字含义 */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">名字寓意</h3>
                        <p className="text-gray-600">{meaning}</p>
                    </div>

                    {/* 文化引用部分 */}
                    <div className="mb-6">
                        <div className="flex items-center mb-3">
                            <span className="text-xl mr-2">{selectedContent.icon}</span>
                            <h3 className="text-lg font-semibold text-gray-800">{selectedContent.label}</h3>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <p className="text-gray-700 italic whitespace-pre-line">{selectedContent.content}</p>
                            {selectedContent.source && (
                                <p className="text-gray-500 text-sm mt-2">{selectedContent.source}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 内容类型选择器 */}
                <div className="px-6 pb-4">
                    <div className="flex overflow-x-auto gap-2 pb-2">
                        {culturalContents.map((content) => (
                            <button
                                key={content.type}
                                onClick={() => setSelectedContent(content)}
                                className={`flex items-center px-3 py-2 rounded-full text-sm whitespace-nowrap ${
                                    selectedContent.type === content.type
                                        ? 'bg-purple-100 text-purple-700 border-purple-300 border'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <span className="mr-1">{content.icon}</span>
                                {content.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 底部操作按钮 */}
                <div className="border-t px-6 py-4 flex justify-between">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        返回对话
                    </button>
                    <button
                        onClick={exportAsImage}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        导出为图片
                    </button>
                </div>
            </div>
        </div>
    );
};

// 辅助函数: 根据字母生成相应的词
function getWordForLetter(letter: string): string {
    const dictionary: Record<string, string[]> = {
        a: ['Admirable', 'Authentic', 'Adventurous', 'Attentive', 'Artistic'],
        b: ['Brave', 'Brilliant', 'Balanced', 'Bright', 'Beautiful'],
        c: ['Creative', 'Caring', 'Confident', 'Charming', 'Courageous'],
        d: ['Determined', 'Dynamic', 'Daring', 'Dedicated', 'Delightful'],
        e: ['Elegant', 'Empathetic', 'Enthusiastic', 'Energetic', 'Extraordinary'],
        f: ['Fearless', 'Friendly', 'Faithful', 'Flexible', 'Focused'],
        g: ['Graceful', 'Genuine', 'Generous', 'Gifted', 'Grateful'],
        h: ['Honest', 'Harmonious', 'Hopeful', 'Humble', 'Heartfelt'],
        i: ['Inspiring', 'Intelligent', 'Imaginative', 'Insightful', 'Intuitive'],
        j: ['Joyful', 'Just', 'Jubilant', 'Judicious', 'Journey-minded'],
        k: ['Kind', 'Knowledgeable', 'Keen', 'Kindhearted', 'Kaleidoscopic'],
        l: ['Loving', 'Loyal', 'Luminous', 'Lively', 'Limitless'],
        m: ['Mindful', 'Motivated', 'Magnetic', 'Memorable', 'Magical'],
        n: ['Noble', 'Nurturing', 'Natural', 'Noteworthy', 'Novel'],
        o: ['Optimistic', 'Open-minded', 'Original', 'Observant', 'Outstanding'],
        p: ['Passionate', 'Patient', 'Peaceful', 'Powerful', 'Playful'],
        q: ['Questing', 'Quick-witted', 'Quiet strength', 'Quality-focused', 'Questioning'],
        r: ['Resilient', 'Resourceful', 'Radiant', 'Respectful', 'Remarkable'],
        s: ['Sincere', 'Strong', 'Spirited', 'Sensitive', 'Soulful'],
        t: ['Thoughtful', 'Tenacious', 'Truthful', 'Transformative', 'Trustworthy'],
        u: ['Unique', 'Understanding', 'Uplifting', 'Unstoppable', 'Unifying'],
        v: ['Vibrant', 'Valiant', 'Visionary', 'Versatile', 'Virtuous'],
        w: ['Wise', 'Warm', 'Whimsical', 'Willing', 'Wholehearted'],
        x: ['Xtraordinary', 'Xemplary', 'Xploring', 'Xpressive', 'Xcellent'],
        y: ['Yearning', 'Youthful', 'Yielding', 'Yoga-minded', 'Yes-saying'],
        z: ['Zealous', 'Zestful', 'Zen-like', 'Zany', 'Zeal-filled']
    };

    const lowerLetter = letter.toLowerCase();
    if (dictionary[lowerLetter]) {
        return dictionary[lowerLetter][Math.floor(Math.random() * dictionary[lowerLetter].length)];
    }
    return 'Exceptional';
}

// 辅助函数：从名字生成渐变色
function getColorFromName(name: string, opacity: number = 1): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const h = Math.abs(hash) % 360;
    const s = 65 + (Math.abs(hash) % 20);
    const l = 45 + (Math.abs(hash) % 20);

    return `hsla(${h}, ${s}%, ${l}%, ${opacity})`;
}

export default NameCard;