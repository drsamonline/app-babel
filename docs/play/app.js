/* app — the Babel page. SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0 · (c) 2026 Dr Sohil Momin
 * Wiring only: the ten handshapes, the distance and the refusal live in babel-core.js. */
(function () {
  "use strict";
  var B = window.BabelCore;
  var $ = function (id) { return document.getElementById(id); };
  var K = "babel:history";
  var state = { history: [], unreadable: null };

  var els = {
    status: $("status"), handButtons: $("handButtons"), noiseBtn: $("noiseBtn"), recogniseSays: $("recogniseSays"),
    caption: $("caption"), word: $("word"), avatarBtn: $("avatarBtn"), hand: $("hand"), avatarSays: $("avatarSays"),
    vocab: $("vocab"), exportBtn: $("exportBtn"), ioNote: $("ioNote")
  };

  function today() { var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; }; return p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear(); }
  function setStatus(k, m) { els.status.className = "status show " + k; els.status.textContent = m; }
  function node(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }

  function persist() {
    try { window.localStorage.setItem(K, B.serialize(state.history)); return true; }
    catch (e) { setStatus("bad", "NOT SAVED: " + (e && e.name === "QuotaExceededError" ? "storage is full" : "storage is unavailable") + ". The history on screen is unchanged."); return false; }
  }

  function drawHand(points) {
    els.hand.textContent = "";
    els.hand.hidden = false;
    var NS = "http://www.w3.org/2000/svg";
    /* the palm: wrist to each finger base */
    var base = points[0];
    for (var f = 0; f < 5; f++) {
      var path = document.createElementNS(NS, "polyline");
      var pts = [];
      for (var k = 0; k <= 4; k++) { var p = points[1 + f * 4 + (k === 0 ? 0 : k - 1)]; if (p) pts.push(p[0] + "," + (-p[1])); }
      path.setAttribute("points", base[0] + "," + (-base[1]) + " " + pts.join(" "));
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#3b4a6b");
      path.setAttribute("stroke-width", "0.035");
      path.setAttribute("stroke-linecap", "round");
      els.hand.appendChild(path);
    }
  }

  function recognise(points, label) {
    var out = B.recognise(points);
    if (!out.ok) { setStatus("bad", out.reason); return; }
    els.caption.textContent = out.caption;
    els.recogniseSays.textContent = out.says;
    state.history.push({ at: Date.now(), on: today(), word: out.caption, recognised: out.recognised });
    var saved = persist();
    /* the cheerful line only when the write worked: a failed save keeps its NOT SAVED warning */
    if (saved) setStatus(out.recognised ? "ok" : "warn", label + ": " + out.says);
  }

  function noise() {
    var pts = [];
    for (var i = 0; i < B.POINTS; i++) pts.push([Math.sin(i * 2.1) * 0.9, Math.cos(i * 1.3) * 0.9]);
    recognise(pts, "A hand outside the vocabulary");
  }

  function showAvatar() {
    var out = B.avatar(els.word.value);
    if (!out.ok) { setStatus("bad", out.reason); els.hand.hidden = true; els.avatarSays.textContent = ""; return; }
    drawHand(out.points);
    els.avatarSays.textContent = out.says;
    setStatus("ok", out.says);
  }

  function doExport() {
    var out = B.exportFile("history", { history: state.history }, { when: today() }, function (name, text, mime) {
      if (!window.Export || typeof window.Export.save !== "function") throw new Error("the export kit did not load");
      window.Export.save(name, text, mime); return true;
    });
    if (out.ok) { els.ioNote.textContent = "Wrote " + out.filename + "."; setStatus("ok", "Exported."); }
    else setStatus("bad", out.reason + ".");
  }

  els.noiseBtn.addEventListener("click", noise);
  els.avatarBtn.addEventListener("click", showAvatar);
  els.word.addEventListener("keydown", function (e) { if (e.key === "Enter") showAvatar(); });
  els.exportBtn.addEventListener("click", doExport);

  B.reference().forEach(function (r) {
    var b = node("button", null, r.word);
    b.addEventListener("click", function () { recognise(r.points, "Reference \u201c" + r.word + "\u201d"); });
    els.handButtons.appendChild(b);
  });
  els.vocab.textContent = B.vocabulary().map(function (v) { return v.word + " (" + v.note + ")"; }).join(" \u00b7 ");

  var raw = null;
  try { raw = window.localStorage.getItem(K); } catch (e) { raw = null; }
  if (raw) {
    var parsed = B.parseState(raw);
    if (parsed.ok) state.history = parsed.history;
    else {
      state.unreadable = parsed;
      setStatus("bad", parsed.reason);
      var keep = node("button", "small", "Export the unreadable history");
      keep.addEventListener("click", function () {
        var out = B.exportFile("raw", parsed, { when: today() }, function (name, text, mime) {
          if (!window.Export || typeof window.Export.save !== "function") throw new Error("the export kit did not load");
          window.Export.save(name, text, mime); return true;
        });
        setStatus(out.ok ? "ok" : "bad", out.ok ? "Wrote " + out.filename + "." : out.reason);
      });
      els.ioNote.parentNode.insertBefore(keep, els.ioNote);
    }
  }

  if (window.Loom && window.Loom.pwa) window.Loom.pwa.register("sw.js");
})();
