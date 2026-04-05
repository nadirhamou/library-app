import { useState, useEffect } from "react";
import Books from "./components/Books";
import Users from "./components/Users";
import Loans from "./components/Loans";
import "./App.css";

const NAV = [
  { id: "books", label: "📚 Books", },
  { id: "users", label: "👤 Members" },
  { id: "loans", label: "📋 Loans" },
];

export default function App() {
  const [tab, setTab] = useState("books");

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">⬡</span>
            <div>
              <span className="logo-title">BIBLIOTHÈQUE</span>
              <span className="logo-sub">Library Management System</span>
            </div>
          </div>
          <nav className="nav">
            {NAV.map((n) => (
              <button
                key={n.id}
                className={`nav-btn ${tab === n.id ? "active" : ""}`}
                onClick={() => setTab(n.id)}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="main">
        {tab === "books"  && <Books />}
        {tab === "users"  && <Users />}
        {tab === "loans"  && <Loans />}
      </main>

      <footer className="footer">
        <span>Library MS · Microservices Architecture · Docker + Kubernetes</span>
      </footer>
    </div>
  );
}
