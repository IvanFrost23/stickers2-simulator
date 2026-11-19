# Stickers2 Simulator

Статическая страничка для балансировки stickers2 (season_collections2): моделирует по календарю «идеального игрока» (играет каждый день, закрывает все миссии, занимает выбранное место в соревнованиях) и показывает, сколько паков/карт/новых стикеров/дубликатов он получит за период от 2 недель до 2 месяцев (длина сезона), когда закроет коллекции и книгу.

Открывается двойным кликом по `index.html` — зависимостей и сборки нет.

Переключатель «Игра» вверху страницы выбирает конфиг: **Merge3** (mergecraft / wondermerge / fairy / hustlemerge — `config.default.json`) **Merge2** (garden — `config.merge2.json`) или **Levels** (zenmatch — `config.levels.json`). Выбор дублируется в хэше адреса: `index.html#merge2` открывает сразу merge2, `index.html#levels` — levels.

Для levels-игр вверху появляется поле «Уровней в день»: в них основной источник — карты за победу в уровне, а не паки миссий.

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

- `config.levels.json` — конфиг levels-игр (zenmatch), собран из кода, см. раздел ниже. `config.levels.js` — тот же JSON в глобале `LEVELS_CONFIG`, перегенерируется той же командой с `config.levels.json`.

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
          "packsByDay": [["Brown", "Brown"], ...],                        // 7 массивов, пн..вс
          "tasksPerDay": 4,                                               // опционально: пул заданий с очками и целями,
          "tasks": [{ "name": "SPEND_HARD", "points": [...], "packsByDay": [...] }],   // см. раздел Levels
          "pointsRewards": [{ "share": 0.55, "packs": ["Blue"] }] },
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
| `levels` | карты без пака за пройденные уровни (`givePrize(amount)` без опций пака) | у источника `cardsPerLevel` + `cardsPerHardLevel` (за каждый уровень) или `everyLevels` + `cards` (раз в N уровней); темп — в корне конфига: `levels.perDay`, `levels.hardShare` |

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
| Season Pass | 1–30 число | 1-е: Brown, Brown, Green, Green, Blue, Green, Blue, Blue, Green, Violet; 2-е: Brown, Brown, Green, Green, Blue, Green, Blue, Blue, Green; 3-е: Brown, Brown, Green, Green, Blue, Green, Blue | Green, Blue, Blue, Violet, Violet, Blue, Violet, Violet, Blue, Red (`paidGroup: passes`) |

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
| Season Pass | 1–30 число | 1-е: Brown, Brown, Green, Green, Blue, Green, Blue, Blue, Green, Violet; 2-е: Brown, Brown, Green, Green, Blue, Green, Blue, Blue, Green; 3-е: Brown, Brown, Green, Green, Blue, Green, Blue | Green, Blue, Blue, Violet, Violet, Blue, Violet, Violet, Blue, Red (`paidGroup: passes`) |

Не включены: Hungry Games (три однодневных запуска пт/сб/вс), generator-офферы, магазин.

### Levels (`config.levels.json` / `config.levels.js`, 2026-11-19)

Собран из кода: блока для levels-игр в таблице CollectionsConfigs нет. Базовая игра — zenmatch (tile3), единственная в A/B-тесте `stickersBook2` (`season_collections2` там пока `@debug`).

| Источник | Расписание | Что даёт | Откуда |
|---|---|---|---|
| Победа в уровне | каждый уровень | 1 карта, hard — 3, с множителем `AVG_LEVELS_FINISHED.match3 / AVG_LEVELS_FINISHED.<тип>` (tile3: 4.95 / 3.35 → 1.4776 и 4.4328) | `stickersbook.js` → `getLevelReward`, `cleverapps/levels/game/gamebase.js` → `getNormalizedLevelReward` |
| Этап локации | раз в 79 уровней | 4 карты | `RewardsConfig.LocationSimple1/2` (`cleverapps/src/utils/rewards/rewardsconfig.json`), `features/src/location_simple/simplelocation.js` |
| Weekly Goals | всегда, по дням недели | задания (см. ниже) + Blue за 55% очков недели и Red за 100% | `features/src/weekly_goals/configs/weeklygoalslevelsconfig.json`, `weeklygoalstile3config.json`, `features/src/weekly_goals/rewardsconfig.js`, `weeklygoals.js` |

Задания Weekly Goals в zenmatch (очки и цели — по дням недели, пн..вс; цели копятся за неделю):

| Задание | В пуле | Паки | Цель |
|---|---|---|---|
| LOGIN_DAYS | каждый день | чт Green | вход в игру |
| SPEND_HARD | 4 дня из 5 | пн Brown · ср Green · пт Green · вс Violet | 10…70 монет — считается выполненным в свой день |
| PASS_HARD_LEVEL | 4 дня из 5 | пн Brown · ср Brown · пт Green · вс Blue | 1, 2, 3, 4, 5, 6, 8 hard-уровней с начала недели |
| USE_BOOSTER | 4 дня из 5 | вт Brown · чт Green · сб Blue | 2…15 бустеров — считается выполненным в свой день |
| PASS_LEVEL | 4 дня из 5 | — | 5, 10, 15, 20, 25, 35, 45 уровней с начала недели |
| COLLECT_TILES | 4 дня из 5 | — | 150…1550 тайлов — считается выполненным в свой день |

