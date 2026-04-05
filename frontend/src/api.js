const BOOK_API  = import.meta.env.VITE_BOOK_SERVICE_URL  || 'http://localhost:3001';
const USER_API  = import.meta.env.VITE_USER_SERVICE_URL  || 'http://localhost:3002';

async function req(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ── Books ──────────────────────────────────────────────
export const getBooks   = ()     => req(`${BOOK_API}/books`);
export const createBook = (body) => req(`${BOOK_API}/books`, { method: 'POST', body: JSON.stringify(body) });
export const deleteBook = (id)   => req(`${BOOK_API}/books/${id}`, { method: 'DELETE' });
export const borrowBook = (id)   => req(`${BOOK_API}/books/${id}/borrow`, { method: 'POST' });
export const returnBook = (id)   => req(`${BOOK_API}/books/${id}/return`, { method: 'POST' });

// ── Users ──────────────────────────────────────────────
export const getUsers   = ()     => req(`${USER_API}/users`);
export const createUser = (body) => req(`${USER_API}/users`, { method: 'POST', body: JSON.stringify(body) });
export const deleteUser = (id)   => req(`${USER_API}/users/${id}`, { method: 'DELETE' });

// ── Loans (via user-service) ───────────────────────────
export const getLoans       = ()                   => req(`${USER_API}/loans`);
export const borrowForUser  = (userId, bookId)     => req(`${USER_API}/users/${userId}/borrow/${bookId}`, { method: 'POST' });
export const returnForUser  = (userId, bookId)     => req(`${USER_API}/users/${userId}/return/${bookId}`, { method: 'POST' });
