# Flashcard Memory Trainer API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently, no authentication is required. All endpoints are publicly accessible.

## Grade Scale (SM2 Algorithm)
- **0**: Again (Complete blackout)
- **1**: Hard (Incorrect response; but the correct one remembered)
- **2**: Good (Correct response recalled with serious difficulty)
- **3**: Good (Correct response with some hesitation)
- **4**: Easy (Correct response with perfect recall)
- **5**: Easy (Correct response with perfect recall)

---

## Decks Endpoints

### 1. Get All Decks
**GET** `/decks`

Returns all decks with card counts and statistics.

**Response:**
```json
{
  "success": true,
  "count": 2,
  "decks": [
    {
      "id": 1,
      "name": "Sample Deck",
      "description": "A sample deck for testing",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "card_count": "5",
      "due_count": "3",
      "new_count": "2"
    }
  ]
}
```

### 2. Create New Deck
**POST** `/decks`

**Body:**
```json
{
  "name": "My New Deck",
  "description": "Optional description"
}
```

**Response:**
```json
{
  "success": true,
  "deck": {
    "id": 3,
    "name": "My New Deck",
    "description": "Optional description",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Get Specific Deck
**GET** `/decks/:id`

Returns a specific deck with all its cards.

**Response:**
```json
{
  "success": true,
  "deck": {
    "id": 1,
    "name": "Sample Deck",
    "description": "A sample deck",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "cards": [
    {
      "id": 1,
      "front": "What is a variable?",
      "back": "A container that stores data values",
      "deck_id": 1,
      "repetition": 0,
      "interval": 1,
      "ef": "2.50",
      "next_review": "2024-01-02T00:00:00.000Z",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "cardCount": 5
}
```

### 4. Update Deck
**PUT** `/decks/:id`

**Body:**
```json
{
  "name": "Updated Deck Name",
  "description": "Updated description"
}
```

### 5. Delete Deck
**DELETE** `/decks/:id`

Deletes the deck and all its cards.

### 6. Get Deck Statistics
**GET** `/decks/:id/stats`

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_cards": "5",
    "new_cards": "2",
    "learning_cards": "1",
    "mature_cards": "2",
    "due_cards": "3",
    "avg_ease_factor": "2.45",
    "avg_interval": "3.2"
  }
}
```

### 7. Add Multiple Cards to Deck
**POST** `/decks/:id/cards`

**Body:**
```json
{
  "cards": [
    {
      "front": "What is JavaScript?",
      "back": "A programming language"
    },
    {
      "front": "What is React?",
      "back": "A JavaScript library for building user interfaces"
    }
  ]
}
```

---

## Cards Endpoints

### 1. Get Due Cards (Cards to Review Today)
**GET** `/cards/due`

Returns all cards that are due for review today.

**Response:**
```json
{
  "success": true,
  "count": 3,
  "cards": [
    {
      "id": 1,
      "front": "What is a variable?",
      "back": "A container that stores data values",
      "deck_id": 1,
      "deck_name": "Sample Deck",
      "repetition": 2,
      "interval": 6,
      "ef": "2.45",
      "next_review": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 2. Get New Cards
**GET** `/cards/new?deck_id=1&limit=10`

Returns cards that haven't been reviewed yet (repetition = 0).

**Query Parameters:**
- `deck_id` (optional): Filter by specific deck
- `limit` (optional): Number of cards to return (default: 20)

### 3. Get Learning Cards
**GET** `/cards/learn?deck_id=1&limit=10`

Returns cards in the learning phase (repetition > 0 and < 3).

### 4. Create New Card
**POST** `/cards`

**Body:**
```json
{
  "front": "What is a function?",
  "back": "A reusable block of code",
  "deck_id": 1
}
```

### 5. Review a Card (SM2 Algorithm)
**POST** `/cards/:id/review`

This is the core SM2 algorithm endpoint. It updates the card's repetition, interval, ease factor, and next review date based on your grade.

**Body:**
```json
{
  "grade": 3
}
```

**Response:**
```json
{
  "success": true,
  "card": {
    "id": 1,
    "front": "What is a variable?",
    "back": "A container that stores data values",
    "repetition": 3,
    "interval": 12,
    "ef": "2.45",
    "next_review": "2024-01-13T00:00:00.000Z"
  },
  "sm2Result": {
    "repetition": 3,
    "interval": 12,
    "ef": 2.45,
    "nextReview": "2024-01-13T00:00:00.000Z"
  }
}
```

### 6. Get Specific Card
**GET** `/cards/:id`

### 7. Update Card
**PUT** `/cards/:id`

**Body:**
```json
{
  "front": "Updated question",
  "back": "Updated answer",
  "deck_id": 2
}
```

### 8. Delete Card
**DELETE** `/cards/:id`

### 9. Get Overall Statistics
**GET** `/cards/stats/overview`

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_cards": "25",
    "new_cards": "5",
    "learning_cards": "8",
    "mature_cards": "12",
    "due_cards": "3"
  }
}
```

---

## Postman Testing Guide

### Setup
1. Create a new Postman collection called "Flashcard API"
2. Set the base URL variable: `{{base_url}}` = `http://localhost:3000/api`

### Testing Flow

#### 1. Create a Deck
```
POST {{base_url}}/decks
Content-Type: application/json

{
  "name": "Test Deck",
  "description": "A deck for testing"
}
```

#### 2. Add Cards to the Deck
```
POST {{base_url}}/decks/1/cards
Content-Type: application/json

{
  "cards": [
    {
      "front": "What is the capital of France?",
      "back": "Paris"
    },
    {
      "front": "What is 2 + 2?",
      "back": "4"
    }
  ]
}
```

#### 3. Get Due Cards
```
GET {{base_url}}/cards/due
```

#### 4. Review a Card
```
POST {{base_url}}/cards/1/review
Content-Type: application/json

{
  "grade": 4
}
```

#### 5. Check Statistics
```
GET {{base_url}}/decks/1/stats
```

### Sample Test Scenarios

#### Scenario 1: Learning a New Card
1. Create a deck
2. Add a new card
3. Get new cards: `GET {{base_url}}/cards/new`
4. Review with grade 2 (hard): `POST {{base_url}}/cards/1/review` with `{"grade": 2}`
5. Check that the card is now in learning phase: `GET {{base_url}}/cards/learn`

#### Scenario 2: Successful Review
1. Review a card with grade 4 (easy): `POST {{base_url}}/cards/1/review` with `{"grade": 4}`
2. Check that the interval increased and next_review is further in the future

#### Scenario 3: Failed Review
1. Review a card with grade 0 (again): `POST {{base_url}}/cards/1/review` with `{"grade": 0}`
2. Check that repetition reset to 0 and interval reset to 1

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (missing required fields)
- `404`: Not Found
- `500`: Internal Server Error

---

## Database Setup

Run the SQL commands in `database.sql` to set up your PostgreSQL database:

```sql
-- Connect to your PostgreSQL database and run:
\i database.sql
```

Or copy and paste the contents of `database.sql` into your PostgreSQL client. 