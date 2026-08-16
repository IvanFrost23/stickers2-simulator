/**
 * Stickers2 simulator — UI: controls, charts, tables, timeline.
 * Depends on engine.js (loaded before this file in index.html).
 */

let config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
const disabledSources = new Set();
const segState = { months: 2, player: "free", place: 1 };

function readScenario() {
    return {
        startDate: document.getElementById("startDate").value || "2026-09-01",
        months: segState.months,
        place: segState.place,
        runs: Math.max(10, Math.min(5000, parseInt(document.getElementById("runs").value, 10) || 300)),
        seed: parseInt(document.getElementById("seed").value, 10) || 1,
        paidPasses: segState.player !== "free",
        buyOffers: segState.player === "all",
        restartBook: document.getElementById("restartBook").checked,
        disabledSources
    };
}

// ---------- rendering helpers ----------
const SVG_NS = "http://www.w3.org/2000/svg";
function el(name, attrs, parent) {
    const node = document.createElementNS(SVG_NS, name);
    for (const key in attrs) {
        node.setAttribute(key, attrs[key]);
    }
    if (parent) {
        parent.appendChild(node);
    }
    return node;
}
function div(cls, parent, text) {
    const node = document.createElement("div");
    if (cls) {
        node.className = cls;
    }
    if (text !== undefined) {
        node.textContent = text;
    }
    if (parent) {
        parent.appendChild(node);
    }
    return node;
}
function fmt(x, digits) {
    if (x === null || x === undefined || Number.isNaN(x)) {
        return "—";
    }
    let d = digits;
    if (d === undefined) {
        d = Math.abs(x) < 10 && x % 1 !== 0 ? 1 : 0;
    }
    return x.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: d });
}
function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
const tooltip = document.getElementById("tooltip");
function showTooltip(x, y, title, rows) {
    tooltip.textContent = "";
    const t = document.createElement("div");
    t.className = "t-title";
    t.textContent = title;
    tooltip.appendChild(t);
    rows.forEach((row) => {
        const r = document.createElement("div");
        r.className = "t-row";
        const k = document.createElement("span");
        k.className = "k";
        k.style.background = row.color || "transparent";
        r.appendChild(k);
        const v = document.createElement("span");
        v.className = "v";
        v.textContent = row.value;
        r.appendChild(v);
        const n = document.createElement("span");
        n.className = "n";
        n.textContent = row.label;
        r.appendChild(n);
        tooltip.appendChild(r);
    });
    tooltip.style.display = "block";
    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;
    let left = x + 14;
    if (left + tw > window.innerWidth - 8) {
        left = x - tw - 14;
    }
    let top = y - th - 10;
    if (top < 8) {
        top = y + 14;
    }
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}
function hideTooltip() {
    tooltip.style.display = "none";
}
function fmtDate(date) {
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}
function fmtDateLong(date) {
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}
function plural(n, one, few, many) {
    const m = Math.abs(Math.round(n)) % 100;
    const m1 = m % 10;
    if (m > 10 && m < 20) {
        return many;
    }
    if (m1 > 1 && m1 < 5) {
        return few;
    }
    return m1 === 1 ? one : many;
}

