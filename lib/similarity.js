// Műfajok közti távolság és a hiányzó rések keresése.
// Minden itteni számítás az EREDETI tulajdonságvektorokon fut, nem a kirajzolt
// koordinátákon – a csillagtérkép 2D vetület, abból hamis rések jönnének ki.

import { t } from "./i18n.js";

// ---------- tengelyértékek ----------

export function numericValue(genre, key, useFeltTempo) {
  if (key !== "tempo") {
    // Hiányzó mező sose váljon NaN-ná: az elrontaná az egész távolságmátrixot,
    // és a térkép egyetlen pontba omlana össze, minden hibaüzenet nélkül.
    if (genre[key] === undefined) {
      warnMissing(genre, key);
      return null;
    }
    return genre[key];
  }
  const { min, max, felt } = genre.tempo ?? {};
  if (min === undefined) {
    warnMissing(genre, "tempo");
    return null;
  }
  if (min === null) return null;
  return useFeltTempo && felt !== null ? felt : (min + max) / 2;
}

const warned = new Set();
function warnMissing(genre, key) {
  const id = genre.id ?? genre.genreId ?? genre.name ?? "?";
  if (warned.has(`${id}|${key}`)) return;
  warned.add(`${id}|${key}`);
  console.error(`Hiányzó tengelyérték: '${key}' a(z) '${id}' bejegyzésben – kimarad a számításból.`);
}

function categorySimilarity(axis) {
  const table = new Map();
  for (const { a, b, value } of axis.similarity) {
    table.set(`${a}|${b}`, value);
    table.set(`${b}|${a}`, value);
  }
  return (x, y) => (x === y ? 1 : table.get(`${x}|${y}`) ?? 0);
}

// Több értéknél a szabály az axes.json-ból jön: 'max' = a legjobb egyezés számít.
function multiSimilarity(sim, valsA, valsB, rule) {
  const all = valsA.flatMap((x) => valsB.map((y) => sim(x, y)));
  if (!all.length) return 0;
  if (rule === "mean") return all.reduce((s, v) => s + v, 0) / all.length;
  return Math.max(...all);
}

// ---------- távolság ----------

/**
 * @param axesConfig  az axes.json `axes` blokkja
 * @param simConfig   az axes.json `similarity` blokkja
 * @param opts.weights          tengelysúly-felülírás (a csúszkákhoz)
 * @param opts.useFeltTempo     half-time műfajoknál az érzett tempó számítson-e
 */
export function createMetric(axesConfig, simConfig, opts = {}) {
  const keys = Object.keys(axesConfig);
  const weights = Object.fromEntries(
    keys.map((k) => [k, opts.weights?.[k] ?? axesConfig[k].weight])
  );
  const useFeltTempo = opts.useFeltTempo ?? simConfig.useFeltTempo ?? false;
  const multiRule = simConfig.multiValueRule ?? "max";

  const catSim = Object.fromEntries(
    keys.filter((k) => axesConfig[k].type === "categorical")
      .map((k) => [k, categorySimilarity(axesConfig[k])])
  );

  // Tengelyenkénti, 0–1 közé normált eltérés. null = ezen a tengelyen nem
  // összehasonlítható a két műfaj, ilyenkor a tengely kimarad és a súlyok
  // újranormálódnak (axes.json: missingAxisRule).
  function axisDelta(a, b, key) {
    const axis = axesConfig[key];
    if (axis.type === "numeric") {
      const va = numericValue(a, key, useFeltTempo);
      const vb = numericValue(b, key, useFeltTempo);
      if (va === null || vb === null) return null;
      const span = axis.range[1] - axis.range[0];
      return Math.abs(va - vb) / span;
    }
    return 1 - multiSimilarity(catSim[key], a[key], b[key], multiRule);
  }

  function distance(a, b) {
    let sum = 0;
    let used = 0;
    for (const key of keys) {
      const w = weights[key];
      if (!w) continue;
      const d = axisDelta(a, b, key);
      if (d === null) continue;
      sum += w * d;
      used += w;
    }
    return used ? sum / used : 0;
  }

  // Melyik tengely mennyivel járul hozzá a távolsághoz – az adatlapra.
  function breakdown(a, b) {
    const rows = [];
    let used = 0;
    for (const key of keys) {
      const w = weights[key];
      const d = w ? axisDelta(a, b, key) : null;
      if (d !== null && w) used += w;
      rows.push({ key, label: axesConfig[key].label, delta: d, weight: w });
    }
    return rows.map((r) => ({
      ...r,
      share: r.delta === null || !used ? null : (r.weight * r.delta) / used,
    }));
  }

  function matrix(genres) {
    const n = genres.length;
    const D = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        D[i][j] = D[j][i] = distance(genres[i], genres[j]);
      }
    }
    return D;
  }

  return { distance, breakdown, matrix, weights, useFeltTempo, keys };
}

