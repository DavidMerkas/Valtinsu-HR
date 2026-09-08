"""Lokalni posluzitelj za pregled stranice.

Postoji jer dva gotova rjesenja svako razbije po jednu stvar:

  npx serve   radi 301 na "cisti" URL i pri tome BACA query string, pa
              kontakt.html?model=em-5-pro izgubi model i pretpunjavanje
              se cini pokvarenim, iako na pravom serveru radi.

  python -m http.server   ne zna za ciste URL-ove, a preglednik u panelu
              tra\u017ei /modeli/em-5-pro bez nastavka, pa vraca 404.

Ovaj radi oboje: ako trazena datoteka ne postoji, proba istu s .html,
i nikad ne preusmjerava, pa query ostaje netaknut.

Pokretanje:  python scripts/posluzitelj.py [port]
"""

import http.server
import os
import sys

KORIJEN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Rukovatelj(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=KORIJEN, **kw)

    def translate_path(self, path):
        put = super().translate_path(path)
        if not os.path.exists(put) and not put.endswith('.html'):
            if os.path.exists(put + '.html'):
                return put + '.html'
        return put

    def end_headers(self):
        # Bez cachea, da se izmjene vide odmah pri osvjezavanju.
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4321
    with http.server.ThreadingHTTPServer(('', port), Rukovatelj) as s:
        print('Valtinsu na http://localhost:%d  (korijen: %s)' % (port, KORIJEN))
        s.serve_forever()
