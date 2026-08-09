# ABracadABra — Claude Code Handoff

**Document:** ABracadABra_CLAUDE_CODE_HANDOFF_v1_1_08_09_2026
**Doc version:** 1.1 · **Date:** 08_09_2026 · **Describes app version:** 4.9
**Save as:** `CLAUDE.md` at repo root (Claude Code reads that filename automatically)

**Changes in 1.1** — absorbed four technical facts from the previous project-memory file, which
is archived verbatim at `docs/legacy-project-memory-07_22_2026.md`: the end-timestamp timer rule
(§6.1), the toast-undo delete pattern (§2), the `--green` token (§2), and the webhook filename
plus local-copy convention (§7). **This document supersedes that file wherever they conflict** —
in particular, the archived file says the versioned-filename convention no longer applies; it
does, and §10 is correct. No app code changed; still describes 4.9.

> Markdown has no pagination, so the usual page-footer rule does not apply. Document name and
> version appear at the top and bottom of this file instead. Plain text, no colour dependence.

---

## 0. Read this first — operating rules

These override convenience. They exist because all three have been violated before at real cost.

1. **Verify before asserting.** Never state the contents, structure, or state of a file, sheet,
   or cell without reading it in the current session. A summary, a memory, or this document is
   not a reading. The app-state claims here were verified on 08_08_2026 and drift from that
   moment onward. Version 1.1 carried forward notes from an older file; it re-verified nothing
   against the code.
2. **Verification does not inherit.** Reading a file's constants does not verify what it computes
   at runtime. Each claim carries its own evidence.
3. **No causal claims without the falsifying check.** Before saying "X broke because of Y," state
   the check that would kill Y and the result of running it. If it was not run, say so.
4. **"Done" requires shown proof.** File rendered, output verified, check run. "I wrote it" is not
   done. "It should work" is not done.
5. **`git push` is a manual-confirm gate.** Local edits and local commits proceed freely. Never
   push without the owner explicitly saying so in that session. See §8.
6. **Owner is not a programmer.** Every instruction must be executable exactly as written from a
   Windows desktop or an Android phone. No step may require him to figure something out.
7. **Three failed attempts on the same method = hard stop.** Say so out loud, restate the goal
   (not the method), and list structurally different approaches. Rephrasing the last attempt is
   not a new attempt.

---

## 1. What this project is

A single-file abs workout tracker, shipped as an installable PWA.

- **Owner:** Ambar "Guruji" Capoor. Cinematographer / 1st AC, Los Angeles. Not a programmer.
- **Primary platform:** Android / Chrome. Secondary: Windows / PC.
- **Monetization:** none, and none planned. The goal is maximum organic reach.
- **No accounts, no login, no server-side user state.** All user data lives in the browser.
- **Hosting:** GitHub Pages, served from `index.html` at the repo root.
- **Second app, parked:** "Summit" — a Mount Whitney day-hike conditioning PWA. Not in scope here.

---

## 2. Stack and hard constraints

- **One file.** Everything — HTML, CSS, JS, service worker, manifest, icons — lives in
  `index.html`. This is deliberate, not technical debt.
- **No build step. No bundler. No npm. No framework.** Vanilla JS, hand-written CSS.
- **No external dependencies** except a Google Fonts `@import` (Barlow Condensed 900 + Inter).
  Do not add a dependency without asking first.
- **No `localStorage` alternatives.** All persistence is `localStorage`. See §5.
- **Dark theme only.** `--orange: #ff6b2b`, `--blue: #3b82f6`, `--bg: #0a0a0f`,
  `--green: #22c55e`.
  Display font `--font-d` (Barlow Condensed), body font `--font-b` (Inter).
- **Fixed max width 480px, portrait.** It is a phone app that happens to open on desktop.
- Do not introduce `confirm()` or `alert()` dialogs. Exactly two `confirm()` calls are
  intentional and may stay: backup import (destroys all data) and Quit session.
- **Every other destructive action uses the toast-undo pattern** — perform the delete
  immediately, then show a toast with a five-second undo window. This is the house pattern for
  deleting a logged set or a session. Do not replace it with a confirmation dialog.

---

## 3. Current status — v4.9

Verify the version before trusting this section: it is the `APP_VERSION` constant in the file,
and it appears in three places that must always agree — the HTML comment at the head of the file,
the `APP_VERSION` constant, and the delivery filename.

