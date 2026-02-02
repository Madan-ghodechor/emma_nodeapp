import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    //   trim: true

    },
    gst: {
      type: String,
      required: true,
      unique: true
    },
    address: {
      type: String,
    //   required: true
    },
    bulkRefId: {
  type: String,
  index: true
}

  },
  
  { timestamps: true }
);

export default mongoose.model('Company', companySchema);
