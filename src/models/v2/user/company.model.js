import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      //   trim: true
    },
    gst: {
      type: String,
    },
    address: {
      type: String,
      //   required: true
    },
    orderId: {
      type: String,
      trim: true,
    },
    isEEMAMember: {
      type: Number,
      default: 0,
    },
  },

  { timestamps: true },
);

export default mongoose.model('new_Company', companySchema);
