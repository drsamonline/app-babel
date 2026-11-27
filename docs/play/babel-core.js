/* babel-core — the engine behind Babel.
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * (c) 2026 Dr Sohil Momin
 *
 * ONE JOB: recognise a hand from a small vocabulary of ten signs, and show a hand for a word.
 *
 * WHAT THIS IS NOT: there is no trained sign-language model in this estate, and no camera. The ten
 * "reference signs" are SYNTHETIC 21-point handshapes — a geometric sketch, not a recording of a real signer
 * and not a claim about any sign language. They demonstrate the recognition and the avatar, and the page,
 * NOTICE and README say exactly that.
 *
 * A HAND OUTSIDE THE VOCABULARY IS REFUSED, not guessed: if the nearest reference is further than the
 * threshold, the answer is "not recognised" rather than the least-bad match. That is the whole point of a
 * small vocabulary.
 *
 * Pure functions: no DOM, no network, no storage, no camera.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.BabelCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var VERSION = "1.0.0";
  var POINTS = 21;          /* a hand is 21 landmarks */
  var THRESHOLD = 0.16;     /* normalised distance; beyond this, nothing is recognised */

  function clean(s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim(); }

  /* Ten synthetic handshapes. Each is a finger-extension pattern plus a wrist angle — small, readable and
   * obviously synthetic. NOT a sign language. */
  var SIGNS = [
    { word: "hello", fingers: [1, 1, 1, 1, 1], angle: 0.00, note: "open hand" },
    { word: "no",    fingers: [0, 1, 1, 0, 0], angle: 0.10, note: "two fingers up" },
    { word: "yes",   fingers: [1, 0, 0, 0, 0], angle: -0.05, note: "thumb only" },
    { word: "water", fingers: [1, 1, 1, 0, 0], angle: 0.20, note: "three fingers" },
    { word: "eat",   fingers: [1, 1, 0, 0, 0], angle: 0.35, note: "two fingers to the mouth" },
    { word: "stop",  fingers: [1, 1, 1, 1, 1], angle: -0.30, note: "flat palm forward" },
    { word: "more",  fingers: [1, 0, 0, 0, 1], angle: 0.15, note: "thumb and little" },
    { word: "help",  fingers: [0, 1, 0, 0, 1], angle: -0.20, note: "two fingers, palm up" },
    { word: "sorry", fingers: [1, 1, 1, 1, 0], angle: 0.45, note: "four fingers, wrist turned" },
    { word: "thank you", fingers: [0, 0, 1, 0, 0], angle: 0.05, note: "one finger to the chin" }
  ];

  /* A handshape as 21 points: the wrist, then five fingers of four points each. A finger that is extended
   * points away from the wrist; a folded one curls back. Deterministic, so a test can compare exactly. */
  function handshape(sign) {
    var pts = [[0, 0]];
    var spread = [-0.42, -0.21, 0, 0.21, 0.42];
    for (var f = 0; f < 5; f++) {
      var ext = sign.fingers[f] ? 1 : 0;
      for (var k = 1; k <= 4; k++) {
        var reach = ext ? 0.16 * k : 0.05 * k;
        var curl = ext ? 0 : 0.035 * k;
        pts.push([
          Math.round((spread[f] * (ext ? 0.6 + 0.1 * k : 0.5) + sign.angle * k * 0.5 + curl) * 1000) / 1000,
          Math.round((reach + sign.angle * k * 0.25) * 1000) / 1000
        ]);
      }
    }
    return pts;
  }

  function reference() { return SIGNS.map(function (s, i) { return { id: "s" + (i + 1), word: s.word, note: s.note, points: handshape(s) }; }); }

  /* Distance between two hands, scale-normalised so a big hand and a small hand compare. */
  function distance(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== POINTS || b.length !== POINTS) return Infinity;
    var sx = 0, sy = 0, i;
    for (i = 0; i < POINTS; i++) { sx += a[i][0]; sy += a[i][1]; }
    var ax = sx / POINTS, ay = sy / POINTS;
    var sum = 0, norm = 0;
    for (i = 0; i < POINTS; i++) {
      var dx = a[i][0] - ax, dy = a[i][1] - ay;
      sum += Math.pow(dx - (b[i][0] - ax), 2) + Math.pow(dy - (b[i][1] - ay), 2);
      norm += dx * dx + dy * dy;
    }
    var scale = Math.sqrt(norm / POINTS) || 1;
    return Math.sqrt(sum / POINTS) / scale;
  }

  /* Recognition: the nearest reference, or NOTHING. No least-bad guess. */
  function recognise(points) {
    if (!Array.isArray(points) || points.length !== POINTS) {
      return { ok: false, field: "points", reason: "a hand needs 21 points; there is nothing to recognise otherwise", recognised: false };
    }
    var refs = reference();
    var scored = refs.map(function (r) { return { word: r.word, id: r.id, distance: Math.round(distance(points, r.points) * 1000) / 1000 }; })
      .sort(function (x, y) { return x.distance - y.distance; });
    var best = scored[0];
    if (!best || best.distance > THRESHOLD) {
      return {
        ok: true, recognised: false, caption: "not recognised", ranked: scored.slice(0, 3), best: best || null,
        says: "Not recognised: the nearest reference is " + (best ? best.word + " at " + best.distance : "none") + ", beyond the " + THRESHOLD + " threshold. A guess would be worse than nothing."
      };
    }
    return {
      ok: true, recognised: true, word: best.word, caption: best.word, best: best, ranked: scored.slice(0, 3),
      says: best.word + " \u2014 nearest reference at " + best.distance + " (threshold " + THRESHOLD + ")."
    };
  }

  /* Typing a word renders an avatar whose handshape is that word's stored reference. */
  function avatar(word) {
    var w = clean(word).toLowerCase();
    if (!w) return { ok: false, field: "word", reason: "type a word to see a hand" };
    var refs = reference();
    var hit = refs.filter(function (r) { return r.word === w; })[0];
    if (!hit) {
      return { ok: false, notInVocabulary: true, reason: "\u201c" + clean(word) + "\u201d is not one of the ten signs in this vocabulary. The avatar is drawn from a stored reference, so it will not invent one." };
    }
    return { ok: true, word: hit.word, points: hit.points, note: hit.note, says: "Showing \u201c" + hit.word + "\u201d \u2014 " + hit.note + "." };
  }

  function vocabulary() { return reference().map(function (r) { return { word: r.word, note: r.note }; }); }

  function serialize(history) { return JSON.stringify({ version: VERSION, format: "babel-1", history: (history || []).slice() }, null, 2); }
  function parseState(text) {
    var raw = String(text == null ? "" : text);
    if (!raw.trim()) return { ok: false, empty: true, reason: "nothing recognised on this device yet", raw: raw };
    var data;
    try { data = JSON.parse(raw); }
    catch (e) { return { ok: false, unreadable: true, reason: "The saved history cannot be read. It was NOT replaced with an empty one; export it to keep it.", raw: raw }; }
    if (!data || !Array.isArray(data.history)) return { ok: false, unreadable: true, reason: "The saved file holds no history. Nothing was started over it; export it to keep it.", raw: raw };
    return { ok: true, history: data.history.slice(), raw: raw };
  }
  function stamp(when) { var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(when || "")); return m ? m[3] + "-" + m[2] + "-" + m[1] : "undated"; }
  function exportFile(what, payload, meta, writer) {
    meta = meta || {};
    if (typeof writer !== "function") return { ok: false, reason: "the file was not written: no writer is available in this browser" };
    var name, body, mime = "application/json";
    if (what === "history") { name = "babel-" + stamp(meta.when) + ".json"; body = serialize(payload.history); }
    else if (what === "raw") { name = "babel-unreadable-" + stamp(meta.when) + ".txt"; body = String(payload.raw || ""); mime = "text/plain;charset=utf-8"; }
    else return { ok: false, reason: "nothing was written: unknown export \u201c" + what + "\u201d" };
    try {
      var wrote = writer(name, body, mime);
      if (wrote === false) return { ok: false, filename: name, reason: "the file was not written: the browser refused the save" };
      return { ok: true, filename: name, bytes: body.length };
    } catch (e) {
      var why = e && e.name === "QuotaExceededError" ? "storage is full" : (e && e.message ? e.message : "storage is unavailable");
      return { ok: false, filename: name, reason: "the file was not written: " + why };
    }
  }

  return { version: VERSION, POINTS: POINTS, THRESHOLD: THRESHOLD, reference: reference, handshape: handshape,
    distance: distance, recognise: recognise, avatar: avatar, vocabulary: vocabulary,
    serialize: serialize, parseState: parseState, exportFile: exportFile };
});
