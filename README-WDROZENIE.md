# KS Turów — strona ksturow.eu (PL / EN / DE) z panelem administracyjnym

## Zawartość
- `index.html` (PL), `en/index.html`, `de/index.html` — one-page z wbudowanym panelem (kłódka w lewym dolnym rogu lub „Panel administratora” w stopce)
- `404.html`, `robots.txt`, `sitemap.xml`, `site.webmanifest`, `favicon.svg`, `icons/`, `_headers` (cache na Cloudflare Pages)
- `img/` — logo w WebP, `og-image.jpg` (1200×630), `fonts/` — Barlow Condensed + Barlow (lokalnie, bez Google Fonts)
- `dokumenty/` — miejsce na regulamin klubu (PDF)

Panel: login **admin**, hasło **kosz2026** (wersja demonstracyjna — zmiany zapisują się tylko w przeglądarce edytującego).

## Plan SEO
| | |
|---|---|
| Fraza główna | klub koszykarski Zgorzelec |
| Frazy poboczne | koszykówka Zgorzelec · treningi koszykówki dla dzieci Zgorzelec · nabór do drużyny koszykarskiej · akademia / szkółka koszykówki Zgorzelec · KS Turów Zgorzelec |
| Adresy | `https://ksturow.eu/` (PL, x-default), `/en/`, `/de/` |

| Sekcja | Kotwica | Fraza |
|---|---|---|
| Pierwszy ekran (H1) | #start | klub koszykarski Zgorzelec |
| Aktualności | #aktualnosci | KS Turów Zgorzelec |
| Nabory i akcje | #nabory | nabór do drużyny koszykarskiej |
| O klubie | #o-klubie | KS Turów Zgorzelec, koszykówka Zgorzelec |
| Grupy treningowe | #grupy | treningi koszykówki dla dzieci Zgorzelec |
| Zespół / Galeria / Instagram / Certyfikaty | #zespol #galeria #instagram #certyfikaty | (zaufanie) |
| Informacje praktyczne | #informacje | hala, składki, regulamin |
| Kontakt | #kontakt | NAP, mapa, godziny biura |

Dane strukturalne: `SportsClub` (sport: Basketball) + `WebSite`. Bez ocen i opinii. Pola z [DO UZUPEŁNIENIA] nie trafiają do JSON-LD; godziny trafiają dopiero po zaznaczeniu w panelu „Godziny są potwierdzone”.

## Lista kontrolna SEO
**Spełnione:** lang + hreflang (pl/en/de/x-default) · unikalne title (≤60) i description (140–160) w 3 językach · jeden H1, hierarchia H2/H3 · canonical · Open Graph + Twitter Card + og-image · JSON-LD · treść w HTML bez JS · semantyczny HTML5 · mobile-first, brak poziomego przewijania przy 390 px, przyciski ≥44 px · lokalne fonty z preload i font-display: swap (2 kroje) · krytyczny CSS w head · mapa Google dopiero po kliknięciu · Instagram dopiero po kliknięciu · robots.txt, sitemap.xml, 404, favicony, manifest, theme-color · prefers-reduced-motion · brak śledzenia bez zgody (miejsce na GA4 i GSC zakomentowane w `<head>`).

**Do uzupełnienia przez klub:**
1. Telefon, e-mail klubu, ulica i kod pocztowy (Panel → Dane kontaktowe)
2. Linki: Facebook, Instagram, **Profil Firmy w Google** [LINK DO UZUPEŁNIENIA]
3. Teksty klubu (o klubie, grupy: roczniki, terminy, składki) — obecne teksty to szkice
4. Profesjonalne zdjęcia: slider, o klubie (2), grupy, zespół, galeria, certyfikaty — najlepiej WebP, opisowe nazwy plików (np. `trening-koszykowki-dzieci-zgorzelec.webp`); zdjęcia wgrane przez panel zapisują się jako JPEG w przeglądarce
5. Godziny biura (obecnie przykładowe) i zaznaczenie „potwierdzone”
6. Regulamin PDF w `dokumenty/` + polityka prywatności (link przy formularzu)
7. Obsługa formularza (np. Formspree) — bez niej formularz otwiera program pocztowy
8. Widżet Instagrama (np. LightWidget / Behold) — adres w Panel → Galeria i Instagram
9. Weryfikacja tłumaczeń EN/DE (przygotowane z pomocą AI)
10. Po pracy w panelu: Kopia zapasowa → Pobierz .json i przekaż wykonawcy, by utrwalić treści w plikach (panel demo nie publikuje zmian dla odwiedzających)

## Google Search Console — krok po kroku
1. Wejdź na search.google.com/search-console → **Dodaj usługę** → wybierz **Domena** i wpisz `ksturow.eu`.
2. Dodaj podany rekord TXT w DNS u rejestratora domeny (lub w Cloudflare DNS) i kliknij **Zweryfikuj**.
   (Alternatywa: typ „Prefiks URL” → metoda „Tag HTML” → wklej kod do zakomentowanego `google-site-verification` w `<head>` wszystkich trzech plików index.html.)
3. Menu **Mapy witryn** → wpisz `sitemap.xml` → **Prześlij**.
4. **Sprawdzanie adresu URL** → `https://ksturow.eu/` → **Poproś o zindeksowanie** (to samo dla `/en/` i `/de/`).
5. Ponieważ stara strona nie działa, po kilku dniach sprawdź raport **Strony** (błędy 404 ze starych adresów można przekierować w pliku `_redirects` na Cloudflare Pages).

## Wdrożenie (Cloudflare Pages)
Wgraj zawartość ZIP (folder główny = ten, w którym jest `index.html`) jako projekt Pages, podłącz domenę `ksturow.eu` (+ przekierowanie `www` → bez www).
