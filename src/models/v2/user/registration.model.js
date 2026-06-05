import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
    },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "new_EventConfig",
    },

    primaryGuest: {
      firstName: {
        type: String,
        required: true,
      },

      lastName: {
        type: String,
        required: true,
      },

      email: {
        type: String,
        required: true,
      },

      phone: {
        type: String,
        required: true,
      },
      gst: {
        type: String,
        trim: true,
      },
      company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "new_Company",
        required: true,
      },
    },

    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "new_room",
    },

    paymentIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "new_Payments",
        },
      ],
      default: [],
    },

    registrationEnabled: {
      type: Boolean,
      required: true,
    },

    emmaReg: {
      memberType: {
        type: String,
        enum: ["member", "non-member"],
      },
    },
  },
  { timestamps: true },
);

export default mongoose.model("new_Registration", registrationSchema);
