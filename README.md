# Stickers2 Simulator

Статическая страничка для балансировки stickers2 (season_collections2): моделирует по календарю «идеального игрока» (играет каждый день, закрывает все миссии, занимает выбранное место в соревнованиях) и показывает, сколько паков/карт/новых стикеров/дубликатов он получит за 1–3 месяца, когда закроет коллекции и книгу.

Открывается двойным кликом по `index.html` — зависимостей и сборки нет.

## Что внутри

- `index.html` — всё приложение одним файлом (движок симуляции + UI + графики).
- `config.default.json` — дефолтный конфиг наград, сгенерированный из кода игры (тот же конфиг зашит в `index.html` как `DEFAULT_CONFIG`). Его можно править и загружать на страницу кнопкой «Загрузить JSON…».

Механика открытия пака — точный порт `StickersBook2.givePrize` из `features/src/season_collections2/stickersbook.js`: общий пул по 15 коллекциям, roll по рарности с нормализацией на непустые бакеты, `guaranteedNew` (Red), `firstCardMinRarity` + pity (Violet), дубликаты → очки `min(rarity+1, 5)`.

## Формат конфига (JSON)

```jsonc
{
    "rarities": {
        "names": ["1★", "2★", "3★", "4★", "5★", "Gold"],
        "dropProbabilities": [0.3435, 0.2623, 0.1756, 0.1062, 0.0625, 0.05],  // общее распределение рарностей
        "duplicatePoints": [1, 2, 3, 4, 5, 5]                                 // очки за дубликат по рарности
    },
    "collections": [[8, 1, 0, 0, 0, 0], ...],   // 15 строк: сколько стикеров каждой рарности в коллекции
    "season": { "months": 2, "canRestart": true },
    "pity": { "startCounter": 2, "chancePerStep": 0.3333 },
    "packs": {
        "Violet": {
            "amount": 6,                  // карт в паке
            "firstCardMinRarity": 2,      // первая карта не ниже этой рарности
            "pity": true,                 // участвует в pity-счётчике
            "guaranteedNew": false,       // последняя карта — гарантированно новая максимальной рарности
            "probabilities": [ ... ]      // опционально: пер-паковое распределение вместо общего
        }
    },
    "sources": [
        // каждая запись: id, name, schedule, паки
        { "id": "kingscup", "schedule": { "type": "weekday", "window": "MON-FRI" },
          "packsByPlace": [["Red"], ["Violet"], ["Blue"]] },              // по месту в соревновании
        { "id": "tsearch", "schedule": { "type": "weekday", "window": "MON-FRI" },
          "packs": ["Brown", "Brown", "Green", "Blue", "Violet"] },       // стейджи, равномерно по окну
        { "id": "weeklygoals", "schedule": { "type": "weekly" },
          "packsByDay": [["Brown", "Brown"], ...] },                      // 7 массивов, пн..вс
        { "id": "island_decoration", "schedule": { "type": "monthly", "fromDay": 1, "toDay": 20 }, "packs": [...] },
        { "id": "softfeast", "schedule": { "type": "rotation", "slot": "primary", "duration": 3 }, "packsByPlace": [...] },
        { "id": "buildpass", "schedule": { "type": "rotation", "slot": "primary", "duration": 3, "cooldown": 28 },
          "packs": [...],                       // free-трек
          "paidPacks": [...], "paidGroup": "passes" },   // paid-трек, включается чекбоксом «Пассы куплены»
        { "id": "chainsale", "schedule": { "type": "offer", "duration": 3, "cooldown": 14 },
          "packs": ["Green"], "paidPacks": ["Blue", "Violet", "Red"], "paidGroup": "offers" }
    ]
}
```

Типы расписаний:

| type | Смысл | Параметры |
|---|---|---|
| `weekly` | всегда активна, паки по дням недели | `packsByDay` (7 массивов, пн..вс) |
| `weekday` | еженедельное окно по дням недели | `window`: `"MON-FRI"` (пн 00:00 → пт 00:00), `"FRI-MON"` и т.п. |
| `monthly` | окно по числам месяца | `fromDay`, `toDay` |
| `rotation` | слот-семафор: в слоте живёт одна миссия, следующая — round-robin по самому давнему завершению | `slot` (`primary`/`secondary`), `duration` (дни), `cooldown` (личный кулдаун типа, дни) |
| `offer` | независимый таймер | `duration`, `cooldown` |

Паузы между миссиями слота — `slots.primary.gapDays` / `slots.secondary.gapDays` (порт `Mission.SEMAPHORE_COOLDOWNS`: primary ≈ 0, secondary 2 дня).

## Допущения модели

- Учитываются только окна миссий, целиком попавшие в период симуляции.
- Многостейджевые награды распределяются по окну равномерно (влияет только на форму графиков, не на итоги).
- Очки за дубликаты копятся и показываются, но автоматически не тратятся.
- Книга сбрасывается на границе календарного сезона (2 месяца); рестарт после полного сбора — 1 раз, тумблером; после второго сбора паки идут «впустую» (как в игре — награда молча скипается).
- Pity-счётчик и очки переживают границу сезона.
- LivesFeast в ротацию не включён (отключён в merge-играх), primary-слот = SoftFeast/KrakenFeast/BuildPass/SalePass.

## Деплой на GitHub Pages

1. Создать пустой репозиторий (например `stickers2-simulator`) — публичный, либо приватный на платном плане.
2. Скопировать в него `index.html`, `config.default.json`, `README.md`, запушить в `main`.
3. GitHub → Settings → Pages → Source: `Deploy from a branch`, Branch: `main` / `(root)` → Save.
4. Через минуту страница доступна на `https://<org>.github.io/stickers2-simulator/`.

Обновление: просто пушить новые версии файлов в `main`.

## Как сверять с кодом игры

Дефолтный конфиг собран из (по состоянию на 2026-08-16):

- паки и вероятности: `features/src/season_collections2/stickersbook.js`, `stickerscollection.js`;
- weekly goals: `features/src/weekly_goals/configs/weeklygoalsmerge3config.json`;
- пассы: `cleverapps/src/utils/pass/passlevelsconfig.js` (buildpass/salepass);
- kingscup: `features/src/kingscup/kingscuprewardconfig.js`;
- island decoration: `features/src/island_decoration/seasons/common/islanddecorationconfig.js`;
- остальное (tsearch, spacerace, feasts, promotionsale, supplies, chainsale, caravan, магазин): `merge3/src/config/rewardsconfig.json`;
- расписания: `schedule: "MON-FRI"` из миссий, `duration`/`cooldown` из `cleverapps/src/utils/missions/missions.js` и `offers/offers.js`, island — из `res/schedule.json` игр (1–20 число).

При изменении наград в коде — поправить `config.default.json` и `DEFAULT_CONFIG` в `index.html` (они дублируются, чтобы страница работала с диска без fetch).
