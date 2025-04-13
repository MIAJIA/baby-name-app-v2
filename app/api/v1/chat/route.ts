import { ChatHistoryItem } from '@/app/lib/types';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `你是一个专业的宝宝取名助手，帮助父母为新生儿选择合适的名字。你需要回复JSON格式来回复用户的问题。

{
    "answer": "回答内容",
    "quickReplies": ["快速回复1", "快速回复2", "快速回复3", "快速回复4", "快速回复5"]
}

Please note that the answer and quickReplies must be returned in json format.

`;

// Initial message variants
const initialMessageOptions = [
    {
        text: "你好！我是你的宝宝起名助手。你想先看看男宝宝名字、女宝宝名字，还是想要一些通用建议呢？",
        quickReplies: ['建议男宝宝名字', '建议女宝宝名字', '我已经想好了', '给我一些通用建议']
    },
    {
        text: "您想给宝宝按照什么标准起名呢？",
        quickReplies: ['姓氏', '祝愿', '生肖', '星座', '五行', '诗词', '成语', '其他']
    },
    {
        text: "欢迎来到宝宝起名助手！",
        quickReplies: [
            '我该怎样给宝宝起名？',
            '起名字的讲究',
            '起名有什么技巧？',
        ]
    }
];

export async function POST(request: Request) {
    try {
        const body = await request.json() as { chatContent: string, chatHistory: ChatHistoryItem[] };
        const { chatContent, chatHistory } = body;
        console.log(`chatContent: ${chatContent}, chatHistory: ${chatHistory}`);

        // If this is the first message, return a random initial message
        if (chatHistory.length === 0) {
            const variantIndex = Math.floor(Math.random() * initialMessageOptions.length);
            const initialMessage = initialMessageOptions[variantIndex];
            
            return NextResponse.json({
                chatContent: initialMessage.text,
                quickReplies: initialMessage.quickReplies,
                variant: variantIndex
            });
        }

        // 验证必要的参数
        if (!chatContent) {
            return NextResponse.json(
                { error: '缺少必要参数' },
                { status: 400 }
            );
        }

        // Prepare the chat history for the API
        const messages = chatHistory?.map((msg: ChatHistoryItem) => ({
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
        })) || [];

        // Add the current message
        messages.push({
            role: 'user',
            content: chatContent,
        });
        let answer = '';
        let quickReplies: string[] = [];

        let remainingRetries = 3;
        // Call OpenAI API
        while (remainingRetries > 0) {
            try {
                const completion = await openai.chat.completions.create({
                    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'assistant',
                            content: SYSTEM_PROMPT
                        },
                        ...messages
                    ],
                    temperature: 0.7,
                    max_tokens: 500,
                });

                const response = completion.choices[0].message.content;
                console.log(`RAW response: ${response}`);
                // parse the response as json
                const responseJson = JSON.parse(response || '{}');
                console.log(`Parsed response: ${JSON.stringify(responseJson, null, 2)}`);
                // Extract quick replies from the response with better error handling
                answer = responseJson!.answer!;
                quickReplies = responseJson?.quickReplies || [];
                return NextResponse.json({
                    chatContent: answer,
                    quickReplies,
                });
            } catch (error) {
                console.error('Chat API Error: 1');
                remainingRetries--;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        return NextResponse.json({
            chatContent: `抱歉，我并不理解你的问题，可以换一种方式提问吗？`,
            quickReplies: [
                '起个男宝宝名字',
                '起个女宝宝名字',
            ],
        });
    } catch (error) {
        console.error('Chat API Error: 2');
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
} 