require("dotenv").config();
const express = require("express");
const app = express();
const cors = require('cors');
const pg = require("pg");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const verifyToken = require('./middleware/verifyToken');

// cors
app.use(cors());

// Import routes
const authRouter = require('./routes/auth');
const cardsRouter = require('./routes/cards');
const decksRouter = require('./routes/decks');

app.use(express.json());



// Routes
app.use('/api/auth', authRouter);
app.use('/api/cards', verifyToken, cardsRouter);
app.use('/api/decks', verifyToken, decksRouter);

app.get("/", (req, res) => {
    res.send("<h1>Flashcard Memory Trainer API</h1><p>Use /api/cards or /api/decks endpoints</p>");
});

const port = process.env.PORT || 3000;

pool
  .connect()
  .then((client) => {
    return client
      .query("SELECT current_database(), current_user")
      .then((res) => {
        client.release();

        const dbName = res.rows[0].current_database;
        const dbUser = res.rows[0].current_user;

        console.log(
          `Connected to PostgreSQL as user '${dbUser}' on database '${dbName}'`
        );

        console.log(`App listening on port http://localhost:${port}`);
      });
  })
  .then(() => {
    app.listen(port);
  })
  .catch((err) => {
    console.error("Could not connect to database:", err);
  });
