/**
 * Stickers2 simulator — simulation engine (no DOM).
 * Used by app.js in the browser and by node test harnesses (module.exports at the bottom).
 */

const DEFAULT_CONFIG = {
    meta: { version: 1, generatedFrom: "merge3 code", generatedAt: "2026-08-16" },
    rarities: {
        names: ["1★", "2★", "3★", "4★", "5★", "Gold"],
        dropProbabilities: [0.3435, 0.2623, 0.1756, 0.1062, 0.0625, 0.05],
        duplicatePoints: [1, 2, 3, 4, 5, 5]
    },
    collections: [
        [8, 1, 0, 0, 0, 0], [7, 2, 0, 0, 0, 0], [7, 1, 1, 0, 0, 0], [5, 3, 1, 0, 0, 0],
        [3, 4, 1, 1, 0, 0], [2, 4, 1, 1, 1, 0], [1, 3, 2, 1, 1, 1], [0, 4, 2, 1, 1, 1],
        [0, 3, 2, 1, 2, 1], [0, 2, 2, 2, 1, 2], [0, 1, 3, 1, 2, 2], [0, 0, 3, 2, 2, 2],
        [0, 0, 3, 2, 1, 3], [0, 0, 2, 2, 2, 3], [0, 0, 0, 4, 2, 3]
    ],
    season: { months: 2, canRestart: true },
    pity: { startCounter: 2, chancePerStep: 0.3333 },
    packs: {
        Brown: { amount: 2 },
        Green: { amount: 3 },
        Blue: { amount: 4 },
        Violet: { amount: 6, firstCardMinRarity: 2, pity: true },
        Red: { amount: 6, guaranteedNew: true }
    },
    slots: { primary: { gapDays: 0 }, secondary: { gapDays: 2 } },
    sources: [
        {
            id: "weeklygoals",
            name: "Weekly Goals",
            enabled: true,
            schedule: { type: "weekly" },
            packsByDay: [["Brown", "Brown"], ["Brown", "Brown"], ["Green", "Green"], ["Green", "Green"], ["Green", "Green"], ["Blue", "Blue"], ["Blue", "Blue"]] 
        },
        {
            id: "kingscup", name: "King's Cup", enabled: true, schedule: { type: "weekday", window: "MON-FRI" }, packsByPlace: [["Red"], ["Violet"], ["Blue"]] 
        },
        {
            id: "tsearch", name: "Treasure Search", enabled: true, schedule: { type: "weekday", window: "MON-FRI" }, packs: ["Brown", "Brown", "Green", "Blue", "Violet"] 
        },
        {
            id: "spacerace", name: "Space Race", enabled: true, schedule: { type: "weekday", window: "FRI-MON" }, packs: ["Brown", "Brown", "Green"] 
        },
        {
            id: "island_decoration",
            name: "Island Decoration",
            enabled: true,
            schedule: { type: "monthly", fromDay: 1, toDay: 20 },
            packs: ["Brown", "Brown", "Green", "Green", "Blue", "Blue", "Violet", "Red"] 
        },
        {
            id: "softfeast", name: "Soft Feast", enabled: true, schedule: { type: "rotation", slot: "primary", duration: 3 }, packsByPlace: [["Red"], ["Violet"], ["Blue"]] 
        },
        {
            id: "krakenfeast", name: "Kraken Feast", enabled: true, schedule: { type: "rotation", slot: "primary", duration: 3 }, packsByPlace: [["Red"], ["Violet"], ["Blue"]] 
        },
        {
            id: "buildpass",
            name: "Build Pass",
            enabled: true,
            schedule: {
                type: "rotation", slot: "primary", duration: 3, cooldown: 28 
            },
            packs: ["Brown", "Brown", "Green", "Green", "Blue"],
            paidPacks: ["Blue", "Blue", "Blue", "Violet", "Red"],
            paidGroup: "passes" 
        },
        {
            id: "salepass",
            name: "Sale Pass",
            enabled: true,
            schedule: {
                type: "rotation", slot: "primary", duration: 3, cooldown: 28 
            },
            packs: ["Brown", "Brown", "Green", "Green", "Blue"],
            paidPacks: ["Blue", "Blue", "Blue", "Violet", "Red"],
            paidGroup: "passes" 
        },
        {
            id: "chainsale",
            name: "Chain Sale",
            enabled: true,
            schedule: { type: "offer", duration: 3, cooldown: 14 },
            packs: ["Green"],
            paidPacks: ["Blue", "Violet", "Red"],
            paidGroup: "offers" 
        },
        {
            id: "promotionsale",
            name: "Promotion Sale",
            enabled: true,
            schedule: { type: "offer", duration: 3, cooldown: 14 },
            packs: [],
            paidPacks: ["Blue", "Red"],
            paidGroup: "offers" 
        },
        {
            id: "supplies",
            name: "Supplies Sale",
            enabled: true,
            schedule: { type: "offer", duration: 7, cooldown: 30 },
            packs: [],
            paidPacks: ["Brown", "Brown", "Green", "Green", "Blue", "Violet", "Red"],
            paidGroup: "offers" 
        },
        {
            id: "caravan",
            name: "Caravan",
            enabled: true,
            schedule: { type: "rotation", slot: "secondary", duration: 3 },
            packs: [],
            paidPacks: ["Blue", "Violet", "Red"],
            paidGroup: "offers" 
        },
        {
            id: "chesttime", name: "Chest Time", enabled: true, schedule: { type: "rotation", slot: "secondary", duration: 1 }, packs: [] 
        },
        {
            id: "boosttime", name: "Boost Time", enabled: true, schedule: { type: "rotation", slot: "secondary", duration: 1 }, packs: [] 
        }
    ]
};

