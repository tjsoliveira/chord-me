import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, NavLink, Route, Routes } from "react-router-dom";
import { ChordsPage } from "./pages/ChordsPage.js";
import { LibraryPage } from "./pages/LibraryPage.js";
import { SongPage } from "./pages/SongPage.js";
import { VersionPage } from "./pages/VersionPage.js";
import "./styles/app.css";
import "./styles/sheet.css";

function Nav() {
  return (
    <nav className="app-nav chrome" aria-label="Principal">
      {/* Link, not NavLink: on "/" the brand would otherwise take the same
          active treatment as Músicas and two rows would read as current. */}
      <Link to="/" className="brand">
        chord-me
      </Link>
      <div className="app-nav-links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          Músicas
        </NavLink>
        <NavLink to="/chords" className={({ isActive }) => (isActive ? "active" : "")}>
          Acordes
        </NavLink>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {/* Each page owns its own container: .page for the centred screens,
          .workspace for the full-bleed version editor. */}
      <div className="app-shell">
        <Nav />
        {/* The rail sits beside the content, so the pages need their own
            column: they still expect to stretch inside a vertical flow. */}
        <div className="app-main">
          <Routes>
            <Route path="/" element={<LibraryPage />} />
            <Route path="/songs/:songId" element={<SongPage />} />
            <Route path="/versions/:versionId" element={<VersionPage />} />
            <Route path="/chords" element={<ChordsPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
