// Nyelvek. Minden felületi szöveg itt van, kulcs szerint – a kódban nincs
// beégetett mondat. A műfajok saját szövege (összefoglaló, korszak-jegyzet,
// él-jegyzet) az adatban marad, és egyelőre csak magyarul.

const STRINGS = {
  hu: {
    "app.title": "Elektronikus zene térkép",
    "view.axes": "Tengelyes",
    "view.star": "Csillagtérkép",

    "lang.group": "Nyelv",
    "lang.hu": "Magyar",
    "lang.en": "Angol",

    "detail.placeholder.axes": "Válassz egy műfajt a térképen.",
    "detail.placeholder.star":
      "Válassz egy műfajt, vagy kattints egy szaggatott vonalra – az egy üres hely.",

    "error.title": "Nem sikerült betölteni az adatot.",
    "error.body":
      "A böngésző <code>file://</code> alól nem olvas JSON-t. Indíts egy helyi kiszolgálót " +
      "a projekt mappájában – <code>npx serve .</code> vagy <code>python -m http.server</code> – " +
      "és onnan nyisd meg.",

    // ---- adatlap ----
    "detail.fromYear": "{year}-től",
    "detail.inYear": "{year}-ben",
    "detail.h.props": "Jellemzők",
    "detail.h.note": "Megjegyzés",
    "detail.h.neighbours": "Legközelebbi szomszédok",
    "detail.h.drum": "Dobrács",
    "detail.h.relations": "Rokon műfajok",
    "detail.h.examples": "Hangpélda",
    "detail.props.outside": "Külső hatás",
    "detail.absent": "Ekkor még nem létezett – {start}-től van a térképen.",
    "detail.era.labelled": "{label} korszak ({from}-től)",
    "detail.era.plain": "{from}-től",
    "detail.era.onlyDiff": "Csak az van itt, ami akkor más volt, mint ma.",
    "detail.era.same": "Ekkor még ugyanaz volt, mint ma.",
    "detail.neighbours.nolink": "nincs szál",
    "detail.neighbours.note":
      "Hangzás szerinti közelség. Ahol nincs szál, ott a hasonlóság nem " +
      "leszármazásból jön – két külön ágon jutottak ugyanoda.",
    "detail.drum.none": "Nincs ütem.",
    "detail.drum.caption": "Egy ütem, 16 lépés. Vázlatos, és még nem szól.",
    "detail.drum.kick": "lábdob",
    "detail.drum.snare": "pergő",
    "detail.drum.hat": "hi-hat",
    "detail.rel.none": "Nincs felvett kapcsolata.",
    "detail.rel.incoming": "ebből – {kind}{span}",
    "detail.rel.outgoing": "ez lett belőle – {kind}{span}",
    "detail.edgeKind.parent": "szülő",
    "detail.edgeKind.influence": "hatás",
    "detail.change.removed": "elvéve",
    "detail.change.moved": "áthelyezve",
    "detail.change.added": "hozzáadva",
    "detail.examples.none": "Még nincs felvéve.",

    // ---- tengelyértékek szavakban ----
    "value.noBeat": "nincs ütem",
    "value.felt": "{base} ({felt}-nek hat)",
    "value.function.listening": "hallgatás",
    "value.function.moreListening": "inkább hallgatás",
    "value.function.mixed": "vegyes",
    "value.function.moreDance": "inkább tánc",
    "value.function.dance": "tánc",
    "value.change.same": "végig ugyanaz",
    "value.change.little": "keveset változik",
    "value.change.moderate": "mérsékelten változik",
    "value.change.much": "sokat változik",
    "value.change.never": "szinte semmi nem ismétlődik",

    // ---- rés-kártya ----
    "gap.title": "Üres hely",
    "gap.between": "{a} és {b} között",
    "gap.summary":
      "Ez a két műfaj közel van egymáshoz, de a köztük lévő hely üres – " +
      "egyetlen felvett műfaj sem esik közéjük.",
    "gap.linked": "Származási szál köti össze őket, tehát az egyikből lett a másik, ugrásszerűen.",
    "gap.unlinked": "Származási szál sem köti össze őket.",
    "gap.h.what": "Mi kerülne ide",
    "gap.what.note":
      "A két műfaj számtani közepe. Nem recept, hanem kiindulópont – és lehet, " +
      "hogy épp azért üres, mert zeneileg nem működik.",
    "gap.h.numbers": "Számok",
    "gap.distance": "Távolság",
    "gap.distance.scale": "(0 = azonos, 1 = maximálisan más)",
    "gap.nearest": "Legközelebbi",
    "gap.nearest.value": "{name} – {percent}%-kal hosszabb úton",
    "gap.nearest.note":
      "A „legközelebbi” az a műfaj, amelyik a leginkább a kettő közé esik. Ha rajta " +
      "keresztül is jóval hosszabb az út, akkor tényleg nincs köztük semmi.",
    "gap.midpoint.between": "{a} és {b} között",

    // ---- tengelyes nézet ----
    "axesview.x": "Vízszintes",
    "axesview.y": "Függőleges",
    "axesview.felt": "érzett tempó",
    "axesview.offscale": "Nincs értéke ezen a tengelyen:",
    "axesview.multi": "{name} – több értéke is van ezen a tengelyen, lásd az adatlapot",
    "axesview.tick.change.same": "végig ugyanaz",
    "axesview.tick.change.mid": "változik",
    "axesview.tick.change.never": "nem ismétlődik",

    // ---- csillagtérkép ----
    "starview.play": "Lejátszás",
    "starview.speed": "{n} év/mp",
    "starview.today": "ma",
    "starview.legend.parent": "ebből lett",
    "starview.legend.influence": "hatott rá",
    "starview.legend.past": "hatott rá, de már nem",
    "starview.legend.gap": "üres hely köztük",
    "starview.legend.trail": "merre tart",
    "starview.ctl.edges": "származási szálak",
    "starview.ctl.gaps": "hiányzó rések",
    "starview.ctl.unlinked": "csak rokonság nélküli rések",
    "starview.ctl.trails": "nyomvonalak",
    "starview.ctl.families": "családok",
    "starview.ctl.felt": "érzett tempó",
    "starview.weights": "Tengelysúlyok",
    "starview.reset": "Alapértékek",
    "starview.footer":
      "{genres} műfaj {year}-ben · {gaps} rés · {moving} épp mozgásban · " +
      "torzítás {stress} ({axes} tengely 2 dimenzióba vetítve – " +
      "a képernyőn látott távolság közelítés)",
    "starview.span.from": "{year}-től",
    "starview.span.range": "{from}–{until}",
    "starview.edge.parent": "szülő",
    "starview.edge.influence": "hatás, {span}",
    "starview.edge.expired": " (már nem eleven)",
    "starview.gapTitle": "Üres hely: {a} ↔ {b}",
  },

  en: {
    "app.title": "Electronic music map",
    "view.axes": "Axes",
    "view.star": "Star map",

    "lang.group": "Language",
    "lang.hu": "Hungarian",
    "lang.en": "English",

    "detail.placeholder.axes": "Pick a genre on the map.",
    "detail.placeholder.star":
      "Pick a genre, or click a dashed line – that one is an empty spot.",

    "error.title": "Could not load the data.",
    "error.body":
      "Browsers will not read JSON over <code>file://</code>. Start a local server " +
      "in the project folder – <code>npx serve .</code> or <code>python -m http.server</code> – " +
      "and open the page from there.",

    // ---- detail panel ----
    "detail.fromYear": "from {year}",
    "detail.inYear": "In {year}",
    "detail.h.props": "Properties",
    "detail.h.note": "Note",
    "detail.h.neighbours": "Nearest neighbours",
    "detail.h.drum": "Drum grid",
    "detail.h.relations": "Related genres",
    "detail.h.examples": "Audio example",
    "detail.props.outside": "Outside influence",
    "detail.absent": "Did not exist yet – on the map from {start}.",
    "detail.era.labelled": "{label} era (from {from})",
    "detail.era.plain": "from {from}",
    "detail.era.onlyDiff": "Only what was different back then is listed here.",
    "detail.era.same": "Same as today back then.",
    "detail.neighbours.nolink": "no link",
    "detail.neighbours.note":
      "Closeness by sound. Where there is no link, the similarity does not come " +
      "from descent – two separate branches arrived at the same place.",
    "detail.drum.none": "No beat.",
    "detail.drum.caption": "One bar, 16 steps. A sketch, and it does not play yet.",
    "detail.drum.kick": "kick",
    "detail.drum.snare": "snare",
    "detail.drum.hat": "hi-hat",
    "detail.rel.none": "No relations recorded.",
    "detail.rel.incoming": "came from this – {kind}{span}",
    "detail.rel.outgoing": "became this – {kind}{span}",
    "detail.edgeKind.parent": "parent",
    "detail.edgeKind.influence": "influence",
    "detail.change.removed": "removed",
    "detail.change.moved": "moved",
    "detail.change.added": "added",
    "detail.examples.none": "Not recorded yet.",

    // ---- axis values in words ----
    "value.noBeat": "no beat",
    "value.felt": "{base} (feels like {felt})",
    "value.function.listening": "listening",
    "value.function.moreListening": "more listening",
    "value.function.mixed": "mixed",
    "value.function.moreDance": "more dancing",
    "value.function.dance": "dancing",
    "value.change.same": "stays the same",
    "value.change.little": "changes a little",
    "value.change.moderate": "changes moderately",
    "value.change.much": "changes a lot",
    "value.change.never": "almost nothing repeats",

    // ---- gap card ----
    "gap.title": "Empty spot",
    "gap.between": "between {a} and {b}",
    "gap.summary":
      "These two genres are close to each other, but the space between them is empty – " +
      "not one recorded genre falls in between.",
    "gap.linked": "A lineage thread connects them, so one became the other in a single jump.",
    "gap.unlinked": "No lineage thread connects them either.",
    "gap.h.what": "What would go here",
    "gap.what.note":
      "The arithmetic middle of the two genres. Not a recipe, a starting point – and it " +
      "may well be empty precisely because it does not work musically.",
    "gap.h.numbers": "Numbers",
    "gap.distance": "Distance",
    "gap.distance.scale": "(0 = identical, 1 = maximally different)",
    "gap.nearest": "Nearest",
    "gap.nearest.value": "{name} – via a path {percent}% longer",
    "gap.nearest.note":
      "The “nearest” is the genre that falls most nearly between the two. If the way " +
      "through it is still much longer, there really is nothing in between.",
    "gap.midpoint.between": "between {a} and {b}",

    // ---- axes view ----
    "axesview.x": "Horizontal",
    "axesview.y": "Vertical",
    "axesview.felt": "felt tempo",
    "axesview.offscale": "No value on this axis:",
    "axesview.multi": "{name} – has several values on this axis, see the detail panel",
    "axesview.tick.change.same": "stays the same",
    "axesview.tick.change.mid": "changes",
    "axesview.tick.change.never": "nothing repeats",

    // ---- star map ----
    "starview.play": "Play",
    "starview.speed": "{n} yr/s",
    "starview.today": "today",
    "starview.legend.parent": "became this",
    "starview.legend.influence": "influenced by",
    "starview.legend.past": "influenced by, but no longer",
    "starview.legend.gap": "empty spot between them",
    "starview.legend.trail": "where it is heading",
    "starview.ctl.edges": "lineage threads",
    "starview.ctl.gaps": "missing gaps",
    "starview.ctl.unlinked": "only gaps without kinship",
    "starview.ctl.trails": "trails",
    "starview.ctl.families": "families",
    "starview.ctl.felt": "felt tempo",
    "starview.weights": "Axis weights",
    "starview.reset": "Defaults",
    "starview.footer":
      "{genres} genres in {year} · {gaps} gaps · {moving} moving right now · " +
      "distortion {stress} ({axes} axes projected into 2 dimensions – " +
      "the distance you see on screen is an approximation)",
    "starview.span.from": "from {year}",
    "starview.span.range": "{from}–{until}",
    "starview.edge.parent": "parent",
    "starview.edge.influence": "influence, {span}",
    "starview.edge.expired": " (no longer live)",
    "starview.gapTitle": "Empty spot: {a} ↔ {b}",
  },
};