function renderLineChart(container, schedule, series, opts) {
    container.textContent = "";
    const W = opts.width || 640;
    const H = opts.height || 260;
    const pad = {
        l: 40, r: 14, t: 14, b: 28 
    };
    const iw = W - pad.l - pad.r;
    const ih = H - pad.t - pad.b;
    const n = schedule.horizon;
    const rawMax = Math.max(opts.maxY || 0, ...series.flatMap((s) => s.upper || s.values)) * 1.05 || 1;
    const yTicks = 3;
    const tickUnit = rawMax / yTicks < 10 ? 5 : 10;
    const maxY = Math.ceil(rawMax / yTicks / tickUnit) * tickUnit * yTicks;
    const x = (d) => pad.l + d / Math.max(1, n - 1) * iw;
    const y = (v) => pad.t + ih - v / maxY * ih;

    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img" }, container);

    for (let i = 0; i <= yTicks; i++) {
        const v = maxY / yTicks * i;
        const ty = y(v);
        el("line", {
            x1: pad.l, x2: W - pad.r, y1: ty, y2: ty, stroke: "var(--grid)", "stroke-width": 1 
        }, svg);
        const label = el("text", {
            x: pad.l - 8, y: ty + 4, "text-anchor": "end", "font-size": 11, fill: "var(--text-muted)" 
        }, svg);
        label.textContent = fmt(Math.round(v));
    }
    const weekStep = (n > 70 || W < 700 ? 14 : 7) * (n > 70 && W < 700 ? 2 : 1);
    for (let d = 0; d < n; d += weekStep) {
        const label = el("text", {
            x: x(d), y: H - 8, "text-anchor": "middle", "font-size": 11, fill: "var(--text-muted)" 
        }, svg);
        label.textContent = fmtDate(schedule.dateOf(d));
    }
    el("line", {
        x1: pad.l, x2: W - pad.r, y1: pad.t + ih, y2: pad.t + ih, stroke: "var(--baseline)", "stroke-width": 1 
    }, svg);

    (opts.refLines || []).forEach((ref) => {
        if (ref.value <= maxY) {
            const ry = y(ref.value);
            el("line", {
                x1: pad.l, x2: W - pad.r, y1: ry, y2: ry, stroke: "var(--baseline)", "stroke-width": 1 
            }, svg);
            const label = el("text", {
                x: W - pad.r, y: ry - 5, "text-anchor": "end", "font-size": 11, fill: "var(--text-muted)" 
            }, svg);
            label.textContent = ref.label;
        }
    });
    schedule.seasonStarts.forEach((d) => {
        el("line", {
            x1: x(d), x2: x(d), y1: pad.t, y2: pad.t + ih, stroke: "var(--baseline)", "stroke-width": 1 
        }, svg);
        const label = el("text", {
            x: x(d) + 4, y: pad.t + 12, "font-size": 11, fill: "var(--text-muted)" 
        }, svg);
        label.textContent = "новый сезон";
    });
    (opts.markers || []).forEach((m) => {
        el("line", {
            x1: x(m.day), x2: x(m.day), y1: pad.t, y2: pad.t + ih, stroke: m.color, "stroke-width": 1 
        }, svg);
        const label = el("text", {
            x: x(m.day) + 4, y: pad.t + ih - 6, "font-size": 11, fill: "var(--text-secondary)" 
        }, svg);
        label.textContent = m.label;
    });

    series.forEach((s) => {
        if (s.lower && s.upper) {
            let dPath = `M${x(0)} ${y(s.upper[0])}`;
            for (let d = 1; d < n; d++) {
                dPath += ` L${x(d)} ${y(s.upper[d])}`;
            }
            for (let d = n - 1; d >= 0; d--) {
                dPath += ` L${x(d)} ${y(s.lower[d])}`;
            }
            el("path", {
                d: `${dPath} Z`, fill: s.color, opacity: 0.1, stroke: "none" 
            }, svg);
        }
        let dPath = `M${x(0)} ${y(s.values[0])}`;
        for (let d = 1; d < n; d++) {
            dPath += ` L${x(d)} ${y(s.values[d])}`;
        }
        el("path", {
            d: dPath, fill: "none", stroke: s.color, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" 
        }, svg);
        el("circle", {
            cx: x(n - 1), cy: y(s.values[n - 1]), r: 4, fill: s.color, stroke: "var(--surface-1)", "stroke-width": 2 
        }, svg);
        const endLabel = el("text", {
            x: x(n - 1) - 8, y: y(s.values[n - 1]) - 9, "text-anchor": "end", "font-size": 13, "font-weight": 600, fill: "var(--text-primary)" 
        }, svg);
        endLabel.textContent = fmt(s.values[n - 1]);
    });

    const cross = el("line", {
        x1: 0, x2: 0, y1: pad.t, y2: pad.t + ih, stroke: "var(--baseline)", "stroke-width": 1, visibility: "hidden" 
    }, svg);
    const hit = el("rect", {
        x: pad.l, y: pad.t, width: iw, height: ih, fill: "transparent" 
    }, svg);
    hit.addEventListener("pointermove", (e) => {
        const rect = svg.getBoundingClientRect();
        const px = (e.clientX - rect.left) * (W / rect.width);
        const d = Math.max(0, Math.min(n - 1, Math.round((px - pad.l) / iw * (n - 1))));
        cross.setAttribute("x1", x(d));
        cross.setAttribute("x2", x(d));
        cross.setAttribute("visibility", "visible");
        showTooltip(e.clientX, e.clientY, `${fmtDate(schedule.dateOf(d))} · день ${d + 1}`, opts.tooltipRows(d));
    });
    hit.addEventListener("pointerleave", () => {
        cross.setAttribute("visibility", "hidden");
        hideTooltip();
    });
}

