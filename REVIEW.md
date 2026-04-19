# Study Hall - Refactor Review

Rovid, akcioorientalt attekintes a jelenlegi kodbazis refactor-igenyeirol.

## P0 - Kodszintuen fontos

### 1. Ketto parallel content pipeline fut egymas mellett
- **Erintett modulok:** `scripts/*.js`, `pipeline/*.py`, `scripts/README.md`, `scripts/generate-*.js`, `pipeline/process.py`, `pipeline/agents/*`
- **Mi a gond:** a Node CLI es a Python pipeline ugyanazt a domain-t oldja meg kulon promptokkal, kulon normalizacioval es kulon mentesi logikaval. Ez gyorsan schema-driftet es viselkedesi szorasat okoz.
- **Miert fontos:** ha a notes / quiz / flashcard generacios szabaly valtozik, ket helyen kell frissiteni. Ez a tartalomminoseget es a debugot is neheziti.
- **Konret megoldas:** valassz egy canonical pipeline-t, es a masik stack csak adapter legyen.
- **Konret megoldas:** emeld ki kozos modulokba a `schema`, `prompt`, `normalizer` es `serializer` reszeket.
- **Konret megoldas:** a vegso CLI entrypoint subjectenkent legyen egyetlen ajanlott ut, minden mas csak delegaljon.

### 2. A content schema tobb helyen lazan van normalizalva
- **Erintett modulok:** `lib/content.js`, `app/api/questions/[slug]/route.js`, `app/api/search/route.js`, `app/api/flashcards/[slug]/route.js`, `app/api/glossary/[slug]/route.js`, `src/screens/Written.jsx`, `src/screens/Quiz.jsx`, `src/screens/Flashcard.jsx`
- **Mi a gond:** sok alias van egyszerre hasznalva (`q`/`question`, `explain`/`explanation`, `ideal`/`idealAnswer`, `front`/`term`, `mc`/`mcq`). A backend es a frontend is reszben kulon konvenciokat kovet.
- **Miert fontos:** a hibat nehez megtalalni, mert a schema-problema gyakran csak egy-egy screenen bukik elo. A kereses, quiz es written feedback is ettol fugg.
- **Konret megoldas:** definialj egy kanonikus JSON shape-et subjecten belul, es az API-k csak ezt adjak tovabb.
- **Konret megoldas:** a normalizalast szedd ki egy kulon `lib/schema.js` vagy `lib/normalize-content.js` modulba.
- **Konret megoldas:** ahol ma aliasok vannak, ott irj validaciot es fail-fast hibat, ne csendes fallbacket.

## P1 - Architekturaba nyulo, de magas haszon

### 3. `lib/content.js` tul nagy es tul sok felelossegu
- **Erintett modulok:** `lib/content.js`, `app/api/*`, `src/screens/*`
- **Mi a gond:** egyetlen fajl kezeli a JSON beolvasast, frontmatter parsingot, note extractiont, search rankinget, cache-t es subject summary-kat.
- **Miert fontos:** a fajl mar most is nehezen attekintheto, es a cache / parsing logika kozotti kapcsolat miatt a hibak rejtettek maradnak.
- **Konret megoldas:** bontsd szet `loaders`, `normalizers`, `parsers`, `search` es `summary` modulokra.
- **Konret megoldas:** a route-ok maradjanak vekonyak, es csak egyetlen kozos content service-t hivjanak.
- **Konret megoldas:** a cache kulcsait es invalidacios szabalyait dokumentald, hogy ne legyen rejtett state.

### 4. A Study oldal markdown/MDX feldolgozasa fragile, kezzel irt parserre epul
- **Erintett modulok:** `src/screens/Study.jsx`, `scripts/note-prompts.js`, `content/*/notes/*.mdx`
- **Mi a gond:** a `Study.jsx` sajat mini-markdown rendererrel dolgozik, mikozben a tartalom MDX-kent van tarolva, KaTeX-et is hasznal, es mar vannak custom blokkok is.
- **Miert fontos:** minden uj syntax vagy callout-forma tobb helyen fog torni. A parser most valoszinuleg a legkenyebb pont a study experience-ben.
- **Konret megoldas:** vezess be egy explicit markdown-to-component transzformert tamogatott blokktipusokkal.
- **Konret megoldas:** a custom syntaxot ugyanaz a parser kezelje, amelyik a promptot is ismeri, ne a screen.
- **Konret megoldas:** adj hozza fixture-alapu render teszteket a tipikus callout / math / active recall blokkokra.

