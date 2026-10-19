# Single-Viewport Desktop Architecture, Immersive 5v5 Battle & Idol Agency Schedule

Upgrade **IDOL POCKET 3D** so every core Desktop screen (**Pack 3D**, **Binder**, **Queendom Survival Tower**, and **5v5 Battle Arena**) fits cleanly into a **Single-Viewport Frame (1 Section per Screen without scrolling to play)**, eliminates the empty right-side space in the Binder with a **5-Card Balanced Grid**, overhauls the **5v5 Live Battle** with physical card lunges, elemental projectiles, and interactive Lightstick Fan-Chant boosting, and introduces the **Idol Agency Schedule** for farming Star Diamonds (`💎`) and Star Coins (`🪙`) using spare photocards.

## User Review & Critical Decisions

> [!IMPORTANT]
> All design and gameplay preferences confirmed during our clarification step are locked in below:

- **Confirmed Decision 1 — Single-Viewport Section Layout & 5-Card Balanced Grid**:
  - **Binder & Stage Unit**: Divided into dedicated full-screen sub-sections (**Koleksi 3D Binder**, **Formasi 5v5 Stage Unit**, and **Jadwal Agensi**) inside a widened `1280px` (`max-w-7xl`) container. The Binder uses a **5-Column Balanced Grid (`lg:grid-cols-5`)** so 5 cards fill the entire row symmetrically with zero empty space on the right.
  - **Queendom Survival Tower & World Tour**: Fits 100% inside a single Desktop frame without scrolling. The **"⚔️ Tantang Lantai Sekarang"** play button is promoted to the **top-right header** of the floor spotlight panel, and all **5 Rival Cards** sit in a single horizontal row (`grid-cols-5`) without wrapping into a second row.
  - **Pack 3D Single-Viewport Studio**: Consolidates the Pack Selection & Reveal Theater into a strict single-viewport frame (`overflow-hidden` on Desktop) where all 5 pulled cards sit side-by-side in a 5-column stage without vertical scrolling.
- **Confirmed Decision 2 — Full Immersive 5v5 Battle Package**:
  - **3D Card Lunge & Clash Physics**: Attacking cards physically lunge across the stage toward their target slot with impact recoil and hit-stop flashes.
  - **Elemental Projectile Beams**: Animated elemental attacks (*Water Wave*, *Volt Lightning*, *Fire Blaze*, *Starlight Prism*) travel from the attacker card to the target card before damage pops.
  - **Interactive Lightstick Fan-Chant Boost**: A live interactive button (`Space` or Click) lets producers cheer during battle to boost the Hype Gauge, spawn stage lightstick particles, and grant a live **+15% ATK Fan-Chant Aura** to their unit.
- **Confirmed Decision 3 — Idol Agency Schedule (Ekspedisi Kartu Cadangan)**:
  - Spare photocards not currently in the 5v5 Stage Unit can be dispatched to 3 daily Agency Schedules (*Variety Show*, *Brand Ambassador Shoot*, and *Music Show Special*) to harvest **Star Diamonds (`💎`)**, **Star Coins (`🪙`)**, and **Bond XP**.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Zero-Scroll Single-Viewport Desktop Experience**: Players no longer have to scroll down past stacked sections just to click "Play" in Queendom Tower or view their Binder cards. Each sub-section occupies a dedicated, balanced 1-screen frame.
  2. **5-Column Full-Width Card Grids**: Both the Binder, the 5v5 Stage Unit, the Queendom Rival Preview, and the Pack 3D Reveal Stage use a unified 5-card horizontal grid (`max-w-7xl`) that eliminates dead space on the right side of the container.
  3. **High-Impact 5v5 Stage Battle**: Transforms the battle arena from static card slots into a kinetic K-Pop concert showdown with physical card lunges, elemental beam projectiles, dynamic camera zoom, and interactive Lightstick cheering.
  4. **Idol Agency Schedule**: Gives every collected card in the player's Binder real economic value by letting bench idols complete agency schedules for Star Diamonds (`💎`) and Star Coins (`🪙`).

---

## 2. User Experience & Visual Design

- **Single-Viewport Spatial Math (`1440×900` Desktop Baseline)**:
  - **Top HUD**: `52px` height (`top-2.5`).
  - **Active Single-Viewport Stage**: `calc(100dvh - 136px)` (`pt-16 pb-20`), using `max-w-7xl` (`1280px` width) so 5 cards of width `208px` (`5 × 208px = 1040px` + `4 × 16px gaps = 64px` = `1104px`) fit with exact symmetrical padding inside the panel and **zero right-side gap**.
  - **Bottom Navigation Dock**: `60px` height (`bottom-2.5`).
