# Terv – mit akarok csinálni

Részletek és műfajlista: `zene-terkep-brief.md`.

## A lényeg egy mondatban

Egy oldal, ami az elektronikus zenei műfajokat **kétféleképpen** mutatja meg egyszerre:
honnan származnak (idővonal), és mire hasonlítanak (hangzás szerinti térkép) – és pont a
kettő **eltérése** az érdekes.

Példa, amiből az ötlet jött: egy mai techno és egy riddim sok mindenben hasonlít,
mégis külön ágból jönnek, és teljesen más dolgok hatottak rájuk. A származási fa ezt
nem mutatja meg. A hangzás szerinti térkép igen.

## Kinek

**Érdeklődő** – be akar tájékozódni, hogy „mi az elektronikus zene", hol mi a helyzet,
mi mihez képest hol van.

**Zenész** – inspirálódni jön. Ehhez nem elég látni, mi van: **azt kell látnia, mi nincs.**
„Várjál, ilyen stílus még nem is létezik." Ez a rész a legfontosabb, és ez az, ami a meglévő
oldalakból (Ishkur, Every Noise) hiányzik.

## Nézetek

Három nézet, ugyanarra az adatra. Váltogathatók.

### 1. Idővonal (származás)
Ishkur-szerű. Mikor jött létre egy műfaj, miből, mi hatott rá. Ez a *származási* igazság.

### 2. Tengelyes térkép (hangzás)
A briefben lévő 5 tengely, bármelyik kettő kiválasztható X-nek és Y-nak.
Alapnézet: tempó × ritmusrács. Ez a *hangzás* igazsága.

### 3. Csillagtérkép (hasonlóság) – ez a fő nézet
Itt a pozíciót **nem** két kiválasztott tengely adja, hanem az összes tulajdonság együtt:
ami hangzásban hasonló, az közel kerül egymáshoz, ami különböző, messze.

**Idő: a műfaj nem pont, hanem pálya.** Egy 20 évvel ezelőtti techno és egy mai techno nem
ugyanott van. Ezért minden műfajnak korszakonként van tulajdonságvektora, és az évcsúszkával
a műfajok a saját pályájuk mentén mozognak – megjelennek, amikor létrejöttek, nyomvonalat
húznak maguk után, és nyíl mutatja, merre tartanak. Ahogy a csillagok kavarognak a galaxisban.

Ehhez egy dolgot rögzíteni kellett: a beágyazás **egyszer** fut, az összes korszakon együtt.
Ha évenként újraszámolnánk, a térkép minden csúszkamozdulatra elfordulna, és a kavargás nem
a zenéről szólna, hanem a számításról.

Kétféle vonal húzható rá, és a kettő nem ugyanaz:

**Származási szálak** (halvány) – ahol tényleges leszármazás van.
Így látszik az, amiért az egészet csinálom: ahol két műfaj közel van egymáshoz, de
**nem vezet köztük szál** – közös hangzás, külön eredet. (techno ↔ riddim)

**Hiányzó rések** (halvány, más jelöléssel) – itt a vonal azt jelenti, hogy
**két műfaj közt még nincs stílus**. Ez váltja ki a korábban tervezett csempefalat:
a rács 5 tengelynél szinte teljesen üres lenne, és a valódi lyukak elvesznének a zajban.
Így viszont minden jelzés két létező műfajhoz van kötve, tehát eleve van értelme.

Mikor rajzolunk ilyen vonalat: ha két műfaj közel van egymáshoz, **de a köztük lévő hely
üres** – nincs harmadik műfaj a szakasz közepe környékén.

A szakasz közepe visszafordítható tengelyértékekre, ezért a vonalra mutatva ki lehet írni,
hogy **mi kerülne oda**: „~133 BPM, half-time felé hajló tört rács, sűrűség 2, basszus
a főszereplő". Nem csak lyukat mutat, hanem receptet.

