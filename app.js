const architecture = `用户请求
  ↓
AI Controller
  ├─ /ai/love_app/chat/sync
  ├─ /ai/love_app/chat/sse
  └─ /ai/manus/chat
  ↓
Spring AI ChatClient
  ├─ Prompt 角色约束
  ├─ ChatMemory 多轮记忆
  ├─ QueryTransformer 查询重写
  ├─ RAG 文档召回
  └─ Tool Calling / MCP 工具调用
  ↓
大模型生成回答 / Agent 多步执行`;

const knowledgeBase = [
  {
    id: 'doc-001',
    title: '视频上传失败处理说明',
    tags: ['上传', '视频', '断点续传', '媒资'],
    content: '课程视频上传失败后，系统会根据文件 MD5 检查完整文件和已上传分片，只上传缺失分片。所有分片上传完成后由服务端合并，并通过 MD5 校验保证文件完整性。',
  },
  {
    id: 'doc-002',
    title: '退款与订单处理规则',
    tags: ['退款', '订单', '支付'],
    content: '用户提交退款申请后，客服需要先核对订单状态、支付流水号和课程学习状态。符合规则的订单进入退款审核流程，审核通过后更新订单状态并记录操作日志。',
  },
  {
    id: 'doc-003',
    title: '订单支付状态查询',
    tags: ['订单', '支付', '查询'],
    content: '订单状态包括未支付、支付成功、已关闭等。用户查询支付状态时，系统根据订单号或支付流水号查询支付记录，并返回当前订单状态和后续处理建议。',
  },
  {
    id: 'doc-004',
    title: '学习计划生成说明',
    tags: ['学习计划', '面试', '工具调用'],
    content: '当用户需要生成学习计划时，Agent 可以先拆解目标，再调用搜索、文件写入和 PDF 生成工具，最终输出结构化学习计划文档。',
  },
  {
    id: 'doc-005',
    title: 'RAG 问答流程',
    tags: ['RAG', '知识库', '检索'],
    content: 'RAG 问答流程包括用户问题接收、查询重写、知识库召回、上下文增强和模型生成。该方式可以降低大模型脱离业务知识凭空回答的风险。',
  },
];

let messages = [];
const chatId = 'chat-' + Math.random().toString(16).slice(2, 10);

const chatWindow = document.getElementById('chatWindow');
const input = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const resetBtn = document.getElementById('resetChat');
const chatIdEl = document.getElementById('chatId');
const turnCountEl = document.getElementById('turnCount');
const rawQueryEl = document.getElementById('rawQuery');
const rewrittenQueryEl = document.getElementById('rewrittenQuery');
const retrievedDocsEl = document.getElementById('retrievedDocs');
const answerBasisEl = document.getElementById('answerBasis');

document.getElementById('architectureText').textContent = architecture;
chatIdEl.textContent = chatId;

function addMessage(role, text) {
  messages.push({ role, text, time: new Date().toLocaleTimeString() });
  if (messages.length > 12) messages = messages.slice(-12);
  renderChat();
}

