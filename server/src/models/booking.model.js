import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service: { type: String, enum: ["Tire Puncture", "Engine Problem", "Other"], required: true },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  customerAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true }, // Reference to customer's address
  shopAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true }, // Reference to shop's address
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }, // Reference to payment details
  appointmentDate: { type: Date, required: true },
  notes: { type: String }
}, {timestamps: true});

export const Booking = mongoose.model('Booking', bookingSchema)