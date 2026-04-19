# Agentic AI workflow javitasi terv

## Kontekstus

Ez a dokumentum a jelenlegi backend/content pipeline alapjan keszult, a kovetkezo forrasok atnezese utan:
- `PLAN.md`
- `scripts/`
- `pipeline/`
- a kapcsolodo skill-ek kozul elsosorban a `note-maker`, valamint a `coding-standards` es `design-engineering` elvek

A cel nem a teljes atiras, hanem annak megmutatasa, hogyan lehet a quiz / test / note generaciot megbizhatobb, konzisztens es jobban orizheto agentikus folyamattá alakítani.

## Rövid diagnozis

A jelenlegi workflow erosebb, mint egy atlagos "egy prompt -> egy fajl" pipeline, mert van:
- chunkolas
- fallback modellek
- JSON validacio
- normalizalas
- note summary / active recall
- content artifactok

De a legfontosabb hiany az, hogy a rendszer **nem egy kozos tartalmi tervbol dolgozik**. A notes, a quiz, a flashcard es a glossary generator ugyanazt a nyers forrast latja, de kulon logikaval, kulon prompttal, kulon minosegi szabalyokkal. Emiatt:
- a sectionok szetszedodhetnek
- ugyanaz a fogalom mas neven jelenhet meg
- a quiz nem biztos, hogy lefedi a note legfontosabb elemeit
- a written tesztek model answers-ei nem mindig kovetnek egy stabil rubricat
- a fallback es a remote generacio kozott stilus-es szerkezeti ugralok vannak

## Mi kellene valojaban

### Javasolt agentikus architektura

1. **Ingest / extraction**
   - PDF, DOCX, PPTX feldolgozas
   - kepek, tablazatok, fejezetcimkek, blokk-tipusok jelolese

2. **Content planning agent**
   - a nyers szovegbol kozos strukturalt terv keszul
   - ez lesz a notes, quiz, extras es written inputja is

3. **Note generation agent**
   - a terv alapjan irja meg a jegyzetet
   - nem csak chunkonkent, hanem lesson-szinten is osszefuzott logikaval

4. **Assessment generation agent**
   - quiz + written kerdesek
   - coverage matrix alapjan, nem csak "mennyisegi" prompttal

5. **Extra generation agent**
   - flashcard + glossary
   - a tervben szereplo kulcsfogalmakbol

6. **Verifier / normalizer agent**
   - schema validacio
   - redundancia szures
   - coverage ellenorzes
   - szoveg- es mezoszinergia a tartalmak kozott

7. **Regression report**
   - futas vegen osszefoglalo: mi keszult, mi maradt ki, mi volt fallback

## Legfontosabb fejlesztesi iranyok

### 1. Kozos content plan bevezetese

Ez a legfontosabb javitas. Egy kozos, strukturalt koztes artefakt kell, amit az osszes generalo agent fel tud hasznalni.

#### Mit tartalmazzon

- subject slug, source file, section
- detected headings
- concept inventory
- learning objectives
- key terms
- likely exam facts
- misconceptions / traps
- source citations vagy minimum page/slide hivatkozasok
- visual candidates
- output intent: note / quiz / flashcard / glossary

#### Miert segit

- a notes es a quiz ugyanazt a fogalmi vázat latja
- csokken a section drift
- egyszerubb a deduplikacio
- jobb lesz a coverage
- kevesebb a "szep, de nem vizsgakompatibilis" output

#### Javasolt megvalositas

- uj planner lepes a pipeline elejen
- JSON artefakt mentese `content/<slug>/notes/artifacts/` melle vagy kulon `plan.json`-ba
- a generatorok ezt kapjak inputnak a raw text mellett

---

### 2. Notes generacio: lesson-szintu, nem csak chunk-szintu vezérlés

A `scripts/generate-notes.js` jelenleg chunkokbol allit elo MDX-et, ami jo kezdet, de a minoseg itt szokott elcsuszni.

#### Problémák

- a chunkok onalloan "szepen" irnak, de a teljes jegyzet nem mindig all ossze
- a section nev/lesson cim driftelhet
- az active recall kesobb kulon generalt, igy nem mindig kapcsolodik pontosan a note hangulatahoz