// A tengelyek nevei és kategóriái az adatban magyarul vannak; itt csak a
// fordításuk áll. A kulcsok a data/axes.json kulcsaival egyeznek.
const AXES = {
  en: {
    rhythmGrid: {
      label: "Rhythm grid",
      categories: {
        straight: "straight",
        "two-step": "2-step",
        broken: "broken",
        "half-time": "half-time",
        none: "no beat",
      },
    },
    tempo: { label: "Tempo" },
    density: { label: "Density" },
    lead: {
      label: "Lead",
      categories: { drums: "drums", bass: "bass", melody: "melody", timbre: "timbre" },
    },
    function: { label: "Function" },
    change: { label: "Change" },
  },
};

// A korszakcímkék (genres.json → eras[].label) egy-két szavas feliratok, nem
// prózai szöveg – ezért itt állnak, az adat magyar marad. Ami nincs a listán
// (pl. egy újonnan felvett korszak), az változatlanul, magyarul jelenik meg.
const ERA_LABELS = {
  en: {
    "mai": "present-day",
    "korai": "early",
    "korai, dubos": "early, dubby",
    "korai, négyes rácson": "early, on a four-four grid",
    "chicagói": "Chicago",
    "detroiti": "Detroit",
    "énekes": "vocal",
    "vágott": "chopped",
    "atmoszférikus": "atmospheric",
    "techstep": "techstep",
    "ragga": "ragga",
    "2-step": "2-step",
    "brostep": "brostep",
    "himnuszos": "anthemic",
    "fesztiválos": "festival",
    "csúcs": "peak",
    "goa": "goa",
    "full-on": "full-on",
    "nu-style": "nu-style",
    "UK hardcore": "UK hardcore",
    "brit progresszív": "British progressive",
    "kilencvenes évek": "the nineties",
    "loopos / minimalista hatás alatt": "loop-based / under minimal influence",
  },
};