Fontos: a rés-keresés az **eredeti tulajdonságvektorokon** fusson, ne a képernyő-koordinátákon.
A csillagtérkép 5 dimenzió 2D-be vetítve, tehát két pont látszhat közelinek úgy is, hogy
valójában távol vannak – abból hamis rés lenne.

## Adatmodell

Két külön dolog kell, a mostani táblázatban csak az első van meg:

**Műfaj = tulajdonságok** (a térképekhez)
- a brief 5 tengelye: ritmusrács, BPM, sűrűség, főszereplő, funkció
- ezekből a ritmusrács és a főszereplő kategória, nem szám → a távolságszámításnál
  külön kezelendők (lásd lejjebb)
- leírás, hallgatható példa, 16 lépéses dobminta

**Kapcsolat = él két műfaj között** (az idővonalhoz)
- évszám: mikortól számít önálló műfajnak
- szülő műfaj(ok)
- **hatások** – ez nem ugyanaz, mint a szülő! A dub techno jamaicai dubból jön,
  nem dubstep-rokon, hiába hangzik hasonlónak a neve
- **mit vettek el / helyeztek át** – ez az él saját tulajdonsága, nem a műfajé:
  „minimal techno → dubstep: lábdobok többsége ki, pergő az ütem közepére, half-time lesz"

Vagyis: a hozzáadás mellett az **elvétel és áthelyezés** is átmenet, és ezt az él írja le.

## Hasonlóság – hogyan számoljon

A csillagtérképhez minden műfajpárra kell egy távolság. A tengelyek nem egyformák:

| Tengely | Típus | Hogyan |
|---|---|---|
| tempó | szám | normalizált különbség; a half-time-ot a *hatás* szerint is érdemes nézni (dubstep 140, de 70-nek hat) |
| sűrűség | szám (1–5) | normalizált különbség |
| funkció | szám (tánc ↔ hallgatás) | normalizált különbség |
| változás | szám (0–1) | normalizált különbség |
| ritmusrács | kategória | egyezik / nem egyezik, de a rokon rácsok (2-step ↔ breakbeat) ne számítsanak teljesen idegennek |
| főszereplő | kategória | ugyanígy, többértékű is lehet (dob + basszus) – a párosítások **átlaga** számít, nem a legjobb egyezés |

A **változás** tengely nem a tervben volt, az adat kérte: nélküle az ambient és a drone
távolsága pontosan 0. A sűrűség azt méri, mennyi szól egyszerre; ez azt, hogy mennyi
változik közben.

A **főszereplő átlagolása** is menet közben derült ki. A „legjobb egyezés" szabály túl
elnéző volt: ha két műfaj akár egyetlen főszereplőn osztozott, a tengely nullát adott.
Emiatt ült egymáson a drum & bass és a neurofunk, meg a hard techno és a hardstyle.

A tengelyek súlyozhatók legyenek – ha a ritmusrács súlyát felviszem, más térkép jön ki.
Érdemes csúszkaként kitenni, mert magát a kérdést is ez teszi vizsgálhatóvá.

Megoldandó: az ambientnek és a drone-nak **nincs** BPM-e. Ezeknél a tempó nem nulla,
hanem hiányzik – a távolságszámításból ki kell hagyni, nem 0-val behelyettesíteni,
különben a lassú műfajok szomszédjának tűnnének.

## Technika

- statikus oldal (HTML/JS), hosztolás GitHub Pages
- az adat külön JSON fájl(ok)ban, hogy könnyen bővíthető legyen
- dobminták Web Audio API-val generálva – nem kell hangfájl
- hangpéldák: YouTube/Spotify/SoundCloud beágyazás vagy link (jogi okból nem saját hoszt)
- mobilon is használható

## Sorrend

