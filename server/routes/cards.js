// cards.js
const express = require('express');
const router = express.Router();
const pg = require('pg');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// --- Learning configuration (Anki-like) ---
// Steps for learning in minutes. Example: 1m, 10m. Graduation is handled separately.
const LEARNING_STEPS_MIN = [1, 10];
// Graduating intervals (in days)
const GRADUATING_INTERVAL_DAYS = 1; // when pressing Good on the last learning step
const EASY_GRADUATING_INTERVAL_DAYS = 4; // when pressing Easy on a new/learning card

// SuperMemo-2 algorithm using quality 0..5 internally
function supermemo2(quality, repetition, interval, ef) {
  // quality: 0..5
  // Normalize inputs to safe numeric defaults
  const currentEf = Number.isFinite(Number(ef)) ? Number(ef) : 2.5;
  const currentRepetition = Number.isFinite(Number(repetition)) ? Number(repetition) : 0;
  const currentInterval = Number.isFinite(Number(interval)) ? Number(interval) : 1;
  // If quality < 3 -> failure: reset repetition and schedule 1 day
  if (quality < 3) {
    // Move to learn and make due immediately. Keep interval at 1 to satisfy common DB constraints (> 0).
    const decreasedEf = Math.max(
      currentEf + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
      1.3
    );
    return {
      repetition: 1, // enter learning
      interval: 1,
      ef: decreasedEf,
      nextReview: new Date(), // due now
    };
  }

  // success
  let newEf = currentEf + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEf < 1.3) newEf = 1.3;

  let newRepetition = currentRepetition + 1;
  let newInterval;

  if (newRepetition === 1) {
    newInterval = 1;
  } else if (newRepetition === 2) {
    newInterval = 6;
  } else {
    newInterval = Math.round(currentInterval * newEf);
    if (newInterval < 1) newInterval = 1;
  }

  const nextReview = new Date(Date.now() + newInterval * 86400000);
  return {
    repetition: newRepetition,
    interval: newInterval,
    ef: newEf,
    nextReview,
  };
}

