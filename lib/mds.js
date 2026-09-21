// Távolságmátrixból 2D koordináták (többdimenziós skálázás).
// Teljesen determinisztikus: ugyanaz az adat mindig ugyanazt a képet adja,
// nincs véletlen kezdőállapot, nincs animált szétrendeződés.

const DIM = 2;

/** Klasszikus MDS: a kétszeresen centrált mátrix két legnagyobb sajátvektora. */
function classicalMDS(D) {
  const n = D.length;

  // B = -0.5 * J * D² * J, ahol J a centráló mátrix
  const sq = D.map((row) => row.map((v) => v * v));
  const rowMean = sq.map((r) => r.reduce((s, v) => s + v, 0) / n);
  const grand = rowMean.reduce((s, v) => s + v, 0) / n;
  const B = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => -0.5 * (sq[i][j] - rowMean[i] - rowMean[j] + grand))
  );

  const coords = Array.from({ length: n }, () => new Array(DIM).fill(0));
  const work = B.map((r) => r.slice());

  for (let d = 0; d < DIM; d++) {
    const { vector, value } = dominantEigen(work, d);
    if (value <= 0) break;
    const scale = Math.sqrt(value);
    for (let i = 0; i < n; i++) coords[i][d] = vector[i] * scale;
    // deflálás, hogy a következő kör a rá merőleges irányt találja meg
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) work[i][j] -= value * vector[i] * vector[j];
  }

  return coords;
}

/** Hatványiteráció. A kezdővektor fix képlet, nem véletlen. */
function dominantEigen(M, seed) {
  const n = M.length;
  let v = Array.from({ length: n }, (_, i) => Math.sin((i + 1) * (seed + 1) * 1.7) + 0.5);
  normalize(v);

  let value = 0;
  for (let iter = 0; iter < 300; iter++) {
    const next = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let s = 0;
      for (let j = 0; j < n; j++) s += M[i][j] * v[j];
      next[i] = s;
    }
    const norm = Math.hypot(...next);
    if (norm < 1e-12) return { vector: v, value: 0 };
    for (let i = 0; i < n; i++) next[i] /= norm;
    const delta = next.reduce((s, x, i) => s + Math.abs(x - v[i]), 0);
    v = next;
    value = norm;
    if (delta < 1e-10) break;
  }
  return { vector: v, value };
}

function normalize(v) {
  const norm = Math.hypot(...v) || 1;
  for (let i = 0; i < v.length; i++) v[i] /= norm;
}

/**
 * SMACOF: a klasszikus MDS eredményét finomítja úgy, hogy a kirajzolt
 * távolságok minél jobban kövessék a valódiakat (Guttman-transzformáció).
 */
function smacof(D, init, iterations) {
  const n = D.length;
  let X = init.map((p) => p.slice());

  for (let iter = 0; iter < iterations; iter++) {
    const next = Array.from({ length: n }, () => new Array(DIM).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        let dist = 0;
        for (let d = 0; d < DIM; d++) dist += (X[i][d] - X[j][d]) ** 2;
        dist = Math.sqrt(dist);
        if (dist < 1e-9) continue; // egymáson ülnek, nincs értelmes irány
        const ratio = D[i][j] / dist;
        for (let d = 0; d < DIM; d++) next[i][d] += ratio * (X[i][d] - X[j][d]);
      }
      for (let d = 0; d < DIM; d++) next[i][d] /= n;
    }

    center(next);
    X = next;
  }
  return X;
}

function center(X) {
  const n = X.length;
  for (let d = 0; d < DIM; d++) {
    let mean = 0;
    for (let i = 0; i < n; i++) mean += X[i][d];
    mean /= n;
    for (let i = 0; i < n; i++) X[i][d] -= mean;
  }
}

/**
 * A tükrözés és a forgatás iránya az MDS-ből nem meghatározott.
 * Rögzítjük: a legtávolabbi pont essen jobbra és felülre.
 */
function orient(X) {
  for (let d = 0; d < DIM; d++) {
    let extreme = 0;
    for (let i = 1; i < X.length; i++) {
      if (Math.abs(X[i][d]) > Math.abs(X[extreme][d])) extreme = i;
    }
    if (X[extreme][d] < 0) for (const p of X) p[d] = -p[d];
  }
  return X;
}

/** Mennyire hűek a kirajzolt távolságok az eredetiekhez. 0 = tökéletes. */
export function stress(D, X) {
  let num = 0;
  let den = 0;
  for (let i = 0; i < D.length; i++) {
    for (let j = i + 1; j < D.length; j++) {
      const dist = Math.hypot(X[i][0] - X[j][0], X[i][1] - X[j][1]);
      num += (dist - D[i][j]) ** 2;
      den += D[i][j] ** 2;
    }
  }
  return den ? Math.sqrt(num / den) : 0;
}

export function embed(D, { iterations = 300 } = {}) {
  return orient(smacof(D, classicalMDS(D), iterations));
}
