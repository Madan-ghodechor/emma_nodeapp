import mongoose from 'mongoose';

const emmaRegistrationSchema = new mongoose.Schema(
  {
    memberType: {
      type: String,
      enum: ['emma', 'non'],
      required: true,
      default: 'emma'
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    phone: { type: String, required: true, trim: true, unique: true },
    company: { type: String, required: true, trim: true },
    gst: { type: String, trim: true },
    fee: { type: Number, required: true },
    gstAmount: { type: Number, default: 0 },
    totalAmount: { type: Number },
    orderId: { type: String, required: true, unique: true, trim: true },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmmaRegistrationPayment'
    }
  },
  { timestamps: true }
);

export default mongoose.model('EmmaRegistration', emmaRegistrationSchema);
