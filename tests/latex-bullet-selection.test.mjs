// tests/latex-bullet-selection.test.mjs — the report's Relevance Selection can
// pick which bullets of an entry reach the fork's LaTeX CV (generate-latex.mjs).
//
// A selector matches the start of a bullet (a project bullet's bold key),
// ignoring case and punctuation; the report's order is the print order; a
// selector that matches nothing becomes a validation issue instead of a
// silently missing bullet.
import { pass, fail } from './helpers.mjs';
import { extractRelevanceSelection, pickBullets, guessLanguage, checkParity } from '../generate-latex.mjs';

const check = (label, ok, detail = '') => (ok ? pass(label) : fail(`${label} ${detail}`));

const report = `## Relevance Selection (for CV generation)

### Experience
1. Acme Tools Srl (primary) - rationale
   bullets: Cut onboarding time | Delivered rollout
2. Freelance Studio (excluded) - off-topic

### Projects
1. Project Atlas (primary) - rationale
   bullets: design decisions | Scope
2. Project Beacon (secondary) - rationale
`;

const sel = extractRelevanceSelection(report);
check('bullets: line attaches to the entry above it',
  JSON.stringify(sel.experience[0].bullets) === JSON.stringify(['Cut onboarding time', 'Delivered rollout']),
  JSON.stringify(sel.experience[0]));
check('entry without bullets: line has none', sel.projects[1].bullets === undefined);
check('bullets: line does not become an entry', sel.experience.length === 2 && sel.projects.length === 2);

const expBullets = [
  'Delivered rollout, configuration, and support of the billing platform',
  'Delivered customer training on the reporting module',
  'Cut onboarding time by 30% with a guided setup',
  'Grew renewals by 12% through quarterly reviews',
];
let issues = [];
const picked = pickBullets(expBullets, sel.experience[0].bullets, b => b, 3, 'Acme', issues);
check('picked in report order', picked[0] === expBullets[2] && picked[1] === expBullets[0], JSON.stringify(picked));
check('"Delivered rollout" does not also match "Delivered customer"', picked.length === 2);
check('no issues on a clean pick', issues.length === 0, JSON.stringify(issues));

const meta = [{ key: 'Scope' }, { key: 'Pipeline' }, { key: 'Design decisions' }];
issues = [];
const pm = pickBullets(meta, sel.projects[0].bullets, m => m.key, 2, 'Atlas', issues);
check('project bullets match the bold key, case-insensitive', pm.map(m => m.key).join(',') === 'Design decisions,Scope');

issues = [];
check('no selectors: first max in cv.md order',
  pickBullets(expBullets, undefined, b => b, 3, 'x', issues).length === 3 && issues.length === 0);

issues = [];
pickBullets(expBullets, ['Led a team'], b => b, 3, 'Acme', issues);
check('unknown selector is an issue', issues.length === 1 && /Led a team/.test(issues[0]), JSON.stringify(issues));

issues = [];
const over = pickBullets(expBullets, ['Delivered rollout', 'Delivered customer', 'Cut', 'Grew'], b => b, 3, 'Acme', issues);
check('more picks than max: capped and reported', over.length === 3 && issues.some(i => /max 3/.test(i)), JSON.stringify(issues));

// --- Two-language CV (--lang): summary language guess and cv.it.md parity ---
check('Italian summary detected as it',
  guessLanguage('Ingegnere software con esperienza su pipeline di dati e sistemi di raccomandazione per il settore retail, con team distribuiti.') === 'it');
check('English summary detected as en',
  guessLanguage('Software engineer with five years of experience building data pipelines and recommendation systems for retail teams.') === 'en');

const en = [{ bullets: ['a', 'b'] }, { bullets: ['c'] }];
issues = [];
checkParity(en, en, e => e.bullets.length, 'Experience', 'cv.md', issues);
check('same file: no parity issue', issues.length === 0);
issues = [];
checkParity(en, [{ bullets: ['a', 'b'] }, { bullets: ['c'] }], e => e.bullets.length, 'Experience', 'cv.it.md', issues);
check('mirrored file: no parity issue', issues.length === 0, JSON.stringify(issues));
issues = [];
checkParity(en, [{ bullets: ['a'] }, { bullets: ['c'] }], e => e.bullets.length, 'Experience', 'cv.it.md', issues);
check('missing bullet in cv.it.md is an issue', issues.length === 1 && /entry 1 has 1 bullets, cv.md has 2/.test(issues[0]), JSON.stringify(issues));
issues = [];
checkParity(en, [{ bullets: ['a', 'b'] }], e => e.bullets.length, 'Experience', 'cv.it.md', issues);
check('missing entry in cv.it.md is an issue', issues.length === 1 && /1 entries, cv.md has 2/.test(issues[0]), JSON.stringify(issues));
