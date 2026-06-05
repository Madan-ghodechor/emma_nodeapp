import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomType: { type: String, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "new_Attendees" }],
    orderId: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("new_Room", roomSchema);
