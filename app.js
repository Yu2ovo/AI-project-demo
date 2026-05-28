
const app = document.querySelector('#app');

const routes = [
  { path: 'home', label: '首页' },
  { path: 'chat', label: '在线客服' },
  { path: 'knowledge', label: '知识库' },
  { path: 'tools', label: '工具中心' },
  { path: 'agent', label: 'Agent流程' },
  { path: 'evaluation', label: '效果评估' },
  { path: 'architecture', label: '系统架构' },
];

const docs = [
  {
    title: '课程退款与售后规则',
    score: '0.93',
    tags: ['退款', '售后', '订单'],
    content: '用户可在课程开通后的规定时间内发起退款申请，系统会根据订单状态、学习进度和支付记录进行校验，并返回可执行的处理建议。'
  },
  {
    title: '账号登录与验证码异常处理',
    score: '0.89',
    tags: ['登录', '验证码', '账号'],
    content: '当用户反馈无法登录时，客服应先确认账号状态、验证码是否过期、登录方式是否匹配，再引导用户重新获取验证码或进行账号申诉。'
  },
  {
    title: '课程学习进度与证书说明',
    score: '0.86',
    tags: ['学习进度', '证书', '课程'],
    content: '学习中心记录用户课程进度、章节完成情况和最近学习时间，满足课程完成条件后可进入证书申请流程。'
  },
  {
    title: '发票申请与支付凭证',
    score: '0.82',
    tags: ['发票', '支付', '订单'],
    content: '用户完成支付后可在订单中心申请发票，系统需校验订单支付状态、开票抬头和税号信息，并同步生成处理工单。'
  },
];

const tools = [
  { icon: '🔎', title: '知识库检索', desc: '根据用户问题召回相关文档片段，作为模型回答依据。' },
  { icon: '🌐', title: '网页抓取', desc: '读取公开页面内容，辅助客服处理外部资料查询类问题。' },
  { icon: '📄', title: '文档解析', desc: '读取 PDF / Markdown 等资料，提取摘要和关键字段。' },
  { icon: '📝', title: '报告生成', desc: '根据对话和工具结果生成结构化说明或处理报告。' },
  { icon: '🖼️', title: '图片检索', desc: '通过 MCP 服务接入图片搜索能力，补充多模态资源。' },
  { icon: '📦', title: '资源下载', desc: '对可下载资源进行链接校验、文件名提取和任务记录。' },
  { icon: '📊', title: '表格整理', desc: '将客服处理结果转为表格字段，便于后续统计分析。' },
  { icon: '✅', title: '结果校验', desc: '对回答格式、引用依据和任务完成状态进行检查。' },
  { icon: '🔁', title: '查询重写', desc: '将口语化问题改写为更适合知识库检索的标准查询。' },
  { icon: '🧾', title: '工单摘要', desc: '把多轮对话整理为问题背景、处理过程和下一步建议。' },
];

const conversations = {
  refund: {
    user: '我买了课程但想退款，应该怎么处理？',
    answer: '可以先确认订单状态和学习进度。如果订单已支付且符合退款规则，可在订单中心提交退款申请；系统会校验支付记录、课程开通状态和学习进度，再给出处理结果。若订单已完成较长时间或学习进度较高，建议提交人工审核。',
    tools: ['RAG 知识库检索', '订单规则匹配', '工单摘要生成']
  },
  login: {
    user: '验证码收不到，账号也登录不上怎么办？',
    answer: '建议先检查手机号是否正确、验证码是否过期、短信是否被拦截。如果多次尝试仍失败，可以切换邮箱登录或提交账号申诉。系统会根据用户账号状态和登录日志给出下一步处理建议。',
    tools: ['查询重写', '知识库检索', '账号异常流程匹配']
  },
  invoice: {
    user: '支付后怎么开发票？',
    answer: '用户完成支付后，可在订单中心选择对应订单发起发票申请。需要填写发票抬头、税号和接收邮箱。系统会校验订单支付状态，生成开票处理记录。',
    tools: ['订单知识检索', '信息字段提取', '处理报告生成']
  }
};

let messages = [
  {
    role: 'bot',
    text: '您好，我是智服 AI 客服助手。我可以帮助处理课程咨询、订单退款、账号登录、发票申请等问题，并在需要时调用知识库和工具完成多步骤任务。',
    tools: ['多轮对话记忆', 'RAG 知识库', 'Tool Calling']
  }
];

function currentRoute() {
  return (location.hash || '#/home').replace('#/', '') || 'home';
}

function navigate(path) {
  location.hash = `#/${path}`;
}

window.addEventListener('hashchange', render);

