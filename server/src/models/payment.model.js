import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['Card', 'Cash', 'Online'], required: true },
    status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
    // date: { type: Date, default: Date.now }
  }, {timestamps:true});

  export const Payment = mongoose.model('Payment', paymentSchema)