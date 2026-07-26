# Content Parity Inventory

React source replaces legacy page as development target.

| Area | Migration destination | Status |
| --- | --- | --- |
| Chemistry topics (15) | `src/content/lessons.json` | Present; includes preserved mole-concept reference sheets |
| Physics topics (13) | `src/content/lessons.json` | Present |
| Cation, anion, gas tables | named `table` blocks + source figures | Present |
| Mnemonics, comparisons, definitions | Markdown, callout, comparison, and details blocks | Present |
| Complete legacy lesson text | collapsed `Preserved source notes` blocks in `src/content/lessons.json` | Present for all 23 substantive migrated Chemistry and Physics lessons; archive-derived notes are labelled separately from curated lesson blocks |
| Legacy model-answer blanks | completed source-note answers in Chemistry and Physics model-answer lessons | All 184 legacy answer values rendered explicitly; no inert `?` prompts |
| pH and solubility references | named table blocks | Present |
| Periodic table | `src/content/elements.json` + explorer | 118 elements present |
| Built-in quizzes | `src/content/quizzes.json` | 4 legacy pools, 20 questions each |
| Custom quizzes | browser local storage | Create, duplicate, and delete supported |
| Built-in decks | `src/content/flashcards.json` | 21 extracted legacy starter/recommended decks |
| Custom decks | browser local storage | Create, edit, duplicate, delete, import, and export supported |
| Legacy posters, handouts, and concept maps | `public/source-materials/` + relevant `figure` lesson blocks | All 18 embedded legacy images extracted with alt text, captions, lazy loading, and responsive framing |
| Complete legacy viewer | `public/original-materials.html` | Retained for source reference |

`Revision_Hub__Chemistry_and_Physics.html` remains the migration archive. The React app is the maintained reading experience; `/original-materials.html` remains the complete legacy viewer.
