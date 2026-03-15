// =============================================================
// BIOSPHERE — 最小闭环版
// 单菌株 → 单代谢 → 简单物流 → 自动化 → 小奇观
// =============================================================

// ===== AUDIO ENGINE — Web Audio API 合成音效 + 程序化背景音乐 =====
const SFX = (() => {
  let ctx = null;
  let sfxVol = 0.5, bgmVol = 0.3;
  let sfxOn = true, bgmOn = true;
  let bgmNodes = null;
  let bgmPhase = 1;
  let initialized = false;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // 基础音符工具
  function noteFreq(note, octave) {
    const notes = { C:0, Cs:1, D:2, Ds:3, E:4, F:5, Fs:6, G:7, Gs:8, A:9, As:10, B:11 };
    return 440 * Math.pow(2, (notes[note] - 9) / 12 + (octave - 4));
  }

  // 通用合成器
  function playTone(freq, dur, type, vol, detune, delay) {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    if (detune) osc.detune.value = detune;
    gain.gain.setValueAtTime(0, c.currentTime + (delay || 0));
    gain.gain.linearRampToValueAtTime(Math.min(vol * sfxVol, 1), c.currentTime + (delay || 0) + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + (delay || 0) + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime + (delay || 0));
    osc.stop(c.currentTime + (delay || 0) + dur + 0.01);
  }

  // 噪声生成器
  function playNoise(dur, vol, filter, freq, delay) {
    const c = getCtx();
    const bufSize = c.sampleRate * dur;
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol * sfxVol, c.currentTime + (delay || 0));
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + (delay || 0) + dur);
    if (filter) {
      const flt = c.createBiquadFilter();
      flt.type = filter;
      flt.frequency.value = freq || 1000;
      src.connect(flt).connect(gain).connect(c.destination);
    } else {
      src.connect(gain).connect(c.destination);
    }
    src.start(c.currentTime + (delay || 0));
  }

  // ===== 音效库 =====
  const sfx = {
    // 建筑放置 — 清脆的升调 + 轻微冲击
    build() {
      if (!sfxOn) return;
      playTone(523, 0.12, 'square', 0.15);   // C5
      playTone(659, 0.12, 'square', 0.12, 0, 0.05);  // E5
      playTone(784, 0.15, 'sine', 0.18, 0, 0.1);     // G5
      playNoise(0.06, 0.08, 'highpass', 3000);
    },

    // 建筑放置失败 — 低沉的拒绝音
    buildFail() {
      if (!sfxOn) return;
      playTone(180, 0.15, 'sawtooth', 0.12);
      playTone(140, 0.2, 'sawtooth', 0.1, 0, 0.08);
    },

    // 回收建筑 — 反向解构音
    recycle() {
      if (!sfxOn) return;
      playTone(600, 0.1, 'square', 0.1);
      playTone(450, 0.1, 'square', 0.08, 0, 0.06);
      playTone(300, 0.15, 'square', 0.06, 0, 0.12);
      playNoise(0.1, 0.06, 'bandpass', 2000, 0.05);
    },

    // 选择建筑 — 轻点音
    select() {
      if (!sfxOn) return;
      playTone(880, 0.06, 'sine', 0.08);
      playTone(1100, 0.06, 'sine', 0.06, 0, 0.03);
    },

    // 研究开始 — 科技启动音
    researchStart() {
      if (!sfxOn) return;
      playTone(440, 0.15, 'triangle', 0.12);
      playTone(554, 0.15, 'triangle', 0.1, 0, 0.1);
      playTone(660, 0.2, 'triangle', 0.12, 0, 0.2);
      playNoise(0.15, 0.04, 'highpass', 5000, 0.1);
    },

    // 研究完成 — 突破性发现
    researchDone() {
      if (!sfxOn) return;
      const base = [523, 659, 784, 1047]; // C E G C'
      base.forEach((f, i) => {
        playTone(f, 0.2, 'sine', 0.15, 0, i * 0.08);
        playTone(f, 0.2, 'triangle', 0.08, 5, i * 0.08);
      });
      playNoise(0.15, 0.06, 'highpass', 4000, 0.3);
    },

    // 成就解锁 — 金色荣耀音
    achieve() {
      if (!sfxOn) return;
      const melody = [784, 988, 1175, 1568]; // G B D' G'
      melody.forEach((f, i) => {
        playTone(f, 0.25, 'sine', 0.15, 0, i * 0.1);
        playTone(f * 0.5, 0.25, 'triangle', 0.06, 0, i * 0.1);
      });
      playTone(1568, 0.5, 'sine', 0.12, 0, 0.4);
    },

    // 进化 — 重磅蜕变
    evolve() {
      if (!sfxOn) return;
      // 低频冲击
      playTone(60, 0.4, 'sine', 0.3);
      playTone(80, 0.3, 'sine', 0.2, 0, 0.1);
      // 上升和弦
      [220, 277, 330, 440, 554].forEach((f, i) => {
        playTone(f, 0.3, 'sawtooth', 0.08, i * 3, i * 0.12);
      });
      // 高频闪光
      playTone(1760, 0.3, 'sine', 0.1, 0, 0.5);
      playNoise(0.2, 0.08, 'bandpass', 3000, 0.1);
    },

    // 阶段推进 — 庄严的阶梯上升
    phaseUp() {
      if (!sfxOn) return;
      // 鼓点
      playTone(80, 0.3, 'sine', 0.3);
      playNoise(0.1, 0.12, 'lowpass', 500);
      // 号角般的上升旋律
      const fanfare = [392, 494, 587, 659, 784]; // G B D' E' G'
      fanfare.forEach((f, i) => {
        playTone(f, 0.3, 'sawtooth', 0.1, 0, 0.15 + i * 0.12);
        playTone(f, 0.3, 'sine', 0.12, 0, 0.15 + i * 0.12);
      });
      // 最终和弦
      playTone(784, 0.6, 'sine', 0.15, 0, 0.8);
      playTone(988, 0.6, 'sine', 0.1, 0, 0.8);
      playTone(1175, 0.6, 'sine', 0.08, 0, 0.8);
    },

    // 连击 — 音高递增的打击音
    combo(count) {
      if (!sfxOn) return;
      const pitch = 400 + Math.min(count, 10) * 80;
      playTone(pitch, 0.08, 'square', 0.12);
      playTone(pitch * 1.25, 0.08, 'square', 0.1, 0, 0.04);
      if (count >= 4) {
        playTone(pitch * 1.5, 0.1, 'sine', 0.1, 0, 0.08);
        playNoise(0.05, 0.06, 'highpass', 4000, 0.06);
      }
    },

    // 奇观开始建造 — 史诗开端
    wonderStart() {
      if (!sfxOn) return;
      playTone(130, 0.5, 'sine', 0.2);
      playTone(196, 0.4, 'sawtooth', 0.08, 0, 0.2);
      playTone(262, 0.5, 'triangle', 0.1, 0, 0.4);
      playTone(392, 0.5, 'sine', 0.12, 0, 0.6);
      playNoise(0.3, 0.06, 'bandpass', 800, 0.1);
    },

    // 奇观完成 — 终极胜利乐章
    wonderDone() {
      if (!sfxOn) return;
      // 底鼓
      playTone(50, 0.5, 'sine', 0.35);
      playNoise(0.15, 0.15, 'lowpass', 400);
      // 胜利旋律 C E G C' E' G' C''
      const victory = [262, 330, 392, 523, 659, 784, 1047];
      victory.forEach((f, i) => {
        playTone(f, 0.35, 'sine', 0.12, 0, 0.2 + i * 0.1);
        playTone(f, 0.35, 'triangle', 0.06, 3, 0.2 + i * 0.1);
      });
      // 最终大和弦
      [523, 659, 784, 1047].forEach(f => {
        playTone(f, 1.2, 'sine', 0.1, 0, 1.0);
      });
    },

    // 里程碑/事件弹窗 — 通知铃
    milestone() {
      if (!sfxOn) return;
      playTone(880, 0.1, 'sine', 0.1);
      playTone(1320, 0.15, 'sine', 0.08, 0, 0.06);
    },

    // 好事件 — 惊喜音
    eventGood() {
      if (!sfxOn) return;
      playTone(660, 0.1, 'sine', 0.1);
      playTone(880, 0.12, 'sine', 0.1, 0, 0.06);
      playTone(1100, 0.15, 'sine', 0.08, 0, 0.12);
    },

    // 坏事件 — 警报音
    eventBad() {
      if (!sfxOn) return;
      playTone(300, 0.15, 'sawtooth', 0.12);
      playTone(250, 0.15, 'sawtooth', 0.1, 0, 0.1);
      playTone(200, 0.2, 'sawtooth', 0.08, 0, 0.2);
    },

    // 在线奖励 — 小收获音
    reward() {
      if (!sfxOn) return;
      playTone(700, 0.08, 'sine', 0.08);
      playTone(900, 0.1, 'sine', 0.06, 0, 0.05);
    },

    // 在线大奖 — 丰厚奖励
    bigReward() {
      if (!sfxOn) return;
      [523, 659, 784].forEach((f, i) => {
        playTone(f, 0.15, 'sine', 0.12, 0, i * 0.06);
      });
      playTone(1047, 0.3, 'sine', 0.1, 0, 0.2);
    },

    // UI 点击 — 清脆轻点
    click() {
      if (!sfxOn) return;
      playTone(1000, 0.04, 'sine', 0.06);
    },

    // 暂停
    pause() {
      if (!sfxOn) return;
      playTone(500, 0.1, 'sine', 0.08);
      playTone(350, 0.15, 'sine', 0.06, 0, 0.06);
    },

    // 继续
    unpause() {
      if (!sfxOn) return;
      playTone(350, 0.1, 'sine', 0.06);
      playTone(500, 0.12, 'sine', 0.08, 0, 0.06);
    },

    // 核心菌落升级
    coreUpgrade() {
      if (!sfxOn) return;
      playTone(262, 0.2, 'sine', 0.15);
      playTone(330, 0.2, 'sine', 0.12, 0, 0.12);
      playTone(392, 0.2, 'sine', 0.12, 0, 0.24);
      playTone(523, 0.4, 'sine', 0.15, 0, 0.36);
      playTone(523, 0.4, 'triangle', 0.08, 5, 0.36);
    },

    // 游戏启动
    boot() {
      if (!sfxOn) return;
      playTone(200, 0.15, 'sine', 0.08);
      playTone(300, 0.12, 'sine', 0.08, 0, 0.1);
      playTone(450, 0.15, 'sine', 0.1, 0, 0.2);
      playTone(600, 0.2, 'sine', 0.08, 0, 0.3);
      playNoise(0.1, 0.03, 'highpass', 6000, 0.2);
    },
  };

  // ===== 背景音乐 — 琶音式环境音乐 =====
  // 不再用持续振荡器，改为定时弹奏短音符，形成有节奏的旋律循环
  let bgmTimer = null;

  function startBGM(phase) {
    if (!bgmOn) return;
    stopBGM();
    const c = getCtx();
    bgmPhase = phase || 1;
    bgmNodes = { oscs: [], gains: [], master: null };

    const master = c.createGain();
    master.gain.value = bgmVol * 0.6;
    master.connect(c.destination);
    bgmNodes.master = master;

    // 每个阶段的和弦进行（4个和弦循环）+ 节奏配置
    const themes = {
      1: { // 安静原始 — C大调，慢琶音，纯净的sine
        chords: [
          [131, 165, 196, 262],   // Cmaj (C3 E3 G3 C4)
          [110, 165, 196, 220],   // Am   (A2 E3 G3 A3)
          [147, 175, 220, 294],   // Dm   (D3 F3 A3 D4)
          [131, 165, 196, 247],   // C/B  (C3 E3 G3 B3)
        ],
        type: 'sine', bpm: 70, noteLen: 0.8, vol: 0.09, pattern: 'arp-up',
      },
      2: { // 温暖成长 — D大调，稍快，triangle
        chords: [
          [147, 185, 220, 294],   // Dmaj
          [165, 208, 247, 330],   // Em
          [131, 165, 196, 262],   // Cmaj
          [196, 247, 294, 392],   // Gmaj
        ],
        type: 'triangle', bpm: 80, noteLen: 0.6, vol: 0.08, pattern: 'arp-alt',
      },
      3: { // 科技节奏 — 小调色彩，更快，带octave跳跃
        chords: [
          [165, 196, 247, 330],   // Em
          [131, 165, 196, 262],   // Cmaj
          [147, 175, 220, 294],   // Dm
          [110, 165, 220, 330],   // Am7
        ],
        type: 'triangle', bpm: 95, noteLen: 0.4, vol: 0.07, pattern: 'arp-bounce',
      },
      4: { // 自动化 — 深沉有力，五度为主
        chords: [
          [110, 165, 220, 330],   // Am
          [131, 196, 262, 392],   // C5
          [98, 147, 196, 294],    // G(low)
          [117, 175, 233, 349],   // Bb
        ],
        type: 'sine', bpm: 85, noteLen: 0.5, vol: 0.08, pattern: 'arp-down',
      },
      5: { // 宏伟终章 — 明亮大调，宽广
        chords: [
          [196, 247, 294, 392],   // Gmaj
          [220, 277, 330, 440],   // Amaj
          [175, 220, 262, 349],   // Fmaj
          [196, 247, 330, 392],   // G6
        ],
        type: 'sine', bpm: 75, noteLen: 0.9, vol: 0.09, pattern: 'arp-spread',
      },
    };

    const t = themes[bgmPhase] || themes[1];
    const beatMs = 60000 / t.bpm;  // 每拍毫秒数
    let chordIdx = 0;
    let noteIdx = 0;

    // 琶音模式 — 决定音符播放顺序
    function getPattern(chord, idx, pattern) {
      const len = chord.length;
      switch (pattern) {
        case 'arp-up':     return chord[idx % len];
        case 'arp-down':   return chord[(len - 1 - idx % len)];
        case 'arp-alt':    // 上下交替 0,1,2,3,2,1
          { const seq = [...chord, ...chord.slice(1, -1).reverse()];
            return seq[idx % seq.length]; }
        case 'arp-bounce': // 跳跃 0,2,1,3
          { const order = [0, 2, 1, 3];
            return chord[order[idx % order.length]]; }
        case 'arp-spread': // 展开 低-高-中低-中高
          { const order = [0, 3, 1, 2];
            return chord[order[idx % order.length]]; }
        default: return chord[idx % len];
      }
    }

    // 弹奏单个音符（带柔和的 attack/decay 包络）
    function playBGMNote(freq, dur, type, vol) {
      const c2 = getCtx();
      const osc = c2.createOscillator();
      const gain = c2.createGain();
      const now = c2.currentTime;

      osc.type = type;
      osc.frequency.value = freq;
      // 轻微 detune 增加温暖感
      osc.detune.value = (Math.random() - 0.5) * 6;

      // 柔和的 ADSR 包络
      const attack = 0.08;
      const decay = dur * 0.3;
      const sustain = vol * 0.5;
      const release = dur * 0.4;

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol, now + attack);
      gain.gain.linearRampToValueAtTime(sustain, now + attack + decay);
      gain.gain.linearRampToValueAtTime(sustain, now + dur - release);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(gain).connect(master);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    }

    // 主循环 — 每拍弹一个音符
    function tick() {
      if (!bgmNodes) return; // 已停止
      const chord = t.chords[chordIdx];
      const freq = getPattern(chord, noteIdx, t.pattern);

      // 主音符
      playBGMNote(freq, t.noteLen, t.type, t.vol);
      // 轻柔的八度泛音（仅部分拍子，增加空间感）
      if (noteIdx % 3 === 0) {
        playBGMNote(freq * 2, t.noteLen * 0.6, 'sine', t.vol * 0.2);
      }
      // 低音底衬（每个和弦第一个音符时弹）
      if (noteIdx === 0) {
        playBGMNote(chord[0] * 0.5, t.noteLen * 2, 'sine', t.vol * 0.5);
      }

      noteIdx++;
      // 每4个音符切换和弦
      if (noteIdx >= 4) {
        noteIdx = 0;
        chordIdx = (chordIdx + 1) % t.chords.length;
      }
    }

    // 立即弹第一个音，然后定时循环
    tick();
    bgmTimer = setInterval(tick, beatMs);
  }

  function stopBGM() {
    if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
    if (!bgmNodes) return;
    if (bgmNodes.oscs) bgmNodes.oscs.forEach(o => { try { o.stop(); } catch(e){} });
    bgmNodes = null;
  }

  function updateBGMPhase(phase) {
    if (bgmPhase === phase) return;
    bgmPhase = phase;
    if (bgmOn && bgmNodes) startBGM(phase);
  }

  function setBgmVol(v) {
    bgmVol = v;
    if (bgmNodes && bgmNodes.master) bgmNodes.master.gain.value = v * 0.6;
  }

  function setSfxVol(v) { sfxVol = v; }

  // 首次用户交互后初始化
  function initOnInteraction() {
    if (initialized) return;
    initialized = true;
    // 加载保存的音频设置
    try {
      const saved = JSON.parse(localStorage.getItem('bioSphereAudio') || '{}');
      if (saved.sfxOn !== undefined) sfxOn = saved.sfxOn;
      if (saved.bgmOn !== undefined) bgmOn = saved.bgmOn;
      if (saved.sfxVol !== undefined) sfxVol = saved.sfxVol;
      if (saved.bgmVol !== undefined) bgmVol = saved.bgmVol;
    } catch(e) {}
    // 更新按钮状态
    document.getElementById('sfxBtn')?.classList.toggle('muted', !sfxOn);
    document.getElementById('bgmBtn')?.classList.toggle('muted', !bgmOn);
    if (!sfxOn) { const b = document.getElementById('sfxBtn'); if (b) b.textContent = '🔇'; }
    getCtx();
    if (bgmOn) startBGM(bgmPhase);
    if (sfxOn) sfx.boot();
  }

  function saveSettings() {
    try {
      localStorage.setItem('bioSphereAudio', JSON.stringify({ sfxOn, bgmOn, sfxVol, bgmVol }));
    } catch(e) {}
  }

  function toggleSfx() {
    sfxOn = !sfxOn;
    saveSettings();
    return sfxOn;
  }

  function toggleBgm() {
    bgmOn = !bgmOn;
    if (bgmOn) startBGM(bgmPhase);
    else stopBGM();
    saveSettings();
    return bgmOn;
  }

  return {
    ...sfx,
    startBGM, stopBGM, updateBGMPhase,
    setSfxVol, setBgmVol, toggleSfx, toggleBgm,
    initOnInteraction,
    isSfxOn: () => sfxOn,
    isBgmOn: () => bgmOn,
    getSfxVol: () => sfxVol,
    getBgmVol: () => bgmVol,
  };
})();

// ===== RESOURCE CONVERSION CHART =====
// ★ 建造费用递增：每多造一个同类建筑，造价×1.4
// ★ 阶段推进需要：建筑+科技+进化等级（Phase N 需要进化 Lv.N）
// ★ 帝国核心为碳源采集器供能，不同阶段供给不同数量（P1:2台, P2:4台, ... P5:10台）
//
// Phase 1:  碳源采集器:  🏠核心供能 → 1.5葡萄糖/s  （受核心供给上限限制）
//           ATP合成酶:   1葡萄糖/s → 2.5能量/s     （能量供给简易提取器）
//           简易提取器:  2葡萄糖 + 1.5能量/s → 0.4DNA/s
// Phase 2 (需进化Lv.2):  固氮装置:   0.3能量/s → 1氮源/s
//           蛋白质工厂: 0.8氮源 + 0.5能量/s → 0.6蛋白质/s
//           DNA提取器:  0.5蛋白质 + 1能量/s → 0.8DNA/s
// Phase 3 (需进化Lv.3):  生物膜反应器: 1葡萄糖 + 0.3氮源 + 1能量/s → 0.8生物质 + 0.2蛋白质/s
//           菌丝运输网:  全局效率+10%
// Phase 4 (需进化Lv.4):  群体感应塔:  2能量/s → 0.8QS信号/s
// Phase 5 (需进化Lv.5):  微型戴森球:  0消耗 → 12能量 + 8葡萄糖 + 2生物质/s

// ===== COST SCALING =====
const COST_SCALE = 1.4; // 每多造一个同类建筑，造价×1.4

const PHASES = [
  { id:1, name:'采集', color:'var(--green)', desc:'建造采集器收集基础资源', icon:'🌱' },
  { id:2, name:'代谢', color:'var(--orange)', desc:'转化资源产生高级材料', icon:'⚗️' },
  { id:3, name:'物流', color:'var(--blue)', desc:'建立运输网络提升效率', icon:'🔗' },
  { id:4, name:'自动化', color:'var(--yellow)', desc:'QS信号自动化控制', icon:'🤖' },
  { id:5, name:'奇观', color:'var(--purple)', desc:'建造终极生物奇观！', icon:'🏛️' },
];

// ===== CORE COLONY — 主建筑，随阶段进化外观升级 =====
// ★ 帝国核心为碳源采集器提供能量供给，不同阶段供给不同数量
const CORE_COLONY = {
  1: { emoji:'🔮', name:'原始液泡',   desc:'最初的生命痕迹...一团脆弱的原始液泡', color:'#4a6a5a', bg:'bg-core-1', glow:'rgba(74,106,90,0.15)', maxCollectors:2 },
  2: { emoji:'🦠', name:'原核聚落',   desc:'细胞开始分化，原核生物聚集成群',       color:'#22c55e', bg:'bg-core-2', glow:'rgba(34,197,94,0.2)',  maxCollectors:4 },
  3: { emoji:'🔬', name:'生物膜枢纽', desc:'致密的生物膜包裹着繁忙的代谢中心',     color:'#3b82f6', bg:'bg-core-3', glow:'rgba(59,130,246,0.25)',maxCollectors:6 },
  4: { emoji:'🏗️', name:'菌落中枢',   desc:'高度组织化的微生物城市核心',           color:'#eab308', bg:'bg-core-4', glow:'rgba(234,179,8,0.25)', maxCollectors:8 },
  5: { emoji:'✨', name:'生命圣殿',   desc:'微生物帝国的终极神殿，散发着耀眼光芒', color:'#a855f7', bg:'bg-core-5', glow:'rgba(168,85,247,0.3)', maxCollectors:10 },
};
// CORE_IDX removed — 核心菌落现在在格子上方独立展示

// ===== RESOURCES =====
const RES = {
  glucose:  { n:'葡萄糖', c:'#22c55e', icon:'🟢', phase:1 },
  energy:   { n:'ATP能量', c:'#f97316', icon:'⚡', phase:1 },
  dna:      { n:'DNA',    c:'#a855f7', icon:'🧬', phase:1 },  // Phase 1 就可见！
  nitrogen: { n:'氮源',   c:'#3b82f6', icon:'🔵', phase:2 },
  protein:  { n:'蛋白质', c:'#ec4899', icon:'🧪', phase:2 },
  biomass:  { n:'生物质', c:'#10b981', icon:'🧱', phase:3 },
  qs:       { n:'QS信号', c:'#eab308', icon:'📡', phase:4 },
};

// ===== BUILDINGS =====
// 每个建筑的描述里直接写转化比例，一目了然
// ★ 碳源采集器由帝国核心供能，不消耗ATP合成酶产的能量
const BLDS = {
  // Phase 1 — 采集
  glucoseCollector: {
    n:'碳源采集器', phase:1,
    d:'核心供能·采集葡萄糖',
    ratio:'🏠核心供能 → 1.5🟢/s',
    cost:{ energy:10 }, prod:{ glucose:1.5 }, cons:{},
    color:'#22c55e', bg:'bg-green', emoji:'🌱', tier:1,
    corePowered: true,  // 由帝国核心供能，受核心供给上限限制
  },
  energyStation: {
    n:'ATP合成酶', phase:1,
    d:'葡萄糖→能量',
    ratio:'1🟢 → 2.5⚡/s',
    cost:{ glucose:18 }, prod:{ energy:2.5 }, cons:{ glucose:1 },
    color:'#f97316', bg:'bg-orange', emoji:'🔋', tier:1,
  },
  simpleExtractor: {
    n:'简易提取器', phase:1,
    d:'葡萄糖+能量→DNA',
    ratio:'2🟢 + 1.5⚡ → 0.4🧬/s',
    cost:{ glucose:25, energy:20 }, prod:{ dna:0.4 }, cons:{ glucose:2, energy:1.5 },
    color:'#a855f7', bg:'bg-purple', emoji:'🔬', tier:1,
  },

  // Phase 2 — 代谢
  nitrogenFixer: {
    n:'固氮装置', phase:2,
    d:'消耗少量能量固氮',
    ratio:'0.3⚡ → 1🔵/s',
    cost:{ energy:30 }, prod:{ nitrogen:1 }, cons:{ energy:0.3 },
    color:'#3b82f6', bg:'bg-blue', emoji:'💨', tier:2,
  },
  proteinFactory: {
    n:'蛋白质工厂', phase:2,
    d:'氮源+能量→蛋白质',
    ratio:'0.8🔵 + 0.5⚡ → 0.6🧪/s',
    cost:{ energy:35, nitrogen:12 }, prod:{ protein:0.6 }, cons:{ nitrogen:0.8, energy:0.5 },
    color:'#ec4899', bg:'bg-pink', emoji:'⚗️', tier:2,
  },
  geneExtractor: {
    n:'DNA提取器', phase:2,
    d:'蛋白质+能量→DNA（高效）',
    ratio:'0.5🧪 + 1⚡ → 0.8🧬/s',
    cost:{ protein:20, energy:30 }, prod:{ dna:0.8 }, cons:{ protein:0.5, energy:1 },
    color:'#a855f7', bg:'bg-purple', emoji:'🏭', tier:2, techReq:'basicMetab',
  },

  // Phase 3 — 物流
  biofilmReactor: {
    n:'生物膜反应器', phase:3,
    d:'多资源→生物质',
    ratio:'1🟢 + 0.3🔵 + 1⚡ → 0.8🧱 + 0.2🧪/s',
    cost:{ protein:25, energy:40 }, prod:{ biomass:0.8, protein:0.2 }, cons:{ glucose:1, nitrogen:0.3, energy:1 },
    color:'#14b8a6', bg:'bg-teal', emoji:'🧫', tier:3, techReq:'biofilmTech',
  },
  transport: {
    n:'菌丝运输网', phase:3,
    d:'全局加速',
    ratio:'全局产出 +10%',
    cost:{ biomass:12, energy:25 }, prod:{}, cons:{},
    color:'#4a6080', bg:'bg-gray', emoji:'🕸️', tier:3, isBoost:true, boostVal:0.10,
  },

  // Phase 4 — 自动化
  qsController: {
    n:'群体感应塔', phase:4,
    d:'能量→QS信号',
    ratio:'2⚡ → 0.8📡/s',
    cost:{ protein:40, dna:20, energy:40 }, prod:{ qs:0.8 }, cons:{ energy:2 },
    color:'#eab308', bg:'bg-yellow', emoji:'🗼', tier:4, techReq:'quorumSensing',
  },

  // Phase 5 — 奇观
  microDyson: {
    n:'微型戴森球', phase:5,
    d:'终极奇观！恒星能量',
    ratio:'0 → 12⚡ + 8🟢 + 2🧱/s',
    cost:{ biomass:100, protein:60, dna:50, qs:20 },
    prod:{ energy:12, glucose:8, biomass:2 }, cons:{},
    color:'#a855f7', bg:'bg-wonder', emoji:'☀️', tier:5, isWonder:true, wonderTime:300,
  },
};

// ===== TECHS =====
const TECHS = {
  pureCulture: {
    n:'纯培养技术', phase:1, cost:{ dna:3 }, time:15,
    d:'单菌株纯化', ef:'全局效率+10%',
    fn: s => { s.gEff += 0.1 },
  },
  // Phase 1 分支：二选一路线
  efficientHarvest: {
    n:'高效采集', phase:1, cost:{ dna:8 }, time:20,
    d:'优化碳源吸收通路', ef:'碳源采集器产出+30%',
    req:['pureCulture'],
    fn: s => { s._collectorBonus = (s._collectorBonus || 0) + 0.3 },
  },
  rapidMetabolism: {
    n:'快速代谢', phase:1, cost:{ dna:8, energy:15 }, time:20,
    d:'加速ATP合成反应', ef:'ATP合成酶产出+25%，消耗+15%',
    req:['pureCulture'],
    fn: s => { s._energyBonus = (s._energyBonus || 0) + 0.25; s._energyCostPenalty = (s._energyCostPenalty || 0) + 0.15 },
  },
  basicMetab: {
    n:'基础代谢学', phase:2, cost:{ dna:12 }, time:25,
    d:'碳氮代谢通路', ef:'解锁DNA提取器（高效版）',
    req:['pureCulture'],
  },
  // Phase 2 分支
  nitrogenCycle: {
    n:'氮循环工程', phase:2, cost:{ dna:15, nitrogen:8 }, time:30,
    d:'闭合氮循环回路', ef:'固氮装置效率+40%',
    req:['basicMetab'],
    fn: s => { s._nitrogenBonus = (s._nitrogenBonus || 0) + 0.4 },
  },
  proteinEngineering: {
    n:'蛋白质工程', phase:2, cost:{ dna:15, protein:5 }, time:30,
    d:'定向蛋白质折叠', ef:'蛋白质工厂产出+35%',
    req:['basicMetab'],
    fn: s => { s._proteinBonus = (s._proteinBonus || 0) + 0.35 },
  },
  biofilmTech: {
    n:'生物膜技术', phase:3, cost:{ dna:20, protein:10 }, time:35,
    d:'高效生物膜', ef:'解锁生物膜反应器',
    req:['basicMetab'],
  },
  // Phase 3 分支
  adaptiveLogistics: {
    n:'自适应物流', phase:3, cost:{ dna:22, biomass:8 }, time:30,
    d:'智能物流路径规划', ef:'菌丝运输网加成从10%提升到15%',
    req:['biofilmTech'],
    fn: s => { s._transportBonus = (s._transportBonus || 0) + 0.05 },
  },
  symbioticNetwork: {
    n:'共生网络', phase:3, cost:{ protein:18, biomass:10 }, time:35,
    d:'建立跨种群共生体系', ef:'人口上限+200，人口加成效率翻倍',
    req:['biofilmTech'],
    fn: s => { s._popCapBonus = (s._popCapBonus || 0) + 200; s._popEffMult = (s._popEffMult || 1) * 2 },
  },
  quorumSensing: {
    n:'群体感应', phase:4, cost:{ dna:28, protein:15 }, time:40,
    d:'QS自动化控制', ef:'解锁群体感应塔',
    req:['biofilmTech'],
  },
  // Phase 4 分支
  signalAmplifier: {
    n:'信号增幅器', phase:4, cost:{ dna:30, protein:20, qs:5 }, time:35,
    d:'QS信号衰减减缓', ef:'QS衰减速度-60%，加成上限提升到80%',
    req:['quorumSensing'],
    fn: s => { s._qsDecayMult = (s._qsDecayMult || 1) * 0.4; s._qsCapBonus = (s._qsCapBonus || 0) + 0.2 },
  },
  evolutionCatalyst: {
    n:'进化催化剂', phase:4, cost:{ dna:35, protein:25 }, time:40,
    d:'加速生物进化过程', ef:'进化效率奖励翻倍',
    req:['quorumSensing'],
    fn: s => { s._evoBoostMult = (s._evoBoostMult || 1) * 2 },
  },
  dysonTheory: {
    n:'微型戴森理论', phase:5, cost:{ dna:40, protein:20, biomass:15 }, time:60,
    d:'恒星轨道生物膜', ef:'解锁微型戴森球',
    req:['quorumSensing'],
  },
};

// ===== SVGs =====
const SVG = {
  glucoseCollector:`<svg viewBox="0 0 64 64" fill="none"><rect x="12" y="18" width="40" height="32" rx="3" fill="#0a1a10" stroke="#22c55e" stroke-width="1.5"/><path d="M22 18V12h20v6" fill="none" stroke="#22c55e" stroke-width="1.2"/><circle cx="26" cy="34" r="6" fill="none" stroke="#22c55e" stroke-width="1"/><circle cx="26" cy="34" r="2" fill="#22c55e" opacity="0.5"/><rect x="36" y="27" width="10" height="8" rx="1" fill="#22c55e" opacity="0.1" stroke="#22c55e" stroke-width="0.8"/><circle cx="17" cy="22" r="2" fill="#22c55e" opacity="0.8"><animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite"/></circle></svg>`,
  energyStation:`<svg viewBox="0 0 64 64" fill="none"><rect x="10" y="14" width="44" height="38" rx="3" fill="#1a1005" stroke="#f97316" stroke-width="1.5"/><circle cx="32" cy="33" r="12" fill="#f97316" opacity="0.05" stroke="#f97316" stroke-width="1"/><path d="M30 24l4 0-2 7 4 0-7 13 2-8-4 0z" fill="#f97316" opacity="0.7"/><rect x="16" y="46" width="32" height="3" rx="1" fill="#f97316" opacity="0.15"/><rect x="16" y="46" width="20" height="3" rx="1" fill="#f97316" opacity="0.4"><animate attributeName="width" values="10;32;10" dur="3s" repeatCount="indefinite"/></rect></svg>`,
  simpleExtractor:`<svg viewBox="0 0 64 64" fill="none"><rect x="10" y="14" width="44" height="38" rx="3" fill="#10051a" stroke="#a855f7" stroke-width="1.5"/><circle cx="24" cy="28" r="5" fill="#22c55e" opacity="0.15" stroke="#22c55e" stroke-width="0.8"/><circle cx="24" cy="28" r="2" fill="#22c55e" opacity="0.4"/><path d="M30 28 L34 28" stroke="#a855f7" stroke-width="1.5" opacity="0.6"/><path d="M32 26 L34 28 L32 30" fill="none" stroke="#a855f7" stroke-width="1" opacity="0.6"/><circle cx="40" cy="28" r="5" fill="#a855f7" opacity="0.15" stroke="#a855f7" stroke-width="0.8"/><path d="M38 25c0 0 2 3 0 6" fill="none" stroke="#a855f7" stroke-width="1" opacity="0.6"/><path d="M42 25c0 0-2 3 0 6" fill="none" stroke="#a855f7" stroke-width="1" opacity="0.6"/><circle cx="24" cy="38" r="3" fill="#f97316" opacity="0.15" stroke="#f97316" stroke-width="0.6"/><path d="M26 36l1 0-0.5 2 1 0-2 3.5 0.5-2-1 0z" fill="#f97316" opacity="0.5"/></svg>`,
  nitrogenFixer:`<svg viewBox="0 0 64 64" fill="none"><rect x="12" y="14" width="40" height="38" rx="3" fill="#0a1020" stroke="#3b82f6" stroke-width="1.5"/><circle cx="32" cy="30" r="10" fill="#3b82f6" opacity="0.06" stroke="#3b82f6" stroke-width="1"/><text x="32" y="34" text-anchor="middle" fill="#3b82f6" font-size="12" font-weight="bold" opacity="0.6">N₂</text><circle cx="32" cy="30" r="3" fill="#3b82f6" opacity="0.3"><animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite"/></circle></svg>`,
  proteinFactory:`<svg viewBox="0 0 64 64" fill="none"><rect x="10" y="12" width="44" height="40" rx="3" fill="#1a0a18" stroke="#ec4899" stroke-width="1.5"/><path d="M20 25c0 0 4-6 8 0s8 0 8 0s4 6 0 10-8 0-8 0-4-6 0-10z" fill="none" stroke="#ec4899" stroke-width="1.2" opacity="0.6"/><circle cx="32" cy="30" r="3" fill="#ec4899" opacity="0.3"><animate attributeName="r" values="2;4;2" dur="2.5s" repeatCount="indefinite"/></circle></svg>`,
  geneExtractor:`<svg viewBox="0 0 64 64" fill="none"><rect x="10" y="14" width="44" height="38" rx="3" fill="#10051a" stroke="#a855f7" stroke-width="1.5"/><path d="M22 20c0 0 6 8 0 16" fill="none" stroke="#a855f7" stroke-width="1.2"/><path d="M28 20c0 0-6 8 0 16" fill="none" stroke="#a855f7" stroke-width="1.2"/><circle cx="38" cy="28" r="6" fill="none" stroke="#a855f7" stroke-width="0.8" opacity="0.4"/><circle cx="38" cy="28" r="2" fill="#a855f7" opacity="0.5"><animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite"/></circle></svg>`,
  biofilmReactor:`<svg viewBox="0 0 64 64" fill="none"><rect x="10" y="12" width="44" height="40" rx="4" fill="#051510" stroke="#14b8a6" stroke-width="1.5"/><path d="M16 28c6-3 12 2 18-1s12 3 18 0" fill="none" stroke="#14b8a6" stroke-width="1.5" opacity="0.5"/><path d="M16 35c6 2 12-3 18 1s12-2 18 1" fill="none" stroke="#14b8a6" stroke-width="1" opacity="0.3"/><circle cx="22" cy="24" r="2" fill="#14b8a6" opacity="0.3"/><circle cx="42" cy="26" r="1.8" fill="#14b8a6" opacity="0.2"/></svg>`,
  transport:`<svg viewBox="0 0 64 64" fill="none"><rect x="8" y="8" width="48" height="48" rx="3" fill="#0a0e18" stroke="#4a6080" stroke-width="1"/><rect x="4" y="26" width="56" height="12" rx="2" fill="#4a6080" opacity="0.08" stroke="#4a6080" stroke-width="0.8"/><rect x="6" y="28" width="8" height="8" rx="1" fill="#06d6a0" opacity="0.2"><animate attributeName="x" values="6;48;6" dur="2s" repeatCount="indefinite"/></rect><circle cx="32" cy="32" r="6" fill="#0a0e18" stroke="#4a6080" stroke-width="1"/><circle cx="32" cy="32" r="2.5" fill="#4a6080" opacity="0.3"/></svg>`,
  qsController:`<svg viewBox="0 0 64 64" fill="none"><rect x="10" y="12" width="44" height="40" rx="3" fill="#151505" stroke="#eab308" stroke-width="1.5"/><circle cx="32" cy="28" r="4" fill="#eab308" opacity="0.4"><animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite"/></circle><circle cx="32" cy="28" r="10" fill="none" stroke="#eab308" stroke-width="0.8" opacity="0.15"><animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite"/></circle><text x="32" y="44" text-anchor="middle" fill="#eab308" font-size="7" opacity="0.5">QS</text></svg>`,
  microDyson:`<svg viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="20" fill="none" stroke="#a855f7" stroke-width="1" opacity="0.3"/><circle cx="32" cy="32" r="7" fill="#fbbf24" opacity="0.15"/><circle cx="32" cy="32" r="3.5" fill="#fbbf24" opacity="0.4"><animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite"/></circle><ellipse cx="32" cy="32" rx="20" ry="7" fill="none" stroke="#a855f7" stroke-width="1.2" opacity="0.5" transform="rotate(25,32,32)"/><ellipse cx="32" cy="32" rx="20" ry="7" fill="none" stroke="#84cc16" stroke-width="0.8" opacity="0.3" transform="rotate(-25,32,32)"/></svg>`,
};

