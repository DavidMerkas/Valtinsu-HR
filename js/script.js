/* ==========================================================================
   VALTINSU HR - interakcije
   Cisti JS, bez ovisnosti. Sve je progressive enhancement:
   ako skripta padne, stranica i dalje radi.
   ========================================================================== */

(function () {
  'use strict';

  /* --- Zaglavlje: bijela traka nakon scrolla --------------------------- */

  var header = document.getElementById('siteHeader');

  if (header) {
    var stuck = false;

    var onScroll = function () {
      var shouldStick = window.scrollY > 40;
      if (shouldStick !== stuck) {
        stuck = shouldStick;
        header.classList.toggle('is-stuck', stuck);
      }
    };

    // rAF throttle - scroll handler se ne vrti na svakom pikselu
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        onScroll();
        ticking = false;
      });
    }, { passive: true });

    onScroll();
  }

  /* --- Mobilni izbornik ------------------------------------------------ */

  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');

  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Zatvori izbornik' : 'Otvori izbornik');
      nav.classList.toggle('is-open', open);
    };

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Klik na link zatvara izbornik
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    // Escape zatvara i vraca fokus na gumb
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    // Ako se prozor prosiri preko breakpointa, resetiraj stanje
    var mq = window.matchMedia('(min-width: 1000px)');
    var onChange = function (e) { if (e.matches) setOpen(false); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
  }

  /* --- Padajuci izbornik modela ---------------------------------------- */

  var subItem = document.querySelector('.nav__item');

  if (subItem) {
    var subToggle = subItem.querySelector('.nav__sub-toggle');
    var desktop = window.matchMedia('(min-width: 1000px)');

    var setSub = function (open) {
      subItem.classList.toggle('is-open', open);
      if (subToggle) subToggle.setAttribute('aria-expanded', String(open));
      if (header) header.classList.toggle('has-sub-open', open && desktop.matches);
    };

    if (subToggle) {
      subToggle.addEventListener('click', function (e) {
        e.preventDefault();
        clearTimeout(zatvaranje);    // da odgodeno zatvaranje ne poništi klik
        setSub(!subItem.classList.contains('is-open'));
      });
    }

    /* Na desktopu se otvara i prelaskom misa. Na dodirnim uredajima
       mouseenter zna okinuti prije clicka, pa se drzimo pokazivaca. */
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    var zatvaranje = null;

    var hoverom = function () { return desktop.matches && finePointer.matches; };

    subItem.addEventListener('mouseenter', function () {
      if (!hoverom()) return;
      clearTimeout(zatvaranje);      // vratio se prije nego je zatvaranje stiglo
      setSub(true);
    });

    /* Zatvaranje s malom odgodom. Ako mis na trenutak sklizne izvan
       stavke pa se vrati, izbornik ostane otvoren umjesto da zatrepce. */
    subItem.addEventListener('mouseleave', function () {
      if (!hoverom()) return;
      clearTimeout(zatvaranje);
      zatvaranje = setTimeout(function () { setSub(false); }, 120);
    });

    /* Tipkovnica: kad fokus napusti cijelu stavku, zatvori */
    subItem.addEventListener('focusout', function (e) {
      if (!subItem.contains(e.relatedTarget)) setSub(false);
    });

    document.addEventListener('click', function (e) {
      if (!subItem.contains(e.target)) setSub(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !subItem.classList.contains('is-open')) return;
      setSub(false);
      if (subToggle) subToggle.focus();
    });

    /* Pregled motocikla prati model na koji se pokazuje.
       Slike vec stoje jedna preko druge, mijenja se samo vidljiva. */
    var shots = subItem.querySelectorAll('.subnav__shot');

    if (shots.length) {
      var prikazi = function (slug) {
        for (var i = 0; i < shots.length; i++) {
          shots[i].classList.toggle('is-active', shots[i].dataset.shot === slug);
        }
      };

      subItem.querySelectorAll('[data-preview]').forEach(function (link) {
        // fokus je tu radi tipkovnice - tab kroz izbornik mijenja sliku isto
        link.addEventListener('mouseenter', function () { prikazi(link.dataset.preview); });
        link.addEventListener('focus', function () { prikazi(link.dataset.preview); });
      });
    }
  }

  /* --- Obrazac za upit -------------------------------------------------- */

  var form = document.getElementById('upitForm');

  if (form) {
    var status = document.getElementById('formStatus');

    /* Pretpunjavanje modela iz ?model=em-5-pro.
       Kartice modela salju taj parametar, pa kupac ne mora birati dvaput.
       Ako model dodje iz poveznice, polje je vec ispravno popunjeno. */
    var slugovi = {
      'em-5':       'EM-5',
      'em-5-pro':   'EM-5 PRO',
      'em-5-ultra': 'EM-5 Ultra'
    };

    try {
      var trazeni = new URLSearchParams(window.location.search).get('model');
      var polje = form.elements.model;
      if (trazeni && polje && slugovi[trazeni]) polje.value = slugovi[trazeni];
    } catch (e) { /* stari preglednik - preskoci, obrazac i dalje radi */ }

    /* --- Boja i pregled uz odabrani model ---
       Kruzici i fotografija dolaze iz popisa varijanti u HTML-u. Prva boja
       se odabire sama, da polje 'boja' nikad ne ode prazno kad boje postoje.
       Tri su stanja: model s bojama, model bez potvrdenih boja i neodlucan
       kupac, kojem se umjesto jednog motocikla pokazuju sva tri. */
    var izbor = document.getElementById('izbor');
    var podaci = document.getElementById('varijante');

    if (izbor && podaci) {
      var varijante = {};
      try { varijante = JSON.parse(podaci.textContent); } catch (e) { varijante = {}; }

      var omot      = document.getElementById('izborOmot');
      var okvirSlike = izbor.querySelector('.izbor__slika');
      var okvirBoja = document.getElementById('izborBoje');
      var foto      = document.getElementById('izborFoto');
      var ph        = document.getElementById('izborPh');
      var kolaz     = document.getElementById('izborKolaz');
      var naslov    = document.getElementById('izborNaslov');
      var imeBoje   = document.getElementById('izborIme');
      var nota      = document.getElementById('izborNota');
      var poljeBoja = document.getElementById('boja');

      /* Otvaranje i zatvaranje ploce. Atribut hidden se mice prije animacije
         i vraca tek kad se ploca skupi, inace se jedno od dvoje ne vidi. */
      var cekaZatvaranje = null;

      var otvori = function () {
        if (cekaZatvaranje) {
          omot.removeEventListener('transitionend', cekaZatvaranje);
          cekaZatvaranje = null;
        }
        omot.hidden = false;
        /* Citanje visine tjera preglednik da izracuna zatvoreno stanje. Bez
           toga ide ravno iz display:none u otvoreno i animacije nema. */
        void omot.offsetHeight;
        omot.classList.add('je-otvoren');
      };

      var zatvori = function () {
        if (omot.hidden) return;
        omot.classList.remove('je-otvoren');

        cekaZatvaranje = function (e) {
          if (e.target !== omot) return;
          omot.hidden = true;
          omot.removeEventListener('transitionend', cekaZatvaranje);
          cekaZatvaranje = null;
        };
        omot.addEventListener('transitionend', cekaZatvaranje);
      };

      /* Ponovno pokretanje animacije. Bez citanja offsetWidth preglednik
         spoji skidanje i vracanje klase u isti korak, pa se nista ne dogodi. */
      var osvjezi = function (el) {
        el.classList.remove('je-nova');
        void el.offsetWidth;
        el.classList.add('je-nova');
      };

      var postavi = function (model, boja) {
        var zapis = varijante[model] || {};
        var lista = zapis.boje || [];
        var odabrana = null;

        for (var i = 0; i < lista.length; i++) {
          if (lista[i].id === boja) odabrana = lista[i];
        }
        if (!odabrana) odabrana = lista[0] || null;

        poljeBoja.value = odabrana ? odabrana.naziv : '';
        imeBoje.textContent = odabrana ? odabrana.naziv : '';
        naslov.hidden = lista.length === 0;

        nota.textContent = zapis.nota || '';
        nota.hidden = !zapis.nota;

        if (odabrana) {
          foto.src = odabrana.foto;
          foto.alt = model + ' u boji ' + odabrana.naziv.toLowerCase() + ', bocni kadar';
          foto.hidden = false;
          ph.hidden = true;
          kolaz.hidden = true;
        } else if (zapis.kolaz) {          /* neodlucan kupac, svi modeli */
          foto.hidden = true;
          foto.removeAttribute('src');
          ph.hidden = true;
          kolaz.hidden = false;
        } else if (zapis.cekamo) {         /* model bez boja, ali ima sliku */
          /* Ako te slike nema (javna kopija je ne sadrzi), pada se natrag
             na sivi placeholder umjesto da ostane slomljena ikona. */
          foto.onerror = function () {
            foto.onerror = null;
            foto.hidden = true;
            foto.removeAttribute('src');
            ph.hidden = false;
            ph.setAttribute('data-label', model + ', fotografije stižu uskoro');
          };
          foto.src = zapis.cekamo;
          foto.alt = zapis.cekamoAlt || '';
          foto.hidden = false;
          ph.hidden = true;
          kolaz.hidden = true;
        } else {
          foto.hidden = true;
          foto.removeAttribute('src');
          ph.hidden = false;
          ph.setAttribute('data-label', model + ', fotografije stižu uskoro');
          kolaz.hidden = true;
        }

        osvjezi(okvirSlike);

        var krugovi = okvirBoja.querySelectorAll('.swatch');
        for (var k = 0; k < krugovi.length; k++) {
          var jeOva = odabrana && krugovi[k].getAttribute('data-boja') === odabrana.id;
          krugovi[k].setAttribute('aria-checked', jeOva ? 'true' : 'false');
        }
      };

      var nacrtaj = function (model) {
        var zapis = varijante[model];

        if (!zapis) {                       /* nijedan model nije odabran */
          zatvori();
          poljeBoja.value = '';
          return;
        }

        var lista = zapis.boje || [];
        okvirBoja.innerHTML = '';
        okvirBoja.hidden = lista.length === 0;

        lista.forEach(function (b) {
          var krug = document.createElement('button');
          krug.className = 'swatch';
          krug.type = 'button';
          krug.setAttribute('role', 'radio');
          krug.setAttribute('data-boja', b.id);
          krug.setAttribute('title', b.naziv);
          krug.style.setProperty('--c', b.c);
          krug.style.setProperty('--akcent', b.akcent);
          krug.innerHTML = '<span class="visually-hidden">' + b.naziv + '</span>';
          krug.addEventListener('click', function () { postavi(model, b.id); });
          okvirBoja.appendChild(krug);
        });

        postavi(model, lista.length ? lista[0].id : null);
        otvori();
      };

      form.elements.model.addEventListener('change', function () {
        nacrtaj(this.value);
      });

      /* Prvi crtez ide bez animacije. Ako model stigne iz poveznice, ploca
         je otvorena vec pri ucitavanju i nema se sto otvarati pred ocima. */
      omot.classList.add('bez-animacije');
      nacrtaj(form.elements.model.value);
      requestAnimationFrame(function () {
        omot.classList.remove('bez-animacije');
      });
    }

    /* Provjera jednog polja. Vraca true ako je ispravno. */
    var provjeri = function (input) {
      var greska = document.getElementById('err-' + input.id);
      var ok = input.checkValidity() && input.value.trim() !== '';

      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (greska) greska.classList.toggle('is-shown', !ok);
      return ok;
    };

    var obavezna = ['model', 'ime', 'email', 'telefon'];

    /* Greska nestaje cim korisnik ispravi polje - ne ceka se novo slanje.
       Padajuci izbornik javlja 'change', ne 'input', pa slusamo oboje. */
    obavezna.forEach(function (ime) {
      var input = form.elements[ime];
      if (!input) return;
      input.addEventListener('blur', function () {
        if (input.getAttribute('aria-invalid') !== null) provjeri(input);
      });
      ['input', 'change'].forEach(function (dogadaj) {
        input.addEventListener(dogadaj, function () {
          if (input.getAttribute('aria-invalid') === 'true') provjeri(input);
        });
      });
    });

    var javi = function (tekst) {
      if (!status) return;
      status.textContent = tekst;
      status.classList.add('is-shown');
    };

    form.addEventListener('submit', function (e) {
      var prvaGreska = null;

      obavezna.forEach(function (ime) {
        var input = form.elements[ime];
        if (!input) return;
        if (!provjeri(input) && !prvaGreska) prvaGreska = input;
      });

      if (prvaGreska) {
        e.preventDefault();
        prvaGreska.focus();
        javi('Provjerite označena polja.');
        return;
      }

      /* Medic: ako je popunjen, ovo je bot. Tiho odustajemo. */
      if (form.elements.tvrtka && form.elements.tvrtka.value !== '') {
        e.preventDefault();
        return;
      }

      /* Bez postavljenog action atributa obrazac nema kamo poslati podatke.
         Bolje glasna greska nego da upit tiho nestane. */
      if (!form.getAttribute('action')) {
        e.preventDefault();
        javi('Slanje upita još nije spojeno na servis za e-mail. Do tada nam pišite izravno na valtinsuhr@gmail.com.');
      }
    });
  }

  /* --- Galerija proizvoda ------------------------------------------------
     Popis kadrova stoji u <script type="application/json"> u HTML-u.
     Svaka boja ima SVOJ popis, jer se kompleti fotografija ne poklapaju
     uvijek: EM-5 ima cetiri kadra u crnoj i pet u crvenoj.

     Dva sloja slike jedan preko drugoga. Nova vec stoji na mjestu,
     gornja se brise ustranu i otkriva je. Zato gornja ima veci z-index.
     ------------------------------------------------------------------------ */

  var galerija = document.getElementById('galerija');

  if (galerija) {
    var pozornica = document.getElementById('pozornica');
    var brojac    = document.getElementById('brojac');
    var slojevi   = pozornica ? pozornica.querySelectorAll('.stage__img') : [];
    var podaciEl  = document.getElementById('kadrovi');
    var biraci    = document.querySelectorAll('#boje [data-boja]');

    var podaci = null;
    try { podaci = JSON.parse(podaciEl.textContent); } catch (e) { podaci = null; }

    if (podaci && podaci.boje && podaci.boje.length && slojevi.length === 2) {
      /* Model koji jos ima samo jednu fotografiju: strelice i brojac
         nemaju sto raditi, pa se sklanjaju umjesto da stoje mrtvi. */
      if (podaci.boje.length === 1 && podaci.boje[0].kadrovi.length < 2) {
        var suvisno = galerija.querySelectorAll('.viewer__nav, .viewer__count');
        for (var s0 = 0; s0 < suvisno.length; s0++) suvisno[s0].hidden = true;
      }

      var bojaIdx = 0;
      var kadar   = 0;
      var zauzeto = false;

      var boja    = function () { return podaci.boje[bojaIdx]; };
      var kadrovi = function () { return boja().kadrovi; };

      var opis = function (k) {
        return 'Valtinsu ' + podaci.model + ' u ' + boja().padez +
               ' boji, ' + kadrovi()[k].kadar;
      };

      var aktivni = function () {
        return slojevi[0].classList.contains('is-active') ? 0 : 1;
      };

      /* smjer:  1 naprijed, -1 natrag, 0 promjena boje (bez pomaka) */
      var prijelaz = function (noviKadar, smjer) {
        if (zauzeto) return;
        var lista = kadrovi();
        noviKadar = (noviKadar + lista.length) % lista.length;
        if (noviKadar === kadar && smjer) return;

        var put = lista[noviKadar].src;
        var a = aktivni();
        var stari = slojevi[a];
        var novi  = slojevi[1 - a];

        zauzeto = true;
        pozornica.setAttribute('data-smjer',
          smjer === 0 ? 'boja' : (smjer === -1 ? 'natrag' : 'naprijed'));

        /* Slika se ubacuje tek kad je ucitana, da prijelaz ne krene u prazno */
        var pred = new Image();
        pred.onload = pred.onerror = function () {
          kadar = noviKadar;

          novi.src = put;
          novi.alt = opis(kadar);
          novi.removeAttribute('aria-hidden');
          void novi.offsetWidth;

          novi.classList.add('is-active');
          stari.classList.remove('is-active');
          stari.classList.add('is-leaving');
          stari.setAttribute('aria-hidden', 'true');

          if (brojac) brojac.textContent = (kadar + 1) + ' / ' + lista.length;

          setTimeout(function () {
            stari.classList.remove('is-leaving');
            zauzeto = false;
          }, smjer === 0 ? 240 : 300);
        };
        pred.src = put;
      };

      var prev = document.getElementById('prethodna');
      var next = document.getElementById('sljedeca');
      if (prev) prev.addEventListener('click', function () { prijelaz(kadar - 1, -1); });
      if (next) next.addEventListener('click', function () { prijelaz(kadar + 1, 1); });

      galerija.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft')  { e.preventDefault(); prijelaz(kadar - 1, -1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); prijelaz(kadar + 1, 1); }
      });

      /* Prst po slici na dodirnom uredaju */
      var x0 = null, y0 = null;
      pozornica.addEventListener('touchstart', function (e) {
        x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
      }, { passive: true });

      pozornica.addEventListener('touchend', function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0;
        var dy = e.changedTouches[0].clientY - y0;
        /* Vodoravno mora nadjacati okomito, inace bi obican scroll
           po slici mijenjao kadar. */
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          prijelaz(kadar + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        }
        x0 = y0 = null;
      }, { passive: true });

      /* Promjena boje zadrzava isti kadar ako ga nova boja ima.
         EM-5 nema iste kadrove u obje boje, pa se inace ide na prvi. */
      var boje = document.getElementById('boje');
      if (boje) {
        var postaviBoju = function (id) {
          if (zauzeto) return;
          var idx = -1;
          for (var i = 0; i < podaci.boje.length; i++) {
            if (podaci.boje[i].id === id) idx = i;
          }
          if (idx === -1 || idx === bojaIdx) return;

          var traziKadar = kadrovi()[kadar].kadar;
          bojaIdx = idx;

          var novi = 0;
          var lista = kadrovi();
          for (var j = 0; j < lista.length; j++) {
            if (lista[j].kadar === traziKadar) { novi = j; break; }
          }

          for (var k = 0; k < biraci.length; k++) {
            biraci[k].setAttribute('aria-checked', String(biraci[k].dataset.boja === id));
          }

          kadar = -1;                    // prisili prijelaz i kad je indeks isti
          prijelaz(novi, 0);
        };

        boje.addEventListener('click', function (e) {
          var g = e.target.closest('[data-boja]');
          if (g) postaviBoju(g.dataset.boja);
        });

        boje.addEventListener('keydown', function (e) {
          if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) === -1) return;
          e.preventDefault();
          var lista = Array.prototype.slice.call(biraci);
          var sad = lista.findIndex(function (g) { return g.getAttribute('aria-checked') === 'true'; });
          var smjer = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
          var novi = lista[(sad + smjer + lista.length) % lista.length];
          postaviBoju(novi.dataset.boja);
          novi.focus();
        });
      }
    }
  }

  /* --- Usporedba modela ------------------------------------------------- */
  /* Tri stupca ne stanu na mobitel bez vodoravnog pomicanja, pa korisnik
     bira dva. Skrivanje ide preko klase, a CSS je primjenjuje samo ispod
     640px, tako da siri ekran uvijek vidi sve tri. */

  var pickA = document.getElementById('pickA');
  var pickB = document.getElementById('pickB');
  var tablica = document.getElementById('compareTable');

  if (pickA && pickB && tablica) {
    var celije = tablica.querySelectorAll('[data-model]');

    var osvjezi = function () {
      var vidljivi = [pickA.value, pickB.value];
      for (var i = 0; i < celije.length; i++) {
        celije[i].classList.toggle('is-off', vidljivi.indexOf(celije[i].dataset.model) === -1);
      }
    };

    /* Isti model u oba birača ne usporeduje nista. Kad se to dogodi,
       drugi birac skace na prvi slobodan model. */
    var razdvoji = function (promijenjeni, drugi) {
      if (promijenjeni.value !== drugi.value) return;
      for (var i = 0; i < drugi.options.length; i++) {
        if (drugi.options[i].value !== promijenjeni.value) {
          drugi.value = drugi.options[i].value;
          break;
        }
      }
    };

    pickA.addEventListener('change', function () { razdvoji(pickA, pickB); osvjezi(); });
    pickB.addEventListener('change', function () { razdvoji(pickB, pickA); osvjezi(); });

    osvjezi();
  }

  /* --- Hero video ------------------------------------------------------- */
  /* Tko je u sustavu iskljucio animacije ne dobiva video koji se vrti u
     petlji. Zaustavljen na prvom kadru izgleda isto kao poster. */

  var heroVideo = document.getElementById('heroVideo');

  if (heroVideo && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    heroVideo.removeAttribute('autoplay');
    heroVideo.removeAttribute('loop');
    heroVideo.pause();
  }

  /* --- Cesta pitanja ---------------------------------------------------- */
  /* Bez skripte <details> i dalje radi, samo se moze otvoriti vise njih
     odjednom i nema animacije. Ovo je nadogradnja, ne uvjet. */

  var faqOkvir = document.querySelector('.faq');
  var pitanja = document.querySelectorAll('.faq__item');

  if (pitanja.length && faqOkvir) {
    /* Oznaka da je skripta preuzela otvaranje. Bez nje CSS otvara odgovor
       preko [open] i onda animacije nema, ali stranica radi. */
    faqOkvir.classList.add('js-faq');

    /* Atribut open pokazuje ili skriva sadrzaj odmah, pa se ne moze
       animirati sam. Zato open ide prije animacije, a skida se tek kad
       odgovor odsvira zatvaranje. Visinu vodi klasa je-otvoren. */
    var otvoriPitanje = function (item) {
      item.setAttribute('open', '');
      void item.offsetHeight;         /* prisili izracun zatvorenog stanja */
      item.classList.add('je-otvoren');
    };

    var zatvoriPitanje = function (item) {
      if (!item.classList.contains('je-otvoren')) {
        item.removeAttribute('open');
        return;
      }
      item.classList.remove('je-otvoren');

      /* Cekanje na sat, ne na transitionend: ako korisnik u meduvremenu
         opet otvori isto pitanje, provjera klase to prepozna i open ostaje. */
      window.setTimeout(function () {
        if (!item.classList.contains('je-otvoren')) item.removeAttribute('open');
      }, 340);
    };

    pitanja.forEach(function (item) {
      var naslov = item.querySelector('.faq__q');
      if (!naslov) return;

      naslov.addEventListener('click', function (e) {
        // Preglednik bi sam prebacio atribut open; radimo to rucno
        // da prvo stignemo zatvoriti ostala pitanja.
        e.preventDefault();

        var bioOtvoren = item.classList.contains('je-otvoren');

        pitanja.forEach(function (drugi) {
          if (drugi !== item) zatvoriPitanje(drugi);
        });

        if (bioOtvoren) zatvoriPitanje(item);
        else otvoriPitanje(item);
      });
    });
  }

  /* --- Scroll reveal --------------------------------------------------- */

  var reveals = document.querySelectorAll('.reveal');

  if (!reveals.length) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced || !('IntersectionObserver' in window)) {
    for (var i = 0; i < reveals.length; i++) reveals[i].classList.add('is-in');
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);   // animira se jednom, ne na svakom prolazu
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

  reveals.forEach(function (el) { io.observe(el); });

})();
