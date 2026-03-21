// =============================================================
// BIOSPHERE — 最小闭环版
// 单菌株 → 单代谢 → 简单物流 → 自动化 → 小奇观
// =============================================================

// ===== 数字格式化工具 — 大数字 K/M/B/T 缩写 =====
/**
 * formatNum(n, decimals) — 资源值/分数等整数型数字的格式化
 *   ≥1T  → "1.23T"    ≥1B  → "1.23B"
 *   ≥1M  → "1.23M"    ≥10K → "12.3K"
 *   ≥1K  → "1,234"    <1K  → 原始整数
 *   负数同理，带负号
 */
function formatNum(n, decimals) {
  if (n == null || isNaN(n)) return '0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e12) return sign + (abs / 1e12).toFixed(decimals != null ? decimals : 2) + 'T';
  if (abs >= 1e9)  return sign + (abs / 1e9).toFixed(decimals != null ? decimals : 2) + 'B';
  if (abs >= 1e6)  return sign + (abs / 1e6).toFixed(decimals != null ? decimals : 2) + 'M';
  if (abs >= 1e4)  return sign + (abs / 1e3).toFixed(decimals != null ? decimals : 1) + 'K';
  if (abs >= 1e3)  return sign + Math.floor(abs).toLocaleString();
  return sign + String(Math.floor(abs));
}

/**
 * formatRate(v, decimals) — 速率型数字的格式化（带 +/- 和 /s）
 *   大数值自动缩写，小数值保留精度
 */
function formatRate(v, decimals) {
  if (v == null || isNaN(v)) return '0/s';
  const abs = Math.abs(v);
  const sign = v > 0 ? '+' : v < 0 ? '-' : '';
  const d = decimals != null ? decimals : (abs >= 1e4 ? 1 : abs >= 100 ? 1 : 2);
  let str;
  if (abs >= 1e12) str = (abs / 1e12).toFixed(2) + 'T';
  else if (abs >= 1e9)  str = (abs / 1e9).toFixed(2) + 'B';
  else if (abs >= 1e6)  str = (abs / 1e6).toFixed(2) + 'M';
  else if (abs >= 1e4)  str = (abs / 1e3).toFixed(1) + 'K';
  else str = abs.toFixed(d);
  return sign + str + '/s';
}

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

    // ★ 终局高潮 — 史诗终章音效（比wonderDone更宏大、更持久）
    wonderFinale() {
      if (!sfxOn) return;
      // Phase 1: 深沉冲击波 (0s)
      playTone(40, 1.0, 'sine', 0.4);
      playTone(80, 0.8, 'sine', 0.25);
      playNoise(0.4, 0.2, 'lowpass', 200);
      // Phase 2: 上行色彩音阶 — 从深到高 (0.3s - 1.5s)
      const ascend = [131, 165, 196, 262, 330, 392, 523, 659, 784, 1047, 1319, 1568];
      ascend.forEach((f, i) => {
        const t = 0.3 + i * 0.1;
        playTone(f, 0.5, 'sine', 0.08 + i * 0.005, 0, t);
        playTone(f * 1.005, 0.4, 'triangle', 0.04, 5, t); // 微失谐增加厚度
      });
      // Phase 3: 持续大和弦 — C大调+附加音 (1.5s)
      const chord = [262, 330, 392, 523, 659, 784, 1047, 1319];
      chord.forEach(f => {
        playTone(f, 2.5, 'sine', 0.08, 0, 1.5);
        playTone(f, 2.0, 'triangle', 0.04, 2, 1.6);
      });
      // Phase 4: 高频余韵闪烁 (2.5s - 4s)
      for (let i = 0; i < 8; i++) {
        const shimmerF = 1500 + Math.random() * 2000;
        playTone(shimmerF, 0.3, 'sine', 0.03, 0, 2.5 + i * 0.2);
      }
      // 最终定音 — 低沉而温暖 (3.5s)
      playTone(131, 3.0, 'sine', 0.12, 0, 3.5);
      playTone(262, 2.5, 'sine', 0.08, 0, 3.5);
      playTone(392, 2.0, 'triangle', 0.05, 0, 3.5);
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

// ===== 方案A：建筑维护费系统 =====
// P1免维护（教学保护），P2起逐阶段开启，建筑越多维护费递增
const MAINTENANCE = {
  // 各阶段建筑的基础维护费（每秒）— v2.0：葡萄糖为主，能量为辅
  baseCost: {
    1: {},                                         // P1完全免维护
    2: { glucose: 0.15, energy: 0.05 },            // P2建筑：葡萄糖为主
    3: { glucose: 0.20, energy: 0.08 },            // P3建筑：葡萄糖+少量能量
    4: { glucose: 0.25, energy: 0.10, protein: 0.03 }, // P4建筑：三资源维护
    5: {},                                         // P5奇观免维护（终极奖励）
  },
  overheadThreshold: 12, // v2.0: 原8→12，超过此数量开始收取管理开销
  overheadRate: 0.04,    // v2.0: 原6%→4%，每多1个建筑，维护费+4%
  maxOverhead: 1.6,      // v2.0: 原180%→160%，管理开销上限
  // 特殊建筑豁免
  exempt: ['microDyson', 'transport', 'metabolicLoop'], // 奇观、菌丝网、代谢回路免维护
};

// ===== 方案C：资源竞争/供给上限系统 =====
// 当某资源的消耗总量接近产出时，所有消费建筑效率下降
const RESOURCE_COMPETITION = {
  startPhase: 3,          // P3起生效（P1-P2是教学期）
  tensionThreshold: 0.85, // v2.0: 原0.75→0.85，消耗/产出 > 85% 时开始竞争
  // 竞争烈度：供需比从0.85→1.0时，效率从100%→最低值
  minEfficiency: 0.6,     // v2.0: 原0.5→0.6，竞争最严重时效率不低于60%
  // 传送带直连的建筑享受优先供给
  beltPriorityBonus: 0.15, // 有传送带连线的消费建筑额外+15%有效供给
  // v2.0: P3初期缓冲 — 前180秒使用渐进阈值
  p3BufferDuration: 180,   // P3初期缓冲180秒（3分钟）
  p3BufferThreshold: 0.95, // 缓冲期间阈值从95%渐进降到85%
};

// ===== P2-2: 游戏平衡常量 — 替代散落的魔法数字 =====
const BALANCE = {
  // 种群系统
  popFoodCost: 0.005,         // 每个体每秒葡萄糖消耗
  popHarvestBonus: 0.003,     // 每个采集个体的产出加成系数
  popLogisticsBonus: 0.0005,  // 每个物流个体的效率加成系数
  popGrowthRate: 0.03,        // 种群基础增长率 (per building)
  // 维护费
  maintLevelMult: 0.15,       // 建筑每升1级维护费+15%
  maintDormantMult: 0.25,     // 休眠建筑维护费降至25%
  maintConsReduceCap: 0.4,    // 代谢回路减维护上限40%
  maintConsReduceScale: 1.5,  // consReduce → maintReduce 的换算系数
  // 物流
  transportBaseRate: 0.10,    // 菌丝运输网基础加成率
  consReduceCap: 0.3,         // 代谢回路减消耗上限30%
  // 传送带
  beltMaintPerDist: 0.3,      // 远距传送带每格超出距离的ATP维护费
  beltMaintMinDist: 3,        // 触发远距维护费的最小距离
  // QS系统
  qsBoostPerLevel: 0.03,      // 每QS等级加成3%
  qsBaseCap: 0.6,             // QS加成基础上限60%
  // QS衰减
  qsProportionalDecay: 0.03,  // QS比例衰减率
  qsMinDecay: 0.02,           // QS最低衰减速度
};

// ===== PORT SYSTEM — 端口连接数约束 =====
const PORT_DEFS = {
  // Phase 1
  glucoseCollector: { maxIn: 0, maxOut: 2, role: 'source' },
  energyStation:    { maxIn: 2, maxOut: 3, role: 'converter' },
  simpleExtractor:  { maxIn: 2, maxOut: 1, role: 'converter' },
  energyBuffer:     { maxIn: 1, maxOut: 2, role: 'bypass' },
  // Phase 2
  nitrogenFixer:    { maxIn: 1, maxOut: 2, role: 'converter' },
  proteinFactory:   { maxIn: 2, maxOut: 2, role: 'converter' },
  geneExtractor:    { maxIn: 2, maxOut: 1, role: 'converter' },
  aminoSynth:       { maxIn: 2, maxOut: 1, role: 'bypass' },
  ribosomeCluster:  { maxIn: 2, maxOut: 2, role: 'converter' },
  // Phase 3
  biofilmReactor:   { maxIn: 3, maxOut: 2, role: 'converter' },
  transport:        { maxIn: 0, maxOut: 0, role: 'boost' },
  sporeSower:       { maxIn: 2, maxOut: 2, role: 'converter' },
  metabolicLoop:    { maxIn: 0, maxOut: 0, role: 'boost' },
  biomassConverter: { maxIn: 2, maxOut: 1, role: 'bypass' },
  quantumExtractor: { maxIn: 2, maxOut: 1, role: 'bypass' },
  fermentVacuole:   { maxIn: 2, maxOut: 2, role: 'bypass' },
  signalRelay:      { maxIn: 3, maxOut: 3, role: 'relay' },  // v3.0 §5: 中继节点
  // Phase 4
  qsController:    { maxIn: 1, maxOut: 2, role: 'converter' },
  nanoAssembler:    { maxIn: 2, maxOut: 2, role: 'converter' },
  pheromoneStation: { maxIn: 2, maxOut: 1, role: 'bypass' },
  resonanceChamber: { maxIn: 2, maxOut: 3, role: 'converter' },
  // Phase 5
  microDyson:       { maxIn: 0, maxOut: 4, role: 'wonder' },
};

/** 获取建筑已使用的端口数 */
function getUsedPorts(idx, direction) {
  const belts = G._activeBelts || [];
  const type = G.grid[idx]?.type;
  if (!type) return 0;
  let count = 0;
  for (const belt of belts) {
    if (belt.fi !== idx && belt.ti !== idx) continue;
    const otherIdx = belt.fi === idx ? belt.ti : belt.fi;
    const otherType = G.grid[otherIdx]?.type;
    if (!otherType) continue;
    if (direction === 'in') {
      if (FLOW_PAIR.has(otherType + '|' + type)) count++;
    } else {
      if (FLOW_PAIR.has(type + '|' + otherType)) count++;
    }
  }
  return count;
}

/** 检查建筑是否还有可用端口 */
function hasAvailablePort(idx, direction) {
  const type = G.grid[idx]?.type;
  if (!type) return false;
  const def = PORT_DEFS[type];
  if (!def) return true;
  // 科技加成：自适应物流 +1 输出端口
  const techExtra = (direction === 'out' && G._extraOutPorts) ? G._extraOutPorts : 0;
  // v2.1 §9.2/§9.3: 突变+转生端口加成
  const mpb = G._mutPortBonuses?.[type];
  const mutExtra = mpb ? (direction === 'out' ? mpb.extraOut : mpb.extraIn) : 0;
  // v3.0 §9.2: 建筑特化端口加成
  const specBld = G._specCache?.perBuilding?.[idx];
  let specExtra = 0;
  if (specBld) {
    if (direction === 'out' && specBld.extraOutPort) specExtra += specBld.extraOutPort;
    if (specBld.extraPorts) specExtra += specBld.extraPorts; // relay_hub: 双向+N
  }
  const max = direction === 'in' ? def.maxIn : def.maxOut;
  // v3.0 §8.3: 端口催化剂 +1
  const catalystExtra = G._isCatalystActive?.('portExtra') ? 1 : 0;
  return getUsedPorts(idx, direction) < (max + techExtra + mutExtra + specExtra + catalystExtra);
}

/**
 * 计算建筑的端口效率折扣
 * 端口利用率(已连/总端口) > 50% 时，维护费按比例减免
 * @returns {number} 维护费乘数 (0.80~1.00)
 */
function getPortEfficiencyDiscount(idx) {
  const type = G.grid[idx]?.type;
  if (!type) return 1.0;
  const def = PORT_DEFS[type];
  if (!def) return 1.0;
  const totalPorts = def.maxIn + def.maxOut;
  if (totalPorts === 0) return 1.0;
  const usedIn = getUsedPorts(idx, 'in');
  const usedOut = getUsedPorts(idx, 'out');
  const utilization = (usedIn + usedOut) / totalPorts;
  if (utilization <= 0.5) return 1.0;
  const discount = (utilization - 0.5) * 0.4; // 最大0.2 = 20%减免
  return 1.0 - discount;
}

// ===== v2.0 BELT MODE — P2 hybrid传送带模式 =====
const BELT_MODE = {
  1: 'auto',      // P1: 纯自动
  2: 'hybrid',    // P2: 自动+可选手动
  3: 'manual',    // P3+: 纯手动
};

/**
 * v2.0 §10.2 — 计算某格子放置指定建筑后的邻接加成数
 * @param {number} idx - 格子索引
 * @param {string} bldType - 建筑类型
 * @returns {{ count: number, bonuses: Array }}
 */
function previewAdjacencyBonuses(idx, bldType) {
  const neighbors = G.getNeighbors(idx);
  const bonuses = [];

  for (const rule of ADJACENCY_RULES) {
    // 只计算当前阶段已解锁的规则
    if (rule.phase && rule.phase > G.phase) continue;

    // 正向：新建筑作为self，邻居中有匹配的neighbor
    if (rule.self === '*' || rule.self === bldType) {
      for (const nIdx of neighbors) {
        const nType = G.grid[nIdx]?.type;
        if (!nType) continue;
        if (rule.neighbor !== nType) continue;
        bonuses.push({
          rule: rule,
          neighborIdx: nIdx,
          bonus: rule.bonus,
          isReverse: false,
        });
      }
    }

    // 反向：新建筑作为neighbor，对已有建筑(self)的加成
    if (rule.neighbor === bldType) {
      for (const nIdx of neighbors) {
        const nType = G.grid[nIdx]?.type;
        if (!nType) continue;
        if (rule.self !== '*' && rule.self !== nType) continue;
        // 避免与正向重复（当self和neighbor类型相同时）
        if ((rule.self === '*' || rule.self === bldType) && rule.neighbor === bldType && nType === bldType) continue;
        bonuses.push({
          rule: rule,
          neighborIdx: nIdx,
          bonus: rule.bonus,
          isReverse: true,
        });
      }
    }
  }

  return { count: bonuses.length, bonuses };
}

/**
 * v2.0 §10.5 — 检查两个建筑是否具有"有效邻接"关系
 * 有效邻接 = 物理相邻(上下左右) OR 传送带直连
 * @returns {'physical'|'virtual'|false}
 */
function isEffectivelyAdjacent(idx1, idx2) {
  // 物理相邻
  if (G.getNeighbors(idx1).includes(idx2)) return 'physical';

  // 传送带直连（虚拟邻接）
  const belts = G._activeBelts || [];
  const connected = belts.some(b =>
    (b.fi === idx1 && b.ti === idx2) ||
    (b.fi === idx2 && b.ti === idx1)
  );
  return connected ? 'virtual' : false;
}

const PHASES = [
  { id:1, name:'采集', color:'var(--green)', desc:'建造采集器收集基础资源', icon:'🌱' },
  { id:2, name:'代谢', color:'var(--orange)', desc:'转化资源产生高级材料', icon:'⚗️' },
  { id:3, name:'物流', color:'var(--blue)', desc:'建立运输网络提升效率', icon:'🔗' },
  { id:4, name:'自动化', color:'var(--yellow)', desc:'QS信号自动化控制', icon:'🧠' },
  { id:5, name:'奇观', color:'var(--purple)', desc:'建造终极生物奇观！', icon:'🏛️' },
];

// ===== PHASE COLORS — 阶段色彩演变系统（Phase A 视觉叙事） =====
const PHASE_COLORS = {
  1: { primary:'#22c55e', glow:'rgba(34,197,94,0.3)',  tint:'rgba(34,197,94,0.02)',  border:'rgba(34,197,94,0.35)' },
  2: { primary:'#f97316', glow:'rgba(249,115,22,0.3)', tint:'rgba(249,115,22,0.02)', border:'rgba(249,115,22,0.35)' },
  3: { primary:'#3b82f6', glow:'rgba(59,130,246,0.3)', tint:'rgba(59,130,246,0.02)', border:'rgba(59,130,246,0.35)' },
  4: { primary:'#eab308', glow:'rgba(234,179,8,0.3)',  tint:'rgba(234,179,8,0.02)',  border:'rgba(234,179,8,0.35)' },
  5: { primary:'#a855f7', glow:'rgba(168,85,247,0.3)', tint:'rgba(168,85,247,0.02)', border:'rgba(168,85,247,0.35)' },
};

/** 将阶段色彩应用到 CSS 变量 — 界面色调在1.5秒内平滑过渡 */
function setPhaseColors(phase) {
  const c = PHASE_COLORS[phase] || PHASE_COLORS[1];
  const root = document.documentElement;
  root.style.setProperty('--phase-primary', c.primary);
  root.style.setProperty('--phase-glow', c.glow);
  root.style.setProperty('--phase-bg-tint', c.tint);
  root.style.setProperty('--phase-border', c.border);
}

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
  energyBuffer: {
    n:'能量缓冲池', phase:1,
    d:'存储溢出能量再释放',
    ratio:'0.6🟢 → 1.8⚡/s',
    cost:{ glucose:30, energy:15 }, prod:{ energy:1.8 }, cons:{ glucose:0.6 },
    color:'#fb923c', bg:'bg-orange', emoji:'🪫', tier:1,
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
  aminoSynth: {
    n:'氨基酸合成仪', phase:2,
    d:'氮源+葡萄糖→蛋白质（旁路）',
    ratio:'0.5🔵 + 0.8🟢 → 0.45🧪/s',
    cost:{ nitrogen:15, glucose:20 }, prod:{ protein:0.45 }, cons:{ nitrogen:0.5, glucose:0.8 },
    color:'#f472b6', bg:'bg-pink', emoji:'🧬', tier:2, techReq:'basicMetab',
  },
  ribosomeCluster: {
    n:'核糖体集群', phase:2,
    d:'蛋白质+DNA→高效DNA',
    ratio:'0.3🧪 + 0.5⚡ → 0.6🧬 + 0.1🟢/s',
    cost:{ protein:25, dna:8 }, prod:{ dna:0.6, glucose:0.1 }, cons:{ protein:0.3, energy:0.5 },
    color:'#c084fc', bg:'bg-purple', emoji:'🫧', tier:2, techReq:'basicMetab',
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
  sporeSower: {
    n:'孢子播种器', phase:3,
    d:'生物质→远距传播增殖',
    ratio:'0.4🧱 + 0.5⚡ → 0.3🧬 + 0.5🔵/s',
    cost:{ biomass:18, energy:30 }, prod:{ dna:0.3, nitrogen:0.5 }, cons:{ biomass:0.4, energy:0.5 },
    color:'#34d399', bg:'bg-teal', emoji:'🍄', tier:3, techReq:'biofilmTech',
  },
  metabolicLoop: {
    n:'代谢回路', phase:3,
    d:'循环再利用提升效率',
    ratio:'全局产出 +8%，消耗-5%',
    cost:{ biomass:20, protein:15 }, prod:{}, cons:{},
    color:'#06b6d4', bg:'bg-teal', emoji:'♻️', tier:3, isBoost:true, boostVal:0.08, consReduce:0.05, techReq:'biofilmTech',
  },

  // Phase 4 — 自动化
  qsController: {
    n:'群体感应塔', phase:4,
    d:'能量→QS信号',
    ratio:'2⚡ → 0.8📡/s',
    cost:{ protein:40, dna:20, energy:40 }, prod:{ qs:0.8 }, cons:{ energy:2 },
    color:'#eab308', bg:'bg-yellow', emoji:'🗼', tier:4, techReq:'quorumSensing',
  },
  nanoAssembler: {
    n:'纳米组装线', phase:4,
    d:'QS控制精密组装',
    ratio:'0.3📡 + 1.5⚡ → 1.2🧱 + 0.4🧪/s',
    cost:{ qs:8, protein:30, dna:25 }, prod:{ biomass:1.2, protein:0.4 }, cons:{ qs:0.3, energy:1.5 },
    color:'#a3e635', bg:'bg-yellow', emoji:'🔩', tier:4, techReq:'quorumSensing',
  },
  pheromoneStation: {
    n:'信息素广播站', phase:4,
    d:'蛋白质→QS（辅助路线）',
    ratio:'0.6🧪 + 0.5⚡ → 0.5📡/s',
    cost:{ protein:35, biomass:15 }, prod:{ qs:0.5 }, cons:{ protein:0.6, energy:0.5 },
    color:'#facc15', bg:'bg-yellow', emoji:'📢', tier:4, techReq:'quorumSensing',
  },

  // Phase 3 — 旁路建筑（新增）
  biomassConverter: {
    n:'生物质转化炉', phase:3,
    d:'蛋白质直接转化生物质（旁路）',
    ratio:'0.6🧪 + 0.8⚡ → 0.5🧱 + 0.1🧬/s',
    cost:{ protein:30, energy:35 }, prod:{ biomass:0.5, dna:0.1 }, cons:{ protein:0.6, energy:0.8 },
    color:'#2dd4bf', bg:'bg-teal', emoji:'🔥', tier:3, techReq:'biofilmTech',
  },
  quantumExtractor: {
    n:'噬菌体裂解器', phase:3,
    d:'氮源+能量→裂解释放高纯DNA（旁路）',
    ratio:'0.6🔵 + 1.2⚡ → 0.7🧬/s',
    cost:{ nitrogen:20, energy:40, dna:10 }, prod:{ dna:0.7 }, cons:{ nitrogen:0.6, energy:1.2 },
    color:'#818cf8', bg:'bg-purple', emoji:'💎', tier:3, techReq:'biofilmTech',
  },
  fermentVacuole: {
    n:'发酵液泡', phase:3,
    d:'生物质+蛋白质→能量（替代路线）',
    ratio:'0.5🧱 + 0.3🧪 → 2.0⚡/s',
    cost:{ biomass:20, protein:15, energy:35 },
    prod:{ energy:2.0 }, cons:{ biomass:0.5, protein:0.3 },
    color:'#f59e0b', bg:'bg-amber', emoji:'🫧', tier:3, techReq:'biofilmTech',
  },

  // Phase 3 — v3.0 §5: 信号中继站（P3b物流辅助）
  signalRelay: {
    n:'信号中继站', phase:3,
    d:'化学信号中继·延伸物流距离',
    ratio:'中继模式·衰减减半',
    cost:{ protein:8, biomass:5 }, prod:{}, cons:{},
    color:'#60a5fa', bg:'bg-blue', emoji:'📡', tier:3,
    isRelay: true, // 标记为中继建筑
    techReq:'biofilmTech', // P3b解锁后可建
  },

  // Phase 4 — 旁路建筑（新增）
  resonanceChamber: {
    n:'共振培养箱', phase:4,
    d:'QS驱动的多资源转化器',
    ratio:'0.2📡 + 1⚡ → 0.4🟢 + 0.3🔵 + 0.2🧪/s',
    cost:{ qs:10, protein:25, biomass:15 }, prod:{ glucose:0.4, nitrogen:0.3, protein:0.2 }, cons:{ qs:0.2, energy:1 },
    color:'#c084fc', bg:'bg-purple', emoji:'🌀', tier:4, techReq:'quorumSensing',
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

// ===== ADJACENCY BONUS SYSTEM =====
// 相邻建筑加成规则：当格子四周（上下左右）存在特定建筑时，获得产出加成
// bonus: 产出乘数加成（0.15 = +15%）
// stackable: 同种加成是否可叠加（多个同类邻居各给一次）
// maxStack: 最大叠加次数
const ADJACENCY_RULES = [
  // ═══════════════════════════════════════════════════
  // ① 同类协同 — 同类建筑集群放置获得加成
  // ═══════════════════════════════════════════════════
  { self:'glucoseCollector', neighbor:'glucoseCollector', bonus:0.10, name:'碳源共振', icon:'🌱', stackable:true, maxStack:3, phase:1 },
  { self:'energyStation',    neighbor:'energyStation',    bonus:0.08, name:'能量串联', icon:'⚡', stackable:true, maxStack:3, phase:1 },
  { self:'nitrogenFixer',    neighbor:'nitrogenFixer',    bonus:0.12, name:'固氮协同', icon:'💨', stackable:true, maxStack:2, phase:2 },
  { self:'proteinFactory',   neighbor:'proteinFactory',   bonus:0.10, name:'蛋白质流水线', icon:'⚗️', stackable:true, maxStack:2, phase:2 },
  { self:'geneExtractor',    neighbor:'geneExtractor',    bonus:0.08, name:'DNA双螺旋', icon:'🧬', stackable:true, maxStack:2, phase:2 },
  { self:'biofilmReactor',   neighbor:'biofilmReactor',   bonus:0.10, name:'生物膜矩阵', icon:'🧫', stackable:true, maxStack:2, phase:3 },
  { self:'qsController',     neighbor:'qsController',     bonus:0.12, name:'群体共振', icon:'📡', stackable:true, maxStack:2, phase:4 },

  // ═══════════════════════════════════════════════════
  // ② 核心上下游供给链 — 上游紧邻下游 → 效率加成（★ 核心玩法）
  // ═══════════════════════════════════════════════════
  // Phase 1 核心链: 碳源 → ATP合成酶
  { self:'energyStation',    neighbor:'glucoseCollector', bonus:0.15, name:'碳源直供', icon:'🔗', stackable:true, maxStack:2, phase:1 },
  // Phase 1: ATP合成酶 → 简易提取器
  { self:'simpleExtractor',  neighbor:'energyStation',    bonus:0.12, name:'能量直供', icon:'🔋', stackable:true, maxStack:2, phase:1 },
  { self:'simpleExtractor',  neighbor:'glucoseCollector', bonus:0.08, name:'碳源捷径', icon:'🌱', stackable:true, maxStack:1, phase:1 },
  // Phase 1: 能量缓冲池联动
  { self:'energyBuffer',     neighbor:'glucoseCollector', bonus:0.10, name:'储能直供', icon:'🔋', stackable:true, maxStack:2, phase:1 },
  { self:'energyBuffer',     neighbor:'energyStation',    bonus:0.15, name:'能量回路', icon:'🪫', stackable:true, maxStack:2, phase:1 },
  // Phase 2: 固氮→蛋白
  { self:'proteinFactory',   neighbor:'nitrogenFixer',    bonus:0.12, name:'氮源直供', icon:'🔵', stackable:true, maxStack:2, phase:2 },
  // Phase 2: ATP→固氮
  { self:'nitrogenFixer',    neighbor:'energyStation',    bonus:0.10, name:'ATP催化', icon:'⚡', stackable:true, maxStack:1, phase:2 },
  // Phase 2: 蛋白→DNA
  { self:'geneExtractor',    neighbor:'proteinFactory',   bonus:0.15, name:'蛋白直供', icon:'🧪', stackable:true, maxStack:2, phase:2 },
  // Phase 2: ATP→蛋白（次级）
  { self:'proteinFactory',   neighbor:'energyStation',    bonus:0.08, name:'ATP辅助', icon:'⚡', stackable:true, maxStack:1, phase:2 },
  // Phase 2: ATP→DNA
  { self:'geneExtractor',    neighbor:'energyStation',    bonus:0.08, name:'ATP驱动', icon:'⚡', stackable:true, maxStack:1, phase:2 },
  // Phase 2: 氨基酸合成 — 需要氮+碳
  { self:'aminoSynth',       neighbor:'nitrogenFixer',    bonus:0.12, name:'氨基酸捷径', icon:'🧬', stackable:true, maxStack:2, phase:2 },
  { self:'aminoSynth',       neighbor:'glucoseCollector', bonus:0.10, name:'碳骨架直供', icon:'🌱', stackable:true, maxStack:1, phase:2 },
  // Phase 2: 核糖体 — 需要蛋白+ATP
  { self:'ribosomeCluster',  neighbor:'proteinFactory',   bonus:0.12, name:'核糖体协同', icon:'🫧', stackable:true, maxStack:2, phase:2 },
  { self:'ribosomeCluster',  neighbor:'energyStation',    bonus:0.08, name:'翻译加速', icon:'⚡', stackable:true, maxStack:1, phase:2 },
  // Phase 3: 生物膜 — 需要碳+氮+ATP
  { self:'biofilmReactor',   neighbor:'glucoseCollector', bonus:0.10, name:'碳源直通', icon:'🌱', stackable:true, maxStack:2, phase:3 },
  { self:'biofilmReactor',   neighbor:'nitrogenFixer',    bonus:0.12, name:'氮源直通', icon:'🔵', stackable:true, maxStack:2, phase:3 },
  { self:'biofilmReactor',   neighbor:'energyStation',    bonus:0.08, name:'ATP直通', icon:'⚡', stackable:true, maxStack:1, phase:3 },
  // Phase 3: 孢子播种器 — 需要生物质+ATP
  { self:'sporeSower',       neighbor:'biofilmReactor',   bonus:0.15, name:'生物质通道', icon:'🧱', stackable:true, maxStack:2, phase:3 },
  { self:'sporeSower',       neighbor:'energyStation',    bonus:0.08, name:'弹射加速', icon:'⚡', stackable:true, maxStack:1, phase:3 },
  // Phase 4: QS塔 — 需要ATP
  { self:'qsController',     neighbor:'energyStation',    bonus:0.12, name:'能量共鸣', icon:'⚡', stackable:true, maxStack:2, phase:4 },
  // Phase 4: 纳米组装 — 需要QS+ATP
  { self:'nanoAssembler',    neighbor:'qsController',     bonus:0.18, name:'QS直连', icon:'📡', stackable:true, maxStack:2, phase:4 },
  { self:'nanoAssembler',    neighbor:'energyStation',    bonus:0.08, name:'组装加速', icon:'⚡', stackable:true, maxStack:1, phase:4 },
  // Phase 4: 信息素广播 — 需要蛋白+ATP
  { self:'pheromoneStation',  neighbor:'proteinFactory',  bonus:0.12, name:'底物直供', icon:'🧪', stackable:true, maxStack:1, phase:4 },
  { self:'pheromoneStation',  neighbor:'energyStation',   bonus:0.08, name:'广播加速', icon:'⚡', stackable:true, maxStack:1, phase:4 },

  // ═══════════════════════════════════════════════════
  // ③ 特殊增益建筑邻接 — 菌丝/回路放在产线中心
  // ═══════════════════════════════════════════════════
  { self:'*',                neighbor:'transport',        bonus:0.06, name:'菌丝渗透', icon:'🕸️', stackable:true, maxStack:3, phase:3 },
  { self:'*',                neighbor:'metabolicLoop',    bonus:0.05, name:'代谢催化', icon:'♻️', stackable:true, maxStack:2, phase:3 },
  { self:'*',                neighbor:'energyBuffer',     bonus:0.04, name:'缓冲增益', icon:'🪫', stackable:true, maxStack:2, phase:1 },

  // ═══════════════════════════════════════════════════
  // ④ 跨阶段特殊协同 — 鼓励混合布局
  // ═══════════════════════════════════════════════════
  { self:'sporeSower',       neighbor:'glucoseCollector', bonus:0.06, name:'孢子培养基', icon:'🍄', stackable:true, maxStack:1, phase:3 },
  { self:'qsController',     neighbor:'biofilmReactor',  bonus:0.10, name:'信号介质', icon:'📡', stackable:true, maxStack:1, phase:4 },
  { self:'nanoAssembler',    neighbor:'geneExtractor',    bonus:0.10, name:'纳米模板', icon:'🧬', stackable:true, maxStack:1, phase:4 },
  { self:'pheromoneStation',  neighbor:'qsController',   bonus:0.12, name:'信号耦合', icon:'📡', stackable:true, maxStack:1, phase:4 },

  // ═══════════════════════════════════════════════════
  // ⑤ 旁路建筑专属邻接
  // ═══════════════════════════════════════════════════
  { self:'biomassConverter',  neighbor:'proteinFactory',  bonus:0.15, name:'蛋白直供', icon:'🧪', stackable:true, maxStack:2, phase:3 },
  { self:'biomassConverter',  neighbor:'biofilmReactor',  bonus:0.10, name:'生物质共振', icon:'🧫', stackable:true, maxStack:1, phase:3 },
  { self:'biomassConverter',  neighbor:'energyStation',   bonus:0.08, name:'转化加速', icon:'⚡', stackable:true, maxStack:1, phase:3 },
  { self:'quantumExtractor',  neighbor:'nitrogenFixer',   bonus:0.15, name:'氮源直通', icon:'🔵', stackable:true, maxStack:2, phase:3 },
  { self:'quantumExtractor',  neighbor:'geneExtractor',   bonus:0.10, name:'DNA协同', icon:'🧬', stackable:true, maxStack:1, phase:3 },
  { self:'quantumExtractor',  neighbor:'energyStation',   bonus:0.08, name:'裂解加速', icon:'⚡', stackable:true, maxStack:1, phase:3 },
  { self:'resonanceChamber',  neighbor:'qsController',    bonus:0.18, name:'QS共振', icon:'📡', stackable:true, maxStack:2, phase:4 },
  { self:'resonanceChamber',  neighbor:'pheromoneStation', bonus:0.12, name:'信号反馈', icon:'📡', stackable:true, maxStack:1, phase:4 },
  { self:'resonanceChamber',  neighbor:'resonanceChamber', bonus:0.10, name:'共振叠加', icon:'🌀', stackable:true, maxStack:2, phase:4 },

  // ═══════════════════════════════════════════════════
  // ⑥ 发酵液泡邻接
  // ═══════════════════════════════════════════════════
  { self:'fermentVacuole',   neighbor:'biofilmReactor',   bonus:0.15, name:'发酵直供', icon:'🧱', stackable:true, maxStack:2, phase:3 },
  { self:'fermentVacuole',   neighbor:'proteinFactory',   bonus:0.12, name:'蛋白催化', icon:'🧪', stackable:true, maxStack:1, phase:3 },
  { self:'fermentVacuole',   neighbor:'energyStation',    bonus:0.08, name:'能量串联', icon:'⚡', stackable:true, maxStack:1, phase:3 },
  { self:'fermentVacuole',   neighbor:'fermentVacuole',   bonus:0.10, name:'液泡矩阵', icon:'🫧', stackable:true, maxStack:2, phase:3 },
  // 反向：发酵液泡作为邻居对其他建筑的增益
  { self:'biofilmReactor',   neighbor:'fermentVacuole',   bonus:0.08, name:'能量回流', icon:'🫧', stackable:true, maxStack:1, phase:3 },
  { self:'sporeSower',       neighbor:'fermentVacuole',   bonus:0.10, name:'发酵驱动', icon:'🫧', stackable:true, maxStack:1, phase:3 },

  // ═══════════════════════════════════════════════════
  // ⑦ v3.0 §5: 信号中继站邻接
  // ═══════════════════════════════════════════════════
  { self:'signalRelay',      neighbor:'signalRelay',       bonus:0.12, name:'中继共振', icon:'📡', stackable:true, maxStack:2, phase:3 },
  { self:'signalRelay',      neighbor:'biofilmReactor',    bonus:0.08, name:'膜下中继', icon:'🧫', stackable:true, maxStack:1, phase:3 },
  { self:'signalRelay',      neighbor:'transport',         bonus:0.10, name:'菌丝中继', icon:'🕸️', stackable:true, maxStack:1, phase:3 },
  { self:'signalRelay',      neighbor:'sporeSower',        bonus:0.06, name:'孢子中继', icon:'🍄', stackable:true, maxStack:1, phase:3 },
];

// ===== TECHS =====
const TECHS = {
  pureCulture: {
    n:'纯培养技术', phase:1, cost:{ dna:3 }, time:15,
    d:'单菌株纯化', ef:'全局效率+10%',
    fn: s => { s.gEff += 0.1 },
  },
  // Phase 1 分支：二选一路线（互斥）
  efficientHarvest: {
    n:'高效采集', phase:1, cost:{ dna:8 }, time:20,
    d:'优化碳源吸收通路', ef:'碳源采集器产出+30%',
    req:['pureCulture'], exclusive:['rapidMetabolism'],
    fn: s => { s._collectorBonus = (s._collectorBonus || 0) + 0.3 },
  },
  rapidMetabolism: {
    n:'快速代谢', phase:1, cost:{ dna:8, energy:15 }, time:20,
    d:'加速ATP合成反应', ef:'ATP合成酶产出+25%，邻接碳源采集器时额外+10%',
    req:['pureCulture'], exclusive:['efficientHarvest'],
    fn: s => { s._energyBonus = (s._energyBonus || 0) + 0.25; s._energyAdjBonus = 0.10 },
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
    req:['basicMetab'], exclusive:['proteinEngineering'],
    fn: s => { s._nitrogenBonus = (s._nitrogenBonus || 0) + 0.4 },
  },
  proteinEngineering: {
    n:'蛋白质工程', phase:2, cost:{ dna:15, protein:5 }, time:30,
    d:'定向蛋白质折叠', ef:'蛋白质工厂产出+35%',
    req:['basicMetab'], exclusive:['nitrogenCycle'],
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
    d:'智能物流路径规划', ef:'菌丝运输网加成→20%，全局+1输出端口，传送带容量+30%',
    req:['biofilmTech'], exclusive:['symbioticNetwork'],
    fn: s => { s._transportBonus = (s._transportBonus || 0) + 0.10; s._extraOutPorts = 1; s._beltCapBonus = 0.30 }, // v2.1: 0.05→0.10 使菌丝运输网加成从15%→20%
  },
  symbioticNetwork: {
    n:'共生网络', phase:3, cost:{ protein:18, biomass:10 }, time:35,
    d:'建立跨种群共生体系', ef:'种群上限+200，种群加成效率翻倍',
    req:['biofilmTech'], exclusive:['adaptiveLogistics'],
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
    req:['quorumSensing'], exclusive:['evolutionCatalyst'],
    fn: s => { s._qsDecayMult = (s._qsDecayMult || 1) * 0.4; s._qsCapBonus = (s._qsCapBonus || 0) + 0.2 },
  },
  evolutionCatalyst: {
    n:'进化催化剂', phase:4, cost:{ dna:35, protein:25 }, time:40,
    d:'加速生物进化过程', ef:'进化效率奖励翻倍',
    req:['quorumSensing'], exclusive:['signalAmplifier'],
    fn: s => { s._evoBoostMult = (s._evoBoostMult || 1) * 2 },
  },
  dysonTheory: {
    n:'微型戴森理论', phase:5, cost:{ dna:40, protein:20, biomass:15 }, time:60,
    d:'恒星轨道生物膜', ef:'解锁微型戴森球',
    req:['quorumSensing'],
  },
};

// ===== v3.0 §3: TECH PREREQS — 科技研究前置操作条件 =====
// check(s): 是否满足, progress(s): 当前进度, max: 目标值, label: UI显示文字
const TECH_PREREQS = {
  // pureCulture: 无前置条件 (P1入门不设门槛)
  efficientHarvest: {
    label: '拥有3+传送带连接',
    icon: '🔗', max: 3,
    check: s => (s._activeBelts||[]).length >= (s._prereqMax('efficientHarvest')),
    progress: s => Math.min((s._activeBelts||[]).length, s._prereqMax('efficientHarvest')),
  },
  rapidMetabolism: {
    label: '拥有2台ATP合成酶',
    icon: '⚡', max: 2,
    check: s => s.bldCount('energyStation') >= (s._prereqMax('rapidMetabolism')),
    progress: s => Math.min(s.bldCount('energyStation'), s._prereqMax('rapidMetabolism')),
  },
  basicMetab: {
    label: '发现3条邻接规则',
    icon: '🏗️', max: 3,
    check: s => Object.keys(s._discoveredAdj||{}).length >= (s._prereqMax('basicMetab')),
    progress: s => Math.min(Object.keys(s._discoveredAdj||{}).length, s._prereqMax('basicMetab')),
  },
  nitrogenCycle: {
    label: '拥有1条2格+距离传送带',
    icon: '🔗', max: 1,
    check: s => (s.stats.maxBeltDist||0) >= 2,
    progress: s => (s.stats.maxBeltDist||0) >= 2 ? 1 : 0,
  },
  proteinEngineering: {
    label: '完成1个培养皿实验',
    icon: '🧫', max: 1,
    check: s => (s._petriCount||0) >= (s._prereqMax('proteinEngineering')),
    progress: s => Math.min(s._petriCount||0, s._prereqMax('proteinEngineering')),
  },
  biofilmTech: {
    label: '手动连接5+传送带',
    icon: '🔗', max: 5,
    check: s => Object.keys(s.manualBelts||{}).length >= (s._prereqMax('biofilmTech')),
    progress: s => Math.min(Object.keys(s.manualBelts||{}).length, s._prereqMax('biofilmTech')),
  },
  adaptiveLogistics: {
    label: '拥有2条2格+距离传送带',
    icon: '🔗', max: 2,
    check: s => {
      const belts = Object.keys(s.manualBelts||{});
      let c = 0; for (const k of belts) { if (s.getBeltDistance(k) >= 2) c++; }
      return c >= (s._prereqMax('adaptiveLogistics'));
    },
    progress: s => {
      const belts = Object.keys(s.manualBelts||{});
      let c = 0; for (const k of belts) { if (s.getBeltDistance(k) >= 2) c++; }
      return Math.min(c, s._prereqMax('adaptiveLogistics'));
    },
  },
  symbioticNetwork: {
    label: '发现8条邻接规则',
    icon: '🏗️', max: 8,
    check: s => Object.keys(s._discoveredAdj||{}).length >= (s._prereqMax('symbioticNetwork')),
    progress: s => Math.min(Object.keys(s._discoveredAdj||{}).length, s._prereqMax('symbioticNetwork')),
  },
  quorumSensing: {
    label: '2个建筑达到供给同步',
    icon: '⚡', max: 2,
    check: s => Object.values(s._syncBonuses||{}).filter(sb => sb.sync >= 0.5).length >= (s._prereqMax('quorumSensing')),
    progress: s => Math.min(Object.values(s._syncBonuses||{}).filter(sb => sb.sync >= 0.5).length, s._prereqMax('quorumSensing')),
  },
  signalAmplifier: {
    label: '传送带总数≥15',
    icon: '🔗', max: 15,
    check: s => (s._activeBelts||[]).length >= (s._prereqMax('signalAmplifier')),
    progress: s => Math.min((s._activeBelts||[]).length, s._prereqMax('signalAmplifier')),
  },
  evolutionCatalyst: {
    label: '激活2个突变',
    icon: '🧬', max: 2,
    check: s => (s._mutSlots||[]).length >= (s._prereqMax('evolutionCatalyst')),
    progress: s => Math.min((s._mutSlots||[]).length, s._prereqMax('evolutionCatalyst')),
  },
  dysonTheory: {
    label: '传送带总数≥15',
    icon: '🔗', max: 15,
    check: s => (s._activeBelts||[]).length >= (s._prereqMax('dysonTheory')),
    progress: s => Math.min((s._activeBelts||[]).length, s._prereqMax('dysonTheory')),
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
  energyBuffer:`<svg viewBox="0 0 64 64" fill="none"><rect x="14" y="16" width="36" height="34" rx="4" fill="#1a0f05" stroke="#fb923c" stroke-width="1.5"/><rect x="20" y="22" width="24" height="6" rx="2" fill="#fb923c" opacity="0.1" stroke="#fb923c" stroke-width="0.8"/><rect x="20" y="22" width="16" height="6" rx="2" fill="#fb923c" opacity="0.3"><animate attributeName="width" values="6;24;6" dur="3s" repeatCount="indefinite"/></rect><rect x="20" y="32" width="24" height="6" rx="2" fill="#fb923c" opacity="0.1" stroke="#fb923c" stroke-width="0.8"/><rect x="20" y="32" width="12" height="6" rx="2" fill="#fb923c" opacity="0.25"><animate attributeName="width" values="12;24;12" dur="4s" repeatCount="indefinite"/></rect><path d="M30 42l2 0-1 4 2 0-4 6 1-4-2 0z" fill="#fb923c" opacity="0.5"/></svg>`,
  aminoSynth:`<svg viewBox="0 0 64 64" fill="none"><rect x="10" y="12" width="44" height="40" rx="3" fill="#1a0a16" stroke="#f472b6" stroke-width="1.5"/><circle cx="24" cy="26" r="5" fill="none" stroke="#3b82f6" stroke-width="0.8" opacity="0.5"/><text x="24" y="29" text-anchor="middle" fill="#3b82f6" font-size="6" opacity="0.5">N</text><circle cx="40" cy="26" r="5" fill="none" stroke="#22c55e" stroke-width="0.8" opacity="0.5"/><text x="40" y="29" text-anchor="middle" fill="#22c55e" font-size="6" opacity="0.5">C</text><path d="M26 32 L32 38 L38 32" fill="none" stroke="#f472b6" stroke-width="1.2" opacity="0.6"/><circle cx="32" cy="40" r="4" fill="#f472b6" opacity="0.2"><animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite"/></circle></svg>`,
  ribosomeCluster:`<svg viewBox="0 0 64 64" fill="none"><rect x="10" y="12" width="44" height="40" rx="3" fill="#0f0520" stroke="#c084fc" stroke-width="1.5"/><circle cx="24" cy="28" r="6" fill="#c084fc" opacity="0.08" stroke="#c084fc" stroke-width="0.8"/><circle cx="24" cy="28" r="2.5" fill="#c084fc" opacity="0.3"/><circle cx="38" cy="28" r="6" fill="#c084fc" opacity="0.08" stroke="#c084fc" stroke-width="0.8"/><circle cx="38" cy="28" r="2.5" fill="#c084fc" opacity="0.3"/><circle cx="31" cy="38" r="5" fill="#c084fc" opacity="0.06" stroke="#c084fc" stroke-width="0.8"/><circle cx="31" cy="38" r="2" fill="#c084fc" opacity="0.4"><animate attributeName="opacity" values="0.2;0.6;0.2" dur="1.8s" repeatCount="indefinite"/></circle></svg>`,
  sporeSower:`<svg viewBox="0 0 64 64" fill="none"><rect x="10" y="12" width="44" height="40" rx="3" fill="#051510" stroke="#34d399" stroke-width="1.5"/><circle cx="32" cy="30" r="8" fill="#34d399" opacity="0.06" stroke="#34d399" stroke-width="0.8"/><circle cx="32" cy="30" r="3" fill="#34d399" opacity="0.3"/><circle cx="20" cy="22" r="2" fill="#34d399" opacity="0.4"><animate attributeName="cy" values="22;18;22" dur="2s" repeatCount="indefinite"/></circle><circle cx="44" cy="24" r="1.5" fill="#34d399" opacity="0.3"><animate attributeName="cy" values="24;19;24" dur="2.5s" repeatCount="indefinite"/></circle><circle cx="26" cy="42" r="1.8" fill="#34d399" opacity="0.35"><animate attributeName="cy" values="42;37;42" dur="1.8s" repeatCount="indefinite"/></circle><path d="M30 30 L22 22M34 30 L42 24M31 33 L26 42" fill="none" stroke="#34d399" stroke-width="0.6" opacity="0.3"/></svg>`,
  metabolicLoop:`<svg viewBox="0 0 64 64" fill="none"><rect x="10" y="12" width="44" height="40" rx="3" fill="#051218" stroke="#06b6d4" stroke-width="1.5"/><circle cx="32" cy="32" r="12" fill="none" stroke="#06b6d4" stroke-width="1.2" opacity="0.3"/><path d="M32 20 A12 12 0 0 1 44 32" fill="none" stroke="#06b6d4" stroke-width="1.5" opacity="0.6"><animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur="4s" repeatCount="indefinite"/></path><path d="M38 28l2 4-4 0z" fill="#06b6d4" opacity="0.5"><animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur="4s" repeatCount="indefinite"/></path></svg>`,
  nanoAssembler:`<svg viewBox="0 0 64 64" fill="none"><rect x="10" y="12" width="44" height="40" rx="3" fill="#0a1208" stroke="#a3e635" stroke-width="1.5"/><rect x="18" y="22" width="10" height="10" rx="1" fill="none" stroke="#a3e635" stroke-width="0.8" opacity="0.5"/><rect x="36" y="22" width="10" height="10" rx="1" fill="none" stroke="#a3e635" stroke-width="0.8" opacity="0.5"/><rect x="27" y="36" width="10" height="10" rx="1" fill="#a3e635" opacity="0.1" stroke="#a3e635" stroke-width="0.8"/><circle cx="32" cy="41" r="2" fill="#a3e635" opacity="0.5"><animate attributeName="r" values="1.5;3;1.5" dur="2s" repeatCount="indefinite"/></circle><path d="M28 27 L22 27M46 27 L40 27M32 36 L32 33" fill="none" stroke="#a3e635" stroke-width="0.8" opacity="0.4"/></svg>`,
  pheromoneStation:`<svg viewBox="0 0 64 64" fill="none"><rect x="10" y="12" width="44" height="40" rx="3" fill="#151208" stroke="#facc15" stroke-width="1.5"/><circle cx="32" cy="28" r="5" fill="#facc15" opacity="0.15" stroke="#facc15" stroke-width="1"/><path d="M26 28 A8 8 0 0 0 22 36" fill="none" stroke="#facc15" stroke-width="0.8" opacity="0.3"><animate attributeName="opacity" values="0.1;0.5;0.1" dur="2s" repeatCount="indefinite"/></path><path d="M38 28 A8 8 0 0 1 42 36" fill="none" stroke="#facc15" stroke-width="0.8" opacity="0.3"><animate attributeName="opacity" values="0.1;0.5;0.1" dur="2s" begin="0.5s" repeatCount="indefinite"/></path><text x="32" y="44" text-anchor="middle" fill="#facc15" font-size="7" opacity="0.4">📢</text></svg>`,
  // 新旁路建筑 SVG
  signalRelay:`<svg viewBox="0 0 64 64" fill="none"><rect x="10" y="12" width="44" height="40" rx="3" fill="#0a1020" stroke="#60a5fa" stroke-width="1.5"/><circle cx="32" cy="28" r="5" fill="#60a5fa" opacity="0.3"/><circle cx="32" cy="28" r="10" fill="none" stroke="#60a5fa" stroke-width="0.8" opacity="0.2"><animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite"/></circle><circle cx="32" cy="28" r="16" fill="none" stroke="#60a5fa" stroke-width="0.5" opacity="0.1"><animate attributeName="r" values="12;18;12" dur="2.5s" repeatCount="indefinite"/></circle><path d="M20 40 L32 34 L44 40" fill="none" stroke="#60a5fa" stroke-width="1" opacity="0.4"/><circle cx="20" cy="40" r="2" fill="#60a5fa" opacity="0.4"/><circle cx="44" cy="40" r="2" fill="#60a5fa" opacity="0.4"/><text x="32" y="48" text-anchor="middle" fill="#60a5fa" font-size="6" opacity="0.4">📡</text></svg>`,
  biomassConverter:`<svg viewBox="0 0 64 64" fill="none"><rect x="10" y="12" width="44" height="40" rx="3" fill="#051210" stroke="#2dd4bf" stroke-width="1.5"/><path d="M22 25 L32 20 L42 25 L42 38 L32 43 L22 38 Z" fill="#2dd4bf" opacity="0.08" stroke="#2dd4bf" stroke-width="1"/><circle cx="32" cy="32" r="5" fill="#2dd4bf" opacity="0.2"><animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite"/></circle><path d="M28 32 L36 32M32 28 L32 36" stroke="#2dd4bf" stroke-width="1.5" opacity="0.4"/></svg>`,
  quantumExtractor:`<svg viewBox="0 0 64 64" fill="none"><rect x="10" y="12" width="44" height="40" rx="3" fill="#0a0818" stroke="#818cf8" stroke-width="1.5"/><circle cx="32" cy="30" r="10" fill="none" stroke="#818cf8" stroke-width="0.8" opacity="0.3"/><circle cx="32" cy="30" r="5" fill="none" stroke="#818cf8" stroke-width="1.2" opacity="0.5"><animate attributeName="r" values="4;7;4" dur="2.5s" repeatCount="indefinite"/></circle><circle cx="32" cy="30" r="2" fill="#818cf8" opacity="0.6"/><path d="M24 42 L32 38 L40 42" fill="none" stroke="#818cf8" stroke-width="1" opacity="0.4"/></svg>`,
  resonanceChamber:`<svg viewBox="0 0 64 64" fill="none"><rect x="10" y="12" width="44" height="40" rx="3" fill="#0f0520" stroke="#c084fc" stroke-width="1.5"/><circle cx="32" cy="30" r="12" fill="none" stroke="#c084fc" stroke-width="0.8" opacity="0.2"/><circle cx="32" cy="30" r="8" fill="none" stroke="#c084fc" stroke-width="1" opacity="0.3"><animateTransform attributeName="transform" type="rotate" from="0 32 30" to="360 32 30" dur="5s" repeatCount="indefinite"/></circle><circle cx="32" cy="30" r="3" fill="#c084fc" opacity="0.4"><animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite"/></circle><text x="32" y="46" text-anchor="middle" fill="#c084fc" font-size="6" opacity="0.4">QS</text></svg>`,
  fermentVacuole:`<svg viewBox="0 0 64 64" fill="none"><rect x="10" y="12" width="44" height="40" rx="3" fill="#1a1205" stroke="#f59e0b" stroke-width="1.5"/><ellipse cx="32" cy="30" rx="16" ry="14" fill="#f59e0b" opacity="0.06" stroke="#f59e0b" stroke-width="1"/><circle cx="24" cy="26" r="4" fill="#f59e0b" opacity="0.15"><animate attributeName="r" values="3;5;3" dur="2.5s" repeatCount="indefinite"/></circle><circle cx="38" cy="34" r="3" fill="#f59e0b" opacity="0.12"><animate attributeName="r" values="2;4;2" dur="3s" repeatCount="indefinite"/></circle><circle cx="30" cy="36" r="2.5" fill="#f59e0b" opacity="0.1"><animate attributeName="r" values="1.5;3.5;1.5" dur="2s" repeatCount="indefinite"/></circle><path d="M22 42l3 0-1.5 4 3 0-5 7 1.5-4.5-3 0z" fill="#f59e0b" opacity="0.5"/><circle cx="20" cy="20" r="3" fill="#10b981" opacity="0.2" stroke="#10b981" stroke-width="0.6"/><circle cx="44" cy="20" r="3" fill="#ec4899" opacity="0.2" stroke="#ec4899" stroke-width="0.6"/></svg>`,
};

// ===== ★ MUTATION LAB — 变异实验室 =====
// 解锁条件：P3 + 进化Lv.3 + 研究「生物膜技术」
// 核心机制：消耗DNA+蛋白质培育随机突变 → 选择性激活 → 为整个菌落提供永久/临时增益
// 设计理念：肉鸽式随机 + 策略选择 = 每局不同的build路线

// 突变稀有度
const MUT_RARITY = {
  common:   { n:'普通', color:'#8aa0c0', weight:50, icon:'⚪', glow:'rgba(138,160,192,0.2)' },
  uncommon: { n:'稀有', color:'#22c55e', weight:30, icon:'🟢', glow:'rgba(34,197,94,0.25)' },
  rare:     { n:'精良', color:'#3b82f6', weight:15, icon:'🔵', glow:'rgba(59,130,246,0.3)' },
  epic:     { n:'史诗', color:'#a855f7', weight:4,  icon:'🟣', glow:'rgba(168,85,247,0.35)' },
  legend:   { n:'传说', color:'#f59e0b', weight:1,  icon:'🟡', glow:'rgba(245,158,11,0.4)' },
};

// 突变定义池
const MUTATIONS = {
  // === 普通突变（基础增益）===
  thickWall: {
    n:'增厚细胞壁', rarity:'common', icon:'🛡️',
    d:'所有建筑维护费 -10%',
    flavor:'更厚的壁意味着更少的修补。',
    ef: { maintReduce: 0.10 },
    category:'defense',
  },
  rapidDivision: {
    n:'加速分裂', rarity:'common', icon:'🔄',
    d:'种群增长速度 +15%',
    flavor:'有丝分裂？不，是极速分裂。',
    ef: { popGrowthMult: 0.15 },
    category:'growth',
  },
  efficientTransport: {
    n:'高效膜运输', rarity:'common', icon:'🚛',
    d:'传送带效率 +12%',
    flavor:'ABC转运蛋白的升级版。',
    ef: { beltEffBonus: 0.12 },
    category:'logistics',
  },
  glucoseAffinity: {
    n:'葡萄糖亲和力', rarity:'common', icon:'🍯',
    d:'葡萄糖产出 +10%',
    flavor:'六碳糖，多多益善。',
    ef: { resProdBonus: { glucose: 0.10 } },
    category:'resource',
  },
  atpSynthaseBoost: {
    n:'ATP合成酶强化', rarity:'common', icon:'⚡',
    d:'ATP能量产出 +10%',
    flavor:'质子梯度利用效率显著提升。',
    ef: { resProdBonus: { energy: 0.10 } },
    category:'resource',
  },
  nitrogenCapture: {
    n:'固氮效率提升', rarity:'common', icon:'🔵',
    d:'氮源产出 +10%',
    flavor:'固氮酶的催化效率突破瓶颈。',
    ef: { resProdBonus: { nitrogen: 0.10 } },
    category:'resource',
  },

  // === 稀有突变（组合增益）===
  metabolicOverdrive: {
    n:'代谢过载', rarity:'uncommon', icon:'🔥',
    d:'所有资源产出 +8%，但维护费 +5%',
    flavor:'更快的代谢，更多的废物。值得吗？',
    ef: { globalProdBonus: 0.08, maintIncrease: 0.05 },
    category:'resource',
  },
  quorumAmplifier: {
    n:'群感信号放大', rarity:'uncommon', icon:'📡',
    d:'QS信号产出 +20%',
    flavor:'细菌之间的"5G网络"。',
    ef: { resProdBonus: { qs: 0.20 } },
    category:'resource',
  },
  biofilmArmor: {
    n:'生物膜铠甲', rarity:'uncommon', icon:'🧱',
    d:'生物质产出 +15%，建筑升级费 -8%',
    flavor:'坚不可摧的群体盾牌。',
    ef: { resProdBonus: { biomass: 0.15 }, upgradeCostReduce: 0.08 },
    category:'defense',
  },
  geneticDrift: {
    n:'遗传漂变', rarity:'uncommon', icon:'🧬',
    d:'DNA产出 +18%，进化成本 -5%',
    flavor:'随机突变的偶然礼物。',
    ef: { resProdBonus: { dna: 0.18 }, evoCostReduce: 0.05 },
    category:'growth',
  },
  symbioticNetwork: {
    n:'共生网络', rarity:'uncommon', icon:'🕸️',
    d:'邻接加成效果 +15%',
    flavor:'微生物间的互利共生达到了新高度。',
    ef: { adjacencyBonus: 0.15 },
    category:'logistics',
  },
  proteinFolding: {
    n:'蛋白质折叠优化', rarity:'uncommon', icon:'🧪',
    d:'蛋白质产出 +15%，科技研究速度 +10%',
    flavor:'伴侣蛋白的终极杰作。',
    ef: { resProdBonus: { protein: 0.15 }, techSpeedBonus: 0.10 },
    category:'resource',
  },

  // === 精良突变（显著增益）===
  horizontalTransfer: {
    n:'水平基因转移', rarity:'rare', icon:'💉',
    d:'每次进化额外 +3% 全局效率',
    flavor:'借来的基因，自家的进步。',
    ef: { evoExtraBonus: 0.03 },
    category:'growth',
  },
  extremophile: {
    n:'极端环境适应', rarity:'rare', icon:'🌋',
    d:'资源竞争惩罚减少 40%',
    flavor:'在极端条件下反而更强？嗜极生物的天赋。',
    ef: { competitionResist: 0.40 },
    category:'defense',
  },
  plasmidFactory: {
    n:'质粒工厂', rarity:'rare', icon:'🔬',
    d:'变异培育速度 +25%，培育成本 -15%',
    flavor:'质粒批量生产线——突变的批发商。',
    ef: { mutBrewSpeedBonus: 0.25, mutBrewCostReduce: 0.15 },
    category:'mutation',
  },
  syntheticPathway: {
    n:'合成代谢通路', rarity:'rare', icon:'⚗️',
    d:'所有建筑产出 +12%',
    flavor:'人工设计的代谢通路，效率惊人。',
    ef: { globalProdBonus: 0.12 },
    category:'resource',
  },
  sporeResilience: {
    n:'芽孢韧性', rarity:'rare', icon:'💎',
    d:'维护费 -20%，建筑不会因资源枯竭停机',
    flavor:'芽孢状态下，再恶劣的环境也能扛过去。',
    ef: { maintReduce: 0.20, noShutdown: true },
    category:'defense',
  },
  branchPipeline: {
    n:'分支管线', rarity:'rare', icon:'🔀',
    d:'随机1种建筑类型 +1 输出端口',
    flavor:'突变让细胞膜多长出一个分泌通道。',
    ef: { extraOutPort: 1, targetRandom: true },
    category:'logistics',
  },

  // === 史诗突变（改变玩法）===
  crispr: {
    n:'CRISPR编辑器', rarity:'epic', icon:'✂️',
    d:'可精确选择下次突变的类别',
    flavor:'基因剪刀——精准编辑生命密码。',
    ef: { mutCategoryLock: true },
    category:'mutation',
  },
  endosymbiosis: {
    n:'内共生事件', rarity:'epic', icon:'🔮',
    d:'解锁第2组突变槽（最多激活6个突变）',
    flavor:'线粒体的传说……在你身上重演。',
    ef: { extraMutSlots: 3 },
    category:'growth',
  },
  prionMemory: {
    n:'朊病毒记忆', rarity:'epic', icon:'🧠',
    d:'突变效果在传承重置后保留50%',
    flavor:'蛋白质也能传递记忆？朊病毒说可以。',
    ef: { mutPrestigeKeep: 0.50 },
    category:'mutation',
  },
  quantumTunneling: {
    n:'量子隧穿效应', rarity:'epic', icon:'⚛️',
    d:'10%概率零消耗建造建筑',
    flavor:'粒子穿过势垒……资源也可以？',
    ef: { freeBuildChance: 0.10 },
    category:'resource',
  },
  hubNode: {
    n:'枢纽节点', rarity:'epic', icon:'🔄',
    d:'随机1种建筑类型 +1 输入和 +1 输出端口',
    flavor:'膜蛋白的双向改造创造了前所未有的物质交换效率。',
    ef: { extraInPort: 1, extraOutPort: 1, targetRandom: true },
    category:'logistics',
  },

  // === 传说突变（极其稀有）===
  pangaea: {
    n:'泛大陆合并', rarity:'legend', icon:'🌍',
    d:'所有资源产出 +25%，维护费 -25%，邻接距离+1',
    flavor:'当整个培养皿成为一个超级有机体。',
    ef: { globalProdBonus: 0.25, maintReduce: 0.25, adjacencyRange: 1 },
    category:'growth',
  },
  lastUniversalAncestor: {
    n:'最后共同祖先', rarity:'legend', icon:'🌳',
    d:'进化不消耗资源，效率加成 ×1.5',
    flavor:'LUCA——生命之树的根。一切从这里开始。',
    ef: { freeEvolve: true, evoEffMult: 1.5 },
    category:'growth',
  },
};

// 变异实验室配置
const MUT_LAB_CONFIG = {
  unlockPhase: 3,           // P3解锁
  unlockEvoLv: 4,           // v2.0: 原3→4，需进化Lv.4
  unlockTech: 'biofilmTech', // 需研究生物膜技术
  baseSlots: 3,             // 基础突变槽数
  maxSlots: 6,              // 最大突变槽（含内共生加成）
  brewTime: 45,             // 基础培育时间（秒）
  brewCost: { dna: 8, protein: 5 }, // 基础培育成本
  rerollCost: { dna: 4 },    // 重新培育（换一个）成本
  lockCost: { dna: 2 },      // 锁定突变不被替换的成本
  maxBrewing: 1,            // 同时培育数量
  offerCount: 3,            // 每次培育完成提供选择数量
};

// ===== ACHIEVEMENTS =====
const ACHIEVE = [
  // 建筑里程碑
  { id:'firstBuild', n:'🏗️ 创世之砖', d:'放下第一个建筑', tier:'bronze', check: s => s.totalBuildings() >= 1, reward:{ glucose:20, energy:15 } },
  { id:'build5', n:'🏘️ 小有规模', d:'拥有5个建筑', tier:'bronze', check: s => s.totalBuildings() >= 5, reward:{ glucose:50, energy:30 } },
  { id:'build12', n:'🏙️ 微型都市', d:'拥有12个建筑', tier:'silver', check: s => s.totalBuildings() >= 12, reward:{ energy:80, dna:15 } },
  { id:'build20', n:'🌆 生物大都会', d:'拥有20个建筑', tier:'gold', check: s => s.totalBuildings() >= 20, reward:{ energy:150, dna:30, protein:20 } },
  // 资源里程碑
  { id:'glucose100', n:'🍬 糖分过剩', d:'葡萄糖累计超过200', tier:'bronze', check: s => s.res.glucose >= 200, reward:{ energy:30 } },
  { id:'energy200', n:'⚡ 能量风暴', d:'ATP能量超过300', tier:'bronze', check: s => s.res.energy >= 300, reward:{ glucose:40 } },
  { id:'dna50', n:'🧬 基因宝库', d:'DNA累计超过80', tier:'silver', check: s => s.res.dna >= 80, reward:{ energy:50, glucose:50 } },
  { id:'protein30', n:'🧪 蛋白质大师', d:'蛋白质超过50', tier:'silver', check: s => s.res.protein >= 50, reward:{ dna:20, energy:30 } },
  // 进化里程碑
  { id:'evo2', n:'🧬 初次进化', d:'完成第一次进化', tier:'bronze', check: s => s.eL >= 2, reward:{ glucose:60, energy:40, dna:10 } },
  { id:'evo3', n:'🧬 进化加速', d:'达到进化Lv.3', tier:'silver', check: s => s.eL >= 3, reward:{ energy:80, dna:20, protein:15 } },
  { id:'evo5', n:'🧬 超级物种', d:'达到进化Lv.5', tier:'gold', check: s => s.eL >= 5, reward:{ energy:200, dna:50, protein:30 } },
  // 科技里程碑
  { id:'firstTech', n:'📖 开拓者', d:'完成第一项研究', tier:'bronze', check: s => Object.values(s.techs).some(t=>t.done), reward:{ glucose:30, energy:20 } },
  { id:'allTech', n:'🎓 学术大师', d:'完成全部研究', tier:'diamond', check: s => Object.values(s.techs).every(t=>t.done), reward:{ energy:200, dna:60 } },
  // 阶段里程碑
  { id:'phase2', n:'⚗️ 代谢启动', d:'进入阶段2', tier:'bronze', check: s => s.phase >= 2, reward:{ energy:40, nitrogen:15 } },
  { id:'phase3', n:'🔗 物流时代', d:'进入阶段3', tier:'silver', check: s => s.phase >= 3, reward:{ energy:60, protein:20 } },
  { id:'phase4', n:'📡 自动化纪元', d:'进入阶段4', tier:'gold', check: s => s.phase >= 4, reward:{ energy:100, biomass:15 } },
  { id:'phase5', n:'🏛️ 奇观时代', d:'进入阶段5', tier:'diamond', check: s => s.phase >= 5, reward:{ energy:150, dna:40 } },
  // P5专属成就
  { id:'wonderDone', n:'☀️ 戴森之光', d:'完成微型戴森球建造', tier:'diamond', check: s => s.wonderComplete, reward:{ energy:300, dna:80, protein:50 } },
  { id:'wonderPrestige3', n:'🌟 恒星征服者', d:'完成奇观后转生3次', tier:'diamond', check: s => (s._wonderPrestigeCount || 0) >= 3, reward:{ energy:500, dna:120, protein:80, biomass:40 } },
  { id:'wonderSpeed', n:'⚡ 极速奇观', d:'20分钟内完成奇观', tier:'diamond', check: s => s._fastestWonder && s._fastestWonder <= 1200, reward:{ energy:400, dna:100, protein:60 } },
  // 效率里程碑
  { id:'eff150', n:'📈 效率突破', d:'全局效率达到150%', tier:'silver', check: s => s.gEff >= 1.5, reward:{ dna:15, energy:40 } },
  { id:'eff200', n:'🚀 效率翻倍', d:'全局效率达到200%', tier:'gold', check: s => s.gEff >= 2.0, reward:{ dna:30, energy:80 } },
  // 种群里程碑
  { id:'pop100', n:'🦠 百菌汇聚', d:'种群达到100', tier:'bronze', check: s => s.pop >= 100, reward:{ glucose:40, energy:30 } },
  { id:'pop500', n:'🦠 千菌浩荡', d:'种群达到500', tier:'silver', check: s => s.pop >= 500, reward:{ energy:60, dna:20 } },

  // ========== 新增成就 ==========
  // 升级成就
  { id:'firstUpgrade', n:'🔧 初试锋芒', d:'完成第一次建筑升级', tier:'bronze', check: s => (s.stats.totalUpgrades || 0) >= 1, reward:{ energy:25, glucose:15 } },
  { id:'upgrade10', n:'🔧 强化狂人', d:'累计升级10次', tier:'silver', check: s => (s.stats.totalUpgrades || 0) >= 10, reward:{ energy:80, dna:15 } },
  { id:'upgrade25', n:'🔧 锻造大师', d:'累计升级25次', tier:'gold', check: s => (s.stats.totalUpgrades || 0) >= 25, reward:{ energy:150, dna:30, protein:15 } },
  // 传送带成就
  { id:'belt5', n:'🔗 传输先锋', d:'拥有5条传送带连接', tier:'bronze', check: s => (s._activeBelts || []).length >= 5, reward:{ energy:30, glucose:20 } },
  { id:'belt15', n:'🔗 物流帝国', d:'拥有15条传送带连接', tier:'silver', check: s => (s._activeBelts || []).length >= 15, reward:{ energy:60, dna:15 } },
  { id:'belt25', n:'🔗 物流霸主', d:'拥有25条传送带连接', tier:'gold', check: s => (s._activeBelts || []).length >= 25, reward:{ energy:120, dna:30, protein:15 } },
  { id:'manualBelt3', n:'🔗 手动连接大师', d:'手动连接3条传送带', tier:'silver', check: s => Object.keys(s.manualBelts || {}).length >= 3, reward:{ energy:50, dna:10 } },
  { id:'manualBelt8', n:'🔗 物流工程师', d:'手动连接8条传送带', tier:'gold', check: s => Object.keys(s.manualBelts || {}).length >= 8, reward:{ energy:100, dna:25, protein:10 } },
  { id:'beltCombo3', n:'⚡ 连线三连', d:'达成3连击传送带连接', tier:'bronze', check: s => (s.stats.maxBeltCombo || 0) >= 3, reward:{ energy:40, glucose:25 } },
  { id:'beltCombo5', n:'⚡ 连线五杀', d:'达成5连击传送带连接', tier:'silver', check: s => (s.stats.maxBeltCombo || 0) >= 5, reward:{ energy:80, dna:20 } },
  // v3.0 §4: 远距传送带成就
  { id:'longBelt2', n:'🔗 远程传输', d:'首次建立2格距离的传送带', tier:'bronze', check: s => (s.stats.maxBeltDist || 0) >= 2, reward:{ energy:10 } },
  { id:'longBelt3', n:'🔗 远程物流', d:'首次建立3格距离的传送带', tier:'silver', check: s => (s.stats.maxBeltDist || 0) >= 3, reward:{ energy:20, glucose:3 } },
  { id:'longBelt4', n:'🔗 物流大师', d:'首次建立4格距离的传送带', tier:'gold', check: s => (s.stats.maxBeltDist || 0) >= 4, reward:{ energy:30, glucose:5 } },
  { id:'longBelt10', n:'🔗 网络编织者', d:'累计建立10条远距(2格+)传送带', tier:'gold', check: s => (s.stats.longBeltCount || 0) >= 10, reward:{ energy:50, dna:10 } },
  { id:'beltLv5', n:'⭐ 满级传送带', d:'将任意传送带升级到Lv.5', tier:'gold', check: s => Object.values(s.beltLevels || {}).some(lv => lv >= 5), reward:{ energy:100, dna:20 } },
  { id:'firstSync', n:'🔄 初次同步', d:'首次达成供给同步加成（同步度≥50%）', tier:'silver', check: s => Object.values(s._syncBonuses || {}).some(sb => sb.sync >= 0.5), reward:{ energy:60, dna:15 } },
  { id:'perfectSync', n:'🔄 完美同步', d:'任意建筑供给同步度达到100%', tier:'gold', check: s => Object.values(s._syncBonuses || {}).some(sb => sb.sync >= 0.99), reward:{ energy:150, dna:35, protein:20 } },
  // 生存挑战
  { id:'powerCrisis', n:'⚡ 涅槃重生', d:'从功率危机中恢复到满功率', tier:'silver', check: s => s._recoveredFromCrisis, reward:{ energy:100, glucose:60 } },
  { id:'neverLowPower', n:'🛡️ 永不断电', d:'在线10分钟且功率从未低于70%', tier:'gold', check: s => s.stats.onlineTime >= 600 && !s._everLowPower, reward:{ energy:120, dna:25 } },
  // ★ 经济管理成就
  { id:'maintSurvivor', n:'🔧 入不敷出', d:'首次经历维护费导致资源为负', tier:'bronze', check: s => s._everMaintDeficit, reward:{ energy:40, glucose:30 } },
  // ★ Q3过渡成就：降低经济系统难度曲线
  { id:'maintBalancer', n:'📊 收支平衡', d:'P2阶段拥有6+建筑且所有资源速率≥0', tier:'silver', check: s => s.phase >= 2 && s.totalBuildings() >= 6 && Object.values(s.rates||{}).every(v => v >= -0.01), reward:{ energy:80, glucose:40, dna:10 } },
  { id:'maintRecovery', n:'🔄 经济复苏', d:'从维护费负值恢复到全正（经历过入不敷出后）', tier:'silver', check: s => s._everMaintDeficit && Object.values(s.rates||{}).every(v => v >= -0.01) && s.totalBuildings() >= 4, reward:{ energy:100, dna:15, glucose:30 } },
  { id:'efficientEmpire', n:'📊 高效帝国', d:'拥有12+建筑且所有资源速率为正', tier:'gold', check: s => s.totalBuildings() >= 12 && Object.values(s.rates||{}).every(v => v >= -0.01), reward:{ energy:200, dna:40, protein:20 } },
  { id:'noCompetition', n:'⚖️ 供需大师', d:'P3阶段10+建筑且无资源竞争惩罚', tier:'gold', check: s => s.phase >= 3 && s.totalBuildings() >= 10 && Object.values(s._competitionPenalty||{}).every(p => !p || p >= 0.95), reward:{ energy:150, dna:35 } },
  // 速度挑战
  { id:'speedPhase2', n:'⏱️ 闪电进化', d:'5分钟内到达阶段2', tier:'gold', check: s => s.phase >= 2 && s.stats.onlineTime <= 300, reward:{ energy:80, dna:20 } },
  { id:'speedBuild8', n:'⏱️ 疾风建造', d:'3分钟内建造8个建筑', tier:'silver', check: s => s.totalBuildings() >= 8 && s.stats.onlineTime <= 180, reward:{ energy:60, glucose:40 } },
  // 种群进阶
  { id:'pop1000', n:'🌍 千菌一心', d:'种群达到1000', tier:'gold', check: s => s.pop >= 1000, reward:{ energy:100, dna:30, protein:20 } },
  { id:'pop2000', n:'🌌 万菌归一', d:'种群达到2000', tier:'diamond', check: s => s.pop >= 2000, reward:{ energy:200, dna:60, protein:40 } },
  // 资源进阶
  { id:'glucose500', n:'🍯 糖分帝国', d:'葡萄糖超过500', tier:'silver', check: s => s.res.glucose >= 500, reward:{ energy:60, dna:10 } },
  { id:'energy1000', n:'⚡ 无尽能源', d:'ATP能量超过1000', tier:'gold', check: s => s.res.energy >= 1000, reward:{ dna:25, protein:15 } },
  // 全面发展
  { id:'balanced', n:'⚖️ 均衡发展', d:'同时拥有4种不同类型的建筑', tier:'silver', check: s => {
    const types = new Set(); s.grid.forEach(g => { if (g) types.add(g.type); }); return types.size >= 4;
  }, reward:{ energy:50, glucose:30, dna:10 } },
  // 转生
  { id:'firstPrestige', n:'♻️ 轮回初始', d:'完成第一次转生', tier:'gold', check: s => s.prestigeCount >= 1, reward:{ energy:100, dna:30 } },
  { id:'prestige3', n:'♻️ 三度轮回', d:'转生3次', tier:'diamond', check: s => s.prestigeCount >= 3, reward:{ energy:200, dna:50, protein:30 } },
  // v3.0 §8.6: 转生成就链
  { id:'prestige5', n:'🧪 炼金术士', d:'转生5次(催化剂解锁)', tier:'diamond', check: s => s.prestigeCount >= 5, reward:{ energy:250, dna:60 } },
  { id:'prestige10', n:'🌐 多菌株先驱', d:'转生10次', tier:'diamond', check: s => s.prestigeCount >= 10, reward:{ energy:400, dna:80, protein:50 } },
  { id:'prestige15', n:'⭐ 造物主', d:'转生15次(创造模式)', tier:'diamond', check: s => s.prestigeCount >= 15, reward:{ energy:600, dna:120, protein:80 } },
  // 变体通关成就
  { id:'variant_purist', n:'🔥 纯粹通关', d:'纯粹主义变体下转生', tier:'gold', check: s => s._completedVariants?.purist, reward:{ energy:200, dna:40 } },
  { id:'variant_energy', n:'⚡ 节能大师', d:'能量危机变体下转生', tier:'gold', check: s => s._completedVariants?.energyCrisis, reward:{ energy:150, dna:30 } },
  { id:'variant_minimal', n:'🔬 极简通关', d:'极简主义变体下转生', tier:'gold', check: s => s._completedVariants?.minimalist, reward:{ energy:180, dna:35 } },
  { id:'variant_chaos', n:'🎲 混沌征服', d:'混沌培养皿变体下转生', tier:'gold', check: s => s._completedVariants?.chaos, reward:{ energy:120, dna:25 } },
  { id:'variant_speed', n:'⏱️ 极速通关', d:'竞速试炼变体下转生', tier:'diamond', check: s => s._completedVariants?.speedrun, reward:{ energy:220, dna:45 } },
  { id:'variant_toxic', n:'☠️ 毒素幸存者', d:'毒素蔓延变体下转生', tier:'gold', check: s => s._completedVariants?.toxic, reward:{ energy:140, dna:28 } },
  { id:'variant_all', n:'🏅 全变体大师', d:'完成所有6种变体', tier:'diamond', check: s => { const cv = s._completedVariants || {}; return PRESTIGE_VARIANTS.every(v => cv[v.id]); }, reward:{ energy:1000, dna:200, protein:100 } },
  // 蓝图成就
  { id:'blueprint_save', n:'💾 首个蓝图', d:'保存第一个传送带蓝图', tier:'bronze', check: s => (s._blueprints||[]).length >= 1, reward:{ energy:30 } },
  { id:'blueprint_5', n:'🗺️ 蓝图收藏家', d:'保存5个蓝图', tier:'silver', check: s => (s._blueprints||[]).length >= 5, reward:{ energy:80, dna:15 } },
  // 催化剂成就
  { id:'catalyst_use', n:'🧪 首次催化', d:'使用第一个催化剂', tier:'bronze', check: s => (s.stats.catalystUseCount || 0) >= 1, reward:{ energy:50 } },
  { id:'catalyst_10', n:'🧪 催化专家', d:'累计使用10个催化剂', tier:'silver', check: s => (s.stats.catalystUseCount || 0) >= 10, reward:{ energy:120, dna:25 } },
  // ★ Q4：变异实验室成就
  { id:'mutFirst', n:'🧬 初次突变', d:'激活第一个突变', tier:'bronze', check: s => s._mutSlots.length >= 1, reward:{ energy:50, dna:15 } },
  { id:'mutSlotsFull', n:'🧬 突变满载', d:'填满所有基础突变槽(3个)', tier:'silver', check: s => s._mutSlots.length >= 3, reward:{ energy:100, dna:25, protein:15 } },
  { id:'mutRare', n:'💎 精良品质', d:'获得一个精良或更高品质的突变', tier:'silver', check: s => s._mutSlots.some(m => { const r = MUTATIONS[m.id]?.rarity; return r === 'rare' || r === 'epic' || r === 'legend'; }), reward:{ energy:80, dna:20 } },
  { id:'mutEpic', n:'🟣 史诗突变', d:'获得一个史诗品质的突变', tier:'gold', check: s => s._mutSlots.some(m => MUTATIONS[m.id]?.rarity === 'epic'), reward:{ energy:150, dna:40, protein:25 } },
  { id:'mutLegend', n:'🌟 传说降临', d:'获得一个传说品质的突变', tier:'diamond', check: s => s._mutSlots.some(m => MUTATIONS[m.id]?.rarity === 'legend'), reward:{ energy:300, dna:80, protein:50 } },
  { id:'mutCollect10', n:'📖 基因图鉴', d:'发现10种不同的突变', tier:'silver', check: s => s._mutHistory.length >= 10, reward:{ energy:80, dna:30 } },
  { id:'mutBrew10', n:'🧪 培育专家', d:'累计培育10次突变', tier:'bronze', check: s => s._mutBrewCount >= 10, reward:{ energy:60, dna:15 } },
  // ★ v0.9.3：邻接加成成就
  { id:'adjFirst', n:'🔗 初次共振', d:'首个建筑获得邻接加成', tier:'bronze', check: s => {
    for (let i = 0; i < s.grid.length; i++) { if (s.grid[i] && s.getAdjacencyBonus(i).bonus > 0) return true; } return false;
  }, reward:{ energy:30, glucose:20 } },
  { id:'adjCount5', n:'🔗 供给链达人', d:'5栋建筑同时有邻接加成', tier:'silver', check: s => {
    let c = 0; for (let i = 0; i < s.grid.length; i++) { if (s.grid[i] && s.getAdjacencyBonus(i).bonus > 0) c++; } return c >= 5;
  }, reward:{ energy:60, dna:15 } },
  { id:'adjTotal50', n:'🔗 空间规划师', d:'全局邻接加成总和达50%', tier:'silver', check: s => {
    let t = 0; for (let i = 0; i < s.grid.length; i++) { if (s.grid[i]) t += s.getAdjacencyBonus(i).bonus; } return t >= 0.50;
  }, reward:{ energy:80, dna:20, protein:10 } },
  { id:'adjSingle30', n:'🔗 完美邻接', d:'单栋建筑邻接加成≥30%', tier:'gold', check: s => {
    for (let i = 0; i < s.grid.length; i++) { if (s.grid[i] && s.getAdjacencyBonus(i).bonus >= 0.30) return true; } return false;
  }, reward:{ energy:120, dna:30, protein:15 } },
  { id:'adjTotal100', n:'🔗 协同大师', d:'全局邻接加成总和达100%', tier:'gold', check: s => {
    let t = 0; for (let i = 0; i < s.grid.length; i++) { if (s.grid[i]) t += s.getAdjacencyBonus(i).bonus; } return t >= 1.00;
  }, reward:{ energy:150, dna:40, protein:20 } },
  { id:'adjAllBonus', n:'🔗 共生网络', d:'所有已建建筑都有邻接加成', tier:'diamond', check: s => {
    let hasBuilding = false;
    for (let i = 0; i < s.grid.length; i++) {
      if (!s.grid[i]) continue;
      const bd = BLDS[s.grid[i].type];
      if (!bd || bd.isBoost || bd.isWonder) continue;
      hasBuilding = true;
      if (s.getAdjacencyBonus(i).bonus <= 0) return false;
    }
    return hasBuilding;
  }, reward:{ energy:200, dna:60, protein:30 } },
  // v2.1 §10.4: 邻接发现成就
  { id:'adj5', n:'🔗 初识协同', d:'发现5条邻接规则', tier:'bronze', check: s => Object.keys(s._discoveredAdj||{}).length >= 5, reward:{ glucose:30, energy:20 } },
  { id:'adj15', n:'🔗 邻接学徒', d:'发现15条邻接规则', tier:'silver', check: s => Object.keys(s._discoveredAdj||{}).length >= 15, reward:{ energy:60, dna:15 } },
  { id:'adj30', n:'🔗 图鉴达人', d:'发现30条邻接规则', tier:'gold', check: s => Object.keys(s._discoveredAdj||{}).length >= 30, reward:{ energy:120, dna:30, protein:20 } },
  { id:'adjAllDisc', n:'🔗 完美图鉴', d:'发现所有当前可用的邻接规则', tier:'diamond', check: s => { const u = ADJACENCY_RULES.filter(r => !r.phase || r.phase <= s.phase).length; return u > 0 && Object.keys(s._discoveredAdj||{}).length >= u; }, reward:{ energy:250, dna:60, protein:40 } },
];

// ===== ACHIEVEMENT CATEGORIES =====
const ACHV_CATEGORIES = {
  'building': { name:'建筑', icon:'🏗️', ids:['firstBuild','build5','build12','build20','balanced'] },
  'resource': { name:'资源', icon:'💎', ids:['glucose100','energy200','dna50','protein30','glucose500','energy1000'] },
  'evolution': { name:'进化', icon:'🧬', ids:['evo2','evo3','evo5'] },
  'tech':     { name:'科技', icon:'📖', ids:['firstTech','allTech'] },
  'phase':    { name:'阶段', icon:'🌍', ids:['phase2','phase3','phase4','phase5','wonderDone','wonderPrestige3','wonderSpeed'] },
  'efficiency':{ name:'效率', icon:'📈', ids:['eff150','eff200'] },
  'population':{ name:'种群', icon:'🦠', ids:['pop100','pop500','pop1000','pop2000'] },
  'upgrade':  { name:'升级', icon:'🔧', ids:['firstUpgrade','upgrade10','upgrade25'] },
  'belt':     { name:'传送带', icon:'🔗', ids:['belt5','belt15','belt25','manualBelt3','manualBelt8','beltCombo3','beltCombo5','beltLv5','firstSync','perfectSync'] },
  'survival': { name:'生存', icon:'🛡️', ids:['powerCrisis','neverLowPower'] },
  'economy':  { name:'经济', icon:'📊', ids:['maintSurvivor','maintBalancer','maintRecovery','efficientEmpire','noCompetition'] },
  'speed':    { name:'速度', icon:'⏱️', ids:['speedPhase2','speedBuild8'] },
  'prestige': { name:'转生', icon:'♻️', ids:['firstPrestige','prestige3','prestige5','prestige10','prestige15','variant_purist','variant_energy','variant_minimal','variant_chaos','variant_speed','variant_toxic','variant_all','blueprint_save','blueprint_5','catalyst_use','catalyst_10'] },
  'mutation': { name:'变异', icon:'🧬', ids:['mutFirst','mutSlotsFull','mutRare','mutEpic','mutLegend','mutCollect10','mutBrew10'] },
  'adjacency': { name:'邻接', icon:'🔗', ids:['adjFirst','adjCount5','adjTotal50','adjSingle30','adjTotal100','adjAllBonus','adj5','adj15','adj30','adjAllDisc'] },
};

const ACHV_TIER_LABELS = { bronze:'铜', silver:'银', gold:'金', diamond:'钻石' };
const ACHV_TIER_COLORS = { bronze:'#cd7f32', silver:'#c0c0c0', gold:'#fbbf24', diamond:'#a855f7' };

// ===== ACHIEVEMENT MILESTONE SYSTEM =====
// 每N个成就解锁一个永久buff
const ACHIEVE_MILESTONES = [
  { count: 5,  n:'🌟 初露锋芒', d:'解锁5个成就', buff:'全局效率+5%', fn: s => { s.gEff += 0.05; } },
  { count: 10, n:'⭐ 声名鹊起', d:'解锁10个成就', buff:'建造费用-8%', fn: s => { s._costDiscount = (s._costDiscount || 0) + 0.08; } },
  { count: 15, n:'🌟 威震四方', d:'解锁15个成就', buff:'传送带初始效率+10%', fn: s => { s._beltBonus = (s._beltBonus || 0) + 0.1; } },
  { count: 20, n:'💫 名满天下', d:'解锁20个成就', buff:'全局效率+8%', fn: s => { s.gEff += 0.08; } },
  { count: 25, n:'✨ 传奇霸主', d:'解锁25个成就', buff:'种群上限+100', fn: s => { s._popCapBonus = (s._popCapBonus || 0) + 100; } },
  { count: 30, n:'🏆 微生物之神', d:'解锁30个成就', buff:'全局效率+12% + 费用-10%', fn: s => { s.gEff += 0.12; s._costDiscount = (s._costDiscount || 0) + 0.1; } },
];

// ===== EMPIRE TITLES =====
const EMPIRE_TITLES = [
  { count: 0,  title:'🦠 初生细胞' },
  { count: 5,  title:'🧫 微生物殖民地' },
  { count: 10, title:'🏘️ 细菌城邦' },
  { count: 15, title:'🏙️ 细菌帝国' },
  { count: 20, title:'🌍 生物圈联邦' },
  { count: 25, title:'🌌 生物圈霸主' },
  { count: 30, title:'👑 微生物之神' },
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
    { check: s => s.bldCount('glucoseCollector') === 0, text:'建造「碳源采集器」— 帝国核心免费供能，采集葡萄糖（一切资源的起点！）', icon:'🌱' },
    { check: s => s.bldCount('glucoseCollector') > 0 && s.bldCount('energyStation') === 0, text:'建造「ATP合成酶」把葡萄糖→能量 (1🟢→2.5⚡/s) — 几乎所有设施都需要能量驱动', icon:'🔋' },
    { check: s => s.bldCount('energyStation') > 0 && s.bldCount('simpleExtractor') === 0, text:'建造「简易提取器」用葡萄糖+能量合成DNA (2🟢+1.5⚡→0.4🧬/s) — DNA是进化和研究的关键', icon:'🧬' },
    { check: s => s.bldCount('simpleExtractor') > 0 && s.res.dna < 3, text:'DNA正在合成中...攒到3就能研究科技（小手会指路！）', icon:'🔬' },
    { check: s => s.res.dna >= 3 && !s.techs.pureCulture.done, text:'DNA够了！点左侧「研究」→「纯培养技术」— 全局效率+10%，第一个科技里程碑', icon:'🧫' },
    { check: s => s.techs.pureCulture.done && s.eL < 2 && !s.canEvolve(), text:'纯培养技术✓（效率+10%）→ 攒够DNA后进化到Lv.2，解锁更多建筑！', icon:'📈' },
    { check: s => s.techs.pureCulture.done && s.eL < 2 && s.canEvolve(), text:'资源就绪！点击右栏「进化」按钮升到Lv.2 — 将解锁固氮装置和蛋白质工厂', icon:'✨' },
  ],
  2: [
    // v2.0 §11.2: P2预热期端口教学
    { check: s => s._p2PortTutorialPending, text:'📥📤 手动管线预览｜从本阶段开始，你可以手动添加管线来优化产线。每种建筑有输入📥和输出📤端口，端口数=最多连几条管线。不想手动？系统仍会自动帮你连接基础管线！', icon:'🔗', once:'p2PortTutorial' },
    // ── P2a · 代谢基础：固氮 + 蛋白 ──
    { check: s => s.bldCount('nitrogenFixer') === 0, text:'▸ P2a · 代谢基础｜建造「固氮装置」获取氮源 (0.3⚡→1🔵/s) — 蛋白质工厂的原料来源！', icon:'💨' },
    { check: s => s.bldCount('nitrogenFixer') > 0 && s.bldCount('proteinFactory') === 0, text:'▸ P2a · 代谢基础｜建造「蛋白质工厂」(0.8🔵+0.5⚡→0.6🧪/s) — 用氮源合成蛋白质', icon:'⚗️' },
    // v2.0 §11.2: 首次放置建筑邻接推荐
    { check: s => !s._adjPreviewShown && s.totalBuildings() >= 3, text:'💡 选中建筑后，空格子会显示邻接加成分数（如 +15%）！颜色越亮加成越高，选位置放置试试', icon:'📐', once:'adjPreviewHint' },
    { check: s => s.bldCount('proteinFactory') > 0 && !s.techs.basicMetab.done, text:'▸ P2a → P2b｜研究「基础代谢学」— 解锁代谢进阶：高效DNA提取器 + 旁路建筑 + 互斥科技路线！', icon:'📖' },
    // ── P2b · 代谢进阶：旁路 + 互斥 ──
    { check: s => s.techs.basicMetab.done && s.bldCount('geneExtractor') === 0, text:'▸ P2b · 代谢进阶｜建造「DNA提取器」(0.5🧪+1⚡→0.8🧬/s) — 比简易提取器快2倍！', icon:'🏭' },
    { check: s => s.techs.basicMetab.done && s.bldCount('geneExtractor') > 0 && s.bldCount('aminoSynth') === 0 && s.bldCount('ribosomeCluster') === 0, text:'▸ P2b · 代谢进阶｜试试「氨基酸合成仪」或「核糖体集群」— 旁路产线，多样化你的代谢网络', icon:'🧬' },
    { check: s => s.techs.basicMetab.done && (s.bldCount('aminoSynth') > 0 || s.bldCount('ribosomeCluster') > 0) && !s.techs.nitrogenCycle?.done && !s.techs.proteinEng?.done, text:'▸ P2b · 互斥抉择｜选择科技路线：「氮循环工程」(强化固氮) 或「蛋白质工程」(强化蛋白) — 只能二选一！', icon:'⚖️' },
    // ★ 维护费教学
    { check: s => s.totalBuildings() >= 5 && Object.values(s._maintenanceCost||{}).reduce((a,b)=>a+b,0) > 0.3, text:'🔧 注意！每个建筑都需要维护费。建筑越多维护开销越大 — 悬停建筑查看维护详情，用邻接和传送带提升效率来覆盖维护成本！', icon:'🔧' },
  ],
  3: [
    // v2.0 §11.3: P3物流时代教学面板
    { check: s => s._p3LogisticsTutorialPending, text:'🔧 物流时代｜自动管线已关闭，从现在起需要手动规划所有连接。端口是你的核心约束——合理分配每条管线！选中建筑→点击目标→连接', icon:'🔗', once:'p3LogisticsTutorial' },
    { check: s => !s.techs.biofilmTech.done, text:'研究「生物膜技术」— 解锁生物膜反应器，进入高级材料时代', icon:'📖' },
    { check: s => s.techs.biofilmTech.done && s.bldCount('biofilmReactor') === 0, text:'建造「生物膜反应器」— 需要葡萄糖+氮源+能量（三料输入），记得连传送带！', icon:'🧱' },
    // ★ 教学：生物膜反应器已建但同步度低时，引导玩家理解供给同步
    { check: s => s.bldCount('biofilmReactor') > 0 && !Object.values(s._syncBonuses || {}).some(sb => sb.sync >= 0.5), text:'💡 供给同步｜你的反应器有多条输入线，让每条传送带都有货物供应，当同步度≥50%会触发产出加成！悬停传送带查看详情', icon:'🔄' },
    { check: s => Object.values(s._syncBonuses || {}).some(sb => sb.sync >= 0.5 && sb.sync < 0.85), text:'🔄 同步生效中！传送带颜色变绿表示供给平衡，继续优化让所有输入都满载 → 金色光效=完美同步！', icon:'✨' },
    { check: s => s.bldCount('biofilmReactor') > 0 && s.bldCount('transport') === 0 && Object.values(s._syncBonuses || {}).some(sb => sb.sync >= 0.5), text:'建造「菌丝运输网」— 全局产出+10%！多造叠加效率', icon:'🔗' },
    { check: s => s.bldCount('transport') > 0, text:'多造运输网叠加效率，目标+30%以上！别忘了升级传送带（点线条→升级）', icon:'📈' },
    // v2.1 §8.2: 培养皿P3配方分散解锁引导
    { check: s => s.bldCount('transport') > 0 && s.bldCount('biofilmReactor') >= 1 && !s._petriP3Unlocked, text:'🧫 高阶实验配方｜再建造1个生物膜反应器（共需2个）+ 菌丝运输网 → 解锁P3培养皿配方！', icon:'🧫' },
    { check: s => s._petriP3Unlocked && s._petriCount < 8, text:'🧫 新配方已解锁！在培养皿实验中放置P3建筑组合，触发生物膜培育、菌丝渗透等高阶配方', icon:'🧫' },
    // v2.0 §11.3: 资源竞争启用教学（P3+3分钟）
    { check: s => s._competitionEnabled && !s._competitionTutorialShown, text:'⚖️ 供需平衡｜资源竞争系统已启用！当某种资源的消耗接近产出时，所有消费建筑效率会下降。保持充足的资源供给，或者减少不必要的消费者', icon:'⚖️', once:'competitionTutorial' },
    // ★ 资源竞争教学（已激活后持续提示）
    { check: s => Object.values(s._competitionPenalty||{}).some(p => p < 0.95), text:'⚖️ 资源供需紧张！当消耗接近产出时效率会下降 — 查看「供需」指标，增产关键资源或拆除低效消费建筑！', icon:'⚖️' },
    // ★ Q4：变异实验室教学
    { check: s => s._mutLabUnlocked && s._mutSlots.length === 0 && !s._mutBrewing, text:'🧬 变异实验室已解锁！在侧栏点击「培育突变」消耗DNA+蛋白质获取随机增益', icon:'🧬' },
    { check: s => s._mutLabUnlocked && s._mutOffers.length > 0, text:'🧬 突变培育完成！在变异实验室面板选择一个激活 — 不同稀有度效果差异巨大', icon:'✨' },
  ],
  4: [
    { check: s => !s.techs.quorumSensing.done, text:'研究「群体感应」— 解锁QS信号系统，自动加速全产线', icon:'📖' },
    { check: s => s.techs.quorumSensing.done && s.bldCount('qsController') === 0, text:'建造「群体感应塔」(2⚡→0.8📡/s) — QS信号越多效率越高（上限+80%）', icon:'🗼' },
    { check: s => s.bldCount('qsController') > 0 && s.prestigeCount === 0, text:'QS信号自动加速全产线！继续推进到P5完成奇观才能首次转生 — 进化因子×5！', icon:'🚀' },
    { check: s => s.bldCount('qsController') > 0 && s.prestigeCount >= 1, text:'QS信号自动加速全产线，多多益善！可在P4快速转生，或推到P5拿5×进化因子', icon:'🚀' },
  ],
  5: [
    { check: s => !s.techs.dysonTheory.done, text:'研究「微型戴森理论」— 终极科技！为建造奇观做准备', icon:'📖' },
    { check: s => s.techs.dysonTheory.done && s.bldCount('microDyson') === 0, text:'建造终极奇观「微型戴森球」！全图仅限一座，0消耗→超强产出', icon:'🏛️' },
    { check: s => s.bldCount('microDyson') > 0 && s.wBuild && !s._wonderEventPending, text:'奇观建造中...注意！每60秒会触发建造事件，需要你做出关键决策！', icon:'⚡' },
    { check: s => s.bldCount('microDyson') > 0 && s.wBuild && s._wonderEventPending, text:'⚠️ 建造事件！查看弹窗做出选择，建造暂停等待你的决策！', icon:'🔔' },
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
  // Phase 1 — 能量缓冲池（需要葡萄糖输入）
  { from:'glucoseCollector', to:'energyBuffer',     res:'glucose',  icon:'🟢', color:'#22c55e', label:'葡萄糖' },
  // 能量缓冲池也能作为能量供应源
  { from:'energyBuffer',     to:'simpleExtractor',  res:'energy',   icon:'⚡', color:'#fb923c', label:'ATP' },
  { from:'energyBuffer',     to:'nitrogenFixer',    res:'energy',   icon:'⚡', color:'#fb923c', label:'ATP' },
  { from:'energyBuffer',     to:'proteinFactory',   res:'energy',   icon:'⚡', color:'#fb923c', label:'ATP' },
  { from:'energyBuffer',     to:'geneExtractor',    res:'energy',   icon:'⚡', color:'#fb923c', label:'ATP' },
  { from:'energyBuffer',     to:'ribosomeCluster',  res:'energy',   icon:'⚡', color:'#fb923c', label:'ATP' },
  { from:'energyBuffer',     to:'biofilmReactor',   res:'energy',   icon:'⚡', color:'#fb923c', label:'ATP' },
  { from:'energyBuffer',     to:'sporeSower',       res:'energy',   icon:'⚡', color:'#fb923c', label:'ATP' },
  { from:'energyBuffer',     to:'qsController',     res:'energy',   icon:'⚡', color:'#fb923c', label:'ATP' },
  { from:'energyBuffer',     to:'nanoAssembler',    res:'energy',   icon:'⚡', color:'#fb923c', label:'ATP' },
  { from:'energyBuffer',     to:'pheromoneStation',  res:'energy',   icon:'⚡', color:'#fb923c', label:'ATP' },
  // Phase 2
  { from:'energyStation',    to:'nitrogenFixer',    res:'energy',   icon:'⚡', color:'#f97316', label:'ATP' },
  { from:'nitrogenFixer',    to:'proteinFactory',   res:'nitrogen', icon:'🔵', color:'#3b82f6', label:'氮源' },
  { from:'energyStation',    to:'proteinFactory',   res:'energy',   icon:'⚡', color:'#f97316', label:'ATP' },
  { from:'proteinFactory',   to:'geneExtractor',    res:'protein',  icon:'🧪', color:'#ec4899', label:'蛋白质' },
  { from:'energyStation',    to:'geneExtractor',    res:'energy',   icon:'⚡', color:'#f97316', label:'ATP' },
  // Phase 2 — 氨基酸合成仪（需要氮源+葡萄糖）
  { from:'nitrogenFixer',    to:'aminoSynth',       res:'nitrogen', icon:'🔵', color:'#3b82f6', label:'氮源' },
  { from:'glucoseCollector', to:'aminoSynth',       res:'glucose',  icon:'🟢', color:'#22c55e', label:'葡萄糖' },
  // Phase 2 — 核糖体集群（需要蛋白质+能量）
  { from:'proteinFactory',   to:'ribosomeCluster',  res:'protein',  icon:'🧪', color:'#ec4899', label:'蛋白质' },
  { from:'energyStation',    to:'ribosomeCluster',  res:'energy',   icon:'⚡', color:'#f97316', label:'ATP' },
  // Phase 3
  { from:'glucoseCollector', to:'biofilmReactor',   res:'glucose',  icon:'🟢', color:'#22c55e', label:'葡萄糖' },
  { from:'nitrogenFixer',    to:'biofilmReactor',   res:'nitrogen', icon:'🔵', color:'#3b82f6', label:'氮源' },
  { from:'energyStation',    to:'biofilmReactor',   res:'energy',   icon:'⚡', color:'#f97316', label:'ATP' },
  // Phase 3 — 孢子播种器（需要生物质+能量）
  { from:'biofilmReactor',   to:'sporeSower',       res:'biomass',  icon:'🧱', color:'#14b8a6', label:'生物质' },
  { from:'energyStation',    to:'sporeSower',       res:'energy',   icon:'⚡', color:'#f97316', label:'ATP' },
  // Phase 4
  { from:'energyStation',    to:'qsController',     res:'energy',   icon:'⚡', color:'#f97316', label:'ATP' },
  // Phase 4 — 纳米组装线（需要QS+能量）
  { from:'qsController',     to:'nanoAssembler',    res:'qs',       icon:'📡', color:'#eab308', label:'QS信号' },
  { from:'energyStation',    to:'nanoAssembler',    res:'energy',   icon:'⚡', color:'#f97316', label:'ATP' },
  // Phase 4 — 信息素广播站（需要蛋白质+能量）
  { from:'proteinFactory',   to:'pheromoneStation',  res:'protein',  icon:'🧪', color:'#ec4899', label:'蛋白质' },
  { from:'energyStation',    to:'pheromoneStation',  res:'energy',   icon:'⚡', color:'#f97316', label:'ATP' },
  // Phase 3 — 生物质转化炉（需要蛋白质+能量）
  { from:'proteinFactory',   to:'biomassConverter',   res:'protein',  icon:'🧪', color:'#ec4899', label:'蛋白质' },
  { from:'aminoSynth',       to:'biomassConverter',   res:'protein',  icon:'🧪', color:'#f472b6', label:'蛋白质' },
  { from:'energyStation',    to:'biomassConverter',   res:'energy',   icon:'⚡', color:'#f97316', label:'ATP' },
  { from:'energyBuffer',     to:'biomassConverter',   res:'energy',   icon:'⚡', color:'#fb923c', label:'ATP' },
  // Phase 3 — 噬菌体裂解器（需要氮源+能量）
  { from:'nitrogenFixer',    to:'quantumExtractor',   res:'nitrogen', icon:'🔵', color:'#3b82f6', label:'氮源' },
  { from:'energyStation',    to:'quantumExtractor',   res:'energy',   icon:'⚡', color:'#f97316', label:'ATP' },
  { from:'energyBuffer',     to:'quantumExtractor',   res:'energy',   icon:'⚡', color:'#fb923c', label:'ATP' },
  // Phase 4 — 共振培养箱（需要QS+能量）
  { from:'qsController',     to:'resonanceChamber',   res:'qs',       icon:'📡', color:'#eab308', label:'QS信号' },
  { from:'pheromoneStation',  to:'resonanceChamber',   res:'qs',       icon:'📡', color:'#facc15', label:'QS信号' },
  { from:'energyStation',    to:'resonanceChamber',   res:'energy',   icon:'⚡', color:'#f97316', label:'ATP' },
  { from:'energyBuffer',     to:'resonanceChamber',   res:'energy',   icon:'⚡', color:'#fb923c', label:'ATP' },
  // Phase 4 — 共振培养箱作为上游（产出 glucose/nitrogen/protein）
  { from:'resonanceChamber', to:'energyStation',       res:'glucose',  icon:'🟢', color:'#c084fc', label:'葡萄糖' },
  { from:'resonanceChamber', to:'energyBuffer',        res:'glucose',  icon:'🟢', color:'#c084fc', label:'葡萄糖' },
  { from:'resonanceChamber', to:'simpleExtractor',     res:'glucose',  icon:'🟢', color:'#c084fc', label:'葡萄糖' },
  { from:'resonanceChamber', to:'proteinFactory',      res:'nitrogen', icon:'🔵', color:'#c084fc', label:'氮源' },
  { from:'resonanceChamber', to:'aminoSynth',          res:'nitrogen', icon:'🔵', color:'#c084fc', label:'氮源' },
  { from:'resonanceChamber', to:'biofilmReactor',      res:'nitrogen', icon:'🔵', color:'#c084fc', label:'氮源' },
  { from:'resonanceChamber', to:'geneExtractor',       res:'protein',  icon:'🧪', color:'#c084fc', label:'蛋白质' },
  { from:'resonanceChamber', to:'biomassConverter',    res:'protein',  icon:'🧪', color:'#c084fc', label:'蛋白质' },
  // Phase 3 — 发酵液泡（需要生物质+蛋白质，产出能量）
  { from:'biofilmReactor',   to:'fermentVacuole',     res:'biomass',  icon:'🧱', color:'#10b981', label:'生物质' },
  { from:'biomassConverter', to:'fermentVacuole',     res:'biomass',  icon:'🧱', color:'#10b981', label:'生物质' },
  { from:'nanoAssembler',    to:'fermentVacuole',     res:'biomass',  icon:'🧱', color:'#10b981', label:'生物质' },
  { from:'proteinFactory',   to:'fermentVacuole',     res:'protein',  icon:'🧪', color:'#ec4899', label:'蛋白质' },
  { from:'aminoSynth',       to:'fermentVacuole',     res:'protein',  icon:'🧪', color:'#ec4899', label:'蛋白质' },
  // 发酵液泡的能量输出（供给所有消耗能量的建筑）
  { from:'fermentVacuole',   to:'simpleExtractor',    res:'energy',   icon:'⚡', color:'#f59e0b', label:'ATP' },
  { from:'fermentVacuole',   to:'nitrogenFixer',      res:'energy',   icon:'⚡', color:'#f59e0b', label:'ATP' },
  { from:'fermentVacuole',   to:'proteinFactory',     res:'energy',   icon:'⚡', color:'#f59e0b', label:'ATP' },
  { from:'fermentVacuole',   to:'geneExtractor',      res:'energy',   icon:'⚡', color:'#f59e0b', label:'ATP' },
  { from:'fermentVacuole',   to:'ribosomeCluster',    res:'energy',   icon:'⚡', color:'#f59e0b', label:'ATP' },
  { from:'fermentVacuole',   to:'biofilmReactor',     res:'energy',   icon:'⚡', color:'#f59e0b', label:'ATP' },
  { from:'fermentVacuole',   to:'sporeSower',         res:'energy',   icon:'⚡', color:'#f59e0b', label:'ATP' },
  { from:'fermentVacuole',   to:'biomassConverter',   res:'energy',   icon:'⚡', color:'#f59e0b', label:'ATP' },
  { from:'fermentVacuole',   to:'quantumExtractor',   res:'energy',   icon:'⚡', color:'#f59e0b', label:'ATP' },
  { from:'fermentVacuole',   to:'qsController',       res:'energy',   icon:'⚡', color:'#f59e0b', label:'ATP' },
  { from:'fermentVacuole',   to:'nanoAssembler',      res:'energy',   icon:'⚡', color:'#f59e0b', label:'ATP' },
  { from:'fermentVacuole',   to:'pheromoneStation',   res:'energy',   icon:'⚡', color:'#f59e0b', label:'ATP' },
  { from:'fermentVacuole',   to:'resonanceChamber',   res:'energy',   icon:'⚡', color:'#f59e0b', label:'ATP' },
  // v3.0 §5: 信号中继站 — 万能中继（所有产出建筑可发→中继，中继可发→所有消耗建筑）
  // 中继不生产不消耗，只转发。FLOW_MAP用于验证连接合法性。
  { from:'glucoseCollector', to:'signalRelay',         res:'glucose',  icon:'🟢', color:'#22c55e', label:'葡萄糖' },
  { from:'energyStation',    to:'signalRelay',         res:'energy',   icon:'⚡', color:'#f97316', label:'ATP' },
  { from:'energyBuffer',     to:'signalRelay',         res:'energy',   icon:'⚡', color:'#fb923c', label:'ATP' },
  { from:'nitrogenFixer',    to:'signalRelay',         res:'nitrogen', icon:'🔵', color:'#3b82f6', label:'氮源' },
  { from:'proteinFactory',   to:'signalRelay',         res:'protein',  icon:'🧪', color:'#ec4899', label:'蛋白质' },
  { from:'aminoSynth',       to:'signalRelay',         res:'protein',  icon:'🧪', color:'#f472b6', label:'蛋白质' },
  { from:'geneExtractor',    to:'signalRelay',         res:'dna',      icon:'🧬', color:'#a855f7', label:'DNA' },
  { from:'biofilmReactor',   to:'signalRelay',         res:'biomass',  icon:'🧱', color:'#14b8a6', label:'生物质' },
  { from:'sporeSower',       to:'signalRelay',         res:'dna',      icon:'🧬', color:'#34d399', label:'DNA' },
  { from:'qsController',     to:'signalRelay',         res:'qs',       icon:'📡', color:'#eab308', label:'QS信号' },
  { from:'fermentVacuole',   to:'signalRelay',         res:'energy',   icon:'⚡', color:'#f59e0b', label:'ATP' },
  { from:'nanoAssembler',    to:'signalRelay',         res:'biomass',  icon:'🧱', color:'#a3e635', label:'生物质' },
  { from:'resonanceChamber', to:'signalRelay',         res:'glucose',  icon:'🟢', color:'#c084fc', label:'葡萄糖' },
  // 中继→消耗建筑
  { from:'signalRelay',      to:'energyStation',       res:'glucose',  icon:'🟢', color:'#60a5fa', label:'葡萄糖' },
  { from:'signalRelay',      to:'simpleExtractor',     res:'glucose',  icon:'🟢', color:'#60a5fa', label:'葡萄糖' },
  { from:'signalRelay',      to:'simpleExtractor',     res:'energy',   icon:'⚡', color:'#60a5fa', label:'ATP' },
  { from:'signalRelay',      to:'energyBuffer',        res:'glucose',  icon:'🟢', color:'#60a5fa', label:'葡萄糖' },
  { from:'signalRelay',      to:'nitrogenFixer',       res:'energy',   icon:'⚡', color:'#60a5fa', label:'ATP' },
  { from:'signalRelay',      to:'proteinFactory',      res:'nitrogen', icon:'🔵', color:'#60a5fa', label:'氮源' },
  { from:'signalRelay',      to:'proteinFactory',      res:'energy',   icon:'⚡', color:'#60a5fa', label:'ATP' },
  { from:'signalRelay',      to:'geneExtractor',       res:'protein',  icon:'🧪', color:'#60a5fa', label:'蛋白质' },
  { from:'signalRelay',      to:'geneExtractor',       res:'energy',   icon:'⚡', color:'#60a5fa', label:'ATP' },
  { from:'signalRelay',      to:'aminoSynth',          res:'nitrogen', icon:'🔵', color:'#60a5fa', label:'氮源' },
  { from:'signalRelay',      to:'aminoSynth',          res:'glucose',  icon:'🟢', color:'#60a5fa', label:'葡萄糖' },
  { from:'signalRelay',      to:'ribosomeCluster',     res:'protein',  icon:'🧪', color:'#60a5fa', label:'蛋白质' },
  { from:'signalRelay',      to:'ribosomeCluster',     res:'energy',   icon:'⚡', color:'#60a5fa', label:'ATP' },
  { from:'signalRelay',      to:'biofilmReactor',      res:'glucose',  icon:'🟢', color:'#60a5fa', label:'葡萄糖' },
  { from:'signalRelay',      to:'biofilmReactor',      res:'nitrogen', icon:'🔵', color:'#60a5fa', label:'氮源' },
  { from:'signalRelay',      to:'biofilmReactor',      res:'energy',   icon:'⚡', color:'#60a5fa', label:'ATP' },
  { from:'signalRelay',      to:'sporeSower',          res:'biomass',  icon:'🧱', color:'#60a5fa', label:'生物质' },
  { from:'signalRelay',      to:'sporeSower',          res:'energy',   icon:'⚡', color:'#60a5fa', label:'ATP' },
  { from:'signalRelay',      to:'biomassConverter',    res:'protein',  icon:'🧪', color:'#60a5fa', label:'蛋白质' },
  { from:'signalRelay',      to:'biomassConverter',    res:'energy',   icon:'⚡', color:'#60a5fa', label:'ATP' },
  { from:'signalRelay',      to:'quantumExtractor',    res:'nitrogen', icon:'🔵', color:'#60a5fa', label:'氮源' },
  { from:'signalRelay',      to:'quantumExtractor',    res:'energy',   icon:'⚡', color:'#60a5fa', label:'ATP' },
  { from:'signalRelay',      to:'fermentVacuole',      res:'biomass',  icon:'🧱', color:'#60a5fa', label:'生物质' },
  { from:'signalRelay',      to:'fermentVacuole',      res:'protein',  icon:'🧪', color:'#60a5fa', label:'蛋白质' },
  { from:'signalRelay',      to:'qsController',        res:'energy',   icon:'⚡', color:'#60a5fa', label:'ATP' },
  { from:'signalRelay',      to:'nanoAssembler',       res:'qs',       icon:'📡', color:'#60a5fa', label:'QS信号' },
  { from:'signalRelay',      to:'nanoAssembler',       res:'energy',   icon:'⚡', color:'#60a5fa', label:'ATP' },
  { from:'signalRelay',      to:'pheromoneStation',    res:'protein',  icon:'🧪', color:'#60a5fa', label:'蛋白质' },
  { from:'signalRelay',      to:'pheromoneStation',    res:'energy',   icon:'⚡', color:'#60a5fa', label:'ATP' },
  { from:'signalRelay',      to:'resonanceChamber',    res:'qs',       icon:'📡', color:'#60a5fa', label:'QS信号' },
  { from:'signalRelay',      to:'resonanceChamber',    res:'energy',   icon:'⚡', color:'#60a5fa', label:'ATP' },
  // 中继↔中继（中继链）
  { from:'signalRelay',      to:'signalRelay',         res:'glucose',  icon:'🟢', color:'#60a5fa', label:'中继' },
];

// ===== FLOW_MAP 预构建查找表 (P0-1 性能优化) =====
// O(1) 替代所有 FLOW_MAP.some() / .filter() 的 O(n) 线性扫描
const FLOW_PAIR = new Set();           // "from|to" → O(1) 存在性检查
const FLOW_TRIPLE = new Set();         // "from|to|res" → O(1) 带资源的存在性检查
const FLOW_BY_TO = new Map();          // to → [flow entries]  (某建筑作为接收端的所有流)
const FLOW_BY_FROM = new Map();        // from → [flow entries] (某建筑作为发送端的所有流)
const FLOW_TYPES_TO = new Set();       // 所有出现在 to 端的建筑类型
const FLOW_TYPES_FROM = new Set();     // 所有出现在 from 端的建筑类型
for (const f of FLOW_MAP) {
  FLOW_PAIR.add(f.from + '|' + f.to);
  FLOW_TRIPLE.add(f.from + '|' + f.to + '|' + f.res);
  FLOW_TYPES_TO.add(f.to);
  FLOW_TYPES_FROM.add(f.from);
  if (!FLOW_BY_TO.has(f.to)) FLOW_BY_TO.set(f.to, []);
  FLOW_BY_TO.get(f.to).push(f);
  if (!FLOW_BY_FROM.has(f.from)) FLOW_BY_FROM.set(f.from, []);
  FLOW_BY_FROM.get(f.from).push(f);
}

// ===== PETRI DISH EXPERIMENT RECIPES =====
const PETRI_RECIPES = [
  // Phase 2 — 基础配方
  { id:'r_carbon', name:'碳源富集', icon:'🌱', desc:'碳源采集器的密集培养产生了意想不到的共振效应', phase:2,
    requires:{ glucoseCollector:2 }, minBuildings:3,
    buff:{ type:'resMult_glucose', value:0.20, duration:60, name:'碳源富集', icon:'🌱', color:'#22c55e' },
    reward:{ glucose:30 } },
  { id:'r_energy', name:'能量脉冲', icon:'⚡', desc:'ATP合成酶集群引发了短暂的能量风暴', phase:2,
    requires:{ energyStation:2, glucoseCollector:1 }, minBuildings:3,
    buff:{ type:'resMult_energy', value:0.20, duration:60, name:'能量脉冲', icon:'⚡', color:'#f97316' },
    reward:{ energy:30 } },
  { id:'r_gene', name:'基因萃取', icon:'🧬', desc:'提取器和合成酶的邻接形成了高效的基因链', phase:2,
    requires:{ geneExtractor:1, energyStation:1, glucoseCollector:1 }, minBuildings:3,
    buff:{ type:'resMult_dna', value:0.25, duration:45, name:'基因萃取', icon:'🧬', color:'#a855f7' },
    reward:{ dna:8 } },
  { id:'r_nitrogen', name:'氮源聚合', icon:'🔵', desc:'固氮装置的磁场在区域内形成了氮富集层', phase:2,
    requires:{ nitrogenFixer:2, energyStation:1 }, minBuildings:3,
    buff:{ type:'resMult_nitrogen', value:0.30, duration:45, name:'氮源聚合', icon:'🔵', color:'#3b82f6' },
    reward:{ nitrogen:15 } },
  { id:'r_protein', name:'蛋白质激增', icon:'🧪', desc:'蛋白质工厂在氮富集环境下效率倍增', phase:2,
    requires:{ proteinFactory:1, nitrogenFixer:1, energyStation:1 }, minBuildings:3,
    buff:{ type:'resMult_protein', value:0.25, duration:45, name:'蛋白质激增', icon:'🧪', color:'#ec4899' },
    reward:{ protein:10 } },
  { id:'r_supply', name:'供给链共振', icon:'🔗', desc:'完整的供给链路形成了协同增效', phase:2,
    requires:{ glucoseCollector:1, energyStation:1, geneExtractor:1 }, minBuildings:3,
    buff:{ type:'prodMult', value:0.08, duration:90, name:'供给链共振', icon:'🔗', color:'#06d6a0' },
    reward:{ glucose:20, energy:20 } },
  // Phase 3 — 中阶配方
  { id:'r_biofilm', name:'生物膜培育', icon:'🧫', desc:'生物膜反应器在碳氮双源下快速扩增', phase:3,
    requires:{ biofilmReactor:1, glucoseCollector:1, nitrogenFixer:1 }, minBuildings:3,
    buff:{ type:'resMult_biomass', value:0.30, duration:60, name:'生物膜培育', icon:'🧫', color:'#14b8a6' },
    reward:{ biomass:12 } },
  { id:'r_mycelium', name:'菌丝渗透', icon:'🕸', desc:'运输网在密集建筑群中找到了最优通路', phase:3,
    requires:{ transport:1 }, minBuildings:3,
    buff:{ type:'logisticsBoost', value:0.12, duration:60, name:'菌丝渗透', icon:'🕸', color:'#4a6080' },
    reward:{ biomass:8 } },
  { id:'r_spore', name:'孢子扩散', icon:'🍄', desc:'孢子在生物膜基质上加速萌发', phase:3,
    requires:{ sporeSower:1, biofilmReactor:1 }, minBuildings:3,
    buff:{ type:'prodMult', value:0.10, duration:60, name:'孢子扩散', icon:'🍄', color:'#34d399' },
    reward:{ dna:10, nitrogen:10 } },
  { id:'r_metab', name:'代谢循环', icon:'♻️', desc:'代谢回路实现了接近零浪费的循环反应', phase:3,
    requires:{ metabolicLoop:1 }, minBuildings:3,
    buff:{ type:'consReduce', value:0.15, duration:90, name:'代谢循环', icon:'♻️', color:'#06b6d4' },
    reward:{ glucose:25, energy:25 } },
  // Phase 4 — 高阶配方
  { id:'r_qs', name:'群体共振', icon:'📡', desc:'QS信号在密集建筑中产生了正反馈回路', phase:4,
    requires:{ qsController:1 }, minBuildings:3,
    buff:{ type:'qsDecay', value:0.40, duration:60, name:'群体共振', icon:'📡', color:'#eab308' },
    reward:{ qs:5 } },
  { id:'r_nano', name:'纳米协同', icon:'🔩', desc:'纳米线在QS场中实现了超精密自组装', phase:4,
    requires:{ nanoAssembler:1, qsController:1 }, minBuildings:3,
    buff:{ type:'prodMult', value:0.15, duration:45, name:'纳米协同', icon:'🔩', color:'#a3e635' },
    reward:{ biomass:15, protein:10 } },
  // 特殊配方
  { id:'r_chaos', name:'混沌培养', icon:'🌀', desc:'不同类型的微生物产生了意料之外的化学反应', phase:2,
    requires:{}, minBuildings:3, minTypes:3, // 特殊：3种不同类型
    buff:{ type:'instant_random', value:2.0, duration:0, name:'混沌培养', icon:'🌀', color:'#f59e0b' },
    reward:{} },
  { id:'r_perfect', name:'完美反应', icon:'⚗️', desc:'高密度建筑群实现了完美的生化级联反应', phase:3,
    requires:{}, minBuildings:5, // 特殊：区域内≥5个建筑
    buff:{ type:'prodMult', value:0.12, duration:120, name:'完美反应', icon:'⚗️', color:'#8b5cf6' },
    reward:{ glucose:30, energy:30, dna:10 } },
  { id:'r_dyson', name:'戴森预演', icon:'🏛', desc:'在微观尺度预演了行星级能源采集', phase:5,
    requires:{ microDyson:1 }, minBuildings:3,
    buff:{ type:'prodMult', value:0.20, duration:120, name:'戴森预演', icon:'🏛', color:'#fbbf24' },
    reward:{ glucose:50, energy:50, dna:20, protein:20 } },
];
const PETRI_COOLDOWN = 90; // 冷却时间(秒)

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

// ===== v3.0 §2: EXPLORATION GOALS — 阶段探索度积分项 =====
// 每个阶段transition (P1→P2, P2→P3, ...) 定义一组探索度目标
// required = 需要达成的最低积分数（从列表中任选N个）
const EXPLORATION_GOALS = {
  // P1→P2: 需3分（任选3）
  1: {
    required: 3,
    goals: [
      { id:'p1_belt3',   n:'建立3条传送带',      icon:'🔗', type:'连线',
        check: s => (s._activeBelts||[]).length >= 3, progress: s => Math.min((s._activeBelts||[]).length, 3), max: 3 },
      { id:'p1_adj3',    n:'发现3条邻接规则',    icon:'🏗️', type:'布局',
        check: s => Object.keys(s._discoveredAdj||{}).length >= 3, progress: s => Math.min(Object.keys(s._discoveredAdj||{}).length, 3), max: 3 },
      { id:'p1_ch1',     n:'完成1个P1挑战',      icon:'🎯', type:'挑战',
        check: s => CHALLENGES.filter(c => c.phase === 1 && s.completedChallenges[c.id]).length >= 1, progress: s => Math.min(CHALLENGES.filter(c => c.phase === 1 && s.completedChallenges[c.id]).length, 1), max: 1 },
      { id:'p1_buffer',  n:'拥有能量缓冲池',     icon:'🔋', type:'建设',
        check: s => s.bldCount('energyBuffer') >= 1, progress: s => Math.min(s.bldCount('energyBuffer'), 1), max: 1 },
      { id:'p1_bld5',    n:'累计建造5个建筑',     icon:'🏗️', type:'建设',
        check: s => s.totalBuildings() >= 5, progress: s => Math.min(s.totalBuildings(), 5), max: 5 },
      { id:'p1_evo3',    n:'进化到Lv.3',         icon:'📈', type:'成长',
        check: s => s.eL >= 3, progress: s => Math.min(s.eL, 3), max: 3 },
    ],
  },
  // P2→P3: 需4分（任选4）
  2: {
    required: 4,
    goals: [
      { id:'p2_mbelt4',  n:'手动连接4条传送带',   icon:'🔗', type:'连线',
        check: s => Object.keys(s.manualBelts||{}).length >= 4, progress: s => Math.min(Object.keys(s.manualBelts||{}).length, 4), max: 4 },
      { id:'p2_dist2',   n:'建立1条2格+距离传送带', icon:'🔗', type:'远距',
        check: s => (s.stats.maxBeltDist||0) >= 2, progress: s => Math.min(s.stats.maxBeltDist||0, 2) >= 2 ? 1 : 0, max: 1 },
      { id:'p2_combo3',  n:'达成3连击传送带',     icon:'⚡', type:'技巧',
        check: s => (s.stats.maxBeltCombo||0) >= 3, progress: s => Math.min(s.stats.maxBeltCombo||0, 3), max: 3 },
      { id:'p2_adj6',    n:'发现6条邻接规则',     icon:'🏗️', type:'布局',
        check: s => Object.keys(s._discoveredAdj||{}).length >= 6, progress: s => Math.min(Object.keys(s._discoveredAdj||{}).length, 6), max: 6 },
      { id:'p2_petri2',  n:'完成2个培养皿实验',   icon:'🧫', type:'探索',
        check: s => (s._petriCount||0) >= 2, progress: s => Math.min(s._petriCount||0, 2), max: 2 },
      { id:'p2_branch',  n:'研究1个P2互斥科技',   icon:'🔬', type:'科技',
        check: s => !!(s.techs.nitrogenCycle?.done || s.techs.proteinEngineering?.done), progress: s => (s.techs.nitrogenCycle?.done || s.techs.proteinEngineering?.done) ? 1 : 0, max: 1 },
      { id:'p2_bld8',    n:'拥有8+建筑',          icon:'🏗️', type:'建设',
        check: s => s.totalBuildings() >= 8, progress: s => Math.min(s.totalBuildings(), 8), max: 8 },
    ],
  },
  // P3→P4: 需5分（任选5）
  3: {
    required: 5,
    goals: [
      { id:'p3_mbelt10', n:'手动连接10条传送带',   icon:'🔗', type:'连线',
        check: s => Object.keys(s.manualBelts||{}).length >= 10, progress: s => Math.min(Object.keys(s.manualBelts||{}).length, 10), max: 10 },
      { id:'p3_dist3',   n:'建立2条3格+距离传送带', icon:'🔗', type:'远距',
        check: s => { const belts = Object.keys(s.manualBelts||{}); let c=0; for(const k of belts){if(s.getBeltDistance(k)>=3)c++;} return c>=2; },
        progress: s => { const belts = Object.keys(s.manualBelts||{}); let c=0; for(const k of belts){if(s.getBeltDistance(k)>=3)c++;} return Math.min(c,2); }, max: 2 },
      { id:'p3_sync1',   n:'达成1个供给同步加成',  icon:'⚡', type:'优化',
        check: s => Object.values(s._syncBonuses||{}).some(sb => sb.sync >= 0.5), progress: s => Object.values(s._syncBonuses||{}).some(sb => sb.sync >= 0.5) ? 1 : 0, max: 1 },
      { id:'p3_mut1',    n:'激活1个突变',          icon:'🧬', type:'突变',
        check: s => (s._mutSlots||[]).length >= 1, progress: s => Math.min((s._mutSlots||[]).length, 1), max: 1 },
      { id:'p3_adj12',   n:'发现12条邻接规则',     icon:'🏗️', type:'布局',
        check: s => Object.keys(s._discoveredAdj||{}).length >= 12, progress: s => Math.min(Object.keys(s._discoveredAdj||{}).length, 12), max: 12 },
      { id:'p3_petri3',  n:'完成3个培养皿实验',    icon:'🧫', type:'探索',
        check: s => (s._petriCount||0) >= 3, progress: s => Math.min(s._petriCount||0, 3), max: 3 },
      { id:'p3_p3bld3',  n:'拥有3种不同P3建筑',   icon:'🏗️', type:'建设',
        check: s => { const p3b=['biofilmReactor','transport','sporeSower','metabolicLoop','nanoAssembler']; return p3b.filter(b=>s.bldCount(b)>0).length>=3; },
        progress: s => { const p3b=['biofilmReactor','transport','sporeSower','metabolicLoop','nanoAssembler']; return Math.min(p3b.filter(b=>s.bldCount(b)>0).length,3); }, max: 3 },
    ],
  },
  // P4→P5: 需4分（任选4）
  4: {
    required: 4,
    goals: [
      { id:'p4_belt15',  n:'传送带总数≥15',       icon:'🔗', type:'连线',
        check: s => (s._activeBelts||[]).length >= 15, progress: s => Math.min((s._activeBelts||[]).length, 15), max: 15 },
      { id:'p4_sync2',   n:'2个建筑达到供给同步',  icon:'⚡', type:'优化',
        check: s => Object.values(s._syncBonuses||{}).filter(sb => sb.sync >= 0.5).length >= 2, progress: s => Math.min(Object.values(s._syncBonuses||{}).filter(sb => sb.sync >= 0.5).length, 2), max: 2 },
      { id:'p4_mut3',    n:'激活3个突变',          icon:'🧬', type:'突变',
        check: s => (s._mutSlots||[]).length >= 3, progress: s => Math.min((s._mutSlots||[]).length, 3), max: 3 },
      { id:'p4_adj18',   n:'发现18条邻接规则',     icon:'🏗️', type:'布局',
        check: s => Object.keys(s._discoveredAdj||{}).length >= 18, progress: s => Math.min(Object.keys(s._discoveredAdj||{}).length, 18), max: 18 },
      { id:'p4_qs30',    n:'QS信号库存≥30',       icon:'📡', type:'经济',
        check: s => (s.res.qs||0) >= 30, progress: s => Math.min(s.res.qs||0, 30), max: 30 },
      { id:'p4_ch4',     n:'完成1个P4挑战',        icon:'🎯', type:'挑战',
        check: s => CHALLENGES.filter(c => c.phase === 4 && s.completedChallenges[c.id]).length >= 1, progress: s => Math.min(CHALLENGES.filter(c => c.phase === 4 && s.completedChallenges[c.id]).length, 1), max: 1 },
      { id:'p4_branch4', n:'研究1个P4互斥科技',    icon:'🔬', type:'科技',
        check: s => !!(s.techs.signalAmplifier?.done || s.techs.evolutionCatalyst?.done), progress: s => (s.techs.signalAmplifier?.done || s.techs.evolutionCatalyst?.done) ? 1 : 0, max: 1 },
    ],
  },
};

// ===== v3.0 §6: P3子阶段 — P3b建筑集合 + P3a→P3b探索度 =====
// P3a (物流基础): biofilmReactor, transport, sporeSower — 研究biofilmTech后解锁
// P3b (物流进阶): metabolicLoop, signalRelay, fermentVacuole, biomassConverter, quantumExtractor — P3a探索度≥3
const P3B_BUILDINGS = new Set(['metabolicLoop', 'signalRelay', 'fermentVacuole', 'biomassConverter', 'quantumExtractor']);

const P3B_EXPLORATION_GOALS = {
  required: 3,
  goals: [
    { id:'p3b_bld2',   n:'拥有2种P3a建筑',         icon:'🏗️', type:'建设',
      check: s => ['biofilmReactor','transport','sporeSower'].filter(b => s.bldCount(b) > 0).length >= 2,
      progress: s => Math.min(['biofilmReactor','transport','sporeSower'].filter(b => s.bldCount(b) > 0).length, 2), max: 2 },
    { id:'p3b_petri1', n:'完成1个P3培养皿实验',     icon:'🧫', type:'探索',
      check: s => (s._petriCount||0) >= 1 + (s._p3bPetriBase||0),
      progress: s => Math.min((s._petriCount||0) - (s._p3bPetriBase||0), 1), max: 1 },
    { id:'p3b_mut1',   n:'激活1个突变',             icon:'🧬', type:'突变',
      check: s => (s._mutSlots||[]).length >= 1,
      progress: s => Math.min((s._mutSlots||[]).length, 1), max: 1 },
    { id:'p3b_belt8',  n:'手动连接8+传送带',        icon:'🔗', type:'连线',
      check: s => Object.keys(s.manualBelts||{}).length >= 8,
      progress: s => Math.min(Object.keys(s.manualBelts||{}).length, 8), max: 8 },
    { id:'p3b_adj10',  n:'发现10条邻接规则',        icon:'🏗️', type:'布局',
      check: s => Object.keys(s._discoveredAdj||{}).length >= 10,
      progress: s => Math.min(Object.keys(s._discoveredAdj||{}).length, 10), max: 10 },
    { id:'p3b_dist3',  n:'拥有1条3格+距离传送带',   icon:'🔗', type:'远距',
      check: s => (s.stats.maxBeltDist||0) >= 3,
      progress: s => (s.stats.maxBeltDist||0) >= 3 ? 1 : 0, max: 1 },
  ],
};

// ===== v3.0 §9.2: 建筑Lv3特化 — 二选一路线 =====
const SPECIALIZATIONS = {
  transport: {
    name: '菌丝运输网',
    options: [
      { id:'transport_range', name:'覆盖扩展', icon:'📡', color:'#14b8a6',
        desc:'+1最大传送带连线距离（4→5格）',
        effect: { type:'beltRange', value: 1 } },
      { id:'transport_speed', name:'高速通道', icon:'⚡', color:'#eab308',
        desc:'所有传送带效率+15%',
        effect: { type:'beltEfficiency', value: 0.15 } },
    ]
  },
  biofilmReactor: {
    name: '生物膜反应器',
    options: [
      { id:'biofilm_adj', name:'膜基防护', icon:'🛡️', color:'#22c55e',
        desc:'该建筑邻接加成+20%',
        effect: { type:'adjBonus', value: 0.20 } },
      { id:'biofilm_port', name:'膜基枢纽', icon:'🔗', color:'#f97316',
        desc:'+1输出端口',
        effect: { type:'extraOutPort', value: 1 } },
    ]
  },
  signalRelay: {
    name: '信号中继站',
    options: [
      { id:'relay_amp', name:'信号增幅', icon:'📶', color:'#60a5fa',
        desc:'中继衰减降至0%（正常5%/跳）',
        effect: { type:'relayDecay', value: 0 } },
      { id:'relay_hub', name:'分流枢纽', icon:'🔀', color:'#c084fc',
        desc:'+2端口（可实现1进5出的分流）',
        effect: { type:'extraPorts', value: 2 } },
    ]
  },
};

// ===== v3.0 §1: EVOLUTION TASKS — 进化培养3选1任务 =====
// 每个阶段transition定义3类任务(连线/布局/经济)，进化时随机抽1个/类
const EVOLUTION_TASKS = {
  // P1→P2 (简单教学)
  1: [
    { id:'et1_belt2', type:'连线', icon:'🔗', n:'建立2条传送带连接',
      check: s => (s._activeBelts||[]).length >= 2 + (s._evoTaskBase?.belt||0),
      progress: s => Math.min((s._activeBelts||[]).length - (s._evoTaskBase?.belt||0), 2),
      max: 2, reward: { energy: 15 } },
    { id:'et1_adj1', type:'布局', icon:'🏗️', n:'发现1条新邻接规则',
      check: s => Object.keys(s._discoveredAdj||{}).length >= 1 + (s._evoTaskBase?.adj||0),
      progress: s => Math.min(Object.keys(s._discoveredAdj||{}).length - (s._evoTaskBase?.adj||0), 1),
      max: 1, reward: { glucose: 20 } },
    { id:'et1_econ30', type:'经济', icon:'⏱️', n:'维持30秒葡萄糖正收益',
      check: s => (s._evoEconTimer||0) >= 30,
      progress: s => Math.min(s._evoEconTimer||0, 30),
      max: 30, reward: { dna: 5 } },
  ],
  // P2→P3 (引入远距/效率)
  2: [
    { id:'et2_dist2', type:'连线', icon:'🔗', n:'建立1条2格+距离传送带',
      check: s => (s.stats.maxBeltDist||0) >= 2,
      progress: s => (s.stats.maxBeltDist||0) >= 2 ? 1 : 0,
      max: 1, reward: { energy: 30 } },
    { id:'et2_adj3', type:'布局', icon:'🏗️', n:'发现3条新邻接规则',
      check: s => Object.keys(s._discoveredAdj||{}).length >= 3 + (s._evoTaskBase?.adj||0),
      progress: s => Math.min(Object.keys(s._discoveredAdj||{}).length - (s._evoTaskBase?.adj||0), 3),
      max: 3, reward: { nitrogen: 10 } },
    { id:'et2_res4', type:'经济', icon:'⏱️', n:'同时拥有4种资源≥10',
      check: s => ['glucose','energy','dna','nitrogen','protein','biomass','qs'].filter(r => (s.res[r]||0)>=10).length >= 4,
      progress: s => Math.min(['glucose','energy','dna','nitrogen','protein','biomass','qs'].filter(r => (s.res[r]||0)>=10).length, 4),
      max: 4, reward: { protein: 8 } },
  ],
  // P3→P4 (策略深度)
  3: [
    { id:'et3_combo3', type:'连线', icon:'🔗', n:'达成3连击传送带',
      check: s => (s.stats.maxBeltCombo||0) >= 3,
      progress: s => Math.min(s.stats.maxBeltCombo||0, 3),
      max: 3, reward: { biomass: 15 } },
    { id:'et3_adj20', type:'布局', icon:'🏗️', n:'使1建筑获≥20%邻接加成',
      check: s => {
        if (!s.grid) return false;
        for (let i = 0; i < s.grid.length; i++) {
          if (!s.grid[i]) continue;
          const adj = s.getAdjacencyBonus(i, s.grid[i].type);
          if (adj && adj.total >= 0.20) return true;
        }
        return false;
      },
      progress: s => {
        let best = 0;
        if (!s.grid) return 0;
        for (let i = 0; i < s.grid.length; i++) {
          if (!s.grid[i]) continue;
          const adj = s.getAdjacencyBonus(i, s.grid[i].type);
          if (adj) best = Math.max(best, adj.total);
        }
        return best >= 0.20 ? 1 : 0;
      },
      max: 1, reward: { protein: 12 } },
    { id:'et3_sync1', type:'经济', icon:'⏱️', n:'让1个建筑达到供给同步',
      check: s => Object.values(s._syncBonuses||{}).some(sb => sb.sync >= 0.5),
      progress: s => Object.values(s._syncBonuses||{}).some(sb => sb.sync >= 0.5) ? 1 : 0,
      max: 1, reward: { dna: 15 } },
  ],
  // P4→P5 (综合挑战)
  4: [
    { id:'et4_dist4', type:'连线', icon:'🔗', n:'建立1条4格距离传送带',
      check: s => (s.stats.maxBeltDist||0) >= 4,
      progress: s => (s.stats.maxBeltDist||0) >= 4 ? 1 : 0,
      max: 1, reward: { qs: 5 } },
    { id:'et4_bld12', type:'布局', icon:'🏗️', n:'拥有12+建筑',
      check: s => s.totalBuildings() >= 12,
      progress: s => Math.min(s.totalBuildings(), 12),
      max: 12, reward: { biomass: 20 } },
    { id:'et4_qs15', type:'经济', icon:'⏱️', n:'QS信号库存≥15',
      check: s => (s.res.qs||0) >= 15,
      progress: s => Math.min(Math.floor(s.res.qs||0), 15),
      max: 15, reward: { dna: 20 } },
  ],
};

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
    n:'🌀 异常代谢场', phase:3,
    d:'培养皿边缘出现一片异常活跃的代谢区域，酶促反应速率远超正常水平...',
    a:{ label:'引导菌落扩散', desc:'获得20🧱生物质 + 效率+3%', fn:s=>{s.res.biomass+=20;s.gEff+=0.03} },
    b:{ label:'采样分析', desc:'获得40⚡ + 12🧬（更安全）', fn:s=>{s.res.energy+=40;s.res.dna+=12} },
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

// ★ 改进2：奇观建造事件 — 300秒建造期间每60秒触发一次互动选择
const WONDER_EVENTS = [
  {
    n:'⚡ 能量脉冲', trigger:60,
    d:'戴森球外壳捕获了一次强烈的能量脉冲！如何利用？',
    a:{ label:'注入建造', desc:'建造加速10%（跳过剩余时间的10%）',
      fn:s=>{ const bd=BLDS[s.wBuild]; const wt=bd?.wonderTime||300; const skip=Math.ceil((wt-s.wProg)*0.10); s.wProg=Math.min(s.wProg+skip,wt); s.log(`⚡ 能量脉冲加速建造 +${skip}s`,'s'); }},
    b:{ label:'储存能量', desc:'获得100⚡ + 60🟢',
      fn:s=>{ s.res.energy+=100; s.res.glucose+=60; s.log('⚡ 能量脉冲已储存 → +100⚡ +60🟢','s'); }},
  },
  {
    n:'🧬 基因共振', trigger:120,
    d:'建造场内的微生物DNA发生共振反应！',
    a:{ label:'引导共振', desc:'建造加速12%，但消耗30🧬',
      fn:s=>{ if(s.res.dna>=30){ s.res.dna-=30; const bd=BLDS[s.wBuild]; const wt=bd?.wonderTime||300; const skip=Math.ceil((wt-s.wProg)*0.12); s.wProg=Math.min(s.wProg+skip,wt); s.log(`🧬 基因共振加速 +${skip}s（消耗30🧬）`,'s'); } else { s.log('🧬 DNA不足，共振失败！','w'); }}},
    b:{ label:'采集样本', desc:'获得25🧬 + 15🧪',
      fn:s=>{ s.res.dna+=25; s.res.protein+=15; s.log('🧬 共振样本采集 → +25🧬 +15🧪','s'); }},
  },
  {
    n:'🌀 引力波动', trigger:180,
    d:'微型戴森球产生引力波动，周围的物质被吸引聚集！',
    a:{ label:'聚集物质', desc:'建造加速15%，效率临时+5%',
      fn:s=>{ const bd=BLDS[s.wBuild]; const wt=bd?.wonderTime||300; const skip=Math.ceil((wt-s.wProg)*0.15); s.wProg=Math.min(s.wProg+skip,wt); s.gEff+=0.05; s.log(`🌀 引力聚集加速 +${skip}s，效率+5%`,'s'); }},
    b:{ label:'释放能量', desc:'获得80⚡ + 20🧱 + 10📡',
      fn:s=>{ s.res.energy+=80; s.res.biomass+=20; s.res.qs=(s.res.qs||0)+10; s.log('🌀 引力波能量释放 → +80⚡ +20🧱 +10📡','s'); }},
  },
  {
    n:'🔬 结构缺陷', trigger:240,
    d:'检测到戴森球外壳出现微裂纹！需要紧急修复！',
    a:{ label:'立即修复', desc:'消耗40🧱+20🧪，建造加速18%',
      fn:s=>{ if(s.res.biomass>=40&&s.res.protein>=20){ s.res.biomass-=40; s.res.protein-=20; const bd=BLDS[s.wBuild]; const wt=bd?.wonderTime||300; const skip=Math.ceil((wt-s.wProg)*0.18); s.wProg=Math.min(s.wProg+skip,wt); s.log(`🔬 紧急修复完成，加速 +${skip}s`,'s'); } else { s.log('🔬 材料不足，修复失败！建造减速10%','w'); const bd=BLDS[s.wBuild]; const wt=bd?.wonderTime||300; const penalty=Math.ceil((wt-s.wProg)*0.10); s.wProg=Math.max(0,s.wProg-penalty); }}},
    b:{ label:'暂时忽略', desc:'不消耗资源，但建造减速8%',
      fn:s=>{ const bd=BLDS[s.wBuild]; const wt=bd?.wonderTime||300; const penalty=Math.ceil((wt-s.wProg)*0.08); s.wProg=Math.max(0,s.wProg-penalty); s.log(`🔬 忽略缺陷，建造减速 -${penalty}s`,'w'); }},
  },
  {
    n:'✨ 量子跃迁', trigger:270,
    d:'戴森球核心即将达到临界状态！最终决策！',
    a:{ label:'全力冲刺', desc:'建造加速25%！最终加速',
      fn:s=>{ const bd=BLDS[s.wBuild]; const wt=bd?.wonderTime||300; const skip=Math.ceil((wt-s.wProg)*0.25); s.wProg=Math.min(s.wProg+skip,wt); s.log(`✨ 量子跃迁！最终加速 +${skip}s！`,'s'); s.screenShake(8); }},
    b:{ label:'稳定核心', desc:'效率永久+8%，获得50🧬',
      fn:s=>{ s.gEff+=0.08; s.res.dna+=50; s.log('✨ 核心已稳定 → 效率永久+8%，+50🧬','s'); }},
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
    return Math.floor((achieveCount * 2 + phaseMult * 3 + evoMult * 2 + buildMult) * (state.wonderComplete ? 5 : 1));
  },
  // 转生加成 — 分层解锁，鼓励多次转生
  bonuses: [
    // --- 第一轮 (5~20) 基础加速 ---
    { cost:5,  n:'初始资金+', d:'初始葡萄糖+50 能量+40', fn:(s)=>{s.res.glucose+=50;s.res.energy+=40} },
    { cost:10, n:'效率基因Ⅰ', d:'初始效率+10%', fn:(s)=>{s.gEff+=0.1} },
    { cost:15, n:'快速进化', d:'进化速度+50%', fn:(s)=>{s._evoSpeedMult=(s._evoSpeedMult||1)+0.5} },
    { cost:20, n:'效率基因Ⅱ', d:'初始效率+20%', fn:(s)=>{s.gEff+=0.2} },
    // --- 第二轮 (25~50) 战略优势 ---
    { cost:25, n:'科研捷径', d:'所有科技研发时间-30%', fn:(s)=>{s._techTimeMult=(s._techTimeMult||1)*0.7} },
    { cost:30, n:'高级起步', d:'初始带简易提取器+1', fn:(s)=>{
      for(let i=0;i<s.grid.length;i++){if(!s.grid[i]){s.grid[i]={type:'simpleExtractor'};break;}}
    }},
    { cost:35, n:'氮源储备', d:'初始氮源+30，蛋白质+15', fn:(s)=>{s.res.nitrogen=(s.res.nitrogen||0)+30;s.res.protein=(s.res.protein||0)+15} },
    { cost:50, n:'资源倍增', d:'所有产出×1.5', fn:(s)=>{s._prodMult=(s._prodMult||1)*1.5} },
    // --- 第三轮 (60~120) 转生独享 ---
    { cost:60, n:'核心扩容', d:'帝国核心供给上限+2', fn:(s)=>{s._coreBonus=(s._coreBonus||0)+2} },
    { cost:75, n:'双倍经验', d:'进化效率奖励翻倍', fn:(s)=>{s._evoBoostMult=(s._evoBoostMult||1)*2} },
    { cost:90, n:'传送带大师', d:'传送带效率+50%', fn:(s)=>{s._beltBonus=(s._beltBonus||0)+0.5} },
    { cost:100, n:'造价折扣', d:'所有建筑造价-20%', fn:(s)=>{s._costDiscount=(s._costDiscount||0)+0.2} },
    { cost:120, n:'终极基因', d:'初始效率+50% + 进化速度×2', fn:(s)=>{s.gEff+=0.5;s._evoSpeedMult=(s._evoSpeedMult||1)*2} },
  ],

  // ===== 无限循环加成 — 13项买完后的永续追求 =====
  // 每次购买成本递增，效果递增（但边际递减），永远买不完
  infiniteBonuses: [
    {
      id: 'inf_prod',
      n: '产能强化',
      icon: '📈',
      baseCost: 80,
      costScale: 1.35,       // 每级成本 ×1.35
      d: lv => `所有产出 +${(lv * 8)}% (当前Lv.${lv})`,
      fn: (s, lv) => { s._prodMult = (s._prodMult || 1) * (1 + lv * 0.08); },
    },
    {
      id: 'inf_eff',
      n: '基因优化',
      icon: '🧬',
      baseCost: 100,
      costScale: 1.4,
      d: lv => `初始效率 +${(lv * 6)}% (当前Lv.${lv})`,
      fn: (s, lv) => { s.gEff += lv * 0.06; },
    },
    {
      id: 'inf_cost',
      n: '资源回收',
      icon: '♻️',
      baseCost: 90,
      costScale: 1.35,
      d: lv => `建造费用 -${Math.min(lv * 4, 40)}% (当前Lv.${lv})`,
      fn: (s, lv) => { s._costDiscount = (s._costDiscount || 0) + Math.min(lv * 0.04, 0.4); },
    },
    {
      id: 'inf_pop',
      n: '种群扩容',
      icon: '🦠',
      baseCost: 70,
      costScale: 1.3,
      d: lv => `种群上限 +${lv * 80} (当前Lv.${lv})`,
      fn: (s, lv) => { s._popCapBonus = (s._popCapBonus || 0) + lv * 80; },
    },
    {
      id: 'inf_belt',
      n: '物流精通',
      icon: '🔗',
      baseCost: 85,
      costScale: 1.35,
      d: lv => `传送带效率 +${(lv * 12)}% (当前Lv.${lv})`,
      fn: (s, lv) => { s._beltBonus = (s._beltBonus || 0) + lv * 0.12; },
    },
    {
      id: 'inf_port',
      n: '管线工程学',
      icon: '🔀',
      baseCost: 95,
      costScale: 1.4,
      d: lv => `随机1种建筑 +${lv} 输出端口 (当前Lv.${lv}，每种上限+2)`,
      fn: (s, lv) => { s._presPortExpand = lv; },
    },
  ],

  // 计算无限加成当前等级的成本
  getInfCost(inf, lv) {
    return Math.ceil(inf.baseCost * Math.pow(inf.costScale, lv));
  },

  // ===== 转生次数被动奖励 — 每次转生都变得更强 =====
  // 这些效果自动应用，无需花费进化因子
  passiveBonuses: [
    { count: 1,  n: '轮回者', d: '初始效率 +5%', fn: s => { s.gEff += 0.05; } },
    { count: 2,  n: '二度归来', d: '初始资源 +30%', fn: s => { s.res.glucose *= 1.3; s.res.energy *= 1.3; } },
    { count: 3,  n: '三生万物', d: '全局产出 +10%', fn: s => { s._prodMult = (s._prodMult || 1) * 1.1; } },
    { count: 5,  n: '五行轮转', d: '建造费用 -10%', fn: s => { s._costDiscount = (s._costDiscount || 0) + 0.1; } },
    { count: 7,  n: '七星连珠', d: '进化速度 +30%', fn: s => { s._evoSpeedMult = (s._evoSpeedMult || 1) + 0.3; } },
    { count: 10, n: '十世宿慧', d: '初始效率 +15% + 产出 +15%', fn: s => { s.gEff += 0.15; s._prodMult = (s._prodMult || 1) * 1.15; } },
    { count: 15, n: '超越轮回', d: '科研时间 -20% + 种群上限 +200', fn: s => { s._techTimeMult = (s._techTimeMult || 1) * 0.8; s._popCapBonus = (s._popCapBonus || 0) + 200; } },
    { count: 20, n: '永恒之灵', d: '全局效率 +25% + 产出 +25%', fn: s => { s.gEff += 0.25; s._prodMult = (s._prodMult || 1) * 1.25; } },
  ],
  // 每次转生的通用加成（叠乘）
  prestigeCountBonus(count) {
    // 每次转生: 全局效率 +2%（递减到 +0.5%），叠加上限 50%
    return Math.min(count * Math.max(0.02 - count * 0.001, 0.005), 0.5);
  },
};

// ===== v3.0 §8: 转生变体规则 =====
const PRESTIGE_VARIANTS = [
  {
    id: 'purist', name: '纯粹主义', icon: '🔥', color: '#ef4444',
    desc: '禁止传送带 — 完全依赖邻接布局',
    scoreBonus: 2.5,  // 进化因子倍率
    rules: { noBelts: true },
    hint: '你能仅靠邻接加成通关吗？极端布局挑战。',
  },
  {
    id: 'energyCrisis', name: '能量危机', icon: '⚡', color: '#f59e0b',
    desc: 'ATP产出-30% — 远距传送带维护费更痛',
    scoreBonus: 1.8,
    rules: { energyMult: 0.7 },
    hint: '紧凑布局或死！每一点能量都珍贵。',
  },
  {
    id: 'minimalist', name: '极简主义', icon: '🔬', color: '#8b5cf6',
    desc: '建筑上限8座 — 每条传送带都珍贵',
    scoreBonus: 2.0,
    rules: { maxBuildings: 8 },
    hint: '用最少的建筑通关，每个格子都是战略决策。',
  },
  {
    id: 'chaos', name: '混沌培养皿', icon: '🎲', color: '#ec4899',
    desc: '新建筑随机放置 — 中继节点成为救命稻草',
    scoreBonus: 1.5,
    rules: { randomPlacement: true },
    hint: '无法控制建筑位置，拥抱混沌！',
  },
  {
    id: 'speedrun', name: '竞速试炼', icon: '⏱️', color: '#06b6d4',
    desc: '15分钟时限 — 超时后效率持续下降',
    scoreBonus: 2.2,
    rules: { timeLimit: 900 }, // 秒
    hint: '争分夺秒！15分钟后效率每分钟-5%。',
  },
  {
    id: 'toxic', name: '毒素蔓延', icon: '☠️', color: '#84cc16',
    desc: '每60秒随机一种资源-10% — 适应或灭亡',
    scoreBonus: 1.6,
    rules: { toxicDecay: true, toxicInterval: 60 },
    hint: '资源会自然衰减，保持多元化生产。',
  },
];

// ===== v3.0 §8: 转生里程碑 =====
const PRESTIGE_MILESTONES = [
  {
    count: 1, id: 'fastPrestige', name: '🚀 快速转生', icon: '🚀', color: '#22c55e',
    desc: 'P4即可转生 — 不必每次都推到P5',
    unlockDesc: 'P4快速转生已解锁！老练的菌主可以跳过奇观阶段加速循环。',
  },
  {
    count: 2, id: 'turbo', name: '⚡ 超频模式', icon: '⚡', color: '#facc15',
    desc: '解锁4×加速 — 快进到下一个决策点',
    unlockDesc: '4×超频加速已解锁！在右上角切换速度档位。',
  },
  {
    count: 3, id: 'blueprint', name: '🗺️ 布局蓝图', icon: '🗺️', color: '#3b82f6',
    desc: '保存/加载传送带布局 — 快速重建物流网络',
    unlockDesc: '传送带蓝图系统解锁！可保存/加载物流布局。',
  },
  {
    count: 5, id: 'catalyst', name: '🧪 催化剂', icon: '🧪', color: '#f97316',
    desc: '消耗品系统 — 含物流催化(传送带效率+30%持续120秒)',
    unlockDesc: '催化剂系统解锁！可使用消耗品临时增强效果。',
  },
  {
    count: 10, id: 'multiStrain', name: '🌐 多菌株', icon: '🌐', color: '#a855f7',
    desc: '取消科技互斥限制 — 同时研究所有分支',
    unlockDesc: '多菌株模式解锁！科技互斥限制取消。',
  },
  {
    count: 15, id: 'creative', name: '⭐ 创造模式', icon: '⭐', color: '#fbbf24',
    desc: '无限资源 — 自由测试最优物流网络',
    unlockDesc: '创造模式解锁！可以无限资源自由实验。',
  },
];

// ===== v3.0 §8.3: 催化剂消耗品系统（转生5次解锁）=====
const CATALYSTS = [
  { id:'beltBoost',  n:'物流催化', icon:'🚀', color:'#3b82f6', cost:3, duration:120, desc:'传送带效率+30%', effect:'beltEff',  value:0.30 },
  { id:'prodBoost',  n:'产出催化', icon:'📈', color:'#22c55e', cost:4, duration:90,  desc:'全局产出+25%',   effect:'prodMult', value:0.25 },
  { id:'adjBoost',   n:'邻接催化', icon:'🔗', color:'#06d6a0', cost:3, duration:60,  desc:'邻接加成+50%',   effect:'adjMult',  value:0.50 },
  { id:'portBoost',  n:'端口催化', icon:'🔌', color:'#a855f7', cost:5, duration:180, desc:'全局+1端口',     effect:'portExtra', value:1 },
  { id:'timeBoost',  n:'时间催化', icon:'⏩', color:'#eab308', cost:2, duration:120, desc:'科技研究速度×2', effect:'techSpeed', value:2 },
  { id:'luckBoost',  n:'幸运催化', icon:'🍀', color:'#84cc16', cost:3, duration:-1,  desc:'培养皿实验buff+30%', effect:'petriBuff', value:0.30 },
];

// ===== GAME STATE =====
const G = {
  res:{}, rates:{}, grid:[], gridSize:20, gridCols:20, gridRows:20,
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
  stats:{ totalBuilt:0, totalRecycled:0, totalEvo:0, totalTech:0, peakGlucose:0, peakEnergy:0, peakDna:0, peakPop:0, onlineTime:0, totalUpgrades:0 },
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
  infiniteBonusLevels: {}, // { 'inf_prod': 3, 'inf_eff': 2, ... } 无限加成等级
  _evoSpeedMult: 1,
  _prodMult: 1,
  _techTimeMult: 1,
  _coreBonus: 0,
  _beltBonus: 0,
  _costDiscount: 0,
  // v3.0 §9.2: 建筑特化
  _specializations: {},    // { idx: { id, name, icon, color, desc, effect } }
  _specCache: { extraBeltRange: 0, beltEffBonus: 0, relayDecayOverride: null, relayExtraPorts: 0, perBuilding: {} },
  // v3.0 §8: 转生变体
  _activeVariant: null,    // 当前激活的变体ID (如 'purist')
  _completedVariants: {},  // v3.0 §8.6: 已通关的变体 { purist: true, ... }
  _ratingRewardsClaimed: {}, // v1.0.2: 评级首次达成奖励 { D:true, C:true, ... }
  _variantTimer: 0,        // speedrun计时 / toxic周期计时
  _toxicTarget: null,      // toxic变体当前衰减目标资源
  // v3.0 §8: 转生里程碑
  _unlockedMilestones: {}, // { blueprint: true, catalyst: true, ... }
  _blueprints: [],         // 蓝图系统: [{ name, belts, grid_snapshot }]
  _catalysts: {},          // 催化剂: { beltBoost: endTick, prodBoost: endTick, ... } (0=未激活)
  _creativeMode: false,    // 创造模式
  // Power level system
  _foodPowerLevel: 1.0, // 1.0 = full power, 0.2 = minimum
  _powerWarningShown: false,
  // Choice event
  pendingChoice: null,
  // Population allocation system — 菌群分工
  popAlloc: { harvest: 34, research: 33, logistics: 33 }, // 百分比分配 (总和=100)
  // Petri Dish Experiment
  _petriMode: false,       // 是否在选区模式
  _petriHoverIdx: null,    // 悬停中心格
  _petriCooldown: 0,       // 冷却剩余秒数
  _petriBuff: null,        // 当前活跃 buff { id, name, icon, type, value, remaining, total, color }
  _petriCount: 0,          // 累计实验次数（用于统计/成就）
  _petriActiveZone: null,  // buff激活期间参与实验的格子索引数组
  // ★ 方案F：供给同步系统
  _syncBonuses: {},        // { gridIdx: { sync: 0~1, bonus: 0~0.25, inputs: [{res,fill}] } }
  _prevSyncState: {},      // 上一帧同步状态（用于检测阈值跨越）
  _beltCombo: 0,           // ★ 方案A：传送带连击计数
  _beltComboTimer: null,   // 传送带连击计时器
  _beltMaintCost: 0,       // v3.0 §4: 远距传送带维护费总计
  _prevExplScore: 0,       // v3.0 §2: 上一次探索度得分（用于检测变化）
  // v3.0 §1: 进化培养任务
  _evoTask: null,          // 当前活跃的培养任务 { id, type, icon, n, check, progress, max, reward, startTime }
  _evoTaskBase: null,      // 任务开始时的基线快照 { belt, adj }
  _evoEconTimer: 0,        // 经济任务秒计时器（如"维持30秒正收益"）
  _evoTaskStartTime: 0,    // 任务开始时间戳
  // v3.0 §6: P3子阶段
  _p3bUnlocked: false,     // P3b是否已解锁
  _p3bExplScore: 0,        // P3a→P3b 探索度得分（缓存）
  // ★ 方案A+C：维护费与资源竞争
  _maintenanceCost: {},    // 当前帧总维护费 { energy: X, glucose: Y, ... }
  _maintenanceOverhead: 1, // 当前管理开销倍率
  _resourceTension: {},    // 各资源供需紧张度 { energy: 0.8, glucose: 0.6, ... }
  _competitionPenalty: {},  // 各资源竞争惩罚 { energy: 0.9, glucose: 1, ... }
  _maintenanceWarningShown: false,
  _competitionWarningShown: {},
  // ★ Q1：资源收支明细（每帧更新）
  _rateBreakdown: {},      // { glucose: { prod: X, bldCons: Y, maint: Z, popFood: W, competition: V }, ... }
  // ★ Q2：传送带模式提醒
  _beltIdleTimer: null,    // 传送带模式闲置计时器
  _beltIdleSeconds: 0,     // 传送带模式闲置秒数

  // ★ Q4：变异实验室状态
  _mutLabUnlocked: false,  // 是否已解锁
  _mutSlots: [],           // 已激活的突变 [{ id:'thickWall', locked:false }, ...]
  _mutBrewing: null,       // 正在培育中 { progress:0, total:45, startTime:Date.now() } 或 null
  _mutOffers: [],          // 培育完成后的候选列表 ['thickWall','rapidDivision','geneticDrift']
  _mutHistory: [],         // 已发现的突变ID列表（图鉴用）
  _mutCategoryLock: null,  // CRISPR锁定的类别（如果有）
  _mutBrewCount: 0,        // 总培育次数（统计）
  _mutActiveEffects: {},   // 当前生效的突变效果缓存

  // v2.0: 教学系统状态flag
  _p2PortTutorialPending: false,   // P2端口教学待显示
  _p3LogisticsTutorialPending: false, // P3物流时代教学待显示
  _adjPreviewShown: false,          // 邻接预览教学已显示
  _competitionEnabled: false,       // 资源竞争系统已启用
  _competitionTutorialShown: false, // 资源竞争教学已显示
  _portFullShown: false,            // 首次端口满提示已显示
  // v2.1 §8.2: 培养皿P3+配方分散解锁
  _petriP3Unlocked: false,          // P3+配方是否已解锁（需2×生物膜反应器+菌丝运输网）

  // ===== INIT =====
  init() {
    for (let k in RES) this.res[k] = 0;
    this.res.glucose = 50; this.res.energy = 35;
    for (let k in RES) this.rates[k] = 0;
    this.grid = new Array(this.gridCols * this.gridRows).fill(null);
    for (let k in TECHS) this.techs[k] = { done:false };

    this.load();           // 先加载存档（恢复 grid 数据和 gridSize）
    this.applyPrestigeBonuses(); // 从 localStorage 恢复转生加成
    this._initPlayer();    // 初始化玩家 ID 和昵称
    this._restoreSectionStates(); // 恢复折叠状态
    this.buildUI();        // 再渲染 UI（renderGrid 会基于正确的数据）
    setPhaseColors(this.phase); // ★ Phase A 视觉叙事：初始化阶段色彩
    this.updateSectionUnlocks(); // 初始解锁检查（不触发飘字）
    this._updateSaveHint();      // 更新"不保存"提示
    this._gameReady = true;      // 标记游戏就绪（之后的解锁才触发飘字）
    this.calcOfflineEarnings();
    this.startLoop();
    this.animLoop();
    this._initResponsive();
    this._initGuideHand();       // 初始化一阶段新手小手引导

    // 初始加载迷你排行榜 (延迟 2 秒等 Supabase 就绪)
    setTimeout(() => this.refreshMiniLeaderboard(), 2000);
    // 每 60 秒自动刷新迷你排行榜
    this._leaderboardIntervalId = setInterval(() => this.refreshMiniLeaderboard(), 60000);
    // 初始加载建议列表已移除（功能已去掉）
    this._initTouchEvents();
    this.log('▸ 系统在线 — 微生物帝国启动', 's');
    this.log('▸ 起始资源: 50🟢葡萄糖 + 35⚡能量', 'ev');
    this.log('▸ 帝国核心供能上限2台 — 建造「碳源采集器」开始吧！', '');
    if (this.phase < 3) this.log('⚠ 阶段3前进度不保存，达到物流阶段后自动开启存档', 'w');

    // 首次进入时显示开场引导（介绍游戏目标和阶段路线）
    this._checkShowIntro();

    // 非首次进入 + 阶段<3: 帮助按钮持续脉冲提醒
    if (localStorage.getItem('bioIntroSeen') && this.phase < 3) {
      this._startHelpPulse();
    }

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

    // ===== 拖拽建造：全局事件监听 =====
    document.addEventListener('mousemove', (e) => this._buildDragMove(e.clientX, e.clientY));
    document.addEventListener('mouseup', (e) => {
      if (e.button !== 0) return;
      // 拖拽建造释放
      if (this._buildDragging) {
        this._buildDragEnd(e.clientX, e.clientY);
        return; // 拖拽建造中，不处理其他 mouseup
      }
      // 非拖拽的 mousedown → mouseup：仅清理状态，让 btn.onclick 自然触发 selectBuilding
      if (this._buildDragKey && !this._buildDragging) {
        this._buildDragKey = null;
        this._buildDragStartPos = null;
      }
    });
    document.addEventListener('touchmove', (e) => {
      if (!this._buildDragTouch || !this._buildDragKey) return;
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      this._buildDragMove(touch.clientX, touch.clientY);
      if (this._buildDragging) e.preventDefault(); // 阻止滚动
    }, { passive: false });
    document.addEventListener('touchend', (e) => {
      if (!this._buildDragTouch || !this._buildDragKey) return;
      const touch = e.changedTouches[0];
      if (this._buildDragging) {
        this._buildDragEnd(touch.clientX, touch.clientY);
      } else {
        // 非拖拽的 tap：仅清理状态，让合成 click 事件自然触发 selectBuilding
        this._buildDragKey = null;
        this._buildDragStartPos = null;
      }
      this._buildDragTouch = false;
    });

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
      else if (e.key === '3') { if (this._unlockedMilestones?.turbo) { this.spd = 4; this._syncSpeedUI(); } else { this.log('⚡ 4×加速需转生2次解锁', 'w'); } }
      // v3.0 §7.4: Tab键 — 网络总览模式
      else if (e.key === 'Tab') {
        e.preventDefault();
        this.toggleNetworkOverview();
        return;
      }
    });
  },

  // 同步速度按钮UI
  _syncSpeedUI() {
    document.getElementById('spdDisplay').textContent = this.spd + '×';
    const btn = document.getElementById('spdBtn');
    btn.classList.remove('spd-2', 'spd-4');
    if (this.spd === 2) btn.classList.add('spd-2');
    else if (this.spd === 4) btn.classList.add('spd-4');
    // v3.0: 4×未解锁时提示
    const turbo = this._unlockedMilestones?.turbo;
    btn.title = turbo ? '加速 (1×/2×/4×)' : '加速 (1×/2×) — 转生2次解锁4×';
  },

  // v3.0 §7.4: 网络总览模式 — Tab键切换
  toggleNetworkOverview() {
    if (this._networkOverviewActive) {
      this._hideNetworkOverview();
    } else {
      this._showNetworkOverview();
    }
  },

  // v3.0 §7.4: 显示网络总览模式
  _showNetworkOverview() {
    if (this._networkOverviewActive) return;
    
    this._networkOverviewActive = true;
    this._originalDisplay = document.getElementById('game').style.display;
    
    // 创建网络总览容器
    const overlay = document.createElement('div');
    overlay.id = 'networkOverviewOverlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.95); z-index: 9999;
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; color: white; font-family: 'Rajdhani', sans-serif;
      animation: fadeIn 0.3s;
    `;
    
    // 生成网络拓扑图
    const networkData = this._generateNetworkData();
    
    let html = `
      <div style="background: #1a1a2e; border: 1px solid rgba(6, 214, 160, 0.3); 
                border-radius: 12px; padding: 20px; max-width: 90vw; max-height: 90vh; 
                overflow: auto; box-shadow: 0 0 40px rgba(6, 214, 160, 0.15);">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 1.5em; margin-bottom: 8px;">🌐</div>
          <div style="font-size: 1.2em; font-weight: 700; color: #06d6a0;">物流网络总览</div>
          <div style="font-size: 0.8em; color: #94a3b8; margin-top: 4px;">
            按 Tab 键退出 • ${networkData.totalBelts}条传送带 • ${networkData.totalNodes}个建筑节点
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
    `;
    
    // 按建筑类型分组显示
    Object.entries(networkData.nodesByType).forEach(([type, nodes]) => {
      const bd = BLDS[type];
      if (!bd || nodes.length === 0) return;
      
      html += `
        <div style="background: rgba(6, 214, 160, 0.05); border: 1px solid rgba(6, 214, 160, 0.2); 
                  border-radius: 8px; padding: 12px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 1.2em;">${bd.emoji || '🏗️'}</span>
            <span style="font-weight: 700; color: #06d6a0;">${bd.n}</span>
            <span style="font-size: 0.8em; color: #94a3b8; margin-left: auto;">${nodes.length}台</span>
          </div>
          <div style="font-size: 0.8em; color: #94a3b8; margin-bottom: 8px;">
            连接: ${nodes.reduce((sum, node) => sum + (node.connections || 0), 0)}条
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${nodes.map(node => {
              const connColor = node.connections > 0 ? '#06d6a0' : '#64748b';
              return `<span style="font-size: 0.7em; padding: 2px 6px; background: ${connColor}20; 
                         border: 1px solid ${connColor}40; border-radius: 4px; color: ${connColor};">
                       ${node.connections || 0}连
                     </span>`;
            }).join('')}
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
        
        <!-- 网络统计 -->
        <div style="margin-top: 20px; padding: 12px; background: rgba(6, 214, 160, 0.05); 
                  border-radius: 8px; border: 1px solid rgba(6, 214, 160, 0.2);">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
            <div style="text-align: center;">
              <div style="font-size: 1.5em; color: #06d6a0;">${networkData.totalBelts}</div>
              <div style="font-size: 0.8em; color: #94a3b8;">总传送带数</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 1.5em; color: #f97316;">${networkData.avgConnections.toFixed(1)}</div>
              <div style="font-size: 0.8em; color: #94a3b8;">平均连接数</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 1.5em; color: #a855f7;">${networkData.maxConnections}</div>
              <div style="font-size: 0.8em; color: #94a3b8;">最大连接数</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 1.5em; color: #fbbf24;">${networkData.networkEfficiency}%</div>
              <div style="font-size: 0.8em; color: #94a3b8;">网络效率</div>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 16px; font-size: 0.8em; color: #64748b;">
          🌐 Tab键切换 • ESC键关闭 • 鼠标滚轮缩放
        </div>
      </div>
    `;
    
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    
    // 绑定ESC键关闭
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this._hideNetworkOverview();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
    
    this.log('🌐 网络总览模式已激活', 's');
  },

  // v3.0 §7.4: 生成网络数据
  _generateNetworkData() {
    const nodesByType = {};
    let totalBelts = 0;
    let totalConnections = 0;
    let maxConnections = 0;
    
    // 统计每个建筑的连接数
    this.grid.forEach((g, idx) => {
      if (!g) return;
      
      const type = g.type;
      if (!nodesByType[type]) nodesByType[type] = [];
      
      // 计算该建筑的连接数
      const connections = this._activeBelts.filter(belt => 
        belt.from === idx || belt.to === idx
      ).length;
      
      nodesByType[type].push({ idx, connections });
      totalConnections += connections;
      maxConnections = Math.max(maxConnections, connections);
    });
    
    totalBelts = this._activeBelts.length;
    const totalNodes = Object.values(nodesByType).reduce((sum, nodes) => sum + nodes.length, 0);
    const avgConnections = totalNodes > 0 ? totalConnections / totalNodes : 0;
    
    // 计算网络效率（基于端口利用率）
    let networkEfficiency = 0;
    if (totalNodes > 0) {
      let totalPortUtilization = 0;
      this.grid.forEach((g, idx) => {
        if (!g) return;
        const portDef = PORT_DEFS[g.type];
        if (!portDef) return;
        
        const connections = this._activeBelts.filter(belt => 
          belt.from === idx || belt.to === idx
        ).length;
        const maxPorts = Math.max(portDef.maxIn, portDef.maxOut);
        const utilization = maxPorts > 0 ? Math.min(connections / maxPorts, 1) : 0;
        totalPortUtilization += utilization;
      });
      networkEfficiency = Math.round((totalPortUtilization / totalNodes) * 100);
    }
    
    return {
      nodesByType,
      totalBelts,
      totalNodes,
      totalConnections,
      avgConnections,
      maxConnections,
      networkEfficiency
    };
  },

  // v3.0 §7.4: 隐藏网络总览模式
  _hideNetworkOverview() {
    if (!this._networkOverviewActive) return;
    
    this._networkOverviewActive = false;
    const overlay = document.getElementById('networkOverviewOverlay');
    if (overlay) overlay.remove();
    
    if (this._originalDisplay !== undefined) {
      document.getElementById('game').style.display = this._originalDisplay;
    }
    
    this.log('🌐 网络总览模式已关闭', 's');
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
    tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });

    // 激活对应 tab
    const activeTab = document.querySelector(`.mobile-tab[data-tab="${tab}"]`);
    if (activeTab) { activeTab.classList.add('active'); activeTab.setAttribute('aria-selected', 'true'); }

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

    // 窗口 resize 时刷新画布（网格大小固定，不再动态调整行列）
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this._resizeCanvases();
      }, 150);
    });

    // 滚动指示器 — 当网格超出可视范围时在边缘显示渐变提示
    const dishView = document.querySelector('.dish-view');
    if (dishView) {
      const dishWrap = document.querySelector('.dish-view-wrap');
      const updateScrollHints = () => {
        const el = dishView;
        const canRight = el.scrollWidth > el.clientWidth + 2;
        const canDown = el.scrollHeight > el.clientHeight + 2;
        const scrolledRight = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2;
        const scrolledDown = el.scrollTop >= el.scrollHeight - el.clientHeight - 2;
        // 旧 class 仍加在 dish-view 上（兼容其他可能的引用）
        el.classList.toggle('can-scroll-right', canRight);
        el.classList.toggle('can-scroll-down', canDown);
        el.classList.toggle('scrolled-right', scrolledRight);
        el.classList.toggle('scrolled-down', scrolledDown);
        // 新 class 加在外层 wrap 上（用于不受滚动影响的渐变提示）
        if (dishWrap) {
          dishWrap.classList.toggle('can-scroll-right', canRight);
          dishWrap.classList.toggle('can-scroll-down', canDown);
          dishWrap.classList.toggle('scrolled-right', scrolledRight);
          dishWrap.classList.toggle('scrolled-down', scrolledDown);
        }
      };
      dishView.addEventListener('scroll', updateScrollHints, { passive: true });
      // 初始化和每次渲染后也更新
      this._updateScrollHints = updateScrollHints;
      setTimeout(updateScrollHints, 200);

      // === 帝国总览：滚动时自动折叠/展开 ===
      const empireEl = document.getElementById('empireOverview');
      if (empireEl) {
        this._empireAutoCollapsed = false;   // 自动折叠标记
        this._empireAlertExpanded = false;   // 告警自动展开标记
        this._lastGuideKey = null;           // 卡住检测：上次引导步骤
        this._guideStuckTs = Date.now();     // 卡住检测：步骤开始时间
        this._guideStuckNotified = false;    // 卡住检测：是否已提醒
        this._empireUserCollapsed = empireEl.classList.contains('collapsed'); // 用户手动折叠
        const SCROLL_THRESHOLD = 30; // 向下滚动超过此值则折叠

        dishView.addEventListener('scroll', () => {
          const scrollY = dishView.scrollTop;
          if (scrollY > SCROLL_THRESHOLD) {
            // 需要折叠 — 但只在非用户手动折叠状态下操作
            if (!empireEl.classList.contains('collapsed')) {
              empireEl.classList.add('collapsed');
              this._empireAutoCollapsed = true;
            }
          } else {
            // 回到顶部 — 只恢复自动折叠的，用户手动折叠的不管
            if (this._empireAutoCollapsed && !this._empireUserCollapsed) {
              empireEl.classList.remove('collapsed');
              this._empireAutoCollapsed = false;
            }
          }
        }, { passive: true });
      }
    }
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
    'chroniclePopup',
    'achvHallOverlay', 'comboPopup', 'achievePopup',
    'introPopup', 'resetPopup', 'choicePopup', 'offlinePopup',
    'upgradePopup', 'beltUpgradePopup', 'recyclePopup', 'prestigePopup',
    'bldTypeSelector', 'beltTypeSelector', 'eventPopup',
    'leaderboardPopup', 'nicknamePopup'
  ],

  _showBackdrop() {
    const bd = document.getElementById('popupBackdrop');
    if (bd) bd.classList.add('show');
  },

  _hideBackdrop() {
    const bd = document.getElementById('popupBackdrop');
    if (bd) bd.classList.remove('show');
  },

  /** ARIA: 统一弹窗显示，同步 aria-hidden */
  _showPopup(idOrEl) {
    const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
    if (!el) return;
    el.classList.add('show');
    if (el.hasAttribute('aria-hidden')) el.setAttribute('aria-hidden', 'false');
  },

  /** ARIA: 统一弹窗隐藏，同步 aria-hidden */
  _hidePopup(idOrEl) {
    const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
    if (!el) return;
    el.classList.remove('show');
    if (el.hasAttribute('aria-hidden')) el.setAttribute('aria-hidden', 'true');
  },

  // 关闭最上层弹窗（ESC / 点击遮罩时调用）
  closeTopPopup() {
    // 优先检查动态插入的高z-index overlay（不在 _popupIds 中）
    const mutReplace = document.getElementById('mutReplaceOverlay');
    if (mutReplace) {
      this.mutCancelReplace();
      return;
    }
    // 按z-index从高到低检查哪个弹窗在显示
    for (const id of this._popupIds) {
      const el = document.getElementById(id);
      if (el && el.classList.contains('show')) {
        this._hidePopup(el);
        this._hideBackdrop();
        // 特定弹窗需要清理状态
        if (id === 'chroniclePopup') { /* closeChronicle已处理清理 */ }
        if (id === 'recyclePopup') this.recycleIdx = null;
        if (id === 'upgradePopup') this.upgradeIdx = null;
        if (id === 'beltUpgradePopup') { this._beltUpgradeKey = null; this._beltUpgradeKeys = null; }
        if (id === 'choicePopup') {
          if (this.pendingChoice?._isWonderEvent) {
            // 奇观建造事件被ESC/遮罩关闭时，清除暂停标志，恢复建造进度
            this._wonderEventPending = false;
            this.log('⚠️ 建造事件已跳过，奇观继续建造', 'w');
          }
          this.pendingChoice = null;
        }
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
    // 没有弹窗，取消培养皿实验模式
    if (this._petriMode) {
      this.cancelPetriMode();
    }
    // 清除框选
    if (this._selectedCells && this._selectedCells.size > 0) {
      this._clearBoxSelection();
    }
    this._hideBackdrop();
  },

  // ===== OFFLINE EARNINGS + WELCOME BACK =====
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

    const timeStr = elapsed >= 3600 ? `${Math.floor(elapsed/3600)}小时${Math.floor((elapsed%3600)/60)}分钟` :
                    elapsed >= 60 ? `${Math.floor(elapsed/60)}分钟` : `${Math.floor(elapsed)}秒`;

    // 不管有没有收益，都显示欢迎回来弹窗
    setTimeout(() => {
      this.showWelcomeBack(elapsed, timeStr, earnings, hasEarnings);
    }, 500);

    if (hasEarnings) {
      const earningStr = Object.entries(earnings).map(([k,v]) => `+${formatNum(v)}${RES[k]?.icon||k}`).join(' ');
      this.log(`🌙 离线${timeStr}，收获: ${earningStr}`, 's');
    } else {
      this.log(`🧫 菌主回来了！离开了${timeStr}`, 'i');
    }
  },

  // 情感文案池 — 根据离线时长和转生次数
  _getWelcomeGreeting(elapsedSec) {
    const pc = this.prestigeCount || 0;
    // 称呼
    const title = pc >= 15 ? '造物主' : pc >= 6 ? '资深菌主' : pc >= 1 ? '菌主' : '菌主';
    // 情感语句池（按离线时长分档）
    const pools = {
      short: [ // < 5 min
        '菌群："咦，刚才去了哪？"',
        '培养皿还热着呢。',
        '菌落：短暂离开，一切正常！',
      ],
      medium: [ // 5 min - 1 hour
        '菌落们自主运转了一会儿，效率还行！',
        '你的培养皿一切正常 🧪',
        '菌群自治委员会：运转良好。',
      ],
      long: [ // 1 - 6 hours
        '菌群自治委员会报告：一切稳定。',
        'ATP储备正常，菌落安心运作中。',
        '菌落们有条不紊地代谢着。',
      ],
      vlong: [ // 6 - 24 hours
        '培养皿安静了好久…菌群们有点想你。',
        '过夜期间，菌落代谢运转正常。',
        '菌群议会召开了好几次会…',
      ],
      epic: [ // > 24 hours
        '菌群差点要成立民主政府了。',
        '离开超过一天，菌落群情激动！',
        '好久不见！培养皿差点长出文明了。',
      ],
      legendary: [ // > 7 days
        '传说中的菌主…真的回来了？！',
        '考古级别的回归！培养皿落灰了…',
        '菌群已经开始写史书记载你的离去了。',
      ],
    };
    let pool;
    if (elapsedSec < 300) pool = pools.short;
    else if (elapsedSec < 3600) pool = pools.medium;
    else if (elapsedSec < 21600) pool = pools.long;
    else if (elapsedSec < 86400) pool = pools.vlong;
    else if (elapsedSec < 604800) pool = pools.epic;
    else pool = pools.legendary;
    const flavor = pool[Math.floor(Math.random() * pool.length)];
    return { title, flavor };
  },

  showWelcomeBack(elapsedSec, timeStr, earnings, hasEarnings) {
    const pop = document.getElementById('offlinePopup');
    if (!pop) return;

    const { title, flavor } = this._getWelcomeGreeting(elapsedSec);

    // — 标题区 —
    const titleEl = document.getElementById('welcomeTitle');
    if (titleEl) titleEl.textContent = `欢迎${title}回来！`;
    const flavorEl = document.getElementById('welcomeFlavor');
    if (flavorEl) flavorEl.textContent = flavor;

    // — 离线时间 —
    const timeEl = document.getElementById('offlineTime');
    if (timeEl) timeEl.textContent = `离开了 ${timeStr}`;

    // — 状态快报 —
    const statusEl = document.getElementById('welcomeStatus');
    if (statusEl) {
      const techDone = Object.values(this.techs).filter(t => t.done).length;
      const techTotal = Object.keys(this.techs).length;
      const worldStr = this.prestigeCount > 0 ? `♻️ 第${this.prestigeCount + 1}世` : '🌱 初始世界';
      statusEl.innerHTML = `<div class="wb-status-grid">
        <span>🏗️ 建筑 ${this.totalBuildings()}座</span>
        <span>🧬 阶段 P${this.phase}</span>
        <span>🔬 科技 ${techDone}/${techTotal}</span>
        <span>${worldStr}</span>
      </div>`;
    }

    // — 离线收益 —
    const earningsSection = document.getElementById('welcomeEarningsSection');
    const detailEl = document.getElementById('offlineDetail');
    if (hasEarnings && earningsSection && detailEl) {
      earningsSection.style.display = '';
      let html = '';
      for (let k in earnings) {
        html += `<div class="wb-earning-row">
          <span style="color:var(--dim)">${RES[k]?.icon||''} ${RES[k]?.n||k}</span>
          <span style="color:var(--green);font-weight:700;font-family:'Orbitron',monospace">+${formatNum(earnings[k])}</span>
        </div>`;
      }
      detailEl.innerHTML = html;
    } else if (earningsSection) {
      earningsSection.style.display = 'none';
    }

    this._showPopup(pop);
    if (hasEarnings) {
      SFX.bigReward();
      this.screenShake(5);
    } else {
      SFX.click?.();
    }
    // 安全网：根据内容量调整自动关闭时间
    const autoClose = hasEarnings ? 10000 : 6000;
    this._welcomeTimer = setTimeout(() => this.closeOffline(), autoClose);
  },

  closeOffline() {
    clearTimeout(this._welcomeTimer);
    this._hidePopup('offlinePopup');
  },

  // ===== INTRO / WELCOME =====
  showIntro() {
    const pop = document.getElementById('introPopup');
    if (!pop) return;
    this._showPopup(pop);
    this._showBackdrop();
    SFX.milestone();
    // 初始化 tab 切换（仅绑定一次）
    if (!this._introTabsBound) {
      const tabs = document.getElementById('introTabs');
      if (tabs) {
        tabs.addEventListener('click', (e) => {
          const tab = e.target.closest('.intro-tab');
          if (!tab) return;
          const page = tab.dataset.introPage;
          if (!page) return;
          tabs.querySelectorAll('.intro-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
          tab.classList.add('active');
          tab.setAttribute('aria-selected', 'true');
          pop.querySelectorAll('.intro-page').forEach(p => p.classList.remove('active'));
          const target = pop.querySelector(`.intro-page[data-page="${page}"]`);
          if (target) target.classList.add('active');
          SFX.click();
        });
      }
      this._introTabsBound = true;
    }
  },

  closeIntro() {
    this._hidePopup('introPopup');
    this._hideBackdrop();
    localStorage.setItem('bioIntroSeen', '1');
    // 首次关闭开场弹窗后，触发音频初始化
    SFX.initOnInteraction();
    SFX.updateBGMPhase(this.phase);
    // 启动帮助按钮脉冲（阶段 < 3 时持续闪动）
    this._startHelpPulse();
  },

  // 帮助按钮脉冲控制：阶段 1-2 持续闪动，进入阶段 3 自动停止
  _startHelpPulse() {
    const btn = document.getElementById('helpBtn');
    if (!btn || this.phase >= 3) return;
    btn.classList.add('help-pulse');
  },
  _stopHelpPulse() {
    const btn = document.getElementById('helpBtn');
    if (btn) btn.classList.remove('help-pulse');
  },

  // 检查是否需要显示开场引导（仅首次进入）
  _checkShowIntro() {
    const seen = localStorage.getItem('bioIntroSeen');
    if (!seen) {
      // 延迟一点让页面渲染完再弹
      setTimeout(() => this.showIntro(), 600);
    }
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
    const coreKeys = new Set(['glucose', 'energy', 'dna']);
    for (let k in RES) {
      const r = RES[k];
      const card = document.createElement('div');
      card.className = 'res-card';
      if (coreKeys.has(k)) { card.classList.add('res-core'); card.dataset.res = k; }
      card.id = 'res-' + k;
      if (r.phase > this.phase) card.classList.add('hidden');
      card.innerHTML = `
        <div class="res-flash" id="resFlash-${k}" style="background:${r.c}15"></div>
        <div style="display:flex;align-items:center;gap:3px">
          <span class="res-icon">${r.icon}</span>
          <span class="res-name">${r.n}</span>
        </div>
        <div style="display:flex;align-items:baseline;gap:4px;margin-top:1px">
          <div class="res-val" id="resVal-${k}">0</div>
          <div class="res-rate" id="resRate-${k}"></div>
        </div>
      `;
      // ★ Q1：资源卡片悬停显示收支明细
      const resKey = k;
      card.addEventListener('mouseenter', (e) => {
        this._showResBreakdown(resKey, e);
      });
      card.addEventListener('mousemove', (e) => {
        const tt = document.getElementById('resBreakdownTip');
        if (tt && tt.classList.contains('show')) {
          tt.style.left = Math.min(e.clientX + 14, window.innerWidth - 260) + 'px';
          tt.style.top = Math.min(e.clientY + 14, window.innerHeight - 200) + 'px';
        }
      });
      card.addEventListener('mouseleave', () => {
        const tt = document.getElementById('resBreakdownTip');
        if (tt) tt.classList.remove('show');
      });
      grid.appendChild(card);
    }
    if (typeof GameTooltip !== 'undefined') GameTooltip.scheduleScan();
  },

  // ★ Q1：资源收支明细 tooltip
  _showResBreakdown(resKey, e) {
    const bd = this._rateBreakdown?.[resKey];
    if (!bd) return;
    const r = RES[resKey];
    if (!r) return;
    const net = this.rates[resKey] || 0;
    // 构建明细行
    const lines = [];
    // 产出（含物流加成）
    const totalProd = bd.prod + bd.logistics;
    if (totalProd > 0.01) {
      lines.push(`<div class="rb-row rb-pos"><span class="rb-label">🏭 建筑产出</span><span class="rb-val">${formatRate(bd.prod)}</span></div>`);
      if (bd.logistics > 0.01) {
        lines.push(`<div class="rb-row rb-pos rb-sub"><span class="rb-label">　🔗 物流加成</span><span class="rb-val">${formatRate(bd.logistics)}</span></div>`);
      }
    }
    // 建筑消耗
    if (bd.bldCons > 0.01) {
      lines.push(`<div class="rb-row rb-neg"><span class="rb-label">⚙️ 建筑消耗</span><span class="rb-val">${formatRate(-bd.bldCons)}</span></div>`);
    }
    // 维护费
    if (bd.maint > 0.01) {
      lines.push(`<div class="rb-row rb-neg"><span class="rb-label">🔧 维护费</span><span class="rb-val">${formatRate(-bd.maint)}</span></div>`);
    }
    // 种群食物消耗
    if (bd.popFood > 0.001) {
      lines.push(`<div class="rb-row rb-neg"><span class="rb-label">🦠 种群消耗</span><span class="rb-val">${formatRate(-bd.popFood)}</span></div>`);
    }
    // 竞争惩罚
    if (bd.competition > 0.01) {
      lines.push(`<div class="rb-row rb-warn"><span class="rb-label">⚖️ 竞争损耗</span><span class="rb-val">${formatRate(-bd.competition)}</span></div>`);
    }
    // 如果完全没有数据
    if (lines.length === 0) {
      lines.push(`<div class="rb-row" style="color:var(--dim)">暂无收支数据</div>`);
    }
    // 净值
    const netColor = net > 0.01 ? 'var(--green)' : net < -0.01 ? 'var(--red)' : 'var(--dim)';
    const netSign = net > 0 ? '+' : '';
    const netStr = `<div class="rb-net" style="color:${netColor}"><span>净值</span><span>${formatRate(net)}</span></div>`;

    let tt = document.getElementById('resBreakdownTip');
    if (!tt) {
      tt = document.createElement('div');
      tt.id = 'resBreakdownTip';
      tt.className = 'res-breakdown-tip';
      document.body.appendChild(tt);
    }
    tt.innerHTML = `<div class="rb-title">${r.icon} ${r.n} 收支明细</div><div class="rb-sep"></div>${lines.join('')}<div class="rb-sep"></div>${netStr}`;
    tt.classList.add('show');
    tt.style.left = Math.min(e.clientX + 14, window.innerWidth - 260) + 'px';
    tt.style.top = Math.min(e.clientY + 14, window.innerHeight - 200) + 'px';
  },

  // === Buildings ===
  renderBuildings() {
    this._buildBtnCacheDirty = true; // P1-2: 重建时标记缓存失效
    const list = document.getElementById('buildList');
    list.innerHTML = '';
    let _lastPhase = 0;      // 用于追踪阶段分隔
    let _p2bDividerShown = false; // P2b分隔符是否已插入
    let _p3aDividerShown = false; // P3a分隔符
    let _p3bDividerShown = false; // P3b分隔符
    for (let key in BLDS) {
      const b = BLDS[key];
      if (b.phase > this.phase) continue;

      // ★ 改进1：P2子阶段视觉分隔
      if (this.phase >= 2 && b.phase === 2) {
        // P2a标题（首次遇到P2建筑时插入）
        if (_lastPhase < 2) {
          const p2aHeader = document.createElement('div');
          p2aHeader.className = 'phase-sub-header';
          p2aHeader.innerHTML = '<span class="phase-sub-icon">💨</span> P2a · 代谢基础';
          p2aHeader.style.cssText = 'font-size:0.78em;color:var(--blue);padding:6px 8px 2px;opacity:0.85;font-weight:600;letter-spacing:0.5px;border-top:1px solid rgba(59,130,246,0.15);margin-top:4px';
          list.appendChild(p2aHeader);
        }
        // P2b分隔符（在第一个需要basicMetab的P2建筑前插入）
        if (b.techReq === 'basicMetab' && !_p2bDividerShown) {
          _p2bDividerShown = true;
          const p2bHeader = document.createElement('div');
          p2bHeader.className = 'phase-sub-header';
          const isP2bUnlocked = this.techs.basicMetab?.done;
          p2bHeader.innerHTML = `<span class="phase-sub-icon">🧬</span> P2b · 代谢进阶 ${isP2bUnlocked ? '<span style="color:var(--green);font-size:0.85em">✓ 已解锁</span>' : '<span style="color:var(--orange);font-size:0.85em">🔒 需研究基础代谢学</span>'}`;
          p2bHeader.style.cssText = 'font-size:0.78em;color:var(--purple);padding:6px 8px 2px;opacity:0.85;font-weight:600;letter-spacing:0.5px;border-top:1px dashed rgba(168,85,247,0.25);margin-top:6px';
          list.appendChild(p2bHeader);
        }
      }

      // v3.0 §6: P3子阶段视觉分隔
      if (this.phase >= 3 && b.phase === 3) {
        // P3a标题（首次遇到P3建筑时插入）
        if (_lastPhase < 3 && !_p3aDividerShown) {
          _p3aDividerShown = true;
          const p3aHeader = document.createElement('div');
          p3aHeader.className = 'phase-sub-header';
          p3aHeader.innerHTML = '<span class="phase-sub-icon">🧫</span> P3a · 物流基础';
          p3aHeader.style.cssText = 'font-size:0.78em;color:var(--teal);padding:6px 8px 2px;opacity:0.85;font-weight:600;letter-spacing:0.5px;border-top:1px solid rgba(20,184,166,0.15);margin-top:4px';
          list.appendChild(p3aHeader);
        }
        // P3b分隔符（在第一个P3b建筑前插入）
        if (P3B_BUILDINGS.has(key) && !_p3bDividerShown) {
          _p3bDividerShown = true;
          const p3bHeader = document.createElement('div');
          p3bHeader.className = 'phase-sub-header';
          const p3bStatus = this._p3bUnlocked
            ? '<span style="color:var(--green);font-size:0.85em">✓ 已解锁</span>'
            : (() => {
                const es = this.getP3bExplorationStatus();
                return `<span style="color:var(--orange);font-size:0.85em">🔒 P3a探索度 ${es.score}/${es.required}</span>`;
              })();
          p3bHeader.innerHTML = `<span class="phase-sub-icon">📡</span> P3b · 物流进阶 ${p3bStatus}`;
          p3bHeader.style.cssText = 'font-size:0.78em;color:#60a5fa;padding:6px 8px 2px;opacity:0.85;font-weight:600;letter-spacing:0.5px;border-top:1px dashed rgba(96,165,250,0.25);margin-top:6px';
          list.appendChild(p3bHeader);
        }
      }
      _lastPhase = b.phase;

      // v3.0 §6: P3b门控 — 未解锁P3b时，P3b建筑显示锁定
      const isP3bLocked = b.phase === 3 && P3B_BUILDINGS.has(key) && !this._p3bUnlocked;
      const locked = isP3bLocked || (b.techReq && !this.techs[b.techReq]?.done);

      // 外层容器，包含建筑按钮 + 升级按钮
      const row = document.createElement('div');
      row.className = 'build-row';

      const btn = document.createElement('button');
      const canAfford = !locked && this.checkRes(this.scaledCost(key));
      btn.className = 'action-btn' + (locked ? ' locked' : '') + (!locked && !canAfford ? ' cant-afford' : '') + (this.sel === key ? ' active' : '');
      btn.dataset.b = key;

      // 动态递增造价
      const actualCost = this.scaledCost(key);
      const costStr = Object.entries(actualCost).map(([k,v]) => `${formatNum(v)} ${RES[k]?.icon||k}`).join(' + ');
      const count = this.bldCount(key);
      const countTag = count > 0 ? `<span style="font-size:0.85em;color:var(--cyan);font-weight:700;margin-left:6px">×${count}</span>` : '';

      let tagHTML = '';
      if (b.isWonder) tagHTML = '<span class="act-tag" style="color:var(--purple);border:1px solid var(--purple);background:rgba(168,85,247,0.15)">奇观</span>';
      else if (b.tier) tagHTML = `<span class="act-tag" style="color:${b.color}80;border:1px solid ${b.color}30;background:${b.color}08;font-size:0.65em">T${b.tier}</span>`;

      // G2: 简化建造按钮 — 描述和核心供能信息移到tooltip
      const tooltipDesc = b.d + (b.corePowered ? ` | 🏠 核心供能上限: ${(CORE_COLONY[this.phase]||CORE_COLONY[1]).maxCollectors}台` : '');
      // 提取主产出简写（取 prod 的第一个资源）
      const mainProd = Object.entries(b.prod || {})[0];
      const prodHint = mainProd ? `+${mainProd[1]}${RES[mainProd[0]]?.icon||mainProd[0]}/s` : '';
      btn.innerHTML = `
        <div class="act-icon">${SVG[key]||''}</div>
        <div style="flex:1;min-width:0">
          <div class="act-name"><span style="margin-right:3px">${b.emoji||''}</span>${b.n}${countTag} <span class="act-cost-inline">${costStr}</span></div>
          <div class="act-prod-hint">${prodHint}</div>
        </div>
        ${tagHTML}
      `;
      btn.title = tooltipDesc + '\n' + b.ratio;
      btn.onclick = () => {
        if (isP3bLocked) {
          const es = this.getP3bExplorationStatus();
          this.showEvent('🔒 需要 P3b 物流进阶', `这个建筑需要完成P3a阶段的探索才能解锁。\n\n当前P3b探索度: ${es.score}/${es.required}\n\n继续在P3a阶段探索：建造P3a建筑、连接传送带、发现邻接规则...`, '#60a5fa');
          return;
        }
        if(!locked) this.selectBuilding(key);
      };

      // ===== 拖拽建造：从侧栏拖建筑到网格直接放置 =====
      if (!locked) {
        btn.setAttribute('draggable', 'false'); // 禁用原生拖拽，用自定义实现
        btn.addEventListener('mousedown', (e) => {
          if (e.button !== 0) return;
          this._buildDragKey = key;
          this._buildDragStartPos = { x: e.clientX, y: e.clientY };
          this._buildDragging = false;
          e.stopPropagation(); // 不要冒泡到 selectBuilding 的 click
        });
        // 移动端触摸拖拽
        btn.addEventListener('touchstart', (e) => {
          if (e.touches.length !== 1) return;
          const touch = e.touches[0];
          this._buildDragKey = key;
          this._buildDragStartPos = { x: touch.clientX, y: touch.clientY };
          this._buildDragging = false;
          this._buildDragTouch = true;
        }, { passive: true });
      }

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
      const avgEff = count > 0 ? grp.keys.reduce((s, k) => s + this.getBeltEfficiency(k), 0) / count : 0;
      const effPct = Math.round(avgEff * 100);
      const allMax = minLv >= 5;
      return { ...grp, count, minLv, effPct, allMax };
    });
  },

  // 弹框：选择传送带类型进行升级（快速升级版）
  showBeltTypeSelector() {
    const groups = this._getBeltGroups();
    if (groups.length === 0) {
      this.log('暂无传送带可升级', 'w');
      return;
    }

    this._renderBeltTypeList(groups);
    document.getElementById('beltTypeSelector').classList.add('show');
  },

  // 内部：渲染传送带类型列表（可被快速升级后重复调用刷新）
  _renderBeltTypeList(groups) {
    const listEl = document.getElementById('beltTypeList');
    if (!listEl) return;
    listEl.innerHTML = '';

    let totalUpgradable = 0;
    const totalCostAll = {};

    groups.forEach((grp, grpIdx) => {
      const item = document.createElement('div');
      item.className = 'belt-type-item' + (grp.allMax ? ' maxed' : '');
      item.setAttribute('data-grp', grpIdx);

      const effColor = grp.effPct >= 100 ? 'var(--cyan)' : grp.effPct >= 70 ? 'var(--yellow)' : 'var(--orange)';
      const lvColor = grp.allMax ? 'var(--purple)' : grp.minLv >= 3 ? 'var(--cyan)' : grp.minLv >= 2 ? 'var(--yellow)' : 'var(--orange)';
      const resIcons = grp.icons.join('');
      const countTag = grp.count > 1 ? ` <span class="belt-type-count" style="color:var(--color-muted)">×${grp.count}</span>` : '';

      // 计算该组升1级的费用
      let grpCostStr = '';
      if (!grp.allMax) {
        const upgradeable = grp.keys.filter(k => this.getBeltLevel(k) < 5);
        const minLv = Math.min(...upgradeable.map(k => this.getBeltLevel(k)));
        const toUp = upgradeable.filter(k => this.getBeltLevel(k) === minLv);
        const unitCost = this.getBeltUpgradeCost(toUp[0]);
        if (unitCost) {
          const grpCost = {};
          for (let r in unitCost) grpCost[r] = unitCost[r] * toUp.length;
          grpCostStr = Object.entries(grpCost).map(([k,v]) => `${formatNum(v)}${RES[k]?.icon||k}`).join('+');
          totalUpgradable += toUp.length;
          for (let r in grpCost) totalCostAll[r] = (totalCostAll[r] || 0) + grpCost[r];
        }
      }

      item.innerHTML = `
        <div style="flex:1;min-width:0">
          <div class="belt-type-route">${resIcons} ${grp.fromName} → ${grp.toName}${countTag}</div>
          <div class="belt-type-meta">
            <span class="belt-type-lv" style="color:${lvColor}">Lv.${grp.minLv}${grp.allMax ? ' ★' : ''}</span>
            <span class="belt-type-eff" style="color:${effColor}">效率 ${grp.effPct}%</span>
            ${!grp.allMax && grpCostStr ? `<span style="color:var(--yellow);font-size:0.9em">${grpCostStr}</span>` : ''}
          </div>
        </div>
        ${grp.allMax ? '<span class="bld-type-arrow" style="color:var(--purple)">✦</span>' :
          `<button class="bld-quick-up-btn belt-quick-up" style="border-color:#f97316;color:#f97316;background:rgba(249,115,22,0.15)" title="快速升级">⬆</button>`}
      `;

      if (!grp.allMax) {
        const upBtn = item.querySelector('.belt-quick-up');
        if (upBtn) {
          upBtn.onclick = (e) => {
            e.stopPropagation();
            this._quickUpgradeBeltGroup(grp.keys, grp.fromName, grp.toName);
          };
        }
        item.onclick = () => {
          this._quickUpgradeBeltGroup(grp.keys, grp.fromName, grp.toName);
        };
      }
      listEl.appendChild(item);
    });

    // ====== 底部按钮 ======
    const allBtn = document.getElementById('beltUpgradeAllBtn');
    const maxBtn = document.getElementById('beltUpgradeMaxBtn');
    if (allBtn) {
      if (totalUpgradable >= 1) {
        const costStr = Object.entries(totalCostAll).map(([k,v]) => `${formatNum(v)}${RES[k]?.icon||k}`).join('+');
        const canAfford = this.checkRes(totalCostAll);
        allBtn.style.display = '';
        allBtn.disabled = !canAfford;
        allBtn.style.opacity = canAfford ? '1' : '0.4';
        document.getElementById('beltUpgradeAllCost').textContent = `(${costStr})`;
      } else {
        allBtn.style.display = 'none';
      }
    }
    if (maxBtn) {
      const maxCost = this._calcBeltUpgradeToMaxCost(groups);
      if (maxCost && totalUpgradable >= 1) {
        const costStr = Object.entries(maxCost).map(([k,v]) => `${formatNum(v)}${RES[k]?.icon||k}`).join('+');
        const canAfford = this.checkRes(maxCost);
        maxBtn.style.display = '';
        maxBtn.disabled = !canAfford;
        maxBtn.style.opacity = canAfford ? '1' : '0.4';
        document.getElementById('beltUpgradeMaxCost').textContent = `(${costStr})`;
      } else {
        maxBtn.style.display = 'none';
      }
    }
  },

  // 计算将所有传送带升到 Lv5 的总费用
  _calcBeltUpgradeToMaxCost(groups) {
    const totalCost = {};
    let hasAny = false;
    const beltCosts = {
      1: { energy: 8, glucose: 5 },
      2: { energy: 20, glucose: 12 },
      3: { energy: 40, glucose: 20, dna: 3 },
      4: { energy: 70, glucose: 35, dna: 10 },
    };
    for (const grp of groups) {
      for (const key of grp.keys) {
        let lv = this.getBeltLevel(key);
        if (lv >= 5) continue;
        while (lv < 5) {
          const cost = beltCosts[lv];
          if (cost) {
            for (let r in cost) totalCost[r] = (totalCost[r] || 0) + cost[r];
          }
          lv++;
          hasAny = true;
        }
      }
    }
    return hasAny ? totalCost : null;
  },

  // 快速升级传送带组（无确认弹窗）
  _quickUpgradeBeltGroup(keys, fromName, toName) {
    const upgradeable = keys.filter(k => this.getBeltLevel(k) < 5);
    if (upgradeable.length === 0) {
      this.log('该类型传送带已全部满级', 'w');
      return;
    }
    // 取最低等级统一升级
    const minLv = Math.min(...upgradeable.map(k => this.getBeltLevel(k)));
    const toUpgrade = upgradeable.filter(k => this.getBeltLevel(k) === minLv);
    const unitCost = this.getBeltUpgradeCost(toUpgrade[0]);
    if (!unitCost) return;
    const totalCost = {};
    for (let r in unitCost) totalCost[r] = unitCost[r] * toUpgrade.length;

    if (!this.checkRes(totalCost)) {
      this.log('资源不足，无法升级传送带', 'e');
      SFX.buildFail();
      return;
    }

    this.spend(totalCost);
    for (const k of toUpgrade) {
      this.beltLevels[k] = (this.beltLevels[k] || 1) + 1;
    }
    const newLv = minLv + 1;

    // 连击
    this._upgradeCombo = (this._upgradeCombo || 0) + toUpgrade.length;
    clearTimeout(this._upgradeComboTimer);
    this._upgradeComboTimer = setTimeout(() => { this._upgradeCombo = 0; }, 2000);

    const effStr = Math.round(this.getBeltEfficiency(toUpgrade[0]) * 100);
    const label = toUpgrade.length > 1 ? `⛓ ${fromName}→${toName} ×${toUpgrade.length}` : `⛓ ${fromName}→${toName}`;
    this.log(`⬆ ${label} → Lv.${newLv} 效率${effStr}%`, 's');
    SFX.coreUpgrade();
    this.screenShake(4);

    if (this._upgradeCombo >= 3) {
      this.showGoldenFloat(`⬆×${this._upgradeCombo} COMBO!`);
    }

    // 刷新列表
    this._chainsDirty = true;
    const groups = this._getBeltGroups();
    this._renderBeltTypeList(groups);
    this.updateRates();
    this.updateUI();
    this.updateBeltUpgradeBtn();

    // 全部满级提示
    const allMax = groups.every(g => g.allMax);
    if (allMax) {
      this.showGoldenFloat('🌟 全部传送带满级！');
    }
  },

  // 全部传送带升1级
  upgradeAllBelts() {
    const groups = this._getBeltGroups();
    let totalUpgraded = 0;

    for (const grp of groups) {
      if (grp.allMax) continue;
      const upgradeable = grp.keys.filter(k => this.getBeltLevel(k) < 5);
      const minLv = Math.min(...upgradeable.map(k => this.getBeltLevel(k)));
      const toUpgrade = upgradeable.filter(k => this.getBeltLevel(k) === minLv);
      const unitCost = this.getBeltUpgradeCost(toUpgrade[0]);
      if (!unitCost) continue;
      const totalCost = {};
      for (let r in unitCost) totalCost[r] = unitCost[r] * toUpgrade.length;
      if (!this.checkRes(totalCost)) continue;
      this.spend(totalCost);
      for (const k of toUpgrade) {
        this.beltLevels[k] = (this.beltLevels[k] || 1) + 1;
      }
      totalUpgraded += toUpgrade.length;
    }

    if (totalUpgraded > 0) {
      this.log(`⬆ 批量升级传送带 ×${totalUpgraded}`, 's');
      SFX.coreUpgrade();
      this.screenShake(6);
      this.showGoldenFloat(`⬆ 传送带 ×${totalUpgraded} 升级！`);
      this._chainsDirty = true;
      const newGroups = this._getBeltGroups();
      this._renderBeltTypeList(newGroups);
      this.updateRates();
      this.updateUI();
      this.updateBeltUpgradeBtn();
    } else {
      this.log('资源不足，无法升级', 'e');
      SFX.buildFail();
    }
  },

  // 全部传送带升满
  upgradeAllBeltsToMax() {
    const groups = this._getBeltGroups();
    const maxCost = this._calcBeltUpgradeToMaxCost(groups);
    if (!maxCost || !this.checkRes(maxCost)) {
      this.log('资源不足，无法全部升满', 'e');
      SFX.buildFail();
      return;
    }

    let totalUpgrades = 0;
    for (const grp of groups) {
      for (const key of grp.keys) {
        while (this.getBeltLevel(key) < 5) {
          const cost = this.getBeltUpgradeCost(key);
          if (!cost || !this.checkRes(cost)) break;
          this.spend(cost);
          this.beltLevels[key] = (this.beltLevels[key] || 1) + 1;
          totalUpgrades++;
        }
      }
    }

    if (totalUpgrades > 0) {
      this.log(`🌟 全部传送带批量升级 ×${totalUpgrades} — 满级！`, 's');
      SFX.coreUpgrade();
      this.screenShake(8);
      this.showGoldenFloat(`🌟 传送带 ×${totalUpgrades} 全部升满！`);
      this._chainsDirty = true;
      const newGroups = this._getBeltGroups();
      this._renderBeltTypeList(newGroups);
      this.updateRates();
      this.updateUI();
      this.updateBeltUpgradeBtn();
    }
  },

  closeBeltTypeSelector() {
    this._hidePopup('beltTypeSelector');
  },

  // 弹框：选择建筑实例进行升级（快速升级版 — 点击直接升级，无需确认弹窗）
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

    this._upgradeAllKey = buildingKey; // 记住当前建筑类型，供一键升级使用

    this._renderBldTypeList(buildingKey, bd, instances);

    this._showPopup('bldTypeSelector');
    SFX.click();
  },

  // 内部：渲染建筑类型列表（可被快速升级后重复调用刷新）
  _renderBldTypeList(buildingKey, bd, instances) {
    const listEl = document.getElementById('bldTypeList');
    if (!listEl) return;
    listEl.innerHTML = '';

    // 统计可升级数量和总费用
    let upgradableCount = 0;
    const totalCost = {};

    // 计算每个实例的序号（同类型内的顺序号）
    instances.forEach((idx, seqIdx) => {
      const lv = this.buildingLevels[idx] || 1;
      const isMax = lv >= 5;
      const cost = this.getUpgradeCost(idx);
      const costStr = cost ? Object.entries(cost).map(([k,v]) => `${formatNum(v)}${RES[k]?.icon||k}`).join('+') : '';
      const mult = this.getUpgradeMultiplier(idx).toFixed(1);
      const nextMult = isMax ? mult : (1 + lv * 0.4).toFixed(1);

      // 累计可升级数量和总费用
      if (!isMax && cost) {
        upgradableCount++;
        for (let k in cost) totalCost[k] = (totalCost[k] || 0) + cost[k];
      }

      const item = document.createElement('div');
      item.className = 'bld-type-item' + (isMax ? ' maxed' : '');
      item.setAttribute('data-idx', idx);

      const lvColor = isMax ? 'var(--purple)' : lv >= 3 ? 'var(--cyan)' : lv >= 2 ? 'var(--yellow)' : 'var(--color-info)';
      const row = Math.floor(idx / this.gridSize) + 1;
      const col = idx % this.gridSize + 1;
      const canAffordThis = cost && this.checkRes(cost);

      item.innerHTML = `
        <span class="bld-type-seq">#${seqIdx + 1}</span>
        <span class="bld-type-emoji">${bd.emoji || '🔧'}</span>
        <div class="bld-type-info">
          <div class="bld-type-name">${bd.n} <span style="color:var(--color-muted-dark);font-size:0.85em">(${row},${col})</span></div>
          <div class="bld-type-meta">
            <span class="bld-type-lv" style="color:${lvColor}">${isMax ? '★MAX' : 'Lv.' + lv}</span>
            <span class="bld-type-mult" style="color:var(--color-info)">${mult}x${isMax ? '' : '→' + nextMult + 'x'}</span>
            ${!isMax ? `<span class="bld-type-cost">${costStr}</span>` : ''}
          </div>
        </div>
        ${isMax ? '<span class="bld-type-arrow" style="color:var(--purple)">✦</span>' :
          `<button class="bld-quick-up-btn${canAffordThis ? '' : ' disabled'}" data-up-idx="${idx}" title="${canAffordThis ? '点击升级' : '资源不足'}">⬆</button>`}
      `;

      // 快速升级：点击按钮直接升级该建筑（无确认弹窗）
      if (!isMax) {
        const upBtn = item.querySelector('.bld-quick-up-btn');
        if (upBtn) {
          upBtn.onclick = (e) => {
            e.stopPropagation();
            this._quickUpgradeBuilding(idx, buildingKey);
          };
        }
        // 点击整行也可以升级
        item.onclick = () => {
          this._quickUpgradeBuilding(idx, buildingKey);
        };
      }
      listEl.appendChild(item);
    });

    // ====== 底部按钮区域 ======
    const upgradeAllBtn = document.getElementById('upgradeAllBtn');
    const upgradeMaxBtn = document.getElementById('upgradeMaxBtn');
    if (upgradeAllBtn) {
      if (upgradableCount >= 1) {
        // 「全部升1级」按钮 — 显示每个升1级的总费用
        const costStr = Object.entries(totalCost).map(([k,v]) => `${formatNum(v)}${RES[k]?.icon||k}`).join('+');
        const canAfford = this.checkRes(totalCost);
        upgradeAllBtn.style.display = '';
        upgradeAllBtn.disabled = !canAfford;
        upgradeAllBtn.style.opacity = canAfford ? '1' : '0.4';
        document.getElementById('upgradeAllCost').textContent = `(${costStr})`;
      } else {
        upgradeAllBtn.style.display = 'none';
      }
    }
    if (upgradeMaxBtn) {
      // 「全部升满」按钮 — 计算将所有建筑升到Lv5的总费用
      const maxCost = this._calcUpgradeToMaxCost(buildingKey, instances);
      if (maxCost && upgradableCount >= 1) {
        const costStr = Object.entries(maxCost).map(([k,v]) => `${formatNum(v)}${RES[k]?.icon||k}`).join('+');
        const canAfford = this.checkRes(maxCost);
        upgradeMaxBtn.style.display = '';
        upgradeMaxBtn.disabled = !canAfford;
        upgradeMaxBtn.style.opacity = canAfford ? '1' : '0.4';
        document.getElementById('upgradeMaxCost').textContent = `(${costStr})`;
      } else {
        upgradeMaxBtn.style.display = 'none';
      }
    }
  },

  // 计算将所有建筑升到 Lv5 的总费用
  _calcUpgradeToMaxCost(buildingKey, instances) {
    const totalCost = {};
    let hasAny = false;
    for (const idx of instances) {
      let lv = this.buildingLevels[idx] || 1;
      if (lv >= 5) continue;
      const g = this.grid[idx];
      if (!g) continue;
      const bd = BLDS[g.type];
      if (!bd) continue;
      while (lv < 5) {
        for (let k in bd.cost) {
          const c = Math.ceil(bd.cost[k] * Math.pow(1.8, lv));
          totalCost[k] = (totalCost[k] || 0) + c;
        }
        lv++;
        hasAny = true;
      }
    }
    return hasAny ? totalCost : null;
  },

  // 快速升级单个建筑（无确认弹窗，直接在列表中升级并刷新）
  _quickUpgradeBuilding(idx, buildingKey) {
    const cost = this.getUpgradeCost(idx);
    if (!cost || !this.checkRes(cost)) {
      this.log('资源不足，无法升级', 'e');
      SFX.buildFail();
      return;
    }

    this.spend(cost);
    this.buildingLevels[idx] = (this.buildingLevels[idx] || 1) + 1;
    const lv = this.buildingLevels[idx];
    const bd = BLDS[this.grid[idx].type];
    this.stats.totalUpgrades = (this.stats.totalUpgrades || 0) + 1;

    // 连击计数
    this._upgradeCombo = (this._upgradeCombo || 0) + 1;
    clearTimeout(this._upgradeComboTimer);
    this._upgradeComboTimer = setTimeout(() => { this._upgradeCombo = 0; }, 2000);

    // 反馈：日志 + 音效 + 粒子 + 震屏
    const combo = this._upgradeCombo;
    if (combo >= 3) {
      this.log(`⬆×${combo} ${bd.n} → Lv.${lv}  产出×${formatNum(this.getUpgradeMultiplier(idx), 1)}`, 's');
    } else {
      this.log(`⬆ ${bd.n} → Lv.${lv}  产出×${formatNum(this.getUpgradeMultiplier(idx), 1)}`, 's');
    }
    SFX.coreUpgrade();
    this.buildBurst(idx);
    this.screenShake(Math.min(3 + combo, 8));

    // 连击飘字
    if (combo >= 2) {
      this.showGoldenFloat(`⬆×${combo} COMBO!`);
    }

    // 刷新列表（保持弹窗打开状态）
    const instances = [];
    this.grid.forEach((g, i) => {
      if (g && g.type === buildingKey) instances.push(i);
    });
    this._renderBldTypeList(buildingKey, bd, instances);

    // 高亮刚升级的那一行
    const updatedItem = document.querySelector(`.bld-type-item[data-idx="${idx}"]`);
    if (updatedItem) {
      updatedItem.classList.add('just-upgraded');
      setTimeout(() => updatedItem.classList.remove('just-upgraded'), 600);
    }

    this.refreshAll();

    // v3.0 §9.2: 升级到Lv3时触发特化选择
    if (lv === 3 && SPECIALIZATIONS[buildingKey] && !this._specializations?.[idx]) {
      setTimeout(() => this._showSpecializationChoice(idx, buildingKey), 300);
    }

    // 如果全部满级了，显示完成提示
    const allMax = instances.every(i => (this.buildingLevels[i] || 1) >= 5);
    if (allMax) {
      this.showGoldenFloat(`🌟 ${bd.n} 全部满级！`);
    }
  },

  // ===== v3.0 §9.2: 建筑Lv3特化系统 =====
  _showSpecializationChoice(idx, bldType) {
    const spec = SPECIALIZATIONS[bldType];
    if (!spec) return;
    if (!this._specializations) this._specializations = {};
    if (this._specializations[idx]) return; // 已特化

    const bd = BLDS[bldType];
    const overlay = document.createElement('div');
    overlay.id = 'specChoiceOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.88);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.3s';

    let html = `<div style="background:#1a1a2e;border:1px solid #fbbf2440;border-radius:10px;padding:20px;max-width:360px;width:90%;box-shadow:0 0 30px rgba(251,191,36,0.15)">`;
    html += `<div style="text-align:center;margin-bottom:12px">`;
    html += `<div style="font-size:1.5em">${bd.emoji}</div>`;
    html += `<div style="font-size:1em;font-weight:700;color:#fbbf24;margin-top:4px">${spec.name} — Lv.3 特化</div>`;
    html += `<div style="font-size:0.75em;color:#94a3b8;margin-top:4px">选择一条永久特化路线（不可更改）</div>`;
    html += `</div>`;

    html += `<div style="display:flex;flex-direction:column;gap:8px">`;
    for (let i = 0; i < spec.options.length; i++) {
      const opt = spec.options[i];
      html += `<button class="spec-choice-btn" data-idx="${i}" style="
        background:linear-gradient(135deg, ${opt.color}15, ${opt.color}08);
        border:1px solid ${opt.color}40;
        border-radius:8px;
        padding:12px;
        cursor:pointer;
        text-align:left;
        transition:all 0.2s;
        color:#e2e8f0;
      " onmouseover="this.style.borderColor='${opt.color}';this.style.boxShadow='0 0 12px ${opt.color}30'"
         onmouseout="this.style.borderColor='${opt.color}40';this.style.boxShadow='none'">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span style="font-size:1.2em">${opt.icon}</span>
          <span style="font-weight:700;color:${opt.color};font-size:0.9em">${opt.name}</span>
        </div>
        <div style="font-size:0.75em;color:#94a3b8;line-height:1.4">${opt.desc}</div>
      </button>`;
    }
    html += `</div>`;
    html += `</div>`;

    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    // 绑定选择事件
    overlay.querySelectorAll('.spec-choice-btn').forEach(btn => {
      btn.onclick = () => {
        const optIdx = parseInt(btn.dataset.idx);
        const chosen = spec.options[optIdx];
        this._applySpecialization(idx, bldType, chosen);
        overlay.remove();
      };
    });
  },

  _applySpecialization(idx, bldType, option) {
    if (!this._specializations) this._specializations = {};
    this._specializations[idx] = {
      type: bldType,
      id: option.id,
      name: option.name,
      icon: option.icon,
      color: option.color,
      desc: option.desc,
      effect: option.effect,
    };

    // 即时反馈
    const bd = BLDS[bldType];
    this.log(`⭐ ${bd.n} 特化为 ${option.icon} ${option.name} — ${option.desc}`, 's');
    this.showEvent(
      `⭐ ${option.icon} ${option.name}`,
      `${bd.emoji} ${bd.n} 已永久特化！\n\n${option.desc}\n\n💡 此选择不可更改，同类建筑可以选择不同特化。`,
      option.color
    );
    SFX.milestone();
    this.buildBurst(idx);
    this.screenShake(5);

    // 重新计算特化效果缓存
    this._recalcSpecEffects();
    this.refreshAll({ buildings: false });
  },

  // 重新计算所有特化效果的聚合缓存
  _recalcSpecEffects() {
    const specs = this._specializations || {};
    // 聚合效果
    let extraBeltRange = 0;       // transport_range: +N格
    let beltEffBonus = 0;         // transport_speed: +N%
    let relayDecayOverride = null; // relay_amp: 衰减覆盖
    let relayExtraPorts = 0;      // relay_hub: 额外端口
    // 逐建筑效果存储在 _specPerBuilding
    const perBuilding = {};

    for (const idxStr in specs) {
      const s = specs[idxStr];
      const idx = parseInt(idxStr);
      const eff = s.effect;
      if (!eff) continue;

      switch (eff.type) {
        case 'beltRange':
          extraBeltRange += eff.value;
          break;
        case 'beltEfficiency':
          beltEffBonus += eff.value;
          break;
        case 'adjBonus':
          if (!perBuilding[idx]) perBuilding[idx] = {};
          perBuilding[idx].adjBonusMult = 1 + eff.value;
          break;
        case 'extraOutPort':
          if (!perBuilding[idx]) perBuilding[idx] = {};
          perBuilding[idx].extraOutPort = eff.value;
          break;
        case 'relayDecay':
          relayDecayOverride = eff.value;
          break;
        case 'extraPorts':
          if (!perBuilding[idx]) perBuilding[idx] = {};
          perBuilding[idx].extraPorts = eff.value;
          break;
      }
    }

    this._specCache = {
      extraBeltRange,
      beltEffBonus,
      relayDecayOverride,
      relayExtraPorts,
      perBuilding,
    };
  },

  // 获取建筑的特化信息（用于tooltip等）
  getSpecialization(idx) {
    return this._specializations?.[idx] || null;
  },

  // 全部升到满级（逐级升，带动画序列）
  upgradeAllToMax() {
    const buildingKey = this._upgradeAllKey;
    if (!buildingKey) return;
    const bd = BLDS[buildingKey];

    const instances = [];
    this.grid.forEach((g, i) => {
      if (g && g.type === buildingKey) instances.push(i);
    });

    // 计算总费用并检查
    const maxCost = this._calcUpgradeToMaxCost(buildingKey, instances);
    if (!maxCost || !this.checkRes(maxCost)) {
      this.log('资源不足，无法全部升满', 'e');
      SFX.buildFail();
      return;
    }

    // 逐级执行升级，收集升级日志
    let totalUpgrades = 0;
    for (const idx of instances) {
      while ((this.buildingLevels[idx] || 1) < 5) {
        const cost = this.getUpgradeCost(idx);
        if (!cost || !this.checkRes(cost)) break;
        this.spend(cost);
        this.buildingLevels[idx] = (this.buildingLevels[idx] || 1) + 1;
        totalUpgrades++;
        this.buildBurst(idx);
      }
    }

    if (totalUpgrades > 0) {
      this.stats.totalUpgrades = (this.stats.totalUpgrades || 0) + totalUpgrades;
      this.log(`🌟 ${bd.n} 批量升级 ×${totalUpgrades} — 全部满级！`, 's');
      SFX.coreUpgrade();
      this.screenShake(8);
      this.showGoldenFloat(`🌟 ${bd.n} ×${totalUpgrades} 全部升满！`);

      // 刷新列表
      this._renderBldTypeList(buildingKey, bd, instances);
      this.refreshAll();
    }
  },

  closeBldTypeSelector() {
    this._hidePopup('bldTypeSelector');
  },

  // === Techs (树状图版本) ===
  renderTechs() {
    const section = document.getElementById('techSection');
    const list = document.getElementById('techList');
    list.innerHTML = '';

    // v3.0 §8.4: 多菌株模式标识
    if (this._multiStrainUnlocked) {
      const badge = document.createElement('div');
      badge.style.cssText = 'text-align:center;padding:6px 10px;margin-bottom:8px;background:linear-gradient(135deg,rgba(34,197,94,0.12),rgba(34,197,94,0.04));border:1px solid rgba(34,197,94,0.25);border-radius:8px;font-size:0.78em;color:#22c55e;font-weight:600';
      badge.textContent = '🌐 多菌株模式 — 无互斥限制';
      list.appendChild(badge);
    }

    // 按阶段组织科技树数据
    const phaseMap = {}; // { phase: { trunk: key, branches: [keyA, keyB] } }
    for (const key in TECHS) {
      const t = TECHS[key];
      const p = t.phase;
      if (!phaseMap[p]) phaseMap[p] = { trunk: null, branches: [] };
      if (t.exclusive) {
        phaseMap[p].branches.push(key);
      } else {
        phaseMap[p].trunk = key;
      }
    }

    const phases = Object.keys(phaseMap).map(Number).sort((a, b) => a - b);
    let hasVisible = false;

    // 辅助：创建科技节点 DOM
    const mkNode = (key) => {
      const t = TECHS[key];
      const reqs = t.req || [];
      const locked = reqs.some(r => !this.techs[r]?.done);
      const done = this.techs[key]?.done;
      const isResearching = this.rTech === key;

      // v3.0 §3: 前置条件状态
      const prereq = this.getTechPrereqStatus(key);
      const prereqLocked = prereq.hasPrereq && !prereq.met && !done;

      let exclusiveLocked = false;
      let exclusiveBy = '';
      if (t.exclusive && !this._multiStrainUnlocked) {
        for (const exKey of t.exclusive) {
          if (this.techs[exKey]?.done) { exclusiveLocked = true; exclusiveBy = TECHS[exKey].n; break; }
        }
      }

      const node = document.createElement('div');
      let cls = 'tt-node';
      if (done) cls += ' done';
      else if (exclusiveLocked) cls += ' exclusive-locked';
      else if (locked) cls += ' locked';
      else if (prereqLocked) cls += ' prereq-locked';
      if (isResearching) cls += ' researching';
      node.className = cls;
      node.id = 'tech-' + key;

      const costStr = Object.entries(t.cost).map(([k, v]) => `${formatNum(v)} ${RES[k]?.icon || k}`).join(' + ');

      let statusStr;
      if (done) {
        statusStr = '<span class="status-done">✦ 已生效</span>';
      } else if (exclusiveLocked) {
        statusStr = `<span class="status-locked">🔒 被「${exclusiveBy}」互斥</span>`;
      } else {
        statusStr = `${costStr} · ${t.time}s`;
      }

      // v3.0 §3: 前置条件显示行
      let prereqHTML = '';
      if (prereq.hasPrereq && !done && !exclusiveLocked) {
        if (prereq.met) {
          prereqHTML = `<div class="tt-prereq met">✅ ${prereq.icon} ${prereq.label}</div>`;
        } else {
          const pct = prereq.max > 0 ? Math.min(prereq.progress / prereq.max * 100, 100) : 0;
          const reducedTag = prereq.reduced ? ' <span style="color:#14b8a6;font-size:0.8em">♻️-25%</span>' : '';
          prereqHTML = `<div class="tt-prereq">🔒 ${prereq.icon} ${prereq.label} <span class="tt-prereq-prog">(${prereq.progress}/${prereq.max})</span>${reducedTag}
            <div class="tt-prereq-bar"><div class="tt-prereq-fill" style="width:${pct}%"></div></div>
          </div>`;
        }
      }

      let branchTag = '';
      if (t.exclusive && !done && !exclusiveLocked) {
        branchTag = this._multiStrainUnlocked
          ? '<span class="tt-exclusive-tag" style="background:rgba(34,197,94,0.15);color:#22c55e;border-color:rgba(34,197,94,0.3)">🌐 可同时研究</span>'
          : '<span class="tt-exclusive-tag">⚡二选一</span>';
      }

      node.innerHTML = `
        <div class="tt-name">${done ? '<span class="done-mark">✓</span>' : ''}${t.n}${branchTag}</div>
        <div class="tt-desc">${t.d} — ${t.ef}</div>
        ${prereqHTML}
        <div class="tt-cost">${statusStr}</div>
        ${isResearching ? `<div class="prog-wrap"><div class="prog-bar"><div class="prog-fill" id="techFill-${key}" style="width:0%;background:var(--cyan)"></div></div></div>` : ''}
      `;

      if (!locked && !done && !exclusiveLocked && !prereqLocked) {
        node.onclick = () => this.startResearch(key);
      } else if (prereqLocked && !locked && !exclusiveLocked) {
        // v3.0 §3: 点击前置条件锁定科技时弹出友好提示
        node.style.cursor = 'pointer';
        node.onclick = () => {
          const pq = this.getTechPrereqStatus(key);
          this.showEvent(`🔒 前置条件未满足`, `「${t.n}」需要先完成:\n\n${pq.icon} ${pq.label}\n当前: ${pq.progress}/${pq.max}\n\n${pq.reduced ? '♻️ 转生减免: 原始要求 ' + pq.baseMax + ' → ' + pq.max : '💡 满足条件后即可开始研究'}`, '#f97316');
          SFX.buildFail();
        };
      }

      return { node, done, exclusiveLocked };
    };

    // 构建科技树 DOM
    const tree = document.createElement('div');
    tree.className = 'tech-tree';

    for (let i = 0; i < phases.length; i++) {
      const p = phases[i];
      const data = phaseMap[p];
      const isFuture = p > this.phase;

      // 如果超出当前阶段：只显示下一阶段（模糊预览），更远的不显示
      if (p > this.phase + 1) continue;
      hasVisible = true;

      const phaseDiv = document.createElement('div');
      phaseDiv.className = 'tt-phase' + (isFuture ? ' future' : '');

      // 阶段间连线（非第一阶段）
      if (i > 0 && !isFuture) {
        const prevData = phaseMap[phases[i - 1]];
        const prevTrunkDone = prevData.trunk && this.techs[prevData.trunk]?.done;
        const conn = document.createElement('div');
        conn.className = 'tt-connector' + (prevTrunkDone ? ' done' : '');
        phaseDiv.appendChild(conn);
      }

      // 阶段标签
      const tag = document.createElement('div');
      tag.className = 'tt-phase-tag';
      tag.textContent = `— P${p} —`;
      phaseDiv.appendChild(tag);

      // 主干节点
      if (data.trunk) {
        const trunkWrap = document.createElement('div');
        trunkWrap.className = 'tt-trunk';
        const { node } = mkNode(data.trunk);
        trunkWrap.appendChild(node);
        phaseDiv.appendChild(trunkWrap);
      }

      // 分支节点（二选一）
      if (data.branches.length === 2 && !isFuture) {
        const trunkDone = data.trunk && this.techs[data.trunk]?.done;

        // 分叉连线
        const fork = document.createElement('div');
        fork.className = 'tt-fork' + (trunkDone ? ' done' : '');
        fork.style.height = '12px';
        phaseDiv.appendChild(fork);

        // VS 标记
        const vs = document.createElement('div');
        vs.className = 'tt-vs';
        vs.textContent = 'VS';
        fork.appendChild(vs);

        // 分支容器
        const branchesWrap = document.createElement('div');
        branchesWrap.className = 'tt-branches' + (trunkDone ? ' done' : '');

        for (const bKey of data.branches) {
          const branchDiv = document.createElement('div');
          branchDiv.className = 'tt-branch';
          const { node, done: bDone, exclusiveLocked: bExcl } = mkNode(bKey);
          if (bDone) branchDiv.classList.add('chosen');
          else if (bExcl) branchDiv.classList.add('rejected');
          branchDiv.appendChild(node);
          branchesWrap.appendChild(branchDiv);
        }

        phaseDiv.appendChild(branchesWrap);
      }

      tree.appendChild(phaseDiv);
    }

    list.appendChild(tree);
    // ★ 用空字符串让 CSS 的 display:flex 生效（而非覆盖为 block）
    section.style.display = hasVisible ? '' : 'none';
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
    const maxC = (cc.maxCollectors || 2) + (this._coreBonus || 0);
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
    // ARIA: 同步进度值
    fillEl.closest('[role="progressbar"]')?.setAttribute('aria-valuenow', Math.round(pct));

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
  // === Grid 布局 ===
  // 格子固定大小（像素），不随容器缩放 — 屏幕放不下时可滚动
  _cellPx: 80,       // 加大格子尺寸，显示更清晰（超出时靠滚动查看）
  _minCols: 8, _maxCols: 30,
  _minRows: 6, _maxRows: 30,

  _calcGridLayout() {
    // 新策略：格子大小固定，网格行列数固定为 gridCols × gridRows
    // 屏幕空间不够时靠 .dish-view 的滚动来解决（不再缩减格子数或尺寸）
    const cellSize = this._cellPx;
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

  // ===== 增量更新 renderGrid =====
  // 首次调用创建 cell DOM + 事件委托，后续调用只更新 cell 内容
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

    const totalCells = this.gridCols * this.gridRows;

    // ★ 首次渲染：创建空 cell 框架 + 事件委托
    if (!this._gridInitialized) {
      gridEl.innerHTML = '';
      for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.i = i;
        gridEl.appendChild(cell);
      }
      this._initGridDelegation(gridEl);
      this._gridInitialized = true;
    }

    // 预计算每种建筑类型的序号映射: idx → seq number (1-based)
    const seqCounters = {};
    const seqMap = {};
    for (let i = 0; i < totalCells; i++) {
      if (this.grid[i] && this.grid[i].type && BLDS[this.grid[i].type]) {
        const t = this.grid[i].type;
        if (!seqCounters[t]) seqCounters[t] = 0;
        seqCounters[t]++;
        seqMap[i] = seqCounters[t];
      }
    }

    // ★ 增量更新：只更新每个 cell 的内容
    for (let i = 0; i < totalCells; i++) {
      const cell = gridEl.children[i];
      if (!cell) continue;

      // 清除无效的格子数据（旧存档残留，含旧版核心菌落）
      if (this.grid[i] && (this.grid[i].type === '_coreColony' || !this.grid[i].type || !BLDS[this.grid[i].type])) {
        this.grid[i] = null;
      }

      // 快速脏检查：避免不必要的 DOM 操作
      const curType = this.grid[i]?.type || '';
      const curLv = this.grid[i] ? (this.buildingLevels[i] || 1) : 0;
      const curSeq = seqMap[i] || 0;
      const prevKey = cell._rkey || '';
      const newKey = curType + '|' + curLv + '|' + curSeq + '|' + (seqCounters[curType] || 0);
      if (prevKey === newKey) continue; // 无变化，跳过
      cell._rkey = newKey;

      // 重置 cell class 和内容
      // 保留 cell 和 data-i，去掉 occupied/bg-*/upgraded/max-level 等
      cell.className = 'cell';
      cell.innerHTML = '';
      cell.style.borderColor = '';
      delete cell.dataset.btype;

      if (this.grid[i]) {
        const bd = BLDS[this.grid[i].type];
        const btype = this.grid[i].type;
        cell.classList.add('occupied', bd.bg);
        const cellLv = this.buildingLevels[i] || 1;
        if (cellLv > 1) cell.classList.add('upgraded');
        // F: 升级视觉分级 — 5级体系
        if (cellLv >= 3) cell.classList.add('upgrade-lv3');
        if (cellLv >= 4) cell.classList.add('upgrade-lv4');
        if (cellLv >= 5) cell.classList.add('max-level');
        // 方案D：用建筑自身color作为边框色，让同色系建筑也有独特视觉签名
        cell.style.borderColor = bd.color + '70';

        // v2.0 §4.5: 建筑角色视觉区分
        const portDef = PORT_DEFS[btype];
        if (portDef) {
          cell.classList.add('role-' + portDef.role);
        }
        // v2.1: 休眠建筑视觉
        if (this._dormantCells[i]) {
          cell.classList.add('dormant');
          cell.style.borderColor = '';  // 清除内联色，让CSS class接管
        }
        // v2.1: 休眠状态badge（顶部灰色标签）
        const dormBadge = document.createElement('div');
        dormBadge.className = 'cell-dormant-badge';
        dormBadge.id = 'dormantBadge-' + i;
        dormBadge.textContent = '💤 休眠中';
        dormBadge.style.display = this._dormantCells[i] ? 'block' : 'none';
        cell.appendChild(dormBadge);

        // 主题色 L 型色标（左竖条 + 顶横条）
        const stripe = document.createElement('div');
        stripe.className = 'cell-stripe';
        stripe.style.background = bd.color;
        cell.appendChild(stripe);
        const stripeTop = document.createElement('div');
        stripeTop.className = 'cell-stripe-top';
        stripeTop.style.background = bd.color;
        cell.appendChild(stripeTop);

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

        // Tier等级角标 — 方案D：Lv.1默认隐藏(hover淡入)，升级后常驻
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
          tierEl.classList.add('tier-lv1');  // 方案D：标记Lv.1，CSS控制隐藏/hover显示
          tierEl.textContent = 'Lv.1';
          tierEl.style.color = 'var(--color-muted)';
          tierEl.style.borderColor = 'rgba(90,122,154,0.25)';
        }
        cell.appendChild(tierEl);

        // 序号角标（同类型多个时显示 #序号/总数，用建筑色着色）
        const typeTotal = seqCounters[btype] || 1;
        if (typeTotal > 1 || !bd.isWonder) {
          const seqEl = document.createElement('div');
          seqEl.className = 'cell-seq';
          seqEl.style.color = bd.color;
          seqEl.textContent = typeTotal > 1
            ? '#' + (seqMap[i] || 1) + '/' + typeTotal
            : '#1';
          cell.appendChild(seqEl);
        }

        // v2.0: 呼吸光环已移除（端口发光取代）

        // 工作指示灯
        const dot = document.createElement('div');
        dot.className = 'work-dot';
        dot.style.background = bd.color;
        dot.style.boxShadow = '0 0 3px ' + bd.color;
        cell.appendChild(dot);

        // 【增强】资源阻塞指示 — 需要输入资源的建筑如果没有传送带连接
        const needsInput = FLOW_TYPES_TO.has(btype);
        if (needsInput) {
          // 斜线遮罩
          const overlay = document.createElement('div');
          overlay.className = 'cell-blocked-overlay';
          overlay.id = 'blockOverlay-' + i;
          overlay.style.display = 'none';
          cell.appendChild(overlay);
          // 顶部阻塞标签
          const badge = document.createElement('div');
          badge.className = 'cell-blocked-badge';
          badge.id = 'blockBadge-' + i;
          badge.textContent = '🚫 资源阻塞';
          badge.style.display = 'none';
          cell.appendChild(badge);
        }

        // 名称标签（增强可见度）
        const label = document.createElement('div');
        label.className = 'label';
        label.textContent = bd.n;
        cell.appendChild(label);

        // 邻接加成 badge（空间协同指示器）
        const adjBadge = document.createElement('div');
        adjBadge.className = 'cell-adj-badge';
        adjBadge.id = 'adjBadge-' + i;
        adjBadge.style.display = 'none';
        cell.appendChild(adjBadge);

        // v2.0 §4 — 端口UI视觉渲染（基于PORT_DEFS，P2+才显示）
        if (this.phase >= 2 && portDef && (portDef.maxIn > 0 || portDef.maxOut > 0)) {
          const techExtra = this._extraOutPorts || 0;
          // v2.1 §9.2/§9.3: 突变+转生端口加成
          const mpb = this._mutPortBonuses?.[btype];
          const mutExtraIn = mpb ? mpb.extraIn : 0;
          const mutExtraOut = mpb ? mpb.extraOut : 0;
          const usedIn = getUsedPorts(i, 'in');
          const usedOut = getUsedPorts(i, 'out');
          // v3.0 §9.2: 特化端口加成
          const specBld = this._specCache?.perBuilding?.[i];
          const specExtraOut = (specBld?.extraOutPort || 0) + (specBld?.extraPorts || 0);
          const specExtraIn = specBld?.extraPorts || 0;
          const totalMaxIn = portDef.maxIn + mutExtraIn + specExtraIn;
          const totalMaxOut = portDef.maxOut + techExtra + mutExtraOut + specExtraOut;

          // 输入端口（左侧半圆形）
          if (totalMaxIn > 0) {
            const inGroup = document.createElement('div');
            inGroup.className = 'port-group in';
            for (let p = 0; p < totalMaxIn; p++) {
              const port = document.createElement('div');
              const isLinked = p < usedIn;
              port.className = 'port in' + (isLinked ? ' linked' : ' idle');
              if (isLinked) {
                port.style.setProperty('--port-color', bd.color);
              }
              inGroup.appendChild(port);
            }
            cell.appendChild(inGroup);
          }

          // 输出端口（右侧箭头形）
          if (totalMaxOut > 0) {
            const outGroup = document.createElement('div');
            outGroup.className = 'port-group out';
            for (let p = 0; p < totalMaxOut; p++) {
              const port = document.createElement('div');
              const isLinked = p < usedOut;
              port.className = 'port out' + (isLinked ? ' linked' : ' idle');
              if (isLinked) {
                port.style.setProperty('--port-color', bd.color);
              }
              outGroup.appendChild(port);
            }
            cell.appendChild(outGroup);
          }

          // 端口全满标记
          if (usedIn >= totalMaxIn && usedOut >= totalMaxOut) {
            cell.classList.add('ports-full');
          }
        }

        // v2.0 §10.3 — 已触发邻接加成指示器
        const adjResult = this.getAdjacencyBonus(i);
        if (adjResult.details.length > 0) {
          const indicator = document.createElement('div');
          indicator.className = 'cell-adj-indicator';
          const count = adjResult.details.length;
          if (count >= 5) {
            indicator.textContent = '★';
            indicator.style.color = '#facc15';
          } else if (count >= 3) {
            indicator.textContent = '●●';
            indicator.style.color = '#22c55e';
          } else {
            indicator.textContent = '●';
            indicator.style.color = '#22c55e';
          }
          indicator.title = '📐 邻接加成 (' + count + '条): ' + adjResult.details.map(d => d.icon + d.name + ' +' + Math.round(d.bonus*100) + '%').join(', ') + ' | 总计: +' + Math.round(adjResult.bonus*100) + '%';
          cell.appendChild(indicator);
        }

        // Hover tooltip数据
        cell.dataset.btype = btype;
      }
    }
    // 渲染完毕后刷新滚动指示器
    if (this._updateScrollHints) setTimeout(this._updateScrollHints, 50);
    // 恢复培养皿实验高亮（renderGrid会重置className，需重新应用）
    if (this._petriActiveZone && this._petriBuff) {
      for (const idx of this._petriActiveZone) {
        const c = gridEl.children[idx];
        if (c && this.grid[idx]) {
          c.classList.add('petri-active');
          c.style.setProperty('--petri-color', this._petriBuff.color || '#14b8a6');
        }
      }
    }
  },

  // ===== 事件委托：统一在 gridEl 上监听，通过 dataset.i 获取 idx =====
  _initGridDelegation(gridEl) {
    const self = this;
    // 辅助：从事件 target 找到 .cell 元素并返回 idx
    function cellIdx(e) {
      const c = e.target.closest('.cell');
      if (!c || c.dataset.i == null) return -1;
      return +c.dataset.i;
    }

    gridEl.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      const idx = cellIdx(e);
      if (idx < 0) return;
      if (self._beltConnectMode) return;
      if (self._selectedCells.size > 0 && self._selectedCells.has(idx) && self.grid[idx] && !self.sel) {
        self._multiDragStart = { x: e.clientX, y: e.clientY };
        self._isMultiDragging = false;
        e.preventDefault();
        return;
      }
      if (self._selectedCells.size > 0 && !self._selectedCells.has(idx)) {
        self._clearBoxSelection();
      }
      if (self.grid[idx] && !self.sel) {
        self._dragStartPos = { x: e.clientX, y: e.clientY };
        self._dragIdx = idx;
        self._isDragging = false;
      }
      if (!self.grid[idx] && !self.sel) {
        self._boxSelectStart = { x: e.clientX, y: e.clientY, idx: idx };
        self._boxSelectMode = false;
        e.preventDefault();
      }
    });

    gridEl.addEventListener('click', (e) => {
      const idx = cellIdx(e);
      if (idx < 0) return;
      if (self._isDragging || self._isMultiDragging || self._boxSelectMode) {
        self._isDragging = false;
        self._isMultiDragging = false;
        self._boxSelectMode = false;
        return;
      }
      self.cellClick(idx);
    });

    gridEl.addEventListener('dblclick', (e) => {
      const idx = cellIdx(e);
      if (idx < 0) return;
      if (self._isDragging || self._isMultiDragging) return;
      if (self.grid[idx]) self.showUpgradePopup(idx);
    });

    gridEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const idx = cellIdx(e);
      if (idx < 0) return;
      if (self._beltConnectMode) {
        self.cancelBeltConnect();
        self.showCursorTooltip('已取消传送带连接');
        return;
      }
      if (self._selectedCells.size > 0) {
        self._clearBoxSelection();
        self.showCursorTooltip('已取消框选');
        return;
      }
      if (self.sel) {
        self.selectBuilding(self.sel);
        self.showCursorTooltip('已取消建造');
        return;
      }
      if (self.grid[idx]) self.showBuildingContextMenu(idx, e);
    });

    gridEl.addEventListener('mouseenter', (e) => {
      const idx = cellIdx(e);
      if (idx < 0) return;
      self._hoverIdx = idx;
      // 培养皿实验模式：更新悬停区域
      if (self._petriMode) {
        self._petriHoverIdx = idx;
      }
      // 拖拽悬停高亮
      if (self._isDragging && self._dragIdx != null && self._dragIdx !== idx) {
        self._dragOverIdx = idx;
        const targetCell = e.target.closest('.cell');
        if (targetCell && !self.grid[idx]) {
          targetCell.style.boxShadow = 'inset 0 0 12px rgba(6,214,160,0.3)';
          targetCell.style.borderColor = '#06d6a0';
        } else if (targetCell && self.grid[idx]) {
          targetCell.style.boxShadow = 'inset 0 0 12px rgba(59,130,246,0.3)';
          targetCell.style.borderColor = '#3b82f6';
        }
      }
      // 多选拖拽悬停高亮
      if (self._isMultiDragging && !self._selectedCells.has(idx)) {
        self._dragOverIdx = idx;
      }
      if (!self.grid[idx]) {
        const hasAdj = self._adjPreviewData && self._adjPreviewData[idx];
        const hasSel = !!self.sel;
        if (hasAdj || hasSel) {
          const tt = document.getElementById('tooltip');
          const bld = hasSel ? BLDS[self.sel] : null;
          const bldName = bld ? `${bld.emoji||''} ${bld.n}` : (self.sel || '');
          let html = '';
          let ttTitle = '';

          // 邻接预览部分
          if (hasAdj) {
            const p = self._adjPreviewData[idx];
            html += `<span style="color:#06d6a0;font-weight:700">🔗 邻接加成预览</span> — 放置 ${bldName}`;
            const forward = p.result.bonuses.filter(b => !b.isReverse);
            if (forward.length > 0) {
              html += `<br><span style="color:#22d3ee;font-size:0.85em;margin-top:2px;display:inline-block">▼ 自身获得：+${Math.round(p.forwardPct * 100)}%</span>`;
              for (const b of forward) {
                const nType = self.grid[b.neighborIdx]?.type;
                const nBld = nType ? BLDS[nType] : null;
                const nName = nBld ? `${nBld.emoji||''} ${nBld.n}` : '?';
                html += `<br><span style="color:#06d6a080;font-size:0.85em">  ${b.rule.icon} ${b.rule.name} +${Math.round(b.bonus * 100)}% ← ${nName}</span>`;
              }
            }
            const reverse = p.result.bonuses.filter(b => b.isReverse);
            if (reverse.length > 0) {
              html += `<br><span style="color:#fbbf24;font-size:0.85em;margin-top:2px;display:inline-block">▼ 邻居受益：+${Math.round(p.reversePct * 100)}%</span>`;
              for (const b of reverse) {
                const nType = self.grid[b.neighborIdx]?.type;
                const nBld = nType ? BLDS[nType] : null;
                const nName = nBld ? `${nBld.emoji||''} ${nBld.n}` : '?';
                html += `<br><span style="color:#fbbf2480;font-size:0.85em">  ${b.rule.icon} ${b.rule.name} +${Math.round(b.bonus * 100)}% → ${nName}</span>`;
              }
            }
            html += `<br><span style="color:#fff;font-weight:700;font-size:0.9em;margin-top:3px;display:inline-block">∑ 综合加成：+${Math.round(p.totalPct * 100)}%</span>`;
            ttTitle = `🔗 邻接分数：<span style="color:#06d6a0;font-weight:700">+${Math.round(p.totalPct * 100)}%</span>`;
          }

          // v2.1: 资源冲击预览部分
          if (hasSel) {
            const impact = self._calcBuildImpact(self.sel, idx);
            html += self._renderBuildImpactHTML(impact);
            if (!ttTitle) ttTitle = `📊 ${bldName} — 建造预览`;
          }

          document.getElementById('ttName').innerHTML = ttTitle;
          document.getElementById('ttDesc').innerHTML = html;
          tt.classList.add('show');
          tt.style.left = Math.min(e.clientX + 12, window.innerWidth - 280) + 'px';
          tt.style.top = Math.min(e.clientY + 12, window.innerHeight - 100) + 'px';
        }
        return;
      }
      if (self._isDragging || self._isMultiDragging) return;
      const bd = BLDS[self.grid[idx].type];
      if (!bd) return;
      const tt = document.getElementById('tooltip');
      const lvl = self.buildingLevels[idx] || 1;
      const lvlStr = lvl >= 5 ? ' <span style="color:var(--color-max)">★MAX</span>' : ` <span style="color:var(--color-upgrade)">Lv.${lvl}</span>`;
      const multStr = lvl > 1 ? `<br><span style="color:var(--color-upgrade)">产出倍率: ${formatNum(self.getUpgradeMultiplier(idx), 1)}x</span>` : '';
      const beltMult = self.getBeltMultiplierForBuilding(idx);
      let capInfo = '';
      if (bd.cons && Object.keys(bd.cons).length > 0 && FLOW_TYPES_TO.has(bd.key || self.grid[idx]?.type)) {
        const belts = self._activeBelts || [];
        let totalCap = 0;
        const selfType = self.grid[idx]?.type;
        for (const belt of belts) {
          if (belt.ti !== idx && belt.fi !== idx) continue;
          const otherIdx = belt.fi === idx ? belt.ti : belt.fi;
          const otherG = self.grid[otherIdx];
          if (!otherG) continue;
          if (FLOW_PAIR.has(otherG.type + '|' + selfType)) {
            const key = Math.min(belt.fi, belt.ti) + '-' + Math.max(belt.fi, belt.ti);
            totalCap += self.getBeltCapacity(key);
          }
        }
        const bldM = self.getUpgradeMultiplier(idx);
        let demand = 0;
        for (const k in bd.cons) demand += bd.cons[k] * bldM;
        if (demand > 0 && totalCap > 0) {
          const ratio = Math.min(100, Math.round(totalCap / demand * 100));
          const capColor = ratio >= 100 ? 'var(--cyan)' : ratio >= 60 ? 'var(--yellow)' : 'var(--orange)';
          capInfo = ` <span style="color:${capColor};font-size:0.85em">📦${formatNum(totalCap, 1)}/${formatNum(demand, 1)} (${ratio}%)</span>`;
        }
      }
      const beltStr = beltMult === 0 ? `<br><span style="color:#ef4444;font-weight:700">🚫 资源阻塞 — 需要传送带连接输入资源！</span>` : beltMult < 1 ? `<br><span style="color:var(--orange)">⚠ 传送带效率: ${Math.round(beltMult*100)}%${capInfo} — 升级传送带或增加并行管线</span>` : (beltMult > 1 ? `<br><span style="color:var(--cyan)">✦ 传送带加成: ${Math.round(beltMult*100)}%${capInfo}</span>` : (capInfo ? `<br><span style="color:var(--color-info)">⛓ 传送带${capInfo}</span>` : ''));
      let rateStr = '';
      if (bd.isBoost) {
        rateStr = `<br><span style="color:${bd.color}">✦ 增益: +12%</span>`;
      } else if (bd.isWonder && self.wonderComplete) {
        rateStr = `<br><span style="color:${bd.color}">✦ 运行中</span>`;
      } else if (!bd.isWonder) {
        const coreConfig = CORE_COLONY[self.phase] || CORE_COLONY[1];
        const maxC = (coreConfig.maxCollectors || 2) + (self._coreBonus || 0);
        if (bd.corePowered) {
          let seq = 0;
          for (let ci = 0; ci <= idx; ci++) {
            if (self.grid[ci] && BLDS[self.grid[ci].type]?.corePowered) seq++;
          }
          if (seq > maxC) {
            rateStr = `<br><span style="color:var(--red)">⚠ 闲置（核心供能上限 ${maxC}）</span>`;
          }
        }
        const prodEntries = Object.entries(bd.prod || {});
        if (prodEntries.length > 0 && !rateStr.includes('闲置')) {
          const bldMult = self.getUpgradeMultiplier(idx);
          const hPop = Math.min(self.pop, self._popCap()) * (self.popAlloc.harvest / 100);
          const popMult = 1 + hPop * BALANCE.popHarvestBonus * (self._popEffMult || 1);
          const _gProdMult = self._prodMult || 1;
          const mult = self.gEff * popMult * (self.lEff || 1) * bldMult * beltMult * _gProdMult;
          const prodParts = prodEntries.map(([res, base]) => {
            const actual = base * mult;
            return `<span style="color:${RES[res]?.c || bd.color}">+${formatNum(actual, 1)} ${RES[res]?.icon||''} ${RES[res]?.n||res}/s</span>`;
          });
          rateStr = `<br>${prodParts.join('  ')}`;
        }
        const consEntries = Object.entries(bd.cons || {});
        if (consEntries.length > 0 && !rateStr.includes('闲置')) {
          const bldMult = self.getUpgradeMultiplier(idx);
          const hPop = Math.min(self.pop, self._popCap()) * (self.popAlloc.harvest / 100);
          const popMult = 1 + hPop * BALANCE.popHarvestBonus * (self._popEffMult || 1);
          const mult = self.gEff * popMult * (self.lEff || 1) * bldMult * beltMult;
          const consParts = consEntries.map(([res, base]) => {
            const actual = base * mult;
            return `<span style="color:${RES[res]?.c || '#f97316'}">-${formatNum(actual, 1)} ${RES[res]?.icon||''} ${RES[res]?.n||res}/s</span>`;
          });
          rateStr += `<br>${consParts.join('  ')}`;
        }
      }
      let adjStr = '';
      const adjResult = self.getAdjacencyBonus(idx);
      if (adjResult.bonus > 0) {
        adjStr = `<br><span style="color:#06d6a0;font-weight:700">🔗 邻接加成: +${Math.round(adjResult.bonus * 100)}%</span>`;
        adjResult.details.forEach(d => {
          adjStr += `<br><span style="color:#06d6a080;font-size:0.85em">  ${d.icon} ${d.name} +${Math.round(d.bonus * 100)}%${d.count > 1 ? ' ×'+d.count : ''}</span>`;
        });
      }
      // ★ 教学：供给同步充裕度信息（P3+多输入建筑）
      let syncStr = '';
      if (self.phase >= 3) {
        const syncInfo = self._syncBonuses[idx];
        if (syncInfo && syncInfo.inputCount >= 2) {
          const syncPct = Math.round(syncInfo.sync * 100);
          const bonusPct = Math.round(syncInfo.bonus * 100);
          const syncColor = syncPct >= 85 ? '#fbbf24' : syncPct >= 50 ? '#22c55e' : syncPct >= 30 ? 'var(--yellow)' : 'var(--orange)';
          syncStr = `<br><span style="color:${syncColor};font-weight:700">🔄 供给同步: ${syncPct}%${bonusPct > 0 ? ` → +${bonusPct}%产出` : ''}</span>`;
          // 每条输入的充裕度柱状条
          if (syncInfo.inputs && syncInfo.inputs.length > 0) {
            syncInfo.inputs.forEach(inp => {
              const fillPct = Math.round(inp.fill * 100);
              const barColor = fillPct >= 85 ? '#22c55e' : fillPct >= 50 ? '#fbbf24' : '#f97316';
              const barW = Math.max(fillPct, 5);
              syncStr += `<br><span style="font-size:0.85em;color:var(--dim)">  ${RES[inp.res]?.icon||'📦'} ${RES[inp.res]?.n||inp.res}: </span><span style="display:inline-block;width:60px;height:8px;background:#333;border-radius:3px;vertical-align:middle;overflow:hidden"><span style="display:inline-block;width:${barW}%;height:100%;background:${barColor};border-radius:3px"></span></span><span style="font-size:0.85em;color:${barColor}"> ${fillPct}%</span>`;
            });
          }
        }
      }
      // ★ 方案A+C：维护费与资源竞争tooltip信息
      let econStr = '';
      if (self.phase >= 2) {
        const bd2 = BLDS[self.grid[idx]?.type];
        if (bd2 && !MAINTENANCE.exempt.includes(self.grid[idx]?.type) && !bd2.isBoost) {
          const tier = bd2.phase || 1;
          const baseMaint = MAINTENANCE.baseCost[tier];
          if (baseMaint && Object.keys(baseMaint).length > 0) {
            const bldLv = self.buildingLevels[idx] || 1;
            const lvMult = 1 + (bldLv - 1) * BALANCE.maintLevelMult;
            const oh = self._maintenanceOverhead || 1;
            const parts = [];
            for (let mk in baseMaint) {
              const cost = baseMaint[mk] * oh * lvMult;
              parts.push(`-${formatNum(cost, 2)}${RES[mk]?.icon||mk}`);
            }
            const ohPct = Math.round((oh - 1) * 100);
            econStr = `<br><span style="color:#f97316;font-size:0.9em">🔧 维护: ${parts.join(' ')}/s${ohPct > 0 ? ` <span style="color:#ef4444">(+${ohPct}%管理开销)</span>` : ''}</span>`;
            // v2.0: 端口效率折扣显示
            const portDisc = getPortEfficiencyDiscount(idx);
            if (portDisc < 1.0) {
              const discPct = Math.round((1 - portDisc) * 100);
              econStr += `<br><span style="color:#22c55e;font-size:0.9em">🔀 端口效率折扣: -${discPct}% 维护费</span>`;
            }
          }
        }
      }
      // v2.0: 端口信息显示
      let portStr = '';
      const gridType = self.grid[idx]?.type;
      if (gridType && PORT_DEFS[gridType]) {
        const portDef = PORT_DEFS[gridType];
        const usedIn = getUsedPorts(idx, 'in');
        const usedOut = getUsedPorts(idx, 'out');
        const techExtra = self._extraOutPorts || 0;
        // v2.1 §9.2/§9.3: 突变+转生端口加成
        const mpb = self._mutPortBonuses?.[gridType];
        const mutExtraIn = mpb ? mpb.extraIn : 0;
        const mutExtraOut = mpb ? mpb.extraOut : 0;
        // v3.0 §9.2: 特化端口加成
        const specBld2 = self._specCache?.perBuilding?.[idx];
        const specExtraOut2 = (specBld2?.extraOutPort || 0) + (specBld2?.extraPorts || 0);
        const specExtraIn2 = specBld2?.extraPorts || 0;
        const maxInEff = portDef.maxIn + mutExtraIn + specExtraIn2;
        const maxOutEff = portDef.maxOut + techExtra + mutExtraOut + specExtraOut2;
        const freeIn = maxInEff - usedIn;
        const freeOut = maxOutEff - usedOut;
        const portColor = (freeIn === 0 && freeOut === 0) ? '#facc15' : (freeIn > 0 || freeOut > 0) ? '#06d6a0' : '#888';
        portStr = `<br><span style="color:${portColor};font-size:0.9em">📥 输入: ${usedIn}/${maxInEff}${freeIn > 0 ? ` (空闲${freeIn})` : ''} 📤 输出: ${usedOut}/${maxOutEff}${freeOut > 0 ? ` (空闲${freeOut})` : ''}</span>`;
        if (freeIn === 0 && freeOut === 0) portStr += `<br><span style="color:#facc15;font-size:0.85em">✨ 端口满载！</span>`;
      }
      // v3.0 §9.2: 特化信息
      const specInfo = self.getSpecialization(idx);
      let specStr = '';
      if (specInfo) {
        specStr = `<br><span style="color:${specInfo.color};font-size:0.9em">⭐ 特化: ${specInfo.icon} ${specInfo.name} — ${specInfo.desc}</span>`;
      } else if (SPECIALIZATIONS[self.grid[idx]?.type] && (self.buildingLevels[idx] || 1) >= 3) {
        specStr = `<br><span style="color:#94a3b8;font-size:0.85em">⭐ 可特化（需升至Lv.3后选择）</span>`;
      }
      // 资源竞争影响
      if (self.phase >= 3) {
        const penalty = self._competitionPenalty || {};
        const bd3 = BLDS[self.grid[idx]?.type];
        if (bd3 && bd3.prod) {
          for (let pk in bd3.prod) {
            if (penalty[pk] && penalty[pk] < 0.98) {
              const pPct = Math.round(penalty[pk] * 100);
              econStr += `<br><span style="color:#ef4444;font-size:0.9em">⚖️ ${RES[pk]?.icon||''}${RES[pk]?.n||pk}竞争: 产出×${pPct}%</span>`;
            }
          }
        }
      }
      document.getElementById('ttName').innerHTML = `${bd.emoji||''} ${bd.n}${lvlStr} <span style="color:${bd.color};font-size:0.85em">[T${bd.tier||1}]</span>`;
      document.getElementById('ttDesc').innerHTML = `${bd.d}${multStr}${rateStr}${beltStr}${adjStr}${syncStr}${portStr}${specStr}${econStr}<br><span style="color:var(--color-info);font-family:'Share Tech Mono',monospace">${bd.ratio}</span><br><span style="color:var(--color-muted-dark);font-size:0.85em">拖拽移动 · 双击升级 · 右键回收 · 空白拖拽框选</span>`;
      tt.classList.add('show');
      tt.style.left = Math.min(e.clientX + 12, window.innerWidth - 240) + 'px';
      tt.style.top = Math.min(e.clientY + 12, window.innerHeight - 100) + 'px';
    }, true); // useCapture for mouseenter delegation

    gridEl.addEventListener('mouseleave', (e) => {
      const idx = cellIdx(e);
      if (idx < 0) return;
      self._hoverIdx = null;
      // 培养皿实验：清除悬停
      if (self._petriMode) self._petriHoverIdx = null;
      document.getElementById('tooltip').classList.remove('show');
      if (self._isDragging) {
        const targetCell = e.target.closest('.cell');
        if (targetCell) {
          targetCell.style.boxShadow = '';
          targetCell.style.borderColor = '';
        }
        self._dragOverIdx = null;
      }
    }, true); // useCapture for mouseleave delegation

    gridEl.addEventListener('mousemove', (e) => {
      const tt = document.getElementById('tooltip');
      if (tt.classList.contains('show')) {
        tt.style.left = Math.min(e.clientX + 12, window.innerWidth - 240) + 'px';
        tt.style.top = Math.min(e.clientY + 12, window.innerHeight - 100) + 'px';
      }
      // 检测拖拽开始（移动超过5px阈值）
      if (self._dragIdx != null && !self._isDragging && self._dragStartPos) {
        const dx = e.clientX - self._dragStartPos.x;
        const dy = e.clientY - self._dragStartPos.y;
        if (Math.sqrt(dx*dx + dy*dy) > 5) {
          self._isDragging = true;
          document.getElementById('tooltip').classList.remove('show');
          self._createDragGhost(self._dragIdx, e);
          const srcCell = gridEl.children[self._dragIdx];
          if (srcCell) {
            srcCell.style.opacity = '0.4';
            srcCell.style.filter = 'grayscale(0.5)';
          }
        }
      }
      if (self._isDragging && self._dragGhost) {
        self._dragGhost.style.left = (e.clientX - 20) + 'px';
        self._dragGhost.style.top = (e.clientY - 20) + 'px';
      }
      if (self._boxSelectStart && !self._boxSelectMode) {
        const dx = e.clientX - self._boxSelectStart.x;
        const dy = e.clientY - self._boxSelectStart.y;
        if (Math.sqrt(dx*dx + dy*dy) > 5) {
          self._boxSelectMode = true;
          self._clearBoxSelection();
          self._boxSelectRect = document.createElement('div');
          self._boxSelectRect.className = 'box-select-rect';
          gridEl.parentElement.appendChild(self._boxSelectRect);
        }
      }
      if (self._boxSelectMode && self._boxSelectRect) {
        self._updateBoxSelectRect(e);
      }
      if (self._multiDragStart && !self._isMultiDragging) {
        const dx = e.clientX - self._multiDragStart.x;
        const dy = e.clientY - self._multiDragStart.y;
        if (Math.sqrt(dx*dx + dy*dy) > 5) {
          self._isMultiDragging = true;
          document.getElementById('tooltip').classList.remove('show');
          self._createMultiDragGhost(e);
          self._selectedCells.forEach(si => {
            const sc = gridEl.children[si];
            if (sc && self.grid[si]) { sc.style.opacity = '0.4'; sc.style.filter = 'grayscale(0.5)'; }
          });
        }
      }
      if (self._isMultiDragging && self._multiDragGhost) {
        self._multiDragGhost.style.left = (e.clientX - 20) + 'px';
        self._multiDragGhost.style.top = (e.clientY - 20) + 'px';
      }
    });

    gridEl.addEventListener('mouseup', (e) => {
      if (e.button !== 0) return;
      const idx = cellIdx(e);
      if (idx < 0) return;
      if (self._isDragging && self._dragIdx != null && self._dragIdx !== idx) {
        self._completeDrag(self._dragIdx, idx);
      }
      if (self._isMultiDragging && self._selectedCells.size > 0) {
        self._completeMultiDrag(idx);
      }
      if (self._boxSelectMode) {
        self._finalizeBoxSelect();
      }
      self._boxSelectStart = null;
      self._multiDragStart = null;
    });
  },

  // 更新格子内的警告标签（产出速率已移至 hover tooltip）
  updateCellRates() {
    const coreConfig = CORE_COLONY[this.phase] || CORE_COLONY[1];
    const maxC = (coreConfig.maxCollectors || 2) + (this._coreBonus || 0);
    let collectorSeq = 0;

    this.grid.forEach((g, idx) => {
      if (!g) return;
      const bd = BLDS[g.type];
      if (!bd) return;

      // 核心供能建筑：超出上限标记闲置
      if (bd.corePowered) {
        collectorSeq++;
      }

      // 更新资源阻塞状态（休眠建筑排除——它是主动停机，不是阻塞）
      const overlayEl = document.getElementById('blockOverlay-' + idx);
      const badgeEl = document.getElementById('blockBadge-' + idx);
      if (overlayEl || badgeEl) {
        const isDormant = !!this._dormantCells[idx];
        const beltMult = this.getBeltMultiplierForBuilding(idx);
        const isBlocked = !isDormant && beltMult === 0;
        const gridEl = document.getElementById('grid');
        const cellEl = gridEl && gridEl.children[idx];
        if (cellEl) {
          cellEl.classList.toggle('cell-blocked', isBlocked);
        }
        if (overlayEl) overlayEl.style.display = isBlocked ? 'block' : 'none';
        if (badgeEl) badgeEl.style.display = isBlocked ? 'block' : 'none';
      }
      // v2.1: 更新休眠状态badge
      const dormBadgeEl = document.getElementById('dormantBadge-' + idx);
      if (dormBadgeEl) {
        const isDorm = !!this._dormantCells[idx];
        dormBadgeEl.style.display = isDorm ? 'block' : 'none';
      }

      // 更新邻接加成badge
      const adjEl = document.getElementById('adjBadge-' + idx);
      if (adjEl) {
        const adj = this.getAdjacencyBonus(idx);
        if (adj.bonus > 0) {
          adjEl.style.display = 'block';
          adjEl.textContent = '🔗+' + Math.round(adj.bonus * 100) + '%';
          // 加成越高颜色越亮
          const intensity = Math.min(adj.bonus / 0.5, 1);
          adjEl.style.color = intensity > 0.5 ? '#fbbf24' : '#06d6a0';
          adjEl.style.textShadow = `0 0 4px ${adjEl.style.color}`;
        } else {
          adjEl.style.display = 'none';
        }
      }
    });

    // 更新传送带连接按钮：有阻塞建筑时变红
    const beltBtn = document.getElementById('beltConnectBtn');
    if (beltBtn) {
      const hasBlocked = document.querySelector('.cell.cell-blocked') !== null;
      beltBtn.classList.toggle('has-blocked', hasBlocked);
      const iconEl = beltBtn.querySelector('.belt-connect-icon');
      const descEl = beltBtn.querySelector('.belt-connect-desc');
      if (hasBlocked) {
        if (iconEl) iconEl.textContent = '⚠️';
        if (descEl) descEl.textContent = '有建筑缺少传送带，资源阻塞中！';
      } else {
        if (iconEl) iconEl.textContent = '🔗';
        if (descEl) descEl.textContent = '选择两个建筑，手动建立资源通道';
      }
    }

    // 培养皿实验：buff期间持续高亮参与实验的格子
    const petriGridEl = document.getElementById('grid');
    if (petriGridEl && this._petriActiveZone && this._petriBuff) {
      for (const idx of this._petriActiveZone) {
        const cell = petriGridEl.children[idx];
        if (cell && this.grid[idx]) {
          cell.classList.add('petri-active');
          // 动态设置buff颜色
          cell.style.setProperty('--petri-color', this._petriBuff.color || '#14b8a6');
        }
      }
    }
  },
  selectBuilding(key) {
    // ★ Q2：如果在传送带连接模式中，提示冲突后退出
    if (this._beltConnectMode) {
      this.showCursorTooltip('已退出传送带模式 → 切换到建造', 'i');
      this.cancelBeltConnect();
    }
    if (this._petriMode) this.cancelPetriMode();
    this.sel = (this.sel === key) ? null : key;
    SFX.select();
    document.querySelectorAll('.action-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.b === this.sel);
    });

    // v2.0 §10.2: 邻接放置预览热力图（所有阶段均可用）
    this._clearAdjPreview();
    if (this.sel) {
      this._showAdjPreview(this.sel);
    }

    if (this.sel) {
      document.getElementById('buildHint').textContent = '点击培养皿中的空格放置';
      // 移动端选中建筑后自动切换到培养皿
      if (this._isMobile()) this.mobileTab('dish');
    } else {
      document.getElementById('buildHint').textContent = '点选或拖拽到培养皿';
    }
    // 选中建筑后更新小手指向
    if (this.phase === 1) this._updateGuideHand();
  },

  // v2.0 §10.2: 显示邻接放置预览高亮（热力图版）
  _showAdjPreview(bldType) {
    const cells = document.querySelectorAll('.cell');
    this._adjPreviewData = {}; // 存储每个格子的预览数据，供 hover tooltip 使用
    // 第一遍：计算所有格子的加成百分比，找出最大值用于相对着色
    let maxPct = 0;
    const previews = [];
    for (let i = 0; i < this.grid.length; i++) {
      if (this.grid[i]) continue;
      const result = previewAdjacencyBonuses(i, bldType);
      if (result.count === 0) continue;
      // 计算正向加成总百分比（对新建筑本身的加成）
      const forwardPct = result.bonuses.filter(b => !b.isReverse).reduce((s, b) => s + b.bonus, 0);
      // 计算反向加成总百分比（对周围已有建筑的加成）
      const reversePct = result.bonuses.filter(b => b.isReverse).reduce((s, b) => s + b.bonus, 0);
      const totalPct = forwardPct + reversePct;
      if (totalPct > maxPct) maxPct = totalPct;
      previews.push({ idx: i, result, forwardPct, reversePct, totalPct });
    }
    // 第二遍：渲染热力图
    for (const p of previews) {
      const cell = cells[p.idx];
      if (!cell) continue;
      // 颜色梯度：暗绿 → 亮绿 → 金色 → 闪金
      let tier;
      if (p.totalPct >= 0.30) tier = 4;      // 30%+ 最佳位置
      else if (p.totalPct >= 0.15) tier = 3;  // 15~30% 优秀
      else if (p.totalPct >= 0.05) tier = 2;  // 5~15% 不错
      else tier = 1;                           // 0~5% 微弱
      cell.classList.add('adj-heat-' + tier);
      // 分数 badge：显示 +XX%
      const badge = document.createElement('div');
      badge.className = 'adj-preview-badge adj-badge-t' + tier;
      const pctText = '+' + Math.round(p.totalPct * 100) + '%';
      badge.textContent = pctText;
      cell.appendChild(badge);
      // 反向加成标记：在受益的邻居建筑上显示闪烁提示
      if (p.reversePct > 0) {
        const reverseByNeighbor = {};
        for (const b of p.result.bonuses) {
          if (!b.isReverse) continue;
          if (!reverseByNeighbor[b.neighborIdx]) reverseByNeighbor[b.neighborIdx] = 0;
          reverseByNeighbor[b.neighborIdx] += b.bonus;
        }
        for (const [nIdx, bonus] of Object.entries(reverseByNeighbor)) {
          const nCell = cells[+nIdx];
          if (!nCell || nCell.querySelector('.adj-reverse-hint')) continue;
          const hint = document.createElement('div');
          hint.className = 'adj-reverse-hint';
          hint.textContent = '↑+' + Math.round(bonus * 100) + '%';
          nCell.appendChild(hint);
        }
      }
      // 存储数据供 hover 使用
      this._adjPreviewData[p.idx] = p;
    }
  },

  // v2.0: 清除邻接预览高亮
  _clearAdjPreview() {
    document.querySelectorAll('.adj-heat-1,.adj-heat-2,.adj-heat-3,.adj-heat-4').forEach(el => {
      el.classList.remove('adj-heat-1', 'adj-heat-2', 'adj-heat-3', 'adj-heat-4');
    });
    document.querySelectorAll('.adj-preview-badge').forEach(el => el.remove());
    document.querySelectorAll('.adj-reverse-hint').forEach(el => el.remove());
    this._adjPreviewData = {};
  },

  // ===== BELT GUIDANCE TOOLTIP =====
  _showBeltGuide(idx, bd) {
    // 移除之前的引导提示
    document.querySelectorAll('.belt-guide-tooltip').forEach(e => e.remove());

    const cell = document.querySelector(`.cell[data-i="${idx}"]`);
    if (!cell) return;

    // 判断这个建筑需要哪些输入资源
    const needsInput = FLOW_BY_TO.get(bd.key) || FLOW_BY_TO.get(this.grid[idx]?.type) || [];
    const needsOutput = FLOW_BY_FROM.get(bd.key) || FLOW_BY_FROM.get(this.grid[idx]?.type) || [];
    const isReceiver = needsInput.length > 0;

    const tip = document.createElement('div');
    tip.className = 'belt-guide-tooltip';
    tip.innerHTML = isReceiver
      ? '🔗 需要传送带输入！点此连接'
      : '🔗 点此连接传送带输出';

    tip.onclick = (e) => {
      e.stopPropagation();
      tip.remove();
      this.startBeltConnect();
    };

    cell.style.position = 'relative';
    cell.appendChild(tip);

    // 同时让格子闪烁提示
    cell.classList.add('power-dim');
    setTimeout(() => cell.classList.remove('power-dim'), 3000);

    // 5秒后自动消失
    setTimeout(() => {
      if (tip.parentElement) tip.remove();
    }, 5000);
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
    this.refreshAll();

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

  // ===== BUILD DRAG — 从侧栏拖拽建筑到网格 =====
  _buildDragKey: null,        // 正在拖拽的建筑 key
  _buildDragStartPos: null,   // 拖拽起始坐标
  _buildDragging: false,      // 是否已进入拖拽状态
  _buildDragGhost: null,      // 拖拽幽灵元素
  _buildDragOverIdx: null,    // 悬停的目标格子索引
  _buildDragTouch: false,     // 是否为触摸拖拽

  _buildDragMove(clientX, clientY) {
    if (!this._buildDragKey || !this._buildDragStartPos) return;

    // 阈值检测：移动超过 8px 才进入拖拽模式
    if (!this._buildDragging) {
      const dx = clientX - this._buildDragStartPos.x;
      const dy = clientY - this._buildDragStartPos.y;
      if (Math.sqrt(dx * dx + dy * dy) < 8) return;
      this._buildDragging = true;
      // 给源按钮添加拖拽中样式
      const srcBtn = document.querySelector(`.action-btn[data-b="${this._buildDragKey}"]`);
      if (srcBtn) srcBtn.classList.add('build-dragging');
      // 创建 ghost
      this._createBuildDragGhost(this._buildDragKey, clientX, clientY);
      // 隐藏 tooltip
      document.getElementById('tooltip')?.classList.remove('show');
    }

    // 更新 ghost 位置
    if (this._buildDragGhost) {
      this._buildDragGhost.style.left = (clientX - 28) + 'px';
      this._buildDragGhost.style.top = (clientY - 28) + 'px';
    }

    // 检测鼠标下方的格子
    const gridEl = document.getElementById('grid');
    if (!gridEl) return;

    // 清除旧高亮
    if (this._buildDragOverIdx != null) {
      const prevCell = gridEl.children[this._buildDragOverIdx];
      if (prevCell) { prevCell.style.boxShadow = ''; prevCell.style.borderColor = ''; }
      this._buildDragOverIdx = null;
    }

    // 查找鼠标下方的格子
    const elUnder = document.elementFromPoint(clientX, clientY);
    if (!elUnder) return;
    const cellEl = elUnder.closest('.cell');
    if (!cellEl || cellEl.dataset.i == null) return;
    const idx = +cellEl.dataset.i;

    this._buildDragOverIdx = idx;

    // 高亮反馈
    if (!this.grid[idx]) {
      // 空格：绿色可放置
      cellEl.style.boxShadow = 'inset 0 0 16px rgba(6,214,160,0.4)';
      cellEl.style.borderColor = '#06d6a0';
    } else {
      // 有建筑：红色不可放置
      cellEl.style.boxShadow = 'inset 0 0 12px rgba(239,68,68,0.3)';
      cellEl.style.borderColor = '#ef4444';
    }
  },

  _buildDragEnd(clientX, clientY) {
    const key = this._buildDragKey;
    const overIdx = this._buildDragOverIdx;

    // 清理拖拽状态
    this._cleanupBuildDrag();

    if (!key || overIdx == null) return;

    // 通过 sel 路径复用 cellClick 的建造逻辑
    const prevSel = this.sel;
    this.sel = key;
    this.cellClick(overIdx);
    // cellClick 内部在建造成功后不会自动清 sel（保持连续建造）
    // 拖拽建造是一次性的，所以恢复之前的选中状态
    if (this.sel === key) {
      this.sel = prevSel;
      document.querySelectorAll('.action-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.b === this.sel);
      });
      if (!this.sel) {
        document.getElementById('buildHint').textContent = '点选或拖拽到培养皿';
      }
    }
  },

  _createBuildDragGhost(key, clientX, clientY) {
    if (this._buildDragGhost) this._buildDragGhost.remove();
    const bd = BLDS[key];
    if (!bd) return;

    const ghost = document.createElement('div');
    ghost.className = 'build-drag-ghost';
    const costOk = this.checkRes(this.scaledCost(key));
    ghost.innerHTML = `
      <span style="font-size:24px;filter:drop-shadow(0 0 6px ${bd.color})">${bd.emoji || '🔧'}</span>
      <span class="build-drag-name">${bd.n}</span>
    `;
    ghost.style.cssText = `
      position:fixed; z-index:10010; pointer-events:none;
      display:flex; align-items:center; gap:6px;
      padding:6px 12px; border-radius:6px;
      background:${costOk ? 'rgba(6,214,160,0.15)' : 'rgba(239,68,68,0.15)'};
      border:2px solid ${costOk ? 'rgba(6,214,160,0.6)' : 'rgba(239,68,68,0.6)'};
      backdrop-filter:blur(6px);
      box-shadow:0 4px 20px ${costOk ? 'rgba(6,214,160,0.2)' : 'rgba(239,68,68,0.2)'};
      font-family:'Rajdhani',sans-serif; font-size:0.75em; font-weight:700;
      color:${costOk ? 'var(--cyan)' : '#ef4444'};
      transition:transform 0.1s; transform:scale(1.05);
    `;
    ghost.style.left = (clientX - 28) + 'px';
    ghost.style.top = (clientY - 28) + 'px';
    document.body.appendChild(ghost);
    this._buildDragGhost = ghost;
  },

  _cleanupBuildDrag() {
    if (this._buildDragGhost) { this._buildDragGhost.remove(); this._buildDragGhost = null; }
    // 移除源按钮的拖拽中样式
    document.querySelectorAll('.action-btn.build-dragging').forEach(b => b.classList.remove('build-dragging'));
    // 清除格子高亮
    if (this._buildDragOverIdx != null) {
      const gridEl = document.getElementById('grid');
      if (gridEl) {
        const cell = gridEl.children[this._buildDragOverIdx];
        if (cell) { cell.style.boxShadow = ''; cell.style.borderColor = ''; }
      }
    }
    this._buildDragKey = null;
    this._buildDragStartPos = null;
    this._buildDragging = false;
    this._buildDragOverIdx = null;
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

    this.refreshAll();

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
    // 培养皿实验模式
    if (this._petriMode) {
      this.handlePetriClick(idx);
      return;
    }
    // 手动连接传送带模式
    if (this._beltConnectMode) {
      this.handleBeltConnectClick(idx);
      return;
    }
    if (this.paused) { this.log('游戏已暂停', 'w'); SFX.buildFail(); return; }
    if (!this.sel) {
      // 没选中建筑时，点击已有建筑 → 高亮选中反馈
      if (this.grid[idx]) {
        // 清除旧选中
        document.querySelectorAll('.cell.cell-selected').forEach(c => c.classList.remove('cell-selected'));
        const cell = document.querySelector(`.cell[data-i="${idx}"]`);
        if (cell) {
          cell.classList.add('cell-selected');
          this._focusedCellIdx = idx;
          // 3秒后自动取消高亮
          clearTimeout(this._cellSelTimer);
          this._cellSelTimer = setTimeout(() => {
            cell.classList.remove('cell-selected');
            this._focusedCellIdx = null;
          }, 3000);
        }
      } else {
        this.log('请先从左侧选择建筑', 'w');
      }
      return;
    }

    // 自动清理无效格子（旧存档残留的幽灵建筑）
    if (this.grid[idx] && (!this.grid[idx].type || !BLDS[this.grid[idx].type])) {
      this.grid[idx] = null;
      this.log('▸ 清除了损坏的建筑数据', 'w');
    }

    if (this.grid[idx]) { this.log('这个位置已经有建筑了', 'e'); SFX.buildFail(); return; }

    // v3.0 §8: 变体限制检查
    // 1. maxBuildings 变体 — 建筑上限8座
    if (this._variantMaxBuildings && this.totalBuildings() >= this._variantMaxBuildings) {
      this.log(`🔬 极简主义! 建筑上限 ${this._variantMaxBuildings} 座，无法再建造`, 'e');
      this.showCursorTooltip(`🔬 变体限制: 建筑上限 ${this._variantMaxBuildings} 座`);
      SFX.buildFail();
      return;
    }
    // 2. randomPlacement 变体 — 随机放置位置
    if (this._variantRandomPlace) {
      const emptyCells = [];
      for (let i = 0; i < this.grid.length; i++) {
        if (!this.grid[i]) emptyCells.push(i);
      }
      if (emptyCells.length > 0) {
        const randomIdx = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        if (randomIdx !== idx) {
          this.log(`🎲 混沌培养皿! 建筑被随机放置到其他位置`, 'w');
          this.showCursorTooltip(`🎲 变体限制: 建筑随机放置`);
          idx = randomIdx; // 重定向到随机位置
        }
      }
    }

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
        if (have < actualCost[k]) missing.push(`${RES[k]?.icon||k} 差 ${formatNum(Math.ceil(actualCost[k] - have))}`);
      }
      this.showCursorTooltip(`资源不足！${missing.join('  ')}`);
      SFX.buildFail();
      return;
    }

    // ★ v0.9.3：记录放置前的全局邻接加成总量
    this._invalidateAdjStats();
    const _prevAdjTotal = this._getAdjStats().totalBonus;

    this.spend(actualCost);
    this.grid[idx] = { type: this.sel };

    if (bd.isWonder) {
      this.wBuild = this.sel;
      this.wProg = 0;
      this._showPopup('wonderOverlay');
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
        this.log(`⚠ 核心供能上限 ${cc.maxCollectors} 台，多出的 ${count - cc.maxCollectors} 台将闲置！升级核心可扩容`, 'w');
      } else if (count === cc.maxCollectors) {
        this.log(`⚡ 核心供能已满载 ${count}/${cc.maxCollectors}`, 'ev');
      }
    }

    // v2.0 §8.4: 传送带连接提示 — P1自动 / P2 hybrid / P3+手动
    const beltInfoAfter = this._checkBeltConnections(idx, this.sel);
    const currentBeltMode = BELT_MODE[Math.min(this.phase, 3)] || 'manual';
    if (currentBeltMode === 'auto') {
      // P1: 保留自动连接，新手友好
      if (beltInfoAfter.count > 0) {
        this.log(`🔗 传送带已自动连接 ×${beltInfoAfter.count}`, 's');
      } else {
        const hasFlowRole = FLOW_TYPES_FROM.has(this.sel) || FLOW_TYPES_TO.has(this.sel);
        if (hasFlowRole) {
          this.log('🔗 传送带已自动规划，放心建造！', 's');
        }
      }
    } else if (currentBeltMode === 'hybrid') {
      // P2: 自动传送带仍在，但可手动添加优化
      if (beltInfoAfter.count > 0) {
        this.log(`🔗 自动连接 ×${beltInfoAfter.count} | 💡 你也可以手动添加管线来优化产线`, 's');
      }
      const hasFlowRole = FLOW_TYPES_FROM.has(this.sel) || FLOW_TYPES_TO.has(this.sel);
      if (hasFlowRole) {
        this._showBeltGuide(idx, bd);
      }
    } else {
      // P3+: 纯手动
      if (beltInfoAfter.count > 0) {
        this.log(`🔗 检测到 ${beltInfoAfter.count} 条可用连接`, 's');
      }
      const hasFlowRole = FLOW_TYPES_FROM.has(this.sel) || FLOW_TYPES_TO.has(this.sel);
      if (hasFlowRole) {
        this._showBeltGuide(idx, bd);
      }
    }

    // v2.0: 放置后清除邻接预览
    this._clearAdjPreview();

    // ★ v0.9.3：邻接加成变化飘字
    this._invalidateAdjStats();
    const _newAdjTotal = this._getAdjStats().totalBonus;
    if (_newAdjTotal > _prevAdjTotal + 0.001) {
      const oldPct = Math.round(_prevAdjTotal * 100);
      const newPct = Math.round(_newAdjTotal * 100);
      this._showAdjFloat(`🔗 总邻接 +${oldPct}% → +${newPct}%`, idx);
    }

    // 爽感系统
    this.stats.totalBuilt++;
    // J3: 微叙事事件 — 首个建筑建成
    if (this.stats.totalBuilt === 1) {
      this.showMilestone('🌱', '第一个采集菌诞生了...你的帝国从此刻开始。');
    }
    this.buildBurst(idx);
    this.addCombo();

    // 引导任务完成反馈：如果建造的建筑正好是引导目标
    if (this._prevGuideKey === this.sel) {
      const score = this.calcScore();
      this.showUnlockFloat(`✓ ${bd.n} 完成！  +${formatNum(score)} 分`);
    }
  },

  // ===== BUILD IMPACT PREVIEW (建造前资源冲击预览) =====
  _calcBuildImpact(bldType, targetIdx) {
    const bd = BLDS[bldType];
    if (!bd) return null;
    const result = { cost: {}, costPct: {}, rateChanges: {}, warnings: [] };

    // 1. 建造成本 & 库存占比
    const actualCost = this.scaledCost(bldType);
    for (let k in actualCost) {
      result.cost[k] = actualCost[k];
      const have = this.res[k] || 0;
      result.costPct[k] = have > 0 ? Math.round(actualCost[k] / have * 100) : 999;
      if (have < actualCost[k]) {
        result.warnings.push(`${RES[k]?.icon||k} 不足`);
      }
    }

    // 2. 预估速率变化（基于当前全局乘数的近似值）
    if (!bd.isWonder && !bd.isBoost) {
      // 产出侧乘数估算
      const popEffMult = this._popEffMult || 1;
      const harvestPop = Math.min(this.pop, this._popCap()) * (this.popAlloc.harvest / 100);
      const popMult = 1 + harvestPop * BALANCE.popHarvestBonus * popEffMult;
      let techBonus = 1;
      if (bldType === 'glucoseCollector' && this._collectorBonus) techBonus += this._collectorBonus;
      if (bldType === 'energyStation' && this._energyBonus) techBonus += this._energyBonus;
      if (bldType === 'nitrogenFixer' && this._nitrogenBonus) techBonus += this._nitrogenBonus;
      if (bldType === 'proteinFactory' && this._proteinBonus) techBonus += this._proteinBonus;
      // 邻接预估
      let adjBonus = 1;
      if (targetIdx != null) {
        const adjR = previewAdjacencyBonuses(targetIdx, bldType);
        const fwd = adjR.bonuses.filter(b => !b.isReverse).reduce((s, b) => s + b.bonus, 0);
        adjBonus = 1 + fwd;
      }
      const globalProdMult = this._prodMult || 1;
      const mutGlobalBonus = 1 + (this._mutActiveEffects?.globalProdBonus || 0);
      const gEff = this.gEff || 1;
      const foodPwr = this._foodPowerLevel || 1;
      const prodMult = gEff * popMult * techBonus * adjBonus * foodPwr * globalProdMult * mutGlobalBonus;

      for (let k in (bd.prod || {})) {
        const mutResBonus = 1 + (this._mutActiveEffects?.resProdBonus?.[k] || 0);
        result.rateChanges[k] = (result.rateChanges[k] || 0) + bd.prod[k] * prodMult * mutResBonus;
      }
      for (let k in (bd.cons || {})) {
        result.rateChanges[k] = (result.rateChanges[k] || 0) - bd.cons[k]; // 消耗以基础值计（Lv1无传送带）
      }

      // 3. 维护费影响
      if (this.phase >= 2) {
        const tier = bd.phase || 1;
        const baseMaint = MAINTENANCE.baseCost[tier];
        if (baseMaint && !MAINTENANCE.exempt.includes(bldType)) {
          const totalBld = this.totalBuildings();
          const excess = Math.max(0, totalBld + 1 - MAINTENANCE.overheadThreshold);
          const overhead = Math.min(1 + excess * MAINTENANCE.overheadRate, MAINTENANCE.maxOverhead);
          for (let k in baseMaint) {
            result.rateChanges[k] = (result.rateChanges[k] || 0) - baseMaint[k] * overhead;
          }
        }
      }

      // 4. 核心供给检查
      if (bd.corePowered) {
        const cc = CORE_COLONY[this.phase] || CORE_COLONY[1];
        const maxC = (cc.maxCollectors || 2) + (this._coreBonus || 0);
        const cur = this.bldCount(bldType);
        if (cur >= maxC) {
          result.warnings.push('⚠ 超出核心供给上限（将闲置）');
        }
      }

      // 5. 关键资源警告：建造后某资源净速率变负
      for (let k in result.rateChanges) {
        const curRate = this.rates[k] || 0;
        const newRate = curRate + result.rateChanges[k];
        if (curRate >= 0 && newRate < -0.01) {
          result.warnings.push(`⚠ ${RES[k]?.icon||k} 将变为赤字`);
        }
      }
    } else if (bd.isBoost) {
      result.rateChanges = { _boost: 0.12 }; // 全局+12%
    }

    return result;
  },

  _renderBuildImpactHTML(impact) {
    if (!impact) return '';
    let html = `<br><span style="color:var(--bright);font-weight:700;font-size:0.9em;margin-top:4px;display:inline-block;border-top:1px solid rgba(150,170,190,0.15);padding-top:4px;width:100%">📊 建造冲击预览</span>`;

    // 建造成本
    html += `<br><span style="color:var(--dim);font-size:0.82em">建造花费：</span>`;
    for (let k in impact.cost) {
      const pct = impact.costPct[k];
      const color = pct > 90 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#22c55e';
      html += `<span style="color:${color};font-size:0.82em"> ${RES[k]?.icon||k}${formatNum(impact.cost[k])}(${pct}%)</span>`;
    }

    // 速率变化
    const rKeys = Object.keys(impact.rateChanges).filter(k => k !== '_boost' && Math.abs(impact.rateChanges[k]) > 0.005);
    if (rKeys.length > 0) {
      html += `<br><span style="color:var(--dim);font-size:0.82em">速率影响（/秒）：</span>`;
      for (const k of rKeys) {
        const v = impact.rateChanges[k];
        const sign = v > 0 ? '+' : '';
        const color = v > 0 ? '#22c55e' : '#ef4444';
        html += `<br><span style="color:${color};font-size:0.82em;padding-left:8px">${RES[k]?.icon||k} ${sign}${formatNum(v, 2)}/s</span>`;
        // 显示建造后的新净速率
        const curRate = this.rates[k] || 0;
        const newRate = curRate + v;
        const nColor = newRate >= 0 ? 'var(--dim)' : '#ef4444';
        html += `<span style="color:${nColor};font-size:0.75em"> (${formatNum(curRate, 2)}→${formatNum(newRate, 2)})</span>`;
      }
    }
    if (impact.rateChanges._boost) {
      html += `<br><span style="color:#14b8a6;font-size:0.82em;padding-left:8px">✦ 全局产出 +${Math.round(impact.rateChanges._boost * 100)}%</span>`;
    }

    // 警告
    if (impact.warnings.length > 0) {
      for (const w of impact.warnings) {
        html += `<br><span style="color:#ef4444;font-weight:700;font-size:0.82em">${w}</span>`;
      }
    }

    return html;
  },

  // ===== BUILDING DORMANCY (建筑休眠) =====
  _dormantCells: {}, // { cellIdx: true }

  isDormant(idx) {
    return !!this._dormantCells[idx];
  },

  toggleDormant(idx) {
    const g = this.grid[idx];
    if (!g || !BLDS[g.type]) return;
    const bd = BLDS[g.type];
    if (bd.isWonder) { this.log('奇观不可休眠', 'w'); return; }
    if (bd.corePowered) { this.log('核心供能建筑不可休眠', 'w'); return; }

    if (this._dormantCells[idx]) {
      // 唤醒
      delete this._dormantCells[idx];
      this.log(`▸ ${bd.emoji||''} ${bd.n} 已唤醒`, 's');
      SFX.build();
    } else {
      // 休眠
      this._dormantCells[idx] = true;
      this.log(`💤 ${bd.emoji||''} ${bd.n} 已休眠 — 停止生产，维护费降至25%`, 'w');
      SFX.click();
    }

    this.refreshAll();
  },

  // ===== RECYCLE =====
  recycleIdx: null,
  RECYCLE_RATE: 0.5, // 返还50%资源

  // ===== BUILDING CONTEXT MENU (右键菜单) =====
  showBuildingContextMenu(idx, e) {
    const g = this.grid[idx];
    if (!g || !BLDS[g.type]) return;
    const bd = BLDS[g.type];

    // 移除旧的上下文菜单
    document.getElementById('bldContextMenu')?.remove();

    const menu = document.createElement('div');
    menu.id = 'bldContextMenu';
    menu.style.cssText = `position:fixed;z-index:10010;background:rgba(6,10,18,0.96);border:1px solid rgba(150,170,190,0.25);border-radius:6px;padding:6px;box-shadow:0 4px 20px rgba(0,0,0,0.6);font-size:0.82em;min-width:140px`;

    const isDormant = this.isDormant(idx);
    const canDormant = !bd.isWonder && !bd.corePowered;

    let html = `<div style="color:var(--bright);font-weight:700;padding:4px 8px;border-bottom:1px solid rgba(150,170,190,0.12);margin-bottom:4px">${bd.emoji||''} ${bd.n}</div>`;

    // 休眠/唤醒按钮
    if (canDormant) {
      if (isDormant) {
        html += `<div class="ctx-item ctx-wake" data-action="dormant" style="display:flex;align-items:center;gap:6px;padding:6px 8px;cursor:pointer;border-radius:4px;color:#22c55e;transition:background 0.15s" onmouseenter="this.style.background='rgba(34,197,94,0.1)'" onmouseleave="this.style.background=''">☀️ 唤醒</div>`;
      } else {
        html += `<div class="ctx-item ctx-dormant" data-action="dormant" style="display:flex;align-items:center;gap:6px;padding:6px 8px;cursor:pointer;border-radius:4px;color:#fbbf24;transition:background 0.15s" onmouseenter="this.style.background='rgba(251,191,36,0.1)'" onmouseleave="this.style.background=''">💤 休眠</div>`;
      }
    }

    // 回收按钮
    html += `<div class="ctx-item ctx-recycle" data-action="recycle" style="display:flex;align-items:center;gap:6px;padding:6px 8px;cursor:pointer;border-radius:4px;color:#ef4444;transition:background 0.15s" onmouseenter="this.style.background='rgba(239,68,68,0.1)'" onmouseleave="this.style.background=''">♻️ 回收</div>`;

    menu.innerHTML = html;

    // 定位
    const x = (e?.clientX || 200);
    const y = (e?.clientY || 200);
    menu.style.left = Math.min(x, window.innerWidth - 160) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - 120) + 'px';

    // 事件
    menu.addEventListener('click', (ev) => {
      const item = ev.target.closest('[data-action]');
      if (!item) return;
      menu.remove();
      if (item.dataset.action === 'dormant') {
        this.toggleDormant(idx);
      } else if (item.dataset.action === 'recycle') {
        this.showRecycle(idx);
      }
    });

    // 点击其他地方关闭
    const closeHandler = (ev) => {
      if (!menu.contains(ev.target)) {
        menu.remove();
        document.removeEventListener('click', closeHandler, true);
        document.removeEventListener('contextmenu', closeHandler, true);
      }
    };
    setTimeout(() => {
      document.addEventListener('click', closeHandler, true);
      document.addEventListener('contextmenu', closeHandler, true);
    }, 50);

    document.body.appendChild(menu);
  },

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

    const refundStr = Object.entries(refund).map(([k,v]) => `+${formatNum(v)} ${RES[k]?.icon||k}`).join('  ');

    document.getElementById('recycleName').textContent = bd.n;
    document.getElementById('recycleRefund').textContent = '返还: ' + refundStr;
    this._showPopup('recyclePopup');
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

    const refundStr = Object.entries(refund).map(([k,v]) => `+${formatNum(v)}${RES[k]?.icon||k}`).join(' ');
    this.log(`♻️ 回收 ${bd.n} → ${refundStr}`, 'ev');
    SFX.recycle();

    this.grid[idx] = null;
    this.recycleIdx = null;
    this.stats.totalRecycled++;
    // v2.1: 回收时清除休眠状态
    delete this._dormantCells[idx];
    // v3.0 §9.2: 回收时清除特化
    if (this._specializations?.[idx]) {
      delete this._specializations[idx];
      this._recalcSpecEffects();
    }
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
    this._hidePopup('recyclePopup');
    this._hideBackdrop();

    this.refreshAll();
  },

  cancelRecycle() {
    this.recycleIdx = null;
    this._hidePopup('recyclePopup');
    this._hideBackdrop();
  },

  // ===== ACHIEVEMENTS =====
  checkAchievements() {
    // v3.0 §8.5: 创造模式不记录成就
    if (this._creativeMode) return;
    const prevCount = Object.keys(this.achievements).length;

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
        // 根据等级决定展示效果
        const tier = a.tier || 'bronze';
        this.showAchievement(a.n, a.d, rewardParts.join(' '), tier);
        SFX.achieve();
        this.log(`🏆 成就解锁: ${a.n} — ${a.d}`, 's');
        this.log(`   奖励: ${rewardParts.join(' ')}`, 'ev');

        // 等级化屏幕震动和飘字
        if (tier === 'diamond') {
          this.screenShake(12);
          this.showGoldenFloat('💎 ' + rewardParts.join(' '));
          // 钻石级全屏闪光
          const flash = document.createElement('div');
          flash.className = 'milestone-flash';
          flash.style.background = 'radial-gradient(circle,rgba(168,85,247,0.2),transparent 70%)';
          document.body.appendChild(flash);
          setTimeout(() => flash.remove(), 1500);
          // 延迟第二波震动（史诗感）
          setTimeout(() => this.screenShake(8), 600);
        } else if (tier === 'gold') {
          this.screenShake(8);
          this.showGoldenFloat('🏆 ' + rewardParts.join(' '));
          // 金色全屏微闪
          const flash = document.createElement('div');
          flash.className = 'milestone-flash';
          document.body.appendChild(flash);
          setTimeout(() => flash.remove(), 1200);
        } else {
          this.screenShake(6);
          this.showGoldenFloat('🏆 ' + rewardParts.join(' '));
        }
      }
    }

    // ===== 里程碑检查 =====
    const newCount = Object.keys(this.achievements).length;
    if (newCount > prevCount) {
      this._checkMilestones(newCount);
      // 更新帝国称号
      this._updateEmpireTitle(newCount);
    }

    // 功率危机恢复成就追踪
    if (this._foodPowerLevel <= 0.4) this._wasInCrisis = true;
    if (this._wasInCrisis && this._foodPowerLevel >= 1.0) {
      this._recoveredFromCrisis = true;
      this._wasInCrisis = false;
    }
    // 永不断电追踪
    if (this._foodPowerLevel < 0.7) this._everLowPower = true;
    // ★ 维护费赤字追踪
    if (this.phase >= 2) {
      const mc = this._maintenanceCost || {};
      for (let k in mc) {
        if (mc[k] > 0 && (this.rates[k] || 0) < -0.01) {
          this._everMaintDeficit = true;
        }
      }
    }
  },

  _checkMilestones(achieveCount) {
    if (!this._claimedMilestones) this._claimedMilestones = {};
    for (const ms of ACHIEVE_MILESTONES) {
      if (achieveCount >= ms.count && !this._claimedMilestones[ms.count]) {
        this._claimedMilestones[ms.count] = true;
        ms.fn(this);
        this.log(`🌟 里程碑达成: ${ms.n} — ${ms.buff}`, 's');
        this.showAchievement(`${ms.n}`, `${ms.d} — 永久buff: ${ms.buff}`, '🎖️ 永久增益已激活', 'gold');
        SFX.achieve();
        this.screenShake(8);
        // 全屏闪光
        const flash = document.createElement('div');
        flash.className = 'milestone-flash';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 1500);
      }
    }
  },

  _updateEmpireTitle(achieveCount) {
    let title = EMPIRE_TITLES[0].title;
    for (const t of EMPIRE_TITLES) {
      if (achieveCount >= t.count) title = t.title;
    }
    this._empireTitle = title;
    // 如果顶栏有标题区域就更新
    const titleEl = document.getElementById('empireTitleDisplay');
    if (titleEl) titleEl.textContent = title;
  },

  // ===== ACHIEVEMENT HALL =====
  _achvFilter: 'all',

  openAchievementHall() {
    this._achvFilter = 'all';
    this._renderAchvHall();
    this._showPopup('achvHallOverlay');
  },

  closeAchievementHall() {
    this._hidePopup('achvHallOverlay');
  },

  _renderAchvHall() {
    const count = Object.keys(this.achievements).length;
    const total = ACHIEVE.length;
    const pct = Math.round(count / total * 100);

    // Update progress
    document.getElementById('achvHallProgress').textContent = `${count}/${total}`;
    document.getElementById('achvProgressBar').style.width = pct + '%';
    document.getElementById('achvProgressLabel').textContent = pct + '%';
    // ARIA: 同步成就进度
    document.getElementById('achvProgressBar').closest('[role="progressbar"]')?.setAttribute('aria-valuenow', pct);

    // Build filter tabs
    const filterWrap = document.getElementById('achvFilters');
    const tiers = ['all','bronze','silver','gold','diamond'];
    const tierLabels = { all:'全部', bronze:'🥉 铜', silver:'🥈 银', gold:'🥇 金', diamond:'💎 钻石' };
    filterWrap.innerHTML = tiers.map(t =>
      `<button class="achv-filter-btn${this._achvFilter===t?' active':''}" role="tab" aria-selected="${this._achvFilter===t}" onclick="G._achvFilter='${t}';G._renderAchvHall()">${tierLabels[t]}</button>`
    ).join('');

    // Build body content by category
    const body = document.getElementById('achvHallBody');
    let html = '';

    for (const [catKey, cat] of Object.entries(ACHV_CATEGORIES)) {
      const catAchievements = cat.ids.map(id => ACHIEVE.find(a => a.id === id)).filter(Boolean);
      // Apply filter
      const filtered = this._achvFilter === 'all' ? catAchievements : catAchievements.filter(a => a.tier === this._achvFilter);
      if (filtered.length === 0) continue;

      const catUnlocked = filtered.filter(a => this.achievements[a.id]).length;
      html += `<div class="achv-cat">
        <div class="achv-cat-title">${cat.icon} ${cat.name} <span class="achv-cat-count">${catUnlocked}/${filtered.length}</span></div>
        <div class="achv-grid">`;

      for (const a of filtered) {
        const unlocked = !!this.achievements[a.id];
        const tier = a.tier || 'bronze';
        const rewardParts = [];
        for (let k in a.reward) {
          rewardParts.push(`+${a.reward[k]}${RES[k]?.icon||k}`);
        }
        const hintText = unlocked ? '' : `💡 ${a.d}`;

        html += `<div class="achv-card ${unlocked?'unlocked':'locked'}">
          ${!unlocked ? `<div class="achv-card-hint">${hintText}</div>` : ''}
          <span class="achv-card-tier tier-${tier}">${ACHV_TIER_LABELS[tier]}</span>
          <div class="achv-card-top">
            <span class="achv-card-icon">${unlocked ? a.n.split(' ')[0] : '🔒'}</span>
            <span class="achv-card-name">${unlocked ? a.n.replace(/^[^\s]+\s/,'') : '???'}</span>
          </div>
          <div class="achv-card-desc">${unlocked ? a.d : '未解锁'}</div>
          <div class="achv-card-reward">${unlocked ? rewardParts.join(' ') : '---'}</div>
        </div>`;
      }
      html += '</div></div>';
    }

    // Milestones section
    html += `<div class="achv-milestones">
      <div class="achv-ms-title">🎖️ 里程碑</div>
      <div class="achv-ms-grid">`;
    for (const ms of ACHIEVE_MILESTONES) {
      const claimed = this._claimedMilestones && this._claimedMilestones[ms.count];
      html += `<div class="achv-ms-item ${claimed?'claimed':'unclaimed'}">
        <div class="achv-ms-count">${ms.count}</div>
        <div class="achv-ms-buff">${claimed ? ms.buff : '???'}</div>
      </div>`;
    }
    html += '</div></div>';

    body.innerHTML = html;
  },

  // === 分数变化飘字 — 从荣誉区域分数行飘出 ===
  _showScoreFloat(text, color) {
    const anchor = document.getElementById('scoreRow');
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'score-float';
    el.textContent = text;
    el.style.color = color || '#fbbf24';
    el.style.textShadow = `0 0 12px ${color || '#fbbf24'}80, 0 0 24px ${color || '#fbbf24'}40`;
    el.style.left = (rect.right + 6) + 'px';
    el.style.top = (rect.top + rect.height / 2 - 10) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  },

  // ★ v0.9.3：邻接加成变化飘字 — 从放置的格子位置浮出
  _showAdjFloat(text, cellIdx) {
    const cell = document.querySelector(`.cell[data-i="${cellIdx}"]`);
    if (!cell) return;
    const rect = cell.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'score-float';
    el.textContent = text;
    el.style.color = '#06d6a0';
    el.style.textShadow = '0 0 12px rgba(6,214,160,0.5), 0 0 24px rgba(6,214,160,0.3)';
    el.style.left = (rect.left + rect.width / 2) + 'px';
    el.style.top = (rect.top - 10) + 'px';
    el.style.transform = 'translateX(-50%)';
    el.style.fontSize = '0.85em';
    el.style.whiteSpace = 'nowrap';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  },

  // ★ v0.9.3：点击 Top 5 排行中的建筑，高亮对应格子
  _focusCell(idx) {
    document.querySelectorAll('.cell.cell-selected').forEach(c => c.classList.remove('cell-selected'));
    const cell = document.querySelector(`.cell[data-i="${idx}"]`);
    if (!cell) return;
    cell.classList.add('cell-selected');
    cell.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    clearTimeout(this._cellSelTimer);
    this._cellSelTimer = setTimeout(() => { cell.classList.remove('cell-selected'); }, 3000);
  },

  showAchievement(name, desc, reward, tier) {
    this._enqueueNotify({
      dur: tier === 'diamond' ? 6000 : tier === 'gold' ? 5000 : 4500,
      show: () => {
        const el = document.getElementById('achievePopup');
        document.getElementById('achieveName').textContent = name;
        document.getElementById('achieveDesc').textContent = desc;
        document.getElementById('achieveReward').textContent = '🎁 ' + reward;
        // 等级化样式
        el.classList.remove('show', 'tier-gold', 'tier-diamond');
        void el.offsetWidth; // force reflow
        if (tier === 'gold') el.classList.add('tier-gold');
        if (tier === 'diamond') el.classList.add('tier-diamond');
        el.classList.add('show');

        // === Phase E: 成就视觉仪式 ===
        if (tier === 'gold' || tier === 'diamond') {
          // 金色粒子爆发（gold 12颗，diamond 20颗）
          const count = tier === 'diamond' ? 20 : 12;
          const rect = el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'achv-particle';
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const dist = 60 + Math.random() * 80;
            p.style.cssText = `left:${cx}px;top:${cy}px;--dx:${Math.cos(angle)*dist}px;--dy:${Math.sin(angle)*dist}px;--dur:${0.8+Math.random()*0.6}s;`;
            if (tier === 'diamond') {
              p.style.background = '#a855f7';
              p.style.boxShadow = '0 0 8px rgba(168,85,247,0.9)';
              p.style.width = '6px';
              p.style.height = '6px';
            }
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 1600);
          }
        }

        // diamond 专属：全屏史诗仪式
        if (tier === 'diamond') {
          this._showEpicAchievement(name, desc);
        }
      },
      hide: () => {
        const el = document.getElementById('achievePopup');
        el.classList.remove('show', 'tier-gold', 'tier-diamond');
      }
    });
  },

  // Phase E: 史诗成就全屏仪式
  _showEpicAchievement(name, desc) {
    const overlay = document.getElementById('achvEpicOverlay');
    const icon = document.getElementById('achvEpicIcon');
    const title = document.getElementById('achvEpicTitle');
    const descEl = document.getElementById('achvEpicDesc');
    const ring = document.getElementById('achvEpicRing');
    if (!overlay) return;

    icon.textContent = '💎';
    title.textContent = name;
    descEl.textContent = desc;

    // 重置动画
    overlay.style.display = '';
    ring.style.animation = 'none';
    void ring.offsetWidth;
    ring.style.animation = '';

    icon.style.animation = 'none';
    void icon.offsetWidth;
    icon.style.animation = '';

    // 延迟触发第二波光环
    setTimeout(() => {
      const ring2 = document.createElement('div');
      ring2.className = 'achievement-epic-ring';
      ring2.style.position = 'absolute';
      overlay.appendChild(ring2);
      setTimeout(() => ring2.remove(), 1500);
    }, 400);

    // 4秒后淡出
    setTimeout(() => {
      overlay.style.transition = 'opacity 0.5s ease';
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
        overlay.style.opacity = '';
        overlay.style.transition = '';
      }, 500);
    }, 3500);
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
    this._hidePopup(el);
    void el.offsetWidth;
    this._showPopup(el);
    setTimeout(() => this._hidePopup(el), 2000);
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
    // 峰值种群追踪
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

    // 8. 种群 — 对数评分
    score += Math.floor(Math.log10(Math.max(1, s.peakPop || 0)) * 30);

    // 9. 全局效率 — 每100%=40分
    score += Math.floor(this.gEff * 40);

    // 10. 奇观完成 — 终极大分
    if (this.wonderComplete) score += 2000;

    // 11. 邻接加成 — 每10%总加成=25分（封顶200分）
    const adjStats = this._getAdjStats();
    score += Math.min(200, Math.floor(adjStats.totalBonus * 10 * 25));

    // 12. 效率奖励 — 越快到达高阶段，分数越高（在线时长短=高效率）
    //     前30分钟不扣分，之后每小时-50分（但不低于0扣减）
    const hours = Math.max(0, this.stats.onlineTime / 3600 - 0.5);
    const timePenalty = Math.min(Math.floor(hours * 50), Math.floor(score * 0.15)); // 最多扣15%
    score -= timePenalty;

    // 12. 转生经验 — 老玩家应该有更高的分数上限
    score += (this.prestigeCount || 0) * 100;

    // 13. 变体通关 — 高难度 = 高分
    const variantCount = Object.keys(this._completedVariants || {}).length;
    score += variantCount * 300;
    if (variantCount >= 6) score += 2000; // 全变体额外大分

    // 14. 催化剂使用效率
    score += Math.min((this.stats.catalystUseCount || 0), 50) * 20;

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

  // ===== 评级首次达成奖励 =====
  // 按评级从低到高排列，每个评级首次达成给一次性奖励（跨世保留）
  _RATING_REWARDS: [
    { rank:'D', min:200,  rewards:{ energy:30 } },
    { rank:'C', min:600,  rewards:{ energy:50, dna:20 } },
    { rank:'B', min:1200, rewards:{ energy:100, dna:30, protein:15 } },
    { rank:'A', min:2000, rewards:{ energy:200, dna:50, protein:30 } },
    { rank:'S', min:3000, rewards:{ energy:300, dna:80, protein:40, biomass:20 } },
    { rank:'SS', min:4000, rewards:{ energy:500, dna:120, protein:60, biomass:30 } },
    { rank:'SSS', min:5000, rewards:{ energy:1000, dna:200, protein:100, biomass:50 } },
  ],

  // 检查并发放评级奖励（在 UI tick 中调用）
  _checkRatingRewards(score) {
    const { rank } = this._scoreRank(score);
    if (rank === 'E') return; // E级无奖励
    const claimed = this._ratingRewardsClaimed || {};
    for (const rr of this._RATING_REWARDS) {
      if (score >= rr.min && !claimed[rr.rank]) {
        // 首次达成！
        claimed[rr.rank] = true;
        this._ratingRewardsClaimed = claimed;
        // 发放奖励
        const parts = [];
        for (const k in rr.rewards) {
          this.res[k] = (this.res[k] || 0) + rr.rewards[k];
          parts.push(`+${rr.rewards[k]}${RES[k]?.icon||k}`);
        }
        const { color } = this._scoreRank(score);
        this.log(`🏅 评级 ${rr.rank} 首次达成！奖励: ${parts.join(' ')}`, 's');
        this.showEvent(`🏅 评级 ${rr.rank} 达成！`, `恭喜首次达到 ${rr.rank} 评级！\n\n🎁 奖励: ${parts.join(' ')}\n\n继续加油冲击更高评级！`, color);
        SFX.achieve();
        this.screenShake(6);
        // 持久化到 prestige 数据
        this._saveRatingRewardsToPrestige();
        break; // 一次只弹一个，下一 tick 继续检测
      }
    }
  },

  // 将评级奖励状态同步到 prestige 数据（跨世保留）
  _saveRatingRewardsToPrestige() {
    try {
      const pd = localStorage.getItem('bioSpherePrestige');
      if (!pd) return;
      const pData = JSON.parse(pd);
      pData.ratingRewardsClaimed = this._ratingRewardsClaimed || {};
      localStorage.setItem('bioSpherePrestige', JSON.stringify(pData));
    } catch(e) { /* ignore */ }
  },

  // ===== 传奇分 — 跨世累计成就评分，永不重置 =====
  calcLegacyScore() {
    let ls = 0;
    // 历史最高当世分
    const highScore = parseInt(localStorage.getItem('bioHighScore') || '0', 10);
    ls += Math.max(this.calcScore(), highScore);
    // 转生次数
    ls += (this.prestigeCount || 0) * 200;
    // 变体通关
    const variantCount = Object.keys(this._completedVariants || {}).length;
    ls += variantCount * 500;
    if (variantCount >= 6) ls += 2000; // 全通关额外
    // 催化剂使用次数 (上限50次计分)
    ls += Math.min((this.stats.catalystUseCount || 0), 50) * 30;
    // 蓝图收藏
    ls += (this._blueprints || []).length * 50;
    // 成就完成率 (100%=3000分)
    const achieveRate = Object.keys(this.achievements).length / Math.max(ACHIEVE.length, 1);
    ls += Math.floor(achieveRate * 3000);
    // 最快奇观时间奖励
    const fw = this._fastestWonder;
    if (fw && fw <= 600) ls += 1500;
    else if (fw && fw <= 900) ls += 1000;
    else if (fw && fw <= 1200) ls += 500;
    // 多菌株/创造模式解锁
    if (this._multiStrainUnlocked) ls += 500;
    if (this._creativeAvailable) ls += 300;
    return Math.floor(ls);
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
        <span style="color:var(--color-muted);font-size:0.85em">≥${formatNum(r.min)}</span>
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
        <span style="color:${curColor};font-family:'Orbitron',monospace;font-weight:700;font-size:0.95em">当前: ${rank} (${formatNum(score)}分)</span>
      </div>
      ${rows}
      <div style="text-align:center;margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.04);color:var(--dim);font-size:0.75em">
        分数 = 阶段 + 进化 + 建筑 + 科技 + 成就 + 挑战 + 资源峰值 + 效率 + 邻接加成 + 转生 + 变体 + 催化 − 时间惩罚
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

    const _resets = parseInt(localStorage.getItem('bioResetCount') || '0', 10);
    const _highScore = parseInt(localStorage.getItem('bioHighScore') || '0', 10);
    const adjStats = this._getAdjStats();
    const historyRows = _resets > 0 ? `
      <div style="border-top:1px solid rgba(251,191,36,0.1);margin-top:4px;padding-top:4px">
        <div class="stat-row"><span class="stat-label">📜 历史最高分</span><span class="stat-value" style="color:#fbbf24">${formatNum(Math.max(this.calcScore(), _highScore))}</span></div>
        <div class="stat-row"><span class="stat-label">🔄 重置次数</span><span class="stat-value">${_resets}</span></div>
      </div>` : '';

    el.innerHTML = `
      <div class="stat-row"><span class="stat-label">⏱ 在线时长</span><span class="stat-value">${timeStr}</span></div>
      <div class="stat-row"><span class="stat-label">🏗️ 总建造数</span><span class="stat-value">${this.stats.totalBuilt}</span></div>
      <div class="stat-row"><span class="stat-label">♻️ 总回收数</span><span class="stat-value">${this.stats.totalRecycled}</span></div>
      <div class="stat-row"><span class="stat-label">🧬 进化次数</span><span class="stat-value">${this.stats.totalEvo}</span></div>
      <div class="stat-row"><span class="stat-label">📖 研究完成</span><span class="stat-value">${Object.values(this.techs).filter(t=>t.done).length}/${Object.keys(TECHS).length}</span></div>
      <div class="stat-row"><span class="stat-label">🟢 峰值葡萄糖</span><span class="stat-value">${formatNum(this.stats.peakGlucose)}</span></div>
      <div class="stat-row"><span class="stat-label">⚡ 峰值能量</span><span class="stat-value">${formatNum(this.stats.peakEnergy)}</span></div>
      <div class="stat-row"><span class="stat-label">🧬 峰值DNA</span><span class="stat-value">${formatNum(this.stats.peakDna)}</span></div>
      <div class="stat-row"><span class="stat-label">🦠 峰值种群</span><span class="stat-value">${formatNum(this.stats.peakPop || 0)}</span></div>
      <div class="stat-row"><span class="stat-label">🏆 成就</span><span class="stat-value">${Object.keys(this.achievements).length}/${ACHIEVE.length}</span></div>
      <div class="stat-row"><span class="stat-label">🔗 邻接加成</span><span class="stat-value" style="color:${adjStats.adjCount > 0 ? '#06d6a0' : 'var(--dim)'}">${adjStats.adjCount > 0 ? `×${adjStats.adjCount}栋 · +${Math.round(adjStats.totalBonus * 100)}%` : '无'}</span></div>
      <div class="stat-row"><span class="stat-label">🎯 挑战完成</span><span class="stat-value">${Object.keys(this.completedChallenges).length}/${CHALLENGES.length}</span></div>${historyRows}
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

    const highScore = parseInt(localStorage.getItem('bioHighScore') || '0', 10);
    const resets = parseInt(localStorage.getItem('bioResetCount') || '0', 10);
    const adjS = this._getAdjStats();
    const highLine = resets > 0 ? `\n📜 历史最高: ${formatNum(Math.max(score, highScore))}  |  重置: ${resets}次` : '';

    const card = [
      `🧫 ═══ 微生物帝国 ═══ 🧫`,
      ``,
      `🏆 总分: ${formatNum(score)}  [${rank}]`,
      `⏱ 在线: ${timeStr}  |  📡 阶段: P${this.phase}`,
      `🧬 进化: Lv.${this.eL}  |  📈 效率: ${Math.round(this.gEff*100)}%`,
      `🏗️ 建筑: ${this.totalBuildings()}  |  🦠 峰值种群: ${formatNum(this.stats.peakPop || 0)}`,
      `🔗 邻接: ${adjS.adjCount}栋 +${Math.round(adjS.totalBonus * 100)}%  |  📖 科技: ${techDone}/${Object.keys(TECHS).length}`,
      `🏆 成就: ${achieves}/${ACHIEVE.length}  |  🎯 挑战: ${challenges}/${CHALLENGES.length}${this.wonderComplete ? '  |  ☀️ 戴森球已完成!' : ''}${highLine}`,
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

  // ===== LEADERBOARD SYSTEM (Supabase) =====
  _playerId: null,
  _playerName: null,
  _lbCache: null,
  _lbLastFetch: 0,
  _miniLbCache: null,
  _miniLbLastFetch: 0,
  // v1.0.2: 排名头衔系统
  _lbRankTitle: null,     // 当前头衔 { title, color, effBonus }
  _lbMyPosition: 99,      // 当前排名位置

  // 初始化玩家 ID 和昵称
  _initPlayer() {
    let pid = localStorage.getItem('bioPlayerId');
    if (!pid) {
      pid = 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('bioPlayerId', pid);
    }
    this._playerId = pid;
    this._playerName = localStorage.getItem('bioPlayerName') || null;
    // 初始化昵称显示
    this._updateNameDisplay();

    if (!this._playerName) {
      // 如果开场引导弹窗正在显示，延迟到关闭后再弹昵称
      const delay = localStorage.getItem('bioIntroSeen') ? 3000 : 8000;
      setTimeout(() => this.showNicknamePopup(), delay);
    }
  },

  // 更新荣誉区域的昵称显示
  _updateNameDisplay() {
    const el = document.getElementById('playerNameDisplay');
    if (!el) return;
    if (this._playerName) {
      el.textContent = this._playerName;
      el.style.color = 'var(--cyan)';
    } else {
      el.textContent = '点击设置昵称';
      el.style.color = 'var(--dim)';
    }
  },

  // 更新"不保存"提示（阶段3前显示，阶段3+隐藏）
  _updateSaveHint() {
    const hint = document.getElementById('noSaveHint');
    if (!hint) return;
    hint.style.display = this.phase < 3 ? '' : 'none';
  },

  // === 昵称弹窗 ===
  showNicknamePopup() {
    // 如果开场引导还在显示，延迟再试
    const intro = document.getElementById('introPopup');
    if (intro && intro.classList.contains('show')) {
      setTimeout(() => this.showNicknamePopup(), 2000);
      return;
    }
    const pop = document.getElementById('nicknamePopup');
    if (!pop) return;
    const input = document.getElementById('nicknameInput');
    if (input) input.value = this._playerName || '';
    this._showPopup(pop);
    this._showBackdrop();
    if (input) setTimeout(() => input.focus(), 100);
  },

  confirmNickname() {
    const input = document.getElementById('nicknameInput');
    const name = (input?.value || '').trim();
    if (name.length < 2 || name.length > 12) {
      this.showCursorTooltip('昵称需要 2-12 个字符');
      return;
    }
    this._playerName = name;
    localStorage.setItem('bioPlayerName', name);
    this.closeNickname();
    this._updateNameDisplay();
    this.log(`🧬 昵称设置为: ${name}`, 's');
    this.showCursorTooltip(`昵称已设为「${name}」`);
    this.submitScore();
  },

  closeNickname() {
    this._hidePopup('nicknamePopup');
    this._hideBackdrop();
  },

  editNickname() {
    this.closeLeaderboard();
    setTimeout(() => this.showNicknamePopup(), 200);
  },

  // === 提交分数到 Supabase ===
  async submitScore() {
    if (!window.supaReady || !window.supa) {
      this.showCursorTooltip('排行榜服务未连接');
      return;
    }
    if (!this._playerName) {
      this.showNicknamePopup();
      return;
    }

    const score = this.calcScore();
    const { rank } = this._scoreRank(score);
    // 生成游戏状态指纹用于服务端校验
    const techDone = Object.values(this.techs).filter(t => t.done).length;
    const achieveCount = Object.keys(this.achievements).length;
    const challengeCount = Object.keys(this.completedChallenges).length;
    const bldCount = this.totalBuildings();
    // 校验签名：混合多个游戏状态值生成 hash，使得不篡改全部数据就无法伪造分数
    const sigPayload = `${this._playerId}:${score}:${this.phase}:${this.eL}:${bldCount}:${techDone}:${achieveCount}:${challengeCount}:${this.wonderComplete?1:0}:${Math.floor(this.stats.onlineTime)}:bio2026`;
    const sig = await this._hashStr(sigPayload);

    const data = {
      player_id: this._playerId,
      name: this._playerName,
      score: score,
      rank: rank,
      phase: this.phase,
      evo_lv: this.eL,
      buildings: bldCount,
      techs: techDone,
      achievements: achieveCount,
      challenges: challengeCount,
      wonder: this.wonderComplete,
      online_time: Math.floor(this.stats.onlineTime),
      score_sig: sig,
      legacy_score: this.calcLegacyScore(),
      prestige_count: this.prestigeCount || 0,
      updated_at: new Date().toISOString()
    };

    try {
      // upsert: 有则更新，无则插入（基于 player_id 唯一约束）
      // 先尝试带签名字段（需要 Supabase 表有 score_sig/online_time 列）
      let error;
      ({ error } = await window.supa
        .from('leaderboard')
        .upsert(data, { onConflict: 'player_id' }));

      // 如果新列不存在，回退到不含新字段的提交
      if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('could not find') || error.message?.includes('does not exist'))) {
        delete data.score_sig;
        delete data.online_time;
        delete data.legacy_score;
        delete data.prestige_count;
        ({ error } = await window.supa
          .from('leaderboard')
          .upsert(data, { onConflict: 'player_id' }));
      }

      if (error) throw error;
      this.log('📤 分数已提交到排行榜', 's');
      this.showCursorTooltip('分数已同步！');
      this._lbLastFetch = 0;
      this._miniLbLastFetch = 0; // 刷新迷你排行榜
      this.refreshMiniLeaderboard();
    } catch (err) {
      console.error('Supabase submit error:', err);
      this.showCursorTooltip('提交失败，请检查网络');
    }
  },

  // 字符串SHA-256哈希（用于分数签名防篡改）
  async _hashStr(str) {
    try {
      const buf = new TextEncoder().encode(str);
      const hash = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('').slice(0,16);
    } catch(e) {
      // fallback: simple hash
      let h = 0;
      for (let i = 0; i < str.length; i++) { h = ((h << 5) - h + str.charCodeAt(i)) | 0; }
      return Math.abs(h).toString(16).padStart(8,'0');
    }
  },

  // ★ 转生前保存最高分到 Supabase + localStorage
  _saveHighScoreBeforePrestige() {
    const score = this.calcScore();
    // 更新 localStorage 最高分
    const oldBest = parseInt(localStorage.getItem('bioHighScore') || '0', 10);
    if (score > oldBest) {
      localStorage.setItem('bioHighScore', String(score));
    }
    // 提交到 Supabase（确保排行榜记录巅峰状态而非转生后归零）
    if (window.supaReady && window.supa && this._playerName) {
      this.submitScore(); // 提交当前分数（转生前的巅峰分）
    }
  },

  // 自动提交（save 时静默同步，节流 5 分钟一次）
  _lastAutoSubmit: 0,
  _autoSubmitScore() {
    if (!window.supaReady || !window.supa || !this._playerName) return;
    const now = Date.now();
    if (now - this._lastAutoSubmit < 300000) return;
    this._lastAutoSubmit = now;
    this.submitScore();
  },

  // === 排行榜 UI ===
  _lbActiveTab: 'current', // 'current' | 'legacy'

  showLeaderboard() {
    const pop = document.getElementById('leaderboardPopup');
    if (!pop) return;
    pop.classList.add('show');
    this._showBackdrop();
    this._lbActiveTab = 'current';
    this._updateLbTabs();
    this.refreshLeaderboard();
  },

  switchLbTab(tab) {
    this._lbActiveTab = tab;
    this._updateLbTabs();
    if (tab === 'current') {
      if (this._lbCache) this._renderLeaderboard(this._lbCache);
      else this.refreshLeaderboard();
    } else {
      if (this._legacyLbCache) this._renderLegacyLeaderboard(this._legacyLbCache);
      else this.refreshLegacyLeaderboard();
    }
  },

  _updateLbTabs() {
    document.querySelectorAll('#lbTabs .lb-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === this._lbActiveTab);
    });
  },

  closeLeaderboard() {
    this._hidePopup('leaderboardPopup');
    this._hideBackdrop();
  },

  async refreshLeaderboard() {
    const listEl = document.getElementById('leaderboardList');
    if (!listEl) return;

    if (!window.supaReady || !window.supa) {
      listEl.innerHTML = '<div style="text-align:center;color:var(--orange);padding:20px 0">⚠ 排行榜服务未连接<br><span style="font-size:0.85em;color:var(--dim)">需要配置 Supabase</span></div>';
      return;
    }

    listEl.innerHTML = '<div style="text-align:center;color:var(--dim);padding:20px 0">加载中...</div>';

    try {
      const { data, error } = await window.supa
        .from('leaderboard')
        .select('player_id, name, score, rank, phase, buildings, wonder')
        .order('score', { ascending: false })
        .limit(20);

      if (error) throw error;

      const entries = (data || []).map(r => ({
        id: r.player_id,
        name: r.name,
        score: r.score,
        rank: r.rank,
        phase: r.phase,
        buildings: r.buildings,
        wonder: r.wonder
      }));
      this._lbCache = entries;
      this._lbLastFetch = Date.now();
      // v1.0.2: 检测自己的排名并更新头衔
      this._updateRankTitle(entries);
      this._renderLeaderboard(entries);
      // 同步更新迷你排行榜
      const top3 = entries.slice(0, 3).map(e => ({ id: e.id, name: e.name, score: e.score, rank: e.rank }));
      this._miniLbCache = top3;
      this._miniLbLastFetch = Date.now();
      this._renderMiniLeaderboard(top3);
    } catch (err) {
      console.error('Supabase read error:', err);
      listEl.innerHTML = '<div style="text-align:center;color:var(--red);padding:20px 0">加载失败，请检查网络</div>';
    }
  },

  _renderLeaderboard(entries) {
    const listEl = document.getElementById('leaderboardList');
    if (!listEl) return;

    if (entries.length === 0) {
      listEl.innerHTML = '<div style="text-align:center;color:var(--dim);padding:20px 0">还没有人上榜，你来当第一名！</div>';
      return;
    }

    const myId = this._playerId;

    let html = '';
    entries.forEach((e, i) => {
      const isMe = e.id === myId;
      const rankNum = i + 1;
      const medal = rankNum <= 3 ? ['🥇','🥈','🥉'][i] : `<span style="color:var(--dim)">${rankNum}</span>`;
      const { color: rankColor } = this._scoreRank(e.score);
      const phaseStr = `P${e.phase || 1}`;
      const bldStr = `${e.buildings || 0}🏗`;
      const detailBits = [phaseStr, bldStr];
      if (e.wonder) detailBits.push('☀️');

      html += `
        <div class="lb-row ${isMe ? 'lb-me' : ''}">
          <div class="lb-rank">${medal}</div>
          <div class="lb-name" ${isMe ? 'style="color:var(--cyan)"' : ''}>${this._escHtml(e.name || '???')}${isMe ? ' <span style="font-size:0.8em;color:var(--cyan)">(我)</span>' : ''}</div>
          <div class="lb-score" style="color:${rankColor}">${formatNum(e.score || 0)}</div>
          <div class="lb-grade" style="color:${rankColor};background:${rankColor}15;border:1px solid ${rankColor}30">${e.rank || 'E'}</div>
          <div class="lb-detail">${detailBits.join(' ')}</div>
        </div>`;
    });

    if (myId && !entries.find(e => e.id === myId) && this._playerName) {
      const myScore = this.calcScore();
      const { rank, color: myColor } = this._scoreRank(myScore);
      html += `
        <div style="border-top:1px solid rgba(255,255,255,0.06);margin-top:6px;padding-top:6px">
          <div class="lb-row lb-me">
            <div class="lb-rank"><span style="color:var(--dim)">—</span></div>
            <div class="lb-name" style="color:var(--cyan)">${this._escHtml(this._playerName)} <span style="font-size:0.8em">(我)</span></div>
            <div class="lb-score" style="color:${myColor}">${formatNum(myScore)}</div>
            <div class="lb-grade" style="color:${myColor};background:${myColor}15;border:1px solid ${myColor}30">${rank}</div>
            <div class="lb-detail">P${this.phase} ${this.totalBuildings()}🏗${this.wonderComplete ? ' ☀️' : ''}</div>
          </div>
        </div>`;
    }

    listEl.innerHTML = html;
  },

  // === 迷你排行榜 (Top 3) — 显示在右侧面板总分数下方 ===
  async refreshMiniLeaderboard() {
    const listEl = document.getElementById('miniLbList');
    if (!listEl) return;

    // 30秒内不重复请求
    if (this._miniLbCache && Date.now() - this._miniLbLastFetch < 30000) {
      this._renderMiniLeaderboard(this._miniLbCache);
      return;
    }

    if (!window.supaReady || !window.supa) {
      listEl.innerHTML = '<div style="text-align:center;color:var(--dim);font-size:0.6em;padding:4px 0">服务未连接</div>';
      return;
    }

    try {
      const { data, error } = await window.supa
        .from('leaderboard')
        .select('player_id, name, score, rank')
        .order('score', { ascending: false })
        .limit(3);

      if (error) throw error;

      const entries = (data || []).map(r => ({
        id: r.player_id,
        name: r.name,
        score: r.score,
        rank: r.rank,
      }));
      this._miniLbCache = entries;
      this._miniLbLastFetch = Date.now();
      this._renderMiniLeaderboard(entries);
    } catch (err) {
      console.error('Mini leaderboard error:', err);
      listEl.innerHTML = '<div style="text-align:center;color:var(--dim);font-size:0.6em;padding:4px 0">加载失败</div>';
    }
  },

  _renderMiniLeaderboard(entries) {
    const listEl = document.getElementById('miniLbList');
    if (!listEl) return;

    if (!entries || entries.length === 0) {
      listEl.innerHTML = '<span style="color:var(--dim);font-size:0.58em">暂无数据</span>';
      return;
    }

    const myId = this._playerId;
    const medals = ['🥇', '🥈', '🥉'];

    let html = '';
    entries.forEach((e, i) => {
      const isMe = e.id === myId;
      const { color: rankColor } = this._scoreRank(e.score);
      html += `<span class="mini-lb-entry" style="display:inline-flex;align-items:center;gap:4px;${isMe ? 'color:var(--cyan)' : ''}">
        <span>${medals[i]}</span>
        <span style="max-width:80px;overflow:hidden;text-overflow:ellipsis">${this._escHtml(e.name || '???')}</span>
        <span style="color:${rankColor};font-weight:600;font-family:'Share Tech Mono',monospace">${formatNum(e.score || 0)}</span>
        <span style="color:${rankColor};font-size:0.85em;padding:1px 4px;border-radius:3px;background:${rankColor}15;border:1px solid ${rankColor}30">${e.rank || 'E'}</span>
      </span>`;
    });

    listEl.innerHTML = html;
  },

  _escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  },

  // ===== 排名头衔系统 =====
  // 排名→头衔映射
  _RANK_TITLE_DEFS: [
    { maxRank: 1,  title: '👑 至高菌皇', color: '#fbbf24', effBonus: 0.05 },
    { maxRank: 3,  title: '🏆 传奇元老', color: '#fbbf24', effBonus: 0.03 },
    { maxRank: 10, title: '⭐ 精英领主', color: '#a855f7', effBonus: 0.01 },
    { maxRank: 20, title: '🌟 荣耀先驱', color: '#3b82f6', effBonus: 0 },
  ],

  _updateRankTitle(entries) {
    const myId = this._playerId;
    if (!myId) return;
    const idx = entries.findIndex(e => e.id === myId);
    const position = idx >= 0 ? idx + 1 : 99;
    this._lbMyPosition = position;
    const oldTitle = this._lbRankTitle;
    let newTitle = null;
    for (const def of this._RANK_TITLE_DEFS) {
      if (position <= def.maxRank) {
        newTitle = { ...def, position };
        break;
      }
    }
    this._lbRankTitle = newTitle;

    // 如果头衔变化了，通知玩家
    if (newTitle && (!oldTitle || oldTitle.title !== newTitle.title)) {
      this.log(`🏅 排行榜头衔: ${newTitle.title}${newTitle.effBonus > 0 ? ` (全局效率 +${(newTitle.effBonus*100).toFixed(0)}%)` : ''}`, 's');
      if (newTitle.effBonus > 0) {
        this.showCursorTooltip(`${newTitle.title} — 效率 +${(newTitle.effBonus*100).toFixed(0)}%`);
      }
    }

    // 更新昵称显示的头衔
    this._updateTitleDisplay();
  },

  // 获取当前排名头衔的效率加成
  getRankTitleBonus() {
    return this._lbRankTitle?.effBonus || 0;
  },

  // 更新头衔在 UI 上的显示
  _updateTitleDisplay() {
    const titleEl = document.getElementById('empireTitleDisplay');
    if (!titleEl) return;
    if (this._lbRankTitle) {
      // 排名头衔优先级高于帝国称号，追加显示
      const lbBadge = document.getElementById('lbRankBadge');
      if (!lbBadge) {
        const badge = document.createElement('span');
        badge.id = 'lbRankBadge';
        badge.style.cssText = `font-size:0.72em;color:${this._lbRankTitle.color};margin-left:6px;`;
        badge.textContent = `[${this._lbRankTitle.title}]`;
        titleEl.parentElement?.appendChild(badge);
      } else {
        lbBadge.textContent = `[${this._lbRankTitle.title}]`;
        lbBadge.style.color = this._lbRankTitle.color;
      }
    }
  },

  // ===== 传奇榜（Legacy Leaderboard）=====
  _legacyLbCache: null,
  _legacyLbLastFetch: 0,

  async refreshLegacyLeaderboard() {
    const listEl = document.getElementById('leaderboardList');
    if (!listEl) return;

    if (!window.supaReady || !window.supa) {
      listEl.innerHTML = '<div style="text-align:center;color:var(--orange);padding:20px 0">⚠ 排行榜服务未连接</div>';
      return;
    }

    listEl.innerHTML = '<div style="text-align:center;color:var(--dim);padding:20px 0">加载传奇榜...</div>';

    try {
      // 尝试按 legacy_score 排序获取传奇榜数据
      const { data, error } = await window.supa
        .from('leaderboard')
        .select('player_id, name, score, rank, phase, buildings, wonder, legacy_score, prestige_count')
        .order('legacy_score', { ascending: false })
        .limit(20);

      if (error) {
        // 如果 legacy_score 列不存在，回退到按 score 排序 + 本地计算
        if (error.message?.includes('does not exist') || error.code === '42703') {
          this._renderLegacyFallback();
          return;
        }
        throw error;
      }

      const entries = (data || []).map(r => ({
        id: r.player_id,
        name: r.name,
        score: r.score,
        rank: r.rank,
        phase: r.phase,
        buildings: r.buildings,
        wonder: r.wonder,
        legacyScore: r.legacy_score || r.score,
        prestigeCount: r.prestige_count || 0,
      }));
      this._legacyLbCache = entries;
      this._legacyLbLastFetch = Date.now();
      this._renderLegacyLeaderboard(entries);
    } catch (err) {
      console.error('Legacy leaderboard error:', err);
      listEl.innerHTML = '<div style="text-align:center;color:var(--red);padding:20px 0">加载失败</div>';
    }
  },

  // 传奇榜 legacy_score 列不存在时的回退方案（用 score 代替）
  _renderLegacyFallback() {
    const listEl = document.getElementById('leaderboardList');
    if (!listEl) return;
    // 使用缓存的当世榜数据，添加本地传奇分
    const entries = (this._lbCache || []).map(e => ({
      ...e,
      legacyScore: e.score,
      prestigeCount: 0,
    }));
    // 把自己的真实传奇分加上
    const myId = this._playerId;
    const myEntry = entries.find(e => e.id === myId);
    if (myEntry) {
      myEntry.legacyScore = this.calcLegacyScore();
      myEntry.prestigeCount = this.prestigeCount || 0;
    }
    entries.sort((a, b) => b.legacyScore - a.legacyScore);
    this._legacyLbCache = entries;
    this._renderLegacyLeaderboard(entries);
  },

  _renderLegacyLeaderboard(entries) {
    const listEl = document.getElementById('leaderboardList');
    if (!listEl) return;
    if (this._lbActiveTab !== 'legacy') return; // 防止 tab 切换竞态

    if (!entries || entries.length === 0) {
      listEl.innerHTML = '<div style="text-align:center;color:var(--dim);padding:20px 0">传奇榜暂无数据，快去冲击更高排名！</div>';
      return;
    }

    const myId = this._playerId;
    // 排名头衔映射
    const RANK_TITLES = [
      { rank: 1, title: '👑 至高菌皇', color: '#fbbf24' },
      { rank: 2, title: '🏆 传奇元老', color: '#fbbf24' },
      { rank: 3, title: '🏆 传奇元老', color: '#fbbf24' },
    ];

    let html = '<div class="lb-legacy-title"><span>🏛️</span><span>传奇榜 — 跨世累计成就</span></div>';
    entries.forEach((e, i) => {
      const isMe = e.id === myId;
      const rankNum = i + 1;
      const medal = rankNum <= 3 ? ['🥇','🥈','🥉'][i] : `<span style="color:var(--dim)">${rankNum}</span>`;
      const { color: rankColor } = this._scoreRank(e.legacyScore || e.score);
      const titleInfo = RANK_TITLES.find(t => t.rank === rankNum);
      const titleBadge = titleInfo ? `<span style="font-size:0.72em;color:${titleInfo.color}">${titleInfo.title}</span>` : '';
      const prestStr = e.prestigeCount > 0 ? `♻️${e.prestigeCount}世` : '';
      const detailBits = [prestStr, `P${e.phase || 1}`].filter(Boolean);
      if (e.wonder) detailBits.push('☀️');

      html += `
        <div class="lb-row ${isMe ? 'lb-me' : ''}">
          <div class="lb-rank">${medal}</div>
          <div class="lb-name" ${isMe ? 'style="color:var(--cyan)"' : ''}>${this._escHtml(e.name || '???')}${isMe ? ' <span style="font-size:0.8em;color:var(--cyan)">(我)</span>' : ''} ${titleBadge}</div>
          <div class="lb-score" style="color:${rankColor}">${formatNum(e.legacyScore || e.score || 0)}</div>
          <div class="lb-grade" style="color:${rankColor};background:${rankColor}15;border:1px solid ${rankColor}30">${e.rank || 'E'}</div>
          <div class="lb-detail">${detailBits.join(' ')}</div>
        </div>`;
    });

    // 如果自己不在列表中
    if (myId && !entries.find(e => e.id === myId) && this._playerName) {
      const myLegacy = this.calcLegacyScore();
      const { rank, color: myColor } = this._scoreRank(myLegacy);
      html += `
        <div style="border-top:1px solid rgba(255,255,255,0.06);margin-top:6px;padding-top:6px">
          <div class="lb-row lb-me">
            <div class="lb-rank"><span style="color:var(--dim)">—</span></div>
            <div class="lb-name" style="color:var(--cyan)">${this._escHtml(this._playerName)} <span style="font-size:0.8em">(我)</span></div>
            <div class="lb-score" style="color:${myColor}">${formatNum(myLegacy)}</div>
            <div class="lb-grade" style="color:${myColor};background:${myColor}15;border:1px solid ${myColor}30">${rank}</div>
            <div class="lb-detail">♻️${this.prestigeCount || 0}世 P${this.phase}</div>
          </div>
        </div>`;
    }

    listEl.innerHTML = html;
  },

  // ===== 游戏修改建议 =====
  _suggLoaded: false,
  _suggCache: [],
  _suggLastFetch: 0,
  _suggLastSubmit: 0,   // 上次提交时间（限流用）
  _suggDailyCount: 0,   // 今日提交数
  _suggDailyDate: '',    // 今日日期标记

  toggleSuggestionBar() {
    const bar = document.getElementById('suggestionBar');
    if (!bar) return;
    bar.classList.toggle('collapsed');
    SFX.click();
    // 展开时自动加载建议
    if (!bar.classList.contains('collapsed') && !this._suggLoaded) {
      this.loadSuggestions();
    }
  },

  async submitSuggestion() {
    const input = document.getElementById('suggInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) { this.showCursorTooltip('请输入建议内容'); return; }
    if (text.length > 200) { this.showCursorTooltip('建议内容不能超过200字'); return; }

    // === 频率限制 ===
    const now = Date.now();
    // 30秒冷却
    const cooldown = 30000;
    if (now - this._suggLastSubmit < cooldown) {
      const wait = Math.ceil((cooldown - (now - this._suggLastSubmit)) / 1000);
      this.showCursorTooltip(`请等待 ${wait} 秒后再提交`);
      return;
    }
    // 每日上限10条
    const today = new Date().toDateString();
    if (this._suggDailyDate !== today) { this._suggDailyDate = today; this._suggDailyCount = 0; }
    if (this._suggDailyCount >= 10) {
      this.showCursorTooltip('今日建议已达上限（10条/天）');
      return;
    }

    if (!window.supaReady || !window.supa) {
      this.showCursorTooltip('服务未连接，无法提交');
      return;
    }

    const name = this._playerName || '匿名菌落';
    const { error } = await window.supa.from('suggestions').insert({
      player_id: this._playerId || 'anon',
      player_name: name,
      content: text
    });

    if (error) {
      console.error('提交建议失败:', error);
      this.showCursorTooltip('提交失败，请稍后重试');
      return;
    }

    this._suggLastSubmit = now;
    this._suggDailyCount++;
    input.value = '';
    this.log('💡 建议已提交，感谢反馈！', 's');
    this.showCursorTooltip('建议已提交 ✓');
    SFX.click();
    // 刷新列表
    this.loadSuggestions();
  },

  async loadSuggestions() {
    if (!window.supaReady || !window.supa) return;

    const listEl = document.getElementById('suggList');
    if (!listEl) return;
    listEl.innerHTML = '<div class="suggestion-loading">加载中...</div>';

    const { data, error } = await window.supa
      .from('suggestions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('加载建议失败:', error);
      listEl.innerHTML = '<div class="suggestion-empty">加载失败，点击刷新重试</div>';
      return;
    }

    this._suggLoaded = true;
    this._suggCache = data || [];
    this._suggLastFetch = Date.now();
    this._renderSuggestions();
  },

  _renderSuggestions() {
    const listEl = document.getElementById('suggList');
    if (!listEl) return;

    if (!this._suggCache.length) {
      listEl.innerHTML = '<div class="suggestion-empty">暂无建议，快来留下第一条吧 ✨</div>';
      return;
    }

    let html = '';
    this._suggCache.forEach(s => {
      const time = this._formatSuggTime(s.created_at);
      html += `<div class="suggestion-item">
        <span class="sugg-name">${this._escHtml(s.player_name || '匿名')}</span>
        <span class="sugg-text">${this._escHtml(s.content)}</span>
        <span class="sugg-time">${time}</span>
      </div>`;
    });
    listEl.innerHTML = html;
  },

  _formatSuggTime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
    return (d.getMonth() + 1) + '/' + d.getDate();
  },

  // ===== ADJACENCY SYSTEM =====
  // 获取格子idx的四方向邻居（上下左右）
  getNeighbors(idx) {
    const cols = this.gridCols;
    const rows = this.gridRows;
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    const neighbors = [];
    if (r > 0)        neighbors.push(idx - cols); // 上
    if (r < rows - 1) neighbors.push(idx + cols); // 下
    if (c > 0)        neighbors.push(idx - 1);    // 左
    if (c < cols - 1) neighbors.push(idx + 1);    // 右
    return neighbors;
  },

  // 计算某个格子的邻接加成总乘数
  // 返回 { bonus: 总加成值, details: [{name, icon, bonus, count}] }
  getAdjacencyBonus(idx) {
    const g = this.grid[idx];
    if (!g) return { bonus: 0, details: [] };
    const selfType = g.type;
    const bd = BLDS[selfType];
    if (!bd || bd.isBoost || bd.isWonder) return { bonus: 0, details: [] }; // 增益型/奇观建筑不享受邻接加成

    const neighbors = this.getNeighbors(idx);
    const neighborTypes = {};
    for (const ni of neighbors) {
      const ng = this.grid[ni];
      if (ng && ng.type) {
        neighborTypes[ng.type] = (neighborTypes[ng.type] || 0) + 1;
      }
    }

    let totalBonus = 0;
    const details = [];

    for (const rule of ADJACENCY_RULES) {
      // ★ 改进3：邻接规则渐进解锁 — 只启用当前阶段已解锁的规则
      if (rule.phase && rule.phase > this.phase) continue;

      // 检查 self 匹配
      if (rule.self !== '*' && rule.self !== selfType) continue;
      // self='*' 但排除增益型建筑自身（已在上方排除）

      const nCount = neighborTypes[rule.neighbor] || 0;
      if (nCount === 0) continue;

      const stacks = rule.stackable ? Math.min(nCount, rule.maxStack || 1) : (nCount > 0 ? 1 : 0);
      if (stacks === 0) continue;

      const ruleBonus = rule.bonus * stacks;
      totalBonus += ruleBonus;
      details.push({ name: rule.name, icon: rule.icon, bonus: ruleBonus, count: stacks });
      // v2.1 §10.4: 追踪已发现的邻接规则
      const rIdx = ADJACENCY_RULES.indexOf(rule);
      if (!this._discoveredAdj) this._discoveredAdj = {};
      if (!this._discoveredAdj[rIdx]) {
        this._discoveredAdj[rIdx] = true;
        // v3.0 §9.1: 邻接发现奖励
        const adjCount = Object.keys(this._discoveredAdj).length;
        // 连续发现追踪（30秒窗口）
        const now = Date.now();
        if (!this._adjDiscoverTimes) this._adjDiscoverTimes = [];
        this._adjDiscoverTimes.push(now);
        // 清理30秒前的记录
        this._adjDiscoverTimes = this._adjDiscoverTimes.filter(t => now - t < 30000);
        const streak = this._adjDiscoverTimes.length;
        // 基础奖励: +5⚡ +3🟢
        let rewardMult = 1.0;
        if (streak >= 2) rewardMult = 1.5; // 连续发现+50%
        const eReward = Math.round(5 * rewardMult);
        const gReward = Math.round(3 * rewardMult);
        this.res.energy = (this.res.energy || 0) + eReward;
        this.res.glucose = (this.res.glucose || 0) + gReward;
        const streakStr = streak >= 2 ? ` 🔥×${streak}连续!` : '';
        this.log(`🔗 发现邻接: ${rule.icon} ${rule.name} — +${eReward}⚡ +${gReward}🟢${streakStr} (${adjCount}条)`, 'ev');
        this.showMilestone(rule.icon, rule.name);
        // 每5条里程碑: 临时+5%产出60秒
        if (adjCount > 0 && adjCount % 5 === 0) {
          this._adjMilestoneBonus = (this._adjMilestoneBonus || 0) + 0.05;
          this.log(`📊 邻接里程碑 ${adjCount}条! +5%产出加成(60秒)`, 's');
          setTimeout(() => {
            this._adjMilestoneBonus = Math.max(0, (this._adjMilestoneBonus || 0) - 0.05);
          }, 60000);
        }
      }
    }

    // v2.0 §10.5: 虚拟邻接（传送带直连建筑，加成为物理邻接的50%，最多2条）
    const belts = this._activeBelts || [];
    const virtualNeighborTypes = {};
    let virtualCount = 0;
    const MAX_VIRTUAL = 2;

    for (const belt of belts) {
      if (virtualCount >= MAX_VIRTUAL) break;
      let otherIdx = -1;
      if (belt.fi === idx) otherIdx = belt.ti;
      else if (belt.ti === idx) otherIdx = belt.fi;
      else continue;

      // 跳过已是物理邻居的（已在上面统计）
      if (neighbors.includes(otherIdx)) continue;

      const otherType = this.grid[otherIdx]?.type;
      if (!otherType) continue;
      virtualNeighborTypes[otherType] = (virtualNeighborTypes[otherType] || 0) + 1;
      virtualCount++;
    }

    if (virtualCount > 0) {
      for (const rule of ADJACENCY_RULES) {
        if (rule.phase && rule.phase > this.phase) continue;
        if (rule.self !== '*' && rule.self !== selfType) continue;
        const vCount = virtualNeighborTypes[rule.neighbor] || 0;
        if (vCount === 0) continue;

        const stacks = rule.stackable ? Math.min(vCount, rule.maxStack || 1) : (vCount > 0 ? 1 : 0);
        if (stacks === 0) continue;

        const ruleBonus = rule.bonus * stacks * 0.5; // 虚拟邻接50%
        totalBonus += ruleBonus;
        details.push({ name: rule.name + '(管线)', icon: '🔗', bonus: ruleBonus, count: stacks });

        // v3.0 §9.1: 虚拟邻接发现追踪 + 远距专属奖励
        const vRIdx = ADJACENCY_RULES.indexOf(rule);
        const vKey = 'v' + vRIdx; // 虚拟发现用 'v' 前缀区分
        if (!this._discoveredAdj) this._discoveredAdj = {};
        if (!this._discoveredAdj[vKey]) {
          this._discoveredAdj[vKey] = true;
          // 同时标记物理索引（使邻接图鉴也显示为已发现）
          if (!this._discoveredAdj[vRIdx]) this._discoveredAdj[vRIdx] = true;
          // 远距专属奖励: +8⚡ + "远程共振" badge
          this.res.energy = (this.res.energy || 0) + 8;
          this.log(`📡 远程共振! 发现管线邻接: ${rule.icon} ${rule.name}(管线) — +8⚡`, 'ev');
          this.showMilestone('📡', '远程共振·' + rule.name);
          if (typeof SFX !== 'undefined') SFX.milestone();
          // 也纳入总邻接计数（影响里程碑等）
          const totalAdj = Object.keys(this._discoveredAdj).length;
          if (totalAdj > 0 && totalAdj % 5 === 0) {
            this._adjMilestoneBonus = (this._adjMilestoneBonus || 0) + 0.05;
            this.log(`📊 邻接里程碑 ${totalAdj}条! +5%产出加成(60秒)`, 's');
            setTimeout(() => {
              this._adjMilestoneBonus = Math.max(0, (this._adjMilestoneBonus || 0) - 0.05);
            }, 60000);
          }
        }
      }
    }

    // ★ Q4：突变邻接加成增幅
    const mutAdjBonus = this._mutActiveEffects.adjacencyBonus || 0;
    if (mutAdjBonus > 0 && totalBonus > 0) {
      const extra = totalBonus * mutAdjBonus;
      totalBonus += extra;
      details.push({ name: '突变增幅', icon: '🧬', bonus: extra, count: 1 });
    }

    // v3.0 §9.2: 建筑特化邻接加成（biofilm_adj）
    const specPerBld = this._specCache?.perBuilding?.[idx];
    if (specPerBld?.adjBonusMult && totalBonus > 0) {
      const extra = totalBonus * (specPerBld.adjBonusMult - 1);
      totalBonus += extra;
      details.push({ name: '特化增幅', icon: '🛡️', bonus: extra, count: 1 });
    }

    // v3.0 §8.3: 邻接催化剂加成
    const catAdjValue = this._getCatalystValue('adjMult');
    if (catAdjValue > 0 && totalBonus > 0) {
      const extra = totalBonus * catAdjValue;
      totalBonus += extra;
      details.push({ name: '催化增幅', icon: '🔗', bonus: extra, count: 1 });
    }

    return { bonus: totalBonus, details };
  },

  // ★ 改进3：获取当前阶段已解锁的邻接规则数量
  getUnlockedAdjacencyCount() {
    return ADJACENCY_RULES.filter(r => !r.phase || r.phase <= this.phase).length;
  },

  // ★ v0.9.3：全局邻接加成统计（带5秒缓存，避免重复计算）
  _adjStatsCache: null,
  _adjStatsCacheTime: 0,
  _getAdjStats() {
    const now = Date.now();
    if (this._adjStatsCache && now - this._adjStatsCacheTime < 5000) return this._adjStatsCache;
    let totalBonus = 0, adjCount = 0, bestIdx = -1, bestBonus = 0;
    const top5 = [];
    for (let i = 0; i < this.grid.length; i++) {
      if (!this.grid[i]) continue;
      const adj = this.getAdjacencyBonus(i);
      if (adj.bonus > 0) {
        adjCount++;
        totalBonus += adj.bonus;
        top5.push({ idx: i, type: this.grid[i].type, bonus: adj.bonus, details: adj.details });
        if (adj.bonus > bestBonus) { bestBonus = adj.bonus; bestIdx = i; }
      }
    }
    top5.sort((a, b) => b.bonus - a.bonus);
    this._adjStatsCache = { totalBonus, adjCount, bestIdx, bestBonus, top5: top5.slice(0, 5) };
    this._adjStatsCacheTime = now;
    return this._adjStatsCache;
  },

  // 强制刷新邻接统计缓存
  _invalidateAdjStats() {
    this._adjStatsCacheTime = 0;
  },

  // v2.1 §10.4: 邻接图鉴面板
  showAdjGuide() {
    const disc = this._discoveredAdj || {};
    const discovered = Object.keys(disc).length;
    const unlocked = this.getUnlockedAdjacencyCount();
    const total = ADJACENCY_RULES.length;
    const pct = unlocked > 0 ? Math.round(discovered / unlocked * 100) : 0;

    // 分类显示
    const categories = {
      '同类协同': [], '核心供给链': [], '特殊增益': [],
      '跨阶段协同': [], '旁路专属': [], '发酵液泡': [],
    };
    const catNames = ['同类协同', '核心供给链', '特殊增益', '跨阶段协同', '旁路专属', '发酵液泡'];
    let catIdx = 0;
    for (let i = 0; i < ADJACENCY_RULES.length; i++) {
      const rule = ADJACENCY_RULES[i];
      // 根据规则索引确定类别（参照ADJACENCY_RULES的分段注释）
      if (i <= 6) catIdx = 0;
      else if (i <= 39) catIdx = 1;
      else if (i <= 46) catIdx = 2;
      else if (i <= 54) catIdx = 3;
      else if (i <= 67) catIdx = 4;
      else catIdx = 5;
      const cat = catNames[catIdx];
      const isUnlocked = !rule.phase || rule.phase <= this.phase;
      const isDiscovered = !!disc[i];
      categories[cat].push({ rule, idx: i, isUnlocked, isDiscovered });
    }

    let html = `<div style="max-height:70vh;overflow-y:auto;padding:8px">`;
    html += `<div style="text-align:center;margin-bottom:8px">`;
    html += `<div style="font-size:1.1em;font-weight:700;color:var(--cyan)">🔗 邻接图鉴</div>`;
    html += `<div style="color:var(--dim);font-size:0.8em;margin-top:4px">已发现 ${discovered}/${unlocked} | 解锁率 ${pct}% | 总规则 ${total}</div>`;
    // 进度条
    html += `<div style="width:100%;height:6px;background:#333;border-radius:3px;margin-top:6px"><div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#14b8a6,#06d6a0);border-radius:3px;transition:width 0.3s"></div></div>`;
    html += `</div>`;

    for (const catName of catNames) {
      const items = categories[catName];
      if (items.length === 0) continue;
      const discCount = items.filter(it => it.isDiscovered).length;
      html += `<div style="margin-top:10px;font-weight:600;color:#ccc;font-size:0.78em;border-bottom:1px solid #333;padding-bottom:3px">${catName} <span style="color:var(--dim)">(${discCount}/${items.length})</span></div>`;
      for (const it of items) {
        if (!it.isUnlocked) {
          html += `<div style="font-size:0.7em;color:#555;padding:2px 4px">🔒 ???×??? <span style="font-size:0.85em">(P${it.rule.phase}解锁)</span></div>`;
        } else if (!it.isDiscovered) {
          html += `<div style="font-size:0.7em;color:#666;padding:2px 4px">❓ ${BLDS[it.rule.self]?.n || '通用'}×??? <span style="font-size:0.85em">(+?%)</span></div>`;
        } else {
          const selfName = it.rule.self === '*' ? '通用' : (BLDS[it.rule.self]?.n || it.rule.self);
          const neighborName = BLDS[it.rule.neighbor]?.n || it.rule.neighbor;
          html += `<div style="font-size:0.7em;color:#aaa;padding:2px 4px">`;
          html += `${it.rule.icon} <span style="color:#06d6a0;font-weight:600">${it.rule.name}</span> <span style="color:#22c55e">+${Math.round(it.rule.bonus*100)}%</span> — ${selfName} ← ${neighborName}`;
          if (it.rule.stackable) html += ` <span style="color:var(--dim)">(max×${it.rule.maxStack})</span>`;
          html += `</div>`;
        }
      }
    }
    html += `</div>`;
    // 使用自定义覆盖层
    const overlay = document.createElement('div');
    overlay.id = 'adjGuideOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center';
    overlay.innerHTML = `<div style="background:#1a1a2e;border:1px solid #14b8a640;border-radius:8px;padding:16px;max-width:420px;width:90%;max-height:80vh;overflow-y:auto;position:relative">
      <button onclick="document.getElementById('adjGuideOverlay').remove()" style="position:absolute;top:8px;right:12px;background:none;border:none;color:#888;font-size:1.2em;cursor:pointer">✕</button>
      ${html}
    </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  },

  // ★ 方案F：计算所有多输入建筑的供给同步加成
  // 返回并缓存到 this._syncBonuses
  computeSyncBonuses() {
    if (this.phase < 3) { this._syncBonuses = {}; return; } // P1-P2隐藏
    const newSync = {};
    const belts = this._activeBelts || [];

    this.grid.forEach((g, idx) => {
      if (!g) return;
      const bd = BLDS[g.type];
      if (!bd || bd.isBoost || bd.isWonder) return;
      if (!bd.cons || Object.keys(bd.cons).length < 2) return; // 只对多输入建筑

      // 找到此建筑需要的所有输入资源类型
      const neededRes = Object.keys(bd.cons);
      const inputFills = {}; // { resKey: 充裕度0~1 }

      for (const resKey of neededRes) {
        // 找到提供此资源的输入传送带
        let supplyCap = 0;
        const demand = bd.cons[resKey] * (this.getUpgradeMultiplier(idx) || 1);

        for (const belt of belts) {
          if (belt.ti !== idx && belt.fi !== idx) continue;
          const otherIdx = belt.fi === idx ? belt.ti : belt.fi;
          const otherG = this.grid[otherIdx];
          if (!otherG) continue;
          const otherBd = BLDS[otherG.type];
          if (!otherBd) continue;

          // 检查对端是否产出此资源且 FLOW_MAP 匹配
          if (otherBd.prod && otherBd.prod[resKey]) {
            const isValid = FLOW_TRIPLE.has(otherG.type + '|' + g.type + '|' + resKey);
            if (isValid) {
              const key = Math.min(belt.fi, belt.ti) + '-' + Math.max(belt.fi, belt.ti);
              supplyCap += otherBd.prod[resKey] * (this.getUpgradeMultiplier(otherIdx) || 1) * this.getBeltEfficiency(key);
            }
          }
        }

        // 充裕度 = min(1, 供给/需求)
        inputFills[resKey] = demand > 0 ? Math.min(1, supplyCap / demand) : 1;
      }

      // 同步度 = 所有输入充裕度的最小值（短板效应）
      const fills = Object.values(inputFills);
      if (fills.length === 0) return;
      const syncLevel = Math.min(...fills);

      // 加成 = 同步度 × 最大加成(25%) × 输入数量修正
      // 2输入最高15%, 3输入最高25%, 4+输入最高30%
      const maxBonus = fills.length >= 4 ? 0.30 : fills.length >= 3 ? 0.25 : 0.15;
      const bonus = syncLevel >= 0.5 ? (syncLevel - 0.5) * 2 * maxBonus : 0; // 50%以下无加成

      const inputs = neededRes.map(r => ({
        res: r, fill: inputFills[r],
        icon: RES[r]?.icon || '?', name: RES[r]?.n || r,
        color: RES[r]?.c || '#888'
      }));

      newSync[idx] = { sync: syncLevel, bonus, inputs, inputCount: fills.length };
    });

    // ★ 教学：检测同步度阈值跨越，触发浮动文字
    for (const idx in newSync) {
      const cur = newSync[idx];
      const prev = this._prevSyncState[idx];
      if (cur.bonus > 0.01 && (!prev || prev.bonus < 0.01)) {
        // 从无加成→有加成：弹出正面浮标
        const pct = Math.round(cur.bonus * 100);
        const bd = BLDS[this.grid[idx]?.type];
        this.showFloat(+idx, `⚡+${pct}%同步`, '#fbbf24');
        if (bd) this.log(`⚡ ${bd.emoji||''}${bd.n} 供给同步! +${pct}%`, 's');
      } else if ((!cur || cur.bonus < 0.01) && prev && prev.bonus > 0.01) {
        // 从有加成→无加成：弹出负面浮标
        this.showFloat(+idx, `⚠供给失衡`, '#f97316');
      }
    }

    this._prevSyncState = {};
    for (const idx in newSync) {
      this._prevSyncState[idx] = { bonus: newSync[idx].bonus };
    }
    this._syncBonuses = newSync;

    // ★ P1-3: 用 prevSync keys 定向清除旧 class（避免 querySelectorAll 全局扫描）
    const gridEl = document.getElementById('grid');
    if (gridEl) {
      // 清除上一轮有同步状态的 cell
      for (const pidx in this._prevSyncState) {
        const cell = gridEl.children[pidx];
        if (cell) cell.classList.remove('sync-active', 'sync-perfect');
      }
      // 设置新的同步状态
      for (const idx in newSync) {
        const cell = gridEl.children[idx];
        if (!cell) continue;
        const sb = newSync[idx];
        if (sb.bonus > 0.01) {
          cell.classList.add('sync-active');
          if (sb.sync >= 0.85) cell.classList.add('sync-perfect');
        }
      }
    }
  },

  // ★ 方案F：获取建筑的供给同步信息（供tooltip/UI使用）
  getSyncInfo(idx) {
    return this._syncBonuses[idx] || null;
  },

  // ★ 方案A：传送带连击系统
  addBeltCombo() {
    this._beltCombo++;
    // 记录最高连击数（供成就检测）
    if (!this.stats.maxBeltCombo || this._beltCombo > this.stats.maxBeltCombo) {
      this.stats.maxBeltCombo = this._beltCombo;
    }
    if (this._beltComboTimer) clearTimeout(this._beltComboTimer);
    this._beltComboTimer = setTimeout(() => { this._beltCombo = 0; }, 4000);

    if (this._beltCombo >= 2) {
      const bonus = Math.min(this._beltCombo * 2, 20);
      this.res.energy = (this.res.energy || 0) + bonus;
      // 连击浮标
      const comboEl = document.getElementById('comboPopup');
      if (comboEl) {
        document.getElementById('comboCount').textContent = `${this._beltCombo}连线!`;
        document.getElementById('comboBonus').textContent = `+${bonus}⚡ 连线奖励`;
        this._hidePopup(comboEl);
        void comboEl.offsetWidth;
        this._showPopup(comboEl);
        setTimeout(() => this._hidePopup(comboEl), 2000);
      }
      SFX.combo(this._beltCombo);
      if (this._beltCombo >= 3) this.screenShake(3);
    }
  },

  // ★ 方案A：传送带连接爆发特效
  beltConnectBurst(fromIdx, toIdx) {
    const gridEl = document.getElementById('grid');
    if (!gridEl) return;
    const cell1 = gridEl.children[fromIdx];
    const cell2 = gridEl.children[toIdx];

    // 两端格子都爆发粒子（青色系）
    [cell1, cell2].forEach(cell => {
      if (!cell) return;
      for (let i = 0; i < 8; i++) {
        const p = document.createElement('div');
        p.className = 'burst-particle';
        p.style.setProperty('--color', '#06d6a0');
        p.style.setProperty('--angle', (i * 45) + 'deg');
        p.style.setProperty('--dist', (15 + Math.random() * 20) + 'px');
        cell.appendChild(p);
        setTimeout(() => p.remove(), 700);
      }
    });

    // 连接线闪光
    if (cell1) {
      const ring = document.createElement('div');
      ring.className = 'burst-ring';
      ring.style.borderColor = '#06d6a0';
      cell1.appendChild(ring);
      setTimeout(() => ring.remove(), 600);
    }
  },

  // ===== UTILITY =====
  checkRes(cost) { if (this._creativeMode) return true; for (let k in cost) if ((this.res[k]||0) < cost[k]) return false; return true; },
  spend(cost) { if (this._creativeMode) return; for (let k in cost) this.res[k] -= cost[k]; },

  bldCount(type) {
    return this.grid.filter(g => g && g.type === type).length;
  },

  totalBuildings() {
    return this.grid.filter(g => g !== null).length;
  },

  // 种群上限：基于建筑数量和阶段（+科技加成）
  _popCap() {
    return 50 + this.totalBuildings() * 40 + (this.phase - 1) * 100 + (this._popCapBonus || 0);
  },

  // ===== 菌群分工系统 =====
  // 调整菌群分工比例（type = 'harvest'|'research'|'logistics', delta = ±5）
  adjustPopAlloc(type, delta) {
    // 种群不足3时禁止调整分工
    if (this.pop < 3) return;
    const keys = ['harvest', 'research', 'logistics'];
    const others = keys.filter(k => k !== type);
    const newVal = Math.max(0, Math.min(100, this.popAlloc[type] + delta));
    const actualDelta = newVal - this.popAlloc[type];
    if (actualDelta === 0) return;

    this.popAlloc[type] = newVal;
    // 从其他两项中按比例扣减/增加
    const otherTotal = others.reduce((s, k) => s + this.popAlloc[k], 0);
    if (otherTotal > 0) {
      let remaining = -actualDelta;
      for (const k of others) {
        const share = this.popAlloc[k] / otherTotal;
        const change = Math.round(remaining * share);
        this.popAlloc[k] = Math.max(0, this.popAlloc[k] + change);
      }
    }
    // 修正舍入误差，确保总和 = 100
    const total = keys.reduce((s, k) => s + this.popAlloc[k], 0);
    if (total !== 100) {
      // 把差额加到/减到当前非零的最大项上
      const diff = 100 - total;
      const maxKey = keys.reduce((a, b) => this.popAlloc[a] >= this.popAlloc[b] ? a : b);
      this.popAlloc[maxKey] += diff;
    }
    this.updatePopAllocUI();
    this.save(true);
  },

  // 菌群分工预设
  setPopAllocPreset(preset) {
    if (this.pop < 3) return;
    switch (preset) {
      case 'balanced': this.popAlloc = { harvest: 34, research: 33, logistics: 33 }; break;
      case 'harvest':  this.popAlloc = { harvest: 60, research: 20, logistics: 20 }; break;
      case 'research': this.popAlloc = { harvest: 20, research: 60, logistics: 20 }; break;
      case 'logistics':this.popAlloc = { harvest: 20, research: 20, logistics: 60 }; break;
    }
    this.updatePopAllocUI();
    this.save(true);
  },

  // 获取菌群分工加成描述
  getPopAllocBonuses() {
    const cap = this._popCap();
    const pop = Math.min(this.pop, cap);
    const popEffMult = this._popEffMult || 1;
    const harvestPop = pop * (this.popAlloc.harvest / 100);
    const researchPop = pop * (this.popAlloc.research / 100);
    const logisticsPop = pop * (this.popAlloc.logistics / 100);
    return {
      harvest: { pop: Math.floor(harvestPop), bonus: formatNum(harvestPop * BALANCE.popHarvestBonus * popEffMult * 100, 1) },
      research: { pop: Math.floor(researchPop), bonus: formatNum(researchPop * 0.002 * 100, 1) },
      logistics: { pop: Math.floor(logisticsPop), bonus: formatNum(logisticsPop * BALANCE.popLogisticsBonus * 100, 1) },
    };
  },

  updatePopAllocUI() {
    const bonuses = this.getPopAllocBonuses();
    const els = {
      harvest: document.getElementById('allocHarvest'),
      research: document.getElementById('allocResearch'),
      logistics: document.getElementById('allocLogistics'),
    };
    for (const [key, el] of Object.entries(els)) {
      if (!el) continue;
      el.querySelector('.alloc-pct').textContent = this.popAlloc[key] + '%';
      el.querySelector('.alloc-bar-fill').style.width = this.popAlloc[key] + '%';
      // ARIA: 同步分配进度
      el.querySelector('.ch-bar[role="progressbar"]')?.setAttribute('aria-valuenow', this.popAlloc[key]);
      const info = el.querySelector('.alloc-info');
      if (info) info.textContent = `${bonuses[key].pop}菌 +${bonuses[key].bonus}%`;
    }
  },

  // 递增造价：已有N个同类建筑 → 造价 = 基础造价 × COST_SCALE^N
  scaledCost(key) {
    const bd = BLDS[key];
    const n = this.bldCount(key);
    const discount = 1 - Math.min(this._costDiscount || 0, 0.5); // 最多减50%
    const scaled = {};
    for (let k in bd.cost) {
      scaled[k] = Math.ceil(bd.cost[k] * Math.pow(COST_SCALE, n) * discount);
    }
    return scaled;
  },

  // ===== P1-1: 统一刷新方法 — 替代散落的"四件套"模式 =====
  // 根据需要的刷新级别调用对应子系统，避免不必要的全量重绘
  refreshAll(opts) {
    const o = opts || {};
    if (o.grid !== false)      this.renderGrid();
    if (o.rates !== false)     this.updateRates();
    if (o.buildings !== false) this.renderBuildings();
    if (o.ui !== false)        this.updateUI();
  },

  // ===== P2-3: 传送带渲染用建筑流量计算 — 消除 3 处重复 =====
  // 给定建筑索引和资源key，返回该建筑该资源的近似产出速率（用于传送带粒子动画）
  _calcBuildingFlowRate(buildingIdx, resKey) {
    const g = this.grid[buildingIdx];
    if (!g) return 0;
    const bd = BLDS[g.type];
    if (!bd || !bd.prod[resKey]) return 0;
    const bldMult = this.getUpgradeMultiplier(buildingIdx);
    const beltMult = this.getBeltMultiplierForBuilding(buildingIdx);
    const hPop = Math.min(this.pop, this._popCap()) * (this.popAlloc.harvest / 100);
    const fullMult = this.gEff * (1 + hPop * BALANCE.popHarvestBonus * (this._popEffMult || 1)) * bldMult * beltMult * this.lEff * (this._prodMult || 1);
    const qsCap = BALANCE.qsBaseCap + (this._qsCapBonus || 0);
    const qsBoost = this.qsLv > 0 ? (1 + Math.min(this.qsLv * BALANCE.qsBoostPerLevel, qsCap)) : 1;
    return bd.prod[resKey] * fullMult * qsBoost;
  },

  // ===== RATES ===== (P0-2/P0-3: 单次遍历优化)
  updateRates() {
    const r = {};
    for (let k in RES) r[k] = 0;

    // ★ Q1：收支明细追踪
    const breakdown = {};
    for (let k in RES) breakdown[k] = { prod: 0, bldCons: 0, maint: 0, popFood: 0, competition: 0, logistics: 0 };

    // 核心供给上限：帝国核心能供给多少台碳源采集器
    const coreConfig = CORE_COLONY[this.phase] || CORE_COLONY[1];
    const maxCollectors = (coreConfig.maxCollectors || 2) + (this._coreBonus || 0);

    // ★ 预计算循环不变量（避免每建筑重复计算）
    const popEffMult = this._popEffMult || 1;
    const harvestPop = Math.min(this.pop, this._popCap()) * (this.popAlloc.harvest / 100);
    const popMult = 1 + harvestPop * BALANCE.popHarvestBonus * popEffMult;
    const globalProdMult = this._prodMult || 1;
    const mutGlobalBonus = 1 + (this._mutActiveEffects.globalProdBonus || 0);
    const adjMilestone = 1 + (this._adjMilestoneBonus || 0);
    const variantEnergyMult = this._variantEnergyMult || 1;
    const catalystProdMult = 1 + this._getCatalystValue('prodMult');
    const rankTitleMult = 1 + this.getRankTitleBonus(); // v1.0.2: 排名头衔效率加成
    const foodPowerLv = this._foodPowerLevel || 1;
    const phaseGe2 = this.phase >= 2;

    // ★ P0-2: 单次遍历，同时收集所有数据
    let totalTransport = 0;
    let totalConsReduce = 0;
    let collectorCount = 0;
    const collectorIndices = [];
    // 资源竞争用的总产出/总消耗累计（P0-2: 消除第4次遍历）
    const grossProd = {};
    const grossCons = {};
    for (let k in RES) { grossProd[k] = 0; grossCons[k] = 0; }
    // 维护费相关
    const totalBld = this.totalBuildings();
    const maint = { total: {}, overhead: 1 };
    let maintOverhead = 1, maintReduce = 1, mutMaintMod = 1;

    this.grid.forEach((g, idx) => {
      if (!g) return;
      const bd = BLDS[g.type];
      if (!bd) return;

      // === 采集器统计 ===
      if (g.type === 'glucoseCollector') collectorIndices.push(idx);

      // === Boost/传输建筑 ===
      if (bd.isBoost) {
        totalTransport++;
        if (bd.consReduce) totalConsReduce += bd.consReduce;
        return; // boost 不参与产出/维护
      }

      // v2.1: 休眠建筑不生产不消耗（但仍要算维护费，下面单独处理）
      const isDormant = !!this._dormantCells[idx];

      // === 产出/消耗计算 ===
      if (!isDormant) {
        // 碳源采集器受核心供给上限限制
        if (bd.corePowered) {
          collectorCount++;
          if (collectorCount > maxCollectors) {
            // 超出供给上限，不产出但仍然要算维护费（下面维护费段会处理）
            // 也要为资源竞争提供数据
          } else {
            // 正常产出路径 — 在下面统一处理
          }
        }

        // 只有未超出供给上限的建筑才产出
        const skipProd = bd.corePowered && collectorCount > maxCollectors;
        if (!skipProd) {
          // ★ P0-2: 缓存 getUpgradeMultiplier — 产出和消耗共用同一个
          const bldMult = this.getUpgradeMultiplier(idx);
          const beltMult = this.getBeltMultiplierForBuilding(idx);

          // 科技树分支加成
          let techBonus = 1;
          let techConsPenalty = 1;
          if (g.type === 'glucoseCollector' && this._collectorBonus) techBonus += this._collectorBonus;
          if (g.type === 'energyStation') {
            if (this._energyBonus) techBonus += this._energyBonus;
            if (this._energyAdjBonus) {
              const adjCells = this.getAdjacentCells(idx);
              if (adjCells.some(ni => this.grid[ni]?.type === 'glucoseCollector')) {
                techBonus += this._energyAdjBonus;
              }
            }
          }
          if (g.type === 'nitrogenFixer' && this._nitrogenBonus) techBonus += this._nitrogenBonus;
          if (g.type === 'proteinFactory' && this._proteinBonus) techBonus += this._proteinBonus;

          const adjResult = this.getAdjacencyBonus(idx);
          const adjBonus = 1 + adjResult.bonus;
          const syncBonus = 1 + (this._syncBonuses[idx]?.bonus || 0);

          const mult = this.gEff * popMult * bldMult * beltMult * techBonus * adjBonus * syncBonus * foodPowerLv * globalProdMult * mutGlobalBonus * adjMilestone * variantEnergyMult * catalystProdMult * rankTitleMult;
          for (let k in bd.prod) {
            const mutResBonus = 1 + (this._mutActiveEffects.resProdBonus?.[k] || 0);
            const prodVal = bd.prod[k] * mult * mutResBonus;
            r[k] = (r[k]||0) + prodVal;
            breakdown[k].prod += prodVal;
          }
          const consMult = bldMult * beltMult * techConsPenalty;
          for (let k in bd.cons) {
            const consVal = bd.cons[k] * consMult;
            r[k] = (r[k]||0) - consVal;
            breakdown[k].bldCons += consVal;
          }

          // ★ P0-2: 同时为资源竞争累计 grossProd/grossCons（消除第4次 grid.forEach）
          for (let k in bd.prod) {
            grossProd[k] += bd.prod[k] * bldMult;
          }
          for (let k in bd.cons) {
            grossCons[k] += bd.cons[k] * bldMult;
          }
        }
      }

      // === 维护费计算（合并原第3次 grid.forEach）===
      if (phaseGe2) {
        if (MAINTENANCE.exempt.includes(g.type)) return;
        if (bd.isBoost) return;
        const tier = bd.phase || 1;
        const baseMaint = MAINTENANCE.baseCost[tier];
        if (!baseMaint || Object.keys(baseMaint).length === 0) return;
        const bldLv = this.buildingLevels[idx] || 1;
        const lvMult = 1 + (bldLv - 1) * BALANCE.maintLevelMult;
        const portDiscount = getPortEfficiencyDiscount(idx);
        const dormantMult = isDormant ? BALANCE.maintDormantMult : 1;
        for (let k in baseMaint) {
          // maintOverhead/maintReduce/mutMaintMod 在循环后设置 — 这里先用临时标记
          // 实际上需要先算出 totalConsReduce... 但 totalConsReduce 需要遍历完才知道
          // 所以维护费需要在遍历后单独处理，或者在遍历中暂存数据
          // → 改为暂存维护数据，遍历结束后统一应用乘数
          if (!maint._pending) maint._pending = [];
          maint._pending.push({ idx, k, base: baseMaint[k], lvMult, portDiscount, dormantMult });
        }
      }
    });

    // 记录供给状态供UI显示
    const activeCollectors = Math.min(collectorIndices.length, maxCollectors);
    this._coreSupplyUsed = collectorIndices.length;
    this._coreSupplyMax = maxCollectors;
    this._coreSupplyActive = activeCollectors;

    // ★ 维护费后处理 — 需要 totalConsReduce 完成后才能算
    if (phaseGe2) {
      const excess = Math.max(0, totalBld - MAINTENANCE.overheadThreshold);
      maint.overhead = Math.min(1 + excess * MAINTENANCE.overheadRate, MAINTENANCE.maxOverhead);
      maintReduce = 1 - Math.min(totalConsReduce * BALANCE.maintConsReduceScale, BALANCE.maintConsReduceCap);
      mutMaintMod = 1 - (this._mutActiveEffects.maintReduce || 0) + (this._mutActiveEffects.maintIncrease || 0);
      if (maint._pending) {
        for (const p of maint._pending) {
          const cost = p.base * maint.overhead * p.lvMult * maintReduce * Math.max(0.1, mutMaintMod) * p.portDiscount * p.dormantMult;
          r[p.k] = (r[p.k]||0) - cost;
          maint.total[p.k] = (maint.total[p.k]||0) + cost;
          breakdown[p.k].maint += cost;
        }
        delete maint._pending;
      }
    }
    // v3.0 §4: 远距传送带维护费 — 距离>=3时消耗ATP
    let beltMaintTotal = 0;
    const beltsForMaint = this._activeBelts || [];
    for (const belt of beltsForMaint) {
      const bk = Math.min(belt.fi, belt.ti) + '-' + Math.max(belt.fi, belt.ti);
      const dist = this.getBeltDistance(bk);
      if (dist >= BALANCE.beltMaintMinDist) {
        const beltMaintCost = BALANCE.beltMaintPerDist * (dist - 2);
        beltMaintTotal += beltMaintCost;
      }
    }
    if (beltMaintTotal > 0) {
      r.energy = (r.energy || 0) - beltMaintTotal;
      maint.total.energy = (maint.total.energy || 0) + beltMaintTotal;
      breakdown.energy.maint += beltMaintTotal;
    }
    this._beltMaintCost = beltMaintTotal;

    this._maintenanceCost = maint.total;
    this._maintenanceOverhead = maint.overhead;

    // 【修复】物流效率(lEff)只加成正值(产出)，不增加消耗
    const transportRate = BALANCE.transportBaseRate + (this._transportBonus || 0);
    const logisticsPop = Math.min(this.pop, this._popCap()) * (this.popAlloc.logistics / 100);
    const logisticsPopBonus = logisticsPop * BALANCE.popLogisticsBonus;
    this.lEff = 1 + totalTransport * transportRate + logisticsPopBonus;
    for (let k in r) {
      if (r[k] > 0) {
        const before = r[k];
        r[k] *= this.lEff;
        breakdown[k].logistics += r[k] - before;
      }
      // 代谢回路减少消耗
      if (r[k] < 0 && totalConsReduce > 0) r[k] *= (1 - Math.min(totalConsReduce, BALANCE.consReduceCap));
    }

    // QS boost — 基于QS产出速率而非存量，需要维持QS塔运转
    const qsRate = r.qs || 0;
    this.qsLv = Math.max(0, Math.floor(this.res.qs || 0));
    if (this.qsLv > 0) {
      const qsCap = BALANCE.qsBaseCap + (this._qsCapBonus || 0);
      const qsBase = Math.min(this.qsLv * BALANCE.qsBoostPerLevel, qsCap);
      const qsBoost = qsRate >= 0 ? qsBase : qsBase * 0.5;
      for (let k in r) if (r[k] > 0) r[k] *= (1 + qsBoost);
    }

    // Petri Dish Experiment buff
    if (this._petriBuff) {
      const pb = this._petriBuff;
      if (pb.type === 'prodMult') {
        for (let k in r) if (r[k] > 0) r[k] *= (1 + pb.value);
      } else if (pb.type.startsWith('resMult_')) {
        const resKey = pb.type.split('_')[1];
        if (r[resKey] > 0) r[resKey] *= (1 + pb.value);
      } else if (pb.type === 'consReduce') {
        for (let k in r) if (r[k] < 0) r[k] *= (1 - pb.value);
      } else if (pb.type === 'logisticsBoost') {
        for (let k in r) if (r[k] > 0) r[k] *= (1 + pb.value);
      } else if (pb.type === 'effBoost') {
        for (let k in r) if (r[k] > 0) r[k] *= (1 + pb.value);
      }
    }

    // ★ 方案C：资源竞争 — P3起，使用遍历中已累计的 grossProd/grossCons
    const tension = {};
    const penalty = {};
    if (this.phase >= RESOURCE_COMPETITION.startPhase) {
      let effectiveThreshold = RESOURCE_COMPETITION.tensionThreshold;
      if (this.phase === 3 && this._p3EntryTime) {
        const elapsed = (Date.now() - this._p3EntryTime) / 1000;
        if (elapsed < RESOURCE_COMPETITION.p3BufferDuration) {
          const bufferT = RESOURCE_COMPETITION.p3BufferThreshold;
          const normalT = RESOURCE_COMPETITION.tensionThreshold;
          effectiveThreshold = bufferT - (bufferT - normalT) * (elapsed / RESOURCE_COMPETITION.p3BufferDuration);
        }
      }
      for (let k in RES) {
        const totalProd = grossProd[k];
        let totalCons = grossCons[k];
        totalCons += (this._maintenanceCost[k] || 0);
        if (k === 'glucose') totalCons += this.pop * 0.005;

        if (totalProd > 0.01) {
          const ratio = totalCons / totalProd;
          tension[k] = ratio;
          if (ratio > effectiveThreshold) {
            const severity = Math.min((ratio - effectiveThreshold) / (1 - effectiveThreshold), 1);
            const eff = 1 - severity * (1 - RESOURCE_COMPETITION.minEfficiency);
            const mutResist = this._mutActiveEffects.competitionResist || 0;
            const finalEff = Math.min(1, eff + (1 - eff) * mutResist);
            penalty[k] = finalEff;
            if (r[k] > 0) {
              const before = r[k];
              r[k] *= finalEff;
              breakdown[k].competition += before - r[k];
            }
          } else {
            penalty[k] = 1;
          }
        } else {
          tension[k] = 0;
          penalty[k] = 1;
        }
      }
    }
    this._resourceTension = tension;
    this._competitionPenalty = penalty;

    // ★ Q1：追踪种群食物消耗到明细
    if (this.pop > 0) {
      breakdown.glucose.popFood = this.pop * 0.005;
    }
    this._rateBreakdown = breakdown;

    this.rates = r;
  },

  // ===== RESEARCH =====
  startResearch(key) {
    if (this.rTech) { this.log('已有研究进行中', 'w'); SFX.buildFail(); return; }
    const t = TECHS[key];
    // v3.0 §8.5: 创造模式 — 跳过阶段/前置/互斥检查，瞬间完成
    if (this._creativeMode) {
      if (this.techs[key]?.done) { this.log('已研究', 'w'); return; }
      this.techs[key] = { done: true };
      this.applyTech(key);
      this.log(`⭐ 瞬间完成研究: ${t.n}`, 'ev');
      SFX.researchDone();
      this.renderTechs();
      return;
    }
    if (t.phase > this.phase) { this.log('需要先进入阶段 ' + t.phase, 'e'); SFX.buildFail(); return; }
    // v3.0 §3: 前置条件检查
    const prereq = this.getTechPrereqStatus(key);
    if (prereq.hasPrereq && !prereq.met) {
      this.log(`🔒 「${t.n}」需要先满足: ${prereq.icon} ${prereq.label} (${prereq.progress}/${prereq.max})`, 'w');
      SFX.buildFail();
      return;
    }
    // 互斥分支检查 — 如果对立分支已完成，则不能研究（多菌株模式下跳过）
    if (t.exclusive && !this._multiStrainUnlocked) {
      for (const exKey of t.exclusive) {
        if (this.techs[exKey]?.done) {
          const exTech = TECHS[exKey];
          this.log(`⛔ 已研究「${exTech.n}」，与「${t.n}」互斥！`, 'e');
          this.showEvent('互斥路线', `「${t.n}」与已研究的「${exTech.n}」互斥，每个阶段只能选择一个分支路线。\n\n💡 转生后可以选择另一条路线！`, 'var(--orange)');
          SFX.buildFail();
          return;
        }
      }
    }
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
    // 研究个体加速：分配到研究的个体越多，研究越快
    const researchPop = Math.min(this.pop, this._popCap()) * (this.popAlloc.research / 100);
    const researchPopBonus = 1 + researchPop * 0.002; // 每个研究个体 +0.2% 研究速度
    // v3.0 §8.3: 时间催化剂加速
    const catalystTimeBoost = this._getCatalystValue('techSpeed') || 1;
    this.rProg += 1 * (this._techTimeMult ? (1 / this._techTimeMult) : 1) * researchPopBonus * catalystTimeBoost;  // 转生加成 + 个体加速 + 催化剂
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
        effectDetail += `\n\n✦ 全局效率: ${Math.round(oldEff*100)}% → ${Math.round(this.gEff*100)}%`;
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
        this.log(`  ↳ 全局效率 ${Math.round(oldEff*100)}% → ${Math.round(this.gEff*100)}%`, 'ev');
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

      // ★ 改进1：P2b解锁通知 — 基础代谢学完成时触发子阶段提示
      if (techKey === 'basicMetab') {
        setTimeout(() => {
          this.showEvent(
            '🧬 代谢进阶已解锁！',
            'P2b · 代谢进阶\n\n新建筑已开放：\n• DNA提取器 — 高效DNA产线\n• 氨基酸合成仪 — 旁路蛋白合成\n• 核糖体集群 — DNA+葡萄糖双产出\n\n⚖️ 即将面临互斥抉择：\n「氮循环工程」vs「蛋白质工程」\n两条路线只能选一条，慎重决策！',
            'var(--purple)'
          );
          this.log('🧬 P2b · 代谢进阶已解锁 — 新建筑和互斥科技路线已开放！', 'ev');
        }, 1500);
      }
    }
  },

  // ===== EVOLUTION =====
  // 进化成本：超线性增长，后期需要指数级更多的资源
  // Lv1→22, Lv2→35, Lv3→52, Lv4→76, Lv5→110, Lv6→158... (约 ×1.45 增长)
  evoCost() {
    const lv = this.eL;
    const cost = { dna: Math.ceil(12 + 10 * Math.pow(lv, 1.6)) };
    if (lv >= 2) cost.protein = Math.ceil(8 + 7 * Math.pow(lv - 1, 1.5));
    if (lv >= 4) cost.biomass = Math.ceil(5 * Math.pow(lv - 3, 1.4)); // Lv4+ 需要生物质
    return cost;
  },

  // 进化效率奖励随等级递增
  evoBonus() {
    const lv = this.eL;
    if (lv <= 2) return 0.10;  // Lv1-2: +10%
    if (lv <= 4) return 0.15;  // Lv3-4: +15%
    return 0.20;               // Lv5+:  +20%
  },

  // ===== v3.0 §1: 进化培养任务tick =====
  _tickEvoTask() {
    if (!this._evoTask) return;
    const task = this._evoTask;

    // 经济任务特殊处理：维持N秒正收益
    if (task.id === 'et1_econ30') {
      // 每tick检查葡萄糖净速率
      if ((this.rates?.glucose || 0) > 0) {
        this._evoEconTimer = (this._evoEconTimer || 0) + 1; // +1帧(约1秒)
      } else {
        this._evoEconTimer = Math.max(0, (this._evoEconTimer || 0) - 0.5); // 负收益时缓慢倒退
      }
    }

    // 检测任务完成
    if (task.check(this)) {
      this.log(`🧬 培养任务完成! ${task.icon} ${task.n} ✓`, 's');
      SFX.milestone();
      this.showMilestone('🧬', '培养完成!');
      // 自动触发升级
      setTimeout(() => this._completeEvoTask(), 500);
      return;
    }

    // 更新升级面板中的培养任务UI（每5帧一次）
    if (this.animTick % 5 === 0) {
      this._updateEvoTaskUI();
    }
  },

  // 更新培养任务的实时UI（嵌入核心升级面板）
  _updateEvoTaskUI() {
    const task = this._evoTask;
    if (!task) return;
    const panel = document.getElementById('coreUpgradePanel');
    if (!panel) return;

    let evoDiv = panel.querySelector('.evo-task-active');
    if (!evoDiv) {
      evoDiv = document.createElement('div');
      evoDiv.className = 'evo-task-active';
      evoDiv.style.cssText = 'margin-top:8px;padding:8px 10px;border:1px solid rgba(168,85,247,0.3);border-radius:8px;background:rgba(168,85,247,0.05);';
      const btn = panel.querySelector('.core-upgrade-btn');
      if (btn) panel.insertBefore(evoDiv, btn);
      else panel.appendChild(evoDiv);
    }

    const cur = task.progress(this);
    const max = task.max;
    const pct = max > 0 ? Math.min(cur / max * 100, 100) : 0;
    const elapsed = (Date.now() - this._evoTaskStartTime) / 1000;
    const canSkip = elapsed >= 120;
    let skipCost = 20;
    if (this.prestigeCount > 0) skipCost = Math.ceil(skipCost * 0.5);
    const typeColors = { '连线':'#f97316', '布局':'#3b82f6', '经济':'#eab308' };
    const tc = typeColors[task.type] || '#94a3b8';

    evoDiv.innerHTML = `
      <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px">
        <span style="font-size:0.85em">🧬</span>
        <span style="font-size:0.75em;font-weight:700;color:#a855f7;font-family:'Orbitron',monospace">培养任务</span>
        <span style="font-size:0.7em;color:var(--dim)">${Math.floor(elapsed)}s</span>
      </div>
      <div style="display:flex;align-items:center;gap:5px;font-size:0.78em;margin-bottom:4px">
        <span style="color:${tc};font-weight:700">${task.type}</span>
        <span style="color:#e2e8f0">${task.icon} ${task.n}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <div style="flex:1;height:5px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:${tc};border-radius:3px;transition:width 0.3s"></div>
        </div>
        <span style="font-size:0.72em;font-weight:700;color:${tc}">${cur}/${max}</span>
      </div>
      ${canSkip ? `<div style="text-align:right;margin-top:4px">
        <button onclick="G._skipEvoTask()" style="
          font-size:0.68em;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);
          color:#ef4444;padding:2px 10px;border-radius:3px;cursor:pointer">
          跳过 (-${skipCost}🧬)
        </button>
      </div>` : `<div style="font-size:0.65em;color:var(--dim);margin-top:3px;text-align:right">
        ${Math.ceil(120 - elapsed)}s后可跳过
      </div>`}
    `;
  },

  // ===== v3.0 §3: 科技研究前置条件 =====
  // 获取前置条件的实际目标值（考虑转生减免-25%）
  _prereqMax(techKey) {
    const prereq = TECH_PREREQS[techKey];
    if (!prereq) return 0;
    const base = prereq.max;
    // 转生减免: 如果拥有"科研捷径"转生加成（_techTimeMult < 1），前置条件-25%（向下取整，最低1）
    if (this.prestigeCount > 0 && this._techTimeMult < 1) {
      return Math.max(Math.floor(base * 0.75), 1);
    }
    return base;
  },

  // 检查科技前置条件状态
  getTechPrereqStatus(techKey) {
    const prereq = TECH_PREREQS[techKey];
    if (!prereq) return { met: true, label: '', progress: 0, max: 0, hasPrereq: false };
    const max = this._prereqMax(techKey);
    const cur = prereq.progress(this);
    const met = prereq.check(this);
    const reduced = max < prereq.max; // 是否有转生减免
    return {
      hasPrereq: true,
      met,
      label: prereq.label,
      icon: prereq.icon,
      progress: cur,
      max,
      baseMax: prereq.max,
      reduced,
    };
  },

  // 检查前置条件变化并触发反馈
  _checkTechPrereqProgress() {
    for (const key in TECH_PREREQS) {
      const t = TECHS[key];
      if (!t || t.phase > this.phase) continue; // 只检查当前阶段可见的科技
      if (this.techs[key]?.done) continue; // 已完成不检查
      const status = this.getTechPrereqStatus(key);
      if (!status.hasPrereq) continue;
      const prevKey = '_prereqDone_' + key;
      const wasMet = this[prevKey] || false;
      if (status.met && !wasMet) {
        this[prevKey] = true;
        this.log(`🔓 「${t.n}」前置条件达标 — ${status.icon} ${status.label} ✓`, 'ev');
        SFX.milestone();
        this.renderTechs(); // 刷新科技面板
      } else if (!status.met && wasMet) {
        this[prevKey] = false; // 罕见：条件回退
      }
    }
  },

  // ===== v3.0 §2: 探索度系统 =====
  // 获取当前阶段的探索度状态
  getExplorationStatus() {
    const phase = this.phase;
    const goals = EXPLORATION_GOALS[phase];
    if (!goals) return { score: 0, required: 0, met: true, items: [] }; // P5没有探索度
    const items = goals.goals.map(g => ({
      ...g,
      done: g.check(this),
      current: g.progress(this),
    }));
    const score = items.filter(i => i.done).length;
    return {
      score,
      required: goals.required,
      met: score >= goals.required,
      items,
    };
  },

  // 检查探索度变化，触发反馈
  _checkExplorationProgress() {
    const status = this.getExplorationStatus();
    if (!status.items.length) return;
    const prev = this._prevExplScore || 0;
    if (status.score > prev) {
      // 新完成了一个探索度目标
      const newDone = status.items.filter(i => i.done);
      const newItem = newDone[newDone.length - 1]; // 最近完成的
      if (newItem) {
        this.log(`📊 探索度 +1 — ${newItem.icon} ${newItem.n} ✓ (${status.score}/${status.required})`, 'ev');
        this.showMilestone('📊', `探索度 ${status.score}/${status.required}`);
        SFX.milestone();
      }
      if (status.met && prev < status.required) {
        // 刚好达标
        this.showEvent('📊 探索度达标！', `P${this.phase} 探索度已满足 ${status.score}/${status.required}\n\n满足所有升级条件后，可以推进到下一阶段！`, '#14b8a6');
        this.log(`📊 P${this.phase} 探索度达标！可以考虑升级核心了`, 's');
      }
    }
    this._prevExplScore = status.score;
  },

  // ===== v3.0 §6: P3b子阶段探索度 =====
  getP3bExplorationStatus() {
    if (this.phase !== 3 || this._p3bUnlocked) return { score: 0, required: 0, met: true, items: [] };
    const goals = P3B_EXPLORATION_GOALS;
    const items = goals.goals.map(g => ({
      ...g,
      done: g.check(this),
      current: g.progress(this),
    }));
    const score = items.filter(i => i.done).length;
    return {
      score,
      required: goals.required,
      met: score >= goals.required,
      items,
    };
  },

  _checkP3bUnlock() {
    if (this.phase !== 3 || this._p3bUnlocked) return;
    const status = this.getP3bExplorationStatus();
    const prev = this._p3bExplScore || 0;
    // 探索度进度变化反馈
    if (status.score > prev) {
      const newItem = status.items.filter(i => i.done)[status.items.filter(i => i.done).length - 1];
      if (newItem) {
        this.log(`📊 P3b探索度 +1 — ${newItem.icon} ${newItem.n} ✓ (${status.score}/${status.required})`, 'ev');
        this.showMilestone('📊', `P3b探索度 ${status.score}/${status.required}`);
        SFX.milestone();
      }
    }
    this._p3bExplScore = status.score;
    // 达标时解锁P3b
    if (status.met) {
      this._p3bUnlocked = true;
      this.showEvent(
        '🔓 P3b · 物流进阶 已解锁！',
        '完成了P3a阶段的探索，解锁了物流进阶建筑：\n\n' +
        '♻️ 代谢回路 — 循环再利用\n' +
        '📡 信号中继站 — 远距中继传输\n' +
        '🫧 发酵液泡 — ATP替代路线\n' +
        '🔥 生物质转化炉 — 蛋白质→生物质\n' +
        '💎 噬菌体裂解器 — 高纯DNA提取\n\n' +
        '这些新工具将大幅提升你的物流能力！',
        '#60a5fa'
      );
      this.log('🔓 P3b 物流进阶阶段已解锁！新建筑可用', 's');
      SFX.milestone();
      this.renderBuildings(); // 刷新建筑面板
    }
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
    // ★ Q4：最后共同祖先突变 — 免费进化
    if (!this._mutActiveEffects.freeEvolve) {
      for (let k in cost) this.res[k] -= cost[k];
    }
    let bonus = this.evoBonus();
    // ★ Q4：突变额外进化加成
    bonus += (this._mutActiveEffects.evoExtraBonus || 0);
    // 进化催化剂科技：加成翻倍
    bonus *= (this._evoBoostMult || 1);
    // ★ Q4：突变进化效率倍率
    bonus *= (this._mutActiveEffects.evoEffMult || 1);
    // 研究个体加成进化效率奖励
    const researchPop = Math.min(this.pop, this._popCap()) * (this.popAlloc.research / 100);
    const researchBoost = 1 + researchPop * 0.001; // 每个研究个体 +0.1% 进化奖励
    bonus *= researchBoost;
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
    // ★ 改进2：如果有待处理的奇观建造事件，暂停进度推进
    if (this._wonderEventPending) return;

    this.wProg += 1;  // 在 spd 循环内已被调用 spd 次，每次 +1 即可
    const bd = BLDS[this.wBuild];
    const wt = bd?.wonderTime || 120;
    const pct = Math.min(this.wProg / wt * 100, 100);
    document.getElementById('wonderFill').style.width = pct + '%';
    document.getElementById('wonderPct').textContent = Math.floor(pct) + '%';
    // ARIA: 同步奇观进度
    document.getElementById('wonderFill').closest('[role="progressbar"]')?.setAttribute('aria-valuenow', Math.round(pct));

    // ★ 终局高潮 — 最后冲刺效果（进度 >85%）
    if (pct > 85 && !this._wonderSprintActive) {
      this._wonderSprintActive = true;
      const overlay = document.getElementById('wonderOverlay');
      if (overlay) overlay.classList.add('sprint');
      this.log('⚡ 奇观即将完成！最后冲刺！', 's');
      SFX.phaseUp(); // 上升音效暗示高潮来临
    }
    // 冲刺中每20%进度播放加速心跳
    if (this._wonderSprintActive && this.wProg % Math.max(1, Math.floor(wt * 0.03)) === 0) {
      SFX.build(); // 轻微建造音作为心跳节奏
    }

    // ★ 改进2：奇观建造事件触发 — 检查是否到达触发时间点
    if (!this._wonderEventsTriggered) this._wonderEventsTriggered = [];
    for (const wev of WONDER_EVENTS) {
      if (this.wProg >= wev.trigger && !this._wonderEventsTriggered.includes(wev.trigger) && this.wProg < wt) {
        this._wonderEventsTriggered.push(wev.trigger);
        this._wonderEventPending = true;
        // 复用Choice Popup系统显示建造事件
        this.pendingChoice = {
          n: wev.n,
          d: wev.d,
          a: wev.a,
          b: wev.b,
          _isWonderEvent: true  // 标记为奇观事件，chooseA/B完成时清除pending标志
        };
        this.showChoicePopup(this.pendingChoice);
        this.log(`🏛️ 奇观建造事件: ${wev.n}`, 'ev');
        break; // 一次只触发一个事件
      }
    }

    // ★ 终局高潮 — 4阶段完成序列（替换原简单完成处理）
    if (this.wProg >= wt) {
      this.wonderComplete = true;
      this._wonderSprintActive = false;
      // B+C: 记录最快奇观完成时间（秒）
      const runTime = this.stats.onlineTime || 0;
      if (!this._fastestWonder || runTime < this._fastestWonder) {
        this._fastestWonder = runTime;
      }
      const overlay = document.getElementById('wonderOverlay');
      if (overlay) overlay.classList.remove('sprint');
      this._hidePopup('wonderOverlay');

      // ===== 阶段A: 冲击时刻 — 屏幕震动 + 闪光 =====
      this.log('★★★ 奇观完成: ' + bd.n + ' ★★★', 's');
      this.screenShake(20); // 强烈震动
      SFX.wonderFinale();   // 史诗终章音效

      // 全屏闪光
      const flash = document.getElementById('wonderFlash');
      if (flash) { flash.classList.add('active'); setTimeout(() => flash.classList.remove('active'), 2000); }

      // 金色涟漪扩散
      const ripple = document.getElementById('wonderRipple');
      if (ripple) { ripple.classList.add('active'); setTimeout(() => ripple.classList.remove('active'), 2500); }

      // 终局粒子喷发
      this._spawnFinaleParticles();

      // 金色飘字
      const finaleTexts = ['★ 文明巅峰 ★', '✦ 微生物帝国 ✦', '🌟 征服宇宙 🌟'];
      finaleTexts.forEach((txt, i) => {
        setTimeout(() => {
          this._showFinaleFloat(txt, window.innerWidth * (0.2 + Math.random() * 0.6), window.innerHeight * (0.2 + Math.random() * 0.4));
        }, 400 + i * 600);
      });

      // ===== 阶段B: 延迟展示事件弹窗 =====
      setTimeout(() => {
        this.showEvent('🏛️ 奇观落成！', bd.n + '\n\n' + bd.d + '\n\n你征服了微生物宇宙！这是文明的巅峰！', 'var(--purple)');
        this.showMilestone('🌟', '游戏完成！微生物帝国达到巅峰！');
      }, 1200);

      // ===== 阶段C: 文明编年史弹窗 =====
      setTimeout(() => {
        this._showChronicle();
      }, 3000);

      // 清理奇观建造状态
      this.wBuild = null;
      this.wProg = 0;
      this._wonderEventsTriggered = [];
      this.updateGuide();
    }
  },

  // ===== ★ Q4: MUTATION LAB — 变异实验室 =====

  // 检查是否满足解锁条件
  _checkMutLabUnlock() {
    if (this._mutLabUnlocked) return;
    const cfg = MUT_LAB_CONFIG;
    if (this.phase >= cfg.unlockPhase && this.eL >= cfg.unlockEvoLv && this.techs[cfg.unlockTech]?.done) {
      // v2.0: 额外解锁条件 — 至少已建造过1台P3建筑
      const hasP3Bld = this.grid.some(g => g && BLDS[g.type]?.phase === 3);
      if (!hasP3Bld) return;
      this._mutLabUnlocked = true;
      this.log('🧬 变异实验室已解锁！在侧栏查看', 's');
      this.showMilestone('🧬', '变异实验室解锁！');
      this.showEvent('🧬 变异实验室', '你的菌落发展出了诱导突变的能力！\n\n消耗DNA和蛋白质培育随机突变，\n为菌落获得独特增益。', 'var(--purple)');
      SFX.evolve();
      this._renderMutLabPanel();
    }
  },

  // 获取当前最大突变槽数
  _mutMaxSlots() {
    let slots = MUT_LAB_CONFIG.baseSlots;
    // 内共生事件突变：额外3槽
    if (this._mutSlots.some(m => m.id === 'endosymbiosis')) {
      slots += (MUTATIONS.endosymbiosis.ef.extraMutSlots || 3);
    }
    return Math.min(slots, MUT_LAB_CONFIG.maxSlots);
  },

  // 计算培育成本（受突变效果影响）
  _mutBrewCost() {
    const base = { ...MUT_LAB_CONFIG.brewCost };
    const reduce = this._mutActiveEffects.mutBrewCostReduce || 0;
    for (let k in base) base[k] = Math.ceil(base[k] * (1 - reduce));
    return base;
  },

  // 计算培育时间（受突变效果影响）
  _mutBrewTime() {
    const base = MUT_LAB_CONFIG.brewTime;
    const bonus = this._mutActiveEffects.mutBrewSpeedBonus || 0;
    return Math.max(10, Math.round(base * (1 - bonus)));
  },

  // 能否开始培育
  _canBrew() {
    if (!this._mutLabUnlocked) return false;
    if (this._mutBrewing) return false;  // 正在培育中
    if (this._mutOffers.length > 0) return false;  // 有未处理的候选
    const cost = this._mutBrewCost();
    for (let k in cost) if ((this.res[k] || 0) < cost[k]) return false;
    return true;
  },

  // 开始培育突变
  mutStartBrew() {
    if (!this._canBrew()) return;
    const cost = this._mutBrewCost();
    for (let k in cost) this.res[k] -= cost[k];
    this._mutBrewing = {
      progress: 0,
      total: this._mutBrewTime(),
      startTime: Date.now(),
    };
    this._mutBrewCount++;
    this.log('🧪 开始培育突变...', '');
    SFX.build();
    this._updateMutLabUI();
  },

  // 每帧tick培育进度
  _tickMutBrewing() {
    if (!this._mutBrewing) return;
    this._mutBrewing.progress += 1 / this.spd;
    if (this._mutBrewing.progress >= this._mutBrewing.total) {
      // 培育完成 → 生成候选
      this._mutBrewing = null;
      this._generateMutOffers();
      this.log('🧬 突变培育完成！选择一个突变激活', 's');
      SFX.evolve();
      this._updateMutLabUI();
    } else {
      // 更新进度条
      this._updateMutBrewProgress();
    }
  },

  // 加权随机选择突变
  _rollMutation(excludeIds) {
    const pool = [];
    const categoryLock = this._mutCategoryLock;
    for (let id in MUTATIONS) {
      if (excludeIds.includes(id)) continue;
      const mut = MUTATIONS[id];
      // CRISPR类别锁定
      if (categoryLock && mut.category !== categoryLock) continue;
      const rarity = MUT_RARITY[mut.rarity];
      pool.push({ id, weight: rarity.weight });
    }
    if (pool.length === 0) return null;
    const totalW = pool.reduce((s, p) => s + p.weight, 0);
    let roll = Math.random() * totalW;
    for (const p of pool) {
      roll -= p.weight;
      if (roll <= 0) return p.id;
    }
    return pool[pool.length - 1].id;
  },

  // 生成培育候选列表
  _generateMutOffers() {
    const count = MUT_LAB_CONFIG.offerCount;
    const offers = [];
    const existingIds = this._mutSlots.map(m => m.id);
    for (let i = 0; i < count; i++) {
      const id = this._rollMutation([...offers, ...existingIds]);
      if (id) {
        offers.push(id);
        // 加入图鉴
        if (!this._mutHistory.includes(id)) this._mutHistory.push(id);
      }
    }
    this._mutOffers = offers;
    // 使用CRISPR后重置类别锁定
    if (this._mutCategoryLock) {
      this._mutCategoryLock = null;
    }
  },

  // 选择一个候选突变激活
  mutSelectOffer(mutId) {
    if (!this._mutOffers.includes(mutId)) return;
    const maxSlots = this._mutMaxSlots();
    if (this._mutSlots.length < maxSlots) {
      // 有空槽，直接激活
      this._mutSlots.push({ id: mutId, locked: false });
    } else {
      // 满了 → 需要替换（显示替换UI）
      this._mutPendingActivate = mutId;
      this._showMutReplaceUI(mutId);
      return;
    }
    this._mutOffers = [];
    this._recalcMutEffects();
    const mut = MUTATIONS[mutId];
    const rarity = MUT_RARITY[mut.rarity];
    this.log(`🧬 激活突变: ${mut.icon} ${mut.n}（${rarity.n}）`, 's');
    this.showCursorTooltip(`${rarity.icon} ${mut.n} 已激活！`);
    SFX.evolve();
    this._updateMutLabUI();
    this.updateRates();
    this.updateUI();
  },

  // 跳过所有候选（不激活）
  mutSkipOffers() {
    this._mutOffers = [];
    this.log('🧬 已跳过本次突变候选', '');
    this._updateMutLabUI();
  },

  // 替换一个已有突变槽
  mutReplaceSlot(slotIdx) {
    const mutId = this._mutPendingActivate;
    if (!mutId || slotIdx < 0 || slotIdx >= this._mutSlots.length) return;
    const old = this._mutSlots[slotIdx];
    if (old.locked) {
      this.showCursorTooltip('⚠️ 该突变已锁定，无法替换', 'w');
      return;
    }
    const oldMut = MUTATIONS[old.id];
    this._mutSlots[slotIdx] = { id: mutId, locked: false };
    this._mutPendingActivate = null;
    this._mutOffers = [];
    this._recalcMutEffects();
    const mut = MUTATIONS[mutId];
    const rarity = MUT_RARITY[mut.rarity];
    this.log(`🧬 替换突变: ${oldMut.icon}${oldMut.n} → ${mut.icon}${mut.n}（${rarity.n}）`, 's');
    SFX.evolve();
    document.getElementById('mutReplaceOverlay')?.remove();
    this._updateMutLabUI();
    this.updateRates();
    this.updateUI();
  },

  // 取消替换（保持现有）
  mutCancelReplace() {
    this._mutPendingActivate = null;
    this._mutOffers = [];
    document.getElementById('mutReplaceOverlay')?.remove();
    this._updateMutLabUI();
  },

  // 锁定/解锁突变槽
  mutToggleLock(slotIdx) {
    if (slotIdx < 0 || slotIdx >= this._mutSlots.length) return;
    const slot = this._mutSlots[slotIdx];
    if (slot.locked) {
      slot.locked = false;
      this.showCursorTooltip('🔓 已解锁');
    } else {
      const cost = MUT_LAB_CONFIG.lockCost;
      for (let k in cost) {
        if ((this.res[k] || 0) < cost[k]) {
          this.showCursorTooltip('⚠️ DNA不足，无法锁定', 'w');
          return;
        }
      }
      for (let k in cost) this.res[k] -= cost[k];
      slot.locked = true;
      this.showCursorTooltip('🔒 已锁定（替换时跳过）');
    }
    this._updateMutLabUI();
  },

  // 重新培育（消耗资源替换候选列表）
  mutReroll() {
    if (this._mutOffers.length === 0) return;
    const cost = MUT_LAB_CONFIG.rerollCost;
    for (let k in cost) {
      if ((this.res[k] || 0) < cost[k]) {
        this.showCursorTooltip('⚠️ DNA不足，无法重新培育', 'w');
        return;
      }
    }
    for (let k in cost) this.res[k] -= cost[k];
    this._generateMutOffers();
    this.log('🔄 重新培育了一批突变候选', '');
    SFX.build();
    this._updateMutLabUI();
  },

  // CRISPR：设置下次培育的类别锁定
  mutSetCategoryLock(category) {
    if (!this._mutSlots.some(m => m.id === 'crispr')) {
      this.showCursorTooltip('⚠️ 需要CRISPR编辑器突变', 'w');
      return;
    }
    const categories = { resource:'资源', growth:'成长', defense:'防御', logistics:'物流', mutation:'突变' };
    this._mutCategoryLock = category;
    this.showCursorTooltip(`✂️ 下次培育锁定：${categories[category] || category}`);
    this._updateMutLabUI();
  },

  // 重新计算所有突变效果的缓存
  _recalcMutEffects() {
    const portBonuses = {}; // v2.1: { buildingType: { extraIn, extraOut } }
    const ef = {
      maintReduce: 0, maintIncrease: 0,
      popGrowthMult: 0, beltEffBonus: 0,
      globalProdBonus: 0, adjacencyBonus: 0,
      techSpeedBonus: 0, evoCostReduce: 0,
      evoExtraBonus: 0, evoEffMult: 1,
      competitionResist: 0,
      mutBrewSpeedBonus: 0, mutBrewCostReduce: 0,
      mutCategoryLock: false, extraMutSlots: 0,
      mutPrestigeKeep: 0, freeBuildChance: 0,
      freeEvolve: false, noShutdown: false,
      adjacencyRange: 0,
      upgradeCostReduce: 0,
      resProdBonus: {},
    };
    for (const slot of this._mutSlots) {
      const mut = MUTATIONS[slot.id];
      if (!mut) continue;
      const e = mut.ef;
      if (e.maintReduce) ef.maintReduce += e.maintReduce;
      if (e.maintIncrease) ef.maintIncrease += e.maintIncrease;
      if (e.popGrowthMult) ef.popGrowthMult += e.popGrowthMult;
      if (e.beltEffBonus) ef.beltEffBonus += e.beltEffBonus;
      if (e.globalProdBonus) ef.globalProdBonus += e.globalProdBonus;
      if (e.adjacencyBonus) ef.adjacencyBonus += e.adjacencyBonus;
      if (e.techSpeedBonus) ef.techSpeedBonus += e.techSpeedBonus;
      if (e.evoCostReduce) ef.evoCostReduce += e.evoCostReduce;
      if (e.evoExtraBonus) ef.evoExtraBonus += e.evoExtraBonus;
      if (e.evoEffMult) ef.evoEffMult *= e.evoEffMult;
      if (e.competitionResist) ef.competitionResist += e.competitionResist;
      if (e.mutBrewSpeedBonus) ef.mutBrewSpeedBonus += e.mutBrewSpeedBonus;
      if (e.mutBrewCostReduce) ef.mutBrewCostReduce += e.mutBrewCostReduce;
      if (e.mutCategoryLock) ef.mutCategoryLock = true;
      if (e.extraMutSlots) ef.extraMutSlots += e.extraMutSlots;
      if (e.mutPrestigeKeep) ef.mutPrestigeKeep = Math.max(ef.mutPrestigeKeep, e.mutPrestigeKeep);
      if (e.freeBuildChance) ef.freeBuildChance += e.freeBuildChance;
      if (e.freeEvolve) ef.freeEvolve = true;
      if (e.noShutdown) ef.noShutdown = true;
      if (e.adjacencyRange) ef.adjacencyRange += e.adjacencyRange;
      if (e.upgradeCostReduce) ef.upgradeCostReduce += e.upgradeCostReduce;
      if (e.resProdBonus) {
        for (let k in e.resProdBonus) {
          ef.resProdBonus[k] = (ef.resProdBonus[k] || 0) + e.resProdBonus[k];
        }
      }
      // v2.1 §9.2: 端口突变 — extraOutPort/extraInPort + targetRandom
      if (e.extraOutPort || e.extraInPort) {
        if (!this._mutPortTargets) this._mutPortTargets = {};
        // 首次为此突变随机选一种有端口的建筑类型
        if (!this._mutPortTargets[slot.id]) {
          const candidates = Object.keys(PORT_DEFS).filter(t => {
            const d = PORT_DEFS[t];
            return d && (d.maxOut > 0 || d.maxIn > 0) && d.role !== 'wonder';
          });
          if (candidates.length > 0) {
            this._mutPortTargets[slot.id] = candidates[Math.floor(Math.random() * candidates.length)];
          }
        }
        const target = this._mutPortTargets[slot.id];
        if (target) {
          if (!portBonuses[target]) portBonuses[target] = { extraIn: 0, extraOut: 0 };
          portBonuses[target].extraOut += (e.extraOutPort || 0);
          portBonuses[target].extraIn += (e.extraInPort || 0);
        }
      }
    }
    this._mutActiveEffects = ef;
    // v2.1 §9.2 + §9.3: 合并突变端口加成 + 转生端口扩展
    // 转生管线工程学: _presPortExpand = lv → 随机 lv 种建筑各+1输出端口(每种上限+2)
    if (this._presPortExpand && this._presPortExpand > 0) {
      if (!this._presPortTargets || this._presPortTargets.length !== this._presPortExpand) {
        const candidates = Object.keys(PORT_DEFS).filter(t => {
          const d = PORT_DEFS[t];
          return d && d.maxOut > 0 && d.role !== 'wonder';
        });
        const targets = [];
        const shuffled = [...candidates].sort(() => Math.random() - 0.5);
        for (let i = 0; i < Math.min(this._presPortExpand, shuffled.length); i++) {
          targets.push(shuffled[i]);
        }
        this._presPortTargets = targets;
      }
      for (const t of this._presPortTargets) {
        if (!portBonuses[t]) portBonuses[t] = { extraIn: 0, extraOut: 0 };
        portBonuses[t].extraOut = Math.min(portBonuses[t].extraOut + 1, 2); // 每种上限+2
      }
    }
    this._mutPortBonuses = portBonuses;
  },

  // ★ Q4：渲染变异实验室面板（完整重绘）
  _renderMutLabPanel() {
    const container = document.getElementById('mutLabContent');
    if (!container) return;
    const maxSlots = this._mutMaxSlots();

    let html = '';

    // —— 已激活的突变槽 ——
    html += '<div class="mut-slots-header">激活中 <span class="mut-slots-count">' + this._mutSlots.length + '/' + maxSlots + '</span></div>';
    html += '<div class="mut-slots">';
    for (let i = 0; i < maxSlots; i++) {
      const slot = this._mutSlots[i];
      if (slot) {
        const mut = MUTATIONS[slot.id];
        const rarity = MUT_RARITY[mut.rarity];
        html += `<div class="mut-slot mut-rarity-${mut.rarity}" data-slot="${i}" title="${mut.d}">
          <div class="mut-slot-icon">${mut.icon}</div>
          <div class="mut-slot-info">
            <div class="mut-slot-name">${mut.n}</div>
            <div class="mut-slot-rarity" style="color:${rarity.color}">${rarity.icon} ${rarity.n}</div>
          </div>
          <div class="mut-slot-actions">
            <button class="mut-lock-btn ${slot.locked ? 'locked' : ''}" onclick="G.mutToggleLock(${i})" title="${slot.locked ? '点击解锁' : '锁定(防替换)'}">${slot.locked ? '🔒' : '🔓'}</button>
          </div>
        </div>`;
      } else {
        html += `<div class="mut-slot mut-slot-empty"><div class="mut-slot-icon">◇</div><div class="mut-slot-info"><div class="mut-slot-name" style="color:var(--dim)">空槽位</div></div></div>`;
      }
    }
    html += '</div>';

    // —— 培育区域 ——
    html += '<div class="mut-brew-section">';
    if (this._mutBrewing) {
      // 正在培育
      const pct = Math.min(100, (this._mutBrewing.progress / this._mutBrewing.total * 100)).toFixed(1);
      html += `<div class="mut-brew-bar">
        <div class="mut-brew-fill" id="mutBrewFill" style="width:${pct}%"></div>
        <div class="mut-brew-text">🧪 培育中... ${pct}%</div>
      </div>`;
    } else if (this._mutOffers.length > 0) {
      // 有候选突变待选择
      html += '<div class="mut-offers-title">✨ 选择一个突变激活</div>';
      html += '<div class="mut-offers">';
      for (const mutId of this._mutOffers) {
        const mut = MUTATIONS[mutId];
        const rarity = MUT_RARITY[mut.rarity];
        html += `<div class="mut-offer mut-rarity-${mut.rarity}" onclick="G.mutSelectOffer('${mutId}')">
          <div class="mut-offer-header">
            <span class="mut-offer-icon">${mut.icon}</span>
            <span class="mut-offer-name">${mut.n}</span>
            <span class="mut-offer-rarity" style="color:${rarity.color}">${rarity.icon}</span>
          </div>
          <div class="mut-offer-desc">${mut.d}</div>
          <div class="mut-offer-flavor">"${mut.flavor}"</div>
        </div>`;
      }
      html += '</div>';
      // 操作按钮
      html += '<div class="mut-offer-actions">';
      const rerollCost = MUT_LAB_CONFIG.rerollCost;
      const canReroll = Object.entries(rerollCost).every(([k, v]) => (this.res[k] || 0) >= v);
      html += `<button class="mut-btn mut-btn-reroll ${canReroll ? '' : 'disabled'}" onclick="G.mutReroll()">🔄 重新培育 (${Object.entries(rerollCost).map(([k,v]) => RES[k].icon + formatNum(v)).join(' ')})</button>`;
      html += `<button class="mut-btn mut-btn-skip" onclick="G.mutSkipOffers()">跳过</button>`;
      html += '</div>';
    } else {
      // 可以开始培育
      const cost = this._mutBrewCost();
      const time = this._mutBrewTime();
      const canBrew = this._canBrew();
      html += `<button class="mut-brew-btn ${canBrew ? '' : 'disabled'}" onclick="G.mutStartBrew()">
        <span class="mut-brew-btn-icon">🧪</span>
        <span class="mut-brew-btn-text">
          <span class="mut-brew-btn-name">培育突变</span>
          <span class="mut-brew-btn-cost">${Object.entries(cost).map(([k,v]) => RES[k].icon + formatNum(v)).join(' ')} · ${time}秒</span>
        </span>
      </button>`;
    }

    // CRISPR类别锁定（如果拥有该突变）
    if (this._mutSlots.some(m => m.id === 'crispr') && !this._mutBrewing && this._mutOffers.length === 0) {
      const cats = { resource:'📦资源', growth:'🌱成长', defense:'🛡️防御', logistics:'🚛物流', mutation:'🧬突变' };
      html += '<div class="mut-crispr-bar">';
      html += '<span class="mut-crispr-label">✂️ CRISPR锁定:</span>';
      for (const [cat, label] of Object.entries(cats)) {
        const active = this._mutCategoryLock === cat;
        html += `<button class="mut-crispr-btn ${active ? 'active' : ''}" onclick="G.mutSetCategoryLock('${cat}')">${label}</button>`;
      }
      if (this._mutCategoryLock) {
        html += `<button class="mut-crispr-btn mut-crispr-clear" onclick="G._mutCategoryLock=null;G._updateMutLabUI()">✕</button>`;
      }
      html += '</div>';
    }

    html += '</div>';

    // —— 统计 ——
    html += `<div class="mut-stats">已发现 ${this._mutHistory.length}/${Object.keys(MUTATIONS).length} · 培育 ${this._mutBrewCount}次</div>`;

    container.innerHTML = html;
  },

  // ★ Q4：轻量更新UI（只更新变化的部分）
  _updateMutLabUI() {
    // 简单起见：直接重新渲染整个面板
    // 由于面板不大，性能可以接受
    if (!this._mutLabUnlocked) return;
    this._renderMutLabPanel();
  },

  // ★ Q4：更新培育进度条（高频调用，不重绘整个面板）
  _updateMutBrewProgress() {
    const fill = document.getElementById('mutBrewFill');
    if (!fill || !this._mutBrewing) return;
    const pct = Math.min(100, (this._mutBrewing.progress / this._mutBrewing.total * 100));
    fill.style.width = pct.toFixed(1) + '%';
    const textEl = fill.parentElement?.querySelector('.mut-brew-text');
    if (textEl) textEl.textContent = `🧪 培育中... ${formatNum(pct, 1)}%`;
  },

  // ★ Q4：突变替换弹窗
  _showMutReplaceUI(newMutId) {
    const mut = MUTATIONS[newMutId];
    const rarity = MUT_RARITY[mut.rarity];
    let html = `<div class="mut-replace-overlay" id="mutReplaceOverlay" onclick="if(event.target===this)G.mutCancelReplace()">
      <div class="mut-replace-panel" onclick="event.stopPropagation()">
        <div class="mut-replace-title">🧬 突变槽已满 — 选择替换</div>
        <div class="mut-replace-new">
          <div class="mut-replace-new-header">新突变</div>
          <div class="mut-offer mut-rarity-${mut.rarity}" style="pointer-events:none">
            <div class="mut-offer-header">
              <span class="mut-offer-icon">${mut.icon}</span>
              <span class="mut-offer-name">${mut.n}</span>
              <span class="mut-offer-rarity" style="color:${rarity.color}">${rarity.icon} ${rarity.n}</span>
            </div>
            <div class="mut-offer-desc">${mut.d}</div>
          </div>
        </div>
        <div class="mut-replace-current-title">👇 点击要替换的突变（锁定项不可替换）：</div>
        <div class="mut-replace-slots">`;
    for (let i = 0; i < this._mutSlots.length; i++) {
      const slot = this._mutSlots[i];
      const old = MUTATIONS[slot.id];
      const oldRarity = MUT_RARITY[old.rarity];
      if (slot.locked) {
        html += `<div class="mut-replace-slot locked">
          <span class="mut-replace-slot-icon">${old.icon}</span>
          <span class="mut-replace-slot-name">${old.n}</span>
          <span class="mut-replace-slot-rarity" style="color:${oldRarity.color}">${oldRarity.n}</span>
          <span class="mut-replace-slot-lock">🔒</span>
        </div>`;
      } else {
        html += `<div class="mut-replace-slot" onclick="G.mutReplaceSlot(${i})">
          <span class="mut-replace-slot-icon">${old.icon}</span>
          <span class="mut-replace-slot-name">${old.n}</span>
          <span class="mut-replace-slot-rarity" style="color:${oldRarity.color}">${oldRarity.n}</span>
          <span style="margin-left:auto;font-size:0.65em;color:#ef4444;font-weight:700">⇄ 替换</span>
        </div>`;
      }
    }
    html += `</div>
        <button class="mut-btn mut-btn-skip" onclick="G.mutCancelReplace()">取消（保持现有）</button>
      </div>
    </div>`;

    // 移除旧的overlay
    const old = document.getElementById('mutReplaceOverlay');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', html);
  },

  // ===== PHASE CHECK =====
  // 每个阶段需要的最低进化等级
  phaseEvoReq: { 2: 2, 3: 3, 4: 4, 5: 5 },

  // 获取下一阶段的升级条件列表（返回 [{label, met, tipTitle, tipTag, tipDesc, tipDetail, tipColor}]）
  getPhaseUpReqs() {
    const reqs = [];
    const self = this;

    // ---- 辅助：生成进化等级条件 + tooltip ----
    function evoReq(reqLv) {
      const met = self.eL >= reqLv;
      const diff = reqLv - self.eL;
      const cost = self.evoCost();
      const costParts = Object.entries(cost).map(([k,v]) => `${formatNum(v)}${RES[k]?.icon||k}`).join(' + ');
      let detail = met
        ? `✓ 已达成 — 当前 Lv.${self.eL}`
        : `还需提升 ${diff} 级\n下次进化费用: ${costParts}`;
      const bonus = self.evoBonus() * (self._evoBoostMult || 1);
      detail += `\n每次进化: 全局效率 +${Math.round(bonus*100)}%`;
      return {
        label: `进化等级 ≥ Lv.${reqLv}`, met,
        tipTitle: '🧬 进化等级', tipTag: '进化',
        tipDesc: met ? `当前 Lv.${self.eL} — 已满足 ≥ Lv.${reqLv}` : `当前 Lv.${self.eL} → 目标 Lv.${reqLv}`,
        tipDetail: detail, tipColor: '#a855f7'
      };
    }

    // ---- 辅助：生成建筑条件 + tooltip ----
    function bldReq(bldKey) {
      const b = BLDS[bldKey];
      const count = self.bldCount(bldKey);
      const met = count > 0;
      const costParts = Object.entries(b.cost).map(([k,v]) => `${formatNum(v)}${RES[k]?.icon||k}`).join(' + ');
      let detail = met
        ? `✓ 已建造 ${count} 座`
        : `✗ 尚未建造\n建造费用: ${costParts}`;
      if (b.ratio) detail += `\n转化: ${b.ratio}`;
      if (b.corePowered) detail += '\n🏠 由帝国核心供能';
      return {
        label: `建造 ${b.n}`, met,
        tipTitle: `${b.emoji||''} ${b.n}`, tipTag: '建筑',
        tipDesc: met ? `已建造 — ${b.d}` : `未建造 — ${b.d}`,
        tipDetail: detail, tipColor: b.color || '#22c55e'
      };
    }

    // ---- 辅助：生成科技条件 + tooltip ----
    function techReq(techKey) {
      const t = TECHS[techKey];
      const met = self.techs[techKey]?.done;
      const costParts = Object.entries(t.cost).map(([k,v]) => `${formatNum(v)}${RES[k]?.icon||k}`).join(' + ');
      let detail = met
        ? `✓ 已完成研究`
        : `✗ 尚未研究\n研究费用: ${costParts}\n研究时间: ${t.time}秒`;
      detail += `\n效果: ${t.ef}`;
      if (t.req && t.req.length > 0) {
        const preNames = t.req.map(r => TECHS[r]?.n || r).join('、');
        detail += `\n前置科技: ${preNames}`;
      }
      return {
        label: `研究 ${t.n}`, met,
        tipTitle: `📖 ${t.n}`, tipTag: '科技',
        tipDesc: met ? `已研究 — ${t.ef}` : `未研究 — ${t.d}`,
        tipDetail: detail, tipColor: '#60a5fa'
      };
    }

    // ---- v3.0 §2: 辅助：生成探索度条件 + tooltip ----
    function explReq() {
      const es = self.getExplorationStatus();
      if (!es.items.length) return null; // P5无探索度
      const met = es.met;
      const doneList = es.items.filter(i => i.done).map(i => `✓ ${i.icon} ${i.n}`).join('\n');
      const todoList = es.items.filter(i => !i.done).map(i => `✗ ${i.icon} ${i.n} (${i.current}/${i.max})`).join('\n');
      const detail = `已完成:\n${doneList || '(无)'}\n\n待完成:\n${todoList || '(全部完成!)'}`;
      return {
        label: `📊 探索度 ${es.score}/${es.required}`, met,
        tipTitle: `📊 P${self.phase} 探索度`, tipTag: '探索度',
        tipDesc: met ? `已达标 — ${es.score}/${es.required} (任选${es.required})` : `${es.score}/${es.required} — 还需完成 ${es.required - es.score} 项`,
        tipDetail: detail, tipColor: '#14b8a6'
      };
    }

    if (this.phase === 1) {
      reqs.push(evoReq(2));
      reqs.push(bldReq('glucoseCollector'));
      reqs.push(bldReq('energyStation'));
      reqs.push(bldReq('simpleExtractor'));
      reqs.push(techReq('pureCulture'));
      const er = explReq(); if (er) reqs.push(er);
    } else if (this.phase === 2) {
      reqs.push(evoReq(3));
      reqs.push(bldReq('proteinFactory'));
      reqs.push(bldReq('geneExtractor'));
      const er = explReq(); if (er) reqs.push(er);
    } else if (this.phase === 3) {
      reqs.push(evoReq(4));
      reqs.push(bldReq('biofilmReactor'));
      reqs.push(bldReq('transport'));
      const er = explReq(); if (er) reqs.push(er);
    } else if (this.phase === 4) {
      reqs.push(evoReq(5));
      reqs.push(bldReq('qsController'));
      reqs.push(techReq('quorumSensing'));
      const er = explReq(); if (er) reqs.push(er);
    }
    return reqs;
  },

  // 检查是否可以升级核心（所有条件达成）
  canPhaseUp() {
    if (this.phase >= 5) return false;
    // v3.0 §8.5: 创造模式跳过条件
    if (this._creativeMode) return true;
    const reqs = this.getPhaseUpReqs();
    return reqs.length > 0 && reqs.every(r => r.met);
  },

  // 手动升级核心
  manualCoreUpgrade() {
    if (!this.canPhaseUp()) return;

    // v3.0 §1: 如果当前已有活跃培养任务且已完成 → 执行升级
    if (this._evoTask && this._evoTask.check(this)) {
      this._completeEvoTask();
      return;
    }
    // v3.0 §1: 如果有活跃任务但未完成 → 提示
    if (this._evoTask) {
      const t = this._evoTask;
      this.log(`🧬 培养任务进行中: ${t.icon} ${t.n} (${t.progress(this)}/${t.max})`, 'w');
      SFX.buildFail();
      return;
    }
    // v3.0 §1: 弹出培养任务选择面板
    const tasks = EVOLUTION_TASKS[this.phase];
    if (tasks && tasks.length > 0) {
      this._showEvoTaskSelection(tasks);
      return;
    }
    // 没有培养任务（兜底：直接升级）
    this._doPhaseUpgrade();
  },

  // v3.0 §1: 显示培养任务3选1面板
  _showEvoTaskSelection(tasks) {
    // 记录当前基线
    const base = {
      belt: (this._activeBelts||[]).length,
      adj: Object.keys(this._discoveredAdj||{}).length,
    };
    const self = this;

    // 检查哪些任务已经满足（秒过）
    const taskStatuses = tasks.map(t => ({
      ...t,
      alreadyMet: t.check(this),
    }));

    let html = `<div style="text-align:center;margin-bottom:10px">
      <div style="font-size:1.1em;font-weight:700;color:#a855f7;font-family:'Orbitron',monospace">🧬 进化培养</div>
      <div style="font-size:0.78em;color:var(--dim);margin-top:3px">选择一个培养条件完成后即可进化</div>
    </div>`;
    html += '<div style="display:flex;flex-direction:column;gap:8px">';

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      const met = taskStatuses[i].alreadyMet;
      const cur = t.progress(this);
      const rewardStr = Object.entries(t.reward).map(([k, v]) => `+${v}${RES[k]?.icon||k}`).join(' ');
      const typeColors = { '连线':'#f97316', '布局':'#3b82f6', '经济':'#eab308' };
      const tc = typeColors[t.type] || '#94a3b8';

      html += `<div class="evo-task-option${met?' met':''}" data-evo-idx="${i}" style="
        padding:10px 12px;border:1px solid ${met?'#14b8a6':'rgba(255,255,255,0.08)'};
        border-radius:8px;cursor:pointer;transition:all 0.2s;
        background:${met?'rgba(20,184,166,0.08)':'rgba(255,255,255,0.02)'};
        ">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          <span style="font-size:1.1em">${t.icon}</span>
          <span style="color:${tc};font-weight:700;font-size:0.78em">${t.type}</span>
          <span style="font-size:0.82em;color:#e2e8f0;font-weight:600">${t.n}</span>
          ${met?'<span style="color:#14b8a6;font-weight:700;margin-left:auto">✅ 已满足</span>':''}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.72em;color:var(--dim)">
          <span>进度: ${cur}/${t.max}</span>
          <span style="color:#14b8a6">${rewardStr} 奖励</span>
        </div>
        ${!met?`<div style="height:3px;background:rgba(255,255,255,0.06);border-radius:2px;margin-top:4px;overflow:hidden">
          <div style="width:${t.max>0?Math.min(cur/t.max*100,100):0}%;height:100%;background:${tc};border-radius:2px"></div>
        </div>`:''}
      </div>`;
    }
    html += '</div>';

    // 使用 choicePopup 展示
    const popup = document.getElementById('choicePopup');
    if (popup) {
      popup.innerHTML = `<div class="event-popup-inner" style="max-width:380px">
        ${html}
        <div style="text-align:center;margin-top:10px">
          <button onclick="G._cancelEvoTaskSelection()" style="
            background:transparent;border:1px solid rgba(255,255,255,0.1);
            color:var(--dim);padding:4px 16px;border-radius:4px;cursor:pointer;font-size:0.75em">
            返回
          </button>
        </div>
      </div>`;
      popup.style.display = 'flex';

      // 绑定任务选择点击
      popup.querySelectorAll('.evo-task-option').forEach(el => {
        el.addEventListener('click', () => {
          const idx = +el.dataset.evoIdx;
          self._selectEvoTask(tasks[idx], base);
          popup.style.display = 'none';
        });
        el.addEventListener('mouseenter', () => {
          el.style.borderColor = '#a855f7';
          el.style.background = 'rgba(168,85,247,0.06)';
        });
        el.addEventListener('mouseleave', () => {
          const met = taskStatuses[+el.dataset.evoIdx].alreadyMet;
          el.style.borderColor = met ? '#14b8a6' : 'rgba(255,255,255,0.08)';
          el.style.background = met ? 'rgba(20,184,166,0.08)' : 'rgba(255,255,255,0.02)';
        });
      });
    }
  },

  _cancelEvoTaskSelection() {
    const popup = document.getElementById('choicePopup');
    if (popup) popup.style.display = 'none';
  },

  // 选择一个培养任务
  _selectEvoTask(task, base) {
    this._evoTask = task;
    this._evoTaskBase = base;
    this._evoEconTimer = 0;
    this._evoTaskStartTime = Date.now();

    // 如果任务已经满足 → 直接完成
    if (task.check(this)) {
      this.log(`🧬 培养任务已满足: ${task.icon} ${task.n} — 直接完成！`, 's');
      SFX.milestone();
      this._completeEvoTask();
      return;
    }

    this.log(`🧬 培养任务开始: ${task.icon} ${task.n} (${task.progress(this)}/${task.max})`, 'ev');
    SFX.researchStart();
    this.showMilestone('🧬', `培养任务: ${task.n}`);
    this.updateCoreUpgradeUI();
  },

  // 完成培养任务 → 执行升级
  _completeEvoTask() {
    const task = this._evoTask;
    if (!task) { this._doPhaseUpgrade(); return; }

    const elapsed = (Date.now() - this._evoTaskStartTime) / 1000;
    const hasBonus = elapsed <= 60;

    // 给予任务奖励
    if (task.reward) {
      for (const [k, v] of Object.entries(task.reward)) {
        this.res[k] = (this.res[k] || 0) + v;
      }
      const rewardStr = Object.entries(task.reward).map(([k, v]) => `+${v}${RES[k]?.icon||k}`).join(' ');
      this.log(`🎁 培养奖励: ${rewardStr}${hasBonus?' (60秒内完成!)':''}`, 's');
    }
    if (hasBonus) {
      // 额外奖励
      this.res.energy = (this.res.energy || 0) + 10;
      this.log('🎉 快速培养奖励: +10⚡', 's');
    }

    // 清除任务状态
    this._evoTask = null;
    this._evoTaskBase = null;
    this._evoEconTimer = 0;
    this._evoTaskStartTime = 0;

    // 执行升级
    this._doPhaseUpgrade();
  },

  // 跳过培养任务（消耗资源）
  _skipEvoTask() {
    const task = this._evoTask;
    if (!task) return;
    const elapsed = (Date.now() - this._evoTaskStartTime) / 1000;
    if (elapsed < 120) {
      this.log(`🧬 还需等待 ${Math.ceil(120 - elapsed)} 秒才能跳过`, 'w');
      SFX.buildFail();
      return;
    }
    // 跳过成本: 20 DNA（转生减免50%）
    let skipCost = 20;
    if (this.prestigeCount > 0) skipCost = Math.ceil(skipCost * 0.5);
    if ((this.res.dna || 0) < skipCost) {
      this.log(`🧬 跳过需要 ${skipCost}🧬，DNA不足`, 'e');
      SFX.buildFail();
      return;
    }
    this.res.dna -= skipCost;
    this.log(`🧬 跳过培养任务 — 消耗 ${skipCost}🧬`, 'w');
    this._evoTask = null;
    this._evoTaskBase = null;
    this._evoEconTimer = 0;
    this._evoTaskStartTime = 0;
    this._doPhaseUpgrade();
  },

  // 实际执行阶段升级（原manualCoreUpgrade核心逻辑）
  // ★ Phase D 视觉叙事：阶段升级仪式序列（~3秒）
  _doPhaseUpgrade() {
    // 阶段1→2时: 将自动传送带转化为手动传送带（保留已有连接）
    if (this.phase === 1 && this._computeBelts) {
      const { belts } = this._computeBelts();
      for (const belt of belts) {
        if (belt.isManual) continue; // 已经是手动的跳过
        const key = Math.min(belt.fi, belt.ti) + '-' + Math.max(belt.fi, belt.ti);
        if (!this.manualBelts[key]) {
          this.manualBelts[key] = {
            fi: belt.fi, ti: belt.ti,
            colors: belt.colors || [], icons: belt.icons || [], labels: belt.labels || []
          };
        }
      }
      this.log('🔗 已有传送带已全部转为手动模式', 's');
    }

    this.phase++;
    // v3.0 §2: 重置探索度追踪（新阶段从0开始计）
    this._prevExplScore = 0;
    // v3.0 §1: 清除培养任务UI
    const evoPanel = document.querySelector('.evo-task-active');
    if (evoPanel) evoPanel.remove();
    // v2.0: 记录P3进入时间（用于资源竞争缓冲期）
    if (this.phase === 3) this._p3EntryTime = Date.now();

    // v2.0 §11: 阶段升级时设置教学flag
    if (this.phase === 2) {
      this._p2PortTutorialPending = true; // 触发P2端口教学
    }
    if (this.phase === 3) {
      this._p3LogisticsTutorialPending = true; // 触发P3物流时代教学
      // P3+180秒后启用资源竞争教学
      setTimeout(() => {
        this._competitionEnabled = true;
      }, 180000);
    }
    const p = PHASES[this.phase - 1];
    const cc = CORE_COLONY[this.phase];

    // ===== Phase D 仪式序列 =====
    const overlay = document.getElementById('phaseCeremony');
    const titleEl = document.getElementById('ceremonTitle');
    const descEl = document.getElementById('ceremonDesc');
    const wasPaused = this.paused;

    // 0.0s — 暂停游戏，启动遮罩淡入
    if (!wasPaused) this.togglePause();
    SFX.phaseUp();
    overlay.classList.add('active');

    // 0.5s — 核心菌落开始进化动画
    setTimeout(() => {
      const coreIcon = document.querySelector('.core-colony-icon');
      if (coreIcon) coreIcon.classList.add('core-evolving');
      SFX.updateBGMPhase(this.phase);
    }, 500);

    // 1.0s — 色彩切换（Phase A）+ 光粒子爆发
    setTimeout(() => {
      setPhaseColors(this.phase);
      // 光粒子爆发
      const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        const dist = 80 + Math.random() * 160;
        const pt = document.createElement('div');
        pt.className = 'ceremony-particle';
        pt.style.left = cx + 'px';
        pt.style.top = cy + 'px';
        pt.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
        pt.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
        pt.style.setProperty('--dur', (1.0 + Math.random() * 0.8) + 's');
        document.body.appendChild(pt);
        setTimeout(() => pt.remove(), 2000);
      }
    }, 1000);

    // 1.5s — 屏震 + 核心进化音效
    setTimeout(() => {
      this.screenShake(8);
      if (cc) setTimeout(() => SFX.coreUpgrade(), 200);
    }, 1500);

    // 1.8s — 阶段名称+描述显示
    setTimeout(() => {
      titleEl.textContent = p.icon + ' ' + p.name + '纪元';
      descEl.textContent = p.desc;
      overlay.classList.add('title-in');
    }, 1800);

    // 2.5s — 全屏色调闪烁
    setTimeout(() => {
      const flash = document.createElement('div');
      flash.className = 'ceremony-flash';
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 400);
    }, 2500);

    // 3.0s — 仪式结束：清理遮罩，恢复游戏，执行所有后续逻辑
    setTimeout(() => {
      overlay.classList.remove('active', 'title-in');
      titleEl.textContent = '';
      descEl.textContent = '';
      // 移除核心进化动画
      const coreIcon = document.querySelector('.core-colony-icon');
      if (coreIcon) coreIcon.classList.remove('core-evolving');
      // 恢复游戏
      if (!wasPaused && this.paused) this.togglePause();

      // ===== 原有后续逻辑 =====
      // 进入阶段3时停止帮助按钮脉冲
      if (this.phase >= 3) this._stopHelpPulse();
      this.showMilestone(p.icon, '进入阶段 ' + p.id + ': ' + p.name);
      this.log('◆ 进入阶段 ' + p.id + ': ' + p.name + ' — ' + p.desc, 's');
      // J3: 微叙事 — 阶段升级
      this.log('🌅 一个新时代降临...你的文明更加强大了。', 's');
      // 核心菌落升级提示
      if (cc) {
        this.log(`◆ 核心菌落进化: ${cc.name} ${cc.emoji}`, 's');
        this.showEvent('核心进化: ' + cc.name, cc.desc + '\n\n你的帝国中枢变得更加强大！', cc.color);
      }
      this.updatePhase();
      this.renderResources();
      this.renderBuildings();
      this.renderTechs();
      // 阶段升级后更新小手引导（阶段2+自动隐藏）
      this._updateGuideHand();
      this.renderGrid();
      this.renderCoreColony(true);
      this.updateCoreUpgradeUI();
      // 进入阶段3: 首次触发存档保存 + 提示玩家
      if (this.phase === 3) {
        this.save(true);
        this.log('💾 进度已开始自动保存！', 's');
        this._updateSaveHint();
      }
    }, 3000);
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
      reqsEl.innerHTML = '<div style="font-size:0.78em;color:var(--purple);text-align:center;padding:4px 0">🌟 已达最高阶段</div>';
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
    for (let i = 0; i < reqs.length; i++) {
      const r = reqs[i];
      html += `<div class="core-req-item ${r.met ? 'met' : 'unmet'}" data-req-idx="${i}">${r.label}</div>`;
    }
    reqsEl.innerHTML = html;

    // 绑定条件项 hover tooltip
    reqsEl.querySelectorAll('.core-req-item[data-req-idx]').forEach(el => {
      const r = reqs[+el.dataset.reqIdx];
      if (!r) return;
      el.style.cursor = 'help';
      el.addEventListener('mouseenter', () => {
        GameTooltip.showRaw({
          title: r.tipTitle, tag: r.tipTag,
          desc: r.tipDesc, detail: r.tipDetail,
          color: r.tipColor
        }, el.getBoundingClientRect());
      });
      el.addEventListener('mouseleave', () => GameTooltip.hide());
    });

    // v3.0 §2: 探索度详细面板
    this._renderExplorationPanel(panel);
    // v3.0 §6: P3b子阶段探索度面板
    this._renderP3bExplorationPanel(panel);

    // 按钮状态
    if (this._evoTask) {
      // v3.0 §1: 培养任务进行中
      const task = this._evoTask;
      if (task.check(this)) {
        btn.textContent = `🧬 培养完成! 点击升级 ▸ P${nextPhase}`;
        btn.className = 'core-upgrade-btn ready';
        btn.disabled = false;
      } else {
        btn.textContent = `🧬 培养中: ${task.icon} ${task.progress(this)}/${task.max}`;
        btn.className = 'core-upgrade-btn';
        btn.disabled = true;
      }
    } else if (allMet) {
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

  // v3.0 §2: 渲染探索度详细面板（嵌入核心升级面板底部）
  _renderExplorationPanel(container) {
    const es = this.getExplorationStatus();
    if (!es.items.length) {
      const old = container.querySelector('.expl-panel');
      if (old) old.remove();
      return;
    }
    let panel = container.querySelector('.expl-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'expl-panel';
      panel.style.cssText = 'margin-top:8px;border-top:1px solid rgba(255,255,255,0.06);padding-top:6px;';
      const btn = container.querySelector('.core-upgrade-btn');
      if (btn) container.insertBefore(panel, btn);
      else container.appendChild(panel);
    }

    const pct = es.required > 0 ? Math.min(es.score / es.required * 100, 100) : 100;
    const barColor = es.met ? '#14b8a6' : '#f59e0b';
    const headerColor = es.met ? '#14b8a6' : '#94a3b8';

    let html = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;cursor:pointer" onclick="this.parentElement.querySelector('.expl-items').classList.toggle('expl-collapsed')">
      <span style="font-size:0.72em;font-weight:700;color:${headerColor};font-family:'Orbitron',monospace">📊 P${this.phase} 探索度</span>
      <div style="flex:1;height:5px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden">
        <div style="width:${pct}%;height:100%;background:${barColor};border-radius:3px;transition:width 0.5s"></div>
      </div>
      <span style="font-size:0.68em;font-weight:700;color:${headerColor}">${es.score}/${es.required}</span>
      <span style="font-size:0.6em;color:var(--dim)">▾</span>
    </div>`;

    // 保存折叠状态，重建后恢复
    const wasCollapsed = panel.querySelector('.expl-items.expl-collapsed') !== null;
    html += `<div class="expl-items${wasCollapsed ? ' expl-collapsed' : ''}" style="display:flex;flex-direction:column;gap:3px">`;
    for (const item of es.items) {
      const done = item.done;
      const cur = item.current;
      const max = item.max;
      const color = done ? '#14b8a6' : '#64748b';
      const textColor = done ? '#14b8a6' : '#94a3b8';
      const typeColors = { '连线':'#f97316', '远距':'#06d6a0', '技巧':'#a855f7', '布局':'#3b82f6', '建设':'#22c55e', '成长':'#eab308', '挑战':'#ef4444', '探索':'#ec4899', '科技':'#60a5fa', '优化':'#14b8a6', '突变':'#c084fc', '经济':'#fbbf24' };
      const tc = typeColors[item.type] || '#94a3b8';
      html += `<div style="display:flex;align-items:center;gap:5px;font-size:0.68em;padding:2px 0;opacity:${done?1:0.85}">
        <span style="font-size:0.9em;width:14px;text-align:center">${done ? '✅' : '⬜'}</span>
        <span style="color:${tc};font-size:0.85em;font-weight:700;min-width:28px">${item.type}</span>
        <span style="color:${textColor};flex:1">${item.icon} ${item.n}</span>
        ${!done && max > 1 ? `<span style="color:var(--dim);font-size:0.9em">${cur}/${max}</span>` : ''}
        ${done ? '<span style="color:#14b8a6;font-weight:700">+1</span>' : ''}
      </div>`;
    }
    html += '</div>';
    panel.innerHTML = html;
  },

  // v3.0 §6: 渲染P3b子阶段探索度面板
  _renderP3bExplorationPanel(container) {
    const panelId = 'p3b-expl-panel';
    let panel = container.querySelector('.' + panelId);
    // 只在P3阶段且未解锁P3b时显示
    if (this.phase !== 3 || this._p3bUnlocked) {
      if (panel) panel.remove();
      return;
    }
    const es = this.getP3bExplorationStatus();
    if (!es.items.length) { if (panel) panel.remove(); return; }

    if (!panel) {
      panel = document.createElement('div');
      panel.className = panelId;
      panel.style.cssText = 'margin-top:6px;border-top:1px dashed rgba(96,165,250,0.2);padding-top:6px;';
      const btn = container.querySelector('.core-upgrade-btn');
      if (btn) container.insertBefore(panel, btn);
      else container.appendChild(panel);
    }

    const pct = es.required > 0 ? Math.min(es.score / es.required * 100, 100) : 100;
    const barColor = es.met ? '#14b8a6' : '#60a5fa';
    const headerColor = es.met ? '#14b8a6' : '#60a5fa';

    let html = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;cursor:pointer" onclick="this.parentElement.querySelector('.p3b-items').classList.toggle('expl-collapsed')">
      <span style="font-size:0.72em;font-weight:700;color:${headerColor};font-family:'Orbitron',monospace">📡 P3b 物流进阶</span>
      <div style="flex:1;height:5px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden">
        <div style="width:${pct}%;height:100%;background:${barColor};border-radius:3px;transition:width 0.5s"></div>
      </div>
      <span style="font-size:0.68em;font-weight:700;color:${headerColor}">${es.score}/${es.required}</span>
      <span style="font-size:0.6em;color:var(--dim)">▾</span>
    </div>`;

    // 保存折叠状态，重建后恢复
    const wasCollapsed = panel.querySelector('.p3b-items.expl-collapsed') !== null;
    html += `<div class="p3b-items${wasCollapsed ? ' expl-collapsed' : ''}" style="display:flex;flex-direction:column;gap:3px">`;
    const typeColors = { '建设':'#22c55e', '探索':'#ec4899', '突变':'#c084fc', '连线':'#f97316', '布局':'#3b82f6', '远距':'#06d6a0' };
    for (const item of es.items) {
      const done = item.done;
      const cur = item.current;
      const max = item.max;
      const textColor = done ? '#14b8a6' : '#94a3b8';
      const tc = typeColors[item.type] || '#94a3b8';
      html += `<div style="display:flex;align-items:center;gap:5px;font-size:0.68em;padding:2px 0;opacity:${done?1:0.85}">
        <span style="font-size:0.9em;width:14px;text-align:center">${done ? '✅' : '⬜'}</span>
        <span style="color:${tc};font-size:0.85em;font-weight:700;min-width:28px">${item.type}</span>
        <span style="color:${textColor};flex:1">${item.icon} ${item.n}</span>
        ${!done && max > 1 ? `<span style="color:var(--dim);font-size:0.9em">${cur}/${max}</span>` : ''}
        ${done ? '<span style="color:#14b8a6;font-weight:700">+1</span>' : ''}
      </div>`;
    }
    html += '</div>';
    panel.innerHTML = html;
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

    // ★ 改进3：邻接规则解锁计数
    const adjHint = document.getElementById('adjRuleHint');
    if (adjHint) {
      const unlocked = this.getUnlockedAdjacencyCount();
      const total = ADJACENCY_RULES.length;
      const discovered = Object.keys(this._discoveredAdj || {}).length;
      adjHint.innerHTML = `<span style="color:var(--cyan);font-size:0.72em">🔗 已解锁 ${unlocked}/${total} 条邻接规则 | <a href="#" onclick="G.showAdjGuide();return false" style="color:#14b8a6;text-decoration:underline">图鉴 (${discovered}/${unlocked})</a></span>`;
    }
  },

  // ===== GUIDE =====
  updateGuide() {
    const steps = GUIDE[this.phase] || [];
    let currentIdx = -1;
    let guideText = '';
    let guideIcon = '🎯';

    for (let i = 0; i < steps.length; i++) {
      if (steps[i].check(this)) {
        currentIdx = i;
        guideText = steps[i].text;
        guideIcon = steps[i].icon;
        // v2.0: once教学 — 显示后自动关闭pending flag
        if (steps[i].once) {
          const key = steps[i].once;
          if (key === 'p2PortTutorial') this._p2PortTutorialPending = false;
          if (key === 'p3LogisticsTutorial') this._p3LogisticsTutorialPending = false;
          if (key === 'adjPreviewHint') this._adjPreviewShown = true;
          if (key === 'competitionTutorial') this._competitionTutorialShown = true;
        }
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

    // ── 同步培养皿内引导提示条 ──
    const dishGuideBar = document.getElementById('dishGuideBar');
    const dishGuideText = document.getElementById('dishGuideText');
    const dishGuideIconEl = document.getElementById('dishGuideIcon');
    if (dishGuideBar && dishGuideText) {
      // 提取简短文字（去掉破折号后面的补充说明）
      const shortGuide = guideText.replace(/[—(（].*$/, '').trim();
      if (dishGuideText.textContent !== shortGuide) {
        dishGuideText.textContent = shortGuide;
        if (dishGuideIconEl) dishGuideIconEl.textContent = guideIcon;
        // 闪烁动画
        dishGuideBar.classList.remove('flash');
        void dishGuideBar.offsetWidth; // force reflow
        dishGuideBar.classList.add('flash');
      }
      // 点击提示条 → 展开右侧目标面板
      if (!dishGuideBar._bound) {
        dishGuideBar._bound = true;
        dishGuideBar.onclick = () => {
          const sec = document.getElementById('secGoal');
          if (sec && sec.classList.contains('collapsed')) G.toggleSection('secGoal');
          // 滚动到目标面板
          sec && sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
      }
      // 通关后隐藏
      if (this.wonderComplete) dishGuideBar.classList.add('hidden');
      else dishGuideBar.classList.remove('hidden');
    }

    // === 渲染步骤列表：已完成 / 当前 / 后续 ===
    const stepsEl = document.getElementById('guideSteps');
    stepsEl.innerHTML = '';

    // 阶段内步骤拆分
    if (steps.length > 0) {
      steps.forEach((step, i) => {
        const isDone = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isFuture = i > currentIdx && currentIdx >= 0;
        // 跳过那些非建造类的「等待」步骤在 future 中
        if (isFuture && currentIdx >= 0) {
          // 只显示后续2步，避免剧透太多
          if (i > currentIdx + 2) return;
        }

        const item = document.createElement('div');
        item.className = 'guide-step-item ' + (isDone ? 'step-done' : isCurrent ? 'step-current' : 'step-future');

        const shortText = step.text.replace(/[—(（].*$/, '').trim();
        item.innerHTML = `<span class="step-idx">${isDone ? '✓' : (i + 1)}</span>
          <span>${step.icon} ${isFuture ? '???' : shortText}</span>`;
        stepsEl.appendChild(item);
      });
    }

    // 阶段进度条（底部）
    const phaseBar = document.createElement('div');
    phaseBar.style.cssText = 'display:flex;gap:3px;margin-top:6px;padding-top:5px;border-top:1px solid rgba(255,255,255,0.04)';
    PHASES.forEach(p => {
      const dot = document.createElement('div');
      const isDone = p.id < this.phase;
      const isCurrent = p.id === this.phase;
      dot.className = 'guide-step' + (isDone ? ' done' : '') + (isCurrent ? ' current' : ' future');
      dot.innerHTML = `<div class="step-dot ${isDone?'done':isCurrent?'current':'future'}"></div>
        <span>${p.icon} ${p.name}</span>`;
      phaseBar.appendChild(dot);
    });
    stepsEl.appendChild(phaseBar);

    // 引导目标面板自动展开（避免引导指向折叠的面板）
    this._ensureGuideSectionVisible();

    // 更新建造按钮高亮
    this.updateGuideHighlight();

    // 更新新手小手引导（仅阶段1）
    this._updateGuideHand();

    // ── 卡住检测 + 步骤变化高亮 ──
    const guideKey = this.phase + ':' + currentIdx;
    const guideBox = document.getElementById('secGoal');
    if (guideKey !== this._lastGuideKey) {
      // 步骤变化 → 面板闪烁吸引注意
      this._lastGuideKey = guideKey;
      this._guideStuckTs = Date.now();
      this._guideStuckNotified = false;
      if (guideBox) {
        guideBox.style.transition = 'box-shadow 0.3s';
        guideBox.style.boxShadow = '0 0 12px rgba(6,214,160,0.5), inset 0 0 6px rgba(6,214,160,0.15)';
        setTimeout(() => { guideBox.style.boxShadow = ''; }, 1800);
      }
    }
    // 同一步骤停留超过45s → 显示卡住提醒浮条
    if (!this._guideStuckNotified && this._guideStuckTs && Date.now() - this._guideStuckTs > 45000 && this.phase < 5 && currentIdx >= 0) {
      this._guideStuckNotified = true;
      const hint = steps[currentIdx];
      // 提取核心行动关键词
      const shortAction = (hint.text || guideText).replace(/[—(（｜|].*/g, '').replace(/▸\s*P\d[a-z]?\s*·\s*\S+\s*[｜|]/g, '').trim();
      this._showStuckReminder(shortAction);
    }
  },

  // 卡住提醒浮条（培养皿上方，醒目但不遮挡）
  _showStuckReminder(action) {
    // 避免重复
    const old = document.getElementById('stuckReminder');
    if (old) old.remove();
    const el = document.createElement('div');
    el.id = 'stuckReminder';
    el.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:9999;' +
      'background:linear-gradient(135deg,rgba(249,115,22,0.92),rgba(234,88,12,0.92));' +
      'color:#fff;padding:8px 18px;border-radius:8px;font-size:0.82em;font-weight:600;' +
      'box-shadow:0 4px 20px rgba(249,115,22,0.4);cursor:pointer;max-width:480px;text-align:center;' +
      'animation:stuckSlideIn 0.4s ease-out;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
    el.innerHTML = `💡 看起来卡住了？→ <span style="text-decoration:underline">${action}</span>`;
    el.onclick = () => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(-20px)';
      el.style.transition = 'all 0.3s';
      setTimeout(() => el.remove(), 300);
      // 展开目标面板（如果折叠了）
      const sec = document.getElementById('secGoal');
      if (sec && sec.classList.contains('collapsed')) G.toggleSection('secGoal');
    };
    document.body.appendChild(el);
    // 12秒后自动消失
    setTimeout(() => { if (el.parentNode) { el.style.opacity = '0'; el.style.transition = 'opacity 0.5s'; setTimeout(() => el.remove(), 500); } }, 12000);
  },

  // ===== MAIN LOOP =====
  startLoop() {
    // 幂等保护：防止多次调用叠加多个 setInterval
    if (this._loopId) return;
    this._loopId = setInterval(() => {
      if (this.paused) return;

      // v3.0 §8: 变体运行时效果
      // speedrun 变体计时器
      if (this._variantTimeLimit) {
        this._variantTimer++;
        if (this._variantTimer >= this._variantTimeLimit) {
          // 超时后每60秒效率-5%
          const overtime = this._variantTimer - this._variantTimeLimit;
          if (overtime > 0 && overtime % 3600 === 0) { // 60秒 (3600 tick)
            this.gEff = Math.max(0.2, this.gEff - 0.05);
            this.log(`⏱️ 竞速试炼! 超时 ${Math.floor(overtime/60)} 分钟，效率-5% → ${formatNum(this.gEff*100, 1)}%`, 'w');
            this.showEvent('⏱️ 超时惩罚', `效率已下降至 ${formatNum(this.gEff*100, 1)}%\n\n时间就是生命！`, '#06b6d4');
          }
        }
      }
      // toxic 变体资源衰减
      if (this._variantToxic) {
        if (this._variantTimer % (this._toxicInterval || 3600) === 0) { // 默认60秒
          const resources = Object.keys(RES).filter(k => this.res[k] > 0);
          if (resources.length > 0) {
            const targetRes = resources[Math.floor(Math.random() * resources.length)];
            const decayAmount = this.res[targetRes] * 0.1; // -10%
            this.res[targetRes] = Math.max(0, this.res[targetRes] - decayAmount);
            this._toxicTarget = targetRes;
            this.log(`☠️ 毒素蔓延! ${RES[targetRes]?.icon||targetRes}${RES[targetRes]?.n||targetRes} -10%`, 'w');
            this.showEvent('☠️ 毒素蔓延', `${RES[targetRes]?.icon||targetRes}${RES[targetRes]?.n||targetRes} 被污染了！\n\n保持多元化生产对抗毒素。`, '#84cc16');
          }
        }
      }

      for (let s = 0; s < this.spd; s++) {
        this.updateRates();

        // Apply rates
        for (let k in this.rates) {
          this.res[k] = (this.res[k]||0) + this.rates[k];
          if (this.res[k] < 0) this.res[k] = 0;
        }
        // v3.0 §8.5: 创造模式资源锁定
        if (this._creativeMode) {
          for (const k in RES) this.res[k] = 99999;
        }

        // Population from buildings — 有上限且消耗葡萄糖
        const bCount = this.totalBuildings();
        const popCap = this._popCap();
        if (this.pop < popCap) {
          const growth = bCount * BALANCE.popGrowthRate * this.gEff;
          this.pop = Math.min(this.pop + growth, popCap);
        }
        // 种群消耗葡萄糖 (每100个体消耗0.5葡萄糖/s) + 功率水平系统
        const popFoodCost = this.pop * 0.005;
        if (popFoodCost > 0) {
          // 计算葡萄糖储备比（以30秒消耗量为基准）
          const foodBuffer = popFoodCost * 30;
          const foodRatio = foodBuffer > 0 ? this.res.glucose / foodBuffer : 1;

          // 阶梯式功率计算
          if (foodRatio > 0.8) {
            this._foodPowerLevel = 1.0;          // 🟢 满功率
          } else if (foodRatio > 0.5) {
            this._foodPowerLevel = 1.0;          // 🟡 正常但预警
          } else if (foodRatio > 0.2) {
            this._foodPowerLevel = 0.7;          // 🟠 低功率 70%
          } else if (foodRatio > 0) {
            this._foodPowerLevel = 0.4;          // 🔴 危机模式 40%
          } else {
            this._foodPowerLevel = 0.2;          // ⛔ 极限模式 20%
          }

          if (this.res.glucose >= popFoodCost) {
            this.res.glucose -= popFoodCost;
          } else {
            // 食物不足：种群加速衰减（功率越低降得越快）
            const popLoss = this._foodPowerLevel <= 0.4 ? 2.0 : this._foodPowerLevel <= 0.7 ? 1.0 : 0.5;
            this.pop = Math.max(0, this.pop - popLoss);
          }

          // 功率警告（每次降档只提示一次）
          if (this._foodPowerLevel < 1.0 && !this._powerWarningShown) {
            this._powerWarningShown = true;
            if (this._foodPowerLevel <= 0.4) {
              this.log('🔴 能量危机！功率降至 ' + Math.round(this._foodPowerLevel * 100) + '% — 建造更多碳源采集器！', 'e');
              this.showEvent('⚡ 能量危机', '葡萄糖严重不足！产能大幅下降', 'var(--red)');
              SFX.eventBad();
            } else if (this._foodPowerLevel <= 0.7) {
              this.log('🟠 低功率警告！产能降至 70% — 补充葡萄糖储备', 'w');
            }
          }
          // 功率恢复时重置警告
          if (this._foodPowerLevel >= 1.0) this._powerWarningShown = false;
        } else {
          this._foodPowerLevel = 1.0;
        }

        // ★ 方案A：维护费预警 — 每30秒检查一次
        if (this.phase >= 2 && this.rt % 30 === 0) {
          const mc = this._maintenanceCost || {};
          // 检查维护费是否超过净产出的一定比例
          let maintWarning = false;
          for (let k in mc) {
            if (mc[k] > 0 && this.rates[k] < 0) {
              maintWarning = true; // 维护费导致某资源净值为负
            }
          }
          if (maintWarning && !this._maintenanceWarningShown) {
            this._maintenanceWarningShown = true;
            this.log('🔧 维护费警告！部分资源入不敷出 — 优化布局或拆除低效建筑', 'w');
            this.showEvent('🔧 维护压力', '建筑维护费超出产能！优化布局提升效率', 'var(--orange)');
          }
          if (!maintWarning) this._maintenanceWarningShown = false;
        }

        // ★ 方案C：资源竞争预警 — 每20秒检查一次
        if (this.phase >= 3 && this.rt % 20 === 0) {
          const penalty = this._competitionPenalty || {};
          for (let k in penalty) {
            if (penalty[k] < 0.85 && !this._competitionWarningShown[k]) {
              this._competitionWarningShown[k] = true;
              const resName = RES[k]?.n || k;
              const resIcon = RES[k]?.icon || '📦';
              this.log(`⚖️ ${resIcon}${resName}供需紧张！产出效率降至${Math.round(penalty[k]*100)}% — 增产或减少消耗`, 'w');
            }
            if (penalty[k] >= 0.95) this._competitionWarningShown[k] = false;
          }
        }

        // QS信号自然衰减 — 按比例衰减（每秒扣当前值的3%）+ 最低衰减0.02/s
        // 高QS时衰减显著，低QS时衰减平缓。受信号增幅器科技影响
        if ((this.res.qs || 0) > 0) {
          const decayMult = this._qsDecayMult || 1;
          // Petri buff: QS衰减减缓
          const petriQsReduce = (this._petriBuff && this._petriBuff.type === 'qsDecay') ? (1 - this._petriBuff.value) : 1;
          const proportionalDecay = this.res.qs * 0.03 * decayMult * petriQsReduce;
          const minDecay = 0.02 * decayMult;
          const qsDecay = Math.max(proportionalDecay, minDecay);
          this.res.qs = Math.max(0, this.res.qs - qsDecay);
        }

        this.tickResearch();
        this.tickWonder();
        this.tickChallenge(); // Challenge system
        this.tickPetri(); // Petri experiment cooldown & buff tick
        // ★ Q4：变异实验室tick
        this._tickMutBrewing();
        this._checkMutLabUnlock();
        // v3.0 §8.3: 催化剂倒计时
        this._tickCatalysts();
        // v2.1 §8.2：培养皿P3+配方分散解锁检查
        this._checkPetriP3Unlock();
        this.rt++;
      }

      // ===== 随机事件 — 独立于加速倍率，每真实秒只掷骰一次 =====
      // Random events (enhanced with more events + choice events)
      // 事件奖励随阶段缩放：P1→×1, P2→×1.5, P3→×2.5, P4→×4, P5→×6
      if (Math.random() < 0.006) {
        const allEvents = [...EVENTS, ...EVENTS_EXTRA].filter(e => e.phase <= this.phase);
        if (allEvents.length) {
          const ev = allEvents[Math.floor(Math.random() * allEvents.length)];
          // 阶段缩放：事件定义的阶段越低于当前阶段，奖励倍率越高
          const phaseDiff = this.phase - (ev.phase || 1);
          const eventScale = 1 + phaseDiff * 0.8; // P1事件在P4 = ×3.4倍
          // 保存原始资源量，应用缩放后的事件
          const origRes = {};
          for (let k in this.res) origRes[k] = this.res[k];
          const origPop = this.pop;
          const origEff = this.gEff;
          ev.fn(this);
          // 对资源增量应用缩放（仅放大增益，不放大惩罚）
          if (ev.ty !== 'e' && eventScale > 1) {
            for (let k in this.res) {
              const delta = this.res[k] - origRes[k];
              if (delta > 0) this.res[k] = origRes[k] + delta * eventScale;
            }
            const popDelta = this.pop - origPop;
            if (popDelta > 0) this.pop = origPop + popDelta * eventScale;
            // 效率加成不缩放（避免效率膨胀）
          }
          const scaleTag = eventScale > 1.5 ? ` (×${formatNum(eventScale, 1)})` : '';
          this.log('▸ ' + ev.n + ' — ' + ev.d + scaleTag, ev.ty === 'e' ? 'e' : ev.ty === 'w' ? 'w' : 's');
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
      if (this.animTick % 5 === 0) this._renderCatalystPanel(); // v3.0 §8.3
      if (this.animTick % 60 === 0) this._renderCreativeBadge(); // v3.0 §8.5
      if (this.animTick % 3 === 0) this.updateCellRates();
      // ★ 方案F：供给同步加成每3帧计算一次
      if (this.animTick % 3 === 0) this.computeSyncBonuses();
      // H1: 告警摘要条每3帧更新
      if (this.animTick % 3 === 0) this.updateAlertBar();
      // G3: 帝国总览折叠摘要每5帧更新
      if (this.animTick % 5 === 0) this.updateEmpireSummary();
      // J1: 菌主形象每5帧更新
      if (this.animTick % 5 === 0) this.updateHostAvatar();
      // v3.0 §2: 探索度检查（每10帧一次）
      if (this.animTick % 10 === 0) this._checkExplorationProgress();
      // v3.0 §3: 科技前置条件检查（每15帧一次）
      if (this.animTick % 15 === 0) this._checkTechPrereqProgress();
      // v3.0 §6: P3b子阶段解锁检查（每12帧一次）
      if (this.animTick % 12 === 0) this._checkP3bUnlock();
      // v3.0 §1: 进化培养任务检测
      this._tickEvoTask();

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

      this.updatePetriUI(); // 培养皿实验 冷却/buff 实时更新
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

  // ===== ★ 终局高潮系统 — 辅助方法 =====

  // 终局粒子喷发 — 从屏幕中央爆射金色/紫色粒子
  _spawnFinaleParticles() {
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    const colors = ['#fbbf24', '#f59e0b', '#a855f7', '#ec4899', '#f97316', '#22c55e'];
    for (let i = 0; i < 40; i++) {
      const p = document.createElement('div');
      p.className = 'finale-particle';
      const angle = (Math.PI * 2 / 40) * i + (Math.random() - 0.5) * 0.3;
      const dist = 150 + Math.random() * 300;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const dur = 1.5 + Math.random() * 1.5;
      p.style.setProperty('--dx', dx + 'px');
      p.style.setProperty('--dy', dy + 'px');
      p.style.setProperty('--dur', dur + 's');
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.width = (4 + Math.random() * 6) + 'px';
      p.style.height = p.style.width;
      p.style.boxShadow = `0 0 6px ${p.style.background}`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), dur * 1000 + 100);
    }
  },

  // 终局金色飘字
  _showFinaleFloat(text, x, y) {
    const el = document.createElement('div');
    el.className = 'finale-golden-float';
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  },

  // 文明编年史 — 数据收集与渲染
  _showChronicle() {
    const t = this.stats.onlineTime;
    const hrs = Math.floor(t / 3600);
    const min = Math.floor((t % 3600) / 60);
    const sec = t % 60;
    const timeStr = hrs > 0 ? `${hrs}时${min}分${sec}秒` : `${min}分${sec}秒`;

    // 旅程回顾 — 5个阶段
    const phases = [
      { icon: '🔮', name: 'P1 采集', desc: '从一团原始液泡开始，学会采集葡萄糖' },
      { icon: '🦠', name: 'P2 代谢', desc: '原核聚落成形，代谢网络初步建立' },
      { icon: '🔬', name: 'P3 物流', desc: '生物膜枢纽运转，传送带连接万物' },
      { icon: '🏗️', name: 'P4 自动化', desc: '菌落中枢崛起，自动化帝国成形' },
      { icon: '✨', name: 'P5 圣殿', desc: '生命圣殿落成，微型戴森球照亮宇宙' },
    ];
    const journeyEl = document.getElementById('chronicleJourney');
    if (journeyEl) {
      journeyEl.innerHTML = `
        <div class="chronicle-journey-title">🗺 文明旅程</div>
        ${phases.map(p => `
          <div class="chronicle-phase">
            <span class="chronicle-phase-icon">${p.icon}</span>
            <span class="chronicle-phase-name">${p.name}</span>
            <span class="chronicle-phase-desc">${p.desc}</span>
          </div>
        `).join('')}
      `;
    }

    // 统计数据
    const techDone = Object.values(this.techs).filter(t => t.done).length;
    const techTotal = Object.keys(TECHS).length;
    const achieves = Object.keys(this.achievements).length;
    const challenges = Object.keys(this.completedChallenges).length;
    const score = this.calcScore();
    const { rank } = this._scoreRank(score);

    const statsData = [
      { label: '⏱ 在线时长', value: timeStr },
      { label: '🏆 总分', value: formatNum(score) + ' [' + rank + ']' },
      { label: '🏗️ 总建造', value: this.stats.totalBuilt + '' },
      { label: '♻️ 总回收', value: this.stats.totalRecycled + '' },
      { label: '🧬 进化次数', value: this.stats.totalEvo + '' },
      { label: '📖 科技完成', value: `${techDone}/${techTotal}` },
      { label: '🟢 峰值葡萄糖', value: formatNum(this.stats.peakGlucose) },
      { label: '⚡ 峰值能量', value: formatNum(this.stats.peakEnergy) },
      { label: '🧬 峰值DNA', value: formatNum(this.stats.peakDna) },
      { label: '🦠 峰值种群', value: formatNum(this.stats.peakPop || 0) },
      { label: '🏆 成就', value: `${achieves}/${ACHIEVE.length}` },
      { label: '🎯 挑战', value: `${challenges}/${CHALLENGES.length}` },
    ];
    const statsEl = document.getElementById('chronicleStats');
    if (statsEl) {
      statsEl.innerHTML = statsData.map(s => `
        <div class="chronicle-stat">
          <span class="chronicle-stat-label">${s.label}</span>
          <span class="chronicle-stat-value">${s.value}</span>
        </div>
      `).join('');
    }

    // 结尾引言 — 根据游戏时间选择不同语录
    const quotes = [
      '"从一滴培养液到整个微观宇宙，你创造了不可能的奇迹。"',
      '"每一个微小的选择，都在改写文明的进程。"',
      '"当戴森球的光芒照亮培养皿，你知道这一切都值得。"',
      '"这不是终点，而是新传奇的序章。"',
    ];
    const quoteEl = document.getElementById('chronicleQuote');
    if (quoteEl) {
      quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];
    }

    // 显示弹窗
    this._showBackdrop();
    this._showPopup('chroniclePopup');

    // ===== 阶段D: 余晖效果 — 编年史关闭后自动激活 =====
    // 余晖在编年史显示时就开始（但视觉上被弹窗遮挡，关闭后才明显感知）
    this._startAfterglow();
  },

  // 关闭文明编年史
  closeChronicle() {
    this._hidePopup('chroniclePopup');
    this._hideBackdrop();
    // 关闭后显示余晖提示
    this.log('✨ 戴森球的光芒持续照耀着你的微生物帝国...', 's');
    this.showMilestone('✨', '余晖笼罩大地... 传奇永不落幕');
  },

  // 余晖系统 — 金色环境光持续一段时间
  _startAfterglow() {
    this._afterglowActive = true;
    const overlay = document.getElementById('afterglowOverlay');
    if (overlay) overlay.classList.add('active');
    // 余晖持续120秒后淡出
    this._afterglowTimer = setTimeout(() => {
      this._stopAfterglow();
    }, 120000);
    // 余晖期间周期性金色飘字
    this._afterglowFloatInterval = setInterval(() => {
      if (!this._afterglowActive) return;
      const texts = ['✦', '✧', '☆', '★', '✨'];
      const txt = texts[Math.floor(Math.random() * texts.length)];
      this._showFinaleFloat(txt, Math.random() * window.innerWidth, window.innerHeight * 0.8 + Math.random() * window.innerHeight * 0.15);
    }, 4000);
  },

  _stopAfterglow() {
    this._afterglowActive = false;
    const overlay = document.getElementById('afterglowOverlay');
    if (overlay) overlay.classList.remove('active');
    if (this._afterglowTimer) { clearTimeout(this._afterglowTimer); this._afterglowTimer = null; }
    if (this._afterglowFloatInterval) { clearInterval(this._afterglowFloatInterval); this._afterglowFloatInterval = null; }
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
      const result = findNearestBelt(clickX, clickY, 36);
      
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
          // 隐藏传送带tooltip
          const tt = document.getElementById('tooltip');
          if (tt && this._beltTooltipActive) {
            tt.classList.remove('show');
            this._beltTooltipActive = false;
          }
        }
        return;
      }
      const rect = dishView.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const result = findNearestBelt(mx, my, 36);
      const newKey = result ? result.key : null;
      if (newKey !== this._hoverBeltKey) {
        this._hoverBeltKey = newKey;
        dishView.style.cursor = newKey ? 'pointer' : '';
        const tt = document.getElementById('tooltip');
        if (newKey && result.obj && tt) {
          // 显示传送带悬停tooltip
          const belt = result.obj;
          const fromBld = this.grid[belt.fi];
          const toBld = this.grid[belt.ti];
          const fromName = fromBld ? (BLDS[fromBld.type]?.emoji || '') + ' ' + (BLDS[fromBld.type]?.n || '?') : '?';
          const toName = toBld ? (BLDS[toBld.type]?.emoji || '') + ' ' + (BLDS[toBld.type]?.n || '?') : '?';
          const lv = this.getBeltLevel(newKey);
          const eff = this.getBeltEfficiency(newKey);
          const cap = this.getBeltCapacity(newKey);
          const effPct = Math.round(eff * 100);
          const effColor = effPct >= 100 ? 'var(--cyan)' : effPct >= 70 ? 'var(--yellow)' : 'var(--orange)';
          const lvColor = lv >= 5 ? 'var(--purple)' : lv >= 3 ? 'var(--cyan)' : lv >= 2 ? 'var(--yellow)' : 'var(--orange)';
          // 计算两建筑的格子距离
          const gridSize = Math.round(Math.sqrt(this.grid.length));
          const r1 = Math.floor(belt.fi / gridSize), c1x = belt.fi % gridSize;
          const r2 = Math.floor(belt.ti / gridSize), c2x = belt.ti % gridSize;
          const cellDist = Math.abs(r1 - r2) + Math.abs(c1x - c2x);
          const distColor = cellDist <= 1 ? '#22c55e' : cellDist <= 2 ? 'var(--cyan)' : cellDist <= 3 ? 'var(--yellow)' : 'var(--orange)';
          const distLabel = cellDist <= 1 ? '📍 紧邻（最佳）' : cellDist <= 2 ? '📍 较近' : cellDist <= 3 ? '📍 中等距离' : '📍 较远';
          document.getElementById('ttName').innerHTML = `⛓ 传送带 <span style="color:${lvColor}">Lv.${lv}</span>`;
          // ★ 教学：构建同步信息行
          let syncLine = '';
          if (this.phase >= 3) {
            const toSync = this._syncBonuses[belt.ti];
            const fromSync = this._syncBonuses[belt.fi];
            const syncInfo = toSync || fromSync;
            if (syncInfo && syncInfo.inputCount >= 2) {
              const syncPct = Math.round(syncInfo.sync * 100);
              const bonusPct = Math.round(syncInfo.bonus * 100);
              const syncColor = syncPct >= 85 ? '#fbbf24' : syncPct >= 50 ? '#22c55e' : syncPct >= 30 ? 'var(--yellow)' : 'var(--orange)';
              const syncLabel = syncPct >= 85 ? '完美同步' : syncPct >= 50 ? '良好同步' : syncPct >= 30 ? '一般' : '失衡';
              syncLine = `<br><span style="color:${syncColor}">🔄 供给同步: ${syncPct}% (${syncLabel})</span>` +
                (bonusPct > 0 ? ` <span style="color:#22c55e">+${bonusPct}%产出</span>` : ' <span style="color:var(--dim)">需≥50%触发加成</span>');
            }
          }
          // v3.0 §4+§5: 距离衰减信息（含中继减半）
          const isRelayBelt = this._isBeltViaRelay(newKey);
          const distEffFactor = this._distanceEfficiency(cellDist, isRelayBelt);
          const distEffPct = Math.round(distEffFactor * 100);
          const relayHops = this._countRelayHops(newKey);
          const relayStr = isRelayBelt ? ` <span style="color:#60a5fa">📡 中继·衰减减半</span>` : '';
          const relayHopStr = relayHops > 0 ? `<br><span style="color:#60a5fa">📡 中继跳数: ${relayHops} (-${relayHops*5}%固定损耗)</span>` : '';
          const distEffStr = distEffFactor < 1 ? ` <span style="color:var(--orange)">📉 距离衰减: ${distEffPct}%</span>` : '';
          const beltMaintStr = cellDist >= BALANCE.beltMaintMinDist ? `<br><span style="color:var(--orange)">🔧 远距维护: -${(BALANCE.beltMaintPerDist * (cellDist - 2)).toFixed(1)}⚡/s</span>` : '';
          // v3.0 §7: 传输量/负载信息
          const loadData = this._beltLoadCache?.[newKey];
          const flowTotal = loadData?.totalFlow || 0;
          const loadLabel = flowTotal <= 0.01 ? '空闲' : flowTotal < 0.5 ? '低载' : flowTotal < 2.0 ? '正常' : '满载';
          const loadColor = flowTotal <= 0.01 ? '#64748b' : flowTotal < 0.5 ? '#eab308' : flowTotal < 2.0 ? '#22c55e' : '#f97316';
          const loadStr = `<br><span style="color:${loadColor}">📊 传输量: ${flowTotal.toFixed(1)}/s (${loadLabel})</span>`;
          document.getElementById('ttDesc').innerHTML =
            `${fromName} → ${toName}` +
            `<br><span style="color:${effColor}">⚡ 传输效率: ${effPct}%</span> · <span style="color:var(--color-info)">📦 容量: ${cap}/s</span>` +
            `<br><span style="color:${distColor}">${distLabel} (距离${cellDist}格)</span>${distEffStr}${relayStr}` +
            beltMaintStr + relayHopStr + loadStr +
            syncLine +
            `<br><span style="color:#7a9aba;font-size:0.9em">💡 距离越近效率越高；远距连线可获取额外邻接加成</span>` +
            `<br><span style="color:var(--dim);font-size:0.85em">点击可升级/撤销传送带</span>`;
          tt.classList.add('show');
          tt.style.left = Math.min(e.clientX + 14, window.innerWidth - 260) + 'px';
          tt.style.top = Math.min(e.clientY + 14, window.innerHeight - 140) + 'px';
          this._beltTooltipActive = true;
        } else if (!newKey && tt) {
          // 移出传送带，隐藏tooltip
          if (this._beltTooltipActive) {
            tt.classList.remove('show');
            this._beltTooltipActive = false;
          }
        }
      }
      // 跟随鼠标更新tooltip位置
      if (this._beltTooltipActive && this._hoverBeltKey) {
        const tt = document.getElementById('tooltip');
        if (tt) {
          tt.style.left = Math.min(e.clientX + 14, window.innerWidth - 260) + 'px';
          tt.style.top = Math.min(e.clientY + 14, window.innerHeight - 140) + 'px';
        }
      }
    });
    dishView.addEventListener('mouseleave', () => {
      if (this._hoverBeltKey) {
        this._hoverBeltKey = null;
        dishView.style.cursor = '';
      }
      // 隐藏传送带tooltip
      const tt = document.getElementById('tooltip');
      if (tt && this._beltTooltipActive) {
        tt.classList.remove('show');
        this._beltTooltipActive = false;
      }
    });

    const drawBg = () => {
      bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
      bgCtx.fillStyle = 'rgba(5,8,16,1)';
      bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
      bgCtx.strokeStyle = 'rgba(60,90,120,0.08)';
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
              const gapW = 16; // gap size (与CSS .grid gap一致)
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
              const gapH = 16;
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

    // ★ Phase C 视觉叙事：培养基生命感 — 营养粒子漂浮系统
    const NUTRIENT_COLORS = {
      1: ['#22c55e', '#06d6a0'],
      2: ['#f97316', '#22c55e', '#ec4899'],
      3: ['#3b82f6', '#22c55e', '#10b981'],
      4: ['#eab308', '#3b82f6', '#22c55e'],
      5: ['#a855f7', '#eab308', '#22c55e'],
    };
    const NUTRIENT_COUNT = { 1:20, 2:40, 3:70, 4:100, 5:150 };
    let _nutrientParticles = [];
    let _nutrientPhase = 0; // 上次初始化时的阶段

    const initNutrients = (w, h) => {
      const count = NUTRIENT_COUNT[this.phase] || 20;
      const pool = NUTRIENT_COLORS[this.phase] || NUTRIENT_COLORS[1];
      _nutrientParticles = [];
      for (let i = 0; i < count; i++) {
        _nutrientParticles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          sz: 0.8 + Math.random() * 1.8,
          spd: 0.05 + Math.random() * 0.25,
          ang: Math.random() * Math.PI * 2,
          alpha: 0.06 + Math.random() * 0.12,
          color: pool[Math.floor(Math.random() * pool.length)],
        });
      }
      _nutrientPhase = this.phase;
    };

    const drawNutrients = () => {
      const w = bgCanvas.width, h = bgCanvas.height;
      // 阶段变化时重新初始化
      if (_nutrientPhase !== this.phase || _nutrientParticles.length === 0) {
        initNutrients(w, h);
      }
      for (const p of _nutrientParticles) {
        // 布朗运动更新
        p.x += Math.cos(p.ang) * p.spd;
        p.y += Math.sin(p.ang) * p.spd;
        p.ang += (Math.random() - 0.5) * 0.15;
        // 边界循环
        if (p.x < -5) p.x = w + 5;
        if (p.x > w + 5) p.x = -5;
        if (p.y < -5) p.y = h + 5;
        if (p.y > h + 5) p.y = -5;
        // 绘制
        bgCtx.beginPath();
        bgCtx.arc(p.x, p.y, p.sz, 0, Math.PI * 2);
        bgCtx.fillStyle = p.color;
        bgCtx.globalAlpha = p.alpha;
        bgCtx.fill();
      }
      bgCtx.globalAlpha = 1;
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
    //   1. 阶段1: 自动连接（新手友好），阶段2+: 仅手动连接
    //   2. 每个 from 建筑实例对每种 flow 只连最近的 to 建筑实例（1:1最近匹配）
    //   3. 同一对格子之间只出一条传送带，多种资源合流显示（混合颜色/图标）
    //   4. 传送带路径不穿过其他已有建筑的格子
    //   5. 全局记录已占用的"格子间通道"，同通道不重复生成
    const computeBelts = () => {
      const bldMap = findBuildingCells();
      const occupiedCells = new Set();
      for (let i = 0; i < this.grid.length; i++) {
        if (this.grid[i]) occupiedCells.add(i);
      }

      const pairMap = {}; // "min-max" -> { fi, ti, flows:[], colors:[], icons:[], labels:[] }
      const usedEdges = new Set(); // 已占用的通道，"min-max" 形式

      // v2.0 §8.4: P1自动, P2 hybrid(自动+可选手动), P3+纯手动
      const beltMode = BELT_MODE[Math.min(this.phase, 3)] || 'manual';
      if (beltMode === 'auto' || beltMode === 'hybrid') {
        // Step 1: 为每个 flow，每个 from 实例找最近的 to 实例
        // ★ 使用全局最优匹配（抢占式），避免老建筑"占住"最近位
        const rawLinks = []; // { fi, ti, flow }
        for (const flow of FLOW_MAP) {
          const froms = bldMap[flow.from];
          const tos = bldMap[flow.to];
          if (!froms || !tos) continue;

          // 构建候选 pairs 并过滤距离 >4 的
          const pairs = [];
          for (const fi of froms) {
            for (const ti of tos) {
              const d = manhattan(fi, ti);
              if (d <= 4) pairs.push({ fi, ti, dist: d });
            }
          }
          if (pairs.length === 0) continue;
          pairs.sort((a, b) => a.dist - b.dist);

          // ★ 抢占式匹配：如果当前 pair 比已匹配的距离更短，则抢占
          // matchTo[ti] = { fi, dist }  记录每个 to 当前被谁匹配以及距离
          // matchFrom[fi] = ti          记录每个 from 匹配了哪个 to
          const matchTo = {};   // ti -> { fi, dist }
          const matchFrom = {}; // fi -> ti

          for (const p of pairs) {
            // from 已经匹配了，跳过
            if (matchFrom[p.fi] !== undefined) continue;

            const existing = matchTo[p.ti];
            if (!existing) {
              // to 空闲，直接匹配
              matchTo[p.ti] = { fi: p.fi, dist: p.dist };
              matchFrom[p.fi] = p.ti;
            } else if (p.dist < existing.dist) {
              // ★ 当前 from 比原先匹配的更近 → 抢占
              // 释放原先的 from，让它后续重新匹配
              delete matchFrom[existing.fi];
              matchTo[p.ti] = { fi: p.fi, dist: p.dist };
              matchFrom[p.fi] = p.ti;
            }
            // else: 当前 from 距离不比已匹配的近，跳过
          }

          // ★ 被抢占的 from 还没匹配，再做一轮补救
          const unmatchedFroms = froms.filter(fi => matchFrom[fi] === undefined);
          if (unmatchedFroms.length > 0) {
            const usedTos = new Set(Object.keys(matchTo).map(Number));
            for (const fi of unmatchedFroms) {
              let bestTi = -1, bestDist = 999;
              for (const ti of tos) {
                if (usedTos.has(ti)) continue;
                const d = manhattan(fi, ti);
                if (d <= 4 && d < bestDist) { bestDist = d; bestTi = ti; }
              }
              if (bestTi >= 0) {
                matchTo[bestTi] = { fi, dist: bestDist };
                matchFrom[fi] = bestTi;
                usedTos.add(bestTi);
              }
            }
          }

          // 收集结果
          for (const [ti, m] of Object.entries(matchTo)) {
            rawLinks.push({ fi: m.fi, ti: Number(ti), flow });
          }
        }

        // Step 2: 按格子对合并（v2.0: 增加端口约束检查）
        // portUsage 跟踪每个建筑已使用的输入/输出端口数
        const portUsage = {}; // idx -> { in: count, out: count }
        const getPortUsage = (idx) => {
          if (!portUsage[idx]) portUsage[idx] = { in: 0, out: 0 };
          return portUsage[idx];
        };
        for (const link of rawLinks) {
          const key = Math.min(link.fi, link.ti) + '-' + Math.max(link.fi, link.ti);
          if (this.removedBelts[key]) continue;

          // v2.0: 端口约束检查 — 自动连接也遵守端口限制
          const fromType = this.grid[link.fi]?.type;
          const toType = this.grid[link.ti]?.type;
          if (fromType && toType) {
            const fromPort = PORT_DEFS[fromType];
            const toPort = PORT_DEFS[toType];
            if (fromPort) {
              const usage = getPortUsage(link.fi);
              const techExtra = this._extraOutPorts || 0;
              const mpbF = this._mutPortBonuses?.[fromType];
              const mutExtraOut = mpbF ? mpbF.extraOut : 0;
              // v3.0 §9.2: 特化端口加成
              const specF = this._specCache?.perBuilding?.[link.fi];
              const specExtraOutF = (specF?.extraOutPort || 0) + (specF?.extraPorts || 0);
              if (usage.out >= fromPort.maxOut + techExtra + mutExtraOut + specExtraOutF) continue; // 输出端口已满
            }
            if (toPort) {
              const usage = getPortUsage(link.ti);
              const mpbT = this._mutPortBonuses?.[toType];
              const mutExtraIn = mpbT ? mpbT.extraIn : 0;
              // v3.0 §9.2: 特化端口加成
              const specT = this._specCache?.perBuilding?.[link.ti];
              const specExtraInT = specT?.extraPorts || 0;
              if (usage.in >= toPort.maxIn + mutExtraIn + specExtraInT) continue; // 输入端口已满
            }
          }

          if (!pairMap[key]) {
            const blocked = isBeltPathBlocked(link.fi, link.ti, occupiedCells);
            if (blocked) continue;
          }

          if (!pairMap[key]) {
            pairMap[key] = { fi: link.fi, ti: link.ti, flows: [], colors: [], icons: [], labels: [], isManual: false };
            usedEdges.add(key);
            // v2.0: 更新端口使用计数
            getPortUsage(link.fi).out++;
            getPortUsage(link.ti).in++;
          }
          const entry = pairMap[key];
          if (!entry.colors.includes(link.flow.color)) {
            entry.colors.push(link.flow.color);
            entry.icons.push(link.flow.icon);
            entry.labels.push(link.flow.label);
          }
          entry.flows.push(link.flow);
        }
      }

      // Step 4: 添加手动连接的传送带（所有阶段都生效）
      for (const [key, mb] of Object.entries(this.manualBelts)) {
        // 确保两端建筑仍然存在
        if (!this.grid[mb.fi] || !this.grid[mb.ti]) continue;
        if (!pairMap[key]) {
          pairMap[key] = { fi: mb.fi, ti: mb.ti, flows: [], colors: mb.colors || [], icons: mb.icons || [], labels: mb.labels || [], isManual: true, invalid: !!mb.invalid };
          usedEdges.add(key);
        } else {
          pairMap[key].isManual = true; // 标记为也含手动
          if (mb.invalid) pairMap[key].invalid = true;
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
      // v3.0 §7: 传送带负载缓存 — 预计算每条传送带的总流量和需求
      const _beltLoadCache = {};  // beltKey → { totalFlow, totalDemand, loadRatio }

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

        // ★ 方案F视觉：传送带颜色温度 — 目标建筑的同步度影响色调
        let syncGlow = null; // 同步光晕颜色
        const toSync = this._syncBonuses[belt.ti];
        const fromSync = this._syncBonuses[belt.fi];
        const relSync = toSync || fromSync;
        if (relSync && relSync.sync > 0) {
          const s = relSync.sync;
          if (s >= 0.85) syncGlow = 'rgba(251,191,36,0.3)';       // 金色 — 完美
          else if (s >= 0.6) syncGlow = 'rgba(34,197,94,0.2)';    // 绿色 — 良好
          else if (s >= 0.3) syncGlow = 'rgba(234,179,8,0.15)';   // 黄色 — 一般
          else syncGlow = 'rgba(239,68,68,0.15)';                  // 红色 — 失衡
        }
        
        // 传送带等级影响视觉
        const beltKey = Math.min(belt.fi, belt.ti) + '-' + Math.max(belt.fi, belt.ti);
        const beltLv = this.getBeltLevel(beltKey);
        const beltEff = this.getBeltEfficiency(beltKey);
        // v3.0 §4: 距离影响线条粗细
        const beltDist = this.getBeltDistance(beltKey);
        // v3.0 §5: 中继连线标识
        const isRelayBelt = this._isBeltViaRelay(beltKey);
        const distScale = beltDist <= 1 ? 1.0 : beltDist <= 2 ? 0.92 : beltDist <= 3 ? 0.8 : 0.65;
        const lvScale = (0.7 + beltLv * 0.15) * distScale;
        const trackW = (isMulti ? 10 : 8) * lvScale;  // 轨道宽度随等级增长（加粗），远距变细
        const innerW = (isMulti ? 7 : 5) * lvScale;

        // v3.0 §7.1: 传输量影响线条粗细
        const loadInfo = this._beltLoadCache?.[beltKey];
        const totalFlow = loadInfo?.totalFlow || 0;
        // 负载级别: 0=空闲, 1=低载, 2=正常, 3=满载
        const loadLevel = totalFlow <= 0.01 ? 0 : totalFlow < 0.5 ? 1 : totalFlow < 2.0 ? 2 : 3;

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

        // ★ v2.1: 休眠建筑 — 传送带灰色渲染，停止货物传输
        const fiDormant = this._dormantCells[belt.fi];
        const tiDormant = this._dormantCells[belt.ti];
        if (fiDormant || tiDormant) {
          const pulse = 0.2 + Math.sin(Date.now() / 800) * 0.08;
          // 灰色虚线轨道
          ctx.lineWidth = 5;
          ctx.strokeStyle = `rgba(80,90,100,${pulse})`;
          ctx.setLineDash([5, 5]);
          ctx.lineDashOffset = -(Date.now() / 300) % 10;
          ctx.lineCap = 'butt';
          ctx.lineJoin = 'miter';
          drawLPath(); ctx.stroke();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = `rgba(40,50,60,${pulse + 0.1})`;
          ctx.setLineDash([3, 3]);
          drawLPath(); ctx.stroke();
          ctx.setLineDash([]);
          // 两端灰色小方块
          const tSz = 2.5;
          ctx.fillStyle = `rgba(80,90,100,${pulse + 0.15})`;
          ctx.fillRect(sx - tSz, sy - tSz, tSz*2, tSz*2);
          ctx.fillRect(ex - tSz, ey - tSz, tSz*2, tSz*2);
          // 悬停高亮仍可操作
          if (this._hoverBeltKey === beltKey) {
            ctx.save();
            ctx.lineWidth = 8;
            ctx.strokeStyle = 'rgba(249,115,22,0.25)';
            ctx.setLineDash([]);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            drawLPath(); ctx.stroke();
            ctx.restore();
          }
          continue; // 跳过正常渲染和粒子
        }

        // ★ 无效传送带（没有 FLOW_MAP 对应关系）→ 灰色虚线渲染
        if (belt.invalid) {
          const pulse = 0.25 + Math.sin(Date.now() / 600) * 0.1;
          // 灰色虚线底色
          ctx.lineWidth = 4;
          ctx.strokeStyle = `rgba(80,90,100,${pulse})`;
          ctx.setLineDash([6, 6]);
          ctx.lineDashOffset = -(Date.now() / 200) % 12;
          ctx.lineCap = 'butt';
          ctx.lineJoin = 'miter';
          drawLPath(); ctx.stroke();
          // 暗灰色内线
          ctx.lineWidth = 2;
          ctx.strokeStyle = `rgba(50,60,70,${pulse + 0.15})`;
          ctx.setLineDash([4, 4]);
          drawLPath(); ctx.stroke();
          ctx.setLineDash([]);
          // 两端标记灰色小方块
          const tSz = 3;
          ctx.fillStyle = 'rgba(80,90,100,0.5)';
          ctx.fillRect(sx - tSz, sy - tSz, tSz*2, tSz*2);
          ctx.fillRect(ex - tSz, ey - tSz, tSz*2, tSz*2);
          // 中间显示无效标记
          const midX2 = isOrthogonal ? (sx+ex)/2 : mx;
          const midY2 = isOrthogonal ? (sy+ey)/2 : my;
          ctx.globalAlpha = 0.6;
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#f97316';
          ctx.fillText('⚠', midX2, midY2 - 8);
          ctx.font = '6px "Share Tech Mono", monospace';
          ctx.fillStyle = '#6b7280';
          ctx.fillText('无效', midX2, midY2 + 4);
          ctx.globalAlpha = 1;

          // 悬停高亮（即使无效也可以点击操作）
          if (this._hoverBeltKey === beltKey) {
            ctx.save();
            ctx.lineWidth = 8;
            ctx.strokeStyle = 'rgba(249,115,22,0.25)';
            ctx.setLineDash([]);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            drawLPath(); ctx.stroke();
            ctx.restore();
          }
          continue; // 跳过正常渲染
        }

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

        // -- 7) 起点端子（输入口） — 绿色(输入方向) --
        const termSz = trackW / 2 + 1;
        const firstSeg = segments[0];
        const fux = (firstSeg[2]-firstSeg[0]), fuy = (firstSeg[3]-firstSeg[1]);
        const fuLen = Math.sqrt(fux*fux+fuy*fuy);
        if (fuLen > 1) {
          const fnx = -fuy/fuLen, fny = fux/fuLen;
          // 输入口方块 — 绿色系
          ctx.fillStyle = 'rgba(15,35,25,0.9)';
          ctx.fillRect(sx - termSz, sy - termSz, termSz*2, termSz*2);
          ctx.strokeStyle = 'rgba(34,197,94,0.65)';
          ctx.lineWidth = 1;
          ctx.strokeRect(sx - termSz, sy - termSz, termSz*2, termSz*2);
          // 入口标识线 — 绿色
          ctx.fillStyle = 'rgba(34,197,94,0.35)';
          ctx.fillRect(sx - termSz + 1, sy - termSz + 1, termSz*2 - 2, 2);
        }

        // -- 8) 终点端子（输出口 + 箭头） — 橙色(输出方向) --
        const lastSeg = segments[segments.length - 1];
        const arrDx = lastSeg[2] - lastSeg[0], arrDy = lastSeg[3] - lastSeg[1];
        const arrLen = Math.sqrt(arrDx*arrDx + arrDy*arrDy);
        if (arrLen > 1) {
          const adxn = arrDx/arrLen, adyn = arrDy/arrLen;
          // 输出口方块 — 橙色系
          ctx.fillStyle = 'rgba(40,25,12,0.9)';
          ctx.fillRect(ex - termSz, ey - termSz, termSz*2, termSz*2);
          ctx.strokeStyle = 'rgba(249,115,22,0.65)';
          ctx.lineWidth = 1;
          ctx.strokeRect(ex - termSz, ey - termSz, termSz*2, termSz*2);
          // 输出方向箭头 — 橙色
          const triSz = 5;
          ctx.fillStyle = 'rgba(249,115,22,0.75)';
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

        // -- ★ 方案F：同步光晕叠加 --
        if (syncGlow) {
          ctx.save();
          ctx.lineWidth = trackW + 6;
          ctx.strokeStyle = syncGlow;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.setLineDash([]);
          drawLPath(); ctx.stroke();
          // 满同步时添加流动金色光点
          if (relSync && relSync.sync >= 0.85) {
            const pulsePhase = (t % 1500) / 1500;
            for (const seg of segments) {
              const sdx2 = seg[2]-seg[0], sdy2 = seg[3]-seg[1];
              const slen2 = Math.sqrt(sdx2*sdx2+sdy2*sdy2);
              if (slen2 < 5) continue;
              const gx = seg[0] + sdx2 * pulsePhase;
              const gy = seg[1] + sdy2 * pulsePhase;
              const grd = ctx.createRadialGradient(gx, gy, 0, gx, gy, 6);
              grd.addColorStop(0, 'rgba(251,191,36,0.4)');
              grd.addColorStop(1, 'rgba(251,191,36,0)');
              ctx.fillStyle = grd;
              ctx.beginPath();
              ctx.arc(gx, gy, 6, 0, Math.PI*2);
              ctx.fill();
            }
          }
          ctx.restore();
        }

        // -- v3.0 §5: 中继连线蓝色脉冲光晕 --
        if (isRelayBelt) {
          ctx.save();
          const relayPulse = 0.15 + Math.sin(t / 400) * 0.08;
          ctx.lineWidth = trackW + 4;
          ctx.strokeStyle = `rgba(96,165,250,${relayPulse})`;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.setLineDash([]);
          drawLPath(); ctx.stroke();
          // 中继标识小圆点在中点
          const midSeg = segments[Math.floor(segments.length / 2)];
          const rmx = (midSeg[0] + midSeg[2]) / 2;
          const rmy = (midSeg[1] + midSeg[3]) / 2;
          ctx.fillStyle = `rgba(96,165,250,${0.4 + Math.sin(t / 300) * 0.2})`;
          ctx.beginPath();
          ctx.arc(rmx, rmy, 3, 0, Math.PI*2);
          ctx.fill();
          ctx.restore();
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

        // v3.0 §7.2: 负载级别视觉反馈
        if (loadLevel === 0 && !belt.invalid) {
          // 空闲传送带：渲染虚线叠加提示
          const idlePulse = 0.08 + Math.sin(t / 600) * 0.04;
          ctx.save();
          ctx.lineWidth = trackW * 0.5;
          ctx.strokeStyle = `rgba(100,116,139,${idlePulse})`;
          ctx.setLineDash([3, 5]);
          ctx.lineDashOffset = -(t / 200) % 8;
          drawLPath(); ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }

        // Phase B §1: 低载传送带 — 稀疏流动虚线暗示微弱流动
        if (loadLevel === 1 && !belt.invalid) {
          ctx.save();
          const lowPulse = 0.10 + Math.sin(t / 500) * 0.05;
          ctx.lineWidth = trackW * 0.4;
          ctx.strokeStyle = mainColor + Math.round(lowPulse * 255).toString(16).padStart(2, '0');
          ctx.setLineDash([2, 8]);
          ctx.lineDashOffset = -(t / 160) % 10;
          drawLPath(); ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }

        // Phase B §2: 满载传送带 — 金黄光晕 + 加速流动虚线 + 脉冲扩散
        if (loadLevel === 3 && !belt.invalid) {
          ctx.save();
          // (a) 金黄色宽幅光晕底层
          const fullPulse = 0.25 + Math.sin(t / 300) * 0.10;
          ctx.lineWidth = trackW + 8;
          ctx.strokeStyle = `rgba(234,179,8,${fullPulse * 0.35})`;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.setLineDash([]);
          drawLPath(); ctx.stroke();

          // (b) 内层明亮金色带面叠加
          ctx.lineWidth = trackW - 2;
          ctx.strokeStyle = `rgba(251,191,36,${fullPulse * 0.18})`;
          drawLPath(); ctx.stroke();

          // (c) 快速流动虚线（速度是空闲的3倍）
          ctx.lineWidth = trackW * 0.5;
          ctx.strokeStyle = `rgba(251,191,36,${0.20 + fullPulse * 0.15})`;
          ctx.setLineDash([4, 3]);
          ctx.lineDashOffset = -(t / 50) % 7;  // 比空闲快4倍
          drawLPath(); ctx.stroke();
          ctx.setLineDash([]);

          // (d) 满载脉冲光点 — 沿路径快速行进的高亮光斑
          const pulsePeriod = 800;
          const pulseT = (t % pulsePeriod) / pulsePeriod;
          for (const seg of segments) {
            const sdx3 = seg[2] - seg[0], sdy3 = seg[3] - seg[1];
            const slen3 = Math.sqrt(sdx3*sdx3 + sdy3*sdy3);
            if (slen3 < 5) continue;
            const gpx = seg[0] + sdx3 * pulseT;
            const gpy = seg[1] + sdy3 * pulseT;
            const grd = ctx.createRadialGradient(gpx, gpy, 0, gpx, gpy, trackW * 0.8);
            grd.addColorStop(0, `rgba(251,191,36,${0.45 + fullPulse * 0.2})`);
            grd.addColorStop(0.5, 'rgba(234,179,8,0.12)');
            grd.addColorStop(1, 'rgba(234,179,8,0)');
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(gpx, gpy, trackW * 0.8, 0, Math.PI*2);
            ctx.fill();
          }
          ctx.restore();
        }

        // v3.0 §7.3: 距离标识 — 远距传送带中点显示距离数字
        if (beltDist >= 2 && !belt.invalid) {
          const distMidX = isOrthogonal ? (sx+ex)/2 : mx;
          const distMidY = isOrthogonal ? (sy+ey)/2 : my;
          // 距离圆形标签（在传送带法线方向偏移）
          const dSeg = segments[Math.floor(segments.length / 2)];
          const dsdx = dSeg[2] - dSeg[0], dsdy = dSeg[3] - dSeg[1];
          const dsLen = Math.sqrt(dsdx*dsdx + dsdy*dsdy);
          const dnx = dsLen > 1 ? -dsdy/dsLen : 0;
          const dny = dsLen > 1 ? dsdx/dsLen : -1;
          const dLabelX = distMidX + dnx * (trackW/2 + 8);
          const dLabelY = distMidY + dny * (trackW/2 + 8);
          // 背景圆
          const distColor = isRelayBelt ? '#60a5fa' : beltDist >= 3 ? '#f97316' : '#14b8a6';
          const distAlpha = 0.6 + Math.sin(t / 500) * 0.15;
          ctx.globalAlpha = distAlpha;
          ctx.fillStyle = 'rgba(8,14,24,0.85)';
          ctx.beginPath();
          ctx.arc(dLabelX, dLabelY, 6, 0, Math.PI*2);
          ctx.fill();
          ctx.strokeStyle = distColor + '80';
          ctx.lineWidth = 0.8;
          ctx.stroke();
          // 距离数字
          ctx.font = 'bold 7px "Share Tech Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = distColor;
          ctx.fillText(beltDist + '', dLabelX, dLabelY);
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
              const baseRate = this._calcBuildingFlowRate(actualFromIdx, flow.res);
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
                  flowRate = this._calcBuildingFlowRate(belt.fi, res);
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
                  flowRate = this._calcBuildingFlowRate(belt.ti, res);
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

      // v3.0 §7: 计算每条传送带的负载比率
      for (const f of activeFlows) {
        const k = f.beltKey;
        if (!k) continue;
        if (!_beltLoadCache[k]) _beltLoadCache[k] = { totalFlow: 0 };
        _beltLoadCache[k].totalFlow += (f.flowRate || 0);
      }
      // 缓存到实例变量给tooltip等使用
      this._beltLoadCache = _beltLoadCache;

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

        // Phase B: 根据负载级别调整货物箱视觉
        const beltLoad = this._beltLoadCache?.[p.beltKey];
        const pFlow = beltLoad?.totalFlow || 0;
        const pLoadLv = pFlow <= 0.01 ? 0 : pFlow < 0.5 ? 1 : pFlow < 2.0 ? 2 : 3;
        // 满载时货物放大1.3x，低载时缩小0.85x
        const loadScale = pLoadLv === 3 ? 1.3 : pLoadLv <= 1 ? 0.85 : 1.0;
        const boxW = p.sz * 2.2 * loadScale;
        const boxH = p.sz * 1.6 * loadScale;
        const alpha = 0.7 + Math.sin(p.t * Math.PI) * 0.2;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.atan2(uy, ux));

        // Phase B: 满载货物金色光晕
        if (pLoadLv === 3) {
          const glowR = boxW * 2.5;
          const grd = ctx.createRadialGradient(0, 0, boxW * 0.5, 0, 0, glowR);
          grd.addColorStop(0, 'rgba(251,191,36,0.18)');
          grd.addColorStop(1, 'rgba(251,191,36,0)');
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(0, 0, glowR, 0, Math.PI*2);
          ctx.fill();
        }

        // 货箱阴影
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-boxW + 0.5, -boxH + 0.5, boxW*2, boxH*2);

        // 货箱主体
        ctx.globalAlpha = alpha;
        ctx.fillStyle = pLoadLv === 3 ? '#fbbf24CC' : p.color + 'CC'; // 满载时金黄色
        ctx.fillRect(-boxW, -boxH, boxW*2, boxH*2);

        // 货箱边框
        ctx.strokeStyle = pLoadLv === 3 ? '#fbbf24' : p.color;
        ctx.lineWidth = pLoadLv === 3 ? 1.2 : 0.8;
        ctx.globalAlpha = alpha * 0.8;
        ctx.strokeRect(-boxW, -boxH, boxW*2, boxH*2);

        // 货箱中间横线（像包裹封条）
        ctx.beginPath();
        ctx.moveTo(-boxW, 0);
        ctx.lineTo(boxW, 0);
        ctx.strokeStyle = pLoadLv === 3 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // 货箱顶部高光
        ctx.fillStyle = pLoadLv === 3 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)';
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

    // ===== 邻接脉冲光波 =====
    // 有邻接加成的相邻建筑之间，在共享边缘产生流动光脉冲
    // 颜色 = 加成类别色，频率/亮度 = 加成强度
    let _adjPulseCache = null;
    let _adjPulseCacheTime = 0;
    const ADJ_PULSE_CACHE_MS = 2000; // 每2秒重新计算邻接对

    // 加成图标→颜色映射（与游戏主题一致）
    const ADJ_ICON_COLORS = {
      '🌱': '#22c55e', // 碳源系 — 绿
      '⚡': '#f59e0b', // 能量系 — 橙黄
      '🔗': '#06d6a0', // 供给链 — 青绿
      '🔋': '#f97316', // 能量直供 — 橙
      '💨': '#38bdf8', // 固氮 — 天蓝
      '⚗️': '#a855f7', // 代谢 — 紫
      '🧬': '#ec4899', // DNA — 粉
      '🧫': '#14b8a6', // 生物膜 — 青
      '📡': '#6366f1', // 信号 — 靛
      '🕸️': '#84cc16', // 菌丝 — 黄绿
      '♻️': '#10b981', // 代谢循环 — 绿
      '🪫': '#fb923c', // 缓冲 — 浅橙
      '🧪': '#c084fc', // 蛋白 — 浅紫
      '🔵': '#3b82f6', // 氮源 — 蓝
      '🍄': '#a3e635', // 孢子 — 亮绿
      '🫧': '#67e8f9', // 核糖体 — 亮青
      '🧱': '#d97706', // 生物质 — 深橙
      '🌀': '#818cf8', // 共振 — 浅靛
    };
    const ADJ_DEFAULT_COLOR = '#06d6a0';

    // 计算邻接脉冲对（缓存）
    const computeAdjPulsePairs = () => {
      const now = Date.now();
      // 网格有变化时立即重算，否则每2秒刷新
      if (_adjPulseCache && !this._chainsDirty && now - _adjPulseCacheTime < ADJ_PULSE_CACHE_MS) return _adjPulseCache;

      const pairs = []; // { idxA, idxB, bonus, color, direction }
      const cols = this.gridCols;
      const rows = this.gridRows;
      const seen = new Set();

      for (let idx = 0; idx < this.grid.length; idx++) {
        const g = this.grid[idx];
        if (!g) continue;
        const selfType = g.type;
        const bd = BLDS[selfType];
        if (!bd || bd.isBoost || bd.isWonder) continue;

        const r = Math.floor(idx / cols);
        const c = idx % cols;

        // 检查四个方向的邻居
        const dirs = [];
        if (r > 0) dirs.push({ ni: idx - cols, dir: 'up' });
        if (r < rows - 1) dirs.push({ ni: idx + cols, dir: 'down' });
        if (c > 0) dirs.push({ ni: idx - 1, dir: 'left' });
        if (c < cols - 1) dirs.push({ ni: idx + 1, dir: 'right' });

        for (const { ni, dir } of dirs) {
          const ng = this.grid[ni];
          if (!ng) continue;
          const nType = ng.type;

          // 检查是否有匹配的邻接规则
          let pairBonus = 0;
          let bestIcon = '🔗';

          for (const rule of ADJACENCY_RULES) {
            if (rule.self !== '*' && rule.self !== selfType) continue;
            if (rule.neighbor !== nType) continue;
            pairBonus += rule.bonus;
            bestIcon = rule.icon;
          }

          if (pairBonus <= 0) continue;

          // 避免重复（A→B 和 B→A）
          const pairKey = Math.min(idx, ni) + '-' + Math.max(idx, ni);
          if (seen.has(pairKey)) continue;
          seen.add(pairKey);

          // 确定方向（用于光脉冲流动方向）
          const color = ADJ_ICON_COLORS[bestIcon] || ADJ_DEFAULT_COLOR;
          pairs.push({ idxA: idx, idxB: ni, bonus: pairBonus, color, dir });
        }
      }

      _adjPulseCache = pairs;
      _adjPulseCacheTime = now;
      return pairs;
    };

    const drawAdjacencyPulse = () => {
      const gridEl = document.getElementById('grid');
      if (!gridEl || gridEl.children.length === 0) return;

      const pairs = computeAdjPulsePairs();
      if (pairs.length === 0) return;

      const pRect = canvas.parentElement.getBoundingClientRect();
      const t = Date.now();

      ctx.save();

      for (const pair of pairs) {
        const cellA = gridEl.children[pair.idxA];
        const cellB = gridEl.children[pair.idxB];
        if (!cellA || !cellB) continue;

        const rA = cellA.getBoundingClientRect();
        const rB = cellB.getBoundingClientRect();

        // 计算共享边缘在 canvas 坐标中的位置
        let edgeX1, edgeY1, edgeX2, edgeY2;
        const isHorizontal = (pair.dir === 'left' || pair.dir === 'right');

        if (isHorizontal) {
          // 水平相邻 — 共享边是垂直线段，在 gap 的中线
          const leftCell = pair.dir === 'right' ? rA : rB;
          const gapMidX = leftCell.right + 8 - pRect.left; // gap=16, 中点=8
          const topY = Math.max(rA.top, rB.top) - pRect.top;
          const botY = Math.min(rA.bottom, rB.bottom) - pRect.top;
          // 缩进一点，不占满整个边
          const inset = (botY - topY) * 0.12;
          edgeX1 = gapMidX; edgeY1 = topY + inset;
          edgeX2 = gapMidX; edgeY2 = botY - inset;
        } else {
          // 垂直相邻 — 共享边是水平线段
          const topCell = pair.dir === 'down' ? rA : rB;
          const gapMidY = topCell.bottom + 8 - pRect.top;
          const leftX = Math.max(rA.left, rB.left) - pRect.left;
          const rightX = Math.min(rA.right, rB.right) - pRect.left;
          const inset = (rightX - leftX) * 0.12;
          edgeX1 = leftX + inset;  edgeY1 = gapMidY;
          edgeX2 = rightX - inset; edgeY2 = gapMidY;
        }

        const edgeLen = Math.sqrt((edgeX2 - edgeX1) ** 2 + (edgeY2 - edgeY1) ** 2);
        if (edgeLen < 2) continue;

        // 加成强度映射到视觉参数
        const intensity = Math.min(pair.bonus / 0.4, 1); // 0~1
        const baseAlpha = 0.15 + intensity * 0.45; // 0.15~0.6
        // 脉冲频率：加成越高越快
        const pulseSpeed = 1500 - intensity * 800; // 1500ms~700ms
        const pulse = 0.5 + Math.sin(t * Math.PI * 2 / pulseSpeed) * 0.5; // 0~1 正弦波

        const alpha = baseAlpha * (0.5 + pulse * 0.5);
        const color = pair.color;

        // === 1) 边缘底层柔光（宽、淡） ===
        const glowWidth = 10 + intensity * 6; // 10~16
        ctx.lineWidth = glowWidth;
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha * 0.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(edgeX1, edgeY1);
        ctx.lineTo(edgeX2, edgeY2);
        ctx.stroke();

        // === 2) 边缘核心光线（窄、亮） ===
        const coreWidth = 2 + intensity * 2; // 2~4
        ctx.lineWidth = coreWidth;
        ctx.globalAlpha = alpha * 0.7;
        ctx.beginPath();
        ctx.moveTo(edgeX1, edgeY1);
        ctx.lineTo(edgeX2, edgeY2);
        ctx.stroke();

        // === 3) 流动光点（沿边缘移动的亮点） ===
        const dotSpeed = 2000 - intensity * 1000; // 2000ms~1000ms 走一个来回
        const dotPhase = (t % dotSpeed) / dotSpeed; // 0~1
        // 双向流动：两个点从两端相向移动
        for (let di = 0; di < 2; di++) {
          const dp = di === 0 ? dotPhase : (1 - dotPhase);
          const dx = edgeX1 + (edgeX2 - edgeX1) * dp;
          const dy = edgeY1 + (edgeY2 - edgeY1) * dp;
          const dotR = 1.5 + intensity * 1.5; // 1.5~3

          // 光点外晕
          const grad = ctx.createRadialGradient(dx, dy, 0, dx, dy, dotR * 3);
          grad.addColorStop(0, color);
          grad.addColorStop(1, color + '00');
          ctx.globalAlpha = alpha * 0.6;
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(dx, dy, dotR * 3, 0, Math.PI * 2);
          ctx.fill();

          // 光点核心
          ctx.globalAlpha = alpha * 1.2;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(dx, dy, dotR * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      ctx.restore();
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
      // ★ Phase C 视觉叙事：培养基营养粒子
      drawNutrients();

      // 先画临近弱连接
      drawProximityLinks();
      // 邻接加成脉冲光波（在弱连接之上、传送带之下）
      drawAdjacencyPulse();
      // 再画传送带轨道
      const activeFlows = drawConveyorBelts();
      // 生成传送带粒子
      spawnConveyorParticles(activeFlows);
      // 绘制传送带粒子
      drawConveyorParticles();
      // 放置预览
      drawBeltPreview();

      // 培养皿实验：3×3区域覆盖高亮
      if (this._petriMode && this._petriHoverIdx != null) {
        const zone = this._petriZone(this._petriHoverIdx);
        const gridEl = document.getElementById('grid');
        if (gridEl) {
          document.querySelectorAll('.cell.petri-zone').forEach(c => c.classList.remove('petri-zone'));
          document.querySelectorAll('.cell.petri-center').forEach(c => c.classList.remove('petri-center'));
          for (const zIdx of zone) {
            const cell = gridEl.children[zIdx];
            if (cell) cell.classList.add('petri-zone');
          }
          const centerCell = gridEl.children[this._petriHoverIdx];
          if (centerCell) centerCell.classList.add('petri-center');
        }
      }

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
        const wasHidden = card.classList.contains('hidden');
        const shouldShow = RES[k].phase <= this.phase;
        card.classList.toggle('hidden', !shouldShow);
        // ★ 新资源解锁脉冲动画：从 hidden → 可见 时触发
        if (wasHidden && shouldShow && this._gameReady) {
          card.classList.add('res-unlock-anim');
          card.addEventListener('animationend', () => {
            card.classList.remove('res-unlock-anim');
          }, { once: true });
        }
      }
      const valEl = document.getElementById('resVal-' + k);
      if (valEl) {
        const newVal = Math.floor(this.res[k] || 0);
        const oldVal = valEl._rawVal || 0;
        valEl.textContent = formatNum(newVal);
        valEl._rawVal = newVal;
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
          rateEl.textContent = formatRate(v);
          rateEl.className = 'res-rate pos';
        } else if (v < -0.01) {
          rateEl.textContent = formatRate(v);
          // H2: 当存量不足 30 秒净消耗时标记为 critical
          const stock = this.res[k] || 0;
          const isCritical = stock < Math.abs(v) * 30;
          rateEl.className = 'res-rate neg' + (isCritical ? ' critical' : '');
        } else {
          rateEl.textContent = '';
          rateEl.className = 'res-rate';
        }
      }
    }

    document.getElementById('statPop').textContent = formatNum(Math.floor(this.pop)) + '/' + formatNum(this._popCap());
    // 显示种群食物消耗 — 始终显示
    const popFoodRow = document.getElementById('rowPopFood');
    if (popFoodRow) {
      if (this.pop > 0) {
        const foodCost = this.pop * BALANCE.popFoodCost;
        document.getElementById('statPopFood').textContent = formatRate(-foodCost) + '🟢';
        document.getElementById('statPopFood').style.color = this.res.glucose >= this.pop * BALANCE.popFoodCost ? '#8a6a3a' : '#ef4444';
      } else {
        document.getElementById('statPopFood').textContent = '—';
        document.getElementById('statPopFood').style.color = 'var(--dim)';
      }
    }
    // 菌群分工面板 — 始终显示，pop<3 时禁用操作
    const allocPanel = document.getElementById('popAllocPanel');
    if (allocPanel) {
      this.updatePopAllocUI();
      // pop < 3 时添加 disabled 样式（3人是最少能每方向1人的阈值）
      const allocChannels = allocPanel.querySelector('.csb-alloc-channels');
      const allocPresets = allocPanel.querySelector('.alloc-presets');
      if (allocChannels) {
        if (this.pop < 3) {
          allocChannels.classList.add('alloc-disabled');
          if (allocPresets) allocPresets.classList.add('alloc-presets-disabled');
        } else {
          allocChannels.classList.remove('alloc-disabled');
          if (allocPresets) allocPresets.classList.remove('alloc-presets-disabled');
        }
      }
    }
    // 转生入口按钮 — 满足条件时显示
    const prestigeEntryBtn = document.getElementById('prestigeEntryBtn');
    if (prestigeEntryBtn) {
      prestigeEntryBtn.style.display = this.canPrestige() ? 'inline-block' : 'none';
    }
    // 功率水平指示器 — 始终显示
    const powerRow = document.getElementById('rowPowerLevel');
    const powerEl = document.getElementById('statPowerLevel');
    if (powerRow && powerEl) {
      if (this.pop > 0) {
        const pct = Math.round(this._foodPowerLevel * 100);
        powerEl.textContent = pct + '%';
        if (pct >= 100) {
          powerEl.style.color = '#22c55e';
        } else if (pct >= 70) {
          powerEl.style.color = '#f97316';
        } else {
          powerEl.style.color = '#ef4444';
        }
      } else {
        powerEl.textContent = '—';
        powerEl.style.color = 'var(--dim)';
      }
    }
    // 全局功率危机视觉效果
    const app = document.querySelector('.app');
    if (app) {
      app.classList.remove('power-warning', 'power-crisis');
      if (this._foodPowerLevel <= 0.4) {
        app.classList.add('power-crisis');
      } else if (this._foodPowerLevel <= 0.7) {
        app.classList.add('power-warning');
      }
    }
    // ★ 方案A UI：维护费显示 — P2起显示
    const maintRow = document.getElementById('rowMaintenance');
    const maintEl = document.getElementById('statMaintenance');
    if (maintRow && maintEl) {
      if (this.phase >= 2) {
        maintRow.style.display = '';
        const mc = this._maintenanceCost || {};
        const parts = [];
        if (mc.energy) parts.push(`-${formatNum(mc.energy, 1)}⚡`);
        if (mc.glucose) parts.push(`-${formatNum(mc.glucose, 1)}🟢`);
        if (mc.protein) parts.push(`-${formatNum(mc.protein, 1)}🧪`);
        const overheadPct = Math.round((this._maintenanceOverhead - 1) * 100);
        const beltMaintStr = this._beltMaintCost > 0 ? ` (含远距管线-${formatNum(this._beltMaintCost, 1)}⚡)` : '';
        maintEl.textContent = parts.length > 0 ? parts.join(' ') + (overheadPct > 0 ? ` (+${overheadPct}%开销)` : '') + beltMaintStr : '无';
        // 颜色：维护费越高越红
        const totalMaint = Object.values(mc).reduce((a,b) => a + b, 0);
        maintEl.style.color = totalMaint > 3 ? '#ef4444' : totalMaint > 1.5 ? '#f97316' : totalMaint > 0.5 ? '#eab308' : '#22c55e';
      } else {
        maintRow.style.display = 'none';
      }
    }
    // ★ 方案C UI：资源竞争显示 — P3起显示
    const compRow = document.getElementById('rowCompetition');
    const compEl = document.getElementById('statCompetition');
    if (compRow && compEl) {
      if (this.phase >= 3) {
        compRow.style.display = '';
        const tension = this._resourceTension || {};
        const penalty = this._competitionPenalty || {};
        // 找出最紧张的资源
        let worstRes = null, worstTension = 0;
        // v2.0: 使用动态阈值（考虑P3缓冲期）
        let uiThreshold = RESOURCE_COMPETITION.tensionThreshold;
        if (this.phase === 3 && this._p3EntryTime) {
          const elapsed = (Date.now() - this._p3EntryTime) / 1000;
          if (elapsed < RESOURCE_COMPETITION.p3BufferDuration) {
            const bufferT = RESOURCE_COMPETITION.p3BufferThreshold;
            const normalT = RESOURCE_COMPETITION.tensionThreshold;
            uiThreshold = bufferT - (bufferT - normalT) * (elapsed / RESOURCE_COMPETITION.p3BufferDuration);
          }
        }
        for (let k in tension) {
          if (tension[k] > worstTension && tension[k] > uiThreshold) {
            worstTension = tension[k];
            worstRes = k;
          }
        }
        if (worstRes) {
          const pct = Math.round(penalty[worstRes] * 100);
          const icon = RES[worstRes]?.icon || '📦';
          compEl.textContent = `${icon}紧张 ${pct}%效率`;
          compEl.style.color = pct < 70 ? '#ef4444' : pct < 85 ? '#f97316' : '#eab308';
        } else {
          compEl.textContent = '均衡';
          compEl.style.color = '#22c55e';
        }
      } else {
        compRow.style.display = 'none';
      }
    }
    document.getElementById('statEff').textContent = Math.round(this.gEff * 100) + '%';
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

    // 成就进度
    const achieveEl = document.getElementById('statAchieve');
    if (achieveEl) {
      const count = Object.keys(this.achievements).length;
      const total = ACHIEVE.length;
      achieveEl.textContent = `${count}/${total}`;
      achieveEl.style.color = count >= total ? '#a855f7' : count >= 20 ? '#fbbf24' : count >= 10 ? '#22c55e' : '#6889a8';
    }

    // 实时更新总分数 + 评级
    const scoreEl = document.getElementById('statScore');
    if (scoreEl) {
      const score = this.calcScore();
      const { rank, color: rankColor, glow } = this._scoreRank(score);
      scoreEl.textContent = formatNum(score);
      scoreEl.style.color = rankColor;
      const rankEl = document.getElementById('statRank');
      if (rankEl) {
        rankEl.textContent = rank;
        rankEl.style.color = rankColor;
        rankEl.style.borderColor = rankColor + '40';
        rankEl.style.background = rankColor + '15';
        rankEl.style.textShadow = glow ? `0 0 8px ${rankColor}` : 'none';
      }

      // 实时追踪历史最高分（当前局也算）
      const oldBest = parseInt(localStorage.getItem('bioHighScore') || '0', 10);
      if (score > oldBest) {
        localStorage.setItem('bioHighScore', String(score));
      }

      // v1.0.2: 检查评级首次达成奖励
      this._checkRatingRewards(score);

      // 显示历史最高分（只有重置过至少一次才有意义）
      const highScore = Math.max(score, parseInt(localStorage.getItem('bioHighScore') || '0', 10));
      const resets = parseInt(localStorage.getItem('bioResetCount') || '0', 10);
      const highRow = document.getElementById('highScoreRow');
      if (highRow) {
        if (resets > 0) {
          highRow.style.display = '';
          const hsEl = document.getElementById('statHighScore');
          const hrEl = document.getElementById('statHighRank');
          if (hsEl) hsEl.textContent = formatNum(highScore);
          if (hrEl) {
            const { rank: hRank, color: hColor } = this._scoreRank(highScore);
            hrEl.textContent = hRank;
            hrEl.style.color = hColor;
            hrEl.style.borderColor = hColor + '40';
            hrEl.style.background = hColor + '15';
          }
        } else {
          highRow.style.display = 'none';
        }
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
    // ARIA: 同步进化进度
    document.getElementById('evoBar').closest('[role="progressbar"]')?.setAttribute('aria-valuenow', Math.round(readyPct));

    // Dynamic evolution cost & resource status
    const evoCostInfo = document.getElementById('evoCostInfo');
    if (evoCostInfo) {
      const parts = [];
      for (let k in evoCost) parts.push(`${formatNum(evoCost[k])}${RES[k]?.icon||k}`);
      evoCostInfo.textContent = '需要: ' + parts.join(' + ');
    }

    const evoStatus = document.getElementById('evoResStatus');
    if (evoStatus) {
      let html = '';
      for (let k in evoCost) {
        const cur = Math.floor(this.res[k] || 0);
        const need = evoCost[k];
        const ok = cur >= need;
        html += `<span style="color:${ok ? 'var(--green)' : 'var(--red)'}"> ${RES[k]?.icon||k} ${formatNum(cur)}/${formatNum(need)}</span>`;
        html += `<span style="margin:0 6px;color:var(--color-separator)">|</span>`;
      }
      const allReady = readyPct >= 100;
      html += `<span style="color:${allReady ? 'var(--green)' : 'var(--red)'}">资源 ${allReady ? '✓ 就绪' : readyPct.toFixed(0) + '%'}</span>`;
      // ★ P1-2: 只在内容变化时才写入 innerHTML（避免每帧重解析）
      if (evoStatus._prevHtml !== html) {
        evoStatus.innerHTML = html;
        evoStatus._prevHtml = html;
      }
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
    this.updateSectionUnlocks();
    this.updateRedDots();

    // 建筑按钮可购买状态实时刷新（轻量 DOM 操作，不重建）
    // ★ P1-2: 缓存 querySelectorAll 结果，避免每帧查 DOM
    if (!this._buildBtnCache || this._buildBtnCacheDirty) {
      this._buildBtnCache = Array.from(document.querySelectorAll('#buildList .action-btn[data-b]'));
      this._buildBtnCacheDirty = false;
    }
    for (const btn of this._buildBtnCache) {
      const key = btn.dataset.b;
      if (!key || btn.classList.contains('locked')) continue;
      const canAfford = this.checkRes(this.scaledCost(key));
      btn.classList.toggle('cant-afford', !canAfford);
    }
  },

  // ===== H1: 智能告警摘要条 =====
  updateAlertBar() {
    const bar = document.getElementById('alertBar');
    if (!bar) return;

    const alerts = [];   // { icon, text, severity:'info'|'warn'|'danger' }

    // ── 1. 负速率资源检测 ──
    for (const k in this.rates) {
      const rate = this.rates[k];
      if (rate >= -0.01) continue;              // 只关注净消耗
      const stock = this.res[k] || 0;
      const meta  = RES[k];
      if (!meta) continue;
      const secLeft = stock / Math.abs(rate);   // 存量可撑秒数
      if (secLeft < 10) {
        alerts.push({
          icon: meta.icon, severity: 'danger',
          text: `${meta.n}即将耗尽(${Math.ceil(secLeft)}s)`
        });
      } else if (secLeft < 30) {
        alerts.push({
          icon: meta.icon, severity: 'warn',
          text: `${meta.n}告急(${Math.ceil(secLeft)}s)`
        });
      } else if (secLeft < 120) {
        alerts.push({
          icon: meta.icon, severity: 'info',
          text: `${meta.n}消耗中`
        });
      }
    }

    // ── 2. 休眠建筑检测 ──
    const dormCount = Object.keys(this._dormantCells).length;
    if (dormCount > 0) {
      alerts.push({
        icon: '💤', severity: 'info',
        text: `${dormCount}座建筑休眠中`
      });
    }

    // ── 3. 无告警 → 隐藏 ──
    if (alerts.length === 0) {
      bar.classList.remove('show', 'level-info', 'level-warn', 'level-danger');
      // 同时隐藏引导条内的告警区域
      const guideAlert = document.getElementById('dishGuideAlert');
      const guideSep   = document.getElementById('dishGuideSep');
      if (guideAlert) guideAlert.classList.remove('show', 'level-info', 'level-warn', 'level-danger');
      if (guideSep) guideSep.classList.remove('show');
      return;
    }

    // ── 4. 取最高严重级别 ──
    const sevOrder = { danger: 3, warn: 2, info: 1 };
    let maxSev = 'info';
    for (const a of alerts) {
      if (sevOrder[a.severity] > sevOrder[maxSev]) maxSev = a.severity;
    }

    // ── 5. 构造显示文本（最多取2条最严重的摘要） ──
    alerts.sort((a, b) => sevOrder[b.severity] - sevOrder[a.severity]);
    const top = alerts.slice(0, 2);
    const summary = top.map(a => `${a.icon} ${a.text}`).join('  ');

    // ── 6. 更新 DOM —— 合并到引导提示条右侧 ──
    // 隐藏独立告警条
    bar.classList.remove('show');

    const guideSep   = document.getElementById('dishGuideSep');
    const guideAlert = document.getElementById('dishGuideAlert');
    if (!guideAlert) return;

    guideAlert.classList.remove('show', 'level-info', 'level-warn', 'level-danger');
    if (guideSep) guideSep.classList.remove('show');

    if (alerts.length > 0) {
      guideAlert.classList.add('show', 'level-' + maxSev);
      if (guideSep) guideSep.classList.add('show');
      guideAlert.textContent = summary + (alerts.length > 2 ? ` +${alerts.length - 2}` : '');
    }

    // ── 7. 告警级别 warn/danger → 自动展开帝国总览 ──
    if (maxSev === 'warn' || maxSev === 'danger') {
      const empire = document.getElementById('empireOverview');
      if (empire && empire.classList.contains('collapsed')) {
        empire.classList.remove('collapsed');
        this._empireAutoCollapsed = false;
        // 标记为告警自动展开，恢复正常后自动收回
        this._empireAlertExpanded = true;
      }
    } else if (this._empireAlertExpanded) {
      // 告警降为 info → 自动收回（除非用户主动操作过）
      const empire = document.getElementById('empireOverview');
      if (empire && !empire.classList.contains('collapsed') && !this._empireUserCollapsed) {
        empire.classList.add('collapsed');
      }
      this._empireAlertExpanded = false;
    }
  },

  // ===== G3: 帝国总览折叠摘要 =====
  updateEmpireSummary() {
    const el = document.getElementById('empireOverviewSummary');
    if (!el) return;
    const container = document.getElementById('empireOverview');
    // 只在折叠状态才需要更新
    if (!container || !container.classList.contains('collapsed')) return;
    const phaseName = ['', '原始液泡', '代谢体', '物流网络', '群体感应'][this.phase] || `P${this.phase}`;
    const score = this.calcScore ? this.calcScore() : 0;
    const rank = this._scoreRank ? this._scoreRank(score).rank : '';
    const eff = Math.round((this.gEff || 1) * 100);
    el.textContent = `P${this.phase} ${phaseName}  ⚡${eff}%  🏆${formatNum(score)} [${rank}]`;
  },

  // ===== J1: 菌主形象常驻 =====
  _HOST_ICONS: { 1:'🦠', 2:'🧬', 3:'🧪', 4:'⚙️', 5:'🏛️' },
  updateHostAvatar() {
    const iconEl = document.getElementById('hostAvatarIcon');
    const statusEl = document.getElementById('hostAvatarStatus');
    if (!iconEl || !statusEl) return;

    // 更新阶段图标
    iconEl.textContent = this._HOST_ICONS[this.phase] || '🦠';

    // 根据状态选择状态语
    const dormCount = Object.keys(this._dormantCells).length;
    let hasNegCritical = false;
    let allPositive = true;
    for (const k in this.rates) {
      if (this.rates[k] < -0.01) {
        allPositive = false;
        const stock = this.res[k] || 0;
        if (stock < Math.abs(this.rates[k]) * 30) hasNegCritical = true;
      }
    }

    if (hasNegCritical) {
      statusEl.textContent = '你的菌群在呼救！';
      statusEl.style.color = '#fca5a5';
    } else if (dormCount > 0) {
      statusEl.textContent = `${dormCount}座建筑在休眠...`;
      statusEl.style.color = '#fbbf24';
    } else if (allPositive) {
      statusEl.textContent = '帝国运转良好！';
      statusEl.style.color = '#86efac';
    } else {
      statusEl.textContent = '安静地采集能量...';
      statusEl.style.color = 'rgba(160,180,210,0.7)';
    }
  },

  // ===== SECTION TOGGLE (折叠/展开) =====

  // === 引导目标元素 → 所属 section ID 映射 ===
  // 当引导指向某个 UI 元素时，自动展开它所在的折叠面板
  _GUIDE_SECTION_MAP: {
    'build':    'secBuild',      // 建造类引导 → 建造面板
    'research': 'techSection',   // 研究类引导 → 科技树面板
    'evolve':   'evoSection',    // 进化类引导 → 进化面板
    'mutLab':   'mutLabSection', // 变异实验室引导 → 变异面板
  },

  /** ★ 判断某个 section 的 sec-body 是否有独立滚动（由 CSS flex 控制高度） */
  _hasIndependentScroll(secId) {
    return secId === 'secBuild' || secId === 'techSection';
  },

  /** 确保目标 section 处于展开状态（引导系统调用） */
  _ensureSectionExpanded(secId) {
    if (!secId) return;
    const sec = document.getElementById(secId);
    if (!sec || !sec.classList.contains('collapsed')) return;

    // 静默展开（不触发音效、不更新 localStorage）
    const body = sec.querySelector('.sec-body');
    sec.classList.remove('collapsed');
    if (body) {
      const indepScroll = this._hasIndependentScroll(secId);
      if (indepScroll) {
        // ★ 独立滚动 section：不设 max-height，由 CSS flex 自动控制
        body.style.maxHeight = '';
      } else {
        const h = body.scrollHeight;
        body.style.maxHeight = h + 'px';
        let fired = false;
        const onEnd = () => {
          if (fired) return;
          fired = true;
          body.style.maxHeight = 'none';
          body.removeEventListener('transitionend', onEnd);
        };
        body.addEventListener('transitionend', onEnd);
        // ★ 超时保护
        setTimeout(onEnd, 400);
      }
    }

    // ARIA 同步
    const toggleBtn = sec.querySelector('.sec-toggle, .colony-status-toggle');
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');

    // 视觉反馈：短暂脉冲动画
    sec.classList.add('guide-expanded');
    setTimeout(() => sec.classList.remove('guide-expanded'), 700);

    // 更新 localStorage（标记为展开）
    try {
      const state = JSON.parse(localStorage.getItem('bioSphereSecState') || '{}');
      state[secId] = false;
      localStorage.setItem('bioSphereSecState', JSON.stringify(state));
    } catch(e) {}
  },

  /** 根据引导步骤文本判断目标 section 并自动展开 */
  _ensureGuideSectionVisible() {
    const steps = GUIDE[this.phase] || [];
    for (const step of steps) {
      if (!step.check(this)) continue;
      const text = step.text;

      // 建造类引导
      if (text.match(/建造「/)) {
        this._ensureSectionExpanded('secBuild');
        return;
      }
      // 研究类引导
      if (text.includes('研究') && text.includes('「')) {
        this._ensureSectionExpanded('techSection');
        return;
      }
      // 进化类引导
      if (text.includes('进化') && (text.includes('按钮') || text.includes('Lv'))) {
        this._ensureSectionExpanded('evoSection');
        return;
      }
      // 变异实验室引导
      if (text.includes('变异实验室')) {
        this._ensureSectionExpanded('mutLabSection');
        return;
      }
      return; // 其他步骤不需要展开
    }
  },
  /** 测量 sec-body 自然高度并设置 max-height（用于过渡动画） */
  _measureSecBody(secBody) {
    if (!secBody) return;
    // 临时移除 max-height 限制来测量自然高度
    const prev = secBody.style.maxHeight;
    secBody.style.maxHeight = 'none';
    const h = secBody.scrollHeight;
    secBody.style.maxHeight = prev;
    return h;
  },

  /** 初始化所有 sec-body 的 max-height（展开状态下） */
  _initSecBodyHeights() {
    document.querySelectorAll('.section .sec-body').forEach(body => {
      const sec = body.closest('.section');
      if (!sec || sec.classList.contains('collapsed')) return;
      // ★ 独立滚动的 section 由 CSS flex 控制高度，不设 max-height
      if (this._hasIndependentScroll(sec.id)) {
        body.style.maxHeight = '';
        return;
      }
      // ★ 初始化时直接设 'none'，不限制高度——避免内容尚未渲染时
      //   scrollHeight 为 0 导致 max-height 卡在过小值
      body.style.maxHeight = 'none';
    });
  },

  toggleSection(secId) {
    const sec = document.getElementById(secId);
    if (!sec) return;
    const body = sec.querySelector('.sec-body');
    const isCollapsing = !sec.classList.contains('collapsed');
    const indepScroll = this._hasIndependentScroll(secId);

    if (isCollapsing) {
      // 展开 → 折叠：先锁定当前高度，再触发过渡到 0
      if (body) {
        body.style.maxHeight = body.scrollHeight + 'px';
        // 强制 reflow 让浏览器注册当前值
        void body.offsetHeight;
      }
      sec.classList.add('collapsed');
      if (body) body.style.maxHeight = '0';
    } else {
      // 折叠 → 展开：先移除 collapsed，测量自然高度，设置 max-height
      sec.classList.remove('collapsed');
      if (body) {
        if (indepScroll) {
          // ★ 独立滚动 section：清除 max-height，由 CSS flex 控制
          body.style.maxHeight = '';
        } else {
          const h = body.scrollHeight;
          body.style.maxHeight = h + 'px';
          // 过渡结束后移除固定值，允许内容动态变化
          let fired = false;
          const onEnd = () => {
            if (fired) return;
            fired = true;
            body.style.maxHeight = 'none';
            body.removeEventListener('transitionend', onEnd);
          };
          body.addEventListener('transitionend', onEnd);
          // ★ 超时保护：如果 transitionend 未触发，400ms 后强制设为 'none'
          setTimeout(onEnd, 400);
        }
      }
    }

    SFX.click();
    // ARIA: 同步折叠状态
    const toggleBtn = sec.querySelector('.sec-toggle, .colony-status-toggle');
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', String(!isCollapsing));

    // 帝国总览：同步手动折叠标记
    if (secId === 'empireOverview') {
      this._empireUserCollapsed = sec.classList.contains('collapsed');
      this._empireAutoCollapsed = false; // 手动操作后清除自动标记
      this._empireAlertExpanded = false; // 手动操作后清除告警展开标记
    }
    // 记住折叠状态
    try {
      const state = JSON.parse(localStorage.getItem('bioSphereSecState') || '{}');
      state[secId] = sec.classList.contains('collapsed');
      localStorage.setItem('bioSphereSecState', JSON.stringify(state));
    } catch(e) {}
  },

  _restoreSectionStates() {
    try {
      const state = JSON.parse(localStorage.getItem('bioSphereSecState') || '{}');
      for (const [id, collapsed] of Object.entries(state)) {
        const sec = document.getElementById(id);
        if (sec && collapsed) {
          sec.classList.add('collapsed');
          // 折叠状态下 sec-body max-height 由 CSS !important 控制为 0
        }
      }
      // 展开状态的 sec-body 设置初始 max-height
      requestAnimationFrame(() => this._initSecBodyHeights());
    } catch(e) {}
  },

  // ===== SECTION UNLOCK (分步解锁) =====
  _unlocked: {},

  updateSectionUnlocks() {
    const hasBuilding = this.totalBuildings() > 0;
    const evoLv2 = this.eL >= 2;

    // 1. 帝国总览面板 — 始终显示（不再依赖建筑数量）
    // colonyStatusBar 现在是隐藏的兼容占位符，不需要操作
    // empireOverview 始终可见，无需条件控制

    // 2. 排行榜 + 迷你排行榜：进化 >= Lv.2 或转生过即解锁
    const miniLb = document.getElementById('miniLeaderboard');
    const lbWrap = document.getElementById('lbBtnWrap');
    const lbHint = document.getElementById('lbLockedHint');
    const lbUnlocked = evoLv2 || (this.prestigeCount || 0) >= 1;
    if (lbUnlocked) {
      if (miniLb) miniLb.style.display = '';
      if (lbWrap) lbWrap.style.display = '';
      if (lbHint) lbHint.classList.add('hidden');
    } else {
      if (miniLb) miniLb.style.display = 'none';
      if (lbWrap) lbWrap.style.display = 'none';
      if (lbHint) lbHint.classList.remove('hidden');
    }

    // 3. 进化详情：进化 >= Lv.2 或者已经研究过纯培养技术
    const showEvo = evoLv2 || (this.techs.pureCulture && this.techs.pureCulture.done);
    this._unlockSection('evoSection', showEvo, '🧬 进化面板 已解锁');

    // 4. 培养皿实验按钮：阶段2+ 显示
    const petriRow = document.getElementById('petriExpRow');
    if (petriRow) petriRow.style.display = this.phase >= 2 ? '' : 'none';

    // 5. ★ Q4：变异实验室面板
    const mutLabSec = document.getElementById('mutLabSection');
    if (mutLabSec) {
      if (this._mutLabUnlocked) {
        mutLabSec.style.display = '';
        if (!mutLabSec.classList.contains('unlocked')) {
          mutLabSec.classList.add('unlocked', 'sec-unlock-anim');
        }
      } else {
        mutLabSec.style.display = 'none';
      }
    }
  },

  _unlockSection(id, condition, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    if (condition) {
      if (!el.classList.contains('unlocked')) {
        el.classList.add('unlocked', 'sec-unlock-anim');
        if (!this._unlocked[id]) {
          this._unlocked[id] = true;
          // 只在首次解锁时飘字 + 音效（不在加载时）
          if (this._gameReady) {
            this.showUnlockFloat(msg);
            SFX.achieve();
          }
        }
      }
    }
  },

  _unlockEl(id, condition) {
    const el = document.getElementById(id);
    if (!el) return;
    if (condition) {
      el.classList.add('unlocked');
    }
  },

  // === 解锁飘字 ===
  showUnlockFloat(text) {
    const el = document.createElement('div');
    el.className = 'unlock-float';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  },

  // ===== GUIDE ENHANCEMENT (强引导) =====
  _prevGuideKey: null,  // 追踪上一次的引导建筑 key

  // 从引导文本解析需要建造的建筑 key
  _guideTargetBuilding() {
    const steps = GUIDE[this.phase] || [];
    for (const step of steps) {
      if (step.check(this)) {
        // 匹配「建造」类引导
        const m = step.text.match(/建造「(.+?)」/);
        if (m) {
          const name = m[1];
          for (const key in BLDS) {
            if (BLDS[key].n === name) return key;
          }
        }
        return null;
      }
    }
    return null;
  },

  // 高亮对应的建造按钮
  updateGuideHighlight() {
    const targetKey = this._guideTargetBuilding();

    // 清除旧高亮
    document.querySelectorAll('.action-btn.guide-highlight').forEach(btn => {
      btn.classList.remove('guide-highlight');
    });
    // ★ 清除全局浮层 tooltip 和箭头
    document.querySelectorAll('.guide-tooltip-float,.guide-arrow-float').forEach(e => e.remove());

    if (!targetKey) { this._prevGuideKey = null; return; }

    // 确保建造面板展开
    this._ensureSectionExpanded('secBuild');

    // 新目标出现时的完成反馈
    if (this._prevGuideKey && this._prevGuideKey !== targetKey && this._gameReady) {
      this.showUnlockFloat('✓ 完成！继续下一步');
      SFX.reward();
    }
    this._prevGuideKey = targetKey;

    // 高亮目标建造按钮
    const btn = document.querySelector(`.action-btn[data-b="${targetKey}"]`);
    if (btn && !btn.classList.contains('locked')) {
      btn.classList.add('guide-highlight');
      // ★ 使用全局 fixed 浮层（不会被 overflow:hidden 裁剪）
      this._updateGuideFloats(btn, targetKey);
    }
  },

  /** ★ 更新引导全局浮层（tooltip + 箭头），用 fixed 定位避免 overflow 裁剪 */
  _updateGuideFloats(btn, targetKey) {
    // 移除旧浮层
    document.querySelectorAll('.guide-tooltip-float,.guide-arrow-float').forEach(e => e.remove());
    if (!btn) return;

    const rect = btn.getBoundingClientRect();

    // tooltip 浮层（在按钮上方）
    const tip = document.createElement('div');
    tip.className = 'guide-tooltip-float';
    tip.textContent = BLDS[targetKey].ratio || '点击选择 → 放入培养皿';
    tip.style.left = rect.left + 'px';
    tip.style.top = (rect.top - 28) + 'px';
    document.body.appendChild(tip);

    // 箭头浮层（在按钮右侧）
    const arrow = document.createElement('div');
    arrow.className = 'guide-arrow-float';
    arrow.textContent = '👈 点这里';
    arrow.style.left = (rect.right + 6) + 'px';
    arrow.style.top = (rect.top + rect.height / 2 - 8) + 'px';
    document.body.appendChild(arrow);
  },

  // ===== NEWBIE HAND GUIDE (一阶段虚幻小手引导) =====
  _guideHandEl: null,
  _guideHandRingEl: null,
  _guideHandActive: false,
  _guideHandTarget: null, // 'build:key' | 'grid' | 'research:key' | 'evolve' | 'coreUpgrade'
  _guideHandTimer: null,

  // 初始化小手引导（游戏开始时调用）
  _initGuideHand() {
    // 如果已经创建过就跳过
    if (this._guideHandEl) return;

    // 创建小手 overlay
    const hand = document.createElement('div');
    hand.className = 'guide-hand-overlay';
    hand.id = 'guideHandOverlay';
    hand.innerHTML = `
      <svg class="guide-hand" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="arrowGlow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <linearGradient id="arrowGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#06d6a0"/>
            <stop offset="100%" stop-color="#00b386"/>
          </linearGradient>
        </defs>
        <g filter="url(#arrowGlow)" transform="rotate(135,32,32)">
          <path d="M32 6 L56 30 L44 30 L44 56 L20 56 L20 30 L8 30 Z"
                fill="url(#arrowGrad)" fill-opacity="0.85"
                stroke="rgba(6,214,160,0.9)" stroke-width="2" stroke-linejoin="round"/>
        </g>
      </svg>
      <div class="guide-hand-bubble" id="guideHandBubble"></div>
    `;
    hand.style.display = 'none';
    document.body.appendChild(hand);
    this._guideHandEl = hand;

    // 创建目标高亮光圈
    const ring = document.createElement('div');
    ring.className = 'guide-hand-ring';
    ring.id = 'guideHandRing';
    ring.style.display = 'none';
    document.body.appendChild(ring);
    this._guideHandRingEl = ring;
  },

  // 根据当前引导状态判断小手应该指向哪里
  _getGuideHandTarget() {
    if (this.phase !== 1) return null; // 阶段2+不再需要小手

    const steps = GUIDE[1] || [];
    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].check(this)) continue;
      const text = steps[i].text;

      // 建造类引导 → 先检查是否已选中建筑
      const buildMatch = text.match(/建造「(.+?)」/);
      if (buildMatch) {
        const name = buildMatch[1];
        let bldKey = null;
        for (const key in BLDS) {
          if (BLDS[key].n === name) { bldKey = key; break; }
        }
        if (bldKey) {
          // 如果玩家已选中该建筑，指向培养皿空格
          if (this.sel === bldKey) {
            return { type: 'grid', text: '点击空格放置建筑！', icon: steps[i].icon };
          }
          return { type: 'build', key: bldKey, text: `选择「${name}」`, icon: steps[i].icon };
        }
      }

      // 研究类引导
      if (text.includes('研究') && text.includes('「')) {
        const resMatch = text.match(/「(.+?)」/);
        if (resMatch) {
          const techName = resMatch[1];
          let techKey = null;
          for (const k in TECHS) {
            if (TECHS[k].n === techName) { techKey = k; break; }
          }
          if (techKey) {
            return { type: 'research', key: techKey, text: `点击研究「${techName}」`, icon: steps[i].icon };
          }
        }
      }

      // 进化类引导
      if (text.includes('进化') && (text.includes('按钮') || text.includes('Lv'))) {
        if (this.canEvolve()) {
          return { type: 'evolve', text: '点击「进化」按钮！', icon: steps[i].icon };
        }
        return null; // 资源不够时不显示小手
      }

      // DNA合成中...等待类，不显示小手
      if (text.includes('攒到') || text.includes('合成中') || text.includes('攒够')) {
        return null;
      }

      return null;
    }
    return null;
  },

  // 更新小手位置和可见性
  _updateGuideHand() {
    if (!this._guideHandEl) this._initGuideHand();

    const target = this._getGuideHandTarget();
    const hand = this._guideHandEl;
    const ring = this._guideHandRingEl;
    const bubble = document.getElementById('guideHandBubble');

    // 阶段2+ 或无目标 → 隐藏小手
    if (!target || this.phase !== 1) {
      hand.style.display = 'none';
      ring.style.display = 'none';
      this._guideHandActive = false;
      return;
    }

    // 找到目标元素的位置
    let targetEl = null;
    let bubbleText = target.text;

    // 根据目标类型自动展开折叠面板
    if (target.type === 'build') {
      this._ensureSectionExpanded('secBuild');
      targetEl = document.querySelector(`.action-btn[data-b="${target.key}"]`);
      if (!targetEl || targetEl.classList.contains('locked')) {
        hand.style.display = 'none';
        ring.style.display = 'none';
        return;
      }
    } else if (target.type === 'grid') {
      // 指向第一个空格子
      const gridEl = document.getElementById('grid');
      if (gridEl) {
        for (let ci = 0; ci < gridEl.children.length; ci++) {
          if (!this.grid[ci]) {
            targetEl = gridEl.children[ci];
            break;
          }
        }
      }
    } else if (target.type === 'research') {
      this._ensureSectionExpanded('techSection');
      targetEl = document.querySelector(`.tech-btn[data-t="${target.key}"]`);
      if (!targetEl) {
        // 尝试查找包含科技名的按钮
        document.querySelectorAll('.tech-btn').forEach(btn => {
          if (btn.textContent.includes(target.key) || btn.dataset.t === target.key) {
            targetEl = btn;
          }
        });
      }
    } else if (target.type === 'evolve') {
      this._ensureSectionExpanded('evoSection');
      targetEl = document.getElementById('evoBtn');
    }

    if (!targetEl) {
      hand.style.display = 'none';
      ring.style.display = 'none';
      return;
    }

    // ★ 确保目标在独立滚动容器的可视区内（修复建造面板独立滚动后小手飞出问题）
    const scrollParent = targetEl.closest('.sec-body');
    if (scrollParent && scrollParent.scrollHeight > scrollParent.clientHeight) {
      targetEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    // 计算位置
    // ★ SVG箭头旋转135°后尖端在overlay内约(41,41)处
    //   要让尖端指向按钮中心: handPos = btnCenter - tipOffset
    const rect = targetEl.getBoundingClientRect();
    const tipOffX = 41; // 旋转后箭头尖端在overlay内的X偏移
    const tipOffY = 41; // 旋转后箭头尖端在overlay内的Y偏移
    const handX = rect.left + rect.width / 2 - tipOffX;
    const handY = rect.top + rect.height / 2 - tipOffY;

    hand.style.display = 'block';
    hand.style.left = handX + 'px';
    hand.style.top = handY + 'px';

    // 更新气泡文字
    if (bubble) {
      bubble.textContent = `${target.icon || '👆'} ${bubbleText}`;
    }

    // 更新高亮光圈
    ring.style.display = 'block';
    ring.style.left = (rect.left - 4) + 'px';
    ring.style.top = (rect.top - 4) + 'px';
    ring.style.width = (rect.width + 8) + 'px';
    ring.style.height = (rect.height + 8) + 'px';

    this._guideHandActive = true;
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
    // 包含：活跃链条数、传送带数量、每条传送带的key+等级、邻接统计
    let hashParts = [];
    // ★ v0.9.3：邻接统计纳入hash
    const adjHash = this._getAdjStats();
    hashParts.push('ADJ:' + adjHash.adjCount + ':' + Math.round(adjHash.totalBonus * 100));
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

    // --- ★ 邻接加成：紧凑进度条样式 ---
    const adjStats = this._getAdjStats();
    if (adjStats.adjCount > 0) {
      hasActive = true;
      const totalPct = Math.round(adjStats.totalBonus * 100);
      const barPct = Math.min(totalPct, 100); // 进度条最多100%宽度
      const barColor = totalPct >= 50 ? '#fbbf24' : totalPct >= 20 ? '#06d6a0' : '#3b82f6';
      const adjEl = document.createElement('div');
      adjEl.style.cssText = 'padding:4px 0 5px;border-bottom:1px solid rgba(6,214,160,0.08)';
      // 保持 Top5 折叠状态
      const wasTop5Hidden = list.parentElement?.querySelector('.adj-top5-list.adj-hidden') !== null;
      adjEl.innerHTML = `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
          <span style="color:#06d6a0;font-size:0.85em;white-space:nowrap">🔗 ×${adjStats.adjCount}</span>
          <div style="flex:1;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden">
            <div style="width:${barPct}%;height:100%;background:${barColor};border-radius:3px;transition:width 0.4s"></div>
          </div>
          <span style="color:${barColor};font-size:0.8em;font-weight:700;font-family:'Orbitron',monospace;white-space:nowrap">+${totalPct}%</span>
        </div>` + (adjStats.top5.length > 0 ? `<div style="display:flex;align-items:center;gap:4px;cursor:pointer" onclick="this.nextElementSibling.classList.toggle('adj-hidden')">
          <span style="font-size:0.7em;color:var(--dim)">▾ Top ${adjStats.top5.length}</span>
          ${adjStats.top5.slice(0, 3).map(item => {
            const bld = BLDS[item.type];
            return `<span style="font-size:0.75em" title="${bld?.n||'?'} +${Math.round(item.bonus*100)}%">${bld?.emoji||'?'}</span>`;
          }).join('')}
        </div>
        <div class="adj-top5-list${wasTop5Hidden !== false ? ' adj-hidden' : ''}" style="padding:2px 0 0 4px;font-size:0.72em;line-height:1.5">${adjStats.top5.map((item, i) => {
          const bld = BLDS[item.type];
          const name = (bld?.emoji||'')+(bld?.n||'?');
          const pct = Math.round(item.bonus*100);
          const pctColor = pct >= 30 ? '#fbbf24' : pct >= 15 ? '#06d6a0' : '#8aa0c0';
          return `<span style="cursor:pointer;display:inline-block;margin-right:5px" onclick="G._focusCell(${item.idx})">${['🥇','🥈','🥉','④','⑤'][i]}${name} <span style="color:${pctColor};font-weight:600">+${pct}%</span></span>`;
        }).join('')}</div>` : '');
      list.appendChild(adjEl);
    }

    // --- 流水线链：图标化管线 ---
    const activeChains = CHAINS.filter(ch => ch.reqs.every(r => this.grid.some(g => g && g.type === r)));
    if (activeChains.length > 0) {
      hasActive = true;
      const chainEl = document.createElement('div');
      chainEl.style.cssText = 'padding:3px 0 4px;border-bottom:1px solid rgba(255,255,255,0.04);display:flex;flex-wrap:wrap;gap:3px 2px;align-items:center';
      const pillStyle = 'display:inline-flex;align-items:center;gap:2px;padding:1px 5px;border-radius:8px;font-size:0.72em;font-weight:600;white-space:nowrap';
      const arrowStyle = 'color:var(--dim);font-size:0.7em;margin:0 1px';
      chainEl.innerHTML = activeChains.map(ch => {
        // steps: ['输入', '→', '输出']
        const input = ch.steps[0];
        const output = ch.steps[2];
        return `<span style="${pillStyle};background:rgba(255,255,255,0.04);color:var(--dim)">${input}</span>`
          + `<span style="${arrowStyle}">▸</span>`
          + `<span style="${pillStyle};background:rgba(6,214,160,0.08);color:#86efac">${output}</span>`;
      }).join('<span style="width:4px"></span>');
      list.appendChild(chainEl);
    }

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
        const avgEff2 = count > 0 ? grp.keys.reduce((s, k) => s + this.getBeltEfficiency(k), 0) / count : 0;
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
        const avgCap = count > 0 ? grp.keys.reduce((s, k) => s + this.getBeltCapacity(k), 0) / count : 0;
        const capStr = formatNum(avgCap, 1);
        row.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
            <span style="font-size:0.95em;color:var(--color-info)">${resIcons} ${grp.fromName} → ${grp.toName}${countTag}</span>
            <span style="font-size:0.85em;color:${lvColor};font-family:'Orbitron',monospace;font-weight:700">Lv.${minLv}${maxTag}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:0.75em;color:var(--color-muted-dark);font-family:'Share Tech Mono',monospace;letter-spacing:1px">${lvBar}</span>
            <span style="font-size:0.85em"><span style="color:${effColor};font-weight:600">${effPct}%</span> <span style="color:var(--color-muted);font-size:0.85em">|📦${capStr}/s</span></span>
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

    section.style.display = hasActive ? '' : 'none';
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
        this._hidePopup('eventPopup');
      }
    });
  },

  closeEvent() {
    this._hidePopup('eventPopup');
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
  // type: 'w'=橙色警告, 's'=绿色成功, 'e'=红色错误, 默认=红色
  showCursorTooltip(text, type) {
    // 移除旧的
    document.querySelectorAll('.cursor-tooltip').forEach(e => e.remove());
    const tip = document.createElement('div');
    tip.className = 'cursor-tooltip' + (type ? ' ct-' + type : '');
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
  // J2: 叙事化文案映射
  _NARRATIVE_MAP: [
    [/阻塞/g, '饥饿'],
    [/回收建筑/g, '分解重组'],
    [/升级到/g, '进化至'],
    [/建造了/g, '培育了'],
    [/连接传送带/g, '延伸菌丝网络'],
    [/资源不足/g, '养分匮乏'],
    [/效率(\d+)%/, '菌群活力$1%'],
  ],
  log(msg, type) {
    // J2: 叙事化文案
    for (const [re, rep] of this._NARRATIVE_MAP) {
      msg = msg.replace(re, rep);
    }
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
    // ★ 警告/错误日志自动在鼠标旁显示提示，避免只写日志框看不见
    if (type === 'w' || type === 'e') {
      this.showCursorTooltip(msg, type);
    }
  },

  // ===== CONTROLS =====
  toggleSpeed() {
    const maxSpd = this._unlockedMilestones?.turbo ? 4 : 2;
    let next = this.spd * 2;
    if (next > maxSpd) next = 1;
    this.spd = next;
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
    // 阶段1-2不保存存档（让新手快速体验，到阶段3才开始持久化）
    // 但转生玩家（prestigeCount >= 1）始终可以保存，避免转生后P1→P3期间关页面丢进度
    if (this.phase < 3 && !(this.prestigeCount >= 1)) {
      if (!silent) this.log('▸ 阶段3前进度不保存 — 加油升阶！', 'w');
      return;
    }
    try {
      const s = {
        res: this.res, grid: this.grid, gridSize: this.gridSize, gridCols: this.gridCols, gridRows: this.gridRows, techs: this.techs,
        pop: this.pop, gEff: this.gEff, eL: this.eL, eP: this.eP,
        phase: this.phase, rt: this.rt, rTech: this.rTech, rProg: this.rProg,
        wBuild: this.wBuild, wProg: this.wProg, wonderComplete: this.wonderComplete,
        _wonderEventsTriggered: this._wonderEventsTriggered || [],  // ★ 改进2：奇观建造事件记录
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
        _energyAdjBonus: this._energyAdjBonus,
        _extraOutPorts: this._extraOutPorts,
        _beltCapBonus: this._beltCapBonus,
        _p3EntryTime: this._p3EntryTime,
        // v2.0: 教学flag持久化
        _p2PortTutorialPending: this._p2PortTutorialPending,
        _p3LogisticsTutorialPending: this._p3LogisticsTutorialPending,
        _adjPreviewShown: this._adjPreviewShown,
        _competitionEnabled: this._competitionEnabled,
        _competitionTutorialShown: this._competitionTutorialShown,
        _portFullShown: this._portFullShown,
        // v3.0 §4: 远距首次弹窗标志
        _firstDist2Shown: this._firstDist2Shown,
        _firstDist3Shown: this._firstDist3Shown,
        _firstDist4Shown: this._firstDist4Shown,
        // v3.0 §2: 探索度
        _prevExplScore: this._prevExplScore || 0,
        // v3.0 §1: 培养任务
        _evoTaskId: this._evoTask?.id || null,
        _evoTaskBase: this._evoTaskBase,
        _evoEconTimer: this._evoEconTimer || 0,
        _evoTaskStartTime: this._evoTaskStartTime || 0,
        _nitrogenBonus: this._nitrogenBonus,
        _proteinBonus: this._proteinBonus,
        _transportBonus: this._transportBonus,
        _popCapBonus: this._popCapBonus,
        _popEffMult: this._popEffMult,
        _qsDecayMult: this._qsDecayMult,
        _qsCapBonus: this._qsCapBonus,
        _evoBoostMult: this._evoBoostMult,
        // Achievement milestones & power tracking
        _claimedMilestones: this._claimedMilestones || {},
        _everLowPower: this._everLowPower || false,
        _recoveredFromCrisis: this._recoveredFromCrisis || false,
        _everMaintDeficit: this._everMaintDeficit || false,
        // Population allocation
        popAlloc: this.popAlloc,
        // Petri experiment
        _petriCooldown: this._petriCooldown || 0,
        _petriBuff: this._petriBuff || null,
        _petriCount: this._petriCount || 0,
        _petriActiveZone: this._petriActiveZone || null,
        _petriP3Unlocked: this._petriP3Unlocked || false, // v2.1 §8.2
        // ★ Q4：变异实验室
        _mutLabUnlocked: this._mutLabUnlocked || false,
        _mutSlots: this._mutSlots || [],
        _mutBrewing: this._mutBrewing || null,
        _mutOffers: this._mutOffers || [],
        _mutHistory: this._mutHistory || [],
        _mutPortTargets: this._mutPortTargets || {},  // v2.1 §9.2
        _presPortTargets: this._presPortTargets || [], // v2.1 §9.3
        _discoveredAdj: this._discoveredAdj || {},     // v2.1 §10.4
        _dormantCells: this._dormantCells || {},       // v2.1 建筑休眠
        _p3bUnlocked: this._p3bUnlocked || false,     // v3.0 §6 P3b子阶段
        _p3bExplScore: this._p3bExplScore || 0,        // v3.0 §6
        _specializations: this._specializations || {},  // v3.0 §9.2 建筑特化
        _mutCategoryLock: this._mutCategoryLock || null,
        _mutBrewCount: this._mutBrewCount || 0,
        // ★ 终局高潮系统
        _afterglowActive: this._afterglowActive || false,
        _wonderSprintActive: this._wonderSprintActive || false,
        // v3.0 §8.3: 催化剂状态
        _catalysts: this._catalysts || {},
      };
      localStorage.setItem('bioSphereV3', JSON.stringify(s));
      if (!silent) this.log('▸ 已保存', 's');
      // 静默同步排行榜（节流 5 分钟一次）
      if (silent) this._autoSubmitScore();
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
      // 阶段3前的存档不恢复（清理旧版遗留）
      if ((s.phase || 1) < 3) {
        localStorage.removeItem('bioSphereV3');
        return;
      }
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
      this.pop = s.pop ?? 0;
      this.gEff = s.gEff ?? 1;
      this.eL = s.eL ?? 1;
      this.eP = s.eP ?? 0;
      this.phase = s.phase ?? 1;
      this.rt = s.rt ?? 0;
      this.rTech = s.rTech;
      this.rProg = s.rProg ?? 0;
      this.wBuild = s.wBuild;
      this.wProg = s.wProg ?? 0;
      this.wonderComplete = s.wonderComplete || false;
      this._wonderEventsTriggered = s._wonderEventsTriggered || [];  // ★ 改进2：恢复奇观事件记录
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
      // 科技树分支状态恢复 — P2-1: 使用 'in' 检查避免 falsy 值丢失
      if ('_collectorBonus' in s) this._collectorBonus = s._collectorBonus;
      if ('_energyBonus' in s) this._energyBonus = s._energyBonus;
      if ('_energyAdjBonus' in s) this._energyAdjBonus = s._energyAdjBonus;
      if ('_extraOutPorts' in s) this._extraOutPorts = s._extraOutPorts;
      if ('_beltCapBonus' in s) this._beltCapBonus = s._beltCapBonus;
      if ('_p3EntryTime' in s) this._p3EntryTime = s._p3EntryTime;
      // v2.0: 恢复教学flag
      if ('_p2PortTutorialPending' in s) this._p2PortTutorialPending = s._p2PortTutorialPending;
      if ('_p3LogisticsTutorialPending' in s) this._p3LogisticsTutorialPending = s._p3LogisticsTutorialPending;
      if ('_adjPreviewShown' in s) this._adjPreviewShown = s._adjPreviewShown;
      if ('_competitionEnabled' in s) this._competitionEnabled = s._competitionEnabled;
      if ('_competitionTutorialShown' in s) this._competitionTutorialShown = s._competitionTutorialShown;
      if ('_portFullShown' in s) this._portFullShown = s._portFullShown;
      // v3.0 §4: 远距首次弹窗标志
      if ('_firstDist2Shown' in s) this._firstDist2Shown = s._firstDist2Shown;
      if ('_firstDist3Shown' in s) this._firstDist3Shown = s._firstDist3Shown;
      if ('_firstDist4Shown' in s) this._firstDist4Shown = s._firstDist4Shown;
      // v3.0 §2: 探索度
      if ('_prevExplScore' in s) this._prevExplScore = s._prevExplScore;
      // v3.0 §1: 培养任务恢复
      if (s._evoTaskId) {
        const tasks = EVOLUTION_TASKS[this.phase];
        if (tasks) {
          const found = tasks.find(t => t.id === s._evoTaskId);
          if (found) {
            this._evoTask = found;
            this._evoTaskBase = s._evoTaskBase || {};
            this._evoEconTimer = s._evoEconTimer || 0;
            this._evoTaskStartTime = s._evoTaskStartTime || Date.now();
          }
        }
      }
      if ('_nitrogenBonus' in s) this._nitrogenBonus = s._nitrogenBonus;
      if ('_proteinBonus' in s) this._proteinBonus = s._proteinBonus;
      if ('_transportBonus' in s) this._transportBonus = s._transportBonus;
      if ('_popCapBonus' in s) this._popCapBonus = s._popCapBonus;
      if ('_popEffMult' in s) this._popEffMult = s._popEffMult;
      if ('_qsDecayMult' in s) this._qsDecayMult = s._qsDecayMult;
      if ('_qsCapBonus' in s) this._qsCapBonus = s._qsCapBonus;
      if ('_evoBoostMult' in s) this._evoBoostMult = s._evoBoostMult;
      // Achievement milestones & power tracking
      this._claimedMilestones = s._claimedMilestones || {};
      this._everLowPower = s._everLowPower || false;
      this._recoveredFromCrisis = s._recoveredFromCrisis || false;
      this._everMaintDeficit = s._everMaintDeficit || false;
      // Population allocation
      if ('popAlloc' in s) this.popAlloc = s.popAlloc;
      // Petri experiment
      this._petriCooldown = s._petriCooldown || 0;
      this._petriBuff = s._petriBuff || null;
      this._petriCount = s._petriCount || 0;
      this._petriActiveZone = s._petriActiveZone || null;
      this._petriP3Unlocked = s._petriP3Unlocked || false; // v2.1 §8.2
      // ★ Q4：变异实验室状态恢复
      this._mutLabUnlocked = s._mutLabUnlocked || false;
      this._mutSlots = s._mutSlots || [];
      this._mutBrewing = s._mutBrewing || null;
      this._mutOffers = s._mutOffers || [];
      this._mutHistory = s._mutHistory || [];
      this._mutPortTargets = s._mutPortTargets || {};  // v2.1 §9.2
      this._presPortTargets = s._presPortTargets || []; // v2.1 §9.3
      this._discoveredAdj = s._discoveredAdj || {};     // v2.1 §10.4
      this._dormantCells = s._dormantCells || {};       // v2.1 建筑休眠
      this._p3bUnlocked = s._p3bUnlocked || false;     // v3.0 §6
      this._p3bExplScore = s._p3bExplScore || 0;        // v3.0 §6
      this._specializations = s._specializations || {};  // v3.0 §9.2
      this._mutCategoryLock = s._mutCategoryLock || null;
      this._mutBrewCount = s._mutBrewCount || 0;
      // ★ 终局高潮系统状态恢复
      this._wonderSprintActive = s._wonderSprintActive || false;
      // v3.0 §8.3: 催化剂恢复
      this._catalysts = s._catalysts || {};
      if (s._afterglowActive) {
        // 存档时余晖仍然激活，恢复后继续显示（缩短剩余时间）
        setTimeout(() => this._startAfterglow(), 500);
      }
      // Re-apply milestone buffs
      const achieveCount = Object.keys(this.achievements).length;
      for (const ms of ACHIEVE_MILESTONES) {
        if (this._claimedMilestones[ms.count]) ms.fn(this);
      }
      this._updateEmpireTitle(achieveCount);
      // ★ Q4：恢复突变效果缓存
      this._recalcMutEffects();
      // v3.0 §9.2: 恢复特化效果缓存
      this._recalcSpecEffects();
      if (this._mutLabUnlocked) this._renderMutLabPanel();
      // v3.0 §6: 旧存档兼容 — 如果已拥有P3b建筑则自动解锁P3b
      if (this.phase >= 3 && !this._p3bUnlocked) {
        for (let i = 0; i < this.grid.length; i++) {
          if (this.grid[i] && P3B_BUILDINGS.has(this.grid[i].type)) {
            this._p3bUnlocked = true;
            break;
          }
        }
      }
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

      // 旧存档自动迁移到 20×20（保留建筑位置）
      if (this.gridCols < 20 || this.gridRows < 20) {
        this._resizeGrid(Math.max(this.gridCols, 20), Math.max(this.gridRows, 20));
      }

      this.buildUI();
      this.updateRates();
      this.updateUI();
      if (this.rt > 0) this.log('▸ 存档已加载', 's');

      if (this.wBuild) {
        const bd = BLDS[this.wBuild];
        this._showPopup('wonderOverlay');
        document.getElementById('wonderName').textContent = '建造中: ' + (bd?.n || '');
      }
    } catch(e) { console.log('Load error:', e); }
  },

  reset() {
    this._showPopup('resetPopup');
    this._showBackdrop();
  },

  confirmReset() {
    // 重置前：保存历史最高分（跨存档永久保留）
    const currentScore = this.calcScore();
    const oldBest = parseInt(localStorage.getItem('bioHighScore') || '0', 10);
    if (currentScore > oldBest) {
      localStorage.setItem('bioHighScore', String(currentScore));
    }
    // 保存历史最高阶段和最高评级
    const { rank } = this._scoreRank(Math.max(currentScore, oldBest));
    const oldPhase = parseInt(localStorage.getItem('bioHighPhase') || '0', 10);
    if (this.phase > oldPhase) {
      localStorage.setItem('bioHighPhase', String(this.phase));
    }
    // 记录重置次数
    const resets = parseInt(localStorage.getItem('bioResetCount') || '0', 10);
    localStorage.setItem('bioResetCount', String(resets + 1));

    // 完全清除所有存档数据
    localStorage.removeItem('bioSphereV3');
    localStorage.removeItem('bioSpherePrestige');
    // 清除开场引导标记 — 让新一轮从开场说明开始
    localStorage.removeItem('bioIntroSeen');
    // 清除折叠状态
    localStorage.removeItem('bioSphereSecState');
    location.reload();
  },

  cancelReset() {
    this._hidePopup('resetPopup');
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
    // ARIA: 同步挑战进度
    document.getElementById('challengeFill').closest('[role="progressbar"]')?.setAttribute('aria-valuenow', Math.round(pct));

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

    // I2: 低价免确认 — 当每种资源费用都 < 当前存量的10%时直接升级
    const canAfford = this.checkRes(cost);
    if (canAfford) {
      let isCheap = true;
      for (let k in cost) {
        if ((this.res[k] || 0) <= 0 || cost[k] / this.res[k] > 0.1) {
          isCheap = false;
          break;
        }
      }
      if (isCheap) {
        this.upgradeIdx = idx;
        this.confirmUpgrade();
        return;
      }
    }

    this.upgradeIdx = idx;
    const costStr = Object.entries(cost).map(([k,v]) => `${formatNum(v)}${RES[k]?.icon||k}`).join(' + ');
    const curMult = this.getUpgradeMultiplier(idx);
    const nextMult = (1 + lv * 0.4).toFixed(1);
    // I1: 计算百分比提升
    const pctUp = Math.round((parseFloat(nextMult) / curMult - 1) * 100);

    const pop = document.getElementById('upgradePopup');
    if (!pop) return;
    document.getElementById('upgradeName').textContent = `${bd.emoji} ${bd.n} Lv.${lv}→${lv+1}`;
    document.getElementById('upgradeLevel').textContent = `+${pctUp}% 产出`;
    document.getElementById('upgradeEffect').textContent = `${formatNum(curMult, 1)}x → ${nextMult}x`;
    document.getElementById('upgradeCost').textContent = costStr;

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
    this.stats.totalUpgrades = (this.stats.totalUpgrades || 0) + 1;

    this.log(`⬆ ${bd.n} 升级到 Lv.${lv} — 产出×${formatNum(this.getUpgradeMultiplier(idx), 1)}`, 's');
    SFX.coreUpgrade();
    this.buildBurst(idx);
    this.screenShake(4);

    this.cancelUpgrade();
    this.refreshAll();

    // v3.0 §9.2: 升级到Lv3时触发特化选择
    const bldType = this.grid[idx]?.type;
    if (lv === 3 && bldType && SPECIALIZATIONS[bldType] && !this._specializations?.[idx]) {
      setTimeout(() => this._showSpecializationChoice(idx, bldType), 300);
    }
  },

  cancelUpgrade() {
    this.upgradeIdx = null;
    this._hidePopup('upgradePopup');
    this._hideBackdrop();
  },

  // ===== ONE-CLICK UPGRADE ALL (升1级版) =====
  upgradeAllOfType() {
    const buildingKey = this._upgradeAllKey;
    if (!buildingKey) return;
    const bd = BLDS[buildingKey];

    // 收集所有可升级的实例
    const targets = [];
    this.grid.forEach((g, i) => {
      if (g && g.type === buildingKey) {
        const cost = this.getUpgradeCost(i);
        if (cost) targets.push({ idx: i, cost });
      }
    });

    if (targets.length === 0) {
      this.log('没有可升级的建筑', 'w');
      SFX.buildFail();
      return;
    }

    // 先检查总费用
    const totalCost = {};
    for (const t of targets) {
      for (let k in t.cost) totalCost[k] = (totalCost[k] || 0) + t.cost[k];
    }

    // 逐个升级（资源足够的就升，不够就跳过）
    let upgraded = 0;
    for (const t of targets) {
      if (this.checkRes(t.cost)) {
        this.spend(t.cost);
        this.buildingLevels[t.idx] = (this.buildingLevels[t.idx] || 1) + 1;
        upgraded++;
        this.buildBurst(t.idx);
      }
    }

    if (upgraded > 0) {
      this.stats.totalUpgrades = (this.stats.totalUpgrades || 0) + upgraded;
      this.log(`⬆ 批量升级 ${bd.n} ×${upgraded} 完成！`, 's');
      SFX.coreUpgrade();
      this.screenShake(6);
      this.showGoldenFloat(`⬆ ${bd.n} ×${upgraded} 升级！`);

      // 刷新列表（保持弹窗打开）
      const instances = [];
      this.grid.forEach((g, i) => {
        if (g && g.type === buildingKey) instances.push(i);
      });
      this._renderBldTypeList(buildingKey, bd, instances);
      this.refreshAll();

      // 如果全部满级了
      const allMax = instances.every(i => (this.buildingLevels[i] || 1) >= 5);
      if (allMax) {
        this.showGoldenFloat(`🌟 ${bd.n} 全部满级！`);
      }
    } else {
      this.log('资源不足，无法升级', 'e');
      SFX.buildFail();
    }
  },

  // ===== CONVEYOR BELT UPGRADE SYSTEM =====
  // 传送带等级: 1-5
  // 每个等级有两个属性：
  //   效率(eff) — 传输效率乘数，影响下游建筑产出倍率
  //   容量(cap) — 每秒最大资源吞吐量，超出部分被钳制（需要并行多条管线）
  // Lv1: eff=0.75x, cap=2.0/s | Lv2: 0.9x, 3.0/s | Lv3: 1.0x, 5.0/s | Lv4: 1.2x, 8.0/s | Lv5: 1.5x, 12.0/s
  getBeltLevel(beltKey) {
    return this.beltLevels[beltKey] || 1;
  },

  // v3.0 §4: 传送带距离（曼哈顿距离）
  getBeltDistance(beltKey) {
    const [a, b] = beltKey.split('-').map(Number);
    const SZ = this.gridSize;
    const r1 = Math.floor(a / SZ), c1 = a % SZ;
    const r2 = Math.floor(b / SZ), c2 = b % SZ;
    return Math.abs(r1 - r2) + Math.abs(c1 - c2);
  },

  // v3.0 §4: 距离效率衰减因子
  // dist=1: 100%, dist=2: 92%, dist=3: 80%, dist=4: 65%
  _distanceEfficiency(dist, viaRelay) {
    // v3.0 §8.5: 创造模式无距离衰减
    if (this._creativeMode) return 1.0;
    if (dist <= 1) return 1.0;
    const map = { 2: 0.92, 3: 0.80, 4: 0.65 };
    const base = map[dist] || Math.max(0.1, 1.0 - 0.12 * (dist - 1));
    // v3.0 §5: 中继衰减减半 — 经过中继的传送带距离惩罚减半
    if (viaRelay) {
      const penalty = 1.0 - base; // 衰减量
      return 1.0 - penalty * 0.5; // 衰减减半
    }
    return base;
  },

  // 传送带效率（产出乘数）— v3.0: 包含距离衰减
  getBeltEfficiency(beltKey) {
    const lv = this.getBeltLevel(beltKey);
    const effMap = { 1: 0.75, 2: 0.9, 3: 1.0, 4: 1.2, 5: 1.5 };
    const baseEff = effMap[lv] || 0.75;
    // v3.0 §4: 距离衰减
    const dist = this.getBeltDistance(beltKey);
    // v3.0 §5: 检查是否经过中继
    const viaRelay = this._isBeltViaRelay(beltKey);
    const distFactor = this._distanceEfficiency(dist, viaRelay);
    // v3.0 §5: 中继链固定损耗（5%每跳）
    const relayHops = this._countRelayHops(beltKey);
    // v3.0 §9.2: relay_amp 特化 — 中继衰减可降至0%
    const relayDecayRate = this._specCache?.relayDecayOverride !== null && this._specCache?.relayDecayOverride !== undefined
      ? (1 - this._specCache.relayDecayOverride) // 0%衰减 → 乘数1.0
      : 0.95; // 默认5%衰减
    const relayPenalty = relayHops > 0 ? Math.pow(relayDecayRate, relayHops) : 1.0;
    // v3.0 §9.2: transport_speed 特化 — 全局传送带效率加成
    const specEffBonus = 1 + (this._specCache?.beltEffBonus || 0);
    // v3.0 §8.3: 物流催化剂加成
    const catalystBeltBonus = 1 + this._getCatalystValue('beltEff');
    return baseEff * distFactor * relayPenalty * specEffBonus * catalystBeltBonus;
  },

  // v3.0 §5: 检查传送带是否涉及中继站
  _isBeltViaRelay(beltKey) {
    const parts = beltKey.split('-');
    const a = +parts[0], b = +parts[1];
    const ga = this.grid[a], gb = this.grid[b];
    return (ga && BLDS[ga.type]?.isRelay) || (gb && BLDS[gb.type]?.isRelay);
  },

  // v3.0 §5: 计算经过的中继跳数（0=不经过中继，1=一端是中继，2=双端都是中继）
  _countRelayHops(beltKey) {
    const parts = beltKey.split('-');
    const a = +parts[0], b = +parts[1];
    const ga = this.grid[a], gb = this.grid[b];
    let hops = 0;
    if (ga && BLDS[ga.type]?.isRelay) hops++;
    if (gb && BLDS[gb.type]?.isRelay) hops++;
    return hops;
  },

  // 传送带容量上限（每秒资源吞吐量）
  getBeltCapacity(beltKey) {
    const lv = this.getBeltLevel(beltKey);
    const capMap = { 1: 2.0, 2: 3.0, 3: 5.0, 4: 8.0, 5: 12.0 };
    return capMap[lv] || 2.0;
  },

  getBeltUpgradeCost(beltKey) {
    const lv = this.getBeltLevel(beltKey);
    if (lv >= 5) return null;
    const costs = {
      1: { energy: 8, glucose: 5 },
      2: { energy: 20, glucose: 12 },
      3: { energy: 40, glucose: 20, dna: 3 },
      4: { energy: 70, glucose: 35, dna: 10 },
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
    this._chainsDirty = true;
  },

  // 计算建筑的传送带加成（方向性 + 容量限制）
  // 规则：
  //   1. 方向性：只有 FLOW_MAP 中 from→to 方向正确的传送带才有效
  //      即对端是 from 端，本建筑是 to 端 = 有效输入
  //   2. 容量限制：每条传送带有吞吐量上限(cap/s)
  //      建筑的总需求量 = sum(cons) * bldMult；如果总输入容量 < 需求，产出被钳制
  //   3. 纯采集建筑(无 FLOW_MAP to 端)不受影响
  //   4. 没有合法输入传送带的需求建筑 → 停产
  getBeltMultiplierForBuilding(idx) {
    const g = this.grid[idx];
    if (!g) return 1;
    // v2.1: 休眠建筑不参与物流
    if (this._dormantCells[idx]) return 0;
    const type = g.type;
    const bd = BLDS[type];
    if (!bd) return 1;

    // 检查此建筑是否需要输入（是某个 FLOW 的 to 端）
    const needsInput = FLOW_TYPES_TO.has(type);

    // 找所有方向正确的输入传送带（对端是 from，本端是 to）
    let totalEff = 0;
    let totalCap = 0;
    let validBeltCount = 0;
    const belts = this._activeBelts || [];

    for (const belt of belts) {
      if (belt.ti !== idx && belt.fi !== idx) continue;

      const otherIdx = belt.fi === idx ? belt.ti : belt.fi;
      const otherG = this.grid[otherIdx];
      if (!otherG) continue;
      const otherType = otherG.type;

      // ★ 方向性检查：只有对端→本端方向匹配 FLOW_MAP 的才算有效输入
      const isValidInput = FLOW_PAIR.has(otherType + '|' + type);
      // 也计算输出方向（本端→对端），用于维持对称性让双方都不停产
      const isValidOutput = FLOW_PAIR.has(type + '|' + otherType);

      if (!isValidInput && !isValidOutput) continue;

      const key = Math.min(belt.fi, belt.ti) + '-' + Math.max(belt.fi, belt.ti);
      const eff = this.getBeltEfficiency(key);
      const cap = this.getBeltCapacity(key);

      if (isValidInput) {
        totalEff += eff;
        totalCap += cap;
        validBeltCount++;
      } else if (isValidOutput) {
        // 输出方向也算一条有效连接（否则上游会停产）
        totalEff += eff;
        totalCap += cap;
        validBeltCount++;
      }
    }

    if (validBeltCount === 0) {
      return needsInput ? 0 : 1;
    }

    // 基础效率 = 所有有效传送带的平均效率
    const baseEff = validBeltCount > 0 ? totalEff / validBeltCount : 0;

    // ★ 容量钳制：计算建筑的总资源需求量
    const bldMult = this.getUpgradeMultiplier(idx);
    let totalDemand = 0;
    for (const k in bd.cons) {
      totalDemand += bd.cons[k] * bldMult;
    }

    // 如果没有消耗（纯产出建筑），不受容量限制
    let capFactor = 1;
    if (totalDemand > 0 && needsInput) {
      // 容量因子 = min(1, 总容量 / 总需求)
      // 容量不足时产出按比例降低，鼓励并行多条管线
      capFactor = Math.min(1, totalCap / totalDemand);
    }

    return baseEff * capFactor * (1 + (this._beltBonus || 0));
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
    const costStr = Object.entries(cost).map(([k,v]) => `${formatNum(v)}${RES[k]?.icon||k}`).join(' + ');
    const curEff = this.getBeltEfficiency(beltKey);
    const curCap = this.getBeltCapacity(beltKey);
    const nextLv = lv + 1;
    const nextEffMap = { 1: 0.75, 2: 0.9, 3: 1.0, 4: 1.2, 5: 1.5 };
    const nextCapMap = { 1: 2.0, 2: 3.0, 3: 5.0, 4: 8.0, 5: 12.0 };
    const nextEff = nextEffMap[nextLv];
    const nextCap = nextCapMap[nextLv];

    const pop = document.getElementById('beltUpgradePopup');
    if (!pop) return;
    document.getElementById('beltUpgradeName').textContent = `⛓ 传送带`;
    document.getElementById('beltUpgradeLevel').textContent = `Lv.${lv} → Lv.${nextLv}`;
    document.getElementById('beltUpgradeEffect').textContent = `效率: ${Math.round(curEff*100)}% → ${Math.round(nextEff*100)}%  |  容量: ${curCap}/s → ${nextCap}/s`;
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
    this._hidePopup('beltUpgradePopup');
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
    const cap = this.getBeltCapacity(beltKey);
    document.getElementById('beltActionInfo').innerHTML =
      `<span style="color:var(--orange)">Lv.${lv}</span> · 效率 <span style="color:${eff >= 1 ? 'var(--cyan)' : 'var(--yellow)'}">${Math.round(eff * 100)}%</span>` +
      ` · 📦<span style="color:var(--color-info)">${cap}/s</span>` +
      (isManual ? ' · <span style="color:var(--cyan)">手动</span>' : '');

    // 升级按钮
    const upgradeBtn = document.getElementById('beltActionUpgrade');
    if (isMaxLv) {
      upgradeBtn.textContent = '★ 已满级';
      upgradeBtn.disabled = true;
      upgradeBtn.style.opacity = '0.3';
    } else {
      const cost = this.getBeltUpgradeCost(beltKey);
      const costStr = cost ? Object.entries(cost).map(([k,v]) => `${formatNum(v)}${RES[k]?.icon||k}`).join('+') : '';
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
    // v3.0 §8: 纯粹主义变体 — 禁止传送带
    if (this._variantNoBelts) {
      this.log('🔥 纯粹主义! 禁止使用传送带 — 只能依赖邻接布局', 'w');
      this.showCursorTooltip('🔥 变体限制: 禁止传送带');
      SFX.buildFail();
      return;
    }
    this.closeBeltActionMenu();
    if (this._petriMode) this.cancelPetriMode();
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
    // ★ Q2：显示传送带模式浮动标签
    this._showBeltModeBanner();
    this._startBeltIdleTimer();
    
    // v3.0 §8: 蓝图系统 — 在传送带模式中显示蓝图按钮
    this._showBeltBlueprintButtons();
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
    document.querySelectorAll('.cell.belt-connect-target').forEach(c => c.classList.remove('belt-connect-target', 'belt-target-valid', 'belt-target-invalid'));
    document.querySelectorAll('.belt-dist-badge').forEach(b => b.remove()); // v3.0 §4
    // ★ Q2：移除浮动标签和闲置计时器
    this._hideBeltModeBanner();
    this._stopBeltIdleTimer();
    
    // v3.0 §8: 蓝图系统 — 退出传送带模式时隐藏蓝图按钮
    this._hideBeltBlueprintButtons();
  },

  // v3.0 §8: 蓝图系统 — 在传送带模式中显示蓝图按钮
  _showBeltBlueprintButtons() {
    if (!this._unlockedMilestones?.blueprint) return; // 蓝图里程碑未解锁
    
    const banner = document.getElementById('beltModeBanner');
    if (!banner) return;
    
    // 在浮动标签中添加蓝图按钮
    const blueprintHtml = `
      <div style="margin-top:8px;display:flex;gap:4px;justify-content:center">
        <button class="belt-blueprint-btn" onclick="G.saveBeltBlueprint()" title="保存当前传送带布局">
          <span style="font-size:0.9em">💾</span> 保存
        </button>
        <button class="belt-blueprint-btn" onclick="G.showBlueprintList()" title="加载已保存的传送带布局">
          <span style="font-size:0.9em">🗺️</span> 加载
        </button>
      </div>
    `;
    
    // 如果已有蓝图按钮区域，先移除
    const existing = banner.querySelector('.belt-blueprint-buttons');
    if (existing) existing.remove();
    
    const btnContainer = document.createElement('div');
    btnContainer.className = 'belt-blueprint-buttons';
    btnContainer.innerHTML = blueprintHtml;
    banner.appendChild(btnContainer);
  },

  // v3.0 §8: 蓝图系统 — 隐藏蓝图按钮
  _hideBeltBlueprintButtons() {
    const banner = document.getElementById('beltModeBanner');
    if (!banner) return;
    
    const existing = banner.querySelector('.belt-blueprint-buttons');
    if (existing) existing.remove();
  },

  // v3.0 §8: 蓝图系统 — 保存当前传送带布局
  saveBeltBlueprint() {
    if (!this._unlockedMilestones?.blueprint) return;
    
    const name = prompt('为这个传送带布局命名：', `布局${this._blueprints.length + 1}`);
    if (!name) return;
    
    // 保存当前传送带状态
    const blueprint = {
      name: name,
      belts: [...(this._activeBelts || [])], // 当前活跃传送带
      grid_snapshot: this.grid.map(g => g ? { type: g.type } : null), // 建筑快照
      timestamp: Date.now()
    };
    
    this._blueprints.push(blueprint);
    this.log(`🗺️ 蓝图已保存: "${name}" (${blueprint.belts.length}条传送带)`, 's');
    this.showEvent('💾 蓝图保存', `传送带布局 "${name}" 已保存！\\n\\n可在加载时快速重建物流网络。`, '#3b82f6');
    SFX.build();
  },

  // v3.0 §8: 蓝图系统 — 显示蓝图列表
  showBlueprintList() {
    if (!this._unlockedMilestones?.blueprint) return;
    if (this._blueprints.length === 0) {
      this.log('🗺️ 暂无保存的蓝图，请先使用「保存」功能', 'w');
      return;
    }
    
    const overlay = document.createElement('div');
    overlay.id = 'blueprintListOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.92);z-index:10000;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.3s';
    
    let html = `<div style="background:#1a1a2e;border:1px solid rgba(59,130,246,0.3);border-radius:12px;padding:20px;max-width:400px;width:95%;max-height:70vh;overflow-y:auto;box-shadow:0 0 40px rgba(59,130,246,0.15)">`;
    html += `<div style="text-align:center;margin-bottom:16px">`;
    html += `<div style="font-size:1.3em">🗺️</div>`;
    html += `<div style="font-size:1em;font-weight:700;color:#3b82f6;margin-top:4px">传送带蓝图</div>`;
    html += `<div style="font-size:0.72em;color:#94a3b8;margin-top:4px">选择蓝图加载，快速重建物流网络</div>`;
    html += `</div>`;
    
    this._blueprints.forEach((bp, idx) => {
      const date = new Date(bp.timestamp).toLocaleString();
      html += `<div class="blueprint-item" data-index="${idx}" style="
        background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.3);border-radius:8px;
        padding:12px;margin-bottom:8px;cursor:pointer;transition:all 0.2s"
        onmouseover="this.style.borderColor='#3b82f6';this.style.boxShadow='0 0 12px rgba(59,130,246,0.2)'"
        onmouseout="this.style.borderColor='rgba(59,130,246,0.3)';this.style.boxShadow='none'">
        <div style="font-weight:700;color:#3b82f6;font-size:0.9em">${bp.name}</div>
        <div style="font-size:0.75em;color:#94a3b8">${bp.belts.length}条传送带 • ${date}</div>
      </div>`;
    });
    
    html += `<div style="margin-top:12px;text-align:center">`;
    html += `<button class="belt-blueprint-btn" onclick="this.parentElement.parentElement.remove()" style="
      background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#ef4444;
      padding:6px 12px;border-radius:4px;cursor:pointer;font-size:0.8em">
      取消
    </button>`;
    html += `</div>`;
    html += `</div>`;
    
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    
    // 绑定蓝图点击事件
    overlay.querySelectorAll('.blueprint-item').forEach(item => {
      item.onclick = () => {
        const idx = parseInt(item.dataset.index);
        this.loadBeltBlueprint(idx);
        overlay.remove();
      };
    });
  },

  // v3.0 §8: 蓝图系统 — 加载蓝图
  loadBeltBlueprint(idx) {
    if (!this._unlockedMilestones?.blueprint || !this._blueprints[idx]) return;
    
    const bp = this._blueprints[idx];
    
    // 确认加载（会清除当前传送带）
    if (!confirm(`确定要加载蓝图 "${bp.name}"？\\n\\n当前所有传送带将被清除，替换为蓝图中的布局。`)) return;
    
    // 清除当前传送带
    this._activeBelts = [];
    this.manualBelts = {};
    this.removedBelts = {};
    
    // 应用蓝图中的传送带
    bp.belts.forEach(belt => {
      this._activeBelts.push(belt);
      const key = `${belt.from}-${belt.to}`;
      this.manualBelts[key] = { from: belt.from, to: belt.to, level: belt.level || 1 };
    });
    
    this.log(`🗺️ 蓝图已加载: "${bp.name}" (${bp.belts.length}条传送带)`, 's');
    this.showEvent('🗺️ 蓝图加载', `传送带布局 "${bp.name}" 已加载！\\n\\n${bp.belts.length}条传送带已重建。`, '#3b82f6');
    
    // 刷新渲染
    this._chainsDirty = true;
    this.refreshAll({ buildings: false });
    SFX.wonderDone();
  },

  handleBeltConnectClick(idx) {
    if (!this._beltConnectMode) return false;
    // ★ Q2：有操作就重置闲置计时器
    this._resetBeltIdleTimer();

    if (this._beltConnectFrom === null) {
      // 选择起点
      if (!this.grid[idx]) {
        this.log('⬜ 空格子！请点有建筑的格子', 'w');
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
        this.log('🚫 不能连接到自身', 'w');
        return true;
      }
      if (!this.grid[idx]) {
        this.log('⬜ 空格子！请点有建筑的格子', 'w');
        return true;
      }
      // 检查距离
      const SZ = this.gridSize;
      const fr = Math.floor(fromIdx / SZ), fc = fromIdx % SZ;
      const tr = Math.floor(idx / SZ), tc = idx % SZ;
      const dist = Math.abs(fr - tr) + Math.abs(fc - tc);
      // v3.0 §9.2: 特化距离加成
      const maxBeltDist = 4 + (this._specCache?.extraBeltRange || 0);
      if (dist > maxBeltDist) {
        this.log(`📏 距离太远！最多${maxBeltDist}格`, 'w');
        return true;
      }
      // 检查是否已存在（先刷新缓存确保数据最新）
      const key = Math.min(fromIdx, idx) + '-' + Math.max(fromIdx, idx);
      this.refreshBelts();
      if (this.manualBelts[key] || (this._activeBelts || []).some(b => {
        const bk = Math.min(b.fi, b.ti) + '-' + Math.max(b.fi, b.ti);
        return bk === key;
      })) {
        this.log('🔗 已有传送带！', 'w');
        return true;
      }

      // v2.0: 端口约束检查 — 手动连接也遵守端口限制
      if (!hasAvailablePort(fromIdx, 'out')) {
        const fromBldName = BLDS[this.grid[fromIdx].type]?.n || '建筑';
        const fromDef = PORT_DEFS[this.grid[fromIdx].type];
        const mpbF = this._mutPortBonuses?.[this.grid[fromIdx].type];
        const maxOut = (fromDef?.maxOut || 0) + (this._extraOutPorts || 0) + (mpbF?.extraOut || 0);
        this.log(`⚠️ ${fromBldName} 输出端口已满 (${maxOut}/${maxOut})`, 'w');
        return true;
      }
      if (!hasAvailablePort(idx, 'in')) {
        const toBldName = BLDS[this.grid[idx].type]?.n || '建筑';
        const toDef = PORT_DEFS[this.grid[idx].type];
        this.log(`⚠️ ${toBldName} 输入端口已满 (${toDef?.maxIn || 0}/${toDef?.maxIn || 0})`, 'w');
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

      // 检查 FLOW_MAP 是否有有效资源链路
      const fromType = this.grid[fromIdx].type;
      const toType = this.grid[idx].type;
      const hasValidFlow = FLOW_PAIR.has(fromType + '|' + toType) || FLOW_PAIR.has(toType + '|' + fromType);

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
        invalid: !hasValidFlow, // 标记无效传送带
      };

      if (!hasValidFlow) {
        // 无效连接：弹橙色警告但仍然创建
        this.log(`⚠️ 无效链路！不会传输资源`, 'w');
        this.showEvent('⚠️ 无效传送带',
          `${fromBld?.emoji||''}${fromBld?.n||''} → ${toBld?.emoji||''}${toBld?.n||''}\n\n这两个建筑之间没有有效的资源供给关系\n传送带将不会传输任何资源\n\n💡 查看资源链面板了解正确的连接方式`,
          '#f97316');
        SFX.buildFail();
      } else {
        // v3.0 §4+§5: 计算距离和中继效率
        const isRelay = BLDS[this.grid[fromIdx].type]?.isRelay || BLDS[this.grid[idx].type]?.isRelay;
        const distEffPct = Math.round(this._distanceEfficiency(dist, isRelay) * 100);
        const relayTag = isRelay ? ' 📡中继' : '';
        const distInfo = dist >= 2 ? ` (距离${dist}格·${distEffPct}%效率${relayTag})` : (isRelay ? ' (📡中继·衰减减半)' : '');
        this.log(`✅ 已连接: ${fromBld?.emoji||''}${fromBld?.n||''} → ${toBld?.emoji||''}${toBld?.n||''}${distInfo}`, 's');
        this.showCursorTooltip(`✅ 已连接！${distInfo}`, 's');
        SFX.build();
        // ★ 方案A：连接爆发特效 + 连击系统
        this.beltConnectBurst(fromIdx, idx);
        this.addBeltCombo();

        // v3.0 §4: 远距统计追踪
        if (dist > (this.stats.maxBeltDist || 0)) {
          this.stats.maxBeltDist = dist;
        }
        if (dist >= 2) {
          this.stats.longBeltCount = (this.stats.longBeltCount || 0) + 1;
          // 首次远距成就弹窗
          const firstDistKey = '_firstDist' + dist + 'Shown';
          if (!this[firstDistKey]) {
            this[firstDistKey] = true;
            const msgs = {
              2: { title: '🔗 远程传输', text: '突破了物理限制！\n首次建立2格距离的传送带\n\n💡 远距传送带效率稍低，但可以连接到更远的建筑获取邻接加成', color: '#14b8a6' },
              3: { title: '🔗 远程物流', text: '化学信号跨越三格！\n首次建立3格距离的传送带\n\n⚠️ 3格距离需要0.3⚡/s维护费\n💡 虚拟邻接加成不受距离衰减影响', color: '#06d6a0' },
              4: { title: '🔗 物流大师', text: '极限距离的精密控制！\n首次建立4格距离的传送带\n\n⚠️ 4格距离需要0.6⚡/s维护费\n💡 远距连线虽然传输效率低，但邻接加成很赚', color: '#fbbf24' },
            };
            if (msgs[dist]) {
              this.showEvent(msgs[dist].title, msgs[dist].text, msgs[dist].color);
            }
          }
        }
      }
      // ★ 连续连接模式：不退出，重置起点让用户继续连接下一条
      // 清除当前高亮
      document.querySelectorAll('.cell.belt-connect-from').forEach(c => c.classList.remove('belt-connect-from'));
      document.querySelectorAll('.cell.belt-connect-target').forEach(c => c.classList.remove('belt-connect-target', 'belt-target-valid', 'belt-target-invalid'));
      document.querySelectorAll('.belt-dist-badge').forEach(b => b.remove()); // v3.0 §4
      // 重置起点但保持连接模式
      this._beltConnectFrom = null;
      document.getElementById('buildHint').textContent = '🔗 连接成功！继续选择下一个起点（ESC/右键退出）';
      document.getElementById('buildHint').style.color = 'var(--cyan)';

      this.refreshBelts(); // 立即刷新传送带缓存
      this.updateRates();
      this.updateUI();
      // ★ Q2：成功连接后重置闲置计时器
      this._resetBeltIdleTimer();

      // v2.0 §11.4: 首次端口满一次性提示
      if (!this._portFullShown) {
        const fromType = this.grid[fromIdx]?.type;
        const toType = this.grid[toIdx]?.type;
        const checkPortFull = (idx, type) => {
          if (!type) return false;
          const def = PORT_DEFS[type];
          if (!def) return false;
          const techExtra = this._extraOutPorts || 0;
          const mpb = this._mutPortBonuses?.[type];
          // v3.0 §9.2: 特化端口加成
          const specB = this._specCache?.perBuilding?.[idx];
          const totalOut = def.maxOut + techExtra + (mpb?.extraOut || 0) + (specB?.extraOutPort || 0) + (specB?.extraPorts || 0);
          const totalIn = def.maxIn + (mpb?.extraIn || 0) + (specB?.extraPorts || 0);
          return (getUsedPorts(idx, 'in') >= totalIn && getUsedPorts(idx, 'out') >= totalOut);
        };
        if (checkPortFull(fromIdx, fromType) || checkPortFull(toIdx, toType)) {
          this._portFullShown = true;
          const fullType = checkPortFull(fromIdx, fromType) ? fromType : toType;
          const fullBd = BLDS[fullType];
          this.showEvent('端口已满！', `${fullBd?.emoji || ''} ${fullBd?.n || fullType}的端口都已连接\n\n解决方案：\n1. 多建一台同类建筑分担负载\n2. 升级传送带提高单条管线吞吐量\n3. 研究科技或获取突变来扩展端口`, '#facc15');
        }
      }
      return true;
    }
  },

  _highlightBeltTargets(fromIdx) {
    const gridEl = document.getElementById('grid');
    if (!gridEl) return;
    const SZ = this.gridSize;
    const fr = Math.floor(fromIdx / SZ), fc = fromIdx % SZ;
    const fromType = this.grid[fromIdx]?.type;
    for (let i = 0; i < this.grid.length; i++) {
      if (i === fromIdx || !this.grid[i]) continue;
      const tr = Math.floor(i / SZ), tc = i % SZ;
      const dist = Math.abs(fr - tr) + Math.abs(fc - tc);
      if (dist <= 4) {
        const cell = gridEl.children[i];
        if (!cell) continue;
        const toType = this.grid[i].type;
        // 检查 FLOW_MAP 中是否有有效的资源链路（双向都算）
        const hasValidFlow = FLOW_PAIR.has(fromType + '|' + toType) || FLOW_PAIR.has(toType + '|' + fromType);
        if (hasValidFlow) {
          cell.classList.add('belt-connect-target', 'belt-target-valid');
          // v3.0 §4+§5: 显示距离效率标签（中继衰减减半）
          const isRelay = BLDS[fromType]?.isRelay || BLDS[toType]?.isRelay;
          if (dist >= 2 || isRelay) {
            const distEff = Math.round(this._distanceEfficiency(dist, isRelay) * 100);
            let badge = cell.querySelector('.belt-dist-badge');
            if (!badge) {
              badge = document.createElement('div');
              badge.className = 'belt-dist-badge';
              badge.style.cssText = 'position:absolute;top:1px;right:1px;font-size:9px;z-index:20;pointer-events:none;padding:1px 3px;border-radius:3px;' +
                (isRelay ? 'background:rgba(96,165,250,0.8);color:#fff' : dist >= 3 ? 'background:rgba(249,115,22,0.8);color:#fff' : 'background:rgba(20,184,166,0.8);color:#fff');
              cell.style.position = 'relative';
              cell.appendChild(badge);
            }
            badge.textContent = isRelay ? `📡${dist}格·${distEff}%` : `${dist}格·${distEff}%`;
          }
        } else {
          cell.classList.add('belt-connect-target', 'belt-target-invalid');
        }
      }
    }
  },

  // ★ Q2：传送带模式提醒系统
  _showBeltModeBanner() {
    let banner = document.getElementById('beltModeBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'beltModeBanner';
      banner.className = 'belt-mode-banner';
      banner.innerHTML = `<span class="bmb-icon">🔗</span><span class="bmb-text">传送带连接模式</span><span class="bmb-hint">ESC / 右键 退出</span>`;
      banner.addEventListener('click', () => {
        this.cancelBeltConnect();
        this.showCursorTooltip('已退出传送带模式');
      });
      document.body.appendChild(banner);
    }
    banner.classList.add('show');
    // 重置闲置提醒状态
    banner.classList.remove('idle-warning');
    const warnEl = banner.querySelector('.bmb-idle');
    if (warnEl) warnEl.remove();
  },

  _hideBeltModeBanner() {
    const banner = document.getElementById('beltModeBanner');
    if (banner) banner.classList.remove('show', 'idle-warning');
  },

  _startBeltIdleTimer() {
    this._stopBeltIdleTimer();
    this._beltIdleSeconds = 0;
    this._beltIdleTimer = setInterval(() => {
      if (!this._beltConnectMode) { this._stopBeltIdleTimer(); return; }
      this._beltIdleSeconds++;
      // 30秒闲置提醒
      if (this._beltIdleSeconds === 30) {
        const banner = document.getElementById('beltModeBanner');
        if (banner) {
          banner.classList.add('idle-warning');
          // 添加闲置提醒文字
          if (!banner.querySelector('.bmb-idle')) {
            const idle = document.createElement('span');
            idle.className = 'bmb-idle';
            idle.textContent = '⏰ 未操作30秒，是否仍需连接？点击此处退出';
            banner.appendChild(idle);
          }
        }
        this.log('⏰ 传送带连接模式已闲置30秒 — 按ESC退出或继续操作', 'w');
      }
      // 60秒超时自动提示（不自动退出，尊重用户意图）
      if (this._beltIdleSeconds === 60) {
        this.showCursorTooltip('📌 仍在传送带模式中', 'w');
      }
    }, 1000);
  },

  _stopBeltIdleTimer() {
    if (this._beltIdleTimer) {
      clearInterval(this._beltIdleTimer);
      this._beltIdleTimer = null;
    }
    this._beltIdleSeconds = 0;
  },

  _resetBeltIdleTimer() {
    if (this._beltConnectMode) {
      this._beltIdleSeconds = 0;
      // 移除闲置警告状态
      const banner = document.getElementById('beltModeBanner');
      if (banner) {
        banner.classList.remove('idle-warning');
        const warnEl = banner.querySelector('.bmb-idle');
        if (warnEl) warnEl.remove();
      }
    }
  },

  // ★ Q2：操作冲突提示 — 在传送带模式下尝试其他操作时提醒
  _beltModeConflictCheck(actionName) {
    if (!this._beltConnectMode) return false;
    this.showCursorTooltip(`⚠️ 传送带模式中！先按ESC退出再${actionName}`, 'w');
    this.log(`⚠️ 当前处于传送带连接模式 — 按ESC退出后再${actionName}`, 'w');
    // 让banner闪烁提醒
    const banner = document.getElementById('beltModeBanner');
    if (banner) {
      banner.classList.add('conflict-flash');
      setTimeout(() => banner.classList.remove('conflict-flash'), 600);
    }
    return true;
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

    const costStr = Object.entries(totalCost).map(([k,v]) => `${formatNum(v)}${RES[k]?.icon||k}`).join(' + ');
    const curEff = this.getBeltEfficiency(toUpgrade[0]);
    const curCap = this.getBeltCapacity(toUpgrade[0]);
    const nextLv = minLv + 1;
    const nextEffMap = { 1: 0.75, 2: 0.9, 3: 1.0, 4: 1.2, 5: 1.5 };
    const nextCapMap = { 1: 2.0, 2: 3.0, 3: 5.0, 4: 8.0, 5: 12.0 };
    const nextEff = nextEffMap[nextLv];
    const nextCap = nextCapMap[nextLv];

    const pop = document.getElementById('beltUpgradePopup');
    if (!pop) return;
    const label = count > 1 ? `⛓ ${fromName} → ${toName} ×${count}` : `⛓ ${fromName} → ${toName}`;
    document.getElementById('beltUpgradeName').textContent = label;
    document.getElementById('beltUpgradeLevel').textContent = `Lv.${minLv} → Lv.${nextLv}`;
    document.getElementById('beltUpgradeEffect').textContent = `效率: ${Math.round(curEff*100)}% → ${Math.round(nextEff*100)}%  |  容量: ${curCap}/s → ${nextCap}/s`;
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
    const isWonderEv = this.pendingChoice._isWonderEvent;
    this.pendingChoice.a.fn(this);
    this.log(`💡 选择了「${this.pendingChoice.a.label}」— ${this.pendingChoice.a.desc}`, 's');
    SFX.achieve();
    this.screenShake(4);
    this.pendingChoice = null;
    this._hidePopup('choicePopup');
    this._hideBackdrop();
    // ★ 改进2：清除奇观事件暂停标志，恢复建造进度推进
    if (isWonderEv) this._wonderEventPending = false;
    this.updateUI();
  },

  chooseB() {
    if (!this.pendingChoice) return;
    const isWonderEv = this.pendingChoice._isWonderEvent;
    this.pendingChoice.b.fn(this);
    this.log(`💡 选择了「${this.pendingChoice.b.label}」— ${this.pendingChoice.b.desc}`, 's');
    SFX.achieve();
    this.screenShake(4);
    this.pendingChoice = null;
    this._hidePopup('choicePopup');
    this._hideBackdrop();
    // ★ 改进2：清除奇观事件暂停标志，恢复建造进度推进
    if (isWonderEv) this._wonderEventPending = false;
    this.updateUI();
  },

  // ===== PETRI DISH EXPERIMENT =====

  // v2.1 §8.2: 检查P3+配方分散解锁条件
  _checkPetriP3Unlock() {
    if (this._petriP3Unlocked) return;
    if (this.phase < 3) return;
    // 条件：建造2个生物膜反应器 + 拥有菌丝运输网
    if (this.bldCount('biofilmReactor') >= 2 && this.bldCount('transport') >= 1) {
      this._petriP3Unlocked = true;
      this.log('🧫 培养皿实验·高阶配方解锁！生物膜矩阵+菌丝网络为实验打开了新可能', 's');
      this.showMilestone('🧫', '高阶配方解锁！');
      this.showEvent('🧫 培养皿·高阶配方', '生物膜反应器的密集培养与菌丝运输网的渗透效应，\n解锁了全新的P3+实验配方！\n\n尝试在实验区域中放置P3建筑来触发新配方。', '#14b8a6');
      SFX.achieve();
      this.updatePetriUI();
    }
  },

  startPetriMode() {
    if (this.phase < 2) { this.log('需要进入阶段2后解锁培养皿实验', 'w'); SFX.buildFail(); return; }
    if (this._petriCooldown > 0) { this.log(`🧫 实验冷却中 (${this._petriCooldown}s)`, 'w'); SFX.buildFail(); return; }
    if (this._beltConnectMode) this.cancelBeltConnect();
    this._petriMode = true;
    this._petriHoverIdx = null;
    this.sel = null;
    document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('active'));
    const petriBtn = document.getElementById('petriExpBtnLeft');
    if (petriBtn) petriBtn.classList.add('active');
    document.getElementById('buildHint').textContent = '🧫 选择实验区域中心（点击有建筑的格子）';
    document.getElementById('buildHint').style.color = '#14b8a6';
    this.log('🧫 培养皿实验模式 — 选择3×3区域中心', '');
  },

  cancelPetriMode() {
    this._petriMode = false;
    this._petriHoverIdx = null;
    document.getElementById('buildHint').textContent = '';
    document.getElementById('buildHint').style.color = '';
    const petriBtn = document.getElementById('petriExpBtnLeft');
    if (petriBtn) petriBtn.classList.remove('active');
    // 移除高亮
    document.querySelectorAll('.cell.petri-zone').forEach(c => c.classList.remove('petri-zone'));
    document.querySelectorAll('.cell.petri-center').forEach(c => c.classList.remove('petri-center'));
  },

  // 获取3×3区域内的格子索引
  _petriZone(centerIdx) {
    const cols = this.gridCols, rows = this.gridRows;
    const cr = Math.floor(centerIdx / cols), cc = centerIdx % cols;
    const zone = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = cr + dr, c = cc + dc;
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          zone.push(r * cols + c);
        }
      }
    }
    return zone;
  },

  // 扫描区域内的建筑类型计数
  _scanPetriZone(zone) {
    const typeCounts = {};
    let totalBuildings = 0;
    const types = new Set();
    for (const idx of zone) {
      const g = this.grid[idx];
      if (g && g.type && BLDS[g.type]) {
        typeCounts[g.type] = (typeCounts[g.type] || 0) + 1;
        totalBuildings++;
        types.add(g.type);
      }
    }
    return { typeCounts, totalBuildings, typeCount: types.size };
  },

  // 匹配最佳配方
  _matchPetriRecipe(scan) {
    // 按优先级排序：高阶段 > 低阶段，特殊条件 > 通用
    // v2.1 §8.2: P3+配方需要分散解锁条件（2×生物膜反应器+菌丝运输网）
    const maxPhase = (this.phase >= 3 && !this._petriP3Unlocked) ? 2 : this.phase;
    const sorted = [...PETRI_RECIPES]
      .filter(r => r.phase <= maxPhase)
      .sort((a, b) => {
        // 优先高阶段
        if (b.phase !== a.phase) return b.phase - a.phase;
        // 同阶段优先特殊条件（minBuildings 高 > 低）
        return (b.minBuildings || 3) - (a.minBuildings || 3);
      });
    for (const recipe of sorted) {
      // 检查最少建筑数
      if (scan.totalBuildings < (recipe.minBuildings || 3)) continue;
      // 特殊：需要N种不同类型
      if (recipe.minTypes && scan.typeCount < recipe.minTypes) continue;
      // 检查 requires
      let ok = true;
      for (const [type, count] of Object.entries(recipe.requires)) {
        if ((scan.typeCounts[type] || 0) < count) { ok = false; break; }
      }
      if (ok) return recipe;
    }
    return null;
  },

  // 处理实验选区点击
  handlePetriClick(idx) {
    if (!this._petriMode) return;
    // 中心格必须有建筑
    if (!this.grid[idx]) {
      this.log('🚫 空格子！需选有建筑的格子作中心', 'w');
      SFX.buildFail();
      return;
    }
    const zone = this._petriZone(idx);
    const scan = this._scanPetriZone(zone);
    if (scan.totalBuildings < 3) {
      this.log(`🧫 3×3区域内只有 ${scan.totalBuildings} 个建筑（需≥3）`, 'w');
      SFX.buildFail();
      return;
    }
    // 匹配配方
    const recipe = this._matchPetriRecipe(scan);
    this.cancelPetriMode();
    if (recipe) {
      this._applyPetriRecipe(recipe);
      this.showCursorTooltip(`🧫 ${recipe.icon} ${recipe.name}！`);
    } else {
      // 保底：常规培养
      this._applyPetriFallback(scan);
      this.showCursorTooltip(`🧫 常规培养 — 尝试特定建筑组合可触发配方`);
    }
    // 记录实验区域（仅在有持续buff时持续高亮）
    if (this._petriBuff) {
      this._petriActiveZone = zone;
    } else {
      this._petriActiveZone = null;
    }
    this._petriCooldown = PETRI_COOLDOWN;
    this._petriCount++;
    this.updatePetriUI();
    SFX.researchDone();
  },

  // 应用配方效果
  _applyPetriRecipe(recipe) {
    const b = recipe.buff;
    // v3.0 §8.3: 幸运催化剂增幅效果值+30%
    const luckBonus = this._getCatalystValue('petriBuff');
    const buffValue = luckBonus > 0 ? b.value * (1 + luckBonus) : b.value;
    if (b.type === 'instant_random') {
      // 混沌培养：随机资源暴击
      const resKeys = Object.keys(RES).filter(k => RES[k].phase <= this.phase);
      const rk = resKeys[Math.floor(Math.random() * resKeys.length)];
      const amount = Math.floor((this.res[rk] || 0) * buffValue * 0.1 + 10);
      this.res[rk] = (this.res[rk] || 0) + amount;
      this.log(`🌀 混沌培养！${RES[rk].icon || rk} +${amount}`, 's');
      this.showEvent('🧫 实验完成！', `🌀 混沌培养\n${RES[rk]?.n || rk} 暴击！+${amount}`, '#f59e0b');
    } else {
      // 正常 buff
      this._petriBuff = {
        id: recipe.id,
        name: b.name,
        icon: b.icon,
        type: b.type,
        value: buffValue,
        remaining: b.duration,
        total: b.duration,
        color: b.color,
      };
      const luckTag = luckBonus > 0 ? ' 🍀+30%' : '';
      this.log(`🧫 ${b.icon} ${b.name} 激活！${luckTag} 持续 ${b.duration}s`, 's');
      const buffDesc = this._petriBuffDesc({ ...b, value: buffValue });
      this.showEvent('🧫 实验完成！', `${b.icon} ${b.name}${luckTag}\n${buffDesc}\n持续 ${b.duration} 秒`, b.color);
    }
    // v3.0 §8.3: 实验后消耗幸运催化
    this._consumeLuckCatalyst();
    // 一次性资源奖励
    if (recipe.reward) {
      for (const [k, v] of Object.entries(recipe.reward)) {
        if (v > 0) this.res[k] = (this.res[k] || 0) + v;
      }
    }
  },

  // 保底效果
  _applyPetriFallback(scan) {
    // 基础奖励：每个建筑给少量资源
    const amt = scan.totalBuildings * 3;
    this.res.glucose = (this.res.glucose || 0) + amt;
    this.res.energy = (this.res.energy || 0) + amt;
    this.log(`🧫 常规培养 — +${amt}🟢 +${amt}⚡`, 's');
    this.showEvent('🧫 实验完成', `常规培养\n+${amt}🟢葡萄糖 +${amt}⚡能量\n\n💡 尝试更多建筑组合解锁特殊配方！`, '#6b7280');
  },

  // buff 描述文字
  _petriBuffDesc(b) {
    if (b.type === 'prodMult') return `全局产出 +${Math.round(b.value * 100)}%`;
    if (b.type.startsWith('resMult_')) {
      const resKey = b.type.split('_')[1];
      return `${RES[resKey]?.n || resKey}产出 +${Math.round(b.value * 100)}%`;
    }
    if (b.type === 'consReduce') return `全局消耗 -${Math.round(b.value * 100)}%`;
    if (b.type === 'qsDecay') return `QS衰减 -${Math.round(b.value * 100)}%`;
    if (b.type === 'logisticsBoost') return `物流效率 +${Math.round(b.value * 100)}%`;
    if (b.type === 'effBoost') return `全局效率 +${Math.round(b.value * 100)}%`;
    return '';
  },

  // Tick: 冷却和buff倒计时
  tickPetri() {
    if (this._petriCooldown > 0) this._petriCooldown--;
    if (this._petriBuff) {
      this._petriBuff.remaining--;
      if (this._petriBuff.remaining <= 0) {
        this.log(`🧫 ${this._petriBuff.icon} ${this._petriBuff.name} 效果已结束`, '');
        this._petriBuff = null;
        // 清除实验区域高亮
        this._petriActiveZone = null;
        document.querySelectorAll('.cell.petri-active').forEach(c => c.classList.remove('petri-active'));
      }
    }
  },

  // 更新培养皿实验UI面板
  updatePetriUI() {
    // 更新左侧按钮状态
    const leftBtn = document.getElementById('petriExpBtnLeft');
    const leftDesc = document.getElementById('petriExpDesc');
    if (leftBtn) {
      leftBtn.disabled = this._petriCooldown > 0;
      leftBtn.style.opacity = this._petriCooldown > 0 ? '0.4' : '';
    }
    if (leftDesc) {
      leftDesc.textContent = this._petriCooldown > 0
        ? `冷却中 ${this._petriCooldown}s`
        : this._petriBuff
          ? `${this._petriBuff.icon} ${this._petriBuff.name} (${this._petriBuff.remaining}s)`
          : '选择3×3区域，触发实验效果';
    }

    const sec = document.getElementById('secPetri');
    if (!sec) return;
    // 阶段2+才显示
    if (this.phase < 2) { sec.style.display = 'none'; return; }
    sec.style.display = '';
    const panel = document.getElementById('petriResultPanel');
    if (!panel) return;

    let html = '';
    // 按钮
    const cdText = this._petriCooldown > 0
      ? `<span style="color:var(--dim)">冷却 ${this._petriCooldown}s</span>`
      : '<span style="color:#14b8a6">就绪</span>';
    const btnDisabled = this._petriCooldown > 0 ? 'disabled style="opacity:0.4"' : '';
    html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <button id="petriStartBtn" onclick="G.startPetriMode()" class="petri-start-btn" ${btnDisabled}>🔬 开始实验</button>
      <span style="font-size:0.72em">${cdText}</span>
    </div>`;

    // 当前buff
    if (this._petriBuff) {
      const b = this._petriBuff;
      const pct = Math.max(0, (b.remaining / b.total) * 100);
      const desc = this._petriBuffDesc(b);
      html += `<div style="border:1px solid ${b.color}30;border-radius:4px;padding:6px;margin-top:4px;background:${b.color}08">
        <div style="font-size:0.78em;display:flex;justify-content:space-between;align-items:center">
          <span style="color:${b.color};font-weight:600">${b.icon} ${b.name}</span>
          <span style="color:var(--dim);font-size:0.85em">${b.remaining}s</span>
        </div>
        <div style="font-size:0.68em;color:var(--dim);margin:2px 0">${desc}</div>
        <div style="height:3px;background:rgba(255,255,255,0.04);border-radius:2px;overflow:hidden;margin-top:3px">
          <div style="height:100%;width:${pct}%;background:${b.color};border-radius:2px;transition:width 1s linear"></div>
        </div>
      </div>`;
    }

    // v2.1 §8.2: P3+配方解锁状态提示
    if (this.phase >= 3 && !this._petriP3Unlocked) {
      const hasReactor = this.bldCount('biofilmReactor');
      const hasTransport = this.bldCount('transport');
      html += `<div style="border:1px solid #14b8a620;border-radius:4px;padding:6px;margin-top:4px;background:#14b8a608;font-size:0.72em">
        <div style="color:#14b8a6;font-weight:600;margin-bottom:3px">🔒 高阶配方（P3+）未解锁</div>
        <div style="color:var(--dim)">
          ${hasReactor >= 2 ? '✅' : '❌'} 生物膜反应器 ×2 <span style="color:${hasReactor >= 2 ? '#22c55e' : 'var(--dim)'}">(${hasReactor}/2)</span><br>
          ${hasTransport >= 1 ? '✅' : '❌'} 菌丝运输网 ×1 <span style="color:${hasTransport >= 1 ? '#22c55e' : 'var(--dim)'}">(${hasTransport}/1)</span>
        </div>
      </div>`;
    } else if (this.phase >= 3 && this._petriP3Unlocked) {
      html += `<div style="font-size:0.65em;color:#14b8a6;margin-top:4px">✅ P3+高阶配方已解锁</div>`;
    }

    // 实验次数
    if (this._petriCount > 0) {
      html += `<div style="font-size:0.65em;color:var(--dim);margin-top:4px;text-align:right">累计实验: ${this._petriCount}次</div>`;
    }

    panel.innerHTML = html;
  },

  // 高亮3×3区域（鼠标悬停时调用）
  _highlightPetriZone(centerIdx) {
    // 清除旧高亮
    document.querySelectorAll('.cell.petri-zone').forEach(c => c.classList.remove('petri-zone'));
    document.querySelectorAll('.cell.petri-center').forEach(c => c.classList.remove('petri-center'));
    if (centerIdx == null) return;
    const zone = this._petriZone(centerIdx);
    const gridEl = document.getElementById('grid');
    if (!gridEl) return;
    for (const idx of zone) {
      const cell = gridEl.children[idx];
      if (cell) cell.classList.add('petri-zone');
    }
    const centerCell = gridEl.children[centerIdx];
    if (centerCell) centerCell.classList.add('petri-center');
  },

  // ===== v3.0 §8.3: 催化剂消耗品系统 =====
  _isCatalystActive(effectType) {
    for (const cat of CATALYSTS) {
      if (cat.effect === effectType) {
        const end = this._catalysts[cat.id];
        if (end && (end === -1 || end > this.rt)) return true;
      }
    }
    return false;
  },

  _getCatalystValue(effectType) {
    for (const cat of CATALYSTS) {
      if (cat.effect === effectType) {
        const end = this._catalysts[cat.id];
        if (end && (end === -1 || end > this.rt)) return cat.value;
      }
    }
    return 0;
  },

  useCatalyst(catId) {
    const cat = CATALYSTS.find(c => c.id === catId);
    if (!cat) return;
    if (this.prestigeCurrency < cat.cost) {
      this.log(`⚠️ 进化因子不足（需${cat.cost}，当前${this.prestigeCurrency}）`, 'w');
      SFX.buildFail();
      return;
    }
    // 不叠加，刷新持续时间
    this.prestigeCurrency -= cat.cost;
    if (cat.duration === -1) {
      // 幸运催化：持续到下次培养皿实验
      this._catalysts[catId] = -1;
    } else {
      this._catalysts[catId] = this.rt + cat.duration * 60; // duration秒 × 60tick/秒
    }
    this.log(`${cat.icon} 催化剂激活: ${cat.n} — ${cat.desc}`, 'ev');
    this.showCursorTooltip(`${cat.icon} ${cat.n} 已激活！`);
    SFX.researchDone();
    this.stats.catalystUseCount = (this.stats.catalystUseCount || 0) + 1;
    this._renderCatalystPanel();
    // 持久化进化因子到prestige数据
    this._saveCatalystPrestige();
  },

  _saveCatalystPrestige() {
    try {
      const pd = localStorage.getItem('bioSpherePrestige');
      if (!pd) return;
      const pData = JSON.parse(pd);
      pData.pc = this.prestigeCurrency;
      localStorage.setItem('bioSpherePrestige', JSON.stringify(pData));
    } catch(e) {}
  },

  _tickCatalysts() {
    let changed = false;
    for (const cat of CATALYSTS) {
      const end = this._catalysts[cat.id];
      if (!end) continue;
      if (end === -1) continue; // 幸运催化不按时间过期
      if (this.rt >= end) {
        delete this._catalysts[cat.id];
        this.log(`${cat.icon} ${cat.n} 效果已结束`, '');
        changed = true;
      }
    }
    if (changed) this._renderCatalystPanel();
  },

  // 幸运催化在培养皿实验后消耗
  _consumeLuckCatalyst() {
    if (this._catalysts.luckBoost) {
      delete this._catalysts.luckBoost;
      this.log('🍀 幸运催化已消耗', '');
      this._renderCatalystPanel();
    }
  },

  _renderCatalystPanel() {
    const sec = document.getElementById('catalystSection');
    if (!sec) return;
    // 仅转生5+次且催化剂里程碑已解锁时显示
    if (!this._unlockedMilestones?.catalyst) {
      sec.style.display = 'none';
      return;
    }
    sec.style.display = '';

    const hint = document.getElementById('catalystHint');
    if (hint) hint.textContent = `${PRESTIGE.currencyIcon}${this.prestigeCurrency}`;

    const panel = document.getElementById('catalystContent');
    if (!panel) return;

    let html = '';
    // 活跃效果
    const activeList = CATALYSTS.filter(c => {
      const end = this._catalysts[c.id];
      return end && (end === -1 || end > this.rt);
    });
    if (activeList.length > 0) {
      html += `<div style="margin-bottom:8px;padding:6px 8px;background:rgba(249,115,22,0.06);border:1px solid rgba(249,115,22,0.15);border-radius:6px">`;
      html += `<div style="font-size:0.68em;color:#f97316;font-weight:600;margin-bottom:4px">活跃效果</div>`;
      for (const cat of activeList) {
        const end = this._catalysts[cat.id];
        let timeStr;
        if (end === -1) {
          timeStr = '持续到下次实验';
        } else {
          const remain = Math.max(0, Math.ceil((end - this.rt) / 60));
          const pct = Math.min(100, (end - this.rt) / (cat.duration * 60) * 100);
          timeStr = `${remain}秒`;
          html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">`;
          html += `<span style="font-size:0.8em">${cat.icon}</span>`;
          html += `<span style="font-size:0.72em;color:${cat.color};font-weight:600;min-width:52px">${cat.n}</span>`;
          html += `<div style="flex:1;height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden">`;
          html += `<div style="width:${pct}%;height:100%;background:${cat.color};border-radius:2px;transition:width 1s linear"></div></div>`;
          html += `<span style="font-size:0.65em;color:var(--dim);min-width:32px;text-align:right">${timeStr}</span>`;
          html += `</div>`;
          continue;
        }
        html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">`;
        html += `<span style="font-size:0.8em">${cat.icon}</span>`;
        html += `<span style="font-size:0.72em;color:${cat.color};font-weight:600">${cat.n}</span>`;
        html += `<span style="font-size:0.65em;color:var(--dim);margin-left:auto">${timeStr}</span>`;
        html += `</div>`;
      }
      html += `</div>`;
    }

    // 催化剂列表
    for (const cat of CATALYSTS) {
      const canBuy = this.prestigeCurrency >= cat.cost;
      const isActive = this._catalysts[cat.id] && (this._catalysts[cat.id] === -1 || this._catalysts[cat.id] > this.rt);
      const durText = cat.duration === -1 ? '持续到下次实验' : `${cat.duration}秒`;
      html += `<div style="display:flex;align-items:center;gap:8px;padding:5px 8px;margin:3px 0;border-radius:6px;
        background:${isActive ? `rgba(249,115,22,0.04)` : 'rgba(255,255,255,0.02)'};
        border:1px solid ${isActive ? 'rgba(249,115,22,0.2)' : canBuy ? `${cat.color}30` : 'rgba(255,255,255,0.04)'};
        cursor:${canBuy && !isActive ? 'pointer' : 'default'};opacity:${canBuy || isActive ? '1' : '0.5'}"
        ${canBuy && !isActive ? `onclick="G.useCatalyst('${cat.id}')"` : ''}>
        <span style="font-size:1em">${cat.icon}</span>
        <div style="flex:1">
          <div style="font-size:0.75em;font-weight:600;color:${cat.color}">${cat.n}</div>
          <div style="font-size:0.65em;color:var(--dim)">${cat.desc} · ${durText}</div>
        </div>
        <div style="font-size:0.68em;color:${canBuy ? '#f97316' : 'var(--dim)'};font-weight:600;white-space:nowrap">
          ${isActive ? '<span style="color:#22c55e">✓ 活跃</span>' : `${cat.cost}${PRESTIGE.currencyIcon}`}
        </div>
      </div>`;
    }

    panel.innerHTML = html;
  },

  // ===== v3.0 §8.5: 创造模式（转生15次解锁）=====
  enterCreativeMode() {
    if (!this._creativeAvailable) {
      this.log('⚠️ 创造模式需转生15次解锁', 'w');
      return;
    }
    if (this._creativeMode) {
      this.log('已在创造模式中', 'w');
      return;
    }
    // 确认弹窗
    this.showEvent('⭐ 创造模式', '进入创造模式后：\n\n✅ 无限资源，免费建造\n✅ 科技瞬间完成\n✅ 无需进化条件\n✅ 传送带无距离限制\n\n⚠️ 成就和转生进度不计入\n⚠️ 需要转生退出创造模式', '#fbbf24');
    setTimeout(() => {
      if (!confirm('确定进入创造模式？\n\n✅ 无限资源、免费建造、科技瞬间完成\n⚠️ 不计入成就和转生进度\n⚠️ 当前世进度将重置')) return;
      this._creativeMode = true;
      // 重置当前世
      localStorage.removeItem('bioSphereV3');
      // 保存创造模式标记到prestige data
      try {
        const pd = localStorage.getItem('bioSpherePrestige');
        if (pd) {
          const pData = JSON.parse(pd);
          pData.creativeMode = true;
          localStorage.setItem('bioSpherePrestige', JSON.stringify(pData));
        }
      } catch(e) {}
      location.reload();
    }, 500);
  },

  exitCreativeMode() {
    if (!this._creativeMode) return;
    if (!confirm('退出创造模式？\n\n创造模式下的进度将被清除。')) return;
    this._creativeMode = false;
    localStorage.removeItem('bioSphereV3');
    try {
      const pd = localStorage.getItem('bioSpherePrestige');
      if (pd) {
        const pData = JSON.parse(pd);
        delete pData.creativeMode;
        localStorage.setItem('bioSpherePrestige', JSON.stringify(pData));
      }
    } catch(e) {}
    location.reload();
  },

  _applyCreativeMode() {
    if (!this._creativeMode) return;
    // 资源锁定99999
    for (const k in RES) {
      this.res[k] = 99999;
    }
  },

  _isCreativeCheckRes() {
    // 创造模式下跳过资源检查
    return this._creativeMode;
  },

  _renderCreativeBadge() {
    // 顶栏金色标识
    let badge = document.getElementById('creativeBadge');
    if (this._creativeMode) {
      if (!badge) {
        badge = document.createElement('div');
        badge.id = 'creativeBadge';
        badge.style.cssText = 'position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:9999;padding:4px 16px;background:linear-gradient(135deg,rgba(251,191,36,0.15),rgba(251,191,36,0.05));border:1px solid rgba(251,191,36,0.3);border-top:none;border-radius:0 0 8px 8px;font-size:0.72em;color:#fbbf24;font-weight:700;letter-spacing:1px;pointer-events:auto;cursor:pointer';
        badge.textContent = '⭐ 创造模式 — 自由实验中';
        badge.title = '点击退出创造模式';
        badge.onclick = () => this.exitCreativeMode();
        document.body.appendChild(badge);
      }
    } else if (badge) {
      badge.remove();
    }
    // 创造模式入口按钮
    const btn = document.getElementById('creativeEntryBtn');
    if (btn) {
      btn.style.display = this._creativeAvailable && !this._creativeMode ? '' : 'none';
    }
  },

  // ===== PRESTIGE SYSTEM =====
  canPrestige() {
    // B+C方案：首通必须完成P5奇观；转生1次后解锁"P4快速转生"
    if (this.wonderComplete) return true;           // 奇观完成 → 随时可转
    if (this.phase >= 5) return true;               // 已在P5 → 可转（即使奇观未完成）
    if (this.phase >= 4 && this.prestigeCount >= 1) return true; // 老玩家P4可快转
    return false;
  },

  getPrestigeGain() {
    return Math.floor(PRESTIGE.calcGain(this) * this.getVariantScoreBonus());
  },

  showPrestigePanel() {
    const pop = document.getElementById('prestigePopup');
    if (!pop) return;
    const gain = this.getPrestigeGain();
    document.getElementById('prestigeGain').textContent = `+${formatNum(gain)} ${PRESTIGE.currencyIcon}${PRESTIGE.currencyName}`;
    document.getElementById('prestigeCurrent').textContent = `当前: ${formatNum(this.prestigeCurrency)} ${PRESTIGE.currencyIcon}`;
    document.getElementById('prestigeTotal').textContent = `转生次数: ${this.prestigeCount}`;

    // === 被动奖励预览 ===
    const passiveEl = document.getElementById('prestigePassiveList');
    if (passiveEl) {
      let passiveHTML = '';
      const pcBonus = PRESTIGE.prestigeCountBonus(this.prestigeCount);
      if (this.prestigeCount > 0) {
        passiveHTML += `<div style="padding:4px 8px;margin:2px 0;border-radius:4px;background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.2);font-size:0.75em;color:var(--purple)">
          🌀 轮回之力: 全局效率 +${formatNum(pcBonus * 100, 1)}% (${this.prestigeCount}次转生累计)</div>`;
      }
      for (const pb of PRESTIGE.passiveBonuses) {
        const met = this.prestigeCount >= pb.count;
        passiveHTML += `<div style="padding:4px 8px;margin:2px 0;border-radius:4px;font-size:0.75em;
          background:${met ? 'rgba(168,85,247,0.06)' : 'transparent'};
          border:1px solid ${met ? 'rgba(168,85,247,0.15)' : 'var(--color-panel-border)'};
          color:${met ? 'var(--purple)' : 'var(--color-muted-dark)'}">
          ${met ? '✓ ' : `🔒${pb.count}次 `}${pb.n}: ${pb.d}</div>`;
      }
      passiveEl.innerHTML = passiveHTML;
    }

    // === 固定加成列表 ===
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
        <div style="font-size:0.75em;font-weight:700;color:${canBuy ? 'var(--yellow)' : 'var(--color-muted-dark)'}">${owned ? '已拥有' : `${formatNum(b.cost)}${PRESTIGE.currencyIcon}`}</div>
      `;
      if (canBuy && !owned) {
        div.onclick = () => this.buyPrestigeBonus(i);
      }
      list.appendChild(div);
    });

    // === 无限循环加成 ===
    const allBought = PRESTIGE.bonuses.every((b, i) => this.prestigeBonuses.includes(i));
    const infEl = document.getElementById('prestigeInfiniteList');
    if (infEl) {
      if (!allBought) {
        infEl.innerHTML = '<div style="font-size:0.7em;color:var(--color-muted-dark);text-align:center;padding:8px">🔒 购买全部固定加成后解锁</div>';
      } else {
        let infHTML = '';
        for (const inf of PRESTIGE.infiniteBonuses) {
          const lv = this.infiniteBonusLevels[inf.id] || 0;
          const cost = PRESTIGE.getInfCost(inf, lv);
          const canBuy = this.prestigeCurrency >= cost;
          infHTML += `<div style="padding:6px 8px;margin:3px 0;border-radius:4px;display:flex;justify-content:space-between;align-items:center;
            background:${lv > 0 ? 'rgba(234,179,8,0.06)' : 'var(--color-panel-bg)'};
            border:1px solid ${canBuy ? 'rgba(234,179,8,0.3)' : 'var(--color-panel-border)'};
            cursor:${canBuy ? 'pointer' : 'default'}" onclick="${canBuy ? `G.buyInfiniteBonus('${inf.id}')` : ''}">
            <div>
              <div style="font-size:0.85em;font-weight:700;color:var(--bright)">${inf.icon} ${inf.n} <span style="color:var(--yellow);font-size:0.8em">Lv.${lv}</span></div>
              <div style="font-size:0.7em;color:var(--dim)">${inf.d(lv + 1)}</div>
            </div>
            <div style="font-size:0.75em;font-weight:700;color:${canBuy ? 'var(--yellow)' : 'var(--color-muted-dark)'}">${formatNum(cost)}${PRESTIGE.currencyIcon}</div>
          </div>`;
        }
        infEl.innerHTML = infHTML;
      }
    }

    const canP = this.canPrestige();
    document.getElementById('prestigeBtn').disabled = !canP;
    document.getElementById('prestigeBtn').style.opacity = canP ? '1' : '0.3';
    pop.classList.add('show');
    this._showBackdrop();
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

  buyInfiniteBonus(infId) {
    const inf = PRESTIGE.infiniteBonuses.find(i => i.id === infId);
    if (!inf) return;
    const lv = this.infiniteBonusLevels[infId] || 0;
    const cost = PRESTIGE.getInfCost(inf, lv);
    if (this.prestigeCurrency < cost) return;
    this.prestigeCurrency -= cost;
    this.infiniteBonusLevels[infId] = lv + 1;
    this.log(`🌀 无限加成升级: ${inf.n} → Lv.${lv + 1}`, 's');
    SFX.researchDone();
    this.showPrestigePanel(); // refresh
    this.save(true);
  },

  doPrestige() {
    // v3.0 §8.5: 创造模式禁止转生
    if (this._creativeMode) {
      this.log('⭐ 创造模式中无法转生。请先退出创造模式。', 'w');
      SFX.buildFail();
      return;
    }
    if (!this.canPrestige()) return;
    const gain = this.getPrestigeGain();
    const nextCount = this.prestigeCount + 1;
    let extraInfo = '';
    const nextPassive = PRESTIGE.passiveBonuses.find(pb => pb.count === nextCount);
    if (nextPassive) extraInfo = `\n🌟 新被动解锁: ${nextPassive.n} — ${nextPassive.d}`;
    const pcBonus = PRESTIGE.prestigeCountBonus(nextCount);
    extraInfo += `\n🌀 轮回之力: 全局效率 +${formatNum(pcBonus * 100, 1)}%`;
    // v3.0 §8: 检查新里程碑解锁
    const newMilestone = PRESTIGE_MILESTONES.find(m => m.count === nextCount);
    if (newMilestone) extraInfo += `\n🏆 里程碑解锁: ${newMilestone.icon} ${newMilestone.name} — ${newMilestone.desc}`;

    // B+C: P4快速转生时提醒P5奖励
    let wonderHint = '';
    if (!this.wonderComplete && this.phase < 5) {
      wonderHint = '\n\n💡 提示: 推进到P5完成奇观可获得5×进化因子！';
    } else if (!this.wonderComplete && this.phase >= 5) {
      wonderHint = '\n\n💡 提示: 完成奇观后转生可获得5×进化因子！';
    } else if (this.wonderComplete) {
      wonderHint = '\n\n☀️ 奇观加成: 进化因子 ×5！';
    }

    if (!confirm(`确定要转生？\n\n获得 +${formatNum(gain)} ${PRESTIGE.currencyIcon}${PRESTIGE.currencyName}${extraInfo}${wonderHint}\n\n所有进度将重置（转生加成和货币保留）`)) return;

    // ★ 转生前保存当世最高分到 Supabase（修复：之前转生后分数归零导致排行榜无意义）
    this._saveHighScoreBeforePrestige();

    this.prestigeCurrency += gain;
    this.prestigeCount++;

    // B+C: 追踪带奇观完成的转生次数
    const wonderPrestigeCount = (this._wonderPrestigeCount || 0) + (this.wonderComplete ? 1 : 0);
    const fastestWonder = this._fastestWonder || null;

    // v3.0 §8.6: 记录变体通关
    const completedVariants = { ...(this._completedVariants || {}) };
    if (this._activeVariant) {
      completedVariants[this._activeVariant] = true;
    }

    // v3.0 §8: 更新里程碑
    const milestones = { ...(this._unlockedMilestones || {}) };
    for (const m of PRESTIGE_MILESTONES) {
      if (this.prestigeCount >= m.count) milestones[m.id] = true;
    }

    // v3.0 §8: 变体选择（转生次数≥2后解锁）
    if (this.prestigeCount >= 2) {
      this._pendingPrestigeData = {
        pc: this.prestigeCurrency,
        pcount: this.prestigeCount,
        pbonuses: [...this.prestigeBonuses],
        infLevels: { ...this.infiniteBonusLevels },
        milestones,
        blueprints: this._blueprints || [],
        completedVariants,
        wonderPrestigeCount,
        fastestWonder,
        ratingRewardsClaimed: this._ratingRewardsClaimed || {},
      };
      this._showVariantChoice();
      return; // 等玩家选择后再重载
    }

    // 无变体的普通转生
    const pData = {
      pc: this.prestigeCurrency,
      pcount: this.prestigeCount,
      pbonuses: [...this.prestigeBonuses],
      infLevels: { ...this.infiniteBonusLevels },
      milestones,
      blueprints: this._blueprints || [],
      completedVariants,
      wonderPrestigeCount,
      fastestWonder,
      ratingRewardsClaimed: this._ratingRewardsClaimed || {},
      variant: null,
    };
    localStorage.removeItem('bioSphereV3');
    localStorage.setItem('bioSpherePrestige', JSON.stringify(pData));
    SFX.wonderDone();
    location.reload();
  },

  // v3.0 §8: 变体选择面板
  _showVariantChoice() {
    const overlay = document.createElement('div');
    overlay.id = 'variantChoiceOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.92);z-index:10000;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.3s';

    let html = `<div style="background:#1a1a2e;border:1px solid rgba(168,85,247,0.3);border-radius:12px;padding:20px;max-width:440px;width:95%;max-height:85vh;overflow-y:auto;box-shadow:0 0 40px rgba(168,85,247,0.15)">`;
    html += `<div style="text-align:center;margin-bottom:12px">`;
    html += `<div style="font-size:1.3em">🌀</div>`;
    html += `<div style="font-size:1em;font-weight:700;color:#a855f7;margin-top:4px">第${this.prestigeCount}世 — 选择变体规则</div>`;
    html += `<div style="font-size:0.72em;color:#94a3b8;margin-top:4px">变体增加挑战难度，但进化因子获得量大幅提升</div>`;
    html += `</div>`;

    // 普通选项（无变体）
    html += `<button class="var-choice-btn" data-variant="none" style="
      width:100%;background:linear-gradient(135deg,rgba(34,197,94,0.08),rgba(34,197,94,0.03));
      border:1px solid rgba(34,197,94,0.3);border-radius:8px;padding:10px 12px;margin-bottom:6px;
      cursor:pointer;text-align:left;color:#e2e8f0;transition:all 0.2s;display:block"
      onmouseover="this.style.borderColor='#22c55e';this.style.boxShadow='0 0 12px rgba(34,197,94,0.2)'"
      onmouseout="this.style.borderColor='rgba(34,197,94,0.3)';this.style.boxShadow='none'">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
        <span style="font-size:1.1em">🌿</span>
        <span style="font-weight:700;color:#22c55e;font-size:0.88em">标准模式</span>
        <span style="font-size:0.7em;color:#94a3b8;margin-left:auto">×1.0 进化因子</span>
      </div>
      <div style="font-size:0.72em;color:#94a3b8">无额外限制，正常游戏体验</div>
    </button>`;

    // 变体选项
    for (const v of PRESTIGE_VARIANTS) {
      html += `<button class="var-choice-btn" data-variant="${v.id}" style="
        width:100%;background:linear-gradient(135deg,${v.color}10,${v.color}05);
        border:1px solid ${v.color}40;border-radius:8px;padding:10px 12px;margin-bottom:6px;
        cursor:pointer;text-align:left;color:#e2e8f0;transition:all 0.2s;display:block"
        onmouseover="this.style.borderColor='${v.color}';this.style.boxShadow='0 0 12px ${v.color}30'"
        onmouseout="this.style.borderColor='${v.color}40';this.style.boxShadow='none'">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
          <span style="font-size:1.1em">${v.icon}</span>
          <span style="font-weight:700;color:${v.color};font-size:0.88em">${v.name}</span>
          <span style="font-size:0.7em;color:${v.color};margin-left:auto">×${v.scoreBonus} 进化因子</span>
        </div>
        <div style="font-size:0.72em;color:#94a3b8;margin-bottom:2px">${v.desc}</div>
        <div style="font-size:0.68em;color:#64748b;font-style:italic">💡 ${v.hint}</div>
      </button>`;
    }
    html += `</div>`;

    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.var-choice-btn').forEach(btn => {
      btn.onclick = () => {
        const variantId = btn.dataset.variant;
        const pData = this._pendingPrestigeData;
        pData.variant = variantId === 'none' ? null : variantId;
        localStorage.removeItem('bioSphereV3');
        localStorage.setItem('bioSpherePrestige', JSON.stringify(pData));
        overlay.remove();
        SFX.wonderDone();
        location.reload();
      };
    });
  },

  // v3.0 §8: 完成变体后的分数加成
  getVariantScoreBonus() {
    if (!this._activeVariant) return 1;
    const v = PRESTIGE_VARIANTS.find(v => v.id === this._activeVariant);
    return v ? v.scoreBonus : 1;
  },

  closePrestige() {
    this._hidePopup('prestigePopup');
    this._hideBackdrop();
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
      this.infiniteBonusLevels = pData.infLevels || {};

      // v3.0 §8: 恢复变体、里程碑、蓝图
      this._activeVariant = pData.variant || null;
      this._unlockedMilestones = pData.milestones || {};
      this._blueprints = pData.blueprints || [];
      this._completedVariants = pData.completedVariants || {};
      this._ratingRewardsClaimed = pData.ratingRewardsClaimed || {};
      // B+C: 恢复奇观转生计数和最快奇观时间
      this._wonderPrestigeCount = pData.wonderPrestigeCount || 0;
      this._fastestWonder = pData.fastestWonder || null;
      // 确保里程碑根据当前转生次数更新
      for (const m of PRESTIGE_MILESTONES) {
        if (this.prestigeCount >= m.count) this._unlockedMilestones[m.id] = true;
      }
      // v3.0 §8: 里程碑效果
      if (this._unlockedMilestones.multiStrain) this._multiStrainUnlocked = true;
      if (this._unlockedMilestones.creative) this._creativeAvailable = true;
      // v3.0 §8.5: 恢复创造模式
      if (pData.creativeMode) this._creativeMode = true;

      // Apply owned fixed bonuses
      for (const idx of this.prestigeBonuses) {
        const b = PRESTIGE.bonuses[idx];
        if (b && b.fn) b.fn(this);
      }

      // Apply infinite bonuses
      for (const inf of PRESTIGE.infiniteBonuses) {
        const lv = this.infiniteBonusLevels[inf.id] || 0;
        if (lv > 0) inf.fn(this, lv);
      }

      // Apply prestige count passive bonuses
      for (const pb of PRESTIGE.passiveBonuses) {
        if (this.prestigeCount >= pb.count) pb.fn(this);
      }

      // Apply per-prestige cumulative bonus
      const pcBonus = PRESTIGE.prestigeCountBonus(this.prestigeCount);
      if (pcBonus > 0) this.gEff += pcBonus;

      // v3.0 §8: 应用变体运行时效果
      if (this._activeVariant) {
        const variant = PRESTIGE_VARIANTS.find(v => v.id === this._activeVariant);
        if (variant) {
          if (variant.rules.energyMult) this._variantEnergyMult = variant.rules.energyMult;
          if (variant.rules.maxBuildings) this._variantMaxBuildings = variant.rules.maxBuildings;
          if (variant.rules.noBelts) this._variantNoBelts = true;
          if (variant.rules.randomPlacement) this._variantRandomPlace = true;
          if (variant.rules.timeLimit) this._variantTimeLimit = variant.rules.timeLimit;
          if (variant.rules.toxicDecay) this._variantToxic = true;
        }
      }

      if (this.prestigeCount > 0) {
        this.log(`🌀 转生加成已应用 (第${this.prestigeCount}世)`, 'ev');
        const pcPct = formatNum(pcBonus * 100, 1);
        if (pcBonus > 0) this.log(`🌀 轮回之力: 全局效率 +${pcPct}%`, 'ev');
        document.querySelector('.topbar')?.classList.add('has-prestige');
        // v3.0 §8: 变体信息
        if (this._activeVariant) {
          const v = PRESTIGE_VARIANTS.find(vr => vr.id === this._activeVariant);
          if (v) {
            this.log(`${v.icon} 变体模式: ${v.name} — ${v.desc}`, 'ev');
            this.showEvent(`${v.icon} ${v.name}`, `本世变体规则:\\n\\n${v.desc}\\n\\n${v.hint}\\n\\n🌀 进化因子获得量 ×${v.scoreBonus}`, v.color);
          }
        }
        // v3.0 §8.4: 多菌株模式日志
        if (this._multiStrainUnlocked) {
          this.log('🌐 多菌株模式: 科技互斥限制已取消！', 'ev');
        }
        // v3.0 §8: 里程碑解锁通知
        for (const m of PRESTIGE_MILESTONES) {
          if (m.count === this.prestigeCount) {
            setTimeout(() => {
              this.showEvent(`${m.icon} 里程碑解锁!`, m.unlockDesc, m.color);
              this.showMilestone(m.icon, m.name);
              SFX.milestone();
            }, 2000);
          }
        }
      }
      // v3.0 §8.5: 创造模式 badge + 日志
      this._renderCreativeBadge();
      if (this._creativeMode) {
        this.log('⭐ 创造模式已激活 — 无限资源，自由实验', 'ev');
      }
      // v3.0: 同步速度按钮tooltip（turbo里程碑）
      this._syncSpeedUI();
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

// ===== BOOT =====
// 全局鼠标位置追踪（cursor tooltip 用）
document.addEventListener('mousemove', (e) => { window._lastMouseEvt = e; });
G.init();
GameTooltip.init();

// ===== 阶段标签 & 核心阶段标签 hover tooltip =====
(() => {
  function buildPhaseTooltip() {
    const cur = G.phase;
    const p = PHASES[cur - 1];
    const cc = CORE_COLONY[cur];
    let detail = PHASES.map(ph => {
      const isCur = ph.id === cur;
      return `${isCur ? '▸ ' : '  '}P${ph.id} ${ph.icon} ${ph.name}${isCur ? ' ← 当前' : ''}`;
    }).join('\n');
    detail += `\n\n核心: ${cc.emoji} ${cc.name}`;
    detail += `\n供能上限: ${cc.maxCollectors} 台碳源采集器`;
    if (cur < 5) {
      const nextP = PHASES[cur];
      detail += `\n\n下一阶段: P${nextP.id} ${nextP.icon} ${nextP.name}`;
    }
    return {
      title: `${p.icon} 阶段 ${p.id}: ${p.name}`,
      tag: `P${cur} / 共5阶段`,
      desc: p.desc,
      detail: detail,
      color: typeof p.color === 'string' && p.color.startsWith('var(') ? '#22d3ee' : p.color
    };
  }

  // #phaseBadge
  const badge = document.getElementById('phaseBadge');
  if (badge) {
    badge.style.cursor = 'help';
    badge.addEventListener('mouseenter', () => {
      GameTooltip.showRaw(buildPhaseTooltip(), badge.getBoundingClientRect());
    });
    badge.addEventListener('mouseleave', () => GameTooltip.hide());
  }

  // #corePhaseTag
  const coreTag = document.getElementById('corePhaseTag');
  if (coreTag) {
    coreTag.style.cursor = 'help';
    coreTag.addEventListener('mouseenter', () => {
      GameTooltip.showRaw(buildPhaseTooltip(), coreTag.getBoundingClientRect());
    });
    coreTag.addEventListener('mouseleave', () => GameTooltip.hide());
  }
})();

// ===== 传送带按钮 hover tooltip =====
(() => {
  const beltBtn = document.getElementById('beltConnectBtn');
  if (!beltBtn) return;
  let _beltBtnTooltipActive = false;

  beltBtn.addEventListener('mouseenter', (e) => {
    const tt = document.getElementById('tooltip');
    if (!tt) return;

    // 统计当前传送带信息
    const belts = G.belts || [];
    const beltCount = belts.length;
    const manualCount = Object.keys(G.manualBelts || {}).length;

    // 计算平均效率
    let avgEff = 75;
    if (beltCount > 0) {
      let totalEff = 0;
      belts.forEach(belt => {
        const key = Math.min(belt.fi, belt.ti) + '-' + Math.max(belt.fi, belt.ti);
        totalEff += G.getBeltEfficiency(key) * 100;
      });
      avgEff = Math.round(totalEff / beltCount);
    }
    const effColor = avgEff >= 100 ? 'var(--cyan)' : avgEff >= 70 ? 'var(--yellow)' : 'var(--orange)';

    document.getElementById('ttName').innerHTML = '🔗 传送带系统';
    document.getElementById('ttDesc').innerHTML =
      `<span style="color:#8aa0c0">连接两个建筑，建立资源传输通道</span>` +
      (beltCount > 0
        ? `<br><span style="color:var(--dim)">当前传送带: <span style="color:var(--bright)">${beltCount}条</span></span>` +
          `<br><span style="color:var(--dim)">平均效率: <span style="color:${effColor}">${avgEff}%</span></span>`
        : `<br><span style="color:var(--dim)">当前暂无传送带</span>`) +
      `<br>` +
      `<br><span style="color:#f97316;font-weight:700">⚡ 效率提示</span>` +
      `<br><span style="color:#22c55e">📍 建筑放得越近，传送带越短</span>` +
      `<br><span style="color:#22c55e">&nbsp;&nbsp;&nbsp;→ 资源传输更快更稳定！</span>` +
      `<br>` +
      `<br><span style="color:#7a9aba;font-size:0.9em">📊 等级效率: Lv1=75% → Lv5=150%</span>` +
      `<br><span style="color:#7a9aba;font-size:0.9em">📦 等级容量: Lv1=2/s → Lv5=12/s</span>` +
      `<br><span style="color:var(--dim);font-size:0.85em">💡 升级传送带可大幅提升传输效率</span>`;

    tt.classList.add('show');
    tt.style.left = Math.min(e.clientX + 14, window.innerWidth - 280) + 'px';
    tt.style.top = Math.min(e.clientY + 14, window.innerHeight - 240) + 'px';
    _beltBtnTooltipActive = true;
  });

  beltBtn.addEventListener('mousemove', (e) => {
    if (!_beltBtnTooltipActive) return;
    const tt = document.getElementById('tooltip');
    if (tt) {
      tt.style.left = Math.min(e.clientX + 14, window.innerWidth - 280) + 'px';
      tt.style.top = Math.min(e.clientY + 14, window.innerHeight - 240) + 'px';
    }
  });

  beltBtn.addEventListener('mouseleave', () => {
    if (!_beltBtnTooltipActive) return;
    const tt = document.getElementById('tooltip');
    if (tt) tt.classList.remove('show');
    _beltBtnTooltipActive = false;
  });
})();
