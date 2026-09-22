// Az adatlap: műfaj-kártya és rés-kártya. Mindkét nézet ezt használja.

import { describeMidpoint, numericValue } from "./similarity.js";
import { t, eraLabel } from "./i18n.js";

const CHANGE_KINDS = ["removed", "moved", "added"];
const DRUM_ROWS = ["kick", "snare", "hat"];

/** A "változás" tengely szavakban. 0 = végig ugyanaz, 1 = szinte semmi nem ismétlődik. */
export function changeWords(v) {
  if (v <= 0.15) return t("value.change.same");
  if (v <= 0.35) return t("value.change.little");
  if (v <= 0.55) return t("value.change.moderate");
  if (v <= 0.78) return t("value.change.much");
  return t("value.change.never");
}

export function readableValue(genre, key, axes, useFeltTempo = false) {
  if (key === "tempo") {
    const { min, max, felt } = genre.tempo;
    if (min === null) return t("value.noBeat");
    const base = min === max ? `${min} BPM` : `${min}–${max} BPM`;
    return felt === null ? base : t("value.felt", { base, felt });
  }
  if (key === "density") return `${genre.density} / 5`;
  if (key === "function") {
    const v = genre.function;
    if (v >= 0.9) return t("value.function.dance");
    if (v <= 0.1) return t("value.function.listening");
    return v >= 0.5 ? t("value.function.moreDance") : t("value.function.moreListening");
  }
  if (key === "change") return changeWords(genre.change);
  return genre[key].map((c) => axes[key].categories[c]).join(" + ");
}

/** Műfaj adatlapja. */
export function genreCard(genre, ctx) {
  const { axes, edges, byId } = ctx;
  const out = [
    `<h2>${genre.name}</h2>`,
    `<p class="year">${t("detail.fromYear", { year: genre.year })}</p>`,
    `<p class="summary">${genre.summary}</p>`,
    `<h3>${t("detail.h.props")}</h3>`,
    propsHTML(genre, axes),
  ];

  if (ctx.era?.absent) {
    out.push(
      `<h3>${t("detail.inYear", { year: ctx.era.year })}</h3>`,
      `<p class="empty">${t("detail.absent", { start: ctx.era.start })}</p>`
    );
  } else if (ctx.era) {
    out.push(`<h3>${t("detail.inYear", { year: ctx.era.year })}</h3>`, eraHTML(genre, ctx.era, axes));
  }
  if (genre.notes) {
    out.push(`<h3>${t("detail.h.note")}</h3><p class="note">${genre.notes}</p>`);
  }
  if (ctx.neighbours?.length) {
    out.push(`<h3>${t("detail.h.neighbours")}</h3>`, neighboursHTML(ctx.neighbours));
  }

  out.push(`<h3>${t("detail.h.drum")}</h3>`, drumHTML(genre));
  out.push(`<h3>${t("detail.h.relations")}</h3>`, relationsHTML(genre, edges, byId));
  out.push(
    `<h3>${t("detail.h.examples")}</h3>`,
    genre.examples.length
      ? `<ul class="examples">${genre.examples.map((x) => `<li>${x.title}</li>`).join("")}</ul>`
      : `<p class="empty">${t("detail.examples.none")}</p>`
  );

  return out.join("");
}

/** Hiányzó rés adatlapja: mi kerülne a két műfaj közé. */
export function gapCard(gap, ctx) {
  const rows = describeMidpoint(gap.a, gap.b, ctx.axes, ctx.useFeltTempo);

  const link = (g) => `<button class="rel-link inline" data-id="${g.id}">${g.name}</button>`;

  return `
    <h2 class="gap-title">${t("gap.title")}</h2>
    <p class="year">${t("gap.between", { a: link(gap.a), b: link(gap.b) })}</p>
    <p class="summary">
      ${t("gap.summary")} ${gap.linked ? t("gap.linked") : t("gap.unlinked")}
    </p>

    <h3>${t("gap.h.what")}</h3>
    <dl class="props">${rows.map((r) => `<dt>${r.label}</dt><dd>${r.value}</dd>`).join("")}</dl>
    <p class="note">${t("gap.what.note")}</p>

    <h3>${t("gap.h.numbers")}</h3>
    <dl class="props">
      <dt>${t("gap.distance")}</dt>
      <dd>${gap.distance.toFixed(3)} ${t("gap.distance.scale")}</dd>
      <dt>${t("gap.nearest")}</dt><dd>${
        gap.nearest
          ? t("gap.nearest.value", {
              name: gap.nearest.name,
              percent: Math.round(gap.clearance * 100),
            })
          : "—"
      }</dd>
    </dl>
    <p class="note">${t("gap.nearest.note")}</p>
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
    ? `<p class="era-label">${t("detail.era.labelled", {
        label: eraLabel(era.label),
        from: era.from,
      })}</p>`
    : `<p class="era-label">${t("detail.era.plain", { from: era.from })}</p>`;

  return (
    head +
    (rows.length
      ? `<dl class="props">${rows.join("")}</dl>
         <p class="note">${t("detail.era.onlyDiff")}</p>`
      : `<p class="empty">${t("detail.era.same")}</p>`) +
    (era.note ? `<p class="note">${era.note}</p>` : "")
  );
}

function propsHTML(genre, axes) {
  const rows = Object.keys(axes).map(
    (key) => `<dt>${axes[key].label}</dt><dd>${readableValue(genre, key, axes)}</dd>`
  );
  if (genre.externalInfluences.length) {
    rows.push(
      `<dt>${t("detail.props.outside")}</dt><dd>${genre.externalInfluences.join(", ")}</dd>`
    );
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
        ${linked ? "" : `<span class="nb-flag">${t("detail.neighbours.nolink")}</span>`}
      </li>`
    )
    .join("");
  return `<ul class="neighbours">${items}</ul>
    <p class="note">${t("detail.neighbours.note")}</p>`;
}

function drumHTML(genre) {
  if (!genre.drumPattern) return `<p class="empty">${t("detail.drum.none")}</p>`;
  const body = DRUM_ROWS.map((key) => {
    const steps = genre.drumPattern[key]
      .map((v, i) => `<span class="step${v ? " on" : ""}${i % 4 === 0 ? " beat" : ""}"></span>`)
      .join("");
    const name = t(`detail.drum.${key}`);
    return `<div class="drum-row"><span class="name">${name}</span><span class="drum-steps">${steps}</span></div>`;
  }).join("");
  return `<div class="drum">${body}</div>
    <p class="drum-caption">${t("detail.drum.caption")}</p>`;
}

function relationsHTML(genre, edges, byId) {
  const items = [];

  for (const e of edges) {
    const incoming = e.to === genre.id;
    if (!incoming && e.from !== genre.id) continue;

    const other = byId.get(incoming ? e.from : e.to);
    const span =
      e.type === "influence" && e.until !== undefined ? ` ${e.year}–${e.until}` : "";
    const kind = t(`detail.edgeKind.${e.type}`);
    const dir = t(incoming ? "detail.rel.incoming" : "detail.rel.outgoing", { kind, span });
    const changes = CHANGE_KINDS.flatMap((k) =>
      e.changes[k].map(
        (text) =>
          `<li><span class="kind ${k}">${t(`detail.change.${k}`)}</span><span>${text}</span></li>`
      )
    ).join("");

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
    : `<p class="empty">${t("detail.rel.none")}</p>`;
}

export { numericValue };
