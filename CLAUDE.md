# ABracadABra — Claude Code Handoff

**Document:** ABracadABra_CLAUDE_CODE_HANDOFF_v1_9_08_09_2026
**Doc version:** 1.9 · **Date:** 08_09_2026 · **Describes app version:** 5.1 (live)
**Save as:** `CLAUDE.md` at repo root (Claude Code reads that filename automatically)

**Changes in 1.9** — §9 replaced with a committed script, `tools/verify.py`. The inline one-liners
it used to carry ran `python3` and wrote to `/tmp/`, neither of which exists on the owner's Windows
machine — so the documented harness had never been runnable as written, inside the very section
meant to enforce verification. The script adds DESC coverage, version agreement, home-pool floor
and webhook drift to the original syntax and reference checks, and was negative-tested.

**Changes in 1.8** — documents `DESC`, which §4 never mentioned at all. That omission is why v5.0
shipped 34 exercises whose info panel read "No description available." Adding an exercise requires
editing **two** structures and nothing enforces it, so §9 gains a DESC coverage check. v5.1 fills
all 34.

**Changes in 1.7** — v5.0 deployed and verified live, so §3 and §11 item 1 no longer describe it
as unreleased. Records that the quit path is proven as far as the webhook but not yet from a real
device.

**Changes in 1.6** — §11 item 3 corrected and deferred. GoatCounter was recorded as the route to
Day-1/Day-7 retention; it cannot do retention at all, being cookieless by design. Retention is
already computable from `deviceId` in SESSIONS with no new tooling. Item 3 now records what
GoatCounter would actually add, and that adopting it costs a second external dependency.

**Changes in 1.5** — §4 and §5 re-extracted from the code and dated. §4's side-classification
lists were stale (dualSide 3 → 9, altSide 6 → 16) and are now generated, not hand-written; the
14 `weighted` exercises are listed and all are `home:false`. §5 verified complete both ways: every
key listed is referenced, and nothing referenced is missing. §9 gains a webhook drift check and a
DB audit. §0.1 now scopes verification dates per-section instead of claiming one global date.

**Changes in 1.4** — webhook 1.2 deployed and verified live; `webhook/webhook.gs` synced to it.
§7's redeploy instructions were **wrong** and are corrected: "New deployment" changes the URL, so
the right path is Manage deployments → edit → Version "New version". Added the `Anyone` access
rule, the `/u/N/` browser-account trap that fakes a broken webhook, the 1.2 routing table, and a
warning that the `else` branch is a catch-all into USERS. §3 records v5.0; §11 item 1 updated.

**Changes in 1.3** — §7 corrected and expanded. The 1.2 claim that the script is not named
"abracadabra" was **wrong**: it is `ABracadABra Webhookv1.1_07_21_2026`, and the real obstacle is
that it lives under the secondary Google account. Added the verified pruning-trigger state, the
Head-vs-deployment rule, and the Sheets version-coercion gotcha. Describes app version 5.0, which
is committed locally but **not deployed** — see §11 item 1.

**Changes in 1.2** — §7 rewritten. A redacted reference copy of the webhook now lives at
`webhook/webhook.gs` (`WEBHOOK_VERSION` 1.1, captured 08_09_2026). Added the rule that `SHEET_ID`
must never be committed to this public repo, and instructions for finding the live script, which
is not named "abracadabra" and may sit under a secondary Google account. Supersedes the 1.1
wording that said to keep a copy of the source without qualification. No app code changed.

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
   not a reading. Verification dates in this document are per-section, not global: §4 and §5 were
   re-extracted from the code on 08_09_2026 and §7 was verified against the live deployment the
   same day. Anything not carrying a date still traces to 08_08_2026 and drifts from there.
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

## 3. Current status — v5.1 live

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

### Shipped in v5.0 — deployed and verified live 08_09_2026
- **Quit logging.** `exitWorkout()` calls `logQuitSilently()` before tearing down state, sending
  `type: 'quit'` with `quitExIdx`, `quitExName`, `quitSetIdx` and `totalEx`. Additive —
  `finishWorkout()` untouched. Duration is **not** clamped to a 1-minute floor the way the
  completed path is: a sub-minute bail logs `0`, which is the strongest abandonment signal there
  is. Deliberate Quit only; tab close and Android process kill still log nothing.
