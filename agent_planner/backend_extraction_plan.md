# Backend Extraction Plan

Scope: `scripts/generate-notes.js`, `scripts/document-chunker.js`, `scripts/generate-questions.js`, `scripts/generate-extras.js`, `scripts/content-plan.js`, es a kapcsolodo pipeline docs.
Inference: a javaslat a jelenlegi repo allapota alapjan keszult, kulso best-practice lookup nelkul.

## Update 2026-04-20

Implemented in the current backend batch:
- `source-intelligence.js` is now the shared extraction/manifest layer for PDF, DOCX, MD, MDX, and TXT sources.
- Source manifests now preserve assessment blocks, routed-vs-review question candidates, visual references, extracted DOCX assets, and learning signals.
- `document-chunker.js` now emits chunk-level learning intent plus concept, definition, example, and question signals.
- `generate-notes.js` writes the richer chunk/source metadata into note artifacts so downstream generators can reuse it.
- `generate-questions.js` now reads lesson-source assessment blocks separately, uses the content plan coverage matrix, and adds inferred `conceptIds`.
- `content-plan.js` now writes structured `concepts`, `objectives`, `coverageMatrix`, and `extractionQuality`.
- `content/it_biztonsag/plan.json` was rebuilt with the new schema; validation currently reports `pass` with score `95/100`.

Still open:
- JS-side PPT/PPTX ingestion is still not unified with the Node generator path.
- PDF raster image extraction is still stronger in the Python pipeline than in the JS scripts.
- Validation still needs explicit concept coverage and visual-reference-loss checks.

## Allapotkep

### Done
- PDF/DOCX szoveg-extraction mar letezik.
- Notes chunking mar felismer headingeket, tablazat/abra/equation/code cue-kat.
- Questions / extras pipeline mar hasznalja a content plan kontextust.
- A blackbox backend smoke mar tud contentet es live route-okat ellenorizni.

### In progress
- PDF/PPT/PPTX fedes meg nem egységes.
- Embedded ellenorzo kerdesek routingja a test/quiz flow-ba meg laza.
- Képek / ábrák tartós mentése `sources/assets` alá még nincs lezárva.

### Next
- Unified source extraction layer bevezetese.
- Asset manifest + figure/image persistence.
- Question routing hints a test / lesson splithez.

## Tényleges backlog

### P0
1. **Egységes source extraction adapter**
   - Cél: PDF, DOCX, PPT, PPTX, MD/MDX egy közös normalizált kimenetre menjen.
   - Érintett fájlok: `scripts/generate-notes.js`, `scripts/generate-questions.js`, `scripts/content-plan.js`, `scripts/document-chunker.js`.
   - Miért kell: jelenleg a PDF/DOCX erősebb, a PPT/PPTX fedés hiányzik vagy széttagolt lenne.
   - Javasolt megoldás: közös `extract-source` helper, típustól függő adapterekkel és egységes `extractionManifest` kimenettel.
   - Kockázat: magas, mert több pipeline lépést érint.
   - Most implementálható? Igen, de külön backend batch-ben.

2. **Beágyazott ellenőrző kérdések felismerése**
   - Cél: a notes/test source-okból a kérdés-szerű blokkot észlelni, és a megfelelő routingba küldeni.
   - Érintett fájlok: `scripts/document-chunker.js`, `scripts/generate-questions.js`, `scripts/content-plan.js`, `scripts/note-prompts.js`.
   - Miért kell: a jelenlegi prompt-alapú generálás mellett a forrásban lévő self-check / exam / review kérdések elveszhetnek.
   - Javasolt megoldás: cue-alapú detektor (`question`, `check`, `quiz`, `self-test`, `practice`, slide question markers), plusz route hint.
   - Kockázat: magas, mert a lesson/test határ elcsúszhat.
   - Most implementálható? Igen, de csak adapter + routing batch-ben.

3. **Képek / ábrák mentése sources/assets alá**
   - Cél: a kinyert képek, diagramok, slide-illusztrációk tartósan meglegyenek subject-szinten.
   - Érintett fájlok: `scripts/document-chunker.js`, `scripts/generate-notes.js`, `scripts/content-plan.js`, új asset writer/helper.
   - Miért kell: a jelenlegi pipeline felismeri a visual cue-kat, de nem menti le őket stabilan.
   - Javasolt megoldás: per-source asset manifest, hash alapú fájlnév, `storage/subjects/<slug>/sources/assets/` vagy ennek megfelelő content-mirroring.
   - Kockázat: magas, mert fájl- és metadata konzisztenciát is érint.
   - Most implementálható? Igen, de külön batch kell.

### P1
4. **Test/quiz routing finomítása**
   - Cél: a forrásokból generált kérdések tudatosan test vagy lesson bucketbe kerüljenek.
   - Érintett fájlok: `scripts/generate-questions.js`, `scripts/generate-extras.js`, `scripts/content-plan.js`, `scripts/normalize-content.js`.
   - Miért kell: a mostani routing inkább fájlmappára és prompt logikára támaszkodik.
   - Javasolt megoldás: `sourceKind`, `routingHint`, `confidence` mezők, és ezek alapján target JSON / section mapping.
   - Kockázat: közepes-magas.
   - Most implementálható? Igen, de csak a P0 extraction után.