### Shipped in v4.8
- **Session persistence.** An in-progress workout is written to `localStorage` under
  `abra_session` and rehydrated on load. Before this, any reload, back-out, or Android process
  kill destroyed both the progress and the day's exercise lineup, because `generateWorkout()`
  re-rolls the lineup at random on every load.
- **Today's Lineup sheet.** A read-only view of the day's exercises and progress, reachable from
  a header button inside the workout screen. Hardware-back now opens this sheet instead of the
  bare swap modal, and re-arms the history trap.

### Shipped in v4.9
- **App icon rebuilt.** The v4.7 manifest icon decoded to malformed SVG and drew nothing, so
  Android fell back to a generated letter tile. Now: AB wordmark, orange A and blue B, embedded
  as base64 PNG at 192 and 512 for `purpose: any`, plus a padded 512 for `purpose: maskable`.
- **Typed values.** Tapping the large duration number or the large rep-target number swaps it for
  a numeric input. Enter commits and dismisses the keyboard; blur also commits. The ± buttons are
  unchanged. Clamps: 5–900 seconds, 1–999 reps.
- **Dual-side sets.** See §4.

---

## 4. Data model — the exercise object

Exercises live in the `DB` constant, keyed by muscle group (`upper`, `lower`, `oblique`, `core`,
`posterior`). Each entry:

| Field | Meaning |
|---|---|
| `name` | Display name. Also the key into `state.pbs`, `state.lastUsed`, `state.lastUsedWeight`. |
| `sets` | Always 3 in current data. Much of the code assumes 3 — see §6. |
| `reps` | Target reps, or hold seconds when `unit` is `'sec'`. |
| `unit` | `'reps'` or `'sec'`. Drives which UI mode renders. |
| `tip` | One-line coaching cue shown during the set. |
| `gym` / `home` | Location eligibility. |
| `weighted` | Optional. Enables weight capture. Record-and-display only — no PB logic, no progression logic on weight. |
| `dualSide` | Optional. All reps or the full hold on one side, then switch. |
| `altSide` | Optional. Both sides alternate within the set. Label only, no behaviour change. |

### Side classification — cross-checked against coaching sources, 08_08_2026
- **`dualSide: true`** — Side Plank, Pallof Press, Woodchopper.
- **`altSide: true`** — Russian Twist, Weighted Russian Twist, Bicycle Crunches, Dead Bug,
  Bird Dog, Oblique Crunches.
- Oblique Crunches is the one genuinely ambiguous case: standard form alternates, but some
  programs run a full set per side. It is currently flagged `altSide`. If the owner asks to
  change it, it moves to `dualSide` — do not change it unilaterally.

### Dual-side timed flow
For a `dualSide` exercise with `unit: 'sec'`: prestart countdown, side 1 hold, then a
five-second SWITCH SIDES countdown with audible ticks, then side 2 hold at the same duration,
and only then the rest period. `exSide` (1 or 2) tracks position; `switchTimer` runs the break;
`SWITCH_SEC` is the constant. Rep-based `dualSide` exercises are labelled but not broken up,
because they are self-paced.

---

## 5. Persistence — every `localStorage` key

Read these from the file before relying on them; they are enumerated here as a map, not as truth.

| Key | Holds |
|---|---|
| `abra_history` | Completed session records, newest first. |
| `abra_pbs` | Per-exercise personal bests. |
| `abra_settings` | Rest duration, prestart seconds, audio, keep-awake. |
| `abra_milestones` | One-time achievement flags. |
| `abra_lastused` | Last logged value per exercise — becomes next session's default target. |
| `abra_lastusedweight` | Last logged weight per exercise, `weighted` exercises only. |
| `abra_session` | In-progress workout. Written via the `SESSION_KEY` constant, not a literal. |
| `abra_device_id` | Anonymous UUID for usage logging. |
| `abra_email_captured` / `abra_email_never` | Email-modal suppression flags. |

`abra_session` carries `savedAt`, `version`, `location`, `todayEx`, and the full `workout` object.
`restoreSession()` rejects and purges anything malformed, shape-mismatched, or older than
`SESSION_MAX_AGE_MS`. Checkpoints are written at workout start, every set render, rest start,
and both target-adjust paths.

---

## 6. Known fragile paths — read before touching the workout screen

