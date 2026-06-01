import mongoose from "mongoose";

const logEntrySchema = new mongoose.Schema(
  {},
  {
    _id: false,
    strict: false,
    timestamps: true,
  },
);

const logsSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    logs: {
      type: [logEntrySchema],
      default: [],
    },
  },
  { timestamps: true },
);

export default mongoose.model("new_UserLogs", logsSchema);
