import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sessionId, slots } = body;

        if (!sessionId || !slots) {
            return NextResponse.json(
                { error: '缺少必要参数' },
                { status: 400 }
            );
        }

        // 优化名字生成的提示语
        const prompt = `【名字生成任务】
作为专业的英文取名助手，请基于以下用户提供的命名偏好，为${slots.target_person || '用户'}生成5个高度个性化的英文名字推荐。

【用户命名偏好详情】
- 起名对象: ${slots.target_person || '未指定'}
- 性别: ${slots.gender || '未指定'}
- 使用场景: ${slots.scenario || '日常生活/未指定'}
- 中文名参考: ${slots.chinese_name_input || '未提供'}
- 中文关联方式: ${slots.chinese_reference || '未指定'} (音译/含义/两者/不参考)
- 审美风格标签: ${Array.isArray(slots.aesthetic_tags) ? slots.aesthetic_tags.join(', ') : '未指定'}
- 寓意偏好: ${Array.isArray(slots.meaning_tags) ? slots.meaning_tags.join(', ') : '未指定'}
- 流行度偏好: ${slots.popularity_pref || '未指定'} (热门/冷门/混合)
- 实用性考虑: ${slots.practical_pref || '未指定'}
- 其他上下文: ${slots.additional_context || '无'}

【名字推荐要求】
1. 每个推荐必须符合用户明确指定的所有条件
2. ${slots.chinese_name_input ? `如果用户提供了中文名"${slots.chinese_name_input}"，请根据${slots.chinese_reference || '音译和含义'}进行关联` : '用户未提供中文名参考'}
3. 名字应当平衡独特性与实用性，避免过于怪异或难以发音的名字
4. 提供深度分析，而非表面简介
5. 特别关注名字与用户审美风格和寓意的匹配度

【返回格式】
请以精确的JSON格式返回，包含以下结构：
{
  "recommendations": [
    {
      "name": "推荐的英文名",
      "pronunciation": "发音指南，使用音标或音节分解",
      "meaning": "详细的名字含义，包括语言来源和文化背景",
      "style_tags": ["与该名字相关的2-4个风格标签"],
      "popularity": "流行度描述（如热门程度、排名趋势等）",
      "chinese_relation": "${slots.chinese_name_input ? '与中文名"' + slots.chinese_name_input + '"的关联说明' : '未提供中文名'}",
      "reason": "为什么这个名字特别适合用户需求的个性化解释"
    },
    // 其他4个推荐...
  ]
}

重要提示：确保返回的JSON格式完全正确，无多余文本，每个推荐的所有字段都必须填写。`;

        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.8,
            max_tokens: 1500,
        });

        const response = completion.choices[0].message.content;
        let recommendations = [];

        try {
            const responseJson = JSON.parse(response || '{}');
            recommendations = responseJson.recommendations || [];
        } catch (error) {
            console.error('Error parsing recommendations:', error);
            return NextResponse.json(
                { error: '无法生成名字推荐' },
                { status: 500 }
            );
        }

        return NextResponse.json({ recommendations });
    } catch (error) {
        console.error('Generate Names API Error:', error);
        return NextResponse.json(
            { error: '服务器内部错误' },
            { status: 500 }
        );
    }
}