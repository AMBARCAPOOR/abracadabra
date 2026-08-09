// ═══════════════════════════════════════════════════════
// REFERENCE COPY — NOT DEPLOYED FROM THIS REPO.
//
// The live script runs in Google's Apps Script editor. Editing this file
// changes nothing. To change the webhook you must edit it there and then use
// Deploy -> Manage deployments -> pencil -> Version: "New version" -> Deploy.
// Do NOT use "New deployment": that mints a different URL and the app's
// EMAIL_ENDPOINT would still point at the old one. See CLAUDE.md §7.
//
// To find the live script: open the logging Google Sheet, then
// Extensions -> Apps Script. It is owned by the SECONDARY Google account.
//
// SHEET_ID IS REDACTED BELOW ON PURPOSE. This repo is public and that ID
// points at a sheet holding user emails and session records. Never commit the
// real value. Copy it from the live script when you need it.
//
// Captured from live script 08_09_2026 · WEBHOOK_VERSION 1.2
// Verified live by anonymous GET: {"status":"alive","webhookVersion":"1.2"}
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// ABracadABra — Google Apps Script webhook
// WEBHOOK_VERSION: 1.2
// Last updated: 2026-08-09
// Bump WEBHOOK_VERSION (and this date) every time you edit and redeploy this
// script. It gets written into every row logged AND into the META tab, so you
// can always tell which version of this script wrote which data.
// ═══════════════════════════════════════════════════════
const WEBHOOK_VERSION = '1.2';
const WEBHOOK_UPDATED = '2026-08-09';

const SHEET_ID = 'REDACTED — copy from the live Apps Script project';
const USERS_SHEET = 'USERS';
const SESSIONS_SHEET = 'SESSIONS';
const META_SHEET = 'META';
const QUITS_SHEET = 'QUITS'; // NEW in 1.2: abandoned sessions

// 0 is a real value here (instant bail, first exercise, first set). `||` would turn
// every one of those into a blank, so don't use it on these fields.
function numOr(v, fallback) { return (v === undefined || v === null) ? fallback : v; }

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
    updateMeta(ss);

    if (data.type === 'session') {
      let sheet = ss.getSheetByName(SESSIONS_SHEET);
      if (!sheet) {
        sheet = ss.insertSheet(SESSIONS_SHEET);
        sheet.appendRow([
          'timestamp', 'webhookVersion', 'deviceId', 'appVersion', 'location',
          'durationMin', 'totalSets', 'exercisesJSON', 'userAgent'
        ]);
        sheet.getRange('B:B').setNumberFormat('@');
        sheet.getRange('D:D').setNumberFormat('@');
      }
      sheet.appendRow([
        new Date().toISOString(),
        WEBHOOK_VERSION,
        data.deviceId || '',
        data.appVersion || '',
        data.location || '',
        data.durationMin || 0,
        data.totalSets || 0,
        JSON.stringify(data.exercises || []),
        data.userAgent || ''
      ]);

    } else if (data.type === 'quit') {
      // NEW in 1.2. Without this branch these fall through to USERS and pollute the email list.
      let sheet = ss.getSheetByName(QUITS_SHEET);
      if (!sheet) {
        sheet = ss.insertSheet(QUITS_SHEET);
        sheet.appendRow([
          'timestamp', 'webhookVersion', 'deviceId', 'appVersion', 'location',
          'durationMin', 'totalSets', 'quitExIdx', 'quitExName', 'quitSetIdx', 'totalEx',
          'exercisesJSON', 'userAgent'
        ]);
        sheet.getRange('B:B').setNumberFormat('@'); // version columns as text, not numbers
        sheet.getRange('D:D').setNumberFormat('@');
      }
      sheet.appendRow([
        new Date().toISOString(),
        WEBHOOK_VERSION,
        data.deviceId || '',
        data.appVersion || '',
        data.location || '',
        numOr(data.durationMin, ''),
        numOr(data.totalSets, ''),
        numOr(data.quitExIdx, ''),
        data.quitExName || '',
        numOr(data.quitSetIdx, ''),
        numOr(data.totalEx, ''),
        JSON.stringify(data.exercises || []),
        data.userAgent || ''
      ]);

    } else {
      // Unchanged behavior: existing email-capture path writes to USERS
      let sheet = ss.getSheetByName(USERS_SHEET);
      sheet.appendRow([
        new Date().toISOString(),
        data.email || '',
        data.source || 'abracadabra',
        data.userAgent || '',
        data.sessionCount || 0,
        WEBHOOK_VERSION
      ]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', webhookVersion: WEBHOOK_VERSION }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', msg: err.message, webhookVersion: WEBHOOK_VERSION }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try { updateMeta(SpreadsheetApp.openById(SHEET_ID)); } catch(e) {}
  // Hit this URL directly in a browser any time to confirm which version is live.
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'alive',
      webhookVersion: WEBHOOK_VERSION,
      updated: WEBHOOK_UPDATED
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ═══════════════════════
// VERSION VISIBILITY IN THE SHEET
// ═══════════════════════
function updateMeta(ss) {
  let sheet = ss.getSheetByName(META_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(META_SHEET);
    sheet.appendRow(['webhookVersion', 'updated', 'lastRequestAt']);
  }
  sheet.getRange(2, 1, 1, 3).setValues([[WEBHOOK_VERSION, WEBHOOK_UPDATED, new Date().toISOString()]]);
}

// ═══════════════════════
// SHEET BLOAT CONTROL
// ═══════════════════════
const RETENTION_DAYS = 365;

// NAME MUST STAY EXACTLY THIS — the monthly trigger calls it by name.
// Renaming it breaks the trigger silently.
function pruneOldSessions() {
  pruneTabByAge(SESSIONS_SHEET);
  pruneTabByAge(QUITS_SHEET);
}

function pruneTabByAge(tabName) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(tabName);
  if (!sheet) return;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return; // header only, nothing to prune

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000);
  const timestamps = sheet.getRange(2, 1, lastRow - 1, 1).getValues(); // col A = timestamp
  let deleteCount = 0;
  for (let i = 0; i < timestamps.length; i++) {
    if (new Date(timestamps[i][0]) < cutoff) deleteCount++;
    else break; // append-order = chronological, so stop at the first non-stale row
  }
  if (deleteCount > 0) sheet.deleteRows(2, deleteCount);
}
