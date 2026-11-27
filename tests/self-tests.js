#!/usr/bin/env node
/* self-tests — Babel. SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0 · (c) 2026 Dr Sohil Momin
 * Done-means: each of the ten reference signs produces its own word as the top caption and no two share a top
 * result; a hand outside the vocabulary returns 'not recognised' rather than a guess; typing a word renders an
 * avatar whose handshape matches that word's stored reference; everything runs with the network off. */
"use strict";
var fs = require("fs"), path = require("path");
var ROOT = path.join(__dirname, "..");
var B = require(path.join(ROOT, "docs", "play", "babel-core.js"));
var passed = 0, failed = [], group = "";
function section(n) { group = n; }
function ok(n, c, d) { if (c) { passed++; return; } failed.push(group + " :: " + n + (d ? " — " + d : "")); }
function eq(n, a, b) { ok(n, a === b, "expected " + JSON.stringify(b) + ", got " + JSON.stringify(a)); }
function read(f) { return fs.readFileSync(path.join(ROOT, f), "utf8"); }

section("done means — each of the ten reference signs produces its own word");
var refs = B.reference();
eq("ten signs", refs.length, 10);
eq("each hand has 21 points", refs.every(function (r) { return r.points.length === 21; }), true);
var tops = refs.map(function (r) { return B.recognise(r.points); });
refs.forEach(function (r, i) {
  eq("\u201c" + r.word + "\u201d is recognised as itself", tops[i].word, r.word);
  eq("and it is the top caption", tops[i].caption, r.word);
});
eq("no two signs share a top result", new Set(tops.map(function (t) { return t.word; })).size, 10);
eq("all ten are recognised", tops.filter(function (t) { return t.recognised; }).length, 10);

section("done means — a hand outside the vocabulary returns 'not recognised'");
function weird() { var a = []; for (var i = 0; i < 21; i++) a.push([Math.sin(i * 2.1) * 0.9, Math.cos(i * 1.3) * 0.9]); return a; }
var w = B.recognise(weird());
eq("it is not recognised", w.recognised, false);
eq("the caption says so", w.caption, "not recognised");
ok("and no word is offered", w.word === undefined, w.word);
ok("the reason names the threshold", /threshold/.test(w.says), w.says);
ok("and says a guess would be worse", /worse than nothing/.test(w.says), w.says);
eq("a hand with the wrong number of points is refused", B.recognise([[0, 0]]).ok, false);
eq("nothing at all is refused", B.recognise(null).ok, false);

section("done means — typing a word renders its stored handshape");
B.vocabulary().forEach(function (v) {
  var a = B.avatar(v.word);
  eq("\u201c" + v.word + "\u201d has an avatar", a.ok, true);
  eq("with 21 points", a.points.length, 21);
  var ref = refs.filter(function (r) { return r.word === v.word; })[0];
  eq("and it matches the stored reference exactly", JSON.stringify(a.points), JSON.stringify(ref.points));
  eq("which recognises back to the same word", B.recognise(a.points).word, v.word);
});
var unknown = B.avatar("ladder");
eq("a word outside the ten is refused", unknown.ok, false);
eq("and marked as not in the vocabulary", unknown.notInVocabulary, true);
ok("and it says it will not invent a hand", /will not invent one/.test(unknown.reason), unknown.reason);
eq("an empty word is refused", B.avatar("  ").field, "word");

section("done means — everything runs with the network off");
var core = read("docs/play/babel-core.js");
ok("no fetch, XHR, WebSocket or beacon", !/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|EventSource/.test(core.replace(/\/\*[\s\S]*?\*\//g, "") + read("docs/play/app.js")));
ok("no URL in the engine", !/https?:\/\//.test(core));
ok("the page forbids connections", /connect-src 'none'/.test(read("docs/play/index.html")));
ok("no camera or model", !/getUserMedia|MediaRecorder|tensorflow|onnx|modelUrl/i.test(core + read("docs/play/app.js")));

section("the honest limit is stated");
ok("the engine says the signs are synthetic", /SYNTHETIC 21-point handshapes/.test(core));
ok("and that it is not a sign language", /not a claim about any sign language/.test(core));
ok("the page says the same", /not a claim about any sign language/.test(read("docs/play/index.html")));
ok("and says there is no camera", /There is no camera here/.test(read("docs/play/index.html")));

section("the distance is a distance");
eq("a hand is zero from itself", B.distance(refs[0].points, refs[0].points), 0);
ok("and further from another sign", B.distance(refs[0].points, refs[1].points) > 0);
eq("a malformed hand is infinitely far", B.distance([[0, 0]], refs[0].points), Infinity);

section("storage");
var bad = B.parseState("{ broken history");
eq("a broken history is reported", bad.ok, false);
eq("it is marked unreadable", bad.unreadable, true);
ok("it was not replaced with an empty one", /NOT replaced with an empty one/.test(bad.reason), bad.reason);
eq("nothing saved yet is distinguished", B.parseState("").empty, true);
var round = B.parseState(B.serialize([{ word: "water", on: "27/11/2026" }]));
eq("the history round-trips", round.history.length, 1);
var thrown = B.exportFile("history", { history: [] }, { when: "27/11/2026" }, function () { var e = new Error("q"); e.name = "QuotaExceededError"; throw e; });
eq("a failed write is reported", thrown.ok, false);

section("shape — every script the page loads exists beside it");
var page = read("docs/play/index.html");
var srcs = (page.match(/<script[^>]+src="([^"]+)"/g) || []).map(function (t) { return t.replace(/.*src="([^"]+)"/, "$1"); });
srcs.forEach(function (x) { ok("script src resolves: " + x, fs.existsSync(path.join(ROOT, "docs", "play", x.replace(/^\.\//, "")))); });
ok("the landing page exists", fs.existsSync(path.join(ROOT, "docs", "index.html")));
ok("the page manifest exists", fs.existsSync(path.join(ROOT, "PAGES.json")));
ok("the web manifest exists", fs.existsSync(path.join(ROOT, "docs", "play", "manifest.webmanifest")));

var total = passed + failed.length;
if (!total) { console.error("self-tests: 0 assertions ran."); process.exit(1); }
if (failed.length) { console.error("self-tests: " + passed + "/" + total + " passed, " + failed.length + " FAILED"); failed.slice(0, 12).forEach(function (f) { console.error("  FAIL " + f); }); process.exit(1); }
console.log("self-tests: " + passed + "/" + total + " assertions passed");
