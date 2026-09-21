// Csillagtérkép: a pozíciót az összes tulajdonság együtt adja.
// Ami hangzásban hasonló, az közel kerül – a származástól függetlenül.
// Az évcsúszkával a műfajok a saját pályájuk mentén mozognak.

import { createMetric, findGaps } from "../lib/similarity.js";
import { embed, stress } from "../lib/mds.js";
import { dodgeLabels, labelWidth, LABEL_HEIGHT, fitUniform } from "../lib/layout.js";
import {
  buildSnapshots, buildPaths, positionAt, trailUpTo,
  stateAt, existsAt, firstYear, erasOf,
} from "../lib/timeline.js";

const FIT_PAD = 30;
const COMPACT_WIDTH = 480;
const LABEL_OFFSET = 10;
const NS = "http://www.w3.org/2000/svg";

// Egy újrarajzolás mérve 10–24 ms, ezért kb. 30 képkocka/mp a reális felső határ.
// A lejátszás folyamatosan csúsztatja az évet, nem egészekben lépked – így lassú
// sebességnél is sima a mozgás.
const FRAME_MS = 33;
const MAX_FRAME_GAP_MS = 100;
const SPEEDS = [1, 2, 4, 8, 16]; // év / másodperc
const DEFAULT_SPEED = 4;

