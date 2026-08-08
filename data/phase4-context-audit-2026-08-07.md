# PHASE 4 — Context budget & Tier D audit

**Data:** 2026-08-07
**Oggetto:** `config/profile.yml`
**Esito:** compressione **NON applicata**. Il file resta integro.
**Perché questo log esiste:** la fase è stata aperta su una premessa poi rivelatasi falsa. Serve traccia del perché è stata chiusa senza modifiche, così non viene riaperta fra sei mesi con lo stesso ragionamento.

---

## 1. La premessa iniziale

L'assunto di partenza era: *`profile.yml` pesa ~11-13k token contro un limite di 8192 di Gemma 4 26B, quindi `scoring_hints` — che sta in fondo — è la prima sezione a essere troncata.*

Da qui l'idea di comprimere `tier_d_usa_conditional` (165 righe, ~2.100 token) per liberare spazio.

## 2. Perché è falsa

**8192 non è la finestra di context. È il tetto di output di Gemma 3 27B.**

Numeri dal model card ufficiale Gemma 4:

| Variante | Context |
|---|---|
| E2B / E4B | 128K token |
| 12B Unified | 256K token |
| **26B A4B (MoE)** | **256K token** |
| 31B Dense | 256K token |

`profile.yml` a ~11k token entra con un margine di **circa 23x**. Non è mai stato troncato nulla.

**Il limite pratico è LM Studio, non il modello.** LM Studio carica con un context ridotto di default e lo alzi manualmente; il tetto reale è la RAM per la KV cache — oltre i 128K servono 10-20 GB solo di cache, sopra ai pesi. Gli ~80k token impostati in locale sono una scelta di configurazione, non un vincolo del modello. Anche a 80k il margine resta ~7x.

**Conseguenza operativa:** nessuna compressione necessaria. `tier_d_usa_conditional` resta integrale. Se un giorno il file arrivasse a decine di migliaia di token la questione si riapre, ma il trigger è la RAM disponibile in LM Studio, non un limite del modello.

Fonti:
- https://ai.google.dev/gemma/docs/core/model_card_4
- https://lmstudio.ai/models/google/gemma-3-27b
- https://localllm.in/blog/lm-studio-increase-context-length

---

## 3. Il problema vero emerso durante la verifica

Il sospetto — "Tier D non mi sembra implementato" — è corretto, e vale per più sezioni.

Grep su `modes/`, `batch/`, `*.mjs` (esclusi `reports/`, `data/`, e il file stesso), contando quanti file citano ciascuna sezione:

| Sezione di profile.yml | File che la leggono |
|---|---|
| `tier_d_usa_conditional` | **0** |
| `employer_targeting` | **0** |
| `scoring_hints` | **0** |
| `tier_based_ranges` | **0** |
| `ethics` | **0** |
| `archetypes` | 15 |
| `narrative` | 17 |
| `identity` | 8 |
| `proof_points` | 6 |
| `constraints` | 2 |

Le cinque sezioni a zero non sono rotte: agiscono solo perché l'agente legge il file intero e le interpreta come contesto. Ma nessuno script deterministico le consulta, quindi il loro effetto dipende da quanto il modello decide di tenerne conto in quella specifica passata. Su un modello locale piccolo è un effetto debole e non verificabile.

Nota storica: `tier_d_usa_conditional` è ~2.100 token che descrivono uno scenario **condizionale e non attivo** (`activation_trigger: IF Anthropic Milan, London, Zurich all reject/stall by 2026-10-01`). È il blocco più pesante del file e anche quello con la resa più bassa oggi.

---

## 4. Schema divergente dalla repo ufficiale

Verifica su `config/profile.example.yml` (system layer, versione upstream).

**Upstream, 7 chiavi top-level:** `candidate`, `target_roles`, `narrative`, `compensation`, `location`, `cv`, `cover_letter`

**Locale, 10 chiavi top-level:** `identity`, `cv`, `narrative`, `archetypes`, `constraints`, `employer_targeting`, `tier_d_usa_conditional`, `ethics`, `proof_points`, `scoring_hints`

Non è una personalizzazione dentro lo schema: è uno schema diverso. Ma la conseguenza è molto più contenuta di quanto scriveva la prima versione di questa sezione (vedi la nota di correzione sotto).

