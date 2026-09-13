"""Exercise the real shell wrapper in disposable Git repositories, with no model calls."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

WRAPPER = Path(__file__).resolve().parents[2] / 'bin/run-analyst-refresh.sh'
RECEIPT = Path.home() / '.claude/bin/job_receipt.py'


class WrapperTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / 'scripts').mkdir()
        (self.root / 'src/data/atlas').mkdir(parents=True)
        self.git('init', '-q', '-b', 'main')
        self.git('config', 'user.name', 'Fixture')
        self.git('config', 'user.email', 'fixture@example.invalid')
        (self.root / 'src/data/atlas/analyst_read.json').write_text('{"narratives": [1,2,3,4,5]}')
        (self.root / 'src/data/atlas/ecosystem.md').write_text('original')
        self.git('add', 'src')
        self.git('commit', '-qm', 'fixture')
        (self.root / 'scripts/sync-atlas-content.py').write_text(
            "import os,sys,pathlib\npathlib.Path('sync-ran').touch()\nsys.exit(int(os.getenv('SYNC_RC','0')))\n")
        (self.root / 'scripts/refresh-analyst-read.py').write_text(
            "import os,sys,pathlib\n"
            "if os.getenv('REFRESH_RC'): sys.exit(int(os.environ['REFRESH_RC']))\n"
            "if os.getenv('SKIP'): print('refresh: ecosystem.md unchanged since today (fp abc) — nothing to do.')\n"
            "else: pathlib.Path('src/data/atlas/ecosystem.md').write_text('refreshed')\n"
            "if os.getenv('LOCK_INDEX'): pathlib.Path('.git/index.lock').touch()\n")
        (self.root / 'assert.py').write_text(
            "import os,sys,pathlib\npathlib.Path('assert-ran').touch()\nsys.exit(int(os.getenv('ASSERT_RC','0')))\n")
        (self.root / 'receipt.py').write_text(
            "import importlib.util,json,sys,pathlib\n"
            f"s=importlib.util.spec_from_file_location('receipt', {str(RECEIPT)!r})\n"
            "m=importlib.util.module_from_spec(s); s.loader.exec_module(m)\n"
            "a=sys.argv[3:]; kw={a[i][2:].replace('-','_'):a[i+1] for i in range(0,len(a),2)}\n"
            "for key in ('items_in','delivered'):\n"
            " if key in kw: kw[key]=int(kw[key])\n"
            "r=m.write(sys.argv[2],root=pathlib.Path('receipts'),**kw)\n"
            "with open('receipt-events.jsonl','a') as f: f.write(json.dumps(r)+'\\n')\n"
            "sys.exit(0 if r['ok'] else 1)\n")
        self.head = self.git('rev-parse', 'HEAD')

    def git(self, *args):
        return subprocess.check_output(['git', *args], cwd=self.root, text=True, timeout=20).strip()

    def run_wrapper(self, **extra):
        env = dict(os.environ, ANALYST_REFRESH_REPO=str(self.root),
                   ANALYST_REFRESH_PYTHON=sys.executable,
                   ANALYST_REFRESH_RECEIPT=str(self.root / 'receipt.py'),
                   ANALYST_REFRESH_ASSERT=str(self.root / 'assert.py'),
                   ANALYST_REFRESH_REVIEW='true', ANALYST_REFRESH_PUSH='false',
                   ANALYST_REFRESH_NOTIFY='false')
        env.update(extra)
        result = subprocess.run(['/bin/bash', str(WRAPPER)], env=env, timeout=30)
        receipt = json.loads((self.root / 'receipts/com.katielui.analyst-refresh.json').read_text())
        return result.returncode, receipt

    def test_review_preserves_staged_work_and_suppresses_push_and_notification(self):
        (self.root / 'unrelated').write_text('keep staged')
        self.git('add', 'unrelated')
        index = (self.root / '.git/index').read_bytes()
        rc, rec = self.run_wrapper(ANALYST_REFRESH_PUSH='true', ANALYST_REFRESH_NOTIFY='true')
        self.assertEqual(rc, 0)
        self.assertTrue(rec['ok'])
        self.assertIn('review=true push=false', rec['note'])
        self.assertEqual(index, (self.root / '.git/index').read_bytes())
        self.assertEqual(self.head, self.git('rev-parse', 'HEAD'))

    def test_sync_failure_is_fresh_failure(self):
        rc, rec = self.run_wrapper(SYNC_RC='7', SKIP='1')
        self.assertEqual(rc, 7)
        self.assertFalse(rec['ok'])
        self.assertFalse(rec['skipped'])
        self.assertIn('phase=sync', rec['note'])
        self.assertFalse((self.root / 'assert-ran').exists())

    def test_refresh_failure(self):
        rc, rec = self.run_wrapper(REFRESH_RC='9')
        self.assertEqual(rc, 9)
        self.assertFalse(rec['ok'])
        self.assertIn('phase=refresh', rec['note'])

    def test_assert_failure_never_writes_success(self):
        rc, rec = self.run_wrapper(ASSERT_RC='8')
        self.assertEqual(rc, 8)
        self.assertFalse(rec['ok'])
        self.assertEqual(len((self.root / 'receipt-events.jsonl').read_text().splitlines()), 1)
        self.assertEqual(self.head, self.git('rev-parse', 'HEAD'))

    def test_skip_requires_validated_source_and_output(self):
        rc, rec = self.run_wrapper(SKIP='1')
        self.assertEqual(rc, 0)
        self.assertTrue(rec['skipped'])
        self.assertTrue((self.root / 'sync-ran').exists())
        self.assertTrue((self.root / 'assert-ran').exists())

    def test_stale_unchanged_output_fails(self):
        rc, rec = self.run_wrapper(SKIP='1', ASSERT_RC='1')
        self.assertNotEqual(rc, 0)
        self.assertFalse(rec['ok'])
        self.assertFalse(rec['skipped'])

    def test_auto_commit_rejects_existing_index(self):
        (self.root / 'unrelated').touch()
        self.git('add', 'unrelated')
        rc, rec = self.run_wrapper(ANALYST_REFRESH_REVIEW='false')
        self.assertNotEqual(rc, 0)
        self.assertFalse((self.root / 'sync-ran').exists())
        self.assertFalse(rec['ok'])

    def test_stage_failure(self):
        rc, rec = self.run_wrapper(ANALYST_REFRESH_REVIEW='false', LOCK_INDEX='1')
        self.assertNotEqual(rc, 0)
        self.assertIn('phase=stage', rec['note'])
        self.assertFalse(rec['ok'])

    def test_commit_failure(self):
        hook = self.root / '.git/hooks/pre-commit'
        hook.write_text('#!/bin/sh\nexit 1\n')
        hook.chmod(0o755)
        rc, rec = self.run_wrapper(ANALYST_REFRESH_REVIEW='false')
        self.assertNotEqual(rc, 0)
        self.assertIn('phase=commit', rec['note'])
        self.assertFalse(rec['ok'])

    def test_push_failure(self):
        rc, rec = self.run_wrapper(ANALYST_REFRESH_REVIEW='false', ANALYST_REFRESH_PUSH='true')
        self.assertNotEqual(rc, 0)
        self.assertIn('phase=push', rec['note'])
        self.assertFalse(rec['ok'])

    def test_paused_has_no_green_skip(self):
        (self.root / 'analyst-refresh-paused').touch()
        rc, rec = self.run_wrapper()
        self.assertNotEqual(rc, 0)
        self.assertFalse(rec['ok'])
        self.assertFalse(rec['skipped'])
        self.assertFalse((self.root / 'sync-ran').exists())


if __name__ == '__main__':
    unittest.main()
