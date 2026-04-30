# 🎲 Projeto: Roguelite de Dados (Web)

## 📌 Visão Geral

Um jogo web desenvolvido com React e JavaScript baseado em:

* Combate por turnos
* Sistema de dados (RNG)
* Progressão estilo roguelite por fases
* Escolhas estratégicas (perks/upgrades)

O foco do jogo é **decisão + risco + progressão**, com alta rejogabilidade.

---

## 🎮 Loop Principal do Jogo

1. Jogador entra em uma fase
2. Enfrenta um evento:

   * Combate ⚔️
   * Baú 🎁
   * Evento aleatório ❓
3. Resolve o evento
4. Ganha recompensas:

   * XP
   * chance de item
5. Sobe de nível (quando possível)
6. Escolhe upgrade (perk)
7. Avança para próxima fase
8. A cada 5 fases → Boss

---

## 🗺️ Estrutura de Fases

* Fase 1–4 → encontros normais
* Fase 5 → Boss / Mini Boss
* Loop contínuo até morrer

*(futuro: escalar dificuldade por ciclo)*

---

## ⚔️ Sistema de Combate

### 🔹 Ações do jogador:

* ⚔️ Atacar
* 🛡️ Defender
* ❤️ Usar item

### 🔹 Estrutura do turno:

1. Jogador escolhe ação
2. Dado é rolado 🎲
3. Ação é resolvida
4. Inimigos atacam
5. Aplica dano/efeitos

---

## 🎲 Sistema de Dados

Dado padrão: **d6 (1 a 6)**

| Resultado | Efeito        |
| --------- | ------------- |
| 1         | Falha crítica |
| 2–3       | Fraco         |
| 4–5       | Normal        |
| 6         | Crítico       |

---

## 👾 Inimigos

* Tipos simples no início
* Cada inimigo:

  * HP
  * Dano base
  * XP concedido

### Exemplo:

* Zumbi fraco → 1 XP
* Zumbi forte → 2 XP

---

## 📈 Sistema de XP e Level

* Jogador ganha XP ao derrotar inimigos
* Ao atingir limite → sobe de nível

### 🔹 Ao subir de nível:

Escolhe 1 entre 3 upgrades (perks)

---

## 🧩 Sistema de Perks (Upgrades)

Perks são melhorias permanentes na run.

### 🔹 Estrutura:

* Nome
* Nível
* Efeito escalável

### 🔹 Exemplo:

**Dano**

* Nível 1 → +1
* Nível 2 → +2
* Nível 3 → +3

*(não soma infinitamente, evolui o valor)*

---

### 🔹 Tipos de perks:

#### ⚔️ Dano

* Aumenta dano base

#### 🛡️ Defesa

* Reduz dano recebido

#### 💨 Agilidade

* Chance de esquiva

#### ❤️ Vida Máxima

* Aumenta HP total

#### 🎲 Sorte

* Permite reroll ou melhora resultados

---

## 🎁 Sistema de Itens

Itens simples e estratégicos:

* Poção de cura ❤️
* Poção de defesa 🛡️
* Reroll 🎲

### 🔹 Uso:

* Consumíveis
* Usados na ação "Agir"

---

## 🎯 Balanceamento (IMPORTANTE)

* Evitar números absurdos
* Perks devem evoluir, não acumular infinito
* Dano máximo controlado
* HP de inimigos escala com progresso

---

## 🧠 Elementos Estratégicos

* Escolher entre atacar ou defender
* Gerenciar recursos (itens)
* Decidir upgrades
* Lidar com RNG (dados)

---

## 💾 Sistema de Save

Usando `localStorage`

### 🔹 Dados salvos:

* HP
* nível
* XP
* perks
* inventário
* fase atual

### Exemplo:

```json
{
  "hp": 20,
  "level": 2,
  "xp": 3,
  "perks": [
    { "name": "dano", "level": 2 }
  ],
  "inventory": ["poção"],
  "fase": 4
}
```

---

## 🧱 Estrutura Técnica

### 🔹 Frontend:

* React
* JavaScript
* CSS básico

### 🔹 Estado:

* useState / useReducer (sugestão)
* localStorage para persistência

---

## 🚀 Versão 1 (MVP)

### Deve conter:

* Sistema de combate funcional
* Dado (1d6)
* HP jogador + inimigo
* 1–2 tipos de inimigos
* Sistema de fases
* XP + level up
* Escolha de perks
* 1–2 itens
* Boss na fase 5
* Save com localStorage

---

## 🔮 Expansões Futuras

* Mais tipos de inimigos
* Eventos especiais
* Mais perks
* Sistema de raridade
* Múltiplos dados (d8, d20)
* Aliados
* Builds complexas
* UI mais avançada

---

## ⚠️ Regras de Ouro do Projeto

* Começar simples
* Fazer funcionar antes de expandir
* Priorizar jogabilidade > complexidade
* Evitar escopo gigante no início

---

## 🎯 Objetivo Final

Criar um jogo:

* simples de jogar
* difícil de dominar
* com alta rejogabilidade
* baseado em decisões e sorte

---

## 🧩 Próximo Passo

Implementar:

1. Sistema de combate básico
2. Rolagem de dado
3. HP e dano
4. Loop de fases simples

---
