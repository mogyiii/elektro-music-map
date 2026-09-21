// Adatellenőrzés: node data/validate.mjs
import { readFileSync } from "node:fs";

const load = (f) => JSON.parse(readFileSync(new URL(f, import.meta.url), "utf8"));
const axes = load("./axes.json");
const { genres } = load("./genres.json");
const edgesFile = load("./edges.json");

const errors = [];
const warn = [];
const err = (m) => errors.push(m);

const ids = new Set();
const rhythmCats = Object.keys(axes.axes.rhythmGrid.categories);
const leadCats = Object.keys(axes.axes.lead.categories);

for (const g of genres) {
  const at = (m) => err(`${g.id ?? "<nincs id>"}: ${m}`);
  if (!g.id) err("van műfaj id nélkül");
  if (ids.has(g.id)) at("duplikált id");
  ids.add(g.id);

  for (const c of g.rhythmGrid ?? []) if (!rhythmCats.includes(c)) at(`ismeretlen rhythmGrid: ${c}`);
  for (const c of g.lead ?? []) if (!leadCats.includes(c)) at(`ismeretlen lead: ${c}`);
  if (!g.rhythmGrid?.length) at("üres rhythmGrid");
  if (!g.lead?.length) at("üres lead");

  const { min, max, felt } = g.tempo ?? {};
  if ((min === null) !== (max === null)) at("a tempo min/max közül csak az egyik null");
  if (min !== null && min > max) at("tempo.min > tempo.max");
  if (min === null && !g.rhythmGrid.includes("none")) at("nincs tempó, de a rács nem 'none'");
  if (felt !== null && !g.rhythmGrid.includes("half-time")) warn.push(`${g.id}: van 'felt' tempó, de a rács nem half-time`);

  if (!(g.density >= 1 && g.density <= 5)) at(`density kívül esik az 1–5 sávon: ${g.density}`);
  if (!(g.function >= 0 && g.function <= 1)) at(`function kívül esik a 0–1 sávon: ${g.function}`);
  if (!(g.change >= 0 && g.change <= 1)) at(`change kívül esik a 0–1 sávon: ${g.change}`);

  if (g.drumPattern === null) {
    if (!g.rhythmGrid.includes("none")) at("nincs dobminta, de a rács nem 'none'");
  } else {
    for (const row of ["kick", "snare", "hat"]) {
      const a = g.drumPattern[row];
      if (!Array.isArray(a) || a.length !== 16) at(`a dobminta '${row}' sora nem 16 hosszú`);
      else if (a.some((v) => v !== 0 && v !== 1)) at(`a dobminta '${row}' sorában nem 0/1 érték van`);
    }
  }
  if (!g.summary) warn.push(`${g.id}: nincs summary`);
  if (!g.examples?.length) warn.push(`${g.id}: nincs hangpélda`);

  // korszakok
  if (g.eras) {
    if (g.eras.length < 2) at("az eras legalább két korszakot tartalmazzon, különben hagyd el");
    if (g.eras[0]?.from !== g.year) at(`az első korszak (${g.eras[0]?.from}) nem a 'year' évében kezdődik (${g.year})`);
    for (let i = 1; i < g.eras.length; i++)
      if (g.eras[i].from <= g.eras[i - 1].from) at(`a korszakok nincsenek időrendben: ${g.eras[i].from}`);

    for (const era of g.eras) {
      for (const c of era.rhythmGrid ?? []) if (!rhythmCats.includes(c)) at(`${era.from}: ismeretlen rhythmGrid: ${c}`);
      for (const c of era.lead ?? []) if (!leadCats.includes(c)) at(`${era.from}: ismeretlen lead: ${c}`);
      if (!(era.density >= 1 && era.density <= 5)) at(`${era.from}: density kívül esik az 1–5 sávon`);
      if (!(era.function >= 0 && era.function <= 1)) at(`${era.from}: function kívül esik a 0–1 sávon`);
      if (!(era.change >= 0 && era.change <= 1)) at(`${era.from}: change kívül esik a 0–1 sávon`);
      if (era.tempo === undefined) at(`${era.from}: hiányzik a tempo`);
    }

    // Az utolsó korszak a mai állapot – egyeznie kell a felső szintű értékekkel,
    // különben két igazság lenne ugyanarra.
    const last = g.eras.at(-1);
    for (const key of ["density", "function", "change"])
      if (last[key] !== g[key]) at(`az utolsó korszak '${key}' értéke (${last[key]}) eltér a mai állapottól (${g[key]})`);
    for (const key of ["rhythmGrid", "lead"])
      if (JSON.stringify(last[key]) !== JSON.stringify(g[key]))
        at(`az utolsó korszak '${key}' értéke eltér a mai állapottól`);
    if (JSON.stringify(last.tempo) !== JSON.stringify(g.tempo))
      at("az utolsó korszak tempója eltér a mai állapottól");
  }
}