При 3.35 уровня в день игрок проходит за неделю 23 уровня и 3 hard-уровня: пятничный и воскресный паки PASS_HARD_LEVEL и Red за полную полосу очков недостижимы. Все паки Weekly Goals открываются примерно с 9 уровней в день (8 hard-уровней за неделю).

Формат в конфиге: у источника `tasks` (у задания `points`, `packsByDay`, опционально `constant`, `levelsTarget`, `hardLevelsTarget` — по 7 значений), `tasksPerDay` и `pointsRewards` (`share` — доля очков недели, `packs`).

#### Допущения

Темп игры:

- `levels.perDay = 3.35` — `GameBase.AVG_LEVELS_FINISHED.tile3`, единственная цифра о темпе в коде. Единица в коде не подписана (константа добавлена в 2024-08 для нормализации наград между типами игр) — считаю, что это побед в день. Меняется полем «Уровней в день».
- Игрок играет каждый день с одним и тем же темпом, все уровни в счёте — победы. Бонусные уровни (карт не дают) не учитываются.
- `levels.hardShare = 0.1333` — доля hard-уровней в `zenmatch/res/levels` (50 из 375), hard-уровни идут равномерно. Superhard считается как hard (так в коде), tricky-уровней в zenmatch нет.

Победа в уровне:

- Дробная часть награды копится между уровнями; в игре — случайное округление с тем же средним.
- Множитель 4.95 / 3.35 — для tile3. Для другого типа игры пересчитать `cardsPerLevel` / `cardsPerHardLevel` (match3: 1 и 3) и `hardShare`.

Этап локации:

- Этап принят за 100 звёзд (этапы 20–24 из 51). На ранних этапах нужно 5–70 звёзд, на поздних — до 225, то есть карты идут чаще или реже.
- Уровень даёт в среднем 1.27 звезды (обычный — 1, hard — 3) → этап раз в 79 уровней.
- Игрок не дошёл до конца локаций (после последнего этапа награды нет).

Weekly Goals:

- Пул zenmatch — задания общего levels-конфига без выключенных фич (treasure_search, daily_cup, weekly_tournament) плюс tile3-конфиг. Для другой игры пул пересобрать (`require` / `excludeTypes` в конфигах заданий).
- Из 5 заданий пула игра выбирает на день 4 случайных; в симуляторе выбор идёт по кругу, каждое задание попадает в 4 дня из 5.
- Прогресс заданий копится за неделю, задание прошлого дня можно закрыть позже на той же неделе — пак приходит в день, когда цель достигнута; не достигнута к воскресенью — пак пропадает.
- Цели PASS_LEVEL и PASS_HARD_LEVEL считаются от `levels.perDay` и `levels.hardShare`. SPEND_HARD, USE_BOOSTER и COLLECT_TILES считаются выполненными в свой день: расход монет и бустеров и число тайлов на уровень в модели не считаются. При низком темпе это завышает паки и очки.
- PASS_LEVEL считает все победы, включая hard-уровни.
- Чекпоинты полосы очков: порог = доля от суммы очков заданий недели, округлённая до 5 (как в коде); пак приходит в день, когда набраны очки.
- Не включён Blue за MAKE_PURCHASE (платное задание в один случайный день недели, занимает слот одного из 4 заданий и в сумму очков не входит).
- Первая неполная неделя периода считается так, будто игрок играл в том же темпе и до начала периода.

Общее:

- Книга и Weekly Goals доступны игроку с первого дня периода (уровни открытия фич не моделируются), бандл сезона есть, игрок в группе A/B-теста с новой книгой.
- Карты и паки, пришедшие после полного сбора книги (второго, если рестарт включён), пропадают; рестарт книги происходит сразу после сбора (в игре — по действию игрока).
- Не включены: паки из магазина (`stickers2_0..5`), покупки за очки дубликатов. Миссии и офферы levels-игр (Lightning Rush, Chain Sale и др.) паков в коде не дают.

## Деплой на GitHub Pages

Сайт: **https://ivanfrost23.github.io/stickers2-simulator/** (репозиторий `IvanFrost23/stickers2-simulator`, ветка `main`, Pages из корня).

Обновление: скопировать свежие `index.html` / `engine.js` / `app.js` / `config.merge2.js` / `config.levels.js` / `config.default.json` / `config.merge2.json` / `config.levels.json` / `README.md` из этой папки в репозиторий `stickers2-simulator` и запушить в `main` — Pages пересоберётся сам за ~минуту. Скрипты подключаются из `index.html` с `?v=Date.now()`, так что браузер не кэширует `engine.js` / `app.js` / `config.merge2.js`; сам `index.html` Pages отдаёт с `max-age=600`, то есть после деплоя правки в разметке могут доехать до 10 минут.

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
