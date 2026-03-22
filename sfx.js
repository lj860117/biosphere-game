// ===== AUDIO ENGINE — Web Audio API 合成音效 + 程序化背景音乐 =====
// 拆分自 game.js — 完全独立，无外部依赖
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

    // 游戏启动 — 品牌Jingle：低鸣→生命脉冲→上行琶音→品牌和弦
    boot() {
      if (!sfxOn) return;
      // Phase 1: 低鸣 — 休眠微生物 (0~0.8s)
      playTone(80, 0.8, 'sine', 0.06);
      playTone(120, 0.6, 'sine', 0.04, 0, 0.1);
      // Phase 2: 生命脉冲 — 心跳 (0.8~1.6s)
      playTone(150, 0.12, 'sine', 0.10, 0, 0.8);
      playTone(150, 0.10, 'sine', 0.07, 0, 1.1);
      playNoise(0.08, 0.03, 'highpass', 4000, 0.85);
      playNoise(0.06, 0.02, 'highpass', 4000, 1.15);
      // Phase 3: 上行琶音 — 觉醒 C4→E4→G4→C5 (1.6~2.8s)
      playTone(262, 0.25, 'sine', 0.10, 0, 1.6);
      playTone(330, 0.25, 'sine', 0.10, 0, 1.9);
      playTone(392, 0.25, 'sine', 0.12, 0, 2.2);
      playTone(523, 0.35, 'sine', 0.14, 0, 2.5);
      // Phase 4: 品牌和弦 — C5+E5+G5 持续 (2.8~3.5s)
      playTone(523, 0.7, 'sine', 0.08, 0, 2.8);
      playTone(659, 0.7, 'triangle', 0.06, 0, 2.8);
      playTone(784, 0.7, 'triangle', 0.05, 0, 2.85);
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
    if (bgmOn && bgmNodes) crossfadeBGM(phase);
  }

  // 品牌BGM交叉淡入淡出 — 1.5s渐出 + 0.5s重叠 + 1s渐入
  function crossfadeBGM(newPhase) {
    if (!bgmNodes) { startBGM(newPhase); return; }
    const ctx = getCtx();
    if (!ctx) { stopBGM(); startBGM(newPhase); return; }
    // 渐出当前BGM
    const fadeGain = ctx.createGain();
    fadeGain.gain.setValueAtTime(1, ctx.currentTime);
    fadeGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
    // 1s后开始新BGM（0.5s重叠）
    setTimeout(() => {
      stopBGM();
      startBGM(newPhase);
    }, 1000);
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