function shell(content) {
  const route = currentRoute();
  return `
    <div class="app-shell">
      <header class="topbar">
        <div class="container nav">
          <a class="brand" href="#/home">
            <div class="logo">AI</div>
            <div>
              <h1>智服 AI 客服平台</h1>
              <p>智能问答 · 知识检索 · 工具调用 · Agent 处理</p>
            </div>
          </a>
          <nav class="nav-links">
            ${routes.map(item => `
              <button class="nav-link ${route === item.path ? 'active' : ''}" onclick="navigate('${item.path}')">${item.label}</button>
            `).join('')}
          </nav>
        </div>
      </header>
      ${content}
      <footer class="footer">
        <div class="container">智服 AI 客服平台 · 面向在线咨询场景的智能客服系统</div>
      </footer>
    </div>
  `;
}

function renderHome() {
  return shell(`
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <span class="badge">Spring AI · RAG · Tool Calling · MCP</span>
          <h2>面向在线咨询场景的 AI 智能客服平台</h2>
          <p class="hero-desc">
            平台围绕客服问答、知识检索、工具调用和多步骤任务处理进行设计，支持用户自然语言咨询、业务知识增强回答、会话记忆和外部工具协同处理。
          </p>
          <div class="hero-actions">
            <a class="btn primary" href="#/chat">进入在线客服</a>
            <a class="btn secondary" href="#/knowledge">查看知识库</a>
            <a class="btn secondary" href="#/architecture">系统架构</a>
          </div>
        </div>
        <div class="dashboard-card">
          <h3>客服运行概览</h3>
          <p>通过知识库增强和工具调用能力，提升复杂咨询场景下的回答可控性与处理效率。</p>
          <div class="metric-grid">
            <div class="metric"><strong>10,000+</strong><span>知识片段</span></div>
            <div class="metric"><strong>10+</strong><span>工具能力</span></div>
            <div class="metric"><strong>92%</strong><span>格式合规率</span></div>
            <div class="metric"><strong>5%以内</strong><span>低依据回答占比</span></div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="eyebrow">Core Capabilities</p>
            <h2>核心能力</h2>
            <p>系统将大模型对话能力与业务知识库、工具调用、任务规划结合，覆盖客服问答的主要处理链路。</p>
          </div>
        </div>
        <div class="grid-3">
          <div class="card feature-card">
            <div class="feature-icon">💬</div>
            <h3>多轮对话与记忆</h3>
            <p>保留会话上下文，使客服能够理解用户连续追问，避免每轮咨询都重复描述背景。</p>
          </div>
          <div class="card feature-card">
            <div class="feature-icon">📚</div>
            <h3>RAG 知识库问答</h3>
            <p>根据用户问题召回相关业务资料，将文档片段注入上下文，提升回答的依据性和业务相关性。</p>
          </div>
          <div class="card feature-card">
            <div class="feature-icon">🧩</div>
            <h3>工具调用与 MCP 扩展</h3>
            <p>封装文档解析、网页抓取、图片检索、报告生成等工具，使 AI 能够完成复杂任务处理。</p>
          </div>
        </div>
      </div>
    </section>
  `);
}

function messageHtml(m) {
  return `
    <div class="msg ${m.role === 'user' ? 'user' : 'bot'}">
      <div class="bubble">
        ${escapeHtml(m.text)}
        ${m.tools ? `<div class="message-tools">${m.tools.map(t => `<span class="tool-chip">${t}</span>`).join('')}</div>` : ''}
      </div>
    </div>
  `;
}

function sendQuick(type) {
  const item = conversations[type];
  messages.push({ role: 'user', text: item.user });
  messages.push({ role: 'bot', text: item.answer, tools: item.tools });
  render();
  setTimeout(() => {
    const box = document.querySelector('.messages');
    if (box) box.scrollTop = box.scrollHeight;
  }, 10);
}

function sendMessage() {
  const input = document.querySelector('#chatInput');
  const text = input.value.trim();
  if (!text) return;
  messages.push({ role: 'user', text });
  const lower = text.toLowerCase();
  let pick = conversations.refund;
  if (text.includes('登录') || text.includes('验证码') || lower.includes('login')) pick = conversations.login;
  if (text.includes('发票') || text.includes('票')) pick = conversations.invoice;
  messages.push({
    role: 'bot',
    text: pick.answer,
    tools: pick.tools
  });
  input.value = '';
  render();
  setTimeout(() => {
    const box = document.querySelector('.messages');
    if (box) box.scrollTop = box.scrollHeight;
  }, 10);
}

