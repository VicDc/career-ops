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

Il CV Europass (barra laterale, paracol, foto) vive fuori dal progetto ed è
aggiornato a mano: non è nel fork, per scelta (`modes/_custom.md`).

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

1. **Template del fork incompatibile con `build-cv-latex.mjs` di upstream.**
   Il template ha `{{SUMMARY}}` e `{{CERTIFICATIONS}}`, che `build-cv-latex`
   non conosce, e manca di `{{AWARDS}}`. Il percorso `latex` di upstream
   (JSON → `build-cv-latex`) nel fork non funziona; 24 test falliscono per
   questo.
2. **Summary preso dal report più recente.** Senza `--report=`,
   `generate-latex.mjs` usa il summary dell'ultimo report modificato,
   qualunque sia l'offerta. Il 2026-09-23 ha messo un summary in italiano
   di un altro report in un CV inglese.
3. **Soglia `\Needspace*` troppo alta** (vedi `0af00b4`).
4. **Sostituzioni con `String.replace` a stringa** in `generate-latex.mjs`:
   un `$&` o `$'` nel testo di `cv.md` verrebbe interpretato. Upstream l'ha
   corretto nel suo builder con una funzione di sostituzione (#2588).
