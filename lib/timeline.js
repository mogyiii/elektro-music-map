// Egy műfaj nem pont, hanem pálya: korszakonként más a tulajdonságvektora.
// A 85-ös techno és a mai techno nem ugyanott van a térképen.

/**
 * Egy műfaj korszakai. Akinek nincs megadva, annak egyetlen, végig azonos korszaka van:
 * maga a műfaj, a születése évétől.
 *
 * A pillanatkép a teljes műfajt átmásolja, nem egy kézzel felsorolt mezőlistát – így
 * egy új tengely hozzáadása nem hagy kilyukadt korszakokat maga után.
 */
export function erasOf(genre) {
  if (genre.eras?.length) return genre.eras;
  return [{ ...genre, from: genre.year, label: null, note: "" }];
}

/** A korszak, ami az adott évben érvényes. null, ha a műfaj még nem létezett. */
export function stateAt(genre, year) {
  const eras = erasOf(genre);
  if (year < eras[0].from) return null;
  let active = eras[0];
  for (const era of eras) if (era.from <= year) active = era;
  return active;
}

/** Létezett-e már. */
export function existsAt(genre, year) {
  return year >= erasOf(genre)[0].from;
}

export function firstYear(genres) {
  return Math.min(...genres.map((g) => erasOf(g)[0].from));
}

/**
 * Minden korszak külön pont. A beágyazás EZEN a teljes halmazon fut egyszer,
 * nem évenként újra – különben a térkép minden csúszkamozdulatra átfordulna,
 * és a kavargás nem a zenéről szólna, hanem a számításról.
 */
export function buildSnapshots(genres) {
  const snapshots = [];
  const bounds = new Map();

  for (const genre of genres) {
    const eras = erasOf(genre);
    bounds.set(genre.id, [snapshots.length, snapshots.length + eras.length]);
    for (const era of eras) {
      snapshots.push({ ...era, genreId: genre.id, name: genre.name });
    }
  }
  return { snapshots, bounds };
}

/** Műfajonkénti pálya a beágyazott koordinátákból. */
export function buildPaths(genres, snapshots, bounds, points) {
  const paths = new Map();
  for (const genre of genres) {
    const [start, end] = bounds.get(genre.id);
    paths.set(
      genre.id,
      points.slice(start, end).map((p, i) => ({
        x: p.x,
        y: p.y,
        year: snapshots[start + i].from,
        label: snapshots[start + i].label,
      }))
    );
  }
  return paths;
}

/**
 * Hol tart a műfaj az adott évben. A korszakok közt egyenletesen csúszik át,
 * így a mozgás folyamatos, nem ugrál korszakhatáronként.
 * @returns {x, y, moving} vagy null, ha még nem létezett
 */
export function positionAt(path, year) {
  if (!path.length || year < path[0].year) return null;
  if (path.length === 1 || year >= path.at(-1).year) {
    const last = path.at(-1);
    return { x: last.x, y: last.y, moving: false };
  }

  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    if (year < a.year || year > b.year) continue;
    const span = b.year - a.year || 1;
    const t = (year - a.year) / span;
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      moving: b.x !== a.x || b.y !== a.y,
    };
  }
  const last = path.at(-1);
  return { x: last.x, y: last.y, moving: false };
}

/** A pálya addigi szakasza – ez a "nyomvonal" a műfaj mögött. */
export function trailUpTo(path, year) {
  const head = positionAt(path, year);
  if (!head) return [];
  const points = path.filter((p) => p.year <= year).map((p) => ({ x: p.x, y: p.y }));
  points.push({ x: head.x, y: head.y });
  return points;
}
