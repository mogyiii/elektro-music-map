// Egymásra csúszó címkék szétlökése, pixelben, a címkedobozok alapján.
// Determinisztikus – az index dönti el a holtversenyt, nincs véletlen,
// így ugyanaz az adat mindig ugyanazt a képet adja.

export const LABEL_CHAR_PX = 6.7;  // becsült karakterszélesség
export const LABEL_PAD_PX = 14;    // belső margó a címke körül
export const LABEL_HEIGHT = 22;

export function labelWidth(text, extra = 0) {
  return text.length * LABEL_CHAR_PX + LABEL_PAD_PX + extra;
}

/**
 * @param items  {x, y, w, h, i} – x a doboz bal széle, y a függőleges közepe
 * @param bounds {width, height, padX, obstacles, verticalOnly}
 *               obstacles: fix pontok ({x, y, r}), amiket a címkéknek ki kell kerülniük.
 *               verticalOnly: a címke csak függőlegesen mozdulhat – így a pontja
 *               mellett marad, és nem csúszik rá. A csillagtérkép ezt használja.
 * @returns ugyanazok az elemek, elmozdított x/y-nal
 */
export function dodgeLabels(items, bounds, passes = 200) {
  const pts = items.map((p) => ({ ...p }));
  const obstacles = bounds.obstacles ?? [];
  const verticalOnly = bounds.verticalOnly ?? false;

  for (let pass = 0; pass < passes; pass++) {
    let moved = false;

    // a fix pontokról lelökjük a rájuk csúszott címkéket – mindig függőlegesen,
    // hogy a címke a saját pontja mellett maradjon
    for (const p of pts) {
      for (const o of obstacles) {
        const overlapX = p.w / 2 + o.r - Math.abs(o.x - (p.x + p.w / 2));
        const overlapY = p.h / 2 + o.r - Math.abs(o.y - p.y);
        if (overlapX <= 0 || overlapY <= 0) continue;
        p.y += (Math.sign(p.y - o.y) || 1) * (overlapY + 0.5);
        moved = true;
      }
    }

    for (let a = 0; a < pts.length; a++) {
      for (let b = a + 1; b < pts.length; b++) {
        const p = pts[a];
        const q = pts[b];
        const overlapX = (p.w + q.w) / 2 - Math.abs(q.x + q.w / 2 - (p.x + p.w / 2));
        const overlapY = (p.h + q.h) / 2 - Math.abs(q.y - p.y);
        if (overlapX <= 0 || overlapY <= 0) continue;

        // A kisebb átfedés irányába lökünk – így jellemzően függőlegesen válnak szét.
        if (verticalOnly || overlapY <= overlapX) {
          const dir = Math.sign(q.y - p.y) || (p.i % 2 === 0 ? 1 : -1);
          const push = (overlapY / 2 + 0.5) * dir;
          p.y -= push;
          q.y += push;
        } else {
          const dir = Math.sign(q.x - p.x) || (p.i % 2 === 0 ? 1 : -1);
          const push = (overlapX / 2 + 0.5) * dir;
          p.x -= push;
          q.x += push;
        }
        moved = true;
      }
    }

    for (const p of pts) {
      p.x = clamp(p.x, bounds.padX, bounds.width - p.w - 2);
      p.y = clamp(p.y, p.h / 2 + 1, bounds.height - p.h / 2 - 1);
    }
    if (!moved) break;
  }

  return pts;
}

export function clamp(v, lo, hi) {
  if (hi < lo) return lo; // nagyon szűk hely: a kezdő szél nyer
  return Math.min(hi, Math.max(lo, v));
}

/** Koordináták arányos beillesztése egy dobozba – a két tengely skálája azonos,
 *  különben a térkép hazudna a távolságokról. */
export function fitUniform(coords, { width, height, pad }) {
  const xs = coords.map((p) => p[0]);
  const ys = coords.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const scale = Math.min((width - 2 * pad) / spanX, (height - 2 * pad) / spanY);

  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;

  return coords.map(([x, y]) => ({
    x: offsetX + (x - minX) * scale,
    // a képernyő y-ja lefelé nő
    y: offsetY + (maxY - y) * scale,
  }));
}