const PACK_ORDER = ["Brown", "Green", "Blue", "Violet", "Red"];
const PACK_CSS = {
    Brown: "--pack-brown", Green: "--pack-green", Blue: "--pack-blue", Violet: "--pack-violet", Red: "--pack-red" 
};
const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_MS = 86400000;

// ---------- RNG (mulberry32) ----------
function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// ---------- schedule ----------
function paidIncluded(source, scenario) {
    if (!source.paidPacks || !source.paidPacks.length) {
        return false;
    }
    return source.paidGroup === "passes" ? scenario.paidPasses : scenario.buyOffers;
}

function grantedPacks(source, scenario) {
    const free = source.packs ? source.packs.slice() : [];
    return paidIncluded(source, scenario) ? free.concat(source.paidPacks) : free;
}

function spreadStageGrants(events, source, packs, start, duration) {
    const n = packs.length;
    for (let i = 0; i < n; i++) {
        const day = start + Math.min(duration - 1, Math.floor(i * duration / n));
        events.push({ day, sourceId: source.id, pack: packs[i] });
    }
}

function windowGrants(events, source, scenario, start, duration) {
    if (source.packsByPlace) {
        const packs = source.packsByPlace[scenario.place - 1] || [];
        packs.forEach((p) => events.push({ day: start + duration - 1, sourceId: source.id, pack: p }));
    }
    const packs = grantedPacks(source, scenario);
    if (packs.length) {
        spreadStageGrants(events, source, packs, start, duration);
    }
}

