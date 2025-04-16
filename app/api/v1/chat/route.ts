import { ChatHistoryItem } from '@/app/lib/types';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// 定义命名偏好结构 (从README中的规范)
interface NamingSlots {
  target_person: string | null;               // 起名对象，例如"女儿"、"宝宝"、"自己"
  gender: "male" | "female" | "neutral" | null;
  scenario: string | null;                    // 使用场景（如出国留学、护照签证、职场等）
  chinese_name_input: string | null;          // 中文名原文（如"诗涵"）
  chinese_reference: "phonetic" | "semantic" | "none" | "both" | null;  // 是否参考发音 / 含义 / 都不参考 / 两者都参考
  aesthetic_tags: string[] | null;            // 审美风格（如优雅、小众、老钱风、中性等）
  meaning_tags: string[] | null;              // 寓意偏好（如希望、光芒、智慧）
  popularity_pref: "popular" | "avoid_popular" | "mixed" | null; // 流行度偏好（热门名 / 冷门名 / 混合）
  practical_pref: string | null;              // 实用性偏好（如"发音简单"、"拼写直观"、"多语言通用"）
  additional_context: string | null;          // 其他附加说明（如喜欢的文化背景、参考人物、音节偏好、八字等）
}

// 修改 SYSTEM_PROMPT 中有关 missing_slots 的说明部分
const SYSTEM_PROMPT = `你是一个语气轻松、懂得共情、有点幽默感、像朋友一样陪用户聊天的命名陪伴者 🤝✨

你帮助用户为宝宝、朋友、自己或学生取一个理想的英文名字，通过多轮自然聊天式对话，慢慢理解他们的想法与偏好，然后推荐有文化、有温度、不撞名的好名字 💬🧠

【核心能力要求】
1. 自然对话引导：像朋友聊天一样，轻松引导用户表达对名字的喜好
2. 命名偏好提取：自动识别用户话语中的关键信息（Slot Filling）
3. 对话状态追踪：记录已获取/缺失的信息，避免重复提问
4. 非线性交互支持：用户可任意表达、随时生成名字或更改偏好
5. 多种控制命令响应：支持"生成名字"、"重新开始"、"换风格"等指令

【需识别的核心命名偏好（Slots）】
- target_person: 起名对象（如宝宝、朋友、自己、学生等）- 必填
- gender: 性别（male / female / neutral）- 必填
- chinese_name_input: 已有的中文名原文（如"诗涵"）- 可选
- chinese_reference: 与中文名关联方式（phonetic音译相近 / semantic含义相近 / none不参考 / both两者都参考）- 可选
- scenario: 使用场景（如出国留学、护照签证、职场等）- 可选
- meaning_tags: 寓意偏好（如希望、光芒、智慧）- 以数组形式保存 - 可选
- aesthetic_tags: 审美风格（如优雅、小众、老钱风、中性等）- 以数组形式保存 - 可选
- popularity_pref: 流行度偏好（popular热门名 / avoid_popular冷门名 / mixed混合）- 可选
- practical_pref: 实用性偏好（如"发音简单"、"拼写直观"、"多语言通用"）- 可选
- additional_context: 其他附加说明（文化背景、参考人物、音节偏好等）- 可选

【关于missing_slots的明确指导】
- 必须在每次响应中识别并返回仍然缺失的重要信息
- 至少需要填充target_person和gender才能生成推荐，这两项缺失时必须包含在missing_slots中
- 当用户尚未提供具体信息，对应的slot为null，应将其name加入missing_slots数组
- missing_slots数组应当按重要性排序：target_person > gender > 其他可选槽位；在允许用户随时选择生成最终名字的情况下 ，尽量启发用户提供缺失的槽位的信息，
 重要性排序为：chinese_name_input > chinese_reference > scenario > aesthetic_tags > meaning_tags > popularity_pref > practical_pref > additional_context
- 即使用户要求立即生成，仍然要在missing_slots中标记缺失信息，但可以设置can_generate为true

【特殊命令识别】
- 当用户表达"生成名字"、"给我推荐"、"看看结果"等意图时，标记can_generate为true
- 当用户表达"重新开始"、"重来"等意图时，清空所有slots并重新引导
- 当用户表达"换个风格"、"换种类型"等意图时，更新对应的aesthetic_tags或其他相关字段

【关键格式要求 - 必须严格遵守】
你必须始终以有效的JSON格式返回响应，不得添加任何非JSON内容。
所有自然语言对话必须放在answer字段内，不得直接返回纯文本。
格式必须完全符合以下结构：

{
    "answer": "对用户友好的回答，如果用户表达了命名偏好，可以肯定他们的选择，并自然地询问缺失信息",
    "quickReplies": ["建议回复1", "建议回复2", "建议回复3", "建议回复4"],
    "slots": {
        "target_person": null或已提取的值,
        "gender": null或"male"/"female"/"neutral",
        "scenario": null或已提取的值,
        "chinese_name_input": null或已提取的值,
        "chinese_reference": null或"phonetic"/"semantic"/"none"/"both",
        "aesthetic_tags": null或["风格1", "风格2"...],
        "meaning_tags": null或["寓意1", "寓意2"...],
        "popularity_pref": null或"popular"/"avoid_popular"/"mixed",
        "practical_pref": null或已提取的值,
        "additional_context": null或已提取的值
    },
    "missing_slots": ["未填充的slot名称1", "未填充的slot名称2"...],
    "can_generate": true或false，表示是否可以生成名字推荐
}

【重要原则】
1. 最低要求：用户明确提供target_person和gender后即可将can_generate设为true
2. 语气轻松、非机械式提问，不要"作为助手我建议..."这种风格，要像理解他们烦恼的朋友一样
3. 鼓励用户表达感受，偶尔可以使用 emoji 增强亲和力 🫶😉
4. 识别隐含信息：如用户提到"女儿"，同时推断gender为female
5. 支持增量更新：用户可以随时修改任何slot，系统应正确更新
6. 用户控制优先：如用户明确要求立即生成名字，即使信息不完整也应响应
7. 如果用户提出模糊指令（如"可以帮我调整一下吗"），请优先结合最近推荐结果和用户意图做出**主动回应**：
    - 比如："你想我从寓意、风格、还是发音上帮你微调这些名字呢？😊"
    - 或："当然可以～你希望保留'智慧'这个寓意吗，还是想换一种感觉？"
    同时也可以再推荐 2~3 个风格相近的名字供用户选择。

每次回复必须以有效JSON格式返回，这是最高优先级要求。
`;