function roundedTopBar(x, y, w, h, r) {
    if (h <= 0) {
        return "M0 0";
    }
    r = Math.min(r, w / 2, h);
    return `M${x} ${y + h} L${x} ${y + r} Q${x} ${y} ${x + r} ${y} L${x + w - r} ${y} Q${x + w} ${y} ${x + w} ${y + r} L${x + w} ${y + h} Z`;
}

function renderBars(container, groups, opts) {
    container.textContent = "";
    const W = opts.width || 460;
    const H = opts.height || 220;
    const pad = {
        l: 12, r: 12, t: 18, b: 26 
    };
    const iw = W - pad.l - pad.r;
    const ih = H - pad.t - pad.b;
    const maxV = Math.max(1, ...groups.flatMap((g) => g.bars.map((b) => b.value))) * 1.12;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img" }, container);
    el("line", {
        x1: pad.l, x2: W - pad.r, y1: pad.t + ih, y2: pad.t + ih, stroke: "var(--baseline)", "stroke-width": 1 
    }, svg);
    const gw = iw / groups.length;
    groups.forEach((g, gi) => {
        const nb = g.bars.length;
        const bw = Math.min(24, (gw - 14) / nb - 2);
        const totalW = nb * bw + (nb - 1) * 2;
        const gx = pad.l + gi * gw + (gw - totalW) / 2;
        g.bars.forEach((b, bi) => {
            const h = Math.max(0, b.value / maxV * ih);
            const bx = gx + bi * (bw + 2);
            const by = pad.t + ih - h;
            const rect = el("path", { d: roundedTopBar(bx, by, bw, h, Math.min(4, h)), fill: b.color }, svg);
            const hitR = el("rect", {
                x: bx - 2, y: pad.t, width: bw + 4, height: ih, fill: "transparent" 
            }, svg);
            hitR.addEventListener("pointermove", (e) => {
                rect.setAttribute("opacity", "0.8");
                showTooltip(e.clientX, e.clientY, g.label, [{ color: b.color, value: fmt(b.value, 1), label: b.name }]);
            });
            hitR.addEventListener("pointerleave", () => {
                rect.removeAttribute("opacity");
                hideTooltip();
            });
            if (opts.valueLabels) {
                const label = el("text", {
                    x: bx + bw / 2, y: by - 5, "text-anchor": "middle", "font-size": 11, fill: "var(--text-secondary)" 
                }, svg);
                label.textContent = fmt(b.value, b.value < 10 ? 1 : 0);
            }
        });
        const gLabel = el("text", {
            x: pad.l + gi * gw + gw / 2, y: H - 8, "text-anchor": "middle", "font-size": 12, fill: "var(--text-secondary)" 
        }, svg);
        gLabel.textContent = g.label;
    });
}

