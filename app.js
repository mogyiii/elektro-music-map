// Betöltés, nézetváltás, és a közös adatlap.

import { createAxesView } from "./views/axes-view.js";
import { createStarView } from "./views/star-view.js";
import { genreCard, gapCard } from "./lib/detail.js";

const el = {
  tabs: document.getElementById("view-tabs"),
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
    el.detail.innerHTML = `<p class="placeholder">${
      active === "star"
        ? "Válassz egy műfajt, vagy kattints egy szaggatott vonalra – az egy üres hely."
        : "Válassz egy műfajt a térképen."
    }</p>`;
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

function init() {
  hosts = {};
  views = {};

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
  });

  views.star = createStarView({
    axesFile: data.axesFile,
    genres: data.genres,
    edges: data.edges,
    root: hosts.star.root,
    controls: hosts.star.controls,
    onSelect: selectGenre,
    onSelectGap: selectGap,
    onYearChange: () => active === "star" && renderDetail(),
  });

  for (const btn of el.tabs.children) {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      views[active].render();
      syncViews();
    }, 120);
  });

  showView("axes");
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
    edges: edgesFile.edges,
    byId: new Map(genresFile.genres.map((g) => [g.id, g])),
  };
  init();
} catch (err) {
  el.error.hidden = false;
  el.error.innerHTML =
    `<strong>Nem sikerült betölteni az adatot.</strong><br>` +
    `A böngésző <code>file://</code> alól nem olvas JSON-t. Indíts egy helyi kiszolgálót ` +
    `a projekt mappájában – <code>npx serve .</code> vagy <code>python -m http.server</code> – ` +
    `és onnan nyisd meg.<br><small>${err.message}</small>`;
}