- **Home means bodyweight.** Anything needing equipment is gym-only. Ab Wheel Rollout, Weighted
  Crunches and Weighted Russian Twist moved to `home:false`. No weighted exercise is flagged home.
- **34 new exercises.** 22 bodyweight (gym + home), 12 equipment (gym only). Home 16 → 38,
  gym 34 → 68. This was a real defect, not a nice-to-have: home `upper` and `posterior` held only
  2 exercises each, so the 7-day no-repeat filter in `pickEx()` emptied the pool by day 3 and fell
  back to repeats. A 7-day streak saw the same two upper exercises over and over.

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

### `DESC` — the second half of an exercise, and easy to miss
**Adding an exercise means editing two structures, not one.** `DB` holds the mechanics plus the
one-line `tip` shown during the set. A separate `const DESC` object, keyed by the exact same
name string, holds the longer plain-English explanation shown in the info panel.

Nothing links them. `DESC[name] || 'No description available.'` means a missing key degrades
silently — no error, no crash, just placeholder text in the UI. v5.0 shipped 34 exercises with no
`DESC` entries and it was caught by the owner, not by any check. **§9 now has a coverage check;
run it after any DB change.** Keys must match the DB name character for character, apostrophes
included (`'Captain\'s Chair Knee Raise'`).

### Side classification — extracted from the DB and verified 08_09_2026
Do not hand-maintain these lists. Re-extract them with the §9 DB audit; they were wrong within a
day of being written last time.

- **`dualSide: true` (9)** — Side Plank, Side Plank Hip Dip, Side Plank Reach-Through, Pallof
  Press, Woodchopper, Dumbbell Side Bend, Single-Leg Glute Bridge, Suitcase Carry, Cable
  Anti-Rotation Hold.
- **`altSide: true` (16)** — Oblique Crunches, Russian Twist, Weighted Russian Twist, Bicycle
  Crunches, Heel Taps, Lying Windshield Wipers, Cross-Body Mountain Climbers, Landmine Twist,
  Hanging Oblique Knee Raise, Single-Leg Lowers, Dead Bug, Bird Dog, Plank Shoulder Taps, Plank
  Up-Down, Swimmers. (Bird Dog is listed in both `core` and `posterior`, so it counts twice.)
- **`weighted: true` (14)** — Weighted Crunches, Medicine Ball Crunches, Cable Crunch, Weighted
  Sit-Up, Machine Crunch, Weighted Russian Twist, Woodchopper, Landmine Twist, Dumbbell Side
  Bend, Pallof Press, Suitcase Carry, Cable Anti-Rotation Hold, Back Extension, Good Morning.
  **Every one is `home:false`** — see the bodyweight-only rule in §3.
- **No entry carries both `dualSide` and `altSide`**; they are mutually exclusive and the §9 audit
  fails if that is ever violated.
- Oblique Crunches is the one genuinely ambiguous case: standard form alternates, but some
  programs run a full set per side. It is currently flagged `altSide`. If the owner asks to
  change it, it moves to `dualSide` — do not change it unilaterally.
- Field names, `unit` values (`reps`, `sec`) and `sets` (always `3`) in the table above were
  extracted from the DB on 08_09_2026 and match.

### Dual-side timed flow
For a `dualSide` exercise with `unit: 'sec'`: prestart countdown, side 1 hold, then a
five-second SWITCH SIDES countdown with audible ticks, then side 2 hold at the same duration,
and only then the rest period. `exSide` (1 or 2) tracks position; `switchTimer` runs the break;
`SWITCH_SEC` is the constant. Rep-based `dualSide` exercises are labelled but not broken up,
because they are self-paced.

---

## 5. Persistence — every `localStorage` key

**Extracted from the code and verified complete on 08_09_2026** — every key below is referenced
in `index.html`, and no key is referenced that is not listed. Re-run the §9 extractor rather than
trusting this table after any change.

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
  Apps Script projects live in Google's editor and are not version-controlled here unless `clasp`
  is set up. A reference copy of the live source sits at `webhook/webhook.gs`, matching
  `WEBHOOK_VERSION` **1.2**, deployed and verified live 08_09_2026. **It is not deployed from
  here** — editing it changes nothing.
- **Routing as of 1.2:** `type: 'session'` → SESSIONS, `type: 'quit'` → QUITS, everything else →
  USERS. The QUITS tab is created on first use, so it will not exist until a real quit lands.
  **The `else` branch is a catch-all** — any new payload type added to the app without a matching
  branch here silently lands in USERS and pollutes the email list. Add the branch first.
