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

console.log('\n' + checks + ' checks passed');
