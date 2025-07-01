const { model, Schema } = await import('mongoose');
export default model('User', 
  new Schema({
    username: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    balance: {
      type: Number,
      default: 1000
    },
    totalGames: {
      type: Number,
      default: 0
    },
    wins: {
      type: Number,
      default: 0
    },
    highestWin: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }, { 
    timestamps: true 
  })
); 