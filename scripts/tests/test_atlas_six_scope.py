import copy
import hashlib
import json
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from atlas_preview import project_preview, validate_preview

class PreviewBoundary(unittest.TestCase):
    def setUp(self):
        self.raw = json.dumps({'approved_therapies': [{'drug_name': 'A', 'secret': 'private'}, {'drug_name': 'B'}]}).encode()
        self.contract = {'source_sha256': hashlib.sha256(self.raw).hexdigest(), 'metadata': {'indication': 'Test', 'indication_code': 'test', 'detail_available': False, 'detail_rows_shown': 3, 'detail_note': 'Preview'}, 'sections': {'approved_therapies': [{'match': {'drug_name': 'A'}, 'public': {'drug_name': 'A', 'source': 'https://example.org/article'}}]}}
    def test_projection_excludes_withheld_fields(self):
        output = project_preview(self.raw, 'test', self.contract)
        self.assertNotIn('private', json.dumps(output))
        self.assertEqual(output['section_counts'], {'approved_therapies': 2})
    def test_changed_source_rejected(self):
        with self.assertRaises(ValueError): project_preview(self.raw + b' ', 'test', self.contract)
    def test_unknown_nested_field_rejected(self):
        output = project_preview(self.raw, 'test', self.contract)
        for key, value in [('detail_note', {'private': 'hidden'}), ('section_counts', {'private': {'hidden': 1}}), ('section_counts', {'approved_therapies': True})]:
            mutation = copy.deepcopy(output); mutation[key] = value
            with self.assertRaises(ValueError): validate_preview(mutation)
        output['approved_therapies'][0]['private'] = 'hidden'
        with self.assertRaises(ValueError): validate_preview(output)
    def test_cap_and_benchmark_rejected(self):
        output = project_preview(self.raw, 'test', self.contract)
        output['approved_therapies'] *= 4
        with self.assertRaises(ValueError): validate_preview(output)
        output = project_preview(self.raw, 'test', self.contract)
        output['efficacy_benchmarks'] = {}
        with self.assertRaises(ValueError): validate_preview(output)
    def test_no_fallback_for_missing_or_duplicate_selector(self):
        for selector in [{'drug_name': 'missing'}, {}]:
            c = copy.deepcopy(self.contract); c['sections']['approved_therapies'][0]['match'] = selector
            with self.assertRaises(ValueError): project_preview(self.raw, 'test', c)
        c = copy.deepcopy(self.contract); c['sections']['approved_therapies'] *= 2
        with self.assertRaises(ValueError): project_preview(self.raw, 'test', c)

class CandidateArtifactBinding(unittest.TestCase):
    def test_full_detail_contract_cannot_be_removed_or_mutated(self):
        import tempfile
        import shutil
        from check_atlas_scope import check
        root = Path(__file__).resolve().parents[2]
        with tempfile.TemporaryDirectory() as folder:
            temp = Path(folder)
            shutil.copytree(root / 'src/data/atlas', temp / 'src/data/atlas')
            (temp / 'scripts').mkdir()
            config_path = temp / 'scripts/atlas-redaction-config.json'
            original = (root / 'scripts/atlas-redaction-config.json').read_bytes()
            config_path.write_bytes(original)
            check(temp)
            config = json.loads(original)
            del config['etlm_full_detail_contracts']['mm']
            config_path.write_text(json.dumps(config))
            with self.assertRaises(ValueError): check(temp)
            config_path.write_bytes(original)
            artifact = temp / 'src/data/atlas/etlm/mm.json'
            artifact.write_bytes(artifact.read_bytes() + b' ')
            with self.assertRaises(ValueError): check(temp)

    def test_metadata_section_and_count_mutations_rejected(self):
        import tempfile
        import shutil
        from check_atlas_scope import check
        root = Path(__file__).resolve().parents[2]
        with tempfile.TemporaryDirectory() as folder:
            temp = Path(folder)
            shutil.copytree(root / 'src/data/atlas', temp / 'src/data/atlas')
            (temp / 'scripts').mkdir()
            shutil.copy(root / 'scripts/atlas-redaction-config.json', temp / 'scripts/atlas-redaction-config.json')
            check(temp)
            path = temp / 'src/data/atlas/etlm/breast.json'
            original = path.read_bytes()
            for key, value in [('indication_code', 'crc'), ('approved_therapies_novel', [{'drug_name': 'Hidden', 'source': 'https://example.org/article'}]), ('section_counts', {'approved_therapies': 99999})]:
                obj = json.loads(original); obj[key] = value; path.write_text(json.dumps(obj, indent=2))
                with self.assertRaises(ValueError): check(temp)
                path.write_bytes(original)

    def test_excluded_profile_rejected(self):
        import tempfile
        import shutil
        from check_atlas_scope import check
        root = Path(__file__).resolve().parents[2]
        with tempfile.TemporaryDirectory() as folder:
            temp = Path(folder)
            shutil.copytree(root / 'src/data/atlas', temp / 'src/data/atlas')
            (temp / 'scripts').mkdir()
            shutil.copy(root / 'scripts/atlas-redaction-config.json', temp / 'scripts/atlas-redaction-config.json')
            path = temp / 'src/data/atlas/soc/profiles.json'
            profiles = json.loads(path.read_text())
            for code in ['crc', 'nhl_dlbcl', 'urothelial']:
                mutation = dict(profiles); mutation[code] = {'private_detail': 'must not ship'}
                path.write_text(json.dumps(mutation))
                with self.assertRaises(ValueError): check(temp)
