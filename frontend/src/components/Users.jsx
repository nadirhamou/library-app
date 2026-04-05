import { useState, useEffect } from "react";
import { getUsers, createUser, deleteUser, getBooks, borrowForUser, returnForUser } from "../api";

export default function Users() {
  const [users,   setUsers]   = useState([]);
  const [books,   setBooks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [form,    setForm]    = useState({ name: "", email: "", role: "member" });
  const [showForm, setShowForm] = useState(false);
  const [modal,   setModal]   = useState(null); // { userId, action: "borrow"|"return" }
  const [selBook, setSelBook] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const [u, b] = await Promise.all([getUsers(), getBooks()]);
      setUsers(u); setBooks(b);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const flash = (msg, isErr = false) => {
    isErr ? setError(msg) : setSuccess(msg);
    setTimeout(() => { setError(""); setSuccess(""); }, 3000);
  };

  const handleAdd = async () => {
    if (!form.name || !form.email) return flash("Name and email are required", true);
    try {
      await createUser(form);
      setForm({ name: "", email: "", role: "member" });
      setShowForm(false);
      flash("Member added");
      load();
    } catch (e) { flash(e.message, true); }
  };

  const handleAction = async () => {
    if (!selBook) return flash("Select a book", true);
    try {
      if (modal.action === "borrow") {
        await borrowForUser(modal.userId, selBook);
        flash("Book borrowed successfully");
      } else {
        await returnForUser(modal.userId, selBook);
        flash("Book returned successfully");
      }
      setModal(null); setSelBook(""); load();
    } catch (e) { flash(e.message, true); }
  };

  const availableBooks = books.filter(b => b.available);
  const borrowedBooks  = books.filter(b => !b.available);

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Members</h1>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span className="section-count">{users.length} members</span>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "✕ Cancel" : "+ Add Member"}
          </button>
        </div>
      </div>

      {error   && <div className="alert alert-error">⚠ {error}</div>}
      {success && <div className="alert alert-success">✓ {success}</div>}

      {showForm && (
        <div className="form-panel">
          <h3>New Member</h3>
          <div className="form-row">
            <input className="form-input" placeholder="Name" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <input className="form-input" placeholder="Email" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            <select className="form-input" value={form.role}
              onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              <option value="member">Member</option>
              <option value="librarian">Librarian</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleAdd}>Add Member</button>
        </div>
      )}

      {loading ? (
        <div className="loading"><div className="spinner" /><br/>Loading members…</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontFamily: "monospace", color: "var(--muted)" }}>#{u.id}</td>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{u.email}</td>
                  <td><span className="badge badge-role">{u.role}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="btn" onClick={() => { setModal({ userId: u.id, action: "borrow" }); setSelBook(""); }}>
                        Borrow
                      </button>
                      <button className="btn btn-success" onClick={() => { setModal({ userId: u.id, action: "return" }); setSelBook(""); }}>
                        Return
                      </button>
                      <button className="btn btn-danger" onClick={async () => {
                        if (!confirm("Delete member?")) return;
                        try { await deleteUser(u.id); flash("Member deleted"); load(); }
                        catch (e) { flash(e.message, true); }
                      }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{modal.action === "borrow" ? "Borrow a Book" : "Return a Book"}</h2>
            <select className="form-input" value={selBook}
              onChange={e => setSelBook(e.target.value)}>
              <option value="">— Select a book —</option>
              {(modal.action === "borrow" ? availableBooks : borrowedBooks).map(b => (
                <option key={b.id} value={b.id}>{b.title} — {b.author}</option>
              ))}
            </select>
            <div className="modal-actions">
              <button className="btn" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAction}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
