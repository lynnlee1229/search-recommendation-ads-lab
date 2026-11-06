/* Explicit interface copy. Scientific examples, source code and user inputs stay verbatim. */
(function (global) {
  'use strict';
  const dictionary = {
    '搜推广告学习 Lab · Search Recommendation Ads Lab': 'Search, Recommendation & Ads Lab',
    '63 个实验章节 · 中英双语': '63 experiment lessons · Chinese & English',
    '跳到主要内容': 'Skip to main content', '学习 LAB': 'LEARNING LAB',
    '理解机制，运行实验，追溯证据。': 'Understand the mechanism. Run the experiment. Trace the evidence.',
    '公用': 'Foundations', '搜索': 'Search', '广告': 'Advertising', '推荐': 'Recommendation',
    '课程、工具与实验记录': 'Lessons, tools and experiments', '在各自模块内查看。': 'organized by domain.',
    '真实离线实验 / 独立模拟': 'Offline evidence / explicit simulations',
    '公用 / 起步': 'Foundations / Start', '搜推广告学习 Lab': 'Search, Recommendation & Ads Lab',
    '从一个问题开始：先预测，只改一个变量，运行，再解释结果。': 'Start with a question. Predict, change one variable, run, then explain.',
    '正在读取真实数据与训练结果…': 'Loading local data and training results…',
    '一个实验，先回答四件事': 'Four steps for every experiment',
    '预测': 'Predict', '写下问题、预期变化与失败条件，再看结果。': 'Write down the question, expected change and failure condition before looking at results.',
    '控制变量': 'Control', '固定输入、切分、种子与预算，只改变一个变量。': 'Fix inputs, splits, seeds and budget. Change one variable.',
    '运行': 'Run', '先完整运行，再重跑改动格与下游；正式实验另存新记录。': 'Run the whole notebook first. After a change, rerun dependent cells. Save each formal experiment as a new record.',
    '解释': 'Explain', '检查误差、资源与负结果；只在同一任务和评估口径内比较。': 'Inspect errors, resource costs and negative results. Compare only within the same task and evaluation protocol.',
    '共享的是方法，指标取决于任务': 'A shared method; task-specific metrics',
    '任务': 'Task', '实际证据': 'Evidence', '评估口径与局限': 'Evaluation and limits',
    '真实查询、文档与qrels': 'Real queries, documents and relevance judgments',
    'NDCG / MRR / Recall；未判断文档不等于已验证负例。': 'NDCG / MRR / Recall. An unjudged document is not a verified negative.',
    '广告预测': 'Ad prediction', '真实抽样曝光与点击': 'Sampled real impressions and clicks',
    'AUC / logloss / Brier / 校准；抽样概率不代表线上CTR。': 'AUC / log loss / Brier / calibration. Sample probabilities are not online CTR.',
    '广告决策': 'Ad decisions', '独立生成的市场': 'Separately generated markets',
    '模拟支付、价值与预算约束；不能证明真实增收。': 'Simulated payments, value and budget constraints. These do not establish real revenue gains.',
    '行为日志与时间边界': 'Behavior logs and temporal boundaries',
    'Recall / NDCG / 覆盖；未交互不是真实负曝光。': 'Recall / NDCG / coverage. No interaction does not mean a negative exposure.',
    '同一套实验基础设施': 'One experiment infrastructure',
    '公开输入按固定版本与SHA校验；实验新建记录，保留配置、来源、失败与负结果；教学select与正式评估分开。数据、模型和逐条预测保留本机。': 'Public inputs are pinned and SHA-verified. New records preserve configuration, provenance, failures and negative results. Teaching select scores remain separate from formal evaluation. Data, models and individual predictions stay local.',
    '查看全局台账 →': 'Browse all experiments →', '查看公共源码 →': 'Explore shared code →',
    '广告 · 讲义与路线': 'Advertising · Sources & syllabus', '搜索 · 讲义与路线': 'Search · Sources & syllabus',
    '正在读取课程来源…': 'Loading course sources…',
    '真实语料 · 冻结小模型与训练重排': 'Real corpus · frozen encoders and trained rerankers',
    '检索一条科学声明': 'Retrieve evidence for a scientific claim',
    '输入英文声明，比较词法、语义、融合与重排。分数表示文档排序，不表示声明成立概率。': 'Enter a claim in English. Compare lexical, semantic, fusion and reranking methods. Scores rank documents; they are not probabilities that a claim is true.',
    '深入路径：任务 → BM25 → 语义 → 索引 → 重排 → 误差 ↗': 'Read: task → BM25 → semantics → index → reranking → errors ↗',
    '在真实 SciFact 语料检索（英文科学声明）': 'Search the real SciFact corpus (English claim)',
    '方法': 'Method', 'MiniLM 向量': 'MiniLM vectors', '混合 RRF': 'Hybrid RRF', '训练线性重排': 'Trained linear reranker', 'TinyBERT 重排': 'TinyBERT reranker', '检索论文': 'Retrieve papers',
    '首次使用：先按 README 运行': 'Prepare the local data and model first (see README):',
    '准备数据与正式模型。首次神经查询需加载本机模型。': 'The first neural query loads the local model.',
    '真实概率预测 / 独立模拟决策': 'Real probability estimation / separate simulated decisions',
    '先检查概率，再研究出价': 'Understand the probability before the bid',
    '预测层读取真实训练模型；决策层使用独立生成的市场。两者的结果不能当作真实竞价回放。': 'Prediction uses a trained model on real data. Decisions use a separately generated market. Together they are not a replay of real auctions.',
    '深入路径：数据 → 特征 → 容量 → 校准 → 拍卖 → 预算 ↗': 'Read: data → features → capacity → calibration → auctions → budget ↗',
    '真实点击模型：修改匿名特征': 'Real click model: edit anonymous features',
    '从本机审计样本载入13个数值、26个匿名类别；可修改一个变量。概率仅针对抽样后的公开日志分布。': 'Load 13 numeric and 26 anonymous categorical fields from a local audit sample. Change one variable. Probabilities apply only to the sampled public log distribution.',
    '载入真实样本': 'Load a real sample', '计算点击概率': 'Estimate click probability', '首次使用：运行': 'First, prepare the real click model:',
    '准备真实点击模型。模拟市场可独立运行。': 'The simulated market runs independently.',
    '独立模拟市场': 'Independent simulated market', '在相同市场里比较出价与预算': 'Compare bids and budgets in the same market',
    '这一层研究决策机制，与Criteo的真实点击数据分开。先固定潜在市场，再只改变出价倍数或pacing。': 'Study decision mechanisms separately from Criteo click data. Fix the potential market, then change only the bid multiplier or pacing.',
    '独立模拟市场：出价与预算 pacing': 'Independent market: bidding and budget pacing',
    '3个模拟广告主、6000次请求、二价按曝光支付。与Criteo无因果或收益联系；所有货币与收入均为模拟。': 'Three simulated advertisers, 6,000 requests and second-price payment per impression. There is no causal or revenue connection to Criteo. All money and revenue are simulated.',
    '策略': 'Strategy', '估计点击率 × 点击价值': 'Estimated CTR × click value', '固定曝光出价': 'Fixed bid per impression',
    '每广告主预算': 'Budget per advertiser', '出价倍数': 'Bid multiplier', '均匀预算pacing': 'Uniform budget pacing', '运行相同seed模拟': 'Run with the same seed',
    '同一实验目录，按领域与阶段查看；教学 select 与正式评估独立呈现。': 'One experiment registry, organized by domain and stage. Teaching select scores and formal evaluations stay separate.',
    '实验领域': 'Experiment domain', '全部领域': 'All domains', '刷新记录': 'Refresh records', '正在读取实验…': 'Loading experiments…',
    '查找本模块章节': 'Find a lesson in this path', '正在读取完整 Notebook 课程目录…': 'Loading the notebook catalog…',
    'JupyterLab 使用项目独立 Python 3.12 内核；首次打开会启动本地服务，稍等片刻即可。': 'JupyterLab uses the project’s Python 3.12 kernel. Its local service starts when you first open a notebook.',
    'Python 模块': 'Python module', 'models.py · 双塔网络与损失': 'models.py · two-tower network and loss',
    'data.py · 数据与样本': 'data.py · data and sampling', 'train.py · 训练循环': 'train.py · training loop', 'service.py · 推荐服务': 'service.py · recommendation service',
    '竞赛 · data.py · 官方数据': 'XMRec · data.py · official data', '竞赛 · memory.py · ItemCF': 'XMRec · memory.py · ItemCF',
    '竞赛 · graph.py · 采样与 LightGCN': 'XMRec · graph.py · sampling and LightGCN', '竞赛 · ranking.py · LightGBM': 'XMRec · ranking.py · LightGBM',
    '竞赛 · experiment.py · 完整实验': 'XMRec · experiment.py · full experiment', '竞赛 · metrics.py · 评估': 'XMRec · metrics.py · evaluation',
    '在 JupyterLab 编辑此文件 ↗': 'Edit this file in JupyterLab ↗', '选择模块后读取源码…': 'Choose a module to read its source…',
    '测试用户': 'Evaluation user', '模型版本': 'Model version', '召回通道': 'Retrieval channel', '三路融合 / RRF': 'Three-channel fusion / RRF', '双塔': 'Two-tower', '热门': 'Popularity',
    '候选预算': 'Candidate budget', 'MMR 相关性 λ': 'MMR relevance λ', '执行推荐': 'Recommend', '反事实：清空序列特征': 'Counterfactual: clear sequence features',
    '保留用户 ID 向量和真实已看过滤；不修改数据，不代表真实用户反馈。': 'The user-ID vector and seen-item filter remain. Data is unchanged; this is not real user feedback.',
    '选择用户，执行一次推荐。这里将展开每一步的候选与分数。': 'Choose a user and run a recommendation to inspect candidates and scores at every stage.',
    '向量所用模型': 'Embedding model', '读取特征快照': 'Inspect feature snapshot', '读取用户的训练截止快照，查看模型实际使用的输入。': 'Inspect the user snapshot at the training cutoff and the actual model inputs.',
    '训练样本与损失诊断': 'Training samples and loss diagnostics', '读取真实样本': 'Inspect real samples',
    '正样本是用户首次交互的新物品；此前行为构成上下文。负样本来自同一批中的其他目标，重复目标会被屏蔽。': 'A positive is a user’s first interaction with a new item; earlier events form the context. Other batch targets serve as negatives, with duplicate targets masked.',
    '启动一次可比较的实验': 'Start a comparable experiment', '单个训练任务 · CPU 4 线程': 'One training job · 4 CPU threads',
    '先写下假设，再只改变一个变量。所有配置和模型都另存为新版本。': 'State a hypothesis, then change one variable. Each configuration and model is saved as a new version.',
    '实验名称': 'Experiment name', 'Embedding 维度': 'Embedding dimension', '序列长度': 'History length', '训练轮数': 'Epochs', '学习率': 'Learning rate', '温度 τ': 'Temperature τ', '随机种子': 'Random seed',
    '使用历史序列': 'Use history sequence', '启用 LogQ 采样纠偏': 'Enable LogQ sampling correction', '保存配置并训练新模型': 'Save configuration and train a new model',
    '模型代码入口': 'Model source',
    '改变网络结构后，用命令行训练并重启服务；工作台参数只控制现有结构。历史均值不是 DIN；隐藏层 Dropout 不是讲义中的多值特征自监督增强。': 'After changing the architecture, train from the command line and restart the workbench. These controls configure the existing model. Mean history pooling is not DIN; hidden-layer dropout is not the lecture’s multi-value feature augmentation.',
    '所有数据留在本机。推荐日志不含完整曝光；广告概率仅针对公开抽样分布；模拟收益不等于线上收益。': 'Data stays local. Recommendation logs do not include all exposures; ad probabilities describe the public sample; simulated revenue is not online revenue.',
    '推荐数据快照 JSON ↗': 'Recommendation data snapshot JSON ↗',
    '起步': 'Start here', '学习路径': 'Learning path', '实验方法': 'Experiment method', '全局实验台账': 'All experiments', '公共源码': 'Shared code',
    '讲义与路线': 'Sources & syllabus', '检索实验': 'Retrieval lab', '搜索实验记录': 'Search experiments', '搜索源码': 'Search code',
    '点击预测': 'Click prediction', '拍卖与预算': 'Auction & budget', '广告实验记录': 'Ad experiments', '广告源码': 'Ad code',
    '数据与基线': 'Data & baselines', '召回与重排': 'Retrieval & reranking', '特征与样本': 'Features & samples', '双塔训练': 'Two-tower training', '推荐实验记录': 'Recommendation experiments', '讲义与论文': 'Sources & papers', '推荐源码': 'Recommendation code',
    '先建立共用的实验方法与证据口径，再进入一个领域。': 'Build the mathematical foundations and experiment habits shared by all three domains.',
    '从查询与相关性判断开始，学习词法、语义、索引、融合与重排。': 'From queries and relevance judgments to lexical and semantic retrieval, indexing, fusion and reranking.',
    '从产品、计费和市场开始，学习资格与候选、概率预测、拍卖、投放和反馈。': 'From products, billing and markets to eligibility, response prediction, auctions, delivery and feedback.',
    '从用户行为与候选物品开始，学习召回、排序、训练和评估。': 'From user behavior and candidate items to retrieval, ranking, training and evaluation.',
    '一级模块': 'Learning domains', '模块内导航': 'Domain navigation', '广告匿名特征JSON': 'Anonymous ad features as JSON', '当前 Python 源码': 'Python source code',
    '标题、编号或实验类型': 'Title, number or experiment type', '我的序列长度实验': 'My history-length experiment'
  };
  let requested, saved;
  try { requested = new URLSearchParams(global.location?.search || '').get('lang'); } catch (_) {}
  try { saved = global.localStorage?.getItem('soutui-lab.language'); } catch (_) {}
  let lang = ['zh', 'en'].includes(requested) ? requested : ['zh','en'].includes(saved) ? saved : (global.navigator?.language || '').startsWith('zh') ? 'zh' : 'en';
  const staticText = [], staticAttributes = [];
  const normalize = s => s.replace(/\s+/g, ' ').trim();
  function t(text) { return lang === 'en' ? (dictionary[text] ?? text) : text; }
  function tr(zh, en) { return lang === 'en' ? en : zh; }
  function capture(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement?.closest('script,style,code,pre,textarea,[data-verbatim]')) continue;
      const original = node.textContent, key = normalize(original);
      if (dictionary[key]) staticText.push({node, original, key});
    }
    root.querySelectorAll('[aria-label],[placeholder]').forEach(node => {
      for (const attr of ['aria-label', 'placeholder']) {
        const original = node.getAttribute(attr);
        if (dictionary[original]) staticAttributes.push({node, attr, original});
      }
    });
    apply();
  }
  function apply() {
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    document.title = tr('搜推广告学习 Lab', 'Search, Recommendation & Ads Lab');
    for (const {node, original, key} of staticText) if (node.isConnected) {
      node.textContent = lang === 'en' ? original.replace(original.trim(), dictionary[key]) : original;
    }
    for (const {node,attr,original} of staticAttributes) if (node.isConnected) node.setAttribute(attr, t(original));
    document.querySelectorAll('[data-language]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.language === lang));
    });
  }
  function setLanguage(next) {
    if (!['zh','en'].includes(next) || lang === next) return;
    lang = next;
    try { global.localStorage?.setItem('soutui-lab.language', lang); } catch (_) {}
    const url = new URL(global.location.href); url.searchParams.set('lang', lang);
    global.history.replaceState(null, '', url.pathname + url.search + url.hash);
    apply();
    global.dispatchEvent(new CustomEvent('lab:language', {detail:lang}));
  }
  global.I18n = {t, tr, capture, apply, setLanguage, get lang() {return lang;}, dictionary};
})(globalThis);
