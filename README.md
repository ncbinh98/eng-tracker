# ENG_CORE - English Progress Tracker

A professional, mobile-first English learning tracker built for precision progress management. features a multi-book architecture, streak engine, and a GitHub-style activity heatmap.

## ✨ Features

- **Multi-Book Tracking**: Manage multiple study materials (e.g., Grammar, Vocabulary, Reading) in one dashboard.
- **GitHub-style Heatmap**: Visualize your consistency over the last 35 days with color-coded intensity levels.
- **Streak Engine**: Real-time calculation of consecutive study days (localized to GMT+7).
- **Daily Check-ins**: Quick logging of unit progress for specific books.
- **Single-File Portability**: Build your app into a single standalone HTML file that works anywhere without a server.
- **Modern UI**: High-end Slate/Zinc dark theme with glowing interactive states and responsive design.

## 🚀 Quick Start

### 1. Local Development

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

### 2. Configuration

Copy `.env.example` to `.env` and add your Google Script URL:

```env
VITE_GOOGLE_SCRIPT_URL=your_google_script_url_here
```

### 3. Build & Deploy

Generate a self-contained, portable HTML version in the `dist/` folder:

```bash
npm run build
```

## 🛠️ Tech Stack

- **Frontend**: Vite + Tailwind CSS v4 (Modern CSS-first approach)
- **Deployment**: `vite-plugin-singlefile` (Stand-alone portability)
- **Backend**: Google Apps Script (Serverless data persistence)
- **Database**: Google Sheets (Multi-sheet: `books` & `progress`)

## 📄 Backend Setup (Google Apps Script)

1. Create a new Google Sheet.
2. In the "Extensions" menu, choose "Apps Script".
3. Copy the contents of `google-apps-script.js` into the editor.
4. Run the `setup()` function once.
5. Deploy as a Web App (Access: Anyone).
6. Copy the Web App URL into your `.env` file.

## 📁 Project Structure

- `index.html`: Main application entry and structure.
- `style.css`: Modern styling using Tailwind v4 blocks.
- `app.js`: Core logic, state management, and heatmap engine.
- `google-apps-script.js`: Backend logic for data persistence.
- `vite.config.js`: Build configuration for single-file bundling.

## 📝 License

MIT
