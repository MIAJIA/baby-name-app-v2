# 宝宝取名助手

这是一个基于 Next.js 开发的宝宝取名应用，帮助父母为新生儿选择合适的名字。

## 主要功能

- 智能取名建议：通过 AI 技术提供个性化的宝宝名字建议
- 实时对话交互：支持与 AI 进行自然语言对话，讨论名字选择
- 现代化界面：使用 Tailwind CSS 构建的响应式用户界面

## 技术栈

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS

## 快速开始

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 在浏览器中访问 `http://localhost:3000`

## 功能说明

### 1. 多轮智能命名对话（/search）

- 用户可以通过自然语言输入与 AI 进行多轮对话，系统将逐步识别用户的命名偏好。
- 支持识别以下核心信息字段（slots）：
  - 起名对象（如宝宝、自己、女儿等）
  - 性别（Male / Female / Neutral）
  - 中文名输入（如“诗涵”）
  - 中文名映射偏好（音译 / 含义 / 无需参考）
  - 审美风格（如优雅、小众、中性酷感）
  - 寓意偏好（如自由、成功、希望）
  - 流行度偏好（热门名 / 冷门名 / 混合）
  - 实用性偏好（发音拼写易读、跨语言等）
  - 附加上下文（如用户提到的文化背景、喜欢的音节、对某种感觉的偏好等自由输入内容）

- 所有核心字段支持非线性获取：用户可任意表达、随时生成名字或更改偏好，无需强制填写完整信息。

#### 1.1 核心功能能力

- 支持多轮自然对话引导：模拟轻松自然的聊天过程，逐步理解用户命名需求
- 命名偏好信息提取（Slot Filler）：自动识别用户话语中的关键信息，如命名对象、性别、审美等
- 对话状态追踪：记录当前已获取/缺失的信息，避免重复提问，支持跳过、重置
- 命名推荐生成引擎：根据当前输入实时生成候选名字，并提供含义、风格、流行度等详细信息
- 即时生成与控制：用户可随时说“生成名字”、“重新开始”、“换风格”等，自由控制交互节奏

#### 1.2 Slot 字段结构标准

以下为多轮对话中识别并追踪的核心字段结构定义（slots）：

```ts
interface NamingSlots {
  target_person: string | null;               // 起名对象，例如“女儿”、“宝宝”、“自己”
  gender: "male" | "female" | "neutral" | null;
  scenario: string | null;                    // 使用场景（如出国留学、护照签证、职场等）
  chinese_name_input: string | null;          // 中文名原文（如“诗涵”）
  chinese_reference: "phonetic" | "semantic" | "none" | "both" | null;  // 是否参考发音 / 含义 / 都不参考 / 两者都参考
  aesthetic_tags: string[] | null;            // 审美风格（如优雅、小众、老钱风、中性等）
  meaning_tags: string[] | null;              // 寓意偏好（如希望、光芒、智慧）
  popularity_pref: "popular" | "avoid_popular" | "mixed" | null; // 流行度偏好（热门名 / 冷门名 / 混合）
  practical_pref: string | null;              // 实用性偏好（如“发音简单”、“拼写直观”、“多语言通用”）
  additional_context: string | null;          // 其他附加说明（如喜欢的文化背景、参考人物、音节偏好、八字等）
}
```

#### 1.3 多轮对话流程与控制逻辑

1. **用户首次输入**：支持自由表达，如“我想给我女儿起一个英文名，她中文名是诗涵”。
2. **系统抽取关键信息（Slot Filling）**：自动提取如 `target_person`, `gender`, `chinese_name_input`, `aesthetic_tags` 核心字段结构等。
3. **对话状态追踪**：
   - 已识别字段将记录入对话状态
   - 系统会动态判断缺失字段，并通过自然语言引导用户补充
4. **灵活交互机制**：
   - 用户可随时触发推荐，不必等待所有信息齐全
   - 用户可说“换个风格”、“我想要更冷门一点的名字”、“重新开始”等，自由控制取名流程

#### 1.4 接口交互说明

本模块使用以下主要接口进行前后端交互：

