import hashlib
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from atlas_full_detail import project_full_detail


class FullDetailBoundary(unittest.TestCase):
    def setUp(self):
        self.source = b'{"private_research":"preserved"}'
        self.public = json.dumps({'indication_code': 'mm', 'detail_available': True,
                                 'approved_therapies': [{'drug_name': 'Reviewed therapy'}],
                                 'pipeline_assets': [{'asset_name': 'Reviewed trial'}]}).encode()
        self.contract = {'source_sha256': hashlib.sha256(self.source).hexdigest(),
                         'candidate_sha256': hashlib.sha256(self.public).hexdigest()}

    def test_only_reviewed_projection_is_returned(self):
        result = project_full_detail(self.source, 'mm', self.contract, self.public)
        self.assertNotIn('private_research', result)

    def test_mutation_and_scheduled_source_drift_fail_closed(self):
        for source, public in [(self.source + b' ', self.public),
                               (self.source, self.public + b' ')]:
            with self.assertRaises(ValueError):
                project_full_detail(source, 'mm', self.contract, public)

    def test_wrong_identity_rejected_even_when_hash_matches(self):
        with self.assertRaises(ValueError):
            project_full_detail(self.source, 'nsclc', self.contract, self.public)
