// Az adatlap: műfaj-kártya és rés-kártya. Mindkét nézet ezt használja.

import { describeMidpoint, numericValue } from "./similarity.js";

const KIND_LABEL = { removed: "elvéve", moved: "áthelyezve", added: "hozzáadva" };
const EDGE_KIND = { parent: "szülő", influence: "hatás" };
const DRUM_ROWS = [["kick", "lábdob"], ["snare", "pergő"], ["hat", "hi-hat"]];

/** A "változás" tengely szavakban. 0 = végig ugyanaz, 1 = szinte semmi nem ismétlődik. */
export function changeWords(v) {
  if (v <= 0.15) return "végig ugyanaz";
  if (v <= 0.35) return "keveset változik";
  if (v <= 0.55) return "mérsékelten változik";
  if (v <= 0.78) return "sokat változik";
  return "szinte semmi nem ismétlődik";
}

export function readableValue(genre, key, axes, useFeltTempo = false) {
  if (key === "tempo") {
    const { min, max, felt } = genre.tempo;
    if (min === null) return "nincs ütem";
    const base = min === max ? `${min} BPM` : `${min}–${max} BPM`;
    return felt === null ? base : `${base} (${felt}-nek hat)`;
  }
  if (key === "density") return `${genre.density} / 5`;
  if (key === "function") {
    const v = genre.function;
    if (v >= 0.9) return "tánc";
    if (v <= 0.1) return "hallgatás";
    return v >= 0.5 ? "inkább tánc" : "inkább hallgatás";
  }
  if (key === "change") return changeWords(genre.change);
  return genre[key].map((c) => axes[key].categories[c]).join(" + ");
}

/** Műfaj adatlapja. */
export function genreCard(genre, ctx) {
  const { axes, edges, byId } = ctx;
  const out = [
    `<h2>${genre.name}</h2>`,
    `<p class="year">${genre.year}-től</p>`,
    `<p class="summary">${genre.summary}</p>`,
    `<h3>Jellemzők</h3>`,
    propsHTML(genre, axes),
  ];

  if (ctx.era?.absent) {
    out.push(
      `<h3>${ctx.era.year}-ben</h3>`,
      `<p class="empty">Ekkor még nem létezett – ${ctx.era.start}-től van a térképen.</p>`
    );
  } else if (ctx.era) {
    out.push(`<h3>${ctx.era.year}-ben</h3>`, eraHTML(genre, ctx.era, axes));
  }
  if (genre.notes) out.push(`<h3>Megjegyzés</h3><p class="note">${genre.notes}</p>`);
  if (ctx.neighbours?.length) {
    out.push(`<h3>Legközelebbi szomszédok</h3>`, neighboursHTML(ctx.neighbours));
  }

  out.push(`<h3>Dobrács</h3>`, drumHTML(genre));
  out.push(`<h3>Rokon műfajok</h3>`, relationsHTML(genre, edges, byId));
  out.push(
    `<h3>Hangpélda</h3>`,
    genre.examples.length
      ? `<ul class="examples">${genre.examples.map((x) => `<li>${x.title}</li>`).join("")}</ul>`
      : `<p class="empty">Még nincs felvéve.</p>`
  );

  return out.join("");
}

/** Hiányzó rés adatlapja: mi kerülne a két műfaj közé. */
export function gapCard(gap, ctx) {
  const rows = describeMidpoint(gap.a, gap.b, ctx.axes, ctx.useFeltTempo);

  return `
    <h2 class="gap-title">Üres hely</h2>
    <p class="year">
      <button class="rel-link inline" data-id="${gap.a.id}">${gap.a.name}</button>
      és
      <button class="rel-link inline" data-id="${gap.b.id}">${gap.b.name}</button>
      között
    </p>
    <p class="summary">
      Ez a két műfaj közel van egymáshoz, de a köztük lévő hely üres –
      egyetlen felvett műfaj sem esik közéjük. ${
        gap.linked
          ? "Származási szál köti össze őket, tehát az egyikből lett a másik, ugrásszerűen."
          : "Származási szál sem köti össze őket."
      }
    </p>

    <h3>Mi kerülne ide</h3>
    <dl class="props">${rows.map((r) => `<dt>${r.label}</dt><dd>${r.value}</dd>`).join("")}</dl>
    <p class="note">
      A két műfaj számtani közepe. Nem recept, hanem kiindulópont – és lehet,
      hogy épp azért üres, mert zeneileg nem működik.
    </p>

    <h3>Számok</h3>
    <dl class="props">
      <dt>Távolság</dt><dd>${gap.distance.toFixed(3)} (0 = azonos, 1 = maximálisan más)</dd>
      <dt>Legközelebbi</dt><dd>${
        gap.nearest
          ? `${gap.nearest.name} – ${Math.round(gap.clearance * 100)}%-kal hosszabb úton`
          : "—"
      }</dd>
    </dl>
    <p class="note">
      A „legközelebbi" az a műfaj, amelyik a leginkább a kettő közé esik. Ha rajta
      keresztül is jóval hosszabb az út, akkor tényleg nincs köztük semmi.
    </p>
  `;
}

