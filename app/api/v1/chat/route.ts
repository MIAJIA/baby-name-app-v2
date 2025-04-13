import { ChatHistoryItem } from '@/app/lib/types';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        const body = await request.json() as { chatContent: string, chatHistory: ChatHistoryItem[] };
        const { chatContent, chatHistory } = body;
        console.log(`chatContent: ${chatContent}, chatHistory: ${chatHistory}`);
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

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: '你是一个专业的宝宝取名助手，帮助父母为新生儿选择合适的名字。请用中文回答，并提供3-5个快速回复选项。'
                },
                ...messages
            ],
            temperature: 0.7,
            max_tokens: 500,
        });

        const response = completion.choices[0].message.content;
        
        // Extract quick replies from the response
        const quickReplies = response?.match(/【快速回复】([^【]+)/)?.[1]
            .split('\n')
            .filter(line => line.trim())
            .map(line => line.replace(/^\d+\.\s*/, '').trim())
            .slice(0, 5) || [];

        return NextResponse.json({
            chatContent: response,
            quickReplies,
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
} 