// ===== ACHIEVEMENTS =====
const ACHIEVE = [
  // 建筑里程碑
  { id:'firstBuild', n:'🏗️ 创世之砖', d:'放下第一个建筑', check: s => s.totalBuildings() >= 1, reward:{ glucose:20, energy:15 } },
  { id:'build5', n:'🏘️ 小有规模', d:'拥有5个建筑', check: s => s.totalBuildings() >= 5, reward:{ glucose:50, energy:30 } },
  { id:'build12', n:'🏙️ 微型都市', d:'拥有12个建筑', check: s => s.totalBuildings() >= 12, reward:{ energy:80, dna:15 } },
  { id:'build20', n:'🌆 生物大都会', d:'拥有20个建筑', check: s => s.totalBuildings() >= 20, reward:{ energy:150, dna:30, protein:20 } },
  // 资源里程碑
  { id:'glucose100', n:'🍬 糖分过剩', d:'葡萄糖累计超过200', check: s => s.res.glucose >= 200, reward:{ energy:30 } },
  { id:'energy200', n:'⚡ 能量风暴', d:'ATP能量超过300', check: s => s.res.energy >= 300, reward:{ glucose:40 } },
  { id:'dna50', n:'🧬 基因宝库', d:'DNA累计超过80', check: s => s.res.dna >= 80, reward:{ energy:50, glucose:50 } },
  { id:'protein30', n:'🧪 蛋白质大师', d:'蛋白质超过50', check: s => s.res.protein >= 50, reward:{ dna:20, energy:30 } },
  // 进化里程碑
  { id:'evo2', n:'🧬 初次进化', d:'完成第一次进化', check: s => s.eL >= 2, reward:{ glucose:60, energy:40, dna:10 } },
  { id:'evo3', n:'🧬 进化加速', d:'达到进化Lv.3', check: s => s.eL >= 3, reward:{ energy:80, dna:20, protein:15 } },
  { id:'evo5', n:'🧬 超级物种', d:'达到进化Lv.5', check: s => s.eL >= 5, reward:{ energy:200, dna:50, protein:30 } },
  // 科技里程碑
  { id:'firstTech', n:'📖 开拓者', d:'完成第一项研究', check: s => Object.values(s.techs).some(t=>t.done), reward:{ glucose:30, energy:20 } },
  { id:'allTech', n:'🎓 学术大师', d:'完成全部研究', check: s => Object.values(s.techs).every(t=>t.done), reward:{ energy:200, dna:60 } },
  // 阶段里程碑
  { id:'phase2', n:'⚗️ 代谢启动', d:'进入阶段2', check: s => s.phase >= 2, reward:{ energy:40, nitrogen:15 } },
  { id:'phase3', n:'🔗 物流时代', d:'进入阶段3', check: s => s.phase >= 3, reward:{ energy:60, protein:20 } },
  { id:'phase4', n:'📡 自动化纪元', d:'进入阶段4', check: s => s.phase >= 4, reward:{ energy:100, biomass:15 } },
  { id:'phase5', n:'🏛️ 奇观时代', d:'进入阶段5', check: s => s.phase >= 5, reward:{ energy:150, dna:40 } },
  // 效率里程碑
  { id:'eff150', n:'📈 效率突破', d:'全局效率达到150%', check: s => s.gEff >= 1.5, reward:{ dna:15, energy:40 } },
  { id:'eff200', n:'🚀 效率翻倍', d:'全局效率达到200%', check: s => s.gEff >= 2.0, reward:{ dna:30, energy:80 } },
  // 人口里程碑
  { id:'pop100', n:'🦠 百菌汇聚', d:'种群达到100', check: s => s.pop >= 100, reward:{ glucose:40, energy:30 } },
  { id:'pop500', n:'🦠 千菌浩荡', d:'种群达到500', check: s => s.pop >= 500, reward:{ energy:60, dna:20 } },
];

// ===== RANDOM EVENTS =====
const EVENTS = [
  { n:'营养爆发', d:'发现丰富碳源！葡萄糖+20', ty:'s', phase:1, fn:s=>{s.res.glucose+=20} },
  { n:'能量涌动', d:'ATP合成效率暴增！能量+15', ty:'s', phase:1, fn:s=>{s.res.energy+=15} },
  { n:'氮源富矿', d:'发现地下氮矿脉！氮源+12', ty:'s', phase:2, fn:s=>{s.res.nitrogen+=12} },
  { n:'古老DNA', d:'发掘远古细菌DNA！DNA+8', ty:'s', phase:1, fn:s=>{s.res.dna+=8} },
  { n:'噬菌体入侵！', d:'病毒感染！资源-10%', ty:'e', phase:1, fn:s=>{for(let k in s.res)s.res[k]*=0.9} },
  { n:'共生互利', d:'共生伙伴加入！效率+5%', ty:'ev', phase:2, fn:s=>{s.gEff+=0.05} },
  { n:'有益突变', d:'菌株发生有益突变！效率+3%', ty:'ev', phase:1, fn:s=>{s.gEff+=0.03} },
];

// ===== GUIDE MESSAGES =====
const GUIDE = {
  1: [
    { check: s => s.bldCount('glucoseCollector') === 0, text:'建造「碳源采集器」—帝国核心供能，免费采集葡萄糖！(核心上限2台)', icon:'🌱' },
    { check: s => s.bldCount('glucoseCollector') > 0 && s.bldCount('energyStation') === 0, text:'建造「ATP合成酶」把葡萄糖转化为能量 (1🟢→2.5⚡/s)', icon:'🔋' },
    { check: s => s.bldCount('energyStation') > 0 && s.bldCount('simpleExtractor') === 0, text:'建造「简易提取器」用葡萄糖+能量合成DNA！(2🟢+1.5⚡→0.4🧬/s)', icon:'🧬' },
    { check: s => s.bldCount('simpleExtractor') > 0 && s.res.dna < 3, text:'DNA正在合成中...攒到3就能研究科技', icon:'🔬' },
    { check: s => s.res.dna >= 3 && !s.techs.pureCulture.done, text:'DNA够了！点左侧「研究」→「纯培养技术」', icon:'🧫' },
    { check: s => s.techs.pureCulture.done && s.eL < 2 && !s.canEvolve(), text:'纯培养技术✓（效率已+10%）→ 攒够DNA后进化到Lv.2！', icon:'📈' },
    { check: s => s.techs.pureCulture.done && s.eL < 2 && s.canEvolve(), text:'资源就绪！点击底部「进化」按钮升到Lv.2！', icon:'✨' },
  ],
  2: [
    { check: s => s.bldCount('nitrogenFixer') === 0, text:'建造「固氮装置」获取氮源 (0.3⚡→1🔵/s)', icon:'💨' },
    { check: s => s.bldCount('nitrogenFixer') > 0 && s.bldCount('proteinFactory') === 0, text:'建造「蛋白质工厂」(0.8🔵+0.5⚡→0.6🧪/s)', icon:'⚗️' },
    { check: s => s.bldCount('proteinFactory') > 0 && !s.techs.basicMetab.done, text:'研究「基础代谢学」解锁高效DNA提取器', icon:'📖' },
    { check: s => s.techs.basicMetab.done && s.bldCount('geneExtractor') === 0, text:'建造「DNA提取器」高效版 (0.5🧪+1⚡→0.8🧬/s)', icon:'🏭' },
  ],
  3: [
    { check: s => !s.techs.biofilmTech.done, text:'研究「生物膜技术」', icon:'📖' },
    { check: s => s.techs.biofilmTech.done && s.bldCount('biofilmReactor') === 0, text:'建造「生物膜反应器」产出生物质', icon:'🧱' },
    { check: s => s.bldCount('biofilmReactor') > 0 && s.bldCount('transport') === 0, text:'建造「菌丝运输网」全局产出+10%！', icon:'🔗' },
    { check: s => s.bldCount('transport') > 0, text:'多造运输网叠加效率，目标+30%以上！', icon:'📈' },
  ],
  4: [
    { check: s => !s.techs.quorumSensing.done, text:'研究「群体感应」', icon:'📖' },
    { check: s => s.techs.quorumSensing.done && s.bldCount('qsController') === 0, text:'建造「群体感应塔」(2⚡→0.8📡/s)', icon:'🗼' },
    { check: s => s.bldCount('qsController') > 0, text:'QS信号自动加速全产线，多多益善！', icon:'🚀' },
  ],
  5: [
    { check: s => !s.techs.dysonTheory.done, text:'研究「微型戴森理论」', icon:'📖' },
    { check: s => s.techs.dysonTheory.done && s.bldCount('microDyson') === 0, text:'建造终极奇观「微型戴森球」！', icon:'🏛️' },
    { check: s => s.bldCount('microDyson') > 0 && s.wBuild, text:'奇观建造中...静待奇迹诞生！', icon:'✨' },
    { check: s => s.wonderComplete, text:'🎉 你征服了微生物宇宙！游戏完成！', icon:'🌟' },
  ],
};

// ===== PRODUCTION CHAINS =====
const CHAINS = [
  { n:'基础产能', steps:['🏠核心供能','→','1.5🟢葡萄糖/s'], reqs:['glucoseCollector'] },
  { n:'能量转化', steps:['1🟢','→','2.5⚡能量/s'], reqs:['energyStation'] },
  { n:'DNA合成(初级)', steps:['2🟢+1.5⚡','→','0.4🧬DNA/s'], reqs:['simpleExtractor'] },
  { n:'蛋白质合成', steps:['0.8🔵+0.5⚡','→','0.6🧪蛋白质/s'], reqs:['proteinFactory'] },
  { n:'DNA提取(高级)', steps:['0.5🧪+1⚡','→','0.8🧬DNA/s'], reqs:['geneExtractor'] },
  { n:'生物膜培养', steps:['1🟢+0.3🔵+1⚡','→','0.8🧱+0.2🧪/s'], reqs:['biofilmReactor'] },
  { n:'群体感应', steps:['2⚡','→','0.8📡QS/s'], reqs:['qsController'] },
];

// ===== CONVEYOR BELT FLOW MAP =====
// 定义建筑之间的资源供给关系: from → to, 以及传送带上显示的资源图标和颜色
const FLOW_MAP = [
  // Phase 1 基础链
  { from:'glucoseCollector', to:'energyStation',   res:'glucose',  icon:'🟢', color:'#22c55e', label:'葡萄糖' },
  { from:'glucoseCollector', to:'simpleExtractor',  res:'glucose',  icon:'🟢', color:'#22c55e', label:'葡萄糖' },
  { from:'energyStation',    to:'simpleExtractor',  res:'energy',   icon:'⚡', color:'#f97316', label:'ATP' },
  // Phase 2
  { from:'energyStation',    to:'nitrogenFixer',    res:'energy',   icon:'⚡', color:'#f97316', label:'ATP' },
  { from:'nitrogenFixer',    to:'proteinFactory',   res:'nitrogen', icon:'🔵', color:'#3b82f6', label:'氮源' },
  { from:'energyStation',    to:'proteinFactory',   res:'energy',   icon:'⚡', color:'#f97316', label:'ATP' },
  { from:'proteinFactory',   to:'geneExtractor',    res:'protein',  icon:'🧪', color:'#ec4899', label:'蛋白质' },
  { from:'energyStation',    to:'geneExtractor',    res:'energy',   icon:'⚡', color:'#f97316', label:'ATP' },
  // Phase 3
  { from:'glucoseCollector', to:'biofilmReactor',   res:'glucose',  icon:'🟢', color:'#22c55e', label:'葡萄糖' },
  { from:'nitrogenFixer',    to:'biofilmReactor',   res:'nitrogen', icon:'🔵', color:'#3b82f6', label:'氮源' },
  { from:'energyStation',    to:'biofilmReactor',   res:'energy',   icon:'⚡', color:'#f97316', label:'ATP' },
  // Phase 4
  { from:'energyStation',    to:'qsController',     res:'energy',   icon:'⚡', color:'#f97316', label:'ATP' },
];

// ===== CHALLENGE MISSIONS =====
const CHALLENGES = [
  // Phase 1 challenges
  { id:'ch_build3_60s', n:'🏗️ 速建达人', d:'60秒内建造3个建筑', phase:1, time:60, check: (s,snap) => s.stats.totalBuilt - snap.totalBuilt >= 3, reward:{ glucose:80, energy:60 }, icon:'🏗️' },
  { id:'ch_glucose200', n:'🍬 糖分囤积', d:'90秒内葡萄糖达到200', phase:1, time:90, check: (s) => s.res.glucose >= 200, reward:{ energy:80, dna:10 }, icon:'🍬' },
  { id:'ch_energy300', n:'⚡ 能量爆发', d:'120秒内ATP达到300', phase:1, time:120, check: (s) => s.res.energy >= 300, reward:{ glucose:100, dna:15 }, icon:'⚡' },
  // Phase 2 challenges
  { id:'ch_protein50', n:'🧪 蛋白质冲刺', d:'90秒内蛋白质达到50', phase:2, time:90, check: (s) => s.res.protein >= 50, reward:{ energy:120, dna:20 }, icon:'🧪' },
  { id:'ch_build8', n:'🏘️ 扩建狂潮', d:'120秒内拥有8+建筑', phase:2, time:120, check: (s) => s.totalBuildings() >= 8, reward:{ nitrogen:40, energy:80 }, icon:'🏘️' },
  { id:'ch_dna80', n:'🧬 基因丰收', d:'100秒内DNA达到80', phase:2, time:100, check: (s) => s.res.dna >= 80, reward:{ protein:30, energy:60 }, icon:'🧬' },
  // Phase 3 challenges
  { id:'ch_biomass30', n:'🧱 生物质储备', d:'120秒内生物质达到30', phase:3, time:120, check: (s) => s.res.biomass >= 30, reward:{ energy:150, dna:25 }, icon:'🧱' },
  { id:'ch_eff180', n:'📈 效率狂人', d:'效率达到180%', phase:3, time:150, check: (s) => s.gEff >= 1.8, reward:{ biomass:20, protein:30 }, icon:'📈' },
  // Phase 4 challenges
  { id:'ch_qs20', n:'📡 信号风暴', d:'90秒内QS信号达到20', phase:4, time:90, check: (s) => s.res.qs >= 20, reward:{ energy:200, dna:40 }, icon:'📡' },
  { id:'ch_build15', n:'🌆 都市扩张', d:'拥有15+建筑', phase:4, time:180, check: (s) => s.totalBuildings() >= 15, reward:{ biomass:30, protein:40 }, icon:'🌆' },
];

// ===== MORE RANDOM EVENTS (with choice events) =====
const EVENTS_EXTRA = [
  // Simple bonus events
  { n:'地热能涌动', d:'发现地热能源！能量+25', ty:'s', phase:1, fn:s=>{s.res.energy+=25} },
  { n:'蛋白质矿脉', d:'发现蛋白质富集区！蛋白质+8', ty:'s', phase:2, fn:s=>{s.res.protein+=8} },
  { n:'基因风暴', d:'宇宙射线带来有益突变！DNA+10 效率+2%', ty:'ev', phase:1, fn:s=>{s.res.dna+=10;s.gEff+=0.02} },
  { n:'生物质沉积', d:'古老生物质层被发现！生物质+10', ty:'s', phase:3, fn:s=>{s.res.biomass+=10} },
  { n:'紫外线照射！', d:'紫外线伤害！效率暂时-5%', ty:'e', phase:1, fn:s=>{s.gEff=Math.max(0.5,s.gEff-0.05)} },
  { n:'干旱危机！', d:'水源枯竭！葡萄糖-15%', ty:'e', phase:2, fn:s=>{s.res.glucose*=0.85} },
  { n:'抗生素污染！', d:'外来抗生素扩散！种群-10%', ty:'e', phase:2, fn:s=>{s.pop*=0.9} },
  { n:'共振效应', d:'菌落同步共振！全局效率+4%', ty:'ev', phase:3, fn:s=>{s.gEff+=0.04} },
  { n:'外来菌株', d:'友好菌株加入！种群+30', ty:'s', phase:2, fn:s=>{s.pop+=30} },
  { n:'信号增幅', d:'QS信号被自然增幅！QS+4', ty:'s', phase:4, fn:s=>{s.res.qs=(s.res.qs||0)+4} },
];

// Choice events — 需要玩家做AB选择
const CHOICE_EVENTS = [
  {
    n:'🧪 神秘孢子', phase:1,
    d:'发现一个发光的神秘孢子！你要怎么做？',
    a:{ label:'培养它', desc:'获得10🧬DNA + 8⚡能量', fn:s=>{s.res.dna+=10;s.res.energy+=8} },
    b:{ label:'分解它', desc:'获得30🟢葡萄糖', fn:s=>{s.res.glucose+=30} },
  },
  {
    n:'⚗️ 未知化合物', phase:2,
    d:'实验中意外合成了一种未知物质...',
    a:{ label:'注入菌落', desc:'效率永久+5%，但风险失去8🧪', fn:s=>{s.gEff+=0.05;s.res.protein=Math.max(0,s.res.protein-8)} },
    b:{ label:'安全储存', desc:'获得15🧪蛋白质 + 6🧬', fn:s=>{s.res.protein+=15;s.res.dna+=6} },
  },
  {
    n:'🌀 时空裂缝', phase:3,
    d:'培养皿中出现微小的时空裂缝！',
    a:{ label:'跳入探索', desc:'获得20🧱生物质 + 效率+3%', fn:s=>{s.res.biomass+=20;s.gEff+=0.03} },
    b:{ label:'关闭裂缝', desc:'获得40⚡ + 12🧬（更安全）', fn:s=>{s.res.energy+=40;s.res.dna+=12} },
  },
  {
    n:'🦠 变异菌株', phase:2,
    d:'一个菌株发生了剧烈变异！',
    a:{ label:'接纳变异', desc:'种群+50，效率+3%', fn:s=>{s.pop+=50;s.gEff+=0.03} },
    b:{ label:'隔离观察', desc:'获得20🧬DNA（稳妥路线）', fn:s=>{s.res.dna+=20} },
  },
  {
    n:'💎 晶体矿藏', phase:3,
    d:'发现一处富含能量的晶体矿！',
    a:{ label:'全力开采', desc:'获得80⚡ + 12🧱', fn:s=>{s.res.energy+=80;s.res.biomass+=12} },
    b:{ label:'研究晶体', desc:'获得18🧬 + 效率永久+4%', fn:s=>{s.res.dna+=18;s.gEff+=0.04} },
  },
  {
    n:'🔬 远古密码', phase:4,
    d:'解码了一段远古微生物的基因密码！',
    a:{ label:'整合基因', desc:'效率+8%', fn:s=>{s.gEff+=0.08} },
    b:{ label:'提取资源', desc:'获得30🧬 + 15🧪 + 8📡', fn:s=>{s.res.dna+=30;s.res.protein+=15;s.res.qs=(s.res.qs||0)+8} },
  },
];

// ===== PRESTIGE SYSTEM =====
const PRESTIGE = {
  // 转生货币名称
  currencyName: '进化因子',
  currencyIcon: '🌀',
  // 根据成就数量和阶段计算获得的转生货币
  calcGain(state) {
    const achieveCount = Object.keys(state.achievements).length;
    const phaseMult = state.phase;
    const evoMult = state.eL;
    const buildMult = Math.floor(state.stats.totalBuilt / 5);
    return Math.floor((achieveCount * 2 + phaseMult * 3 + evoMult * 2 + buildMult) * (state.wonderComplete ? 3 : 1));
  },
  // 转生加成
  bonuses: [
    { cost:5,  n:'初始资金+', d:'初始葡萄糖+50 能量+40', fn:(s)=>{s.res.glucose+=50;s.res.energy+=40} },
    { cost:10, n:'效率基因Ⅰ', d:'初始效率+10%', fn:(s)=>{s.gEff+=0.1} },
    { cost:15, n:'快速进化', d:'进化速度+50%', fn:(s)=>{s._evoSpeedMult=(s._evoSpeedMult||1)+0.5} },
    { cost:20, n:'效率基因Ⅱ', d:'初始效率+20%', fn:(s)=>{s.gEff+=0.2} },
    { cost:30, n:'高级起步', d:'初始带简易提取器+1', fn:(s)=>{
      for(let i=0;i<s.grid.length;i++){if(!s.grid[i]){s.grid[i]={type:'simpleExtractor'};break;}}
    }},
    { cost:50, n:'资源倍增', d:'所有产出×1.5', fn:(s)=>{s._prodMult=(s._prodMult||1)*1.5} },
    { cost:80, n:'终极基因', d:'初始效率+50% + 进化速度×2', fn:(s)=>{s.gEff+=0.5;s._evoSpeedMult=(s._evoSpeedMult||1)*2} },
  ],
};