function renderChat() {
  return shell(`
    <section class="section">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="eyebrow">Conversation</p>
            <h2>在线客服</h2>
            <p>通过对话记忆、知识库检索和工具调用能力，对用户咨询进行持续理解与处理。</p>
          </div>
        </div>

        <div class="chat-shell">
          <div class="card chat-window">
            <div class="chat-header">
              <div>
                <h3>智能客服会话</h3>
                <p style="margin:4px 0 0;color:var(--muted)">支持退款、登录、发票、课程咨询等常见问题</p>
              </div>
              <span class="status"><span class="dot"></span>在线</span>
            </div>
            <div class="messages">${messages.map(messageHtml).join('')}</div>
            <div class="chat-input">
              <input id="chatInput" placeholder="请输入问题，例如：我想申请退款..." onkeydown="if(event.key==='Enter') sendMessage()" />
              <button class="btn primary" onclick="sendMessage()">发送</button>
            </div>
          </div>

          <div class="card">
            <h3>常见问题</h3>
            <p style="margin-bottom:16px">选择一个场景，查看客服处理链路。</p>
            <div class="quick-list">
              <button onclick="sendQuick('refund')">我买了课程但想退款，应该怎么处理？</button>
              <button onclick="sendQuick('login')">验证码收不到，账号也登录不上怎么办？</button>
              <button onclick="sendQuick('invoice')">支付后怎么开发票？</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `);
}

function renderKnowledge() {
  return shell(`
    <section class="section">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="eyebrow">Knowledge Base</p>
            <h2>业务知识库</h2>
            <p>围绕客服常见咨询构建文档检索能力，支持问题改写、语义召回、上下文增强和回答生成。</p>
          </div>
        </div>

        <div class="layout">
          <aside class="side-panel">
            <div class="side-item"><strong>文档规模</strong><span>10,000+ 业务知识片段</span></div>
            <div class="side-item"><strong>检索策略</strong><span>语义匹配 + 查询重写 + TopK 召回</span></div>
            <div class="side-item"><strong>回答控制</strong><span>基于知识片段生成，减少低依据回答</span></div>
          </aside>

          <div class="card">
            <div class="knowledge-search">
              <input id="docKeyword" placeholder="搜索知识主题：退款、登录、发票、课程..." oninput="filterDocs()" />
              <button class="btn primary" onclick="filterDocs()">检索</button>
            </div>
            <div class="doc-list" id="docList">${docs.map(docHtml).join('')}</div>
          </div>
        </div>
      </div>
    </section>
  `);
}

function docHtml(doc) {
  return `
    <div class="doc-card">
      <div class="doc-top">
        <h4>${doc.title}</h4>
        <span class="score">相关度 ${doc.score}</span>
      </div>
      <p>${doc.content}</p>
      <div class="tag-row">${doc.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
    </div>
  `;
}

function filterDocs() {
  const input = document.querySelector('#docKeyword');
  const q = input.value.trim();
  const result = q ? docs.filter(d => d.title.includes(q) || d.content.includes(q) || d.tags.some(t => t.includes(q))) : docs;
  document.querySelector('#docList').innerHTML = result.length ? result.map(docHtml).join('') : `<div class="doc-card"><h4>暂无匹配结果</h4><p>可以尝试输入“退款”“登录”“发票”等关键词。</p></div>`;
}