function buildSchedule(cfg, scenario) {
    const start = new Date(`${scenario.startDate}T00:00:00`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + scenario.months);
    const horizon = Math.round((end - start) / DAY_MS);
    const startDow = (start.getDay() + 6) % 7;
    const dateOf = (day) => new Date(start.getTime() + day * DAY_MS);

    const seasonMonths = cfg.season && cfg.season.months || 2;
    const seasonKey = (d) => d.getFullYear() * 100 + Math.floor(d.getMonth() / seasonMonths);
    const seasonStarts = [];
    for (let d = 1; d < horizon; d++) {
        if (seasonKey(dateOf(d)) !== seasonKey(dateOf(d - 1))) {
            seasonStarts.push(d);
        }
    }

    const events = [];
    const spans = [];
    const disabled = scenario.disabledSources;
    const active = cfg.sources.filter((s) => s.enabled !== false && !(disabled && disabled.has(s.id)));

    for (const source of active) {
        const sch = source.schedule || {};
        if (sch.type === "weekly") {
            spans.push({
                sourceId: source.id, start: 0, end: horizon, group: "weekly" 
            });
            for (let d = 0; d < horizon; d++) {
                const dow = (startDow + d) % 7;
                (source.packsByDay && source.packsByDay[dow] || []).forEach((p) => events.push({ day: d, sourceId: source.id, pack: p }));
            }
        } else if (sch.type === "weekday") {
            const parts = sch.window.split("-");
            const a = WEEKDAYS.indexOf(parts[0]);
            const b = WEEKDAYS.indexOf(parts[1]);
            const duration = ((b - a) + 7) % 7 || 7;
            for (let d = 0; d < horizon; d++) {
                if ((startDow + d) % 7 === a && d + duration <= horizon) {
                    spans.push({
                        sourceId: source.id, start: d, end: d + duration, group: "weekly" 
                    });
                    windowGrants(events, source, scenario, d, duration);
                }
            }
        } else if (sch.type === "monthly") {
            for (let d = 0; d < horizon; d++) {
                const date = dateOf(d);
                if (date.getDate() === sch.fromDay) {
                    const duration = sch.toDay - sch.fromDay + 1;
                    if (d + duration <= horizon) {
                        spans.push({
                            sourceId: source.id, start: d, end: d + duration, group: "monthly" 
                        });
                        windowGrants(events, source, scenario, d, duration);
                    }
                }
            }
        } else if (sch.type === "offer") {
            let t = 0;
            while (t < horizon) {
                if (t + sch.duration <= horizon) {
                    spans.push({
                        sourceId: source.id, start: t, end: t + sch.duration, group: "offer", inactive: !grantedPacks(source, scenario).length && !source.packsByPlace 
                    });
                    windowGrants(events, source, scenario, t, sch.duration);
                }
                t += sch.duration + sch.cooldown;
            }
        }
    }

    // rotation slots (semaphore model: one mission per slot, round-robin by oldest lastRemoved)
    const slotNames = [...new Set(active.filter((s) => s.schedule && s.schedule.type === "rotation").map((s) => s.schedule.slot))];
    for (const slotName of slotNames) {
        const members = active.filter((s) => s.schedule && s.schedule.type === "rotation" && s.schedule.slot === slotName);
        const gap = (cfg.slots && cfg.slots[slotName] || {}).gapDays || 0;
        const state = new Map(members.map((s, i) => [s.id, { lastRemoved: -1e9 + i, readyAt: 0 }]));
        let t = 0;
        while (t < horizon) {
            const candidates = members.filter((s) => t >= state.get(s.id).readyAt);
            if (!candidates.length) {
                t += 1;
                continue;
            }
            candidates.sort((x, y) => state.get(x.id).lastRemoved - state.get(y.id).lastRemoved);
            const source = candidates[0];
            const duration = source.schedule.duration;
            if (t + duration <= horizon) {
                spans.push({
                    sourceId: source.id, start: t, end: t + duration, group: "rotation", inactive: !grantedPacks(source, scenario).length && !source.packsByPlace 
                });
                windowGrants(events, source, scenario, t, duration);
            }
            const st = state.get(source.id);
            st.lastRemoved = t + duration;
            st.readyAt = t + duration + (source.schedule.cooldown || 0);
            t += duration + gap;
        }
    }

    events.sort((a, b) => a.day - b.day);
    return {
        events, spans, horizon, start, seasonStarts, dateOf, sources: active 
    };
}