// Családnevek (genres.json → families[].label). A legtöbb műfajnév amúgy is
// angol, ezért itt jórészt azonos alakok állnak – a tábla attól teljes.
const FAMILY_LABELS = {
  en: {
    "House": "House",
    "Techno": "Techno",
    "Trance": "Trance",
    "Hardcore": "Hardcore",
    "Jungle / D&B": "Jungle / D&B",
    "UK bass": "UK bass",
    "Breaks": "Breaks",
    "Ambient": "Ambient",
    "Acid": "Acid",
    "Juke": "Juke",
    "Electronica": "Electronica",
  },
};

export const LANGS = ["hu", "en"];
const DEFAULT_LANG = "hu";
const STORAGE_KEY = "zeneterkep.lang";

// A modult a data/validate.mjs is behúzza, ahol nincs se localStorage, se
// navigator – ezért minden böngésző-API csak óvatosan.
function detect() {
  try {
    const saved = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (LANGS.includes(saved)) return saved;
  } catch {
    // privát mód: nincs tárolás, a böngésző nyelve dönt
  }
  const nav = globalThis.navigator;
  for (const tag of nav?.languages ?? [nav?.language ?? ""]) {
    const base = String(tag).toLowerCase().split("-")[0];
    if (LANGS.includes(base)) return base;
  }
  return "en";
}