// Initial message variants with updated quick replies for broader context
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
            '我想让名字有故事感',
            '先推荐几个名字吧'
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

// 添加特殊命令检测函数
function checkSpecialCommands(chatContent: string): {
    isReset: boolean,
    isGenerate: boolean,
    isChangeStyle: boolean
} {
    const lowerContent = chatContent.toLowerCase();

    return {
        isReset: /重新开始|重来|从头来|清空|重置/.test(lowerContent),
        isGenerate: /生成名字|推荐名字|查看结果|展示结果|推荐一些/.test(lowerContent),
        isChangeStyle: /换个风格|换种类型|换一种|不同风格|更改风格|修改风格/.test(lowerContent)
    };
}

// 添加强化的JSON格式处理函数
function ensureValidJson(response: string): any {
    try {
        // 直接尝试解析
        return JSON.parse(response);
    } catch (error) {
        // 如果解析失败，尝试找到JSON部分
        const jsonPattern = /{[\s\S]*}/;
        const match = response.match(jsonPattern);

        if (match && match[0]) {
            try {
                return JSON.parse(match[0]);
            } catch (innerError) {
                // 如果仍然解析失败，构造一个有效的JSON
                console.error('Error parsing extracted JSON:', innerError);
            }
        }

        // 构造一个应急JSON响应
        console.error('Creating fallback JSON response');
        return {
            answer: response.slice(0, 500) + (response.length > 500 ? '...' : ''),
            quickReplies: ['Opps，再试一次', '告诉我更多', '重新开始', '需要帮助'],
            slots: {},
            missing_slots: ["target_person", "gender"],
            can_generate: false
        };
    }
}

