# Migration Scripts

Use this folder for temporary migration scripts that are still actively needed.

Naming convention:

- `YYYYMMDD-short-purpose.js`
- `YYYYMMDD-short-purpose.sh`

Rules:

- Include a header comment with intent, expected inputs, and rollback notes.
- Never place temporary migration scripts in repository root.
- Remove scripts after they are applied and validated.
- If retention is necessary for traceability, move them to `scripts/legacy-patches/` with a short note.
