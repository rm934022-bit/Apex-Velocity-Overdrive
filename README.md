# 🏎️ APEX VELOCITY: OVERDRIVE
### High-Octane 3D Arcade-Sim Racing Game Built from Scratch with Three.js

A browser-first 3D racing game featuring high-gloss supercars, dynamic race circuits, intelligent AI rivals, drift mechanics, nitrous boost, and high-energy Web Audio synthesis.

---

## 🌟 Core Features

- 🏎️ **3 Distinct High-Detail Supercars**:
  - **Apex GT-R**: Exotic twin-turbo supercar with balanced acceleration and high-grip cornering.
  - **Phantom V12**: Low-slung hypercar with staggering top speed ($350\text{ km/h}$) and central aerodynamic stabilizer.
  - **Venom Drift-Spec**: JDM-inspired tuner built for high-angle slides with ducktail spoiler and drift multiplier.
- 🎨 **Garage Showroom & Deep Customization**:
  - Interactive 3D rotating showroom turntable.
  - 6 pearlescent / metallic car paint finishes (Electric Cyan, Sunset Orange, Crimson Red, Midnight Purple, Racing Yellow, Stealth Carbon).
  - Neon Underglow light kits (Cyan, Green, Red, Purple, Off).
- 🛣️ **Grand Prix Circuit (1.6 km)**:
  - Multi-lane textured asphalt with rubber racing lines and dashed dividers.
  - 3D red & white rumble curbs on corner apexes and exits.
  - Metal barrier guardrails lining the perimeter.
  - Overhead electronic Start/Finish Gantry with animated traffic countdown lights (🔴 🔴 🔴 🟢 GO!).
  - High-speed illuminated Tunnel Section with neon strip lighting.
  - Grandstands, spectator crowd, and giant trackside LED sponsor billboards.
- 🏎️💨 **Addictive Arcade-Sim Driving Physics**:
  - Simulated 6-speed automatic transmission with realistic gear ratios and RPM redline.
  - Speed-sensitive steering damping (nimble at low speeds, rock-solid at $300+\text{ km/h}$).
  - Body roll and pitch suspension dynamics (squats under acceleration, dives under braking, leans into turns).
  - **Drift Mechanic**: Tap <kbd>Space</kbd> or flick steering to initiate smooth power-slides. Drifting earns points and refills your Nitrous tank!
  - **Nitrous Boost**: Hold <kbd>Shift</kbd> for explosive acceleration with dual exhaust flame jets, camera shake, and speed-warp radial blur!
- 🏁 **Intelligent AI Competitors**:
  - 3 rival AI race cars on track ("Viper", "Shadow", "Ghost") with distinct car models, colors, and overtaking tactics.
  - Real-time Leaderboard Position tracker (`1st / 4`).
- ⏱️ **Checkpoints, Laps & Standings**:
  - 3-lap Grand Prix championship.
  - Live lap timing, split times, and best lap comparison.
  - 2D Canvas Minimap radar showing track ribbon, player position arrow, and rival dots.
- 🔊 **Full Procedural Web Audio Engine**:
  - Multi-oscillator engine RPM synthesizer that revs from 1000 RPM idle to 8500 RPM screaming redline.
  - Turbo blow-off valve flutter on gear shifts (`pfft-ch-ch`).
  - Dynamic tire screech when drifting or hard braking.
  - Nitrous boost roar and metal barrier impact crashes.
  - High-energy 140 BPM Eurobeat / Drum & Bass racing soundtrack.

---

## 🎮 Controls

| Action | Key / Control |
|---|---|
| **Accelerate** | <kbd>W</kbd> or <kbd>↑</kbd> |
| **Brake / Reverse** | <kbd>S</kbd> or <kbd>↓</kbd> |
| **Steer Left / Right** | <kbd>A</kbd> / <kbd>D</kbd> or <kbd>←</kbd> / <kbd>→</kbd> |
| **Handbrake Drift** | <kbd>Space</kbd> |
| **Nitrous Boost** | <kbd>Shift</kbd> |
| **Toggle Camera (Chase / Hood)** | <kbd>C</kbd> |
| **Reset Car to Track** | <kbd>R</kbd> |
| **Garage / Pause Menu** | <kbd>Escape</kbd> |

---

## 🚀 Running the Game

```bash
npm run dev
# or
npx vite --port 3000 --host
```
Open **`http://localhost:3000/`** in your browser.
