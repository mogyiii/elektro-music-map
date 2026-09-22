# Adatformátum

Három fájl. Minden nézet ebből a háromból dolgozik.

| Fájl | Mi van benne |
|---|---|
| `axes.json` | tengelydefiníciók, kategória-hasonlóságok, súlyok, a rés-keresés paraméterei |
| `genres.json` | a műfajok tulajdonságvektorai (térképekhez) |
| `edges.json` | származási élek (idővonalhoz és a halvány szálakhoz) |

A JSON-ban `$comment` kezdetű kulcsok a magyarázatok – a feldolgozó kód hagyja figyelmen kívül őket.

Bővítés után érdemes lefuttatni: `node data/validate.mjs`. Ellenőrzi az id-ket, az élek
hivatkozásait, az évszámok sorrendjét, a dobrácsok hosszát, a kategória-mátrixok
teljességét és a fordítások meglétét.

## Nyelv

Az adat magyarul van, és a prózai része az is marad: a `summary`, a `notes`, a korszakok
`note` mezője, az élek `note`-ja és a `changes` listái angol felületen is magyarul
jelennek meg.

Ami **fordítva** van, az a rövid címkék köre: az `axes.json` `label` és `categories`
értékei, a korszakok `label` mezője és a családok neve. A fordítás nem itt áll, hanem
`lib/i18n.js`-ben (`AXES`, `ERA_LABELS`, `FAMILY_LABELS`) – így az adatséma egynyelvű
és egyszerű maradt.

Ebből egy szabály következik: **új tengely, kategória, korszakcímke vagy családnév
felvételekor a fordítását is fel kell venni** `lib/i18n.js`-be. Ezt a `validate.mjs` ellenőrzi, mert
különben csendben elsülne: a szó angol felületen is magyarul jelenne meg, hibaüzenet
nélkül. A magyar a referencia – ami abban van, annak minden nyelvben meg kell lennie.

Fordítva is szól: ha egy korszakcímke kikerül az adatból, a hozzá tartozó fordítás
figyelmeztetést kap, mert már nincs mire vonatkoznia.

## genres.json – mezők

| Mező | Típus | Megjegyzés |
|---|---|---|
| `id` | kebab-case szöveg | egyedi, az élek erre hivatkoznak |
| `name` | szöveg | megjelenítendő név |
| `family` | kulcs vagy hiányzik | melyik összefoglaló halmazba tartozik – lásd lentebb |
| `year` | szám | mikortól számít önálló műfajnak – **becslés, ellenőrizendő** |
| `rhythmGrid` | tömb | mindig tömb, akkor is, ha egy elemű. Több elem = vegyes rács (pl. UK bass) |
| `tempo` | `{min, max, felt}` | `felt` = az érzett tempó half-time-nál (dubstep: 140, de 70-nek hat). Ha nincs, `null` |
| `density` | 1–5 | |
| `lead` | tömb | főszereplő, lehet több (pl. `["drums","bass"]`) |
| `function` | 0–1 | 0 = tiszta hallgatás, 1 = tiszta tánc |
| `change` | 0–1 | mennyit változik a zene önmagához képest: 0 = végig ugyanaz, 1 = szinte semmi nem ismétlődik |
| `summary` | szöveg | az adatlapra |
| `externalInfluences` | tömb | olyan hatások, amik **nem** műfajok a listában (jamaikai dub, disco, funk breakek) |
| `drumPattern` | `{kick, snare, hat}` vagy `null` | 16 hosszú 0/1 tömbök, egy 4/4 ütem 16-odokban |
| `examples` | tömb | **szándékosan üres**, lásd lentebb |
| `notes` | szöveg | amit tudni kell, de nem fér a summary-be |
| `eras` | tömb vagy hiányzik | korszakok, ha a műfaj változott az idők során |

## Családok (`families` + `family`)

Nagyobb összefoglaló halmazok a csillagtérképre: a tagjaik köré egy lágy folt
rajzolódik, a család nevével. A `families` blokk a fájl tetején áll, minden
bejegyzés egy `label` és egy `color`; a műfajok a `family` mezővel hivatkoznak rá.

Jelenleg tizenegy van: House, Techno, Trance, Hardcore, Jungle / D&B, UK bass, Breaks,
Ambient, Acid, Juke, Electronica.

