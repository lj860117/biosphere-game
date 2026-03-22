// ====================================================================
// ===== 游戏术语 Tooltip 系统 =====
// ====================================================================
// 拆分自 game.js — 依赖全局变量: RES, BLDS, TECHS, PHASES, CORE_COLONY, formatNum
// 需在 game.js 之后加载
const GameTooltip = (() => {
  const el = () => document.getElementById('gameTooltip');
  let _showing = false;
  let _hideTimer = null;

  // ===== 已见术语追踪（降低受众门槛：首次遇到的术语会高亮提示） =====
  const SEEN_KEY = 'bioSeenTerms';
  let _seenTerms = new Set();
  try {
    const saved = localStorage.getItem(SEEN_KEY);
    if (saved) _seenTerms = new Set(JSON.parse(saved));
  } catch(e) {}
  function markSeen(term) {
    if (_seenTerms.has(term)) return;
    _seenTerms.add(term);
    try { localStorage.setItem(SEEN_KEY, JSON.stringify([..._seenTerms])); } catch(e) {}
    // 移除该术语所有 DOM 实例的 term-new 标记
    document.querySelectorAll(`.game-term.term-new[data-term="${term}"]`).forEach(el => {
      el.classList.remove('term-new');
    });
  }
  function isNewTerm(term) { return !_seenTerms.has(term); }

  // ===== 游戏词典 =====
  function buildGlossary() {
    const dict = {};

    // 资源
    for (const [k, r] of Object.entries(RES)) {
      dict[r.n] = { title: `${r.icon} ${r.n}`, tag: '资源', desc: `游戏基础资源之一。`, detail: `阶段 P${r.phase} 解锁`, color: r.c };
    }
    // 资源别名
    dict['葡萄糖'] = { ...dict['葡萄糖'], desc: '最基础的碳源资源，由碳源采集器通过帝国核心供能采集。是其他所有生产链的起点。' };
    dict['ATP能量'] = { ...dict['ATP能量'], desc: '细胞的能量货币。由ATP合成酶将葡萄糖转化产生，驱动几乎所有建筑运转。' };
    dict['能量'] = dict['ATP能量'];
    dict['DNA'] = { ...dict['DNA'], desc: '遗传信息载体。由简易提取器或DNA提取器合成，用于进化升级和科技研究。' };
    dict['氮源'] = { ...dict['氮源'], desc: '重要的氮元素来源。由固氮装置从环境中固定，是蛋白质合成的关键原料。' };
    dict['蛋白质'] = { ...dict['蛋白质'], desc: '生命的基本构建材料。由蛋白质工厂将氮源转化而成，用于高级建筑和研究。' };
    dict['生物质'] = { ...dict['生物质'], desc: '高级复合有机物。由生物膜反应器合成，是后期建筑和奇观的核心材料。' };
    dict['QS信号'] = { ...dict['QS信号'], desc: '群体感应信号分子。由群体感应塔产生，积累后可提升全局效率（最高+80%）。' };

    // 建筑
    for (const [k, b] of Object.entries(BLDS)) {
      const extra = [];
      if (b.ratio) extra.push(`转化: ${b.ratio}`);
      if (b.corePowered) extra.push('🏠 由帝国核心供能');
      if (b.isWonder) extra.push('🌟 奇观建筑（全图仅1座）');
      if (b.tier) extra.push(`科技等级: T${b.tier}`);
      dict[b.n] = { title: `${b.emoji||''} ${b.n}`, tag: b.isWonder ? '奇观' : '建筑', desc: b.d, detail: extra.join('\n'), color: b.color || 'var(--cyan)' };
    }

    // 科技
    for (const [k, t] of Object.entries(TECHS)) {
      const costStr = Object.entries(t.cost).map(([r,v]) => `${formatNum(v)}${RES[r]?.icon||r}`).join(' + ');
      dict[t.n] = { title: `📖 ${t.n}`, tag: '科技', desc: `${t.d} — ${t.ef}`, detail: `费用: ${costStr} | 研究时间: ${t.time}秒`, color: '#60a5fa' };
    }

    // 阶段
    for (const p of PHASES) {
      dict[`阶段${p.id}`] = { title: `${p.icon} 阶段 ${p.id}: ${p.name}`, tag: '阶段', desc: p.desc, detail: p.id > 1 ? `需要进化等级 ≥ Lv.${p.id}` : '初始阶段', color: '#22d3ee' };
      dict[`P${p.id}`] = dict[`阶段${p.id}`];
    }

    // 帝国核心各级
    for (const [lv, cc] of Object.entries(CORE_COLONY)) {
      dict[cc.name] = { title: `${cc.emoji} ${cc.name}`, tag: `核心 P${lv}`, desc: cc.desc, detail: `供能上限: ${cc.maxCollectors} 台碳源采集器`, color: cc.color };
    }

    // 核心概念
    dict['帝国核心'] = { title: '🏠 帝国核心', tag: '系统', desc: '你的微生物帝国中枢。为碳源采集器提供能量供给，随阶段升级而进化。', detail: '升级核心可增加供能上限', color: '#60a5fa' };
    dict['核心供能'] = { title: '⚡ 核心供能', tag: '机制', desc: '帝国核心为碳源采集器提供免费能量驱动，不消耗ATP。', detail: '每阶段供能上限不同（P1:2台 → P5:10台）', color: '#22c55e' };
    dict['进化'] = { title: '🧬 进化系统', tag: '系统', desc: '消耗DNA和蛋白质提升进化等级，获得全局效率加成。', detail: '每次进化+10~20%效率\n进化等级也是核心升级的前置条件', color: '#a855f7' };
    dict['进化等级'] = dict['进化'];
    dict['传送带'] = { title: '⛓ 传送带', tag: '系统', desc: '连接相邻建筑，自动传输资源。传送带有等级（Lv.1~5），影响传输效率。', detail: 'Lv.1=75% → Lv.3=100% → Lv.5=150%', color: '#f97316' };
    dict['效率'] = { title: '📈 全局效率', tag: '机制', desc: '影响所有建筑的产出倍率。通过进化、科技、QS信号等途径提升。', detail: '基础100%，理论上限无封顶', color: '#22c55e' };
    dict['种群'] = { title: '🦠 种群', tag: '机制', desc: '你的微生物菌落规模。随建筑增多而增长，每100个体提供额外效率加成。', detail: '种群加成 = 每100个体 +2%效率', color: '#3b82f6' };
    dict['转生'] = { title: '🌀 转生', tag: '系统', desc: '重置进度换取永久加成。保留进化因子可购买转生加成，下一世更快发展。', detail: '评分越高获得的进化因子越多', color: '#eab308' };
    dict['进化因子'] = { title: '🌀 进化因子', tag: '货币', desc: '转生获得的永久货币，用于购买各种跨世代加成。', detail: '评分决定获得数量', color: '#eab308' };
    dict['奇观'] = { title: '🏛️ 奇观', tag: '建筑', desc: '终极建筑，全图仅限建造一座。拥有极其强大的效果。', detail: '微型戴森球: 0消耗 → 12⚡+8🟢+2🧱/s', color: '#a855f7' };
    dict['生物膜'] = { title: '🧱 生物膜', tag: '概念', desc: '微生物聚集形成的保护性结构。在游戏中，生物膜反应器可合成生物质资源。', detail: '生物膜技术科技可解锁生物膜反应器', color: '#10b981' };
    dict['群体感应'] = { title: '📡 群体感应', tag: '机制', desc: '微生物通过分泌信号分子来协调群体行为。游戏中QS信号可提供全局效率加成。', detail: 'QS加成上限: 50%（信号增幅器可提升到80%）\nQS信号会缓慢衰减', color: '#eab308' };
    dict['挑战'] = { title: '🏆 挑战任务', tag: '系统', desc: '限时目标任务，完成后获得效率加成奖励。', detail: '每个阶段解锁新挑战', color: '#f97316' };
    dict['成就'] = { title: '🏅 成就系统', tag: '系统', desc: '达成特定里程碑解锁成就，记录你的帝国发展历程。', detail: '共21项成就可解锁', color: '#eab308' };

    // ===== 右侧面板 — 菌落状态 =====
    dict['细菌种群'] = { title: '🦠 细菌种群', tag: '状态', desc: '你的微生物菌落总个体数量。种群越多，生产效率越高。', detail: '每100个体提供+2%效率加成\n种群上限 = 50 + 建筑数×40 + (阶段-1)×100\n种群需要消耗葡萄糖作为食物', color: '#3b82f6' };
    dict['食物消耗'] = { title: '🍽️ 食物消耗', tag: '机制', desc: '种群需要消耗葡萄糖维持生存。每100个体每秒消耗0.5葡萄糖。', detail: '食物不足时会触发功率下降:\n🟢 储备>80%: 满功率100%\n🟡 储备50-80%: 正常但预警\n🟠 储备20-50%: 低功率70%\n🔴 储备<20%: 危机模式40%\n⛔ 储备耗尽: 极限模式20%\n功率下降会降低所有建筑产出！', color: '#f97316' };
    dict['功率水平'] = { title: '🔋 功率水平', tag: '机制', desc: '反映葡萄糖储备状况，直接影响全局产能。', detail: '功率水平 = 葡萄糖储备 ÷ (30秒消耗量)\n功率低于100%时所有建筑产出按比例降低\n保持充足的葡萄糖储备是帝国运转的基础！', color: '#22c55e' };
    dict['成就里程碑'] = { title: '🏅 成就里程碑', tag: '系统', desc: '每解锁5个成就触发一个里程碑，获得永久buff加成。', detail: '5个成就: 全局效率+5%\n10个成就: 建造费用-8%\n15个成就: 传送带效率+10%\n20个成就: 全局效率+8%\n25个成就: 种群上限+100\n30个成就: 效率+12% + 费用-10%', color: '#fbbf24' };
    dict['工作效率'] = { title: '⚡ 工作效率', tag: '状态', desc: '所有建筑的全局产出倍率。初始100%，通过多种途径提升。', detail: '提升途径：进化(+10~20%) / 科技 / QS信号(最高+80%) / 挑战奖励 / 转生加成\n效率越高，所有资源产出越快', color: '#22c55e' };
    dict['物流效率'] = { title: '🚚 物流效率', tag: '状态', desc: '资源运输的综合效率。由仓储加成和传送带平均效率共同决定。', detail: '物流效率 = 仓储加成 × 传送带平均效率\n升级传送带可提升物流效率\n「自适应物流」科技提供额外+20%', color: '#60a5fa' };
    dict['总分数'] = { title: '🏆 总分数', tag: '评分', desc: '衡量你的帝国发展综合实力的评分。决定转生时获得的进化因子数量。', detail: '分数来源：阶段 + 进化 + 建筑 + 科技 + 成就 + 挑战 + 资源峰值 + 效率\n时间惩罚：30分钟后每小时-50分', color: '#fbbf24' };
    dict['评级'] = { title: '🏅 评级', tag: '评分', desc: '根据总分数自动评定的等级。从低到高：E → D → C → B → A → S → SS → SSS。', detail: 'E: 0分 / D: 300分 / C: 800分 / B: 1500分\nA: 2500分 / S: 3500分 / SS: 4500分 / SSS: 5000分', color: '#fbbf24' };

    // ===== 右侧面板 — 统计指标 =====
    dict['在线时长'] = { title: '⏱ 在线时长', tag: '统计', desc: '本轮游戏的累计在线时间。影响最终评分中的时间惩罚项。', detail: '前30分钟不扣分，之后每小时扣50分\n高效率玩家追求短时间高分', color: '#94a3b8' };
    dict['总建造数'] = { title: '🏗️ 总建造数', tag: '统计', desc: '本轮游戏中累计放置的建筑总数（含已回收的）。', detail: '每座建筑贡献15分到总分数', color: '#94a3b8' };
    dict['总回收数'] = { title: '♻️ 总回收数', tag: '统计', desc: '通过右键回收的建筑总数。回收可返还部分资源，腾出格子空间。', detail: '回收返还50%建造资源\n合理回收低级建筑是策略的一部分', color: '#94a3b8' };
    dict['进化次数'] = { title: '🧬 进化次数', tag: '统计', desc: '本轮游戏中完成进化的总次数。每次进化提升进化等级和效率。', detail: '进化需要DNA和蛋白质\n进化等级是核心升级的前置条件', color: '#a855f7' };
    dict['研究完成'] = { title: '📖 研究完成', tag: '统计', desc: '已完成的科技研究数量。共13项科技，完成全部可解锁成就。', detail: '每项科技提供80分到总分数\n科技解锁新建筑和效率加成', color: '#60a5fa' };
    dict['峰值'] = { title: '📊 峰值', tag: '统计', desc: '本轮游戏中各项资源达到的历史最高值。峰值越高说明经济越繁荣。', detail: '资源峰值会计入最终总分数', color: '#94a3b8' };
    dict['挑战完成'] = { title: '🎯 挑战完成', tag: '统计', desc: '已完成的限时挑战数量。完成挑战获得效率加成等奖励。', detail: '每个阶段解锁不同的挑战目标', color: '#f97316' };

    // ===== 阶段名称（单独作为词条） =====
    dict['采集'] = { title: '🌱 采集（P1）', tag: '阶段', desc: '游戏第一阶段。建造碳源采集器收集葡萄糖，开始最基础的资源积累。', detail: '核心建筑：碳源采集器、ATP合成酶\n目标：积累资源，准备进化', color: '#22c55e' };
    dict['代谢'] = { title: '⚗️ 代谢（P2）', tag: '阶段', desc: '第二阶段。解锁氮源固定和蛋白质合成，建立更复杂的资源转化链。', detail: '新建筑：固氮装置、蛋白质工厂、DNA提取器\n核心升级为「原核聚落」', color: 'var(--orange)' };
    dict['物流'] = { title: '🔗 物流（P3）', tag: '阶段', desc: '第三阶段。建立生物膜资源链，传送带网络变得更加重要。', detail: '新建筑：生物膜反应器、仓储中心\n物流效率成为关键发展指标', color: 'var(--blue)' };
    dict['自动化'] = { title: '🧠 自动化（P4）', tag: '阶段', desc: '第四阶段。解锁QS群体感应系统，自动化调控全局效率。', detail: '新建筑：群体感应塔、信号增幅器\nQS信号提供全局效率加成', color: 'var(--yellow)' };

    // ===== 培养皿 & 环境 =====
    dict['培养皿'] = { title: '🔬 培养皿', tag: '系统', desc: '你的微生物帝国主战场。在这个网格中放置建筑、连接传送带。', detail: '拖拽移动 / 双击升级 / 右键回收 / 框选批量\n快捷键：空格暂停 / 1-3加速', color: '#22d3ee' };
    dict['能量供给'] = { title: '⚡ 能量供给', tag: '机制', desc: '帝国核心为碳源采集器提供免费能量驱动，无需消耗ATP。', detail: '供能数量随核心等级提升\nP1:2台 → P2:4台 → P3:6台 → P4:8台 → P5:10台', color: '#22c55e' };
    dict['碳源'] = { title: '🟢 碳源', tag: '资源', desc: '碳元素的来源，即葡萄糖。是整个帝国最基础的资源。', detail: '由碳源采集器通过核心供能采集\n是食物链和产出链的起点', color: '#22c55e' };
    dict['人口'] = dict['细菌种群'];
    dict['人口上限'] = { title: '🦠 种群上限', tag: '机制', desc: '种群数量的最大值。建造更多建筑和升级阶段可提高上限。', detail: '上限 = 50 + 建筑数×40 + (阶段-1)×100 + 科技加成\n「高级种群学」科技额外+200上限', color: '#3b82f6' };

    // ===== 流水线 & 产能链 =====
    dict['流水线'] = { title: '🏭 流水线', tag: '系统', desc: '展示当前激活的资源生产链条。每条流水线由对应建筑激活。', detail: '基础产能 → 能量转化 → DNA合成 → 蛋白质合成 → 生物膜培养 → 群体感应', color: '#60a5fa' };
    dict['基础产能'] = { title: '🏠 基础产能', tag: '流水线', desc: '核心供能驱动碳源采集器，产出葡萄糖。无需任何消耗。', detail: '产出: 1.5🟢葡萄糖/s（基础值）\n受效率和传送带等级加成', color: '#22c55e' };
    dict['能量转化'] = { title: '⚡ 能量转化', tag: '流水线', desc: 'ATP合成酶将葡萄糖转化为ATP能量。', detail: '消耗: 1🟢 → 产出: 2.5⚡/s（基础值）', color: '#f97316' };

    // ===== 建筑等级 & 升级 =====
    dict['建筑等级'] = { title: '⬆ 建筑等级', tag: '机制', desc: '每座建筑可升级至Lv.5。双击建筑或点击升级按钮提升等级。', detail: '每级提升约25%产出\n升级消耗随等级递增', color: '#60a5fa' };
    dict['回收'] = { title: '♻️ 回收', tag: '操作', desc: '右键点击建筑可回收，返还50%建造资源并腾出格子空间。', detail: '长按也可触发回收\n合理回收低级建筑是进阶策略', color: '#ef4444' };

    // ===== 环境参数 =====
    dict['pH'] = { title: '🧪 pH', tag: '环境', desc: '培养皿的酸碱度。当前固定为7.0（中性环境），是微生物最适生长条件。', detail: '后续版本可能加入pH变化机制', color: '#22d3ee' };

    // ===== 生物学科普术语（降低受众门槛） =====
    dict['ATP'] = { title: '⚡ ATP（三磷酸腺苷）', tag: '科普', desc: '细胞的"能量货币"。全称 Adenosine Triphosphate，几乎所有生命活动都依赖它提供能量。', detail: '在游戏中：碳源采集器产出的葡萄糖经ATP合成酶转化为ATP能量\n现实中：人体每天消耗约40kg ATP（不断循环再生）', color: '#f97316' };
    dict['核糖体'] = { title: '🫧 核糖体（Ribosome）', tag: '科普', desc: '细胞中的"蛋白质生产车间"。负责将mRNA上的遗传信息翻译成蛋白质。', detail: '在游戏中：核糖体集群可同时产出DNA和葡萄糖\n现实中：一个细菌细胞内约有2万个核糖体在同时工作', color: '#c084fc' };
    dict['噬菌体'] = { title: '🦠 噬菌体（Bacteriophage）', tag: '科普', desc: '专门感染细菌的病毒。它将自己的DNA注入细菌体内，利用细菌的分子机器复制自身。', detail: '在游戏中：噬菌体裂解器利用裂解机制释放高纯DNA\n噬菌体入侵是负面事件——当心病毒感染！\n现实中：噬菌体是地球上数量最多的生物实体', color: '#ef4444' };
    dict['CRISPR'] = { title: '✂️ CRISPR（基因剪刀）', tag: '科普', desc: '一种革命性的基因编辑技术。原本是细菌用来抵御噬菌体的免疫系统。2020年诺贝尔化学奖。', detail: '在游戏中：CRISPR编辑器突变可锁定培育类别\n现实中：CRISPR-Cas9可精准剪切DNA的特定位点', color: '#22c55e' };
    dict['生物膜'] = { ...dict['生物膜'], desc: '微生物聚集形成的保护性结构（Biofilm）。细菌附着在表面并分泌胞外基质，形成有组织的群落。', detail: '在游戏中：生物膜反应器可合成生物质资源\n现实中：牙菌斑就是一种常见的生物膜\n生物膜内的细菌耐药性可比游离细菌高1000倍' };
    dict['质粒'] = { title: '🔄 质粒（Plasmid）', tag: '科普', desc: '细菌体内可独立复制的小型环状DNA。能在细菌之间水平转移，传递抗性基因等有用信息。', detail: '在游戏中：质粒工厂突变可批量生产突变候选\n现实中：质粒是基因工程最常用的载体工具', color: '#a855f7' };
    dict['内共生'] = { title: '🔬 内共生（Endosymbiosis）', tag: '科普', desc: '约20亿年前，一个古细菌吞噬了一个好氧细菌，后者没有被消化，反而成为了线粒体——这就是内共生理论。', detail: '在游戏中：内共生事件突变让历史在你的菌落中重演\n这是生命史上最重要的事件之一——没有它就没有真核生物', color: '#10b981' };
    dict['朊病毒'] = { title: '🧠 朊病毒（Prion）', tag: '科普', desc: '一种仅由蛋白质组成的感染性因子，不含DNA或RNA。它能使正常蛋白质改变折叠方式，像"传染"一样扩散。', detail: '在游戏中：朊病毒记忆突变让蛋白质也能传递信息\n现实中：疯牛病就是由朊病毒引起的', color: '#eab308' };
    dict['信息素'] = { title: '📢 信息素（Pheromone）', tag: '科普', desc: '微生物分泌到环境中的化学信号分子。用于协调群体行为，如生物发光、毒力因子表达等。', detail: '在游戏中：信息素广播站是P4阶段的QS信号发射器\n现实中：费氏弧菌通过信息素实现群体发光——海洋中的"星空"', color: '#eab308' };
    dict['固氮'] = { title: '🌿 固氮（Nitrogen Fixation）', tag: '科普', desc: '将大气中的惰性氮气（N₂）转化为生物可利用的氨（NH₃）的过程。只有少数微生物拥有这种超能力。', detail: '在游戏中：固氮装置将环境氮源转化为可用氮资源\n现实中：根瘤菌与豆科植物的固氮共生是农业的基石', color: '#3b82f6' };
    dict['戴森球'] = { title: '☀️ 戴森球（Dyson Sphere）', tag: '科普', desc: '一种假想的巨型结构，完全包裹恒星以捕获其全部能量输出。由物理学家弗里曼·戴森于1960年提出。', detail: '在游戏中：微型戴森球是终极奇观——用生物膜在恒星轨道上建造\n代表了微生物文明的极限想象', color: '#fbbf24' };

    return dict;
  }

  let _glossary = null;
  function glossary() {
    if (!_glossary) _glossary = buildGlossary();
    return _glossary;
  }

  // ===== Tooltip 显示/隐藏 =====
  function show(termKey, anchorRect) {
    const g = glossary();
    const info = g[termKey];
    if (!info) return;

    // 用户查看了这个术语，标记为已见（移除高亮）
    markSeen(termKey);

    const tip = el();
    if (!tip) return;

    let html = `<div class="tt-title">${info.title} <span class="tt-tag">${info.tag}</span></div>`;
    html += `<div class="tt-desc">${info.desc}</div>`;
    if (info.detail) {
      html += `<div class="tt-detail">${info.detail.split('\n').map(l => `<span>${l}</span>`).join('')}</div>`;
    }
    tip.innerHTML = html;
    tip.style.borderColor = (info.color || 'rgba(168,85,247,0.35)') + '60';

    // 位置计算
    tip.classList.add('show');
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = anchorRect.left + anchorRect.width / 2 - tw / 2;
    let top = anchorRect.top - th - 8;
    // 下方空间不足则放上方，上方不足放下方
    if (top < 4) top = anchorRect.bottom + 8;
    if (top + th > vh - 4) top = vh - th - 4;
    if (left < 4) left = 4;
    if (left + tw > vw - 4) left = vw - tw - 4;
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
    _showing = true;

    clearTimeout(_hideTimer);
  }

  function hide() {
    _hideTimer = setTimeout(() => {
      const tip = el();
      if (tip) tip.classList.remove('show');
      _showing = false;
    }, 80);
  }

  // ===== 直接传入数据显示 Tooltip（不经过词典） =====
  function showRaw(info, anchorRect) {
    if (!info) return;
    const tip = el();
    if (!tip) return;

    let html = `<div class="tt-title">${info.title} <span class="tt-tag">${info.tag}</span></div>`;
    html += `<div class="tt-desc">${info.desc}</div>`;
    if (info.detail) {
      html += `<div class="tt-detail">${info.detail.split('\n').map(l => `<span>${l}</span>`).join('')}</div>`;
    }
    tip.innerHTML = html;
    tip.style.borderColor = (info.color || 'rgba(168,85,247,0.35)') + '60';

    // 位置计算（复用 show 逻辑）
    tip.classList.add('show');
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = anchorRect.left + anchorRect.width / 2 - tw / 2;
    let top = anchorRect.top - th - 8;
    if (top < 4) top = anchorRect.bottom + 8;
    if (top + th > vh - 4) top = vh - th - 4;
    if (left < 4) left = 4;
    if (left + tw > vw - 4) left = vw - tw - 4;
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
    _showing = true;

    clearTimeout(_hideTimer);
  }

  // ===== DOM 扫描：为文本中的术语添加 .game-term 包装 =====
  // 需要扫描的容器 ID 列表
  const SCAN_CONTAINERS = [
    'buildList', 'techList', 'evoSection', 'coreColonyBar', 'coreUpgradePanel',
    'chainList', 'resGrid', 'logBox', 'guideBox', 'challengeBar',
    'colonyStatCard', 'statsContent'
  ];

  // 构建正则（按长度降序，优先匹配长词）
  let _termRegex = null;
  function getTermRegex() {
    if (!_termRegex) {
      const terms = Object.keys(glossary()).sort((a, b) => b.length - a.length);
      _termRegex = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
    }
    return _termRegex;
  }

  // 扫描并包装术语（避免重复包装）
  function wrapTermsInNode(node) {
    if (node.nodeType === 3) { // Text node
      const text = node.textContent;
      if (!text || text.trim().length < 2) return;
      const regex = getTermRegex();
      regex.lastIndex = 0;
      if (!regex.test(text)) return;
      regex.lastIndex = 0;

      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      let match;
      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIdx) {
          frag.appendChild(document.createTextNode(text.slice(lastIdx, match.index)));
        }
        const span = document.createElement('span');
        span.className = 'game-term' + (isNewTerm(match[1]) ? ' term-new' : '');
        span.dataset.term = match[1];
        span.textContent = match[1];
        frag.appendChild(span);
        lastIdx = regex.lastIndex;
      }
      if (lastIdx < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx)));
      }
      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === 1 && !node.classList?.contains('game-term')
               && !['SCRIPT','STYLE','SVG','CANVAS','INPUT','TEXTAREA'].includes(node.tagName)
               && !node.dataset?.termScanned) {
      // 跳过 button 内部（但扫描 .act-desc, .act-name, .act-cost 等文本容器）
      const tag = node.tagName;
      if (tag === 'BUTTON' || tag === 'SELECT') {
        // 只扫描按钮内的文本展示子元素
        const textDivs = node.querySelectorAll('.act-name, .act-desc, .act-cost, .core-req-item, .tt-desc');
        textDivs.forEach(d => {
          const ch = Array.from(d.childNodes);
          ch.forEach(c => wrapTermsInNode(c));
        });
        return;
      }
      const children = Array.from(node.childNodes);
      children.forEach(c => wrapTermsInNode(c));
    }
  }

  // 对指定容器做一次扫描
  let _scanning = false;
  function scanContainer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    // 简单签名检测是否有变化
    const sig = container.textContent.length + ':' + container.childElementCount;
    if (container.dataset._ttSig === sig) return; // 无变化，跳过
    _scanning = true;
    wrapTermsInNode(container);
    container.dataset._ttSig = sig;
    _scanning = false;
  }

  // 批量扫描（排除高频更新容器）
  // 高频容器（resGrid、logBox）只在 render 时扫描
  const STATIC_CONTAINERS = ['buildList', 'techList', 'evoSection', 'coreColonyBar', 'coreUpgradePanel', 'chainList', 'guideBox', 'challengeBar', 'colonyStatCard'];
  let _scanTimer = null;
  function scheduleScan() {
    if (_scanTimer) return;
    _scanTimer = setTimeout(() => {
      _scanTimer = null;
      SCAN_CONTAINERS.forEach(id => scanContainer(id));
    }, 600);
  }

  // ===== 事件委托：全局 mouseover/mouseout =====
  function init() {
    document.addEventListener('mouseover', (e) => {
      const term = e.target.closest('.game-term');
      if (!term) return;
      const key = term.dataset.term;
      if (!key) return;
      const rect = term.getBoundingClientRect();
      show(key, rect);
    });

    document.addEventListener('mouseout', (e) => {
      const term = e.target.closest('.game-term');
      if (term) hide();
    });

    // 初始扫描（等UI渲染完成）
    setTimeout(() => {
      SCAN_CONTAINERS.forEach(id => scanContainer(id));
    }, 1200);

    // MutationObserver 监听静态容器的内容重建
    const obs = new MutationObserver((mutations) => {
      if (_scanning) return; // 自身扫描导致的变化，忽略
      let needScan = false;
      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length > 0) {
          for (const id of STATIC_CONTAINERS) {
            const container = document.getElementById(id);
            if (container && (container.contains(m.target) || m.target === container)) {
              // 清除签名让下次扫描生效
              delete container.dataset._ttSig;
              needScan = true;
              break;
            }
          }
        }
        if (needScan) break;
      }
      if (needScan) scheduleScan();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  return { init, glossary, scheduleScan, show, showRaw, hide, markSeen, isNewTerm };
})();
