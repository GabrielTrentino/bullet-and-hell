import { rand, TAU } from '../core/utils.js';

// Comportamento de cada inimigo por frame. Define velocidade desejada, depois aplica lentidão e empurrão.
export function updateEnemyAI(e, G, dt) {
  const P = G.player;
  e.anim += dt * (e.def.anim || 6);
  e.t += dt;
  if (e.flash > 0) e.flash -= dt;
  if (e.spawnT > 0) e.spawnT -= dt;
  if (e.slow > 0) {
    e.slow -= dt;
    if (e.slow <= 0) e.slowAmt = 0;
  }
  const sm = 1 - (e.boss ? e.slowAmt * 0.4 : e.slowAmt);
  const dx = P.x - e.x;
  const dy = P.y - e.y;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  let vx = 0;
  let vy = 0;

  switch (e.ai) {
    case 'bat': {
      const w = Math.sin(e.t * 4 + e.phase) * 0.9;
      const c = Math.cos(w);
      const s = Math.sin(w);
      vx = (ux * c - uy * s) * e.speed;
      vy = (ux * s + uy * c) * e.speed;
      break;
    }
    case 'ghost': {
      const sp = e.speed * (d > 320 ? 1.5 : 1);
      vx = ux * sp;
      vy = uy * sp;
      break;
    }
    case 'ranged':
      if (d > 290) {
        vx = ux * e.speed;
        vy = uy * e.speed;
      } else if (d < 200) {
        vx = -ux * e.speed;
        vy = -uy * e.speed;
      } else {
        vx = -uy * e.speed * 0.6 * e.dirSign;
        vy = ux * e.speed * 0.6 * e.dirSign;
      }
      e.cd -= dt;
      if (e.cd <= 0 && d < 520) {
        e.cd = e.def.shoot.cd * rand(0.8, 1.2);
        G.spawnBullet(e.x, e.y, Math.atan2(dy, dx), e.def.shoot.speed, e.damage, { color: '#e879f9' });
        G.sound.play('enemyshot');
      }
      break;
    case 'swarm':
      vx = e.dirx * e.speed;
      vy = e.diry * e.speed;
      e.life -= dt;
      if (e.life <= 0) {
        e.alive = false;
        return;
      }
      break;
    case 'reaper':
      ({ vx, vy } = reaper(e, G, dt, ux, uy));
      break;
    case 'demon':
      ({ vx, vy } = demon(e, G, dt, ux, uy, dx, dy));
      break;
    case 'lich':
      ({ vx, vy } = lich(e, G, dt, ux, uy, d, dx, dy));
      break;
    default:
      vx = ux * e.speed;
      vy = uy * e.speed;
  }

  vx *= sm;
  vy *= sm;
  e.x += (vx + e.kbx) * dt;
  e.y += (vy + e.kby) * dt;
  const decay = Math.min(1, dt * 9);
  e.kbx -= e.kbx * decay;
  e.kby -= e.kby * decay;
  if (Math.abs(vx) > 3) e.face = vx > 0 ? 1 : -1;

  // inimigos muito longe reaparecem à frente do jogador
  if (!e.boss && e.ai !== 'swarm' && d > G.despawnR) {
    const a = Math.atan2(P.facing.y, P.facing.x) + rand(-1, 1);
    const R = G.viewRadius() + rand(40, 120);
    e.x = P.x + Math.cos(a) * R;
    e.y = P.y + Math.sin(a) * R;
  }
}

function ring(G, e, n, speed, dmg, color, offset = 0, r = 7) {
  for (let i = 0; i < n; i++) G.spawnBullet(e.x, e.y, offset + (i / n) * TAU, speed, dmg, { color, r });
}

function summon(G, e, type, n, radius) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    G.spawnEnemy(type, e.x + Math.cos(a) * radius, e.y + Math.sin(a) * radius, { hpMult: G.spawner.hpMult() });
  }
  G.fx.ring(e.x, e.y, 10, radius, 0.5, e.def.blood, 5);
}