function renderTimeline(container, schedule) {
    container.textContent = "";
    const groupOrder = {
        weekly: 0, monthly: 1, rotation: 2, offer: 3 
    };
    const groupColor = {
        weekly: "var(--tl-weekly)", monthly: "var(--tl-monthly)", rotation: "var(--tl-rotation)", offer: "var(--tl-offer)" 
    };
    const bySource = new Map();
    schedule.spans.forEach((span) => {
        if (!bySource.has(span.sourceId)) {
            bySource.set(span.sourceId, []);
        }
        bySource.get(span.sourceId).push(span);
    });
    const rows = [...bySource.entries()].map(([id, spans]) => ({
        id,
        name: (schedule.sources.find((s) => s.id === id) || { name: id }).name,
        spans,
        group: spans[0].group
    })).sort((a, b) => groupOrder[a.group] - groupOrder[b.group] || a.name.localeCompare(b.name));

    const rowH = 24;
    const W = 940;
    const padL = 130;
    const padT = 6;
    const padB = 24;
    const H = padT + rows.length * rowH + padB;
    const iw = W - padL - 14;
    const n = schedule.horizon;
    const x = (d) => padL + d / n * iw;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img" }, container);

    const weekStep = n > 70 ? 14 : 7;
    for (let d = 0; d <= n; d += weekStep) {
        el("line", {
            x1: x(d), x2: x(d), y1: padT, y2: padT + rows.length * rowH, stroke: "var(--grid)", "stroke-width": 1 
        }, svg);
        if (d < n) {
            const label = el("text", {
                x: x(d), y: H - 8, "text-anchor": "middle", "font-size": 11, fill: "var(--text-muted)" 
            }, svg);
            label.textContent = fmtDate(schedule.dateOf(d));
        }
    }
    schedule.seasonStarts.forEach((d) => {
        el("line", {
            x1: x(d), x2: x(d), y1: padT, y2: padT + rows.length * rowH, stroke: "var(--baseline)", "stroke-width": 1.5 
        }, svg);
    });

    const eventsBySourceDay = new Map();
    schedule.events.forEach((evt) => {
        const key = `${evt.sourceId}|${evt.day}`;
        if (!eventsBySourceDay.has(key)) {
            eventsBySourceDay.set(key, []);
        }
        eventsBySourceDay.get(key).push(evt.pack);
    });

    rows.forEach((row, ri) => {
        const cy = padT + ri * rowH + rowH / 2;
        const nameLabel = el("text", {
            x: padL - 8, y: cy + 4, "text-anchor": "end", "font-size": 12, fill: "var(--text-secondary)" 
        }, svg);
        nameLabel.textContent = row.name;
        row.spans.forEach((span) => {
            const rect = el("rect", {
                x: x(span.start),
                y: cy - 7,
                width: Math.max(2, x(span.end) - x(span.start) - 2),
                height: 14,
                rx: 4,
                fill: groupColor[span.group],
                opacity: span.inactive ? 0.25 : 0.75
            }, svg);
            rect.addEventListener("pointermove", (e) => {
                const packs = [];
                for (let d = span.start; d < span.end; d++) {
                    (eventsBySourceDay.get(`${row.id}|${d}`) || []).forEach((p) => packs.push(p));
                }
                const counts = {};
                packs.forEach((p) => {
                    counts[p] = (counts[p] || 0) + 1; 
                });
                const tooltipRows = PACK_ORDER.filter((p) => counts[p]).map((p) => ({ color: css(PACK_CSS[p]), value: `×${counts[p]}`, label: `${p} Pack` }));
                showTooltip(
                    e.clientX, 
                    e.clientY,
                    `${row.name} · ${fmtDate(schedule.dateOf(span.start))} – ${fmtDate(schedule.dateOf(span.end - 1))}`,
                    tooltipRows.length ? tooltipRows : [{ value: "", label: span.inactive ? "паки не покупаются в этом сценарии" : "без паков" }]
                );
            });
            rect.addEventListener("pointerleave", hideTooltip);
        });
        for (let d = 0; d < n; d++) {
            const packs = eventsBySourceDay.get(`${row.id}|${d}`);
            if (packs) {
                packs.slice(0, 3).forEach((p, pi) => {
                    el("circle", {
                        cx: x(d + 0.5), cy: cy - 4 + pi * 4, r: 2.6, fill: css(PACK_CSS[p]), stroke: "var(--surface-1)", "stroke-width": 1 
                    }, svg);
                });
            }
        }
    });
}

