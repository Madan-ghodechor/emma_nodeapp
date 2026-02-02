
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  gst: { type: String },
//   is_primary: { type: Boolean, default: false },
  is_primary_user: { type: Boolean, default: false },
  primary_user_email: { type: String, lowercase: true, trim: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  bulkRefId: { type: String, index: true },

}, { timestamps: true });

export default mongoose.model('Attendees', userSchema);