// ---------- pack opening (faithful port of StickersBook2.givePrize) ----------
function makeBook(cfg) {
    const buckets = cfg.rarities.dropProbabilities.map(() => []);
    cfg.collections.forEach((row, ci) => {
        row.forEach((count, r) => {
            for (let k = 0; k < count; k++) {
                buckets[r].push({ r, ci, open: false });
            }
        });
    });
    return {
        buckets,
        total: buckets.reduce((s, b) => s + b.length, 0),
        openCount: 0,
        collOpen: cfg.collections.map(() => 0),
        collSize: cfg.collections.map((row) => row.reduce((a, b) => a + b, 0)),
        collDone: 0,
        restarts: 0,
        finished: false
    };
}

function resetBook(book) {
    book.buckets.forEach((b) => b.forEach((s) => {
        s.open = false; 
    }));
    book.openCount = 0;
    book.collOpen = book.collOpen.map(() => 0);
    book.collDone = 0;
}

function rollSticker(cfg, probs, book, rng, opts) {
    opts = opts || {};
    const eligible = book.buckets.map((bucket, r) => {
        if (opts.minRarity && r < opts.minRarity) {
            return [];
        }
        return opts.closedOnly ? bucket.filter((s) => !s.open) : bucket;
    });
    let sum = 0;
    for (let r = 0; r < eligible.length; r++) {
        if (eligible[r].length) {
            sum += probs[r];
        }
    }
    if (sum <= 0) {
        return undefined;
    }
    let x = rng() * sum;
    for (let r = 0; r < eligible.length; r++) {
        if (!eligible[r].length) {
            continue;
        }
        x -= probs[r];
        if (x < 0) {
            return eligible[r][Math.floor(rng() * eligible[r].length)];
        }
    }
    const last = eligible.filter((b) => b.length).pop();
    return last && last[Math.floor(rng() * last.length)];
}

function chooseRarestClosed(book, rng) {
    for (let r = book.buckets.length - 1; r >= 0; r--) {
        const closed = book.buckets[r].filter((s) => !s.open);
        if (closed.length) {
            return closed[Math.floor(rng() * closed.length)];
        }
    }
    return undefined;
}

function openPack(cfg, packName, book, state, rng, stats) {
    const pack = cfg.packs[packName];
    const probs = pack.probabilities || cfg.rarities.dropProbabilities;
    const amount = pack.amount;
    const pityCfg = cfg.pity || { startCounter: 2, chancePerStep: 0.3333 };
    const pityNew = pack.pity && state.pityCounter >= pityCfg.startCounter
        && rng() < Math.min((state.pityCounter - pityCfg.startCounter + 1) * pityCfg.chancePerStep, 1);

    let newAmount = 0;
    for (let i = 0; i < amount; i++) {
        const isFirst = i === 0;
        const isLast = i === amount - 1;
        let sticker;
        if (isLast && pack.guaranteedNew) {
            sticker = chooseRarestClosed(book, rng);
        }
        if (!sticker && isLast && pityNew && !newAmount) {
            sticker = rollSticker(cfg, probs, book, rng, { closedOnly: true });
        }
        if (!sticker && isFirst && pack.firstCardMinRarity) {
            sticker = rollSticker(cfg, probs, book, rng, { minRarity: pack.firstCardMinRarity });
        }
        if (!sticker) {
            sticker = rollSticker(cfg, probs, book, rng)
                || book.buckets[0][Math.floor(rng() * book.buckets[0].length)];
        }
        if (!sticker) {
            continue;
        }
        stats.cards++;
        if (sticker.open) {
            const pts = cfg.rarities.duplicatePoints[sticker.r] || 0;
            state.points += pts;
            stats.dupByRarity[sticker.r]++;
            stats.dup++;
        } else {
            sticker.open = true;
            book.openCount++;
            book.collOpen[sticker.ci]++;
            if (book.collOpen[sticker.ci] === book.collSize[sticker.ci]) {
                book.collDone++;
            }
            newAmount++;
            stats.newByRarity[sticker.r]++;
            stats.new++;
        }
    }
    if (pack.pity) {
        state.pityCounter = newAmount > 0 ? 0 : state.pityCounter + 1;
    }
}