### 5. A frontend screen-ekben sok a duplikalt inline UI minta
- **Erintett modulok:** `src/screens/Home.jsx`, `src/screens/Subject.jsx`, `src/screens/Study.jsx`, `src/screens/Written.jsx`, `src/screens/Quiz.jsx`, `src/screens/Flashcard.jsx`, `src/shell.jsx`, `src/theme.js`
- **Mi a gond:** ugyanazok a card/pill/button/progress patternok tobb screenen ujra vannak irva, sokszor enyhe elteresekkel.
- **Miert fontos:** a design drift a jelenlegi fejlesztesi utemben garantalt lesz, es a kisebb UI javitasok aranyaiban tul dragak.
- **Konret megoldas:** emeld ki a gyakori mintakat kis UI primitive-kbe: stat pill, section header, primary/ghost button, progress bar, bordered card.
- **Konret megoldas:** a shell/theme reteg maradjon az egyetlen hely, ahol a kozos vizualis tokenek szinten vannak.
- **Konret megoldas:** a screen-ekben csak kompozicio maradjon, ne ujra megirt stiluslogika.

## P2 - Teljesitmeny / tisztasag

### 6. A keresesi implementacio linearis es on-the-fly normalizal
- **Erintett modulok:** `lib/content.js` `searchContent()`, `app/api/search/route.js`
- **Mi a gond:** minden kereseskor vegigscanneli az osszes subjectet, note-ot, questiont es glossary entry-t. Kisebb tarterjedelmenel ez oke, de a ranking is meglehetosen alap.
- **Miert fontos:** ha no a content volume, a search lassulni fog, es a relevancia is gyenge maradhat.
- **Konret megoldas:** epits subject-szintu lightweight search indexet, amit a content generator frissit.
- **Konret megoldas:** kulon valaszd szet a tokenizalast, score szamolast es response formatolast.
- **Konret megoldas:** a route csak parametereket validaljon es a search service-t hivja.

### 7. Az API route-ok nagyrészt thin wrapper-ek, de nincs kozos error/response minta
- **Erintett modulok:** `app/api/subjects/*`, `app/api/notes/*`, `app/api/questions/*`, `app/api/glossary/*`, `app/api/flashcards/*`, `app/api/validate-answer/route.js`
- **Mi a gond:** sok route ugyanazt a pattern-t koveti, csak atnevezi a mezoket. A validation es hibakezeles sem egységes.
- **Miert fontos:** a kozos hibakezeles hianya miatt a client oldalon is nehezebb megbizhato UX-et epiteni.
- **Konret megoldas:** hozz letre kozos `jsonOk/jsonError/notFound` helper-eket.
- **Konret megoldas:** a response shape-ekhez legyen egyetlen serializer layer, ne route-onkenti masolas.
- **Konret megoldas:** a validate-answer route kapjon egysges input-schemat es timeout/fallback konvenciot.

## Javasolt sorrend

1. **Schema + pipeline rendezese** - eloszor a content contract legyen stabil.
2. **`lib/content.js` szetbontas** - utana jon a karbantarthatosag nyeres.
3. **Study parser refactor** - mert ez erinti a legtobb user-facing tartalmat.
4. **UI primitive-ek kinyerese** - hogy a tovabbi vizualis finomitas ne szorjon szet.

## TypeScript-maradekok

A TS migracio utan jelenleg **nem talaltam `tsconfig.json`-t**, es a cleanup utan mar nincs `.ts` / `.tsx` source fajl a repoban.
Korabbi maradekok voltak:

- `next-env.d.ts`
- `tsconfig.tsbuildinfo`

### `tsconfig.tsbuildinfo`
- **Allapot:** biztonsagosan torolheto, mert build cache / generalt artifact.
- **Megjegyzes:** ha verziozott allapotban van, az inkabb takaritasi adossag, nem forrasfajl.
- **Status:** torolve.

### `next-env.d.ts`
- **Allapot:** JS-only repo eseteben valoszinuleg torolheto, de ez mar nem teljesen automatikusan safe.
- **Miert volt ovatos:** a fajl Next TypeScript projektben hasznos, de a repo jelenleg JS-only, es a `next.config.mjs` mar csak `js`, `jsx`, `mdx` page extensionoket enged.
- **Javaslat:** csak akkor vedd ki, ha tenyleg vegleg JS-only marad a repo, es nem akarsz TS tamogatast visszahozni.
- **Status:** torolve, mert nincs mar `.ts`/`.tsx` source fajl a repoban es a build cache-t is kitettem.
- **Verifikacio:** `next build` es `next lint` lefutott a torlesek utan.

### `tsconfig.json`
- **Allapot:** nem letezik a repoban, tehat nincs mit eltavolitani.

### `next.config.mjs` megjegyzes
- **Allapot:** atallitva `['js', 'jsx', 'mdx']` page extensionokre.
- **Javaslat:** ha kesobb TS-visszaallitas kell, ezt a listat lehet boviteni.

## Rogzito megjegyzes

Ez a repo mar eleg jol mukodik funkcionalisan, de jelenleg a legnagyobb refactor-nyomas nem egy-egy hianyzo feature, hanem a tartalomschema, a pipeline kettosseg es a custom render logika menten gyulik.
