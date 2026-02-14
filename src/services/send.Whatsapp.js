import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import axios from "axios";


const BASE_URL = process.env.BASE_URL;
// example: https://api.yoursite.com/uploads/booking-6f449537-9e6f-4947-b885-9187543d9fed.pdf

export const sendWhatsapp = async (primaryUserWhatsapp, Booking_Date, Guest_Name, pdfBuffer = null, template, id = 'voucher') => {
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

            documentLink = `${BASE_URL}uploads/${fileName}`;
        }
        const normalizePhone = (phone) => {
            if (!phone) return phone;
            return phone.startsWith("+") ? phone.slice(1) : phone;
        };

        const phone = normalizePhone(primaryUserWhatsapp);

        let load;

        if (template == 'success') {
            load = {
                "to": phone,
                "data": {
                    "name": "eemahotel_booking_confirmation",
                    "language": {
                        "code": "en"
                    },
                    "components": [
                        {
                            "type": "header",
                            "parameters": [
                                {
                                    "type": "document",
                                    "document": {
                                        "link": documentLink,
                                        "filename": `${id}.pdf`
                                    }
                                }
                            ]
                        },
                        {
                            "type": "body",
                            "parameters": [
                                {
                                    "type": "text",
                                    "text": Guest_Name
                                },
                                {
                                    "type": "text",
                                    "text": Booking_Date
                                }
                            ]
                        }
                    ]
                }
            }
        } else {
            load = {
                "to": phone,
                "data": {
                    "name": "eemahotel_booking_decline",
                    "language": {
                        "code": "en"
                    },
                    "components": [
                        {
                            "type": "body",
                            "parameters": [
                                {
                                    "type": "text",
                                    "text": Guest_Name
                                }
                            ]
                        }
                    ]
                }
            }
        }

        const token = process.env.WHATSAPP_TOKEN;

        const url = `https://pre-prod.cheerio.in/direct-apis/v1/whatsapp/template/send`;

        const { data } = await axios.post(url, JSON.stringify(load), {
            headers: {
                'x-api-key': token,
                "Content-Type": "application/json"
            },
        });




        return { success: true, link: documentLink };

    } catch (error) {
        console.error("Whatsapp error:", error);
        throw error;
    }
};