// ---------- simulation ----------
function simulateRun(cfg, scenario, schedule, seed) {
    const rng = mulberry32(seed);
    let book = makeBook(cfg);
    const state = { points: 0, pityCounter: 0 };
    const perSource = {};
    schedule.sources.forEach((s) => {
        perSource[s.id] = {
            packs: 0, cards: 0, new: 0, dup: 0 
        }; 
    });
    const packCounts = {
        Brown: 0, Green: 0, Blue: 0, Violet: 0, Red: 0 
    };

    const dailyNew = new Array(schedule.horizon).fill(0);
    const dailyColl = new Array(schedule.horizon).fill(0);
    let cumNew = 0;
    let totalCards = 0;
    let totalDup = 0;
    let wastedPacks = 0;
    const newByRarity = cfg.rarities.dropProbabilities.map(() => 0);
    const dupByRarity = cfg.rarities.dropProbabilities.map(() => 0);
    let firstBookDay = null;
    let seasonPtr = 0;
    let collDoneOffset = 0;
    let cumCollDone = 0;

    let evtIdx = 0;
    for (let d = 0; d < schedule.horizon; d++) {
        if (seasonPtr < schedule.seasonStarts.length && d === schedule.seasonStarts[seasonPtr]) {
            book = makeBook(cfg);
            collDoneOffset = cumCollDone;
            seasonPtr++;
        }
        while (evtIdx < schedule.events.length && schedule.events[evtIdx].day === d) {
            const evt = schedule.events[evtIdx++];
            packCounts[evt.pack] = (packCounts[evt.pack] || 0) + 1;
            if (book.finished) {
                wastedPacks++;
                continue;
            }
            const stats = {
                cards: 0, new: 0, dup: 0, newByRarity, dupByRarity 
            };
            openPack(cfg, evt.pack, book, state, rng, stats);
            cumNew += stats.new;
            totalCards += stats.cards;
            totalDup += stats.dup;
            const ps = perSource[evt.sourceId];
            ps.packs++;
            ps.cards += stats.cards;
            ps.new += stats.new;
            ps.dup += stats.dup;
            if (book.openCount === book.total) {
                if (firstBookDay === null) {
                    firstBookDay = d;
                }
                cumCollDone = collDoneOffset + book.collDone;
                if (scenario.restartBook && (cfg.season && cfg.season.canRestart) && book.restarts === 0) {
                    collDoneOffset += book.collDone;
                    resetBook(book);
                    book.restarts++;
                } else {
                    book.finished = true;
                }
            }
        }
        cumCollDone = collDoneOffset + book.collDone;
        dailyNew[d] = cumNew;
        dailyColl[d] = cumCollDone;
    }

    return {
        dailyNew,
        dailyColl,
        packCounts,
        totalCards,
        totalNew: cumNew,
        totalDup,
        newByRarity,
        dupByRarity,
        points: state.points,
        firstBookDay,
        perSource,
        wastedPacks
    };
}

function percentile(sortedArr, p) {
    const idx = Math.min(sortedArr.length - 1, Math.max(0, Math.round(p * (sortedArr.length - 1))));
    return sortedArr[idx];
}