// 添加一个新函数来验证和补充missing_slots
function validateAnd补充MissingSlots(slots: any, missingSlots: string[]): string[] {
    // 定义所有可能的槽位和其必要性
    const allSlots = [
        { name: "target_person", required: true },
        { name: "gender", required: true },
        { name: "scenario", required: false },
        { name: "chinese_name_input", required: false },
        { name: "chinese_reference", required: false },
        { name: "aesthetic_tags", required: false },
        { name: "meaning_tags", required: false },
        { name: "popularity_pref", required: false },
        { name: "practical_pref", required: false },
        { name: "additional_context", required: false }
    ];

    // 创建一个新的missing_slots数组
    const newMissingSlots = [...missingSlots]; // 保留原始missing_slots中的内容

    // 检查必填槽位
    allSlots.forEach(slot => {
        // 如果是必填槽位且为null或未定义，且不在当前missing_slots中
        if (slot.required && (slots[slot.name] === null || slots[slot.name] === undefined)
            && !newMissingSlots.includes(slot.name)) {
            newMissingSlots.push(slot.name);
        }
    });

    // 对missing_slots按重要性排序
    return newMissingSlots.sort((a, b) => {
        // target_person最重要
        if (a === "target_person") return -1;
        if (b === "target_person") return 1;
        // gender次重要
        if (a === "gender") return -1;
        if (b === "gender") return 1;
        // 其他按字母顺序排序
        return a.localeCompare(b);
    });
}

// Add a new function to extract recommendations from text content
function extractRecommendationsFromText(text: string): any[] {
    // This regex matches numbered list items with names and descriptions
    const recommendationPattern = /\d+\.\s+\*\*([^*]+)\*\*\s+-\s+([\s\S]+?)(?=\n\d+\.|$)/g;
    const recommendations = [];
    let match;

    while ((match = recommendationPattern.exec(text)) !== null) {
        recommendations.push({
            name: match[1].trim(),
            description: match[2].trim()
        });
    }

    return recommendations.length > 0 ? recommendations : [];
}