5. **Chunk metadata gazdagítása**
   - Cél: minden chunk kapjon stabil azonosítót, source referenciát, visual candidate listát, kérdés jelöltet, és asset hivatkozást.
   - Érintett fájlok: `scripts/document-chunker.js`, `scripts/generate-notes.js`.
   - Miért kell: downstream generátoroknak kevesebb implicit logikára kellene támaszkodniuk.
   - Javasolt megoldás: chunk manifest schema és egységes JSON artifact.
   - Kockázat: közepes.
   - Most implementálható? Igen.

6. **Content plan minőség jelzések**
   - Cél: a `content-plan.js` ne csak mennyiséget, hanem extraction quality-t is jelezzen.
   - Érintett fájlok: `scripts/content-plan.js`.
   - Miért kell: a pipeline egészsége így mérhetőbb.
   - Javasolt megoldás: extraction coverage, asset count, embedded-question count, OCR fallback count.
   - Kockázat: alacsony-közepes.
   - Most implementálható? Igen.

### P2
7. **OCR fallback / noisy PDF kezelése**
   - Cél: image-only vagy rosszul kinyerhető PDF-eknél ne vesszen el teljesen a tartalom.
   - Érintett fájlok: `scripts/pdf-text.js`, új OCR helper.
   - Miért kell: a gyakorlati source minőség nagyon szór.
   - Javasolt megoldás: fallback OCR csak szükség esetén.
   - Kockázat: közepes.
   - Most implementálható? Külön batch után.

8. **PPT/PPTX slide note és visual extraction bővítés**
   - Cél: slide deckekből szöveg + képek + speaker notes is jöjjön.
   - Érintett fájlok: új extractor helper, `scripts/generate-notes.js`, `scripts/content-plan.js`.
   - Miért kell: ez a fő hiány a mostani pipeline-ban.
   - Javasolt megoldás: slide-by-slide XML/unzip alapú parse, notes + assets + cue detektálás.
   - Kockázat: magas.
   - Most implementálható? Külön, dedikált batch-ben.

## Javasolt celstruktura

```text
storage/subjects/<slug>/sources/
  lesson_sources/
  test_sources/
  assets/
    images/
    diagrams/
    manifests/

content/<slug>/
  notes/
  questions.json
  flashcards.json
  glossary.json
  extraction-manifest.json

scripts/
  extract-source.js
  document-chunker.js
  generate-notes.js
  generate-questions.js
  generate-extras.js
  content-plan.js
```

## Milt kell routingolni

- `lesson_sources`:
  - notes-generálás
  - chunk-based visual capture
  - lesson-level active recall

- `test_sources`:
  - questions.json generálás
  - embedded self-check / quiz question detektálás
  - written question routing

- `assets`:
  - image/figure/diagram mentés
  - manifest és source-link tárolás

## Azonnali kovetkezo iteracio

### Batch 1
**Cél:** unified extraction adapter + embedded-question routing + chunk manifest.

Kimenet:
- egységes text/metadata extraction
- test/lesson routing hint
- deterministic manifest a downstream generátoroknak

Safe now?
- Igen, ha nem egyszerre kerül bele PPTX vizuál és OCR.

### Batch 2
**Cél:** asset persistence `sources/assets` alá.

Kimenet:
- figure/image export
- hashelt fájlnevek
- manifest referencia a chunkokhoz

Safe now?
- Igen, de külön batch-ben.

### Batch 3
**Cél:** PPT/PPTX teljes fedés és OCR fallback.

Kimenet:
- slide text + notes + asset parse
- image-only PDF fallback

Safe now?
- Külön batch kell.

## Review es test kapuk

- extraction smoke 1-2 PDF, 1 DOCX, 1 PPTX mintával
- embedded question detection mintak
- asset manifest completeness check
- questions.json / notes artifact regression
- backend smoke update a content-plan score mezőkre

## Owner mapping

- **Backend improver:** extraction adapter, asset manifest, PPT/PPTX parse.
- **Reviewer:** smoke, quality gate, route/split ellenőrzés.
- **Main planner:** batch priorizálás, docs sync, scope control.

## Fő kockázatok

- A PPT/PPTX támogatás könnyen szétcsúszik, ha a szöveg és az asset parse külön életet él.
- A routing heuristics túl agresszívek lehetnek, és test source-okat lesson source-ként kezelhetnek.
- Az asset mentésnél az elérési utak és a generált manifest konzisztenciája kritikus.

## Rövid konklúzió

Az első teendő nem a prompt tuning, hanem egy közös extraction réteg és routing hint rendszer bevezetése. Utána jöhet az assets mentés, és csak a végén a teljes PPT/PPTX + OCR fallback hardening.