// ---------- hiányzó rések ----------

/**
 * Két műfaj közt akkor van rés, ha közel vannak egymáshoz, de a köztük lévő hely üres.
 *
 * "Közte van" mérése háromszög-egyenlőtlenséggel: a k műfaj akkor esik i és j közé,
 * ha d(i,k) + d(k,j) alig több, mint d(i,j). A különbség (a kitérő hossza) a
 * tisztaság mértéke – ha minden k-ra nagy, a szakasz üres.
 */
export function findGaps(genres, D, cfg, isLinked = () => false) {
  const n = genres.length;
  const found = [];

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dij = D[i][j];
      // Túl közel: nem fér be semmi. Túl messze: a "közte" nem jelent semmit.
      if (dij < cfg.minPairDistance || dij > cfg.maxPairDistance) continue;

      let detour = Infinity;
      let nearest = null;
      for (let k = 0; k < n; k++) {
        if (k === i || k === j) continue;
        const via = D[i][k] + D[k][j] - dij;
        if (via < detour) {
          detour = via;
          nearest = k;
        }
      }
      const ratio = detour / dij;
      if (ratio < cfg.minClearanceRatio) continue;

      found.push({
        id: `${genres[i].id}~${genres[j].id}`,
        a: genres[i],
        b: genres[j],
        distance: dij,
        clearance: ratio,
        nearest: nearest === null ? null : genres[nearest],
        linked: isLinked(genres[i].id, genres[j].id),
        // Nagy rés = tág is, üres is. A kitérőt korlátozzuk, hogy egy
        // magányos műfaj ne nyomja el az összes többi rést.
        score: dij * Math.min(ratio, 2),
      });
    }
  }

  found.sort((x, y) => y.score - x.score);
  return found.slice(0, cfg.maxLines);
}

// ---------- mi kerülne a résbe ----------

const FUNCTION_WORDS = [
  [0.1, "listening"],
  [0.4, "moreListening"],
  [0.6, "mixed"],
  [0.9, "moreDance"],
  [1.01, "dance"],
];

const CHANGE_WORDS = [
  [0.15, "same"],
  [0.35, "little"],
  [0.55, "moderate"],
  [0.78, "much"],
  [1.01, "never"],
];

/** A szakasz közepének tengelyértékei – ez a "recept" a hiányzó stílushoz. */
export function describeMidpoint(a, b, axesConfig, useFeltTempo = false) {
  const rows = [];

  for (const [key, axis] of Object.entries(axesConfig)) {
    if (axis.type === "numeric") {
      const va = numericValue(a, key, useFeltTempo);
      const vb = numericValue(b, key, useFeltTempo);
      if (va === null || vb === null) {
        rows.push({ label: axis.label, value: "—" });
        continue;
      }
      const mid = (va + vb) / 2;
      if (key === "tempo") {
        rows.push({ label: axis.label, value: `~${Math.round(mid)} BPM` });
      } else if (key === "function") {
        const word = FUNCTION_WORDS.find(([limit]) => mid < limit)[1];
        rows.push({ label: axis.label, value: t(`value.function.${word}`) });
      } else if (key === "change") {
        const word = CHANGE_WORDS.find(([limit]) => mid < limit)[1];
        rows.push({ label: axis.label, value: t(`value.change.${word}`) });
      } else {
        rows.push({ label: axis.label, value: `~${Math.round(mid * 2) / 2}` });
      }
      continue;
    }

    const namesA = a[key].map((c) => axis.categories[c]);
    const namesB = b[key].map((c) => axis.categories[c]);
    const same = namesA.length === namesB.length && namesA.every((x) => namesB.includes(x));
    rows.push({
      label: axis.label,
      value: same
        ? namesA.join(" + ")
        : t("gap.midpoint.between", { a: namesA.join("/"), b: namesB.join("/") }),
    });
  }

  return rows;
}