let lang = detect();
const listeners = new Set();

export function getLang() {
  return lang;
}

export function setLang(next) {
  if (!LANGS.includes(next) || next === lang) return;
  lang = next;
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, lang);
  } catch {
    // a választás ilyenkor csak az oldal bezárásáig él
  }
  for (const fn of listeners) fn(lang);
}

export function onLangChange(fn) {
  listeners.add(fn);
}

/** Szöveg kulcs szerint. A {név} helyőrzőkbe a params értékei kerülnek. */
export function t(key, params) {
  const s = STRINGS[lang][key] ?? STRINGS[DEFAULT_LANG][key] ?? key;
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (m, name) => (name in params ? params[name] : m));
}

/** Korszakcímke az aktuális nyelven; ha nincs fordítás, marad az eredeti. */
export function eraLabel(label) {
  return ERA_LABELS[lang]?.[label] ?? label;
}

/** Családnév az aktuális nyelven; ha nincs fordítás, marad az eredeti. */
export function familyLabel(label) {
  return FAMILY_LABELS[lang]?.[label] ?? label;
}

/**
 * A tengelydefiníciók másolata az aktuális nyelv címkéivel. A magyar az adatban
 * áll, más nyelvnél csak a label és a categories cserélődik – minden számérték,
 * kulcs és sorrend változatlan marad.
 */
