require("dotenv").config();
const express = require("express");
const app = express();
const pg = require("pg");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Import routes
const cardsRouter = require('./routes/cards');
const decksRouter = require('./routes/decks');

app.use(express.json());

// Enable CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Routes
app.use('/api/cards', cardsRouter);
app.use('/api/decks', decksRouter);

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
