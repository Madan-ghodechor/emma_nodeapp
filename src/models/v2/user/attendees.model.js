
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  orderId: { type: String, trim: true },
  phone: { type: String },
  gst: { type: String },
//   is_primary: { type: Boolean, default: false },
  isprimaryGuest: { type: Boolean, default: false },
  primaryGuestEmail: { type: String, lowercase: true, trim: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'new_Company' },
 

}, { timestamps: true });

export default mongoose.model('new_Attendees', userSchema);