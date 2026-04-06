# Legacy Patch Scripts (Archived)

This folder stores one-off patch and fix scripts that were previously kept in the repository root.

These files are not part of the application runtime and are not part of the default build or test flow.

## Policy

- Do not add new patch or fix scripts to repository root.
- Prefer implementing permanent changes directly in source code and tests.
- If a temporary migration script is required, place it under `scripts/migrations/` with a clear date and purpose.
- After applying and validating a migration script, remove it in the same milestone or archive it here with context.

## Archived from Root

- `fix_css_more.js`
- `fix_html.js`
- `fix_ts.js`
- `patch_css.js`
- `patch_css2.js`
- `patch_css_2.js`
- `patch_energy.js`
- `patch_final.js`
- `patch_html.js`
- `patch_isTargetSelectable.js`
- `patch_java.sh`
- `patch_player.js`
- `update_entities.bash`