**A tagság leszármazás szerinti, a pozíció viszont hangzás szerinti.** Ezért eshet
idegen műfaj a folton belülre – és ez nem hiba, hanem pont az, amiért a projekt készült.
A legbeszédesebbek: az acid house a house és a techno foltjában is benne ül, pedig az
Acid családba tartozik; a hard techno a hardcore-éban; a hard trance az Acidéban.

A `family` **elhagyható**. Akinek nincs testvére a listán, az ne kapjon – jelenleg így
jár a `trap` és a `future-bass`. Egytagú családot sem érdemes felvenni: abból egyetlen
pont köré rajzolt karika lesz.

Egy családot akkor érdemes felvenni, ha a tagjai **tömören** ülnek a térképen. A funkció
szerinti csoportosítás itt megbukik: egy „hallgatós" halmaz (ambient, drone, downtempo,
trip-hop, IDM) a képernyő átlójának 41%-át fedte le, vagyis a fél térképet. A mostani
tizenegy család mind 29% alatt van.

## Korszakok (`eras`)

Egy műfaj nem pont, hanem pálya: a 85-ös techno és a mai techno nem ugyanaz.
Aminek van `eras` mezője, az a csillagtérképen **mozog** az évcsúszka mentén.

Minden korszak **teljes** pillanatkép – mind a hat tengely szerepel benne, plusz:

| Mező | Jelentés |
|---|---|
| `from` | mikortól érvényes ez a korszak |
| `label` | rövid név („detroiti", „brostep") – a fordítása `lib/i18n.js` → `ERA_LABELS` |
| `note` | mi változott és miért – ez próza, nem fordul |

Szabályok (a `validate.mjs` ellenőrzi):
- az első korszak `from` értéke egyezzen a műfaj `year` mezőjével
- a korszakok időrendben legyenek
- **az utolsó korszak egyezzen a felső szintű értékekkel** – az a mai állapot, és
  nem lehet belőle két különböző igazság
- legalább két korszak legyen; egynél hagyd el az egész `eras` mezőt

A korszakok közt a térkép egyenletesen csúsztatja át a műfajt, így a mozgás folyamatos.

**Jelenleg 17 műfajnak van korszaka az 55-ből**, összesen 63 pillanatképpel. Ezek az én
becsléseim, ellenőrizendők. A maradék 38 egy helyben áll, amíg nem kap `eras` mezőt –
ami rendben is van ott, ahol a műfaj tényleg nem mozdult (riddim, drone, footwork).

Három eset, amit a korszakolás megoldott:

- **uk-garage** – 1995-ben még egyenes 4/4, 1997-től 2-step. Az egyetlen műfaj, amelyik
  **ritmusrácsot vált** a pályája közben.
- **tearout** – a 2010-es brostep és a 2019 utáni hullám egy műfaj két korszaka, nem két
  bejegyzés. A `notes` mező eddig nyitott kérdésként tartotta.
- **progressive-house** – a 92-es brit és a 2010-es fesztiválos ugyanígy.

### A „változás" tengely

Ezt az adat kérte, nem én: az ambient és a drone távolsága **pontosan 0** volt öt tengellyel,
mert mindkettő „nincs ütem, sűrűség 1, hangszín, hallgatás".

A **sűrűség** azt méri, mennyi szól egyszerre. A **változás** azt, hogy mennyi változik
közben. A riddim és a minimal techno mindkettő ritka, de az egyik szándékosan áll egy
helyben (0.15), a másik folyamatosan csúszik (0.35). A két szélső érték a listán:
drone 0.05, IDM 0.95.

### Hiányzó értékek

`tempo.min` / `tempo.max` lehet `null` (ambient, drone). Ilyenkor a tempó tengely **kimarad**
a távolságszámításból, és a súlyok újranormálódnak a megmaradt tengelyeken.
**Nem szabad 0-val helyettesíteni** – akkor a lassú műfajok szomszédjának tűnnének.

## edges.json – mezők

| Mező | Megjegyzés |
|---|---|
| `from`, `to` | `genres.json`-beli id-k |
| `type` | `parent` (közvetlen leszármazás) vagy `influence` (hatás más ágból) |
| `year` | mikor történt az átmenet, illetve mikortól hat |
| `until` | **csak hatásnál**: meddig volt eleven a befolyás. Ha nincs megadva, máig tart |
| `changes` | `{removed, moved, added}` – szöveges listák |
| `note` | |

A `changes` a projekt lényege: az átmenet nemcsak hozzáadás, hanem **elvétel és áthelyezés** is.
Ezért van az átmenet leírása az **élen**, nem a műfajon.