function renderChat() {
  chatWindow.innerHTML = messages.map(msg => `
    <div class="message ${msg.role}">
      <div class="bubble">${escapeHtml(msg.text)}</div>
    </div>
  `).join('');
  chatWindow.scrollTop = chatWindow.scrollHeight;
  turnCountEl.textContent = Math.ceil(messages.length / 2);
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

function rewriteQuery(query) {
  if (/上传|视频|失败|断点/.test(query)) return '课程视频上传失败后的断点续传处理流程';
  if (/退款|退费/.test(query)) return '在线教育平台课程订单退款流程';
  if (/订单|支付|状态/.test(query)) return '根据订单号或支付流水号查询支付状态';
  if (/学习计划|复习|面试/.test(query)) return '生成 Java 后端面试学习计划并输出文档';
  return query + ' 业务知识库检索';
}

function retrieveDocs(query) {
  const tokens = query.split(/\s+|，|。|、/).filter(Boolean);
  return knowledgeBase
    .map(doc => {
      let score = 0;
      tokens.forEach(t => {
        if (doc.title.includes(t)) score += 4;
        if (doc.content.includes(t)) score += 3;
        if (doc.tags.some(tag => tag.includes(t) || t.includes(tag))) score += 5;
      });
      if (/上传|视频|断点/.test(query) && doc.id === 'doc-001') score += 10;
      if (/退款|退费/.test(query) && doc.id === 'doc-002') score += 10;
      if (/订单|支付/.test(query) && doc.id === 'doc-003') score += 8;
      if (/学习计划|面试/.test(query) && doc.id === 'doc-004') score += 10;
      if (/RAG|知识库|检索/.test(query) && doc.id === 'doc-005') score += 8;
      return { ...doc, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function generateAnswer(query, docs) {
  const top = docs[0];
  if (!top || top.score <= 0) {
    return '我会先确认你的具体问题，并尝试从业务知识库中检索相关资料。如果知识库没有命中，我会提示需要人工补充知识，而不是直接编造答案。';
  }
  if (top.id === 'doc-001') {
    return '视频上传失败后，不需要重新上传完整文件。系统会先用文件 MD5 调用 checkfile 检查完整文件是否存在；如果不存在，再按分片序号调用 checkchunk 检查已上传分片，只继续上传缺失分片。所有分片完成后，服务端合并分片并重新计算 MD5，校验一致后保存媒资信息。';
  }
  if (top.id === 'doc-002') {
    return '退款处理需要先核对订单状态、支付流水号和课程学习状态。符合退款规则后进入审核流程，审核通过再更新订单状态并记录操作日志。实际业务中还需要注意幂等处理，避免重复回调或重复退款。';
  }
  if (top.id === 'doc-003') {
    return '可以根据订单号或支付流水号查询支付记录。如果状态是未支付，需要提示用户继续支付或等待超时关闭；如果状态是支付成功，需要返回课程开通结果；如果订单已关闭，需要提示重新下单。';
  }
  if (top.id === 'doc-004') {
    return '我可以按“Java 基础、Spring Boot、数据库、Redis、消息队列、JVM、项目复盘”拆分学习计划。Agent 会先规划任务，再调用搜索和文件生成工具，最后输出结构化文档。';
  }
  return '根据知识库召回内容，建议先进行查询重写，再召回 Top 文档片段，并将这些片段作为上下文交给大模型生成回答，以降低幻觉风险。';
}

function updateRag(query, rewritten, docs, answer) {
  rawQueryEl.textContent = query;
  rewrittenQueryEl.textContent = rewritten;
  retrievedDocsEl.innerHTML = docs.map((doc, index) => `
    <div class="doc-item">
      <strong>${index + 1}. ${doc.title}<span class="score">score ${doc.score}</span></strong>
      <p>${doc.content}</p>
    </div>
  `).join('');
  answerBasisEl.textContent = `本轮回答主要依据《${docs[0]?.title || '无命中文档'}》，并结合最近会话上下文生成。`;
}

function sendMessage() {
  const query = input.value.trim();
  if (!query) return;
  addMessage('user', query);
  input.value = '';

  const rewritten = rewriteQuery(query);
  const docs = retrieveDocs(rewritten);
  const answer = generateAnswer(query, docs);
  updateRag(query, rewritten, docs, answer);

  let i = 0;
  const chunks = answer.match(/.{1,18}/g) || [answer];
  addMessage('ai', '');
  const lastIndex = messages.length - 1;
  const timer = setInterval(() => {
    messages[lastIndex].text += chunks[i] || '';
    renderChat();
    i++;
    if (i >= chunks.length) clearInterval(timer);
  }, 50);
}

sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

document.querySelectorAll('.quick-questions button').forEach(btn => {
  btn.addEventListener('click', () => {
    input.value = btn.dataset.question;
    sendMessage();
  });
});

resetBtn.addEventListener('click', () => {
  messages = [];
  renderChat();
  rawQueryEl.textContent = '等待输入...';
  rewrittenQueryEl.textContent = '等待输入...';
  retrievedDocsEl.innerHTML = '';
  answerBasisEl.textContent = '等待输入...';
});

addMessage('ai', '你好，我是 AI 智能客服 Demo。你可以问我视频上传、订单支付、退款流程、学习计划等问题，我会模拟“查询重写 + RAG 检索 + 流式回答”的过程。');

const toolResults = {
  search: '工具调用结果：已模拟联网搜索 “Java 后端面试复习路线”，返回 5 条候选资料，并提取标题、摘要和链接。',
  scrape: '工具调用结果：已模拟抓取网页正文，过滤导航栏、广告和无关内容，保留可用于总结的主体文本。',
  file: '工具调用结果：已模拟写入文件 interview-plan.md，内容包括复习阶段、每日任务和项目复盘清单。',
  pdf: '工具调用结果：已模拟生成 PDF 文件 Java后端面试计划.pdf，可作为最终交付物下载。',
  mcp: '工具调用结果：已模拟通过 MCP 图片搜索服务检索配图资源，返回 6 张与“学习计划”相关的图片元数据。',
  terminal: '工具调用结果：已模拟执行终端命令，检查项目目录、构建状态和文件生成结果。',
};

document.querySelectorAll('.tool-card').forEach(btn => {
  btn.addEventListener('click', () => {
    const tool = btn.dataset.tool;
    document.getElementById('toolResult').textContent = toolResults[tool];
  });
});

const agentSteps = [
  ['思考', '用户希望生成 Java 后端面试复习计划，需要先拆分复习模块，再整理成文档。'],
  ['行动', '调用联网搜索工具，检索 Java 后端高频面试主题。'],
  ['观察', '获得 Java 基础、Spring、MySQL、Redis、RabbitMQ、JVM、项目复盘等主题。'],
  ['行动', '调用文件写入工具，生成 Markdown 版复习计划。'],
  ['行动', '调用 PDF 生成工具，将计划转换为可下载文档。'],
  ['完成', '输出结构化学习计划，并提示用户可以继续细化某一模块。'],
];

document.getElementById('runAgent').addEventListener('click', () => {
  const box = document.getElementById('agentSteps');
  box.innerHTML = '';
  agentSteps.forEach((step, index) => {
    setTimeout(() => {
      const div = document.createElement('div');
      div.className = 'agent-step';
      div.innerHTML = `<strong>Step ${index + 1} · ${step[0]}</strong><p>${step[1]}</p>`;
      box.appendChild(div);
    }, index * 450);
  });
});
