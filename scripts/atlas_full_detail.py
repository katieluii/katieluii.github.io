"""Replay an exact reviewed full-detail projection; source drift requires review."""
import hashlib
import json

FULL_CODES = {'obesity', 'mm', 'nsclc'}


def project_full_detail(raw, code, contract, reviewed_bytes):
    if code not in FULL_CODES:
        raise ValueError('Unexpected full-detail indication')
    if hashlib.sha256(raw).hexdigest() != contract['source_sha256']:
        raise ValueError(f'{code}: source changed; full-detail review required')
    if hashlib.sha256(reviewed_bytes).hexdigest() != contract['candidate_sha256']:
        raise ValueError(f'{code}: public bytes differ from reviewed full-detail artifact')
    candidate = json.loads(reviewed_bytes)
    if candidate.get('indication_code') != code or candidate.get('detail_available') is not True:
        raise ValueError('Full-detail identity or availability mismatch')
    if not any(candidate.get(k) for k in ('approved_therapies', 'approved_therapies_novel')):
        raise ValueError('Full-detail therapy evidence missing')
    if not candidate.get('pipeline_assets'):
        raise ValueError('Full-detail pipeline missing')
    return candidate
