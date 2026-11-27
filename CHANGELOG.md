# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Dates: dd/mm/yyyy.

## [Unreleased]

## [1.0.0] — 27/11/2026

### Added
- **Ten synthetic reference handshapes** of 21 points each, with the word and a note for each.
- **A scale-normalised distance** between hands, so a big hand and a small hand compare.
- **Recognition that refuses**: the nearest word above the threshold, or **"not recognised"** with the nearest
  reference and its distance named — and no word offered.
- **An avatar** drawn from a word's stored handshape, and a refusal for a word outside the ten.
- Refusals: a hand with the wrong number of points, no hand at all, an empty word, a word not in the vocabulary.
- An unreadable history is reported and offered for export, **never** replaced with an empty one.
- A failed save says **NOT SAVED** and leaves the history unchanged.
- PWA shell, CI (99 engine assertions + 18 in jsdom + page smoke), and the app-builder pipeline pinned to the
  canonical SHA for the EXE/APK/Linux release.

### Not built
- A camera and a trained sign-language model. The signs are synthetic and the page says so above the fold.
