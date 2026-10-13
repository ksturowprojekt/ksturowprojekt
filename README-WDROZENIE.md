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
| Historia klubu (oś czasu, 6 rozdziałów) | #historia, #rozdzial-1…6 | historia Turów Zgorzelec |
| Największe osiągnięcia | #osiagniecia | Turów Zgorzelec mistrz Polski 2014 |
| Drużyna seniorów (2 Liga) | #zespol | PGE GiEK Turów Zgorzelec skład |
| Drużyny młodzieżowe U13/U15/U17 | #mlodziez | koszykówka dla dzieci i młodzieży Zgorzelec |
| Grupy treningowe | #grupy | treningi koszykówki dla dzieci Zgorzelec |
| Galeria / Instagram / Certyfikaty | #galeria #instagram #certyfikaty | (zaufanie) |
| Sponsorzy / Partnerzy (logotypy z linkami) | #sponsorzy #partnerzy | (zaufanie) |
| Informacje praktyczne | #informacje | hala, składki, regulamin |
| Kontakt | #kontakt | NAP, mapa, godziny biura |

Dane strukturalne: `SportsClub` (sport: Basketball) + `WebSite`. Bez ocen i opinii. Pola z [DO UZUPEŁNIENIA] nie trafiają do JSON-LD; godziny trafiają dopiero po zaznaczeniu w panelu „Godziny są potwierdzone”.

## Lista kontrolna SEO
**Spełnione:** lang + hreflang (pl/en/de/x-default) · unikalne title (≤60) i description (140–160) w 3 językach · jeden H1, hierarchia H2/H3 · canonical · Open Graph + Twitter Card + og-image · JSON-LD · treść w HTML bez JS · semantyczny HTML5 · mobile-first, brak poziomego przewijania przy 390 px, przyciski ≥44 px · lokalne fonty z preload i font-display: swap (2 kroje) · krytyczny CSS w head · mapa Google dopiero po kliknięciu · Instagram dopiero po kliknięciu · robots.txt, sitemap.xml, 404, favicony, manifest, theme-color · prefers-reduced-motion · brak śledzenia bez zgody (miejsce na GA4 i GSC zakomentowane w `<head>`).

**Do uzupełnienia przez klub:**
1. E-mail klubu (Panel → Dane kontaktowe); adres i telefon biura uzupełnione z serwisu PZKosz — do potwierdzenia
2. Linki: Facebook, Instagram, **Profil Firmy w Google** [LINK DO UZUPEŁNIENIA]
3. Teksty grup treningowych (terminy, składki); historia kończy się na sezonie 2011/2012 — warto dopisać lata 2012–2026
3a. Składy aktualizować w panelu (Drużyny → Seniorzy / U13 / U15 / U17); dla juniorów pokazywany jest tylko rocznik
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

## Panel — nowe funkcje
- **Drużyny → Wszystkie drużyny:** dodawanie nowych grup zawodników (np. U11, U19, drużyna kobiet) jako zakładek w sekcji młodzieżowej lub seniorskiej; przełącznik „Pokazuj numery zawodników”.
- Zawodnicy: zdjęcie (także młodzież), pozycja z listy lub wpisana własna.
- **Sponsorzy / Partnerzy:** logo (PNG/SVG z przezroczystością), link, podpis, wyróżnienie.
- **Ustawienia → Wersje językowe:** włączanie/wyłączanie EN i DE. Na stałe dla wszystkich: ustaw `settings.langs` w `src/data-club.js` i uruchom `node build.js` — foldery /en/ lub /de/ nie zostaną wygenerowane.
- **Podgląd na żywo** obok formularza: pomniejszona edytowana sekcja + jej miejsce na stronie.