// kategória-hasonlósági mátrixok teljessége
for (const [name, ax] of Object.entries(axes.axes)) {
  if (ax.type !== "categorical") continue;
  const cats = Object.keys(ax.categories);
  const seen = new Set(ax.similarity.map(({ a, b }) => [a, b].sort().join("|")));
  for (let i = 0; i < cats.length; i++)
    for (let j = i + 1; j < cats.length; j++) {
      const key = [cats[i], cats[j]].sort().join("|");
      if (!seen.has(key)) err(`axes.${name}: hiányzó hasonlóság: ${cats[i]} ↔ ${cats[j]}`);
    }
  for (const { a, b, value } of ax.similarity) {
    if (!cats.includes(a) || !cats.includes(b)) err(`axes.${name}: ismeretlen kategória a hasonlóságban: ${a}/${b}`);
    if (!(value >= 0 && value <= 1)) err(`axes.${name}: a hasonlóság kívül esik a 0–1 sávon: ${a}/${b} = ${value}`);
  }
}

// élek
const seenEdges = new Set();
for (const e of edgesFile.edges) {
  const label = `${e.from} → ${e.to}`;
  if (!ids.has(e.from)) err(`${label}: ismeretlen 'from'`);
  if (!ids.has(e.to)) err(`${label}: ismeretlen 'to'`);
  if (e.from === e.to) err(`${label}: önmagára mutat`);
  if (!Object.keys(edgesFile.edgeTypes).includes(e.type)) err(`${label}: ismeretlen típus: ${e.type}`);
  const key = `${e.from}|${e.to}`;
  if (seenEdges.has(key)) err(`${label}: duplikált él`);
  seenEdges.add(key);

  const from = genres.find((g) => g.id === e.from);
  const to = genres.find((g) => g.id === e.to);
  if (from && to && from.year > to.year) err(`${label}: a szülő (${from.year}) későbbi, mint a gyerek (${to.year})`);
  if (e.until !== undefined) {
    if (e.type !== "influence") err(`${label}: 'until' csak hatásnál értelmes, itt '${e.type}'`);
    if (e.until <= e.year) err(`${label}: az 'until' (${e.until}) nem későbbi, mint a kezdet (${e.year})`);
  }
  for (const k of ["removed", "moved", "added"])
    if (!Array.isArray(e.changes?.[k])) err(`${label}: a changes.${k} nem tömb`);
  if (!["removed", "moved", "added"].some((k) => e.changes[k].length))
    warn.push(`${label}: üres a changes – nincs leírva az átmenet`);
}

for (const id of Object.keys(edgesFile.missingParents))
  if (!ids.has(id) && id !== "$comment") err(`missingParents: ismeretlen id: ${id}`);

// lóg-e valamelyik műfaj a levegőben
const connected = new Set(edgesFile.edges.flatMap((e) => [e.from, e.to]));
const orphans = [...ids].filter((id) => !connected.has(id));
if (orphans.length) warn.push(`nincs egyetlen élük sem: ${orphans.join(", ")}`);

console.log(`${genres.length} műfaj, ${edgesFile.edges.length} él`);
for (const w of warn) console.log(`  figyelmeztetés – ${w}`);
if (errors.length) {
  for (const e of errors) console.log(`  HIBA – ${e}`);
  process.exit(1);
}
console.log("Nincs hiba.");
