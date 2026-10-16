// Melhorias permanentes compradas com ouro. Custo do próximo nível = cost × (nível atual + 1).
export const SHOP = [
  { id: 'might', name: 'Poder', desc: '+5% de dano', stat: 'might', per: 0.05, max: 5, cost: 120, icon: 'might' },
  { id: 'maxHp', name: 'Vitalidade', desc: '+10 de vida máxima', stat: 'maxHp', per: 10, max: 5, cost: 100, icon: 'maxHp' },
  { id: 'armor', name: 'Couraça', desc: '+1 de armadura', stat: 'armor', per: 1, max: 3, cost: 220, icon: 'armor' },
  { id: 'regen', name: 'Recuperação', desc: '+0,1 de vida por segundo', stat: 'regen', per: 0.1, max: 5, cost: 160, icon: 'regen' },
  { id: 'speed', name: 'Agilidade', desc: '+5% de velocidade', stat: 'speed', per: 0.05, max: 3, cost: 150, icon: 'speed' },
  { id: 'cooldown', name: 'Foco', desc: '−3% de recarga', stat: 'cooldown', per: -0.03, max: 3, cost: 250, icon: 'cooldown' },
  { id: 'area', name: 'Alcance', desc: '+5% de área', stat: 'area', per: 0.05, max: 3, cost: 180, icon: 'area' },
  { id: 'magnet', name: 'Atração', desc: '+15% de alcance de coleta', stat: 'magnet', per: 0.15, max: 3, cost: 80, icon: 'magnet' },
  { id: 'growth', name: 'Sabedoria', desc: '+5% de experiência', stat: 'growth', per: 0.05, max: 5, cost: 150, icon: 'growth' },
  { id: 'greed', name: 'Ganância', desc: '+10% de ouro', stat: 'greed', per: 0.1, max: 5, cost: 100, icon: 'greed' },
];
