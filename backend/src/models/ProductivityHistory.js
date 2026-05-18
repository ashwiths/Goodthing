import mongoose from 'mongoose';

const productivityHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD format
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  tasksCompletedToday: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true,
});

// A user can only have one history record per day
productivityHistorySchema.index({ user: 1, date: 1 }, { unique: true });

const ProductivityHistory = mongoose.model('ProductivityHistory', productivityHistorySchema);
export default ProductivityHistory;
