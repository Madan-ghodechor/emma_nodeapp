import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

const BASE_URL = process.env.BASE_URL;
// example: https://api.yoursite.com

export const sendWhatsapp = async (primaryUserWhatsapp, pdfBuffer = null) => {
    try {
        let documentLink = null;

        if (pdfBuffer) {
            const uploadDir = path.join(process.cwd(), "uploads");

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const fileName = `booking-${uuid()}.pdf`;
            const filePath = path.join(uploadDir, fileName);

            fs.writeFileSync(filePath, pdfBuffer);

            documentLink = `${BASE_URL}/uploads/${fileName}`;
        }

        // build template payload
        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: primaryUserWhatsapp,
            type: "template",
            template: {
                name: "eemahotel_booking_confirmation",
                language: { code: "en" },
                components: [
                    {
                        type: "header",
                        parameters: [
                            {
                                type: "document",
                                document: {
                                    link: documentLink,
                                    filename: "booking.pdf"
                                }
                            }
                        ]
                    },
                    {
                        type: "body",
                        parameters: [
                            { type: "text", text: "Madan" },
                            { type: "text", text: "14 Feb 2026" }
                        ]
                    }
                ]
            }
        };

        console.log(payload)

        // call meta API here using axios / fetch

        return { success: true, link: documentLink };

    } catch (error) {
        console.error("Whatsapp error:", error);
        throw error;
    }
};