// ===== GAME STATE =====
const G = {
  res:{}, rates:{}, grid:[], gridSize:8, gridCols:8, gridRows:8,
  pop:0, gEff:1, lEff:1, qsLv:0,
  eL:1, eP:0,
  phase:1, sel:null, paused:false, spd:1, rt:0,
  techs:{}, rTech:null, rProg:0,
  wBuild:null, wProg:0, wonderComplete:false,
  particles:[], conveyorParticles:[], animTick:0, _hoverIdx:null, _beltEdges:new Set(), _activeBelts:[],
  // 拖拽系统
  _dragIdx: null, _dragGhost: null, _dragOverIdx: null, _isDragging: false, _dragStartPos: null,
  // 框选系统
  _boxSelectMode: false, _boxSelectStart: null, _boxSelectRect: null,
  _selectedCells: new Set(), _selectedBelts: new Set(), // 框选中的格子和传送带
  _isMultiDragging: false, _multiDragGhost: null, _multiDragStart: null, _multiDragOffset: null,
  milestones:{},
  achievements:{}, // 已解锁成就
  combo:0, comboTimer:null, // 连续建造连击
  stats:{ totalBuilt:0, totalRecycled:0, totalEvo:0, totalTech:0, peakGlucose:0, peakEnergy:0, peakDna:0, peakPop:0, onlineTime:0 },
  onlineRewardTimer:0, // 在线奖励计时
  // === NEW SYSTEMS ===
  lastSaveTime: Date.now(),
  lastOnlineTime: Date.now(),
  autoSaveInterval: null,
  // Challenge system
  activeChallenge: null,
  challengeTimer: 0,
  challengeSnap: null,
  completedChallenges: {},
  challengeCooldown: 0,
  // Building upgrades
  buildingLevels: {}, // { gridIdx: level }
  // Conveyor belt upgrades
  beltLevels: {}, // { "min-max": level }  传送带等级 1-5
  _beltClickTarget: null, // 当前点击的传送带
  _hoverBeltKey: null, // 当前悬停的传送带 key
  manualBelts: {}, // { "min-max": { fi, ti, color, icon, label } } 手动连接的传送带
  removedBelts: {}, // { "min-max": true } 被撤销的自动传送带
  _beltConnectMode: false, // 手动连接传送带模式
  _beltConnectFrom: null, // 手动连接起点格子索引
  // Prestige
  prestigeCurrency: 0,
  prestigeCount: 0,
  prestigeBonuses: [], // indices of purchased bonuses
  _evoSpeedMult: 1,
  _prodMult: 1,
  // Choice event
  pendingChoice: null,

  // ===== INIT =====
  init() {
    for (let k in RES) this.res[k] = 0;
    this.res.glucose = 50; this.res.energy = 35;
    for (let k in RES) this.rates[k] = 0;
    this.grid = new Array(this.gridCols * this.gridRows).fill(null);
    for (let k in TECHS) this.techs[k] = { done:false };

    this.load();           // 先加载存档（恢复 grid 数据和 gridSize）
    this.buildUI();        // 再渲染 UI（renderGrid 会基于正确的数据）
    this.calcOfflineEarnings();
    this.startLoop();
    this.animLoop();
    this._initResponsive();
    this._initTouchEvents();
    this.log('▸ 系统在线 — 微生物帝国启动', 's');
    this.log('▸ 起始资源: 50🟢葡萄糖 + 35⚡能量', 'ev');
    this.log('▸ 帝国核心供能上限2台 — 建造「碳源采集器」开始吧！', '');

    // 自动保存（每30秒）
    this.autoSaveInterval = setInterval(() => {
      this.save(true); // silent save
    }, 30000);

    // 音频：首次点击后初始化（浏览器策略要求用户交互触发）
    const audioInit = () => {
      SFX.initOnInteraction();
      SFX.updateBGMPhase(this.phase);
      document.removeEventListener('click', audioInit);
      document.removeEventListener('keydown', audioInit);
    };
    document.addEventListener('click', audioInit);
    document.addEventListener('keydown', audioInit);

    // 全局 mouseup — 取消拖拽/框选（鼠标在格子外释放时）
    document.addEventListener('mouseup', (e) => {
      if (e.button !== 0) return;
      if (this._isDragging || this._dragIdx != null) {
        this._cancelDrag();
      }
      if (this._boxSelectMode) {
        this._finalizeBoxSelect();
      }
      if (this._isMultiDragging) {
        this._cleanupMultiDrag();
      }
      this._boxSelectStart = null;
      this._multiDragStart = null;
    });

    // 全局 click — 关闭传送带操作菜单（点击菜单外部时）
    document.addEventListener('click', (e) => {
      const menu = document.getElementById('beltActionMenu');
      if (menu && menu.classList.contains('show') && !menu.contains(e.target)) {
        this.closeBeltActionMenu();
      }
    });

    // ===== 键盘快捷键 =====
    document.addEventListener('keydown', (e) => {
      // ESC — 关闭最上层弹窗
      if (e.key === 'Escape') {
        e.preventDefault();
        this.closeTopPopup();
        return;
      }
      // 不在输入框中才触发快捷键
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      // 空格 — 暂停/继续
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        this.togglePause();
        return;
      }
      // 1/2/3 — 速度控制
      if (e.key === '1') { this.spd = 1; this._syncSpeedUI(); }
      else if (e.key === '2') { this.spd = 2; this._syncSpeedUI(); }
      else if (e.key === '3') { this.spd = 4; this._syncSpeedUI(); }
    });
  },

  // 同步速度按钮UI
  _syncSpeedUI() {
    document.getElementById('spdDisplay').textContent = this.spd + '×';
    const btn = document.getElementById('spdBtn');
    btn.classList.remove('spd-2', 'spd-4');
    if (this.spd === 2) btn.classList.add('spd-2');
    else if (this.spd === 4) btn.classList.add('spd-4');
    SFX.click();
  },

  // ===== 移动端标签页切换 =====
  _isMobile() { return window.innerWidth <= 768; },

  mobileTab(tab) {
    const sidebar = document.querySelector('.sidebar');
    const center = document.querySelector('.center');
    const rightPanel = document.querySelector('.right-panel');
    const tabs = document.querySelectorAll('.mobile-tab');

    // 清除所有 active
    sidebar.classList.remove('mobile-active');
    rightPanel.classList.remove('mobile-active');
    center.classList.remove('mobile-hidden');
    tabs.forEach(t => t.classList.remove('active'));

    // 激活对应 tab
    const activeTab = document.querySelector(`.mobile-tab[data-tab="${tab}"]`);
    if (activeTab) activeTab.classList.add('active');

    if (tab === 'build') {
      sidebar.classList.add('mobile-active');
      center.classList.add('mobile-hidden');
    } else if (tab === 'info') {
      rightPanel.classList.add('mobile-active');
      center.classList.add('mobile-hidden');
    }
    // tab === 'dish' 时默认显示 center

    // 切到培养皿时刷新 canvas 尺寸
    if (tab === 'dish') {
      requestAnimationFrame(() => this._resizeCanvases());
    }
  },

  // 响应窗口 resize — 退出移动布局时清理 mobile classes
  _initResponsive() {
    const mql = window.matchMedia('(max-width:768px)');
    const handleChange = (e) => {
      if (!e.matches) {
        // 退出移动端，清除 mobile class
        document.querySelector('.sidebar')?.classList.remove('mobile-active');
        document.querySelector('.right-panel')?.classList.remove('mobile-active');
        document.querySelector('.center')?.classList.remove('mobile-hidden');
      }
    };
    mql.addEventListener('change', handleChange);

    // 窗口 resize 时重新计算格子大小（可能导致 gridCols/gridRows 变化）
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const gridEl = document.getElementById('grid');
        if (!gridEl) return;
        const oldCols = this.gridCols;
        const oldRows = this.gridRows;
        const layout = this._calcGridLayout();
        if (this.gridCols !== oldCols || this.gridRows !== oldRows) {
          // 网格尺寸变了，需要完整重渲染
          this.renderGrid();
          this.save(true);
        } else if (layout.cellSize) {
          gridEl.style.gridTemplateColumns = `repeat(${layout.cols}, ${layout.cellSize}px)`;
          gridEl.style.gridAutoRows = `${layout.cellSize}px`;
        }
        this._resizeCanvases();
      }, 150);
    });
  },

  // ===== 触摸事件适配 =====
  _initTouchEvents() {
    const gridEl = document.getElementById('grid');
    if (!gridEl) return;

    // 长按 = 右键（回收）
    let longPressTimer = null;
    let longPressTriggered = false;
    let touchStartPos = null;

    gridEl.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      touchStartPos = { x: touch.clientX, y: touch.clientY };
      longPressTriggered = false;

      longPressTimer = setTimeout(() => {
        longPressTriggered = true;
        // 找到触摸的 cell
        const cell = touch.target.closest('.cell');
        if (cell) {
          const idx = parseInt(cell.dataset.i);
          if (!isNaN(idx) && this.grid[idx]) {
            // 震动反馈（如果支持）
            if (navigator.vibrate) navigator.vibrate(30);
            this.showRecycle(idx);
          }
        }
      }, 500);
    }, { passive: true });

    gridEl.addEventListener('touchmove', (e) => {
      if (!touchStartPos) return;
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartPos.x);
      const dy = Math.abs(touch.clientY - touchStartPos.y);
      // 移动超过 10px 就取消长按
      if (dx > 10 || dy > 10) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }, { passive: true });

    gridEl.addEventListener('touchend', () => {
      clearTimeout(longPressTimer);
      longPressTimer = null;
      touchStartPos = null;
    }, { passive: true });

    gridEl.addEventListener('touchcancel', () => {
      clearTimeout(longPressTimer);
      longPressTimer = null;
      touchStartPos = null;
    }, { passive: true });

    // 双击 = 升级（触摸端）
    let lastTapTime = 0;
    let lastTapCell = null;
    gridEl.addEventListener('click', (e) => {
      if (!this._isMobile()) return;
      const cell = e.target.closest('.cell');
      if (!cell) return;
      const idx = parseInt(cell.dataset.i);
      if (isNaN(idx)) return;

      const now = Date.now();
      if (lastTapCell === idx && now - lastTapTime < 350) {
        // 双击 — 升级
        if (this.grid[idx]) this.showUpgradePopup(idx);
        lastTapTime = 0;
        lastTapCell = null;
      } else {
        lastTapTime = now;
        lastTapCell = idx;
      }
    });

    // 分数行 — 长按显示评级说明（移动端没有右键）
    const scoreRow = document.getElementById('scoreRow');
    if (scoreRow) {
      let scoreLpTimer = null;
      scoreRow.addEventListener('touchstart', (e) => {
        scoreLpTimer = setTimeout(() => {
          if (navigator.vibrate) navigator.vibrate(20);
          this.showRatingTooltip(e.touches[0]);
        }, 400);
      }, { passive: true });
      scoreRow.addEventListener('touchend', () => clearTimeout(scoreLpTimer), { passive: true });
      scoreRow.addEventListener('touchmove', () => clearTimeout(scoreLpTimer), { passive: true });
      scoreRow.addEventListener('touchcancel', () => clearTimeout(scoreLpTimer), { passive: true });
    }
  },

  // Canvas resize helper
  _resizeCanvases() {
    const inner = document.getElementById('dishScrollInner');
    if (!inner) return;
    const bg = document.getElementById('bgCanvas');
    const pt = document.getElementById('partCanvas');
    if (bg) { bg.width = inner.offsetWidth; bg.height = inner.offsetHeight; }
    if (pt) { pt.width = inner.offsetWidth; pt.height = inner.offsetHeight; }
  },

  // ===== 弹窗遮罩管理 =====
  // 按优先级排列的弹窗ID列表（从高到低）
  _popupIds: [
    'resetPopup', 'choicePopup', 'offlinePopup',
    'upgradePopup', 'beltUpgradePopup', 'recyclePopup',
    'bldTypeSelector', 'beltTypeSelector', 'eventPopup'
  ],

  _showBackdrop() {
    const bd = document.getElementById('popupBackdrop');
    if (bd) bd.classList.add('show');
  },

  _hideBackdrop() {
    const bd = document.getElementById('popupBackdrop');
    if (bd) bd.classList.remove('show');
  },

  // 关闭最上层弹窗（ESC / 点击遮罩时调用）
  closeTopPopup() {
    // 按z-index从高到低检查哪个弹窗在显示
    for (const id of this._popupIds) {
      const el = document.getElementById(id);
      if (el && el.classList.contains('show')) {
        el.classList.remove('show');
        this._hideBackdrop();
        // 特定弹窗需要清理状态
        if (id === 'recyclePopup') this.recycleIdx = null;
        if (id === 'upgradePopup') this.upgradeIdx = null;
        if (id === 'beltUpgradePopup') { this._beltUpgradeKey = null; this._beltUpgradeKeys = null; }
        return;
      }
    }
    // 没有弹窗，尝试关闭传送带菜单
    const menu = document.getElementById('beltActionMenu');
    if (menu && menu.classList.contains('show')) {
      this.closeBeltActionMenu();
    }
    // 没有弹窗，取消传送带连接模式
    if (this._beltConnectMode) {
      this.cancelBeltConnect();
    }
    // 清除框选
    if (this._selectedCells && this._selectedCells.size > 0) {
      this._clearBoxSelection();
    }
    this._hideBackdrop();
  },

  // ===== OFFLINE EARNINGS =====
  calcOfflineEarnings() {
    if (!this.lastOnlineTime || this.totalBuildings() === 0) return;
    const now = Date.now();
    const elapsed = (now - this.lastOnlineTime) / 1000; // seconds
    if (elapsed < 30) return; // at least 30 seconds away

    const maxOffline = 7200; // cap at 2 hours
    const secs = Math.min(elapsed, maxOffline);
    const offlineRate = 0.5; // 50% of online production rate

    this.updateRates();
    const earnings = {};
    let hasEarnings = false;
    for (let k in this.rates) {
      if (this.rates[k] > 0) {
        const amount = Math.floor(this.rates[k] * secs * offlineRate);
        if (amount > 0) {
          earnings[k] = amount;
          this.res[k] = (this.res[k] || 0) + amount;
          hasEarnings = true;
        }
      }
    }

    if (hasEarnings) {
      const timeStr = elapsed >= 3600 ? `${Math.floor(elapsed/3600)}小时${Math.floor((elapsed%3600)/60)}分钟` :
                      elapsed >= 60 ? `${Math.floor(elapsed/60)}分钟` : `${Math.floor(elapsed)}秒`;
      const earningStr = Object.entries(earnings).map(([k,v]) => `+${v}${RES[k]?.icon||k}`).join(' ');

      // Show welcome back popup
      setTimeout(() => {
        this.showOfflinePopup(timeStr, earningStr, earnings);
      }, 500);

      this.log(`🌙 离线${timeStr}，收获: ${earningStr}`, 's');
    }
  },

  showOfflinePopup(timeStr, earningStr, earnings) {
    const pop = document.getElementById('offlinePopup');
    if (!pop) return;
    document.getElementById('offlineTime').textContent = `离开了 ${timeStr}`;
    const detailEl = document.getElementById('offlineDetail');
    let html = '';
    for (let k in earnings) {
      html += `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.03)">
        <span style="color:var(--dim)">${RES[k]?.icon||''} ${RES[k]?.n||k}</span>
        <span style="color:var(--green);font-weight:700;font-family:'Orbitron',monospace">+${earnings[k]}</span>
      </div>`;
    }
    detailEl.innerHTML = html;
    pop.classList.add('show');
    SFX.bigReward();
    this.screenShake(5);
    // 安全网：8秒后自动关闭
    setTimeout(() => this.closeOffline(), 8000);
  },

  closeOffline() {
    document.getElementById('offlinePopup')?.classList.remove('show');
  },

  // ===== BUILD UI =====
  buildUI() {
    this.renderResources();
    this.renderBuildings();
    this.renderTechs();
    this.renderGrid();
    this.renderCoreColony(false);
    this.updateGuide();
    this.updatePhase();
    this.updateCoreUpgradeUI();
  },

  // === Resources ===
  renderResources() {
    const grid = document.getElementById('resGrid');
    grid.innerHTML = '';
    for (let k in RES) {
      const r = RES[k];
      const card = document.createElement('div');
      card.className = 'res-card';
      card.id = 'res-' + k;
      if (r.phase > this.phase) card.classList.add('hidden');
      card.innerHTML = `
        <div class="res-flash" id="resFlash-${k}" style="background:${r.c}15"></div>
        <div style="display:flex;align-items:center;gap:4px">
          <span class="res-icon">${r.icon}</span>
          <span class="res-name">${r.n}</span>
        </div>
        <div class="res-val" id="resVal-${k}">0</div>
        <div class="res-rate" id="resRate-${k}"></div>
      `;
      grid.appendChild(card);
    }
    if (typeof GameTooltip !== 'undefined') GameTooltip.scheduleScan();
  },

  // === Buildings ===
  renderBuildings() {
    const list = document.getElementById('buildList');
    list.innerHTML = '';
    for (let key in BLDS) {
      const b = BLDS[key];
      if (b.phase > this.phase) continue;

      const locked = b.techReq && !this.techs[b.techReq]?.done;

      // 外层容器，包含建筑按钮 + 升级按钮
      const row = document.createElement('div');
      row.className = 'build-row';

      const btn = document.createElement('button');
      btn.className = 'action-btn' + (locked ? ' locked' : '') + (this.sel === key ? ' active' : '');
      btn.dataset.b = key;

      // 动态递增造价
      const actualCost = this.scaledCost(key);
      const costStr = Object.entries(actualCost).map(([k,v]) => `${v} ${RES[k]?.icon||k}`).join(' + ');
      const count = this.bldCount(key);
      const countTag = count > 0 ? `<span style="font-size:0.65em;color:var(--color-muted);margin-left:4px">×${count}</span>` : '';

      let tagHTML = '';
      if (b.isWonder) tagHTML = '<span class="act-tag" style="color:var(--purple);border:1px solid var(--purple);background:rgba(168,85,247,0.15)">奇观</span>';
      else if (b.tier) tagHTML = `<span class="act-tag" style="color:${b.color}80;border:1px solid ${b.color}30;background:${b.color}08;font-size:0.55em">T${b.tier}</span>`;

      // 直接显示转化比例
      const corePoweredInfo = b.corePowered
        ? `<div style="font-size:0.65em;color:var(--color-muted-dark);margin:1px 0">🏠 核心供能上限: ${(CORE_COLONY[this.phase]||CORE_COLONY[1]).maxCollectors}台</div>`
        : '';
      btn.innerHTML = `
        <div class="act-icon">${SVG[key]||''}</div>
        <div style="flex:1">
          <div class="act-name"><span style="margin-right:3px">${b.emoji||''}</span>${b.n}${countTag}</div>
          <div class="act-desc">${b.d}</div>
          <div style="font-size:0.7em;color:var(--color-info);font-family:'Share Tech Mono',monospace;margin:1px 0">${b.ratio}</div>
          ${corePoweredInfo}
          <div class="act-cost">造价: ${costStr}</div>
        </div>
        ${tagHTML}
      `;
      btn.onclick = () => { if(!locked) this.selectBuilding(key); };
      row.appendChild(btn);

      // 升级按钮：只在有已建造的非奇观/非增益建筑时显示
      if (count > 0 && !b.isWonder && !b.isBoost) {
        const upBtn = document.createElement('button');
        upBtn.className = 'build-upgrade-btn';
        upBtn.title = `升级 ${b.n}`;
        // 找到所有可升级的同类建筑
        const upgradeable = this.grid
          .map((g, i) => (g && g.type === key) ? i : -1)
          .filter(i => i >= 0 && (this.buildingLevels[i] || 1) < 5);
        const allMaxed = upgradeable.length === 0;
        if (allMaxed) {
          upBtn.innerHTML = `<span class="build-up-icon">✦</span><span class="build-up-label">MAX</span>`;
          upBtn.classList.add('maxed');
          upBtn.disabled = true;
        } else {
          const minLv = Math.min(...upgradeable.map(i => this.buildingLevels[i] || 1));
          upBtn.innerHTML = `<span class="build-up-icon">⬆</span><span class="build-up-label">Lv${minLv}</span>`;
          upBtn.onclick = (e) => {
            e.stopPropagation();
            this.showBldTypeSelector(key);
          };
        }
        row.appendChild(upBtn);
      }

      list.appendChild(row);
    }
  },

  // === Belt Upgrade Inline Button (in build panel) ===
  updateBeltUpgradeBtn() {
    const btn = document.getElementById('beltUpgradeInlineBtn');
    const label = document.getElementById('beltUpgradeInlineLabel');
    if (!btn || !label) return;

    const groups = this._getBeltGroups();
    if (groups.length === 0) {
      btn.classList.add('no-belts');
      label.textContent = '升级';
      return;
    }
    btn.classList.remove('no-belts');
    const allMax = groups.every(g => g.allMax);
    if (allMax) {
      label.textContent = 'MAX';
      btn.classList.add('no-belts');
    } else {
      const minLv = Math.min(...groups.filter(g => !g.allMax).map(g => g.minLv));
      label.textContent = `Lv${minLv}`;
    }
  },

  // 获取传送带分组数据（复用逻辑）
  _getBeltGroups() {
    const belts = this._activeBelts || [];
    if (belts.length === 0) return [];

    const beltGroups = {};
    belts.forEach(belt => {
      const fromBld = this.grid[belt.fi];
      const toBld = this.grid[belt.ti];
      if (!fromBld || !toBld) return;
      const groupKey = fromBld.type + '→' + toBld.type;
      if (!beltGroups[groupKey]) {
        beltGroups[groupKey] = {
          fromType: fromBld.type, toType: toBld.type,
          fromName: (BLDS[fromBld.type]?.emoji || '') + (BLDS[fromBld.type]?.n || '?'),
          toName: (BLDS[toBld.type]?.emoji || '') + (BLDS[toBld.type]?.n || '?'),
          icons: belt.icons || [],
          keys: [],
        };
      }
      const key = Math.min(belt.fi, belt.ti) + '-' + Math.max(belt.fi, belt.ti);
      if (!beltGroups[groupKey].keys.includes(key)) {
        beltGroups[groupKey].keys.push(key);
      }
    });

    return Object.values(beltGroups).map(grp => {
      const count = grp.keys.length;
      const minLv = Math.min(...grp.keys.map(k => this.getBeltLevel(k)));
      const avgEff = grp.keys.reduce((s, k) => s + this.getBeltEfficiency(k), 0) / count;
      const effPct = Math.round(avgEff * 100);
      const allMax = minLv >= 5;
      return { ...grp, count, minLv, effPct, allMax };
    });
  },

  // 弹框：选择传送带类型进行升级
  showBeltTypeSelector() {
    const groups = this._getBeltGroups();
    if (groups.length === 0) {
      this.log('暂无传送带可升级', 'w');
      return;
    }

    const listEl = document.getElementById('beltTypeList');
    if (!listEl) return;
    listEl.innerHTML = '';

    groups.forEach(grp => {
      const item = document.createElement('div');
      item.className = 'belt-type-item' + (grp.allMax ? ' maxed' : '');

      const effColor = grp.effPct >= 100 ? 'var(--cyan)' : grp.effPct >= 70 ? 'var(--yellow)' : 'var(--orange)';
      const lvColor = grp.allMax ? 'var(--purple)' : grp.minLv >= 3 ? 'var(--cyan)' : grp.minLv >= 2 ? 'var(--yellow)' : 'var(--orange)';
      const resIcons = grp.icons.join('');
      const countTag = grp.count > 1 ? ` <span class="belt-type-count" style="color:var(--color-muted)">×${grp.count}</span>` : '';

      item.innerHTML = `
        <div style="flex:1;min-width:0">
          <div class="belt-type-route">${resIcons} ${grp.fromName} → ${grp.toName}${countTag}</div>
          <div class="belt-type-meta">
            <span class="belt-type-lv" style="color:${lvColor}">Lv.${grp.minLv}${grp.allMax ? ' ★' : ''}</span>
            <span class="belt-type-eff" style="color:${effColor}">效率 ${grp.effPct}%</span>
          </div>
        </div>
        <span class="belt-type-arrow">${grp.allMax ? '✦' : '⬆'}</span>
      `;

      if (!grp.allMax) {
        item.onclick = () => {
          this.closeBeltTypeSelector();
          this.showBeltGroupUpgradePopup(grp.keys, grp.fromName, grp.toName);
        };
      }
      listEl.appendChild(item);
    });

    document.getElementById('beltTypeSelector').classList.add('show');
  },

  closeBeltTypeSelector() {
    document.getElementById('beltTypeSelector')?.classList.remove('show');
  },

  // 弹框：选择建筑实例进行升级
  showBldTypeSelector(buildingKey) {
    const bd = BLDS[buildingKey];
    if (!bd) return;

    // 找到该类型所有已放置的建筑，按格子序号排列
    const instances = [];
    this.grid.forEach((g, i) => {
      if (g && g.type === buildingKey) instances.push(i);
    });
    if (instances.length === 0) {
      this.log('暂无该类型建筑可升级', 'w');
      return;
    }

    const listEl = document.getElementById('bldTypeList');
    if (!listEl) return;
    listEl.innerHTML = '';

    // 计算每个实例的序号（同类型内的顺序号）
    instances.forEach((idx, seqIdx) => {
      const lv = this.buildingLevels[idx] || 1;
      const isMax = lv >= 5;
      const cost = this.getUpgradeCost(idx);
      const costStr = cost ? Object.entries(cost).map(([k,v]) => `${v}${RES[k]?.icon||k}`).join('+') : '';
      const mult = this.getUpgradeMultiplier(idx).toFixed(1);
      const nextMult = isMax ? mult : (1 + lv * 0.4).toFixed(1);

      const item = document.createElement('div');
      item.className = 'bld-type-item' + (isMax ? ' maxed' : '');

      const lvColor = isMax ? 'var(--purple)' : lv >= 3 ? 'var(--cyan)' : lv >= 2 ? 'var(--yellow)' : 'var(--color-info)';
      const row = Math.floor(idx / this.gridSize) + 1;
      const col = idx % this.gridSize + 1;

      item.innerHTML = `
        <span class="bld-type-seq">#${seqIdx + 1}</span>
        <span class="bld-type-emoji">${bd.emoji || '🔧'}</span>
        <div class="bld-type-info">
          <div class="bld-type-name">${bd.n} <span style="color:var(--color-muted-dark);font-size:0.85em">(${row},${col})</span></div>
          <div class="bld-type-meta">
            <span class="bld-type-lv" style="color:${lvColor}">${isMax ? '★MAX' : 'Lv.' + lv + ' → Lv.' + (lv+1)}</span>
            <span class="bld-type-mult" style="color:var(--color-info)">${mult}x${isMax ? '' : ' → ' + nextMult + 'x'}</span>
            ${!isMax ? `<span class="bld-type-cost">${costStr}</span>` : ''}
          </div>
        </div>
        <span class="bld-type-arrow">${isMax ? '✦' : '⬆'}</span>
      `;

      if (!isMax) {
        item.onclick = () => {
          this.closeBldTypeSelector();
          this.showUpgradePopup(idx);
        };
      }
      listEl.appendChild(item);
    });

    document.getElementById('bldTypeSelector').classList.add('show');
    SFX.click();
  },

  closeBldTypeSelector() {
    document.getElementById('bldTypeSelector')?.classList.remove('show');
  },

  // === Techs ===
  renderTechs() {
    const section = document.getElementById('techSection');
    const list = document.getElementById('techList');
    list.innerHTML = '';

    let hasVisible = false;
    for (let key in TECHS) {
      const t = TECHS[key];
      // 只显示当前阶段及以内的科技，不提前泄露
      if (t.phase > this.phase) continue;
      hasVisible = true;

      const reqs = t.req || [];
      const locked = reqs.some(r => !this.techs[r]?.done);
      const done = this.techs[key]?.done;
      const isResearching = this.rTech === key;

      const btn = document.createElement('button');
      btn.className = 'action-btn' + (locked ? ' locked' : '') + (done ? ' done' : '');
      btn.id = 'tech-' + key;
      if (done) btn.style.borderColor = 'var(--color-muted-dark)';

      const costStr = Object.entries(t.cost).map(([k,v]) => `${v} ${RES[k]?.icon||k}`).join(' + ');

      btn.innerHTML = `
        <div style="flex:1">
          <div class="act-name">${done ? '✓ ' : ''}${t.n}</div>
          <div class="act-desc">${t.d} — ${t.ef}</div>
          <div class="act-cost">${done ? '<span style="color:var(--green)">已完成 ✦ 效果生效中</span>' : `▸ ${costStr} | ${t.time}秒`}</div>
          ${isResearching ? `<div class="prog-wrap"><div class="prog-bar"><div class="prog-fill" id="techFill-${key}" style="width:0%;background:var(--cyan)"></div></div></div>` : ''}
        </div>
      `;

      if (!locked && !done) {
        btn.onclick = () => this.startResearch(key);
      }
      list.appendChild(btn);
    }

    section.style.display = hasVisible ? 'block' : 'none';
  },

  // === Core Colony Bar (帝国核心展示 + 供给状态) ===
  renderCoreColony(upgraded) {
    const cc = CORE_COLONY[this.phase] || CORE_COLONY[1];
    const bar = document.getElementById('coreColonyBar');
    bar.dataset.phase = this.phase;
    document.getElementById('coreIcon').textContent = cc.emoji;
    document.getElementById('coreTitle').textContent = cc.name;
    document.getElementById('coreTitle').style.color = cc.color;
    document.getElementById('coreDesc').textContent = cc.desc;
    const tag = document.getElementById('corePhaseTag');
    tag.textContent = 'P' + this.phase;
    tag.style.color = cc.color;
    tag.style.borderColor = cc.color + '60';
    // 更新供给状态
    this.updateCoreSupplyUI();
    // 升级动画
    if (upgraded) {
      bar.classList.remove('upgrading');
      void bar.offsetWidth; // force reflow
      bar.classList.add('upgrading');
      setTimeout(() => bar.classList.remove('upgrading'), 600);
    }
  },

  // === 更新核心供给UI ===
  updateCoreSupplyUI() {
    const cc = CORE_COLONY[this.phase] || CORE_COLONY[1];
    const maxC = cc.maxCollectors || 2;
    const used = this._coreSupplyUsed || 0;
    const active = Math.min(used, maxC);
    const overload = used > maxC;

    const textEl = document.getElementById('coreSupplyText');
    const fillEl = document.getElementById('coreSupplyFill');
    const bar = document.getElementById('coreColonyBar');
    const tagEl = document.getElementById('coreSupplyTag');
    if (!textEl || !fillEl || !bar) return;

    // 数值显示
    textEl.textContent = overload ? `${active}/${maxC} 🌱 (${used - maxC}闲置)` : `${active}/${maxC} 🌱`;
    textEl.style.color = overload ? '#ef4444' : (active === maxC ? '#f59e0b' : '#22c55e');

    // 进度条
    const pct = Math.min(100, (used / maxC) * 100);
    fillEl.style.width = pct + '%';
    fillEl.style.background = overload ? '#ef4444' : (active === maxC ? '#f59e0b' : '#22c55e');

    // CSS边框特效类
    bar.classList.remove('supplying', 'supply-full', 'supply-overload');
    if (overload) {
      bar.classList.add('supply-overload');
    } else if (active > 0 && active === maxC) {
      bar.classList.add('supply-full');
    } else if (active > 0) {
      bar.classList.add('supplying');
    }

    // 状态标签
    if (tagEl) {
      tagEl.classList.remove('active', 'full', 'overload', 'idle');
      if (overload) {
        tagEl.textContent = '⚠ 负载过高';
        tagEl.classList.add('overload');
      } else if (active > 0 && active === maxC) {
        tagEl.textContent = '⚡ 满载供能';
        tagEl.classList.add('full');
      } else if (active > 0) {
        tagEl.textContent = '⚡ 供能中';
        tagEl.classList.add('active');
      } else {
        tagEl.textContent = '待机';
        tagEl.classList.add('idle');
      }
    }

    // 辉光强度
    const glowEl = document.getElementById('coreGlowBg');
    if (glowEl) {
      const intensity = active > 0 ? 0.4 + (active / maxC) * 0.5 : 0.3;
      glowEl.style.opacity = intensity;
    }
  },

  // === Grid ===
  // 格子最小像素（低于此值就减少格子数）和最大像素（高于此值就增加格子数）
  _minCellPx: 44,
  _maxCellPx: 62,
  _minCols: 8, _maxCols: 24,
  _minRows: 6, _maxRows: 18,

  _calcGridLayout() {
    const dishView = document.querySelector('.dish-view');
    const gridEl = document.getElementById('grid');
    if (!dishView) return { cellSize: null, cols: this.gridCols };
    const vw = dishView.clientWidth;
    const vh = dishView.clientHeight;
    const cs = gridEl ? getComputedStyle(gridEl) : null;
    const gap = cs ? parseFloat(cs.gap) || parseFloat(cs.rowGap) || 10 : 10;
    const padT = cs ? parseFloat(cs.paddingTop) || 10 : 10;
    const padL = cs ? parseFloat(cs.paddingLeft) || 10 : 10;

    // 策略：尽可能多放格子，但格子大小保持在 minCellPx ~ maxCellPx 之间
    // 先按最小格子大小算出最多能放多少
    const maxFitCols = Math.floor((vw - padL * 2 + gap) / (this._minCellPx + gap));
    const maxFitRows = Math.floor((vh - padT * 2 + gap) / (this._minCellPx + gap));
    // 再按最大格子大小算出最少放多少
    const minFitCols = Math.floor((vw - padL * 2 + gap) / (this._maxCellPx + gap));
    const minFitRows = Math.floor((vh - padT * 2 + gap) / (this._maxCellPx + gap));

    // 取最多能放的数量（clamp 到范围内）
    let newCols = Math.max(this._minCols, Math.min(this._maxCols, maxFitCols));
    let newRows = Math.max(this._minRows, Math.min(this._maxRows, maxFitRows));

    // 计算此时格子实际大小，如果太小就减少数量
    let cellW = Math.floor((vw - padL * 2 - gap * (newCols - 1)) / newCols);
    let cellH = Math.floor((vh - padT * 2 - gap * (newRows - 1)) / newRows);
    let cellSize = Math.min(cellW, cellH);

    // 如果格子太小，逐步减少行列直到格子大小合理
    while (cellSize < this._minCellPx && (newCols > this._minCols || newRows > this._minRows)) {
      // 优先减少格子更多（空间更紧张）的方向
      if (cellW < cellH && newCols > this._minCols) {
        newCols--;
      } else if (newRows > this._minRows) {
        newRows--;
      } else {
        newCols--;
      }
      cellW = Math.floor((vw - padL * 2 - gap * (newCols - 1)) / newCols);
      cellH = Math.floor((vh - padT * 2 - gap * (newRows - 1)) / newRows);
      cellSize = Math.min(cellW, cellH);
    }

    cellSize = Math.max(this._minCellPx, cellSize);

    // 如果列数或行数变了，扩展/收缩网格数组
    if (newCols !== this.gridCols || newRows !== this.gridRows) {
      this._resizeGrid(newCols, newRows);
    }

    return { cellSize, cols: this.gridCols };
  },

  /* 动态调整网格大小（支持非正方形），保留原有建筑位置 */
  _resizeGrid(newCols, newRows) {
    const oldCols = this.gridCols;
    const oldRows = this.gridRows;
    const oldGrid = this.grid;
    const newLen = newCols * newRows;
    const newGrid = new Array(newLen).fill(null);
    const newLevels = {};

    // 把旧建筑按 (row, col) 映射到新网格
    for (let i = 0; i < oldGrid.length; i++) {
      if (!oldGrid[i]) continue;
      const r = Math.floor(i / oldCols);
      const c = i % oldCols;
      if (r < newRows && c < newCols) {
        const ni = r * newCols + c;
        newGrid[ni] = oldGrid[i];
        if (this.buildingLevels[i] !== undefined) {
          newLevels[ni] = this.buildingLevels[i];
        }
      }
    }

    // 迁移传送带的 key (索引对)
    const migrateBeltMap = (map) => {
      const result = {};
      for (const [key, v] of Object.entries(map || {})) {
        const [a, b] = key.split('-').map(Number);
        const ar = Math.floor(a / oldCols), ac = a % oldCols;
        const br = Math.floor(b / oldCols), bc = b % oldCols;
        if (ar < newRows && ac < newCols && br < newRows && bc < newCols) {
          const na = ar * newCols + ac;
          const nb = br * newCols + bc;
          const nk = Math.min(na, nb) + '-' + Math.max(na, nb);
          result[nk] = v;
        }
      }
      return result;
    };

    this.gridCols = newCols;
    this.gridRows = newRows;
    this.gridSize = newCols;  // 保持 gridSize 指向列数，兼容旧代码中的 idx↔坐标转换
    this.grid = newGrid;
    this.buildingLevels = newLevels;
    this.beltLevels = migrateBeltMap(this.beltLevels);
    this.manualBelts = migrateBeltMap(this.manualBelts);
    this.removedBelts = migrateBeltMap(this.removedBelts);
    this._chainsDirty = true;
  },

  renderGrid() {
    this._chainsDirty = true;  // 网格变了，传送带列表需要更新
    const gridEl = document.getElementById('grid');
    const layout = this._calcGridLayout();
    if (layout.cellSize) {
      gridEl.style.gridTemplateColumns = `repeat(${layout.cols}, ${layout.cellSize}px)`;
      gridEl.style.gridAutoRows = `${layout.cellSize}px`;
    } else {
      gridEl.style.gridTemplateColumns = `repeat(${this.gridCols}, 1fr)`;
    }
    gridEl.innerHTML = '';

    // 预计算每种建筑类型的序号映射: idx → seq number (1-based)
    const seqCounters = {};
    const seqMap = {};
    for (let i = 0; i < this.gridCols * this.gridRows; i++) {
      if (this.grid[i] && this.grid[i].type && BLDS[this.grid[i].type]) {
        const t = this.grid[i].type;
        if (!seqCounters[t]) seqCounters[t] = 0;
        seqCounters[t]++;
        seqMap[i] = seqCounters[t];
      }
    }

    for (let i = 0; i < this.gridCols * this.gridRows; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.i = i;

      // 清除无效的格子数据（旧存档残留，含旧版核心菌落）
      if (this.grid[i] && (this.grid[i].type === '_coreColony' || !this.grid[i].type || !BLDS[this.grid[i].type])) {
        this.grid[i] = null;
      }

      if (this.grid[i]) {
        const bd = BLDS[this.grid[i].type];
        const btype = this.grid[i].type;
        cell.classList.add('occupied', bd.bg);
        const cellLv = this.buildingLevels[i] || 1;
        if (cellLv > 1) cell.classList.add('upgraded');
        if (cellLv >= 5) cell.classList.add('max-level');

        // 主题色左侧竖条
        const stripe = document.createElement('div');
        stripe.className = 'cell-stripe';
        stripe.style.background = bd.color;
        cell.appendChild(stripe);

        // SVG图标（缩小，作为背景装饰）
        const icon = document.createElement('div');
        icon.className = 'icon icon-bg';
        icon.innerHTML = SVG[btype] || '';
        cell.appendChild(icon);

        // 大emoji标识（核心辨识）
        const emojiEl = document.createElement('div');
        emojiEl.className = 'cell-emoji';
        emojiEl.textContent = bd.emoji || '🔧';
        cell.appendChild(emojiEl);

        // Tier等级角标 — 始终显示等级信息
        const bldLv = this.buildingLevels[i] || 1;
        const tierEl = document.createElement('div');
        tierEl.className = 'cell-tier tier-' + (bd.tier || 1);
        if (bldLv >= 5) {
          tierEl.style.color = 'var(--color-max)';
          tierEl.style.borderColor = 'rgba(168,85,247,0.38)';
          tierEl.style.background = 'rgba(80,20,120,0.4)';
          tierEl.textContent = '★MAX';
        } else if (bldLv > 1) {
          tierEl.textContent = 'Lv.' + bldLv;
          tierEl.style.color = 'var(--color-upgrade)';
          tierEl.style.borderColor = 'rgba(251,191,36,0.38)';
        } else {
          tierEl.textContent = 'Lv.1';
          tierEl.style.color = 'var(--color-muted)';
          tierEl.style.borderColor = 'rgba(90,122,154,0.25)';
        }
        cell.appendChild(tierEl);

        // 序号角标（同类型多个时显示 #1 #2 ...）
        const typeTotal = seqCounters[btype] || 1;
        if (typeTotal > 1 || !bd.isWonder) {
          const seqEl = document.createElement('div');
          seqEl.className = 'cell-seq';
          seqEl.textContent = '#' + (seqMap[i] || 1);
          cell.appendChild(seqEl);
        }

        // 呼吸光环
        const aura = document.createElement('div');
        aura.className = 'aura';
        aura.style.color = bd.color;
        aura.style.animationDelay = (Math.random()*2)+'s';
        cell.appendChild(aura);

        // 工作指示灯
        const dot = document.createElement('div');
        dot.className = 'work-dot';
        dot.style.background = bd.color;
        dot.style.boxShadow = '0 0 3px ' + bd.color;
        cell.appendChild(dot);

        // 【新增】缺少传送带警告 — 需要输入资源的建筑如果没有传送带连接
        const needsInput = FLOW_MAP.some(f => f.to === btype);
        if (needsInput) {
          const warnEl = document.createElement('div');
          warnEl.className = 'cell-belt-warn';
          warnEl.id = 'beltWarn-' + i;
          warnEl.textContent = '⚠ 需要传送带';
          warnEl.style.cssText = 'position:absolute;bottom:12px;left:0;right:0;text-align:center;font-size:0.5em;color:var(--orange);font-weight:700;z-index:8;pointer-events:none;display:none;text-shadow:0 1px 3px rgba(0,0,0,0.8);animation:blink 1.5s ease-in-out infinite';
          cell.appendChild(warnEl);
        }

        // 名称标签（增强可见度）
        const label = document.createElement('div');
        label.className = 'label';
        label.textContent = bd.n;
        cell.appendChild(label);

        // （产出速率改为 hover tooltip 显示，不再叠加在格子上）

        // 输入端口（消耗的资源）
        const consKeys = Object.keys(bd.cons || {});
        if (consKeys.length > 0 && !bd.isBoost && !bd.isWonder) {
          const inPorts = document.createElement('div');
          inPorts.className = 'cell-ports in';
          consKeys.forEach(k => {
            const r = RES[k];
            if (!r) return;
            const port = document.createElement('div');
            port.className = 'cell-port';
            port.style.borderColor = r.c + '80';
            port.style.color = r.c;
            port.style.boxShadow = '0 0 3px ' + r.c + '30';
            port.textContent = r.icon;
            inPorts.appendChild(port);
          });
          cell.appendChild(inPorts);
        }

        // 输出端口（产出的资源）
        const prodKeys = Object.keys(bd.prod || {});
        if (prodKeys.length > 0 && !bd.isBoost) {
          const outPorts = document.createElement('div');
          outPorts.className = 'cell-ports out';
          prodKeys.forEach(k => {
            const r = RES[k];
            if (!r) return;
            const port = document.createElement('div');
            port.className = 'cell-port';
            port.style.borderColor = r.c + '80';
            port.style.color = r.c;
            port.style.boxShadow = '0 0 3px ' + r.c + '30';
            port.textContent = r.icon;
            outPorts.appendChild(port);
          });
          cell.appendChild(outPorts);
        }

        // Hover tooltip数据
        cell.dataset.btype = btype;
      }

      // === 拖拽 + 点击 + 框选事件系统 ===
      cell.onmousedown = ((idx) => {
        return (e) => {
          if (e.button !== 0) return;
          if (this._beltConnectMode) return;

          // 如果已有框选，且点击的是已选中的有建筑的格子 → 启动多选拖拽
          if (this._selectedCells.size > 0 && this._selectedCells.has(idx) && this.grid[idx] && !this.sel) {
            this._multiDragStart = { x: e.clientX, y: e.clientY };
            this._isMultiDragging = false;
            e.preventDefault();
            return;
          }

          // 点击非选中区域，清除框选
          if (this._selectedCells.size > 0 && !this._selectedCells.has(idx)) {
            this._clearBoxSelection();
          }

          // 正常单个建筑拖拽
          if (this.grid[idx] && !this.sel) {
            this._dragStartPos = { x: e.clientX, y: e.clientY };
            this._dragIdx = idx;
            this._isDragging = false;
          }
          // 空格子 + 无建造模式 → 准备框选
          if (!this.grid[idx] && !this.sel) {
            this._boxSelectStart = { x: e.clientX, y: e.clientY, idx: idx };
            this._boxSelectMode = false;
            e.preventDefault();
          }
        };
      })(i);
      cell.onclick = (() => {
        const idx = i;
        return (e) => {
          if (this._isDragging || this._isMultiDragging || this._boxSelectMode) {
            this._isDragging = false;
            this._isMultiDragging = false;
            this._boxSelectMode = false;
            return;
          }
          this.cellClick(idx);
        };
      })();
      cell.ondblclick = ((idx) => {
        return () => {
          if (this._isDragging || this._isMultiDragging) return;
          if (this.grid[idx]) this.showUpgradePopup(idx);
        };
      })(i);
      cell.oncontextmenu = ((idx) => {
        return (e) => {
          e.preventDefault();
          if (this._beltConnectMode) {
            this.cancelBeltConnect();
            this.showCursorTooltip('已取消传送带连接');
            return;
          }
          // 框选中右键取消框选
          if (this._selectedCells.size > 0) {
            this._clearBoxSelection();
            this.showCursorTooltip('已取消框选');
            return;
          }
          if (this.sel) {
            this.selectBuilding(this.sel);
            this.showCursorTooltip('已取消建造');
            return;
          }
          if (this.grid[idx]) this.showRecycle(idx);
        };
      })(i);

      // Hover tooltip + belt preview tracking + drag over
      cell.onmouseenter = ((idx) => {
        return (e) => {
          this._hoverIdx = idx;
          // 拖拽悬停高亮
          if (this._isDragging && this._dragIdx != null && this._dragIdx !== idx) {
            this._dragOverIdx = idx;
            const targetCell = document.querySelector(`.cell[data-i="${idx}"]`);
            if (targetCell && !this.grid[idx]) {
              targetCell.style.boxShadow = 'inset 0 0 12px rgba(6,214,160,0.3)';
              targetCell.style.borderColor = '#06d6a0';
            } else if (targetCell && this.grid[idx]) {
              targetCell.style.boxShadow = 'inset 0 0 12px rgba(59,130,246,0.3)';
              targetCell.style.borderColor = '#3b82f6';
            }
          }
          // 多选拖拽悬停高亮
          if (this._isMultiDragging && !this._selectedCells.has(idx)) {
            this._dragOverIdx = idx;
          }
          if (!this.grid[idx]) return;
          if (this._isDragging || this._isMultiDragging) return;
          const bd = BLDS[this.grid[idx].type];
          if (!bd) return;
          const tt = document.getElementById('tooltip');
          const lvl = this.buildingLevels[idx] || 1;
          const lvlStr = lvl >= 5 ? ' <span style="color:var(--color-max)">★MAX</span>' : ` <span style="color:var(--color-upgrade)">Lv.${lvl}</span>`;
          const multStr = lvl > 1 ? `<br><span style="color:var(--color-upgrade)">产出倍率: ${this.getUpgradeMultiplier(idx).toFixed(1)}x</span>` : '';
          const beltMult = this.getBeltMultiplierForBuilding(idx);
          const beltStr = beltMult < 1 ? `<br><span style="color:var(--orange)">⚠ 传送带效率: ${Math.round(beltMult*100)}% — 点击传送带升级！</span>` : (beltMult > 1 ? `<br><span style="color:var(--cyan)">✦ 传送带加成: ${Math.round(beltMult*100)}%</span>` : '');

          // 产出速率详情
          let rateStr = '';
          if (bd.isBoost) {
            rateStr = `<br><span style="color:${bd.color}">✦ 增益: +12%</span>`;
          } else if (bd.isWonder && this.wonderComplete) {
            rateStr = `<br><span style="color:${bd.color}">✦ 运行中</span>`;
          } else if (!bd.isWonder) {
            const coreConfig = CORE_COLONY[this.phase] || CORE_COLONY[1];
            const maxC = coreConfig.maxCollectors || 2;
            if (bd.corePowered) {
              let seq = 0;
              for (let ci = 0; ci <= idx; ci++) {
                if (this.grid[ci] && BLDS[this.grid[ci].type]?.corePowered) seq++;
              }
              if (seq > maxC) {
                rateStr = `<br><span style="color:var(--red)">⚠ 闲置（核心供能上限 ${maxC}）</span>`;
              }
            }
            // 各项产出
            const prodEntries = Object.entries(bd.prod || {});
            if (prodEntries.length > 0 && !rateStr.includes('闲置')) {
              const bldMult = this.getUpgradeMultiplier(idx);
              const popMult = 1 + Math.min(this.pop, this._popCap()) * 0.002;
              const mult = this.gEff * popMult * this.lEff * bldMult * beltMult;
              const prodParts = prodEntries.map(([res, base]) => {
                const actual = (base * mult).toFixed(1);
                return `<span style="color:${RES[res]?.c || bd.color}">+${actual} ${RES[res]?.icon||''} ${RES[res]?.n||res}/s</span>`;
              });
              rateStr = `<br>${prodParts.join('  ')}`;
            }
            // 各项消耗
            const consEntries = Object.entries(bd.cons || {});
            if (consEntries.length > 0 && !rateStr.includes('闲置')) {
              const bldMult = this.getUpgradeMultiplier(idx);
              const popMult = 1 + Math.min(this.pop, this._popCap()) * 0.002;
              const mult = this.gEff * popMult * this.lEff * bldMult * beltMult;
              const consParts = consEntries.map(([res, base]) => {
                const actual = (base * mult).toFixed(1);
                return `<span style="color:${RES[res]?.c || '#f97316'}">-${actual} ${RES[res]?.icon||''} ${RES[res]?.n||res}/s</span>`;
              });
              rateStr += `<br>${consParts.join('  ')}`;
            }
          }

          document.getElementById('ttName').innerHTML = `${bd.emoji||''} ${bd.n}${lvlStr} <span style="color:${bd.color};font-size:0.85em">[T${bd.tier||1}]</span>`;
          document.getElementById('ttDesc').innerHTML = `${bd.d}${multStr}${rateStr}${beltStr}<br><span style="color:var(--color-info);font-family:'Share Tech Mono',monospace">${bd.ratio}</span><br><span style="color:var(--color-muted-dark);font-size:0.85em">拖拽移动 · 双击升级 · 右键回收 · 空白拖拽框选</span>`;
          tt.classList.add('show');
          tt.style.left = Math.min(e.clientX + 12, window.innerWidth - 240) + 'px';
          tt.style.top = Math.min(e.clientY + 12, window.innerHeight - 100) + 'px';
        };
      })(i);
      cell.onmouseleave = ((idx) => {
        return () => {
          this._hoverIdx = null;
          document.getElementById('tooltip').classList.remove('show');
          if (this._isDragging) {
            const targetCell = document.querySelector(`.cell[data-i="${idx}"]`);
            if (targetCell) {
              targetCell.style.boxShadow = '';
              targetCell.style.borderColor = '';
            }
            this._dragOverIdx = null;
          }
        };
      })(i);
      cell.onmousemove = (e) => {
        const tt = document.getElementById('tooltip');
        if (tt.classList.contains('show')) {
          tt.style.left = Math.min(e.clientX + 12, window.innerWidth - 240) + 'px';
          tt.style.top = Math.min(e.clientY + 12, window.innerHeight - 100) + 'px';
        }
        // 检测拖拽开始（移动超过5px阈值）
        if (this._dragIdx != null && !this._isDragging && this._dragStartPos) {
          const dx = e.clientX - this._dragStartPos.x;
          const dy = e.clientY - this._dragStartPos.y;
          if (Math.sqrt(dx*dx + dy*dy) > 5) {
            this._isDragging = true;
            document.getElementById('tooltip').classList.remove('show');
            this._createDragGhost(this._dragIdx, e);
            const srcCell = document.querySelector(`.cell[data-i="${this._dragIdx}"]`);
            if (srcCell) {
              srcCell.style.opacity = '0.4';
              srcCell.style.filter = 'grayscale(0.5)';
            }
          }
        }
        // 更新幽灵位置
        if (this._isDragging && this._dragGhost) {
          this._dragGhost.style.left = (e.clientX - 20) + 'px';
          this._dragGhost.style.top = (e.clientY - 20) + 'px';
        }
        // 框选：从空格子开始拖拽
        if (this._boxSelectStart && !this._boxSelectMode) {
          const dx = e.clientX - this._boxSelectStart.x;
          const dy = e.clientY - this._boxSelectStart.y;
          if (Math.sqrt(dx*dx + dy*dy) > 5) {
            this._boxSelectMode = true;
            this._clearBoxSelection();
            // 创建选框矩形
            this._boxSelectRect = document.createElement('div');
            this._boxSelectRect.className = 'box-select-rect';
            document.getElementById('grid').parentElement.appendChild(this._boxSelectRect);
          }
        }
        if (this._boxSelectMode && this._boxSelectRect) {
          this._updateBoxSelectRect(e);
        }
        // 多选拖拽检测
        if (this._multiDragStart && !this._isMultiDragging) {
          const dx = e.clientX - this._multiDragStart.x;
          const dy = e.clientY - this._multiDragStart.y;
          if (Math.sqrt(dx*dx + dy*dy) > 5) {
            this._isMultiDragging = true;
            document.getElementById('tooltip').classList.remove('show');
            this._createMultiDragGhost(e);
            // 半透明已选格子
            this._selectedCells.forEach(si => {
              const sc = document.querySelector(`.cell[data-i="${si}"]`);
              if (sc && this.grid[si]) { sc.style.opacity = '0.4'; sc.style.filter = 'grayscale(0.5)'; }
            });
          }
        }
        if (this._isMultiDragging && this._multiDragGhost) {
          this._multiDragGhost.style.left = (e.clientX - 20) + 'px';
          this._multiDragGhost.style.top = (e.clientY - 20) + 'px';
        }
      };
      cell.onmouseup = ((idx) => {
        return (e) => {
          if (e.button !== 0) return;
          if (this._isDragging && this._dragIdx != null && this._dragIdx !== idx) {
            this._completeDrag(this._dragIdx, idx);
          }
          // 多选拖拽完成
          if (this._isMultiDragging && this._selectedCells.size > 0) {
            this._completeMultiDrag(idx);
          }
          // 框选结束
          if (this._boxSelectMode) {
            this._finalizeBoxSelect();
          }
          this._boxSelectStart = null;
          this._multiDragStart = null;
        };
      })(i);

      gridEl.appendChild(cell);
    }
  },

  // 更新格子内的警告标签（产出速率已移至 hover tooltip）
  updateCellRates() {
    const coreConfig = CORE_COLONY[this.phase] || CORE_COLONY[1];
    const maxC = coreConfig.maxCollectors || 2;
    let collectorSeq = 0;

    this.grid.forEach((g, idx) => {
      if (!g) return;
      const bd = BLDS[g.type];
      if (!bd) return;

      // 核心供能建筑：超出上限标记闲置
      if (bd.corePowered) {
        collectorSeq++;
      }

      // 更新缺传送带警告
      const warnEl = document.getElementById('beltWarn-' + idx);
      if (warnEl) {
        const beltMult = this.getBeltMultiplierForBuilding(idx);
        warnEl.style.display = beltMult === 0 ? 'block' : 'none';
      }
    });
  },

  // ===== SELECTION =====
  selectBuilding(key) {
    // 如果在传送带连接模式中，退出
    if (this._beltConnectMode) this.cancelBeltConnect();
    this.sel = (this.sel === key) ? null : key;
    SFX.select();
    document.querySelectorAll('.action-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.b === this.sel);
    });
    if (this.sel) {
      document.getElementById('buildHint').textContent = '点击培养皿中的空格放置';
      // 移动端选中建筑后自动切换到培养皿
      if (this._isMobile()) this.mobileTab('dish');
    } else {
      document.getElementById('buildHint').textContent = '选一个放到培养皿里';
    }
  },

  // ===== BELT CONNECTION CHECK =====
  _checkBeltConnections(idx, type) {
    const occupiedCells = new Set();
    for (let i = 0; i < this.grid.length; i++) {
      if (this.grid[i]) occupiedCells.add(i);
    }
    const bldMap = {};
    for (let i = 0; i < this.grid.length; i++) {
      if (this.grid[i]) {
        const t = this.grid[i].type;
        if (!bldMap[t]) bldMap[t] = [];
        bldMap[t].push(i);
      }
    }
    const sz = this.gridSize;
    const idx2rc = (i) => ({ r: Math.floor(i / sz), c: i % sz });
    const manhattan = (a, b) => {
      const A = idx2rc(a), B = idx2rc(b);
      return Math.abs(A.r - B.r) + Math.abs(A.c - B.c);
    };
    let count = 0;
    for (const flow of FLOW_MAP) {
      if (flow.from !== type && flow.to !== type) continue;
      const froms = bldMap[flow.from];
      const tos = bldMap[flow.to];
      if (!froms || !tos) continue;
      // 检查idx是否参与了某个可达连接
      if (flow.from === type && froms.includes(idx)) {
        for (const ti of tos) {
          if (ti !== idx && manhattan(idx, ti) <= 4) { count++; break; }
        }
      }
      if (flow.to === type && tos.includes(idx)) {
        for (const fi of froms) {
          if (fi !== idx && manhattan(fi, idx) <= 4) { count++; break; }
        }
      }
    }
    return { count };
  },

  // ===== DRAG & DROP SYSTEM =====
  _createDragGhost(idx, e) {
    const g = this.grid[idx];
    if (!g) return;
    const bd = BLDS[g.type];
    if (!bd) return;
    // 移除旧幽灵
    if (this._dragGhost) this._dragGhost.remove();
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.innerHTML = `<span style="font-size:20px">${bd.emoji || '🔧'}</span>`;
    ghost.style.cssText = `
      position:fixed; z-index:10010; pointer-events:none;
      width:40px; height:40px; display:flex; align-items:center; justify-content:center;
      background:rgba(6,214,160,0.15); border:2px solid rgba(6,214,160,0.5);
      border-radius:4px; backdrop-filter:blur(4px);
      box-shadow:0 0 16px rgba(6,214,160,0.2);
      transition:transform 0.1s; transform:scale(1.1);
    `;
    ghost.style.left = (e.clientX - 20) + 'px';
    ghost.style.top = (e.clientY - 20) + 'px';
    document.body.appendChild(ghost);
    this._dragGhost = ghost;
  },

  _completeDrag(fromIdx, toIdx) {
    if (fromIdx === toIdx) { this._cancelDrag(); return; }
    const srcBuilding = this.grid[fromIdx];
    if (!srcBuilding) { this._cancelDrag(); return; }

    // 奇观建造中不能移动
    const srcBd = BLDS[srcBuilding.type];
    if (srcBd?.isWonder && this.wBuild) {
      this.log('奇观建造中，无法移动', 'w');
      this._cancelDrag(); return;
    }

    // 目标已有建筑 → 交换
    const destBuilding = this.grid[toIdx];

    // 交换建筑数据
    this.grid[fromIdx] = destBuilding;
    this.grid[toIdx] = srcBuilding;

    // 交换建筑等级
    const fromLv = this.buildingLevels[fromIdx];
    const toLv = this.buildingLevels[toIdx];
    if (fromLv) this.buildingLevels[toIdx] = fromLv;
    else delete this.buildingLevels[toIdx];
    if (toLv) this.buildingLevels[fromIdx] = toLv;
    else delete this.buildingLevels[fromIdx];

    // 迁移传送带等级 key：将涉及 fromIdx/toIdx 的 key 更新
    const migrateKeys = (obj) => {
      const old = { ...obj };
      for (const [key, val] of Object.entries(old)) {
        const [a, b] = key.split('-').map(Number);
        let na = a, nb = b;
        if (a === fromIdx) na = toIdx; else if (a === toIdx) na = fromIdx;
        if (b === fromIdx) nb = toIdx; else if (b === toIdx) nb = fromIdx;
        if (na !== a || nb !== b) {
          delete obj[key];
          const nk = Math.min(na, nb) + '-' + Math.max(na, nb);
          obj[nk] = val;
          // 更新manualBelts内部的fi/ti
          if (val && typeof val === 'object' && 'fi' in val) {
            if (val.fi === fromIdx) val.fi = toIdx; else if (val.fi === toIdx) val.fi = fromIdx;
            if (val.ti === fromIdx) val.ti = toIdx; else if (val.ti === toIdx) val.ti = fromIdx;
          }
        }
      }
    };
    migrateKeys(this.beltLevels);
    migrateKeys(this.manualBelts);
    migrateKeys(this.removedBelts);

    // 清理拖拽状态
    this._cleanupDrag();

    // 刷新渲染
    this.renderGrid();
    this.updateRates();
    this.renderBuildings();
    this.updateUI();

    const bd = BLDS[srcBuilding.type];
    if (destBuilding) {
      const destBd = BLDS[destBuilding.type];
      this.log(`↔ 交换: ${bd?.n || '建筑'} ⇄ ${destBd?.n || '建筑'}`, 's');
    } else {
      this.log(`➜ 移动: ${bd?.n || '建筑'}`, 's');
    }
    SFX.click();

    // 移动后检查传送带连接
    const beltInfo = this._checkBeltConnections(toIdx, srcBuilding.type);
    if (beltInfo.count > 0) {
      this.log(`🔗 传送带已连接 ×${beltInfo.count}`, 's');
    }
  },

  _cancelDrag() {
    this._cleanupDrag();
  },

  _cleanupDrag() {
    // 移除幽灵
    if (this._dragGhost) { this._dragGhost.remove(); this._dragGhost = null; }
    // 恢复源格子外观
    if (this._dragIdx != null) {
      const srcCell = document.querySelector(`.cell[data-i="${this._dragIdx}"]`);
      if (srcCell) { srcCell.style.opacity = ''; srcCell.style.filter = ''; }
    }
    // 清除目标高亮
    if (this._dragOverIdx != null) {
      const targetCell = document.querySelector(`.cell[data-i="${this._dragOverIdx}"]`);
      if (targetCell) { targetCell.style.boxShadow = ''; targetCell.style.borderColor = ''; }
    }
    this._dragIdx = null;
    this._dragOverIdx = null;
    this._isDragging = false;
    this._dragStartPos = null;
  },

  // ===== BOX SELECT SYSTEM =====
  _updateBoxSelectRect(e) {
    if (!this._boxSelectRect || !this._boxSelectStart) return;
    const gridEl = document.getElementById('grid');
    const dishView = gridEl.parentElement;
    const gRect = dishView.getBoundingClientRect();

    const sx = this._boxSelectStart.x - gRect.left;
    const sy = this._boxSelectStart.y - gRect.top;
    const cx = e.clientX - gRect.left;
    const cy = e.clientY - gRect.top;

    const left = Math.max(0, Math.min(sx, cx));
    const top = Math.max(0, Math.min(sy, cy));
    const w = Math.abs(cx - sx);
    const h = Math.abs(cy - sy);

    this._boxSelectRect.style.left = left + 'px';
    this._boxSelectRect.style.top = top + 'px';
    this._boxSelectRect.style.width = w + 'px';
    this._boxSelectRect.style.height = h + 'px';

    // 实时高亮被框选的格子
    const rectBounds = {
      left: Math.min(this._boxSelectStart.x, e.clientX),
      top: Math.min(this._boxSelectStart.y, e.clientY),
      right: Math.max(this._boxSelectStart.x, e.clientX),
      bottom: Math.max(this._boxSelectStart.y, e.clientY),
    };

    const SZ = this.gridSize;
    this._selectedCells = new Set();
    for (let i = 0; i < this.grid.length; i++) {
      const cell = gridEl.children[i];
      if (!cell) continue;
      const cr = cell.getBoundingClientRect();
      const centerX = cr.left + cr.width / 2;
      const centerY = cr.top + cr.height / 2;
      const inRect = centerX >= rectBounds.left && centerX <= rectBounds.right &&
                     centerY >= rectBounds.top && centerY <= rectBounds.bottom;
      if (inRect && this.grid[i]) {
        this._selectedCells.add(i);
        cell.classList.add('box-selected');
      } else {
        cell.classList.remove('box-selected');
      }
    }
  },

  _finalizeBoxSelect() {
    if (this._boxSelectRect) {
      this._boxSelectRect.remove();
      this._boxSelectRect = null;
    }
    this._boxSelectMode = false;
    this._boxSelectStart = null;

    if (this._selectedCells.size === 0) return;

    // 查找框选区域内的传送带
    const selectedBelts = new Set();
    const belts = this._activeBelts || [];
    belts.forEach(belt => {
      if (this._selectedCells.has(belt.fi) && this._selectedCells.has(belt.ti)) {
        const key = Math.min(belt.fi, belt.ti) + '-' + Math.max(belt.fi, belt.ti);
        selectedBelts.add(key);
      }
    });
    this._selectedBelts = selectedBelts;

    const bldCount = [...this._selectedCells].filter(i => this.grid[i]).length;
    if (bldCount > 0) {
      this.log(`▸ 框选了 ${bldCount} 个建筑${selectedBelts.size > 0 ? ` + ${selectedBelts.size} 条传送带` : ''} — 拖拽可整体移动`, 's');
    }
  },

  _clearBoxSelection() {
    this._selectedCells.forEach(i => {
      const cell = document.querySelector(`.cell[data-i="${i}"]`);
      if (cell) cell.classList.remove('box-selected');
    });
    this._selectedCells = new Set();
    this._selectedBelts = new Set();
    if (this._boxSelectRect) {
      this._boxSelectRect.remove();
      this._boxSelectRect = null;
    }
  },

  // ===== MULTI-DRAG SYSTEM =====
  _createMultiDragGhost(e) {
    if (this._multiDragGhost) this._multiDragGhost.remove();
    const selected = [...this._selectedCells].filter(i => this.grid[i]);
    if (selected.length === 0) return;

    const ghost = document.createElement('div');
    ghost.className = 'multi-drag-ghost';
    // 显示前3个建筑emoji + 总数
    const emojis = selected.slice(0, 3).map(i => {
      const bd = BLDS[this.grid[i]?.type];
      return bd?.emoji || '🔧';
    }).join('');
    const extra = selected.length > 3 ? `+${selected.length - 3}` : '';
    ghost.innerHTML = `${emojis}<span class="multi-drag-count">${selected.length}个${extra}</span>`;
    ghost.style.left = (e.clientX - 20) + 'px';
    ghost.style.top = (e.clientY - 20) + 'px';
    document.body.appendChild(ghost);
    this._multiDragGhost = ghost;
  },

  _completeMultiDrag(targetIdx) {
    const selected = [...this._selectedCells].filter(i => this.grid[i]).sort((a, b) => a - b);
    if (selected.length === 0) { this._cleanupMultiDrag(); return; }

    const SZ = this.gridSize;

    // 计算选中格子的包围盒
    const rows = selected.map(i => Math.floor(i / SZ));
    const cols = selected.map(i => i % SZ);
    const minR = Math.min(...rows), minC = Math.min(...cols);

    // 目标格子作为新位置的锚点（对应包围盒的左上角）
    const targetR = Math.floor(targetIdx / SZ);
    const targetC = targetIdx % SZ;

    // 计算偏移
    const dr = targetR - minR;
    const dc = targetC - minC;

    // 检查是否可以移动（所有目标位置都在网格内且为空或是选中的格子）
    const newPositions = {};
    let canMove = true;
    for (const idx of selected) {
      const r = Math.floor(idx / SZ) + dr;
      const c = idx % SZ + dc;
      if (r < 0 || r >= SZ || c < 0 || c >= SZ) {
        canMove = false; break;
      }
      const newIdx = r * SZ + c;
      // 目标位置已有建筑且不是被选中的 → 不能移动
      if (this.grid[newIdx] && !this._selectedCells.has(newIdx)) {
        canMove = false; break;
      }
      newPositions[idx] = newIdx;
    }

    if (!canMove) {
      this.log('目标区域空间不足，无法移动', 'e');
      SFX.buildFail();
      this._cleanupMultiDrag();
      return;
    }

    // 如果偏移为0，不需要移动
    if (dr === 0 && dc === 0) {
      this._cleanupMultiDrag();
      return;
    }

    // 执行移动：先收集所有数据，再写入新位置
    const savedBuildings = {};
    const savedLevels = {};
    for (const idx of selected) {
      savedBuildings[idx] = this.grid[idx];
      savedLevels[idx] = this.buildingLevels[idx];
      this.grid[idx] = null;
      delete this.buildingLevels[idx];
    }

    for (const [oldIdx, newIdx] of Object.entries(newPositions)) {
      this.grid[newIdx] = savedBuildings[oldIdx];
      if (savedLevels[oldIdx]) this.buildingLevels[newIdx] = savedLevels[oldIdx];
    }

    // 迁移传送带 keys
    const beltMigrations = {}; // oldKey → newKey
    if (this._selectedBelts && this._selectedBelts.size > 0) {
      const migrateObj = (obj) => {
        const updates = [];
        for (const [key, val] of Object.entries(obj)) {
          const [a, b] = key.split('-').map(Number);
          let na = a, nb = b;
          if (newPositions[a] !== undefined) na = newPositions[a];
          if (newPositions[b] !== undefined) nb = newPositions[b];
          if (na !== a || nb !== b) {
            const nk = Math.min(na, nb) + '-' + Math.max(na, nb);
            updates.push({ oldKey: key, newKey: nk, val });
            if (!beltMigrations[key]) beltMigrations[key] = nk;
          }
        }
        for (const upd of updates) {
          delete obj[upd.oldKey];
          // 更新 manualBelts 内部的 fi/ti
          if (upd.val && typeof upd.val === 'object' && 'fi' in upd.val) {
            if (newPositions[upd.val.fi] !== undefined) upd.val.fi = newPositions[upd.val.fi];
            if (newPositions[upd.val.ti] !== undefined) upd.val.ti = newPositions[upd.val.ti];
          }
          obj[upd.newKey] = upd.val;
        }
      };
      migrateObj(this.beltLevels);
      migrateObj(this.manualBelts);
      migrateObj(this.removedBelts);
    }

    this._cleanupMultiDrag();
    this._clearBoxSelection();

    this.renderGrid();
    this.updateRates();
    this.renderBuildings();
    this.updateUI();

    this.log(`➜ 整体移动了 ${selected.length} 个建筑`, 's');
    SFX.click();
  },

  _cleanupMultiDrag() {
    if (this._multiDragGhost) { this._multiDragGhost.remove(); this._multiDragGhost = null; }
    // 恢复所有选中格子外观
    this._selectedCells.forEach(i => {
      const cell = document.querySelector(`.cell[data-i="${i}"]`);
      if (cell) { cell.style.opacity = ''; cell.style.filter = ''; }
    });
    this._isMultiDragging = false;
    this._multiDragStart = null;
  },

  // ===== CELL CLICK =====
  cellClick(idx) {
    // 手动连接传送带模式
    if (this._beltConnectMode) {
      this.handleBeltConnectClick(idx);
      return;
    }
    if (this.paused) { this.log('游戏已暂停', 'w'); SFX.buildFail(); return; }
    if (!this.sel) {
      // 没选中建筑时，点击已有建筑不提示（拖拽手势）
      if (!this.grid[idx]) this.log('请先从左侧选择建筑', 'w');
      return;
    }

    // 自动清理无效格子（旧存档残留的幽灵建筑）
    if (this.grid[idx] && (!this.grid[idx].type || !BLDS[this.grid[idx].type])) {
      this.grid[idx] = null;
      this.log('▸ 清除了损坏的建筑数据', 'w');
    }

    if (this.grid[idx]) { this.log('这个位置已经有建筑了', 'e'); SFX.buildFail(); return; }

    const bd = BLDS[this.sel];
    if (!bd) return;
    if (bd.techReq && !this.techs[bd.techReq]?.done) {
      this.log('需要先研究: ' + TECHS[bd.techReq]?.n, 'e');
      SFX.buildFail();
      return;
    }

    const actualCost = this.scaledCost(this.sel);
    if (!this.checkRes(actualCost)) {
      // 鼠标旁边显示资源不足提示
      const missing = [];
      for (let k in actualCost) {
        const have = this.res[k] || 0;
        if (have < actualCost[k]) missing.push(`${RES[k]?.icon||k} 差 ${Math.ceil(actualCost[k] - have)}`);
      }
      this.showCursorTooltip(`资源不足！${missing.join('  ')}`);
      SFX.buildFail();
      return;
    }

    this.spend(actualCost);
    this.grid[idx] = { type: this.sel };

    if (bd.isWonder) {
      this.wBuild = this.sel;
      this.wProg = 0;
      document.getElementById('wonderOverlay').classList.add('show');
      document.getElementById('wonderName').textContent = '建造中: ' + bd.n;
      this.log('★ 开始建造奇观: ' + bd.n, 's');
      SFX.wonderStart();
    } else {
      SFX.build();
    }

    this.renderGrid();
    this.updateRates();
    this.checkPhaseUp();
    this.renderBuildings();
    this.updateUI();
    this.log('▸ 建造 ' + bd.n + ' | ' + bd.ratio, 's');

    // 核心供给超限警告
    if (bd.corePowered) {
      const cc = CORE_COLONY[this.phase] || CORE_COLONY[1];
      const count = this.bldCount(this.sel);
      if (count > cc.maxCollectors) {
        this.log(`⚠ 帝国核心供能上限 ${cc.maxCollectors} 台，多出的 ${count - cc.maxCollectors} 台将闲置！升级核心可扩容`, 'w');
        this.showCursorTooltip(`核心供能上限 ${cc.maxCollectors}！`);
      } else if (count === cc.maxCollectors) {
        this.log(`⚡ 核心供能已满载 ${count}/${cc.maxCollectors}`, 'ev');
      }
    }

    // 传送带连接提示
    const beltInfoAfter = this._checkBeltConnections(idx, this.sel);
    if (beltInfoAfter.count > 0) {
      this.log(`🔗 传送带已连接 ×${beltInfoAfter.count}`, 's');
    } else {
      // 检查这个建筑是否有FLOW_MAP中的关系
      const hasFlowRole = FLOW_MAP.some(f => f.from === this.sel || f.to === this.sel);
      if (hasFlowRole) {
        this.log('⚠ 暂无传送带连接 — 试试放在相关建筑附近', 'w');
      }
    }

    // 爽感系统
    this.stats.totalBuilt++;
    this.buildBurst(idx);
    this.addCombo();
  },

  // ===== RECYCLE =====
  recycleIdx: null,
  RECYCLE_RATE: 0.5, // 返还50%资源

  showRecycle(idx) {
    const g = this.grid[idx];
    if (!g || !BLDS[g.type]) return;
    const bd = BLDS[g.type];
    if (bd.isWonder && this.wBuild) {
      this.log('奇观建造中，无法回收', 'w');
      return;
    }

    this.recycleIdx = idx;

    // 计算返还资源（基于该类型当前数量的递增造价的50%）
    const currentCount = this.bldCount(g.type);
    const countBefore = Math.max(0, currentCount - 1);
    const refund = {};
    for (let k in bd.cost) {
      const actualCost = Math.ceil(bd.cost[k] * Math.pow(COST_SCALE, countBefore));
      refund[k] = Math.floor(actualCost * this.RECYCLE_RATE);
    }

    const refundStr = Object.entries(refund).map(([k,v]) => `+${v} ${RES[k]?.icon||k}`).join('  ');

    document.getElementById('recycleName').textContent = bd.n;
    document.getElementById('recycleRefund').textContent = '返还: ' + refundStr;
    document.getElementById('recyclePopup').classList.add('show');
    this._showBackdrop();
    SFX.click();
  },

  confirmRecycle() {
    if (this.recycleIdx === null) return;
    const idx = this.recycleIdx;
    const g = this.grid[idx];
    if (!g) { this.cancelRecycle(); return; }

    const bd = BLDS[g.type];
    // 【修复】返还基于同类建筑当前数量的递增造价(建造N个时的造价)
    const currentCount = this.bldCount(g.type);
    const countBefore = Math.max(0, currentCount - 1);
    const refund = {};
    for (let k in bd.cost) {
      const actualCost = Math.ceil(bd.cost[k] * Math.pow(COST_SCALE, countBefore));
      refund[k] = Math.floor(actualCost * this.RECYCLE_RATE);
      this.res[k] = (this.res[k] || 0) + refund[k];
    }

    const refundStr = Object.entries(refund).map(([k,v]) => `+${v}${RES[k]?.icon||k}`).join(' ');
    this.log(`♻️ 回收 ${bd.n} → ${refundStr}`, 'ev');
    SFX.recycle();

    this.grid[idx] = null;
    this.recycleIdx = null;
    this.stats.totalRecycled++;
    // 清理与该格子相关的传送带等级记录
    for (const key of Object.keys(this.beltLevels)) {
      const [a, b] = key.split('-').map(Number);
      if (a === idx || b === idx) delete this.beltLevels[key];
    }
    for (const key of Object.keys(this.manualBelts)) {
      const [a, b] = key.split('-').map(Number);
      if (a === idx || b === idx) delete this.manualBelts[key];
    }
    for (const key of Object.keys(this.removedBelts)) {
      const [a, b] = key.split('-').map(Number);
      if (a === idx || b === idx) delete this.removedBelts[key];
    }
    document.getElementById('recyclePopup').classList.remove('show');
    this._hideBackdrop();

    this.renderGrid();
    this.updateRates();
    this.renderBuildings();
    this.updateUI();
  },

  cancelRecycle() {
    this.recycleIdx = null;
    document.getElementById('recyclePopup').classList.remove('show');
    this._hideBackdrop();
  },

  // ===== ACHIEVEMENTS =====
  checkAchievements() {
    for (const a of ACHIEVE) {
      if (this.achievements[a.id]) continue;
      if (a.check(this)) {
        this.achievements[a.id] = true;
        // 发放奖励
        const rewardParts = [];
        for (let k in a.reward) {
          this.res[k] = (this.res[k] || 0) + a.reward[k];
          rewardParts.push(`+${a.reward[k]}${RES[k]?.icon||k}`);
        }
        // 华丽弹出
        this.showAchievement(a.n, a.d, rewardParts.join(' '));
        SFX.achieve();
        this.log(`🏆 成就解锁: ${a.n} — ${a.d}`, 's');
        this.log(`   奖励: ${rewardParts.join(' ')}`, 'ev');
        this.screenShake(6);
        this.showGoldenFloat('🏆 ' + rewardParts.join(' '));
      }
    }
  },

  showAchievement(name, desc, reward) {
    this._enqueueNotify({
      dur: 4500,
      show: () => {
        const el = document.getElementById('achievePopup');
        document.getElementById('achieveName').textContent = name;
        document.getElementById('achieveDesc').textContent = desc;
        document.getElementById('achieveReward').textContent = '🎁 ' + reward;
        el.classList.remove('show');
        void el.offsetWidth; // force reflow
        el.classList.add('show');
      },
      hide: () => {
        document.getElementById('achievePopup').classList.remove('show');
      }
    });
  },

  // ===== SCREEN SHAKE =====
  screenShake(intensity) {
    const app = document.querySelector('.app');
    if (!app) return;
    const orig = app.style.transform;
    let ticks = 0;
    const shake = () => {
      if (ticks >= 6) { app.style.transform = orig || ''; return; }
      const x = (Math.random() - 0.5) * intensity;
      const y = (Math.random() - 0.5) * intensity;
      app.style.transform = `translate(${x}px, ${y}px)`;
      ticks++;
      requestAnimationFrame(shake);
    };
    shake();
  },

  // ===== BUILD COMBO =====
  addCombo() {
    this.combo++;
    if (this.comboTimer) clearTimeout(this.comboTimer);
    this.comboTimer = setTimeout(() => { this.combo = 0; }, 5000);

    if (this.combo >= 2) {
      const comboBonus = Math.min(this.combo * 3, 30);
      this.res.energy = (this.res.energy || 0) + comboBonus;
      this.showCombo(this.combo, comboBonus);
      SFX.combo(this.combo);
      if (this.combo >= 4) this.screenShake(4);
    }
  },

  showCombo(count, bonus) {
    const el = document.getElementById('comboPopup');
    document.getElementById('comboCount').textContent = `${count}连建！`;
    document.getElementById('comboBonus').textContent = `+${bonus}⚡ 连击奖励`;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2000);
  },

  // ===== BUILD BURST EFFECT =====
  buildBurst(idx) {
    const gridEl = document.getElementById('grid');
    const cell = gridEl?.children[idx];
    if (!cell) return;
    const g = this.grid[idx];
    if (!g) return;
    const bd = BLDS[g.type];
    const color = bd?.color || '#06d6a0';

    // 粒子爆炸
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('div');
      p.className = 'burst-particle';
      p.style.setProperty('--color', color);
      p.style.setProperty('--angle', (i * 30) + 'deg');
      p.style.setProperty('--dist', (20 + Math.random() * 25) + 'px');
      cell.appendChild(p);
      setTimeout(() => p.remove(), 700);
    }

    // 扩散光环
    const ring = document.createElement('div');
    ring.className = 'burst-ring';
    ring.style.borderColor = color;
    cell.appendChild(ring);
    setTimeout(() => ring.remove(), 600);

    this.screenShake(3);
  },

  // ===== ONLINE REWARDS =====
  tickOnlineReward() {
    this.onlineRewardTimer++;
    this.stats.onlineTime++;

    // 每60秒小奖励
    if (this.onlineRewardTimer % 60 === 0) {
      const min = Math.floor(this.onlineRewardTimer / 60);
      const amount = Math.floor(10 + min * 3);
      this.res.energy = (this.res.energy || 0) + amount;
      this.res.glucose = (this.res.glucose || 0) + Math.floor(amount * 0.6);
      this.showMilestone('🎁', `在线${min}分钟 — +${amount}⚡ +${Math.floor(amount*0.6)}🟢`);
      SFX.reward();
      this.log(`🎁 在线奖励(${min}min): +${amount}⚡ +${Math.floor(amount*0.6)}🟢`, 'ev');
    }

    // 每5分钟大奖
    if (this.onlineRewardTimer % 300 === 0) {
      const bigMin = Math.floor(this.onlineRewardTimer / 60);
      const bigBonus = Math.floor(30 + bigMin * 5);
      this.res.dna = (this.res.dna || 0) + Math.floor(bigBonus * 0.3);
      this.res.energy = (this.res.energy || 0) + bigBonus;
      this.gEff += 0.02;
      this.showEvent(`🎊 在线${bigMin}分钟大奖`, `奖励: +${bigBonus}⚡ +${Math.floor(bigBonus*0.3)}🧬\n全局效率永久+2%\n\n感谢你的坚持！`, 'var(--yellow)');
      SFX.bigReward();
      this.log(`🎊 在线大奖: +${bigBonus}⚡ +${Math.floor(bigBonus*0.3)}🧬 效率+2%`, 's');
      this.screenShake(8);
    }
  },

  // ===== STATS TRACKING =====
  updateStats() {
    this.stats.peakGlucose = Math.max(this.stats.peakGlucose, Math.floor(this.res.glucose || 0));
    this.stats.peakEnergy = Math.max(this.stats.peakEnergy, Math.floor(this.res.energy || 0));
    this.stats.peakDna = Math.max(this.stats.peakDna, Math.floor(this.res.dna || 0));
    // 峰值人口追踪
    this.stats.peakPop = Math.max(this.stats.peakPop || 0, Math.floor(this.pop));
  },

  // ===== SCORE SYSTEM =====
  // 总分 = 多维度加权，鼓励全面发展而非单一挂机
  calcScore() {
    const s = this.stats;
    let score = 0;

    // 1. 阶段进度（最大权重 — 核心指标）
    //    P1=100, P2=300, P3=600, P4=1000, P5=1500
    const phaseScore = [0, 100, 300, 600, 1000, 1500][this.phase] || 0;
    score += phaseScore;

    // 2. 进化等级 — 每级50分，后期递增
    score += this.eL * 50 + Math.max(0, this.eL - 3) * 30;

    // 3. 建筑数量 — 每个15分
    score += this.totalBuildings() * 15;

    // 4. 科技完成 — 每项80分（分支科技提供额外策略分数）
    const techDone = Object.values(this.techs).filter(t => t.done).length;
    score += techDone * 80;

    // 5. 成就 — 每个60分
    score += Object.keys(this.achievements).length * 60;

    // 6. 挑战完成 — 每个100分
    score += Object.keys(this.completedChallenges).length * 100;

    // 7. 峰值资源 — 对数评分（避免挂机通胀）
    score += Math.floor(Math.log10(Math.max(1, s.peakGlucose)) * 20);
    score += Math.floor(Math.log10(Math.max(1, s.peakEnergy)) * 20);
    score += Math.floor(Math.log10(Math.max(1, s.peakDna)) * 25);

    // 8. 人口 — 对数评分
    score += Math.floor(Math.log10(Math.max(1, s.peakPop || 0)) * 30);

    // 9. 全局效率 — 每100%=40分
    score += Math.floor(this.gEff * 40);

    // 10. 奇观完成 — 终极大分
    if (this.wonderComplete) score += 2000;

    // 11. 效率奖励 — 越快到达高阶段，分数越高（在线时长短=高效率）
    //     前30分钟不扣分，之后每小时-50分（但不低于0扣减）
    const hours = Math.max(0, this.stats.onlineTime / 3600 - 0.5);
    const timePenalty = Math.min(Math.floor(hours * 50), Math.floor(score * 0.15)); // 最多扣15%
    score -= timePenalty;

    return Math.max(0, Math.floor(score));
  },

  // 获取分数等级
  _scoreRank(score) {
    if (score >= 5000) return { rank:'SSS', color:'#fbbf24', glow:true };
    if (score >= 4000) return { rank:'SS',  color:'#f97316', glow:true };
    if (score >= 3000) return { rank:'S',   color:'#ef4444', glow:false };
    if (score >= 2000) return { rank:'A',   color:'#a855f7', glow:false };
    if (score >= 1200) return { rank:'B',   color:'#3b82f6', glow:false };
    if (score >= 600)  return { rank:'C',   color:'#22c55e', glow:false };
    if (score >= 200)  return { rank:'D',   color:'#6b7280', glow:false };
    return { rank:'E', color:'#4b5563', glow:false };
  },

  // 右键显示评级说明 tooltip
  showRatingTooltip(e) {
    // 移除已有的 tooltip
    const old = document.getElementById('ratingTooltip');
    if (old) { old.remove(); return; } // 再次右键则关闭

    const score = this.calcScore();
    const { rank, color: curColor } = this._scoreRank(score);

    const ranks = [
      { rank:'SSS', min:5000, color:'#fbbf24', desc:'传奇殖民者 — 全维度巅峰' },
      { rank:'SS',  min:4000, color:'#f97316', desc:'大师级 — 极致运营效率' },
      { rank:'S',   min:3000, color:'#ef4444', desc:'精英级 — 全面发展' },
      { rank:'A',   min:2000, color:'#a855f7', desc:'优秀 — 多线推进中' },
      { rank:'B',   min:1200, color:'#3b82f6', desc:'良好 — 基础体系成型' },
      { rank:'C',   min:600,  color:'#22c55e', desc:'成长中 — 还有很大空间' },
      { rank:'D',   min:200,  color:'#6b7280', desc:'起步阶段' },
      { rank:'E',   min:0,    color:'#4b5563', desc:'刚刚开始…' },
    ];

    let rows = ranks.map(r => {
      const isCurrent = r.rank === rank;
      const arrow = isCurrent ? '▶ ' : '&nbsp;&nbsp;';
      const bg = isCurrent ? `background:${r.color}12;border-left:2px solid ${r.color}` : 'border-left:2px solid transparent';
      const weight = isCurrent ? 'font-weight:700' : 'font-weight:400';
      const opacity = isCurrent ? 'opacity:1' : 'opacity:0.7';
      return `<div style="padding:3px 6px;${bg};${opacity};display:flex;align-items:center;gap:6px;border-radius:2px;margin:1px 0">
        <span style="font-family:'Orbitron',monospace;color:${r.color};${weight};font-size:0.95em;min-width:32px">${arrow}${r.rank}</span>
        <span style="color:var(--color-muted);font-size:0.85em">≥${r.min.toLocaleString()}</span>
        <span style="color:var(--color-info);font-size:0.85em;margin-left:auto">${r.desc}</span>
      </div>`;
    }).join('');

    const tip = document.createElement('div');
    tip.id = 'ratingTooltip';
    tip.style.cssText = `position:fixed;z-index:9999;
      background:rgba(10,16,28,0.96);border:1px solid rgba(255,255,255,0.1);
      border-radius:6px;padding:10px 12px;min-width:320px;max-width:400px;
      box-shadow:0 8px 30px rgba(0,0,0,0.5);backdrop-filter:blur(10px);
      font-family:'Rajdhani',sans-serif;pointer-events:auto;
      animation:fadeIn 0.15s ease-out`;

    tip.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.06)">
        <span style="color:var(--text);font-weight:700;font-size:0.85em">📊 评级说明</span>
        <span style="color:${curColor};font-family:'Orbitron',monospace;font-weight:700;font-size:0.95em">当前: ${rank} (${score.toLocaleString()}分)</span>
      </div>
      ${rows}
      <div style="text-align:center;margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.04);color:var(--dim);font-size:0.75em">
        分数 = 阶段 + 进化 + 建筑 + 科技 + 成就 + 挑战 + 资源峰值 + 效率 − 时间惩罚
      </div>
    `;

    // 定位：在鼠标位置附近，但不超出屏幕
    let x = e.clientX, y = e.clientY;
    document.body.appendChild(tip);
    const rect = tip.getBoundingClientRect();
    if (x + rect.width > window.innerWidth - 10) x = window.innerWidth - rect.width - 10;
    if (y + rect.height > window.innerHeight - 10) y = window.innerHeight - rect.height - 10;
    if (x < 5) x = 5;
    if (y < 5) y = 5;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';

    // 点击任意位置关闭
    const close = (ev) => {
      if (!tip.contains(ev.target)) {
        tip.remove();
        document.removeEventListener('mousedown', close);
        document.removeEventListener('touchstart', close);
      }
    };
    setTimeout(() => {
      document.addEventListener('mousedown', close);
      document.addEventListener('touchstart', close, { passive: true });
    }, 50);
  },

  renderStats() {
    const el = document.getElementById('statsContent');
    if (!el) return;
    const t = this.stats.onlineTime;
    const hrs = Math.floor(t / 3600);
    const min = Math.floor((t % 3600) / 60);
    const sec = t % 60;
    const timeStr = hrs > 0 ? `${hrs}时${min}分${sec}秒` : `${min}分${sec}秒`;

    el.innerHTML = `
      <div class="stat-row"><span class="stat-label">⏱ 在线时长</span><span class="stat-value">${timeStr}</span></div>
      <div class="stat-row"><span class="stat-label">🏗️ 总建造数</span><span class="stat-value">${this.stats.totalBuilt}</span></div>
      <div class="stat-row"><span class="stat-label">♻️ 总回收数</span><span class="stat-value">${this.stats.totalRecycled}</span></div>
      <div class="stat-row"><span class="stat-label">🧬 进化次数</span><span class="stat-value">${this.stats.totalEvo}</span></div>
      <div class="stat-row"><span class="stat-label">📖 研究完成</span><span class="stat-value">${Object.values(this.techs).filter(t=>t.done).length}/${Object.keys(TECHS).length}</span></div>
      <div class="stat-row"><span class="stat-label">🟢 峰值葡萄糖</span><span class="stat-value">${this.stats.peakGlucose}</span></div>
      <div class="stat-row"><span class="stat-label">⚡ 峰值能量</span><span class="stat-value">${this.stats.peakEnergy}</span></div>
      <div class="stat-row"><span class="stat-label">🧬 峰值DNA</span><span class="stat-value">${this.stats.peakDna}</span></div>
      <div class="stat-row"><span class="stat-label">🦠 峰值人口</span><span class="stat-value">${this.stats.peakPop || 0}</span></div>
      <div class="stat-row"><span class="stat-label">🏆 成就</span><span class="stat-value">${Object.keys(this.achievements).length}/${ACHIEVE.length}</span></div>
      <div class="stat-row"><span class="stat-label">🎯 挑战完成</span><span class="stat-value">${Object.keys(this.completedChallenges).length}/${CHALLENGES.length}</span></div>
      <div style="text-align:center;padding:6px 0 2px;border-top:1px solid rgba(255,255,255,0.06);margin-top:4px">
        <button onclick="G.shareScore()" style="font-size:0.7em;padding:4px 14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:4px;color:var(--blue);cursor:pointer;transition:all 0.2s" onmouseover="this.style.background='rgba(59,130,246,0.12)'" onmouseout="this.style.background='rgba(255,255,255,0.06)'">📋 复制分数卡片</button>
      </div>
    `;
    if (typeof GameTooltip !== 'undefined') GameTooltip.scheduleScan();
  },

  // 分享分数卡片 — 复制到剪贴板，方便发给朋友对比
  shareScore() {
    const score = this.calcScore();
    const { rank } = this._scoreRank(score);
    const t = this.stats.onlineTime;
    const hrs = Math.floor(t / 3600);
    const min = Math.floor((t % 3600) / 60);
    const timeStr = hrs > 0 ? `${hrs}h${min}m` : `${min}m`;
    const techDone = Object.values(this.techs).filter(t => t.done).length;
    const achieves = Object.keys(this.achievements).length;
    const challenges = Object.keys(this.completedChallenges).length;

    const card = [
      `🧫 ═══ 微生物帝国 ═══ 🧫`,
      ``,
      `🏆 总分: ${score.toLocaleString()}  [${rank}]`,
      `⏱ 在线: ${timeStr}  |  📡 阶段: P${this.phase}`,
      `🧬 进化: Lv.${this.eL}  |  📈 效率: ${(this.gEff*100).toFixed(0)}%`,
      `🏗️ 建筑: ${this.totalBuildings()}  |  🦠 峰值人口: ${this.stats.peakPop || 0}`,
      `📖 科技: ${techDone}/${Object.keys(TECHS).length}  |  🏆 成就: ${achieves}/${ACHIEVE.length}`,
      `🎯 挑战: ${challenges}/${CHALLENGES.length}${this.wonderComplete ? '  |  ☀️ 戴森球已完成!' : ''}`,
      ``,
      `═══════════════════════`,
    ].join('\n');

    navigator.clipboard.writeText(card).then(() => {
      this.showMilestone('📋', '分数卡片已复制到剪贴板！发给朋友比比看！');
      SFX.reward();
    }).catch(() => {
      // 降级方案：用弹窗显示
      prompt('复制下方文字分享给朋友：', card);
    });
  },

  // ===== UTILITY =====
  checkRes(cost) { for (let k in cost) if ((this.res[k]||0) < cost[k]) return false; return true; },
  spend(cost) { for (let k in cost) this.res[k] -= cost[k]; },

  bldCount(type) {
    return this.grid.filter(g => g && g.type === type).length;
  },

  totalBuildings() {
    return this.grid.filter(g => g !== null).length;
  },

  // 人口上限：基于建筑数量和阶段（+科技加成）
  _popCap() {
    return 50 + this.totalBuildings() * 40 + (this.phase - 1) * 100 + (this._popCapBonus || 0);
  },

  // 递增造价：已有N个同类建筑 → 造价 = 基础造价 × COST_SCALE^N
  scaledCost(key) {
    const bd = BLDS[key];
    const n = this.bldCount(key);
    const scaled = {};
    for (let k in bd.cost) {
      scaled[k] = Math.ceil(bd.cost[k] * Math.pow(COST_SCALE, n));
    }
    return scaled;
  },

  // ===== RATES =====
  updateRates() {
    const r = {};
    for (let k in RES) r[k] = 0;

    // 核心供给上限：帝国核心能供给多少台碳源采集器
    const coreConfig = CORE_COLONY[this.phase] || CORE_COLONY[1];
    const maxCollectors = coreConfig.maxCollectors || 2;

    // 先统计碳源采集器数量和索引
    const collectorIndices = [];
    this.grid.forEach((g, idx) => {
      if (g && g.type === 'glucoseCollector') collectorIndices.push(idx);
    });
    const activeCollectors = Math.min(collectorIndices.length, maxCollectors);
    // 记录供给状态供UI显示
    this._coreSupplyUsed = collectorIndices.length;
    this._coreSupplyMax = maxCollectors;
    this._coreSupplyActive = activeCollectors;

    let totalTransport = 0;
    let collectorCount = 0;
    this.grid.forEach((g, idx) => {
      if (!g) return;
      const bd = BLDS[g.type];
      if (!bd) return;
      if (bd.isBoost) { totalTransport++; return; }

      // 碳源采集器受核心供给上限限制
      if (bd.corePowered) {
        collectorCount++;
        if (collectorCount > maxCollectors) return; // 超出供给上限，不产出
      }

      const bldMult = this.getUpgradeMultiplier(idx); // building level multiplier
      const beltMult = this.getBeltMultiplierForBuilding(idx); // conveyor belt efficiency
      const popMult = 1 + Math.min(this.pop, this._popCap()) * 0.002; // 人口加成受上限限制
      // 科技树分支加成 — 特定建筑类型的额外乘数
      let techBonus = 1;
      let techConsPenalty = 1;
      if (g.type === 'glucoseCollector' && this._collectorBonus) techBonus += this._collectorBonus;
      if (g.type === 'energyStation') {
        if (this._energyBonus) techBonus += this._energyBonus;
        if (this._energyCostPenalty) techConsPenalty += this._energyCostPenalty;
      }
      if (g.type === 'nitrogenFixer' && this._nitrogenBonus) techBonus += this._nitrogenBonus;
      if (g.type === 'proteinFactory' && this._proteinBonus) techBonus += this._proteinBonus;
      const mult = this.gEff * popMult * bldMult * beltMult * techBonus;
      for (let k in bd.prod) r[k] = (r[k]||0) + bd.prod[k] * mult;
      // 【修复】消耗乘建筑等级和传送带效率（升级建筑=吞吐量同步提升）
      const consMult = bldMult * beltMult * techConsPenalty;
      for (let k in bd.cons) r[k] = (r[k]||0) - bd.cons[k] * consMult;
    });

    // 【修复】物流效率(lEff)只加成正值(产出)，不增加消耗
    const transportRate = 0.10 + (this._transportBonus || 0); // 自适应物流科技加成
    this.lEff = 1 + totalTransport * transportRate;
    for (let k in r) {
      if (r[k] > 0) r[k] *= this.lEff;
    }

    // QS boost — 基于QS产出速率而非存量，需要维持QS塔运转
    const qsRate = r.qs || 0; // QS净产出速率
    this.qsLv = Math.max(0, Math.floor(this.res.qs || 0));
    if (this.qsLv > 0) {
      // 加成上限60%(+科技加成)，如果QS净产出为负则加成减半
      const qsCap = 0.6 + (this._qsCapBonus || 0);
      const qsBase = Math.min(this.qsLv * 0.03, qsCap);
      const qsBoost = qsRate >= 0 ? qsBase : qsBase * 0.5;
      for (let k in r) if (r[k] > 0) r[k] *= (1 + qsBoost);
    }

    this.rates = r;
  },

  // ===== RESEARCH =====
  startResearch(key) {
    if (this.rTech) { this.log('已有研究进行中', 'w'); SFX.buildFail(); return; }
    const t = TECHS[key];
    if (t.phase > this.phase) { this.log('需要先进入阶段 ' + t.phase, 'e'); SFX.buildFail(); return; }
    if (!this.checkRes(t.cost)) { this.log('研究资源不足', 'e'); SFX.buildFail(); return; }
    this.spend(t.cost);
    this.rTech = key;
    this.rProg = 0;
    this.renderTechs();
    this.log('▸ 开始研究: ' + t.n, 'ev');
    SFX.researchStart();
  },

  tickResearch() {
    if (!this.rTech) return;
    const t = TECHS[this.rTech];
    this.rProg += 1;  // 在 spd 循环内已被调用 spd 次，每次 +1 即可
    const pct = Math.min(this.rProg / t.time * 100, 100);
    const fill = document.getElementById('techFill-' + this.rTech);
    if (fill) fill.style.width = pct + '%';

    if (this.rProg >= t.time) {
      const techKey = this.rTech;
      const oldEff = this.gEff;
      this.techs[techKey].done = true;
      if (t.fn) t.fn(this);
      const effDelta = this.gEff - oldEff;
      
      // 构建详细的效果说明
      let effectDetail = t.ef;
      if (effDelta > 0) {
        effectDetail += `\n\n✦ 全局效率: ${(oldEff*100).toFixed(0)}% → ${(this.gEff*100).toFixed(0)}%`;
        effectDetail += `\n（所有建筑产出提升${Math.round(effDelta*100)}%）`;
      }
      
      // 特殊提示：纯培养技术是阶段推进的关键
      if (techKey === 'pureCulture') {
        effectDetail += '\n\n📋 下一步: 将进化等级提升到 Lv.2 即可进入阶段2！';
        effectDetail += '\n（建造更多建筑加速进化值积累）';
      }

      this.log('◆ 研究完成: ' + t.n + ' — ' + t.ef, 's');
      SFX.researchDone();
      if (effDelta > 0) {
        this.log(`  ↳ 全局效率 ${(oldEff*100).toFixed(0)}% → ${(this.gEff*100).toFixed(0)}%`, 'ev');
      }
      this.showEvent('研究突破: ' + t.n, t.d + '\n\n效果: ' + effectDetail, 'var(--cyan)');
      this.stats.totalTech++;
      this.screenShake(5);
      
      // 效率变化时闪烁效率指标
      if (effDelta > 0) {
        const effEl = document.getElementById('statEff');
        if (effEl) {
          effEl.style.transition = 'color 0.2s, text-shadow 0.2s';
          effEl.style.color = 'var(--green)';
          effEl.style.textShadow = '0 0 8px var(--green)';
          setTimeout(() => {
            effEl.style.color = '';
            effEl.style.textShadow = '';
          }, 2000);
        }
      }
      this.rTech = null;
      this.rProg = 0;
      this.checkPhaseUp();
      this.renderBuildings();
      this.renderTechs();
    }
  },

  // ===== EVOLUTION =====
  // 进化需求随等级递增，低级只需DNA，高级加入蛋白质
  evoCost() {
    const lv = this.eL;
    const cost = { dna: Math.ceil(12 + lv * 10) }; // Lv1→22, Lv2→32, Lv3→42...
    if (lv >= 2) cost.protein = Math.ceil(10 + (lv - 2) * 15); // Lv2→10, Lv3→25, Lv4→40...
    return cost;
  },

  // 进化效率奖励随等级递增
  evoBonus() {
    const lv = this.eL;
    if (lv <= 2) return 0.10;  // Lv1-2: +10%
    if (lv <= 4) return 0.15;  // Lv3-4: +15%
    return 0.20;               // Lv5+:  +20%
  },

  canEvolve() {
    // 只需资源即可进化，无需等待进化值
    const cost = this.evoCost();
    for (let k in cost) if ((this.res[k] || 0) < cost[k]) return false;
    return true;
  },

  evolve() {
    if (!this.canEvolve()) return;
    const cost = this.evoCost();
    for (let k in cost) this.res[k] -= cost[k];
    let bonus = this.evoBonus();
    // 进化催化剂科技：加成翻倍
    bonus *= (this._evoBoostMult || 1);
    this.eL++;
    // 【修复】效率改为加法叠加（不再是乘法爆炸）
    this.gEff += bonus;
    const pct = Math.round(bonus * 100);
    this.log('◆ 进化到 Lv.' + this.eL + ' — 效率+' + pct + '%', 's');
    SFX.evolve();
    this.showEvent('进化突破！', '菌落进化到等级 ' + this.eL + '\n全局效率提升' + pct + '%', 'var(--purple)');
    this.stats.totalEvo++;
    this.screenShake(10);
    // 进化等级是阶段推进条件之一，检查是否可以升阶段
    this.checkPhaseUp();
    this.renderBuildings();
    this.renderTechs();
    this.updateUI();
  },

  // ===== WONDER =====
  tickWonder() {
    if (!this.wBuild) return;
    this.wProg += 1;  // 在 spd 循环内已被调用 spd 次，每次 +1 即可
    const bd = BLDS[this.wBuild];
    const wt = bd?.wonderTime || 120;
    const pct = Math.min(this.wProg / wt * 100, 100);
    document.getElementById('wonderFill').style.width = pct + '%';
    document.getElementById('wonderPct').textContent = Math.floor(pct) + '%';

    if (this.wProg >= wt) {
      this.wonderComplete = true;
      this.log('★★★ 奇观完成: ' + bd.n + ' ★★★', 's');
      SFX.wonderDone();
      this.showEvent('🏛️ 奇观落成！', bd.n + '\n\n' + bd.d + '\n\n你征服了微生物宇宙！这是文明的巅峰！', 'var(--purple)');
      document.getElementById('wonderOverlay').classList.remove('show');
      this.wBuild = null;
      this.wProg = 0;
      this.showMilestone('🌟', '游戏完成！微生物帝国达到巅峰！');
      this.updateGuide();
    }
  },

  // ===== PHASE CHECK =====
  // 每个阶段需要的最低进化等级
  phaseEvoReq: { 2: 2, 3: 3, 4: 4, 5: 5 },

  // 获取下一阶段的升级条件列表（返回 [{label, met}]）
  getPhaseUpReqs() {
    const reqs = [];
    const BLDNAMES = { glucoseCollector:'碳源采集器', energyStation:'ATP合成酶', simpleExtractor:'简易提取器',
      proteinFactory:'蛋白质工厂', geneExtractor:'基因提取器', biofilmReactor:'生物膜反应器',
      transport:'菌丝运输网', qsController:'群体感应塔' };
    const TECHNAMES = { pureCulture:'纯培养技术', quorumSensing:'群体感应' };

    if (this.phase === 1) {
      reqs.push({ label: `进化等级 ≥ Lv.2`, met: this.eL >= 2 });
      reqs.push({ label: `建造 ${BLDNAMES.glucoseCollector}`, met: this.bldCount('glucoseCollector') > 0 });
      reqs.push({ label: `建造 ${BLDNAMES.energyStation}`, met: this.bldCount('energyStation') > 0 });
      reqs.push({ label: `建造 ${BLDNAMES.simpleExtractor}`, met: this.bldCount('simpleExtractor') > 0 });
      reqs.push({ label: `研究 ${TECHNAMES.pureCulture}`, met: this.techs.pureCulture.done });
    } else if (this.phase === 2) {
      reqs.push({ label: `进化等级 ≥ Lv.3`, met: this.eL >= 3 });
      reqs.push({ label: `建造 ${BLDNAMES.proteinFactory}`, met: this.bldCount('proteinFactory') > 0 });
      reqs.push({ label: `建造 ${BLDNAMES.geneExtractor}`, met: this.bldCount('geneExtractor') > 0 });
    } else if (this.phase === 3) {
      reqs.push({ label: `进化等级 ≥ Lv.4`, met: this.eL >= 4 });
      reqs.push({ label: `建造 ${BLDNAMES.biofilmReactor}`, met: this.bldCount('biofilmReactor') > 0 });
      reqs.push({ label: `建造 ${BLDNAMES.transport}`, met: this.bldCount('transport') > 0 });
    } else if (this.phase === 4) {
      reqs.push({ label: `进化等级 ≥ Lv.5`, met: this.eL >= 5 });
      reqs.push({ label: `建造 ${BLDNAMES.qsController}`, met: this.bldCount('qsController') > 0 });
      reqs.push({ label: `研究 ${TECHNAMES.quorumSensing}`, met: this.techs.quorumSensing.done });
    }
    return reqs;
  },

  // 检查是否可以升级核心（所有条件达成）
  canPhaseUp() {
    if (this.phase >= 5) return false;
    const reqs = this.getPhaseUpReqs();
    return reqs.length > 0 && reqs.every(r => r.met);
  },

  // 手动升级核心
  manualCoreUpgrade() {
    if (!this.canPhaseUp()) return;
    this.phase++;
    const p = PHASES[this.phase - 1];
    this.showMilestone(p.icon, '进入阶段 ' + p.id + ': ' + p.name);
    this.log('◆ 进入阶段 ' + p.id + ': ' + p.name + ' — ' + p.desc, 's');
    SFX.phaseUp();
    SFX.updateBGMPhase(this.phase);
    // 核心菌落升级提示
    const cc = CORE_COLONY[this.phase];
    if (cc) {
      this.log(`◆ 核心菌落进化: ${cc.name} ${cc.emoji}`, 's');
      this.showEvent('核心进化: ' + cc.name, cc.desc + '\n\n你的帝国中枢变得更加强大！', cc.color);
      this.screenShake(8);
      setTimeout(() => SFX.coreUpgrade(), 600);
    }
    this.updatePhase();
    this.renderResources();
    this.renderBuildings();
    this.renderTechs();
    this.renderGrid();
    this.renderCoreColony(true);
    this.updateCoreUpgradeUI();
  },

  // 旧的自动检查（现在仅用于内部条件判断，不再自动升级）
  checkPhaseUp() {
    // 不再自动升级 — 由玩家手动点击升级按钮
    // 仅更新升级面板UI
    this.updateCoreUpgradeUI();
  },

  // 更新帝国核心升级面板UI
  updateCoreUpgradeUI() {
    const panel = document.getElementById('coreUpgradePanel');
    const reqsEl = document.getElementById('coreUpgradeReqs');
    const btn = document.getElementById('coreUpgradeBtn');
    if (!panel || !reqsEl || !btn) return;

    if (this.phase >= 5) {
      // 已达最高阶段
      reqsEl.innerHTML = '<div style="font-size:0.65em;color:var(--purple);text-align:center;padding:4px 0">🌟 已达最高阶段</div>';
      btn.textContent = '✨ 帝国巅峰';
      btn.className = 'core-upgrade-btn maxed';
      btn.disabled = true;
      return;
    }

    const reqs = this.getPhaseUpReqs();
    const nextPhase = this.phase + 1;
    const nextCC = CORE_COLONY[nextPhase];
    const allMet = reqs.every(r => r.met);

    // 显示下一阶段名称
    panel.querySelector('.core-upgrade-title').textContent =
      `▸ 升级到 P${nextPhase} · ${nextCC ? nextCC.name : '???'} 需要:`;

    // 渲染条件列表
    let html = '';
    for (const r of reqs) {
      html += `<div class="core-req-item ${r.met ? 'met' : 'unmet'}">${r.label}</div>`;
    }
    reqsEl.innerHTML = html;

    // 按钮状态
    if (allMet) {
      btn.textContent = `升级核心 ▸ P${nextPhase} · ${nextCC ? nextCC.name : ''}`;
      btn.className = 'core-upgrade-btn ready';
      btn.disabled = false;
    } else {
      const metCount = reqs.filter(r => r.met).length;
      btn.textContent = `条件不足 (${metCount}/${reqs.length})`;
      btn.className = 'core-upgrade-btn locked';
      btn.disabled = true;
    }
  },

  updatePhase() {
    const p = PHASES[this.phase - 1];
    const badge = document.getElementById('phaseBadge');
    badge.textContent = '阶段 ' + p.id + ' · ' + p.name;
    badge.style.color = p.color;
    badge.style.borderColor = p.color + '40';
    document.getElementById('rowQS').style.display = this.phase >= 4 ? 'flex' : 'none';

    // 显示下一阶段进化要求
    const nextPhase = this.phase + 1;
    const nextEvoReq = this.phaseEvoReq[nextPhase];
    const evoHint = document.getElementById('phaseEvoHint');
    if (evoHint && nextEvoReq && nextPhase <= 5) {
      const metEvo = this.eL >= nextEvoReq;
      evoHint.innerHTML = `<span style="color:${metEvo ? 'var(--green)' : 'var(--orange)'}">进入阶段${nextPhase}需要: 进化Lv.${nextEvoReq} ${metEvo ? '✓' : '(当前Lv.'+this.eL+')'}</span>`;
      evoHint.style.display = 'block';
    } else if (evoHint) {
      evoHint.style.display = 'none';
    }
  },

  // ===== GUIDE =====
  updateGuide() {
    const steps = GUIDE[this.phase] || [];
    let guideText = '';
    let guideIcon = '🎯';

    for (const step of steps) {
      if (step.check(this)) {
        guideText = step.text;
        guideIcon = step.icon;
        break;
      }
    }

    if (!guideText) {
      if (this.phase < 5) {
        guideText = '继续发展来进入下一阶段！';
        guideIcon = '⏩';
      } else if (this.wonderComplete) {
        guideText = '🎉 恭喜！你完成了微生物帝国的全部征程！';
        guideIcon = '🌟';
      } else {
        guideText = '继续积累资源建造奇观！';
        guideIcon = '🏛️';
      }
    }

    document.getElementById('guideText').textContent = guideText;

    const stepsEl = document.getElementById('guideSteps');
    stepsEl.innerHTML = '';
    PHASES.forEach(p => {
      const step = document.createElement('div');
      const isDone = p.id < this.phase;
      const isCurrent = p.id === this.phase;
      const isFuture = p.id > this.phase;
      step.className = 'guide-step' + (isDone ? ' done' : '') + (isCurrent ? ' current' : '') + (isFuture ? ' future' : '');
      step.innerHTML = `<div class="step-dot ${isDone?'done':isCurrent?'current':'future'}"></div>
        <span>${p.icon} ${p.name}</span>`;
      stepsEl.appendChild(step);
    });
  },

  // ===== MAIN LOOP =====
  startLoop() {
    setInterval(() => {
      if (this.paused) return;

      for (let s = 0; s < this.spd; s++) {
        this.updateRates();

        // Apply rates
        for (let k in this.rates) {
          this.res[k] = (this.res[k]||0) + this.rates[k];
          if (this.res[k] < 0) this.res[k] = 0;
        }

        // Population from buildings — 有上限且消耗葡萄糖
        const bCount = this.totalBuildings();
        const popCap = this._popCap();
        if (this.pop < popCap) {
          const growth = bCount * 0.03 * this.gEff;
          this.pop = Math.min(this.pop + growth, popCap);
        }
        // 人口消耗葡萄糖 (每100人口消耗0.5葡萄糖/s)
        const popFoodCost = this.pop * 0.005;
        if (this.res.glucose >= popFoodCost) {
          this.res.glucose -= popFoodCost;
        } else {
          // 食物不足，人口缓慢下降
          this.pop = Math.max(0, this.pop - 0.5);
        }

        // QS信号自然衰减 — 需要持续运转QS塔来维持高水位（受信号增幅器科技影响）
        if ((this.res.qs || 0) > 0) {
          const qsDecay = 0.08 * (this._qsDecayMult || 1);
          this.res.qs = Math.max(0, this.res.qs - qsDecay);
        }

        this.tickResearch();
        this.tickWonder();
        this.tickChallenge(); // Challenge system
        this.rt++;
      }

      // ===== 随机事件 — 独立于加速倍率，每真实秒只掷骰一次 =====
      // Random events (enhanced with more events + choice events)
      if (Math.random() < 0.006) {
        const allEvents = [...EVENTS, ...EVENTS_EXTRA].filter(e => e.phase <= this.phase);
        if (allEvents.length) {
          const ev = allEvents[Math.floor(Math.random() * allEvents.length)];
          ev.fn(this);
          this.log('▸ ' + ev.n + ' — ' + ev.d, ev.ty === 'e' ? 'e' : ev.ty === 'w' ? 'w' : 's');
          if (ev.ty === 'e') SFX.eventBad();
          else SFX.eventGood();
          if (ev.ty === 'e' || ev.ty === 'ev') {
            this.showEvent(ev.n, ev.d, ev.ty === 'e' ? 'var(--red)' : 'var(--cyan)');
          }
        }
      }

      // Choice events (rarer)
      if (Math.random() < 0.0015 && !this.pendingChoice) {
        this.triggerChoiceEvent();
      }

      this.animTick++;
      if (this.animTick % 2 === 0) this.triggerAnims();

      // === 新系统 ===
      this.checkAchievements();
      // 在线时长累计（独立于奖励逻辑，始终运行）
      this.stats.onlineTime++;
      this.updateStats();
      if (this.animTick % 5 === 0) this.renderStats();
      if (this.animTick % 3 === 0) this.updateCellRates();

      // Evolution button
      document.getElementById('evoBtn').disabled = !this.canEvolve();
      // 进化面板闪光特效
      const evoBox = document.querySelector('.evo-box');
      if (evoBox) {
        if (this.canEvolve()) {
          evoBox.classList.add('can-evolve');
        } else {
          evoBox.classList.remove('can-evolve');
        }
      }

      this.updateUI();
    }, 1000);
  },

  // ===== PARTICLES =====
  triggerAnims() {
    const gridEl = document.getElementById('grid');
    if (!gridEl) return;
    const gRect = gridEl.getBoundingClientRect();

    this.grid.forEach((g, idx) => {
      if (!g) return;
      const bd = BLDS[g.type];
      if (!bd || bd.isBoost) return;
      const cell = gridEl.children[idx];
      if (!cell) return;
      const cr = cell.getBoundingClientRect();
      const cx = cr.left + cr.width/2 - gRect.left;
      const cy = cr.top + cr.height/2 - gRect.top;

      for (let i = 0; i < 2; i++) {
        const a = Math.random() * Math.PI * 2;
        const dist = 10 + Math.random() * 18;
        this.particles.push({
          x:cx, y:cy, tx:cx+Math.cos(a)*dist, ty:cy+Math.sin(a)*dist,
          p:0, spd:0.03+Math.random()*0.02, c:bd.color, sz:1.2+Math.random()*1.2
        });
      }

      for (let res in bd.prod) {
        if (RES[res]) {
          this.showFloat(idx, '+' + RES[res].icon, RES[res].c);
          this.flashRes(res);
        }
      }
    });
  },

  showFloat(idx, text, color) {
    const gridEl = document.getElementById('grid');
    const cell = gridEl?.children[idx];
    if (!cell) return;
    const el = document.createElement('div');
    el.className = 'float-num';
    el.style.color = color;
    el.textContent = text;
    el.style.left = '50%';
    el.style.top = '5%';
    el.style.transform = 'translateX(-50%)';
    cell.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  },

  // 大型资源获取时的金色飘浮数字
  showGoldenFloat(text, x, y) {
    const el = document.createElement('div');
    el.className = 'golden-float';
    el.textContent = text;
    el.style.left = (x || window.innerWidth / 2) + 'px';
    el.style.top = (y || window.innerHeight / 2) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  },

  flashRes(k) {
    const el = document.getElementById('resFlash-' + k);
    if (!el) return;
    el.classList.add('on');
    setTimeout(() => el.classList.remove('on'), 250);
  },

  animLoop() {
    const canvas = document.getElementById('partCanvas');
    const ctx = canvas.getContext('2d');
    const bgCanvas = document.getElementById('bgCanvas');
    const bgCtx = bgCanvas.getContext('2d');

    const resize = () => {
      const inner = document.getElementById('dishScrollInner');
      if (!inner) return;
      canvas.width = inner.offsetWidth;
      canvas.height = inner.offsetHeight;
      bgCanvas.width = inner.offsetWidth;
      bgCanvas.height = inner.offsetHeight;
    };

    // ===== 传送带点击检测 =====
    // 单击检测是否命中某条传送带（在格子空白区域时生效）
    const dishView = canvas.parentElement;
    dishView.addEventListener('click', (e) => {
      // 手动连接模式下点击空白区域取消
      if (this._beltConnectMode && !e.target.closest('.cell')) {
        this.cancelBeltConnect();
        return;
      }
      // 如果点击的是格子内部，不处理
      if (e.target.closest('.cell')) return;
      
      const rect = dishView.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      // 检查点击是否命中某条传送带（使用更大的命中区域）
      const result = findNearestBelt(clickX, clickY, 24);
      
      if (result) {
        e.stopPropagation();
        e.preventDefault();
        SFX.select();
        this.showBeltActionMenu(result.key, result.obj, e.clientX, e.clientY);
      }
    }, true);
    
    // 点到线段的距离
    const pointToSegmentDist = (px, py, ax, ay, bx, by) => {
      const abx = bx - ax, aby = by - ay;
      const apx = px - ax, apy = py - ay;
      const t = Math.max(0, Math.min(1, (apx*abx + apy*aby) / (abx*abx + aby*aby + 0.001)));
      const projX = ax + t * abx, projY = ay + t * aby;
      return Math.sqrt((px - projX)**2 + (py - projY)**2);
    };

    // 通用函数：在指定坐标找到最近的传送带
    const findNearestBelt = (mouseX, mouseY, threshold) => {
      const belts = this._activeBelts || [];
      const gridEl = document.getElementById('grid');
      if (!gridEl) return null;
      const gRect = gridEl.getBoundingClientRect();
      let hitBelt = null;
      let hitBeltObj = null;
      let minDist = threshold;
      for (const belt of belts) {
        const c1 = getCellCenter(belt.fi, gridEl, gRect);
        const c2 = getCellCenter(belt.ti, gridEl, gRect);
        if (!c1 || !c2) continue;
        const dx = c2.x - c1.x, dy = c2.y - c1.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 5) continue;
        const ux = dx/dist, uy = dy/dist;
        const edgeOff = Math.min(c1.w, c1.h) * 0.50;
        const sx = c1.x + ux * edgeOff, sy = c1.y + uy * edgeOff;
        const ex = c2.x - ux * edgeOff, ey = c2.y - uy * edgeOff;
        const adx = Math.abs(dx), ady = Math.abs(dy);
        const isOrtho = (adx < 3 || ady < 3);
        const mx = ex, my = sy;
        const segments = isOrtho ? [[sx, sy, ex, ey]] : [[sx, sy, mx, my], [mx, my, ex, ey]];
        for (const seg of segments) {
          const segDist = pointToSegmentDist(mouseX, mouseY, seg[0], seg[1], seg[2], seg[3]);
          if (segDist < minDist) {
            minDist = segDist;
            const key = Math.min(belt.fi, belt.ti) + '-' + Math.max(belt.fi, belt.ti);
            hitBelt = key;
            hitBeltObj = belt;
          }
        }
      }
      return hitBelt ? { key: hitBelt, obj: hitBeltObj } : null;
    };

    // ===== 传送带悬停检测 =====
    dishView.addEventListener('mousemove', (e) => {
      if (this._beltConnectMode) return;
      if (e.target.closest('.cell')) {
        // 鼠标在格子上，清除传送带悬停
        if (this._hoverBeltKey) {
          this._hoverBeltKey = null;
          dishView.style.cursor = '';
        }
        return;
      }
      const rect = dishView.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const result = findNearestBelt(mx, my, 24);
      const newKey = result ? result.key : null;
      if (newKey !== this._hoverBeltKey) {
        this._hoverBeltKey = newKey;
        dishView.style.cursor = newKey ? 'pointer' : '';
      }
    });
    dishView.addEventListener('mouseleave', () => {
      if (this._hoverBeltKey) {
        this._hoverBeltKey = null;
        dishView.style.cursor = '';
      }
    });

    const drawBg = () => {
      bgCtx.fillStyle = 'rgba(5,8,16,0.95)';
      bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
      bgCtx.strokeStyle = 'rgba(20,40,60,0.12)';
      bgCtx.lineWidth = 0.5;
      for (let x = 0; x < bgCanvas.width; x += 40) {
        bgCtx.beginPath(); bgCtx.moveTo(x,0); bgCtx.lineTo(x,bgCanvas.height); bgCtx.stroke();
      }
      for (let y = 0; y < bgCanvas.height; y += 40) {
        bgCtx.beginPath(); bgCtx.moveTo(0,y); bgCtx.lineTo(bgCanvas.width,y); bgCtx.stroke();
      }

      // === 格子间隙通道纹理 ===
      const gridEl = document.getElementById('grid');
      if (gridEl && gridEl.children.length > 0) {
        const gRect = gridEl.getBoundingClientRect();
        const pRect = bgCanvas.parentElement.getBoundingClientRect();
        const offX = gRect.left - pRect.left;
        const offY = gRect.top - pRect.top;
        const SZ = this.gridSize;  // cols
        const ROWS = this.gridRows;

        // 遍历相邻格子对，在间隙画通道底纹
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < SZ; c++) {
            const idx = r * SZ + c;
            const cell = gridEl.children[idx];
            if (!cell) continue;
            const cr = cell.getBoundingClientRect();
            const cx = cr.left - pRect.left;
            const cy = cr.top - pRect.top;
            const cw = cr.width;
            const ch = cr.height;

            // 水平间隙（右侧）
            if (c < SZ - 1) {
              const gapX = cx + cw;
              const gapW = 10; // gap size
              // 通道底纹 — 极淡的凹槽
              bgCtx.fillStyle = 'rgba(8,14,26,0.4)';
              bgCtx.fillRect(gapX, cy + ch * 0.15, gapW, ch * 0.7);
              // 两侧极细线 — 通道边轨
              bgCtx.strokeStyle = 'rgba(20,36,55,0.2)';
              bgCtx.lineWidth = 0.5;
              bgCtx.beginPath();
              bgCtx.moveTo(gapX + 1, cy + ch * 0.15);
              bgCtx.lineTo(gapX + 1, cy + ch * 0.85);
              bgCtx.stroke();
              bgCtx.beginPath();
              bgCtx.moveTo(gapX + gapW - 1, cy + ch * 0.15);
              bgCtx.lineTo(gapX + gapW - 1, cy + ch * 0.85);
              bgCtx.stroke();
            }

            // 垂直间隙（下方）
            if (r < ROWS - 1) {
              const gapY = cy + ch;
              const gapH = 10;
              bgCtx.fillStyle = 'rgba(8,14,26,0.4)';
              bgCtx.fillRect(cx + cw * 0.15, gapY, cw * 0.7, gapH);
              bgCtx.strokeStyle = 'rgba(20,36,55,0.2)';
              bgCtx.lineWidth = 0.5;
              bgCtx.beginPath();
              bgCtx.moveTo(cx + cw * 0.15, gapY + 1);
              bgCtx.lineTo(cx + cw * 0.85, gapY + 1);
              bgCtx.stroke();
              bgCtx.beginPath();
              bgCtx.moveTo(cx + cw * 0.15, gapY + gapH - 1);
              bgCtx.lineTo(cx + cw * 0.85, gapY + gapH - 1);
              bgCtx.stroke();
            }
          }
        }
      }
    };

    // ===== CONVEYOR BELT SYSTEM v2 — 不重叠规则 =====
    const SZ = this.gridSize;

    // 格子索引 → 行列
    const idx2rc = (i) => ({ r: Math.floor(i / SZ), c: i % SZ });
    const rc2idx = (r, c) => r * SZ + c;
    // 曼哈顿距离
    const manhattan = (a, b) => {
      const A = idx2rc(a), B = idx2rc(b);
      return Math.abs(A.r - B.r) + Math.abs(A.c - B.c);
    };

    // 查找网格中建筑类型→格子索引的映射
    const findBuildingCells = () => {
      const map = {};
      for (let i = 0; i < this.grid.length; i++) {
        if (this.grid[i]) {
          const t = this.grid[i].type;
          if (!map[t]) map[t] = [];
          map[t].push(i);
        }
      }
      return map;
    };

    // 获取格子中心坐标（相对于canvas）
    const getCellCenter = (idx, gridEl, gRect) => {
      const cell = gridEl.children[idx];
      if (!cell) return null;
      const r = cell.getBoundingClientRect();
      return { x: r.left + r.width/2 - gRect.left, y: r.top + r.height/2 - gRect.top, w: r.width, h: r.height };
    };

    // ===== 核心：计算不重叠的传送带连接 =====
    // 规则:
    //   1. 每个 from 建筑实例对每种 flow 只连最近的 to 建筑实例（1:1最近匹配）
    //   2. 同一对格子之间只出一条传送带，多种资源合流显示（混合颜色/图标）
    //   3. 传送带路径不穿过其他已有建筑的格子
    //   4. 全局记录已占用的"格子间通道"，同通道不重复生成
    const computeBelts = () => {
      const bldMap = findBuildingCells();
      const occupiedCells = new Set();
      for (let i = 0; i < this.grid.length; i++) {
        if (this.grid[i]) occupiedCells.add(i);
      }

      // Step 1: 为每个 flow，每个 from 实例找最近的 to 实例（1:1）
      const rawLinks = []; // { fi, ti, flow }
      for (const flow of FLOW_MAP) {
        const froms = bldMap[flow.from];
        const tos = bldMap[flow.to];
        if (!froms || !tos) continue;

        // 使用贪心最近匹配：每个 from 找最近的未配对 to
        // 先按距离排序所有 from-to 对，贪心匹配
        const pairs = [];
        for (const fi of froms) {
          for (const ti of tos) {
            pairs.push({ fi, ti, dist: manhattan(fi, ti) });
          }
        }
        pairs.sort((a, b) => a.dist - b.dist);

        const usedFrom = new Set();
        const usedTo = new Set();
        for (const p of pairs) {
          if (usedFrom.has(p.fi) || usedTo.has(p.ti)) continue;
          // 距离限制：超过4格不连（太远没意义）
          if (p.dist > 4) continue;
          rawLinks.push({ fi: p.fi, ti: p.ti, flow });
          usedFrom.add(p.fi);
          usedTo.add(p.ti);
        }
      }

      // Step 2: 按格子对合并 — 同一对格子只出一条带
      const pairMap = {}; // "min-max" -> { fi, ti, flows:[], colors:[], icons:[], labels:[] }
      const usedEdges = new Set(); // 已占用的通道，"min-max" 形式

      for (const link of rawLinks) {
        const key = Math.min(link.fi, link.ti) + '-' + Math.max(link.fi, link.ti);

        // 跳过被用户撤销的自动传送带
        if (this.removedBelts[key]) continue;

        // Step 3: 路径碰撞检测 — 传送带不能穿过其他建筑
        if (!pairMap[key]) {
          // 新传送带，检查路径上是否有障碍
          const blocked = isBeltPathBlocked(link.fi, link.ti, occupiedCells);
          if (blocked) continue; // 路径被挡住，不生成这条传送带
        }

        if (!pairMap[key]) {
          pairMap[key] = { fi: link.fi, ti: link.ti, flows: [], colors: [], icons: [], labels: [], isManual: false };
          usedEdges.add(key);
        }
        const entry = pairMap[key];
        // 避免同色重复
        if (!entry.colors.includes(link.flow.color)) {
          entry.colors.push(link.flow.color);
          entry.icons.push(link.flow.icon);
          entry.labels.push(link.flow.label);
        }
        entry.flows.push(link.flow);
      }

      // Step 4: 添加手动连接的传送带
      for (const [key, mb] of Object.entries(this.manualBelts)) {
        // 确保两端建筑仍然存在
        if (!this.grid[mb.fi] || !this.grid[mb.ti]) continue;
        if (!pairMap[key]) {
          pairMap[key] = { fi: mb.fi, ti: mb.ti, flows: [], colors: mb.colors || [], icons: mb.icons || [], labels: mb.labels || [], isManual: true };
          usedEdges.add(key);
        } else {
          pairMap[key].isManual = true; // 标记为也含手动
        }
      }

      return { belts: Object.values(pairMap), usedEdges };
    };
    // 暴露给外部调用（撤销/连接后立即刷新）
    this._computeBelts = computeBelts;

    // 检测传送带路径是否被其他建筑阻挡
    // 使用Bresenham-like格子遍历，检查from→to直线经过的中间格子是否有其他建筑
    const isBeltPathBlocked = (fi, ti, occupiedCells) => {
      const A = idx2rc(fi), B = idx2rc(ti);
      // 邻接(曼哈顿≤1)不检查
      if (Math.abs(A.r - B.r) + Math.abs(A.c - B.c) <= 1) return false;

      // 遍历路径上的中间格子（不含端点）
      const dr = B.r - A.r, dc = B.c - A.c;
      const steps = Math.max(Math.abs(dr), Math.abs(dc));
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        const mr = Math.round(A.r + dr * t);
        const mc = Math.round(A.c + dc * t);
        const midIdx = rc2idx(mr, mc);
        // 中间格子有建筑 且不是起终点 → 阻挡
        if (midIdx !== fi && midIdx !== ti && occupiedCells.has(midIdx)) {
          return true;
        }
      }
      // 对角线情况额外检查：2格对角时检查两个相邻格
      if (Math.abs(dr) === 1 && Math.abs(dc) === 1) return false; // 直接对角邻居OK
      return false;
    };

    // 混合多种颜色为渐变色 或 取主色
    const blendColors = (colors) => {
      if (colors.length === 1) return colors[0];
      // 多色时取第一种作为主色，绘制时会用条纹区分
      return colors[0];
    };

    // ===== 绘制传送带 =====
    const drawConveyorBelts = () => {
      const gridEl = document.getElementById('grid');
      if (!gridEl) return;
      const gRect = gridEl.getBoundingClientRect();
      const t = Date.now();
      const activeFlows = [];

      const { belts, usedEdges } = computeBelts();
      // 缓存usedEdges给proximity使用
      this._beltEdges = usedEdges;
      this._activeBelts = belts;

      for (const belt of belts) {
        const c1 = getCellCenter(belt.fi, gridEl, gRect);
        const c2 = getCellCenter(belt.ti, gridEl, gRect);
        if (!c1 || !c2) continue;

        const dx = c2.x - c1.x, dy = c2.y - c1.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 5) continue;

        const edgeOff = Math.min(c1.w, c1.h) * 0.50;

        // === 工业 L 形直角路径计算 ===
        // 起终点贴近格子边缘
        const ux = dx/dist, uy = dy/dist;
        const sx = c1.x + ux * edgeOff;
        const sy = c1.y + uy * edgeOff;
        const ex = c2.x - ux * edgeOff;
        const ey = c2.y - uy * edgeOff;

        const mainColor = blendColors(belt.colors);
        const isMulti = belt.colors.length > 1;
        
        // 传送带等级影响视觉
        const beltKey = Math.min(belt.fi, belt.ti) + '-' + Math.max(belt.fi, belt.ti);
        const beltLv = this.getBeltLevel(beltKey);
        const beltEff = this.getBeltEfficiency(beltKey);
        const lvScale = 0.7 + beltLv * 0.15; // Lv1=0.85, Lv5=1.45
        const trackW = (isMulti ? 6 : 4) * lvScale;  // 轨道宽度随等级增长
        const innerW = (isMulti ? 4 : 2.5) * lvScale;

        // 判断是否需要 L 形拐弯（非直线方向）
        const adx = Math.abs(dx), ady = Math.abs(dy);
        const isOrthogonal = (adx < 3 || ady < 3); // 水平或垂直对齐
        // L形拐弯中间点
        const mx = ex, my = sy; // 先水平再垂直

        // 绘制路径的辅助函数（直线段组成的L形）
        const drawLPath = () => {
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          if (isOrthogonal) {
            ctx.lineTo(ex, ey);
          } else {
            ctx.lineTo(mx, my);
            ctx.lineTo(ex, ey);
          }
        };

        // === 工业传送带轨道渲染 ===
        const segments = isOrthogonal
          ? [[sx, sy, ex, ey]]
          : [[sx, sy, mx, my], [mx, my, ex, ey]];

        // -- 1) 轨道底板（深色钢板） --
        ctx.lineWidth = trackW + 4;
        ctx.strokeStyle = 'rgba(8,14,24,0.9)';
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
        ctx.setLineDash([]);
        drawLPath(); ctx.stroke();

        // -- 2) 轨道主体（金属色） --
        ctx.lineWidth = trackW + 2;
        ctx.strokeStyle = `rgba(30,45,65,0.85)`;
        drawLPath(); ctx.stroke();

        // -- 3) 橡胶带面（深色传送带表面） --
        ctx.lineWidth = trackW - 1;
        ctx.strokeStyle = `rgba(18,28,42,0.95)`;
        drawLPath(); ctx.stroke();

        // -- 4) 滚筒横纹 — 工业传送带核心视觉 --
        // 每隔固定距离画横向滚筒线
        const rollerSpacing = 6 + beltLv; // 等级越高间距越小（滚筒更密）
        // 滚动速度与效率成正比：Lv1(0.5x)慢, Lv3(1.0x)正常, Lv5(1.5x)快
        const beltAnimSpeed = 80 / beltEff; // Lv1→160(慢), Lv3→80(正常), Lv5→53(快)
        const animOffset = (t / beltAnimSpeed) % rollerSpacing; // 滚动动画

        for (const seg of segments) {
          const sdx = seg[2] - seg[0], sdy = seg[3] - seg[1];
          const slen = Math.sqrt(sdx*sdx + sdy*sdy);
          if (slen < 2) continue;
          // 单位方向 & 法线
          const ux2 = sdx/slen, uy2 = sdy/slen;
          const nx = -uy2, ny = ux2;
          const halfW = (trackW - 2) / 2;

          // 滚筒线
          for (let d = animOffset; d < slen; d += rollerSpacing) {
            const px = seg[0] + ux2 * d;
            const py = seg[1] + uy2 * d;
            // 滚筒金属线
            ctx.beginPath();
            ctx.moveTo(px + nx * halfW, py + ny * halfW);
            ctx.lineTo(px - nx * halfW, py - ny * halfW);
            ctx.strokeStyle = 'rgba(45,65,90,0.6)';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            // 滚筒高光（中间细亮线）
            ctx.beginPath();
            ctx.moveTo(px + nx * (halfW * 0.6), py + ny * (halfW * 0.6));
            ctx.lineTo(px - nx * (halfW * 0.6), py - ny * (halfW * 0.6));
            ctx.strokeStyle = 'rgba(70,100,140,0.35)';
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }

        // -- 5) 双轨道侧轨（钢轨） --
        const railOff = (trackW + 2) / 2;
        for (const seg of segments) {
          const sdx = seg[2] - seg[0], sdy = seg[3] - seg[1];
          const slen = Math.sqrt(sdx*sdx + sdy*sdy);
          if (slen < 1) continue;
          const pnx = -sdy/slen * railOff, pny = sdx/slen * railOff;
          // 外侧钢轨（暗色）
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = 'rgba(40,60,85,0.7)';
          ctx.beginPath();
          ctx.moveTo(seg[0]+pnx, seg[1]+pny); ctx.lineTo(seg[2]+pnx, seg[3]+pny);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(seg[0]-pnx, seg[1]-pny); ctx.lineTo(seg[2]-pnx, seg[3]-pny);
          ctx.stroke();
          // 内侧高光
          ctx.lineWidth = 0.5;
          ctx.strokeStyle = 'rgba(80,120,160,0.25)';
          ctx.beginPath();
          ctx.moveTo(seg[0]+pnx*0.85, seg[1]+pny*0.85); ctx.lineTo(seg[2]+pnx*0.85, seg[3]+pny*0.85);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(seg[0]-pnx*0.85, seg[1]-pny*0.85); ctx.lineTo(seg[2]-pnx*0.85, seg[3]-pny*0.85);
          ctx.stroke();
        }

        // -- 6) 带面主色调微光（传输资源的颜色映射到带面） --
        ctx.lineWidth = trackW - 3;
        if (isMulti) {
          // 多资源：交替色带段
          const totalLen = segments.reduce((s, seg) => {
            const dx2 = seg[2]-seg[0], dy2 = seg[3]-seg[1];
            return s + Math.sqrt(dx2*dx2+dy2*dy2);
          }, 0);
          const segLen = totalLen / belt.colors.length;
          ctx.setLineDash([Math.max(3, segLen), 2]);
          for (let ci = 0; ci < belt.colors.length; ci++) {
            ctx.strokeStyle = belt.colors[ci] + '18';
            ctx.lineDashOffset = -ci * segLen - (t / (120 / beltEff)) % segLen;
            drawLPath(); ctx.stroke();
          }
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = mainColor + '12';
          ctx.setLineDash([]);
          drawLPath(); ctx.stroke();
        }

        // -- 7) 起点端子（输入口） --
        const termSz = trackW / 2 + 1;
        const firstSeg = segments[0];
        const fux = (firstSeg[2]-firstSeg[0]), fuy = (firstSeg[3]-firstSeg[1]);
        const fuLen = Math.sqrt(fux*fux+fuy*fuy);
        if (fuLen > 1) {
          const fnx = -fuy/fuLen, fny = fux/fuLen;
          // 输入口方块
          ctx.fillStyle = 'rgba(25,40,60,0.9)';
          ctx.fillRect(sx - termSz, sy - termSz, termSz*2, termSz*2);
          ctx.strokeStyle = mainColor + '60';
          ctx.lineWidth = 1;
          ctx.strokeRect(sx - termSz, sy - termSz, termSz*2, termSz*2);
          // 入口标识线
          ctx.fillStyle = mainColor + '40';
          ctx.fillRect(sx - termSz + 1, sy - termSz + 1, termSz*2 - 2, 2);
        }

        // -- 8) 终点端子（输出口 + 箭头） --
        const lastSeg = segments[segments.length - 1];
        const arrDx = lastSeg[2] - lastSeg[0], arrDy = lastSeg[3] - lastSeg[1];
        const arrLen = Math.sqrt(arrDx*arrDx + arrDy*arrDy);
        if (arrLen > 1) {
          const adxn = arrDx/arrLen, adyn = arrDy/arrLen;
          // 输出口方块
          ctx.fillStyle = 'rgba(25,40,60,0.9)';
          ctx.fillRect(ex - termSz, ey - termSz, termSz*2, termSz*2);
          ctx.strokeStyle = mainColor + '60';
          ctx.lineWidth = 1;
          ctx.strokeRect(ex - termSz, ey - termSz, termSz*2, termSz*2);
          // 输出方向箭头
          const triSz = 5;
          ctx.fillStyle = mainColor + '70';
          ctx.beginPath();
          ctx.moveTo(ex + adxn*(termSz+triSz), ey + adyn*(termSz+triSz));
          ctx.lineTo(ex + adyn*triSz*0.7 + adxn*termSz, ey - adxn*triSz*0.7 + adyn*termSz);
          ctx.lineTo(ex - adyn*triSz*0.7 + adxn*termSz, ey + adxn*triSz*0.7 + adyn*termSz);
          ctx.closePath();
          ctx.fill();
        }

        // -- 9) L形拐角齿轮装饰 --
        if (!isOrthogonal) {
          const gearR = trackW / 2 + 1;
          ctx.beginPath();
          ctx.arc(mx, my, gearR, 0, Math.PI*2);
          ctx.fillStyle = 'rgba(20,35,55,0.9)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(50,75,105,0.6)';
          ctx.lineWidth = 1;
          ctx.stroke();
          // 齿轮十字线
          const gearAng = (t / 500) % (Math.PI * 2);
          ctx.strokeStyle = 'rgba(60,90,120,0.4)';
          ctx.lineWidth = 0.8;
          for (let gi = 0; gi < 4; gi++) {
            const ga = gearAng + gi * Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(mx + Math.cos(ga) * gearR * 0.8, my + Math.sin(ga) * gearR * 0.8);
            ctx.stroke();
          }
        }

        // -- 10) 等级指示灯（传送带侧面小LED） --
        if (beltLv > 1) {
          const midSeg = segments[0];
          const msdx = midSeg[2]-midSeg[0], msdy = midSeg[3]-midSeg[1];
          const msLen = Math.sqrt(msdx*msdx+msdy*msdy);
          if (msLen > 10) {
            const mnx = -msdy/msLen, mny = msdx/msLen;
            const ledOff = railOff + 2;
            const ledColors = ['', '#f97316', '#eab308', '#06d6a0', '#a855f7'];
            const ledColor = ledColors[beltLv - 1] || '#f97316';
            const ledCount = beltLv - 1;
            const ledSpacing = Math.min(8, msLen / (ledCount + 1));
            const ledStart = msLen / 2 - (ledCount - 1) * ledSpacing / 2;
            for (let li = 0; li < ledCount; li++) {
              const ld = ledStart + li * ledSpacing;
              const lx = midSeg[0] + msdx/msLen * ld + mnx * ledOff;
              const ly = midSeg[1] + msdy/msLen * ld + mny * ledOff;
              // LED glow
              ctx.beginPath();
              ctx.arc(lx, ly, 2.5, 0, Math.PI*2);
              ctx.fillStyle = ledColor + '30';
              ctx.fill();
              // LED core
              ctx.beginPath();
              ctx.arc(lx, ly, 1, 0, Math.PI*2);
              ctx.fillStyle = ledColor;
              ctx.globalAlpha = 0.6 + Math.sin(t / 300 + li) * 0.3;
              ctx.fill();
              ctx.globalAlpha = 1;
            }
          }
        }

        // -- 11) 悬停高亮光晕（鼠标靠近时发光提示可点击） --
        if (this._hoverBeltKey === beltKey) {
          ctx.save();
          // 宽大发光外框
          ctx.lineWidth = trackW + 10;
          ctx.strokeStyle = mainColor + '25';
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.setLineDash([]);
          drawLPath(); ctx.stroke();
          // 内层亮光
          ctx.lineWidth = trackW + 5;
          ctx.strokeStyle = mainColor + '40';
          drawLPath(); ctx.stroke();
          // 呼吸脉冲 — 外边缘
          const pulse = 0.3 + Math.sin(t / 250) * 0.2;
          ctx.lineWidth = trackW + 14;
          ctx.strokeStyle = mainColor + Math.round(pulse * 255 * 0.15).toString(16).padStart(2, '0');
          drawLPath(); ctx.stroke();
          // 悬停提示小标签（"点击操作"）
          const labelSeg = segments[Math.floor(segments.length / 2)];
          const lmx = (labelSeg[0] + labelSeg[2]) / 2;
          const lmy = (labelSeg[1] + labelSeg[3]) / 2;
          const lsdx = labelSeg[2] - labelSeg[0], lsdy = labelSeg[3] - labelSeg[1];
          const lsLen = Math.sqrt(lsdx*lsdx + lsdy*lsdy);
          // 在传送带法线方向偏移
          const lnx = lsLen > 1 ? -lsdy/lsLen : 0;
          const lny = lsLen > 1 ? lsdx/lsLen : -1;
          const tipX = lmx + lnx * (trackW/2 + 12);
          const tipY = lmy + lny * (trackW/2 + 12);
          // 背景小气泡
          ctx.font = 'bold 7px Rajdhani, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const tipText = '🖱 点击操作';
          const tw = ctx.measureText(tipText).width + 10;
          ctx.fillStyle = 'rgba(8,14,24,0.92)';
          const rr = tipX - tw/2, rrY = tipY - 7, rrW = tw, rrH = 14, rrR = 3;
          ctx.beginPath();
          ctx.moveTo(rr + rrR, rrY);
          ctx.lineTo(rr + rrW - rrR, rrY);
          ctx.quadraticCurveTo(rr + rrW, rrY, rr + rrW, rrY + rrR);
          ctx.lineTo(rr + rrW, rrY + rrH - rrR);
          ctx.quadraticCurveTo(rr + rrW, rrY + rrH, rr + rrW - rrR, rrY + rrH);
          ctx.lineTo(rr + rrR, rrY + rrH);
          ctx.quadraticCurveTo(rr, rrY + rrH, rr, rrY + rrH - rrR);
          ctx.lineTo(rr, rrY + rrR);
          ctx.quadraticCurveTo(rr, rrY, rr + rrR, rrY);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = mainColor + '80';
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.fillStyle = mainColor;
          ctx.globalAlpha = 0.9;
          ctx.fillText(tipText, tipX, tipY);
          ctx.globalAlpha = 1;
          ctx.restore();
        }

        // 多资源合流标记
        if (isMulti) {
          const midX = isOrthogonal ? (sx+ex)/2 : mx;
          const midY = isOrthogonal ? (sy+ey)/2 : my;
          ctx.globalAlpha = 0.8;
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#fff';
          ctx.fillText(belt.icons.join(''), midX, midY - (trackW/2 + 6));
          ctx.globalAlpha = 1;
        }

        // 收集活跃传送带用于粒子（使用L形路径中间点作为控制点）
        const cpx = isOrthogonal ? (sx+ex)/2 : mx;
        const cpy = isOrthogonal ? (sy+ey)/2 : my;
        for (let ci = 0; ci < belt.colors.length; ci++) {
          // 计算该条传送带上该资源的实际流量
          const targetColor = belt.colors[ci];
          const flow = belt.flows.find(f => f.color === targetColor);
          let flowRate = 0;

          if (flow) {
            // 有 FLOW_MAP 条目 — 用 from 端建筑产出计算
            const fromBd = BLDS[flow.from];
            if (fromBd && fromBd.prod[flow.res]) {
              // 确定 from 建筑的格子索引（fi 不一定是 from 端）
              const fromGrid = this.grid[belt.fi];
              const actualFromIdx = (fromGrid && fromGrid.type === flow.from) ? belt.fi : belt.ti;
              const bldMult = this.getUpgradeMultiplier(actualFromIdx);
              const beltMult2 = this.getBeltMultiplierForBuilding(actualFromIdx);
              const fullMult = this.gEff * (1 + Math.min(this.pop, this._popCap()) * 0.002) * bldMult * beltMult2 * this.lEff;
              const qsBoost = this.qsLv > 0 ? (1 + Math.min(this.qsLv * 0.03, 0.6)) : 1;
              const baseRate = fromBd.prod[flow.res] * fullMult * qsBoost;
              // 计算该 from 建筑同种资源输出到几条传送带
              let outputBeltCount = 0;
              for (const b2 of belts) {
                for (const f2 of b2.flows) {
                  if (f2.from === flow.from && f2.res === flow.res) {
                    const b2From = (this.grid[b2.fi] && this.grid[b2.fi].type === f2.from) ? b2.fi : b2.ti;
                    if (b2From === actualFromIdx) outputBeltCount++;
                  }
                }
              }
              flowRate = outputBeltCount > 0 ? baseRate / outputBeltCount : baseRate;
            }
          } else if (belt.isManual) {
            // 手动传送带 — 推断资源：匹配 fi 建筑的 prod 与颜色
            const fiBd = BLDS[this.grid[belt.fi]?.type];
            const tiBd = BLDS[this.grid[belt.ti]?.type];
            // 尝试 fi→ti 方向：fi.prod 匹配颜色
            let found = false;
            if (fiBd) {
              for (const res of Object.keys(fiBd.prod || {})) {
                const rc = RES[res]?.c;
                if (rc === targetColor) {
                  const bldMult = this.getUpgradeMultiplier(belt.fi);
                  const beltMult2 = this.getBeltMultiplierForBuilding(belt.fi);
                  const fullMult = this.gEff * (1 + Math.min(this.pop, this._popCap()) * 0.002) * bldMult * beltMult2 * this.lEff;
                  const qsBoost = this.qsLv > 0 ? (1 + Math.min(this.qsLv * 0.03, 0.6)) : 1;
                  flowRate = fiBd.prod[res] * fullMult * qsBoost;
                  found = true;
                  break;
                }
              }
            }
            // 尝试 ti→fi 方向
            if (!found && tiBd) {
              for (const res of Object.keys(tiBd.prod || {})) {
                const rc = RES[res]?.c;
                if (rc === targetColor) {
                  const bldMult = this.getUpgradeMultiplier(belt.ti);
                  const beltMult2 = this.getBeltMultiplierForBuilding(belt.ti);
                  const fullMult = this.gEff * (1 + Math.min(this.pop, this._popCap()) * 0.002) * bldMult * beltMult2 * this.lEff;
                  const qsBoost = this.qsLv > 0 ? (1 + Math.min(this.qsLv * 0.03, 0.6)) : 1;
                  flowRate = tiBd.prod[res] * fullMult * qsBoost;
                  break;
                }
              }
            }
          }
          // 计算传送带实际路径长度（像素），L形是两段之和
          let pathLen;
          if (isOrthogonal) {
            pathLen = Math.sqrt((ex-sx)**2 + (ey-sy)**2);
          } else {
            const seg1 = Math.sqrt((mx-sx)**2 + (my-sy)**2);
            const seg2 = Math.sqrt((ex-mx)**2 + (ey-my)**2);
            pathLen = seg1 + seg2;
          }
          activeFlows.push({
            sx, sy, ex, ey, cpx, cpy,
            color: belt.colors[ci],
            icon: belt.icons[ci],
            dist,
            isOrthogonal,
            mx, my,
            flowRate,  // 该传送带上该资源的实际流量（单位/秒）
            beltKey: beltKey,
            pathLen: Math.max(pathLen, 1)  // 传送带实际像素长度
          });
        }
      }

      return activeFlows;
    };

    // ===== 绘制传送带货物 =====
    const drawConveyorParticles = () => {
      for (let i = this.conveyorParticles.length - 1; i >= 0; i--) {
        const p = this.conveyorParticles[i];
        p.t += p.spd;
        if (p.t >= 1) { this.conveyorParticles.splice(i, 1); continue; }

        // L形路径插值
        let px, py, dirX = 0, dirY = 0;
        if (p.isOrthogonal) {
          px = p.sx + (p.ex - p.sx) * p.t;
          py = p.sy + (p.ey - p.sy) * p.t;
          dirX = p.ex - p.sx; dirY = p.ey - p.sy;
        } else {
          const seg1Len = Math.sqrt((p.mx-p.sx)**2 + (p.my-p.sy)**2);
          const seg2Len = Math.sqrt((p.ex-p.mx)**2 + (p.ey-p.my)**2);
          const totalLen = seg1Len + seg2Len;
          const traveled = p.t * totalLen;
          if (traveled <= seg1Len) {
            const frac = seg1Len > 0 ? traveled / seg1Len : 0;
            px = p.sx + (p.mx - p.sx) * frac;
            py = p.sy + (p.my - p.sy) * frac;
            dirX = p.mx - p.sx; dirY = p.my - p.sy;
          } else {
            const frac = seg2Len > 0 ? (traveled - seg1Len) / seg2Len : 1;
            px = p.mx + (p.ex - p.mx) * frac;
            py = p.my + (p.ey - p.my) * frac;
            dirX = p.ex - p.mx; dirY = p.ey - p.my;
          }
        }

        const dLen = Math.sqrt(dirX*dirX + dirY*dirY);
        const ux = dLen > 0 ? dirX/dLen : 1;
        const uy = dLen > 0 ? dirY/dLen : 0;

        // 货物箱尺寸
        const boxW = p.sz * 2.2;
        const boxH = p.sz * 1.6;
        const alpha = 0.7 + Math.sin(p.t * Math.PI) * 0.2;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.atan2(uy, ux));

        // 货箱阴影
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-boxW + 0.5, -boxH + 0.5, boxW*2, boxH*2);

        // 货箱主体
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color + 'CC';
        ctx.fillRect(-boxW, -boxH, boxW*2, boxH*2);

        // 货箱边框
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = alpha * 0.8;
        ctx.strokeRect(-boxW, -boxH, boxW*2, boxH*2);

        // 货箱中间横线（像包裹封条）
        ctx.beginPath();
        ctx.moveTo(-boxW, 0);
        ctx.lineTo(boxW, 0);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // 货箱顶部高光
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(-boxW, -boxH, boxW*2, boxH);

        ctx.globalAlpha = 1;

        ctx.restore();
      }
    };

    // 生成传送带货物 — 基于实际产出速率
    // 每条传送带的货物数量与该条带上的资源流量成正比
    // flowRate=1 表示每秒产1个资源，对应每秒生成约1个货物
    const _cargoAccumulators = {};  // beltKey+color → 累积量
    let _lastCargoTime = Date.now();

    const spawnConveyorParticles = (activeFlows) => {
      if (this.paused || !activeFlows.length) return;

      const now = Date.now();
      const dt = Math.min((now - _lastCargoTime) / 1000, 0.1); // 距上次的秒数，cap 0.1s防卡顿
      _lastCargoTime = now;

      // 统计每条传送带当前在轨货物数
      const perBeltCount = {};
      for (const p of this.conveyorParticles) {
        const k = p.beltKey || '';
        perBeltCount[k] = (perBeltCount[k] || 0) + 1;
      }

      for (const f of activeFlows) {
        const rate = (f.flowRate || 0) * this.spd; // 乘以游戏倍速
        if (rate <= 0.001) continue; // 产出极低或为零，不生成货物

        // === 传送带货物速度 = 与传送带效率直接挂钩 ===
        // 效率表: Lv1=0.5, Lv2=0.7, Lv3=1.0, Lv4=1.2, Lv5=1.5
        // 视觉速度与效率成正比：Lv1慢、Lv3正常、Lv5快
        const beltEff = f.beltKey ? this.getBeltEfficiency(f.beltKey) : 0.5;
        // 基准像素速度 0.8 px/帧 @60fps（Lv3效率1.0时），与效率线性缩放
        const pixVel = 0.8 * beltEff;
        // Lv1: 0.4 px/帧 → 慢, Lv3: 0.8 px/帧 → 正常, Lv5: 1.2 px/帧 → 快
        const pathLen = f.pathLen || 100;
        const travelTimeSec = pathLen / (pixVel * 60);
        // 在轨货物数 ≈ rate * travelTime（慢带上堆积更多货物）
        const expectedOnBelt = rate * travelTimeSec;
        const maxOnBelt = Math.max(1, Math.min(12, Math.ceil(expectedOnBelt * 1.3)));
        const currentCount = perBeltCount[f.beltKey || ''] || 0;
        if (currentCount >= maxOnBelt) continue;

        // 累积器：每帧按 rate * dt 累积，达到1时生成一个货物
        const accKey = (f.beltKey || '') + '_' + f.color;
        if (!_cargoAccumulators[accKey]) _cargoAccumulators[accKey] = 0;
        _cargoAccumulators[accKey] += rate * dt;

        // 每累积到1就生成一个货物
        if (_cargoAccumulators[accKey] >= 1) {
          _cargoAccumulators[accKey] -= 1;
          // 避免一次累积太多（卡顿时），最多补发2个
          if (_cargoAccumulators[accKey] > 2) _cargoAccumulators[accKey] = 0;

          // 货物速度 = 基准像素速度 × 效率 / 路径长度
          // 短带快到、长带慢到，低等级带明显慢
          const pixelVelocity = pixVel * (0.95 + Math.random() * 0.1);
          const spd = pixelVelocity / pathLen; // 归一化速度：每帧走的 t 增量

          this.conveyorParticles.push({
            sx: f.sx, sy: f.sy,
            ex: f.ex, ey: f.ey,
            mx: f.mx || (f.sx+f.ex)/2,
            my: f.my || (f.sy+f.ey)/2,
            isOrthogonal: f.isOrthogonal !== false,
            t: 0,
            spd: spd,
            color: f.color,
            sz: 1.8,
            beltKey: f.beltKey || '',
          });
          perBeltCount[f.beltKey || ''] = currentCount + 1;
        }
      }

      // 清理不再活跃的传送带的累积器
      const activeKeys = new Set(activeFlows.map(f => (f.beltKey || '') + '_' + f.color));
      for (const k in _cargoAccumulators) {
        if (!activeKeys.has(k)) delete _cargoAccumulators[k];
      }

      // 全局粒子上限
      if (this.conveyorParticles.length > 120) {
        this.conveyorParticles.splice(0, this.conveyorParticles.length - 80);
      }
    };

    // 绘制非传送带的临近建筑弱连接线
    const drawProximityLinks = () => {
      const gridEl = document.getElementById('grid');
      if (!gridEl) return;
      const gRect = gridEl.getBoundingClientRect();
      const sz = this.gridSize;
      const occ = [];
      for (let i = 0; i < this.grid.length; i++) if (this.grid[i]) occ.push(i);
      const t = Date.now();
      const beltPairs = this._beltEdges || new Set();

      ctx.lineWidth = 0.4;
      for (let a = 0; a < occ.length; a++) {
        for (let b = a+1; b < occ.length; b++) {
          const ia = occ[a], ib = occ[b];
          const pk = Math.min(ia,ib) + '-' + Math.max(ia,ib);
          if (beltPairs.has(pk)) continue;

          const ra = Math.floor(ia/sz), ca = ia%sz;
          const rb = Math.floor(ib/sz), cb = ib%sz;
          if (Math.abs(ra-rb) + Math.abs(ca-cb) > 2) continue;

          const c1 = gridEl.children[ia], c2 = gridEl.children[ib];
          if (!c1 || !c2) continue;
          const r1 = c1.getBoundingClientRect(), r2 = c2.getBoundingClientRect();

          ctx.strokeStyle = (BLDS[this.grid[ia].type]?.color || '#1a3050') + '10';
          ctx.setLineDash([2,5]);
          ctx.lineDashOffset = -(t/80) % 7;
          ctx.beginPath();
          ctx.moveTo(r1.left+r1.width/2-gRect.left, r1.top+r1.height/2-gRect.top);
          ctx.lineTo(r2.left+r2.width/2-gRect.left, r2.top+r2.height/2-gRect.top);
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
    };

    // ===== 传送带放置预览 =====
    // 当选中建筑悬停在空格子上时，预览将要生成的传送带
    const drawBeltPreview = () => {
      if (!this.sel || this._hoverIdx == null) return;
      const hIdx = this._hoverIdx;
      if (this.grid[hIdx]) return; // 已有建筑

      const gridEl = document.getElementById('grid');
      if (!gridEl) return;
      const gRect = gridEl.getBoundingClientRect();
      const selType = this.sel;
      const t = Date.now();

      // 模拟把这个建筑放在hIdx，计算会产生哪些传送带
      const occupiedCells = new Set();
      for (let i = 0; i < this.grid.length; i++) {
        if (this.grid[i]) occupiedCells.add(i);
      }
      occupiedCells.add(hIdx); // 假设放下

      // 找相关的flow
      const bldMap = findBuildingCells();
      // 加入假设的建筑
      if (!bldMap[selType]) bldMap[selType] = [];
      bldMap[selType].push(hIdx);

      const previewLinks = [];
      for (const flow of FLOW_MAP) {
        if (flow.from !== selType && flow.to !== selType) continue;
        const froms = bldMap[flow.from];
        const tos = bldMap[flow.to];
        if (!froms || !tos) continue;

        // 只看涉及hIdx的连接
        if (flow.from === selType) {
          // hIdx作为from，找最近的to
          let bestTi = -1, bestDist = 999;
          for (const ti of tos) {
            if (ti === hIdx) continue;
            const d = manhattan(hIdx, ti);
            if (d < bestDist && d <= 4) {
              // 检查路径是否被阻挡
              if (!isBeltPathBlocked(hIdx, ti, occupiedCells)) {
                bestDist = d;
                bestTi = ti;
              }
            }
          }
          if (bestTi >= 0) previewLinks.push({ fi: hIdx, ti: bestTi, flow });
        }
        if (flow.to === selType) {
          // hIdx作为to，找最近的from
          let bestFi = -1, bestDist = 999;
          for (const fi of froms) {
            if (fi === hIdx) continue;
            const d = manhattan(fi, hIdx);
            if (d < bestDist && d <= 4) {
              if (!isBeltPathBlocked(fi, hIdx, occupiedCells)) {
                bestDist = d;
                bestFi = fi;
              }
            }
          }
          if (bestFi >= 0) previewLinks.push({ fi: bestFi, ti: hIdx, flow });
        }
      }

      // 去重（同格子对只画一条）
      const drawnPairs = new Set();
      let hasBlocked = false;

      for (const link of previewLinks) {
        const pk = Math.min(link.fi, link.ti) + '-' + Math.max(link.fi, link.ti);
        if (drawnPairs.has(pk)) continue;
        drawnPairs.add(pk);

        // 检查是否与已有传送带冲突
        const existingEdges = this._beltEdges || new Set();
        if (existingEdges.has(pk)) {
          hasBlocked = true;
          continue;
        }

        const c1 = getCellCenter(link.fi, gridEl, gRect);
        // 对于hIdx，格子还没有建筑，用格子位置
        const c2 = getCellCenter(link.ti, gridEl, gRect);
        if (!c1 || !c2) continue;

        const dx = c2.x - c1.x, dy = c2.y - c1.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 5) continue;
        const ux = dx/dist, uy = dy/dist;
        const edgeOff = Math.min(c1.w, c1.h) * 0.50;
        const sx = c1.x + ux * edgeOff;
        const sy = c1.y + uy * edgeOff;
        const ex = c2.x - ux * edgeOff;
        const ey = c2.y - uy * edgeOff;
        const adx = Math.abs(dx), ady = Math.abs(dy);
        const isOrtho = (adx < 3 || ady < 3);
        const mx = ex, my = sy;

        // 预览虚线（工业风格直角）
        const pulse = 0.3 + Math.sin(t / 200) * 0.15;
        ctx.lineWidth = 3;
        ctx.strokeStyle = link.flow.color + Math.round(pulse * 255).toString(16).padStart(2,'0');
        ctx.setLineDash([4, 4]);
        ctx.lineDashOffset = -(t / 100) % 8;
        ctx.lineCap = 'square';
        ctx.lineJoin = 'miter';
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        if (isOrtho) {
          ctx.lineTo(ex, ey);
        } else {
          ctx.lineTo(mx, my);
          ctx.lineTo(ex, ey);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // 预览端点方形
        const tSz = 2.5;
        ctx.fillStyle = link.flow.color + '50';
        ctx.fillRect(sx - tSz, sy - tSz, tSz*2, tSz*2);
        ctx.fillRect(ex - tSz, ey - tSz, tSz*2, tSz*2);
      }

      // 在悬停格子上显示传送带数量提示
      const hoverCell = getCellCenter(hIdx, gridEl, gRect);
      if (hoverCell && drawnPairs.size > 0) {
        ctx.globalAlpha = 0.7;
        ctx.font = '9px "Share Tech Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#06d6a0';
        ctx.fillText(`🔗${drawnPairs.size}`, hoverCell.x, hoverCell.y - hoverCell.h * 0.38 - 4);
        ctx.globalAlpha = 1;
      }
      if (hoverCell && hasBlocked) {
        ctx.globalAlpha = 0.8;
        ctx.font = '8px "Share Tech Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ef4444';
        ctx.fillText('⚠ 通道占用', hoverCell.x, hoverCell.y + hoverCell.h * 0.38 + 10);
        ctx.globalAlpha = 1;
      }
    };

    const frame = () => {
      resize();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBg();

      // 先画临近弱连接
      drawProximityLinks();
      // 再画传送带轨道
      const activeFlows = drawConveyorBelts();
      // 生成传送带粒子
      spawnConveyorParticles(activeFlows);
      // 绘制传送带粒子
      drawConveyorParticles();
      // 放置预览
      drawBeltPreview();

      // 绘制原有的建筑产出粒子
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.p += p.spd;
        if (p.p >= 1) { this.particles.splice(i,1); continue; }
        const t2 = p.p, mt = 1 - t2;
        const cx = (p.x+p.tx)/2 + Math.sin(p.p*Math.PI)*12;
        const cy = (p.y+p.ty)/2 + Math.cos(p.p*Math.PI)*12;
        const px = mt*mt*p.x + 2*mt*t2*cx + t2*t2*p.tx;
        const py = mt*mt*p.y + 2*mt*t2*cy + t2*t2*p.ty;
        const grad = ctx.createRadialGradient(px,py,0,px,py,p.sz*2.5);
        grad.addColorStop(0, p.c+'55');
        grad.addColorStop(1, p.c+'00');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(px,py,p.sz*2.5,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(px,py,p.sz,0,Math.PI*2); ctx.fill();
      }
      requestAnimationFrame(frame);
    };
    frame();
  },

  // ===== UPDATE UI =====
  updateUI() {
    for (let k in RES) {
      const card = document.getElementById('res-' + k);
      if (card) {
        card.classList.toggle('hidden', RES[k].phase > this.phase);
      }
      const valEl = document.getElementById('resVal-' + k);
      if (valEl) {
        const newVal = Math.floor(this.res[k] || 0);
        const oldVal = parseInt(valEl.textContent) || 0;
        valEl.textContent = newVal;
        // 大幅增长时弹跳动画
        if (newVal - oldVal > 10) {
          valEl.classList.add('res-jump');
          setTimeout(() => valEl.classList.remove('res-jump'), 400);
        }
      }
      const rateEl = document.getElementById('resRate-' + k);
      if (rateEl) {
        const v = this.rates[k] || 0;
        if (v > 0.01) {
          rateEl.textContent = '+' + v.toFixed(1) + '/s';
          rateEl.className = 'res-rate pos';
        } else if (v < -0.01) {
          rateEl.textContent = v.toFixed(1) + '/s';
          rateEl.className = 'res-rate neg';
        } else {
          rateEl.textContent = '';
          rateEl.className = 'res-rate';
        }
      }
    }

    document.getElementById('statPop').textContent = Math.floor(this.pop) + '/' + this._popCap();
    // 显示人口食物消耗
    const popFoodRow = document.getElementById('rowPopFood');
    if (popFoodRow) {
      if (this.pop > 0) {
        popFoodRow.style.display = 'flex';
        const foodCost = (this.pop * 0.005).toFixed(1);
        document.getElementById('statPopFood').textContent = `-${foodCost}🟢/s`;
        document.getElementById('statPopFood').style.color = this.res.glucose >= this.pop * 0.005 ? '#8a6a3a' : '#ef4444';
      } else {
        popFoodRow.style.display = 'none';
      }
    }
    document.getElementById('statEff').textContent = (this.gEff * 100).toFixed(0) + '%';
    // 物流效率 = 仓储加成(lEff) × 传送带平均效率
    const beltsActive = this._activeBelts || [];
    let beltAvgEff = 1;
    if (beltsActive.length > 0) {
      let bTotal = 0;
      beltsActive.forEach(b => {
        const bk = Math.min(b.fi, b.ti) + '-' + Math.max(b.fi, b.ti);
        bTotal += this.getBeltEfficiency(bk);
      });
      beltAvgEff = bTotal / beltsActive.length;
    }
    const logPct = Math.round(this.lEff * beltAvgEff * 100);
    const logEl = document.getElementById('statLog');
    logEl.textContent = logPct + '%';
    logEl.style.color = logPct >= 100 ? '#6aa0c0' : logPct >= 70 ? '#eab308' : '#f97316';
    document.getElementById('statQS').textContent = this.qsLv;

    // 实时更新总分数 + 评级
    const scoreEl = document.getElementById('statScore');
    if (scoreEl) {
      const score = this.calcScore();
      const { rank, color: rankColor, glow } = this._scoreRank(score);
      scoreEl.textContent = score.toLocaleString();
      scoreEl.style.color = rankColor;
      const rankEl = document.getElementById('statRank');
      if (rankEl) {
        rankEl.textContent = rank;
        rankEl.style.color = rankColor;
        rankEl.style.borderColor = rankColor + '40';
        rankEl.style.background = rankColor + '15';
        rankEl.style.textShadow = glow ? `0 0 8px ${rankColor}` : 'none';
      }
    }

    // 核心供给状态实时更新
    this.updateCoreSupplyUI();

    // Evolution panel - always visible
    document.getElementById('evoLv').textContent = 'Lv.' + this.eL;

    // 进化进度条 = 资源就绪比例
    const evoCost = this.evoCost();
    let totalNeeded = 0, totalHave = 0;
    for (let k in evoCost) {
      const need = evoCost[k];
      const cur = Math.min(this.res[k] || 0, need);
      totalNeeded += need;
      totalHave += cur;
    }
    const readyPct = totalNeeded > 0 ? Math.min(100, (totalHave / totalNeeded) * 100) : 0;
    document.getElementById('evoBar').style.width = readyPct + '%';
    document.getElementById('evoBar').textContent = readyPct >= 10 ? readyPct.toFixed(0)+'%' : '';

    // Dynamic evolution cost & resource status
    const evoCostInfo = document.getElementById('evoCostInfo');
    if (evoCostInfo) {
      const parts = [];
      for (let k in evoCost) parts.push(`${evoCost[k]}${RES[k]?.icon||k}`);
      evoCostInfo.textContent = '需要: ' + parts.join(' + ');
    }

    const evoStatus = document.getElementById('evoResStatus');
    if (evoStatus) {
      let html = '';
      for (let k in evoCost) {
        const cur = Math.floor(this.res[k] || 0);
        const need = evoCost[k];
        const ok = cur >= need;
        html += `<span style="color:${ok ? 'var(--green)' : 'var(--red)'}"> ${RES[k]?.icon||k} ${cur}/${need}</span>`;
        html += `<span style="margin:0 6px;color:var(--color-separator)">|</span>`;
      }
      const allReady = readyPct >= 100;
      html += `<span style="color:${allReady ? 'var(--green)' : 'var(--red)'}">资源 ${allReady ? '✓ 就绪' : readyPct.toFixed(0) + '%'}</span>`;
      evoStatus.innerHTML = html;
    }

    // Evolution button text
    const evoBtn = document.getElementById('evoBtn');
    if (evoBtn) {
      let bonus = this.evoBonus() * (this._evoBoostMult || 1);
      const bonusPct = Math.round(bonus * 100);
      evoBtn.textContent = `进化 ▸ Lv.${this.eL} → Lv.${this.eL+1}  效率+${bonusPct}%`;
    }

    this.updateGuide();
    this.updatePhase();
    this.updateCoreUpgradeUI();
    this.updateChains();
    this.updateBeltUpgradeBtn();
    this.updateRedDots();
  },

  // ===== 红点提醒 =====
  updateRedDots() {
    // 1. 建筑升级按钮红点 — 检查每种建筑是否有可升级且买得起的
    document.querySelectorAll('.build-upgrade-btn').forEach(btn => {
      if (btn.classList.contains('maxed')) { btn.classList.remove('has-red-dot'); return; }
      const row = btn.closest('.build-row');
      if (!row) { btn.classList.remove('has-red-dot'); return; }
      const actionBtn = row.querySelector('.action-btn');
      if (!actionBtn) { btn.classList.remove('has-red-dot'); return; }
      const key = actionBtn.dataset.b;
      if (!key) { btn.classList.remove('has-red-dot'); return; }
      // 检查是否有任一同类建筑可升级且买得起
      let canUp = false;
      this.grid.forEach((g, i) => {
        if (canUp) return;
        if (g && g.type === key) {
          const lv = this.buildingLevels[i] || 1;
          if (lv < 5) {
            const cost = this.getUpgradeCost(i);
            if (cost && this.checkRes(cost)) canUp = true;
          }
        }
      });
      btn.classList.toggle('has-red-dot', canUp);
    });

    // 2. 传送带升级按钮红点
    const beltBtn = document.getElementById('beltUpgradeInlineBtn');
    if (beltBtn && !beltBtn.classList.contains('no-belts')) {
      const groups = this._getBeltGroups();
      let beltCanUp = false;
      for (const g of groups) {
        if (!g.allMax) {
          // 检查该组第一条带的升级费用
          const cost = this.getBeltUpgradeCost(g.keys[0]);
          if (cost && this.checkRes(cost)) { beltCanUp = true; break; }
        }
      }
      beltBtn.classList.toggle('has-red-dot', beltCanUp);
    } else if (beltBtn) {
      beltBtn.classList.remove('has-red-dot');
    }

    // 3. 进化按钮红点
    const evoBtn = document.getElementById('evoBtn');
    if (evoBtn) evoBtn.classList.toggle('has-red-dot', this.canEvolve());

    // 4. 帝国核心升级按钮红点
    const coreBtn = document.getElementById('coreUpgradeBtn');
    if (coreBtn) coreBtn.classList.toggle('has-red-dot', this.canPhaseUp());

    // 5. 科技研究按钮红点 — 未完成、未锁定、买得起、当前没有在研究
    document.querySelectorAll('[id^="tech-"]').forEach(btn => {
      const key = btn.id.replace('tech-', '');
      const t = typeof TECHS !== 'undefined' ? TECHS[key] : null;
      if (!t) { btn.classList.remove('has-red-dot'); return; }
      const done = this.techs[key]?.done;
      const reqs = t.req || [];
      const locked = reqs.some(r => !this.techs[r]?.done);
      const isResearching = this.rTech === key;
      const canStart = !done && !locked && !isResearching && !this.rTech && this.checkRes(t.cost);
      btn.classList.toggle('has-red-dot', canStart);
    });
  },

  // ===== 传送带列表 — 脏标记 + DOM diff =====
  _chainsDirty: true,   // 初始需要渲染
  _lastChainHash: '',   // 上次渲染的数据指纹

  // 外部调用此方法标记需要重建
  markChainsDirty() { this._chainsDirty = true; },

  updateChains() {
    const section = document.getElementById('chainSection');
    const list = document.getElementById('chainList');
    const belts = this._activeBelts || [];
    const beltCount = belts.length;

    // --- 计算数据指纹（轻量级） ---
    // 包含：活跃链条数、传送带数量、每条传送带的key+等级
    let hashParts = [];
    CHAINS.forEach(ch => {
      const active = ch.reqs.every(r => this.grid.some(g => g && g.type === r));
      if (active) hashParts.push('C:' + ch.n);
    });
    belts.forEach(belt => {
      const key = Math.min(belt.fi, belt.ti) + '-' + Math.max(belt.fi, belt.ti);
      const fromBld = this.grid[belt.fi];
      const toBld = this.grid[belt.ti];
      const ft = fromBld ? fromBld.type : '?';
      const tt = toBld ? toBld.type : '?';
      hashParts.push('B:' + key + ':' + ft + ':' + tt + ':' + this.getBeltLevel(key));
    });
    const newHash = hashParts.join('|');

    // 数据没变，跳过 DOM 重建
    if (!this._chainsDirty && newHash === this._lastChainHash) return;
    this._chainsDirty = false;
    this._lastChainHash = newHash;

    // --- 以下为原有的 DOM 重建逻辑 ---
    list.innerHTML = '';
    let hasActive = false;

    // --- 流水线链展示 ---
    CHAINS.forEach(ch => {
      const active = ch.reqs.every(r => this.grid.some(g => g && g.type === r));
      if (active) {
        hasActive = true;
        const div = document.createElement('div');
        div.style.cssText = 'padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.03);color:var(--color-info);display:flex;align-items:center;gap:4px';
        div.innerHTML = `<span style="color:var(--cyan);font-size:0.95em">⛓</span> ${ch.n}: <span style="color:var(--color-info)">${ch.steps.join(' ')}</span>`;
        list.appendChild(div);
      }
    });

    // --- 传送带总览 ---
    if (beltCount > 0) {
      hasActive = true;

      // 传送带总数 + 平均效率
      let totalEff = 0;
      belts.forEach(belt => {
        const key = Math.min(belt.fi, belt.ti) + '-' + Math.max(belt.fi, belt.ti);
        totalEff += this.getBeltEfficiency(key);
      });
      const avgEff = Math.round(totalEff / beltCount * 100);
      const avgColor = avgEff >= 100 ? 'var(--cyan)' : avgEff >= 70 ? 'var(--yellow)' : 'var(--orange)';

      const header = document.createElement('div');
      header.style.cssText = 'padding:5px 0;margin-top:4px;border-top:1px solid rgba(6,214,160,0.1);display:flex;justify-content:space-between;align-items:center';
      header.innerHTML = `<span style="color:var(--color-muted-dark);font-size:0.95em">🏭 传送带 ×<span style="color:var(--cyan);font-weight:700">${beltCount}</span></span>`
        + `<span style="font-size:0.85em;color:${avgColor}">平均效率 ${avgEff}%</span>`;
      list.appendChild(header);

      // --- 按同类型分组传送带 ---
      const beltGroups = {};
      belts.forEach(belt => {
        const fromBld = this.grid[belt.fi];
        const toBld = this.grid[belt.ti];
        if (!fromBld || !toBld) return;
        const groupKey = fromBld.type + '→' + toBld.type;
        if (!beltGroups[groupKey]) {
          beltGroups[groupKey] = {
            fromType: fromBld.type, toType: toBld.type,
            fromName: (BLDS[fromBld.type]?.emoji || '') + (BLDS[fromBld.type]?.n || '?'),
            toName: (BLDS[toBld.type]?.emoji || '') + (BLDS[toBld.type]?.n || '?'),
            icons: belt.icons || [],
            keys: [],  // 所有同类传送带的 beltKey
          };
        }
        const key = Math.min(belt.fi, belt.ti) + '-' + Math.max(belt.fi, belt.ti);
        if (!beltGroups[groupKey].keys.includes(key)) {
          beltGroups[groupKey].keys.push(key);
        }
      });

      Object.values(beltGroups).forEach(grp => {
        const count = grp.keys.length;
        // 取最低等级（决定整组升级费用）
        const minLv = Math.min(...grp.keys.map(k => this.getBeltLevel(k)));
        const avgEff2 = grp.keys.reduce((s, k) => s + this.getBeltEfficiency(k), 0) / count;
        const effPct = Math.round(avgEff2 * 100);
        const allMax = minLv >= 5;
        const resIcons = grp.icons.join('');

        const lvColor = minLv >= 5 ? 'var(--purple)' : minLv >= 3 ? 'var(--cyan)' : minLv >= 2 ? 'var(--yellow)' : 'var(--orange)';
        const effColor = effPct >= 100 ? 'var(--cyan)' : effPct >= 70 ? 'var(--yellow)' : 'var(--orange)';
        const lvBar = '█'.repeat(minLv) + '░'.repeat(5 - minLv);
        const maxTag = allMax ? '<span style="color:var(--purple);font-size:0.85em"> ★MAX</span>' : '';
        const countTag = count > 1 ? `<span style="color:var(--color-muted);font-size:0.75em"> ×${count}</span>` : '';

        const row = document.createElement('div');
        row.style.cssText = `padding:4px 6px;margin:2px 0;border-radius:3px;
          background:var(--color-panel-bg);border:1px solid ${minLv >= 5 ? 'rgba(74,26,106,0.25)' : minLv >= 3 ? 'rgba(26,58,58,0.25)' : 'rgba(58,42,26,0.25)'};
          cursor:pointer;transition:all 0.15s`;
        row.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
            <span style="font-size:0.95em;color:var(--color-info)">${resIcons} ${grp.fromName} → ${grp.toName}${countTag}</span>
            <span style="font-size:0.85em;color:${lvColor};font-family:'Orbitron',monospace;font-weight:700">Lv.${minLv}${maxTag}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:0.75em;color:var(--color-muted-dark);font-family:'Share Tech Mono',monospace;letter-spacing:1px">${lvBar}</span>
            <span style="font-size:0.85em;color:${effColor};font-weight:600">${effPct}%</span>
          </div>`;
        // 点击批量升级同类传送带
        row.addEventListener('click', () => {
          this.showBeltGroupUpgradePopup(grp.keys, grp.fromName, grp.toName);
        });
        row.addEventListener('mouseenter', () => {
          row.style.borderColor = lvColor === 'var(--purple)' ? 'rgba(168,85,247,0.5)' : lvColor === 'var(--cyan)' ? 'rgba(6,214,160,0.5)' : lvColor === 'var(--yellow)' ? 'rgba(234,179,8,0.5)' : 'rgba(249,115,22,0.5)';
          row.style.background = 'var(--color-hover-bg)';
        });
        row.addEventListener('mouseleave', () => {
          row.style.borderColor = minLv >= 5 ? 'rgba(74,26,106,0.25)' : minLv >= 3 ? 'rgba(26,58,58,0.25)' : 'rgba(58,42,26,0.25)';
          row.style.background = 'var(--color-panel-bg)';
        });
        list.appendChild(row);
      });
    }

    section.style.display = hasActive ? 'block' : 'none';
  },

  // ===== NOTIFICATION QUEUE =====
  // 所有弹窗进入队列，按顺序依次展示，不再互相覆盖
  _notifyQueue: [],
  _notifyBusy: false,

  _enqueueNotify(item) {
    this._notifyQueue.push(item);
    if (!this._notifyBusy) this._drainNotify();
  },

  _drainNotify() {
    if (this._notifyQueue.length === 0) { this._notifyBusy = false; return; }
    this._notifyBusy = true;
    const item = this._notifyQueue.shift();
    item.show();
    setTimeout(() => {
      item.hide();
      // 两条通知之间留 400ms 间隔，避免视觉重叠
      setTimeout(() => this._drainNotify(), 400);
    }, item.dur || 3500);
  },

  // ===== EVENTS =====
  showEvent(title, desc, color) {
    this._enqueueNotify({
      dur: 4000,
      show: () => {
        const pop = document.getElementById('eventPopup');
        document.getElementById('eventTitle').textContent = title;
        document.getElementById('eventTitle').style.color = color || 'var(--cyan)';
        document.getElementById('eventDesc').textContent = desc;
        pop.classList.add('show');
      },
      hide: () => {
        document.getElementById('eventPopup').classList.remove('show');
      }
    });
  },

  closeEvent() {
    document.getElementById('eventPopup').classList.remove('show');
    // 手动关闭时也要继续播放队列
    this._notifyBusy = false;
    this._drainNotify();
  },

  showMilestone(icon, text) {
    SFX.milestone();
    this._enqueueNotify({
      dur: 3500,
      show: () => {
        const el = document.getElementById('milestone');
        document.getElementById('msIcon').textContent = icon;
        document.getElementById('msText').textContent = text;
        el.classList.add('show');
      },
      hide: () => {
        document.getElementById('milestone').classList.remove('show');
      }
    });
  },

  // ===== CURSOR TOOLTIP (mouse-follow hint) =====
  showCursorTooltip(text) {
    // 移除旧的
    document.querySelectorAll('.cursor-tooltip').forEach(e => e.remove());
    const tip = document.createElement('div');
    tip.className = 'cursor-tooltip';
    tip.textContent = text;
    document.body.appendChild(tip);
    // 跟随鼠标位置
    const moveFn = (e) => {
      tip.style.left = e.clientX + 'px';
      tip.style.top = e.clientY + 'px';
    };
    document.addEventListener('mousemove', moveFn);
    // 用最后已知的鼠标位置初始化
    const lastEvt = window._lastMouseEvt;
    if (lastEvt) {
      tip.style.left = lastEvt.clientX + 'px';
      tip.style.top = lastEvt.clientY + 'px';
    }
    setTimeout(() => {
      document.removeEventListener('mousemove', moveFn);
      tip.style.opacity = '0';
      tip.style.transition = 'opacity 0.3s';
      setTimeout(() => tip.remove(), 300);
    }, 1800);
  },

  // ===== LOG =====
  log(msg, type) {
    const log = document.getElementById('logBox');
    const el = document.createElement('div');
    el.className = 'log-msg' + (type ? ' ' + type : '');
    const t = new Date();
    const ts = (t.getHours()<10?'0':'') + t.getHours() + ':' +
               (t.getMinutes()<10?'0':'') + t.getMinutes() + ':' +
               (t.getSeconds()<10?'0':'') + t.getSeconds();
    el.textContent = ts + ' ' + msg;
    log.insertBefore(el, log.firstChild);
    while (log.children.length > 40) log.removeChild(log.lastChild);
  },

  // ===== CONTROLS =====
  toggleSpeed() {
    this.spd = this.spd >= 4 ? 1 : this.spd * 2;
    document.getElementById('spdDisplay').textContent = this.spd + '×';
    const btn = document.getElementById('spdBtn');
    btn.classList.remove('spd-2', 'spd-4');
    if (this.spd === 2) btn.classList.add('spd-2');
    else if (this.spd === 4) btn.classList.add('spd-4');
    this.log(this.spd > 1 ? '⚡ 加速 ' + this.spd + '×' : '⚡ 正常速度', 's');
    SFX.click();
  },

  togglePause() {
    this.paused = !this.paused;
    const btn = document.getElementById('pauseBtn');
    btn.textContent = this.paused ? '▶' : '⏸';
    btn.classList.toggle('active', this.paused);
    document.getElementById('pauseOverlay').classList.toggle('show', this.paused);
    this.log(this.paused ? '⏸ 已暂停' : '▶ 继续运行', '');
    if (this.paused) SFX.pause(); else SFX.unpause();
  },

  toggleSfx() {
    const on = SFX.toggleSfx();
    document.getElementById('sfxBtn').textContent = on ? '🔊' : '🔇';
    document.getElementById('sfxBtn').classList.toggle('muted', !on);
    this.log(on ? '🔊 音效已开启' : '🔇 音效已关闭', '');
  },

  toggleBgm() {
    const on = SFX.toggleBgm();
    document.getElementById('bgmBtn').textContent = on ? '🎵' : '🎵';
    document.getElementById('bgmBtn').classList.toggle('muted', !on);
    this.log(on ? '🎵 背景音乐已开启' : '🎵 背景音乐已关闭', '');
    if (on) SFX.updateBGMPhase(this.phase);
  },

  save(silent) {
    try {
      const s = {
        res: this.res, grid: this.grid, gridSize: this.gridSize, gridCols: this.gridCols, gridRows: this.gridRows, techs: this.techs,
        pop: this.pop, gEff: this.gEff, eL: this.eL, eP: this.eP,
        phase: this.phase, rt: this.rt, rTech: this.rTech, rProg: this.rProg,
        wBuild: this.wBuild, wProg: this.wProg, wonderComplete: this.wonderComplete,
        achievements: this.achievements, stats: this.stats,
        // New systems
        lastOnlineTime: Date.now(),
        buildingLevels: this.buildingLevels,
        completedChallenges: this.completedChallenges,
        beltLevels: this.beltLevels,
        manualBelts: this.manualBelts,
        removedBelts: this.removedBelts,
        // 科技树分支状态
        _collectorBonus: this._collectorBonus,
        _energyBonus: this._energyBonus,
        _energyCostPenalty: this._energyCostPenalty,
        _nitrogenBonus: this._nitrogenBonus,
        _proteinBonus: this._proteinBonus,
        _transportBonus: this._transportBonus,
        _popCapBonus: this._popCapBonus,
        _popEffMult: this._popEffMult,
        _qsDecayMult: this._qsDecayMult,
        _qsCapBonus: this._qsCapBonus,
        _evoBoostMult: this._evoBoostMult,
      };
      localStorage.setItem('bioSphereV3', JSON.stringify(s));
      if (!silent) this.log('▸ 已保存', 's');
      // 视觉反馈：闪烁保存指示器
      const indicator = document.getElementById('saveIndicator');
      if (indicator) {
        indicator.style.opacity = '1';
        clearTimeout(this._saveIndicatorTimer);
        this._saveIndicatorTimer = setTimeout(() => { indicator.style.opacity = '0'; }, 1500);
      }
    } catch(e) { if (!silent) this.log('保存失败', 'w'); }
  },

  load() {
    try {
      const d = localStorage.getItem('bioSphereV3');
      if (!d) return;
      const s = JSON.parse(d);
      Object.assign(this.res, s.res || {});

      // 恢复存档时的网格尺寸（兼容旧版正方形存档）
      const savedCols = s.gridCols || s.gridSize || Math.round(Math.sqrt((s.grid || []).length)) || 8;
      const savedRows = s.gridRows || s.gridSize || Math.round(Math.sqrt((s.grid || []).length)) || 8;
      const savedGrid = s.grid || [];
      const savedLen = savedCols * savedRows;

      // 先设为存档尺寸，加载建筑到对应位置
      this.gridCols = savedCols;
      this.gridRows = savedRows;
      this.gridSize = savedCols;
      this.grid = new Array(savedLen).fill(null);

      if (savedGrid.length === savedLen) {
        // 尺寸匹配，直接赋值
        this.grid = savedGrid;
      } else if (savedGrid.length > 0) {
        // 旧存档迁移（尺寸不匹配时按行列映射）
        const oldCols = s.gridCols || Math.round(Math.sqrt(savedGrid.length));
        const newLevels = {};
        for (let oi = 0; oi < savedGrid.length; oi++) {
          if (!savedGrid[oi]) continue;
          const or = Math.floor(oi / oldCols), oc = oi % oldCols;
          const ni = or * this.gridCols + oc;
          if (ni < savedLen) {
            this.grid[ni] = savedGrid[oi];
            if (s.buildingLevels && s.buildingLevels[oi]) {
              newLevels[ni] = s.buildingLevels[oi];
            }
          }
        }
        if (Object.keys(newLevels).length > 0) s.buildingLevels = newLevels;
      }
      // 清理无效格子数据（包括旧存档中残留的核心菌落）
      for (let i = 0; i < this.grid.length; i++) {
        if (this.grid[i] && (this.grid[i].type === '_coreColony' || !this.grid[i].type || !BLDS[this.grid[i].type])) {
          this.grid[i] = null;
        }
      }
      this.techs = s.techs || this.techs;
      this.pop = s.pop || 0;
      this.gEff = s.gEff || 1;
      this.eL = s.eL || 1;
      this.eP = s.eP || 0;
      this.phase = s.phase || 1;
      this.rt = s.rt || 0;
      this.rTech = s.rTech;
      this.rProg = s.rProg || 0;
      this.wBuild = s.wBuild;
      this.wProg = s.wProg || 0;
      this.wonderComplete = s.wonderComplete || false;
      this.achievements = s.achievements || {};
      if (s.stats) Object.assign(this.stats, s.stats);
      // New systems
      this.lastOnlineTime = s.lastOnlineTime || Date.now();
      this.buildingLevels = s.buildingLevels || {};
      this.completedChallenges = s.completedChallenges || {};
      // 传送带等级
      this.beltLevels = s.beltLevels || {};
      this.manualBelts = s.manualBelts || {};
      this.removedBelts = s.removedBelts || {};
      // 科技树分支状态恢复
      if (s._collectorBonus) this._collectorBonus = s._collectorBonus;
      if (s._energyBonus) this._energyBonus = s._energyBonus;
      if (s._energyCostPenalty) this._energyCostPenalty = s._energyCostPenalty;
      if (s._nitrogenBonus) this._nitrogenBonus = s._nitrogenBonus;
      if (s._proteinBonus) this._proteinBonus = s._proteinBonus;
      if (s._transportBonus) this._transportBonus = s._transportBonus;
      if (s._popCapBonus) this._popCapBonus = s._popCapBonus;
      if (s._popEffMult) this._popEffMult = s._popEffMult;
      if (s._qsDecayMult) this._qsDecayMult = s._qsDecayMult;
      if (s._qsCapBonus) this._qsCapBonus = s._qsCapBonus;
      if (s._evoBoostMult) this._evoBoostMult = s._evoBoostMult;
      // 旧存档迁移：如果网格尺寸发生变化，传送带key中的索引也需要更新
      if (savedGrid.length !== savedLen && savedGrid.length > 0) {
        const migOldCols = s.gridCols || Math.round(Math.sqrt(savedGrid.length));
        const newBeltLevels = {};
        for (const [key, lv] of Object.entries(this.beltLevels)) {
          const [a, b] = key.split('-').map(Number);
          const ar = Math.floor(a / migOldCols), ac = a % migOldCols;
          const br = Math.floor(b / migOldCols), bc = b % migOldCols;
          const na = ar * this.gridCols + ac;
          const nb = br * this.gridCols + bc;
          if (na < savedLen && nb < savedLen) {
            const nk = Math.min(na, nb) + '-' + Math.max(na, nb);
            newBeltLevels[nk] = lv;
          }
        }
        this.beltLevels = newBeltLevels;
      }

      this.buildUI();
      this.updateRates();
      this.updateUI();
      if (this.rt > 0) this.log('▸ 存档已加载', 's');

      if (this.wBuild) {
        const bd = BLDS[this.wBuild];
        document.getElementById('wonderOverlay').classList.add('show');
        document.getElementById('wonderName').textContent = '建造中: ' + (bd?.n || '');
      }
    } catch(e) { console.log('Load error:', e); }
  },

  reset() {
    document.getElementById('resetPopup').classList.add('show');
    this._showBackdrop();
  },

  confirmReset() {
    // 完全清除所有存档数据
    localStorage.removeItem('bioSphereV3');
    localStorage.removeItem('bioSpherePrestige');
    location.reload();
  },

  cancelReset() {
    document.getElementById('resetPopup').classList.remove('show');
    this._hideBackdrop();
  },

  // ===== CHALLENGE SYSTEM =====
  startRandomChallenge() {
    if (this.activeChallenge) return;
    if (this.challengeCooldown > 0) return;

    const eligible = CHALLENGES.filter(c => c.phase <= this.phase && !this.completedChallenges[c.id]);
    if (eligible.length === 0) return;

    const ch = eligible[Math.floor(Math.random() * eligible.length)];
    this.activeChallenge = ch;
    this.challengeTimer = ch.time;
    this.challengeSnap = { totalBuilt: this.stats.totalBuilt };
    this.challengeCooldown = 120; // 2 min cooldown after challenge

    this.showChallengeUI();
    this.log(`🎯 挑战开始: ${ch.n} — ${ch.d} (${ch.time}秒)`, 'ev');
    SFX.milestone();
    this.screenShake(4);
  },

  tickChallenge() {
    if (this.challengeCooldown > 0) {
      this.challengeCooldown -= 1;  // 在 spd 循环内调用，每次 -1
      if (this.challengeCooldown <= 0 && !this.activeChallenge && Math.random() < 0.02) {
        this.startRandomChallenge();
      }
    }

    if (!this.activeChallenge) return;
    this.challengeTimer -= 1;  // 同上

    // Check completion
    if (this.activeChallenge.check(this, this.challengeSnap)) {
      const ch = this.activeChallenge;
      this.completedChallenges[ch.id] = true;

      // Give rewards
      const rewardParts = [];
      for (let k in ch.reward) {
        this.res[k] = (this.res[k] || 0) + ch.reward[k];
        rewardParts.push(`+${ch.reward[k]}${RES[k]?.icon||k}`);
      }

      this.log(`✅ 挑战完成: ${ch.n} — 奖励: ${rewardParts.join(' ')}`, 's');
      this.showEvent(`🎯 挑战完成！`, `${ch.n}\n\n${ch.d}\n\n🎁 奖励: ${rewardParts.join(' ')}`, 'var(--yellow)');
      SFX.achieve();
      this.screenShake(8);

      this.activeChallenge = null;
      this.challengeTimer = 0;
      this.challengeSnap = null;
      this.hideChallengeUI();
      return;
    }

    // Check timeout
    if (this.challengeTimer <= 0) {
      this.log(`❌ 挑战失败: ${this.activeChallenge.n} — 时间耗尽`, 'e');
      SFX.eventBad();
      this.activeChallenge = null;
      this.challengeTimer = 0;
      this.challengeSnap = null;
      this.hideChallengeUI();
      return;
    }

    this.updateChallengeUI();
  },

  showChallengeUI() {
    const el = document.getElementById('challengeBar');
    if (!el) return;
    el.classList.add('show');
  },

  hideChallengeUI() {
    const el = document.getElementById('challengeBar');
    if (!el) return;
    el.classList.remove('show');
  },

  updateChallengeUI() {
    if (!this.activeChallenge) return;
    const ch = this.activeChallenge;
    const el = document.getElementById('challengeBar');
    if (!el) return;

    const pct = Math.max(0, (this.challengeTimer / ch.time) * 100);
    document.getElementById('challengeName').textContent = `${ch.icon} ${ch.n}`;
    document.getElementById('challengeDesc').textContent = ch.d;
    document.getElementById('challengeFill').style.width = pct + '%';
    document.getElementById('challengeTime').textContent = Math.ceil(this.challengeTimer) + 's';

    // Flash when time is low
    if (this.challengeTimer < 15) {
      el.style.borderColor = 'var(--red)';
      document.getElementById('challengeFill').style.background = 'linear-gradient(90deg,var(--red),var(--orange))';
    } else {
      el.style.borderColor = 'var(--yellow)';
      document.getElementById('challengeFill').style.background = 'linear-gradient(90deg,var(--yellow),var(--orange))';
    }
  },

  skipChallenge() {
    if (!this.activeChallenge) return;
    this.log(`⏭ 跳过挑战: ${this.activeChallenge.n}`, 'w');
    this.activeChallenge = null;
    this.challengeTimer = 0;
    this.challengeSnap = null;
    this.hideChallengeUI();
  },

  // ===== BUILDING UPGRADE SYSTEM =====
  getUpgradeCost(idx) {
    const g = this.grid[idx];
    if (!g) return null;
    const bd = BLDS[g.type];
    if (!bd || bd.isWonder || bd.isBoost) return null;

    const lv = this.buildingLevels[idx] || 1;
    if (lv >= 5) return null; // max level 5

    const cost = {};
    for (let k in bd.cost) {
      cost[k] = Math.ceil(bd.cost[k] * Math.pow(1.8, lv));
    }
    return cost;
  },

  getUpgradeMultiplier(idx) {
    const lv = this.buildingLevels[idx] || 1;
    return 1 + (lv - 1) * 0.4; // Lv1: 1x, Lv2: 1.4x, Lv3: 1.8x, Lv4: 2.2x, Lv5: 2.6x
  },

  showUpgradePopup(idx) {
    const g = this.grid[idx];
    if (!g) return;
    const bd = BLDS[g.type];
    if (!bd || bd.isWonder || bd.isBoost) return;

    const lv = this.buildingLevels[idx] || 1;
    if (lv >= 5) {
      this.log('建筑已满级 Lv.5', 'w');
      return;
    }

    const cost = this.getUpgradeCost(idx);
    if (!cost) return;

    this.upgradeIdx = idx;
    const costStr = Object.entries(cost).map(([k,v]) => `${v}${RES[k]?.icon||k}`).join(' + ');
    const nextMult = (1 + lv * 0.4).toFixed(1);

    const pop = document.getElementById('upgradePopup');
    if (!pop) return;
    document.getElementById('upgradeName').textContent = `${bd.emoji} ${bd.n}`;
    document.getElementById('upgradeLevel').textContent = `Lv.${lv} → Lv.${lv+1}`;
    document.getElementById('upgradeEffect').textContent = `产出倍率: ${this.getUpgradeMultiplier(idx).toFixed(1)}x → ${nextMult}x`;
    document.getElementById('upgradeCost').textContent = `造价: ${costStr}`;

    const canAfford = this.checkRes(cost);
    document.getElementById('upgradeYes').disabled = !canAfford;
    document.getElementById('upgradeYes').style.opacity = canAfford ? '1' : '0.3';

    pop.classList.add('show');
    this._showBackdrop();
    SFX.click();
  },

  confirmUpgrade() {
    if (this.upgradeIdx === undefined || this.upgradeIdx === null) return;
    const idx = this.upgradeIdx;
    const cost = this.getUpgradeCost(idx);
    if (!cost || !this.checkRes(cost)) {
      this.log('升级资源不足', 'e');
      SFX.buildFail();
      this.cancelUpgrade();
      return;
    }

    this.spend(cost);
    this.buildingLevels[idx] = (this.buildingLevels[idx] || 1) + 1;
    const lv = this.buildingLevels[idx];
    const bd = BLDS[this.grid[idx].type];

    this.log(`⬆ ${bd.n} 升级到 Lv.${lv} — 产出×${this.getUpgradeMultiplier(idx).toFixed(1)}`, 's');
    SFX.coreUpgrade();
    this.buildBurst(idx);
    this.screenShake(4);

    this.cancelUpgrade();
    this.renderGrid();
    this.renderBuildings(); // 刷新建造列表中的升级按钮状态
    this.updateRates();
    this.updateUI();
  },

  cancelUpgrade() {
    this.upgradeIdx = null;
    document.getElementById('upgradePopup')?.classList.remove('show');
    this._hideBackdrop();
  },

  // ===== CONVEYOR BELT UPGRADE SYSTEM =====
  // 传送带等级: 1-5
  // Lv1: 传输效率 0.5x（慢速），Lv2: 0.7x，Lv3: 1.0x（正常），Lv4: 1.2x，Lv5: 1.5x（高效）
  getBeltLevel(beltKey) {
    return this.beltLevels[beltKey] || 1;
  },

  getBeltEfficiency(beltKey) {
    const lv = this.getBeltLevel(beltKey);
    // 【调优】Lv1=0.75(原0.5), Lv2=0.9(原0.7), Lv3=1.0, Lv4=1.2, Lv5=1.5
    const effMap = { 1: 0.75, 2: 0.9, 3: 1.0, 4: 1.2, 5: 1.5 };
    return effMap[lv] || 0.75;
  },

  getBeltUpgradeCost(beltKey) {
    const lv = this.getBeltLevel(beltKey);
    if (lv >= 5) return null;
    // 传送带升级费用：低级便宜，高级需要稀有资源
    const costs = {
      1: { energy: 8, glucose: 5 },      // Lv1→2 — 早期可及
      2: { energy: 20, glucose: 12 },     // Lv2→3
      3: { energy: 40, glucose: 20, dna: 3 },   // Lv3→4
      4: { energy: 70, glucose: 35, dna: 10 },   // Lv4→5
    };
    return costs[lv] || null;
  },

  // 立即刷新传送带缓存（撤销/连接后必须调用）
  refreshBelts() {
    if (this._computeBelts) {
      const { belts, usedEdges } = this._computeBelts();
      this._activeBelts = belts;
      this._beltEdges = usedEdges;
    }
    this._chainsDirty = true;  // 数据变了，标记需要重渲染
  },

  // 计算建筑的传送带加成
  // 规则：
  //   - 如果建筑在 FLOW_MAP 中作为 to 端（即需要输入资源），
  //     必须有对应的传送带连接才能生产；没有传送带 → 产出为 0
  //   - 如果建筑不需要输入（纯采集建筑如碳源采集器），不受影响
  //   - 有传送带时，产出受传送带平均效率影响
  getBeltMultiplierForBuilding(idx) {
    const g = this.grid[idx];
    if (!g) return 1;
    const type = g.type;
    const bd = BLDS[type];
    if (!bd) return 1;

    // 检查此建筑是否是某个FLOW的接收端（需要输入）
    const needsInput = FLOW_MAP.some(f => f.to === type);
    
    // 查找所有连接到此建筑的传送带（fi或ti指向此格子都算）
    let totalEff = 0;
    let beltCount = 0;
    const belts = this._activeBelts || [];
    
    for (const belt of belts) {
      if (belt.ti === idx || belt.fi === idx) {
        const key = Math.min(belt.fi, belt.ti) + '-' + Math.max(belt.fi, belt.ti);
        totalEff += this.getBeltEfficiency(key);
        beltCount++;
      }
    }
    
    if (beltCount === 0) {
      // 没有传送带：如果建筑需要输入资源，则停产
      return needsInput ? 0 : 1;
    }
    return totalEff / beltCount;
  },

  showBeltUpgradePopup(beltKey) {
    const lv = this.getBeltLevel(beltKey);
    if (lv >= 5) {
      this.log('传送带已满级 Lv.5', 'w');
      return;
    }

    const cost = this.getBeltUpgradeCost(beltKey);
    if (!cost) return;

    this._beltUpgradeKey = beltKey;
    const costStr = Object.entries(cost).map(([k,v]) => `${v}${RES[k]?.icon||k}`).join(' + ');
    const curEff = this.getBeltEfficiency(beltKey);
    const nextLv = lv + 1;
    const nextEffMap = { 1: 0.75, 2: 0.9, 3: 1.0, 4: 1.2, 5: 1.5 };
    const nextEff = nextEffMap[nextLv];

    const pop = document.getElementById('beltUpgradePopup');
    if (!pop) return;
    document.getElementById('beltUpgradeName').textContent = `⛓ 传送带`;
    document.getElementById('beltUpgradeLevel').textContent = `Lv.${lv} → Lv.${nextLv}`;
    document.getElementById('beltUpgradeEffect').textContent = `传输效率: ${Math.round(curEff*100)}% → ${Math.round(nextEff*100)}%`;
    document.getElementById('beltUpgradeCost').textContent = `造价: ${costStr}`;

    const canAfford = this.checkRes(cost);
    document.getElementById('beltUpgradeYes').disabled = !canAfford;
    document.getElementById('beltUpgradeYes').style.opacity = canAfford ? '1' : '0.3';

    pop.classList.add('show');
    this._showBackdrop();
  },

  confirmBeltUpgrade() {
    // 批量升级模式
    if (this._beltUpgradeKeys && this._beltUpgradeKeys.length > 0) {
      const keys = this._beltUpgradeKeys;
      const minLv = Math.min(...keys.map(k => this.getBeltLevel(k)));
      const unitCost = this.getBeltUpgradeCost(keys[0]);
      if (!unitCost) { this.cancelBeltUpgrade(); return; }
      const totalCost = {};
      for (let r in unitCost) totalCost[r] = unitCost[r] * keys.length;
      if (!this.checkRes(totalCost)) {
        this.log('传送带升级资源不足', 'e');
        SFX.buildFail();
        this.cancelBeltUpgrade();
        return;
      }
      this.spend(totalCost);
      for (const k of keys) {
        this.beltLevels[k] = (this.beltLevels[k] || 1) + 1;
      }
      const newLv = minLv + 1;
      const effStr = Math.round(this.getBeltEfficiency(keys[0]) * 100);
      this.log(`⬆ ${keys.length}条传送带升级到 Lv.${newLv} — 效率${effStr}%`, 's');
      SFX.coreUpgrade();
      this.screenShake(3);
      this.cancelBeltUpgrade();
      this._chainsDirty = true;
      this.updateRates();
      this.updateUI();
      return;
    }
    // 单条升级模式（画布点击传送带时）
    if (!this._beltUpgradeKey) return;
    const key = this._beltUpgradeKey;
    const cost = this.getBeltUpgradeCost(key);
    if (!cost || !this.checkRes(cost)) {
      this.log('传送带升级资源不足', 'e');
      SFX.buildFail();
      this.cancelBeltUpgrade();
      return;
    }

    this.spend(cost);
    this.beltLevels[key] = (this.beltLevels[key] || 1) + 1;
    const lv = this.beltLevels[key];

    this.log(`⬆ 传送带升级到 Lv.${lv} — 效率${Math.round(this.getBeltEfficiency(key)*100)}%`, 's');
    SFX.coreUpgrade();
    this.screenShake(3);

    this.cancelBeltUpgrade();
    this._chainsDirty = true;
    this.updateRates();
    this.updateUI();
  },

  cancelBeltUpgrade() {
    this._beltUpgradeKey = null;
    this._beltUpgradeKeys = null;
    document.getElementById('beltUpgradePopup')?.classList.remove('show');
    this._hideBackdrop();
  },

  // ===== BELT ACTION MENU =====
  showBeltActionMenu(beltKey, beltObj, clientX, clientY) {
    this._beltActionKey = beltKey;
    this._beltActionObj = beltObj;
    const lv = this.getBeltLevel(beltKey);
    const eff = this.getBeltEfficiency(beltKey);
    const isManual = beltObj?.isManual || !!this.manualBelts[beltKey];
    const isMaxLv = lv >= 5;

    // 建筑名
    const fromBld = this.grid[beltObj.fi];
    const toBld = this.grid[beltObj.ti];
    const fromName = fromBld ? (BLDS[fromBld.type]?.emoji || '') + (BLDS[fromBld.type]?.n || '?') : '?';
    const toName = toBld ? (BLDS[toBld.type]?.emoji || '') + (BLDS[toBld.type]?.n || '?') : '?';

    const menu = document.getElementById('beltActionMenu');
    document.getElementById('beltActionTitle').textContent = `${fromName} → ${toName}`;
    document.getElementById('beltActionInfo').innerHTML =
      `<span style="color:var(--orange)">Lv.${lv}</span> · 效率 <span style="color:${eff >= 1 ? 'var(--cyan)' : 'var(--yellow)'}">${Math.round(eff * 100)}%</span>` +
      (isManual ? ' · <span style="color:var(--cyan)">手动</span>' : '');

    // 升级按钮
    const upgradeBtn = document.getElementById('beltActionUpgrade');
    if (isMaxLv) {
      upgradeBtn.textContent = '★ 已满级';
      upgradeBtn.disabled = true;
      upgradeBtn.style.opacity = '0.3';
    } else {
      const cost = this.getBeltUpgradeCost(beltKey);
      const costStr = cost ? Object.entries(cost).map(([k,v]) => `${v}${RES[k]?.icon||k}`).join('+') : '';
      upgradeBtn.textContent = `⬆ 升级 Lv.${lv+1} (${costStr})`;
      const canAfford = cost && this.checkRes(cost);
      upgradeBtn.disabled = !canAfford;
      upgradeBtn.style.opacity = canAfford ? '1' : '0.4';
    }

    // 定位菜单在点击位置附近
    menu.style.left = Math.min(clientX, window.innerWidth - 220) + 'px';
    menu.style.top = Math.min(clientY - 10, window.innerHeight - 150) + 'px';
    menu.classList.add('show');
  },

  beltActionUpgrade() {
    const key = this._beltActionKey;
    if (!key) return;
    this.closeBeltActionMenu();
    this.showBeltUpgradePopup(key);
  },

  beltActionRemove() {
    const key = this._beltActionKey;
    if (!key) return;
    const isManual = !!this.manualBelts[key];
    if (isManual) {
      delete this.manualBelts[key];
    } else {
      this.removedBelts[key] = true;
    }
    // 清理等级数据
    delete this.beltLevels[key];
    this.log('🗑 传送带已撤销', '');
    SFX.recycle();
    this.closeBeltActionMenu();
    this.refreshBelts(); // 立即刷新传送带缓存
    this.updateRates();
    this.updateUI();
  },

  closeBeltActionMenu() {
    this._beltActionKey = null;
    this._beltActionObj = null;
    document.getElementById('beltActionMenu')?.classList.remove('show');
  },

  // ===== MANUAL BELT CONNECTION =====
  startBeltConnect() {
    this.closeBeltActionMenu();
    this._beltConnectMode = true;
    this._beltConnectFrom = null;
    this._hoverBeltKey = null; // 清除悬停状态
    this.sel = null; // 退出建造模式
    document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('active'));
    const beltBtn = document.getElementById('beltConnectBtn');
    if (beltBtn) beltBtn.classList.add('active');
    document.getElementById('buildHint').textContent = '🔗 选择起始建筑（点击格子）';
    document.getElementById('buildHint').style.color = 'var(--cyan)';
    this.log('🔗 手动连接模式 — 点击起始建筑', '');
  },

  cancelBeltConnect() {
    this._beltConnectMode = false;
    this._beltConnectFrom = null;
    document.getElementById('buildHint').textContent = '';
    document.getElementById('buildHint').style.color = '';
    const beltBtn = document.getElementById('beltConnectBtn');
    if (beltBtn) beltBtn.classList.remove('active');
    // 移除高亮
    document.querySelectorAll('.cell.belt-connect-from').forEach(c => c.classList.remove('belt-connect-from'));
    document.querySelectorAll('.cell.belt-connect-target').forEach(c => c.classList.remove('belt-connect-target'));
  },

  handleBeltConnectClick(idx) {
    if (!this._beltConnectMode) return false;

    if (this._beltConnectFrom === null) {
      // 选择起点
      if (!this.grid[idx]) {
        this.log('请选择一个有建筑的格子', 'w');
        return true;
      }
      this._beltConnectFrom = idx;
      // 高亮起点
      const gridEl = document.getElementById('grid');
      const cell = gridEl?.children[idx];
      if (cell) cell.classList.add('belt-connect-from');
      const bd = BLDS[this.grid[idx].type];
      document.getElementById('buildHint').textContent = `🔗 已选 ${bd?.emoji||''}${bd?.n||'建筑'} → 点击目标建筑`;
      this.log(`🔗 起点: ${bd?.emoji||''}${bd?.n||'建筑'} — 点击目标建筑`, '');
      // 高亮可连接的目标
      this._highlightBeltTargets(idx);
      return true;
    } else {
      // 选择终点
      const fromIdx = this._beltConnectFrom;
      if (idx === fromIdx) {
        this.log('不能连接到自身', 'w');
        return true;
      }
      if (!this.grid[idx]) {
        this.log('请选择一个有建筑的格子', 'w');
        return true;
      }
      // 检查距离
      const SZ = this.gridSize;
      const fr = Math.floor(fromIdx / SZ), fc = fromIdx % SZ;
      const tr = Math.floor(idx / SZ), tc = idx % SZ;
      const dist = Math.abs(fr - tr) + Math.abs(fc - tc);
      if (dist > 4) {
        this.log('距离太远（最多4格）', 'w');
        return true;
      }
      // 检查是否已存在（先刷新缓存确保数据最新）
      const key = Math.min(fromIdx, idx) + '-' + Math.max(fromIdx, idx);
      this.refreshBelts();
      if (this.manualBelts[key] || (this._activeBelts || []).some(b => {
        const bk = Math.min(b.fi, b.ti) + '-' + Math.max(b.fi, b.ti);
        return bk === key;
      })) {
        this.log('这两个建筑之间已有传送带', 'w');
        return true;
      }

      // 确定传输的资源（基于两端建筑的 prod/cons 匹配）
      const fromBld = BLDS[this.grid[fromIdx].type];
      const toBld = BLDS[this.grid[idx].type];
      const colors = [], icons = [], labels = [];

      // 找匹配的资源流：from.prod ∩ to.cons
      for (const res of Object.keys(fromBld.prod || {})) {
        if ((toBld.cons || {})[res]) {
          const r = RES[res];
          if (r && !colors.includes(r.c)) {
            colors.push(r.c);
            icons.push(r.icon);
            labels.push(r.n);
          }
        }
      }
      // 也检查反向：to.prod ∩ from.cons
      for (const res of Object.keys(toBld.prod || {})) {
        if ((fromBld.cons || {})[res]) {
          const r = RES[res];
          if (r && !colors.includes(r.c)) {
            colors.push(r.c);
            icons.push(r.icon);
            labels.push(r.n);
          }
        }
      }

      if (colors.length === 0) {
        // 没有匹配资源，用通用样式
        colors.push('#4a6a8a');
        icons.push('📦');
        labels.push('通用');
      }

      // 如果这个key被之前removedBelts标记，移除标记
      delete this.removedBelts[key];

      this.manualBelts[key] = {
        fi: fromIdx, ti: idx,
        colors, icons, labels,
      };

      this.log(`🔗 传送带已连接: ${fromBld?.emoji||''}${fromBld?.n||''} → ${toBld?.emoji||''}${toBld?.n||''}`, 's');
      SFX.build();
      this.cancelBeltConnect();
      this.refreshBelts(); // 立即刷新传送带缓存
      this.updateRates();
      this.updateUI();
      return true;
    }
  },

  _highlightBeltTargets(fromIdx) {
    const gridEl = document.getElementById('grid');
    if (!gridEl) return;
    const SZ = this.gridSize;
    const fr = Math.floor(fromIdx / SZ), fc = fromIdx % SZ;
    for (let i = 0; i < this.grid.length; i++) {
      if (i === fromIdx || !this.grid[i]) continue;
      const tr = Math.floor(i / SZ), tc = i % SZ;
      const dist = Math.abs(fr - tr) + Math.abs(fc - tc);
      if (dist <= 4) {
        const cell = gridEl.children[i];
        if (cell) cell.classList.add('belt-connect-target');
      }
    }
  },

  // 批量升级同类型传送带
  showBeltGroupUpgradePopup(keys, fromName, toName) {
    // 筛选出还没满级的传送带
    const upgradeable = keys.filter(k => this.getBeltLevel(k) < 5);
    if (upgradeable.length === 0) {
      this.log('该类型传送带已全部满级 Lv.5', 'w');
      return;
    }
    // 取最低等级的那些（统一升级到同一等级）
    const minLv = Math.min(...upgradeable.map(k => this.getBeltLevel(k)));
    const toUpgrade = upgradeable.filter(k => this.getBeltLevel(k) === minLv);
    const count = toUpgrade.length;
    const unitCost = this.getBeltUpgradeCost(toUpgrade[0]);
    if (!unitCost) return;

    // 总费用 = 单条费用 × 数量
    const totalCost = {};
    for (let r in unitCost) totalCost[r] = unitCost[r] * count;

    this._beltUpgradeKeys = toUpgrade;
    this._beltUpgradeKey = null;

    const costStr = Object.entries(totalCost).map(([k,v]) => `${v}${RES[k]?.icon||k}`).join(' + ');
    const curEff = this.getBeltEfficiency(toUpgrade[0]);
    const nextLv = minLv + 1;
    const nextEffMap = { 1: 0.75, 2: 0.9, 3: 1.0, 4: 1.2, 5: 1.5 };
    const nextEff = nextEffMap[nextLv];

    const pop = document.getElementById('beltUpgradePopup');
    if (!pop) return;
    const label = count > 1 ? `⛓ ${fromName} → ${toName} ×${count}` : `⛓ ${fromName} → ${toName}`;
    document.getElementById('beltUpgradeName').textContent = label;
    document.getElementById('beltUpgradeLevel').textContent = `Lv.${minLv} → Lv.${nextLv}`;
    document.getElementById('beltUpgradeEffect').textContent = `传输效率: ${Math.round(curEff*100)}% → ${Math.round(nextEff*100)}%`;
    document.getElementById('beltUpgradeCost').textContent = `造价: ${costStr}`;

    const canAfford = this.checkRes(totalCost);
    document.getElementById('beltUpgradeYes').disabled = !canAfford;
    document.getElementById('beltUpgradeYes').style.opacity = canAfford ? '1' : '0.3';

    pop.classList.add('show');
    this._showBackdrop();
  },

  // ===== CHOICE EVENTS =====
  triggerChoiceEvent() {
    const eligible = CHOICE_EVENTS.filter(e => e.phase <= this.phase);
    if (eligible.length === 0) return;
    const ev = eligible[Math.floor(Math.random() * eligible.length)];
    this.pendingChoice = ev;
    this.showChoicePopup(ev);
  },

  showChoicePopup(ev) {
    const pop = document.getElementById('choicePopup');
    if (!pop) return;
    document.getElementById('choiceTitle').textContent = ev.n;
    document.getElementById('choiceDesc').textContent = ev.d;
    document.getElementById('choiceALabel').textContent = ev.a.label;
    document.getElementById('choiceADesc').textContent = ev.a.desc;
    document.getElementById('choiceBLabel').textContent = ev.b.label;
    document.getElementById('choiceBDesc').textContent = ev.b.desc;
    pop.classList.add('show');
    this._showBackdrop();
    SFX.eventGood();
  },

  chooseA() {
    if (!this.pendingChoice) return;
    this.pendingChoice.a.fn(this);
    this.log(`💡 选择了「${this.pendingChoice.a.label}」— ${this.pendingChoice.a.desc}`, 's');
    SFX.achieve();
    this.screenShake(4);
    this.pendingChoice = null;
    document.getElementById('choicePopup')?.classList.remove('show');
    this._hideBackdrop();
    this.updateUI();
  },

  chooseB() {
    if (!this.pendingChoice) return;
    this.pendingChoice.b.fn(this);
    this.log(`💡 选择了「${this.pendingChoice.b.label}」— ${this.pendingChoice.b.desc}`, 's');
    SFX.achieve();
    this.screenShake(4);
    this.pendingChoice = null;
    document.getElementById('choicePopup')?.classList.remove('show');
    this._hideBackdrop();
    this.updateUI();
  },

  // ===== PRESTIGE SYSTEM =====
  canPrestige() {
    return this.phase >= 3 || this.wonderComplete;
  },

  getPrestigeGain() {
    return PRESTIGE.calcGain(this);
  },

  showPrestigePanel() {
    const pop = document.getElementById('prestigePopup');
    if (!pop) return;
    const gain = this.getPrestigeGain();
    document.getElementById('prestigeGain').textContent = `+${gain} ${PRESTIGE.currencyIcon}${PRESTIGE.currencyName}`;
    document.getElementById('prestigeCurrent').textContent = `当前: ${this.prestigeCurrency} ${PRESTIGE.currencyIcon}`;
    document.getElementById('prestigeTotal').textContent = `转生次数: ${this.prestigeCount}`;

    // Render bonuses
    const list = document.getElementById('prestigeBonusList');
    list.innerHTML = '';
    PRESTIGE.bonuses.forEach((b, i) => {
      const owned = this.prestigeBonuses.includes(i);
      const canBuy = !owned && this.prestigeCurrency >= b.cost;
      const div = document.createElement('div');
      div.style.cssText = `padding:6px 8px;margin:3px 0;border-radius:4px;display:flex;justify-content:space-between;align-items:center;
        background:${owned ? 'rgba(34,197,94,0.08)' : 'var(--color-panel-bg)'};
        border:1px solid ${owned ? 'rgba(34,197,94,0.25)' : canBuy ? 'rgba(234,179,8,0.25)' : 'var(--color-panel-border)'};
        opacity:${owned ? '0.7' : '1'};cursor:${canBuy ? 'pointer' : 'default'}`;
      div.innerHTML = `
        <div>
          <div style="font-size:0.85em;font-weight:700;color:${owned ? 'var(--green)' : 'var(--bright)'}">${owned ? '✓ ' : ''}${b.n}</div>
          <div style="font-size:0.7em;color:var(--dim)">${b.d}</div>
        </div>
        <div style="font-size:0.75em;font-weight:700;color:${canBuy ? 'var(--yellow)' : 'var(--color-muted-dark)'}">${owned ? '已拥有' : `${b.cost}${PRESTIGE.currencyIcon}`}</div>
      `;
      if (canBuy && !owned) {
        div.onclick = () => this.buyPrestigeBonus(i);
      }
      list.appendChild(div);
    });

    const canP = this.canPrestige();
    document.getElementById('prestigeBtn').disabled = !canP;
    document.getElementById('prestigeBtn').style.opacity = canP ? '1' : '0.3';
    pop.classList.add('show');
  },

  buyPrestigeBonus(idx) {
    const b = PRESTIGE.bonuses[idx];
    if (!b || this.prestigeBonuses.includes(idx) || this.prestigeCurrency < b.cost) return;
    this.prestigeCurrency -= b.cost;
    this.prestigeBonuses.push(idx);
    this.log(`🌀 购买转生加成: ${b.n}`, 's');
    SFX.researchDone();
    this.showPrestigePanel(); // refresh
    this.save(true);
  },

  doPrestige() {
    if (!this.canPrestige()) return;
    const gain = this.getPrestigeGain();
    if (!confirm(`确定要转生？\n\n获得 +${gain} ${PRESTIGE.currencyIcon}${PRESTIGE.currencyName}\n\n所有进度将重置（转生加成和货币保留）`)) return;

    this.prestigeCurrency += gain;
    this.prestigeCount++;

    // Save prestige data and reset
    const pData = {
      pc: this.prestigeCurrency,
      pcount: this.prestigeCount,
      pbonuses: [...this.prestigeBonuses],
    };
    localStorage.removeItem('bioSphereV3');
    localStorage.setItem('bioSpherePrestige', JSON.stringify(pData));
    SFX.wonderDone();
    location.reload();
  },

  closePrestige() {
    document.getElementById('prestigePopup')?.classList.remove('show');
  },

  // Apply prestige bonuses on load
  applyPrestigeBonuses() {
    try {
      const pd = localStorage.getItem('bioSpherePrestige');
      if (!pd) return;
      const pData = JSON.parse(pd);
      this.prestigeCurrency = pData.pc || 0;
      this.prestigeCount = pData.pcount || 0;
      this.prestigeBonuses = pData.pbonuses || [];

      // Apply owned bonuses
      for (const idx of this.prestigeBonuses) {
        const b = PRESTIGE.bonuses[idx];
        if (b && b.fn) b.fn(this);
      }

      if (this.prestigeCount > 0) {
        this.log(`🌀 转生加成已应用 (第${this.prestigeCount}世)`, 'ev');
        document.querySelector('.topbar')?.classList.add('has-prestige');
      }
    } catch(e){}
  },
};