- **Deployment label vs `WEBHOOK_VERSION`.** The deployment description is a free-text note
  ("ABracadABra Live v5 - webhook 1.2 - QUITS branch"). Google's internal deployment counter,
  that label, and `WEBHOOK_VERSION` are three separate numbers and are intentionally unsynced.
  Only `WEBHOOK_VERSION` is written into the data.
- **`SHEET_ID` is redacted in `webhook/webhook.gs`, and must stay that way.** This repo is
  public, and that ID points at a sheet holding user emails and session records. Never commit the
  real value. The same applies to any future dump of this script.
- **Finding the live script.** The project was renamed to `Webhookv1.2_08_09_2026` on 08_09_2026
  (previously `ABracadABra Webhookv1.1_07_21_2026`) — **the name tracks the webhook version, so
  do not trust the name written here; search on "Webhook"**. It is
  owned by the **secondary Google account**, not the primary one — that is the whole reason it
  looks missing from `script.google.com`. Fastest route regardless of account: open the logging
  Google Sheet, then **Extensions → Apps Script**.
- **Pruning trigger — verified armed 08_09_2026.** One time-driven trigger: function
  `pruneOldSessions`, deployment Head, monthly on the 1st between 00:00 and 01:00 (GMT-7).
  **The trigger calls that function by name — renaming `pruneOldSessions` silently breaks it.**
- **`RETENTION_DAYS` raised 90 → 365 in Head on 08_09_2026 with no `WEBHOOK_VERSION` bump.** That
  is defensible here, and the reason is worth internalising: **triggers run Head, the web app
  runs the deployment.** `RETENTION_DAYS` is read only by `pruneOldSessions`, which only the
  trigger calls, so the change took effect immediately and the deployed web app is still
  genuinely 1.1. Any edit touching `doPost`/`doGet` is the opposite case — it does nothing until
  you bump the version and create a new deployment.
- **Sheets coerces version strings to numbers.** `'4.0'` logged as `4` for the whole 4.x line.
  SESSIONS columns B and D were set to plain text by hand on 08_09_2026; any new tab carrying a
  version column must do the same via `setNumberFormat('@')` at creation.
  Read the current script before changing it — as of 08_08_2026 it handles `type: 'session'`
  into a SESSIONS tab, and routes everything else into a USERS tab. There is no `'quit'` branch
  yet. A META tab records which script version last served a request.
- **Retention:** a `pruneOldSessions` function deletes SESSIONS rows past a retention window. It
  requires a manual weekly time-driven trigger in the Apps Script Triggers UI. Verify it is armed
  before assuming pruning happens.
- **Redeploying — the 1.2 wording here was wrong and cost a round trip.** Earlier versions of
  this doc said "every code change needs a **new** deployment, not an edit to the existing one."
  Taken literally that is harmful: **New deployment mints a different URL**, and the app's
  `EMAIL_ENDPOINT` still points at the old one, so nothing changes. The correct procedure, which
  preserves the URL:
  **Deploy → Manage deployments → pencil (edit) → Version: "New version" → Deploy.**
  The real gotcha behind the old warning is that opening that edit screen and *not* switching the
  Version dropdown to "New version" redeploys the same old code and looks like nothing happened.
- **"Who has access" must stay `Anyone`.** The app POSTs with no Google login. If this flips, every
  request fails silently — logging is fire-and-forget, so nothing in the app would ever tell you.
- **Verify a deploy by GET, not by eye.** Open the `/exec` URL and read `webhookVersion` from the
  JSON. Do it from a private window or a plain `curl`: a normal Chrome window rewrites the URL
  with a `/u/N/` account prefix and returns a Google Drive "unable to open the file" error that
  has nothing to do with the deployment. That error is an account mismatch, not a broken webhook.
- **Other Apps Script gotchas:** sheet tab names are case-sensitive; always use the constant,
  never a string literal; stray deployments should be archived so the Active list stays at one.
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

**One command, before every commit:**

```bash
python tools/verify.py
```

Add `--webhook` to also compare `webhook/webhook.gs` against the live deployment (needs internet).
Exit code is 0 if everything passes, 1 otherwise, and every check prints PASS or FAIL with the
detail needed to act on it.