export function localizeAxes(axes) {
  const table = AXES[lang];
  if (!table) return axes;

  return Object.fromEntries(
    Object.entries(axes).map(([key, axis]) => {
      const tr = table[key];
      if (!tr) return [key, axis];
      const out = { ...axis, label: tr.label ?? axis.label };
      if (axis.categories && tr.categories) {
        // A kategóriák sorrendje tengelysorrend, ezért az eredetiből indulunk.
        out.categories = Object.fromEntries(
          Object.entries(axis.categories).map(([c, name]) => [c, tr.categories[c] ?? name])
        );
      }
      return [key, out];
    })
  );
}

/** Ugyanaz az axes.json-objektum, de a tengelyek az aktuális nyelven. */
export function localizeAxesFile(axesFile) {
  return { ...axesFile, axes: localizeAxes(axesFile.axes) };
}

/**
 * Mi nincs lefordítva – a data/validate.mjs hívja. A magyar a referencia:
 * minden más nyelvnek ugyanazokat a kulcsokat kell tudnia.
 *
 * A kulcs megléte számít, nem az érték: sok szó minden nyelven ugyanaz
 * ("2-step", "goa", "brostep"), és azt nem szabad hiánynak nézni.
 *
 * @param axes           a data/axes.json `axes` objektuma
 * @param eraLabels      a genres.json-ban ténylegesen használt korszakcímkék
 * @param familyLabels   a genres.json `families` blokkjának címkéi
 */
export function missingTranslations(axes, eraLabels, familyLabels = []) {
  const missing = [];
  const extra = [];

  for (const target of LANGS.filter((l) => l !== DEFAULT_LANG)) {
    for (const key of Object.keys(STRINGS[DEFAULT_LANG])) {
      if (STRINGS[target]?.[key] === undefined) missing.push(`${target}: szövegkulcs '${key}'`);
    }
    for (const key of Object.keys(STRINGS[target] ?? {})) {
      if (STRINGS[DEFAULT_LANG][key] === undefined) extra.push(`${target}: szövegkulcs '${key}'`);
    }

    const ax = AXES[target] ?? {};
    for (const [key, axis] of Object.entries(axes)) {
      if (ax[key]?.label === undefined) missing.push(`${target}: tengely '${key}' (${axis.label})`);
      for (const [cat, name] of Object.entries(axis.categories ?? {})) {
        if (ax[key]?.categories?.[cat] === undefined) {
          missing.push(`${target}: kategória '${key}.${cat}' (${name})`);
        }
      }
    }

    const eras = ERA_LABELS[target] ?? {};
    for (const label of eraLabels) {
      if (eras[label] === undefined) missing.push(`${target}: korszakcímke '${label}'`);
    }
    for (const label of Object.keys(eras)) {
      if (![...eraLabels].includes(label)) extra.push(`${target}: korszakcímke '${label}'`);
    }

    const fams = FAMILY_LABELS[target] ?? {};
    for (const label of familyLabels) {
      if (fams[label] === undefined) missing.push(`${target}: családnév '${label}'`);
    }
    for (const label of Object.keys(fams)) {
      if (![...familyLabels].includes(label)) extra.push(`${target}: családnév '${label}'`);
    }
  }

  return { missing, extra };
}