1. **Every timer must be end-timestamp-based, never a decrement counter.** Compute an absolute
   end time once, then derive the remaining time from `Date.now()` on each tick. A timer that
   subtracts one second per tick silently loses time whenever Android backgrounds the tab or the
   screen locks, because the interval stops firing — the user comes back to a countdown that is
   wrong by however long the phone was asleep. This is a "do not reintroduce" constraint, not a
   preference. It applies to the exercise timer, the prestart countdown, the rest timer, and the
   dual-side switch timer alike.
2. **`clearTimers()` must run before `showRest()`.** The path
   `completeSet()` → `renderWorkoutStep()` → `showRest()` without it causes silent double-fires.
   This has regressed before.
3. **`clearTimers()` must clear every timer handle.** It currently clears the exercise timer, the
   prestart timer, and the dual-side switch timer, and hides the switch panel. Any new timer must
   be added there in the same commit that introduces it.
4. **`recomputePB()` must be called on every history delete.** No exceptions.
5. **Three sets is assumed in many places** (`[false,false,false]` array literals, `/3` labels,
   `nextSet < 3`). Changing `sets` per exercise is a wider refactor than it looks.
6. **Weight tracking was silently lost once.** It existed in the v3.7–v4.2 lineage and vanished
   before v4.5; the whole system had to be rebuilt. Do not delete a feature you do not recognise —
   ask.
7. **The service worker cache is version-keyed.** `CACHE = 'abracadabra-v${APP_VERSION}'`. If
   `APP_VERSION` is not bumped, the old code is served forever and the change appears not to have
   deployed. This is the single most common false "it didn't work" report.

---

## 7. Backend — silent usage logging

- **Transport:** fire-and-forget `fetch` POST to a Google Apps Script web app. The endpoint is the
  `EMAIL_ENDPOINT` constant in the app. Failures are swallowed and never surfaced to the user.
- **Routing:** the payload's `type` field selects the destination tab.
- **Script:** Google Apps Script, tracked separately with its own `WEBHOOK_VERSION` constant.
  As of the 07_22_2026 note the current source was `ABracadABra_Webhook_v1_1_07_21_2026.txt`,
  held in the Claude project rather than in git. Apps Script projects live in Google's editor and
  are not version-controlled here unless `clasp` is set up. **Keep a reference copy of the live
  `.gs` source at `/webhook/webhook.gs` in this repo** purely for history — it is not deployed
  from here, and editing it does not change the running webhook.
  Read the current script before changing it — as of 08_08_2026 it handles `type: 'session'`
  into a SESSIONS tab, and routes everything else into a USERS tab. There is no `'quit'` branch
  yet. A META tab records which script version last served a request.
- **Retention:** a `pruneOldSessions` function deletes SESSIONS rows past a retention window. It
  requires a manual weekly time-driven trigger in the Apps Script Triggers UI. Verify it is armed
  before assuming pruning happens.
- **Apps Script gotchas, learned the hard way:** sheet tab names are case-sensitive; always use
  the constant, never a string literal; every code change needs a **new** deployment, not an edit
  to the existing one; stray deployments must be archived and one fresh deployment created.
- **Google's internal deployment counter and `WEBHOOK_VERSION` are intentionally unsynced.**
  Do not try to align them.

---

## 8. Deploy to GitHub Pages — exact procedure

Run these in order. Steps 1–6 need no permission. **Step 7 requires the owner to say "push" in
this session.** Never run it on your own initiative.

1. Confirm you are in the right repo and on the right branch:
   `git remote -v && git branch --show-current && git status`
   The remote is the owner's `abracadabra` repo. If the remote does not match, stop and ask —
   do not guess the URL.
2. Confirm the working tree is clean apart from your intended changes. If there is unexpected
   local drift, stop and report it before overwriting anything.
3. Confirm the version is bumped in all three places and that they agree:
   `grep -n "APP_VERSION" index.html | head` and the HTML comment at the head of the file.
   If they disagree, fix that first — a stale `APP_VERSION` means the deploy silently does nothing.
4. Run the syntax check (§9). Do not proceed on a failure.
5. Run the reference check (§9). Do not proceed on genuinely missing IDs or handlers.
6. Stage and commit locally:
   `git add index.html`
   `git commit -m "vX.Y — <one line describing the change>"`
7. **Ask for confirmation. Then, and only then:** `git push origin <branch>`
8. Report the commit hash and confirm GitHub Pages picked it up. Pages can take a minute or two.
9. Tell the owner, in these words, that the app will keep serving the old version until he does
   one of the following on his phone: a hard refresh in Chrome, or uninstalling and reinstalling
   the installed PWA. **An icon or manifest change requires the reinstall** — the manifest is
   cached at install time, and a hard refresh will not replace it.

