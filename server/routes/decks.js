const express = require('express');
const router = express.Router();
const pg = require('pg');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// GET /decks - Get all decks
router.get('/', async (req, res) => {
  try {
    const client = await pool.connect();
    const query = `
      SELECT d.*, 
             COUNT(c.id) as card_count,
             COUNT(CASE WHEN c.next_review <= NOW() THEN 1 END) as due_count,
             COUNT(CASE WHEN c.repetition = 0 THEN 1 END) as new_count
      FROM decks d
      LEFT JOIN cards c ON d.id = c.deck_id
      GROUP BY d.id, d.name, d.description, d.created_at, d.updated_at
      ORDER BY d.updated_at DESC
    `;
    
    const result = await client.query(query);
    client.release();
    
    res.json({
      success: true,
      count: result.rows.length,
      decks: result.rows
    });
  } catch (error) {
    console.error('Error fetching decks:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /decks/:id - Get a specific deck with its cards
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    // Get deck info
    const deckQuery = 'SELECT * FROM decks WHERE id = $1';
    const deckResult = await client.query(deckQuery, [id]);
    
    if (deckResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    
    // Get cards in the deck
    const cardsQuery = `
      SELECT * FROM cards 
      WHERE deck_id = $1 
      ORDER BY created_at ASC
    `;
    const cardsResult = await client.query(cardsQuery, [id]);
    
    client.release();
    
    res.json({
      success: true,
      deck: deckResult.rows[0],
      cards: cardsResult.rows,
      cardCount: cardsResult.rows.length
    });
  } catch (error) {
    console.error('Error fetching deck:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /decks - Create a new deck
router.post('/', async (req, res) => {
  try {
    const { name, description = '' } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Deck name is required' 
      });
    }
    
    const client = await pool.connect();
    const query = `
      INSERT INTO decks (name, description, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING *
    `;
    
    const result = await client.query(query, [name, description]);
    client.release();
    
    res.status(201).json({
      success: true,
      deck: result.rows[0]
    });
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
    
    const client = await pool.connect();
    const query = `
      UPDATE decks 
      SET name = COALESCE($1, name), 
          description = COALESCE($2, description),
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await client.query(query, [name, description, id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    
    res.json({
      success: true,
      deck: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating deck:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /decks/:id - Delete a deck and all its cards
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    // Start transaction
    await client.query('BEGIN');
    
    // Delete all cards in the deck first
    await client.query('DELETE FROM cards WHERE deck_id = $1', [id]);
    
    // Delete the deck
    const result = await client.query('DELETE FROM decks WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    
    await client.query('COMMIT');
    client.release();
    
    res.json({
      success: true,
      message: 'Deck and all its cards deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting deck:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /decks/:id/stats - Get deck statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_cards,
        COUNT(CASE WHEN repetition = 0 THEN 1 END) as new_cards,
        COUNT(CASE WHEN repetition > 0 AND repetition < 3 THEN 1 END) as learning_cards,
        COUNT(CASE WHEN repetition >= 3 THEN 1 END) as mature_cards,
        COUNT(CASE WHEN next_review <= NOW() THEN 1 END) as due_cards,
        AVG(ef) as avg_ease_factor,
        AVG(interval) as avg_interval
      FROM cards 
      WHERE deck_id = $1
    `;
    
    const result = await client.query(statsQuery, [id]);
    client.release();
    
    res.json({
      success: true,
      stats: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching deck stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /decks/:id/cards - Add multiple cards to a deck
router.post('/:id/cards', async (req, res) => {
  try {
    const { id } = req.params;
    const { cards } = req.body; // Array of {front, back} objects
    
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cards array is required and must not be empty' 
      });
    }
    
    const client = await pool.connect();
    
    // Verify deck exists
    const deckQuery = 'SELECT id FROM decks WHERE id = $1';
    const deckResult = await client.query(deckQuery, [id]);
    
    if (deckResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    
    // Insert all cards
    const insertQuery = `
      INSERT INTO cards (front, back, deck_id, repetition, interval, ef, next_review, created_at, updated_at)
      VALUES ($1, $2, $3, 0, 1, 2.5, $4, NOW(), NOW())
      RETURNING *
    `;
    
    const nextReview = new Date(Date.now() + 1 * 86400000); // 1 day from now
    const insertedCards = [];
    
    for (const card of cards) {
      if (!card.front || !card.back) {
        continue; // Skip invalid cards
      }
      
      const result = await client.query(insertQuery, [
        card.front, 
        card.back, 
        id, 
        nextReview
      ]);
      insertedCards.push(result.rows[0]);
    }
    
    client.release();
    
    res.status(201).json({
      success: true,
      count: insertedCards.length,
      cards: insertedCards
    });
  } catch (error) {
    console.error('Error adding cards to deck:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router; 