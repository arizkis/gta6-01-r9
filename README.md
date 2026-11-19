# HIGH WATER

*a Sunspur surge run*

[![make.fun competition](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![Live rank](https://make.fun/badge/gta6-01/arizkis/gta6-01-r9/rank.svg)](https://make.fun/bounty/gta6-01)
[![Reward](https://make.fun/badge/gta6-01/arizkis/gta6-01-r9/reward.svg)](https://make.fun/bounty/gta6-01)

Juno Reed needs to move a load of cold cargo across Sunspur Bay before the monsoon surge closes the causeway. Drive through five neighborhoods or explore on foot. Rain sends people for cover while water rises on the boulevard and around the market and pier.

Explore a seeded city with four weather presets, rising water, traffic and pedestrians. Witnesses and patrols track plate, face and outfit evidence. The cooler's temperature and integrity determine its payout; Tideworks offers repairs and upgrades. Complete jobs to unlock all six runs, bank earnings, and build respect with the contacts.

| Job | Contact | What to do |
| --- | --- | --- |
| The Cooler Caper | Tavi Moss · Fixer | Recover COLDFIN and bring the cooler to Tin Cup Pier. |
| Sandbag Run | Niko Vale · Mechanic | Rush repair supplies to the Marigold barricade. |
| Market Mercy | Paz Sol · Fence | Gather three crates and bring them to the Citrus safehouse. |
| Clear Your Name | Tavi Moss · Fixer | Change clothes, swap plates and repaint the van. |
| Five Districts | Niko Vale · Mechanic | Hit a checkpoint in every district before time runs out. |
| The Surge Run | Paz Sol · Fence | Cross the causeway with the cooler before the surge. |

Run `node serve.ts` from the repository and open <http://localhost:8080> in desktop Chrome. Node 22 or newer is recommended. The game loads its assets from the local server.

| Key | Action |
| --- | --- |
| WASD / arrows | Walk or drive |
| Shift | Sprint on foot or brake while coasting |
| E | Use the nearby interaction; enter or leave a vehicle |
| F | Change radio station |
| X | Drop a purchased spike strip |
| T | Open phone messages |
| Esc / P | Pause or resume |
| Enter | Start from the title screen |

The four staged routes are `/?shot=cover&seed=17`, `/?shot=market&seed=17`, `/?shot=garage&seed=17` and `/?shot=causeway&seed=17`. Each sets the live systems, camera and scene, without changing the free-play save. Wait for `window.__shotReady`, then capture at 1280 × 960 using the corresponding filename from [shots.json](shots.json). Each JPEG must stay at or below 256 KiB.

Package the local build with `MAKEFUN_OUTPUT_DIR=out node main.ts`. It writes `game/`, `screenshots/` and `dossier.json` into `out/`.

make.fun referral code: **8kbmacyg**.
