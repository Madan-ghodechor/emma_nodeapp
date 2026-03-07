import mongoose from "mongoose";

const whiteLabelCompanySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        industry: {
            type: String,
            required: false,
            trim: true
        },
        region: {
            type: String,
            required: false,
            trim: true
        },
        color: {
            type: String,
            required: false
        },
        abbr: {
            type: String,
            required: false,
            trim: true
        },
        themeMainColor: {
            type: String,
            required: false,
        },
        themeSecondaryColor: {
            type: String,
            required: false,
        },
        assets: {
            type: Map,
            of: String
        }
    },
    {
        timestamps: true,
        collection: "white-lable-companies"
    }
);

export default mongoose.model("WhiteLableCompany", whiteLabelCompanySchema);