#### Megoldasi minta

1. Eloszor a planner allitson elo egy `lesson_outline`-t
2. A notes generator ehhez igazodjon
3. Minden chunk kapjon:
   - kozos section azonositot
   - elozmeny kontextust
   - "what already covered" listat
4. A vegso osszefuzes utan jonnenek a verifikacios lepesek:
   - duplikalt cimek kiszurese
   - ismételt definiciok tomoritese
   - references & credits ellenorzes

#### Kulcs elv

A `note-maker` skill logikaja szerint a note **tanithato**, **forras-grounded**, **humanized**, es nem "AI sludge". Ez azt jelenti, hogy a generatornak nem csak szoveget kell eloallitani, hanem oktatasi logikat is.

---

### 3. Quiz generacio: coverage matrix + distractor quality

A jelenlegi quiz agent jol validalja a JSON-t, de nincs erosebb fogalmi lefedettseg-kezelese.

#### Mi hizik

- nincs ellenorzott arany a learning objectives es a kerdesek kozott
- nincs concept coverage matrix
- a helytelen valaszok minosege nem kerul utovalidaciora
- a written kerdesek es a notes kozott nincs explicit kapcsolat

#### Javasolt megoldas

1. A planner adjon `concepts` es `objectives` listat
2. A quiz generator ezekbol epitsen kerdeseket
3. Kotelezo legyen:
   - minden fontos concepthez legalabb egy kerdes
   - a written kerdesek legalabb egy objective-et fedjenek
   - a multi-select kerdesek ne legyenek tul hasonloak egymashoz
4. Utolso lepesben egy verifier szurni tudjon:
   - trivialis kerdeseket
   - rossz distractorokat
   - duplikatumokat
   - tul rovid vagy tul homalyos explanation mezot

#### Gyakorlati kimenet

- jobb vizsgaszintu kerdesek
- kevesebb "szovegbol kiszedett" de nem valodi tudastmero kerdes
- stabilabb difficulty balansz

---

### 4. Written test: rubric-first tervezes

A written test a legnagyobb kockazat, mert itt a modellnek nem csak kerdezni, hanem ertekelni is kell.

#### Jelenlegi gyenge pontok

- a minta valaszok minosege konzisztencia nelkuli lehet
- a `key_points` listak nem mindig eleg kimeritoek
- az ertekelesi logika nincs szigoruan kalibralva a generalt kerdesekhez
- nincs olyan explicit rubrika, amit a note -> question -> evaluation lanc folyamatosan hasznalna

#### Javasolt modell

Minden written kerdeshez kulon `rubric` objektum:

```json
{
  "question": "...",
  "model_answer": "...",
  "key_points": ["...", "..."],
  "rubric": {
    "must_have": ["..."],
    "nice_to_have": ["..."],
    "common_mistakes": ["..."],
    "score_bands": {
      "0-39": "..."
    }
  }
}
```

#### Miert jo ez

- az ertekeles kevésbé lesz improvizatív
- a prompt egyszerre tud pontozni es magyarazni
- a future `validate-answer` is jobban tud ehhez igazodni

---

### 5. Post-generation verifier

Ez az egyik legjobb "agentic" bovitmeny lenne, mert nem a generacio helyett, hanem utana dolgozik.

#### Feladata

- schema validacio
- hossz / tartalom ellenorzes
- duplikatumok kiszurese
- section consistency check
- note-question alignment check
- glossary/flashcard overlap check
- fallback jelzes

#### Kimenet

Egy JSON report:
- `passed`
- `warnings`
- `errors`
- `coverage`
- `fallback_used`
- `needs_manual_review`

#### Miert fontos

A pipeline jelenleg menti a kimenetet, de nem mondja meg eleg jol, hogy **mennyire jo**. A verifier ezt a vakfoltot csokkenti.

---

## Prioritizalt megvalositas

### P0 - azonnal erdemes

1. **Shared content plan**
   - egy kozos JSON koztes réteg
   - notes / quiz / extras mind ezt hasznalja

