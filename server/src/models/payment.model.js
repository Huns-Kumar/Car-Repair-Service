import mongoose from "mongoose";

const paymentSchema = new Schema({
  paymentMethod: {
    type: String,
    enum: ['credit card', 'debit card', 'cash', 'bank transfer'], // Customize payment methods
    required: true,
  },
  cardNumber: {
    type: String,
    required: function () { return this.paymentMethod !== 'cash'; }, // Only required for non-cash payments
  },
  expiryDate: {
    type: String, // Store as MM/YY format
    required: function () { return this.paymentMethod !== 'cash'; }, // Only required for non-cash payments
  },
  cardHolderName: {
    type: String,
    required: function () { return this.paymentMethod !== 'cash'; }, // Only required for non-cash payments
  },
  // status: {
  //   type: String,
  //   enum: ['pending', 'completed', 'failed'],
  //   default: 'pending',
  // },
}, { timestamps: true });

  export const Payment = mongoose.model('Payment', paymentSchema)