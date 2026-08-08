# cv.md — proposed changes (partially applied)

**Status:** **parzialmente applicato.** L'header diceva "proposal only, nothing has been applied" ed era falso: §1 era già nel file, §3.4 lo era in gran parte. Stato ricontrollato il 2026-08-08 leggendo `cv.md` v3.6 riga per riga, non fidandosi di questo tracker.
**Opened:** 2026-08-04
**Last verified:** 2026-08-08 contro `cv.md` v3.6
**Trigger:** rewritten README for Business Plan AI (`C:\GitHub\BusinessPlan_Agent\README.md`), plus a uniformity question on project bullet counts.

## Stato per sezione

| § | Contenuto | Stato | Verificato su |
|---|---|---|---|
| 0 | Repo link `BusinessPlan_AlanAgent` | **SUPERATO** | `cv.md` linka `business-plan-ai`, repo rinominata dopo la stesura di questa pagina |
| 1 | Consistency checks 5 → 6 | **APPLICATO** | `cv.md`, bullet Architecture: "6 LLM-based consistency checks" |
| 2 | Portare i top four a 3 bullet | **APPLICATO** | Business Plan AI 3, Sherpa 3, Malaria 3, LisAI 3. Mental D0C e Drug Repositioning restano prosa, come raccomandato |
| 3.1 | Terzo bullet Sherpa | **APPLICATO** 2026-08-08 | `cv.md`, bullet "Deployment hygiene". Omesso "on the request path": non coperto da `article-digest.md` |
| 3.2 | Terzo bullet Malaria | **APPLICATO** 2026-08-08 | `cv.md`, bullet "Design decisions" |
| 3.3 | LisAI, nessuna modifica | **N/A** | già a 3 bullet |
| 3.4 | Blocco Business Plan AI completo | **PARZIALE** | dettaglio sotto |
| 4 | Blocco Business Plan AI in `article-digest.md` | **PENDING** | zero occorrenze di "Business Plan" in `article-digest.md` |
| 5 | Frase nelle due lettere Capgemini | **PENDING** | `output/cover-capgemini-{en,it}-2026-08-04.tex` esistono, datati 2026-08-04, non contengono la frase |

**§3.4 in dettaglio — cosa è entrato e cosa manca.** Dentro `cv.md`: i 6 consistency check, IntakeAgent, ReportWriter, il bullet separato sulla verifica deterministica (margine, break-even, capitale, copertura, revenue-vs-market a tolleranza 5%, export XLSX), lo chart spec con rendering Plotly deterministico, l'inferenza solo locale, il report parziale con banner invece di un piano inventato. Fuori: i sei check non sono nominati uno per uno; FastAPI / Docker Compose / pytest non sono nella riga di descrizione; manca "marks a check unverifiable on missing data instead of raising"; manca il logging JSONL di ogni chiamata LLM. Nessuno dei quattro è un errore, sono omissioni di dettaglio — decidi se valgono lo spazio.

**Where this file lives and why:** `data/` is user layer per `DATA_CONTRACT.md`, so `node update-system.mjs apply` never touches it. `modes/_shared.md` forbids the agent from editing `cv.md` directly, so proposals land here and you apply what you approve.

**Source-of-truth note:** the Business Plan AI facts below come from a README outside the career-ops project, which `CLAUDE.md` puts out of scope for candidate-facing content. They become usable once you confirm them here or in `article-digest.md`. Every other proposed bullet is sourced from `article-digest.md`, which is already in scope.

---

## 0. Confirmed — SUPERATO

- Public repo for Business Plan AI is `https://github.com/VicDc/BusinessPlan_AlanAgent`. The local folder name `BusinessPlan_Agent` differs. **No link change needed in `cv.md`.**

---

## 1. Factual correction (do this regardless of the rest) — APPLICATO

`cv.md` currently says the Orchestrator enforces **5** explicit consistency checks. The README lists **6**. The missing one is *fidelity to the user's declared figures* (agents silently changing numbers the user gave).

