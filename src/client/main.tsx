import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { ChordsPage } from "./pages/ChordsPage.js";
import { LibraryPage } from "./pages/LibraryPage.js";
import { SongPage } from "./pages/SongPage.js";
import { VersionPage } from "./pages/VersionPage.js";
import "./styles/app.css";
import "./styles/sheet.css";

function Nav() {
  return (
    <nav className="app-nav chrome">
      <span className="brand">chord-me</span>
      <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
        Músicas
      </NavLink>
      <NavLink to="/chords" className={({ isActive }) => (isActive ? "active" : "")}>
        Acordes
      </NavLink>
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
        <Routes>
          <Route path="/" element={<LibraryPage />} />
          <Route path="/songs/:songId" element={<SongPage />} />
          <Route path="/versions/:versionId" element={<VersionPage />} />
          <Route path="/chords" element={<ChordsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
