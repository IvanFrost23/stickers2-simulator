# Stickers2 Simulator

Статическая страничка для балансировки stickers2 (season_collections2): моделирует по календарю «идеального игрока» (играет каждый день, закрывает все миссии, занимает выбранное место в соревнованиях) и показывает, сколько паков/карт/новых стикеров/дубликатов он получит за период от 2 недель до 2 месяцев (длина сезона), когда закроет коллекции и книгу.

Открывается двойным кликом по `index.html` — зависимостей и сборки нет.

Переключатель «Игра» вверху страницы выбирает конфиг: **Merge3** (mergecraft / wondermerge / fairy / hustlemerge — `config.default.json`) или **Merge2** (garden — `config.merge2.json`). Выбор дублируется в хэше адреса: `index.html#merge2` открывает сразу merge2.

## Что внутри

- `index.html` — разметка и стили страницы.
- `engine.js` — движок симуляции без DOM (DEFAULT_CONFIG, календарь/расписание миссий, открытие паков, Monte Carlo, валидация конфига). Подключается и в браузере, и в node: `const E = require("./engine.js")` — удобно для тестов и скриптов.
- `app.js` — UI: контролы, графики (SVG), таблицы, таймлайн, редактор конфига.
- `config.default.json` — конфиг merge3, сгенерированный из кода игры (тот же конфиг зашит в `engine.js` как `DEFAULT_CONFIG` — страница работает с file:// без fetch). Его можно править и загружать на страницу кнопкой «Загрузить JSON…».
- `config.merge2.json` — конфиг merge2 (garden), собран по таблице CollectionsConfigs (блок merge2), см. раздел ниже. `config.merge2.js` — тот же JSON, обёрнутый в глобал `MERGE2_CONFIG` для страницы; после правки JSON перегенерировать:

  ```bash
  node -e 'const c=require("./config.merge2.json");console.log(JSON.stringify(c,null,4))'   # вставить в config.merge2.js
  ```

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

## Дефолтные конфиги (2026-09-07)

Оба дефолта — балансовые конфиги от геймдизайна (формат `packsByPlace`: паки за 1/2/3-е место). Weekly Goals: паки из наград самих заданий по дням недели; второй пак в воскресенье — за закрытие всех заданий недели (последний чекпоинт полосы очков), объединён в тот же источник.

### Merge3 (`config.default.json`, зашит в `engine.js` как `DEFAULT_CONFIG`)

| Источник | Расписание | Бесплатные паки (по месту) | Платные |
|---|---|---|---|
| Weekly Goals | всегда, по дням недели | пн Brown · вт Brown · ср Green · чт Green · пт Green · сб Blue · вс Blue Violet | — |
| King's Cup | MON-FRI | 1-е: Red; 2-е: Violet; 3-е: Blue | — |
| Treasure Search | MON-FRI | 1-е: Brown, Brown, Green, Blue, Violet; 2-е: Brown, Brown, Green, Blue; 3-е: Brown, Brown, Green | — |
| Space Race | FRI-MON | 1-е: Brown, Brown, Green; 2-е: Brown, Brown; 3-е: Brown | — |
| Island Decoration | 1–20 число | 1-е: Brown, Brown, Green, Green, Blue, Violet, Red; 2-е: Brown, Brown, Green, Green, Blue, Violet; 3-е: Brown, Brown, Green, Green, Blue | — |
| Soft Feast | ротация primary, 3 д | 1-е: Red; 2-е: Violet; 3-е: Blue | — |
| Kraken Feast | ротация primary, 3 д | 1-е: Red; 2-е: Violet; 3-е: Blue | — |
| Build Pass | ротация primary, 3 д, cooldown 28 д | 1-е: Brown, Brown, Green, Green, Blue; 2-е: Brown, Brown, Green, Green; 3-е: Brown, Brown, Green | Blue, Blue, Blue, Violet, Red (`paidGroup: passes`) |
| Sale Pass | ротация primary, 3 д, cooldown 28 д | 1-е: Brown, Brown, Green, Green, Blue; 2-е: Brown, Brown, Green, Green; 3-е: Brown, Brown, Green | Blue, Blue, Blue, Violet, Red (`paidGroup: passes`) |
| Chain Sale | оффер 3 д / cooldown 14 д | Green | Blue, Violet, Red (`paidGroup: offers`) |
| Promotion Sale | оффер 3 д / cooldown 14 д | — | Blue, Red (`paidGroup: offers`) |
| Supplies Sale | оффер 7 д / cooldown 30 д | — | Brown, Brown, Green, Green, Blue, Violet, Red (`paidGroup: offers`) |
| Caravan | ротация secondary, 3 д | — | Blue, Violet, Red (`paidGroup: offers`) |
| Chest Time | ротация secondary, 1 д | — | — |
| Boost Time | ротация secondary, 1 д | — | — |
| Royal Pass | 1–30 число | 1-е: Brown, Brown, Green, Green, Blue, Green, Blue, Blue, Green, Violet; 2-е: Brown, Brown, Green, Green, Blue, Green, Blue, Blue, Green; 3-е: Brown, Brown, Green, Green, Blue, Green, Blue | Green, Blue, Blue, Violet, Violet, Blue, Violet, Violet, Blue, Red (`paidGroup: passes`) |

### Merge2 (`config.merge2.json` / `config.merge2.js`)

В коде merge2 stickers2-паков пока нет — конфиг = план. Все миссии merge2 — `SEMAPHORE_ALWAYS`, ротаций/слотов нет; Level Mastery идёт MON-THU (merge2-особенность). Ladacha — подмножество garden: weeklygoals, kingscup, tsearch (остальные источники снять галочками).

| Источник | Расписание | Бесплатные паки (по месту) | Платные |
|---|---|---|---|
| Weekly Goals | всегда, по дням недели | пн Brown · вт Brown · ср Green · чт Green · пт Green · сб Blue · вс Violet Red | — |
| King's Cup | MON-FRI | 1-е: Violet; 2-е: Blue; 3-е: Green | — |
| Treasure Search | MON-FRI | 1-е: Brown, Green, Green, Blue, Violet; 2-е: Brown, Green, Green, Blue; 3-е: Brown, Green, Green | Brown, Blue, Violet (`paidGroup: offers`) |
| Level Mastery | MON-THU | 1-е: Brown, Brown, Green, Blue, Violet, Violet; 2-е: Brown, Brown, Green, Blue, Violet; 3-е: Brown, Green, Green | — |
| Lory's Derby | FRI-MON | 1-е: Brown, Green, Violet, Red; 2-е: Brown, Green, Violet; 3-е: Brown, Green | Brown, Green, Blue, Violet, Red (`paidGroup: offers`) |
| Space Race | FRI-MON | 1-е: Brown, Blue, Violet; 2-е: Brown, Blue; 3-е: Brown | Brown, Green, Blue (`paidGroup: offers`) |
| Lightning Rush | MON-FRI | 1-е: Green; 2-е: —; 3-е: — | Brown, Green, Blue, Violet, Red (`paidGroup: offers`) |
| Island Decoration | 1–20 число | 1-е: Brown, Brown, Green, Green, Blue, Violet, Red; 2-е: Brown, Brown, Green, Green, Blue, Violet; 3-е: Brown, Brown, Green, Green, Blue | — |
| Royal Pass | 1–30 число | 1-е: Brown, Brown, Green, Green, Blue, Green, Blue, Blue, Green, Violet; 2-е: Brown, Brown, Green, Green, Blue, Green, Blue, Blue, Green; 3-е: Brown, Brown, Green, Green, Blue, Green, Blue | Green, Blue, Blue, Violet, Violet, Blue, Violet, Violet, Blue, Red (`paidGroup: passes`) |

Не включены: Hungry Games (три однодневных запуска пт/сб/вс), generator-офферы, магазин.

## Деплой на GitHub Pages

Сайт: **https://ivanfrost23.github.io/stickers2-simulator/** (репозиторий `IvanFrost23/stickers2-simulator`, ветка `main`, Pages из корня).

Обновление: скопировать свежие `index.html` / `engine.js` / `app.js` / `config.merge2.js` / `config.default.json` / `config.merge2.json` / `README.md` из этой папки в репозиторий `stickers2-simulator` и запушить в `main` — Pages пересоберётся сам за ~минуту.

## Как сверять с кодом игры

Первая версия дефолтного merge3-конфига (2026-08-16) была собрана из кода; с 2026-09-07 дефолты заданы геймдизайном (см. таблицы выше). Источники в коде для сверки:

- паки и вероятности: `features/src/season_collections2/stickersbook.js`, `stickerscollection.js`;
- weekly goals: `features/src/weekly_goals/configs/weeklygoalsmerge3config.json`;
- пассы: `cleverapps/src/utils/pass/passlevelsconfig.js` (buildpass/salepass);
- kingscup: `features/src/kingscup/kingscuprewardconfig.js`;
- island decoration: `features/src/island_decoration/seasons/common/islanddecorationconfig.js`;
- остальное (tsearch, spacerace, feasts, promotionsale, supplies, chainsale, caravan, магазин): `merge3/src/config/rewardsconfig.json`;
- расписания: `schedule: "MON-FRI"` из миссий, `duration`/`cooldown` из `cleverapps/src/utils/missions/missions.js` и `offers/offers.js`, island — из `res/schedule.json` игр (1–20 число).

При смене дефолта merge3 — заменить `config.default.json` и перегенерировать `DEFAULT_CONFIG` в `engine.js` (дублируются, чтобы страница работала с диска без fetch): вставить `JSON.stringify(cfg, null, 4)` вместо литерала и прогнать `npx eslint --fix engine.js`. Для merge2 — то же с `config.merge2.json` → `config.merge2.js`.
