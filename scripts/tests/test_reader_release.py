import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('analyst_refresh', ROOT / 'scripts/refresh-analyst-read.py')
refresh = importlib.util.module_from_spec(spec)
spec.loader.exec_module(refresh)


class ReaderReleaseTests(unittest.TestCase):
    def test_specific_articles_only(self):
        for url in ['https://endpts.com/', 'https://www.fda.gov/news-events',
                    'https://clinicaltrials.gov/search?term=rentosertib',
                    'https://www.amgen.com/newsroom', 'javascript:alert(1)', None]:
            self.assertFalse(refresh.is_article_url(url), url)
        self.assertTrue(refresh.is_article_url('https://www.fda.gov/drugs/resources-information-approved-drugs/specific-approval'))
        self.assertTrue(refresh.is_article_url('https://endpts.com/specific-biotech-announcement/'))

    def test_five_themes_have_article_links(self):
        data = json.loads((ROOT / 'src/data/atlas/analyst_read.json').read_text())
        self.assertEqual(len(data['narratives']), 5)
        for narrative in data['narratives']:
            self.assertTrue(narrative['sources'])
            for source in narrative['sources']:
                self.assertTrue(refresh.is_article_url(source.get('url')), source)

    def test_requested_copy_removed(self):
        reader = (ROOT / 'src/pages/AtlasReader.tsx').read_text()
        ecosystem = (ROOT / 'src/pages/AtlasReaderEcosystem.tsx').read_text()
        self.assertNotIn('Open access', reader)
        self.assertNotIn('indications tracked', reader)
        self.assertNotIn('Published artifacts open immediately', reader)
        self.assertIn("if (status === 'planned') return null;", reader)
        self.assertNotIn('The full reasoning, signal trail', ecosystem)


if __name__ == '__main__':
    unittest.main()
