const KEY = 'bullet-and-hell-save-v1';

const DEFAULT = {
  gold: 0,
  unlocked: { lyra: true, bram: true, aria: true },
  shop: {},
  best: { time: 0, kills: 0, level: 0 },
  runs: 0,
  wins: 0,
  settings: { sfx: true, music: true },
};

const fresh = () => JSON.parse(JSON.stringify(DEFAULT));

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const d = JSON.parse(raw);
    const base = fresh();
    return {
      ...base,
      ...d,
      unlocked: { ...base.unlocked, ...d.unlocked },
      shop: { ...d.shop },
      best: { ...base.best, ...d.best },
      settings: { ...base.settings, ...d.settings },
    };
  } catch {
    return fresh();
  }
}

export function writeSave(save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // armazenamento indisponível: o progresso vale só para esta sessão
  }
}
