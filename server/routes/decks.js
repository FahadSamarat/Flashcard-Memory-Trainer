// decks.js
const express = require('express');
const router = express.Router();
const pg = require('pg');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// GET /decks - Get all decks with counts: total, new, learn, due
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    const client = await pool.connect();
    const query = `
      SELECT d.*,
        COUNT(c.id) AS total_cards,
        COUNT(CASE WHEN c.repetition = 0 THEN 1 END) AS new_count,
        COUNT(CASE WHEN c.repetition = 1 AND c.next_review < (date_trunc('day', NOW()) + INTERVAL '1 day') THEN 1 END) AS learn_count,
        COUNT(CASE WHEN c.repetition >= 2 AND c.next_review < (date_trunc('day', NOW()) + INTERVAL '1 day') THEN 1 END) AS due_count
      FROM decks d
      LEFT JOIN cards c ON d.id = c.deck_id AND c.user_id = $1
      WHERE d.user_id = $1
      GROUP BY d.id, d.name, d.description, d.created_at, d.updated_at
      ORDER BY d.updated_at DESC
    `;
    const result = await client.query(query, [userId]);
    client.release();
    res.json({ success: true, count: result.rows.length, decks: result.rows });
  } catch (error) {
    console.error('Error fetching decks:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /decks/:id - Get a specific deck with its cards (all cards)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const client = await pool.connect();
    const deckQuery = 'SELECT * FROM decks WHERE id = $1 AND user_id = $2';
    const deckResult = await client.query(deckQuery, [id, userId]);
    if (deckResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    const cardsQuery = `
      SELECT * FROM cards
      WHERE deck_id = $1 AND user_id = $2
      ORDER BY created_at ASC
    `;
    const cardsResult = await client.query(cardsQuery, [id, userId]);
    client.release();
    res.json({ success: true, deck: deckResult.rows[0], cards: cardsResult.rows, cardCount: cardsResult.rows.length });
  } catch (error) {
    console.error('Error fetching deck:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /decks - Create a new deck
router.post('/', async (req, res) => {
  try {
    const { name, description = '' } = req.body;
    const userId = req.user?.id;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Deck name is required' });
    }
    const client = await pool.connect();
    const query = `
      INSERT INTO decks (name, description, user_id, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `;
    const result = await client.query(query, [name, description, userId]);
    client.release();
    res.status(201).json({ success: true, deck: result.rows[0] });
  } catch (error) {
    console.error('Error creating deck:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /decks/:id - Update a deck
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user?.id;
    const client = await pool.connect();
    const query = `
      UPDATE decks
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          updated_at = NOW()
      WHERE id = $3 AND user_id = $4
      RETURNING *
    `;
    const result = await client.query(query, [name, description, id, userId]);
    client.release();
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    res.json({ success: true, deck: result.rows[0] });
  } catch (error) {
    console.error('Error updating deck:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /decks/:id - Delete a deck and its cards
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const client = await pool.connect();
    await client.query('BEGIN');
    await client.query('DELETE FROM cards WHERE deck_id = $1 AND user_id = $2', [id, userId]);
    const result = await client.query('DELETE FROM decks WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    await client.query('COMMIT');
    client.release();
    res.json({ success: true, message: 'Deck and all its cards deleted successfully' });
  } catch (error) {
    console.error('Error deleting deck:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /decks/:id/stats - stats for a deck
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const client = await pool.connect();
    const statsQuery = `
      SELECT
        COUNT(*) as total_cards,
        COUNT(CASE WHEN repetition = 0 THEN 1 END) as new_cards,
        COUNT(CASE WHEN repetition > 0 AND repetition < 3 AND next_review <= NOW() THEN 1 END) as learning_cards,
        COUNT(CASE WHEN repetition >= 3 THEN 1 END) as mature_cards,
        COUNT(CASE WHEN next_review <= NOW() AND repetition > 0 THEN 1 END) as due_cards,
        AVG(ef) as avg_ease_factor,
        AVG(interval) as avg_interval
      FROM cards
      WHERE deck_id = $1 AND user_id = $2
    `;
    const result = await client.query(statsQuery, [id, userId]);
    client.release();
    res.json({ success: true, stats: result.rows[0] });
  } catch (error) {
    console.error('Error fetching deck stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /decks/:id/cards - Add multiple cards
router.post('/:id/cards', async (req, res) => {
  try {
    const { id } = req.params;
    const { cards } = req.body;
    const userId = req.user?.id;
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ success: false, error: 'Cards array is required and must not be empty' });
    }
    const client = await pool.connect();
    const deckQuery = 'SELECT id FROM decks WHERE id = $1 AND user_id = $2';
    const deckResult = await client.query(deckQuery, [id, userId]);
    if (deckResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    const insertQuery = `
      INSERT INTO cards (front, back, deck_id, user_id, repetition, interval, ef, next_review, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 0, 0, 2.5, $5, NOW(), NOW())
      RETURNING *
    `;
    const nextReview = new Date(Date.now() + 1 * 86400000);
    const insertedCards = [];
    for (const card of cards) {
      if (!card.front || !card.back) continue;
      const result = await client.query(insertQuery, [card.front, card.back, id, userId, nextReview]);
      insertedCards.push(result.rows[0]);
    }
    client.release();
    res.status(201).json({ success: true, count: insertedCards.length, cards: insertedCards });
  } catch (error) {
    console.error('Error adding cards to deck:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
