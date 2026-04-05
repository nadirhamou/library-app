const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
app.use(cors());
app.use(express.json());

// Database setup (SQLite in-memory for dev, PostgreSQL in prod)
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, { dialect: 'postgres', logging: false })
  : new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });

// Book model
const Book = sequelize.define('Book', {
  id:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title:  { type: DataTypes.STRING, allowNull: false },
  author: { type: DataTypes.STRING, allowNull: false },
  isbn:   { type: DataTypes.STRING, unique: true },
  genre:  { type: DataTypes.STRING },
  available: { type: DataTypes.BOOLEAN, defaultValue: true },
});

// Seed data
async function seed() {
  await sequelize.sync({ force: true });
  await Book.bulkCreate([
    { title: 'The Great Gatsby',      author: 'F. Scott Fitzgerald', isbn: '978-0743273565', genre: 'Classic',    available: true },
    { title: 'To Kill a Mockingbird', author: 'Harper Lee',          isbn: '978-0061935466', genre: 'Classic',    available: true },
    { title: 'Dune',                  author: 'Frank Herbert',        isbn: '978-0441013593', genre: 'Sci-Fi',     available: false },
    { title: '1984',                  author: 'George Orwell',        isbn: '978-0451524935', genre: 'Dystopian',  available: true },
    { title: 'Clean Code',            author: 'Robert C. Martin',     isbn: '978-0132350884', genre: 'Tech',       available: true },
  ]);
  console.log('Database seeded');
}

// Routes
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'book-service' }));

app.get('/books', async (req, res) => {
  try {
    const books = await Book.findAll();
    res.json(books);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/books/:id', async (req, res) => {
  const book = await Book.findByPk(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json(book);
});

app.post('/books', async (req, res) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json(book);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/books/:id', async (req, res) => {
  const book = await Book.findByPk(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  await book.update(req.body);
  res.json(book);
});

app.delete('/books/:id', async (req, res) => {
  const book = await Book.findByPk(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  await book.destroy();
  res.json({ message: 'Book deleted' });
});

// Borrow / Return
app.post('/books/:id/borrow', async (req, res) => {
  const book = await Book.findByPk(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  if (!book.available) return res.status(409).json({ error: 'Book already borrowed' });
  await book.update({ available: false });
  res.json({ message: 'Book borrowed successfully', book });
});

app.post('/books/:id/return', async (req, res) => {
  const book = await Book.findByPk(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  await book.update({ available: true });
  res.json({ message: 'Book returned successfully', book });
});

const PORT = process.env.PORT || 3001;
seed().then(() => {
  app.listen(PORT, () => console.log(`Book service running on port ${PORT}`));
});
