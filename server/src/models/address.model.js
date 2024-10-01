import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
    street: { type: String, required: true }, // e.g., "123 Main St"
    area: {type: String, required: true},
    city: { type: String, required: true }, // e.g., "New York"
    province: { type: String, required: true },
    // location: {
    //   type: { type: String, enum: ['Point'], required: true },
    //   coordinates: { type: [Number], required: true } // [longitude, latitude]
    // },
    dateCreated: { type: Date, default: Date.now }
  });
  
  // 2dsphere index for geospatial queries
  addressSchema.index({ location: '2dsphere' });

  export const Address = mongoose.model('Address', addressSchema)