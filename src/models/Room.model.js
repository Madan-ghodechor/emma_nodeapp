
import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  roomType: { type: String, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  bulkRefId: {
  type: String,
  index: true
},
payment: {
  type: Number,
  enum: [0, 1, 2],
  default: 2 // pending
}

}, { timestamps: true });

export default mongoose.model('Room', roomSchema);