- `POST /api/conversation`
  - 功能：处理用户每轮自然语言输入，提取命名偏好信息，返回 AI 回复与当前 slot 状态
  - 请求参数：
    - `session_id`: 当前会话 ID（由前端生成 UUID）
    - `user_message`: 用户输入的自由文本
  - 返回字段：
    - `reply`: AI 的回复
    - `slots`: 当前已识别的偏好字段
    - `missing_slots`: 仍缺失的字段
    - `can_generate`: 是否可以立即生成名字推荐

- `POST /api/generate-names`
  - 功能：基于当前 slot 信息生成推荐名字列表
  - 请求参数：`session_id`
  - 返回字段：`recommendations[]`（包含名字、含义、音标、风格、中文语义关联等）

- `POST /api/update-preference`
  - 功能：更新用户的命名偏好（如审美风格、流行度）
  - 请求参数：
    - `session_id`
    - `updates`: 指定字段的更新值（如 aesthetic_tags）

- `POST /api/reset-session`
  - 功能：清空当前会话，重置所有 slot 与 session_id


#### 1.5 命名卡片生成（带文化拓展）

当用户选定一个名字的时候， 我们将 以卡片的形式 展示包含用户选定名字的拓展内容模块； 命名卡片的内容包括「中英文名 + 风格 + 寓意 + 名言 + 插图背景」。

其中名言部分（可能来自不同的类型的内容 ，默认启用“文学引用”）

示例内容
📚 文学引用（默认）
“The aurora danced like fire across the sky…”
📝 AI愿景诗句
“You carry light not just in name, but in the way you move through the world.”
🌠 神话 / 历史引用
Asher: Tribe of Israel, symbol of blessing.
🧑‍🎓 名人语录
“Believe you can and you’re halfway there.” — Theodore Roosevelt
🧩 名字字母诗
L – Love that lights the wayI – Inner strength…

命名卡样式可导出为图片、壁纸或社交媒体模板。


#### 1.6 Session ID 管理机制

为了实现连续的多轮对话和个性化推荐追踪，系统依赖 `session_id` 来维持用户对话状态。当前版本中采用前端生成 UUID 的方式进行管理，逻辑如下：

- 首次打开页面时：
  - 前端通过 `uuidv4()` 生成一个唯一的 `session_id`
  - 存储于 `localStorage`，实现刷新页面后的状态保留
- 后续每轮请求均携带该 `session_id`
- 用户点击“重新开始”时：
  - 清除本地 `session_id`
  - 清空当前 Slot 状态
  - 系统会自动生成新的 `session_id`，开启新的命名会话流程

示例代码（前端）：

```ts
import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'namey_session_id';

export function getOrCreateSessionId(): string {
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const newId = uuidv4();
  localStorage.setItem(SESSION_KEY, newId);
  return newId;
}

export function resetSessionId(): void {
  localStorage.removeItem(SESSION_KEY);
}
```

说明：

- 当前 PoC 阶段不依赖用户登录，所有会话均基于本地 sessionId 隔离
- 后续如需支持多设备同步，可在登录后将 sessionId 与用户 ID 绑定

### 2. 名字推荐与展示

- 系统基于用户偏好从以下两种来源合并推荐：
  - 本地 SSA 数据：每年婴儿名字排名数据
  - OpenAI 模型：通过提示语获取的流行文化中常见名字（文学、影视、音乐等）

- 合并后去重，并通过 OpenAI 进一步根据偏好进行筛选。

- 每个推荐名字将包含完整信息结构：
  - 英文名
  - 发音（音标或音节分解）
  - 含义（语言来源、象征意义）
  - 风格标签（如优雅、甜感、中性等）
  - 流行度（如 US 排名 / 罕见度）
  - 中文语义/发音关系（如有）
  - 匹配字段映射（系统识别该名字与用户偏好之间的对应关系）
  - 推荐理由摘要（简要提示为什么这个名字匹配用户）

## 实现细节

## 项目结构

- `/app` - 主应用代码
  - `/components` - React 组件
  - `/api` - API 路由
- `/docs` - 项目文档