If the delivered file arrives with a versioned name such as `ABracadABra_v4_9_08_08_2026.html`,
rename it to `index.html` before committing. GitHub Pages serves `index.html` and nothing else.

---

## 9. Verification harness

Run both before every commit. Neither needs a browser.

**Syntax check** — extract the first `<script>` block and check it:

```bash
python3 -c "
import re
s = open('index.html', encoding='utf-8').read()
js = re.findall(r'<script>(.*?)</script>', s, re.S)[0]
open('/tmp/s.js', 'w', encoding='utf-8').write(js)
"
node --check /tmp/s.js
```

**Reference check** — every `getElementById` target must exist as an `id`, and every inline
handler must exist as a function:

```bash
python3 -c "
import re
s = open('index.html', encoding='utf-8').read()
js = re.findall(r'<script>(.*?)</script>', s, re.S)[0]
ids = set(re.findall(r'id=\"([^\"]+)\"', s))
gets = set(re.findall(r\"getElementById\('([^']+)'\)\", js))
print('MISSING IDS:', sorted(g for g in gets if g not in ids))
funcs = set(re.findall(r'function\s+([A-Za-z0-9_]+)\s*\(', js))
handlers = set(re.findall(r'on(?:click|change|input)=\"([A-Za-z0-9_]+)\(', s))
print('MISSING HANDLERS:', sorted(h for h in handlers if h not in funcs))
"
```

Known benign result: handlers built inside dynamic template strings via `.replace()` can produce
false "missing handler" hits. Confirm each hit by reading the code before treating it as a bug.

For logic changes to the timer or session flow, write a throwaway Node harness that stubs
`document` and `localStorage` and prints the actual sequence of events. Paste the output as proof.
Do not report a timer change as working on the strength of reading it.

---

## 10. Working conventions

- **Batch size:** roughly three edits per batch. Verify, then deliver. No speculative changes.
- **Delivery:** complete files, not patches — unless the fix is one to three lines, in which case
  give exact replace instructions (where, what, how).
- **Filenames:** `ABracadABra_vX_Y_MM_DD_YYYY.html`, matching the embedded version. Always note
  that it must be renamed to `index.html` before pushing.
- **Version increments:** meticulous. Never reuse, never skip silently.
- **Tone:** direct, short, no filler, no cheerleading. Say whether a thing is useful, flawed, or
  untested. Flawed ideas get called out with evidence, not diplomacy.
- **Plain English first, then the technical term alongside it** — pair the two so the owner picks
  up the real vocabulary by correlation.
- **Before building anything non-trivial:** if a more elegant or higher-viability approach exists,
  propose it first. Then build what the owner decides. No silent scope changes.
- **Context hygiene:** separate chat sessions for separate work streams.

---

## 11. Backlog

### Verified complete as of v4.9
- Audible ticks during the final three seconds of the prestart countdown.
- Enter key on numeric inputs commits the value and dismisses the keyboard.
- Reduced value on set 1 carries to later sets in the session, and forward to the next session
  via `abra_lastused`.
- Fixed-start exercises are adjustable before completion, not only after.

### Open
1. **Quit logging.** `exitWorkout()` currently clears the session and returns home, logging
   nothing. It needs a `logQuitSilently()` call capturing the exercise and set index at
   abandonment, a `'quit'` payload type, and a corresponding branch in the Apps Script webhook
   plus a tab or column distinguishing completed from abandoned sessions.
2. **Weight tracking depth.** PB logic on weight, progressive-overload suggestions, and per-set
   weight support in the edit-set modal. Currently record-and-display only.
3. **GoatCounter analytics.** Privacy-first, no cookies. Only human step outstanding: create the
   account and supply the site code. Purpose is Day-1 and Day-7 retention plus source attribution.
4. **User count display in-app.**
5. **Play Store packaging.** TWA via Bubblewrap, Digital Asset Links, `assetlinks.json`,
   Lighthouse thresholds, a mandatory closed-testing gate with a tester minimum and a waiting
   period, and a one-time developer fee. Explicitly gated on organic retention data first —
   do not start this without the owner saying the retention numbers justify it.
6. **Audio coaching and daily reminders.**
7. **Summit PWA.** Separate project, parked.

---

**End of ABracadABra_CLAUDE_CODE_HANDOFF_v1_1_08_09_2026 — describes app version 4.9**