// ---------- hero + sources ----------
function renderHero(cfg, scenario, schedule, agg) {
    const H = schedule.horizon;
    const poolTotal = cfg.collections.reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0);
    const withRestart = scenario.restartBook && cfg.season && cfg.season.canRestart;

    const verdict = document.getElementById("verdict");
    const heroNum = document.getElementById("heroNum");
    const heroSub = document.getElementById("heroSub");
    const heroText = document.getElementById("heroText");
    verdict.textContent = "";
    const dot = document.createElement("span");
    dot.className = "dot";
    const vLabel = document.createElement("span");

    const sentences = [];
    const totalPacks = PACK_ORDER.reduce((s, p) => s + (agg.packCounts[p] || 0), 0);
    sentences.push(`За ${H} ${plural(H, "день", "дня", "дней")} игрок получает ${
        fmt(totalPacks)} ${plural(totalPacks, "пак", "пака", "паков")
    } — это ${fmt(agg.totalCards)} ${plural(agg.totalCards, "карта", "карты", "карт")}.`);

    if (agg.bookDonePct >= 0.5) {
        const day = agg.bookDoneP50;
        const pct = (day + 1) / H;
        heroNum.textContent = `${day + 1}-й день`;
        heroSub.textContent = `из ${H} — к ${fmtDateLong(schedule.dateOf(day))} собраны все ${poolTotal} стикеров книги`;
        if (pct <= 0.7) {
            dot.style.background = css("--status-warn");
            vLabel.textContent = `Книга закрывается рано — за ${Math.round(pct * 100)}% периода`;
        } else {
            dot.style.background = css("--status-good");
            vLabel.textContent = "Книга закрывается к концу периода";
        }
        sentences.push(`Все ${poolTotal} стикеров собраны в среднем к ${fmtDateLong(schedule.dateOf(day))} (разброс: день ${agg.bookDoneP10 + 1}–${agg.bookDoneP90 + 1}).`);
        if (withRestart) {
            const secondBook = Math.round(agg.meanNew[H - 1]) - poolTotal;
            if (secondBook > 0 && schedule.seasonStarts.length === 0) {
                sentences.push(`Дальше книга рестартует: до конца периода игрок добирает ещё ~${fmt(secondBook)} ${plural(secondBook, "стикер", "стикера", "стикеров")} второй книги.`);
            }
        }
        if (agg.wastedPacks > 0.5) {
            sentences.push(`~${fmt(agg.wastedPacks, 0)} ${plural(agg.wastedPacks, "пак выпадает", "пака выпадают", "паков выпадают")} уже после полного сбора — впустую.`);
        }
    } else {
        heroNum.textContent = `${fmt(agg.meanNew[H - 1], 0)} из ${poolTotal}`;
        heroSub.textContent = "стикеров книги собрано к концу периода (в среднем)";
        dot.style.background = css("--status-bad");
        vLabel.textContent = "Книга не закрывается за период";
        sentences.push(`До полного сбора не хватает в среднем ${fmt(Math.max(0, poolTotal - agg.meanNew[H - 1]), 0)} стикеров.`);
    }
    verdict.appendChild(dot);
    verdict.appendChild(vLabel);
    heroText.textContent = sentences.join(" ");

    const mini = document.getElementById("miniStats");
    mini.textContent = "";
    const dupPct = agg.totalCards ? agg.totalDup / agg.totalCards * 100 : 0;
    [
        { v: fmt(totalPacks), l: "паков" },
        { v: fmt(agg.totalCards), l: "карт" },
        { v: `${fmt(dupPct, 0)}%`, l: "дубликаты" },
        { v: fmt(agg.points), l: "очков за дубли" }
    ].forEach((item) => {
        const ms = div("ms", mini);
        div("v", ms, item.v);
        div("l", ms, item.l);
    });

    const accent = css("--accent") || "#2a78d6";
    const markers = [];
    if (agg.bookDonePct >= 0.5) {
        markers.push({ day: agg.bookDoneP50, color: css("--status-good"), label: "книга собрана" });
    }
    renderLineChart(
        document.getElementById("uniqChart"), 
        schedule,
        [{
            values: agg.meanNew, lower: agg.p10New, upper: agg.p90New, color: accent 
        }],
        {
            width: 640,
            height: 280,
            refLines: [{ value: poolTotal, label: `вся книга (${poolTotal})` }],
            markers,
            tooltipRows: (d) => [
                { color: accent, value: fmt(agg.meanNew[d], 1), label: "собрано (среднее)" },
                { value: `${fmt(agg.p10New[d])} – ${fmt(agg.p90New[d])}`, label: "разброс прогонов" },
                { value: `${fmt(agg.meanColl[d], 1)} из ${config.collections.length}`, label: "коллекций закрыто" }
            ]
        }
    );
}

