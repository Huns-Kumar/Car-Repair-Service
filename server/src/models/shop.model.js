import mongoose from "mongoose";

const shopSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the User who is a shop owner
    shopName: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], required: true },
      coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    servicesOffered: [{ type: String, required: true }], // e.g., ['Engine Repair', 'Tire Replacement']
    numberOfWorkers: { type: Number, required: true },
    operatingTime: {
      open: { type: String, required: true }, // e.g., '08:00 AM'
      close: { type: String, required: true } // e.g., '06:00 PM'
    },
    rating: { type: Number, default: 0 }, // check --------------
  }, {timestamps: true});

  export const Shop = mongoose.model('Shop', shopSchema)