export function createStarView(ctx) {
  const { axesFile, genres, edges, root, controls, onSelect, onSelectGap, onYearChange } = ctx;
  const axes = axesFile.axes;

  const linkSet = new Set(edges.flatMap((e) => [`${e.from}|${e.to}`, `${e.to}|${e.from}`]));
  const isLinked = (a, b) => linkSet.has(`${a}|${b}`);

  const startYear = firstYear(genres);
  const endYear = Math.max(
    new Date().getFullYear(),
    ...genres.flatMap((g) => erasOf(g).map((e) => e.from))
  );

  const weights = Object.fromEntries(Object.entries(axes).map(([k, a]) => [k, a.weight]));
  let useFeltTempo = axesFile.similarity.useFeltTempo ?? false;
  let showEdges = true;
  let showGaps = true;
  let showTrails = true;
  let onlyUnlinkedGaps = false;
  let year = endYear;
  let selected = null;
  let selectedGap = null;
  let layout = null;   // beágyazás – csak súly/tempó változásra számolódik újra
  let atYear = null;   // az adott évre vonatkozó rések, állapotok
  let playTimer = null;
  let speed = DEFAULT_SPEED;
  let shownYear = null; // az adatlapon épp látható év

  root.innerHTML = `
    <div class="star" data-star>
      <svg class="star-lines" data-svg></svg>
      <div class="points" data-points></div>
    </div>
    <div class="timebar">
      <button type="button" class="play" data-play aria-label="Lejátszás">▶</button>
      <input type="range" class="year-slider" data-year>
      <label class="speed">
        <select data-speed>
          ${SPEEDS.map(
            (s) => `<option value="${s}"${s === DEFAULT_SPEED ? " selected" : ""}>${s} év/mp</option>`
          ).join("")}
        </select>
      </label>
      <span class="year-readout" data-year-out></span>
    </div>
    <div class="legend">
      <span class="key"><i class="swatch sw-parent"></i>ebből lett</span>
      <span class="key"><i class="swatch sw-influence"></i>hatott rá</span>
      <span class="key"><i class="swatch sw-influence sw-past"></i>hatott rá, de már nem</span>
      <span class="key"><i class="swatch sw-gap"></i>üres hely köztük</span>
      <span class="key"><i class="swatch sw-trail"></i>merre tart</span>
    </div>
    <p class="star-footer" data-footer></p>`;

  const el = {
    star: root.querySelector("[data-star]"),
    svg: root.querySelector("[data-svg]"),
    points: root.querySelector("[data-points]"),
    footer: root.querySelector("[data-footer]"),
    play: root.querySelector("[data-play]"),
    slider: root.querySelector("[data-year]"),
    speed: root.querySelector("[data-speed]"),
    yearOut: root.querySelector("[data-year-out]"),
  };

  el.slider.min = startYear;
  el.slider.max = endYear;
  // tört lépés, hogy a csúszka fogantyúja is folyamatosan mozogjon lejátszás közben
  el.slider.step = 0.25;
  el.slider.value = year;

  controls.innerHTML = `
    <label class="check"><input type="checkbox" data-edges checked><span>származási szálak</span></label>
    <label class="check"><input type="checkbox" data-gaps checked><span>hiányzó rések</span></label>
    <label class="check"><input type="checkbox" data-unlinked><span>csak rokonság nélküli rések</span></label>
    <label class="check"><input type="checkbox" data-trails checked><span>nyomvonalak</span></label>
    <label class="check"><input type="checkbox" data-felt><span>érzett tempó</span></label>
    <details class="weights">
      <summary>Tengelysúlyok</summary>
      <div class="weight-rows">
        ${Object.entries(axes)
          .map(
            ([key, axis]) => `
          <label class="weight-row">
            <span class="weight-name">${axis.label}</span>
            <input type="range" min="0" max="2" step="0.1" value="${axis.weight}" data-weight="${key}">
            <span class="weight-value" data-weight-value="${key}">${axis.weight.toFixed(1)}</span>
          </label>`
          )
          .join("")}
        <button type="button" class="weight-reset" data-reset>Alapértékek</button>
      </div>
    </details>`;

  const bind = (sel, fn) => {
    const node = controls.querySelector(sel);
    node.addEventListener("change", () => fn(node.checked));
    return node;
  };

  bind("[data-edges]", (v) => { showEdges = v; draw(); });
  bind("[data-gaps]", (v) => { showGaps = v; draw(); });
  bind("[data-trails]", (v) => { showTrails = v; draw(); });
  bind("[data-unlinked]", (v) => { onlyUnlinkedGaps = v; draw(); });
  bind("[data-felt]", (v) => { useFeltTempo = v; rebuild(); });

  for (const slider of controls.querySelectorAll("[data-weight]")) {
    slider.addEventListener("input", () => {
      const key = slider.dataset.weight;
      weights[key] = Number(slider.value);
      controls.querySelector(`[data-weight-value="${key}"]`).textContent = weights[key].toFixed(1);
      rebuild();
    });
  }

  controls.querySelector("[data-reset]").addEventListener("click", () => {
    for (const [key, axis] of Object.entries(axes)) {
      weights[key] = axis.weight;
      controls.querySelector(`[data-weight="${key}"]`).value = axis.weight;
      controls.querySelector(`[data-weight-value="${key}"]`).textContent = axis.weight.toFixed(1);
    }
    rebuild();
  });

  el.slider.addEventListener("input", () => {
    year = Number(el.slider.value);
    stop();
    draw();
  });

  el.play.addEventListener("click", () => (playTimer ? stop() : play()));
  el.speed.addEventListener("change", () => (speed = Number(el.speed.value)));

  function play() {
    if (year >= endYear) year = startYear;
    el.play.textContent = "❚❚";

    let last = performance.now();
    let since = FRAME_MS; // az első képkocka azonnal jöjjön

    const tick = (now) => {
      if (!playTimer) return;
      // Rejtett fülön a böngésző leállítja a képkockákat. Amikor visszatérsz,
      // az eltelt idő több másodperc is lehet – korlátozás nélkül az évek
      // ilyenkor egyetlen ugrással előreszaladnának.
      const dt = Math.min(now - last, MAX_FRAME_GAP_MS);
      last = now;
      since += dt;

      year = Math.min(endYear, year + (dt / 1000) * speed);

      if (year >= endYear) {
        stop();
        el.slider.value = year;
        draw();
        return;
      }
      if (since >= FRAME_MS) {
        since = 0;
        el.slider.value = year;
        draw();
      }
      playTimer = requestAnimationFrame(tick);
    };

    playTimer = requestAnimationFrame(tick);
  }

  function stop() {
    if (playTimer) cancelAnimationFrame(playTimer);
    playTimer = null;
    el.play.textContent = "▶";
  }

  // ---------- beágyazás (drága, ritkán fut) ----------

  function rebuild() {
    const metric = createMetric(axes, axesFile.similarity, { weights, useFeltTempo });
    const { snapshots, bounds } = buildSnapshots(genres);
    const D = metric.matrix(snapshots);
    const coords = embed(D);
    layout = {
      metric,
      snapshots,
      bounds,
      coords,
      stress: stress(D, coords),
      moving: genres.filter((g) => erasOf(g).length > 1).length,
    };
    draw();
  }

  /** Az adott évben érvényes állapotok, és a belőlük számolt rések. */
  function computeYear() {
    const live = genres.filter((g) => existsAt(g, year));
    const states = live.map((g) => ({ ...stateAt(g, year), id: g.id, name: g.name }));
    const D = layout.metric.matrix(states);
    let gaps = findGaps(states, D, axesFile.gaps, isLinked);
    if (onlyUnlinkedGaps) gaps = gaps.filter((g) => !g.linked);
    return { live, states, D, gaps };
  }

  // ---------- kirajzolás ----------

  function draw() {
    if (!layout) return;
    const width = el.star.clientWidth;
    const height = el.star.clientHeight;
    if (width < 10 || height < 10) return;

    atYear = computeYear();
    // az év lejátszás közben tört szám, kiírni és az adatlapon használni kerekítve kell
    const shown = Math.round(year);
    el.yearOut.textContent = year >= endYear ? `${shown} · ma` : shown;

    const fitted = fitUniform(
      layout.coords.map((p) => [p[0], p[1]]),
      { width, height, pad: FIT_PAD }
    );
    const paths = buildPaths(genres, layout.snapshots, layout.bounds, fitted);
    const compact = width < COMPACT_WIDTH;
    el.points.classList.toggle("compact", compact);

    const here = new Map();
    for (const genre of genres) {
      const pos = positionAt(paths.get(genre.id), year);
      if (pos) here.set(genre.id, pos);
    }

    const placed = dodgeLabels(
      [...here.entries()].map(([id, pos], i) => {
        const genre = genres.find((g) => g.id === id);
        const w = compact ? 18 : labelWidth(genre.name);
        const flip = pos.x + LABEL_OFFSET + w > width - 4;
        return {
          genre,
          anchorX: pos.x,
          anchorY: pos.y,
          x: flip ? pos.x - LABEL_OFFSET - w : pos.x + LABEL_OFFSET,
          y: pos.y,
          w,
          h: LABEL_HEIGHT,
          flip,
          i,
        };
      }),
      {
        width,
        height,
        padX: 2,
        verticalOnly: true,
        obstacles: [...here.values()].map((p) => ({ x: p.x, y: p.y, r: 7 })),
      }
    );

    drawLines(placed, paths, compact, width, height);
    drawLabels(placed, width, height);

    const movingNow = [...here.values()].filter((p) => p.moving).length;
    el.footer.textContent =
      `${here.size} műfaj ${shown}-ben · ${atYear.gaps.length} rés · ` +
      `${movingNow} épp mozgásban · torzítás ${layout.stress.toFixed(2)} ` +
      `(${Object.keys(axes).length} tengely 2 dimenzióba vetítve – ` +
      `a képernyőn látott távolság közelítés)`;

    highlight();

    // Az adatlap az adott évre vonatkozik, tehát év változásakor újra kell rajzolni –
    // de csak ha a kerekített év tényleg más, különben lejátszás közben minden
    // képkockán újraépülne a panel.
    if (shownYear !== shown) {
      shownYear = shown;
      onYearChange?.();
    }
  }

  const byName = (id) => genres.find((g) => g.id === id)?.name ?? id;

  function line(x1, y1, x2, y2, cls) {
    const node = document.createElementNS(NS, "line");
    node.setAttribute("x1", x1);
    node.setAttribute("y1", y1);
    node.setAttribute("x2", x2);
    node.setAttribute("y2", y2);
    node.setAttribute("class", cls);
    return node;
  }

  function drawLines(placed, paths, compact, width, height) {
    el.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    el.svg.setAttribute("preserveAspectRatio", "none");
    el.svg.replaceChildren(arrowDefs());

    const at = new Map(placed.map((p) => [p.genre.id, p]));

    // nyomvonalak: honnan jött és merre tart a műfaj
    if (showTrails) {
      for (const genre of genres) {
        const trail = trailUpTo(paths.get(genre.id), year);
        if (trail.length < 2) continue;

        const poly = document.createElementNS(NS, "polyline");
        poly.setAttribute("points", trail.map((p) => `${p.x},${p.y}`).join(" "));
        poly.setAttribute("class", "trail");
        poly.dataset.id = genre.id;
        el.svg.append(poly);

        // nyílhegy a pálya végére – ez a "merre tart"
        const [prev, head] = [trail.at(-2), trail.at(-1)];
        if (Math.hypot(head.x - prev.x, head.y - prev.y) > 8) {
          const arrow = line(prev.x, prev.y, head.x, head.y, "trail-head");
          arrow.setAttribute("marker-end", "url(#arrowhead)");
          arrow.dataset.id = genre.id;
          el.svg.append(arrow);
        }
      }
    }

    if (showEdges) {
      for (const e of edges) {
        const a = at.get(e.from);
        const b = at.get(e.to);
        if (!a || !b) continue;        // az egyik még nem létezik ebben az évben
        if (year < e.year) continue;   // a kapcsolat még nem jött létre

        // A leszármazás végleges. A hatás lehet időszakos: az 'until' után
        // halvány nyomként marad, mert megtörtént, de már nem eleven.
        const expired = e.type === "influence" && e.until !== undefined && year > e.until;
        const node = line(
          a.anchorX, a.anchorY, b.anchorX, b.anchorY,
          `lineage lineage-${e.type}${expired ? " expired" : ""}`
        );
        node.dataset.from = e.from;
        node.dataset.to = e.to;

        const title = document.createElementNS(NS, "title");
        const span = e.until === undefined ? `${e.year}-től` : `${e.year}–${e.until}`;
        title.textContent =
          `${byName(e.from)} → ${byName(e.to)} · ` +
          (e.type === "parent" ? "szülő" : `hatás, ${span}${expired ? " (már nem eleven)" : ""}`);
        node.append(title);

        el.svg.append(node);
      }
    }

    if (showGaps) {
      for (const gap of atYear.gaps) {
        const a = at.get(gap.a.id);
        const b = at.get(gap.b.id);
        if (!a || !b) continue;

        const visible = line(a.anchorX, a.anchorY, b.anchorX, b.anchorY,
          `gap${gap.linked ? " gap-linked" : ""}`);
        visible.dataset.gap = gap.id;

        // vastag, átlátszó vonal a könnyebb eltalálásért
        const hit = line(a.anchorX, a.anchorY, b.anchorX, b.anchorY, "gap-hit");
        const title = document.createElementNS(NS, "title");
        title.textContent = `Üres hely: ${gap.a.name} ↔ ${gap.b.name}`;
        hit.append(title);
        hit.addEventListener("click", () => onSelectGap(gap));

        el.svg.append(visible, hit);
      }
    }

    // vezetővonal oda, ahol a címke elcsúszott a pontjától
    if (!compact) {
      for (const p of placed) {
        if (Math.abs(p.y - p.anchorY) < 6) continue;
        el.svg.append(
          line(p.anchorX, p.anchorY, p.flip ? p.x + p.w + 2 : p.x - 2, p.y, "leader")
        );
      }
    }

    // a pontocskák a VALÓDI helyükön – a címke csúszhat, a pont nem
    for (const p of placed) {
      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("cx", p.anchorX);
      dot.setAttribute("cy", p.anchorY);
      dot.setAttribute("r", 4);
      dot.setAttribute("class", "star-dot");
      dot.dataset.id = p.genre.id;
      dot.addEventListener("click", () => onSelect(p.genre.id));
      const title = document.createElementNS(NS, "title");
      title.textContent = p.genre.name;
      dot.append(title);
      el.svg.append(dot);
    }
  }

  function arrowDefs() {
    const defs = document.createElementNS(NS, "defs");
    const marker = document.createElementNS(NS, "marker");
    marker.setAttribute("id", "arrowhead");
    marker.setAttribute("viewBox", "0 0 8 8");
    marker.setAttribute("refX", "7");
    marker.setAttribute("refY", "4");
    marker.setAttribute("markerWidth", "6");
    marker.setAttribute("markerHeight", "6");
    marker.setAttribute("orient", "auto-start-reverse");
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", "M0,0 L8,4 L0,8 z");
    path.setAttribute("class", "arrowhead");
    marker.append(path);
    defs.append(marker);
    return defs;
  }

  function drawLabels(placed, width, height) {
    el.points.replaceChildren(
      ...placed.map((p) => {
        const b = document.createElement("button");
        b.className = "star-label";
        b.dataset.id = p.genre.id;
        b.style.left = `${(p.x / width) * 100}%`;
        b.style.top = `${(p.y / height) * 100}%`;
        b.textContent = p.genre.name;
        b.title = p.genre.name;
        b.addEventListener("click", () => onSelect(p.genre.id));
        return b;
      })
    );
  }

  // ---------- kiemelés ----------

  function highlight() {
    for (const node of el.points.children) {
      node.classList.toggle("selected", node.dataset.id === selected);
    }
    for (const dot of el.svg.querySelectorAll(".star-dot")) {
      dot.classList.toggle("selected", dot.dataset.id === selected);
    }
    for (const node of el.svg.querySelectorAll(".trail, .trail-head")) {
      node.classList.toggle("active", node.dataset.id === selected);
    }
    for (const node of el.svg.querySelectorAll(".lineage")) {
      const touches = node.dataset.from === selected || node.dataset.to === selected;
      node.classList.toggle("active", Boolean(selected) && touches);
      node.classList.toggle("faded", Boolean(selected) && !touches);
    }
    for (const node of el.svg.querySelectorAll(".gap")) {
      node.classList.toggle("active", node.dataset.gap === selectedGap);
    }
  }

  function setSelected(id, gapId = null) {
    selected = id;
    selectedGap = gapId;
    highlight();
  }

  /** A kiválasztott műfaj legközelebbi szomszédai az adott évben – az adatlapra. */
  function neighboursOf(id, count = 4) {
    if (!atYear) return [];
    const i = atYear.states.findIndex((s) => s.id === id);
    if (i < 0) return [];
    return atYear.states
      .map((s, j) => ({ genre: genres.find((g) => g.id === s.id), distance: atYear.D[i][j], j }))
      .filter((x) => x.j !== i)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, count)
      .map((x) => ({ ...x, linked: isLinked(id, x.genre.id) }));
  }

  /** Az adott évben érvényes korszak – az adatlapra. */
  function eraOf(id) {
    const genre = genres.find((g) => g.id === id);
    if (!genre) return null;
    const shown = Math.round(year);
    if (!existsAt(genre, year)) {
      return { absent: true, year: shown, start: erasOf(genre)[0].from };
    }
    const era = stateAt(genre, year);
    return erasOf(genre).length > 1 ? { ...era, year: shown } : null;
  }

  new ResizeObserver(() => draw()).observe(el.star);

  return {
    render: () => (layout ? draw() : rebuild()),
    setSelected,
    neighboursOf,
    eraOf,
    get useFeltTempo() { return useFeltTempo; },
    get year() { return year; },
  };
}
