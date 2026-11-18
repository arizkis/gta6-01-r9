# HIGH WATER foundation verification

Verified in desktop Chrome through the Playwright MCP server on 18 November 2026 UTC. The local game server ran on port 8089. This is the foundation pass; gameplay execution and final submission captures belong to the next two passes.

## Browser checks

| Check | Observed result |
| --- | --- |
| Load and start | The title loaded; Enter and the START RUN button both opened the live HUD. |
| Walk and sprint | Keyboard movement worked; player pace changed from 7.5 to 12 with Shift. |
| District transition | Walking north from the spawn crossed from SUNSPUR STRAND to MARIGOLD MARKET, with the HUD updating. All six district sample positions returned their expected names. |
| Surge | The live clock counted down from 12:00. A controlled zero-time probe closed the causeway, then restored the original state. |
| Water | The spawn and driven car showed 14 CM. Zone samples returned Strand 14, market drain 7, pier steps 11, causeway ramp 0 and east spillway 4 cm at the initial surge level. |
| Enter, drive, brake, exit | E entered SOLACE GT; W changed its position and speed; the camera followed; braking slowed the car; E exited into a free position. Speed and 100% condition appeared in the vehicle card. |
| Collision | A separate copy of a vehicle driven at a building boundary stopped at speed 0 with 90 condition. The live vehicle was not altered by this probe. |
| Pause and board | Escape paused, RESUME continued, and the job board contained six jobs with five locked. |
| Traffic | Twenty-one traffic vehicles changed position and had their headlights visible in the storm test. |
| Pedestrians | The final build had 40 pedestrians: four sheltering, 24 carrying visible umbrellas, and zero inside solid geometry at the observed frame. Movement was also verified before the shelter placement adjustment. |
| COLDFIN | The van was at x=980, z=1770 in the impound. Its interaction read Enter COLDFIN FREEZER VAN. |
| Weather | stormDusk, wetMidday, neonNight and dawn all rendered in a controlled preset probe. Rain values were 1, .48, .78 and .05 respectively. |
| HUD | Visually inspected at 1024 by 768; queried HUD labels, meters and evidence chips had a minimum font size of 14 px. |
| Console | The final page load returned zero errors and zero warnings. Earlier loads emitted four Chrome GPU ReadPixels performance warnings. |
| Network | All 20 final-page resource requests were local HTTP 200 responses. The browser resource list contained no external requests. |

The native 5-second screenshot helper timed out once. A subsequent unedited browser screenshot with a 30-second timeout succeeded and was inspected from the ignored .playwright-mcp directory. This was a layout check, not a submission screenshot. Chrome's software graphics renderer was slow during automated interaction; no hardware frame-rate claim is made.

## Source and packaging

- All authored JavaScript passed node --check; git diff --check returned no whitespace errors.
- vendor/makefun-game.ts remained byte-identical to starter c6bf3ae.
- Three.js r160 was downloaded into game/vendor/three.min.js without editing it. SHA-256: 3e690ac7d180b0aadf0891bea39eec643e29e2d3e75c99b18689518665f69ba6.
- The root entrypoint has authored packaging comments. The owner file, three r9 README badges, referral text and four future shot mappings are present.
- Two independent output directories were produced with MAKEFUN_OUTPUT_DIR and compared recursively: all 24 output files were byte-identical.
- The final foundation dossier was 167293 bytes; SHA-256 b2f01f198c67a42b927034480b36d3ef92f5037009e3e91acdcab81d17228d8b.

## Remaining passes

Wanted and evidence logic, police tactics, cooler execution, mission objectives and payouts, dialogue, phone, economy, radio, garage upgrades and reactive effects are not implemented in this foundation. The six job definitions and their board exist; selecting the first job sets its pickup objective.

The screenshot staging routes are documented and mapped but not implemented yet. The three starter screenshots are still present and must be replaced with the four HIGH WATER captures in the capture pass. No submission or final kit check was performed here.
