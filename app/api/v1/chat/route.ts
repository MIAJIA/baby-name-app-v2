import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { chatContent, chatHistory } = body;
        
        // 验证必要的参数
        if (!chatContent) {
            return NextResponse.json(
                { error: '缺少必要参数' },
                { status: 400 }
            );
        }

        // TODO: 这里是硬编码的响应，之后可以替换为真实的处理逻辑
        return NextResponse.json({
            chatContent: 'Hello World'
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
} 