2. **Notes continuity pass**
   - chunkok osszefuzese utan kozos structural review
   - section drift csokkentese

3. **Quiz coverage matrix**
   - objectives -> questions mapping
   - deduplikacio
   - distractor minoseg check

4. **Written rubric object**
   - explicit score bands, must-have points, common mistakes

### P1 - kovetkezo kor

5. **Verifier / repair loop**
   - rossz schema vagy coverage eseten automatikus ujraprobalkozas

6. **Regression set**
   - 3-5 subjectre kis "golden" kimenet
   - uj pipeline futasokkal osszehasonlithato

7. **Provenance tracking**
   - melyik forras oldalon / slide-on alapul egy-egy note vagy kerdes

### P2 - rafinasabb bovitmenyek

8. **Unified orchestration**
   - Node es Python oldali logika jobb szetvalasztasa vagy osszevonasa

9. **Smarter fallback tiers**
   - nem csak "remote vs local", hanem minoseg-alapu fallback

10. **Human review mode**
    - a generalt content plan es verifier report alapjan gyors manual review checklist

---

## Affected files, ha ezt implementaljuk

### Mezo- és prompt szint

- `scripts/note-prompts.js`
- `scripts/generate-notes.js`
- `scripts/generate-questions.js`
- `scripts/generate-extras.js`
- `scripts/local-generators.js`

### Orchestration

- `scripts/generate-all.js`
- `scripts/normalize-content.js`
- `scripts/document-chunker.js`
- `scripts/content-utils.js`

### Python pipeline

- `pipeline/process.py`
- `pipeline/models.py`
- `pipeline/groq_client.py`
- `pipeline/agents/notes.py`
- `pipeline/agents/quiz.py`
- `pipeline/agents/flashcard.py`
- `pipeline/agents/glossary.py`
- `pipeline/agents/active_recall.py`
- `pipeline/agents/ingest.py`

### Uj fajlok, amik erdemesek lennenek

- `pipeline/agents/content_plan.py`
- `pipeline/agents/verify.py`
- `scripts/build-content-plan.js`
- `scripts/validate-content.js`
- `content/<slug>/plan.json`

---

## Kockazatok

### 1. Tulzottan szigoru schema

Ha a terv tul merev, a generator es a fallback is sokat fog elhasalni. Kell hely a rugalmasabb mezoknek is.

### 2. Tobb pipeline, tobb duplikacio

Most Node es Python oldalon is van content generation. Ha nincs egyertelmu "source of truth", a javitasok ket helyen fognak szetcsuszni.

### 3. Koszt es latency

A planner + verifier + repair loop tobblet API hívás. Ezt rate limit, cache es quality thresholdok mellett kell bevezetni.

### 4. Hallucinacio a coverage javitasa kozben

Ha a planner tul agresszivan general concept inventoryt, akkor hamis lefedettseg erzeketet adhat. Itt a source-grounding a legfontosabb.

### 5. Fallback es remote stiluskulonbseg

Ha a remote modell jobban strukturalt, mint a local fallback, a kimenet egyenetlen lesz. A fallbacknek is ugyanazt a szerkezetet kell kovetnie.

### 6. Tulszabalyozas

Nem kell minden outputot tokeletesen "AI-agentszeru" tenni. A legjobb fejlesztesek azok, amelyek a szerkezetet javitjak, nem a komplexitast novelik.

---

## Konkret kovetkezo lepesek

1. Definialni a `content_plan.json` sémat.
2. A notes generator ele adni egy planner lepeset.
3. A quiz generatornak a planner concept listajabol dolgozni.
4. A written kerdesekhez rubricot es score bandeket vezetni.
5. Bevezetni egy verifier scriptet, ami mentes elott ellenoriz.
6. Futtatasi riportot kuldeni minden generate-all futas vegen.

## Vegso ajanlas

Ha csak egy dolgot lehet most megcsinalni, akkor az a **shared content plan + verifier** paros.

Ez fogja a legjobban osszekotni a notes, quiz, written teszt es extras generaciot, es ez adja meg az igazi agentikus viselkedes alapjat: nem csak generalni, hanem **tervezni, ellenorizni es javitani**.

