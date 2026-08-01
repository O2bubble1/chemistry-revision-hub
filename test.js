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

console.log('\n' + checks + ' checks passed');
