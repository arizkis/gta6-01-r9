# HIGH WATER capture verification

Checked on 19 November 2026 in the Playwright MCP browser, served by `node serve.ts` on the local server. All four final images are unedited 1280 × 960 JPEG captures at quality 82, taken after `window.__shotReady` and viewed again from disk.

| Capture | Bytes | Observed frame |
| --- | ---: | --- |
| 01-cover-surge.jpg | 221863 | Close drifting COLDFIN, street canyon, helicopter and cone, lightning, police ahead and at the rear quarter, umbrellas, spray streaks and wet glints. The HUD shows five response rows, SPOTLIGHT, four stars, cleared FACE evidence, 04:12, 138 KM/H, 5.8°C, 87%, $3,915 and 44 CM. |
| 02-market-rainbreak.jpg | 184071 | Juno large among umbrellas, produce stalls, scooters and sandbags. Tavi's urgent message, market objective, vitals and small map are visible. |
| 03-garage-night.jpg | 170609 | COLDFIN and Niko close to the camera, lift, neon floor reflections, doorway rain and splashes, passing traffic, upgrade list, vehicle bars, dialogue, radio and search chip. |
| 04-causeway-dawn.jpg | 150667 | Pale dawn, prominent van and causeway sign, debris, traffic, two fishers with rods and buckets, pink map route and payout panel showing $4,500, RESPECT +1 and BANKED $10,500. |

The larger text groups stay within the three-panel budget; telemetry uses compact chips. At 1024 × 768, visible HUD leaf text measured at least 14 px in cover/market and 15 px in garage/causeway. The cover speed measured 64 px. No checked HUD text crossed the outer 5% safe area.

Free play loaded without a shot query, started through the title button, and accepted keyboard walking, E to enter SOLACE, and W to drive. The car moved from x=1186 to x=1204.072 at speed 30.044 while the surge clock continued. The final free-play load made 32 local requests, no external requests and no browser errors. Initial automation needed correction for an asynchronous polling predicate and more time for software-rendered walking; the completed input check used synchronous state polling. Chromium emitted GPU ReadPixels performance warnings during capture.

Two successive `MAKEFUN_OUTPUT_DIR=out node main.ts` builds produced matching SHA-256 manifests for all 37 output files. A stale starter screenshot in the generated output initially broke the four-image cap; the packager now refreshes its generated trees before copying.

- Game: 32 files, 34 entries including directories, 827381 bytes.
- Authored game source: 31 files, 156700 bytes; dossier text including its outline: 158735 bytes, with no truncation.
- Dossier: 1132040 bytes; SHA-256 `ab22a614ae800466ac6dca10ce683933782fb3fe1afec0506c232174beb3b65e`.
- Authored JavaScript syntax checks and `git diff --check` passed.

## Check configuration and recording references

The kit CLI help was read before checking. Check the committed GitHub-repository entry with `check --kit . --repo /home/hatch/workspace/makefun/projects/gta6-01/entry-r9 --commit <final SHA>`. The CLI accepts transcript files or bundles through `--transcripts`; its help exposes no recording-ID argument. No transcript file is fabricated from the following recording references. Submission-time transcript rows are expected to skip locally.

- T1: `01a1f08e-e892-735f-a6e7-688908f435d5`
- T2: `01a1f0ac-1514-7618-93f3-cf2acd03210f`
- T3: `01a1f11a-4b02-7730-a8e0-d4d91f91bd4a`
- T4: `01a1f18f-d09d-7371-b505-38fa8b71b829`

No submission, recording closure or comparison against live competitor sheets was performed in this pass.
