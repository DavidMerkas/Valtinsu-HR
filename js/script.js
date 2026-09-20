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

        /* Rezervni sat. Ako prijelaz ne postoji, jer je ploca zatvorena
           jos dok je animacija ugasena, transitionend nikad ne stigne i
           ploca ostane visjeti otvorena sa slikom modela koji vise nije
           odabran. Zato se zatvara i po vremenu, sto god prije dodje. */
        var zavrsi = function () {
          if (!omot.classList.contains('je-otvoren')) omot.hidden = true;
          omot.removeEventListener('transitionend', cekaZatvaranje);
          window.clearTimeout(rezerva);
          cekaZatvaranje = null;
        };

        var rezerva = window.setTimeout(zavrsi, 420);

        cekaZatvaranje = function (e) {
          if (e.target !== omot) return;
          zavrsi();
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

      /* Boja koja je rasprodana (dostupnost.js, boje: { zelena: false }).
         Stanje se cita tek kad zatreba, jer se dostupnost.js ucitava nakon
         ove skripte. */
      var rasprodana = function (model, id) {
        var s = window.VALTINSU_STANJE;
        var z = s && s.modeli && s.modeli[model];
        return !!(z && z.boje && z.boje[id] === false);
      };

      var postavi = function (model, boja) {
        var zapis = varijante[model] || {};
        var lista = zapis.boje || [];
        var odabrana = null;

        for (var i = 0; i < lista.length; i++) {
          if (lista[i].id === boja && !rasprodana(model, boja)) odabrana = lista[i];
        }
        /* Inace prva boja koja nije rasprodana. */
        for (var j = 0; !odabrana && j < lista.length; j++) {
          if (!rasprodana(model, lista[j].id)) odabrana = lista[j];
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
          if (rasprodana(model, b.id)) {
            krug.classList.add('je-rasprodano');
            krug.setAttribute('aria-disabled', 'true');
            krug.setAttribute('title', b.naziv + ' (rasprodano)');
            krug.querySelector('.visually-hidden').textContent = b.naziv + ', rasprodano';
          }
          krug.addEventListener('click', function () {
            if (rasprodana(model, b.id)) return;
            postavi(model, b.id);
          });
          okvirBoja.appendChild(krug);
        });

        /* Boja iz poveznice (?boja=zelena) vrijedi samo za prvi crtez.
           Kad kupac promijeni model, krece se od prve boje tog modela. */
        postavi(model, trazenaBoja || (lista.length ? lista[0].id : null));
        trazenaBoja = null;
        otvori();
      };

      var trazenaBoja = null;
      try { trazenaBoja = new URLSearchParams(window.location.search).get('boja'); } catch (e) { trazenaBoja = null; }

      form.elements.model.addEventListener('change', function () {
        nacrtaj(this.value);
      });

      /* Prvi crtez ide bez animacije. Ako model stigne iz poveznice, ploca
         je otvorena vec pri ucitavanju i nema se sto otvarati pred ocima. */
      omot.classList.add('bez-animacije');
      /* Tek kad je ucitan i dostupnost.js, da se rasprodane boje odmah
         vide prekrizene. */
      var prviCrtez = function () {
        nacrtaj(form.elements.model.value);
        requestAnimationFrame(function () {
          omot.classList.remove('bez-animacije');
        });
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', prviCrtez);
      else prviCrtez();
    }

    /* Provjera jednog polja. Vraca true ako je ispravno. */
    var provjeri = function (input) {
      var greska = document.getElementById('err-' + input.id);
      var ok = input.checkValidity() && input.value.trim() !== '';

      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (greska) greska.classList.toggle('is-shown', !ok);
      return ok;
    };

    /* Telefon: +385 stoji ispred polja, a upisano se odmah slaze u isti
       oblik. Neispravan broj (manje od 8 ili vise od 9 znamenki) oznaci
       polje kao nevaljano, pa ga provjera nize uhvati kao i ostala. */
    var poljeTel = form.elements.telefon;
    var TEL = window.VALTINSU_TEL;
    if (poljeTel && TEL) {
      var slaziTel = function () {
        var slozen = TEL.slozi(poljeTel.value);
        if (poljeTel.value !== slozen) poljeTel.value = slozen;
        poljeTel.setCustomValidity(!slozen || TEL.ispravan(slozen) ? '' : 'Broj mora imati 8 ili 9 znamenki.');
      };
      poljeTel.addEventListener('input', slaziTel);
      poljeTel.addEventListener('blur', slaziTel);
    }

    var obavezna = ['model', 'ime', 'email', 'telefon', 'poruka'];

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
        javi('Slanje još nije spojeno. Do tada nam pišite na info@valtinsuhr.com ili na WhatsApp.');
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
      /* "pocetak" u podacima kaze koji se kadar vidi prvi (npr. naslovna
         fotografija), a listanje i dalje ide redom kojim su upisani. */
      var kadar   = podaci.boje[0].pocetak || 0;
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

      /* Kadar koji u podacima ima "gumb" dobiva svoju tipku ispod slike
         (npr. "Prednji dio"). Klik skace ravno na taj kadar, da kupac ne
         mora listati do njega. */
      var redGumba = null;
      var osvjeziGumbe = function () {
        var lista = kadrovi();
        var oznaceni = [];
        for (var g = 0; g < lista.length; g++) {
          if (lista[g].gumb) oznaceni.push({ i: g, naziv: lista[g].gumb });
        }

        if (!redGumba) {
          redGumba = document.createElement('div');
          redGumba.className = 'viewer__gumbi';
          galerija.appendChild(redGumba);
        }
        redGumba.innerHTML = '';
        redGumba.hidden = oznaceni.length === 0;

        oznaceni.forEach(function (o) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'viewer__kadar';
          b.textContent = o.naziv;
          b.setAttribute('aria-pressed', String(o.i === kadar));
          b.addEventListener('click', function () {
            prijelaz(o.i, o.i > kadar ? 1 : -1);
            setTimeout(osvjeziGumbe, 320);
          });
          redGumba.appendChild(b);
        });
      };

      osvjeziGumbe();

      /* --- Povecanje preko cijelog ekrana ---------------------------
         Klik na sliku (ili tipka s povecalom) otvara tamnu plocu s istim
         kadrovima trenutne boje. Unutra: strelice, prst, Esc, brojac.
         Klik na sliku u ploci je jos jednom povecava (2x) i prati mis;
         na mobitelu radi i povecanje s dva prsta. Pri zatvaranju galerija
         na stranici ostaje na kadru koji je bio otvoren. */
      var bioPomak = false;
      pozornica.addEventListener('touchstart', function () { bioPomak = false; }, { passive: true });
      pozornica.addEventListener('touchmove', function () { bioPomak = true; }, { passive: true });

      var lupa = document.createElement('button');
      lupa.type = 'button';
      lupa.className = 'viewer__lupa';
      lupa.setAttribute('aria-label', 'Povećaj fotografiju');
      lupa.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
        '<circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="2.4"/>' +
        '<path d="m15.5 15.5 5 5M10.5 7.5v6M7.5 10.5h6" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg>';
      pozornica.parentNode.appendChild(lupa);
      pozornica.classList.add('je-klikabilna');

      var ploca = null, plocaImg = null, plocaBroj = null, plocaIdx = 0, zadnjiFokus = null;

      var nacrtajPlocu = function () {
        var lista = kadrovi();
        plocaIdx = (plocaIdx + lista.length) % lista.length;
        plocaImg.classList.remove('je-uvecana');
        plocaImg.style.transformOrigin = '';
        plocaImg.src = lista[plocaIdx].src;
        plocaImg.alt = opis(plocaIdx);
        plocaBroj.textContent = (plocaIdx + 1) + ' / ' + lista.length;
        var jedna = lista.length < 2;
        ploca.querySelectorAll('.povecalo__nav').forEach(function (b) { b.hidden = jedna; });
        plocaBroj.hidden = jedna;
      };

      var zatvoriPlocu;
      var naTipkuPloce = function (e) {
        if (e.key === 'Escape') zatvoriPlocu();
        if (e.key === 'ArrowLeft')  { plocaIdx--; nacrtajPlocu(); }
        if (e.key === 'ArrowRight') { plocaIdx++; nacrtajPlocu(); }
      };

      zatvoriPlocu = function () {
        if (!ploca || ploca.hidden) return;
        ploca.classList.remove('je-otvorena');
        document.body.style.overflow = '';
        document.removeEventListener('keydown', naTipkuPloce);
        var p = ploca;
        setTimeout(function () { p.hidden = true; }, 200);
        var cilj = plocaIdx;
        if (cilj !== kadar) prijelaz(cilj, cilj > kadar ? 1 : -1);
        if (zadnjiFokus && zadnjiFokus.focus) zadnjiFokus.focus();
      };

      var otvoriPlocu = function () {
        if (!ploca) {
          ploca = document.createElement('div');
          ploca.className = 'povecalo';
          ploca.hidden = true;
          ploca.setAttribute('role', 'dialog');
          ploca.setAttribute('aria-modal', 'true');
          ploca.setAttribute('aria-label', 'Fotografije, ' + podaci.model);
          ploca.innerHTML =
            '<button type="button" class="povecalo__zatvori" aria-label="Zatvori">' +
              '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19" stroke="currentColor" stroke-width="2.6"/></svg></button>' +
            '<div class="povecalo__okvir"><img class="povecalo__slika" alt=""></div>' +
            '<button type="button" class="povecalo__nav povecalo__nav--prev" aria-label="Prethodna fotografija">' +
              '<svg width="12" height="20" viewBox="0 0 9 16" fill="none" aria-hidden="true"><path d="M8 1L1 8l7 7" stroke="currentColor" stroke-width="2.2"/></svg></button>' +
            '<button type="button" class="povecalo__nav povecalo__nav--next" aria-label="Sljedeća fotografija">' +
              '<svg width="12" height="20" viewBox="0 0 9 16" fill="none" aria-hidden="true"><path d="M1 1l7 7-7 7" stroke="currentColor" stroke-width="2.2"/></svg></button>' +
            '<p class="povecalo__broj" aria-live="polite"></p>';
          document.body.appendChild(ploca);
          plocaImg  = ploca.querySelector('.povecalo__slika');
          plocaBroj = ploca.querySelector('.povecalo__broj');

          ploca.querySelector('.povecalo__zatvori').addEventListener('click', zatvoriPlocu);
          ploca.querySelector('.povecalo__nav--prev').addEventListener('click', function () { plocaIdx--; nacrtajPlocu(); });
          ploca.querySelector('.povecalo__nav--next').addEventListener('click', function () { plocaIdx++; nacrtajPlocu(); });
          ploca.addEventListener('click', function (e) {
            if (e.target === ploca || e.target.classList.contains('povecalo__okvir')) zatvoriPlocu();
          });

          /* Dodatno povecanje: klik na sliku, mis pomice vidljivi dio */
          var postaviIshodiste = function (e) {
            var r = plocaImg.getBoundingClientRect();
            var x = ((e.clientX - r.left) / r.width) * 100;
            var y = ((e.clientY - r.top) / r.height) * 100;
            plocaImg.style.transformOrigin = x + '% ' + y + '%';
          };
          plocaImg.addEventListener('click', function (e) {
            if (window.matchMedia('(hover: none)').matches) return;
            postaviIshodiste(e);
            plocaImg.classList.toggle('je-uvecana');
          });
          plocaImg.addEventListener('mousemove', function (e) {
            if (plocaImg.classList.contains('je-uvecana')) postaviIshodiste(e);
          });

          /* Prst: vodoravni potez mijenja kadar, dva prsta prepustena pregledniku */
          var px0 = null, py0 = null;
          ploca.addEventListener('touchstart', function (e) {
            if (e.touches.length !== 1) { px0 = null; return; }
            px0 = e.touches[0].clientX; py0 = e.touches[0].clientY;
          }, { passive: true });
          ploca.addEventListener('touchend', function (e) {
            if (px0 === null || (window.visualViewport && window.visualViewport.scale > 1.01)) return;
            var dx = e.changedTouches[0].clientX - px0;
            var dy = e.changedTouches[0].clientY - py0;
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
              plocaIdx += dx < 0 ? 1 : -1;
              nacrtajPlocu();
            }
            px0 = null;
          }, { passive: true });
        }

        zadnjiFokus = document.activeElement;
        plocaIdx = kadar;
        nacrtajPlocu();
        ploca.hidden = false;
        void ploca.offsetWidth;
        ploca.classList.add('je-otvorena');
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', naTipkuPloce);
        ploca.querySelector('.povecalo__zatvori').focus();
      };

      lupa.addEventListener('click', otvoriPlocu);
      pozornica.addEventListener('click', function () {
        if (bioPomak) { bioPomak = false; return; }
        otvoriPlocu();
      });

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
          setTimeout(osvjeziGumbe, 300);
          upisiBojuUPoveznice(id);
        };

        /* Poveznice na upit nose i odabranu boju (?model=em-5-pro&boja=zelena),
           pa je obrazac vec postavljen na nju. */
        var upisiBojuUPoveznice = function (id) {
          document.querySelectorAll('a[href*="kontakt.html?model="]').forEach(function (a) {
            var href = a.getAttribute('href').replace(/[?&]boja=[^&#]*/, '');
            a.setAttribute('href', href + '&boja=' + encodeURIComponent(id));
          });
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

  /* Na Kupnji su pitanja podijeljena u vise grupa, svaka sa svojim .faq.
     Oznaka mora ici na sve, inace pitanja iz druge i trece grupe nemaju
     animaciju i nestaju odjednom kad se otvori neko drugo pitanje. */
  var faqOkviri = document.querySelectorAll('.faq');
  var pitanja = document.querySelectorAll('.faq__item');

  if (pitanja.length && faqOkviri.length) {
    /* Oznaka da je skripta preuzela otvaranje. Bez nje CSS otvara odgovor
       preko [open] i onda animacije nema, ali stranica radi. */
    faqOkviri.forEach(function (okvir) { okvir.classList.add('js-faq'); });

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

  /* --- Brojke koje rastu od nule --------------------------------------
     <b data-broji="2015">2015<i>.</i></b> - mijenja se samo prvi tekst,
     nastavak u <i> ostaje. Bez JS-a ili uz smanjeno kretanje stoji
     konacna brojka. */

  var brojke = document.querySelectorAll('[data-broji]');
  if (brojke.length && 'IntersectionObserver' in window &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var broji = function (el) {
      var cilj = +el.getAttribute('data-broji');
      var tekst = el.firstChild;
      var trajanje = 1400, start = null;
      var korak = function (t) {
        if (!start) start = t;
        var p = Math.min((t - start) / trajanje, 1);
        p = 1 - Math.pow(1 - p, 3);            /* usporava pred kraj */
        tekst.nodeValue = Math.round(cilj * p);
        if (p < 1) requestAnimationFrame(korak);
      };
      tekst.nodeValue = '0';
      requestAnimationFrame(korak);
    };
    var ioBroj = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        broji(e.target);
        ioBroj.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    brojke.forEach(function (el) { ioBroj.observe(el); });
  }

  /* --- Kartice modela: listanje slika i odabir boje --------------------
     Podaci dolaze iz <script id="karticeSlike">. Kartica dobiva strelice,
     brojac i kruzice za boju; bez skripte ostaje obicna slika. */

  var karticePodaci = document.getElementById('karticeSlike');

  if (karticePodaci) {
    var slikePoModelu = {};
    try { slikePoModelu = JSON.parse(karticePodaci.textContent); } catch (e) { slikePoModelu = {}; }

    document.querySelectorAll('.model-cell[data-model]').forEach(function (cell) {
      var boje = slikePoModelu[cell.getAttribute('data-model')];
      var media = cell.querySelector('.model-cell__media');
      var img = media && media.querySelector('img');
      if (!boje || !boje.length || !img) return;

      var bojaIdx = 0, kadar = boje[0].pocetak || 0;
      var naziv = cell.getAttribute('data-model');
      var visePodataka = boje.length > 1 || boje[0].slike.length > 1;
      if (!visePodataka) return;

      media.classList.add('kart-galerija');

      /* Isti prijelaz kao galerija na stranici modela: preko nove slike
         privremeno stoji kopija stare i brise se u smjeru listanja
         (clip-path). Kod promjene boje kopija se samo utopi. */
      var prvi = true;
      var prikazi = function (novaBoja, noviKadar, smjer) {
        bojaIdx = (novaBoja + boje.length) % boje.length;
        var lista = boje[bojaIdx].slike;
        kadar = (noviKadar + lista.length) % lista.length;
        var put = lista[kadar];
        var bezAnimacije = prvi || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        prvi = false;

        var pred = new Image();
        pred.onload = pred.onerror = function () {
          if (!bezAnimacije && img.getAttribute('src') !== put) {
            media.querySelectorAll('.kart-stari').forEach(function (s) { s.remove(); });
            var stari = img.cloneNode();
            stari.className = 'kart-stari';
            stari.removeAttribute('loading');
            stari.setAttribute('alt', '');
            stari.setAttribute('aria-hidden', 'true');
            media.setAttribute('data-smjer', smjer === 0 ? 'boja' : (smjer === -1 ? 'natrag' : 'naprijed'));
            img.insertAdjacentElement('afterend', stari);
            void stari.offsetWidth;
            stari.classList.add('je-odlazi');
            setTimeout(function () { stari.remove(); }, 320);
          }
          img.src = put;
          img.alt = 'Valtinsu ' + naziv + ', ' + boje[bojaIdx].naziv.toLowerCase();
        };
        pred.src = put;

        brojac.textContent = (kadar + 1) + ' / ' + lista.length;
        krugovi.forEach(function (k, i) {
          k.setAttribute('aria-checked', String(i === bojaIdx));
        });
      };

      /* Strelice i brojac preko slike */
      var nav = document.createElement('div');
      nav.className = 'kart-nav';
      nav.innerHTML =
        '<button type="button" class="kart-nav__tipka" aria-label="Prethodna fotografija">' +
          '<svg width="9" height="16" viewBox="0 0 9 16" fill="none" aria-hidden="true"><path d="M8 1L1 8l7 7" stroke="currentColor" stroke-width="2.2"/></svg></button>' +
        '<button type="button" class="kart-nav__tipka" aria-label="Sljedeća fotografija">' +
          '<svg width="9" height="16" viewBox="0 0 9 16" fill="none" aria-hidden="true"><path d="M1 1l7 7-7 7" stroke="currentColor" stroke-width="2.2"/></svg></button>';
      media.appendChild(nav);

      var brojac = document.createElement('p');
      brojac.className = 'kart-brojac';
      media.appendChild(brojac);

      /* Kruzici za boju, iznad slike uz ostale podatke */
      var red = document.createElement('div');
      red.className = 'kart-boje';
      red.setAttribute('role', 'radiogroup');
      red.setAttribute('aria-label', 'Boja, ' + naziv);

      var krugovi = boje.map(function (b, i) {
        var krug = document.createElement('button');
        krug.type = 'button';
        krug.className = 'kart-boja';
        krug.setAttribute('data-boja', b.id);
        krug.setAttribute('role', 'radio');
        krug.setAttribute('aria-checked', String(i === 0));
        krug.setAttribute('title', b.naziv);
        krug.style.setProperty('--c', b.c);
        krug.style.setProperty('--akcent', b.akcent);
        krug.innerHTML = '<span class="visually-hidden">' + b.naziv + '</span>';
        krug.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();          /* cijela kartica je link */
          prikazi(i, 0, 0);
        });
        red.appendChild(krug);
        return krug;
      });

      /* Rasprodana boja ostaje u kartici (slike se mogu gledati), ali je
         prekrizena. Stanje stize iz dostupnost.js, pa se oznacava nakon
         ucitavanja. */
      var oznaciRasprodane = function () {
        var s = window.VALTINSU_STANJE;
        var z = s && s.modeli && s.modeli[naziv];
        if (!z || !z.boje) return;
        krugovi.forEach(function (krug) {
          if (z.boje[krug.getAttribute('data-boja')] !== false) return;
          krug.classList.add('je-rasprodano');
          krug.setAttribute('title', krug.getAttribute('title') + ' (rasprodano)');
        });
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', oznaciRasprodane);
      else oznaciRasprodane();

      if (boje.length > 1) {
        var linkovi = cell.querySelector('.model-cell__links');
        if (linkovi) linkovi.insertAdjacentElement('beforebegin', red);
      }

      var tipke = nav.querySelectorAll('.kart-nav__tipka');
      tipke[0].addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation(); prikazi(bojaIdx, kadar - 1, -1);
      });
      tipke[1].addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation(); prikazi(bojaIdx, kadar + 1, 1);
      });

      /* Prst po slici na mobitelu */
      var x0 = null;
      media.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      media.addEventListener('touchend', function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 45) prikazi(bojaIdx, kadar + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        x0 = null;
      }, { passive: true });

      prikazi(0, kadar, 0);
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

  /* Osigurac: observer javlja samo promjenu stanja. Kod brzog skrolanja,
     skoka na sidro ili otvaranja vec skrolane stranice element moze
     preskociti vidljivo podrucje i ostati nevidljiv zauvijek. Zato se na
     skrolanju otkriva i sve sto je vec iznad donjeg ruba ekrana. */
  var dosadRevealed = function () {
    var dno = window.innerHeight;
    var ostalo = 0;
    reveals.forEach(function (el) {
      if (el.classList.contains('is-in')) return;
      if (el.getBoundingClientRect().top < dno) {
        el.classList.add('is-in');
        io.unobserve(el);
      } else {
        ostalo++;
      }
    });
    if (!ostalo) window.removeEventListener('scroll', naSkrol);
  };
  /* Ogranicenje po vremenu, ne requestAnimationFrame: rAF ne ide u tabu
     koji se ne crta, pa bi tekst ostao skriven bas kad ne smije. Provjera
     najvise svakih 100 ms, plus jedna na kraju skrolanja. */
  var zadnjaProvjera = 0;
  var kasnaProvjera = null;
  var naSkrol = function () {
    var sad = Date.now();
    clearTimeout(kasnaProvjera);
    kasnaProvjera = setTimeout(dosadRevealed, 120);
    if (sad - zadnjaProvjera < 100) return;
    zadnjaProvjera = sad;
    dosadRevealed();
  };
  window.addEventListener('scroll', naSkrol, { passive: true });
  /* Odmah, ne tek na 'load': na pravoj stranici load ceka video i slike,
     a preglednik je do tada vec skocio na sidro ili vratio staru poziciju.
     pageshow pokriva povratak tipkom "natrag" iz predmemorije. */
  dosadRevealed();
  window.addEventListener('load', dosadRevealed);
  window.addEventListener('pageshow', dosadRevealed);

})();
