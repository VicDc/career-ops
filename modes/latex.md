# Mode: latex — LaTeX/Overleaf CV Export

Export a tailored, ATS-optimized CV as a `.tex` file and compile it to PDF via `pdflatex`.

## Pipeline

1. Read `cv.md` as source of truth
2. Read `config/profile.yml` for candidate identity and contact info
3. Ask the user for the JD if not already in context (text or URL)
4. Extract 15-20 keywords from the JD
5. Detect JD language → CV language (EN default)
6. Detect role archetype → adapt framing
7. Rewrite Professional Summary injecting JD keywords (same rules as `pdf` mode — NEVER invent skills)
8. Select top 3-4 most relevant projects for the offer
9. Reorder experience bullets by JD relevance
10. Inject keywords naturally into existing achievements
11. Copy `templates/cv-template.tex` to the output path. Do NOT fill any placeholder by hand — `generate-latex.mjs` resolves all of them via in-place writeFile from `cv.md`, `config/profile.yml`, and the most recent `reports/*.md`.
12. Write to `output/cv-{candidate}-{company}-{YYYY-MM-DD}.tex`
13. Run: `node generate-latex.mjs output/cv-{candidate}-{company}-{YYYY-MM-DD}.tex output/cv-{candidate}-{company}-{YYYY-MM-DD}.pdf`
14. Report: .tex path, .pdf path, file sizes, section count, keyword coverage %

**Requires:** `pdflatex` on PATH (MiKTeX or TeX Live). First compilation may auto-install missing LaTeX packages via MiKTeX.

## Template Placeholders

The template at `templates/cv-template.tex` uses `{{PLACEHOLDER}}` syntax. Placeholders fall into two categories: **auto-resolved by `generate-latex.mjs`** (deterministic parsing from cv.md, profile.yml, or the report) and **LLM-populated** (written by the agent when generating the .tex). Currently every placeholder is Auto-resolved; the LLM-populated category is kept as a scaffold for future placeholders that may require role-specific tailoring.

### Auto-resolved (do NOT fill manually — leave as placeholder in .tex)

| Placeholder | Source | Details |
|-------------|--------|---------|
| `{{SUMMARY}}` | report `## Tailored CV Summary` > auto-detect reports/ > cv.md `## Summary` | Tailored per JD. Chain: explicit `--report=<path>` flag > most recent `reports/*.md` by mtime > cv.md fallback. LaTeX-escaped. |
| `{{CERTIFICATIONS}}` | cv.md `## Certifications` | Middot-separated one-liner (regular weight, no bold). Empty if section missing. |
| `{{NAME}}` | profile.yml `identity.name` | LaTeX-escaped. |
| `{{EMAIL_URL}}` | profile.yml `identity.email` | Raw value injected inside `\href{mailto:...}{}` — NOT LaTeX-escaped. |
| `{{EMAIL_DISPLAY}}` | profile.yml `identity.email` | Same value as `{{EMAIL_URL}}`, LaTeX-escaped for the `\href` display argument. |
| `{{LINKEDIN_URL}}` | profile.yml `identity.links.linkedin` | Raw URL injected inside `\href{...}{}` — NOT LaTeX-escaped. |
| `{{LINKEDIN_DISPLAY}}` | profile.yml `identity.links.linkedin` | URL stripped of `https://`, `www.`, and trailing `/`; LaTeX-escaped. |
| `{{GITHUB_URL}}` | profile.yml `identity.links.github` | Raw URL injected inside `\href{...}{}` — NOT LaTeX-escaped. |
| `{{GITHUB_DISPLAY}}` | profile.yml `identity.links.github` | URL stripped of `https://`, `www.`, and trailing `/`; LaTeX-escaped. |
| `{{CONTACT_LINE}}` | profile.yml `identity` block | Format: `phone $|$ city, country`. Visa field **intentionally excluded** — it's internal-only for sponsorship checks in oferta mode. |
| `{{SKILLS}}` | cv.md `## Technical Skills` | One `\textbf{Category}{: items} \\` line per bullet in the markdown list. |
| `{{EDUCATION}}` | cv.md `## Education` | `\resumeSubheading{Institution}{Dates}{Degree}{Location}` per H3 entry. |
| `{{EXPERIENCE}}` | cv.md `## Experience` + report `## Relevance Selection` → `### Experience` | 2-step: parse all entries from cv.md, then filter/reorder by tag (`primary`/`secondary` included, `excluded` skipped, unmentioned = tail fallback). Matching by Company name, case-insensitive substring. |
| `{{PROJECTS}}` | cv.md `## Projects` + report `## Relevance Selection` → `### Projects` | Same 2-step as Experience. Link rendering: **Opzione D** — title wrapped in `\href{URL}{\color{BrandPrimary}\faGithub\ Name \emph{$|$ Descriptor}}`. Multi-link in cv.md: first URL only. Missing Recognition falls back to Date; missing both renders empty right-side badge. |

### LLM-populated (fill when writing the .tex)

