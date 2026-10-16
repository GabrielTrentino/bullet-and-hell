// Itens passivos. Cada nível soma `per` ao atributo `stat` do jogador.
export const PASSIVES = {
  might: { name: 'Espinho Rubro', desc: '+10% de dano.', stat: 'might', per: 0.1, max: 5 },
  cooldown: { name: 'Tomo Vazio', desc: 'As armas recarregam 8% mais rápido.', stat: 'cooldown', per: -0.08, max: 5 },
  area: { name: 'Vela Eterna', desc: '+10% de área de ataque.', stat: 'area', per: 0.1, max: 5 },
  speed: { name: 'Botas Aladas', desc: '+10% de velocidade de movimento.', stat: 'speed', per: 0.1, max: 5 },
  maxHp: { name: 'Coração Vivo', desc: '+20 de vida máxima.', stat: 'maxHp', per: 20, max: 5 },
  armor: { name: 'Armadura Rúnica', desc: 'Reduz em 1 todo dano recebido.', stat: 'armor', per: 1, max: 5 },
  magnet: { name: 'Ímã Antigo', desc: '+30% de alcance de coleta.', stat: 'magnet', per: 0.3, max: 5 },
  duration: { name: 'Ampulheta', desc: 'Efeitos das armas duram 12% mais.', stat: 'duration', per: 0.12, max: 5 },
  luck: { name: 'Trevo de Prata', desc: '+4% de chance de acerto crítico (dano dobrado).', stat: 'luck', per: 0.04, max: 5 },
  amount: { name: 'Duplicador', desc: '+1 projétil em todas as armas.', stat: 'amount', per: 1, max: 2 },
  regen: { name: 'Seiva da Vida', desc: 'Regenera 0,3 de vida por segundo.', stat: 'regen', per: 0.3, max: 5 },
  growth: { name: 'Coroa do Sábio', desc: '+10% de experiência ganha.', stat: 'growth', per: 0.1, max: 5 },
};