// ====================================================================
// ===== 游戏术语 Tooltip 系统 =====
// ====================================================================
const GameTooltip = (() => {
  const el = () => document.getElementById('gameTooltip');
  let _showing = false;
  let _hideTimer = null;

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
      const costStr = Object.entries(t.cost).map(([r,v]) => `${v}${RES[r]?.icon||r}`).join(' + ');
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
    dict['种群'] = { title: '🦠 种群', tag: '机制', desc: '你的微生物帝国人口。随建筑增多而增长，每100人口提供额外效率加成。', detail: '人口加成 = 每100人口 +2%效率', color: '#3b82f6' };
    dict['转生'] = { title: '🌀 转生', tag: '系统', desc: '重置进度换取永久加成。保留进化因子可购买转生加成，下一世更快发展。', detail: '评分越高获得的进化因子越多', color: '#eab308' };
    dict['进化因子'] = { title: '🌀 进化因子', tag: '货币', desc: '转生获得的永久货币，用于购买各种跨世代加成。', detail: '评分决定获得数量', color: '#eab308' };
    dict['奇观'] = { title: '🏛️ 奇观', tag: '建筑', desc: '终极建筑，全图仅限建造一座。拥有极其强大的效果。', detail: '微型戴森球: 0消耗 → 12⚡+8🟢+2🧱/s', color: '#a855f7' };
    dict['生物膜'] = { title: '🧱 生物膜', tag: '概念', desc: '微生物聚集形成的保护性结构。在游戏中，生物膜反应器可合成生物质资源。', detail: '生物膜技术科技可解锁生物膜反应器', color: '#10b981' };
    dict['群体感应'] = { title: '📡 群体感应', tag: '机制', desc: '微生物通过分泌信号分子来协调群体行为。游戏中QS信号可提供全局效率加成。', detail: 'QS加成上限: 50%（信号增幅器可提升到80%）\nQS信号会缓慢衰减', color: '#eab308' };
    dict['挑战'] = { title: '🏆 挑战任务', tag: '系统', desc: '限时目标任务，完成后获得效率加成奖励。', detail: '每个阶段解锁新挑战', color: '#f97316' };
    dict['成就'] = { title: '🏅 成就系统', tag: '系统', desc: '达成特定里程碑解锁成就，记录你的帝国发展历程。', detail: '共21项成就可解锁', color: '#eab308' };

    // ===== 右侧面板 — 菌落状态 =====
    dict['细菌种群'] = { title: '🦠 细菌种群', tag: '状态', desc: '你的微生物帝国总人口数量。种群越多，生产效率越高。', detail: '每100人口提供+2%效率加成\n种群上限 = 50 + 建筑数×40 + (阶段-1)×100\n种群需要消耗葡萄糖作为食物', color: '#3b82f6' };
    dict['食物消耗'] = { title: '🍽️ 食物消耗', tag: '机制', desc: '种群需要消耗葡萄糖维持生存。每100人口每秒消耗0.5葡萄糖。', detail: '食物不足时种群会缓慢下降\n保持葡萄糖充足 = 人口稳定增长', color: '#f97316' };
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
    dict['自动化'] = { title: '🤖 自动化（P4）', tag: '阶段', desc: '第四阶段。解锁QS群体感应系统，自动化调控全局效率。', detail: '新建筑：群体感应塔、信号增幅器\nQS信号提供全局效率加成', color: 'var(--yellow)' };

    // ===== 培养皿 & 环境 =====
    dict['培养皿'] = { title: '🔬 培养皿', tag: '系统', desc: '你的微生物帝国主战场。在这个网格中放置建筑、连接传送带。', detail: '拖拽移动 / 双击升级 / 右键回收 / 框选批量\n快捷键：空格暂停 / 1-3加速', color: '#22d3ee' };
    dict['能量供给'] = { title: '⚡ 能量供给', tag: '机制', desc: '帝国核心为碳源采集器提供免费能量驱动，无需消耗ATP。', detail: '供能数量随核心等级提升\nP1:2台 → P2:4台 → P3:6台 → P4:8台 → P5:10台', color: '#22c55e' };
    dict['碳源'] = { title: '🟢 碳源', tag: '资源', desc: '碳元素的来源，即葡萄糖。是整个帝国最基础的资源。', detail: '由碳源采集器通过核心供能采集\n是食物链和产出链的起点', color: '#22c55e' };
    dict['人口'] = dict['细菌种群'];
    dict['人口上限'] = { title: '🦠 人口上限', tag: '机制', desc: '种群数量的最大值。建造更多建筑和升级阶段可提高上限。', detail: '上限 = 50 + 建筑数×40 + (阶段-1)×100 + 科技加成\n「高级种群学」科技额外+200上限', color: '#3b82f6' };

    // ===== 流水线 & 产能链 =====
    dict['流水线'] = { title: '🏭 流水线', tag: '系统', desc: '展示当前激活的资源生产链条。每条流水线由对应建筑激活。', detail: '基础产能 → 能量转化 → DNA合成 → 蛋白质合成 → 生物膜培养 → 群体感应', color: '#60a5fa' };
    dict['基础产能'] = { title: '🏠 基础产能', tag: '流水线', desc: '核心供能驱动碳源采集器，产出葡萄糖。无需任何消耗。', detail: '产出: 1.5🟢葡萄糖/s（基础值）\n受效率和传送带等级加成', color: '#22c55e' };
    dict['能量转化'] = { title: '⚡ 能量转化', tag: '流水线', desc: 'ATP合成酶将葡萄糖转化为ATP能量。', detail: '消耗: 1🟢 → 产出: 2.5⚡/s（基础值）', color: '#f97316' };

    // ===== 建筑等级 & 升级 =====
    dict['建筑等级'] = { title: '⬆ 建筑等级', tag: '机制', desc: '每座建筑可升级至Lv.5。双击建筑或点击升级按钮提升等级。', detail: '每级提升约25%产出\n升级消耗随等级递增', color: '#60a5fa' };
    dict['回收'] = { title: '♻️ 回收', tag: '操作', desc: '右键点击建筑可回收，返还50%建造资源并腾出格子空间。', detail: '长按也可触发回收\n合理回收低级建筑是进阶策略', color: '#ef4444' };

    // ===== 环境参数 =====
    dict['pH'] = { title: '🧪 pH', tag: '环境', desc: '培养皿的酸碱度。当前固定为7.0（中性环境），是微生物最适生长条件。', detail: '后续版本可能加入pH变化机制', color: '#22d3ee' };

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
        span.className = 'game-term';
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

  return { init, glossary, scheduleScan, show, hide };
})();

// ===== BOOT =====
// 全局鼠标位置追踪（cursor tooltip 用）
document.addEventListener('mousemove', (e) => { window._lastMouseEvt = e; });
G.init();
GameTooltip.init();