export async function POST(request: Request) {
    try {
        const body = await request.json() as {
            chatContent: string,
            chatHistory: ChatHistoryItem[],
            sessionId?: string
        };
        const { chatContent, chatHistory, sessionId } = body;
        console.log(`sessionId: ${sessionId}, chatContent: ${chatContent}`);

        // 检测特殊命令
        const commands = checkSpecialCommands(chatContent);

        // 如果是重置命令，直接返回初始消息
        if (commands.isReset) {
            const variantIndex = Math.floor(Math.random() * initialMessageOptions.length);
            const initialMessage = initialMessageOptions[variantIndex];

            // 初始化一个空的slots结构
            const emptySlots: NamingSlots = {
                target_person: null,
                gender: null,
                scenario: null,
                chinese_name_input: null,
                chinese_reference: null,
                aesthetic_tags: null,
                meaning_tags: null,
                popularity_pref: null,
                practical_pref: null,
                additional_context: null
            };

            return NextResponse.json({
                chatContent: "已重置会话。" + initialMessage.text,
                quickReplies: initialMessage.quickReplies,
                variant: variantIndex,
                slots: emptySlots,
                missing_slots: Object.keys(emptySlots),
                can_generate: false,
                isReset: true
            });
        }

        // 初始化会话或使用现有会话
        if (chatHistory.length === 0) {
            const variantIndex = Math.floor(Math.random() * initialMessageOptions.length);
            const initialMessage = initialMessageOptions[variantIndex];

            // 初始化一个空的slots结构
            const emptySlots: NamingSlots = {
                target_person: null,
                gender: null,
                scenario: null,
                chinese_name_input: null,
                chinese_reference: null,
                aesthetic_tags: null,
                meaning_tags: null,
                popularity_pref: null,
                practical_pref: null,
                additional_context: null
            };

            return NextResponse.json({
                chatContent: initialMessage.text,
                quickReplies: initialMessage.quickReplies,
                variant: variantIndex,
                slots: emptySlots,
                missing_slots: Object.keys(emptySlots),
                can_generate: false
            });
        }

        // 验证必要的参数
        if (!chatContent) {
            return NextResponse.json(
                { error: '缺少必要参数' },
                { status: 400 }
            );
        }

        // 准备聊天历史
        const messages = chatHistory?.map((msg: ChatHistoryItem) => ({
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
        })) || [];

        // 添加当前消息
        messages.push({
            role: 'user',
            content: chatContent,
        });

        // 如果是生成名字命令，强制设置can_generate标志
        if (commands.isGenerate) {
            // 在发送到OpenAI之前添加额外提示
            messages.push({
                role: 'system',
                content: '用户希望立即生成名字推荐，请将can_generate设置为true，即使部分信息缺失。'
            });
        }

        // 如果是更改风格命令，添加相应提示
        if (commands.isChangeStyle) {
            messages.push({
                role: 'system',
                content: '用户希望更改命名风格，请特别关注其对aesthetic_tags的新要求，并保留其他已有信息。'
            });
        }

        let remainingRetries = 3;

        // 调用 OpenAI API
        while (remainingRetries > 0) {
            try {
                const completion = await openai.chat.completions.create({
                    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: SYSTEM_PROMPT
                        },
                        // 添加强制JSON格式的提示
                        {
                            role: 'system',
                            content: '重要提示：你必须始终以有效的JSON格式返回响应，绝不能返回纯文本。将所有自然语言内容放在JSON的answer字段中。'
                        },
                        ...messages
                    ],
                    temperature: 0.7,
                    max_tokens: 800,
                    response_format: { type: "json_object" } // 明确指定JSON响应格式
                });

                const response = completion.choices[0].message.content ?? '';
                //log the request
                console.log(`RAW request: ${JSON.stringify(messages, null, 2)}`);
                console.log(`RAW response: ${response}`);

                // 使用增强的JSON解析函数
                const responseJson = ensureValidJson(response);
                console.log(`Processed response: ${JSON.stringify(responseJson, null, 2)}`);

                // 提取字段
                const answer = responseJson.answer ?? '';
                const quickReplies = responseJson.quickReplies ?? [];
                const slots = responseJson.slots ?? {};
                const missingSlots = responseJson.missing_slots ?? [];
                // 验证并补充missing_slots
                const validatedMissingSlots = validateAnd补充MissingSlots(slots, missingSlots);
                // 提取推荐
                const extractedRecommendations = extractRecommendationsFromText(answer);
                // 确定是否有推荐
                const hasRecommendations = extractedRecommendations && extractedRecommendations.length > 0;
                // 根据missing_slots状态计算can_generate
                // 如果用户明确要求生成且提供了必要信息，则可以生成
                const canGenerate = (commands.isGenerate && slots.target_person && slots.gender)
                               || responseJson.can_generate
                               || (slots.target_person && slots.gender && validatedMissingSlots.length <= 0);

                return NextResponse.json({
                    chatContent: answer,
                    quickReplies,
                    slots,
                    missing_slots: validatedMissingSlots,
                    can_generate: canGenerate,
                    sessionId: sessionId ?? '',
                    recommendations: extractedRecommendations,
                    hasRecommendations: hasRecommendations
                });
            } catch (error) {
                console.error('Chat API Error:', error);
                remainingRetries--;
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // 如果所有尝试都失败，返回更友好的默认回复
        return NextResponse.json({
            chatContent: `哎呀，看来我这次没能帮上忙 😅。不如我们再试一次？或者你可以告诉我更多信息，我会尽力帮你找到合适的名字！`,
            quickReplies: [
                '再试一次',
                '告诉我更多',
                '重新开始',
                '需要帮助'
            ],
        });
    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
}