// Efeitos sonoros e música sintetizados com Web Audio, sem arquivos externos.
const THROTTLE = {
  hit: 0.045, gem: 0.03, shoot: 0.06, knife: 0.05, enemyshot: 0.09, coin: 0.05, explode: 0.07, zap: 0.06, slash: 0.08,
};

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

// Progressão sombria: Lá menor, Fá, Ré menor, Mi maior.
const CHORDS = [
  [57, 60, 64],
  [53, 57, 60],
  [50, 53, 57],
  [52, 56, 59],
];
const ARP = [0, 1, 2, 1, 0, 2, 1, 2];

export class Sound {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this.last = {};
    this.wantMusic = false;
    this.musicTimer = null;
  }

  unlock() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        const c = this.ctx;
        this.master = c.createGain();
        this.master.gain.value = 0.55;
        this.master.connect(c.destination);
        this.sfx = c.createGain();
        this.sfx.gain.value = this.settings.sfx ? 1 : 0;
        this.sfx.connect(this.master);
        this.mus = c.createGain();
        this.mus.gain.value = this.settings.music ? 0.32 : 0;
        this.mus.connect(this.master);
        const buf = c.createBuffer(1, c.sampleRate, c.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      } catch {
        this.ctx = null;
        return;
      }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.wantMusic && !this.musicTimer) this.startMusic();
  }

  setSfx(on) {
    this.settings.sfx = on;
    if (this.sfx) this.sfx.gain.value = on ? 1 : 0;
  }

  setMusic(on) {
    this.settings.music = on;
    if (this.mus) this.mus.gain.value = on ? 0.32 : 0;
  }

  tone(type, f0, f1, dur, vol, delay = 0, dest = this.sfx) {
    const c = this.ctx;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  noise(dur, vol, freq = 2000, type = 'lowpass', delay = 0, f1 = 0, dest = this.sfx) {
    const c = this.ctx;
    const t = c.currentTime + delay;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f);
    f.connect(g);
    g.connect(dest);
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.03);
  }

  play(name, p = 0) {
    if (!this.ctx || !this.settings.sfx) return;
    const now = this.ctx.currentTime;
    const th = THROTTLE[name] ?? 0.03;
    if (now - (this.last[name] ?? -1) < th) return;
    this.last[name] = now;
    switch (name) {
      case 'shoot': this.tone('square', 880, 440, 0.07, 0.035); break;
      case 'knife': this.tone('triangle', 1500, 700, 0.06, 0.05); break;
      case 'slash': this.noise(0.13, 0.12, 3500, 'bandpass', 0, 700); break;
      case 'fire': this.tone('sawtooth', 240, 110, 0.18, 0.04); this.noise(0.15, 0.05, 900); break;
      case 'explode': this.noise(0.35, 0.2, 1400, 'lowpass', 0, 120); this.tone('sine', 130, 40, 0.3, 0.14); break;
      case 'zap': this.tone('sawtooth', 1900, 180, 0.16, 0.05); this.noise(0.12, 0.08, 5000, 'highpass'); break;
      case 'frost': this.tone('sine', 1100, 2600, 0.25, 0.05); this.noise(0.3, 0.05, 6000, 'highpass'); break;
      case 'orbs': this.tone('sine', 300, 600, 0.2, 0.05); break;
      case 'boomerang': this.noise(0.18, 0.06, 1200, 'bandpass', 0, 2400); break;
      case 'hit': this.noise(0.045, 0.05, 2600, 'bandpass'); break;
      case 'gem': this.tone('sine', p, p * 1.5, 0.08, 0.05); break;
      case 'coin': this.tone('square', 1320, 0, 0.05, 0.03); this.tone('square', 1760, 0, 0.09, 0.03, 0.05); break;
      case 'heal': this.tone('sine', 500, 1000, 0.25, 0.08); this.tone('sine', 750, 1500, 0.25, 0.05, 0.08); break;
      case 'hurt': this.tone('square', 240, 70, 0.2, 0.08); this.noise(0.12, 0.08, 900); break;
      case 'levelup':
        [523, 659, 784, 1047].forEach((f, i) => this.tone('triangle', f, 0, 0.18, 0.08, i * 0.07));
        break;
      case 'chest':
        [392, 523, 659, 784, 1047, 1319].forEach((f, i) => this.tone('triangle', f, 0, 0.22, 0.07, i * 0.08));
        this.noise(0.6, 0.04, 8000, 'highpass', 0.3);
        break;
      case 'evolve':
        [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) => this.tone('sawtooth', f, 0, 0.25, 0.04, i * 0.06));
        break;
      case 'select': this.tone('triangle', 660, 990, 0.07, 0.06); break;
      case 'move': this.tone('sine', 520, 0, 0.035, 0.03); break;
      case 'deny': this.tone('square', 180, 120, 0.15, 0.05); break;
      case 'boss':
        this.tone('sawtooth', 82, 55, 1.4, 0.1);
        this.tone('sawtooth', 87, 58, 1.4, 0.08);
        this.noise(1.2, 0.08, 300, 'lowpass');
        break;
      case 'bossdie':
        this.noise(1.0, 0.25, 2000, 'lowpass', 0, 60);
        this.tone('sawtooth', 300, 40, 1.0, 0.1);
        break;
      case 'death':
        [392, 330, 262, 196].forEach((f, i) => this.tone('triangle', f, f * 0.9, 0.35, 0.09, i * 0.2));
        break;
      case 'victory':
        [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone('triangle', f, 0, 0.3, 0.08, i * 0.12));
        break;
      case 'enemyshot': this.tone('sine', 520, 260, 0.1, 0.025); break;
      case 'holy': this.noise(0.8, 0.15, 8000, 'highpass', 0, 1000); [523, 659, 784].forEach((f) => this.tone('sine', f, 0, 0.8, 0.06)); break;
      case 'dash': this.noise(0.4, 0.12, 400, 'bandpass', 0, 3000); break;
      case 'break': this.noise(0.15, 0.1, 1600, 'bandpass'); break;
      case 'swarm': this.noise(0.8, 0.06, 600, 'bandpass', 0, 1800); break;
      default: break;
    }
  }

  startMusic() {
    this.wantMusic = true;
    if (!this.ctx || this.musicTimer) return;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.musicTimer = setInterval(() => this.schedule(), 60);
  }

  stopMusic() {
    this.wantMusic = false;
    clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  schedule() {
    const c = this.ctx;
    const stepDur = 60 / 124 / 2;
    while (this.nextTime < c.currentTime + 0.25) {
      this.playStep(this.step, this.nextTime - c.currentTime);
      this.nextTime += stepDur;
      this.step++;
    }
  }

  playStep(s, delay) {
    if (!this.settings.music) return;
    const ch = CHORDS[Math.floor(s / 16) % 4];
    const pos = s % 16;
    if (pos % 4 === 0) this.tone('triangle', midi(ch[0] - 12), 0, 0.42, 0.16, delay, this.mus);
    if (pos % 4 === 2) this.tone('triangle', midi(ch[0]), 0, 0.2, 0.08, delay, this.mus);
    this.tone('square', midi(ch[ARP[pos % 8]] + 12), 0, 0.13, 0.022, delay, this.mus);
    if (pos === 0 || pos === 8) this.tone('sine', 110, 40, 0.18, 0.2, delay, this.mus);
    if (pos % 2 === 1) this.noise(0.03, 0.025, 7000, 'highpass', delay, 0, this.mus);
    if (pos === 4 || pos === 12) this.noise(0.12, 0.05, 1800, 'bandpass', delay, 0, this.mus);
  }
}
