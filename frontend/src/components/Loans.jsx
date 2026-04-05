import { useState, useEffect } from "react";
import { getLoans } from "../api";

export default function Loans() {
  const [loans,   setLoans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    getLoans()
      .then(setLoans)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const active   = loans.filter(l => l.status === "active");
  const returned = loans.filter(l => l.status === "returned");

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Loans</h1>
        <span className="section-count">{active.length} active · {returned.length} returned</span>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      {loading ? (
        <div className="loading"><div className="spinner" /><br/>Loading loans…</div>
      ) : loans.length === 0 ? (
        <div className="empty">No loans recorded yet.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>User ID</th>
                <th>Book ID</th>
                <th>Borrowed At</th>
                <th>Returned At</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loans.map(l => (
                <tr key={l.id}>
                  <td style={{ fontFamily: "monospace", color: "var(--muted)" }}>#{l.id}</td>
                  <td>User #{l.userId}</td>
                  <td>Book #{l.bookId}</td>
                  <td style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                    {new Date(l.borrowedAt).toLocaleDateString()}
                  </td>
                  <td style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                    {l.returnedAt ? new Date(l.returnedAt).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    <span className={`badge ${l.status === "active" ? "badge-taken" : "badge-avail"}`}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
