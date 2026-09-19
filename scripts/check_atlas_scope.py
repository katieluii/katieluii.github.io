"""Verify the six-indication public projection; this is not clinical clearance."""
import json
import hashlib
from pathlib import Path
from atlas_preview import validate_preview

FULL = {'obesity', 'mm', 'nsclc'}
PREVIEWS = {'parkinsons', 'breast', 'urothelial'}
CODES = FULL | PREVIEWS


def check(root):
    data = root / 'src/data/atlas'
    cfg = json.loads((root / 'scripts/atlas-redaction-config.json').read_text())
    if set(cfg['etlm_whitelist']) != CODES or set(cfg['etlm_summary_only']) != PREVIEWS:
        raise ValueError('Release policy differs from approved scope')
    if set(cfg.get('etlm_full_detail_contracts', {})) != FULL:
        raise ValueError('Every full-detail indication requires a reviewed artifact contract')
    if cfg.get('tpp_whitelist') or cfg.get('theme_whitelist') or cfg.get('ecosystem_publication') != 'withheld':
        raise ValueError('Supplemental artifacts are not cleared for this release')
    for folder in ('tpp', 'theme', 'memo', '_analyst_read_history'):
        if any(p.is_file() for p in (data / folder).rglob('*')):
            raise ValueError(f'Withheld supplemental artifact remains: {folder}')
    for name in ('ecosystem.md', 'analyst_read.json'):
        if (data / name).exists():
            raise ValueError(f'Withheld supplemental artifact remains: {name}')
    if {p.stem for p in (data / 'etlm').glob('*.json')} != CODES:
        raise ValueError('Public indication payload set is not exactly six')
    catalog = json.loads((data / 'catalog.json').read_text())
    entries = catalog['indications']
    if len(entries) != 6 or {x['id'] for x in entries} != CODES:
        raise ValueError('Catalogue is not exactly six unique indications')
    for entry in entries:
        expected = 'full' if entry['id'] in FULL else 'summary'
        if entry['landscape']['mode'] != expected or entry['landscape']['artifacts'] != [{'slug': entry['id']}]:
            raise ValueError('Catalogue route or detail boundary mismatch')
    for code in PREVIEWS:
        raw = (data / 'etlm' / f'{code}.json').read_bytes()
        candidate = json.loads(raw)
        validate_preview(candidate)
        contract = cfg['etlm_preview_contracts'][code]
        if hashlib.sha256(raw).hexdigest() != contract['candidate_sha256']:
            raise ValueError('Preview bytes differ from reviewed artifact')
        if candidate.get('indication_code') != code:
            raise ValueError('Preview indication mismatch')
        for section, selectors in contract['sections'].items():
            if candidate.get(section) != [selector['public'] for selector in selectors]:
                raise ValueError('Preview differs from reviewed selection')
    for code in FULL:
        raw = (data / 'etlm' / f'{code}.json').read_bytes()
        if json.loads(raw).get('detail_available') is not True:
            raise ValueError('Full detail was silently downgraded')
        contract = cfg['etlm_full_detail_contracts'][code]
        if hashlib.sha256(raw).hexdigest() != contract['candidate_sha256']:
            raise ValueError('Full-detail bytes differ from reviewed artifact')
    profiles = json.loads((data / 'soc/profiles.json').read_text())
    if set(profiles) - FULL:
        raise ValueError('Excluded indication presentation payload')
    cross = json.loads((data / 'cross_link_map.json').read_text())
    if cross.get('tpp_to_etlm') or cross.get('theme_to_indications') or any(
        value for key in ('etlm_to_tpps', 'etlm_to_themes') for value in cross[key].values()
    ):
        raise ValueError('Withheld supplemental cross-links remain')
    for key in ['etlm_to_tpps', 'etlm_to_themes']:
        if set(cross[key]) != CODES:
            raise ValueError('Cross-link catalogue scope differs')
    if any(code not in CODES for code in cross['tpp_to_etlm'].values()):
        raise ValueError('TPP links to excluded indication')
    if any(code not in CODES for codes in cross['theme_to_indications'].values() for code in codes):
        raise ValueError('Theme links to excluded indication')
    for path in (root / 'public').rglob('*'):
        if path.is_file() and ('atlas' in path.parts or 'etlm' in path.parts):
            raise ValueError(f'Unreviewed downloadable Atlas payload: {path}')


if __name__ == '__main__':
    check(Path(__file__).resolve().parents[1])
    print('Six-indication scope and strict preview projection: PASS (not clinical clearance)')
