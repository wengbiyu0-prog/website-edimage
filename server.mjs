import { createServer } from "node:http";
import { appendFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";

const root = resolve(process.cwd());
const env = loadEnv();
const port = Number(env.PORT || 3000);
const apiKey = env.OPENROUTER_API_KEY;
const model = env.OPENROUTER_MODEL || "deepseek/deepseek-chat";
const supabaseUrl = (env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
const supabaseAnonKey = (env.SUPABASE_ANON_KEY || "").trim();
const useSupabase = Boolean(supabaseUrl && supabaseAnonKey);
const appBaseUrl = env.APP_BASE_URL || `http://localhost:${port}`;
const inviteCode = env.INVITE_CODE || "edimage-world";
const developerCode = env.DEVELOPER_CODE || "edithfish";
const inviteLimit = Number(env.INVITE_LIMIT || 10);
const dataDir = env.DATA_DIR ? resolve(root, env.DATA_DIR) : root;
const accessStatePath = join(dataDir, "ACCESS-STATE.json");
const knowledgeBasePath = join(dataDir, "KNOWLEDGE-BASE.md");
const knowledgeEntriesPath = join(dataDir, "KNOWLEDGE-ENTRIES.json");
const easterEggLibraryPath = join(dataDir, "EASTER-EGG-LIBRARY.md");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

const FORM_OPTIONS = ["日记体", "散文体", "软件对话", "纪实档案", "严肃文学", "现代诗", "网文"];
const TAG_OPTIONS = ["城市幽灵", "私人梦路", "童年梦核", "往日回响", "创伤记忆", "后室"];
const GENRE_OPTIONS = ["都市", "爱情", "惊悚", "爽感逆袭", "梦核", "怪谈", "恐怖", "犯罪", "喜剧", "古代"];
const STYLE_OPTIONS = ["荒诞文学", "存在主义", "实验小说", "哲学科幻", "犯罪悬疑网文", "浪漫主义"];

const systemPrompt = `
你是 EDIMAGE WORLD 的互动小说生成引擎。

EDIMAGE WORLD 是一个从“一句话念头”进入的文本开放世界。它不是普通 AI 写作工具，也不是聊天助手。

语言原则：
1. 梦核、克制、诗性、具体、有画面。
2. 不解释功能，不说“作为 AI”。
3. 不写工具说明，不写产品说明。
4. 选择项要像叙事岔路，不要像游戏任务。
5. 每次推进故事，都要产生新的可感知变化。
6. 保持中文输出。
7. 严格返回合法 JSON，不要 Markdown，不要代码块。
8. 所有卡片、正文和选项必须围绕用户 idea、知识库和当前正文推进。
9. 禁止生成与用户 idea 无关的泛化模板选项。
10. 如果知识库非空，优先吸收知识库的意象、地点、语言和设定。
11. 生成链路遵循：输入解析 -> 主题匹配 -> 剧情抽卡 -> 分支生成 -> 知识库召回 -> 二次回望 -> 最终整合。
12. 允许荒诞、幽默、彩蛋和断裂，但主线逻辑必须可回望、可接续。
13. 禁止默认使用第二人称“你”。除非体裁/类型确实需要读者代入，否则必须根据体裁切换第一人称、第三人称、档案口吻、对话记录、诗行或网文叙述。
14. 体裁、类型、流派不是标签装饰，必须改变文本形态、叙事视角、句法密度和段落结构。
`;

const server = createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/generate") {
      await handleGenerate(req, res);
      return;
    }

    if (req.method === "POST" && req.url === "/api/knowledge") {
      await handleKnowledge(req, res);
      return;
    }

    if (req.method === "GET" && req.url === "/api/knowledge") {
      await handleKnowledgeList(req, res);
      return;
    }

    if (req.method === "POST" && req.url === "/api/access/validate") {
      await handleAccessValidate(req, res);
      return;
    }

    if (req.method === "POST" && req.url === "/api/access/complete") {
      await handleAccessComplete(req, res);
      return;
    }

    if (req.method === "POST" && req.url === "/api/story/complete") {
      await handleStoryComplete(req, res);
      return;
    }

    if (req.method === "GET" && req.url === "/api/health") {
      const health = await getHealthState();
      sendJson(res, 200, {
        ok: true,
        app: "EDIMAGE WORLD",
        port,
        dataDir,
        storage: useSupabase ? "supabase" : "local",
        supabase: health.supabase,
        inviteLimit,
        totalStoryCompletions: health.accessState.totalStoryCompletions || 0
      });
      return;
    }

    if (req.method === "GET" && req.url === "/api/stats") {
      const accessState = await getAccessState();
      sendJson(res, 200, {
        ok: true,
        totalStoryCompletions: accessState.totalStoryCompletions || 0
      });
      return;
    }

    if (req.method === "GET") {
      await serveStatic(req, res);
      return;
    }

    sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "EDIMAGE WORLD 暂时没有回应。" });
  }
});

server.listen(port, "0.0.0.0", async () => {
  await ensureRuntimeFiles();
  console.log(`EDIMAGE WORLD running at http://localhost:${port}`);
  if (!apiKey || apiKey.includes("PASTE")) {
    console.log("OPENROUTER_API_KEY is not set yet. Add it to .env before using real generation.");
  }
});

async function handleGenerate(req, res) {
  if (!apiKey || apiKey.includes("PASTE")) {
    sendJson(res, 500, { error: "OPENROUTER_API_KEY is missing" });
    return;
  }

  const body = await readJsonBody(req);
  const { stage, payload } = body;
  const prompt = await buildPrompt(stage, payload || {});

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": appBaseUrl,
      "X-OpenRouter-Title": "EDIMAGE WORLD"
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.94,
      frequency_penalty: 0.35,
      presence_penalty: 0.28,
      max_tokens: stage === "finalize" ? 1800 : 1100,
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("OpenRouter error:", data);
    sendJson(res, response.status, { error: data.error?.message || "OpenRouter request failed" });
    return;
  }

  const content = data.choices?.[0]?.message?.content;
  const parsed = parseJsonContent(content);
  sendJson(res, 200, sanitizeGeneratedPayload(stage, parsed, payload || {}));
}

async function handleKnowledge(req, res) {
  const entry = await readJsonBody(req);
  const safeTitle = String(entry.title || "未命名碎片").replace(/\n/g, " ").trim();
  const safeAuthor = String(entry.author || "").replace(/\n/g, " ").trim();
  const safeTags = String(entry.tags || "").replace(/\n/g, " ").trim();
  const safeText = String(entry.text || "").trim();
  const createdAt = new Date().toISOString();

  if (!safeText) {
    sendJson(res, 400, { error: "Knowledge text is empty" });
    return;
  }

  const storedEntry = {
    id: `memory-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title: safeTitle,
    author: safeAuthor,
    tags: safeTags,
    text: safeText,
    createdAt
  };

  const block = [
    "",
    `## ${safeTitle}`,
    "",
    `作者：${safeAuthor || "匿名缔造者"}`,
    "权限：个人可用",
    "类型：创意文本",
    `标签：${safeTags}`,
    `写入时间：${createdAt}`,
    "",
    "正文：",
    safeText,
    ""
  ].join("\n");

  if (useSupabase) {
    await insertKnowledgeEntrySupabase(storedEntry);
  } else {
    await ensureRuntimeFiles();
    const entries = readKnowledgeEntries();
    entries.push(storedEntry);
    await writeKnowledgeEntries(entries);
    await appendFile(knowledgeBasePath, block, "utf8");
  }

  sendJson(res, 200, { ok: true, entry: storedEntry });
}

