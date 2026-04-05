const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
app.use(cors());
app.use(express.json());

// Book service URL (via Kubernetes service or env var)
const BOOK_SERVICE_URL = process.env.BOOK_SERVICE_URL || 'http://localhost:3001';

// Database setup
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, { dialect: 'postgres', logging: false })
  : new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });

// User model
const User = sequelize.define('User', {
  id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:     { type: DataTypes.STRING, allowNull: false },
  email:    { type: DataTypes.STRING, allowNull: false, unique: true },
  role:     { type: DataTypes.ENUM('member', 'librarian'), defaultValue: 'member' },
  borrowedBooks: { type: DataTypes.JSON, defaultValue: [] },
});

// Loan model
const Loan = sequelize.define('Loan', {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId:     { type: DataTypes.INTEGER, allowNull: false },
  bookId:     { type: DataTypes.INTEGER, allowNull: false },
  borrowedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  returnedAt: { type: DataTypes.DATE },
  status:     { type: DataTypes.ENUM('active', 'returned'), defaultValue: 'active' },
});

// Seed data
async function seed() {
  await sequelize.sync({ force: true });
  await User.bulkCreate([
    { name: 'Alice Martin',  email: 'alice@library.com',  role: 'librarian' },
    { name: 'Bob Dupont',    email: 'bob@library.com',    role: 'member' },
    { name: 'Clara Durand',  email: 'clara@library.com',  role: 'member' },
  ]);
  console.log('Database seeded');
}

// Routes
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'user-service' }));

app.get('/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/users/:id', async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.post('/users', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/users/:id', async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  await user.destroy();
  res.json({ message: 'User deleted' });
});

// Borrow a book (calls book-service)
app.post('/users/:userId/borrow/:bookId', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Call book-service to mark book as borrowed
    const bookRes = await axios.post(`${BOOK_SERVICE_URL}/books/${req.params.bookId}/borrow`);
    const book = bookRes.data.book;

    // Record loan
    const loan = await Loan.create({ userId: user.id, bookId: book.id });

    res.json({ message: `${user.name} borrowed "${book.title}"`, loan });
  } catch (e) {
    const status = e.response?.status || 500;
    res.status(status).json({ error: e.response?.data?.error || e.message });
  }
});

// Return a book (calls book-service)
app.post('/users/:userId/return/:bookId', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Call book-service to mark book as returned
    const bookRes = await axios.post(`${BOOK_SERVICE_URL}/books/${req.params.bookId}/return`);
    const book = bookRes.data.book;

    // Update loan record
    const loan = await Loan.findOne({
      where: { userId: user.id, bookId: book.id, status: 'active' },
      order: [['borrowedAt', 'DESC']],
    });
    if (loan) await loan.update({ returnedAt: new Date(), status: 'returned' });

    res.json({ message: `${user.name} returned "${book.title}"`, loan });
  } catch (e) {
    const status = e.response?.status || 500;
    res.status(status).json({ error: e.response?.data?.error || e.message });
  }
});

// Get all loans
app.get('/loans', async (req, res) => {
  const loans = await Loan.findAll();
  res.json(loans);
});

// Get loans for a user
app.get('/users/:id/loans', async (req, res) => {
  const loans = await Loan.findAll({ where: { userId: req.params.id } });
  res.json(loans);
});

const PORT = process.env.PORT || 3002;
seed().then(() => {
  app.listen(PORT, () => console.log(`User service running on port ${PORT}`));
});
