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
| `lib/detail.js` | adatlapok |
| `data/` | a műfajok, élek és tengelyek – [formátumleírás](data/README.md) |
| `data/validate.mjs` | adatellenőrző: `node data/validate.mjs` |

## Mi van kész

**Tengelyes nézet** – bármelyik két tengely választható X-nek és Y-nak, alapnézet tempó × ritmusrács.

**Csillagtérkép** – a pozíciót az összes tulajdonság együtt adja; ami hangzásban hasonló,
az közel kerül. Rajta:
- *évcsúszka és lejátszás*: a műfajok akkor jelennek meg, amikor létrejöttek, és a saját
  pályájuk mentén mozognak tovább. Nyomvonal mutatja, honnan jöttek, nyíl azt, merre tartanak
- *kapcsolatok színnel*: zöld folytonos = ebből lett, lila szaggatott = hatott rá.
  A hatás lehet időszakos – az `until` éve után halvány nyomként marad. Jelmagyarázat
  a térkép alatt, a kiválasztott műfaj kapcsolatai kiemelve
- *hiányzó rések* (narancs szaggatott): két közel álló műfaj, akik közt üres a hely.
  Az adott évre számolódik újra
- *tengelysúly-csúszkák*: a súlyok átállításával más térkép jön ki
- *érzett tempó* kapcsoló: a half-time műfajok a valódi érzetük szerint (dubstep 140 helyett 70)

A beágyazás **egyszer** fut, az összes műfaj összes korszakán – nem évenként újra.
Így a keret állandó: az évcsúszka húzásakor a műfajok mozognak, nem a térkép fordul át.

**Adatlap** – leírás, jellemzők, dobrács, rokon műfajok az átmenet leírásával
(mit vettek el / helyeztek át / adtak hozzá). Csillagtérképen a legközelebbi szomszédok is,
megjelölve, ahol nincs köztük származási szál – az a hasonlóság nem leszármazásból jön.
A rés-vonalra kattintva pedig az jön elő, hogy mi kerülne oda.

## Mi nincs még kész

Idővonal, dobminta lejátszása, hangpéldák. Lásd `plan.md`.
