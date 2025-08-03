const express = require('express');
const router = express.Router();
const pg = require('pg');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// SM2 Algorithm
function supermemo2(grade, repetition, interval, ef) {
  // Grade: 0-5 (0=again, 1=hard, 2=good, 3=good, 4=easy, 5=easy)
  if (grade < 3) {
    // Failed - reset to learning phase
    return {
      repetition: 0,
      interval: 1,
      ef: Math.max(ef - 0.2, 1.3), // Decrease ease factor slightly
      nextReview: new Date(Date.now() + 1 * 86400000), // 1 day
    };
  }

  // Calculate new ease factor
  let newEf = ef + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (newEf < 1.3) newEf = 1.3;

  let newRepetition = repetition + 1;
  let newInterval;

  if (newRepetition === 1) {
    newInterval = 1; // 1 day
  } else if (newRepetition === 2) {
    newInterval = 6; // 6 days
  } else {
    newInterval = Math.round(interval * newEf);
  }

  const nextReview = new Date(Date.now() + newInterval * 86400000);

  return {
    repetition: newRepetition,
    interval: newInterval,
    ef: newEf,
    nextReview,
  };
}

// GET /cards/due - Get cards due for review today
router.get('/due', async (req, res) => {
  try {
    const client = await pool.connect();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const query = `
      SELECT c.*, d.name as deck_name 
      FROM cards c 
      JOIN decks d ON c.deck_id = d.id 
      WHERE c.next_review <= $1 
      ORDER BY c.next_review ASC
    `;
    
    const result = await client.query(query, [today]);
    client.release();
    
    res.json({
      success: true,
      count: result.rows.length,
      cards: result.rows
    });
  } catch (error) {
    console.error('Error fetching due cards:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /cards/new - Get new cards (not yet reviewed)
router.get('/new', async (req, res) => {
  try {
    const client = await pool.connect();
    const { deck_id, limit = 20 } = req.query;
    
    let query = `
      SELECT c.*, d.name as deck_name 
      FROM cards c 
      JOIN decks d ON c.deck_id = d.id 
      WHERE c.repetition = 0
    `;
    const params = [];
    
    if (deck_id) {
      query += ` AND c.deck_id = $1`;
      params.push(deck_id);
    }
    
    query += ` ORDER BY c.created_at ASC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));
    
    const result = await client.query(query, params);
    client.release();
    
    res.json({
      success: true,
      count: result.rows.length,
      cards: result.rows
    });
  } catch (error) {
    console.error('Error fetching new cards:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /cards/learn - Get cards in learning phase (repetition < 3)
router.get('/learn', async (req, res) => {
  try {
    const client = await pool.connect();
    const { deck_id, limit = 20 } = req.query;
    
    let query = `
      SELECT c.*, d.name as deck_name 
      FROM cards c 
      JOIN decks d ON c.deck_id = d.id 
      WHERE c.repetition > 0 AND c.repetition < 3
    `;
    const params = [];
    
    if (deck_id) {
      query += ` AND c.deck_id = $1`;
      params.push(deck_id);
    }
    
    query += ` ORDER BY c.next_review ASC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));
    
    const result = await client.query(query, params);
    client.release();
    
    res.json({
      success: true,
      count: result.rows.length,
      cards: result.rows
    });
  } catch (error) {
    console.error('Error fetching learning cards:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /cards - Create a new card
router.post('/', async (req, res) => {
  try {
    const { front, back, deck_id } = req.body;
    
    if (!front || !back || !deck_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Front, back, and deck_id are required' 
      });
    }
    
    const client = await pool.connect();
    const query = `
      INSERT INTO cards (front, back, deck_id, repetition, interval, ef, next_review, created_at, updated_at)
      VALUES ($1, $2, $3, 0, 1, 2.5, $4, NOW(), NOW())
      RETURNING *
    `;
    
    const nextReview = new Date(Date.now() + 1 * 86400000); // 1 day from now
    const result = await client.query(query, [front, back, deck_id, nextReview]);
    client.release();
    
    res.status(201).json({
      success: true,
      card: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating card:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /cards/:id/review - Review a card with SM2 algorithm
router.post('/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { grade } = req.body; // 0-5 scale
    
    if (grade === undefined || grade < 0 || grade > 5) {
      return res.status(400).json({ 
        success: false, 
        error: 'Grade must be between 0 and 5' 
      });
    }
    
    const client = await pool.connect();
    
    // Get current card data
    const getCardQuery = 'SELECT * FROM cards WHERE id = $1';
    const cardResult = await client.query(getCardQuery, [id]);
    
    if (cardResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    
    const card = cardResult.rows[0];
    
    // Apply SM2 algorithm
    const sm2Result = supermemo2(grade, card.repetition, card.interval, card.ef);
    
    // Update card with new SM2 values
    const updateQuery = `
      UPDATE cards 
      SET repetition = $1, interval = $2, ef = $3, next_review = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;
    
    const updateResult = await client.query(updateQuery, [
      sm2Result.repetition,
      sm2Result.interval,
      sm2Result.ef,
      sm2Result.nextReview,
      id
    ]);
    
    // Log review history
    const historyQuery = `
      INSERT INTO review_history (card_id, grade, repetition, interval, ef, reviewed_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `;
    
    await client.query(historyQuery, [
      id,
      grade,
      sm2Result.repetition,
      sm2Result.interval,
      sm2Result.ef
    ]);
    
    client.release();
    
    res.json({
      success: true,
      card: updateResult.rows[0],
      sm2Result
    });
  } catch (error) {
    console.error('Error reviewing card:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /cards/:id - Get a specific card
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    const query = `
      SELECT c.*, d.name as deck_name 
      FROM cards c 
      JOIN decks d ON c.deck_id = d.id 
      WHERE c.id = $1
    `;
    
    const result = await client.query(query, [id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    
    res.json({
      success: true,
      card: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching card:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /cards/:id - Update a card
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { front, back, deck_id } = req.body;
    
    const client = await pool.connect();
    const query = `
      UPDATE cards 
      SET front = COALESCE($1, front), 
          back = COALESCE($2, back), 
          deck_id = COALESCE($3, deck_id),
          updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await client.query(query, [front, back, deck_id, id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    
    res.json({
      success: true,
      card: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /cards/:id - Delete a card
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    
    const query = 'DELETE FROM cards WHERE id = $1 RETURNING *';
    const result = await client.query(query, [id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    
    res.json({
      success: true,
      message: 'Card deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /cards/stats - Get statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const client = await pool.connect();
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_cards,
        COUNT(CASE WHEN repetition = 0 THEN 1 END) as new_cards,
        COUNT(CASE WHEN repetition > 0 AND repetition < 3 THEN 1 END) as learning_cards,
        COUNT(CASE WHEN repetition >= 3 THEN 1 END) as mature_cards,
        COUNT(CASE WHEN next_review <= NOW() THEN 1 END) as due_cards
      FROM cards
    `;
    
    const result = await client.query(statsQuery);
    client.release();
    
    res.json({
      success: true,
      stats: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router; 