## Formularz kontaktowy — wysyłka
Panel → Klub → **Formularz kontaktowy** → „Sposób wysyłki”:
- **Program pocztowy (mailto)** — domyślnie. Bez serwera: otwiera pocztę odwiedzającego z gotową wiadomością na adres odbiorcy; wysyła ją sam odwiedzający.
- **FormSubmit.co** — wysyłka bezpośrednio ze strony na podany adres. Pierwsza wiadomość przyniesie e-mail aktywacyjny (kliknąć link). Bezpłatne.
- **Własny adres obsługi** — np. Formspree / Web3Forms / Cloudflare Worker (JSON POST).
Ochrona przed botami: ukryte pole-pułapka, minimalny czas wypełniania, opcjonalne działanie matematyczne. Limit 8 pól — formularz zawsze mieści się na ekranie (wysokość pola wiadomości dopasowuje się automatycznie).

## Inne ustawienia w panelu
- **Menu strony** — kolejność pozycji (▲▼), ukrywanie z menu, własne nazwy (menu i stopka).
- **Opisy osób** — pole „Opis / historia” przy zawodnikach i trenerach; kliknięcie otwiera okienko. Wyłącznik: Drużyny → Wszystkie drużyny.
- **Godziny biura** — przełącznik „Pokazuj godziny otwarcia biura na stronie”.
- **Osiągnięcia** — rodzaj z listy albo własny tekst (etykieta na kafelku).
- **Nazwa w nagłówku** obok logo (pogrubiona nazwa + podpis) — Wizerunek → Strona główna.
- **Informacje praktyczne** — bloki z nagłówkiem, treścią i linkiem (dodawanie, usuwanie, kolejność) + link pod całą sekcją.
- **Nabory** — powiązana grupa z listy albo własna nazwa (pojawia się na przycisku „Zapisz się: …”).


## ZAPIS PANELU NA SERWERZE — jednorazowa konfiguracja w Cloudflare (ok. 10 min)
Bez tego panel działa w „trybie lokalnym” (zmiany widać tylko w przeglądarce, w której je zrobiono).
Po konfiguracji zmiany z panelu widzą od razu wszyscy — na każdym komputerze i telefonie.

1. **Utwórz bazę KV:** dash.cloudflare.com → *Storage & Databases* → *Workers KV* → **Create instance** → nazwa np. `ksturow-cms` → Create.
2. **Podepnij ją do strony:** *Workers & Pages* → projekt `ksturowprojekt` → *Settings* → *Bindings* → **Add** → *KV namespace* →
   - Variable name: **`CMS`** (dokładnie tak, wielkimi literami),
   - KV namespace: `ksturow-cms` → Save.
3. **Ustaw hasło do panelu:** *Settings* → *Variables and Secrets* → **Add** → Type: *Secret*, Name: **`ADMIN_PASSWORD`**, Value: Twoje hasło → Save.
   (Opcjonalnie `ADMIN_LOGIN`, domyślnie `admin`.) Bez tego działa hasło startowe `kosz2026` — panel przypomni o zmianie.
4. **Wdróż ponownie:** *Deployments* → przy ostatnim wdrożeniu „…” → **Retry deployment** (albo wgraj pliki na GitHub jeszcze raz).
5. Otwórz stronę → kłódka → zaloguj się. Na pulpicie panelu powinno być: **„● Zapis na serwerze włączony”**.
6. Masz wcześniejsze zmiany zrobione w panelu w tej przeglądarce? *Kopia zapasowa* → **Przywróć zmiany z archiwum** — zostaną wysłane na serwer.

Jak to działa: folder `functions/` zawiera małe funkcje serwerowe (`/api/content`, `/api/login`, `/api/password`, `/api/img`).
Każde wejście na stronę pobiera najnowsze treści z bazy (bez pamięci podręcznej). Zdjęcia z panelu zapisują się na serwerze jako osobne pliki.
Darmowy plan Cloudflare: 100 000 odczytów i 1 000 zapisów dziennie — z dużym zapasem dla strony klubu.
Treść startowa nadal jest wbudowana w HTML (dla Google i na wypadek awarii serwera).
