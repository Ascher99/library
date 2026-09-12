# The Library - Book Catalogue https://ascher99.github.io/library/

A responsive, high-performance web application designed to search the global library catalog and curate a list of your favorite books. Built using Vanilla HTML, CSS (via modern variables & CSS custom drawings), and Vanilla JS (ES6+), compiled and optimized with Vite.

## Task
The full requirements and evaluation criteria of this assignment are defined in the [Task Checklist](./task.md).

### Core Features implemented:
- **Global Book Search**: Search by title, author, or keyword using the Open Library API.
- **On-the-Fly Search**: Results update automatically as you type, using a debounced search (500ms delay) with request cancellation (`AbortController`) to prevent race conditions.
- **Author Filtering**: Filter current search results and favorite lists by author name dynamically.
- **Favorite Books**: Add books to a favorites list which persists across page reloads using `localStorage`.
- **Elegant Bookish Theme**: Implements a curated warm sepia background with forest green accents, styled using exact design tokens.
- **Custom CSS Book Covers**: If a book doesn't have an available cover, an elegant CSS placeholder cover is rendered dynamically showing the book title, avoiding generic gray boxes.
- **Responsive Layout**: Designed with a dual-column layout on desktop and a mobile-friendly layout with a sliding drawer for favorites on smaller screens.

---

## Folder Structure

```text
library/
├── dist/                     # Production build outputs
│   ├── index.html            # Compiled HTML template
│   ├── index.js              # Bundle of all JS logic (CSS styles injected at runtime)
│   └── assets/               # Static folder containing site icons (e.g. logo.svg)
├── public/
│   └── assets/               # Static assets folder (favicon and icons) copied to dist/ during build
├── src/
│   ├── api.js                # Open Library search fetch API logic with AbortController
│   ├── favorites.js          # LocalStorage favorites state management
│   ├── main.js               # Central application orchestrator and event binding
│   ├── style.css             # CSS design tokens, animations, and layout rules
│   └── utils.js              # General helpers (such as debounce)
├── index.html                # Main application HTML file
├── package.json              # Script directives and developer tools dependencies (Vite)
├── vite.config.js            # Configuration settings for Vite bundling and CSS injection
└── README.md                 # Project documentation 
```

---

## How to Run the App

Ensure you have [Node.js](https://nodejs.org/) (v18+) and NPM installed on your machine.

### 1. Install Dependencies
Run the following command in the project root directory:
```bash
npm install
```

### 2. Start Local Development Server
Launch the Vite development server with hot module replacement:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to view the live app.

### 3. Build for Production
To build the application for deployment, run:
```bash
npm run build
```
This produces a `dist/` directory containing exactly three items as specified:
1. `index.html` (the HTML loader)
2. `index.js` (the compiled JavaScript including inlined CSS)
3. `assets/` (folder containing the logo/favicon icon)

### 4. Preview Production Build Locally
Verify the production build locally before deploying:
```bash
npm run preview
```
