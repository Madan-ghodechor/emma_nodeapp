import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: true,
      trim: true,
    },

    guestsRegistrationEnabled: {
      type: Boolean,
      default: true,
    },
    memberPrice: {
      type: Number,
      default: null,
    },
    nonMemberPrice: {
      type: Number,
      default: null,
    },

    roomPricingExcludingGst: {
      type: Boolean,
      default: true,
    },
    gstPercentage: {
      type: Number,
      default: 18,
    },

    singleSharingRoomEnabled: {
      type: Boolean,
      default: true,
    },
    singleSharingPrice: {
      type: Number,
      default: null,
    },

    doubleSharingRoomEnabled: {
      type: Boolean,
      default: true,
    },
    doubleSharingPrice: {
      type: Number,
      default: null,
    },

    tripleSharingRoomEnabled: {
      type: Boolean,
      default: true,
    },
    tripleSharingPrice: {
      type: Number,
      default: null,
    },

    resortName: {
      type: String,
      default: "",
    },
    resortAddress: {
      type: String,
      default: "",
    },
    hotelSupportContact: {
      type: String,
      default: "",
    },
    hotelSupportEmail: {
      type: String,
      default: "",
    },
    googleLocation: {
      type: String,
      default: "",
    },
    standardCheckIn: {
      type: String,
      default: "",
    },
    standardCheckOut: {
      type: String,
      default: "",
    },
    termsEventName: {
      type: String,
      default: "",
    },
    cotravSupportContact: {
      type: String,
      default: "",
    },
    cotravSupportEmail: {
      type: String,
      default: "",
    },

    headerBanner: {
      type: String,
      default: null,
    },
    voucherHeaderImage: {
      type: String,
      default: null,
    },
    dateSelectionEnabled: {
      type: Boolean,
      default: true,
    },
    eventStartDate: {
      type: Date,
      required: function () {
        return this.dateSelectionEnabled;
      },
    },
    eventEndDate: {
      type: Date,
      required: function () {
        return this.dateSelectionEnabled;
      },
    },
  },
  { timestamps: true },
);

export default mongoose.model("new_EventConfig", eventSchema);
