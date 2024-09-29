import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
    street: { type: String, required: true }, // e.g., "123 Main St"
    city: { type: String, required: true }, // e.g., "New York"
    // state: { type: String, required: true }, // e.g., "NY"
    // postalCode: { type: String, required: true }, // e.g., "10001"
    // country: { type: String, required: true }, // e.g., "USA"
    location: {
      type: { type: String, enum: ['Point'], required: true },
      coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    dateCreated: { type: Date, default: Date.now }
  });
  
  // 2dsphere index for geospatial queries
  AddressSchema.index({ location: '2dsphere' });

  export const Address = mongoose.model('Address', addressSchema)