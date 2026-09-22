// Pontok halmaza köré rajzolt lágy folt: konvex burok, kifelé párnázva, simítva.
// A csillagtérképen ez keríti körbe egy műfajcsalád tagjait.

/** Konvex burok, Andrew-féle monoton lánccal. Az egy egyenesre eső pontok kiesnek. */
export function convexHull(points) {
  if (points.length < 3) return [...points];
  const p = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const chain = (src) => {
    const out = [];
    for (const pt of src) {
      while (out.length >= 2 && cross(out.at(-2), out.at(-1), pt) <= 0) out.pop();
      out.push(pt);
    }
    out.pop();
    return out;
  };

  const hull = [...chain(p), ...chain([...p].reverse())];
  return hull.length >= 3 ? hull : twoExtremes(p);
}

/** Ha a burok elfajult (egy pont, vagy minden pont egy egyenesen), a két végpont. */
function twoExtremes(sorted) {
  return sorted.length < 2 ? [...sorted] : [sorted[0], sorted.at(-1)];
}

/**
 * SVG path a pontok köré, `pad` pixel ráhagyással.
 *
 * Minden pontot előbb egy kis rombusszá tágítunk. Így egyetlen pontnál, két
 * pontnál és egy egyenesre eső pontoknál sem fajul el a burok – nem kell rájuk
 * külön ág, ami a leggyakoribb forrása az önmagát metsző alakzatnak.
 *
 * A burok csúcsait utána sugárirányban toljuk kifelé, az élek felezőpontjait
 * pedig a saját normálisuk mentén: e nélkül a simítás hosszúkás alakzatoknál
 * visszavágna a szélső pontokra.
 *
 * @returns path-adat, vagy null, ha nincs mit rajzolni
 */
export function blobPath(points, pad) {
  if (!points.length) return null;

  const r = pad / 2;
  const hull = convexHull(
    points.flatMap((p) => [
      { x: p.x - r, y: p.y },
      { x: p.x + r, y: p.y },
      { x: p.x, y: p.y - r },
      { x: p.x, y: p.y + r },
    ])
  );
  if (hull.length < 3) return circlePath(points[0], pad);

  const mid = centroid(hull);
  const out = [];

  for (let i = 0; i < hull.length; i++) {
    const v = hull[i];
    const next = hull[(i + 1) % hull.length];
    // a rombuszok már adtak r ráhagyást, itt jön a másik fele
    out.push(push(v, v.x - mid.x, v.y - mid.y, r));

    // az él felezőpontja a normálisa mentén, a középponttól elfelé
    const m = { x: (v.x + next.x) / 2, y: (v.y + next.y) / 2 };
    let nx = -(next.y - v.y);
    let ny = next.x - v.x;
    if (nx * (m.x - mid.x) + ny * (m.y - mid.y) < 0) {
      nx = -nx;
      ny = -ny;
    }
    out.push(push(m, nx, ny, r));
  }

  return smoothClosed(out);
}

/** Sokszögbe esik-e a pont (sugárvetés). Kevesebb mint 3 csúcsnál mindig nem. */
export function polygonContains(poly, pt) {
  if (poly.length < 3) return false;
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > pt.y !== b.y > pt.y && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x) {
      hit = !hit;
    }
  }
  return hit;
}

/**
 * A halmaz burkán belüli legüresebb pont: az, amelyik a legmesszebb van a
 * megadott akadályoktól. Ide kerül a felirat – így mindig a saját foltjában
 * marad, és nem lóg ki a képből, ahogy a folt alá írt név tenné.
 */
export function emptiestSpot(points, obstacles, step = 16) {
  const hull = convexHull(points);
  const fallback = centroid(points);
  if (hull.length < 3 || !obstacles.length) return fallback;

  const xs = hull.map((p) => p.x);
  const ys = hull.map((p) => p.y);
  let best = null;
  let bestScore = -1;

  for (let x = Math.min(...xs); x <= Math.max(...xs); x += step) {
    for (let y = Math.min(...ys); y <= Math.max(...ys); y += step) {
      const p = { x, y };
      if (!polygonContains(hull, p)) continue;
      const near = Math.min(...obstacles.map((o) => Math.hypot(o.x - p.x, o.y - p.y)));
      if (near > bestScore) {
        bestScore = near;
        best = p;
      }
    }
  }
  return best ?? fallback;
}

export function centroid(points) {
  const sum = points.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

/** A pontot `dist` pixellel arrébb tolja a (dx, dy) irányban. */
function push(p, dx, dy, dist) {
  const len = Math.hypot(dx, dy) || 1;
  return { x: p.x + (dx / len) * dist, y: p.y + (dy / len) * dist };
}

/** Zárt görbe a pontokon át: minden csúcsnál lekerekít, a felezőpontokat érinti. */
function smoothClosed(pts) {
  const mid = (a, b) => `${(a.x + b.x) / 2} ${(a.y + b.y) / 2}`;
  const parts = [`M ${mid(pts.at(-1), pts[0])}`];
  for (let i = 0; i < pts.length; i++) {
    const v = pts[i];
    const next = pts[(i + 1) % pts.length];
    parts.push(`Q ${v.x} ${v.y} ${mid(v, next)}`);
  }
  return `${parts.join(" ")} Z`;
}

function circlePath(c, r) {
  return (
    `M ${c.x - r} ${c.y} ` +
    `A ${r} ${r} 0 1 0 ${c.x + r} ${c.y} ` +
    `A ${r} ${r} 0 1 0 ${c.x - r} ${c.y} Z`
  );
}
