// ═══════════════════════════════════════════════════════
// REFERENCE COPY — NOT DEPLOYED FROM THIS REPO.
//
// The live script runs in Google's Apps Script editor. Editing this file
// changes nothing. To change the webhook you must edit it there and create a
// NEW deployment (not an edit to the existing one) — see CLAUDE.md §7.
//
// To find the live script: open the logging Google Sheet, then
// Extensions → Apps Script. It is owned by the Google account that owns the
// sheet, which may not be the primary account, and the project is not named
// "abracadabra".
//
// SHEET_ID IS REDACTED BELOW ON PURPOSE. This repo is public and that ID
// points at a sheet holding user emails and session records. Never commit the
// real value. Copy it from the live script when you need it.
//
// Captured from live script 08_09_2026 · WEBHOOK_VERSION 1.1
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// ABracadABra — Google Apps Script webhook
// WEBHOOK_VERSION: 1.1
// Last updated: 2026-07-21
// Bump WEBHOOK_VERSION (and this date) every time you edit and redeploy this
// script. It gets written into every row logged AND into the META tab, so you
// can always tell which version of this script wrote which data.
// ═══════════════════════════════════════════════════════
const WEBHOOK_VERSION = '1.1';
const WEBHOOK_UPDATED = '2026-07-21';

const SHEET_ID = 'REDACTED — copy from the live Apps Script project';
const USERS_SHEET = 'USERS';
const SESSIONS_SHEET = 'SESSIONS';
const META_SHEET = 'META';

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
// Keeps a one-row META tab showing the version/date of whatever code last
// actually served a request — so you can check the live version from the
// sheet itself, without opening the script editor. Cheap: one range write.
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
// Deletes SESSIONS rows older than RETENTION_DAYS. Doesn't touch USERS (that's
// low-volume, one row per opt-in, no bloat risk).
// Set up once: in the Apps Script editor, click the clock icon (Triggers) on the
// left sidebar → Add Trigger → function: pruneOldSessions → Time-driven →
// Week timer → pick a day/time. Runs itself from then on, no further action needed.
const RETENTION_DAYS = 90;

function pruneOldSessions() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SESSIONS_SHEET);
  if (!sheet) return;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return; // header only, nothing to prune

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000);
  const timestamps = sheet.getRange(2, 1, lastRow - 1, 1).getValues(); // col A = timestamp
  let deleteCount = 0;
  for (let i = 0; i < timestamps.length; i++) {
    if (new Date(timestamps[i][0]) < cutoff) deleteCount++;
    else break; // rows are append-order = chronological, so we can stop at the first non-stale row
  }
  if (deleteCount > 0) sheet.deleteRows(2, deleteCount);
}