Currently empty — all placeholders are auto-resolved by `generate-latex.mjs`. This section is reserved for any future placeholder that requires manual LLM tailoring per role (e.g. role-specific summaries that can't be auto-generated).

### CLI flags

- `--report=<path>` — explicit report path for SUMMARY and Relevance Selection resolution. Overrides auto-detect.

### JSON output fields (per invocation)

`generate-latex.mjs` emits a JSON report. New fields to track auto-resolution:

- `summarySource` — `"report:<path>"` / `"report:auto:<name>"` / `"cv.md"` or absent
- `certificationsSource` — `"cv.md:<N>"` / `"cv.md:empty"` / `"cv.md:missing"`
- `headerSource` — `"profile.yml"` (all four of name/email/linkedin/github found) / `"profile.yml:partial"` (at least one missing) / `"profile.yml:missing"` (file unreadable or `identity` block absent)
- `contactLineSource` — `"profile.yml"` / `"profile.yml:empty"` / `"profile.yml:missing"`
- `skillsSource`, `educationSource`, `experienceSource`, `projectsSource` — `"cv.md:<N>"` counts
- `experienceSelected`, `projectsSelected` — `"selected:<N>+fallback:<M>"` when Relevance Selection was applied; omitted when no selection

### Relevance Selection (report side)

The mode `oferta` writes a `## Relevance Selection (for CV generation)` section in each report with sub-sections `### Experience` and `### Projects`. Format:

```
### Experience
1. Company Name (primary) — rationale
2. Company Name (secondary) — rationale
3. Company Name (excluded) — rationale
```

Tags: `(primary)` / `(secondary)` / `(excluded)`. The script:
- Includes primary + secondary entries in report order
- Skips excluded entries entirely
- Appends any cv.md entry not mentioned in selection as tail safety-net (preserves full ground-truth if selection is incomplete)

This lets a single cv.md generate different CVs per JD (e.g., Prompt Engineer role emits Sherpa+Mental+LisAI; Data Scientist role emits Malaria+Drug+Sherpa) with zero LLM drift on content.

## LaTeX Content Generation Rules

### Education

Each entry becomes:

```latex
    \resumeSubheading
    {Institution}{City, State}
    {Degree}{Date Range}
```

If coursework exists, add:

```latex
        \resumeItemListStart
            \resumeItem{\textbf{Coursework:} Course1, Course2, ...}
        \resumeItemListEnd
```

### Experience

Each role becomes:

```latex
    \resumeSubheading
      {Company}{Date Range}
      {Role Title}{Location}
      \resumeItemListStart
        \resumeItem{Bullet text with JD keywords injected}
        ...
      \resumeItemListEnd
```

### Projects

Each project becomes:

```latex
\resumeProjectHeading{Project Name \emph{$|$ Affiliation/Context}}{Date}
\resumeItemListStart
    \resumeItem{Bullet text}
    ...
\resumeItemListEnd
```

### Skills

```latex
    \textbf{Languages}{: C, C++, Java, ...} \\
    \textbf{Frameworks \& ML}{: PyTorch, LangChain, ...} \\
    \textbf{Tools \& Cloud}{: Docker, Kubernetes, ...}
```

## LaTeX Escaping (CRITICAL)

All text content MUST be escaped for LaTeX before insertion:

| Character | Escape |
|-----------|--------|
| `&` | `\&` |
| `%` | `\%` |
| `$` | `\$` |
| `#` | `\#` |
| `_` | `\_` |
| `{` | `\{` |
| `}` | `\}` |
| `~` | `\textasciitilde{}` |
| `^` | `\textasciicircum{}` |
| `\` | `\textbackslash{}` |
| `±` | `$\pm$` |
| `→` | `$\rightarrow$` |

**Exception:** Do NOT escape LaTeX commands themselves (`\resumeItem`, `\textbf`, etc.) — only user-supplied text content.

**Exception for URLs:** Do NOT escape text inside `\href{URL}{...}` first arguments. The URL must remain raw (or RFC 3986 percent-encoded). Only escape the *display text* (second argument). For example:
```latex
\href{https://example.com/path_with_underscores}{Example\_Display}
```

## ATS Rules (same as pdf mode)

- Single-column layout (enforced by template)
- Standard section headers: Education, Work Experience, Personal Projects, Technical Skills
- UTF-8, machine-readable via `\pdfgentounicode=1`
- Keywords distributed: first bullet of each role, skills section
- No images, no graphics, no color in body text

## Keyword Injection Strategy

Same ethical rules as `modes/pdf.md`:
- NEVER add skills the candidate doesn't have
- Only reformulate existing experience using JD vocabulary
- Examples:
  - JD says "RAG pipelines" → reword "LLM workflows with retrieval" to "RAG pipeline design"
  - JD says "MLOps" → reword "observability, evals" to "MLOps and observability"

## Overleaf Compatibility

The generated `.tex` file uses only standard CTAN packages (no custom or bundled dependencies):

- `latexsym`, `fullpage`, `titlesec`, `marvosym`, `color`, `verbatim`, `enumitem`
- `hyperref`, `fancyhdr`, `babel`, `tabularx`, `fontawesome5`, `multicol`, `glyphtounicode`

Upload the `.tex` file directly to Overleaf — compiles with no extra configuration.