1. ~~**Adat először.**~~ Kész: 17 műfaj évszámmal és élekkel, `data/`.
2. ~~Tengelyes nézet + kattintható adatlap.~~ Kész.
3. ~~Csillagtérkép a hasonlósági számítással.~~ Kész.
4. ~~A két vonaltípus rá: származási szálak, majd hiányzó rések.~~ Kész.
5. ~~Évcsúszka a csillagtérképre: mikor jelent meg, merre mozog.~~ Kész, de korszak-adat kell hozzá.
6. Idővonal (a származási fa, Ishkur-szerűen).
7. Dobminta-rács és lejátszás.

## A kapcsolat kétféle, és ez látszik is

**Ebből lett** (zöld folytonos): tényleges leszármazás, végleges.

**Hatott rá** (lila szaggatott): nem ebből származik, de befolyásolta – és ez lehet
**időszakos**. Az élnek van kezdő és (ha kell) záró éve, így az évcsúszkát húzva
a hatások felgyulladnak, majd elhalványodnak. Ami lejárt, halvány nyomként marad:
megtörtént, de már nem eleven.

A példa, ami miatt ez kell: a trap **nem** a dubstepből származik, de 2012 és 2016
között erősen hatott rá.

## Mi kell még az adatba

- **Korszakok a többi műfajhoz.** Most négynek van (techno, trance, hard techno, dubstep),
  a másik 35 egy helyben áll. A mozgás csak annyira lesz élő, amennyire ez feltöltődik.
- **Még egy tengely?** A „változás" bekerült, és az ambient/drone ütközést megoldotta.
  A gabber viszont továbbra is a hiányra mutat: ott a lábdob már nem ritmus, hanem
  hangszín, és ezt a „főszereplő" tengely nem tudja kifejezni. Következő jelölt:
  **nyersesség** (tiszta ↔ torz), esetleg a **tér** (száraz ↔ visszhangos).
- **Még több műfaj.** 39-nél tartunk; Ishkur kb. 166 címkével dolgozik. Az ő végpontjaik
  viszont csak neveket és a rajzuk poligonjait adják – a mi öt tengelyünkhöz semmit.
  A névlistájuk ellenőrzőlistának jó, az adatot magunknak kell megítélni.
- **Hiányzó láncszemek.** Néhány élnél kiderült, hogy a köztes műfaj hiányzik
  (pl. house → footwork a chicagói ghetto house-on keresztül).

Amit a megvalósítás közben tanultunk, és ami a további munkát befolyásolja:

- **A réskeresés adatszegény 17 műfajnál.** A mechanizmus működik, de a klaszterek
  szorosak, köztük nagy üres terek – 8 rés jön ki, abból 3 olyan, amit nem köt össze
  származási szál. Ez a szám a műfajlista bővülésével nő meg érdemben.
- **Az ambient és a drone távolsága pontosan 0.** A mostani 5 tengely nem tudja
  megkülönböztetni őket. Vagy új tengely kell (mozgás? változás sebessége?),
  vagy a kettőt egyként kell kezelni.
- **A vetítés torzít.** 5 dimenzió 2-be: a torzítás kb. 0.12. A képernyőn látott
  távolság közelítés – ezért fut minden számítás az eredeti vektorokon.

## Nyitott kérdések

- Hány tengely kell valójában? Lehet, hogy az 5 közül van, ami nem különböztet meg semmit.
- Milyen közel kell lennie két műfajnak, hogy rés-vonalat kapjanak? Túl megengedő küszöb
  → tele lesz vonallal a kép, és semmit nem mond. Lehet, hogy csúszka kell rá, vagy
  egyszerűen csak a legerősebb N darabot mutatjuk.
- Lesz olyan rés, ami zeneileg nem működne. Kell-e ezt kiszűrni, vagy elég, ha a felkínált
  „recept" alapján az ember maga eldönti?
- A csillagtérkép elrendezése determinisztikus legyen (ugyanaz az adat = ugyanaz a kép),
  hogy ne mozogjon el minden betöltéskor.
- Meddig érdemes bontani a műfajokat? (tearout külön van a dubsteptől – hol a határ?)
