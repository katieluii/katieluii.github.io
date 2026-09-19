"""Strict, frozen-source preview projection. Evidence approval is a separate gate."""
import hashlib
import json

SECTIONS = {'approved_therapies', 'approved_therapies_novel', 'pipeline_assets'}
FIELDS = {'drug_name', 'brand', 'asset_name', 'company', 'modality', 'target',
          'indication_line', 'trial', 'trial_name', 'nct', 'source', 'phase', 'status'}
ROOT_FIELDS = {'indication', 'indication_code', 'detail_available', 'detail_rows_shown',
               'detail_note', 'section_counts'} | SECTIONS


def validate_preview(candidate):
    if set(candidate) - ROOT_FIELDS:
        raise ValueError('Unknown preview root field')
    for field in ['indication', 'indication_code', 'detail_note']:
        if not isinstance(candidate.get(field), str) or not candidate[field].strip():
            raise ValueError('Preview metadata must be nonempty strings')
    counts = candidate.get('section_counts', {})
    if not isinstance(counts, dict) or set(counts) - SECTIONS or any(type(v) is not int or v < 0 for v in counts.values()):
        raise ValueError('Invalid preview structural counts')
    if candidate.get('detail_available') is not False or candidate.get('detail_rows_shown') != 3:
        raise ValueError('Preview boundary missing')
    for section in SECTIONS:
        rows = candidate.get(section, [])
        if not isinstance(rows, list) or len(rows) > 3:
            raise ValueError('Preview row cap exceeded')
        for row in rows:
            if not isinstance(row, dict) or set(row) - FIELDS:
                raise ValueError('Unknown preview row field')
            if any(not isinstance(value, str) or not value.strip() for value in row.values()):
                raise ValueError('Preview fields must be nonempty strings')
            if not row.get('source') or not (row.get('drug_name') or row.get('asset_name')):
                raise ValueError('Preview identity or source missing')
    if not any(candidate.get(section) for section in SECTIONS):
        raise ValueError('Empty preview')


def project_preview(raw, code, contract):
    if hashlib.sha256(raw).hexdigest() != contract['source_sha256']:
        raise ValueError(f'{code}: preview source changed; re-review required')
    source = json.loads(raw)
    candidate = dict(contract['metadata'])
    if candidate.get('indication_code') != code:
        raise ValueError('Preview indication mismatch')
    counts = {}
    for section, selectors in contract['sections'].items():
        if section not in SECTIONS or not 1 <= len(selectors) <= 3:
            raise ValueError('Invalid preview section or selector count')
        rows = source.get(section, [])
        if not isinstance(rows, list):
            raise ValueError('Preview source section missing')
        selected = []
        used = set()
        for selector in selectors:
            match = selector['match']
            if not match or set(match) - {'drug_name', 'asset_name', 'nct', 'trial', 'trial_name'}:
                raise ValueError('Invalid stable selector')
            matches = [i for i, row in enumerate(rows) if all(row.get(k) == v for k, v in match.items())]
            if len(matches) != 1 or matches[0] in used:
                raise ValueError('Preview selector missing, ambiguous or duplicate')
            used.add(matches[0])
            selected.append(dict(selector['public']))
        candidate[section] = selected
        counts[section] = len(rows)
    candidate['section_counts'] = counts
    validate_preview(candidate)
    expected = contract.get('candidate_sha256')
    if expected and hashlib.sha256(json.dumps(candidate, indent=2).encode()).hexdigest() != expected:
        raise ValueError('Preview differs from reviewed artifact hash')
    return candidate
