console.log('🟢  RUNNING FILE:', __filename);


const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;
const fs = require('fs');
const session = require('express-session');
const ensureAdmin = require('./middleware/auth');

require('dotenv').config();          // 1) load .env vars
const mongoose = require('mongoose'); // 2) bring Mongoose in

mongoose.set('debug', true);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅  MongoDB Atlas connected'))
  .catch(err => console.error('Mongo connection error:', err));


// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Set the folder for static files (like CSS)
app.use(express.static(path.join(__dirname, 'Public')));

// Route to display the review form
app.get('/', (req, res) => {
  res.render('review_form');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});



  // Store the review in a JSON file
// const filePath = path.join(__dirname, 'data', 'reviews.json');
// let reviews = [];

// try {
//   const fileData = fs.readFileSync(filePath, 'utf8');
//   reviews = JSON.parse(fileData);
// } catch (err) {
//   console.error('Error reading file:', err);
// }


// reviews.push(newReview);


// fs.writeFileSync(filePath, JSON.stringify(reviews, null, 2));

// console.log('Saved review to:', filePath);
// console.log('Current file contents:\n', fs.readFileSync(filePath, 'utf8'));

 
  // console.log("New review submitted:", newReview);

  const Review = require('./models/review_model');

// POST handler
app.post('/submit-review', async (req, res) => {
  console.log('🚩 POST /submit-review hit');      // <‑‑ log #1
  console.log('BODY RECEIVED →', req.body);       // <‑‑ log #2

  try {
    const rating = parseInt(req.body.rating, 10); // ensure Number
    const doc = await Review.create({
      name:   req.body.name,
      email:  req.body.email,
      review: req.body.review,
      rating
    });
    console.log('✅ SAVED DOC →', doc);           // <‑‑ log #3

    res.redirect('/thank-you');
  } catch (err) {
    console.error('❌ Save error:', err);          // <‑‑ log #4
    res.status(500).send('Database error');
  }
});

app.get('/thank-you', (req, res) => {
  res.render('thank_you');
});

// --- sessions ---
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change_this_secret',
    resave: false,
    saveUninitialized: false
  })
);

// ─── Admin login routes ────────────────────────────

// GET login form  →  views/review_admin_login.ejs
app.get('/admin/login', (req, res) => {
  res.render('review_admin_login', { error: null });
});

// POST login (simple password from .env)
app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.redirect('/admin');
  }
  res.render('review_admin_login', { error: 'Wrong password' });
});

app.post('/admin/delete/:id', ensureAdmin, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.redirect('/admin');
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).send('Delete failed');
  }
});


// LOG‑OUT
app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// ─── Protected dashboard ───────────────────────────

app.get('/admin', ensureAdmin, async (req, res) => {
  const reviews = await Review.find().sort({ date: -1 });
  res.render('review_admin', { reviews });   // ← views/review_admin.ejs
});

