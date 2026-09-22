// Betöltés, nézetváltás, nyelvválasztás és a közös adatlap.

import { createAxesView } from "./views/axes-view.js";
import { createStarView } from "./views/star-view.js";
import { genreCard, gapCard } from "./lib/detail.js";
import { t, getLang, setLang, onLangChange, localizeAxesFile } from "./lib/i18n.js";

const el = {
  title: document.getElementById("app-title"),
  tabs: document.getElementById("view-tabs"),
  lang: document.getElementById("lang-switch"),
  controls: document.getElementById("controls"),
  stage: document.getElementById("stage"),
  detail: document.getElementById("detail"),
  error: document.getElementById("error"),
};

let data;
let views;
let hosts;
let active = "axes";
let selected = null;
let selectedGap = null;

// ---------- kiválasztás ----------

function selectGenre(id) {
  selectedGap = null;
  selected = selected === id ? null : id;
  syncViews();
  renderDetail();
}

function selectGap(gap) {
  selected = null;
  selectedGap = selectedGap?.id === gap.id ? null : gap;
  syncViews();
  renderDetail();
}

function syncViews() {
  for (const view of Object.values(views)) {
    view.setSelected(selected, selectedGap?.id ?? null);
  }
}

let shownKey = null;

function renderDetail() {
  // görgetés csak akkor ugorjon a tetejére, ha tényleg másra váltottunk –
  // az évcsúszka húzása közben ne rángassa a lapot
  const key = selectedGap?.id ?? selected;
  const keepScroll = key === shownKey;
  const scroll = el.detail.scrollTop;
  shownKey = key;

  if (selectedGap) {
    el.detail.innerHTML = gapCard(selectedGap, {
      axes: data.axes,
      useFeltTempo: views.star.useFeltTempo,
    });
  } else if (selected) {
    el.detail.innerHTML = genreCard(data.byId.get(selected), {
      axes: data.axes,
      edges: data.edges,
      byId: data.byId,
      neighbours: active === "star" ? views.star.neighboursOf(selected) : null,
      era: active === "star" ? views.star.eraOf(selected) : null,
    });
  } else {
    el.detail.innerHTML = `<p class="placeholder">${t(`detail.placeholder.${active}`)}</p>`;
    return;
  }

  el.detail.scrollTop = keepScroll ? scroll : 0;
  for (const b of el.detail.querySelectorAll(".rel-link")) {
    b.addEventListener("click", () => selectGenre(b.dataset.id));
  }
}

// ---------- nézetváltás ----------

function showView(name) {
  active = name;
  for (const btn of el.tabs.children) {
    btn.classList.toggle("active", btn.dataset.view === name);
  }
  for (const [key, host] of Object.entries(hosts)) {
    host.root.hidden = key !== name;
    host.controls.hidden = key !== name;
  }
  views[name].render();
  syncViews();
  renderDetail();
}

// ---------- nyelv ----------

/** A kereten lévő állandó szövegek: cím, fülek, nyelvkapcsoló. */
function applyChrome() {
  const lang = getLang();
  document.documentElement.lang = lang;
  document.title = t("app.title");
  el.title.textContent = t("app.title");

  for (const btn of el.tabs.children) {
    btn.textContent = t(`view.${btn.dataset.view}`);
  }

  el.lang.setAttribute("aria-label", t("lang.group"));
  for (const btn of el.lang.children) {
    const on = btn.dataset.lang === lang;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", String(on));
    btn.setAttribute("aria-label", t(`lang.${btn.dataset.lang}`));
  }
}

function bindLangSwitch() {
  for (const btn of el.lang.children) {
    btn.addEventListener("click", () => setLang(btn.dataset.lang));
  }
}

/**
 * Nyelvváltás. A nézetek a szövegeiket egyszer, felépítéskor írják ki, ezért
 * újra kell építeni őket – a beállításaikat (év, súlyok, tengelyek) átmentjük,
 * hogy a térkép ne ugorjon vissza az alapállapotba.
 */
function relang() {
  const state = { axes: views.axes.getState(), star: views.star.getState() };
  for (const view of Object.values(views)) view.destroy?.();
  applyChrome();
  buildViews(state);
  showView(active);
}

// ---------- felépítés ----------

function buildViews(state = {}) {
  el.stage.replaceChildren();
  el.controls.replaceChildren();
  hosts = {};
  views = {};

  // A tengelycímkék és kategóriák az adatban magyarul állnak; itt kapják meg
  // az aktuális nyelv szavait, hogy a nézetek változatlanul használhassák.
  const axesFile = localizeAxesFile(data.axesFile);
  data.axes = axesFile.axes;

  for (const name of ["axes", "star"]) {
    const root = document.createElement("section");
    root.className = `view view-${name}`;
    const controls = document.createElement("div");
    controls.className = "controls";
    el.stage.append(root);
    el.controls.append(controls);
    hosts[name] = { root, controls };
  }

  views.axes = createAxesView({
    axes: data.axes,
    genres: data.genres,
    root: hosts.axes.root,
    controls: hosts.axes.controls,
    onSelect: selectGenre,
    state: state.axes,
  });

  views.star = createStarView({
    axesFile,
    genres: data.genres,
    families: data.families,
    edges: data.edges,
    root: hosts.star.root,
    controls: hosts.star.controls,
    onSelect: selectGenre,
    onSelectGap: selectGap,
    onYearChange: () => active === "star" && renderDetail(),
    state: state.star,
  });
}

function init() {
  applyChrome();
  bindLangSwitch();
  buildViews();

  for (const btn of el.tabs.children) {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  }
  onLangChange(relang);

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      views[active].render();
      syncViews();
    }, 120);
  });

  showView(active);
}

// ---------- betöltés ----------
// A modul végén, hogy a felső szintű await ne fusson a deklarációk előtt.

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

try {
  const [axesFile, genresFile, edgesFile] = await Promise.all([
    loadJSON("data/axes.json"),
    loadJSON("data/genres.json"),
    loadJSON("data/edges.json"),
  ]);
  data = {
    axesFile,
    axes: axesFile.axes,
    genres: genresFile.genres,
    families: genresFile.families ?? {},
    edges: edgesFile.edges,
    byId: new Map(genresFile.genres.map((g) => [g.id, g])),
  };
  init();
} catch (err) {
  // Itt nincs nézet, amit újra kellene építeni – csak a keret és a hibaszöveg.
  const showError = () => {
    applyChrome();
    el.error.hidden = false;
    el.error.innerHTML =
      `<strong>${t("error.title")}</strong><br>${t("error.body")}` +
      `<br><small>${err.message}</small>`;
  };
  bindLangSwitch();
  onLangChange(showError);
  showError();
}
