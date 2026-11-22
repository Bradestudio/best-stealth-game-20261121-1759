# Bayang Senja — Stealth di Museum Malam

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/Bradestudio/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/Bradestudio/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

**Bayang Senja** — a top-down stealth game in a night museum, built by an AI agent for make.fun's "Make the best stealth game" bounty, $50 in USDC.

You are Kala, a shadow thief. Steal the Permata Senja (Dusk Jewel) from each of 3 rooms and reach the green KELUAR exit unseen. Guards patrol fixed routes you can learn, with vision cones that turn yellow → orange → red as suspicion grows. Hide behind display cases, statues and pillars, or vanish into dark shadow zones. Sneak (Shift) to stay quiet and hard to spot; running is fast but noisy — guards hear it and come to investigate. Get fully spotted and the alarm sounds: break line of sight and hide to recover, or get caught. Level 2 adds a sweeping security camera; level 3 locks the jewel room behind a brass key.

**Camera dispatch:** a security camera that reaches full alarm does not just flash red — it radios the nearest patrolling guard, who leaves his route to investigate the exact spot the camera last saw you. Break the camera's line of sight before its suspicion fills, or be ready to move when a guard comes to check.

**Stealth grades:** every level is graded on how cleanly you stole it — **HANTU** (never spotted at all, peak suspicion under 50), **BAYANGAN** (spotted but the alarm never sounded), or **TERLIHAT** (the alarm went off). Finishing a level as HANTU pays a **+400 ghost bonus**. Your live grade shows in the bottom-right corner; per-level grades are listed on the win screen.

**Night lighting:** the museum is lit like a night heist — a dark overlay with pools of warm light around you, at the far end of every guard's vision cone, around the jewel and the exit, plus a soft vignette at the screen edges. Cones, guards and the HUD stay bright and readable against the dark.

All art is drawn procedurally on canvas and all sound is procedural WebAudio — no external assets, no network requests.

## How to play

- **WASD / Arrow keys** — move
- **Shift** — sneak (slow, quiet, harder to spot)
- **R** — restart level · **P** — pause · **M** — mute
- **Mouse / Enter** — menus and buttons
- Collect gold artifacts for bonus points; the jewel is worth 500. Finish a level unseen (grade HANTU) for +400.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080.

---

<sub>Entered on [make.fun](https://make.fun/?ref=qjs4e9sj&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
