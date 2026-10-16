# Bullet & Hell

Jogo de sobrevivência com armas automáticas, inspirado em Vampire Survivors. Sobreviva 15 minutos a uma horda de mortos-vivos e derrote o Rei Lich ao amanhecer.

Tudo roda no navegador, em JavaScript puro e canvas, sem dependências nem build. Sprites, ícones, cenário, efeitos sonoros e música são gerados por código.

## Como rodar

Sirva a pasta com qualquer servidor estático e abra no navegador:

- **VS Code ou Cursor:** instale a extensão *Live Server*, clique com o botão direito em `index.html` e escolha **Open with Live Server**.
- **Python:** `python -m http.server 8000` (no Windows, `py -m http.server 8000`) e acesse http://localhost:8000.
- **Node:** `npx serve .`

Abrir o `index.html` direto pelo explorador de arquivos não funciona, porque os navegadores bloqueiam módulos JavaScript em `file://`.

## Controles

| Ação | Teclado | Toque |
| --- | --- | --- |
| Mover | WASD ou setas | Arraste em qualquer lugar da tela |
| Escolher melhoria | 1–4, ou setas + Enter | Toque no cartão |
| Pausar | Esc ou P | Botão II |
| Ligar/desligar som | M | Menu de pausa |

As armas atacam sozinhas.

## Conteúdo

- **6 heróis**, cada um com arma inicial e bônus próprios: Lyra (maga), Bram (paladino), Aria (caçadora), Kael (piromante), Nyx (necromante) e Volt (tempestuoso). Os três últimos são desbloqueados com ouro.
- **9 armas**, com 8 níveis cada: Varinha Mágica, Adagas, Lâmina Crescente, Bola de Fogo, Orbes Sombrios, Aura Sagrada, Relâmpago, Foice Bumerangue e Nova Glacial.
- **9 evoluções**: com a arma no nível máximo e a passiva certa, ela evolui (por exemplo, Bola de Fogo + Vela Eterna vira Chuva de Meteoros).
- **12 itens passivos**, como dano, área, recarga, velocidade, vida, armadura, ímã, sorte e projéteis extras.
- **9 tipos de inimigo**, entre eles morcegos, esqueletos, carniçais, espectros, gosmas que se dividem, olhos que atiram, diabretes e ogros. Há também versões de elite que deixam baús.
- **3 chefes com padrões de projéteis**: O Ceifador (investidas e anéis de foices), Lorde Demônio (anéis de fogo e espirais) e O Rei Lich, o chefe final, com espirais, rajadas, teletransporte e invocações.
- **Eventos**: enxames que cruzam a tela e cercos que fecham ao seu redor.
- **Coletáveis**: gemas de experiência, moedas, poções, ímã, pergaminho sagrado (limpa a tela) e baús. Braseiros espalhados pelo mapa guardam itens.
- **Santuário**: 10 melhorias permanentes compradas com o ouro ganho nas partidas. O progresso é salvo no navegador.

### Evoluções

| Arma | Passiva necessária | Evolução |
| --- | --- | --- |
| Varinha Mágica | Tomo Vazio | Cajado do Arquimago |
| Adagas | Botas Aladas | Tempestade de Lâminas |
| Lâmina Crescente | Coração Vivo | Ceifadora Carmesim |
| Bola de Fogo | Vela Eterna | Chuva de Meteoros |
| Orbes Sombrios | Ampulheta | Eclipse Eterno |
| Aura Sagrada | Armadura Rúnica | Santuário |
| Relâmpago | Trevo de Prata | Fúria da Tempestade |
| Foice Bumerangue | Espinho Rubro | Lua Sangrenta |
| Nova Glacial | Seiva da Vida | Zero Absoluto |

Veja [CLAUDE.md](CLAUDE.md) para a arquitetura e as convenções do código.