### A két fajta kapcsolat

A **leszármazás** (`parent`) végleges: ami egyszer megtörtént, az később is igaz marad.
A térképen zöld folytonos vonal.

A **hatás** (`influence`) lehet időszakos: „nem ebből származik, de ezekben az években
erősen hatott rá". A térképen lila szaggatott vonal, és az `until` év után halvány
nyomként marad – megtörtént, de már nem eleven. Az évcsúszkát húzva a hatások
felgyulladnak és elhalványodnak.

Példa: a trap **nem** a dubstepből származik, de 2012 és 2016 között erősen hatott rá.

## Ami hiányzik, és ez döntést igényel

**0. A műfajlista 55 bejegyzésnél tart.** Összehasonlításul: Ishkur's Guide kb. 166 címkével
dolgozik. Az ő adatvégpontjaik (`coords.json`, `scenelabels.json`, `genrebiglabels.json`)
viszont **csak neveket és a megrajzolt térképük poligonjait** tartalmazzák – se tempó,
se ritmus, se származási élek. Átvenni tehát nincs mit: a mi hat tengelyünk értékeit
műfajonként meg kell ítélni. A névlistájuk ellenőrzőlistának jó.

**1. Külső szülők.** Négy műfaj szülője nem elektronikus műfaj, ezért nem szerepel a
listában, és nincs hozzájuk befelé mutató él: house ← disco, techno ← elektro/funk,
breakbeat ← hip-hop/funk breakek, drone ← komolyzenei minimalizmus. Lásd
`edges.json` → `missingParents`. Az idővonalon ezek lesznek a gyökerek.

**2. A hangpéldák üresek.** Az `examples` mezőket szándékosan nem töltöttem ki –
a linkek kitalálása rosszabb, mint az üres mező. A tervezett alak:
`{ "title": "Előadó – Cím", "url": "https://...", "source": "youtube" }`

**3. A legutóbbi 16 bejegyzés végig becslés.** `garage-house`, `ghetto-house`, `juke`,
`acid-techno`, `acidcore`, `hard-trance`, `uplifting-trance`, `melodic-techno`,
`hardgroove`, `amapiano`, `big-room`, `frenchcore`, `jump-up`, `bassline`,
`future-garage`, `glitch` – a tengelyértékeik, évszámaik és dobrácsaik ugyanolyan
megítélés kérdései, mint a többié, csak még senki nem nézte át őket. Egy közülük
kifejezetten meg van csonkítva: a **frenchcore** valójában 190–220 BPM-ig megy, de az
`axes.json` tempó tengelye 200-ig van definiálva, és a normálás e fölött elromlana.
Ha kell a valódi sáv, a tengely `range` mezőjét is fel kell vinni – az viszont az
összes műfaj közti tempótávolságot átskálázza.

**3/b. Bizonytalan évszámok.** Mindegyik becslés, de ezek a leginkább vitathatók:
- `hard-techno` (1993) – a 145–160 BPM a mai formára igaz, a 90-es évekbeli lassabb volt;
  lehet, hogy két külön bejegyzés kéne
- `tearout` (2010) – a 2010 körüli brostep és a 2019 utáni tearout-hullám nem ugyanaz
- `riddim` (2015), `breakbeat` (1990) – a „mikortól önálló" határ itt elmosódott

**4. A kategória-hasonlóságok az `axes.json`-ban az én becsléseim.** Pl. hogy a 2-step és
a breakbeat 0.6-os hasonlóságú, a straight és a broken meg 0.2-es. Ezek közvetlenül
befolyásolják, mi hol lesz a csillagtérképen – érdemes átnézni.

**5. A dobrácsok vázlatosak.** Két dolog derült ki a kitöltésük közben:
- a house, minimal techno, trance, hard techno, bass house és dub techno dobrácsa
  **majdnem azonos** – ezeket nem a ritmus különbözteti meg, hanem a tempó, a sűrűség
  és a főszereplő. Ez nem hiba az adatban, hanem tényleges megállapítás
- a dubstep és a riddim dobrácsa is szinte azonos – ott a basszus a különbség,
  amit a 16 lépéses dob/pergő/hi-hat rács nem tud megmutatni. Lehet, hogy kell egy
  negyedik sor a basszusnak
- a jungle valódi breakje két ütemen át fut, a 16 lépés ezt leegyszerűsíti
