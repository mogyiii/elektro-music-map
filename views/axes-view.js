// Tengelyes nézet: bármelyik két tengely X-nek és Y-nak.

import { dodgeLabels, labelWidth, LABEL_HEIGHT } from "../lib/layout.js";

const PLOT_PAD = 6;        // százalék: hely a szélső pontok címkéinek
const COMPACT_WIDTH = 480; // ez alatt a térkép pixelszélessége alatt csak pontok
const DOT_ONLY_W = 20;
const DOT_OFFSET_PX = 6;

export function createAxesView(ctx) {
  const { axes, genres, root, controls, onSelect } = ctx;
  let selected = null;

  root.innerHTML = `
    <div class="plot-frame">
      <div class="axis-label axis-label-y" data-y></div>
      <div class="plot" data-plot>
        <div class="ticks ticks-x" data-ticks-x></div>
        <div class="ticks ticks-y" data-ticks-y></div>
        <div class="points" data-points></div>
      </div>
      <div class="axis-label axis-label-x" data-x></div>
    </div>
    <div class="offscale" data-offscale hidden>
      <span class="offscale-title">Nincs értéke ezen a tengelyen:</span>
      <span data-offscale-list></span>
    </div>`;

  const q = (sel) => root.querySelector(sel);
  const el = {
    plot: q("[data-plot]"),
    points: q("[data-points]"),
    ticksX: q("[data-ticks-x]"),
    ticksY: q("[data-ticks-y]"),
    labelX: q("[data-x]"),
    labelY: q("[data-y]"),
    offscale: q("[data-offscale]"),
    offscaleList: q("[data-offscale-list]"),
  };

  controls.innerHTML = `
    <label><span>Vízszintes</span><select data-axis-x></select></label>
    <label><span>Függőleges</span><select data-axis-y></select></label>
    <label class="check" data-felt-wrap>
      <input type="checkbox" data-felt><span>érzett tempó</span>
    </label>`;

  const axisX = controls.querySelector("[data-axis-x]");
  const axisY = controls.querySelector("[data-axis-y]");
  const felt = controls.querySelector("[data-felt]");
  const feltWrap = controls.querySelector("[data-felt-wrap]");

  for (const [key, axis] of Object.entries(axes)) {
    axisX.append(new Option(axis.label, key));
    axisY.append(new Option(axis.label, key));
  }
  axisX.value = "tempo";
  axisY.value = "rhythmGrid";

  for (const node of [axisX, axisY, felt]) node.addEventListener("change", render);

  // ---------- tengelyértékek ----------

  function rawValue(genre, key) {
    const axis = axes[key];
    if (axis.type === "numeric") {
      if (key !== "tempo") return genre[key] ?? null;
      const { min, max, felt: f } = genre.tempo;
      if (min === null) return null;
      return felt.checked && f !== null ? f : (min + max) / 2;
    }
    // Kategóriánál a sorrend a tengely. Több érték: ha szomszédosak, közéjük;
    // ha nem, a főértékre – a köztük lévő hely mást jelentene.
    const order = Object.keys(axis.categories);
    const idx = genre[key].map((c) => order.indexOf(c)).filter((i) => i >= 0);
    if (!idx.length) return null;
    const adjacent = Math.max(...idx) - Math.min(...idx) <= 1;
    return adjacent ? idx.reduce((s, i) => s + i, 0) / idx.length : idx[0];
  }

  function buildScale(key, visible) {
    const axis = axes[key];
    if (axis.type === "categorical") {
      const order = Object.keys(axis.categories);
      return {
        min: -0.5,
        max: order.length - 0.5,
        ticks: order.map((c, i) => ({ at: i, label: axis.categories[c] })),
      };
    }

    const vals = visible.map((g) => rawValue(g, key)).filter((v) => v !== null);
    let lo = vals.length ? Math.min(...vals) : 0;
    let hi = vals.length ? Math.max(...vals) : 1;
    if (lo === hi) { lo -= 1; hi += 1; }
    const pad = (hi - lo) * 0.1;
    lo -= pad;
    hi += pad;

    let candidates;
    if (key === "function") {
      candidates = [
        { at: 0, label: "hallgatás" },
        { at: 0.5, label: "vegyes" },
        { at: 1, label: "tánc" },
      ];
    } else if (key === "change") {
      candidates = [
        { at: 0, label: "végig ugyanaz" },
        { at: 0.5, label: "változik" },
        { at: 1, label: "nem ismétlődik" },
      ];
    } else if (key === "density") {
      candidates = [1, 2, 3, 4, 5].map((v) => ({ at: v, label: String(v) }));
    } else {
      candidates = niceTicks(lo, hi).map((v) => ({ at: v, label: String(v) }));
    }
    return { min: lo, max: hi, ticks: candidates.filter((t) => t.at >= lo && t.at <= hi) };
  }

  // ---------- kirajzolás ----------

  function render() {
    const keyX = axisX.value;
    const keyY = axisY.value;
    feltWrap.hidden = keyX !== "tempo" && keyY !== "tempo";

    const onMap = [];
    const offMap = [];
    for (const g of genres) {
      const missing = rawValue(g, keyX) === null || rawValue(g, keyY) === null;
      (missing ? offMap : onMap).push(g);
    }

    const sx = buildScale(keyX, onMap);
    const sy = buildScale(keyY, onMap);
    const toPct = (v, s) => PLOT_PAD + ((v - s.min) / (s.max - s.min)) * (100 - 2 * PLOT_PAD);

    el.labelX.textContent = axes[keyX].label;
    el.labelY.textContent = axes[keyY].label;
    el.ticksX.replaceChildren(...sx.ticks.flatMap((t) => tickNodes(toPct(t.at, sx), t.label, "x")));
    el.ticksY.replaceChildren(...sy.ticks.flatMap((t) => tickNodes(100 - toPct(t.at, sy), t.label, "y")));

    const width = el.plot.clientWidth;
    const height = el.plot.clientHeight;
    if (width < 10 || height < 10) return;

    // Szűk térképen a címkék annyira ellöknék egymást, hogy a pontok már nem
    // a valódi helyükön állnának. Ilyenkor csak a pontok látszanak, a név koppintásra.
    const compact = width < COMPACT_WIDTH;
    el.points.classList.toggle("compact", compact);

    const items = onMap.map((g, i) => {
      const x = (toPct(rawValue(g, keyX), sx) / 100) * width;
      const y = ((100 - toPct(rawValue(g, keyY), sy)) / 100) * height;
      return {
        genre: g,
        x: x - DOT_OFFSET_PX,
        y,
        w: compact ? DOT_ONLY_W : labelWidth(g.name, 18),
        h: LABEL_HEIGHT,
        multi: isMultiValued(g, keyX, keyY),
        i,
      };
    });

    const placed = dodgeLabels(items, {
      width,
      height,
      padX: (PLOT_PAD / 200) * width,
    });

    el.points.replaceChildren(
      ...placed.map((p) => pointNode(p, width, height, onSelect))
    );

    el.offscale.hidden = offMap.length === 0;
    el.offscaleList.replaceChildren(...offMap.map((g) => chipNode(g, onSelect)));
    setSelected(selected);
  }

  function isMultiValued(genre, keyX, keyY) {
    return [keyX, keyY].some((k) => axes[k].type === "categorical" && genre[k].length > 1);
  }

  function setSelected(id) {
    selected = id;
    for (const node of el.points.children) {
      node.classList.toggle("selected", node.dataset.id === id);
    }
    for (const node of el.offscaleList.children) {
      node.classList.toggle("selected", node.dataset.id === id);
    }
  }

  // A méret a fülváltáskor és az ablak átméretezésekor is változik.
  new ResizeObserver(() => render()).observe(el.plot);

  return { render, setSelected };
}

