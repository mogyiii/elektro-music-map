# Adatformátum

Három fájl. Minden nézet ebből a háromból dolgozik.

| Fájl | Mi van benne |
|---|---|
| `axes.json` | tengelydefiníciók, kategória-hasonlóságok, súlyok, a rés-keresés paraméterei |
| `genres.json` | a műfajok tulajdonságvektorai (térképekhez) |
| `edges.json` | származási élek (idővonalhoz és a halvány szálakhoz) |

A JSON-ban `$comment` kezdetű kulcsok a magyarázatok – a feldolgozó kód hagyja figyelmen kívül őket.

Bővítés után érdemes lefuttatni: `node data/validate.mjs`. Ellenőrzi az id-ket, az élek
hivatkozásait, az évszámok sorrendjét, a dobrácsok hosszát és a kategória-mátrixok teljességét.

## genres.json – mezők

| Mező | Típus | Megjegyzés |
|---|---|---|
| `id` | kebab-case szöveg | egyedi, az élek erre hivatkoznak |
| `name` | szöveg | megjelenítendő név |
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

## Korszakok (`eras`)

Egy műfaj nem pont, hanem pálya: a 85-ös techno és a mai techno nem ugyanaz.
Aminek van `eras` mezője, az a csillagtérképen **mozog** az évcsúszka mentén.

Minden korszak **teljes** pillanatkép – mind a hat tengely szerepel benne, plusz:

| Mező | Jelentés |
|---|---|
| `from` | mikortól érvényes ez a korszak |
| `label` | rövid név („detroiti", „brostep") |
| `note` | mi változott és miért |

Szabályok (a `validate.mjs` ellenőrzi):
- az első korszak `from` értéke egyezzen a műfaj `year` mezőjével
- a korszakok időrendben legyenek
- **az utolsó korszak egyezzen a felső szintű értékekkel** – az a mai állapot, és
  nem lehet belőle két különböző igazság
- legalább két korszak legyen; egynél hagyd el az egész `eras` mezőt

A korszakok közt a térkép egyenletesen csúsztatja át a műfajt, így a mozgás folyamatos.

**Jelenleg négy műfajnak van korszaka** – techno, trance, hard techno, dubstep –, és
ezek az én becsléseim, ellenőrizendők. A másik 35 egy helyben áll, amíg nem kap `eras` mezőt.

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

**0. A műfajlista 39 bejegyzésnél tart.** Összehasonlításul: Ishkur's Guide kb. 166 címkével
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

**3. Bizonytalan évszámok.** Mindegyik becslés, de ezek a leginkább vitathatók:
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
