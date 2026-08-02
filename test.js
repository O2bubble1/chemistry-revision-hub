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
    'White precipitate formed, dissolves in excess to give a colourless solution, but is insoluble.').pass, false,
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
  assert.strictEqual(graded('Ca2+|Cl', 'nh3', 'excess',
    'White precipitate formed but nothing dissolved.').pass, false);
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

check('a dissolve is marked as a positive observation, not a no-change', function () {
  var mk = M.qaMarkFor(M.qaRunTest(M.qaSaltById('Ca2+|Cl'), 'water', null, M.qaNewPortion()));
  assert.strictEqual(M.qaCheckRow('The solid dissolved to form a colourless solution.', mk).pass, true);
  assert.strictEqual(M.qaCheckRow('No change was observed.', mk).pass, false);
});

check('a coloured solution must be named', function () {
  var mk = M.qaMarkFor(M.qaRunTest(M.qaSaltById('Cu2+|SO4'), 'water', null, M.qaNewPortion()));
  assert.strictEqual(M.qaCheckRow('The solid dissolved to form a blue solution.', mk).pass, true);
  assert.strictEqual(M.qaCheckRow('The solid dissolved to form a solution.', mk).pass, false);
});

check('an insoluble solid may be described as a suspension', function () {
  var mk = M.qaMarkFor(M.qaRunTest(M.qaSaltById('Zn2+|CO3'), 'water', null, M.qaNewPortion()));
  assert.strictEqual(M.qaCheckRow('The solid did not dissolve. A white suspension was formed.', mk).pass, true);
  assert.strictEqual(M.qaCheckRow('It dissolved completely.', mk).pass, false);
});

console.log('\n' + checks + ' checks passed');
