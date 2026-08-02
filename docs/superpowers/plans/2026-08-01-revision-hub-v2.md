# Revision Hub v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a single static `index.html` revision hub with a font control panel and a qualitative-analysis practical simulator, deployed to GitHub Pages in place of the existing React app.

**Architecture:** Unwrap the existing bundler artifact into a plain hand-editable `index.html`, then add two features inside it. The QA simulator is one pure reducer (`qaRunTest`) over two data tables, with all rendering derived from its return value. Marking patterns are generated from that same return value, so there is no second source of truth. A dependency-free `test.js` extracts marker-delimited script blocks from the HTML and asserts against them under Node.

**Tech Stack:** Plain HTML/CSS/JS (ES5 style, `var` + `function`, matching the existing file). Node 20 for the test runner only — not a build step. Google Fonts CDN. Git + GitHub Pages branch deploy.

## Global Constraints

- **Single file.** All application code lives in `index.html`. No bundler, no npm dependencies, no build step. The only other committed code file is `test.js`.
- **ES5 style.** Use `var` and `function` declarations, matching the ~2000 lines of existing JS. No `let`/`const`/arrow functions/template literals in `index.html` — consistency beats modernity here, and `test.js` evaluates these blocks directly.
- **Existing design tokens only.** New CSS uses `var(--color-*)`, `var(--space-*)`, `var(--radius-*)`, `var(--shadow-*)`. No new hard-coded colours.
- **Marker comments are load-bearing.** `test.js` extracts code by them. Never rename or remove: `/* == QA-ENGINE-START == */` … `/* == QA-ENGINE-END == */` and `/* == FONT-DATA-START == */` … `/* == FONT-DATA-END == */`.
- **Test command:** `node test.js` from the repo root. Zero dependencies. It must exit 0.
- **localStorage keys:** `hciRevisionHub.font` and `hciRevisionHub.qalab`. The existing `hciRevisionHub.theme` and `hciRevisionHub.v2` must keep working untouched.
- **Never commit `Chemistry_Practical/`.** Those PDFs carry Xin Yang's full name and marked schoolwork; the repo is public. They stay outside the repo and are listed in `.gitignore`.
- **Source of chemistry truth:** the wording already rendered in `#cations`, `#anions`, `#gases` and `#solubility`. Transcribe, do not paraphrase.
- **Commit message footer** on every commit:
  ```
  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
  ```

---

### Task 1: Clone the repo and scaffold the test harness

**Files:**
- Create: `~/Documents/Tan Xin Yang/GitHub/chemistry-revision-hub/` (clone)
- Create: `chemistry-revision-hub/test.js`
- Modify: `chemistry-revision-hub/.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces: a working copy on branch `revision-hub-v2`; `node test.js` runnable; helper `slice(name)` used by every later task to extract marker-delimited blocks from `index.html`.

- [ ] **Step 1: Clone and branch**

```bash
cd "/home/tanxy/Documents/Tan Xin Yang/GitHub"
git clone https://github.com/O2bubble1/chemistry-revision-hub.git
cd chemistry-revision-hub
git checkout -b revision-hub-v2
git log --oneline -3
```

Expected: clone succeeds, you are on `revision-hub-v2`, and the log shows your friend's commits. If `git clone` prompts for credentials, stop and set up auth first — everything downstream depends on being able to push.

- [ ] **Step 2: Write the failing test**

Create `test.js`:

```js
/* Dependency-free checks for index.html. Run: node test.js */
var fs = require('fs');
var assert = require('assert');
var path = require('path');

var html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

/* Extract a marker-delimited block so we can evaluate it under Node. */
function slice(name) {
  var re = new RegExp('/\\* == ' + name + '-START == \\*/([\\s\\S]*?)/\\* == ' + name + '-END == \\*/');
  var m = html.match(re);
  assert.ok(m, 'marker block ' + name + ' not found in index.html');
  return m[1];
}

/* Evaluate blocks in one shared scope and pull named values out. */
function load(blocks, names) {
  var src = blocks.map(slice).join('\n');
  var out = '\nreturn {' + names.map(function (n) { return n + ': ' + n; }).join(', ') + '};';
  return new Function(src + out)();
}

var checks = 0;
function check(label, fn) { fn(); checks++; process.stdout.write('  ok  ' + label + '\n'); }

/* ---- build invariants ---- */
check('no bundler scaffolding remains', function () {
  assert.ok(!/__bundler/.test(html), 'found __bundler references');
});

console.log('\n' + checks + ' checks passed');
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node test.js`
Expected: FAIL — `ENOENT: no such file or directory, open '.../index.html'`. There is no `index.html` of ours yet. (Their React `index.html` may exist; if so it fails instead on the `__bundler` check passing trivially — that is fine, Task 2 replaces the file.)

- [ ] **Step 4: Ignore the practical PDFs**

Append to `.gitignore`:

```gitignore
# Source practicals — contain a real student name and marked work. Never publish.
Chemistry_Practical/
*.pdf
```

- [ ] **Step 5: Commit**

```bash
git add test.js .gitignore
git commit -m "test: add dependency-free harness for index.html

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Unwrap the bundler into a plain index.html

**Files:**
- Read: `../Revision_Hub/THE-HUB(Font).html`
- Create: `chemistry-revision-hub/index.html`
- Modify: `chemistry-revision-hub/test.js`

**Interfaces:**
- Consumes: `slice`, `check` from Task 1.
- Produces: `index.html` — a plain document with 8 `url("data:font/woff2;base64,…")` references and no bundler code. Every later task edits this file.

