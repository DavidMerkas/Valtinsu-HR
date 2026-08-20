# Valtinsu Hrvatska

Staticna stranica zastupnika Valtinsu elektricnih off-road motocikala
za hrvatsko trziste. Cisti HTML, CSS i JavaScript, bez frameworka i bez
build koraka.

Uzivo za pregled: https://davidmerkas.github.io/Valtinsu-HR/

## Stranice

Pocetna, Modeli, tri stranice modela (EM-5, EM-5 PRO, EM-5 Ultra),
O nama i Kontakt.

## Struktura

```
index.html, modeli.html, o-nama.html, kontakt.html
modeli/          stranice pojedinih modela
css/style.css    cijeli dizajn sustav
js/script.js     izbornik, galerija, obrazac, cesta pitanja
assets/          logo, video, teksture, fotografije po modelu
scripts/         alati koji se ne uploadaju
```

## Provjera prije uploada

```bash
node scripts/provjeri.js
```

Izlazni kod 1 ako ima gresaka. Provjerava duljinu naslova i opisa, broj
h1, canonical, jezik, slike bez alt teksta, mrtve poveznice, duge crtice
i privremene slike koje su ostale u kodu.

## Napomene

Kanonske adrese pokazuju na https://www.valtinsu.hr/, pa ova kopija ne
konkurira pravoj stranici u trazilici.

U repozitoriju nema dokumentacije proizvodjaca (`_dokumenti/`) ni izvornog
videa prije obrade. Popis je u `.gitignore`.

## Dostupnost i lista cekanja

Zaliha se mijenja na jednom mjestu, u `js/dostupnost.js`. Prebacivanjem
`dostupno` na `true` model se vraca u prodaju: kartice, kruzici za boju,
cijena, gumbi i obrazac podese se sami.

Dok je model rasprodan, umjesto upita se nudi lista cekanja. Ploca s
prijavom sama iskoci na stranici s upitom i ne moze se zatvoriti, ali
zaglavlje ostaje dostupno pa se moze otici na drugu stranicu.

## Prije objave

- oba obrasca (upit i lista cekanja) nemaju `action`, treba ih spojiti na
  servis koji salje mail; jedan kljuc pokriva oba
- nema `sitemap.xml` ni `robots.txt`, rade se kad se zna konacna domena
- kanonske adrese pokazuju na `https://www.valtinsu.hr/`, domena jos nije
  registrirana
- naziv obrta i OIB nisu upisani, a zakonska su obveza za prodaju na daljinu
- stranica uvjeta poslovanja je privremeno maknuta
- EM-5 Ultra ima jednu potvrdenu fotografiju, komplet jos nije potpun
