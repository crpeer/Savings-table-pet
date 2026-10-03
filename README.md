# Savings Table Pet

A small, non-transactional pet savings journal. This project records plans and activities locally; it never connects to a bank, initiates payments, or handles real funds.

## Run

Because this is a dependency-free browser app, open `index.html` directly or serve the repository with any static HTTP server:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Customizing the pet

Replace or add files under `assets/` and update `src/config.js`:

- `petImage`: the character skin image
- `backgroundImage`: optional scene background
- `actionImages`: optional images for food, water, shopping, and pocket money

Missing images automatically render as friendly placeholders, so the app works before custom art is added.

## Data and cross-device sync

The application state is defined in `src/model.js`. Persistence is separated behind adapters in `src/storage.js`:

- `localStorageAdapter` is the default offline storage.
- `customSyncAdapter` is an example interface for a user-owned backend.

To add synchronization, replace the adapter in `src/app.js` with an implementation of `load()`, `save(state)`, `exportState()`, and `importState(json)`. Do not put bank credentials in this app. A backend should authenticate users and validate data independently.

The Import/Export controls use JSON and are intended for backup or transfer between devices.

## Extension points

- `src/input.js` contains the manual input adapter and the future OCR adapter interface.
- `src/model.js` contains pure state transitions that can be tested independently.
- `assets/` is reserved for skins, backgrounds, and action illustrations.

This project intentionally does not implement bank linking, payment, transfers, custody, or financial advice.
