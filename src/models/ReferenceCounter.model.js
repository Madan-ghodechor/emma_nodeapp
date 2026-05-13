import mongoose from 'mongoose';

const referenceCounterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true
    },
    seq: {
      type: Number,
      required: true,
      default: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model('ReferenceCounter', referenceCounterSchema);