function renderSources(agg, schedule, scenario) {
    const box = document.getElementById("sourcesRows");
    box.textContent = "";
    const rows = schedule.sources
        .map((s) => ({ s, d: agg.perSource[s.id] }))
        .filter((r) => r.d && r.d.packs > 0)
        .sort((a, b) => b.d.new - a.d.new);
    if (!rows.length) {
        div("", box, "Нет источников паков в этом сценарии.");
        return;
    }
    const maxNew = Math.max(...rows.map((r) => r.d.new), 1);
    const head = div("src-head", box);
    div("", head, "Фича");
    div("", head, "Новых стикеров (среднее)");
    div("", head, "Паков → карт");
    rows.forEach((r) => {
        const row = div("src-row", box);
        const name = div("src-name", row);
        name.appendChild(document.createTextNode(`${r.s.name} `));
        if (paidIncluded(r.s, scenario)) {
            const paid = document.createElement("span");
            paid.className = "paid";
            paid.textContent = "· платное";
            name.appendChild(paid);
        }
        const track = div("src-track", row);
        const fill = div("src-fill", track);
        fill.style.width = `${Math.max(1.5, r.d.new / maxNew * 100)}%`;
        const val = div("src-val", row);
        const b = document.createElement("b");
        b.textContent = fmt(r.d.new, 1);
        val.appendChild(b);
        const rest = document.createElement("span");
        rest.textContent = `  ·  ${fmt(r.d.packs)} → ${fmt(r.d.cards)}`;
        val.appendChild(rest);
        const packsOfSource = {};
        schedule.events.forEach((evt) => {
            if (evt.sourceId === r.s.id) {
                packsOfSource[evt.pack] = (packsOfSource[evt.pack] || 0) + 1;
            }
        });
        const chips = div("src-chips", box);
        PACK_ORDER.filter((p) => packsOfSource[p]).forEach((p) => {
            const chip = document.createElement("span");
            chip.className = "chip";
            const sq = document.createElement("span");
            sq.className = "sq";
            sq.style.background = css(PACK_CSS[p]);
            chip.appendChild(sq);
            chip.appendChild(document.createTextNode(`${p} ×${packsOfSource[p]}`));
            chips.appendChild(chip);
        });
    });
}

function renderUniqTable(agg, schedule) {
    const holder = document.getElementById("uniqTable");
    holder.textContent = "";
    const table = document.createElement("table");
    table.className = "data";
    const head = table.createTHead().insertRow();
    ["Неделя", "Дата", "Уникальных (ср.)", "разброс", "Коллекций (ср.)"].forEach((h) => {
        const th = document.createElement("th");
        th.textContent = h;
        head.appendChild(th);
    });
    const body = table.createTBody();
    for (let d = 6; d < schedule.horizon; d += 7) {
        const tr = body.insertRow();
        tr.insertCell().textContent = `нед. ${Math.ceil((d + 1) / 7)}`;
        tr.insertCell().textContent = fmtDate(schedule.dateOf(d));
        tr.insertCell().textContent = fmt(agg.meanNew[d], 1);
        tr.insertCell().textContent = `${fmt(agg.p10New[d])} – ${fmt(agg.p90New[d])}`;
        tr.insertCell().textContent = fmt(agg.meanColl[d], 1);
    }
    holder.appendChild(table);
}