| Chiave attesa | Chiesta da | Stato locale |
|---|---|---|
| `narrative.exit_story` | **solo le traduzioni**: `modes/{da,de,fr,pl,pt}/_shared.md:68`, `modes/ja/_shared.md:86`. **Zero occorrenze in `modes/_shared.md` (EN).** | assente, e non richiesta dal percorso in uso |
| `narrative.proof_points` | **solo le traduzioni** (`:94` / `:112`). Il percorso EN non la cita. | esiste come `proof_points` top-level, letto da 6 file (sez. 3) |
| `narrative.dashboard` | **solo le traduzioni** (`:94` / `:112`). Il percorso EN non la cita. | assente, opzionale |
| `candidate.photo` | `modes/pdf.md:82,110` | il ramo è `identity`, non `candidate`. Opt-in: assente = riga `{{PHOTO}}` rimossa, layout identico, nessun errore |
| `cv.canva_resume_design_id` | `modes/_shared.md:134` | assente (opzionale, Canva non in uso). **Unica chiave del gruppo davvero chiesta dal percorso EN.** |

**Dove sta davvero il ruolo delle tre chiavi `narrative.*`.** Nel percorso inglese lo copre il layer utente:

- `modes/_shared.md:93` instrada framing e proof points per archetipo verso `modes/_profile.md`, non verso una chiave YAML annidata.
- `modes/_profile.md` ha `## Your Exit Narrative` (riga 46) e `## Your Portfolio / Demo` (righe 78-85), entrambi con rimando generico a `profile.yml` senza pretendere un nome-chiave preciso.
- `modes/_custom.md` esiste (2.405 byte) ma non menziona nessuna delle tre: le house rules stanno lì, la copertura di queste chiavi sta in `_profile.md`.

### Nota di correzione (2026-08-08)

La prima stesura di questa sezione affermava che `narrative.exit_story`, `narrative.proof_points` e `narrative.dashboard` sono richieste da `modes/_shared.md`, e concludeva che *"ogni blocco di report che dipende da `exit_story` o `dashboard` viene improvvisato o saltato in silenzio"*. **È falso, e la conclusione va con esso.**

L'errore è di aggregazione del grep: il pattern girava su tutto `modes/` ricorsivamente, quindi i match delle sottocartelle di traduzione (`da/`, `de/`, `fr/`, `ja/`, `pl/`, `pt/`) sono stati letti come match del file inglese, e i numeri di riga delle traduzioni (`:68`, `:94`) attribuiti a `modes/_shared.md`. Le traduzioni condividono l'impianto upstream, che quello schema lo prevede; il `_shared.md` inglese — l'unico caricato in questa configurazione — no.

Ricontrollato: `modes/_shared.md` non contiene le stringhe `exit_story`, `proof_points`, `dashboard`. Nessun blocco di report inglese dipende da quelle chiavi. La divergenza di schema resta reale, ma è latente, non attiva: si manifesterebbe solo passando a un `modes/{lang}/` di traduzione.

---

## 5. Decisioni prese

- **Compressione di `tier_d_usa_conditional`: annullata.** Premessa falsa, nessun beneficio.
- **Riscrittura dello schema: rimandata.** Lavoro a sé, non aperto in questa sessione.
- Restano due residui `capstone` fuori dallo scope di PHASE 1, oggi non veri (il progetto capstone su LIS non esiste più):
  - riga ~375, `constraints.location` UK: `"Activate Q4 2026 post-MSc Capstone"`
  - riga ~704, `activation_timeline.phase_2`: `"Post-MSc Capstone consolidation (September-October completion)"`
  Sono trigger temporali interni, non claim candidate-facing. Vanno riscritti su una data secca o sul completamento MSc.

## 6. Aperto per una sessione futura

1. Allineare le chiavi locali a quelle che i modes cercano, **oppure** decidere che la divergenza è voluta e documentarla in `modes/_custom.md`.
2. Decidere il destino delle 5 sezioni senza consumatori: tenerle come contesto per l'agente, oppure spostarle in un file `data/*.md` di riferimento e lasciare in `profile.yml` solo ciò che qualcuno legge davvero.
3. Ripulire i 2 residui `capstone`.
4. `employer_targeting.tier_a_urgent.action_plan` contiene una timeline giugno-settembre 2026 ormai scaduta (~250 token di istruzioni obsolete che il modello legge come attuali).
