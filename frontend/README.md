# ♞ ChessCure Frontend

> **Think Ahead. Move Smart.**  
> Sharpen your mind with chess challenges and unlock meaningful conversations.

ChessCure is a modern, luxury dark-themed chess web application designed with glowing warm amber/gold aesthetics, interactive game modes, challenges, and conversational unlocks.

---

## 📸 Preview & Highlights

- **Aesthetic Dark Theme**: Deep obsidian and navy palettes with gold/amber glowing accents.
- **3D Hero Visual**: Rendered 3D black knight chess piece illuminated by warm rim lighting.
- **Game Modes**:
  - **Play vs Computer**: Challenge AI engine bots with selectable difficulty levels.
  - **Play Online**: Matchmaking with players around the globe.
  - **Puzzle Mode**: Tactical puzzles and brain training with daily challenges.
- **Challenges & Social Unlocks**: Complete challenges to unlock special chat rooms and grandmaster analysis.
- **Responsive Layout**: Designed for seamless viewing across mobile, tablet, and desktop displays.

---

## 🛠️ Tech Stack

- **Framework**: [React 18](https://react.dev/)
- **Bundler & Dev Server**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & PostCSS
- **Icons**: [Lucide React](https://lucide.dev/)
- **Typography**: Inter (Google Fonts)

---

## 📁 Project Structure

```text
frontend/
├── public/
│   ├── chess_knight_hero.jpg   # 3D knight hero asset
│   └── favicon.ico             # Application favicon
├── src/
│   ├── assets/
│   │   ├── icons/              # Custom SVG and icon assets
│   │   ├── images/             # Visual banners and artwork
│   │   └── logo/               # Branding and logo assets
│   ├── components/
│   │   ├── chess/              # Chessboard, pieces, and game cards
│   │   ├── common/             # Button, Card, Modal, Loader
│   │   └── layout/             # Navbar, Footer, Sidebar
│   ├── context/                # Authentication & game state contexts
│   ├── hooks/                  # Custom React hooks (useAuth, etc.)
│   ├── layouts/                # MainLayout and AuthLayout
│   ├── pages/                  # Landing, Login, Signup, Dashboard, Chat
│   ├── routes/                 # App routing configuration
│   ├── services/               # API clients and HTTP services
│   ├── utils/                  # Helper utilities and formatters
│   ├── App.jsx                 # Main application layout and modal states
│   ├── index.css               # Tailwind directives and custom animations
│   └── main.jsx                # React root entry point
├── index.html                  # HTML entry template
├── package.json                # Project dependencies and scripts
├── tailwind.config.js          # Tailwind theme configuration
└── vite.config.js              # Vite build configuration
```

---

## 🚀 Getting Started

Follow the steps below to set up and run the frontend project locally:

### 1. Prerequisites

Ensure you have **Node.js** (v18.0.0 or higher) and **npm** installed:

```bash
node -v
npm -v
```

### 2. Navigate to the Frontend Directory

Open your terminal or Command Prompt (cmd) and navigate into the `frontend` folder:

```cmd
cd frontend
```

### 3. Install Dependencies

Install the required npm packages:

```cmd
npm install
```

### 4. Start Development Server

Run the local development server:

```cmd
npm run dev
```

Once started, open your browser and go to:
```text
http://localhost:3000/
```

---

## 📜 Available Commands (CMD)

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite local development server on `http://localhost:3000/` with hot module replacement (HMR). |
| `npm run build` | Bundles the application for production into the `dist/` directory. |
| `npm run preview` | Previews the production build locally before deployment. |

---

## 🎨 Color Palette Reference

| Token | Hex Code | Usage |
| :--- | :--- | :--- |
| **Dark Background** | `#080c14` | Body canvas background |
| **Dark Navy Surface** | `#0d1524` | Navigation and container background |
| **Card Background** | `#111a2d` | Game mode and banner cards |
| **Active Gold Accent** | `#e5a93c` | Featured borders, primary buttons, accents |
| **Gold Glow** | `rgba(229, 169, 60, 0.3)` | Shadow & hover glow effects |
| **Muted Text** | `#94a3b8` | Subtitles and descriptions |

---

## 📄 License

This project is licensed under the MIT License.
