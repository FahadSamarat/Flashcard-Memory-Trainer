// DeckReview.jsx
import { useEffect, useState } from "react";
import api from "../lib/api";
import { Card, Button } from "flowbite-react";

export default function DeckReview({ deck, onBack }) {
  const [cards, setCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // load cards in order: new -> due (today) -> learn (today)
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [newRes, dueRes, learnRes] = await Promise.all([
          api.get("/api/cards/new", { params: { deck_id: deck.id, limit: 50 } }),
          api.get("/api/cards/due", { params: { deck_id: deck.id, limit: 100 } }),
          api.get("/api/cards/learn", { params: { deck_id: deck.id, limit: 100 } }),
        ]);

        const newCards = newRes.data.cards || [];
        const dueCards = dueRes.data.cards || [];
        const learnCards = learnRes.data.cards || [];

        // Compose in requested order: new -> due -> learn
        const combined = [...newCards, ...dueCards, ...learnCards];

        setCards(combined);
        setIdx(0);
        setShowBack(false);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load cards");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [deck]);

  const currentCard = cards[idx];

  const gradeCard = async (grade) => {
    if (!currentCard) return;
    try {
      // grade is 1..4 (1=again,2=hard,3=good,4=easy)
      await api.post(`/api/cards/${currentCard.id}/review`, { grade });
      // remove the current card from the list and proceed
      const nextCards = cards.slice();
      nextCards.splice(idx, 1); // remove current
      setCards(nextCards);
      // keep idx at same position (which now points to next card), unless at end
      if (idx >= nextCards.length) {
        // finished
        setIdx(0);
        setShowBack(false);
        // there might be more due now after grading — optionally you could refetch
        if (nextCards.length === 0) {
          // done reviewing
          onBack();
          return;
        }
      } else {
        setShowBack(false);
      }
    } catch (err) {
      console.error("Failed to submit grade:", err);
      setError(err.message || "Failed to submit grade");
    }
  };

  if (loading) {
    return (
      <div className="pt-16 flex w-full justify-center">
        <div>Loading cards...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-16 flex w-full justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="pt-16 flex flex-col items-center text-[color:var(--color-text)]">
        <div className="w-full max-w-2xl px-4">
          <div className="flex justify-between mb-4">
            <Button className="bg-[color:var(--color-primary)] hover:bg-[color:var(--color-primary-700)] text-[color:var(--color-bg-2)]" onClick={onBack}>← Back to Decks</Button>
            <div>{cards.length} cards remaining</div>
          </div>
          <Card>
            <h3 className="text-xl font-bold text-center">{deck.name}</h3>
            <p className="mt-4 text-center">No cards to review right now.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 flex flex-col items-center text-[color:var(--color-text)] mt-16">
      <div className="w-full max-w-2xl px-4">
        <div className="flex justify-between items-center mb-4">
          <Button className="cursor-pointer bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 text-white hover:bg-gradient-to-br" onClick={onBack}>← Back to Decks</Button>
          <div className=" text-lg ">
            {idx + 1} / {cards.length} — {currentCard.repetition ? `rep:${currentCard.repetition}` : "new"}
          </div>
        </div>

        <Card className="text-center">
          <h3 className="text-3xl font-bold">{deck.name}</h3>
          <div className="mt-6 min-h-[120px] flex items-center text-2xl text-[color:var(--color-text)]">
            <div className="w-full text-center whitespace-normal break-words">
              {showBack ? currentCard.back : currentCard.front}
            </div>
          </div>
          <div className="flex justify-center mt-4 gap-4">
            <Button className=" cursor-pointer bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 text-white hover:bg-gradient-to-br" onClick={() => setShowBack(!showBack)}>{showBack ? "Show Front" : "Show Back"}</Button>
          </div>
        </Card>

        {showBack && (
          <div className="flex flex-wrap justify-center gap-3 mt-6 mb-6">
            <Button className=" cursor-pointer bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white hover:bg-gradient-to-br" onClick={() => gradeCard(1)} >
              1 · Again
            </Button>
            <Button className=" cursor-pointer bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white hover:bg-gradient-to-br" onClick={() => gradeCard(2)} >
              2 · Hard
            </Button>
            <Button className=" cursor-pointer bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white hover:bg-gradient-to-br" onClick={() => gradeCard(3)} >
              3 · Good
            </Button>
            <Button className=" cursor-pointer bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white hover:bg-gradient-to-br" onClick={() => gradeCard(4)} >
              4 · Easy
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
