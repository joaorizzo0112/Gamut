# 🎨 Gamut

**Gamut** é um desafio minimalista de percepção cromática e memória visual. O projeto é uma **Single File Application (SFA)** desenvolvida em Vanilla JavaScript, focada na manipulação do espaço de cores HSB (Hue, Saturation, Brightness) e em uma experiência de usuário fluida e responsiva.

---

## 🕹️ Modos de Jogo

O sistema oferece quatro modos distintos para testar diferentes competências de percepção visual:

* **Normal**: 5 cores vibrantes com 3.5 segundos para memorização.
* **Sombra (Hard)**: Foca em cores de baixa saturação e tons escuros, com apenas 2 segundos de visualização.
* **Às Cegas (Blind)**: O usuário deve ajustar os valores HSB sem ver a prévia da cor resultante.
* **Inverso**: Desafio de lógica onde o jogador deve identificar qual amostra visual corresponde aos valores numéricos fornecidos.

## 🛠️ Detalhes Técnicos

Como entusiasta de lógica de programação e interfaces limpas, implementei os seguintes recursos:

### Algoritmo de Pontuação (Scoring)
A precisão não é uma média linear simples. O cálculo utiliza uma **ponderação vetorial** baseada na percepção humana:
* **Matiz (H)**: Responsável por 60% do peso do erro, com tratamento circular (garantindo que a distância entre 359° e 1° seja de apenas 2°).
* **Saturação (S)**: 25% do peso do erro.
* **Brilho (B)**: 15% do peso do erro.

### Engenharia de Software
* **Vanilla Stack**: 100% construído com HTML5, CSS3 e JavaScript puro, sem dependências externas ou frameworks.
* **UX Acessível**: Navegação completa via teclado, com suporte a `Shift` para ajustes rápidos ($\pm 10$) e `Tab` para alternância de foco entre os eixos.
* **Persistência**: Sistema de histórico local via `localStorage` para monitoramento de progresso das últimas 10 partidas.

## 👨‍💻 Desenvolvedor

*Estudante de Ciência da Computação (UNIFACS) e desenvolvedor Full-Stack.*