/** Az adott évben érvényes korszak, és amiben eltér a mai állapottól. */
function eraHTML(genre, era, axes) {
  const rows = Object.keys(axes)
    .map((key) => {
      const now = readableValue(genre, key, axes);
      const then = readableValue(era, key, axes);
      return then === now ? null : `<dt>${axes[key].label}</dt><dd>${then}</dd>`;
    })
    .filter(Boolean);

  const head = era.label
    ? `<p class="era-label">${era.label} korszak (${era.from}-től)</p>`
    : `<p class="era-label">${era.from}-től</p>`;

  return (
    head +
    (rows.length
      ? `<dl class="props">${rows.join("")}</dl>
         <p class="note">Csak az van itt, ami akkor más volt, mint ma.</p>`
      : `<p class="empty">Ekkor még ugyanaz volt, mint ma.</p>`) +
    (era.note ? `<p class="note">${era.note}</p>` : "")
  );
}

function propsHTML(genre, axes) {
  const rows = Object.keys(axes).map(
    (key) => `<dt>${axes[key].label}</dt><dd>${readableValue(genre, key, axes)}</dd>`
  );
  if (genre.externalInfluences.length) {
    rows.push(`<dt>Külső hatás</dt><dd>${genre.externalInfluences.join(", ")}</dd>`);
  }
  return `<dl class="props">${rows.join("")}</dl>`;
}

function neighboursHTML(list) {
  const items = list
    .map(
      ({ genre, distance, linked }) => `
      <li>
        <button class="rel-link" data-id="${genre.id}">${genre.name}</button>
        <span class="nb-dist">${distance.toFixed(3)}</span>
        ${linked ? "" : `<span class="nb-flag">nincs szál</span>`}
      </li>`
    )
    .join("");
  return `<ul class="neighbours">${items}</ul>
    <p class="note">Hangzás szerinti közelség. Ahol nincs szál, ott a hasonlóság nem
    leszármazásból jön – két külön ágon jutottak ugyanoda.</p>`;
}

function drumHTML(genre) {
  if (!genre.drumPattern) return `<p class="empty">Nincs ütem.</p>`;
  const body = DRUM_ROWS.map(([key, name]) => {
    const steps = genre.drumPattern[key]
      .map((v, i) => `<span class="step${v ? " on" : ""}${i % 4 === 0 ? " beat" : ""}"></span>`)
      .join("");
    return `<div class="drum-row"><span class="name">${name}</span><span class="drum-steps">${steps}</span></div>`;
  }).join("");
  return `<div class="drum">${body}</div>
    <p class="drum-caption">Egy ütem, 16 lépés. Vázlatos, és még nem szól.</p>`;
}

function relationsHTML(genre, edges, byId) {
  const items = [];

  for (const e of edges) {
    const incoming = e.to === genre.id;
    if (!incoming && e.from !== genre.id) continue;

    const other = byId.get(incoming ? e.from : e.to);
    const span =
      e.type === "influence" && e.until !== undefined ? ` ${e.year}–${e.until}` : "";
    const dir = incoming
      ? `ebből – ${EDGE_KIND[e.type]}${span}`
      : `ez lett belőle – ${EDGE_KIND[e.type]}${span}`;
    const changes = ["removed", "moved", "added"]
      .flatMap((k) =>
        e.changes[k].map(
          (t) => `<li><span class="kind ${k}">${KIND_LABEL[k]}</span><span>${t}</span></li>`
        )
      )
      .join("");

    items.push(`
      <div class="rel-item kind-${e.type}">
        <div class="rel-head">
          <button class="rel-link" data-id="${other.id}">${other.name}</button>
          <span class="rel-kind">${dir}</span>
        </div>
        ${changes ? `<ul class="changes">${changes}</ul>` : ""}
        ${e.note ? `<p class="rel-note">${e.note}</p>` : ""}
      </div>`);
  }

  return items.length
    ? `<div class="rel">${items.join("")}</div>`
    : `<p class="empty">Nincs felvett kapcsolata.</p>`;
}

export { numericValue };