Wrong number in a CV is the kind of detail a technical interviewer checks against the repo. Fix it even if you reject every other change on this page.

---

## 2. The bullet-count question — APPLICATO

Current state of `## Projects` in `cv.md` is not uniform:

| Project | Bullet al 2026-08-04 | Bullet oggi |
|---|---|---|
| Business Plan AI | 2 | **3** |
| Sherpa Alzheimer | 2 | **3** |
| Malaria AI Scope | 2 | **3** |
| LisAI Interpreter | 3 | 3 |
| Mental D0C | 0 (prose only) | 0 (prose only) |
| AI-Powered Drug Repositioning | 0 (prose only) | 0 (prose only) |

The v3.3 changelog says the target was "abbreviated description + 2 key aspects" per project. LisAI already breaks it.

**Recommendation: go to 3 bullets for the top four, leave the tail two as prose.**

Reasoning on the page budget, which is the only real objection: `cv.md` is a **pool**, not the printed document. `modes/oferta.md` writes a Relevance Selection block per evaluation and `generate-latex.mjs` reads it to emit only the projects tagged `(primary)` or `(secondary)`. Anything tagged `(excluded)` never reaches the PDF. So a richer `cv.md` costs nothing on the generated 2-page CV, it just gives the selector more to choose from.

Mental D0C and Drug Repositioning stay prose because they are the tail entries. They get tagged `(excluded)` in most evaluations anyway, and expanding them buys nothing.

---

## 3. Proposed third bullets

### 3.1 Sherpa Alzheimer — APPLICATO 2026-08-08

Source: `article-digest.md` §1 (in scope, no confirmation needed).

Add after the existing "Key decisions" bullet:

```markdown
- **Deployment hygiene:** embedding snapshot exports the Milvus collection to portable JSON with a manifest validating embedding dimensionality against current config, cutting cold start from minutes to seconds and failing loudly on schema mismatch; Phoenix/OpenTelemetry tracing on the request path
```

Why this one: bullets 1 and 2 already carry architecture and safety. Nothing in the current entry says the thing runs and is observable. For any JD with "MLOps", "monitorización" or "production" in it, this is the bullet that answers.

### 3.2 Malaria AI Scope — APPLICATO 2026-08-08

Source: `article-digest.md` §3 (in scope, no confirmation needed).

Add after the existing "Pipeline" bullet:

```markdown
- **Design decisions:** chose 17-class end-to-end over a hierarchical species-then-stage split, because early-stage parasites look alike across species and the hierarchy would discard the distinguishing signal; reported 62% mAP50 on the full heterogeneous test corpus rather than a narrower favourable slice
```

Why this one: the current entry describes what was built. This one shows judgment, which is what separates a mid-level CV from a junior one. It also carries the honest-reporting signal, which reads well and costs nothing.

### 3.3 LisAI Interpreter

Already at 3 bullets. **No change.**

### 3.4 Business Plan AI — full replacement block — PARZIALE

Source: the new README. **Needs your confirmation before use.**

```markdown
### Business Plan AI — Multi-Agent Business Plan Orchestrator
**Type:** Personal project, active development
**Link:** https://github.com/VicDc/BusinessPlan_AlanAgent

Local, privacy-first multi-agent system that turns a raw business idea into a structured business plan for Italian micro-businesses. FastAPI service, Docker Compose deployment, pytest suite. Reuses the same architecture pattern as Sherpa Alzheimer.

- **Architecture:** Six specialist agents (Vision, Market, Team, Setup, Financial, Funding) plus a guided IntakeAgent and a separate ReportWriter, coordinated by an Orchestrator with a revision loop (up to 3 cycles) enforcing 6 explicit consistency checks (revenue vs. addressable market, complete operating costs, unsupported claims, skills vs. ambition, funding gap vs. coverage, fidelity to user data)
- **Deterministic verification:** a non-LLM Python layer re-computes margin, break-even, capital, coverage and revenue-vs-market at 5% relative tolerance, exports the result to .xlsx with incoherent rows flagged, and marks a check unverifiable on missing data instead of raising
- **Key decisions:** LLM never renders charts directly, FinancialAgent emits a structured chart spec and rendering is deterministic Plotly code; every LLM call logged to JSONL for latency, token and convergence analysis; no CrewAI/LangGraph dependency to keep the consistency-check logic explicit and inspectable
```

