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

## Nowe w panelu
- **Ustawienia → Polityka prywatności** — treść edytowalna (PL/EN/DE), otwiera się w okienku z linku przy formularzu i w stopce (adres strony: `#polityka-prywatnosci`). Znaczniki {nazwa} {adres} {email} {telefon} wstawiają dane kontaktowe. Uzupełnij fragmenty [DO UZUPEŁNIENIA].
- **Dane kontaktowe → Nazwa w adresie i w stopce.**
- **Drużyny** — puste pola Rozgrywki/Sezon/Hala nie wyświetlają się; „Własne pola drużyny” pozwalają dodać dowolne (np. Trener główny, Dni treningów).
- **Informacje praktyczne** — długie teksty są zwijane z przyciskiem „Czytaj więcej”.
- **Historia** — rozdziały 2012–2015, 2015–2018 i 2018–2026; pasek rozdziałów jest przyklejony pod menu i sam przesuwa się przy przewijaniu.
- **Hasło do panelu** zmienione w panelu przy włączonym zapisie na serwerze zapisuje się na serwerze (ma pierwszeństwo przed `ADMIN_PASSWORD` z Cloudflare).


## Nowe funkcje (październik 2026)

### Automatyczne tłumaczenie EN/DE (Workers AI)
Dodatkowe powiązanie w Cloudflare: *Workers & Pages → ksturowprojekt → Settings → Bindings → Add → **Workers AI*** → Variable name: **`AI`** → Save → Retry deployment.
W panelu: przy każdym polu wielojęzycznym przycisk „⇄ Przetłumacz z PL”; *Ustawienia → Wersje językowe*: „Przetłumacz brakujące / wszystko” i tryb „Tłumacz automatycznie”.
Darmowy limit Workers AI wystarcza na tłumaczenie całej strony kilka razy dziennie. Tłumaczenia poprawione ręcznie nie są nadpisywane w trybie automatycznym.

### Synchronizacja składów i terminarz
- Drużyna → „Link do składu…” + przycisk **⟳ Zsynchronizuj dane** → okno z nowymi / brakującymi / zmienionymi zawodnikami i trenerami do zaznaczenia.
- Drużyna → „Link do terminarza…” → sekcja **Terminarz i wyniki** pobiera mecze automatycznie (odświeżanie co 3 godziny, przycisk „⟳ Odśwież terminarz”). Można też dopisywać mecze ręcznie.
- Dozwolone źródła: serwisy PZKosz i DZKosz. Jeśli serwis zmieni układ strony, odczyt może wymagać poprawki.

### Facebook
Panel → Wizerunek → Facebook → „Sposób wyświetlania wpisów”:
- **Wpisy w wyglądzie strony** (domyślnie): najpierw treść wpisu, zdjęcie pod spodem (albo nad — do wyboru), „Czytaj więcej” przy długich wpisach, liczba wpisów 1–20. Wpisy pobiera serwer strony co 15 minut, zdjęcia idą przez serwer strony (odwiedzający nie łączy się z Facebookiem — bez cookies, zgodnie z RODO). Wymaga **tokenu strony**.
- **Oficjalna wtyczka Facebooka**: wygląd Facebooka (kolejności treść/zdjęcie nie da się w niej zmienić). Działa też automatycznie jako zapas, gdy tokenu brak albo Facebook nie odpowiada.

**Jak zdobyć token strony (jednorazowo, ok. 10 minut):**
1. Wejdź na https://developers.facebook.com → „Moje aplikacje” → „Utwórz aplikację” (typ: Firma / „Inne”). Konto musi być administratorem strony klubu na Facebooku.
2. Otwórz **Narzędzia → Graph API Explorer**, wybierz swoją aplikację, kliknij „Get Token → Get Page Access Token”, zaznacz stronę klubu i uprawnienia `pages_show_list`, `pages_read_engagement`, `pages_read_user_content`.
3. Token z Explorera ważny jest ok. 1 godziny — zamień go na stały: w **Access Token Debugger** (Narzędzia → Debuger tokenów dostępu) kliknij „Extend Access Token”, a następnie w Graph API Explorer z tym długim tokenem wywołaj `me/accounts` — pole `access_token` przy stronie klubu to **token strony bez daty wygaśnięcia**.
4. Wklej go w panelu: Facebook → „Połączenie z Facebookiem” → **Zapisz token i pobierz wpisy**. Token zapisuje się tylko w bazie KV (nie trafia na stronę ani do kopii zapasowej). Alternatywnie dodaj go w Cloudflare jako zmienną szyfrowaną `FB_TOKEN`.
Uwaga: zmiana hasła do konta Facebook administratora może unieważnić token — wtedy wklej nowy.

### Kolejność sekcji
Panel → Klub → **Sekcje strony**: strzałki ▲▼ ustawiają, która sekcja jest nad którą (pierwszy ekran zawsze na górze, stopka na dole). „Ułóż menu w tej samej kolejności” porządkuje górne menu tak samo; „Przywróć domyślną kolejność” cofa zmiany. Kolejność zapisuje się na serwerze i widzą ją wszyscy odwiedzający.

### Formularz
Telefon z numerem kierunkowym (+48 / +49 / +44 / +420), tylko cyfry, długość 9 (PL) lub 7–15. Restrykcyjna walidacja e-maila, imienia i treści na żywo i przy wysyłce; czerwone komunikaty; blokada wielokrotnego wysłania.

### Odświeżanie strony
Po odświeżeniu (F5) strona wraca do tej samej sekcji i miejsca.
