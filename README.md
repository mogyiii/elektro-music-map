# Elektronikus zene térkép

Interaktív térkép az elektronikus zenei műfajokról, hangzás és ritmus szerint rendezve.
A cél és a tervezett nézetek: [`plan.md`](plan.md). A kiinduló leírás: [`zene-terkep-brief.md`](zene-terkep-brief.md).

## Indítás

Statikus oldal, nincs build. A böngésző `file://` alól nem olvassa az adatfájlokat,
ezért helyi kiszolgáló kell:

```
npx serve .
```

vagy

```
python -m http.server
```

Utána nyisd meg a kiírt címet.

## Fájlok

| Fájl | Mi ez |
|---|---|
| `index.html`, `styles.css`, `app.js` | váz, nézetváltás, közös adatlap |
| `views/axes-view.js` | tengelyes nézet |
| `views/star-view.js` | csillagtérkép |
| `lib/similarity.js` | távolságszámítás és réskeresés |
| `lib/timeline.js` | korszakok, pályák, pozíció adott évben |
| `lib/mds.js` | 2D beágyazás a távolságokból |
| `lib/layout.js` | címkeelrendezés, arányos beillesztés |
| `lib/hull.js` | konvex burok és a köré rajzolt lágy folt (családok) |
| `lib/detail.js` | adatlapok |
| `lib/i18n.js` | nyelvek: minden felületi szöveg, a tengelyek és a korszakcímkék fordítása |
| `data/` | a műfajok, élek és tengelyek – [formátumleírás](data/README.md) |
| `data/validate.mjs` | adat- és fordításellenőrző: `node data/validate.mjs` |

## Mi van kész

**Tengelyes nézet** – bármelyik két tengely választható X-nek és Y-nak, alapnézet tempó × ritmusrács.

**Csillagtérkép** – a pozíciót az összes tulajdonság együtt adja; ami hangzásban hasonló,
az közel kerül. Rajta:
- *évcsúszka és lejátszás*: a műfajok akkor jelennek meg, amikor létrejöttek, és a saját
  pályájuk mentén mozognak tovább. Nyomvonal mutatja, honnan jöttek, nyíl azt, merre tartanak.
  A sebesség év/másodpercben állítható (1–16, alapérték 4); az év lejátszás közben
  folyamatosan csúszik, nem egész évenként ugrik
- *kapcsolatok színnel*: zöld folytonos = ebből lett, lila szaggatott = hatott rá.
  A hatás lehet időszakos – az `until` éve után halvány nyomként marad. Jelmagyarázat
  a térkép alatt, a kiválasztott műfaj kapcsolatai kiemelve
- *hiányzó rések* (narancs szaggatott): két közel álló műfaj, akik közt üres a hely.
  Az adott évre számolódik újra
- *családok* (lágy folt a tagok köré, a nevével alatta): nagyobb összefoglaló halmazok,
  Ishkur „scene" címkéihez hasonlóan. A tagság leszármazás szerinti, a pozíció hangzás
  szerinti – ahol idegen műfaj esik a folton belülre, az a látnivaló, nem hiba
  (a techno a house foltjában ül, a hard techno a hardcore-éban). Évcsúszkára
  újraszámolódik, kapcsolóval kikapcsolható
- *tengelysúly-csúszkák*: a súlyok átállításával más térkép jön ki
- *érzett tempó* kapcsoló: a half-time műfajok a valódi érzetük szerint (dubstep 140 helyett 70)

A beágyazás **egyszer** fut, az összes műfaj összes korszakán – nem évenként újra.
Így a keret állandó: az évcsúszka húzásakor a műfajok mozognak, nem a térkép fordul át.

**Adatlap** – leírás, jellemzők, dobrács, rokon műfajok az átmenet leírásával
(mit vettek el / helyeztek át / adtak hozzá). Csillagtérképen a legközelebbi szomszédok is,
megjelölve, ahol nincs köztük származási szál – az a hasonlóság nem leszármazásból jön.
A rés-vonalra kattintva pedig az jön elő, hogy mi kerülne oda.

**Nyelvválasztó** – magyar és angol, a fejléc jobb szélén. Első nyitáskor a böngésző
nyelve dönt, utána a választás megmarad (`localStorage`). Váltáskor a nézetek újraépülnek,
de a beállításaik – év, tengelysúlyok, kapcsolók, kiválasztott műfaj – megmaradnak.

Ami fordítva van: minden felületi szöveg, a tengelyek neve és kategóriái, valamint a
korszakcímkék. Ami **nem**: a műfajok saját szövege – összefoglaló, korszak-jegyzet,
él-jegyzet és az átmenetek felsorolásai –, ezek az adatban állnak, egyelőre csak magyarul.
Angol felületen tehát vegyes nyelvű az adatlap. Új nyelv felvétele két fájlt érint:
`lib/i18n.js` – egy-egy blokk a `STRINGS`, `AXES` és `ERA_LABELS` táblákban, plusz a nyelv
kódja a `LANGS` listában –, és `index.html`, ahol a kapcsoló gombjai vannak.

## Mi nincs még kész

Idővonal, dobminta lejátszása, hangpéldák. Lásd `plan.md`.
