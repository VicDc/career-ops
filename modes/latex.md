# Mode: latex — LaTeX/Overleaf CV Export

Export a tailored, ATS-optimized CV as a `.tex` file and compile it to PDF via `tectonic` or `pdflatex`.

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
11. Generate the `.tex` file using `templates/cv-template.tex`
12. Derive the output location from the report (`--report=<path>` — the same file read for `{{SUMMARY}}`):
    - Parse the report's H1 line, format `# Evaluation: {Company} — {Role}`. Split once on the first occurrence of ` — `; if the em dash is absent, fall back to ` -- ` (see `reports/030-capgemini-agentic-ai-expert-2026-07-02.md`). Text before the separator is `{company_raw}`, text after is `{role_raw}`.
    - **Slugify procedure** (used for every slug below, in this order): drop parenthetical content (`(Barcelona)`, `(m/f/d)`, `(Remote)`) → lowercase → convert source `/` and `-` to spaces → strip remaining non-alphanumeric characters, keeping spaces → collapse repeated spaces → convert spaces to hyphens → collapse repeated hyphens.
    - Slugify `{company_raw}` → `{company_slug}` and `{role_raw}` → `{role_slug}`. Cap `{role_slug}` at 5 words after slugifying (truncate, never pad). Do not cap `{company_slug}`.
    - `{candidate_slug}` = the same slugify procedure applied to `config/profile.yml → candidate.name`.
    - `{report_num}` = leading numeric prefix of the report filename (`reports/{report_num}-….md`).
    - `{out_dir}` = `output/{report_num}-{company_slug}-{role_slug}/`. Create it if it does not exist.
    - `{date}` = current date as `YYYY-MM-DD`.
    - `{stamp}` = `{date}`, or `{date}-{HHMM}` (current time, 24h) when `{out_dir}/cv-{candidate_slug}-{date}.tex` or `.pdf` already exists — never overwrite an earlier run. The `.tex` and the `.pdf` always share the same `{stamp}`.
    Write the `.tex` to `{out_dir}/cv-{candidate_slug}-{stamp}.tex`. The filename carries no company, role, or offer reference — the directory does.
13. Run: `node generate-latex.mjs {out_dir}/cv-{candidate_slug}-{stamp}.tex {out_dir}/cv-{candidate_slug}-{stamp}.pdf`
14. Report: .tex path, .pdf path, file sizes, section count, keyword coverage %

**Requires:** `tectonic` (preferred — `brew install tectonic`, auto-downloads packages) or `pdflatex` (MiKTeX / TeX Live) on PATH.

## Template Placeholders

The template at `templates/cv-template.tex` uses `{{PLACEHOLDER}}` syntax:

| Placeholder | Source |
|-------------|--------|
| `{{NAME}}` | `profile.yml → candidate.full_name` |
| `{{CONTACT_LINE}}` | Phone / City, State / Visa status — built from profile.yml |
| `{{EMAIL_URL}}` | Raw email for `mailto:` URL — must not be LaTeX-escaped (from profile.yml) |
| `{{EMAIL_DISPLAY}}` | Escaped email for display text — LaTeX-special chars like `_` must be escaped, e.g. `first\_name@example.com` |
| `{{LINKEDIN_URL}}` | Full URL with scheme for `\href{}`: e.g. `https://linkedin.com/in/username`. If `profile.yml` stores a bare host+path (no scheme), prepend `https://` before substitution. |
| `{{LINKEDIN_DISPLAY}}` | Display text only (no scheme): `linkedin.com/in/username` |
| `{{GITHUB_URL}}` | Full URL with scheme for `\href{}`: e.g. `https://github.com/username`. If `profile.yml` stores a bare host+path, prepend `https://`. |
| `{{GITHUB_DISPLAY}}` | Display text only (no scheme): `github.com/username` |
| `{{EDUCATION}}` | LaTeX `\resumeSubheading` blocks from cv.md Education section |
| `{{EXPERIENCE}}` | LaTeX `\resumeSubheading` + `\resumeItem` blocks — reordered bullets |
| `{{PROJECTS}}` | LaTeX `\resumeProjectHeading` + `\resumeItem` blocks — top 3-4 selected |
| `{{SKILLS}}` | LaTeX `\textbf{Category}{: items}` lines from cv.md Technical Skills |

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

**Default — projects WITH a public repo URL (preferred).** Always use
`\resumeProjectHeadingLink` so the project name is a clickable hyperlink
prefixed by a GitHub icon. Pull the repo URL from `cv.md` (each project's
`**Link:**` line). The URL goes in `#2` raw (do NOT escape it); name, context,
and badge are escaped normally.

```latex
\resumeProjectHeadingLink{Project Name}{https://github.com/user/repo}{$|$ Context}{Date or Badge}
\resumeItemListStart
    \resumeItem{Bullet text}
    ...
\resumeItemListEnd
```

**Fallback — projects WITHOUT a repo URL.** Use the plain heading:

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
