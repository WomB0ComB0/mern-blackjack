import axios from 'axios';

let deckId: string | null = null;

// TODO: 🚩
const initializeDeck = async () => {
  try {
    const response = await axios.get(
      'https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1',
    );
    deckId = response.data.deck_id;
    return deckId;
  } catch (error) {
    Error.isError(error)
      ? (console.error('Error initializing deck:', error.message),
        (() => {
          throw error;
        })())
      : (console.error('Error initializing deck:', error),
        (() => {
          throw new Error('Failed to initialize deck');
        })());
  }
};

// TODO: 🚩
const drawCard = async (count = 1) => {
  try {
    if (!deckId) await initializeDeck();
    const response = await axios.get(
      `https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${count}`,
    );
    return response.data.cards;
  } catch (error) {
    if (Error.isError(error)) {
      console.error('Error drawing cards:', error);
      throw error;
    }
  }
};

// TODO: 🚩
const calculateHand = (
  // TODO: 🚩
  hand: any,
) => {
  let score = 0;
  let aces = 0;

  for (const card of hand) {
    if (card.value === 'ACE') {
      aces += 1;
    } else if (['KING', 'QUEEN', 'JACK'].includes(card.value)) {
      score += 10;
    } else {
      score += parseInt(card.value);
    }
  }

  //
  for (let i = 0; i < aces; i++) {
    if (score + 11 <= 21) {
      score += 11;
    } else {
      score += 1;
    }
  }

  return score;
};

export { initializeDeck, drawCard, calculateHand };
