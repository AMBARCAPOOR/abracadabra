#!/usr/bin/env python
"""
ABracadABra verification harness.

Run from the repo root:      python tools/verify.py
Include the webhook check:   python tools/verify.py --webhook   (needs internet)

Exits 0 if everything passes, 1 otherwise. Every check prints PASS or FAIL with
the detail you need to act on it.

This exists as a committed script rather than the inline one-liners §9 used to
carry, because those used `python3` and `/tmp/` and could not run on the
owner's Windows machine at all — and because the escaping needed to embed a
regex inside a shell string kept mangling the regex.
"""

import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, 'index.html')
WEBHOOK_COPY = os.path.join(ROOT, 'webhook', 'webhook.gs')
ENDPOINT = ('https://script.google.com/macros/s/'
            'AKfycbwnuTbLddeBFIErLapHC5-NMFb6b4H1dQYq0h1S53b2fBvGt1uJiZ95LeYZ7gL-LWPn/exec')

NAME_RE = re.compile(r"name:'((?:[^'\\]|\\.)*)'")
KEY_RE = re.compile(r"^\s*'((?:[^'\\]|\\.)*)'\s*:", re.M)
GROUP_RE = re.compile(r'^\s*(\w+):\[')

failures = []


def report(ok, label, detail=''):
    print(('  PASS  ' if ok else '  FAIL  ') + label + (('  ->  ' + detail) if detail else ''))
    if not ok:
        failures.append(label)


def block(src, marker):
    """Return the text of a top-level `const X = {` ... `\n};` block."""
    i = src.index(marker)
    return src[i:src.index('\n};', i)]


def unescape(n):
    return n.replace("\\'", "'")


def main():
    src = open(INDEX, encoding='utf-8').read()
    js = re.findall(r'<script>(.*?)</script>', src, re.S)[0]

    print('\n=== SYNTAX ===')
    tmp = os.path.join(tempfile.gettempdir(), 'abra_check.js')
    with open(tmp, 'w', encoding='utf-8') as fh:
        fh.write(js)
    try:
        r = subprocess.run(['node', '--check', tmp], capture_output=True, text=True)
        report(r.returncode == 0, 'JavaScript parses', r.stderr.strip().split('\n')[0] if r.returncode else '')
    except FileNotFoundError:
        report(False, 'node is installed', 'node not found on PATH')

    print('\n=== REFERENCES ===')
    ids = set(re.findall(r'id="([^"]+)"', src))
    gets = set(re.findall(r"getElementById\('([^']+)'\)", js))
    missing_ids = sorted(g for g in gets if g not in ids)
    report(not missing_ids, 'every getElementById target exists', ', '.join(missing_ids))

    funcs = set(re.findall(r'function\s+([A-Za-z0-9_]+)\s*\(', js))
    handlers = set(re.findall(r'on(?:click|change|input)="([A-Za-z0-9_]+)\(', src))
    missing_h = sorted(h for h in handlers if h not in funcs)
    # Handlers built inside template strings via .replace() can false-positive; confirm by reading.
    report(not missing_h, 'every inline handler exists', ', '.join(missing_h))

    print('\n=== VERSION AGREEMENT ===')
    const_v = re.search(r"const APP_VERSION = '([^']+)'", js)
    comment_v = re.search(r'ABracadABra — v([0-9.]+) —', src)
    cv = const_v.group(1) if const_v else '?'
    hv = comment_v.group(1) if comment_v else '?'
    report(cv == hv and cv != '?', 'header comment matches APP_VERSION',
           'comment=%s const=%s' % (hv, cv))

    print('\n=== DESC COVERAGE ===')
    db = block(src, 'const DB = {')
    desc = block(src, 'const DESC = {')
    names, order = set(), []
    for line in db.split('\n'):
        m = NAME_RE.search(line)
        if m:
            n = unescape(m.group(1))
            if n not in names:
                names.add(n)
                order.append(n)
    keys = set(unescape(k) for k in KEY_RE.findall(desc))
    missing = [n for n in order if n not in keys]
    orphan = sorted(keys - names)
    report(not missing, 'every DB exercise has a DESC entry', ', '.join(missing))
    report(not orphan, 'no orphan DESC keys', ', '.join(orphan))
    print('        (%d exercises, %d descriptions)' % (len(names), len(keys)))

    print('\n=== EXERCISE DB ===')
    group = None
    home, gym, seen, dups, bad = {}, {}, set(), [], []
    for line in db.split('\n'):
        g = GROUP_RE.match(line)
        if g:
            group = g.group(1)
            home[group] = []
            gym[group] = []
            continue
        m = NAME_RE.search(line)
        if not m or not group:
            continue
        n = unescape(m.group(1))
        flat = line.replace(' ', '')
        if (group, n) in seen:
            dups.append('%s/%s' % (group, n))
        seen.add((group, n))
        if 'home:true' in flat:
            home[group].append(n)
            if 'weighted:true' in flat:
                bad.append('weighted at home: ' + n)
        if 'gym:true' in flat:
            gym[group].append(n)
        if 'dualSide:true' in flat and 'altSide:true' in flat:
            bad.append('dualSide+altSide: ' + n)
        if 'sets:3' not in flat:
            bad.append('sets is not 3: ' + n)

    for g in home:
        print('        %-10s home=%-3d gym=%d' % (g, len(home[g]), len(gym[g])))
    smallest = min(len(v) for v in home.values())
    report(not dups, 'no duplicate name inside a group', ', '.join(dups))
    report(not bad, 'no rule violations', '; '.join(bad))
    # 3 exercises per session and a 7-day no-repeat filter: below 6 and the pool
    # empties mid-week and pickEx() starts falling back to repeats.
    report(smallest >= 6, 'every home pool has room for the 7-day filter',
           'smallest=%d' % smallest)

    if '--webhook' in sys.argv:
        print('\n=== WEBHOOK DRIFT ===')
        try:
            import urllib.request
            with urllib.request.urlopen(ENDPOINT, timeout=20) as resp:
                body = resp.read().decode('utf-8', 'replace')
            live = re.search(r'"webhookVersion":"([^"]+)"', body)
            live = live.group(1) if live else '?'
            copy = re.search(r"WEBHOOK_VERSION = '([^']+)'", open(WEBHOOK_COPY, encoding='utf-8').read())
            copy = copy.group(1) if copy else '?'
            report(live == copy and live != '?', 'webhook/webhook.gs matches the live script',
                   'live=%s copy=%s' % (live, copy))
            print('        (version only — a live edit without a bump still slips through)')
        except Exception as exc:
            report(False, 'could not reach the live webhook', str(exc)[:80])
    else:
        print('\n(skipping webhook drift check — add --webhook to include it)')

    print('\n' + ('=' * 46))
    if failures:
        print('FAILED: %d check(s) — %s' % (len(failures), '; '.join(failures)))
        return 1
    print('ALL CHECKS PASSED')
    return 0


if __name__ == '__main__':
    sys.exit(main())
