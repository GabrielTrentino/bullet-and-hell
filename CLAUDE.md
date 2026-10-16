# CLAUDE.md

Bullet & Hell é um jogo de sobrevivência no estilo Vampire Survivors, em JavaScript puro (ES modules) e canvas 2D. Não há dependências, build nem arquivos de arte: sprites, ícones, cenário e áudio são gerados por código.

## Como rodar

Sirva a raiz com um servidor estático (`python -m http.server 8000`, `npx serve .` ou Live Server) e abra `index.html`. Módulos ES não carregam via `file://`.

No console do navegador, `window.__game` expõe a instância do jogo para depuração. Por exemplo: `__game.startRun('kael')` ou `__game.player.addXp(500)`.

## Estrutura

```
index.html            página, fontes (Cinzel, Rubik) e canvas
src/main.js           espera as fontes e roda o loop (requestAnimationFrame)
src/game.js           estado central: partida, câmera, combate, renderização do mundo
src/core/             utils (matemática, grade espacial), input (teclado/mouse/toque), audio (Web Audio), save (localStorage)
src/data/             TODO o conteúdo ajustável: heróis, armas, passivas, inimigos, ondas/eventos, loja
src/entities/         Player (atributos, XP, dano) e Enemy
src/systems/          weapons (comportamento de cada arma), projectiles (movimento e colisão),
                      ai (inimigos e chefes), spawner (ondas e eventos), upgrades (escolhas e baús), pickups
src/render/           sprites (desenho procedural e cache), icons, background, effects (partículas, textos, raios)
src/ui/ui.js          menus, HUD e telas (título, heróis, santuário, nível, baú, pausa, fim)
```

## Como estender

- **Novo inimigo:** adicione em `data/enemies.js` e desenhe em `ENEMY_ART` (`render/sprites.js`), olhando para a direita. Para outro comportamento, crie um `ai` em `systems/ai.js`. Depois inclua o inimigo em `pool` de alguma onda em `data/waves.js`.
- **Nova arma:** adicione os dados em `data/weapons.js` (base, `levels` com 7 incrementos e `evolution`), o comportamento em `BEHAVIORS` de `systems/weapons.js` e o ícone em `render/icons.js`.
- **Nova passiva:** adicione em `data/passives.js` (o `stat` deve existir em `BASE_STATS`, em `entities/player.js`) e um ícone com o mesmo id.
- **Novo herói:** adicione em `data/characters.js` e a aparência em `HERO_LOOKS` (`render/sprites.js`).

## Convenções

- Tempo sempre em segundos via `dt`, nunca contagem de frames. Ações atrasadas usam `G.schedule(delay, fn)`.
- Coordenadas de mundo em `x/y`. Desenhe com `G.blit(sprite, x, y, escala, espelhar, alfa, rotação)` ou chame `G.setWorld()` antes de primitivas.
- Brilhos usam `glow(cor)` (raio base 32) com `globalCompositeOperation = 'lighter'`. Sempre volte para `'source-over'`.
- Colisões contra inimigos passam pela grade espacial: `G.queryEnemies(x, y, r)`.
- A UI é em modo imediato: `ui.button(...)` desenha e retorna `true` quando ativado (clique, toque ou Enter).
- Texto do jogo em português; nomes técnicos (`update`, `render`, `fire`) em inglês.

## Equilíbrio

Os números ficam nos arquivos de `data/`. A vida dos inimigos escala com o tempo em `Spawner.hpMult()`, e a curva de experiência fica em `xpForLevel()`. Os chefes aparecem aos 4, 8, 11 e 13 minutos, e o Rei Lich aos 15. Derrotá-lo encerra a partida com vitória.