function renderAll(cfg, scenario, schedule, agg) {
    renderHero(cfg, scenario, schedule, agg);
    renderSources(agg, schedule, scenario);
    const accent = css("--accent") || "#2a78d6";
    const deemph = css("--deemph") || "#b6b5ae";
    renderBars(
        document.getElementById("packsChart"),
        PACK_ORDER.map((p) => ({
            label: p,
            bars: [{ name: `${p} Pack`, value: agg.packCounts[p] || 0, color: css(PACK_CSS[p]) }]
        })),
        { width: 440, height: 210, valueLabels: true }
    );
    renderBars(
        document.getElementById("rarityChart"),
        cfg.rarities.names.map((name, r) => ({
            label: name,
            bars: [
                { name: "новые", value: agg.newByRarity[r], color: accent },
                { name: "дубликаты", value: agg.dupByRarity[r], color: deemph }
            ]
        })),
        { width: 440, height: 210, valueLabels: true }
    );
    renderUniqTable(agg, schedule);
    renderTimeline(document.getElementById("timeline"), schedule);
}

function run() {
    const scenario = readScenario();
    const schedule = buildSchedule(config, scenario);
    const agg = runMonteCarlo(config, scenario, schedule);
    renderAll(config, scenario, schedule, agg);
}

// ---------- segmented controls ----------
function buildSeg(id, options, current, onPick) {
    const seg = document.getElementById(id);
    seg.textContent = "";
    options.forEach((opt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = opt.label;
        if (opt.value === current) {
            btn.className = "on";
        }
        btn.addEventListener("click", () => {
            [...seg.children].forEach((c) => {
                c.className = ""; 
            });
            btn.className = "on";
            onPick(opt.value);
            run();
        });
        seg.appendChild(btn);
    });
}

function buildSegs() {
    buildSeg("periodSeg", [
        { value: 1, label: "1 мес" },
        { value: 2, label: "2 мес" },
        { value: 3, label: "3 мес" }
    ], segState.months, (v) => {
        segState.months = v; 
    });
    buildSeg("playerSeg", [
        { value: "free", label: "Бесплатный" },
        { value: "passes", label: "С пассами" },
        { value: "all", label: "Платит всё" }
    ], segState.player, (v) => {
        segState.player = v; 
    });
    buildSeg("placeSeg", [
        { value: 1, label: "1-е" },
        { value: 2, label: "2-е" },
        { value: 3, label: "3-е" }
    ], segState.place, (v) => {
        segState.place = v; 
    });
}

// ---------- config UI ----------
function refreshCfgText() {
    document.getElementById("cfgText").value = JSON.stringify(config, null, 4);
}

function buildSourceChecks() {
    const box = document.getElementById("sourceChecks");
    box.textContent = "";
    config.sources.forEach((s) => {
        if (s.schedule.type === "rotation" && !(s.packs && s.packs.length) && !s.paidPacks && !s.packsByPlace) {
            return;
        }
        const label = document.createElement("label");
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = !disabledSources.has(s.id) && s.enabled !== false;
        cb.addEventListener("change", () => {
            if (cb.checked) {
                disabledSources.delete(s.id);
            } else {
                disabledSources.add(s.id);
            }
            run();
        });
        label.appendChild(cb);
        label.appendChild(document.createTextNode(s.name));
        box.appendChild(label);
    });
}

