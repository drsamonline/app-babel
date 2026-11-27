#!/usr/bin/env node
/* ui-tests — the Babel page in a real DOM (jsdom). SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0 · (c) 2026 Dr Sohil Momin */
"use strict";
var fs = require("fs"), path = require("path"), { JSDOM } = require("jsdom");
var ROOT = path.join(__dirname, ".."), PLAY = path.join(ROOT, "docs", "play");
var passed = 0, failed = [];
function ok(n, c, d) { if (c) { passed++; return; } failed.push(n + (d ? " — " + d : "")); }
function eq(n, a, b) { ok(n, a === b, "expected " + JSON.stringify(b) + ", got " + JSON.stringify(a)); }
function build(seed) {
  var dom = new JSDOM(fs.readFileSync(path.join(PLAY, "index.html"), "utf8"), { url: "https://example.test/play/index.html", runScripts: "outside-only", pretendToBeVisual: true });
  var w = dom.window;
  if (seed) Object.keys(seed).forEach(function (k) { w.localStorage.setItem(k, seed[k]); });
  w.URL.createObjectURL = function () { return "blob:x"; }; w.URL.revokeObjectURL = function () {};
  w.HTMLAnchorElement.prototype.click = function () {};
  ["web-kit.js", "export-kit.js", "babel-core.js", "app.js"].forEach(function (f) { w.eval(fs.readFileSync(path.join(PLAY, f), "utf8")); });
  return dom;
}
var dom = build(null), w = dom.window, d = w.document, $ = function (id) { return d.getElementById(id); };
ok("the engine loaded", !!w.BabelCore);
eq("ten hand buttons", d.querySelectorAll("#handButtons button").length, 10);
ok("the vocabulary is listed", /water/.test($("vocab").textContent), $("vocab").textContent);
ok("the limit is stated on the page", /synthetic handshapes/.test(d.body.textContent));

d.querySelectorAll("#handButtons button")[3].click();
eq("the reference is recognised as itself", $("caption").textContent, "water");
ok("and the app says how near it was", /nearest reference at/.test($("recogniseSays").textContent), $("recogniseSays").textContent);

$("noiseBtn").click();
eq("a hand outside the vocabulary is not recognised", $("caption").textContent, "not recognised");
ok("and no guess is made", /worse than nothing/.test($("recogniseSays").textContent), $("recogniseSays").textContent);

$("word").value = "water"; $("avatarBtn").click();
ok("typing a word shows a hand", !$("hand").hidden);
ok("with polylines drawn", d.querySelectorAll("#hand polyline").length >= 5, d.querySelectorAll("#hand polyline").length);
ok("and it says which", /Showing \u201cwater\u201d/.test($("avatarSays").textContent), $("avatarSays").textContent);

$("word").value = "ladder"; $("avatarBtn").click();
ok("a word outside the ten is refused", /not one of the ten signs/.test($("status").textContent), $("status").textContent);
ok("and the hand is hidden", $("hand").hidden);

$("exportBtn").click();
ok("the history exports", /Wrote babel-\d{4}-\d\d-\d\d\.json/.test($("ioNote").textContent), $("ioNote").textContent);
var saved = w.localStorage.getItem("babel:history");
var dom2 = build({ "babel:history": saved });
var d2 = dom2.window.document;
d2.querySelectorAll("#handButtons button")[0].click();
eq("the page works after a reload", d2.getElementById("caption").textContent, "hello");

var dom3 = build({ "babel:history": "{ broken history" });
var d3 = dom3.window.document;
ok("a broken history is reported", /cannot be read/.test(d3.getElementById("status").textContent));
ok("and not replaced with an empty one", /NOT replaced with an empty one/.test(d3.getElementById("status").textContent));

var dom4 = build(null), w4 = dom4.window, d4 = dom4.window.document;
Object.defineProperty(w4, "localStorage", { configurable: true, get: function () {
  return { getItem: function () { return null; }, setItem: function () { var e = new Error("q"); e.name = "QuotaExceededError"; throw e; }, removeItem: function () {}, clear: function () {} }; } });
d4.querySelectorAll("#handButtons button")[0].click();
ok("a failed save says NOT SAVED", /NOT SAVED:/.test(d4.getElementById("status").textContent), d4.getElementById("status").textContent);

var total = passed + failed.length;
if (!total) { console.error("ui-tests: 0 assertions ran."); process.exit(1); }
if (failed.length) { console.error("ui-tests: " + passed + "/" + total + " passed, " + failed.length + " FAILED"); failed.forEach(function (f) { console.error("  FAIL " + f); }); process.exit(1); }
console.log("ui-tests: " + passed + "/" + total + " assertions passed");
