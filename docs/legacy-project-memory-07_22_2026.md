# ABracadABra — Project Memory

Single-file vanilla JS/HTML/CSS PWA abs-workout tracker. No frameworks, no
build step, no external deps besides Google Fonts. All persistence via
localStorage. Deployed via GitHub Pages from this repo — the live file
**must be named `index.html`** at repo root.

## Stack conventions
- One `index.html`, fully self-contained: inline `<style>`, inline
  `<script>`, inline service worker registered via a Blob URL.
- Dark theme tokens: `--bg:#0a0a0f; --orange:#ff6b2b; --blue:#3b82f6; --green:#22c55e`
- Fonts: Barlow Condensed 900 (display/headers), Inter (body)
- Primary target: Android + Chrome. No Mac/Safari-only APIs or tooling.
- All localStorage keys prefixed `abra_*`.

## Versioning (non-negotiable)
- One `const APP_VERSION` drives two things: the small on-screen version
  tag under the header logo (Home + Workout screens), and the service
  worker cache key string. Bump it on every meaningful revision or the
  PWA cache won't invalidate and users get stuck on old code.
- Commit + push after every change. Git history is the version trail now —
  the old `filename_vX.X_MM_DD_YYYY.html` download-naming convention was
  only needed for the previous chat-based handoff (no direct repo access)
  and doesn't apply here.

## Known architecture gotchas — do not reintroduce these
- Timers must be end-timestamp-based, never decrement-counters — decrement
  timers break on Android backgrounding/screen lock.
- `showRest()` must always call `clearTimers()` first. Skipping this causes
  timer bleed and silently skips exercises.
- Any delete of a logged set/session must trigger `recomputePB()` (full
  history rescan) or PB data goes stale.
- Import-from-backup keeps its `confirm()` dialog on purpose — it's the one
  destructive/overwrite action. Every other delete uses the toast-undo
  pattern (5s window) instead.

## Feature status (as of v4.7 — start from that file, not whatever's
## currently live on GitHub Pages)

**Already implemented — do not redo:**
- Audible tick, last 3 seconds of the prestart countdown.
- Reps/duration carry-forward: last value logged in a session becomes the
  default for the next set (`w.currentTarget`); the last-ever value becomes
  next session's default (`state.lastUsed`).
- Pre-completion +/− adjuster on the reps target (not just post-set edits).
- Enter key on numeric inputs commits the value and dismisses the keyboard
  (reps, weight, target, and edit-modal inputs all wired).
- Weight tracking, scoped to exercises flagged `weighted:true` in `DB`
  (Weighted Crunches, Medicine Ball Crunches, Cable Crunch, Weighted
  Russian Twist, Woodchopper, Pallof Press, Back Extension). Optional lb
  input, carries forward via `state.lastUsedWeight`, shown in the set box /
  "Prev:" line / completion summary / share text / history chips / edit
  modal. Deliberately **no PB or progressive-overload logic on weight**.
- `IDEAS?` feedback link lives inline in every `.app-header`, between the
  logo and whatever's on the right (streak badge or Quit button) — it is
  no longer a fixed floating button.

**Still outstanding:**
- Silent session-abandonment logging. `exitWorkout()` currently does not
  log anything when a user quits mid-session. Needs: a `logQuitSilently()`
  call (mirrors the existing `logSessionSilently()`) capturing which
  exercise/set index the user was on when they quit; a new webhook payload
  `type:'quit'`; and a distinguishing tab/column in the Sheet so completed
  vs. abandoned sessions don't mix. See the webhook file below.

## Related file: the logging webhook
The silent-logging endpoint is a Google Apps Script (`Code.gs`-style file,
currently `ABracadABra_Webhook_v1_1_07_21_2026.txt` in the Claude project),
routing by `type` into SESSIONS / USERS / META tabs in a Google Sheet. It
is **not** part of this git repo — Apps Script projects live in Google's
own editor, not GitHub, unless `clasp` is set up to version them locally.
Keep a copy of the current `.gs` source somewhere in this repo (e.g.
`/webhook/webhook.gs`) purely for reference/history even without clasp.

## How I like to work
- Direct, no filler explanations.
- Full-file output isn't necessary anymore now that you have real repo
  access — just make the change in place and show a summary/diff.
- Flag any known-risk edit (e.g. touching the timer/skip flow, PB
  recompute, or service worker cache key) *before* making it — don't
  just silently do it.
- Ask before `git push`. Editing/committing locally is fine to do without
  asking each time, but treat push as the one manual-confirm gate.
- Windows + Android only. No Mac-specific tooling, no Office/Excel.
