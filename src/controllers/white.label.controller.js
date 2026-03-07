import whiteLabelCompanySchema from '../models/white.labaled.company.js';
import { uploadToS3 } from '../services/s3.config.js';

//**************** White Label Methods ******************//
// export const createWhiteLabel = async (req, res) => {
//     try {
//         const { name, industry, region, color, abbr } = req.body;

//         // ─── VALIDATION ─────────────────────────────
//         if (!name || !abbr) {
//             return res.status(400).json({
//                 success: false,
//                 message: "name and abbr are required"
//             });
//         }

//         // prevent duplicate abbreviation
//         const existing = await whiteLabelCompanySchema.findOne({ abbr });

//         if (existing) {
//             return res.status(409).json({
//                 success: false,
//                 message: "Company with this abbreviation already exists"
//             });
//         }

//         await uploadToS3(name, file);

//         // ─── CREATE DOCUMENT ────────────────────────
//         const company = await whiteLabelCompanySchema.create({
//             name,
//             industry,
//             region,
//             color,
//             abbr
//         });

//         return res.status(201).json({
//             success: true,
//             message: "White label company created",
//             data: company
//         });

//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to create white label company",
//             error: error.message
//         });
//     }
// };
export const createWhiteLabel = async (req, res) => {
    try {

        const { name, industry, region, abbr, companyColor, themeMainColor, themeSecondaryColor } = req.body;


        if (!name || !abbr) {
            return res.status(400).json({
                success: false,
                message: "name and abbr are required"
            });
        }

        const existing = await whiteLabelCompanySchema.findOne({ name });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Company already exists"
            });
        }

        let headerFirstLogoUrl = null;
        let headerSecondLogoUrl = null;
        let headerThirdLogoUrl = null;
        let websiteHeaderUrl = null;

        if (req.files) {

            if (req.files.headerFirstLogo) {
                const file = req.files.headerFirstLogo;
                headerFirstLogoUrl = await uploadToS3(name, file, "headerFirstLogo");
            }

            if (req.files.headerSecondLogo) {
                const file = req.files.headerSecondLogo;
                headerSecondLogoUrl = await uploadToS3(name, file, "headerSecondLogo");
            }

            if (req.files.headerThirdLogo) {
                const file = req.files.headerThirdLogo;
                headerThirdLogoUrl = await uploadToS3(name, file, "headerThirdLogo");
            }

            if (req.files.websiteHeader) {
                const file = req.files.websiteHeader;
                websiteHeaderUrl = await uploadToS3(name, file, "websiteHeader");
            }
        }

        // ─── CREATE DOCUMENT ─────────────────────────
        const getRandomColor = () => {
            return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
        };

        const company = await whiteLabelCompanySchema.create({
            name: name || "NA",
            industry: industry || "NA",
            region: region || "NA",
            color: companyColor || getRandomColor(),
            abbr: abbr || "NA",
            themeMainColor: themeMainColor || "NA",
            themeSecondaryColor: themeSecondaryColor || "NA",

            assets: {
                web_header: websiteHeaderUrl || "NA",
                headerFirstLogoUrl : headerFirstLogoUrl || "NA",
                headerSecondLogoUrl : headerSecondLogoUrl || "NA",
                headerThirdLogoUrl : headerThirdLogoUrl || "NA",
            }
        });

        return res.status(201).json({
            success: true,
            message: "White label company created",
            data: company
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to create white label company",
            error: error.message
        });
    }
};

export const getAllWhiteLabels = async (req, res) => {
    try {

        const companies = await whiteLabelCompanySchema
            .find({})
            .sort({ name: 1 });

        return res.status(200).json({
            success: true,
            count: companies.length,
            data: companies
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch white label companies",
            error: error.message
        });
    }
};


export const getAllWhiteLabelById = async (req, res) => {
    try {

        const { id } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Company id is required"
            });
        }

        const company = await whiteLabelCompanySchema.findById(id);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: company
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch white label company",
            error: error.message
        });
    }
};