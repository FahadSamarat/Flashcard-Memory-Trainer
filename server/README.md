# Flashcard Memory Trainer - Server

This is the backend API for the Flashcard Memory Trainer application, implementing the SuperMemo 2 (SM2) spaced repetition algorithm.

## Features

- **SM2 Algorithm**: Implements the SuperMemo 2 spaced repetition algorithm
- **Deck Management**: Create, read, update, and delete flashcard decks
- **Card Management**: Full CRUD operations for flashcards
- **Review System**: Grade cards (0-5 scale) and automatically schedule next reviews
- **Statistics**: Track learning progress and review history
- **PostgreSQL**: Robust database with proper indexing and relationships

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database
1. Create a PostgreSQL database
2. Set your database URL in a `.env` file:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/flashcard_db
   ```
3. Run the database schema:
   ```bash
   psql -d your_database_name -f database.sql
   ```

### 3. Start the Server
```bash
npm start
```

The server will run on `http://localhost:3000`

### 4. Test the API
```bash
npm test
```

## API Endpoints

### Decks
- `GET /api/decks` - Get all decks
- `POST /api/decks` - Create a new deck
- `GET /api/decks/:id` - Get a specific deck
- `PUT /api/decks/:id` - Update a deck
- `DELETE /api/decks/:id` - Delete a deck
- `GET /api/decks/:id/stats` - Get deck statistics
- `POST /api/decks/:id/cards` - Add multiple cards to a deck

### Cards
- `GET /api/cards/due` - Get cards due for review today
- `GET /api/cards/new` - Get new cards (not yet reviewed)
- `GET /api/cards/learn` - Get cards in learning phase
- `POST /api/cards` - Create a new card
- `POST /api/cards/:id/review` - Review a card (SM2 algorithm)
- `GET /api/cards/:id` - Get a specific card
- `PUT /api/cards/:id` - Update a card
- `DELETE /api/cards/:id` - Delete a card
- `GET /api/cards/stats/overview` - Get overall statistics

## SM2 Algorithm

The SuperMemo 2 algorithm is implemented with the following grade scale:
- **0**: Again (Complete blackout)
- **1**: Hard (Incorrect response; but the correct one remembered)
- **2**: Good (Correct response recalled with serious difficulty)
- **3**: Good (Correct response with some hesitation)
- **4**: Easy (Correct response with perfect recall)

### Algorithm Logic
1. **Grade < 3**: Reset to learning phase (repetition = 0, interval = 1 day)
2. **Grade ≥ 3**: Progress through intervals:
   - First repetition: 1 day
   - Second repetition: 6 days
   - Subsequent repetitions: interval × ease factor

## Database Schema

### Tables
- **decks**: Flashcard decks
- **cards**: Individual flashcards with SM2 data
- **review_history**: Track all review sessions

### Key Fields
- `repetition`: Number of successful repetitions
- `interval`: Current interval in days
- `ef`: Ease factor (1.3 - 2.5)
- `next_review`: When the card should be reviewed next

## Testing with Postman

1. Import the API documentation from `API_DOCUMENTATION.md`
2. Set up a collection with base URL: `http://localhost:3000/api`
3. Test the endpoints in this order:
   - Create a deck
   - Add cards to the deck
   - Get due/new cards
   - Review cards with different grades
   - Check statistics

## Development

### File Structure
```
server/
├── routes/
│   ├── cards.js      # Card-related endpoints
│   └── decks.js      # Deck-related endpoints
├── server.js         # Main server file
├── database.sql      # Database schema
├── test_api.js       # API test script
├── API_DOCUMENTATION.md
└── package.json
```

### Adding New Features
1. Create new route files in the `routes/` directory
2. Import and use them in `server.js`
3. Update the API documentation
4. Add tests to `test_api.js`

## Environment Variables

Create a `.env` file in the server directory:
```
DATABASE_URL=postgresql://username:password@localhost:5432/flashcard_db
PORT=3000
```

## Troubleshooting

### Common Issues
1. **Database Connection**: Ensure PostgreSQL is running and DATABASE_URL is correct
2. **Port Already in Use**: Change PORT in .env file
3. **CORS Issues**: CORS is enabled for development; configure for production

### Logs
Check the console output for detailed error messages and database connection status.

## Next Steps

- Add user authentication
- Implement deck sharing
- Add import/export functionality
- Create admin dashboard
- Add performance monitoring 