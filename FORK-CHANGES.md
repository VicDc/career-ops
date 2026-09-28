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
| 2026-09-03 | `fec3e46` | 1.31.0 | Merge. Nel conflitto su `generate-latex.mjs` è stata tenuta la versione del fork: persi `--compile-only`, validazione multilingua e guard CJK di upstream (recuperati in `63335bf`). |
| 2026-09-23 | `5a0071a` | 1.33.0 | Merge. Conflitti su `merge-tracker.mjs` (tenuti gli snapshot del fork + `DATA_ROOT` di upstream) e `package.json` (presa la versione upstream di `serve:dashboard`). Backup completo pre-merge: `C:\GitHub\career-ops_backup_2026-09-23_pre-1.33`. |
| 2026-09-26 | `9b9e2d1` | 1.34.0 | Merge del tag `career-ops-v1.34.0` (non `update-system apply`, che avrebbe lasciato 12 file del fork alla versione vecchia). Unico conflitto su `.gitignore`: tenuta la versione del fork, più `*.tmp*` (file temporanei con copie di cv.md/profile.yml) e `node_modules` senza slash (richiesto da un test upstream). `merge-tracker.mjs`, `modes/oferta.md`, `scan.mjs`, `scan-ats-full.mjs` uniti senza conflitti, modifiche del fork conservate. Backup: tag `backup-pre-1.34-2026-09-25` e copia `C:\GitHub\career-ops_backup_2026-09-25_pre-1.34`. |
| 2026-09-28 | `045bfca` | 1.34.0 + main | Merge di `upstream/main` al `2d0285a` (117 commit dopo la release 1.34.0, non ancora in una release) sul branch `chore/upstream-main-2026-09-28`. Conflitti: `.gitignore` (tenuti entrambi, più `data/agent-inbox.md`); `merge-tracker.mjs` (import uniti, `--backfill-urls` passa da `writeTracker()` così lo snapshot resta, messaggio upstream sulla colonna URL); `modes/latex.md` (nota upstream su `candidate.title` spostata dopo la tabella dei placeholder, il fork non ha la sezione "Field reference"); `generate-latex.mjs` (tenuto il `main()` del fork, aggiunto `validateFlags` di upstream #4446 con `--report`/`--lang`/`--project-bullets` come flag con valore; scartato `compileLatexFile()` di upstream, che il fork ha già inglobato in `main()`). `test-all`: 10255 ok, 1 fallito (`web-ts-alias-loader`, fallisce uguale su `upstream/main` pulito con Node 22.16 su Windows). Backup: `C:\GitHub\career-ops-backup-2026-09-28`. |

## CV LaTeX

| Data | Commit | Modifica | Perché | Stato upstream |
|------|--------|----------|--------|----------------|
| 2026-07-07 | `77430d8` | Template riscritto (Figtree, colore accento, icone, sezioni Summary e Certifications). `generate-latex.mjs` riempie i placeholder da `cv.md` e `config/profile.yml`, sceglie Experience/Projects dalla sezione "Relevance Selection" del report, compila da una copia di lavoro senza modificare il template. | Il template stock era generico; ogni CV richiedeva riempimento a mano. | **da decidere**: upstream ha scelto un design diverso (l'agente produce un JSON, `build-cv-latex.mjs` lo rende). Le due strade oggi non sono compatibili, vedi "Problemi aperti". |
| 2026-08-09 | `60532d7` | `\needspace` su `\resumeSubheading`. | Bullet orfani a inizio pagina. | **proponibile** |
| 2026-09-02 | `0228fb5` | `\Needspace*` sui titoli di sezione. | Titolo di sezione isolato a fondo pagina. | **proponibile**, ma la soglia di 11 righe è troppo alta: sposta anche sezioni corte (Certifications finisce da sola a pagina 3). |
| 2026-09-09 | `a4c02cf` | Nome file di output legato al report, nome generico nel PDF. | Più CV per la stessa azienda si sovrascrivevano. | **proponibile** |
| 2026-09-23 | `ea9322f` | Titoli di sezione in italiano accettati dal validatore; cartella di output per report. | CV in italiano rifiutati. | **superato** per i titoli (upstream conta le sezioni, qualsiasi lingua); cartella per report **proponibile**. |
| 2026-09-23 | `63335bf` | `--compile-only` rispettato; sezioni contate come upstream; guard CJK; `main()` solo come entry point; file utente letti dalla data root. | `latex-tex` rifiutava i `.tex` scritti a mano; importare il modulo interrompeva `test-all.mjs` alla sezione 20a. | **superato**: allinea il fork a upstream. |
| 2026-09-23 | `ac3ce53` | Template del fork spostato in `templates-fork/cv-template.tex`; `templates/cv-template.tex` torna quello di upstream. Mode `latex`/`latex-tex` aggiornati. Output verificato identico (stesso `.tex` di lavoro, byte per byte). | Il template del fork rompeva `build-cv-latex.mjs` e i test dei template di upstream. Fuori da `templates/` nessun test di upstream lo intercetta, e `--template=<nome>` non lo sceglie per sbaglio. | **solo fork** |
| 2026-09-23 | `b206251` | CV più corto: massimo 3 progetti (ordine del report), per progetto descrizione + 2 bullet, per esperienza 3 bullet, presi nell'ordine di `cv.md`. Esclusioni del report confrontate su azienda **e** ruolo. Summary e selezione solo da `--report=` o da `cv.md`, mai dal report più recente; `--report=` inesistente dà errore. Placeholder sostituiti con funzione (niente interpretazione di `$&`/`$'`). | CV di 3 pagine; un'esperienza esclusa dal report compariva comunque (il report la nominava per ruolo); summary in italiano di un'altra offerta in un CV inglese. | Limiti e selezione **solo fork**; summary/`$` **proponibili** come fix generici. |
| 2026-09-23 | `d21f68c` | Il report sceglie i bullet: riga opzionale `bullets: A | B` sotto ogni voce della Relevance Selection, selettori = inizio del bullet in `cv.md` (per i progetti la chiave in grassetto), ordine = ordine di stampa. Selettore sconosciuto o troppi bullet: errore, il CV non viene generato. Formato documentato in `modes/oferta.md`; test in `tests/latex-bullet-selection.test.mjs`. | Con i limiti fissi restavano i primi bullet di `cv.md`, non quelli che rispondono all'offerta (in un report di prova cadeva proprio il bullet più rilevante per l'offerta). | **solo fork** (dipende dal generatore del fork) |
| 2026-09-23 | `e517c44` | CV in due lingue: `--lang=it` stampa il testo di `cv.it.md` (specchio italiano di `cv.md`, gitignored), titoli di sezione e `babel` in italiano, paese nel contatto tradotto. Voci e bullet si scelgono sempre su `cv.md`, il testo si prende alla stessa posizione; conteggi diversi fra i due file = errore. Summary dal report per lingua: `## Tailored CV Summary (en)` / `(it)`; un summary senza etichetta si usa solo se è nella lingua del CV (stima a parole frequenti), altrimenti quello del file CV. `modes/oferta.md`, `modes/latex.md` aggiornati; test in `tests/latex-bullet-selection.test.mjs`. | Un report con annuncio in italiano produceva summary italiano e bullet inglesi nello stesso CV. | **solo fork** |
| 2026-09-23 | `ad2888f` | Standard Europass anonimo in `templates-fork/europass/cv_europass2020_en.tex`: layout del master personale (barra laterale, paracol, icone Material, foto), solo segnaposto. Esempi e fixture con contenuti reali del CV (test, `modes/oferta.md`, questo file) sostituiti con dati fittizi. Artefatti LaTeX in `templates-fork/` ignorati; regola `europass/` ancorata alla radice (`/europass/`). | Il fork è pubblico: niente dati personali nei file versionati. | **proponibile** il layout Europass (senza dati); **solo fork** il resto |
| 2026-09-27 | `9cb8234` | `generate-latex.mjs --project-bullets=N` (1-5): alza il limite di bullet per progetto per un solo CV; senza l'opzione resta 2. Valore fuori intervallo: errore. `modes/latex.md` aggiornato. | Serviva una variante con 3 bullet per progetto senza cambiare il default, scelto per tenere il CV corto (`b206251`). | **solo fork** (dipende dal generatore del fork) |

Il CV Europass (barra laterale, paracol, foto) è un formato standard dal
2026-09-23: il master sta in `europass/`, **gitignored** (foto, data di
nascita, nazionalità). Nel fork c'è solo la regola `.gitignore`
(commit `0700d86`); il file non verrà mai pubblicato. Regole d'uso in
`modes/_custom.md`.

## Tracker

| Data | Commit | Modifica | Perché | Stato upstream |
|------|--------|----------|--------|----------------|
| 2026-09-23 | `0a3adeb` | `merge-tracker.mjs` copia il tracker in `data/backups/` prima di ogni scrittura, rotazione 20, con test. | Il tracker non ha storia git (`data/*` è ignorato): un merge sbagliato non era recuperabile. | **proponibile** |
| 2026-09-28 | — | Test: `--backfill-urls` fa lo snapshot prima di aggiungere la colonna URL. Verificato che fallisce se il backfill torna a scrivere con `writeFileAtomic()` diretto, come in upstream. | Il merge del 28/09 ha portato il backfill dentro `writeTracker()`; senza test un merge futuro può riportarlo fuori senza che nessuno se ne accorga. | **proponibile**, insieme a `0a3adeb` |

## Liveness e scansione

| Data | Commit | Modifica | Perché | Stato upstream |
|------|--------|----------|--------|----------------|
| 2026-09-02 | `2419d2e` | Chromium con uBlock Origin Lite tramite persistent context (`browser-extensions.mjs`, `ublock.mjs`). | Banner cookie e tracker falsavano il controllo di liveness. | **proponibile** |
| 2026-09-02 | `bed2f09` | Scanner e archiviazione passano dallo stesso `launchBrowser`. | Un solo punto di avvio del browser. | **proponibile**, insieme a `2419d2e` |
| 2026-09-02 | `07f5ba4` | Script npm `ublock:check` / `ublock:install`. | Installazione dell'estensione. | **proponibile**, insieme a `2419d2e` |
| 2026-09-05 | `590acbe` | Accetta il nuovo nome degli asset uBOLite (senza `.mv3`). | Il download si era rotto. | **proponibile**, insieme a `2419d2e` |
| 2026-09-23 | — | `browser-extensions.mjs` e `ublock.mjs` dichiarati in `config/local-paths.txt`. | Il test di copertura li segnalava come orfani. | **solo fork** |

## Dati e privacy

| Data | Commit | Modifica | Stato upstream |
|------|--------|----------|----------------|
| 2026-09-23 | `63335bf`..`54e6a2d` | Cronologia locale dei commit del 23/09 riscritta prima di qualunque push: fixture, esempi e un messaggio di commit contenevano righe reali del CV. Backup completo in un bundle fuori dal repo. | **solo fork** |
| 2026-08-08 | — | Audit di contesto in `data/` (commit `2c7af94`, rimasto nella history pubblica fino al 2026-09-26, poi rimosso). | **solo fork** |
| 2026-08-09 | — | `data/cv-proposed-changes.md` (commit `5e429e1`, rimasto nella history pubblica fino al 2026-09-26, poi rimosso). | **solo fork** |
| 2026-08-09 | `cdeb23d` | `modes/_custom.md` e `voice-dna.md` tolti da git. | **solo fork** |
| 2026-09-02 | `cb11998` | `data/cv-proposed-changes.md` tolto da git. | **solo fork** |
| 2026-09-26 | — | Storia riscritta con `git filter-repo --refs` sui soli 37 commit del fork (upstream escluso con `^refs/remotes/upstream/main`, `^de7f7fe`, `^refs/remotes/origin/main`, così i commit firmati di upstream mantengono hash e firma): tolti `data/cv-proposed-changes.md` e `data/phase4-context-audit-2026-08-07.md`, in un esempio di `modes/oferta.md` il nome di un datore di lavoro reale sostituito con "Acme Srl". Tutti gli hash del fork in questo file aggiornati. Branch `career-ops-gemma` cancellato da GitHub e dal Pi. Storia completa di prima conservata nel repo privato Gitea `career-ops-archive` e nei bundle in `C:\GitHub\career-ops_backup_2026-09-26_pre-filter-repo`. | **solo fork** |

## Problemi aperti

1. ~~**Template del fork incompatibile con `build-cv-latex.mjs` di upstream.**~~
   Risolto il 2026-09-23 spostando il template in `templates-fork/`.
2. ~~**Summary preso dal report più recente.**~~ Risolto il 2026-09-23 (`b206251`).
3. ~~**Soglia `\Needspace*` troppo alta.**~~ Verificato il 2026-09-23 su 8 CV
   (5 report, EN e IT): soglie 11, 8 e 6 danno lo stesso risultato, 2 pagine e
   nessun titolo orfano. La pagina 3 dipendeva dalla lunghezza del CV, risolta
   con i limiti sui bullet. Nessuna modifica.
4. ~~**Sostituzioni con `String.replace` a stringa.**~~ Risolto il 2026-09-23 (`b206251`). Lo stesso errore ha corrotto questo file durante l'aggiornamento: prova che il rischio è reale.