function reaper(e, G, dt, ux, uy) {
  const st = e.state;
  st.dashCd ??= 3;
  st.summonCd ??= 6;
  st.ringCd ??= 4;
  let vx = ux * e.speed;
  let vy = uy * e.speed;
  if (st.dashing > 0) {
    st.dashing -= dt;
    vx = st.dx * e.speed * 5;
    vy = st.dy * e.speed * 5;
    G.fx.burst(e.x, e.y, '#6366f1', 1, 30, 0.5, 6);
  } else if (st.windup > 0) {
    st.windup -= dt;
    vx = 0;
    vy = 0;
    st.dx = ux;
    st.dy = uy;
    if (st.windup <= 0) {
      st.dashing = 0.55;
      G.sound.play('dash');
    }
  } else {
    st.dashCd -= dt;
    if (st.dashCd <= 0) {
      st.dashCd = rand(3, 4.5);
      st.windup = 0.7;
    }
  }
  st.summonCd -= dt;
  if (st.summonCd <= 0) {
    st.summonCd = 9;
    summon(G, e, 'bat', 8, 70);
  }
  st.ringCd -= dt;
  if (st.ringCd <= 0) {
    st.ringCd = e.hp < e.maxHp * 0.5 ? 3.5 : 5;
    ring(G, e, 14, 150, 12, '#818cf8', e.t);
    G.sound.play('enemyshot');
  }
  return { vx, vy };
}

function demon(e, G, dt, ux, uy, dx, dy) {
  const st = e.state;
  const enraged = e.hp < e.maxHp * 0.5;
  st.ringCd ??= 2.5;
  st.aimCd ??= 4;
  st.spiral ??= 0;
  st.ringCd -= dt;
  if (st.ringCd <= 0) {
    st.ringCd = enraged ? 2 : 3;
    ring(G, e, enraged ? 24 : 16, 140, 14, '#f97316', Math.random() * TAU, 8);
    G.fx.ring(e.x, e.y, 10, 90, 0.4, '#f97316', 6);
    G.sound.play('explode');
  }
  st.aimCd -= dt;
  if (st.aimCd <= 0) {
    st.aimCd = 3.5;
    const a = Math.atan2(dy, dx);
    for (let k = -2; k <= 2; k++) G.spawnBullet(e.x, e.y, a + k * 0.18, 230, 14, { color: '#fbbf24', r: 6 });
  }
  if (enraged) {
    st.spinCd = (st.spinCd ?? 0) - dt;
    if (st.spinCd <= 0) {
      st.spinCd = 0.14;
      st.spiral += 0.37;
      G.spawnBullet(e.x, e.y, st.spiral, 120, 12, { color: '#ef4444', r: 6 });
      G.spawnBullet(e.x, e.y, st.spiral + Math.PI, 120, 12, { color: '#ef4444', r: 6 });
    }
  }
  return { vx: ux * e.speed, vy: uy * e.speed };
}

function lich(e, G, dt, ux, uy, d, dx, dy) {
  const st = e.state;
  let vx;
  let vy;
  if (d > 330) {
    vx = ux * e.speed;
    vy = uy * e.speed;
  } else if (d < 240) {
    vx = -ux * e.speed * 0.7;
    vy = -uy * e.speed * 0.7;
  } else {
    vx = -uy * e.speed * 0.5;
    vy = ux * e.speed * 0.5;
  }
  st.phaseT = (st.phaseT ?? 0) + dt;
  const phase = Math.floor(st.phaseT / 3.2) % 3;
  if (phase !== st.lastPhase) {
    st.lastPhase = phase;
    if (phase === 2) {
      // teleporte e invocação
      G.fx.burst(e.x, e.y, '#4ade80', 30, 200, 0.6, 4, { add: true });
      const a = Math.random() * TAU;
      e.x = G.player.x + Math.cos(a) * 300;
      e.y = G.player.y + Math.sin(a) * 300;
      G.fx.burst(e.x, e.y, '#4ade80', 30, 200, 0.6, 4, { add: true });
      summon(G, e, 'skeleton', 10, 90);
      G.sound.play('dash');
    }
  }
  if (phase === 0) {
    st.spiralCd = (st.spiralCd ?? 0) - dt;
    if (st.spiralCd <= 0) {
      st.spiralCd = 0.09;
      st.spin = (st.spin || 0) + 0.29;
      for (let k = 0; k < 3; k++) G.spawnBullet(e.x, e.y, st.spin + (k * TAU) / 3, 150, 16, { color: '#4ade80', r: 7 });
    }
  } else if (phase === 1) {
    st.burstCd = (st.burstCd ?? 0) - dt;
    if (st.burstCd <= 0) {
      st.burstCd = 0.7;
      const a = Math.atan2(dy, dx);
      for (let k = -3; k <= 3; k++) G.spawnBullet(e.x, e.y, a + k * 0.12, 250, 16, { color: '#a3e635', r: 6 });
      G.sound.play('enemyshot');
    }
  }
  if (e.hp < e.maxHp * 0.5) {
    st.ringCd = (st.ringCd ?? 2.5) - dt;
    if (st.ringCd <= 0) {
      st.ringCd = 2.5;
      ring(G, e, 20, 130, 14, '#86efac', Math.random() * TAU);
    }
  }
  return { vx, vy };
}
