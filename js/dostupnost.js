/* ==========================================================================
   VALTINSU HR - dostupnost modela

   JEDINO MJESTO koje se mijenja kad se promijeni zaliha. Ostalo se
   podesi samo: kartice, kruzici za boju, cijena, gumbi i obrazac.

   Kad novi stock stigne, dovoljno je prebaciti "dostupno" na true i,
   ako treba, promijeniti "upitOd" i "poruka".
   ========================================================================== */

window.VALTINSU_STANJE = {

  /* Datum od kojeg se za rasprodane modele opet moze slati upit.
     Prazno znaci da se datum nigdje ne spominje. */
  upitOd: '15. 9.',

  /* Recenica koja ide uz rasprodane modele. */
  poruka: 'Novi primjerci stižu sredinom rujna.',

  /* dostupno: false -> model je rasprodan, upit za njega je zatvoren.
     boje:     opcionalno, po pojedinoj boji. Ako boje nema, sve su
               dostupne dok je i model dostupan. */
  modeli: {
    'EM-5':       { dostupno: false },
    'EM-5 PRO':   { dostupno: false },
    'EM-5 Ultra': { dostupno: false }
  },

  /* Lista cekanja. Kad je model rasprodan, umjesto upita se nudi da
     kupac ostavi kontakt.

     VAZNO: "action" mora pokazivati na servis koji salje mail, isto kao
     kod glavnog obrasca. Dok je prazan, obrazac javlja gresku umjesto da
     podaci tiho nestanu. */
  obavijesti: {
    ukljuceno: true,
    action: '',
    naslov: 'Osiguraj svoj e‑bike već danas',   /* ‑ je nelomljiva crtica: 'e-bike' ostaje u jednom komadu */
    uvod: 'Ostavite kontakt i javimo se čim motocikli budu dostupni. ' +
          'Bez newslettera, jedna poruka i to je to.'
  }
};