async function handleKnowledgeList(req, res) {
  const entries = useSupabase ? await listKnowledgeEntriesSupabase() : (await ensureRuntimeFiles(), readKnowledgeEntries());
  sendJson(res, 200, {
    ok: true,
    entries
  });
}

async function handleAccessValidate(req, res) {
  const body = await readJsonBody(req);
  const code = String(body.code || "").trim();
  const accessState = await getAccessState();

  if (code === developerCode) {
    sendJson(res, 200, {
      ok: true,
      mode: "developer",
      remaining: "unlimited",
      sessionId: `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`
    });
    return;
  }

  const remaining = Math.max(0, inviteLimit - accessState.inviteCompletions);

  if (code !== inviteCode) {
    sendJson(res, 403, { ok: false, error: "体验码不正确。", remaining });
    return;
  }

  if (remaining <= 0) {
    sendJson(res, 403, { ok: false, error: "体验码可用次数已经用完。", remaining: 0 });
    return;
  }

  const sessionId = `invite-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  accessState.issuedInviteSessions.push(sessionId);
  accessState.issuedInviteSessions = accessState.issuedInviteSessions.slice(-200);
  await saveAccessState(accessState);

  sendJson(res, 200, {
    ok: true,
    mode: "invite",
    remaining,
    sessionId
  });
}

async function handleAccessComplete(req, res) {
  const body = await readJsonBody(req);
  const sessionId = String(body.sessionId || "").trim();
  const accessState = await getAccessState();

  if (!sessionId || accessState.completedSessions.includes(sessionId)) {
    sendJson(res, 200, {
      ok: true,
      remaining: Math.max(0, inviteLimit - accessState.inviteCompletions),
      alreadyCounted: true
    });
    return;
  }

  if (!accessState.issuedInviteSessions.includes(sessionId)) {
    sendJson(res, 403, {
      ok: false,
      error: "Invalid invite session",
      remaining: Math.max(0, inviteLimit - accessState.inviteCompletions)
    });
    return;
  }

  if (accessState.inviteCompletions < inviteLimit) {
    accessState.inviteCompletions += 1;
    accessState.completedSessions.push(sessionId);
    accessState.issuedInviteSessions = accessState.issuedInviteSessions.filter((id) => id !== sessionId);
    accessState.completedSessions = accessState.completedSessions.slice(-200);
    accessState.issuedInviteSessions = accessState.issuedInviteSessions.slice(-200);
    await saveAccessState(accessState);
  }

  sendJson(res, 200, {
    ok: true,
    remaining: Math.max(0, inviteLimit - accessState.inviteCompletions),
    alreadyCounted: false
  });
}

async function handleStoryComplete(req, res) {
  const body = await readJsonBody(req);
  const sessionId = String(body.sessionId || "").trim();
  const accessState = await getAccessState();

  if (!sessionId || accessState.completedStorySessions.includes(sessionId)) {
    sendJson(res, 200, {
      ok: true,
      totalStoryCompletions: accessState.totalStoryCompletions || 0,
      alreadyCounted: true
    });
    return;
  }

  accessState.totalStoryCompletions = Number(accessState.totalStoryCompletions || 0) + 1;
  accessState.completedStorySessions.push(sessionId);
  accessState.completedStorySessions = accessState.completedStorySessions.slice(-500);
  await saveAccessState(accessState);

  sendJson(res, 200, {
    ok: true,
    totalStoryCompletions: accessState.totalStoryCompletions,
    alreadyCounted: false
  });
}

async function buildPrompt(stage, payload) {
  const knowledge = await buildKnowledgePrompt(payload);
  const easter = buildEasterPrompt(payload);
  const framework = `${buildTextualOntologyHarnessPrompt()}\n\n${buildGenerationFrameworkPrompt()}`;
  const narrativeContract = buildNarrativeContractPrompt(payload);

  if (stage === "cards") {
    return `
根据用户想法，为 EDIMAGE WORLD 生成抽卡结果。先做输入解析，再做主题匹配，再做剧情抽卡。

用户想法：
${payload.idea}

本次抽卡随机因子：
${payload.drawNonce || "none"}

${framework}

${knowledge}

要求：
1. 必须先提取关键词、情绪向量、潜在主题，再据此选卡。
2. conceptTags 是最终选中的 3 个标签，优先从给定标签库中抽取，也可在必要时轻微变体，但不能偏离用户 idea。
3. candidates.conceptTags 返回 3 组候选，每组 3 个标签。
4. form 必须优先从这些体裁中选择：${FORM_OPTIONS.join("、")}。
5. genre 必须优先从这些类型中选择：${GENRE_OPTIONS.join("、")}。
6. style 这里承载“流派/文风倾向”，优先从这些流派中选择：${STYLE_OPTIONS.join("、")}。
7. 每个候选都必须解释它与用户 idea 的关系，不允许模板式空话。
8. 输出 analysis 时，要写出输入解析、主题匹配结果和可能触发的剧情抽卡方向。
9. explanations 每项都只写一句，短、轻、有画面。
10. 每次抽卡都要把“本次抽卡随机因子”当作洗牌依据；同一个 idea 再抽一次，也必须在候选排序、措辞或组合上出现变化。
11. candidates 不是静态菜单。它们必须像本次 idea 的 3 到 5 种显影方案，而不是固定词库的机械复用。

只返回 JSON：
{
  "text_generation_unit": {
    "text_category": { "primary": "", "secondary": "" },
    "genre": { "primary": "", "secondary": "", "core_desire": "", "core_conflict": "", "core_emotion": "" },
    "form": { "primary": "", "secondary": "" },
    "structure": { "temporal": "", "causal": "", "plot": "", "informational": "", "spatial": "" },
    "technique": ["", ""],
    "style": { "aesthetic": ["", ""], "language": {}, "rhythm": "", "intensity": "" },
    "cultural_modifier": { "region": "", "period": "", "social_context": [], "retrieval_need": false },
    "media_texture": { "source_texture": "", "format_markers": [], "degradation_markers": [] },
    "interaction_mechanism": { "choice_types": ["", ""], "state_effects": ["", ""] },
    "generation_constraints": { "length": "", "options": "", "must_include": ["", ""], "must_avoid": ["", ""] }
  },
  "narrativePlan": {
    "core_desire": "",
    "core_conflict": "",
    "core_emotion": "",
    "scene_anchor": "",
    "information_gap": "",
    "state_delta": ""
  },
  "conceptTags": ["", "", ""],
  "form": "",
  "genre": "",
  "style": "",
  "analysis": {
    "keywords": ["", ""],
    "moodVector": ["", ""],
    "latentThemes": ["", ""],
    "sceneTemplate": "",
    "atmosphere": "",
    "plotDraw": "",
    "easterSignal": ""
  },
  "candidates": {
    "conceptTags": [["", "", ""], ["", "", ""], ["", "", ""]],
    "form": ["", "", ""],
    "genre": ["", "", ""],
    "style": ["", "", ""]
  },
  "explanations": {
    "conceptTags": "",
    "form": "",
    "genre": "",
    "style": ""
  }
}
`;
  }

  if (stage === "story_opening") {
    return `
为 EDIMAGE WORLD 生成互动小说开场。要显式完成：主题匹配、剧情抽卡、知识库召回的初次融合。

用户最初想法：
${payload.idea}

抽卡结果：
${JSON.stringify(payload.cards)}

体量：
${JSON.stringify(payload.level)}

${framework}

${knowledge}

${easter}

${narrativeContract}

要求：
1. text 写 260 到 520 个中文字。
2. 开场必须直接吸收用户 idea 中的具体对象、情境或矛盾，不能先空镜头抒情。
3. 开场要给出明确的场景模板与氛围描述，但不要像策划案一样说教。
4. choices 默认生成 2 到 3 个；只有在沉浸体验强烈需要时，才使用 1 个或 4 个。
5. 每个选择都要像剧情片段的延长线，而不是任务按钮。
6. customInput 根据情节点判断是否开放；如果开放，prompt 必须非常具体，像在邀请用户写下一句会改变情节的话。
7. 如果用户 idea 命中彩蛋词，只记录“稍后可插入”，不要在开场暴露彩蛋。
8. 输出 branchMemory，用一句短语记录这一轮分支的核心状态，供后续回望。
9. 正文第一句必须体现本轮体裁，不许以“你醒来/你发现/你走进/你站在”这种默认互动小说句式开头，除非 narrativeMode 明确选择第二人称沉浸模式。
10. choices 的数量和文本必须根据当前情节点推理生成；不要每轮都给 3 个，不要把选项写成通用任务。
11. 必须使用抽卡结果中的 text_generation_unit 与 narrativePlan；如果缺失，也要现场补全，不得只依据 form/genre/style 四个表层字段。

只返回 JSON：
{
  "narrativeMode": "",
  "text_generation_unit": {},
  "state_update": {},
  "text": "",
  "choices": ["", "", ""],
  "customInput": {
    "enabled": false,
    "prompt": ""
  },
  "branchMemory": "",
  "atmosphere": "",
  "plotDraw": ""
}
`;
  }

  if (stage === "story_step") {
    return `
继续生成 EDIMAGE WORLD 的互动小说下一轮。要显式完成：分支生成、知识库召回、二次回望。

用户最初想法：
${payload.idea}

抽卡结果：
${JSON.stringify(payload.cards)}

体量：
${JSON.stringify(payload.level)}

当前路径：
${JSON.stringify(payload.path)}

已有正文：
${JSON.stringify(payload.paragraphs)}

当前故事状态：
${JSON.stringify(payload.storyState || {})}

用户刚刚选择：
${payload.selectedChoice}

当前轮次：
${payload.turn}

${framework}

${knowledge}

${easter}

${narrativeContract}

要求：
1. text 写 260 到 520 个中文字。
2. 延续已有正文，不要重启故事。
3. 必须承接用户刚刚选择，尤其是“自定义：”开头的自由输入。
4. 在下文生成前，先做一次二次回望：检查当前选择是否与前文人物、地点、因果、情绪一致；若不一致，要在 text 中自然修正。
5. choices 默认返回 2 到 3 个，且必须体现清晰的方向分叉。
6. 每个选择必须引用或转化当前正文、用户 idea、已选标签、体裁、类型、流派或知识库中的具体元素。
7. 禁止输出与用户 idea 无关的模板选项。
8. customInput 根据情节点判断是否开放；不是每轮都开放。
9. 如果故事适合结束，shouldEnd 可以为 true；否则 false。
10. 如果彩蛋已在前端插入，本轮必须回到原主线叙事。
11. 输出 callbackLines，列出本轮主动回望了哪些前文线索。
12. 必须延续或合理演化 narrativeMode，不能突然退回统一第二人称旁白。
13. choices 必须由本轮 text 的具体情境长出来；数量可以是 1、2、3 或 4，按沉浸体验决定。
14. 严禁把用户路径逐条复述成“补充材料/当事路径选择为……”。已有正文只用于回望，不允许整段复制、同义改写或列表式重播。
15. text 必须写“新发生的叙事”，而不是对用户选择和历史路径做摘要。
16. 必须输出 state_update，说明本轮改变了哪些角色、空间、物件、信息、情绪或文本形式参数。
17. 新文本必须承认并继承“当前故事状态”中的未解决问题、物件、关系和上一轮变化；不能像多个不相干片段拼接。
18. 禁止使用“当……成为事实，人物之间……”这类模板句；每一轮都要出现一个具体新增物件、动作或信息差。

只返回 JSON：
{
  "narrativeMode": "",
  "text_generation_unit": {},
  "state_update": {},
  "text": "",
  "choices": ["", "", ""],
  "customInput": {
    "enabled": false,
    "prompt": ""
  },
  "shouldEnd": false,
  "branchMemory": "",
  "callbackLines": ["", ""]
}
`;
  }

  if (stage === "finalize") {
    return `
把互动小说过程整理成一篇完整小说。要完成最终整合与终局回望。

用户最初想法：
${payload.idea}

抽卡结果：
${JSON.stringify(payload.cards)}

体量：
${JSON.stringify(payload.level)}

路径选择：
${JSON.stringify(payload.path)}

正文片段：
${JSON.stringify(payload.paragraphs)}

${framework}

${knowledge}

${narrativeContract}

要求：
1. body 是连贯小说正文，不要保留“用户选择了”这种日志感。
2. 优先保留用户 idea、分支记忆和知识库中真正出现过的意象，不要强行套固定风格。
3. 在正文成稿前做一次回望重构：让前文看似偶然的句子、物件、情绪至少有 1 次照应。
4. title 要短，有作品感。
5. openingLine 是一句引言。
6. summary 是 80 字以内摘要。
7. 如果路径中出现彩蛋，正文可以用一句极短的异物感痕迹带过，但不要让彩蛋吞掉主线。
8. 输出 callbacks，概述这篇成稿如何回望前文。
9. body 必须保持一路选定的体裁格式，不要在终稿里改回普通第二人称互动小说。
10. body 必须是一次完整重写后的成稿，不允许把正文片段按顺序拼接。
11. 不允许在 body 中出现“路径选择”“补充材料”“我把刚才那条选择写下来”“用户选择了”“第几处岔路”等过程痕迹。
12. 如果正文片段之间风格不统一、重复或像模块拼接，你必须主动统一措辞、视角、节奏和叙事因果。

只返回 JSON：
{
  "narrativeMode": "",
  "title": "",
  "openingLine": "",
  "body": "",
  "summary": "",
  "callbacks": ["", ""]
}
`;
  }

  return JSON.stringify(payload);
}

function sanitizeGeneratedPayload(stage, parsed, payload) {
  if (!parsed || typeof parsed !== "object") return parsed;

  if (stage === "cards") {
    const candidates = parsed.candidates || {};
    parsed.candidates = {
      ...candidates,
      conceptTags: uniqueConceptGroups(candidates.conceptTags || parsed.conceptTags),
      form: uniqueStrings(candidates.form || parsed.form),
      genre: uniqueStrings(candidates.genre || parsed.genre),
      style: uniqueStrings(candidates.style || parsed.style)
    };

    parsed.text_generation_unit = normalizeTextGenerationUnit(parsed.text_generation_unit, payload, parsed);
    parsed.narrativePlan = normalizeNarrativePlan(parsed.narrativePlan, parsed.text_generation_unit, payload);
  }

  if (stage === "story_opening" || stage === "story_step") {
    parsed.text_generation_unit = normalizeTextGenerationUnit(parsed.text_generation_unit || payload.cards?.text_generation_unit, payload, parsed);
    parsed.state_update = parsed.state_update || buildFallbackStateUpdate(payload, parsed);
    parsed.choices = repairChoices(uniqueChoiceLabels(parsed.choices), payload, parsed, stage);

    if (stage === "story_step") {
      parsed.text = polishStoryStepText(parsed.text, payload);
    }
  }

  return parsed;
}

function normalizeTextGenerationUnit(unit, payload, parsed = {}) {
  const cards = payload.cards || {};
  const concept = Array.isArray(cards.concept) ? cards.concept : parsed.conceptTags || [];
  const idea = String(payload.idea || "").trim();
  const textCategory = unit?.text_category || {};
  const genre = unit?.genre || {};
  const form = unit?.form || {};

  return {
    ...(unit && typeof unit === "object" ? unit : {}),
    user_idea: unit?.user_idea || idea,
    text_category: {
      primary: textCategory.primary || inferTextCategory(cards.form || parsed.form),
      secondary: textCategory.secondary || "数字交互文本"
    },
    genre: {
      primary: genre.primary || cards.genre || parsed.genre || "梦核",
      secondary: genre.secondary || concept[0] || "私人梦路",
      core_desire: genre.core_desire || "确认最初念头背后真正想抵达的东西",
      core_conflict: genre.core_conflict || "现实解释与异常经验互相抵触",
      core_emotion: genre.core_emotion || "不安、好奇、被召回"
    },
    form: {
      primary: form.primary || cards.form || parsed.form || "散文体",
      secondary: form.secondary || inferSecondaryForm(cards.form || parsed.form)
    },
    structure: unit?.structure || {
      temporal: "断裂时间",
      causal: /犯罪|悬疑|调查|档案/.test(`${cards.genre}${cards.style}${cards.form}`) ? "强因果结构" : "弱因果结构",
      plot: "追寻结构",
      informational: "信息缺失结构",
      spatial: "阈限空间"
    },
    technique: Array.isArray(unit?.technique) && unit.technique.length ? unit.technique : ["限知视角", "留白", "重复变奏"],
    style: unit?.style || {
      aesthetic: [cards.style || parsed.style || "克制", "诡谲"],
      language: { sentence_length: "中短句", explanation_level: "低", sensory_density: "中高" },
      rhythm: "断裂",
      intensity: "中"
    },
    cultural_modifier: unit?.cultural_modifier || {
      region: "当代中文语境",
      period: "移动互联网时期",
      social_context: ["城市流动环境"],
      retrieval_need: false
    },
    media_texture: unit?.media_texture || {
      source_texture: inferMediaTexture(cards.form || parsed.form),
      format_markers: ["时间标记"],
      degradation_markers: ["缺句"]
    },
    interaction_mechanism: unit?.interaction_mechanism || {
      choice_types: ["行动驱动", "信息驱动", "解释驱动"],
      state_effects: ["空间状态变化", "已知信息变化", "情绪距离变化"]
    },
    generation_constraints: unit?.generation_constraints || {
      length: "260-520字",
      options: "2-4",
      must_include: ["具体物象", "信息缺口", "情绪变化"],
      must_avoid: ["结尾升华", "重复选项", "空泛抒情"]
    }
  };
}

function normalizeNarrativePlan(plan, unit, payload) {
  const idea = String(payload.idea || "").trim();
  return {
    ...(plan && typeof plan === "object" ? plan : {}),
    core_desire: plan?.core_desire || unit.genre.core_desire,
    core_conflict: plan?.core_conflict || unit.genre.core_conflict,
    core_emotion: plan?.core_emotion || unit.genre.core_emotion,
    scene_anchor: plan?.scene_anchor || extractIdeaAnchor(idea),
    information_gap: plan?.information_gap || "某个来源、身份或时间顺序没有被解释",
    state_delta: plan?.state_delta || "下一轮必须改变空间、物件、信息或关系中的至少一项"
  };
}

function buildFallbackStateUpdate(payload, parsed) {
  return {
    turn: payload.turn || 0,
    changed: ["known_information", "emotional_distance"],
    branchMemory: parsed.branchMemory || "本轮生成留下一个未解释的信息缺口"
  };
}

function uniqueConceptGroups(value) {
  const groups = Array.isArray(value) ? value : [value].filter(Boolean);
  const seen = new Set();

  return groups
    .map((group) => Array.isArray(group) ? group : String(group).split(/[、,/，|]/))
    .map((group) => uniqueStrings(group).slice(0, 4))
    .filter((group) => group.length)
    .filter((group) => {
      const key = normalizeComparableText(group.join(""));
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5);
}

function uniqueChoiceLabels(value) {
  const choices = Array.isArray(value) ? value : [value].filter(Boolean);
  const result = [];

  for (const choice of choices) {
    const label = typeof choice === "string"
      ? choice
      : choice?.label || choice?.title || choice?.text || choice?.value || "";
    const normalized = normalizeComparableText(label);
    if (!normalized) continue;
    if (result.some((existing) => areTooSimilar(existing.normalized, normalized))) continue;
    result.push({ raw: choice, normalized });
  }

  return result.map((item) => item.raw).slice(0, 4);
}

function uniqueStrings(value) {
  const list = Array.isArray(value) ? value : [value].filter(Boolean);
  const seen = new Set();
  const result = [];

  for (const item of list) {
    const text = typeof item === "object" ? item?.title || item?.value || item?.label || "" : String(item);
    const clean = text.trim();
    const key = normalizeComparableText(clean);
    if (!clean || !key || seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
  }

  return result.slice(0, 5);
}

function polishStoryStepText(text, payload) {
  const cleanText = String(text || "").trim();
  if (!cleanText) return cleanText;

  const recent = [
    ...(Array.isArray(payload.paragraphs) ? payload.paragraphs.slice(-2) : [])
  ].map((item) => normalizeComparableText(item));

  const paragraphs = cleanText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .filter((paragraph) => {
      const normalized = normalizeComparableText(paragraph);
      if (!normalized) return false;
      if (/^(补充材料|当事路径选择|用户选择|路径选择)[:：]/.test(paragraph)) return false;
      return !recent.some((old) => old && areTooSimilar(old, normalized));
    });

  return paragraphs.length ? paragraphs.join("\n\n") : cleanText;
}

function normalizeComparableText(value) {
  return String(value || "")
    .replace(/[“”"'「」『』（）()【】\[\]\s,，。.!！?？:：;；、\-_/|]/g, "")
    .toLowerCase();
}

function areTooSimilar(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length > 8 && b.length > 8 && (a.includes(b) || b.includes(a))) return true;

  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  if (shorter.length < 6) return false;

  let overlap = 0;
  for (const char of new Set(shorter)) {
    if (longer.includes(char)) overlap += 1;
  }

  return overlap / new Set(shorter).size > 0.82;
}

function repairChoices(choices, payload, parsed, stage) {
  const result = [];
  const genericPatterns = [
    /继续(向前|前进|探索|走)/,
    /靠近.*异常/,
    /听这个世界/,
    /低声说一遍/,
    /确认自己是否/,
    /寻找.*物件/,
    /停下来/
  ];

  for (const choice of choices) {
    const label = typeof choice === "string"
      ? choice
      : choice?.label || choice?.title || choice?.text || choice?.value || "";
    const normalized = normalizeComparableText(label);
    if (!normalized) continue;
    if (genericPatterns.some((pattern) => pattern.test(label))) continue;
    if (result.some((existing) => areTooSimilar(existing.normalized, normalized))) continue;
    result.push({ raw: choice, normalized });
  }

  if (result.length) {
    return result.map((item) => item.raw).slice(0, 4);
  }

  const desiredCount = stage === "story_opening" ? 3 : 3;
  for (const fallback of buildOntologyFallbackChoices(payload, parsed)) {
    if (result.length >= desiredCount) break;
    const normalized = normalizeComparableText(fallback.label);
    if (result.some((existing) => areTooSimilar(existing.normalized, normalized))) continue;
    result.push({ raw: fallback, normalized });
  }

  return result.map((item) => item.raw).slice(0, 4);
}

function buildOntologyFallbackChoices(payload, parsed) {
  const unit = normalizeTextGenerationUnit(payload.cards?.text_generation_unit || parsed.text_generation_unit, payload, parsed);
  const ideaAnchor = extractIdeaAnchor(payload.idea);
  const currentAnchor = extractCurrentAnchor(payload, parsed);
  const objectAnchor = currentAnchor || ideaAnchor;
  const form = unit.form.primary;
  const choiceTypes = unit.interaction_mechanism.choice_types || ["行动驱动", "信息驱动", "解释驱动"];
  const texture = unit.media_texture.source_texture || "文本残片";

  const action = {
    label: formatChoiceLabel(form, `处理“${objectAnchor}”留下的具体物件`),
    description: "行动会改变空间或物件状态。"
  };
  const information = {
    label: formatChoiceLabel(form, `调取与“${ideaAnchor}”矛盾的那份记录`),
    description: "信息顺序会改变下一轮真相版本。"
  };
  const emotion = {
    label: formatChoiceLabel(form, `承认自己对“${objectAnchor}”的迟疑`),
    description: "情感距离会改变叙述语气。"
  };
  const explanation = {
    label: formatChoiceLabel(form, `把异常解释为${pickExplanation(unit.genre.primary)}而不是巧合`),
    description: "解释框架会改变类型走向。"
  };
  const textFeedback = {
    label: formatChoiceLabel(form, `让下一段以“${texture}”的格式显影`),
    description: "文本形式会改变。"
  };

  const byType = {
    "行动驱动": action,
    "信息驱动": information,
    "情感驱动": emotion,
    "解释驱动": explanation,
    "文本反馈": textFeedback,
    "视角驱动": {
      label: formatChoiceLabel(form, `换到另一个目击者眼中看“${ideaAnchor}”`),
      description: "视角会改变可靠性。"
    },
    "沉默机制": {
      label: formatChoiceLabel(form, `暂时不回应“${objectAnchor}”`),
      description: "沉默会制造缺口。"
    },
    "重写机制": {
      label: formatChoiceLabel(form, `重命名“${objectAnchor}”`),
      description: "命名会改写记忆状态。"
    }
  };

  const selected = choiceTypes.map((type) => byType[type]).filter(Boolean);
  return [...selected, action, information, emotion, explanation, textFeedback];
}

function formatChoiceLabel(form, label) {
  if (/档案|报告|笔录|纪实/.test(form)) return `记录：${label}`;
  if (/软件|系统|日志|AI|对话/.test(form)) return `输入指令：${label}`;
  if (/日记|备忘|草稿/.test(form)) return `写下：${label}`;
  if (/现代诗|诗/.test(form)) return `留下一行：${label}`;
  return label;
}

function pickExplanation(genre) {
  if (/梦|超现实|后室|阈限/.test(genre)) return "梦境滑脱";
  if (/犯罪|悬疑|调查/.test(genre)) return "被遮蔽的证据";
  if (/恐怖|怪谈/.test(genre)) return "一条没有来源的禁忌";
  if (/爱情|家庭|青春/.test(genre)) return "未说出口的关系压力";
  return "记忆误差";
}

function extractIdeaAnchor(idea) {
  const text = String(idea || "").trim();
  const quoted = text.match(/[“"「『](.+?)[”"」』]/);
  if (quoted) return quoted[1].slice(0, 18);
  const parts = text.split(/[，。！？、\s]+/).filter((part) => part.length >= 2);
  return (parts[0] || text || "最初念头").slice(0, 18);
}

function extractCurrentAnchor(payload, parsed) {
  const selected = String(payload.selectedChoice || "").replace(/^自定义[:：]/, "").trim();
  if (selected) return selected.slice(0, 18);
  const text = String(parsed.text || "");
  const quoted = text.match(/[“"「『](.+?)[”"」』]/);
  if (quoted) return quoted[1].slice(0, 18);
  const paragraph = Array.isArray(payload.paragraphs) ? payload.paragraphs.at(-1) || "" : "";
  return extractIdeaAnchor(paragraph);
}

function inferTextCategory(form) {
  if (/诗/.test(form)) return "诗歌";
  if (/档案|报告|笔录|病历|纪实|警方/.test(form)) return "非虚构";
  if (/系统|软件|AI|日志|数据库|游戏/.test(form)) return "数字交互文本";
  if (/日记|书信|备忘|草稿|聊天|邮件/.test(form)) return "复合文本";
  return "小说";
}

function inferSecondaryForm(form) {
  if (/日记/.test(form)) return "梦境记录";
  if (/档案|纪实/.test(form)) return "调查报告";
  if (/软件|系统/.test(form)) return "系统日志";
  if (/诗/.test(form)) return "片段札记";
  return "文本残片";
}

function inferMediaTexture(form) {
  if (/日记/.test(form)) return "日记残页";
  if (/书信/.test(form)) return "私人信件";
  if (/档案|纪实|报告/.test(form)) return "调查摘录";
  if (/笔录|警方/.test(form)) return "警方笔录节选";
  if (/软件|系统|日志/.test(form)) return "系统日志";
  if (/聊天|对话/.test(form)) return "聊天摘录";
  return "文本残片";
}

function buildNarrativeContractPrompt(payload) {
  const cards = payload.cards || {};
  const form = cards.form || "未定体裁";
  const genre = cards.genre || "未定类型";
  const style = cards.style || "未定流派";
  const unit = cards.text_generation_unit || cards.ontologyUnit || null;
  const tags = Array.isArray(cards.concept)
    ? cards.concept.join("、")
    : Array.isArray(cards.conceptTags)
      ? cards.conceptTags.join("、")
      : "";

  return `
叙事形态契约：
- 当前体裁：${form}
- 当前类型：${genre}
- 当前流派/文风：${style}
- 当前标签：${tags || "未定"}
- 当前十维本体：${unit ? JSON.stringify(unit) : "未提供，必须现场补全"}

执行规则：
1. 先在心里决定 narrativeMode，再写正文。narrativeMode 必须具体，例如“第一人称日记”“档案摘录与证词拼贴”“软件系统日志与用户对话”“现代诗短行”“第三人称严肃文学”“犯罪悬疑网文强钩子”。
2. narrativeMode 必须由体裁 + 类型 + 流派共同决定，不得只改几个形容词。
3. 体裁为“日记体”时，正文要像私密日期记录；体裁为“软件对话”时，正文要像界面消息、日志或系统回执；体裁为“纪实档案”时，正文要像档案、证词、编号材料；体裁为“现代诗”时，正文要使用诗行和断裂；体裁为“网文”时，正文要有明确钩子和推进。
4. 类型决定冲突材料，流派决定语言和思想质地。二者必须能在正文中被读出来。
5. 禁止把所有组合都写成“第二人称梦境探索”。第二人称只是可选叙事策略，不是默认值。
6. 选项也要继承该体裁：档案体的选项可以像“调取第 3 份证词”，软件对话可以像“输入 override 指令”，现代诗可以像“把下一行留白还给雨”。
`;
}

async function buildKnowledgePrompt(payload) {
  const browserKnowledge = String(payload.knowledgeBase || "").trim();
  const sharedKnowledge = useSupabase
    ? formatRetrievedKnowledge(await retrieveKnowledgeEntries(payload))
    : readOptionalFile(knowledgeBasePath).replace("# EDIMAGE WORLD 知识库", "").trim();
  const combined = [sharedKnowledge, browserKnowledge].filter(Boolean).join("\n\n---\n\n").slice(-9000);

  if (!combined || /当前暂无正式知识库条目/.test(combined) && !browserKnowledge) {
    return "知识库状态：当前知识库为空，文本生成完全依赖智能体推理。";
  }

  return `
知识库召回内容：
${combined}

知识库规则：
1. 优先吸收知识库里的意象、地点、语言质地、世界设定和历史片段。
2. 本次召回是按用户 idea、已选卡片、已有正文、当前选择做语义近邻的关键词匹配，不是机械拼贴。
3. 不要生硬照抄整段知识库文本。
4. 知识库内容必须服务用户本次 idea，不得抢走主线。
`;
}

function buildEasterPrompt(payload) {
  const library = readOptionalFile(easterEggLibraryPath).slice(0, 6000);
  if (!payload.easterEgg && !payload.easterEggUsed) {
    return `
彩蛋库：
${library}

彩蛋状态：本次请求未要求插入彩蛋。即使命中彩蛋词，也不要在抽卡或开场阶段提前暴露。
`;
  }

  return `
彩蛋库：
${library}

彩蛋状态：${payload.easterEgg || (payload.easterEggUsed ? "already_used" : "none")}
规则：彩蛋只作为短暂非常规插入，结束后必须回到用户原本的文本主线。
`;
}

function buildGenerationFrameworkPrompt() {
  return `
生成模板 v2：
- 体裁候选：${FORM_OPTIONS.join("、")}
- 标签候选：${TAG_OPTIONS.join("、")}
- 类型候选：${GENRE_OPTIONS.join("、")}
- 流派候选：${STYLE_OPTIONS.join("、")}

体裁执行矩阵：
- 日记体：第一人称，可带日期/时间/自我修正；像隐秘记录，不像说明文。
- 散文体：可第一或第三人称；重意象和节奏，弱化按钮感，句子有呼吸。
- 软件对话：使用界面日志、系统消息、用户输入、异常提示、对话气泡等格式；不写成普通小说段落。
- 纪实档案：使用编号、证词、附注、调查记录、时间线、摘录；语气克制，像材料拼合。
- 严肃文学：第三人称或有限第一人称；重心理、社会关系、动作细节，少玄虚口号。
- 现代诗：使用短行、断裂、留白、重复和跳接；仍要保留可互动的情节点。
- 网文：节奏更快，冲突更清楚，可有爽点和钩子；但仍保持 EDIMAGE WORLD 的怪异气质。

类型执行矩阵：
- 都市：具体街区、通勤、楼道、便利店、监控、租房、地铁等现实细节。
- 爱情：关系张力、未说出口的话、误认、靠近和撤退。
- 惊悚/恐怖/怪谈：异常规则、感官压迫、禁忌和逐步升级。
- 爽感逆袭：压迫关系、反转节点、明确的释放感。
- 梦核/后室：空间错位、童年物件、循环房间、低解释度。
- 犯罪：证据、动机、时间线、嫌疑关系和误导。
- 喜剧：荒诞节奏、错位逻辑、意外转折，但不破坏主线。
- 古代：制度、礼法、器物、称谓和古典空间，不要现代白话硬套。

流派执行矩阵：
- 荒诞文学：逻辑错位要自洽，荒诞不是随机堆砌。
- 存在主义：行动选择要带有自由、责任、孤独或荒谬感。
- 实验小说：可使用碎片、表格、脚注、反复、非线性结构。
- 哲学科幻：概念必须落在人物处境和可感知机制上。
- 犯罪悬疑网文：强钩子、线索递进、反转预备。
- 浪漫主义：情绪浓度更高，强调自然/命运/激情，但不空泛。

视角规则：
1. 不要所有文本都写成“你醒来/你发现/你走进”。
2. 根据体裁主动选择人称和格式；同一篇内部可以稳定保持一种主视角。
3. 如果使用第二人称，必须说明它是体裁选择的一部分，例如软件对话、沉浸式选择或怪谈规则。

链路要求：
1. 输入解析：提取关键词、情绪、潜在主题。
2. 主题匹配：把体裁、标签、类型、流派映射为场景模板与氛围描述。
3. 剧情抽卡：根据用户 idea 权重决定触发事件、异常物件、人物关系或彩蛋信号。
4. 分支生成：关键节点优先生成 2 到 3 条分支，并保留分支记忆。
5. 知识库召回：优先融合相关文本，保证世界连续性。
6. 二次回望：主动检查并回收前文线索，增强逻辑连续性。
7. 最终整合：让正文成为一篇真正可读的小说片段，而不是流程记录。
`;
}

function buildTextualOntologyHarnessPrompt() {
  return `
EDIMAGE 文本生成本体库 harness：
这不是标签库，而是互动文本生成的十维参数化推理框架。每次生成都必须先把用户 idea 与当前状态解析成 text_generation_unit，再写正文和选项。

最小工作流：
1. Ontology Parser：读取 user_idea、当前正文、路径、知识库召回，解析十维参数。
2. Narrative Planner：用前六维决定文本骨架，用第 7-8 维补情境与媒介质感，用第 9-10 维决定交互和质量边界。
3. Builder：根据文本形式、结构、技法和风格写正文，不得只套类型标签。
4. Choice Generator：生成能改变后续参数的分支，混合行动、信息、情感、解释、文本形式，不做伪选择。
5. Anti-AI Style Gate：删除结尾升华、空泛抽象、模板句式、解释性旁白和重复选项。
6. Memory Manager：显式保留角色状态、空间状态、物件状态、关系状态、伏笔、用户选择和知识库意象。

十维参数：
1. text_category 文类/体裁：诗歌、小说、戏剧、散文、非虚构、应用文、数字交互文本、复合文本。它回答文学大类，不等于类型，也不等于文本形式。
2. genre 类型/类型叙事：爱情、家庭、青春、恐怖、悬疑、犯罪、怪谈、科幻、赛博朋克、奇幻、废土、公路、都市、后室/阈限恐怖、荒诞、超现实、梦核。必须提炼核心欲望、核心冲突、核心情绪、常见陷阱。
3. form 文本形式：日记、书信、备忘录、未发送草稿、梦境记录、调查报告、病历、警方笔录、实验日志、百科词条、聊天记录、群聊、邮件、语音转文字、论坛帖、系统通知、游戏任务、AI 对话、搜索记录、浏览器历史、GPS 轨迹、监控转录、日志、数据库导出。
4. structure 叙事结构：时间结构、因果结构、情节结构、信息结构、空间结构、复合结构。用它抵抗流水账。
5. technique 叙述技法：叙述者机制、视角机制、心理呈现、信息控制、叙事拼接。技法必须服务信息隐藏、错位、感知或歪曲。
6. style 文学/语言风格：审美、句长、语体、抽象度、情绪外露、感官密度、对话比例、解释程度、修辞、节奏、风格强度。禁止直接模仿名人作家。
7. cultural_modifier 文化-历史修饰器：地域、时代、社会环境、文化观念。只做情境参数；涉及真实制度、民俗、职业细节时，标记 retrieval_need。
8. media_texture 文本媒介质感：来源感、格式痕迹、损耗痕迹。每轮最多一种来源感、一到两种格式痕迹、一种损耗痕迹，不能廉价乱码。
9. interaction_mechanism 交互机制：行动、信息、视角、文本反馈、情感、解释、沉默、重写。它回答用户选择改变什么。
10. generation_constraints 生成约束：篇幅、视角、选项数量、信息节奏、具体性、连续性、反 AI 味、守门规则。

输出前必须自检：
- 是否有具体物象、场景、动作或感官锚点。
- 是否有信息缺口或情绪变化。
- 用户选择是否真的改变下一轮参数，而不只是换一句按钮文案。
- 是否避免同质选项、重复选项、过度哲理化、结尾升华、空泛抒情。
- 是否没有无因重置世界状态。

推荐 text_generation_unit：
{
  "user_idea": "",
  "text_category": { "primary": "", "secondary": "" },
  "genre": { "primary": "", "secondary": "", "core_desire": "", "core_conflict": "", "core_emotion": "" },
  "form": { "primary": "", "secondary": "" },
  "structure": { "temporal": "", "causal": "", "plot": "", "informational": "", "spatial": "" },
  "technique": [],
  "style": { "aesthetic": [], "language": {}, "rhythm": "", "intensity": "" },
  "cultural_modifier": { "region": "", "period": "", "social_context": [], "retrieval_need": false },
  "media_texture": { "source_texture": "", "format_markers": [], "degradation_markers": [] },
  "interaction_mechanism": { "choice_types": [], "state_effects": [] },
  "generation_constraints": { "length": "", "options": "", "must_include": [], "must_avoid": [] }
}
`;
}

async function retrieveKnowledgeEntries(payload) {
  const entries = useSupabase ? await listKnowledgeEntriesSupabase() : readKnowledgeEntries();
  if (!entries.length) return [];

  const terms = extractRetrievalTerms(payload);
  if (!terms.length) {
    return entries.slice(-8);
  }

  return entries
    .map((entry) => ({
      entry,
      score: scoreKnowledgeEntry(entry, terms)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || String(a.entry.createdAt).localeCompare(String(b.entry.createdAt)))
    .slice(0, 8)
    .map((item) => item.entry);
}

function formatRetrievedKnowledge(entries) {
  return entries
    .map((entry) => `标题：${entry.title}\n缔造者：${entry.author || "匿名缔造者"}\n标签：${entry.tags || ""}\n正文：${entry.text || ""}`)
    .join("\n\n---\n\n");
}

function extractRetrievalTerms(payload) {
  const raw = [
    payload.idea,
    payload.selectedChoice,
    payload.easterEgg,
    payload.theme,
    payload.cards?.form,
    payload.cards?.genre,
    payload.cards?.style,
    ...(Array.isArray(payload.cards?.concept) ? payload.cards.concept : []),
    ...(Array.isArray(payload.cards?.conceptTags) ? payload.cards.conceptTags : []),
    ...(Array.isArray(payload.path) ? payload.path : []),
    ...(Array.isArray(payload.paragraphs) ? payload.paragraphs.slice(-3) : [])
  ]
    .filter(Boolean)
    .join(" ");

  const unique = new Set(
    raw
      .split(/[\s,，。！？、；：“”"'()（）【】\[\]\-_/|]+/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 2)
  );

  return [...unique].slice(0, 36);
}

function scoreKnowledgeEntry(entry, terms) {
  const haystack = `${entry.title} ${entry.author} ${entry.tags} ${entry.text}`.toLowerCase();
  let score = 0;

  for (const term of terms) {
    const normalized = String(term).toLowerCase();
    if (!normalized) continue;
    if (haystack.includes(normalized)) {
      score += entry.tags.toLowerCase().includes(normalized) ? 3 : 1;
      score += entry.title.toLowerCase().includes(normalized) ? 2 : 0;
    }
  }

  return score;
}

function readOptionalFile(filePath) {
  if (!existsSync(filePath)) return "";
  return readFileSync(filePath, "utf8");
}

function readAccessState() {
  if (!existsSync(accessStatePath)) {
    return {
      inviteCompletions: 0,
      completedSessions: [],
      issuedInviteSessions: [],
      totalStoryCompletions: 0,
      completedStorySessions: []
    };
  }

  try {
    const parsed = JSON.parse(readFileSync(accessStatePath, "utf8"));
    return {
      inviteCompletions: Number(parsed.inviteCompletions || 0),
      completedSessions: Array.isArray(parsed.completedSessions) ? parsed.completedSessions : [],
      issuedInviteSessions: Array.isArray(parsed.issuedInviteSessions) ? parsed.issuedInviteSessions : [],
      totalStoryCompletions: Number(parsed.totalStoryCompletions || 0),
      completedStorySessions: Array.isArray(parsed.completedStorySessions) ? parsed.completedStorySessions : []
    };
  } catch (error) {
    return {
      inviteCompletions: 0,
      completedSessions: [],
      issuedInviteSessions: [],
      totalStoryCompletions: 0,
      completedStorySessions: []
    };
  }
}

async function getAccessState() {
  if (useSupabase) {
    return await readAccessStateSupabase();
  }
  await ensureRuntimeFiles();
  return readAccessState();
}

async function saveAccessState(state) {
  if (useSupabase) {
    await writeAccessStateSupabase(state);
    return;
  }
  await writeAccessState(state);
}

async function getHealthState() {
  if (!useSupabase) {
    await ensureRuntimeFiles();
    return {
      accessState: readAccessState(),
      supabase: {
        configured: false,
        ok: false,
        message: "SUPABASE_URL or SUPABASE_ANON_KEY is missing"
      }
    };
  }

  try {
    const accessState = await readAccessStateSupabase();
    return {
      accessState,
      supabase: {
        configured: true,
        ok: true,
        message: "connected"
      }
    };
  } catch (error) {
    return {
      accessState: {
        inviteCompletions: 0,
        completedSessions: [],
        issuedInviteSessions: [],
        totalStoryCompletions: 0,
        completedStorySessions: []
      },
      supabase: {
        configured: true,
        ok: false,
        message: sanitizePublicError(error)
      }
    };
  }
}

function readKnowledgeEntries() {
  let entries = [];

  if (existsSync(knowledgeEntriesPath)) {
    try {
      const parsed = JSON.parse(readFileSync(knowledgeEntriesPath, "utf8"));
      entries = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      entries = [];
    }
  }

  if (entries.length) {
    return entries;
  }

  return parseKnowledgeMarkdown(readOptionalFile(knowledgeBasePath));
}

async function writeAccessState(accessState) {
  await writeFile(accessStatePath, JSON.stringify(accessState, null, 2), "utf8");
}

async function writeKnowledgeEntries(entries) {
  await writeFile(knowledgeEntriesPath, JSON.stringify(entries, null, 2), "utf8");
}

function parseKnowledgeMarkdown(content) {
  if (!content) {
    return [];
  }

  const blocks = content.split(/\n## /).map((block, index) => (index === 0 ? block : `## ${block}`));
  return blocks
    .filter((block) => block.startsWith("## "))
    .map((block, index) => {
      const lines = block.split(/\r?\n/);
      const title = lines[0].replace(/^##\s*/, "").trim() || "未命名碎片";
      const author = lines.find((line) => line.startsWith("作者："))?.replace("作者：", "").trim() || "";
      const tags = lines.find((line) => line.startsWith("标签："))?.replace("标签：", "").trim() || "";
      const createdAt = lines.find((line) => line.startsWith("写入时间："))?.replace("写入时间：", "").trim() || "";
      const textStart = lines.findIndex((line) => line.trim() === "正文：");
      const text = textStart === -1 ? "" : lines.slice(textStart + 1).join("\n").trim();

      return {
        id: `legacy-memory-${index}`,
        title,
        author,
        tags,
        text,
        createdAt
      };
    })
    .filter((entry) => entry.text);
}

async function ensureRuntimeFiles() {
  await mkdir(dataDir, { recursive: true });

  if (!existsSync(accessStatePath)) {
    await writeAccessState({
      inviteCompletions: 0,
      completedSessions: [],
      issuedInviteSessions: [],
      totalStoryCompletions: 0,
      completedStorySessions: []
    });
  }

  if (!existsSync(knowledgeBasePath)) {
    await writeFile(knowledgeBasePath, "# EDIMAGE WORLD 知识库\n\n当前暂无正式知识库条目。\n", "utf8");
  }

  if (!existsSync(knowledgeEntriesPath)) {
    await writeKnowledgeEntries([]);
  }

  if (!existsSync(easterEggLibraryPath)) {
    await writeFile(
      easterEggLibraryPath,
      [
        "# EDIMAGE WORLD 彩蛋库",
        "",
        "## 关键词：蝴蝶",
        "",
        "触发情节：蝴蝶大战金刚侠，金刚侠惨败，被迫上梁山，尔后号召108好汉，在水浒边上起义，史称爱尔兰史上最伟大的革命。",
        ""
      ].join("\n"),
      "utf8"
    );
  }
}

async function supabaseRequest(path, { method = "GET", body } = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${text}`);
  }

  const raw = await response.text();
  return raw ? JSON.parse(raw) : null;
}

async function listKnowledgeEntriesSupabase() {
  const rows = await supabaseRequest("knowledge_entries?select=id,title,author,tags,text,created_at&order=created_at.asc");
  return (rows || []).map((row) => ({
    id: row.id,
    title: row.title || "未命名碎片",
    author: row.author || "",
    tags: row.tags || "",
    text: row.text || "",
    createdAt: row.created_at || ""
  }));
}

async function insertKnowledgeEntrySupabase(entry) {
  await supabaseRequest("knowledge_entries", {
    method: "POST",
    body: [{
      title: entry.title,
      author: entry.author || "",
      tags: entry.tags || "",
      text: entry.text || "",
      created_at: entry.createdAt
    }]
  });
}

async function readAccessStateSupabase() {
  const rows = await supabaseRequest("world_stats?select=key,value_json&key=eq.access_state&limit=1");
  const row = rows && rows[0];
  const parsed = row?.value_json || {};

  return {
    inviteCompletions: Number(parsed.inviteCompletions || 0),
    completedSessions: Array.isArray(parsed.completedSessions) ? parsed.completedSessions : [],
    issuedInviteSessions: Array.isArray(parsed.issuedInviteSessions) ? parsed.issuedInviteSessions : [],
    totalStoryCompletions: Number(parsed.totalStoryCompletions || 0),
    completedStorySessions: Array.isArray(parsed.completedStorySessions) ? parsed.completedStorySessions : []
  };
}

async function writeAccessStateSupabase(state) {
  const rows = await supabaseRequest("world_stats?select=key&key=eq.access_state&limit=1");
  if (rows && rows.length) {
    await supabaseRequest("world_stats?key=eq.access_state", {
      method: "PATCH",
      body: {
        value_json: state,
        updated_at: new Date().toISOString()
      }
    });
    return;
  }

  await supabaseRequest("world_stats", {
    method: "POST",
    body: [{
      key: "access_state",
      value_json: state,
      updated_at: new Date().toISOString()
    }]
  });
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://localhost:${port}`);
  const pathname = decodeURIComponent(url.pathname);
  const requested = pathname === "/" ? "index.html" : pathname.slice(1);

  if (!isPublicAsset(requested)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const filePath = resolve(root, requested);
  const pathFromRoot = relative(root, filePath);

  if (pathFromRoot.startsWith("..") || pathFromRoot.includes(`..${sep}`) || pathFromRoot === "") {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const fileStats = await stat(filePath);
  if (!fileStats.isFile()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const ext = extname(filePath).toLowerCase();
  const content = await readFile(filePath);
  res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
  res.end(content);
}

function isPublicAsset(requested) {
  return (
    requested === "index.html" ||
    requested === "memory.html" ||
    requested === "styles.css" ||
    requested === "preview-desktop.png" ||
    requested === "preview-mobile.png" ||
    requested.startsWith("pic/")
  );
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function parseJsonContent(content) {
  if (!content) {
    throw new Error("Empty model response");
  }

  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }

    throw error;
  }
}

function sanitizePublicError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [hidden]")
    .replace(/apikey['":\s]+[A-Za-z0-9._-]+/gi, "apikey [hidden]")
    .slice(0, 500);
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function loadEnv() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) {
    return { ...process.env };
  }

  const fileEnv = {};
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    fileEnv[key] = value;
  }

  return { ...process.env, ...fileEnv };
}
