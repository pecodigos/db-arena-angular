# DB-Arena Angular frontend

This is the Angular frontend for Dragon Ball Arena.

## Architecture and Cleanup Guide

See `docs/ARCHITECTURE-CLEANUP.md` for the current frontend architecture direction,
responsibility boundaries, and phased cleanup plan.
See `docs/adr/0001-script-lifecycle-and-root-hygiene.md` for the script lifecycle decision record.

## Repository Hygiene

- Archived one-off patch/fix scripts live in `scripts/legacy-patches/`.
- Temporary active migration scripts should be created in `scripts/migrations/`.
- Validate root hygiene with:

```bash
npm run check:structure
```

## Setup

1. Make sure you have Node.js and npm installed.
2. Install the dependencies:
```bash
npm install
```

## Run

To start the development server:
```bash
npm start
```
The application will be available at `http://localhost:4200`.

## Build

To build the project for production:
```bash
npm run build
```
The build artifacts will be stored in the `dist/` directory.

## Test

To run unit tests:
```bash
npm test
```

## Backend Configuration

Environment configurations are located in:
- `src/environments/environment.ts`
- `src/environments/environment.development.ts`
- `src/environments/environment.prod.ts`

The default backend URL is `http://localhost:8080`.

