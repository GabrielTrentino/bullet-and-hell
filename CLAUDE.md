# CLAUDE.md

Jogo estilo Vampire Survivors: o jogador se move com WASD ou setas, as armas disparam automaticamente, inimigos chegam em ondas cada vez maiores, e as gemas de XP dão subidas de nível.

## Como rodar

Não há build. Abra `index.html` com um servidor estático, por exemplo:

```
python3 -m http.server 8000
```

e acesse http://localhost:8000. Módulos ES não funcionam com `file://` em alguns navegadores, então use o servidor.

## Estrutura

- `index.html`: página e canvas.
- `src/main.js`: loop principal (requestAnimationFrame e delta time).
- `src/game.js`: estado do jogo, spawns, colisões e renderização.
- `src/player.js`: jogador, vida, XP e níveis.
- `src/enemies.js`: tipos de inimigo (tabela `ENEMY_TYPES`) e spawn.
- `src/weapons.js`: armas como dados (`WEAPON_DEFS`) e comportamentos de disparo.
- `src/xp.js`: gemas de experiência.
- `src/hud.js`: interface.
- `src/input.js`: teclado.
- `src/utils.js`: funções auxiliares.

## Convenções

- JavaScript ES modules, sem dependências externas por enquanto.
- Novos inimigos e armas entram como entradas nas tabelas `ENEMY_TYPES` e `WEAPON_DEFS`, sem alterar a lógica geral.
- Tempo sempre em segundos, usando `dt` do loop. Nada de contagem por frame.
- Coordenadas do mundo ficam em `x`/`y`. A câmera é aplicada com `translate` no render.
- Comentários e nomes de domínio em português; nomes técnicos (`update`, `render`) em inglês.

## Próximos passos sugeridos

1. Tela de escolha de melhorias ao subir de nível (estado `levelup` já existe).
2. Mais armas com níveis (ex.: faca, bola de fogo, área ao redor).
3. Mapa infinito com fundo em tiles e sprites reais.
4. Sons e efeitos visuais de dano.
