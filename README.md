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

## Prije objave

- obrazac za upit nema `action`, treba ga spojiti na servis koji salje mail
- naziv obrta i OIB nisu upisani, a zakonska su obveza za prodaju na daljinu
- stranica uvjeta poslovanja je privremeno maknuta
- EM-5 Ultra jos nema svoje fotografije
