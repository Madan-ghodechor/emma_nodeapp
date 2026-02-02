
import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    phone: { type: String },
    gst: { type: String },
    company: { type: String, trim: true } // just store company name
  },
  { timestamps: true }
);

// ✅ Prevent duplicate employees for the same company
employeeSchema.index({ email: 1, company: 1 }, { unique: true });

export default mongoose.model('Employee', employeeSchema);