**Note `python`, not `python3`.** Until 08_09_2026 this section carried inline `python3 -c "..."`
one-liners that wrote to `/tmp/`. Neither exists on the owner's Windows machine, so the documented
harness had never actually been runnable as written — a §0.6 violation hiding in the section whose
whole job is verification. The escaping needed to embed those regexes in a shell string also kept
corrupting them. Hence a committed script.

What it checks:

| Check | Catches |
|---|---|
| Syntax | the extracted `<script>` block failing `node --check` |
| References | `getElementById` targets with no matching `id`; inline handlers with no function |
| Version agreement | the head comment and `APP_VERSION` disagreeing |
| DESC coverage | a DB exercise with no description, **and** orphan keys from a rename |
| Exercise DB | duplicate names in a group, weighted-at-home, `dualSide`+`altSide`, `sets` ≠ 3 |
| Home pools | any home group below 6, where the 7-day filter starts serving repeats |
| Webhook drift | `webhook/webhook.gs` out of step with the deployed `WEBHOOK_VERSION` |

The harness was negative-tested on 08_09_2026: a removed DESC key, a weighted exercise flagged
home, and a desynced version comment were all caught, exit 1. A check nobody has watched fail is
not a check.

Two known limits. Handlers built inside template strings via `.replace()` can produce false
"missing handler" hits — confirm by reading before treating one as a bug. And the webhook check
compares version numbers only, so a live edit without a `WEBHOOK_VERSION` bump still slips
through; that is why the bump rule matters.

For logic changes to the timer or session flow, write a throwaway Node harness that stubs
`document` and `localStorage` and prints the actual sequence of events. Paste the output as proof.
Do not report a timer change as working on the strength of reading it. The v5.0 quit-logging
harness extracted `logQuitSilently` from the shipped file and asserted the payload, including that
a sub-minute bail logs `0` rather than being rounded up — that is the template to copy.

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
1. **Quit logging — shipped 08_09_2026, one check outstanding.** Webhook 1.2 with the QUITS
   branch is live; app v5.0 is deployed and byte-verified. A synthetic quit was accepted
   (`{"status":"ok"}`) with all-zero indices, the case `||` would have blanked. **Not yet
   confirmed: a real quit from a real phone landing in QUITS.** Until someone checks that, the
   end-to-end path is proven only up to the webhook, not from the device.
   Still genuinely open underneath it: a tab close or Android process kill logs nothing, so
   "abandoned" undercounts. Catching those needs `visibilitychange`/`beforeunload` plus
   deduplication against the resume path, which is a bigger job than it sounds.
2. **Weight tracking depth.** PB logic on weight, progressive-overload suggestions, and per-set
   weight support in the edit-set modal. Currently record-and-display only.
3. **GoatCounter analytics — deferred 08_09_2026, and its stated purpose was wrong.** Earlier
   wording claimed the purpose was "Day-1 and Day-7 retention plus source attribution."
   **GoatCounter cannot do retention.** It is deliberately cookieless and does not follow a
   visitor across days — that is the point of it. It answers *how many* visited and *where from*,
   never *who came back*.
   - **Retention is already available with no new tooling.** Every SESSIONS row carries
     `deviceId` (the persistent anonymous UUID from `abra_device_id`), collected since
     21_07_2026. Group by `deviceId`, compare each device's first session date to its later
     ones — that is Day-1 and Day-7 retention, and it is the number gating item 5.
   - **What GoatCounter would genuinely add:** referrer/source attribution, and the count of
     people who open the app but never start a workout. Neither is visible today, because the
     webhook only fires on completion or quit.
   - **Cost if adopted:** it would be the second external dependency after Google Fonts
     (`gc.zgo.at/count.js`), which §2 forbids without asking first. Ask.
4. **User count display in-app.**
5. **Play Store packaging.** TWA via Bubblewrap, Digital Asset Links, `assetlinks.json`,
   Lighthouse thresholds, a mandatory closed-testing gate with a tester minimum and a waiting
   period, and a one-time developer fee. Explicitly gated on organic retention data first —
   do not start this without the owner saying the retention numbers justify it.
6. **Audio coaching and daily reminders.**
7. **Summit PWA.** Separate project, parked.

---

**End of ABracadABra_CLAUDE_CODE_HANDOFF_v1_9_08_09_2026 — describes app version 5.1 (live)**
