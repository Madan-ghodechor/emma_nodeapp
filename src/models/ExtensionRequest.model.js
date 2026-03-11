import mongoose from 'mongoose';

const extensionRequestSchema = new mongoose.Schema(
  {
    bulkRefId: {
      type: String,
      required: true,
      index: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true
    },
    roomId: {
      type: String,
      required: true
    },
    mode: {
      type: String,
      enum: ['stay_extend', 'room_upgrade', 'both'],
      required: true
    },
    status: {
      type: String,
      enum: ['validated', 'mail_sent', 'payment_pending', 'payment_completed', 'approved', 'rejected'],
      default: 'validated'
    },
    passcodeVerified: {
      type: Boolean,
      default: false
    },
    requestedBy: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    currentBooking: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    requestedChanges: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    pricing: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    paymentContext: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    email: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('ExtensionRequest', extensionRequestSchema);