function renderTools() {
  return shell(`
    <section class="section">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="eyebrow">Tool Calling</p>
            <h2>工具中心</h2>
            <p>将外部能力封装为工具接口，由模型根据用户意图选择调用，覆盖检索、解析、生成、校验等客服处理环节。</p>
          </div>
        </div>
        <div class="tool-grid">
          ${tools.map(t => `
            <div class="tool-card">
              <div class="icon">${t.icon}</div>
              <h4>${t.title}</h4>
              <p>${t.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `);
}

function renderAgent() {
  return shell(`
    <section class="section">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="eyebrow">Agent Workflow</p>
            <h2>Agent 多步骤任务处理</h2>
            <p>面向复杂咨询场景，采用“理解问题 - 规划步骤 - 调用工具 - 汇总结果”的处理链路。</p>
          </div>
        </div>

        <div class="agent-board">
          <div class="card">
            <div class="pipeline">
              <div class="step">
                <div class="step-no">1</div>
                <div><h4>问题理解</h4><p>识别用户诉求、补充上下文、提取关键信息，例如订单、课程、账号、发票等实体。</p></div>
              </div>
              <div class="step">
                <div class="step-no">2</div>
                <div><h4>查询重写</h4><p>将口语化表达改写为适合知识库检索的标准查询，提高文档召回质量。</p></div>
              </div>
              <div class="step">
                <div class="step-no">3</div>
                <div><h4>工具选择</h4><p>根据任务目标选择知识检索、网页抓取、文档解析、报告生成等工具。</p></div>
              </div>
              <div class="step">
                <div class="step-no">4</div>
                <div><h4>结果汇总</h4><p>结合工具返回结果生成结构化答复，并输出处理建议和下一步操作。</p></div>
              </div>
            </div>
          </div>

          <div class="card">
            <h3>处理记录</h3>
            <div class="timeline">
              <div class="timeline-item active"><h4>识别意图</h4><p>用户咨询“退款流程”，识别为订单售后类问题。</p></div>
              <div class="timeline-item active"><h4>召回知识</h4><p>命中“课程退款与售后规则”文档片段。</p></div>
              <div class="timeline-item active"><h4>调用工具</h4><p>生成工单摘要，并返回用户可执行步骤。</p></div>
              <div class="timeline-item"><h4>等待确认</h4><p>根据用户反馈继续补充订单信息。</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `);
}

function renderEvaluation() {
  return shell(`
    <section class="section">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="eyebrow">Evaluation</p>
            <h2>效果评估</h2>
            <p>通过问题集评估回答格式、业务相关性、知识引用和工具调用效果，持续优化提示词与处理策略。</p>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <h3>Prompt 优化结果</h3>
            <table class="eval-table">
              <thead><tr><th>指标</th><th>优化前</th><th>优化后</th></tr></thead>
              <tbody>
                <tr><td>回答格式合规率</td><td>70%</td><td>92%</td></tr>
                <tr><td>业务相关性</td><td>中</td><td>高</td></tr>
                <tr><td>人工复核压力</td><td>较高</td><td>降低</td></tr>
              </tbody>
            </table>
          </div>

          <div class="card">
            <h3>关键指标</h3>
            <p style="margin-bottom:14px">业务问题回答准确率</p>
            <div class="progress"><span style="width:85%"></span></div>
            <p style="margin:14px 0 14px">格式合规率</p>
            <div class="progress"><span style="width:92%"></span></div>
            <p style="margin:14px 0 14px">低依据回答控制</p>
            <div class="progress"><span style="width:95%"></span></div>
          </div>
        </div>
      </div>
    </section>
  `);
}

function renderArchitecture() {
  return shell(`
    <section class="section">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="eyebrow">Architecture</p>
            <h2>系统架构</h2>
            <p>系统围绕大模型应用层、知识检索层、工具服务层和评估优化层进行拆分，便于扩展不同模型、知识库和工具能力。</p>
          </div>
        </div>

        <div class="arch-grid">
          <div class="arch-card">
            <h4>应用接入层</h4>
            <ul>
              <li>客服会话入口</li>
              <li>SSE 流式响应</li>
              <li>会话上下文管理</li>
              <li>接口跨域配置</li>
            </ul>
          </div>
          <div class="arch-card">
            <h4>大模型编排层</h4>
            <ul>
              <li>Spring AI 调用封装</li>
              <li>Prompt 模板管理</li>
              <li>ReAct 任务规划</li>
              <li>Tool Calling 工具选择</li>
            </ul>
          </div>
          <div class="arch-card">
            <h4>知识检索层</h4>
            <ul>
              <li>文档加载与切分</li>
              <li>查询重写</li>
              <li>语义召回</li>
              <li>上下文增强</li>
            </ul>
          </div>
          <div class="arch-card">
            <h4>工具服务层</h4>
            <ul>
              <li>文件操作</li>
              <li>网页抓取</li>
              <li>资源下载</li>
              <li>图片搜索 MCP 服务</li>
            </ul>
          </div>
          <div class="arch-card">
            <h4>数据与记忆层</h4>
            <ul>
              <li>会话历史</li>
              <li>知识库片段</li>
              <li>工具调用记录</li>
              <li>评估样本记录</li>
            </ul>
          </div>
          <div class="arch-card">
            <h4>评估优化层</h4>
            <ul>
              <li>问题集评估</li>
              <li>格式合规检查</li>
              <li>人工抽样复核</li>
              <li>Prompt 版本优化</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  `);
}

function render() {
  const route = currentRoute();
  const map = {
    home: renderHome,
    chat: renderChat,
    knowledge: renderKnowledge,
    tools: renderTools,
    agent: renderAgent,
    evaluation: renderEvaluation,
    architecture: renderArchitecture
  };
  app.innerHTML = (map[route] || renderHome)();
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[ch]));
}

window.navigate = navigate;
window.sendQuick = sendQuick;
window.sendMessage = sendMessage;
window.filterDocs = filterDocs;

render();
