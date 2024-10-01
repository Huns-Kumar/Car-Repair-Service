import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  dateCreated: { type: Date, default: Date.now }
});

export const Review = mongoose.model('Review', reviewSchema)