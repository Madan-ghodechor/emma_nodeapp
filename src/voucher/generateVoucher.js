import puppeteer from 'puppeteer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import Handlebars from 'handlebars';

export let generateVoucher = async (req) => {

    // let data = {
    //     "bookingId": "CTX123",
    //     "createdAt": "13 Feb 2026",
    //     "primaryAttendeeName": "Madan Ghodechor",
    //     "primaryAttendeeEmail": "madan.ghodechor@cotrav.co",
    //     "rooms": [
    //         {
    //             "type": "Triple",   // Triple, Double, Single
    //             "checkIn": "10 Feb 2026",
    //             "checkOut": "12 Feb 2026",
    //             "guests": [
    //                 { "name": "Madan", "email": "madan.ghodechor@cotrav.co", "phone": "+919309804106" },
    //                 { "name": "Madan", "email": "madan.ghodechor@cotrav.co", "phone": "+919309804106" },
    //                 { "name": "Madan", "email": "madan.ghodechor@cotrav.co", "phone": "+919309804106" }
    //             ]
    //         }
    //     ]
    // }

    const data = req;

    let browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    let page = await browser.newPage();

    let __filename = fileURLToPath(import.meta.url);
    let __dirname = path.dirname(__filename);

    let htmlPath = path.join(__dirname, 'voucher.html');

    let source = fs.readFileSync(htmlPath, 'utf8');

    Handlebars.registerHelper('inc', function (value) {
        return Number(value) + 1;
    });

    let template = Handlebars.compile(source);

    let html = template(data);

    html = html.replace('{{bookingId}}', data.bookingId);
    html = html.replace('{{createdAt}}', data.createdAt);
    html = html.replace('{{primaryAttendeeName}}', data.primaryAttendeeName);
    html = html.replace('{{primaryAttendeeEmail}}', data.primaryAttendeeEmail);

    if (data.rooms[0].type == 'Triple' || data.rooms[0].type == 'triple') {
        html = html.replace('ConditionalfooterHeight', '457px');  // Triple Sharing
    } else if (data.rooms[0].type == 'Double' || data.rooms[0].type == 'double') {
        html = html.replace('ConditionalfooterHeight', '562px');  // Double Sharing
    } else {
        html = html.replace('ConditionalfooterHeight', '639px');  // Single Sharing
    }



    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
    });




    await browser.close();

    return pdf;
};