**Background.** `THE-HUB(Font).html` has 393 lines. Line 379 is `<script type="__bundler/manifest">` holding a JSON object of 4 base64 woff2 assets keyed by UUID. Line 391 is `<script type="__bundler/template">` holding the whole 3.9 MB page as a JSON string. Inside that template, 8 `src: url("<uuid>")` declarations reference those 4 assets (Figtree's two assets are each referenced 3× across weights 400/600/700).

- [ ] **Step 1: Write the failing test**

Replace the `/* ---- build invariants ---- */` section of `test.js` with:

```js
/* ---- build invariants ---- */
check('no bundler scaffolding remains', function () {
  assert.ok(!/__bundler/.test(html), 'found __bundler references');
});

check('all 8 font references are inlined as data URIs', function () {
  var n = (html.match(/url\("data:font\/woff2;base64,/g) || []).length;
  assert.strictEqual(n, 8, 'expected 8 inlined font refs, got ' + n);
});

check('no unresolved UUID font placeholders', function () {
  assert.ok(!/src: url\("[0-9a-f]{8}-[0-9a-f]{4}-/.test(html), 'a UUID placeholder survived');
});

check('document shell is intact', function () {
  assert.ok(/^<!DOCTYPE html>/i.test(html.trim()), 'missing doctype');
  assert.ok(/<title>Revision Hub/.test(html), 'missing title');
  assert.ok(/<\/html>\s*$/.test(html), 'missing closing html tag');
});

check('existing sections survived the unwrap', function () {
  ['cations', 'anions', 'gases', 'solubility', 'periodic', 'quiz', 'cards'].forEach(function (id) {
    assert.ok(html.indexOf('id="' + id + '"') !== -1, 'lost section #' + id);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test.js`
Expected: FAIL on the first check that touches a real file — there is no `index.html` of ours yet.

- [ ] **Step 3: Write the unwrap script**

This is a one-shot. Write it to the scratchpad, not the repo — we run it once and never again.

Create `/tmp/claude-1000/-home-tanxy-Documents-Tan-Xin-Yang-GitHub/dfe5b1bb-61fb-4bad-8c4f-a3eacaeb2941/scratchpad/unwrap.py`:

```python
"""Decode the bundler artifact into a plain, hand-editable index.html."""
import json, re, sys

SRC = "/home/tanxy/Documents/Tan Xin Yang/GitHub/Revision_Hub/THE-HUB(Font).html"
DST = "/home/tanxy/Documents/Tan Xin Yang/GitHub/chemistry-revision-hub/index.html"

raw = open(SRC, encoding="utf-8").read()

def block(kind):
    m = re.search(r'<script type="__bundler/%s">(.*?)</script>' % kind, raw, re.S)
    if not m:
        sys.exit("missing __bundler/%s block" % kind)
    return json.loads(m.group(1))

manifest = block("manifest")
template = block("template")

# Each asset is referenced by UUID inside src: url("...") — 8 references, 4 assets.
replaced = 0
for uuid, asset in manifest.items():
    if asset.get("compressed"):
        sys.exit("asset %s is compressed; unwrap script only handles raw base64" % uuid)
    data_uri = "data:%s;base64,%s" % (asset["mime"], asset["data"])
    template, n = re.subn(re.escape(uuid), data_uri, template)
    replaced += n
    print("  %s -> %d reference(s), %d KB" % (uuid[:8], n, len(asset["data"]) // 1024))

if replaced != 8:
    sys.exit("expected 8 font references, replaced %d" % replaced)

open(DST, "w", encoding="utf-8").write(template)
print("wrote %s (%.1f MB)" % (DST, len(template) / 1e6))
```

The template is already a complete standalone document — the bundler scripts, the manifest, and the "Unpacking…" splash all live in the *outer* wrapper, which we simply never copy. There is nothing to strip.

- [ ] **Step 4: Run the unwrap**

```bash
cd "/home/tanxy/Documents/Tan Xin Yang/GitHub/chemistry-revision-hub"
python3 "/tmp/claude-1000/-home-tanxy-Documents-Tan-Xin-Yang-GitHub/dfe5b1bb-61fb-4bad-8c4f-a3eacaeb2941/scratchpad/unwrap.py"
```

Expected: four lines reporting 1, 3, 1, 3 references, then `wrote .../index.html (4.1 MB)`.

- [ ] **Step 5: Run the tests**

Run: `node test.js`
Expected: PASS, 5 checks.

- [ ] **Step 6: Verify in a browser**

Open `index.html` directly. Expected: the page renders immediately with no "Unpacking…" splash, headings are in Caprasimo, body text in Figtree, and the tabs, periodic table and quiz all still work.

- [ ] **Step 7: Commit**

```bash
git add index.html test.js
git commit -m "feat: unwrap bundler artifact into plain index.html

Fonts are inlined as data URIs; the unpack-on-load scaffolding is gone.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Font data and the apply/persist layer

**Files:**
- Modify: `index.html` — `:root` block (~line 120), `body` rule (line 234), new script block before `</body>`
- Modify: `test.js`

**Interfaces:**
- Consumes: `slice`, `load`, `check`.
- Produces:
  - `FONTS` — array of `{id, name, stack, google}`. `google` is the Google Fonts family name, or `null` for bundled/system families.
  - `fontById(id)` → entry or `undefined`
  - `fontLinkHref(entry)` → CSS2 URL string, or `null` when the family needs no network fetch
  - `fontApply(state)` where `state` is `{heading, body, scale, comfort}` — writes the CSS variables
  - `fontState` — the live state object, defaulting to `{heading:'caprasimo', body:'figtree', scale:1, comfort:false}`

- [ ] **Step 1: Write the failing test**

Append to `test.js`, before the final `console.log`:

```js
/* ---- font data ---- */
var F = load(['FONT-DATA'], ['FONTS', 'fontById', 'fontLinkHref']);

check('every font has id, name and a stack', function () {
  assert.ok(F.FONTS.length >= 14, 'expected at least 14 families, got ' + F.FONTS.length);
  F.FONTS.forEach(function (f) {
    assert.ok(f.id && f.name && f.stack, 'incomplete entry: ' + JSON.stringify(f));
  });
});

check('font ids are unique', function () {
  var seen = {};
  F.FONTS.forEach(function (f) {
    assert.ok(!seen[f.id], 'duplicate font id: ' + f.id);
    seen[f.id] = 1;
  });
});

check('every stack falls back to a system font', function () {
  F.FONTS.forEach(function (f) {
    assert.ok(/system-ui|sans-serif|serif|monospace/.test(f.stack),
      f.id + ' has no fallback: ' + f.stack);
  });
});

check('bundled and system families need no network fetch', function () {
  ['caprasimo', 'figtree', 'system'].forEach(function (id) {
    assert.strictEqual(fontLinkOf(id), null, id + ' should not fetch');
  });
  function fontLinkOf(id) { return F.fontLinkHref(F.fontById(id)); }
});

check('google families build a valid css2 url', function () {
  var href = F.fontLinkHref(F.fontById('inter'));
  assert.ok(/^https:\/\/fonts\.googleapis\.com\/css2\?family=Inter/.test(href), href);
  assert.ok(/display=swap/.test(href), 'missing display=swap: ' + href);
  assert.ok(href.indexOf(' ') === -1, 'unencoded space in url: ' + href);
});

check('multi-word google families are url-encoded', function () {
  var href = F.fontLinkHref(F.fontById('atkinson'));
  assert.ok(/family=Atkinson\+Hyperlegible/.test(href), href);
});

check('fontById returns undefined for unknown ids', function () {
  assert.strictEqual(F.fontById('nope'), undefined);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test.js`
Expected: FAIL — `marker block FONT-DATA not found in index.html`.

- [ ] **Step 3: Add the font data block**

Insert a new `<script>` immediately before the closing `</body>` of `index.html`:

```html
<script>
/* == FONT-DATA-START == */
/* Typography options. `google` is the Google Fonts family name, or null when the
   family is already bundled as a data URI or supplied by the OS. */
var FONTS = [
  { id:'caprasimo', name:'Caprasimo (display)', stack:'"Caprasimo", system-ui, sans-serif',            google:null },
  { id:'figtree',   name:'Figtree',             stack:'"Figtree", system-ui, sans-serif',              google:null },
  { id:'system',    name:'System UI',           stack:'system-ui, -apple-system, sans-serif',          google:null },
  { id:'inter',     name:'Inter',               stack:'"Inter", system-ui, sans-serif',                google:'Inter' },
  { id:'poppins',   name:'Poppins',             stack:'"Poppins", system-ui, sans-serif',              google:'Poppins' },
  { id:'nunito',    name:'Nunito',              stack:'"Nunito", system-ui, sans-serif',               google:'Nunito' },
  { id:'worksans',  name:'Work Sans',           stack:'"Work Sans", system-ui, sans-serif',            google:'Work Sans' },
  { id:'grotesk',   name:'Space Grotesk',       stack:'"Space Grotesk", system-ui, sans-serif',        google:'Space Grotesk' },
  { id:'lora',      name:'Lora',                stack:'"Lora", Georgia, serif',                        google:'Lora' },
  { id:'merri',     name:'Merriweather',        stack:'"Merriweather", Georgia, serif',                google:'Merriweather' },
  { id:'sourceserif',name:'Source Serif 4',     stack:'"Source Serif 4", Georgia, serif',              google:'Source Serif 4' },
  { id:'plex',      name:'IBM Plex Sans',       stack:'"IBM Plex Sans", system-ui, sans-serif',        google:'IBM Plex Sans' },
  { id:'atkinson',  name:'Atkinson Hyperlegible', stack:'"Atkinson Hyperlegible", system-ui, sans-serif', google:'Atkinson Hyperlegible' },
  { id:'lexend',    name:'Lexend',              stack:'"Lexend", system-ui, sans-serif',               google:'Lexend' },
  { id:'jetbrains', name:'JetBrains Mono',      stack:'"JetBrains Mono", ui-monospace, monospace',     google:'JetBrains Mono' }
];

function fontById(id) {
  for (var i = 0; i < FONTS.length; i++) { if (FONTS[i].id === id) return FONTS[i]; }
  return undefined;
}

/* null when nothing needs fetching. Weights 400/700 cover body and bold; headings
   render at 400 because --font-heading-weight is 400. */
function fontLinkHref(f) {
  if (!f || !f.google) return null;
  return 'https://fonts.googleapis.com/css2?family=' +
         f.google.replace(/ /g, '+') + ':wght@400;700&display=swap';
}
/* == FONT-DATA-END == */
</script>
```

- [ ] **Step 4: Run the tests**

Run: `node test.js`
Expected: PASS, 12 checks.

- [ ] **Step 5: Add the CSS variables**

In the `:root` block of `index.html`, replace:

```css
  --font-heading: "Caprasimo", system-ui, sans-serif;
  --font-heading-weight: 400;
  --font-body: "Figtree", system-ui, sans-serif;
```

with:

```css
  --font-heading: "Caprasimo", system-ui, sans-serif;
  --font-heading-weight: 400;
  --font-body: "Figtree", system-ui, sans-serif;
  --font-scale: 1;
  --line-height-body: 1.55;
  --letter-spacing-body: 0;
```

Then replace line 234, which currently reads:

```css
body { margin: 0; font-size: 15px; line-height: 1.55; font-weight: 400; }
```

with:

```css
/* ponytail: only em-derived text scales — ~30 component rules set their own fixed
   px sizes and stay put. Upgrade path if it reads unevenly: convert those px values
   to em. Do not add a second scaling mechanism. `zoom` was rejected because it
   displaces the position:fixed overlays (periodic table modal, source viewer, tooltip). */
body { margin: 0; font-size: calc(15px * var(--font-scale));
       line-height: var(--line-height-body);
       letter-spacing: var(--letter-spacing-body);
       font-weight: 400; }
```

- [ ] **Step 6: Add the apply/persist layer**

Append inside the same `<script>` tag, **after** the `FONT-DATA-END` marker (this part touches the DOM, so it must stay outside the block `test.js` evaluates):

```js
var FONT_KEY = 'hciRevisionHub.font';
var fontState = { heading: 'caprasimo', body: 'figtree', scale: 1, comfort: false };
var fontLoaded = {};

function fontEnsureLoaded(id) {
  var href = fontLinkHref(fontById(id));
  if (!href || fontLoaded[id]) return;
  fontLoaded[id] = true;
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function fontApply(state) {
  var h = fontById(state.heading) || fontById('caprasimo');
  var b = fontById(state.body) || fontById('figtree');
  fontEnsureLoaded(h.id);
  fontEnsureLoaded(b.id);
  var r = document.documentElement.style;
  r.setProperty('--font-heading', h.stack);
  r.setProperty('--font-body', b.stack);
  r.setProperty('--font-scale', String(state.scale));
  r.setProperty('--line-height-body', state.comfort ? '1.75' : '1.55');
  r.setProperty('--letter-spacing-body', state.comfort ? '0.01em' : '0');
}

function fontSave() {
  try { window.localStorage.setItem(FONT_KEY, JSON.stringify(fontState)); } catch (e) {}
}

function fontLoad() {
  try {
    var s = JSON.parse(window.localStorage.getItem(FONT_KEY) || 'null');
    if (!s) return;
    if (fontById(s.heading)) fontState.heading = s.heading;
    if (fontById(s.body)) fontState.body = s.body;
    if (typeof s.scale === 'number' && s.scale >= 0.9 && s.scale <= 1.3) fontState.scale = s.scale;
    fontState.comfort = !!s.comfort;
  } catch (e) {}
}

fontLoad();
fontApply(fontState);
</script>
```

- [ ] **Step 7: Verify persistence in a browser**

Open `index.html`, then in the console run:

```js
fontState.body = 'lexend'; fontState.scale = 1.2; fontState.comfort = true;
fontApply(fontState); fontSave();
```

Expected: body text switches to Lexend, grows, and gains looser spacing. Reload — it stays. Then `localStorage.removeItem('hciRevisionHub.font')` and reload restores Figtree at 100%.

- [ ] **Step 8: Commit**

```bash
git add index.html test.js
git commit -m "feat: font tokens, family catalogue and persistence layer

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Font panel UI

**Files:**
- Modify: `index.html` — hero tools row (~line 1128), stylesheet, script block from Task 3

**Interfaces:**
- Consumes: `FONTS`, `fontById`, `fontApply`, `fontSave`, `fontState`.
- Produces: `fontPanelToggle()`, `fontPanelBuild()`, `fontReset()`. No later task depends on these.

- [ ] **Step 1: Add the trigger button**

In the hero tools row, immediately after the existing `#themeToggle` button, add:

```html
<button id="fontToggle" class="theme-btn" onclick="fontPanelToggle()" title="Change fonts and text size" aria-label="Typography settings" aria-expanded="false">Aa</button>
<div id="fontPanel" class="font-panel" role="dialog" aria-label="Typography" style="display:none;">
 <label class="fp-row"><span>Headings</span><select id="fpHeading" class="fp-select" onchange="fontPick('heading', this.value)"></select></label>
 <label class="fp-row"><span>Body</span><select id="fpBody" class="fp-select" onchange="fontPick('body', this.value)"></select></label>
 <label class="fp-row"><span>Size</span><input id="fpScale" class="fp-range" type="range" min="90" max="130" step="5" oninput="fontPick('scale', this.value / 100)"><span id="fpScaleOut" class="fp-out">100%</span></label>
 <label class="fp-row fp-check"><input id="fpComfort" type="checkbox" onchange="fontPick('comfort', this.checked)"><span>Reading comfort</span></label>
 <button class="fp-reset" onclick="fontReset()">Reset to default</button>
</div>
```

- [ ] **Step 2: Add the styles**

Add near the other hero/tool rules in the stylesheet:

```css
/* .toolbar must establish the containing block. Without it the panel is an
   absolutely-positioned flex child, whose static position is computed as if it
   were the sole flex item — so `align-items:center` straddles it across the
   toolbar row, and the mobile left/right resolve against the viewport. */
.toolbar { position:relative; }

.font-panel { position:absolute; z-index:9000; margin-top:8px; min-width:262px;
  background:var(--color-surface); border:1px solid var(--color-divider);
  border-radius:var(--radius-md); box-shadow:var(--shadow-sm);
  padding:var(--space-4); display:flex; flex-direction:column; gap:var(--space-3); }
.fp-row { display:flex; align-items:center; gap:var(--space-2); font-size:0.82em; }
.fp-row > span:first-child { flex:0 0 68px; color:var(--color-neutral-700); }
.fp-select { flex:1; font-family:inherit; font-size:0.95em; padding:6px 8px;
  border:1px solid var(--color-divider); border-radius:var(--radius-sm);
  background:var(--color-neutral-100); color:var(--color-text); }
.fp-range { flex:1; accent-color:var(--color-accent); }
.fp-out { flex:0 0 42px; text-align:right; font-size:0.9em; color:var(--color-neutral-600); }
.fp-check { gap:var(--space-2); cursor:pointer; }
.fp-check input { accent-color:var(--color-accent); }
.fp-reset { border:1px solid var(--color-divider); background:transparent; cursor:pointer;
  font-family:inherit; font-size:0.78em; font-weight:700; color:var(--color-accent-700);
  border-radius:999px; padding:7px 14px; align-self:flex-start; }
@media (max-width: 560px) { .font-panel { left:var(--space-4); right:var(--space-4); min-width:0; } }
```

- [ ] **Step 3: Wire up the panel**

Append to the Task 3 script, after `fontApply(fontState);`:

```js
function fontPanelBuild() {
  var mk = function (sel, current) {
    sel.innerHTML = '';
    FONTS.forEach(function (f) {
      var o = document.createElement('option');
      o.value = f.id; o.textContent = f.name;
      o.style.fontFamily = f.stack;          /* preview the family in the list */
      if (f.id === current) o.selected = true;
      sel.appendChild(o);
    });
  };
  mk(document.getElementById('fpHeading'), fontState.heading);
  mk(document.getElementById('fpBody'), fontState.body);
  document.getElementById('fpScale').value = String(Math.round(fontState.scale * 100));
  document.getElementById('fpScaleOut').textContent = Math.round(fontState.scale * 100) + '%';
  document.getElementById('fpComfort').checked = fontState.comfort;
}

function fontPick(key, value) {
  fontState[key] = value;
  if (key === 'scale') {
    document.getElementById('fpScaleOut').textContent = Math.round(value * 100) + '%';
  }
  fontApply(fontState);
  fontSave();
}

function fontReset() {
  fontState.heading = 'caprasimo'; fontState.body = 'figtree';
  fontState.scale = 1; fontState.comfort = false;
  fontApply(fontState); fontSave(); fontPanelBuild();
}

function fontPanelToggle(force) {
  var p = document.getElementById('fontPanel');
  var open = force !== undefined ? force : p.style.display === 'none';
  if (open) fontPanelBuild();
  p.style.display = open ? 'flex' : 'none';
  document.getElementById('fontToggle').setAttribute('aria-expanded', open ? 'true' : 'false');
}

/* Close on outside click and on Escape — same affordances as the other overlays. */
document.addEventListener('click', function (e) {
  var p = document.getElementById('fontPanel');
  if (!p || p.style.display === 'none') return;
  if (p.contains(e.target) || e.target.id === 'fontToggle') return;
  fontPanelToggle(false);
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') fontPanelToggle(false);
});
```

- [ ] **Step 4: Verify in a browser**

Open `index.html` and check each of:
- `Aa` sits beside the theme toggle; clicking opens the panel.
- Each dropdown option renders in its own typeface.
- Picking `Lora` for headings changes only headings; picking `Lexend` for body changes only body text.
- The size slider moves body text; the readout tracks it.
- Reading comfort visibly loosens line spacing.
- Reset returns everything to Caprasimo/Figtree at 100%.
- Reload preserves every choice.
- Escape and an outside click both close the panel.
- The theme toggle still works, in both light and dark.

- [ ] **Step 5: Run the tests**

Run: `node test.js`
Expected: PASS, 12 checks (unchanged — this task is DOM-only).

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: typography panel with split heading/body pickers, size and comfort

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: QA data tables and salt pool

**Files:**
- Modify: `index.html` — new script block before `</body>`
- Modify: `test.js`

**Interfaces:**
- Consumes: `slice`, `load`, `check`.
- Produces:
  - `QA_CATIONS` — keyed by `'NH4+' | 'Ca2+' | 'Al3+' | 'Zn2+' | 'Fe2+' | 'Fe3+' | 'Cu2+'`. Each value: `{label, name, soln, solid, naoh, nh3}` where `naoh`/`nh3` are `{ppt, text}` and `ppt` is `null` or `{colour, excess, excessSoln}`; `excess` is `'insoluble' | 'dissolves'`.
  - `QA_ANIONS` — keyed by `'CO3' | 'Cl' | 'I' | 'SO4' | 'NO3'`. Each value: `{label, name, acid, agno3, bano3, alfoil}`, each a `{ppt, gas, text}`.
  - `QA_GAS_TESTS` — keyed by gas (`'CO2' | 'NH3'`), each a map of tool id → observation string. Consumed by `qaDoGasTest` in Task 9.
  - `qaSoluble(cat, an)` → boolean
  - `QA_SALTS` — array of `{id, cat, an, soluble, name}`; `id` is `cat + '|' + an`
  - `qaSaltById(id)` → salt or `undefined`

- [ ] **Step 1: Write the failing test**

Append to `test.js`:

```js
/* ---- qa data ---- */
var Q = load(['QA-ENGINE'], ['QA_CATIONS', 'QA_ANIONS', 'QA_SALTS', 'qaSoluble', 'qaSaltById']);

check('all seven syllabus cations are present', function () {
  ['NH4+','Ca2+','Al3+','Zn2+','Fe2+','Fe3+','Cu2+'].forEach(function (c) {
    assert.ok(Q.QA_CATIONS[c], 'missing cation ' + c);
    assert.ok(Q.QA_CATIONS[c].naoh && Q.QA_CATIONS[c].nh3, c + ' missing a reagent result');
    assert.ok(Q.QA_CATIONS[c].soln && Q.QA_CATIONS[c].solid, c + ' missing a colour');
  });
});

check('all five syllabus anions are present', function () {
  ['CO3','Cl','I','SO4','NO3'].forEach(function (a) {
    assert.ok(Q.QA_ANIONS[a], 'missing anion ' + a);
  });
});

check('amphoteric hydroxides dissolve in excess NaOH only where they should', function () {
  assert.strictEqual(Q.QA_CATIONS['Al3+'].naoh.ppt.excess, 'dissolves');
  assert.strictEqual(Q.QA_CATIONS['Al3+'].nh3.ppt.excess, 'insoluble');
  assert.strictEqual(Q.QA_CATIONS['Zn2+'].naoh.ppt.excess, 'dissolves');
  assert.strictEqual(Q.QA_CATIONS['Zn2+'].nh3.ppt.excess, 'dissolves');
  assert.strictEqual(Q.QA_CATIONS['Ca2+'].naoh.ppt.excess, 'insoluble');
});

check('copper(II) gives the dark blue solution in excess ammonia', function () {
  var r = Q.QA_CATIONS['Cu2+'].nh3;
  assert.strictEqual(r.ppt.excess, 'dissolves');
  assert.ok(/dark blue/i.test(r.text), 'missing dark blue: ' + r.text);
  assert.strictEqual(Q.QA_CATIONS['Cu2+'].naoh.ppt.excess, 'insoluble');
});

check('calcium and ammonium give no precipitate with ammonia', function () {
  assert.strictEqual(Q.QA_CATIONS['Ca2+'].nh3.ppt, null);
  assert.strictEqual(Q.QA_CATIONS['NH4+'].nh3.ppt, null);
});

check('halides differ only by precipitate colour', function () {
  assert.strictEqual(Q.QA_ANIONS['Cl'].agno3.ppt.colour, 'white');
  assert.strictEqual(Q.QA_ANIONS['I'].agno3.ppt.colour, 'yellow');
});

check('solubility follows SPAN and the exception mnemonics', function () {
  assert.strictEqual(Q.qaSoluble('Ca2+', 'NO3'), true,  'all nitrates are soluble');
  assert.strictEqual(Q.qaSoluble('NH4+', 'CO3'), true,  'ammonium carbonate is soluble');
  assert.strictEqual(Q.qaSoluble('Ca2+', 'CO3'), false, 'calcium carbonate is insoluble');
  assert.strictEqual(Q.qaSoluble('Ca2+', 'SO4'), false, 'calcium sulfate is insoluble');
  assert.strictEqual(Q.qaSoluble('Cu2+', 'SO4'), true,  'copper sulfate is soluble');
  assert.strictEqual(Q.qaSoluble('Zn2+', 'Cl'),  true,  'zinc chloride is soluble');
});

check('the salt pool excludes non-existent and redox-interfering pairs', function () {
  var ids = Q.QA_SALTS.map(function (s) { return s.id; });
  ['Al3+|CO3','Fe3+|CO3','Fe3+|I','Cu2+|I'].forEach(function (id) {
    assert.ok(ids.indexOf(id) === -1, 'pool should not contain ' + id);
  });
  assert.strictEqual(Q.QA_SALTS.length, 31, 'expected 31 salts, got ' + Q.QA_SALTS.length);
});

check('the pool has enough insoluble unknowns to exercise the acid-dissolve path', function () {
  var insoluble = Q.QA_SALTS.filter(function (s) { return !s.soluble; });
  assert.strictEqual(insoluble.length, 5, 'expected 5 insoluble salts, got ' + insoluble.length);
});

check('every salt resolves and is fully described', function () {
  Q.QA_SALTS.forEach(function (s) {
    assert.strictEqual(Q.qaSaltById(s.id), s);
    assert.ok(Q.QA_CATIONS[s.cat], s.id + ' has an unknown cation');
    assert.ok(Q.QA_ANIONS[s.an], s.id + ' has an unknown anion');
    assert.ok(s.name && s.name.length > 3, s.id + ' has no readable name');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test.js`
Expected: FAIL — `marker block QA-ENGINE not found in index.html`.

- [ ] **Step 3: Add the data tables**

Insert a new `<script>` before `</body>` in `index.html`:

```html
<script>
/* == QA-ENGINE-START == */
/* Qualitative analysis truth table. Wording is transcribed from the #cations,
   #anions and #gases sections of this same page so the simulator's model answers
   and the revision notes cannot drift apart. */

var QA_CATIONS = {
  'NH4+': { label:'NH\u2084\u207A', name:'Ammonium', soln:'colourless', solid:'white',
    naoh:{ ppt:null, gasOnWarm:'NH3',
      text:'No precipitate is produced. On warming, a colourless and pungent gas is evolved which turns moist red litmus paper blue.' },
    nh3: { ppt:null, text:'No precipitate is produced.' } },

  'Ca2+': { label:'Ca\u00B2\u207A', name:'Calcium', soln:'colourless', solid:'white',
    naoh:{ ppt:{ colour:'white', excess:'insoluble' },
      text:'A white precipitate is formed, insoluble in excess aqueous sodium hydroxide.' },
    nh3: { ppt:null, text:'No precipitate is produced.' } },

  'Al3+': { label:'Al\u00B3\u207A', name:'Aluminium', soln:'colourless', solid:'white',
    naoh:{ ppt:{ colour:'white', excess:'dissolves', excessSoln:'colourless' },
      text:'A white precipitate is formed, which dissolves in excess aqueous sodium hydroxide to form a colourless solution.' },
    nh3: { ppt:{ colour:'white', excess:'insoluble' },
      text:'A white precipitate is formed, insoluble in excess aqueous ammonia.' } },

  'Zn2+': { label:'Zn\u00B2\u207A', name:'Zinc', soln:'colourless', solid:'white',
    naoh:{ ppt:{ colour:'white', excess:'dissolves', excessSoln:'colourless' },
      text:'A white precipitate is formed, which dissolves in excess aqueous sodium hydroxide to form a colourless solution.' },
    nh3: { ppt:{ colour:'white', excess:'dissolves', excessSoln:'colourless' },
      text:'A white precipitate is formed, which dissolves in excess aqueous ammonia to form a colourless solution.' } },

  'Fe2+': { label:'Fe\u00B2\u207A', name:'Iron(II)', soln:'green', solid:'green',
    naoh:{ ppt:{ colour:'green', excess:'insoluble' },
      text:'A green precipitate is formed, insoluble in excess aqueous sodium hydroxide.' },
    nh3: { ppt:{ colour:'green', excess:'insoluble' },
      text:'A green precipitate is formed, insoluble in excess aqueous ammonia.' } },

  'Fe3+': { label:'Fe\u00B3\u207A', name:'Iron(III)', soln:'yellow-brown', solid:'yellow-brown',
    naoh:{ ppt:{ colour:'red-brown', excess:'insoluble' },
      text:'A red-brown precipitate is formed, insoluble in excess aqueous sodium hydroxide.' },
    nh3: { ppt:{ colour:'red-brown', excess:'insoluble' },
      text:'A red-brown precipitate is formed, insoluble in excess aqueous ammonia.' } },

  'Cu2+': { label:'Cu\u00B2\u207A', name:'Copper(II)', soln:'blue', solid:'blue',
    naoh:{ ppt:{ colour:'light blue', excess:'insoluble' },
      text:'A light blue precipitate is formed, insoluble in excess aqueous sodium hydroxide.' },
    nh3: { ppt:{ colour:'light blue', excess:'dissolves', excessSoln:'dark blue' },
      text:'A light blue precipitate is formed, which dissolves in excess aqueous ammonia to form a dark blue solution.' } }
};

var QA_ANIONS = {
  'CO3': { label:'CO\u2083\u00B2\u207B', name:'Carbonate',
    acid:  { ppt:null, gas:'CO2',
      text:'Effervescence of a colourless, odourless gas is observed.' },
    agno3: { ppt:{ colour:'white' }, gas:null, text:'A white precipitate is formed.' },
    bano3: { ppt:{ colour:'white' }, gas:null, text:'A white precipitate is formed.' },
    alfoil:{ ppt:null, gas:null, text:'No gas is evolved.' } },

  'Cl':  { label:'Cl\u207B', name:'Chloride',
    acid:  { ppt:null, gas:null, text:'No effervescence is observed.' },
    agno3: { ppt:{ colour:'white' }, gas:null, text:'A white precipitate is formed.' },
    bano3: { ppt:null, gas:null, text:'No precipitate is formed.' },
    alfoil:{ ppt:null, gas:null, text:'No gas is evolved.' } },

  'I':   { label:'I\u207B', name:'Iodide',
    acid:  { ppt:null, gas:null, text:'No effervescence is observed.' },
    agno3: { ppt:{ colour:'yellow' }, gas:null, text:'A yellow precipitate is formed.' },
    bano3: { ppt:null, gas:null, text:'No precipitate is formed.' },
    alfoil:{ ppt:null, gas:null, text:'No gas is evolved.' } },

  'SO4': { label:'SO\u2084\u00B2\u207B', name:'Sulfate',
    acid:  { ppt:null, gas:null, text:'No effervescence is observed.' },
    agno3: { ppt:null, gas:null, text:'No precipitate is formed.' },
    bano3: { ppt:{ colour:'white' }, gas:null, text:'A white precipitate is formed.' },
    alfoil:{ ppt:null, gas:null, text:'No gas is evolved.' } },

  'NO3': { label:'NO\u2083\u207B', name:'Nitrate',
    acid:  { ppt:null, gas:null, text:'No effervescence is observed.' },
    agno3: { ppt:null, gas:null, text:'No precipitate is formed.' },
    bano3: { ppt:null, gas:null, text:'No precipitate is formed.' },
    alfoil:{ ppt:null, gas:'NH3',
      text:'A colourless and pungent gas is evolved on warming, which turns moist red litmus paper blue.' } }
};

var QA_GAS_TESTS = {
  /* CO2 is an acidic gas — it turns moist blue litmus red. The #oxides section of this
     same page says so explicitly ("CO₂ and SO₂ are your acidic gases"), so anything else
     here would contradict the student's own notes. */
  'CO2': { limewater:'A white precipitate is formed in the limewater.',
           splint:'The lighted splint is extinguished.',
           glowing:'The glowing splint is extinguished.',
           redlitmus:'The moist red litmus paper does not change colour.',
           bluelitmus:'The moist blue litmus paper turns red.',
           kmno4:'The acidified potassium manganate(VII) does not change colour.' },
  'NH3': { redlitmus:'The moist red litmus paper turns blue.',
           bluelitmus:'The moist blue litmus paper does not change colour.',
           limewater:'The limewater does not change.',
           splint:'The lighted splint is extinguished.',
           glowing:'The glowing splint is extinguished.',
           kmno4:'The acidified potassium manganate(VII) does not change colour.' }
};

/* SPAN: sodium, potassium, ammonium and nitrates are always soluble.
   Chlorides/iodides: soluble except Ag and Pb, neither of which is on the syllabus list.
   Sulfates: insoluble for Ba, Ca, Pb ("Sciences"). Carbonates: insoluble except Na, K, NH4. */
function qaSoluble(cat, an) {
  if (an === 'NO3') return true;
  if (cat === 'NH4+') return true;
  if (an === 'CO3') return false;
  if (an === 'SO4') return cat !== 'Ca2+';
  return true;
}

var QA_SALTS = (function () {
  var cats = ['NH4+','Ca2+','Al3+','Zn2+','Fe2+','Fe3+','Cu2+'];
  var ans  = ['CO3','Cl','I','SO4','NO3'];
  /* Al3+/CO3 and Fe3+/CO3 do not exist; Fe3+ and Cu2+ oxidise iodide rather than
     forming a stable salt, so those pairs would not behave as the table predicts. */
  var skip = { 'Al3+|CO3':1, 'Fe3+|CO3':1, 'Fe3+|I':1, 'Cu2+|I':1 };
  var anionWord = { CO3:'carbonate', Cl:'chloride', I:'iodide', SO4:'sulfate', NO3:'nitrate' };
  var out = [];
  for (var i = 0; i < cats.length; i++) {
    for (var j = 0; j < ans.length; j++) {
      var id = cats[i] + '|' + ans[j];
      if (skip[id]) continue;
      out.push({ id:id, cat:cats[i], an:ans[j], soluble:qaSoluble(cats[i], ans[j]),
                 name: QA_CATIONS[cats[i]].name + ' ' + anionWord[ans[j]] });
    }
  }
  return out;
})();

function qaSaltById(id) {
  for (var i = 0; i < QA_SALTS.length; i++) { if (QA_SALTS[i].id === id) return QA_SALTS[i]; }
  return undefined;
}
/* == QA-ENGINE-END == */
</script>
```

- [ ] **Step 4: Run the tests**

Run: `node test.js`
Expected: PASS, 22 checks.

- [ ] **Step 5: Cross-check against the page's own tables**

Open `index.html`, go to Cation Tests and Anion Tests, and read each row against the table you just wrote. Any wording difference is a bug in the new table, not in the notes.

- [ ] **Step 6: Commit**

```bash
git add index.html test.js
git commit -m "feat: QA truth tables and salt pool

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: qaRunTest reducer

**Files:**
- Modify: `index.html` — inside the `QA-ENGINE` block, after `qaSaltById`
- Modify: `test.js`

**Interfaces:**
- Consumes: `QA_CATIONS`, `QA_ANIONS`, `QA_SALTS`, `qaSaltById`.
- Produces:
  - `qaNewPortion()` → `{acidified:false, dissolved:false, added:[]}`
  - `qaRunTest(salt, reagent, mode, portion)` → `{solutionColour, ppt, gas, text, note, falsePositive, blocked}`
    - `reagent` ∈ `'water' | 'hno3' | 'naoh' | 'nh3' | 'agno3' | 'bano3' | 'na2co3' | 'alfoil' | 'warm'`
    - `mode` ∈ `'dropwise' | 'excess'` (only read for `'naoh'` and `'nh3'`)
    - mutates `portion` — sets `acidified`, `dissolved`, pushes to `added`
    - `blocked` is a string when the test cannot be performed yet (undissolved solid), else `undefined`

- [ ] **Step 1: Write the failing test**

Append to `test.js`:

```js
/* ---- qa reducer ---- */
var R = load(['QA-ENGINE'], ['qaRunTest', 'qaNewPortion', 'qaSaltById', 'QA_SALTS']);

/* Without an explicit portion, dissolve the sample first — every reagent other than
   water acts on a solution, so a bare fresh portion would just come back `blocked`. */
function run(saltId, reagent, mode, portion) {
  var salt = R.qaSaltById(saltId);
  var p = portion;
  if (!p) {
    p = R.qaNewPortion();
    if (reagent !== 'water') R.qaRunTest(salt, 'water', null, p);
  }
  return R.qaRunTest(salt, reagent, mode, p);
}

check('a soluble salt dissolves to its cation colour', function () {
  assert.ok(/colourless/.test(run('Ca2+|Cl', 'water').solutionColour + ''));
  assert.strictEqual(run('Cu2+|SO4', 'water').solutionColour, 'blue');
  assert.strictEqual(run('Fe2+|SO4', 'water').solutionColour, 'green');
  assert.strictEqual(run('Fe3+|Cl', 'water').solutionColour, 'yellow-brown');
});

check('an insoluble salt gives a suspension, not a solution', function () {
  var r = run('Zn2+|CO3', 'water');
  assert.strictEqual(r.solutionColour, null);
  assert.ok(/insoluble|suspension|did not dissolve/i.test(r.text), r.text);
});

check('solution tests are blocked until an insoluble solid is dissolved', function () {
  var p = R.qaNewPortion();
  run('Zn2+|CO3', 'water', null, p);
  var r = run('Zn2+|CO3', 'naoh', 'excess', p);
  assert.ok(r.blocked, 'expected the test to be blocked on an undissolved solid');
});

check('dilute nitric acid dissolves an insoluble carbonate with effervescence', function () {
  var p = R.qaNewPortion();
  run('Zn2+|CO3', 'water', null, p);
  var r = run('Zn2+|CO3', 'hno3', null, p);
  assert.strictEqual(r.gas, 'CO2');
  assert.ok(/effervescen/i.test(r.text), r.text);
  assert.strictEqual(p.dissolved, true);
  assert.strictEqual(p.acidified, true);
  assert.ok(!run('Zn2+|CO3', 'naoh', 'excess', p).blocked, 'should be unblocked now');
});

check('dropwise stops before the excess behaviour is revealed', function () {
  var r = run('Zn2+|Cl', 'naoh', 'dropwise');
  assert.strictEqual(r.ppt.colour, 'white');
  assert.ok(!/dissolv/i.test(r.text), 'dropwise must not reveal excess behaviour: ' + r.text);
});

check('excess reveals the amphoteric behaviour', function () {
  assert.ok(/dissolv/i.test(run('Al3+|Cl', 'naoh', 'excess').text));
  assert.ok(/insolubl/i.test(run('Al3+|Cl', 'nh3', 'excess').text));
  assert.ok(/dark blue/i.test(run('Cu2+|SO4', 'nh3', 'excess').text));
});

check('unacidified carbonate gives a false positive with silver nitrate', function () {
  var p = R.qaNewPortion();
  run('NH4+|CO3', 'water', null, p);
  var r = run('NH4+|CO3', 'agno3', null, p);
  assert.ok(r.ppt, 'expected a precipitate');
  assert.strictEqual(r.falsePositive, true);
  assert.ok(/acidif/i.test(r.note || ''), 'note should explain the missing acidification');
});

check('acidifying first removes the carbonate interference', function () {
  var p = R.qaNewPortion();
  run('NH4+|CO3', 'water', null, p);
  run('NH4+|CO3', 'hno3', null, p);
  var r = run('NH4+|CO3', 'agno3', null, p);
  assert.strictEqual(r.ppt, null);
  assert.ok(!r.falsePositive);
});

check('chloride and sulfate are unaffected by acidification', function () {
  var p = R.qaNewPortion();
  run('Ca2+|Cl', 'water', null, p);
  run('Ca2+|Cl', 'hno3', null, p);
  assert.strictEqual(run('Ca2+|Cl', 'agno3', null, p).ppt.colour, 'white');
  assert.strictEqual(run('Ca2+|Cl', 'bano3', null, p).ppt, null);
});

check('the nitrate test evolves ammonia', function () {
  assert.strictEqual(run('Ca2+|NO3', 'alfoil').gas, 'NH3');
  assert.strictEqual(run('Ca2+|Cl', 'alfoil').gas, null);
});

check('an ammonium salt confounds the nitrate test', function () {
  var r = run('NH4+|Cl', 'alfoil');
  assert.strictEqual(r.gas, 'NH3', 'ammonium releases NH3 regardless of the anion');
  assert.ok(/ammonium/i.test(r.note || ''), 'note should warn the result is not conclusive');
});

check('warming after NaOH detects ammonium', function () {
  var p = R.qaNewPortion();
  run('NH4+|Cl', 'water', null, p);
  run('NH4+|Cl', 'naoh', 'excess', p);
  assert.strictEqual(run('NH4+|Cl', 'warm', null, p).gas, 'NH3');
});

check('warming without alkali detects nothing', function () {
  var p = R.qaNewPortion();
  run('NH4+|Cl', 'water', null, p);
  assert.strictEqual(run('NH4+|Cl', 'warm', null, p).gas, null);
});

check('aqueous sodium carbonate precipitates every metal cation but not ammonium', function () {
  assert.ok(run('Ca2+|Cl', 'na2co3').ppt, 'calcium should precipitate');
  assert.strictEqual(run('NH4+|Cl', 'na2co3').ppt, null, 'ammonium carbonate is soluble');
});

check('every salt survives every reagent without throwing', function () {
  var reagents = ['water','hno3','naoh','nh3','agno3','bano3','na2co3','alfoil','warm'];
  R.QA_SALTS.forEach(function (s) {
    reagents.forEach(function (rg) {
      var p = R.qaNewPortion();
      R.qaRunTest(s, 'water', null, p);
      var out = R.qaRunTest(s, rg, 'excess', p);
      assert.ok(out && typeof out.text === 'string' && out.text.length > 0,
        s.id + ' + ' + rg + ' produced no text');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test.js`
Expected: FAIL — `qaRunTest is not defined`.

- [ ] **Step 3: Implement the reducer**

Add inside the `QA-ENGINE` block, after `qaSaltById`:

```js
function qaNewPortion() { return { acidified:false, dissolved:false, added:[] }; }

/* One reducer over the truth tables. Everything the bench and the marker need is
   derived from its return value, so there is no second source of truth. */
function qaRunTest(salt, reagent, mode, portion) {
  var cat = QA_CATIONS[salt.cat], an = QA_ANIONS[salt.an];
  var out = { solutionColour: undefined, ppt: null, gas: null, text: '', note: undefined };

  if (reagent === 'water') {
    portion.added.push('water');
    if (salt.soluble) {
      portion.dissolved = true;
      out.solutionColour = cat.soln;
      out.text = 'The solid dissolved to form a ' + cat.soln + ' solution.';
    } else {
      out.solutionColour = null;
      out.ppt = { colour: cat.solid };
      out.text = 'The solid did not dissolve. A ' + cat.solid + ' suspension was formed.';
    }
    return out;
  }

  /* Everything after this point acts on a solution. */
  if (!portion.dissolved && reagent !== 'hno3') {
    out.blocked = 'The solid has not dissolved yet. Dissolve it in a minimum volume of ' +
                  'dilute nitric acid before carrying out tests on the solution.';
    out.text = out.blocked;
    return out;
  }

  if (reagent === 'hno3') {
    portion.acidified = true;
    if (!portion.dissolved) {
      portion.dissolved = true;
      if (salt.an === 'CO3') {
        out.gas = 'CO2';
        out.solutionColour = cat.soln;
        out.text = 'Effervescence of a colourless, odourless gas is observed and the solid ' +
                   'dissolves to form a ' + cat.soln + ' solution.';
      } else {
        out.solutionColour = cat.soln;
        out.text = 'The solid dissolves to form a ' + cat.soln + ' solution. ' +
                   'No effervescence is observed.';
      }
      return out;
    }
    out.gas = an.acid.gas;
    out.text = an.acid.text;
    return out;
  }

  if (reagent === 'naoh' || reagent === 'nh3') {
    portion.added.push(reagent);
    var res = cat[reagent];
    if (!res.ppt) { out.text = res.text; return out; }
    if (mode === 'dropwise') {
      out.ppt = { colour: res.ppt.colour, excess: null };
      out.text = 'A ' + res.ppt.colour + ' precipitate is formed.';
      out.note = 'Keep adding until there is no further change to find out whether it ' +
                 'dissolves in excess.';
      return out;
    }
    out.ppt = res.ppt;
    out.text = res.text;
    if (res.ppt.excess === 'dissolves') out.solutionColour = res.ppt.excessSoln;
    return out;
  }

  if (reagent === 'agno3' || reagent === 'bano3') {
    /* Carbonate precipitates with both reagents. Acidifying first destroys it — which
       is exactly why the syllabus says to acidify, so let the mistake happen. */
    if (salt.an === 'CO3') {
      if (portion.acidified) {
        out.text = 'No precipitate is formed.';
        return out;
      }
      out.ppt = { colour: 'white' };
      out.falsePositive = true;
      out.text = 'A white precipitate is formed.';
      out.note = 'FALSE POSITIVE — this portion was never acidified, so carbonate ions ' +
                 'precipitated with the reagent. Add dilute nitric acid first.';
      return out;
    }
    out.ppt = an[reagent].ppt;
    out.text = an[reagent].text;
    if (!portion.acidified && out.ppt) {
      out.note = 'The result is right, but you did not acidify first. Without that step ' +
                 'you could not rule out carbonate.';
    }
    return out;
  }

  if (reagent === 'na2co3') {
    if (salt.cat === 'NH4+') {
      out.text = 'No precipitate is formed.';
      return out;
    }
    out.ppt = { colour: 'white', excess: 'insoluble' };
    out.text = 'A white precipitate is formed, insoluble in excess.';
    out.note = 'The metal cation forms an insoluble carbonate. This narrows the cation ' +
               'but does not identify it.';
    return out;
  }

  if (reagent === 'alfoil') {
    if (salt.an === 'NO3') {
      out.gas = 'NH3';
      out.text = an.alfoil.text;
      if (salt.cat === 'NH4+') {
        out.note = 'Ammonium salts also give ammonia here, so on its own this does not ' +
                   'prove nitrate is present.';
      }
      return out;
    }
    if (salt.cat === 'NH4+') {
      out.gas = 'NH3';
      out.text = 'A colourless and pungent gas is evolved which turns moist red litmus ' +
                 'paper blue.';
      out.note = 'This came from the ammonium ion, not from nitrate. The test is not ' +
                 'conclusive for an ammonium salt.';
      return out;
    }
    out.text = 'No gas is evolved.';
    return out;
  }

  if (reagent === 'warm') {
    var hasAlkali = portion.added.indexOf('naoh') !== -1 || portion.added.indexOf('nh3') !== -1;
    if (salt.cat === 'NH4+' && hasAlkali) {
      out.gas = 'NH3';
      out.text = 'A colourless and pungent gas is evolved which turns moist red litmus ' +
                 'paper blue.';
      return out;
    }
    out.text = 'No change is observed on warming.';
    return out;
  }

  out.text = 'Nothing happens.';
  return out;
}
```

- [ ] **Step 4: Run the tests**

Run: `node test.js`
Expected: PASS, 37 checks.

- [ ] **Step 5: Commit**

```bash
git add index.html test.js
git commit -m "feat: qaRunTest reducer with acidification and solubility state

Models the two mistakes the practical is designed to catch: an unacidified
carbonate false-positive, and testing a solution that was never dissolved.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Marking

**Files:**
- Modify: `index.html` — inside the `QA-ENGINE` block, after `qaRunTest`
- Modify: `test.js`

**Interfaces:**
- Consumes: the result object from `qaRunTest`.
- Produces:
  - `qaMarkFor(result)` → `{required: RegExp[], forbidden: RegExp[]}`
  - `qaCheckRow(text, mark)` → `{pass: boolean, missing: number, hit: number}`

- [ ] **Step 1: Write the failing test**

Append to `test.js`:

```js
/* ---- marking ---- */
var M = load(['QA-ENGINE'], ['qaMarkFor', 'qaCheckRow', 'qaRunTest', 'qaNewPortion', 'qaSaltById']);

function mark(saltId, reagent, mode) {
  var p = M.qaNewPortion();
  M.qaRunTest(M.qaSaltById(saltId), 'water', null, p);
  return M.qaMarkFor(M.qaRunTest(M.qaSaltById(saltId), reagent, mode, p));
}
function graded(saltId, reagent, mode, answer) {
  return M.qaCheckRow(answer, mark(saltId, reagent, mode));
}

check('a full answer passes', function () {
  assert.strictEqual(graded('Ca2+|Cl', 'naoh', 'excess',
    'A white precipitate is formed, insoluble in excess aqueous sodium hydroxide.').pass, true);
});

check('loose but correct phrasing still passes', function () {
  assert.strictEqual(graded('Ca2+|Cl', 'naoh', 'excess',
    'white ppt formed, does not dissolve in excess').pass, true);
});

check('a missing colour fails', function () {
  assert.strictEqual(graded('Ca2+|Cl', 'naoh', 'excess',
    'A precipitate is formed, insoluble in excess.').pass, false);
});

check('a missing excess observation fails', function () {
  assert.strictEqual(graded('Ca2+|Cl', 'naoh', 'excess',
    'A white precipitate is formed.').pass, false);
});

check('"insoluble" is never accepted as "dissolves"', function () {
  assert.strictEqual(graded('Zn2+|Cl', 'naoh', 'excess',
    'White precipitate formed, insoluble in excess.').pass, false,
    '"insoluble" contains "soluble" — the forbidden list must catch this');
  assert.strictEqual(graded('Zn2+|Cl', 'naoh', 'excess',
    'White precipitate formed, dissolves in excess to give a colourless solution.').pass, true);
});

check('the copper ammonia answer needs the dark blue solution', function () {
  assert.strictEqual(graded('Cu2+|SO4', 'nh3', 'excess',
    'Light blue precipitate formed which dissolves in excess.').pass, false);
  assert.strictEqual(graded('Cu2+|SO4', 'nh3', 'excess',
    'Light blue ppt formed, dissolves in excess ammonia to form a dark blue solution.').pass, true);
});

check('a no-change result needs a negative observation', function () {
  assert.strictEqual(graded('Ca2+|Cl', 'nh3', 'excess', 'No precipitate is formed.').pass, true);
  assert.strictEqual(graded('Ca2+|Cl', 'nh3', 'excess', 'A white precipitate formed.').pass, false);
});

check('a gas result needs effervescence or a named gas', function () {
  var p = M.qaNewPortion();
  M.qaRunTest(M.qaSaltById('Ca2+|CO3'), 'water', null, p);
  var res = M.qaRunTest(M.qaSaltById('Ca2+|CO3'), 'hno3', null, p);
  assert.strictEqual(M.qaCheckRow('Effervescence of a colourless gas observed.',
    M.qaMarkFor(res)).pass, true);
  assert.strictEqual(M.qaCheckRow('Nothing happened.', M.qaMarkFor(res)).pass, false);
});

check('an empty answer never passes', function () {
  assert.strictEqual(graded('Ca2+|Cl', 'naoh', 'excess', '').pass, false);
  assert.strictEqual(graded('Ca2+|Cl', 'naoh', 'excess', '   ').pass, false);
});

check('qaCheckRow reports how much was hit', function () {
  var g = graded('Ca2+|Cl', 'naoh', 'excess', 'A white precipitate is formed.');
  assert.ok(g.hit > 0 && g.missing > 0, JSON.stringify(g));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test.js`
Expected: FAIL — `qaMarkFor is not defined`.

- [ ] **Step 3: Implement marking**

Add inside the `QA-ENGINE` block, after `qaRunTest`:

```js
/* Marking patterns are derived from the result object, not authored per salt, so
   they cannot drift out of sync with the truth table. */
function qaMarkFor(result) {
  var required = [], forbidden = [];

  if (result.ppt) {
    /* "red-brown" should also match "red brown" and "reddish brown". */
    var colour = result.ppt.colour.replace(/[- ]/g, '[- ]?\\w*\\s?');
    required.push(new RegExp(colour, 'i'));
    /* solutionColour === null means the solid never dissolved — the model answer calls
       that a suspension, so accept that wording alongside "precipitate". */
    if (result.solutionColour === null) {
      required.push(/precipitat|ppt|suspension|insolubl|did ?n[o']?t dissolv/i);
    } else {
      required.push(/precipitat|ppt/i);
    }

    if (result.ppt.excess === 'insoluble') {
      required.push(/insolubl|does ?n[o']?t dissolv|did ?n[o']?t dissolv|no further change|remain/i);
    } else if (result.ppt.excess === 'dissolves') {
      required.push(/dissolv/i);
      forbidden.push(/insolubl/i);
      if (result.solutionColour) {
        required.push(new RegExp(result.solutionColour.replace(/ /g, '\\s+'), 'i'));
      }
    }
  } else if (result.gas) {
    required.push(/effervescen|gas|bubbl|fizz/i);
  } else if (result.solutionColour) {
    /* A dissolve is a positive observation, not "nothing happened" — Test 1 of every
       paper lands here, and without this branch the model answer fails its own marking. */
    required.push(new RegExp(result.solutionColour.replace(/[- ]/g, '[- ]?\\w*\\s?'), 'i'));
    required.push(/dissolv|solution/i);
  } else {
    required.push(/no |not |nothing|absen/i);
    /* The negative lookbehind exempts a genuinely negated colour ("No white precipitate
       is formed") while still rejecting an affirmative one ("White ppt formed but
       nothing dissolved") — `required` alone accepts a negation word anywhere in the
       sentence, so without this a wrong answer marks correct. The \b are load-bearing:
       bare `red` otherwise matches inside `predicted` and `reduced`. */
    forbidden.push(/(?<!no |not |n't )\b(white|green|blue|yellow|red)\b/i);
  }

  return { required: required, forbidden: forbidden };
}

function qaCheckRow(text, mark) {
  var t = String(text || '').trim();
  if (!t) return { pass: false, missing: mark.required.length, hit: 0 };

  var hit = 0;
  for (var i = 0; i < mark.required.length; i++) {
    if (mark.required[i].test(t)) hit++;
  }
  for (var j = 0; j < mark.forbidden.length; j++) {
    if (mark.forbidden[j].test(t)) return { pass: false, missing: mark.required.length - hit, hit: hit };
  }
  return { pass: hit === mark.required.length, missing: mark.required.length - hit, hit: hit };
}
```

- [ ] **Step 4: Run the tests**

Run: `node test.js`
Expected: PASS, 47 checks.

If the "insoluble is never accepted as dissolves" check fails, the `forbidden` list is not being consulted — that is the exact substring trap the check exists to catch. Fix `qaCheckRow`, not the test.

- [ ] **Step 5: Commit**

```bash
git add index.html test.js
git commit -m "feat: derive marking patterns from test results

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Register the Practical Sim tab and split layout

**Files:**
- Modify: `index.html` — tab bar (~line 1155), new `#qalab` section, stylesheet

**Interfaces:**
- Consumes: the existing `HUB_GROUPS` / `hubShow` tab machinery.
- Produces: `#qalab` section with `#qaPaper` and `#qaBench` panes for Tasks 9–11 to populate.

- [ ] **Step 1: Add the tab**

In the tab bar, immediately after the `QA Strategy` tab, insert:

```html
<button class="tab" data-subject="chem" data-group="qa" data-target="qalab">Practical Sim</button>
```

No `HUB_GROUPS` edit is needed — the `qa` group already exists.

- [ ] **Step 2: Add the section shell**

Insert after the closing `</div>` of the `#flow` section:

```html
<!-- QA PRACTICAL SIMULATOR -->
<div id="qalab" class="section" data-subject="chem">
 <h2>Practical Sim — Qualitative Analysis</h2>
 <p class="qa-intro">Work the unknown out the way you would in the lab. The bench shows you what
  happens; writing down what you saw is your job.</p>

 <div class="qa-modes">
  <button class="qa-modebtn qa-on" id="qaModePractice" onclick="qaSetMode('practice')">Practice</button>
  <button class="qa-modebtn" id="qaModeReplay" onclick="qaSetMode('replay')">Replay a practical</button>
  <select id="qaReplayPick" class="qa-select" onchange="qaStart('replay', this.value)" style="display:none;"></select>
  <button class="qa-modebtn qa-new" onclick="qaStart()">New unknown</button>
 </div>

 <div class="qa-split">
  <div class="qa-pane qa-paper" id="qaPaper"></div>
  <div class="qa-pane qa-bench" id="qaBench"></div>
 </div>
</div>
```

- [ ] **Step 3: Add the layout styles**

```css
.qa-intro { color:var(--color-neutral-700); margin-bottom:var(--space-4); max-width:62ch; }
.qa-modes { display:flex; flex-wrap:wrap; gap:var(--space-2); margin-bottom:var(--space-4);
  align-items:center; }
.qa-modebtn { border:1.5px solid var(--color-accent); background:transparent;
  color:var(--color-accent-700); border-radius:999px; padding:8px 18px; cursor:pointer;
  font-family:inherit; font-size:0.8em; font-weight:700; }
.qa-modebtn.qa-on { background:var(--color-accent); color:#fff; }
.qa-modebtn.qa-new { margin-left:auto; border-color:var(--color-accent-2);
  color:var(--color-accent-2-700); }
.qa-select { font-family:inherit; font-size:0.8em; padding:7px 10px;
  border:1px solid var(--color-divider); border-radius:var(--radius-sm);
  background:var(--color-neutral-100); color:var(--color-text); }

.qa-split { display:grid; grid-template-columns:1fr 1fr; gap:var(--space-4); align-items:start; }
.qa-pane { background:var(--color-surface); border-radius:var(--radius-md);
  padding:var(--space-4); box-shadow:var(--shadow-sm); }
.qa-bench { position:sticky; top:var(--space-4); }

/* Below 900px the panes stack, bench first — you act, then write it down. The result
   card stays pinned so it is still visible while you type into the paper. */
@media (max-width: 900px) {
  .qa-split { grid-template-columns:1fr; }
  .qa-bench { position:static; order:-1; }
  .qa-result { position:sticky; top:0; z-index:20; }
}
```

- [ ] **Step 4: Verify in a browser**

Open `index.html`, choose Chemistry, open the Qualitative Analysis group. Expected: a `Practical Sim` tab appears after `QA Strategy`, clicking it shows two empty panes side by side, and narrowing the window below 900px stacks them with the bench on top. Confirm `Zap tabs` can hide and restore it like any other tab.

- [ ] **Step 5: Run the tests**

Run: `node test.js`
Expected: PASS, 47 checks.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: register Practical Sim tab with split paper/bench layout

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: Bench UI

**Files:**
- Modify: `index.html` — new script block, stylesheet

**Interfaces:**
- Consumes: `qaRunTest`, `qaNewPortion`, `qaSaltById`, `QA_GAS_TESTS`.
- Produces:
  - `qaState` — `{mode, saltId, script, label, aim, activeRow, portions, rowResult, rows, final, dissolvedOnce, lastResult, gasLine}`. Task 10 is what constructs it for real; this task only reads and mutates it.
  - `qaBenchRender()`, `qaDoTest(reagent, mode)`, `qaDoGasTest(toolId)`, `qaColourCss(name)`, `qaEsc(s)`, `QA_REAGENTS`, `QA_GAS_TOOLS`, `QA_KEY`
- **Forward references:** `qaDoTest` calls `qaSave()`, which Task 10 defines. Until Task 10 lands the bench is exercised with the console stub in Step 3 — this task is deliberately not wired into page load yet.

- [ ] **Step 1: Add the tube and bench styles**

```css
.qa-reagents { display:flex; flex-wrap:wrap; gap:var(--space-2); margin-bottom:var(--space-4); }
.qa-rgt { border:1px solid var(--color-divider); background:var(--color-neutral-100);
  color:var(--color-text); border-radius:var(--radius-sm); padding:8px 12px; cursor:pointer;
  font-family:inherit; font-size:0.76em; text-align:left; }
.qa-rgt:hover { border-color:var(--color-accent); }
.qa-rgt[disabled] { opacity:0.4; cursor:not-allowed; }
.qa-rgt .qa-sub { display:block; font-size:0.85em; color:var(--color-neutral-600); }

.qa-tube { width:74px; height:186px; margin:0 auto var(--space-3); position:relative;
  border:2px solid var(--color-neutral-400); border-top:none;
  border-radius:0 0 37px 37px; overflow:hidden; background:var(--color-neutral-100); }
.qa-liquid { position:absolute; left:0; right:0; bottom:0; height:64%;
  background:var(--qa-liquid, transparent); transition:background 0.3s, height 0.3s; }
.qa-ppt { position:absolute; left:0; right:0; bottom:0; height:26%;
  background:var(--qa-ppt, transparent); filter:blur(2px); opacity:0.92;
  transition:background 0.3s; }
.qa-bubble { position:absolute; bottom:8%; width:7px; height:7px; border-radius:50%;
  background:rgba(255,255,255,0.85); animation:qaRise 1.3s linear infinite; }
.qa-bubble:nth-child(2) { left:38%; animation-delay:0.35s; }
.qa-bubble:nth-child(3) { left:60%; animation-delay:0.7s; }
@keyframes qaRise { from { transform:translateY(0); opacity:0.9; }
                    to   { transform:translateY(-120px); opacity:0; } }

.qa-result { background:var(--color-neutral-100); border-left:3px solid var(--color-accent);
  border-radius:var(--radius-sm); padding:var(--space-3); font-size:0.84em;
  line-height:1.55; margin-bottom:var(--space-3); }
.qa-note { margin-top:var(--space-2); font-size:0.92em; color:var(--color-accent-700); }
.qa-note.qa-bad { color:var(--color-accent-600); font-weight:700; }
.qa-gastools { display:flex; flex-wrap:wrap; gap:var(--space-2); margin-top:var(--space-3);
  padding-top:var(--space-3); border-top:1px dashed var(--color-divider); }
```

- [ ] **Step 2: Add the bench script**

Add a new `<script>` before `</body>`:

```html
<script>
var QA_KEY = 'hciRevisionHub.qalab';

var QA_REAGENTS = [
  { id:'water',  label:'Deionised water',        sub:'dissolve the solid' },
  { id:'hno3',   label:'Dilute nitric acid',     sub:'acidify / dissolve' },
  { id:'naoh',   label:'Aq. sodium hydroxide',   sub:'dropwise or to excess', modes:true },
  { id:'nh3',    label:'Aqueous ammonia',        sub:'dropwise or to excess', modes:true },
  { id:'agno3',  label:'Aq. silver nitrate',     sub:'halide test' },
  { id:'bano3',  label:'Aq. barium nitrate',     sub:'sulfate test' },
  { id:'na2co3', label:'Aq. sodium carbonate',   sub:'metal carbonate' },
  { id:'alfoil', label:'Excess NaOH + Al foil',  sub:'warm — nitrate test' },
  { id:'warm',   label:'Warm the tube',          sub:'' }
];

var QA_GAS_TOOLS = [
  { id:'splint',     label:'Lighted splint' },
  { id:'glowing',    label:'Glowing splint' },
  { id:'limewater',  label:'Limewater' },
  { id:'redlitmus',  label:'Moist red litmus' },
  { id:'bluelitmus', label:'Moist blue litmus' },
  { id:'kmno4',      label:'Acidified KMnO\u2084' }
];

var qaState = null;

function qaColourCss(name) {
  var map = { 'colourless':'rgba(210,230,240,0.35)', 'white':'#f2f2f0', 'green':'#7fae7f',
    'yellow-brown':'#c79a4a', 'yellow':'#ecd268', 'blue':'#5b8fd6',
    'light blue':'#9dc4e8', 'dark blue':'#274b91', 'red-brown':'#a4552c' };
  return map[name] || 'transparent';
}

/* Each test is run on a fresh portion unless the student is continuing the same row. */
function qaPortion(rowId) {
  if (!qaState.portions[rowId]) qaState.portions[rowId] = qaNewPortion();
  return qaState.portions[rowId];
}

function qaDoTest(reagent, mode) {
  var salt = qaSaltById(qaState.saltId);
  var rowId = qaState.activeRow;
  var portion = qaPortion(rowId);
  /* Test 1 dissolves the sample; every other row inherits that starting state. */
  if (reagent !== 'water' && !portion.dissolved && qaState.dissolvedOnce) {
    portion.dissolved = true;
  }
  var res = qaRunTest(salt, reagent, mode || 'excess', portion);
  if (reagent === 'water' && portion.dissolved) qaState.dissolvedOnce = true;
  if (reagent === 'hno3' && portion.dissolved) qaState.dissolvedOnce = true;
  qaState.lastResult = res;
  qaState.rowResult[rowId] = res;
  qaState.gasLine = '';   /* a new test invalidates the previous gas-tool observation */
  qaSave();
  qaBenchRender();
}

function qaDoGasTest(toolId) {
  var g = qaState.lastResult && qaState.lastResult.gas;
  var line = g && QA_GAS_TESTS[g] ? QA_GAS_TESTS[g][toolId] : 'No gas was collected to test.';
  qaState.gasLine = line;
  qaBenchRender();
}

function qaBenchRender() {
  var r = qaState.lastResult || {};
  var liquid = r.solutionColour === undefined ? 'colourless' : r.solutionColour;
  var html = '';

  html += '<h3 class="qa-benchhead">Bench</h3>';
  html += '<div class="qa-tube" style="--qa-liquid:' + qaColourCss(liquid) +
          ';--qa-ppt:' + (r.ppt ? qaColourCss(r.ppt.colour) : 'transparent') + '">' +
          '<div class="qa-liquid"></div>' +
          (r.ppt ? '<div class="qa-ppt"></div>' : '') +
          (r.gas ? '<span class="qa-bubble" style="left:20%"></span>' +
                   '<span class="qa-bubble"></span><span class="qa-bubble"></span>' : '') +
          '</div>';

  if (r.text) {
    html += '<div class="qa-result">' + qaEsc(r.text);
    if (r.note) {
      html += '<div class="qa-note' + (r.falsePositive || r.blocked ? ' qa-bad' : '') + '">' +
              qaEsc(r.note) + '</div>';
    }
    if (qaState.gasLine) html += '<div class="qa-note">' + qaEsc(qaState.gasLine) + '</div>';
    html += '</div>';
  }

  html += '<div class="qa-reagents">';
  QA_REAGENTS.forEach(function (rg) {
    if (rg.modes) {
      html += qaRgtBtn(rg.id, rg.label + ' — dropwise', rg.sub, 'dropwise');
      html += qaRgtBtn(rg.id, rg.label + ' — to excess', rg.sub, 'excess');
    } else {
      html += qaRgtBtn(rg.id, rg.label, rg.sub, null);
    }
  });
  html += '</div>';

  html += '<div class="qa-gastools">';
  QA_GAS_TOOLS.forEach(function (t) {
    html += '<button class="qa-rgt" onclick="qaDoGasTest(\'' + t.id + '\')"' +
            (r.gas ? '' : ' disabled') + '>' + qaEsc(t.label) + '</button>';
  });
  html += '</div>';

  document.getElementById('qaBench').innerHTML = html;
}

function qaRgtBtn(id, label, sub, mode) {
  return '<button class="qa-rgt" onclick="qaDoTest(\'' + id + '\'' +
         (mode ? ',\'' + mode + '\'' : '') + ')">' + qaEsc(label) +
         (sub ? '<span class="qa-sub">' + qaEsc(sub) + '</span>' : '') + '</button>';
}

/* Escapes quotes too — student text goes into `value="…"` attributes on the paper,
   and a single typed double-quote would otherwise break out of the attribute. */
function qaEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
</script>
```

- [ ] **Step 3: Verify in a browser**

Temporarily seed state from the console:

```js
qaState = { mode:'practice', saltId:'Cu2+|SO4', activeRow:'r1', portions:{}, rowResult:{},
            rows:{}, final:{}, dissolvedOnce:false, lastResult:null };
qaSave = function () {};
qaBenchRender();
```

Then check: `Deionised water` turns the tube blue; `Aqueous ammonia — dropwise` settles a light blue layer; `— to excess` turns the liquid dark blue; gas tools stay disabled. Switch `saltId` to `'Ca2+|CO3'`, click water then `Dilute nitric acid` — bubbles animate and the gas tools enable; `Limewater` then reports a white precipitate.

- [ ] **Step 4: Run the tests**

Run: `node test.js`
Expected: PASS, 47 checks.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: QA bench with CSS test tube and gas tools

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: Paper, marking UI and persistence

**Files:**
- Modify: `index.html` — bench script block, stylesheet

**Interfaces:**
- Consumes: `qaState`, `qaMarkFor`, `qaCheckRow`, `qaRunTest`, `QA_CATIONS`, `QA_ANIONS`, `QA_SALTS`, `qaEsc`, `qaBenchRender`.
- Produces: `qaStart(mode, id)`, `qaPaperRender()`, `qaSetActiveRow(id)`, `qaAddRow()`, `qaCheckPaper()`, `qaSave()`, `qaLoad()`, `qaSetMode(mode)`, `qaField(rowId, field, value)`, `qaFinal(field, value)`, `qaSelect(field, table, current)`, `QA_PRACTICE_ROWS`.
- **Forward reference:** the `'replay'` branch of `qaStart` calls `qaPaperById`, which Task 11 defines. Practice mode — the only path the boot sequence takes — works standalone. Do not click `Replay a practical` until Task 11 lands.

- [ ] **Step 1: Add the paper styles**

```css
.qa-paper h3 { margin-bottom:var(--space-3); }
.qa-table { width:100%; border-collapse:collapse; font-size:0.78em; }
.qa-table th { text-align:left; padding:8px; border-bottom:2px solid var(--color-divider);
  font-family:var(--font-heading); font-weight:400; }
.qa-table td { padding:8px; border-bottom:1px solid var(--color-divider);
  vertical-align:top; }
.qa-table tr.qa-active td { background:var(--color-accent-100); }
.qa-test { width:44px; font-weight:700; }
.qa-proc { width:38%; color:var(--color-neutral-700); }
.qa-obs, .qa-inf { width:100%; font-family:inherit; font-size:1em; color:var(--color-text);
  background:var(--color-neutral-100); border:1px solid var(--color-divider);
  border-radius:var(--radius-sm); padding:6px 8px; resize:vertical; }
.qa-obs { min-height:62px; }
.qa-mark { display:block; margin-top:4px; font-size:0.9em; font-weight:700; }
.qa-mark.ok  { color:var(--color-accent-2-700); }
.qa-mark.bad { color:var(--color-accent-600); }
.qa-model { display:block; margin-top:4px; font-size:0.9em; color:var(--color-neutral-700);
  font-style:italic; }
.qa-final { margin-top:var(--space-4); padding-top:var(--space-4);
  border-top:2px solid var(--color-divider); display:flex; flex-wrap:wrap;
  gap:var(--space-2); align-items:center; font-size:0.82em; }
.qa-score { font-family:var(--font-heading); font-size:1.5em; margin-top:var(--space-3); }
.qa-actions { display:flex; gap:var(--space-2); margin-top:var(--space-3); flex-wrap:wrap; }
```

- [ ] **Step 2: Add the paper script**

Append to the Task 9 `<script>`:

```js
var QA_PRACTICE_ROWS = [
  { id:'r1',  test:'1',    proc:'Add 1 spatula of the unknown to a boiling tube and add deionised water till about one-third filled. Stir with a glass rod. Divide the solution into at least six portions in separate test tubes.' },
  { id:'r2a', test:'2(a)', proc:'To a fresh portion, add aqueous sodium hydroxide gradually until no further change.' },
  { id:'r2b', test:'2(b)', proc:'To a fresh portion, add aqueous ammonia gradually until no further change.' },
  { id:'r3a', test:'3(a)', proc:'To a fresh portion, add 1 cm depth of dilute nitric acid.' },
  { id:'r3b', test:'3(b)', proc:'To a fresh portion, add 1 cm depth of aqueous barium nitrate.' },
  { id:'r3c', test:'3(c)', proc:'To a fresh portion, add 1 cm depth of aqueous silver nitrate.' }
];

function qaSave() {
  try { window.localStorage.setItem(QA_KEY, JSON.stringify({
    mode: qaState.mode, saltId: qaState.saltId, script: qaState.script,
    rows: qaState.rows, final: qaState.final, activeRow: qaState.activeRow,
    label: qaState.label, aim: qaState.aim, paperId: qaState.paperId })); } catch (e) {}
}

function qaLoad() {
  try {
    var s = JSON.parse(window.localStorage.getItem(QA_KEY) || 'null');
    /* script must be a usable array — qaPaperRender runs outside this try/catch, so a
       corrupt stored script would throw uncaught and kill the page before it renders. */
    if (!s || !qaSaltById(s.saltId) || !Array.isArray(s.script) || !s.script.length) return false;
    qaState = { mode:s.mode || 'practice', saltId:s.saltId, script:s.script || QA_PRACTICE_ROWS,
      rows:s.rows || {}, final:s.final || {}, activeRow:s.activeRow || 'r1',
      label:s.label || 'FA1', aim:s.aim || '',
      /* Validate at the trust boundary, like saltId and script above — qaStart's replay
         branch dereferences qaPaperById(paperId) without a guard. */
      paperId: qaPaperById(s.paperId) ? s.paperId : undefined,
      portions:{}, rowResult:{},
      dissolvedOnce:false, lastResult:null, gasLine:'' };
    return true;
  } catch (e) { return false; }
}

function qaStart(mode, id) {
  var m = mode || (qaState && qaState.mode) || 'practice';
  var salt;
  if (m === 'replay') {
    /* Fall back to the paper already open — the Reset button calls qaStart() with no
       arguments, and defaulting straight to 'e35' would silently switch practicals. */
    var paper = qaPaperById(id || (qaState && qaState.paperId) || 'e35');
    qaState = { mode:'replay', saltId:paper.saltId, script:paper.rows, label:paper.label,
      aim:paper.aim, paperId:paper.id, rows:{}, final:{}, activeRow:paper.rows[0].id,
      portions:{}, rowResult:{}, dissolvedOnce:false, lastResult:null, gasLine:'' };
  } else {
    salt = QA_SALTS[Math.floor(Math.random() * QA_SALTS.length)];
    qaState = { mode:'practice', saltId:salt.id, script:QA_PRACTICE_ROWS.slice(),
      label:'FA1', aim:'To identify the cation and the anion in FA1.',
      rows:{}, final:{}, activeRow:'r1', portions:{}, rowResult:{},
      dissolvedOnce:false, lastResult:null, gasLine:'' };
  }
  qaSave();
  qaPaperRender();
  qaBenchRender();
}

function qaSetMode(mode) {
  document.getElementById('qaModePractice').className =
    'qa-modebtn' + (mode === 'practice' ? ' qa-on' : '');
  document.getElementById('qaModeReplay').className =
    'qa-modebtn' + (mode === 'replay' ? ' qa-on' : '');
  document.getElementById('qaReplayPick').style.display = mode === 'replay' ? '' : 'none';
  qaStart(mode, mode === 'replay' ? document.getElementById('qaReplayPick').value : null);
}

/* Swap the highlight class rather than re-rendering. A full re-render here would
   destroy the textarea the student just clicked into and steal their focus. */
function qaSetActiveRow(id) {
  if (qaState.activeRow === id) return;
  qaState.activeRow = id;
  qaState.gasLine = '';
  var rows = document.querySelectorAll('#qaPaper tbody tr');
  for (var i = 0; i < rows.length; i++) rows[i].className = '';
  var el = document.getElementById('qarow-' + id);
  if (el) el.className = 'qa-active';
}

function qaField(rowId, field, value) {
  if (!qaState.rows[rowId]) qaState.rows[rowId] = { obs:'', inf:'' };
  qaState.rows[rowId][field] = value;
  qaSave();
}

function qaAddRow() {
  qaState.script.push({ id:'x' + qaState.script.length, test:'+',
    proc:'Your own test — describe what you did.' });
  qaSave();
  qaPaperRender();
}

function qaPaperRender() {
  var s = qaState, html = '';
  html += '<h3>' + qaEsc(s.label) + ' — practical paper</h3>';
  if (s.aim) html += '<p class="qa-intro"><strong>Aim</strong> ' + qaEsc(s.aim) + '</p>';
  html += '<table class="qa-table"><thead><tr><th class="qa-test">Test</th>' +
          '<th class="qa-proc">Procedure</th><th>Observations</th>' +
          '<th>Inference / Conclusion</th></tr></thead><tbody>';

  s.script.forEach(function (row) {
    var v = s.rows[row.id] || { obs:'', inf:'' };
    var g = s.graded && s.graded[row.id];
    html += '<tr id="qarow-' + row.id + '" class="' +
            (s.activeRow === row.id ? 'qa-active' : '') +
            '" onclick="qaSetActiveRow(\'' + row.id + '\')">';
    html += '<td class="qa-test">' + qaEsc(row.test) + '</td>';
    html += '<td class="qa-proc">' + qaEsc(row.proc) + '</td>';
    html += '<td><textarea class="qa-obs" oninput="qaField(\'' + row.id +
            '\',\'obs\',this.value)">' + qaEsc(v.obs) + '</textarea>';
    if (g) {
      html += '<span class="qa-mark ' + (g.pass ? 'ok' : 'bad') + '">' +
              (g.pass ? '\u2713 correct' : '\u2717 ' + g.missing + ' point(s) missing') + '</span>';
      html += '<span class="qa-model">Model: ' + qaEsc(g.model) + '</span>';
    }
    html += '</td>';
    html += '<td><input class="qa-inf" value="' + qaEsc(v.inf) +
            '" oninput="qaField(\'' + row.id + '\',\'inf\',this.value)"></td>';
    html += '</tr>';
  });
  html += '</tbody></table>';

  html += '<div class="qa-actions"><button class="qa-modebtn" onclick="qaAddRow()">' +
          '+ Add a test</button></div>';

  html += '<div class="qa-final"><span>' + qaEsc(s.label) + ' contains cation</span>' +
          qaSelect('cat', QA_CATIONS, s.final.cat) +
          '<span>and anion</span>' + qaSelect('an', QA_ANIONS, s.final.an) + '</div>';

  html += '<div class="qa-actions">' +
          '<button class="qa-modebtn qa-on" onclick="qaCheckPaper()">Check my work</button>' +
          '<button class="qa-modebtn" onclick="qaStart()">Reset</button></div>';

  if (s.score) {
    html += '<div class="qa-score">' + s.score.got + ' / ' + s.score.total + '</div>';
    html += '<p class="qa-intro">' + qaEsc(s.score.verdict) + '</p>';
  }

  document.getElementById('qaPaper').innerHTML = html;
}

function qaSelect(field, table, current) {
  var h = '<select class="qa-select" onchange="qaFinal(\'' + field + '\',this.value)">' +
          '<option value="">— choose —</option>';
  for (var k in table) {
    if (!table.hasOwnProperty(k)) continue;
    h += '<option value="' + k + '"' + (current === k ? ' selected' : '') + '>' +
         qaEsc(table[k].name + ' (' + table[k].label + ')') + '</option>';
  }
  return h + '</select>';
}

function qaFinal(field, value) { qaState.final[field] = value; qaSave(); }

function qaCheckPaper() {
  var s = qaState, salt = qaSaltById(s.saltId);
  s.graded = {};
  var got = 0, total = 0;

  s.script.forEach(function (row) {
    var res = s.rowResult[row.id];
    if (!res) return;                       /* not attempted on the bench — not marked */
    var v = s.rows[row.id] || { obs:'' };
    var g = qaCheckRow(v.obs, qaMarkFor(res));
    s.graded[row.id] = { pass:g.pass, missing:g.missing, model:res.text };
    total++; if (g.pass) got++;
  });

  total += 2;
  if (s.final.cat === salt.cat) got++;
  if (s.final.an === salt.an) got++;

  var right = s.final.cat === salt.cat && s.final.an === salt.an;
  s.score = { got:got, total:total,
    verdict: right
      ? 'Correct — ' + s.label + ' is ' + salt.name + '.'
      : s.label + ' is ' + salt.name + '. Compare each model observation with what you wrote.' };
  qaSave();
  qaPaperRender();
}
```

- [ ] **Step 3: Boot the simulator**

Append to the same script:

```js
if (!qaLoad()) qaStart('practice');
qaPaperRender();
qaBenchRender();
```

- [ ] **Step 4: Verify in a browser**

Work a full unknown end to end: click row 2(a), run `Aq. sodium hydroxide — to excess` on the bench, write the observation in that row, repeat for the other rows, choose a cation and anion, and press `Check my work`. Confirm the score appears, correct rows show ✓ and wrong rows show ✗ with the model answer, and reloading the page restores everything you typed. Then press `Reset` and confirm a different unknown appears.

- [ ] **Step 5: Run the tests**

Run: `node test.js`
Expected: PASS, 47 checks.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: QA paper with derived marking, scoring and resume

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11: Replay modes for E3.5, E3.7 and E3.9

**Files:**
- Modify: `index.html` — paper script block
- Modify: `test.js`

**Interfaces:**
- Consumes: `QA_SALTS`, `qaSaltById`, `qaStart`.
- Produces: `QA_PAPERS` — array of `{id, name, label, aim, saltId, rows, questions}`; `qaPaperById(id)`.

- [ ] **Step 1: Write the failing test**

Append to `test.js`:

```js
/* ---- replay papers ---- */
var P = load(['QA-ENGINE', 'QA-PAPERS'], ['QA_PAPERS', 'qaPaperById', 'qaSaltById']);

check('all three practicals are available', function () {
  assert.strictEqual(P.QA_PAPERS.length, 3);
  ['e35', 'e37', 'e39'].forEach(function (id) {
    assert.ok(P.qaPaperById(id), 'missing paper ' + id);
  });
});

check('the replay answers match the real practicals', function () {
  assert.strictEqual(P.qaPaperById('e35').saltId, 'Ca2+|Cl', 'E3.5 FA1 is calcium chloride');
  assert.strictEqual(P.qaPaperById('e37').saltId, 'Cu2+|NO3', 'E3.7 FA2 is copper(II) nitrate');
  assert.strictEqual(P.qaPaperById('e39').saltId, 'Zn2+|CO3', 'E3.9 FA2 is zinc carbonate');
});

check('E3.9 uses an insoluble unknown so the acid-dissolve path is exercised', function () {
  assert.strictEqual(P.qaSaltById(P.qaPaperById('e39').saltId).soluble, false);
});

check('every paper has rows with unique ids and real procedure text', function () {
  P.QA_PAPERS.forEach(function (p) {
    assert.ok(p.rows.length >= 4, p.id + ' has too few rows');
    var seen = {};
    p.rows.forEach(function (r) {
      assert.ok(!seen[r.id], p.id + ' has duplicate row id ' + r.id);
      seen[r.id] = 1;
      assert.ok(r.test && r.proc && r.proc.length > 20, p.id + '/' + r.id + ' is under-specified');
    });
    assert.ok(p.label && p.aim, p.id + ' is missing a label or aim');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test.js`
Expected: FAIL — `marker block QA-PAPERS not found in index.html`.

- [ ] **Step 3: Add the papers**

Add to the paper script block, wrapped in its own markers:

```js
/* == QA-PAPERS-START == */
/* Transcribed from the 2026 HCI Sec 3 practicals. Answers: E3.5 FA1 calcium chloride,
   E3.7 FA2 copper(II) nitrate, E3.9 FA1 calcium chloride and FA2 zinc carbonate. */
var QA_PAPERS = [
  { id:'e35', name:'E3.5 — Unknown salt FA1', label:'FA1', saltId:'Ca2+|Cl',
    aim:'To identify salt FA1 and determine the substance used for swimming pools.',
    rows:[
      { id:'r1',  test:'1',    proc:'Add 1 spatula of FA1 to a boiling tube and add deionised water till about one-third filled. Stir with a glass rod. Divide the solution into at least six portions (of 1 cm depth) in separate test tubes for subsequent tests.' },
      { id:'r2a', test:'2(a)', proc:'To a fresh portion, add aqueous sodium hydroxide gradually until no further change.' },
      { id:'r2b', test:'2(b)', proc:'To a fresh portion, add aqueous ammonia gradually until no further change.' },
      { id:'r3a', test:'3(a)', proc:'To a fresh portion, add 1 cm depth of nitric acid.' },
      { id:'r3b', test:'3(b)', proc:'To a fresh portion, add 1 cm depth of aqueous barium nitrate.' },
      { id:'r3c', test:'3(c)', proc:'To a fresh portion, add 1 cm depth of aqueous silver nitrate.' },
      { id:'r4',  test:'4',    proc:'To a fresh portion, add an equal volume of aqueous sodium carbonate.' }
    ],
    questions:[
      'Identify FA1 from your observations above.',
      'Suggest why the solutions in Tests 3(b) and 3(c) do not need to be acidified, unlike the usual instructions for such tests.'
    ] },

  { id:'e37', name:'E3.7 — Unknown salt FA2', label:'FA2', saltId:'Cu2+|NO3',
    aim:'To identify the cation and anion of salt FA2 and determine the material for a water pipe.',
    rows:[
      { id:'r1',  test:'1',    proc:'Add 1 spatula of FA2 to a boiling tube and add deionised water till one-third filled. Stir with a glass rod. Separate the solution into several portions in separate test tubes for subsequent tests.' },
      { id:'r2a', test:'2(a)', proc:'To 1 cm depth of a fresh portion, add aqueous sodium hydroxide gradually until no further change.' },
      { id:'r2b', test:'2(b)', proc:'To 1 cm depth of a fresh portion, add aqueous ammonia gradually until no further change.' },
      { id:'r3a', test:'3(a)', proc:'To 1 cm depth of a fresh portion, add a few drops of acidified barium nitrate.' },
      { id:'r3b', test:'3(b)', proc:'To 1 cm depth of a fresh portion, add a few drops of acidified silver nitrate.' },
      { id:'r3c', test:'3(c)', proc:'To 1 cm depth of a fresh portion, add an excess of aqueous sodium hydroxide, a piece of aluminium foil, and heat the mixture gently (stop heating before the mixture boils). Use a boiling tube for this test.' }
    ],
    questions:[
      'Identify salt FA2 and deduce the material which the pipe is made of.',
      'Suggest why an excess of aqueous sodium hydroxide is added for Test 3(c).'
    ] },

  { id:'e39', name:'E3.9 — Two unknowns (insoluble FA2)', label:'FA2', saltId:'Zn2+|CO3',
    aim:'The labels of two bottles have fallen off. One solid is soluble in water, the other is not. Identify the insoluble unknown FA2.',
    rows:[
      { id:'r1',  test:'1',    proc:'Add 1 spatula of FA2 to a boiling tube. Add deionised water till about one-third filled and mix well with a glass rod. Determine whether the unknown is soluble in water.' },
      { id:'r3a', test:'3(a)', proc:'Add one spatula of a FRESH sample of the insoluble unknown to a test tube. Add a minimum volume of dilute nitric acid to completely dissolve the solid. Add deionised water till about one-third filled and stir thoroughly with a clean glass rod.' },
      { id:'r3b', test:'3(b)', proc:'To a fresh portion of the solution from Test 3(a), add dilute sodium hydroxide gradually until no further change.' },
      { id:'r3c', test:'3(c)', proc:'To a fresh portion of the solution from Test 3(a), add aqueous ammonia gradually until no further change.' }
    ],
    questions:[
      'Determine the unknown FA2.',
      'Write a balanced ionic equation for the reaction taking place in Test 3(a).'
    ] }
];

function qaPaperById(id) {
  for (var i = 0; i < QA_PAPERS.length; i++) { if (QA_PAPERS[i].id === id) return QA_PAPERS[i]; }
  return undefined;
}
/* == QA-PAPERS-END == */
```

- [ ] **Step 4: Populate the replay picker and show the questions**

Add to the same script, and call `qaBuildReplayPicker()` from the boot sequence added in Task 10 Step 3:

```js
function qaBuildReplayPicker() {
  var sel = document.getElementById('qaReplayPick');
  sel.innerHTML = '';
  QA_PAPERS.forEach(function (p) {
    var o = document.createElement('option');
    o.value = p.id; o.textContent = p.name;
    sel.appendChild(o);
  });
  /* Keep the dropdown showing the paper actually open, or a reload mid-E3.7 displays
     E3.5 while the paper underneath is something else. */
  if (qaState && qaState.paperId) sel.value = qaState.paperId;
}
```

In `qaPaperRender`, immediately before the `qa-final` block, append the questions when the paper has them:

```js
  if (s.paperId) {
    var paper = qaPaperById(s.paperId);
    if (paper && paper.questions.length) {
      html += '<div class="qa-actions" style="flex-direction:column;align-items:stretch;">';
      html += '<h3 style="margin-top:var(--space-4);">Questions</h3>';
      paper.questions.forEach(function (q, i) {
        var key = 'q' + i;
        var val = (s.rows[key] || {}).obs || '';
        html += '<p class="qa-intro">' + (i + 1) + '. ' + qaEsc(q) + '</p>';
        html += '<textarea class="qa-obs" oninput="qaField(\'' + key +
                '\',\'obs\',this.value)">' + qaEsc(val) + '</textarea>';
      });
      html += '</div>';
    }
  }
```

Questions are recorded but not auto-marked — they are extended-response, and keyword matching would be worse than useless on "suggest why".

- [ ] **Step 5: Run the tests**

Run: `node test.js`
Expected: PASS, 51 checks.

- [ ] **Step 6: Verify in a browser**

Switch to `Replay a practical`, pick E3.9. Confirm: Test 1 with deionised water reports a suspension; running NaOH before dissolving is blocked with an explanation; dilute nitric acid on the fresh sample effervesces and unblocks the solution tests; NaOH and ammonia to excess both dissolve the white precipitate; `Check my work` identifies zinc carbonate. Then run E3.7 and confirm the aluminium foil test evolves ammonia, and E3.5 and confirm silver nitrate gives a white precipitate.

- [ ] **Step 7: Commit**

```bash
git add index.html test.js
git commit -m "feat: replay modes for practicals E3.5, E3.7 and E3.9

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 12: Replace the React app and switch GitHub Pages to branch deploy

**Files:**
- Delete: `src/`, `public/`, `scripts/`, `skills/`, `docs/`, `.github/workflows/`, `package.json`, `bun.lock`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `vitest.config.ts`, `components.json`, `.prettierrc`, `.prettierignore`, `AGENTS.md`, `Revision_Hub__Chemistry_and_Physics.html`, their `index.html`
- Create: `docs/superpowers/specs/2026-08-01-revision-hub-v2-design.md`, `docs/superpowers/plans/2026-08-01-revision-hub-v2.md`
- Modify: `README.md`

- [ ] **Step 1: Confirm the final state passes everything**

```bash
node test.js
```

Expected: PASS, 51 checks. Do not proceed on a red test.

- [ ] **Step 2: Remove the React application**

```bash
cd "/home/tanxy/Documents/Tan Xin Yang/GitHub/chemistry-revision-hub"
git rm -r --quiet src public scripts skills docs .github
git rm --quiet package.json bun.lock vite.config.ts eslint.config.js vitest.config.ts \
  components.json .prettierrc .prettierignore AGENTS.md \
  "Revision_Hub__Chemistry_and_Physics.html"
git rm --quiet tsconfig.json tsconfig.app.json tsconfig.node.json
git status --short
```

`docs/`, `skills/` and `AGENTS.md` all document the React codebase, which no longer exists. `README.md`, `LICENSE`, `.gitignore` stay. If `git rm` reports a path that does not exist, drop it from the command — the file listing came from the GitHub web view and may be slightly stale.

Note: their `index.html` was overwritten by ours in Task 2, so it is already staged as a modification rather than a deletion.

- [ ] **Step 3: Bring the spec and plan into the repo**

```bash
mkdir -p docs/superpowers/specs docs/superpowers/plans
cp "../Revision_Hub/docs/superpowers/specs/2026-08-01-revision-hub-v2-design.md" docs/superpowers/specs/
cp "../Revision_Hub/docs/superpowers/plans/2026-08-01-revision-hub-v2.md" docs/superpowers/plans/
```

- [ ] **Step 4: Rewrite the README**

Replace `README.md` with:

```markdown
# Chemistry Revision Hub

A single-file revision hub for O-Level / IP Chemistry and Physics.
Live at <https://o2bubble1.github.io/chemistry-revision-hub/>.

Everything is `index.html` — open it in a browser and it works. No build step, no
dependencies, no server. Fonts are inlined as data URIs so it works offline.

## What's in it

- **Chemistry** — qualitative analysis (cations, anions, gases), a practical simulator,
  salt preparation, solubility rules, pH indicators, oxides, bonding, a clickable periodic table
- **Physics** — kinematics, motion graphs, equations of motion, forces, Newton's laws,
  friction, work/energy/power
- **Tools** — flashcards, quizzes, model answers, a typography panel, and a light/dark theme

## Practical simulator

Pick an unknown salt, run reagents on the bench, and write up what you observe in a
replica of the real practical paper. `Check my work` marks your observations against the
model answers. Practice mode randomises the unknown; replay mode reproduces practicals
E3.5, E3.7 and E3.9.

## Development

```bash
node test.js   # zero-dependency checks over index.html
```

Edit `index.html` directly. `test.js` extracts marker-delimited script blocks
(`/* == QA-ENGINE-START == */` and friends) and asserts against them, so keep those
comments intact.
```

- [ ] **Step 5: Commit and merge to main**

```bash
git add -A
git commit -m "feat: replace React app with the single-file revision hub

Adds a typography panel and a qualitative analysis practical simulator.
The previous Vite/React implementation remains in git history.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"

git checkout main
git merge revision-hub-v2
git push origin main
```

- [ ] **Step 6: Switch the Pages source**

This is a web-UI step and cannot be scripted here. In the browser:

1. Go to <https://github.com/O2bubble1/chemistry-revision-hub/settings/pages>
2. Under **Build and deployment ▸ Source**, change **GitHub Actions** to **Deploy from a branch**
3. Set branch to `main` and folder to `/ (root)`, then **Save**

Skipping this leaves Pages pointed at a workflow that no longer exists, and the site will
break rather than update.

- [ ] **Step 7: Verify the live site**

Wait about a minute, then open <https://o2bubble1.github.io/chemistry-revision-hub/> and confirm:

- The page loads with no "Unpacking…" splash.
- Headings render in Caprasimo and body text in Figtree — from the inlined data URIs, with no font request in the Network tab.
- The `Aa` panel changes fonts, and a Google family such as Lexend loads and applies.
- The `Practical Sim` tab runs a full unknown and marks it.
- Reloading preserves the theme, font and in-progress attempt.

The site is served from a subpath (`/chemistry-revision-hub/`), not a domain root, so any
root-relative asset path would 404. Confirm there are none:

```bash
grep -n 'src="/[^/]\|href="/[^/]' index.html
```

Expected: no output.

- [ ] **Step 8: Clean up the branch**

```bash
git branch -d revision-hub-v2
git push origin --delete revision-hub-v2 2>/dev/null || true
```
