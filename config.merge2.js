/**
 * Stickers2 simulator — merge2 (garden) config. Generated from config.merge2.json:
 *   node -e "const c=require('./config.merge2.json');console.log(JSON.stringify(c,null,4))"
 * Kept as a JS global so the page works from file:// without fetch.
 */

const MERGE2_CONFIG = {
    "meta": {
        "version": 1,
        "game": "merge2 (garden; ladacha — подмножество: weeklygoals, kingscup, tsearch)",
        "generatedFrom": "таблица CollectionsConfigs (лист, блок merge2) от 2026-09-02; расписания — из кода: features/src/*/…mission.js (schedule), garden/res/schedule.json (island_decoration 1–20, season_pass 1–30/31)",
        "generatedAt": "2026-09-02",
        "notes": [
            "В коде merge2 stickers2-паков пока нет — паки взяты из таблицы, это план.",
            "kingscup: в таблице для merge2 заполнены только 2-е (Blue) и 3-е (Green) места, 1-е место — допущение (Violet).",
            "Без паков в таблице (в конфиг не включены): Hungry Games (3 однодневных запуска пт/сб/вс), офферы TSearchPack / SpaceRacePack / LevelMasteryPack / HungryGamesPack, generator-офферы, паки из магазина.",
            "spacerace и lightningrush в таблице есть, но в garden/ladacha этих фич сейчас нет — выключены (enabled: false)."
        ]
    },
    "rarities": {
        "names": [
            "1★",
            "2★",
            "3★",
            "4★",
            "5★",
            "Gold"
        ],
        "dropProbabilities": [
            0.3435,
            0.2623,
            0.1756,
            0.1062,
            0.0625,
            0.05
        ],
        "duplicatePoints": [
            1,
            2,
            3,
            4,
            5,
            5
        ]
    },
    "collections": [
        [
            8,
            1,
            0,
            0,
            0,
            0
        ],
        [
            7,
            2,
            0,
            0,
            0,
            0
        ],
        [
            7,
            1,
            1,
            0,
            0,
            0
        ],
        [
            5,
            3,
            1,
            0,
            0,
            0
        ],
        [
            3,
            4,
            1,
            1,
            0,
            0
        ],
        [
            2,
            4,
            1,
            1,
            1,
            0
        ],
        [
            1,
            3,
            2,
            1,
            1,
            1
        ],
        [
            0,
            4,
            2,
            1,
            1,
            1
        ],
        [
            0,
            3,
            2,
            1,
            2,
            1
        ],
        [
            0,
            2,
            2,
            2,
            1,
            2
        ],
        [
            0,
            1,
            3,
            1,
            2,
            2
        ],
        [
            0,
            0,
            3,
            2,
            2,
            2
        ],
        [
            0,
            0,
            3,
            2,
            1,
            3
        ],
        [
            0,
            0,
            2,
            2,
            2,
            3
        ],
        [
            0,
            0,
            0,
            4,
            2,
            3
        ]
    ],
    "season": {
        "months": 2,
        "canRestart": true
    },
    "pity": {
        "startCounter": 2,
        "chancePerStep": 0.3333
    },
    "packs": {
        "Brown": {
            "amount": 2
        },
        "Green": {
            "amount": 3
        },
        "Blue": {
            "amount": 4
        },
        "Violet": {
            "amount": 6,
            "firstCardMinRarity": 2,
            "pity": true
        },
        "Red": {
            "amount": 6,
            "guaranteedNew": true
        }
    },
    "slots": {
        "primary": {
            "gapDays": 0
        },
        "secondary": {
            "gapDays": 2
        }
    },
    "sources": [
        {
            "id": "weeklygoals",
            "name": "Weekly Goals",
            "enabled": true,
            "schedule": {
                "type": "weekly"
            },
            "packsByDay": [
                [
                    "Brown",
                    "Brown"
                ],
                [
                    "Brown",
                    "Green"
                ],
                [
                    "Green",
                    "Green"
                ],
                [
                    "Green",
                    "Green"
                ],
                [
                    "Green",
                    "Blue"
                ],
                [
                    "Blue",
                    "Blue"
                ],
                [
                    "Violet",
                    "Violet"
                ]
            ]
        },
        {
            "id": "kingscup",
            "name": "King's Cup",
            "enabled": true,
            "schedule": {
                "type": "weekday",
                "window": "MON-FRI"
            },
            "packsByPlace": [
                [
                    "Violet"
                ],
                [
                    "Blue"
                ],
                [
                    "Green"
                ]
            ]
        },
        {
            "id": "tsearch",
            "name": "Treasure Search",
            "enabled": true,
            "schedule": {
                "type": "weekday",
                "window": "MON-FRI"
            },
            "packs": [
                "Brown",
                "Green",
                "Blue",
                "Violet"
            ]
        },
        {
            "id": "levelmastery",
            "name": "Level Mastery",
            "enabled": true,
            "schedule": {
                "type": "weekday",
                "window": "MON-THU"
            },
            "packs": [
                "Brown",
                "Green",
                "Violet"
            ]
        },
        {
            "id": "lorysderby",
            "name": "Lory's Derby",
            "enabled": true,
            "schedule": {
                "type": "weekday",
                "window": "FRI-MON"
            },
            "packs": [
                "Brown",
                "Violet"
            ]
        },
        {
            "id": "spacerace",
            "name": "Space Race",
            "enabled": false,
            "schedule": {
                "type": "weekday",
                "window": "FRI-MON"
            },
            "packs": [
                "Green",
                "Blue"
            ]
        },
        {
            "id": "lightningrush",
            "name": "Lightning Rush",
            "enabled": false,
            "schedule": {
                "type": "weekday",
                "window": "MON-FRI"
            },
            "packs": [
                "Blue"
            ]
        },
        {
            "id": "island_decoration",
            "name": "Island Decoration",
            "enabled": true,
            "schedule": {
                "type": "monthly",
                "fromDay": 1,
                "toDay": 20
            },
            "packs": [
                "Brown",
                "Green",
                "Blue",
                "Blue",
                "Violet",
                "Red"
            ]
        },
        {
            "id": "season_pass",
            "name": "Royal Pass",
            "enabled": true,
            "schedule": {
                "type": "monthly",
                "fromDay": 1,
                "toDay": 30
            },
            "packs": [
                "Brown",
                "Green",
                "Blue",
                "Blue",
                "Blue",
                "Violet"
            ],
            "paidPacks": [
                "Blue",
                "Violet",
                "Violet",
                "Violet",
                "Violet",
                "Red",
                "Red"
            ],
            "paidGroup": "passes"
        }
    ]
};
