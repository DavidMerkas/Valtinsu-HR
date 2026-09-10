/* ==========================================================================
   VALTINSU HR - slanje obrazaca

   JEDINO MJESTO gdje se upisuje kljuc servisa koji salje mail.
   Dok je prazan, obrasci javljaju gresku umjesto da podaci tiho nestanu.

   Kako doci do kljuca:
     1. web3forms.com  ->  upisi info@valtinsuhr.com
     2. kljuc stigne na taj mail
     3. zalijepi ga dolje u KLJUC i to je sve

   Vrijedi za oba obrasca, i upit i listu cekanja.
   ========================================================================== */

window.VALTINSU_OBRAZAC = {
  KLJUC: 'bddc0cfc-35a5-4b35-85c3-c6b410b66069',

  /* Kamo se salje. Web3Forms prima obican POST na ovu adresu. */
  servis: 'https://api.web3forms.com/submit',

  /* Naslov maila koji stize klijentu. */
  naslov: 'Novi upit s valtinsuhr.com'
};

/* Hrvatski broj uvijek u istom obliku. Iz bilo cega sto kupac upise
   ("0915036188", "+385 91 503 6188", "00385...") ostaju znamenke bez
   pozivnog broja i bez nule, pa se slazu u skupine:
     mobitel  9x   ->  91 503 6188
     Zagreb   1    ->  1 234 5678
     ostalo   xx   ->  21 234 567(8)
   Koriste ga polje (dok se tipka) i slanje (dodaje +385). */
window.VALTINSU_TEL = {
  znamenke: function (v) {
    return String(v || '').replace(/\D/g, '').replace(/^(00)?385/, '').replace(/^0+/, '').slice(0, 9);
  },
  slozi: function (v) {
    var z = this.znamenke(v);
    var prvi = z.charAt(0) === '1' ? 1 : 2;
    var a = z.slice(0, prvi), b = z.slice(prvi, prvi + 3), c = z.slice(prvi + 3);
    return [a, b, c].filter(Boolean).join(' ');
  },
  ispravan: function (v) {
    var z = this.znamenke(v);
    return z.length >= 8 && z.length <= 9;
  },
  puni: function (v) {
    return '+385 ' + this.slozi(v);
  }
};

(function () {
  'use strict';

  var cfg = window.VALTINSU_OBRAZAC;

  /* Skrivena polja koja servis ocekuje. Dodaju se u JS-u da kljuc stoji
     na jednom mjestu, a ne prepisan po svakoj stranici. */
  var opremi = function (form) {
    if (!cfg.KLJUC) return;

    form.setAttribute('action', cfg.servis);

    var dodaj = function (ime, vrijednost) {
      if (form.elements[ime]) return;
      var polje = document.createElement('input');
      polje.type = 'hidden';
      polje.name = ime;
      polje.value = vrijednost;
      form.appendChild(polje);
    };

    dodaj('access_key', cfg.KLJUC);
    dodaj('subject', form.classList.contains('javi')
      ? 'Lista čekanja, valtinsuhr.com'
      : cfg.naslov);
    dodaj('from_name', 'Valtinsu Hrvatska');
  };

  /* Slanje ide kroz fetch, da kupac ostane na stranici umjesto da zavrsi
     na tudjoj stranici sa zahvalom. Ako fetch padne, obrazac se posalje
     obicnim putem, pa poruka ne propada. */
  var posalji = function (form, e) {
    var status = form.querySelector('.form__status');

    var javi = function (poruka, uspjeh) {
      if (!status) return;
      status.textContent = poruka;
      status.classList.add('is-shown');
      status.classList.toggle('form__status--uspjeh', !!uspjeh);
    };

    if (!window.fetch || !window.FormData) return;   /* stari preglednik */

    e.preventDefault();

    var gumb = form.querySelector('button[type="submit"]');
    if (gumb) {
      gumb.disabled = true;
      gumb.dataset.tekst = gumb.textContent;
      gumb.textContent = 'Šaljem...';
    }

    var vrati = function () {
      if (!gumb) return;
      gumb.disabled = false;
      if (gumb.dataset.tekst) gumb.textContent = gumb.dataset.tekst;
    };

    /* Broj na mail uvijek stize kao "+385 91 234 5678". */
    var podaci = new FormData(form);
    var tel = podaci.get('telefon');
    if (tel && window.VALTINSU_TEL.znamenke(tel)) {
      podaci.set('telefon', window.VALTINSU_TEL.puni(tel));
    }

    fetch(cfg.servis, {
      method: 'POST',
      body: podaci
    })
      .then(function (r) { return r.json(); })
      .then(function (odgovor) {
        vrati();
        if (odgovor && odgovor.success) {
          form.reset();
          javi(form.classList.contains('javi')
            ? 'Zabilježeno. Javimo se čim motocikli stignu.'
            : 'Upit je poslan. Javljamo se u roku 24 sata.', true);
        } else {
          javi('Slanje nije uspjelo. Pišite nam na info@valtinsuhr.com.');
        }
      })
      .catch(function () {
        vrati();
        javi('Nema veze sa serverom. Pišite nam na info@valtinsuhr.com.');
      });
  };

  var vezi = function (form) {
    if (!form || form.dataset.spojen) return;
    form.dataset.spojen = 'da';
    opremi(form);

    /* Slusatelj se dodaje zadnji, pa provjere polja prije njega vec
       mogu odustati. Ako su odustale, ovdje se ne dira nista. */
    form.addEventListener('submit', function (e) {
      if (e.defaultPrevented || !cfg.KLJUC) return;
      posalji(form, e);
    });
  };

  var spoji = function () {
    vezi(document.getElementById('upitForm'));
    document.querySelectorAll('form.javi').forEach(vezi);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', spoji);
  } else {
    spoji();
  }

  /* Ploca s listom cekanja nastaje tek kad je kupac otvori, pa se prati
     i naknadno dodavanje obrasca u stranicu. */
  if (window.MutationObserver) {
    new MutationObserver(function () {
      document.querySelectorAll('form.javi').forEach(vezi);
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
})();
