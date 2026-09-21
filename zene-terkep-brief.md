# Elektronikus zene térkép – projektleírás

## Cél
Interaktív weboldal, amely az elektronikus zenei műfajokat **hangzás és ritmus alapján** rendezi térképre, nem származás szerint. Nekem rendszerezésre, és bárkinek, akit érdekel a téma.

Miért kell: a meglévő források vagy származás szerintiek (Ishkur's Guide, music.ishkur.com – kb. 2014–2019 óta nem bővül érdemben, az újabb bass-műfajok hiányoznak), vagy befagytak (Every Noise at Once, everynoise.com – 2023 decembere óta nem frissül).

## Az alapötlet
Az „elektronikus" előállítási mód, nem stílus. A műfajokat tulajdonságok szerint kell elhelyezni. A gyökér a **lüktetés**, nem egy konkrét műfaj.

Fontos felismerés: egyik műfajból a másik nemcsak rétegek hozzáadásával jön ki, hanem **elvétellel és áthelyezéssel** is (pl. minimal techno → dubstep: lábdobok többsége ki, pergő az ütem közepére, half-time lesz).

## Tengelyek
1. **Ritmusrács**: egyenes (4/4 lábdob) / tört (breakbeat) / half-time / nincs ütem
2. **Tempó** (BPM)
3. **Sűrűség**: 1 (minimalista) – 5 (zsúfolt)
4. **Főszereplő**: dob / basszus / dallam / hangszín
5. **Funkció**: tánc ↔ hallgatás

## Kezdő műfajlista (bővítendő)

| Műfaj | Ritmusrács | BPM | Sűrűség | Főszereplő | Funkció | Megjegyzés |
|---|---|---|---|---|---|---|
| house | egyenes | 118–128 | 2 | dob + basszus groove | tánc | |
| minimal techno | egyenes | 125–130 | 1 | dob, hangszín | tánc | |
| trance | egyenes | 135–140 | 3 | dallam | tánc | |
| hard techno | egyenes | 145–160 | 4 | dob | tánc | industrial ágon torz basszus |
| bass house | egyenes | 125–128 | 4 | basszus | tánc | techno/house rács + dubstep-szerű basszus |
| dub techno | egyenes | 115–125 | 2 | hangszín | tánc/hallgatás | NEM dubstep-rokon, jamaicai dubból |
| UK garage | tört (2-step) | 130–135 | 3 | dob groove | tánc | a dubstep őse |
| breakbeat | tört | 125–135 | 3 | dob | tánc | |
| jungle | tört | 160–170 | 4 | dob | tánc | |
| drum & bass | tört | 170–176 | 4 | dob + basszus | tánc | pihenő nélkül gördül |
| UK bass / post-dubstep | vegyes | 130–140 | 2 | basszus | tánc | dubstep → techno átmenet |
| dubstep | half-time | 140 (70-nek hat) | 3 | basszus | tánc | |
| riddim | half-time | 140–150 | 2 | basszus | tánc | monoton, triolás wobble |
| tearout | half-time | 140–150 | 5 | basszus, hangszín | tánc | torz, agresszív |
| ambient | nincs | – | 1 | hangszín | hallgatás | |
| drone | nincs | – | 1 | hangszín | hallgatás | |

## Oldal – elvárások
- Interaktív térkép: a műfajok pontként/címkeként jelennek meg
- Nézetváltás: bármelyik két tengely kiválasztható X-nek és Y-nak (alapnézet: tempó × ritmusrács)
- Kattintásra adatlap: leírás, jellemzők, rokon műfajok, példa (hallgatható)
- Dobminta-rács műfajonként (16 lépéses, lábdob / pergő / hi-hat sor) – ez mutatja meg a legjobban a különbségeket
- Mobilon is használható legyen

## Nyitott kérdések
- Hangpéldák: saját hosztolás helyett valószínűleg YouTube/Spotify/SoundCloud beágyazás vagy link (jogi okból)
- Dobminták lejátszása: Web Audio API-val a böngészőben generálható, így nincs szükség hangfájlokra
- Adatformátum: a műfajlista külön JSON fájlban, hogy könnyű legyen bővíteni
- Hol legyen hosztolva (pl. GitHub Pages)

## Első lépés
Statikus oldal (HTML/JS), a fenti műfajlista JSON-ban, alapnézet tempó × ritmusrács, kattintható adatlapokkal.