(function () {
  'use strict';

  var stanje = window.VALTINSU_STANJE;
  if (!stanje) return;

  var zapis = function (model) { return stanje.modeli[model] || null; };

  var jeDostupan = function (model) {
    var z = zapis(model);
    return !z || z.dostupno !== false;
  };

  var bojaDostupna = function (model, boja) {
    var z = zapis(model);
    if (!z || z.dostupno === false) return false;
    if (!z.boje || !(boja in z.boje)) return true;
    return z.boje[boja] !== false;
  };

  var listaRadi = function () {
    return !!(stanje.obavijesti && stanje.obavijesti.ukljuceno);
  };

  var kratko = function () {
    return stanje.upitOd ? 'Upit od ' + stanje.upitOd : 'Trenutno nedostupno';
  };

  /* --- 1. Kartice modela u mrezama ------------------------------------- */

  document.querySelectorAll('.model-cell[data-model]').forEach(function (cell) {
    var model = cell.getAttribute('data-model');
    if (jeDostupan(model)) return;

    cell.classList.add('je-rasprodano');

    var ime = cell.querySelector('.model-cell__name');
    if (ime) {
      var oznaka = document.createElement('span');
      oznaka.className = 'oznaka oznaka--rasprodano';
      oznaka.textContent = 'Rasprodano';
      ime.insertAdjacentElement('afterend', oznaka);
    }

    /* Poveznica na upit se mijenja. Ako je lista cekanja ukljucena,
       nudi se prijava; ako nije, ostaje samo datum bez klika. */
    cell.querySelectorAll('a[href*="kontakt.html"]').forEach(function (a) {
      var zamjena;
      if (listaRadi()) {
        zamjena = document.createElement('button');
        zamjena.type = 'button';
        zamjena.className = 'link-arrow js-javi';
        zamjena.textContent = 'Obavijesti me';
      } else {
        zamjena = document.createElement('span');
        zamjena.className = 'link-arrow link-arrow--ugaseno';
        zamjena.textContent = kratko();
      }
      a.replaceWith(zamjena);
    });
  });

  /* --- 2. Stranica modela ----------------------------------------------- */

  var kadroviEl = document.getElementById('kadrovi');
  if (kadroviEl) {
    var model = null;
    try { model = JSON.parse(kadroviEl.textContent).model; } catch (e) { model = null; }

    if (model) {
      /* Kruzici za boju: precrtaj one kojih nema. Isti tretman koji
         trgovine koriste za rasprodane velicine. */
      document.querySelectorAll('#boje [data-boja]').forEach(function (krug) {
        if (bojaDostupna(model, krug.getAttribute('data-boja'))) return;
        krug.classList.add('je-rasprodano');
        krug.setAttribute('aria-disabled', 'true');
        var naslov = krug.getAttribute('title') || '';
        krug.setAttribute('title', naslov + ' (rasprodano)');
      });

      if (!jeDostupan(model)) {
        var cijena = document.querySelector('.product__price');
        if (cijena) {
          var b = cijena.querySelector('b');
          var span = cijena.querySelector('span');
          if (b) b.textContent = 'Trenutno rasprodano';
          /* Datum ne ide i ovdje: stoji odmah ispod, na mjestu gumba. */
          if (span) span.textContent = stanje.poruka;
          cijena.classList.add('product__price--rasprodano');
        }

        /* Gumb za upit se mice. Klijent je izricito trazio da se za
           rasprodan model upit ne moze poslati. */
        document.querySelectorAll('.product__info .btn[href*="kontakt.html"]').forEach(function (btn) {
          var zamjena;
          if (listaRadi()) {
            zamjena = document.createElement('button');
            zamjena.type = 'button';
            zamjena.className = 'btn btn--primary js-javi';
            zamjena.textContent = 'Obavijesti me';
          } else {
            zamjena = document.createElement('p');
            zamjena.className = 'nema-upita';
            zamjena.textContent = kratko();
          }
          btn.replaceWith(zamjena);
        });
      }
    }
  }

  /* --- 3. Obrazac za upit ------------------------------------------------ */

  var polje = document.getElementById('model');
  if (polje) {
    var ugaseno = [];

    Array.prototype.forEach.call(polje.options, function (opt) {
      if (!opt.value || jeDostupan(opt.value)) return;
      opt.disabled = true;
      opt.textContent = opt.textContent + '  ·  rasprodano';
      ugaseno.push(opt.value);

      /* Rasprodan model moze doci iz poveznice (?model=em-5). Preglednik
         dopusta da onemoguceni zapis ostane odabran, pa se izbor cisti
         rucno, a promjena se javi da se ploca sa slikom zatvori. */
      if (opt.selected) {
        polje.value = '';
        polje.dispatchEvent(new Event('change'));
      }
    });

    /* Bocni stupac s WhatsAppom: ista napomena, da netko ne pise poruku
       za model kojeg trenutno nema. */
    var obecanje = document.querySelector('.upit__bok .bok__tekst');
    if (obecanje && Object.keys(stanje.modeli).every(function (m) { return !jeDostupan(m); })) {
      obecanje.textContent = 'Javljamo se čim motocikli stignu. ' +
        'Za sva ostala pitanja odgovaramo u roku 24 sata.';
    }

    var bok = document.querySelector('.upit__bok .stack');
    if (bok && Object.keys(stanje.modeli).some(function (m) { return !jeDostupan(m); })) {
      var bokNota = document.createElement('p');
      bokNota.className = 'bok__tekst mt-1';
      var ima = Object.keys(stanje.modeli).filter(jeDostupan);
      bokNota.textContent = (ima.length
        ? 'Trenutno je dostupan samo ' + ima.join(', ') + '.'
        : 'Svi modeli su trenutno rasprodani.') +
        (stanje.upitOd ? ' Javljamo se od ' + stanje.upitOd : '');
      bok.insertAdjacentElement('afterend', bokNota);
    }

    if (ugaseno.length) {
      var nota = document.createElement('p');
      nota.className = 'field__nota';
      /* Datum vec zavrsava tockom, pa se druga ne dodaje. */
      nota.textContent = stanje.poruka +
        (stanje.upitOd ? ' Za rasprodane modele upit primamo od ' + stanje.upitOd : '');
      var greska = document.getElementById('err-model');
      if (greska) greska.insertAdjacentElement('afterend', nota);
    }
  }
})();

/* ==========================================================================
   LISTA CEKANJA
   Kad je model rasprodan, umjesto upita se nudi da kupac ostavi kontakt.
   Na stranici s obrascem obrazac se zamjenjuje, drugdje iskace prozorcic.
   ========================================================================== */