function runMonteCarlo(cfg, scenario, schedule) {
    const runs = [];
    for (let k = 0; k < scenario.runs; k++) {
        runs.push(simulateRun(cfg, scenario, schedule, scenario.seed * 7919 + k * 104729 + 13));
    }
    const H = schedule.horizon;
    const K = runs.length;
    const meanNew = new Array(H).fill(0);
    const p10New = new Array(H).fill(0);
    const p90New = new Array(H).fill(0);
    const meanColl = new Array(H).fill(0);
    const buf = new Array(K);
    for (let d = 0; d < H; d++) {
        let s = 0;
        let sc = 0;
        for (let k = 0; k < K; k++) {
            buf[k] = runs[k].dailyNew[d];
            s += buf[k];
            sc += runs[k].dailyColl[d];
        }
        meanNew[d] = s / K;
        meanColl[d] = sc / K;
        const sorted = buf.slice().sort((a, b) => a - b);
        p10New[d] = percentile(sorted, 0.1);
        p90New[d] = percentile(sorted, 0.9);
    }
    const avg = (get) => runs.reduce((s, r) => s + get(r), 0) / K;
    const rarN = cfg.rarities.dropProbabilities.map((_, r) => avg((x) => x.newByRarity[r]));
    const rarD = cfg.rarities.dropProbabilities.map((_, r) => avg((x) => x.dupByRarity[r]));
    const perSource = {};
    schedule.sources.forEach((s) => {
        perSource[s.id] = {
            packs: runs[0].perSource[s.id].packs,
            cards: runs[0].perSource[s.id].cards,
            new: avg((x) => x.perSource[s.id].new),
            dup: avg((x) => x.perSource[s.id].dup)
        };
    });
    const doneDays = runs.map((r) => r.firstBookDay).filter((d) => d !== null).sort((a, b) => a - b);
    return {
        runs: K,
        meanNew,
        p10New,
        p90New,
        meanColl,
        packCounts: runs[0].packCounts,
        totalCards: runs[0].totalCards,
        totalNew: avg((x) => x.totalNew),
        totalDup: avg((x) => x.totalDup),
        newByRarity: rarN,
        dupByRarity: rarD,
        points: avg((x) => x.points),
        wastedPacks: avg((x) => x.wastedPacks),
        bookDonePct: doneDays.length / K,
        bookDoneP50: doneDays.length ? percentile(doneDays, 0.5) : null,
        bookDoneP10: doneDays.length ? percentile(doneDays, 0.1) : null,
        bookDoneP90: doneDays.length ? percentile(doneDays, 0.9) : null,
        perSource
    };
}

// ---------- config validation ----------
function validateConfig(cfg) {
    if (!cfg || typeof cfg !== "object") {
        return "не объект";
    }
    if (!cfg.rarities || !Array.isArray(cfg.rarities.dropProbabilities)) {
        return "нет rarities.dropProbabilities";
    }
    const R = cfg.rarities.dropProbabilities.length;
    if (!Array.isArray(cfg.collections) || !cfg.collections.length) {
        return "нет collections";
    }
    for (const row of cfg.collections) {
        if (!Array.isArray(row) || row.length !== R) {
            return `строка collections должна иметь ${R} чисел (по рарностям)`;
        }
    }
    if (!cfg.packs || !Object.keys(cfg.packs).length) {
        return "нет packs";
    }
    for (const name in cfg.packs) {
        if (!(cfg.packs[name].amount > 0)) {
            return `у пака ${name} нет amount`;
        }
        if (!PACK_CSS[name]) {
            return `неизвестный пак ${name} (поддерживаются: ${PACK_ORDER.join(", ")})`;
        }
    }
    if (!Array.isArray(cfg.sources)) {
        return "нет sources";
    }
    for (const s of cfg.sources) {
        if (!s.id || !s.schedule || !s.schedule.type) {
            return "у источника нет id/schedule.type";
        }
        const packLists = [s.packs || [], s.paidPacks || []].concat(s.packsByPlace || []).concat(s.packsByDay || []);
        for (const list of packLists) {
            for (const p of list) {
                if (!cfg.packs[p]) {
                    return `источник ${s.id}: неизвестный пак ${p}`;
                }
            }
        }
    }
    return null;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        DEFAULT_CONFIG,
        PACK_ORDER,
        PACK_CSS,
        WEEKDAYS,
        mulberry32,
        paidIncluded,
        grantedPacks,
        buildSchedule,
        makeBook,
        resetBook,
        rollSticker,
        chooseRarestClosed,
        openPack,
        simulateRun,
        percentile,
        runMonteCarlo,
        validateConfig
    };
}
