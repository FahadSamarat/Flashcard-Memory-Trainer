// Decks.jsx
import { useEffect, useState } from "react";
import api from "../lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Dropdown,
  DropdownItem,
  Button,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
  TextInput,
  Textarea,
} from "flowbite-react";
import { HiPlus, HiTrash, HiChartPie } from "react-icons/hi";
import DeckReview from "./DeckReview";

export default function Decks() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [openModal, setOpenModal] = useState(false);
  const [currentDeck, setCurrentDeck] = useState(null);
  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");

  const [selectedDeck, setSelectedDeck] = useState(null); // for review

  // Stats modal state
  const [openStatsModal, setOpenStatsModal] = useState(false);
  const [statsDeck, setStatsDeck] = useState(null);
  const [statsCards, setStatsCards] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

  // Add Deck modal state
  const [openDeckModal, setOpenDeckModal] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [deckDescription, setDeckDescription] = useState("");

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/decks");
      setDecks(response.data.decks);
    } catch (err) {
      setError(err.message || "Failed to fetch decks");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = (deck) => {
    setCurrentDeck(deck);
    setOpenModal(true);
  };

  const handleDeleteDeck = async (deckId) => {
    if (!confirm("Delete this deck and all its cards?")) return;
    try {
      await api.delete(`/api/decks/${deckId}`);
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
    } catch (err) {
      setError(err.message || "Failed to delete deck");
    }
  };

  const handleOpenStats = async (deck) => {
    setStatsDeck(deck);
    setOpenStatsModal(true);
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await api.get(`/api/decks/${deck.id}`);
      setStatsCards(res.data.cards || []);
    } catch (err) {
      setStatsError(err.message || "Failed to load deck stats");
    } finally {
      setStatsLoading(false);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!confirm("Delete this card?")) return;
    try {
      await api.delete(`/api/cards/${cardId}`);
      setStatsCards((prev) => prev.filter((c) => c.id !== cardId));
      // refresh deck counts in the background
      fetchDecks();
    } catch (err) {
      setStatsError(err.message || "Failed to delete card");
    }
  };

  const submitNewDeck = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/decks", {
        name: deckName,
        description: deckDescription,
      });
      await fetchDecks();
      setDeckName("");
      setDeckDescription("");
      setOpenDeckModal(false);
    } catch (err) {
      setError(err.message || "Failed to create deck");
    }
  };

  const submitNewCard = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/decks/${currentDeck.id}/cards`, {
        cards: [{ front: cardFront, back: cardBack }],
      });
      await fetchDecks();
      setCardFront("");
      setCardBack("");
      setOpenModal(false);
    } catch (err) {
      setError(err.message || "Failed to add card");
    }
  };

  if (selectedDeck) {
    return (
      <DeckReview
        deck={selectedDeck}
        onBack={() => {
          setSelectedDeck(null);
          fetchDecks();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="pt-16 flex w-full justify-center text-[color:var(--color-ink)]">
        <div className="text-center">Loading decks...</div>
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

  return (
    <div className="pt-16 flex justify-center flex-col items-center text-[color:var(--color-text)] my-12">
      <h1 className="text-6xl font-bold mb-6 text-[color:var(--color-accent)]">
        My Decks
      </h1>
      <div className="w-full max-w-4xl">
        <div className="flex justify-end mb-3 px-1">
          <Button
            className="bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 text-white hover:bg-gradient-to-br "
            onClick={() => setOpenDeckModal(true)}
          >
            <span className="cursor-pointer flex items-center gap-2">
              <HiPlus /> Add Deck
            </span>
          </Button>
        </div>
        <div>
          <Table hoverable striped>
            <TableHead className=" border-b-1">
              <TableRow>
                <TableHeadCell>Deck</TableHeadCell>
                <TableHeadCell>New</TableHeadCell>
                <TableHeadCell>Learn</TableHeadCell>
                <TableHeadCell>Due</TableHeadCell>
                <TableHeadCell>Action</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {decks.map((deck) => (
                <TableRow className=" !bg-gray-800 hover:!bg-gray-700" key={deck.id}>
                  <TableCell className="whitespace-nowrap font-medium">
                    <button
                      type="button"
                      onClick={() => setSelectedDeck(deck)}
                      className="text-[color:var(--color-text)] hover:text-[color:var(--color-accent)] cursor-pointer"
                    >
                      {deck.name}
                    </button>
                  </TableCell>
                  <TableCell className=" text-blue-500">{deck.new_count ?? 0}</TableCell>
                  <TableCell className=" text-red-500">{deck.learn_count ?? 0}</TableCell>
                  <TableCell className=" text-green-500">{deck.due_count ?? 0}</TableCell>
                  <TableCell className="text-gray-200 text-[14px]">
                    <Dropdown label="Actions" inline className="z-50">
                      <DropdownItem
                        icon={HiPlus}
                        onClick={() => handleAddCard(deck)}
                      >
                        Add Card
                      </DropdownItem>
                      <DropdownItem
                        icon={HiChartPie}
                        onClick={() => handleOpenStats(deck)}
                      >
                        Stats
                      </DropdownItem>
                      <DropdownItem
                        icon={HiTrash}
                        onClick={() => handleDeleteDeck(deck.id)}
                      >
                        Delete Deck
                      </DropdownItem>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Add Deck Modal */}
        <Modal
          show={openDeckModal}
          onClose={() => setOpenDeckModal(false)}
          popup
        >
          <ModalHeader />
          <ModalBody>
            <form onSubmit={submitNewDeck}>
              <div className="space-y-6">
                <h2 className="text-center text-xl font-medium">
                  Create New Deck
                </h2>
                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="deckName">Name</Label>
                  </div>
                  <TextInput
                    id="deckName"
                    className="bg-[color:var(--color-bg-2)]/60 border-[color:var(--color-primary)]/50 text-[color:var(--color-text)] placeholder:[color:var(--color-muted)] [&_input]:bg-white [&_input]:text-black"
                    placeholder="Enter deck name"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="deckDescription">
                      Description (optional)
                    </Label>
                  </div>
                  <Textarea
                    id="deckDescription"
                    className="!bg-white !text-black placeholder:!text-gray-400"
                    placeholder="Describe the deck"
                    rows={3}
                    value={deckDescription}
                    onChange={(e) => setDeckDescription(e.target.value)}
                  />
                </div>
                <div className="w-full flex justify-center items-center">
                  <Button
                    className="cursor-pointer bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 text-white hover:bg-gradient-to-br"
                    type="submit"
                  >
                    Add Deck
                  </Button>
                </div>
              </div>
            </form>
          </ModalBody>
        </Modal>

        <Modal show={openModal} onClose={() => setOpenModal(false)} popup>
          <ModalHeader />
          <ModalBody>
            <form onSubmit={submitNewCard}>
              <div className="space-y-6">
                <h2 className="text-center text-xl font-medium">
                  {currentDeck?.name}
                </h2>

                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="front">Front</Label>
                  </div>
                  <TextInput
                    id="front"
                    className="bg-[color:var(--color-bg-2)]/60 border-[color:var(--color-primary)]/50 text-[color:var(--color-text)] placeholder:[color:var(--color-muted)]"
                    placeholder="Enter front text"
                    value={cardFront}
                    onChange={(e) => setCardFront(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="back">Back</Label>
                  </div>
                  <Textarea
                    id="back"
                    className="bg-[color:var(--color-bg-2)]/60 border-[color:var(--color-primary)]/50 text-[color:var(--color-text)] placeholder:[color:var(--color-muted)]"
                    placeholder="Enter back text"
                    rows={4}
                    value={cardBack}
                    onChange={(e) => setCardBack(e.target.value)}
                  />
                </div>

                <div className="w-full flex justify-center items-center">
                  <Button
                    className="bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 text-white hover:bg-gradient-to-br"
                    type="submit"
                  >
                    Add Card
                  </Button>
                </div>
              </div>
            </form>
          </ModalBody>
        </Modal>

        {/* Stats Modal */}
        <Modal
          show={openStatsModal}
          onClose={() => setOpenStatsModal(false)}
          size="5xl"
          popup
        >
          <ModalHeader />
          <ModalBody>
            <div className="space-y-4">
              <h2 className="text-center text-xl font-medium">
                {statsDeck?.name} | Cards ({statsCards.length})
              </h2>

              {statsLoading && (
                <div className="w-full text-center">Loading…</div>
              )}
              {statsError && (
                <div className="w-full text-center text-red-500">
                  {statsError}
                </div>
              )}

              {!statsLoading && !statsError && (
                <div>
                  <Table hoverable>
                    <TableHead className=" border-b">
                      <TableRow className="text-white">
                        <TableHeadCell>Front</TableHeadCell>
                        <TableHeadCell>ID</TableHeadCell>
                        <TableHeadCell>Rep</TableHeadCell>
                        <TableHeadCell>Interval (d)</TableHeadCell>
                        <TableHeadCell>EF</TableHeadCell>
                        <TableHeadCell>Next Review</TableHeadCell>
                        <TableHeadCell>Action</TableHeadCell>
                      </TableRow>
                    </TableHead>
                    <TableBody className="divide-y text-[color:var(--color-text)] [&>tr]:!bg-gray-800 [&>tr:hover]:!bg-gray-700">
                      {statsCards.map((c) => (
                        <TableRow
                          key={c.id}
                        >
                          <TableCell className="whitespace-pre-wrap">
                            {c.front}
                          </TableCell>
                          <TableCell className="whitespace-pre-wrap">
                            {c.id}
                          </TableCell>
                          <TableCell>{c.repetition ?? 0}</TableCell>
                          <TableCell>{c.interval ?? 0}</TableCell>
                          <TableCell>
                            {Number(c.ef)?.toFixed
                              ? Number(c.ef).toFixed(2)
                              : c.ef}
                          </TableCell>
                          <TableCell>
                            {c.next_review
                              ? new Date(c.next_review).toLocaleString()
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Button
                              color="failure"
                              size="xs"
                              className="cursor-pointer"
                              onClick={() => handleDeleteCard(c.id)}
                            >
                              <span className="flex items-center gap-1">
                                <HiTrash /> Delete
                              </span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="w-full flex justify-center items-center pt-2">
                <Button
                  className="bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 text-white hover:bg-gradient-to-br "
                  onClick={() => setOpenStatsModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </ModalBody>
        </Modal>
      </div>
    </div>
  );
}
