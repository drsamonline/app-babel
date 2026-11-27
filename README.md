# Babel

Ten signs, and a hand for a word. A hand outside the vocabulary is **refused rather than guessed**.

- **Demo:** https://drsamonline.github.io/app-babel/play/index.html
- **Landing page:** https://drsamonline.github.io/app-babel/
- **Release:** https://github.com/drsamonline/app-babel/releases/tag/app-latest
- **Plan row:** #37 of 37 in `drsamonline/forge` → `QUEUE/PLAN.json`
- **Specs absorbed:** `app-babel` (lead)
- **Licence:** PolyForm Noncommercial 1.0.0

## Status

| | |
|---|---|
| **Built** | Ten 21-point reference handshapes; a scale-normalised distance; recognition returning the nearest word or "not recognised"; an avatar from a word's stored reference. |
| **Release** | Windows EXE, Android APK and Linux binary, built from this source by `app-builder` in CI. |
| **Not built** | **A camera and a trained sign-language model.** The signs are synthetic and the page says so above the fold. |
| **Untested** | Any real hand, and any real signer. What is tested is the mechanism, and it is tested exactly. |

## The spec's "done means", counted

| The spec says | Test |
|---|---|
| each of the ten reference signs produces its own word as the top caption | all ten, one assertion each |
| no two signs share a top result | ten distinct captions |
| a hand outside the vocabulary returns "not recognised" rather than a guess | caption is `not recognised`, `word` is undefined, and the reason names the threshold |
| typing a word renders an avatar matching that word's stored reference | all ten avatars compared point-for-point, and each recognises back to its own word |
| everything runs with the network off | no `fetch`/XHR/WebSocket/beacon, no URL, no camera, CSP `connect-src 'none'` |

## The honest limit, stated above the fold

The ten signs are **synthetic 21-point handshapes** generated from a finger-extension pattern and a wrist
angle. They are not a recording of a real signer, not taken from any sign language, and not a claim about how
any Deaf community signs anything. There is no camera and no trained model.

What ships is the mechanism — ten references, a normalised distance, a threshold, an avatar — and it is
tested exactly. Pretending to have the model would have been the worst kind of fake, and a wrong caption on a
hand is a wrong sentence about a person.

## What it will not do

- **Guess** — beyond the threshold it says "not recognised".
- **Invent a hand** for a word it does not have.
- **Claim to be a sign language.**
- **Use a camera.**
- **Use the internet.**

## When things go wrong

| Case | Behaviour |
|---|---|
| **Bad input** | Wrong number of points, no hand, an empty word — each refused with the field named. |
| **Outside the vocabulary** | "not recognised", nearest reference and distance named, no word offered. |
| **No network** | Nothing changes. |
| **Storage full or unavailable** | **NOT SAVED**, history unchanged. |
| **Corrupt saved state** | Reported and offered for export, never replaced with an empty one. |

## Tests

```bash
npm test                      # all three suites
node tests/self-tests.js      # engine — 99 assertions
node tests/ui-tests.js        # the page in jsdom — 18 assertions
node tests/page-smoke.js      # every local src/href resolves, nothing off-origin
```

Mutation-tested six ways on 27/11/2026, all red: the threshold off so anything is recognised (4 failures), an
avatar that invents a hand (3), two signs sharing a word (1), the avatar not being the stored reference (18),
a broken history starting empty (3), and a distance that ignores the shape (33).

## The bug this row repeated for the sixth time

`persist()` then a cheerful `setStatus("ok", …)` — the **NOT SAVED** warning overwritten. Rows #11, #14, #15,
#22, #25, #37. This time my "fix" was itself wrong: I re-set the bad status *with the cheerful text*. The
rule, now written down in six READMEs: **the cheerful line goes inside `if (saved)`**, and nowhere else.

## Layout

```
docs/index.html            landing page
docs/play/index.html       the app — the ten hands, the caption, the avatar
docs/play/app.js           DOM wiring: recognise, draw the hand, the avatar, export
docs/play/babel-core.js    the engine — references, distance, recognition, avatar, storage
docs/play/web-kit.js       vendored kit (unmodified)
docs/play/export-kit.js    vendored kit (unmodified)
tests/self-tests.js        engine suite (99)
tests/ui-tests.js          page suite (18, jsdom)
tests/page-smoke.js        shape on disk
PAGES.json                 landing = docs/index.html, app = docs/play/index.html
```

## Where the spec was silent, and what was chosen

- **Synthetic references, said out loud**, rather than borrowed from a sign language I could not verify.
- **A threshold, not a nearest-neighbour answer** — the refusal is the feature.
- **The avatar is the stored reference, byte for byte**, so what you see for "water" is exactly what recognition compares against.
- **Ten, and no more.** A bigger vocabulary drawn from memory would be a bigger pile of unverified claims about a real community's language.
- **No camera**: a camera would add a permission prompt and a privacy question the spec does not ask for.

## What is not built, and why

**A camera and a trained model.** The first is a permission and a privacy question; the second is real work
that cannot be faked honestly. What ships is the mechanism, tested, with the limit written on it.
