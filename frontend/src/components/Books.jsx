import { useState, useEffect } from "react";
import { getBooks, createBook, deleteBook, borrowBook, returnBook } from "../api";

const EMPTY_FORM = { title: "", author: "", isbn: "", genre: "" };

export default function Books() {
  const [books,   setBooks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setBooks(await getBooks());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const flash = (msg, isErr = false) => {
    isErr ? setError(msg) : setSuccess(msg);
    setTimeout(() => { setError(""); setSuccess(""); }, 3000);
  };

  const handleAdd = async () => {
    if (!form.title || !form.author) return flash("Title and author are required", true);
    try {
      await createBook(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
      flash("Book added successfully");
      load();
    } catch (e) { flash(e.message, true); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this book?")) return;
    try { await deleteBook(id); flash("Book deleted"); load(); }
    catch (e) { flash(e.message, true); }
  };

  const handleBorrow = async (id) => {
    try { await borrowBook(id); flash("Book marked as borrowed"); load(); }
    catch (e) { flash(e.message, true); }
  };

  const handleReturn = async (id) => {
    try { await returnBook(id); flash("Book returned"); load(); }
    catch (e) { flash(e.message, true); }
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Books</h1>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span className="section-count">{books.length} titles</span>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "✕ Cancel" : "+ Add Book"}
          </button>
        </div>
      </div>

      {error   && <div className="alert alert-error">⚠ {error}</div>}
      {success && <div className="alert alert-success">✓ {success}</div>}

      {showForm && (
        <div className="form-panel">
          <h3>New Book</h3>
          <div className="form-row">
            {["title","author","isbn","genre"].map(f => (
              <input
                key={f}
                className="form-input"
                placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                value={form[f]}
                onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))}
              />
            ))}
          </div>
          <button className="btn btn-primary" onClick={handleAdd}>Add Book</button>
        </div>
      )}

      {loading ? (
        <div className="loading"><div className="spinner" /><br/>Loading books…</div>
      ) : books.length === 0 ? (
        <div className="empty">No books found.</div>
      ) : (
        <div className="cards-grid">
          {books.map(b => (
            <div className="card" key={b.id}>
              <div className="card-title">{b.title}</div>
              <div className="card-sub">{b.author}</div>
              <div className="card-meta">
                {b.genre && <span className="badge badge-genre">{b.genre}</span>}
                <span className={`badge ${b.available ? "badge-avail" : "badge-taken"}`}>
                  {b.available ? "Available" : "Borrowed"}
                </span>
                {b.isbn && <span className="badge badge-genre" style={{fontSize:"0.6rem"}}>{b.isbn}</span>}
              </div>
              <div className="card-actions">
                {b.available
                  ? <button className="btn" onClick={() => handleBorrow(b.id)}>Borrow</button>
                  : <button className="btn btn-success" onClick={() => handleReturn(b.id)}>Return</button>
                }
                <button className="btn btn-danger" onClick={() => handleDelete(b.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