// ---------- apró építőelemek ----------

function tickNodes(pct, label, orient) {
  const line = document.createElement("div");
  line.className = `gridline gridline-${orient}`;
  const text = document.createElement("div");
  text.className = "tick";
  text.textContent = label;
  const prop = orient === "x" ? "left" : "top";
  line.style[prop] = `${pct}%`;
  text.style[prop] = `${pct}%`;
  return [line, text];
}

function pointNode(p, width, height, onSelect) {
  const b = document.createElement("button");
  b.className = "point";
  b.dataset.id = p.genre.id;
  b.style.left = `${((p.x + 6) / width) * 100}%`;
  b.style.top = `${(p.y / height) * 100}%`;
  b.append(
    Object.assign(document.createElement("span"), {
      className: p.multi ? "dot multi" : "dot",
    })
  );
  b.append(
    Object.assign(document.createElement("span"), {
      className: "label",
      textContent: p.genre.name,
    })
  );
  b.title = p.multi
    ? `${p.genre.name} – több értéke is van ezen a tengelyen, lásd az adatlapot`
    : p.genre.name;
  b.addEventListener("click", () => onSelect(p.genre.id));
  return b;
}

function chipNode(genre, onSelect) {
  const b = document.createElement("button");
  b.className = "offscale-chip";
  b.dataset.id = genre.id;
  b.textContent = genre.name;
  b.addEventListener("click", () => onSelect(genre.id));
  return b;
}

function niceTicks(lo, hi) {
  const rough = (hi - lo) / 5;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= rough) ?? mag * 10;
  const out = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
    out.push(Math.round(v * 100) / 100);
  }
  return out;
}
