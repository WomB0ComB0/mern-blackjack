const { model, Schema } = await import('mongoose');
export default model('Game',
  new Schema({
    playerId: {
      type: String,
      required: true
    },
    playerHand: [{
      suit: String,
      value: String,
      code: String,
      image: String
    }],
    dealerHand: [{
      suit: String,
      value: String,
      code: String,
      image: String
    }],
    betAmount: {
      type: Number,
      required: true
    },
    winAmount: {
      type: Number,
      default: 0
    },
    gameOver: {
      type: Boolean,
      default: false
    },
    message: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  })
);