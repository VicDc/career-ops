# Modifiche del fork VicDc/career-ops

Storico delle modifiche fatte in questo fork rispetto a upstream
(`career-ops-hq/career-ops`). Serve a due cose: non perdere il lavoro a ogni
aggiornamento, e decidere cosa proporre all'autore.

**Regola:** ogni commit del fork che tocca codice, template o mode aggiunge
qui una riga, nello stesso commit.

Stato upstream:
- **proponibile**: utile a tutti, candidato a issue/PR upstream
- **solo fork**: legato alle mie preferenze o al mio setup
- **superato**: upstream ha risolto lo stesso problema, la mia versione è stata allineata o ritirata
- **da decidere**: aperto

## Allineamenti con upstream

| Data | Commit | Versione | Note |
|------|--------|----------|------|
| 2026-09-03 | `ece5df7` | 1.31.0 | Merge. Nel conflitto su `generate-latex.mjs` è stata tenuta la versione del fork: persi `--compile-only`, validazione multilingua e guard CJK di upstream (recuperati in `d6d712b`). |
| 2026-09-23 | `5148a42` | 1.33.0 | Merge. Conflitti su `merge-tracker.mjs` (tenuti gli snapshot del fork + `DATA_ROOT` di upstream) e `package.json` (presa la versione upstream di `serve:dashboard`). Backup completo pre-merge: `C:\GitHub\career-ops_backup_2026-09-23_pre-1.33`. |

## CV LaTeX

