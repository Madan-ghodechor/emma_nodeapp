
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
    enum: [0, 1, 2], // pending, success, failed
    default: 0 // pending
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentRecords'
  },
  paymentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentRecords'
  }],
  voucherSend: {
    type: Number,
    default: 0
  },
  passcode: {
    type: String,
    trim: true
  }

}, { timestamps: true });

roomSchema.pre('save', function () {
  if (this.paymentId) {
    const paymentId = this.paymentId.toString();
    const paymentIds = Array.isArray(this.paymentIds)
      ? this.paymentIds.map(id => id.toString())
      : [];

    if (!paymentIds.includes(paymentId)) {
      this.paymentIds = [...(this.paymentIds || []), this.paymentId];
    }
  }
});

const syncPaymentIdsOnUpdate = function () {
  const update = this.getUpdate() || {};
  const paymentId = update?.$set?.paymentId || update?.paymentId;
  const hasExplicitPaymentIdsUpdate =
    Object.prototype.hasOwnProperty.call(update, 'paymentIds') ||
    Object.prototype.hasOwnProperty.call(update?.$set || {}, 'paymentIds') ||
    Object.prototype.hasOwnProperty.call(update?.$addToSet || {}, 'paymentIds');

  if (!paymentId || hasExplicitPaymentIdsUpdate) {
    return;
  }

  update.$addToSet = update.$addToSet || {};

  if (update.$addToSet.paymentIds) {
    const existing = update.$addToSet.paymentIds;
    update.$addToSet.paymentIds = existing.$each
      ? { $each: [...existing.$each, paymentId] }
      : { $each: [existing, paymentId] };
  } else {
    update.$addToSet.paymentIds = paymentId;
  }

  this.setUpdate(update);
};

roomSchema.pre('findOneAndUpdate', syncPaymentIdsOnUpdate);
roomSchema.pre('updateOne', syncPaymentIdsOnUpdate);
roomSchema.pre('updateMany', syncPaymentIdsOnUpdate);

export default mongoose.model('Room', roomSchema);