- **Binder Sub-Section Switcher**:
  - Top bar inside the Binder screen features a 3-way segmented control:
    1. **📚 Koleksi 3D Binder (256 Kartu)** — Full-width 5-column grid (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 justify-items-center`) with instant search, Rarity/Era filters, and clean page navigation (`Halaman 1 / N` · 10 kartu per halaman) so cards never overflow awkwardly.
    2. **⚔️ Formasi 5v5 Stage Unit** — Full-frame showcase of the 5 active Stage Unit cards in a single row, Center Bias Bond meter, active Synergy breakdown, and one-click **"Susun Unit Terkuat Otomatis"**.
    3. **📅 Jadwal Agensi (Farm 💎 & 🪙)** — Interactive dispatch board where bench idols are assigned to 3 agency schedules to claim daily Star Diamonds and Coins.
- **Queendom Survival Tower Single-Frame Layout**:
  - **Left Panel (4 Columns)**: Compact 10-Floor Ladder (`2×5` grid) where all 10 floors fit cleanly in a single view without scrolling.
  - **Right Panel (8 Columns)**:
    - **Top Action Header**: Displays Floor Title, Elemental Role Buff (`+25% ATK`), Power comparison (`Power Kamu vs Lawan`), and the primary **"⚔️ Tantang Lantai Sekarang"** CTA button right at the top right so you can launch battles immediately.
    - **Center 5-in-a-Row Rival Formation**: All 5 enemy cards sit side-by-side in a single row (`grid-cols-5 gap-3 justify-items-center`), completely eliminating the 3+2 row wrap from the previous layout.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Section Sub-Tabs & Paginated 5-Column Grid vs. Long Vertical Scroll**
  - *Chosen Approach*: Dedicated sub-section switcher (`Koleksi Binder` | `Formasi 5v5 Unit` | `Jadwal Agensi`) with a 5-column grid.
  - *Why*: Eliminates both the empty space on the right of the 4-card flex wrap and the tedious vertical scrolling between the Stage Unit and the Binder.
- **Decision 2: Compositor-Smooth Battle Lunges & Elemental SVG Beams**
  - *Chosen Approach*: Track active attacker/target coordinates and render GPU-accelerated lunge transforms (`translate3d` + `scale`) paired with an SVG elemental beam overlay (`Water`, `Volt`, `Fire`, `Prism`) and an interactive **Lightstick Fan-Chant Boost** button.
  - *Why*: Delivers immediate visual impact and player agency during 5v5 battles while maintaining 60fps performance.
- **Decision 3: Instant-Assign Idol Agency Schedule**
  - *Chosen Approach*: 3 daily agency schedules that automatically select eligible spare idols from the player's collection (excluding the 5 active battle unit members) or let the player click **"Utus Idol Cadangan & Klaim Hadiah"**.
  - *Why*: Rewards collectors for owning a wide roster of idols and provides a steady, balanced source of **+31 Star Diamonds (`💎`)** and **+680 Star Coins (`🪙`)** per day for PSA Card Grading.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     App.tsx (Single-Viewport Game Shell)                   │
│  Top HUD (Lv · Coins 🪙 · Diamonds 💎 · Tickets 🎫 · Bias) + Bottom Dock   │
└───────┬──────────────────────────┬─────────────────────────┬───────────────┘
        │                          │                         │
        ▼                          ▼                         ▼
┌──────────────────────┐ ┌─────────────────────────┐ ┌───────────────────────┐
│   PackRipView.tsx    │ │   BinderDeckView.tsx    │ │   WorldTourView.tsx   │
│  Single-Viewport 3D  │ │ 3-Section Switcher:     │ │ Single-Viewport Frame │
│  Pack Studio & 5-Col │ │ 1. 5-Col Paginated Grid │ │ Top-Right Play CTA +  │
│  Theater Reveal      │ │ 2. 5v5 Unit Formation   │ │ 5-in-a-Row Rival Row  │
│                      │ │ 3. Idol Agency Schedule │ │ (Zero Scroll to Play) │
└──────────────────────┘ └─────────────────────────┘ └───────────┬───────────┘
                                                                 │
                                                                 ▼
                                                     ┌───────────────────────┐
                                                     │ BattleArenaModal.tsx  │
                                                     │ • 3D Card Lunge/Clash │
                                                     │ • Elemental Beam VFX  │
                                                     │ • Lightstick Boost    │
                                                     └───────────────────────┘
```

### Data Model & Pure Game Logic (`SaveState`)
- **`agencyScheduleClaimed: Record<string, boolean>`**: Tracks which of the 3 daily Agency Schedules (`variety_show`, `brand_shoot`, `music_bank`) have been completed today (resets automatically on daily reset).
- **`AGENCY_SCHEDULES`**:
  - `variety_show`: Requires 2 spare owned cards · Rewards `+140 🪙`, `+6 💎`, `+20 Bond XP`.
  - `brand_shoot`: Requires 2 spare owned cards (at least 1 Rare+) · Rewards `+220 🪙`, `+10 💎`, `+30 Bond XP`.
  - `music_bank`: Requires 3 spare owned cards (at least 1 Epic+) · Rewards `+320 🪙`, `+15 💎`, `+45 Bond XP`.
- **`executeAgencySchedule(state, scheduleId)`**: Pure function that validates spare card eligibility (cards owned in `inv` that are not currently needed or using bench idols), awards `coins`, `diamonds`, and `biasBondXp`, and marks the schedule completed for the day.
