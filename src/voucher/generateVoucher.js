    import puppeteer from 'puppeteer';
    import fs from 'fs';
    import { fileURLToPath } from 'url';
    import path from 'path';
    import Handlebars from 'handlebars';

    export let generateVoucher = async (datsa) => {

        let data = {
            bookingId: 'CTX123',
            rooms: [
                {
                    type: 'Single',
                    checkIn: '10 Feb',
                    checkOut: '12 Feb',
                    guests: [
                        { name: 'Madan', email: 'madan@mail.com' }
                    ]
                },
                {
                    type: 'Double',
                    checkIn: '12 Feb',
                    checkOut: '14 Feb',
                    guests: [
                        { name: 'Alice', email: 'alice@mail.com' },
                        { name: 'John', email: 'john@mail.com' }
                    ]
                },
                {
                    type: 'Double',
                    checkIn: '12 Feb',
                    checkOut: '14 Feb',
                    guests: [
                        { name: 'Alice', email: 'alice@mail.com' },
                        { name: 'John', email: 'john@mail.com' }
                    ]
                },
                {
                    type: 'Double',
                    checkIn: '12 Feb',
                    checkOut: '14 Feb',
                    guests: [
                        { name: 'Alice', email: 'alice@mail.com' },
                        { name: 'John', email: 'john@mail.com' }
                    ]
                },
                {
                    type: 'Double',
                    checkIn: '12 Feb',
                    checkOut: '14 Feb',
                    guests: [
                        { name: 'Alice', email: 'alice@mail.com' },
                        { name: 'John', email: 'john@mail.com' }
                    ]
                },
                {
                    type: 'Double',
                    checkIn: '12 Feb',
                    checkOut: '14 Feb',
                    guests: [
                        { name: 'Alice', email: 'alice@mail.com' },
                        { name: 'John', email: 'john@mail.com' }
                    ]
                },
                {
                    type: 'Double',
                    checkIn: '12 Feb',
                    checkOut: '14 Feb',
                    guests: [
                        { name: 'Alice', email: 'alice@mail.com' },
                        { name: 'John', email: 'john@mail.com' }
                    ]
                }
            ]
        };


        let browser = await puppeteer.launch({
            headless: 'new'
        });

        let page = await browser.newPage();

        let __filename = fileURLToPath(import.meta.url);
        let __dirname = path.dirname(__filename);

        let htmlPath = path.join(__dirname, 'voucher.html');

        let source = fs.readFileSync(htmlPath, 'utf8');

        let template = Handlebars.compile(source);

        let html = template(data);

        html = html.replace('{{bookingId}}', 'CTXEHB_1770723079145_0fc664');
        html = html.replace('{{guestName}}', 'Madan Ghodechor');

        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,

            displayHeaderFooter: false,

            // headerTemplate: `
            // <div style="width:100%;padding:10px 25px;font-size:10px;">
            //     <div style="display:flex;justify-content:space-between;align-items:center;">
            //     <img src="https://yourcdn/logo.png" style="height:25px"/>
            //     <div>Booking ID: ${data.bookingId}</div>
            //     </div>
            // </div>
            // `,

            footerTemplate: `
                <div style="
                width:100%;
                font-size:10px;
                padding:8px 20px;
                text-align:center;
                border-top:1px solid #ddd;">
                Page <span class="pageNumber"></span> of <span class="totalPages"></span>
                </div>
            `,

            margin: {
                top: '0px',     // MUST give space
                bottom: '0px'
            }
        });


        await browser.close();

        return pdf;
    };