| Data | Commit | Modifica | Perché | Stato upstream |
|------|--------|----------|--------|----------------|
| 2026-07-07 | `a4e4cd9` | Template riscritto (Figtree, colore accento, icone, sezioni Summary e Certifications). `generate-latex.mjs` riempie i placeholder da `cv.md` e `config/profile.yml`, sceglie Experience/Projects dalla sezione "Relevance Selection" del report, compila da una copia di lavoro senza modificare il template. | Il template stock era generico; ogni CV richiedeva riempimento a mano. | **da decidere**: upstream ha scelto un design diverso (l'agente produce un JSON, `build-cv-latex.mjs` lo rende). Le due strade oggi non sono compatibili, vedi "Problemi aperti". |
| 2026-08-09 | `58a792e` | `\needspace` su `\resumeSubheading`. | Bullet orfani a inizio pagina. | **proponibile** |
| 2026-09-02 | `0af00b4` | `\Needspace*` sui titoli di sezione. | Titolo di sezione isolato a fondo pagina. | **proponibile**, ma la soglia di 11 righe è troppo alta: sposta anche sezioni corte (Certifications finisce da sola a pagina 3). |
| 2026-09-09 | `bde60e5` | Nome file di output legato al report, nome generico nel PDF. | Più CV per la stessa azienda si sovrascrivevano. | **proponibile** |
| 2026-09-23 | `d42495c` | Titoli di sezione in italiano accettati dal validatore; cartella di output per report. | CV in italiano rifiutati. | **superato** per i titoli (upstream conta le sezioni, qualsiasi lingua); cartella per report **proponibile**. |
| 2026-09-23 | `d6d712b` | `--compile-only` rispettato; sezioni contate come upstream; guard CJK; `main()` solo come entry point; file utente letti dalla data root. | `latex-tex` rifiutava i `.tex` scritti a mano; importare il modulo interrompeva `test-all.mjs` alla sezione 20a. | **superato**: allinea il fork a upstream. |
| 2026-09-23 | `246c8db` | Template del fork spostato in `templates-fork/cv-template.tex`; `templates/cv-template.tex` torna quello di upstream. Mode `latex`/`latex-tex` aggiornati. Output verificato identico (stesso `.tex` di lavoro, byte per byte). | Il template del fork rompeva `build-cv-latex.mjs` e i test dei template di upstream. Fuori da `templates/` nessun test di upstream lo intercetta, e `--template=<nome>` non lo sceglie per sbaglio. | **solo fork** |
| 2026-09-23 | `e64490b` | CV più corto: massimo 3 progetti (ordine del report), per progetto descrizione + 2 bullet, per esperienza 3 bullet, presi nell'ordine di `cv.md`. Esclusioni del report confrontate su azienda **e** ruolo. Summary e selezione solo da `--report=` o da `cv.md`, mai dal report più recente; `--report=` inesistente dà errore. Placeholder sostituiti con funzione (niente interpretazione di `$&`/`$'`). | CV di 3 pagine; un'esperienza esclusa dal report compariva comunque (il report la nominava per ruolo); summary in italiano di un'altra offerta in un CV inglese. | Limiti e selezione **solo fork**; summary/`$` **proponibili** come fix generici. |
| 2026-09-23 | `52d5152` | Il report sceglie i bullet: riga opzionale `bullets: A | B` sotto ogni voce della Relevance Selection, selettori = inizio del bullet in `cv.md` (per i progetti la chiave in grassetto), ordine = ordine di stampa. Selettore sconosciuto o troppi bullet: errore, il CV non viene generato. Formato documentato in `modes/oferta.md`; test in `tests/latex-bullet-selection.test.mjs`. | Con i limiti fissi restavano i primi bullet di `cv.md`, non quelli che rispondono all'offerta (in un report di prova cadeva proprio il bullet più rilevante per l'offerta). | **solo fork** (dipende dal generatore del fork) |
| 2026-09-23 | `6378453` | CV in due lingue: `--lang=it` stampa il testo di `cv.it.md` (specchio italiano di `cv.md`, gitignored), titoli di sezione e `babel` in italiano, paese nel contatto tradotto. Voci e bullet si scelgono sempre su `cv.md`, il testo si prende alla stessa posizione; conteggi diversi fra i due file = errore. Summary dal report per lingua: `## Tailored CV Summary (en)` / `(it)`; un summary senza etichetta si usa solo se è nella lingua del CV (stima a parole frequenti), altrimenti quello del file CV. `modes/oferta.md`, `modes/latex.md` aggiornati; test in `tests/latex-bullet-selection.test.mjs`. | Un report con annuncio in italiano produceva summary italiano e bullet inglesi nello stesso CV. | **solo fork** |
| 2026-09-23 | _questo commit_ | Standard Europass anonimo in `templates-fork/europass/cv_europass2020_en.tex`: layout del master personale (barra laterale, paracol, icone Material, foto), solo segnaposto. Esempi e fixture con contenuti reali del CV (test, `modes/oferta.md`, questo file) sostituiti con dati fittizi. Artefatti LaTeX in `templates-fork/` ignorati; regola `europass/` ancorata alla radice (`/europass/`). | Il fork è pubblico: niente dati personali nei file versionati. | **proponibile** il layout Europass (senza dati); **solo fork** il resto |

Il CV Europass (barra laterale, paracol, foto) è un formato standard dal
2026-09-23: il master sta in `europass/`, **gitignored** (foto, data di
nascita, nazionalità). Nel fork c'è solo la regola `.gitignore`
(commit `ad9dab8`); il file non verrà mai pubblicato. Regole d'uso in
`modes/_custom.md`.

## Tracker

| Data | Commit | Modifica | Perché | Stato upstream |
|------|--------|----------|--------|----------------|
| 2026-09-23 | `7a31081` | `merge-tracker.mjs` copia il tracker in `data/backups/` prima di ogni scrittura, rotazione 20, con test. | Il tracker non ha storia git (`data/*` è ignorato): un merge sbagliato non era recuperabile. | **proponibile** |

## Liveness e scansione

| Data | Commit | Modifica | Perché | Stato upstream |
|------|--------|----------|--------|----------------|
| 2026-09-02 | `6e6c7bb` | Chromium con uBlock Origin Lite tramite persistent context (`browser-extensions.mjs`, `ublock.mjs`). | Banner cookie e tracker falsavano il controllo di liveness. | **proponibile** |
| 2026-09-02 | `7628f6f` | Scanner e archiviazione passano dallo stesso `launchBrowser`. | Un solo punto di avvio del browser. | **proponibile**, insieme a `6e6c7bb` |
| 2026-09-02 | `a4a89df` | Script npm `ublock:check` / `ublock:install`. | Installazione dell'estensione. | **proponibile**, insieme a `6e6c7bb` |
| 2026-09-05 | `a409a3e` | Accetta il nuovo nome degli asset uBOLite (senza `.mv3`). | Il download si era rotto. | **proponibile**, insieme a `6e6c7bb` |
| 2026-09-23 | — | `browser-extensions.mjs` e `ublock.mjs` dichiarati in `config/local-paths.txt`. | Il test di copertura li segnalava come orfani. | **solo fork** |

## Dati e privacy

| Data | Commit | Modifica | Stato upstream |
|------|--------|----------|----------------|
| 2026-08-08 | `2c7af94` | Audit di contesto in `data/` (poi rimasto nella history pubblica). | **solo fork** |
| 2026-08-09 | `5e429e1` | `data/cv-proposed-changes.md` (poi rimasto nella history pubblica). | **solo fork** |
| 2026-08-09 | `a462985` | `modes/_custom.md` e `voice-dna.md` tolti da git. | **solo fork** |
| 2026-09-02 | `b59c8e8` | `data/cv-proposed-changes.md` tolto da git. | **solo fork** |

## Problemi aperti

1. ~~**Template del fork incompatibile con `build-cv-latex.mjs` di upstream.**~~
   Risolto il 2026-09-23 spostando il template in `templates-fork/`.
2. ~~**Summary preso dal report più recente.**~~ Risolto il 2026-09-23 (`e64490b`).
3. **Soglia `\Needspace*` troppo alta** (vedi `0af00b4`).
4. ~~**Sostituzioni con `String.replace` a stringa.**~~ Risolto il 2026-09-23 (`e64490b`). Lo stesso errore ha corrotto questo file durante l'aggiornamento: prova che il rischio è reale.