function buildQuickEdit() {
    const box = document.getElementById("quickEdit");
    box.textContent = "";
    const probGrp = document.createElement("div");
    probGrp.className = "grp";
    const probTitle = document.createElement("b");
    probTitle.textContent = "Вероятности рарностей (все паки)";
    probGrp.appendChild(probTitle);
    config.rarities.dropProbabilities.forEach((p, r) => {
        const row = document.createElement("div");
        row.className = "row";
        const name = document.createElement("span");
        name.textContent = config.rarities.names[r] || `r${r}`;
        const input = document.createElement("input");
        input.type = "number";
        input.step = "0.005";
        input.min = "0";
        input.value = p;
        input.addEventListener("change", () => {
            config.rarities.dropProbabilities[r] = parseFloat(input.value) || 0;
            refreshCfgText();
            run();
        });
        row.appendChild(name);
        row.appendChild(input);
        probGrp.appendChild(row);
    });
    box.appendChild(probGrp);

    const amtGrp = document.createElement("div");
    amtGrp.className = "grp";
    const amtTitle = document.createElement("b");
    amtTitle.textContent = "Карт в паке";
    amtGrp.appendChild(amtTitle);
    PACK_ORDER.filter((p) => config.packs[p]).forEach((p) => {
        const row = document.createElement("div");
        row.className = "row";
        const name = document.createElement("span");
        name.textContent = p;
        const input = document.createElement("input");
        input.type = "number";
        input.min = "1";
        input.step = "1";
        input.value = config.packs[p].amount;
        input.addEventListener("change", () => {
            config.packs[p].amount = Math.max(1, parseInt(input.value, 10) || 1);
            refreshCfgText();
            run();
        });
        row.appendChild(name);
        row.appendChild(input);
        amtGrp.appendChild(row);
    });
    box.appendChild(amtGrp);
}

function applyConfig(newCfg) {
    const err = validateConfig(newCfg);
    const errEl = document.getElementById("cfgError");
    if (err) {
        errEl.textContent = `Ошибка конфига: ${err}`;
        return false;
    }
    errEl.textContent = "";
    config = newCfg;
    refreshCfgText();
    buildSourceChecks();
    buildQuickEdit();
    return true;
}

// ---------- main ----------
["startDate", "runs", "seed", "restartBook"].forEach((id) => {
    document.getElementById(id).addEventListener("change", run);
});
document.getElementById("cfgApply").addEventListener("click", () => {
    try {
        const parsed = JSON.parse(document.getElementById("cfgText").value);
        if (applyConfig(parsed)) {
            run();
        }
    } catch (e) {
        document.getElementById("cfgError").textContent = `JSON не парсится: ${e.message}`;
    }
});
document.getElementById("cfgReset").addEventListener("click", () => {
    disabledSources.clear();
    applyConfig(JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
    run();
});
document.getElementById("cfgDownload").addEventListener("click", () => {
    const json = JSON.stringify(config, null, 4);
    const browserDownload = () => {
        const blob = new Blob([json], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "stickers2-config.json";
        a.click();
        URL.revokeObjectURL(a.href);
    };
    if (typeof claude !== "undefined" && claude.use) {
        claude.use("downloads").then((downloads) => {
            if (!downloads) {
                browserDownload();
                return;
            }
            downloads.save({ filename: "stickers2-config.json", data: json }).catch((e) => {
                if (e && e.code !== "declined") {
                    document.getElementById("cfgError").textContent = `Не удалось сохранить: ${e.message || e.code || e}`;
                }
            });
        });
        return;
    }
    browserDownload();
});
document.getElementById("cfgFile").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const parsed = JSON.parse(reader.result);
            if (applyConfig(parsed)) {
                run();
            }
        } catch (err) {
            document.getElementById("cfgError").textContent = `JSON не парсится: ${err.message}`;
        }
    };
    reader.readAsText(file);
    e.target.value = "";
});

const themeBtn = document.getElementById("themeBtn");
const themeStates = ["", "light", "dark"];
const themeNames = { "": "авто", light: "светлая", dark: "тёмная" };
let themeIdx = 0;
themeBtn.addEventListener("click", () => {
    themeIdx = (themeIdx + 1) % 3;
    const t = themeStates[themeIdx];
    if (t) {
        document.documentElement.setAttribute("data-theme", t);
    } else {
        document.documentElement.removeAttribute("data-theme");
    }
    themeBtn.textContent = `Тема: ${themeNames[t]}`;
    run();
});
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (!themeStates[themeIdx]) {
        run();
    }
});

buildSegs();
applyConfig(config);
run();