Changes against the current entry:
- 5 checks corrected to 6, with all six named
- IntakeAgent and ReportWriter added, so the agent count in the text matches the repo
- New middle bullet for the deterministic validation layer, the strongest single item in the README
- FastAPI, Docker Compose and pytest added to the description line
- JSONL call logging folded into "Key decisions"
- "investor-ready business plan" replaced with "structured business plan for Italian micro-businesses", which is what the README actually claims

**Do not write, by the README's own admission:**
- `claude_fast` / `claude_quality` providers are experimental and never validated against the real Anthropic API. No claim of Anthropic API integration anywhere.
- `orgtransform-ai` is not in `cv.md`. Do not introduce it as a second project through the side door.
- The pipeline can fail to converge. Never phrase the revision loop as if approval is guaranteed.

---

## 4. Knock-on updates if section 3.4 is approved — PENDING

- **`article-digest.md`** has no Business Plan AI section at all (it covers Sherpa, LisAI, Malaria, Mental D0C, Drug Repositioning, Computes). It is 39 days stale per `node cv-sync-check.mjs`. If Business Plan AI is now a headline project, it needs a §7 block in the same format: hero metric, problem, architecture, non-obvious decisions, stack, what this proves.
- **Report #042** (`reports/042-capgemini-engineering-2026-08-01.md`) states in Block B, gap row 1, that CrewAI is not held and suggests porting the six agents to CrewAI over a weekend. Still true. No change needed.

---

## 5. Cover letter, Capgemini #042 — pending insert — PENDING

Decision already taken: **no sixth bullet.** The five bullets in the letter each carry an external award or an employer-auditable number; Business Plan AI carries neither, so it would lower the average rather than raise it.

Instead, one sentence inside the "problems I will solve" paragraph, right after the refusal-threshold sentence. There it works as evidence for the stated first move rather than as a boast, and it reaches the "agent control tower" theme in Capgemini's 2026-2028 plan without naming it.

**English (B2 register), 27 words:**
> In my own agent system I put a plain Python layer under the model that re-computes the key numbers and flags what does not add up.

**Italian:**
> Nel mio sistema ad agenti ho messo sotto al modello un livello in Python puro che ricalcola i numeri chiave e segnala quello che non torna.

Letter length after the insert: 408 words, still under the 420 ceiling in `modes/cover.md`.

Files to regenerate on approval:
- `output/cover-capgemini-en-2026-08-04.tex`
- `output/cover-capgemini-it-2026-08-04.tex`

---

## 6. Decisions needed

Aggiornata il 2026-08-08. Le prime cinque sono chiuse, restano due.

| # | Decision | Esito |
|---|---|---|
| 1 | Apply the 5 to 6 consistency-check correction | **FATTO** (v3.5) |
| 2 | Third bullet on Sherpa (§3.1) | **FATTO** (v3.6) |
| 3 | Third bullet on Malaria (§3.2) | **FATTO** (v3.6) |
| 4 | Full Business Plan AI replacement (§3.4) | **PARZIALE** — 4 dettagli fuori, elencati nell'header |
| 5 | Third bullet on Mental D0C and Drug Repositioning | **SKIP confermato** — restano prosa |
| 6 | Write a Business Plan AI block into `article-digest.md` (§4) | **APERTA** — il digest non lo nomina affatto |
| 7 | Insert the sentence into both Capgemini letters (§5) | **APERTA** — i due .tex sono fermi al 2026-08-04 |

Restano da decidere la 4, la 6 e la 7.