// Helper: map 1..4 (user) -> quality 0..5 (SM2)
function mapGradeToQuality(grade) {
  // 1 = again, 2 = hard, 3 = good, 4 = easy
  const mapping = {
    1: 0, // again -> quality 0
    2: 3, // hard -> quality 3
    3: 4, // good -> quality 4
    4: 5, // easy -> quality 5
  };
  return mapping[grade] ?? 0;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday() {
  const d = startOfToday();
  d.setDate(d.getDate() + 1); // start of tomorrow
  return d;
}

// GET /cards/due - Get review cards due today (repetition >= 2)
// If any are past due (< start of today), clamp them to today 00:00
router.get('/due', async (req, res) => {
  try {
    const client = await pool.connect();
    const userId = req.user?.id;
    const { deck_id, limit = 50 } = req.query;

    // Clamp next_review to start of today if in the past
    const clampParams = [];
    let clampSql = `UPDATE cards SET next_review = $${clampParams.push(startOfToday())}
                    WHERE repetition >= 2 AND next_review < $1 AND user_id = $${clampParams.push(userId)}`;
    if (deck_id) {
      clampSql += ` AND deck_id = $${clampParams.push(deck_id)}`;
    }
    await client.query(clampSql, clampParams);

    let query = `
      SELECT c.*, d.name as deck_name
      FROM cards c
      JOIN decks d ON c.deck_id = d.id
      WHERE c.repetition >= 2 AND c.next_review < $1 AND c.user_id = $2
    `;

    const params = [endOfToday(), userId];
    if (deck_id) {
      params.push(deck_id);
      query += ` AND c.deck_id = $${params.length}`;
    }

    params.push(parseInt(limit));
    query += ` ORDER BY c.next_review ASC LIMIT $${params.length}`;

    const result = await client.query(query, params);
    client.release();
    res.json({ success: true, count: result.rows.length, cards: result.rows });
  } catch (error) {
    console.error('Error fetching due cards:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /cards/new - Get new cards (not yet graded: repetition = 0)
router.get('/new', async (req, res) => {
  try {
    const client = await pool.connect();
    const userId = req.user?.id;
    const { deck_id, limit = 20 } = req.query;
    let query = `
      SELECT c.*, d.name as deck_name
      FROM cards c
      JOIN decks d ON c.deck_id = d.id
      WHERE c.repetition = 0 AND c.user_id = $1
    `;
    const params = [userId];
    if (deck_id) {
      query += ` AND c.deck_id = $2`;
      params.push(deck_id);
    }
    query += ` ORDER BY c.created_at ASC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));
    const result = await client.query(query, params);
    client.release();
    res.json({ success: true, count: result.rows.length, cards: result.rows });
  } catch (error) {
    console.error('Error fetching new cards:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /cards/learn - Get learning-phase due cards (repetition = 1)
// Clamp past-due to today 00:00 as well
router.get('/learn', async (req, res) => {
  try {
    const client = await pool.connect();
    const userId = req.user?.id;
    const { deck_id, limit = 50 } = req.query;

    // Clamp
    const clampParams = [];
    let clampSql = `UPDATE cards SET next_review = $${clampParams.push(startOfToday())}
                    WHERE repetition = 1 AND next_review < $1 AND user_id = $${clampParams.push(userId)}`;
    if (deck_id) {
      clampSql += ` AND deck_id = $${clampParams.push(deck_id)}`;
    }
    await client.query(clampSql, clampParams);

    let query = `
      SELECT c.*, d.name as deck_name
      FROM cards c
      JOIN decks d ON c.deck_id = d.id
      WHERE c.repetition = 1 AND c.next_review < $1 AND c.user_id = $2
    `;
    const params = [endOfToday(), userId];
    if (deck_id) {
      query += ` AND c.deck_id = $3`;
      params.push(deck_id);
    }
    query += ` ORDER BY c.next_review ASC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));
    const result = await client.query(query, params);
    client.release();
    res.json({ success: true, count: result.rows.length, cards: result.rows });
  } catch (error) {
    console.error('Error fetching learning cards:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /cards - Create a new card
router.post('/', async (req, res) => {
  try {
    const { front, back, deck_id } = req.body;
    const userId = req.user?.id;
    if (!front || !back || !deck_id) {
      return res.status(400).json({ success: false, error: 'Front, back, and deck_id are required' });
    }
    const client = await pool.connect();
    // ensure deck belongs to user
    const deckCheck = await client.query('SELECT id FROM decks WHERE id = $1 AND user_id = $2', [deck_id, userId]);
    if (deckCheck.rows.length === 0) {
      client.release();
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    const query = `
      INSERT INTO cards (front, back, deck_id, user_id, repetition, interval, ef, next_review, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 0, 1, 2.5, $5, NOW(), NOW())
      RETURNING *
    `;
    const nextReview = new Date(Date.now() + 1 * 86400000); // 1 day from now (default)
    const result = await client.query(query, [front, back, deck_id, userId, nextReview]);
    client.release();
    res.status(201).json({ success: true, card: result.rows[0] });
  } catch (error) {
    console.error('Error creating card:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /cards/:id/review - Simplified review algorithm per custom rules
router.post('/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { grade } = req.body; // expected 1..4 (1=again,2=hard,3=good,4=easy)

    if (grade === undefined || ![1, 2, 3, 4].includes(Number(grade))) {
      return res.status(400).json({ success: false, error: 'Grade must be 1..4' });
    }

    const numericGrade = Number(grade);
    const quality = mapGradeToQuality(numericGrade); // unused in simplified path, but kept for potential metrics

    const client = await pool.connect();
    const getCardQuery = 'SELECT * FROM cards WHERE id = $1 AND user_id = $2';
    const cardResult = await client.query(getCardQuery, [id, userId]);

    if (cardResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ success: false, error: 'Card not found' });
    }

    const card = cardResult.rows[0];

    // Simplified rules
    const todayStart = startOfToday();
    const scheduleDaysFromTodayMidnight = (days) => {
      const d = new Date(todayStart.getTime());
      d.setDate(d.getDate() + Math.max(0, days));
      return d;
    };

    let updatePayload;
    const ef = Number(card.ef) || 2.5;
    const factor = ef / 2.5; // >1 => longer, <1 => shorter

    if (numericGrade === 1) {
      // Again: move to learn, immediate
      updatePayload = {
        repetition: 1,
        interval: 1,
        ef,
        next_review: new Date(),
      };
    } else if (numericGrade === 2) {
      // Hard: ~2 days adjusted by EF
      const days = Math.max(1, Math.round(2 * factor));
      updatePayload = {
        repetition: 2,
        interval: days,
        ef,
        next_review: scheduleDaysFromTodayMidnight(days),
      };
    } else if (numericGrade === 3) {
      // Good: ~4 days adjusted by EF
      const days = Math.max(1, Math.round(4 * factor));
      updatePayload = {
        repetition: 2,
        interval: days,
        ef,
        next_review: scheduleDaysFromTodayMidnight(days),
      };
    } else if (numericGrade === 4) {
      // Easy: ~8 days adjusted by EF
      const days = Math.max(1, Math.round(8 * factor));
      updatePayload = {
        repetition: 2,
        interval: days,
        ef,
        next_review: scheduleDaysFromTodayMidnight(days),
      };
    }

    const updateQuery = `
      UPDATE cards
      SET repetition = $1, interval = $2, ef = $3, next_review = $4, updated_at = NOW()
      WHERE id = $5 AND user_id = $6
      RETURNING *
    `;

    const updateResult = await client.query(updateQuery, [
      Number(updatePayload.repetition),
      Number(updatePayload.interval),
      Number(updatePayload.ef),
      updatePayload.next_review,
      id,
      userId,
    ]);

    // Log review history (non-fatal if the table does not exist)
    try {
      const historyQuery = `
        INSERT INTO review_history (card_id, grade_user, grade_quality, repetition, interval, ef, reviewed_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `;
      const updatedCard = updateResult.rows[0] || {};
      await client.query(historyQuery, [
        id,
        numericGrade,
        quality,
        Number(updatedCard.repetition),
        Number(updatedCard.interval),
        Number(updatedCard.ef),
      ]);
    } catch (historyErr) {
      // If history logging fails (e.g., table missing), do not block the review flow
      console.warn('Review history logging failed:', historyErr?.message || historyErr);
    }

    client.release();

    res.json({ success: true, card: updateResult.rows[0] });
  } catch (error) {
    console.error('Error reviewing card:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /cards/:id - Get a specific card
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const client = await pool.connect();
    const query = `
      SELECT c.*, d.name as deck_name
      FROM cards c
      JOIN decks d ON c.deck_id = d.id
      WHERE c.id = $1 AND c.user_id = $2
    `;
    const result = await client.query(query, [id, userId]);
    client.release();
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    res.json({ success: true, card: result.rows[0] });
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
    const userId = req.user?.id;
    const client = await pool.connect();
    const query = `
      UPDATE cards
      SET front = COALESCE($1, front),
          back = COALESCE($2, back),
          deck_id = COALESCE($3, deck_id),
          updated_at = NOW()
      WHERE id = $4 AND user_id = $5
      RETURNING *
    `;
    const result = await client.query(query, [front, back, deck_id, id, userId]);
    client.release();
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    res.json({ success: true, card: result.rows[0] });
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /cards/:id - Delete a card
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const client = await pool.connect();
    const query = 'DELETE FROM cards WHERE id = $1 AND user_id = $2 RETURNING *';
    const result = await client.query(query, [id, userId]);
    client.release();
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    res.json({ success: true, message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /cards/stats/overview
router.get('/stats/overview', async (req, res) => {
  try {
    const client = await pool.connect();
    const userId = req.user?.id;
    const statsQuery = `
      SELECT 
        COUNT(*) as total_cards,
        COUNT(CASE WHEN repetition = 0 THEN 1 END) as new_cards,
        COUNT(CASE WHEN repetition > 0 AND repetition < 3 AND next_review <= NOW() THEN 1 END) as learning_cards,
        COUNT(CASE WHEN repetition >= 3 THEN 1 END) as mature_cards,
        COUNT(CASE WHEN next_review <= NOW() AND repetition > 0 THEN 1 END) as due_cards
      FROM cards
      WHERE user_id = $1
    `;
    const result = await client.query(statsQuery, [userId]);
    client.release();
    res.json({ success: true, stats: result.rows[0] });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
