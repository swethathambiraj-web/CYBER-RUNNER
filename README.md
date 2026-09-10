# ⚡ CYBER RUNNER - 3-Lane Endless Runner Arcade Game

A full-featured browser-based endless runner game (Subway Surfers / Temple Run style) powered by **Phaser 3** on the frontend and **Django + Django REST Framework** on the backend.

---

## 🎮 Features

### 🕹️ Frontend (Phaser.js Game Engine)
- **3-Lane Perspective Mechanics**: Smooth lane transitions between Left, Center, and Right lanes.
- **Dynamic Physics & Actions**:
  - **Jump (`↑ / W / Space / Swipe Up`)**: Clears low hurdles and potholes/gaps. Includes elevation arcs and ground shadow contraction.
  - **Slide (`↓ / S / Swipe Down`)**: Crouches under high laser bridges with low-profile hitboxes and slide sparks. Fast dive cancels airborne jump.
  - **Lane Switch (`← / → / A / D / Swipe Left & Right`)**: Dodges tall impassable cyber trains and obstacles.
- **Procedural Obstacle & Collectible Spawner**:
  - **Hurdles** (requires Jump)
  - **Overhead High Lasers** (requires Slide)
  - **Cyber Trains** (requires Lane Switch)
  - **Void Gaps** (requires Jump)
  - **Gold Coins** scattered along paths and arcs over hurdles
- **Active Power-Ups**:
  - 🧲 **Magnet**: Auto-pulls nearby gold coins directly into the runner.
  - 🛡️ **Shield**: Absorbs 1 fatal obstacle collision with shatter explosion and gives brief invulnerability.
  - 🚀 **Nitro Speed Boost**: 1.7x supersonic rush that smashes obstacles in path and doubles score.
  - ✨ **2X Multiplier**: Doubles distance score and coins collected.
- **Difficulty Scaling**: Track speed progressively increases as distance accumulates.
- **Synthesized Audio Engine**: Built-in Web Audio API sound synthesizer for zero-dependency retro arcade sound effects (jumping, sliding, coin chimes, explosions, powerups, game over).

### 🖥️ Backend (Django + Django REST Framework)
- **Authentication**: User registration, login, logout, and token authentication (`/api/auth/`).
- **Player Profiles**: Tracks total coin bank, high score, total distance, and unlocked characters.
- **Character Locker & Shop**:
  - Unlock new characters (*Retro Dash*, *Neon Cyberpunk*, *Shadow Ninja*, *Golden King*, *Mecha Bot*) with earned coins.
  - Custom speed multipliers and coin bonus perks per character.
- **Global Leaderboard**:
  - Real-time global high scores ranking with runner names, character icons, coins, and distance.
- **Django Admin Panel**:
  - Complete dashboard to manage characters, power-up configurations, player balances, and score runs.

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- Python 3.10+ (Python 3.13 tested)
- Git (optional)

### 2. Create and Activate Virtual Environment
```bash
# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\activate

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install django djangorestframework django-cors-headers
```

### 4. Run Migrations & Seed Game Data
```bash
python manage.py migrate
python manage.py seed_game_data
```

> **Note**: `seed_game_data` automatically populates the 5 cyberpunk characters, power-up configs, initial leaderboard records, and creates a default superuser:
> - **Username**: `admin`
> - **Password**: `admin123`

### 5. Start the Development Server
```bash
python manage.py runserver 0.0.0.0:8000
```

Open your browser and navigate to:
- **Game Portal**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Global Leaderboard**: [http://127.0.0.1:8000/leaderboard/](http://127.0.0.1:8000/leaderboard/)
- **Admin Dashboard**: [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register/` | Register a new player account (+100 starter coins) | No |
| `POST` | `/api/auth/login/` | Log in and receive auth token | No |
| `POST` | `/api/auth/logout/` | Log out and invalidate token | Yes |
| `GET` | `/api/auth/me/` | Get current authenticated user details | Optional |
| `POST` | `/api/scores/` | Submit run score, coins, and distance | Optional (Guest/User) |
| `GET` | `/api/leaderboard/` | Get top 10 global high scores | No |
| `GET` | `/api/profile/` | Get player stats, unlocked skins, and active runner | Optional |
| `GET` | `/api/shop/` | List all characters, costs, and unlock status | No |
| `POST` | `/api/shop/unlock/` | Spend coins to unlock a character | Yes |
| `POST` | `/api/shop/select/` | Equip an unlocked character | Yes |
| `GET` | `/api/powerups/` | List active power-up configuration stats | No |

---

## 🧪 Running Automated Tests
To run the automated API and model unit tests:
```bash
python manage.py test
```

---

## 🎨 Characters Showcase

| Character | Cost | Speed Perk | Coin Perk | Description |
|---|---|---|---|---|
| **Retro Dash** | Free (0 🪙) | 1.0x | 1.0x | The agile starter runner. Well-balanced and ready for the rails! |
| **Neon Cyberpunk** | 150 🪙 | +8% | +10% | Equipped with high-tech turbo sneakers. |
| **Shadow Ninja** | 350 🪙 | +15% | +25% | Master of shadows with ultra-fast lane reflexes. |
| **Golden King** | 750 🪙 | +10% | **2.0x (Double Coins)** | Royalty on the run! Collects 2X double coins on all runs. |
| **Mecha Bot** | 1200 🪙 | +25% | +50% | Maximum overdrive cybernetic chassis! |