(function () {
  'use strict';

  var stanje = window.VALTINSU_STANJE;
  if (!stanje || !stanje.obavijesti || !stanje.obavijesti.ukljuceno) return;

  var cfg = stanje.obavijesti;

  var dostupan = function (m) {
    var z = stanje.modeli[m];
    return !z || z.dostupno !== false;
  };
  var svePrazno = Object.keys(stanje.modeli).every(function (m) { return !dostupan(m); });

  /* Sadrzaj obrasca. Isti je i u prozorcicu i na stranici s upitom. */
  var polja = function (model, sNaslovom) {
    return '' +
      (sNaslovom
        ? '<p class="product__label">Obavijest o dostupnosti</p>' +
          '<h2 class="javi__naslov">' + cfg.naslov + '</h2>' +
          '<p class="javi__uvod">' + cfg.uvod + '</p>'
        : '') +
      '<input type="hidden" name="obavijest" value="da">' +
      '<input type="hidden" name="model" value="' + (model || 'svi modeli') + '">' +
      '<div class="javi__polja">' +
        '<div class="field">' +
          '<label for="javiIme">Ime <span class="req" aria-hidden="true">*</span></label>' +
          '<input type="text" id="javiIme" name="ime" autocomplete="name" required>' +
        '</div>' +

        /* Umjesto dva polja od kojih je jedno "nekako" neobavezno, kupac
           bira kako mu je draze. Ostaje jedno polje i nema dvojbe. */
        '<div class="field">' +
          '<span class="field__oznaka" id="javiKakoOznaka">Kako da vam se javimo?</span>' +
          '<div class="prekidac" role="radiogroup" aria-labelledby="javiKakoOznaka">' +
            '<button type="button" class="prekidac__tipka is-odabrana" data-nacin="email" role="radio" aria-checked="true">E-mailom</button>' +
            '<button type="button" class="prekidac__tipka" data-nacin="telefon" role="radio" aria-checked="false">Porukom</button>' +
          '</div>' +
        '</div>' +

        '<div class="field field--wide" data-polje="email">' +
          '<label for="javiEmail">E-mail adresa <span class="req" aria-hidden="true">*</span></label>' +
          '<input type="email" id="javiEmail" name="email" autocomplete="email" placeholder="ime@primjer.com">' +
        '</div>' +
        '<div class="field field--wide" data-polje="telefon" hidden>' +
          '<label for="javiTel">Broj mobitela <span class="req" aria-hidden="true">*</span></label>' +
          '<input type="tel" id="javiTel" name="telefon" autocomplete="tel" placeholder="091 234 5678">' +
        '</div>' +
      '</div>' +
      '<p class="javi__nota">Kontakt koristimo samo za tu jednu poruku. Bez newslettera.</p>' +
      '<div class="hp" aria-hidden="true">' +
        '<label for="javiTvrtka">Ne ispunjavati</label>' +
        '<input type="text" id="javiTvrtka" name="tvrtka" tabindex="-1" autocomplete="off">' +
      '</div>' +
      '<div class="javi__dno">' +
        '<button class="btn btn--primary" type="submit">Javite mi</button>' +
      '</div>' +
      '<p class="form__status" role="status" aria-live="polite"></p>';
  };

  /* Prekidac e-mail / poruka. Skriveno polje se i prazni, da se ne
     posalje ono sto kupac nije birao. */
  var veziPrekidac = function (form) {
    var tipke = form.querySelectorAll('.prekidac__tipka');

    var postavi = function (nacin) {
      tipke.forEach(function (t) {
        var ova = t.getAttribute('data-nacin') === nacin;
        t.classList.toggle('is-odabrana', ova);
        t.setAttribute('aria-checked', String(ova));
      });
      form.querySelectorAll('[data-polje]').forEach(function (polje) {
        var ovo = polje.getAttribute('data-polje') === nacin;
        polje.hidden = !ovo;
        var unos = polje.querySelector('input');
        if (unos && !ovo) unos.value = '';
      });
      var vidljivo = form.querySelector('[data-polje="' + nacin + '"] input');
      if (vidljivo) vidljivo.focus();
    };

    tipke.forEach(function (t) {
      t.addEventListener('click', function () { postavi(t.getAttribute('data-nacin')); });
    });
  };

  var odabraniNacin = function (form) {
    var odabrana = form.querySelector('.prekidac__tipka.is-odabrana');
    return odabrana ? odabrana.getAttribute('data-nacin') : 'email';
  };

  /* Provjera: ime i odabrani nacin javljanja. */
  var veziProvjeru = function (form) {
    form.addEventListener('submit', function (e) {
      var status = form.querySelector('.form__status');
      var javi = function (poruka) {
        if (!status) return;
        status.textContent = poruka;
        status.classList.add('is-shown');
      };

      var ime = form.elements.ime;
      var nacin = odabraniNacin(form);
      var kontakt = nacin === 'email' ? form.elements.email : form.elements.telefon;

      if (!ime.value.trim()) {
        e.preventDefault(); ime.focus(); javi('Upišite ime.'); return;
      }
      if (!kontakt.value.trim()) {
        e.preventDefault(); kontakt.focus();
        javi(nacin === 'email' ? 'Upišite e-mail adresu.' : 'Upišite broj mobitela.');
        return;
      }
      if (nacin === 'email' && !kontakt.checkValidity()) {
        e.preventDefault(); kontakt.focus(); javi('Provjerite e-mail adresu.'); return;
      }
      if (form.elements.tvrtka && form.elements.tvrtka.value !== '') {
        e.preventDefault(); return;
      }
      if (!form.getAttribute('action')) {
        e.preventDefault();
        javi('Lista čekanja još nije spojena na servis za e-mail. Do tada nam pišite na valtinsuhr@gmail.com.');
      }
    });
  };

  /* --- Na stranici s upitom: obrazac se zamjenjuje ---------------------- */

  /* --- Prozorcic --------------------------------------------------------- */

  /* Zastor ide ispod ploce, ali IZNAD sadrzaja stranice. Zaglavlje ostaje
     iznad njega, pa se s ploce moze otici na drugu stranicu. */
  var zastor = document.createElement('div');
  zastor.className = 'javi-zastor';
  zastor.hidden = true;
  document.body.appendChild(zastor);

  /* Namjerno bez showModal(): modalni dijalog zakljuca cijelu stranicu,
     pa se ne bi moglo ni u izbornik. Ovako ploca stoji, a navigacija radi.
     Zato nema ni gumba za zatvaranje ni izlaza na Esc. */
  var okvir = document.createElement('dialog');
  okvir.className = 'javi-okvir';
  okvir.setAttribute('aria-label', cfg.naslov);
  okvir.innerHTML =
    '<form class="form javi" method="POST" action="' + (cfg.action || '') + '" novalidate></form>';
  document.body.appendChild(okvir);

  var obrazac = okvir.querySelector('form');
  veziProvjeru(obrazac);

  var otvori = function (model) {
    if (okvir.open) return;
    obrazac.innerHTML = polja(model, true);
    veziPrekidac(obrazac);

    /* Animaciju vodi CSS, vezana je uz [open]. Skripta samo prikazuje. */
    zastor.hidden = false;
    okvir.show();

    /* Fokus na prvo polje, ali tek kad ploca sjedne. preventScroll jer
       ploca stoji na svom mjestu i stranica ispod ne treba skakati. */
    var prvo = obrazac.querySelector('#javiIme');
    if (prvo) {
      try { prvo.focus({ preventScroll: true }); }
      catch (e) { prvo.focus(); }
    }
  };

  /* Koji model pripada kliknutoj poveznici: kartica, stranica modela,
     ili nista posebno. */
  var modelZa = function (el) {
    var kartica = el.closest('.model-cell[data-model]');
    if (kartica) return kartica.getAttribute('data-model');

    var kadrovi = document.getElementById('kadrovi');
    if (kadrovi) {
      try { return JSON.parse(kadrovi.textContent).model; } catch (e) { /* nista */ }
    }
    return null;
  };

  /* Na stranici s upitom prozorcic iskoci sam. Obrazac ispod ostaje
     vidljiv, pa tko zeli moze ga zatvoriti i pogledati stranicu. */
  if (document.getElementById('upitForm') && svePrazno) {
    var odgoda = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450;
    window.setTimeout(function () { otvori(null); }, odgoda);
  }

  /* Presrecu se SAMO gumbi liste cekanja. Poveznice na Kontakt moraju
     raditi kao poveznice, inace se do stranice ne moze doci ni iz
     navigacije ni iz podnozja. Prozorcic tamo iskoci sam. */
  document.addEventListener('click', function (e) {
    var gumb = e.target.closest('.js-javi');
    if (!gumb) return;

    e.preventDefault();
    otvori(modelZa(gumb));
  });
})();
