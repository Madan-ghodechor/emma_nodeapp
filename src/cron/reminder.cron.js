// cron/reminder.cron.js
import cron from 'node-cron';
import BookingLogs from '../models/Log.Booking.model.js';
import EmmaRegistration from '../models/EmmaRegistration.model.js';
import { reminderMail, emmaRegistrationReminderMail } from '../services/reminder.mail.service.js'

export const bookingReminderCron = () => {

    console.log('cronjob');

    // * * * * *    For Example : ( 30 18 * * * )   06:30 PM,  ( 30 9,18 * * * )  09:30 AM & 06:30 PM
    // | | | | |
    // | | | | day of week (0–7)  Sun = 0 or 7
    // | | | month (1–12)
    // | | day of month (1–31)
    // | hour (0–23)
    // minute (0–59)


    if (process.env.ENABLE_CRON)
        cron.schedule(process.env.CRON_TIME, async () => {
            try {
                console.log('Running room reminder cron...');


                // const logs = await BookingLogs.find(); 
                const logs = await BookingLogs.find({ stage: { $lt: 5 } });


                for (const record of logs) {

                    const payload = {
                        paymentLink: process.env.COMPLETEPROCESS + record.bulkRefId,
                        name: record.primaryUser.firstName,
                        email: record.primaryUser.email
                    }
                    const mail_status = await reminderMail(payload);
                    if (mail_status?.messageId) {
                        await BookingLogs.updateMany(
                            { bulkRefId: record.bulkRefId },
                            { $inc: { reminderCount: 1 } }
                        );

                    }

                }

                console.log('Reminder cron finished');

            } catch (error) {
                console.error('Cron failed:', error);
            }
        });

};

export const emmaRegistrationReminderCron = () => {

    console.log('[EMMA CRON] Initializing...');
    console.log('[EMMA CRON] ENABLE_EMMA_CRON =', process.env.ENABLE_EMMA_CRON);
    console.log('[EMMA CRON] EMMA_CRON_TIME   =', process.env.EMMA_CRON_TIME);
    console.log('[EMMA CRON] BOOKING_AFTER_REG =', process.env.BOOKING_AFTER_REG);

    if (!process.env.ENABLE_EMMA_CRON) {
        console.log('[EMMA CRON] Skipped — ENABLE_EMMA_CRON is not set');
        return;
    }

    if (!process.env.EMMA_CRON_TIME) {
        console.error('[EMMA CRON] Skipped — EMMA_CRON_TIME is not set');
        return;
    }

    console.log('[EMMA CRON] Scheduling with expression:', process.env.EMMA_CRON_TIME);

    cron.schedule(process.env.EMMA_CRON_TIME, async () => {
        console.log('[EMMA CRON] Tick fired at', new Date().toISOString());
        try {

            // Step 1: fetch registrations
            console.log('[EMMA CRON] Step 1: Querying EmmaRegistration { registerFrom: 0 }...');
            const registrations = await EmmaRegistration.find({ registerFrom: 0 });
            console.log('[EMMA CRON] Step 1: Found', registrations.length, 'record(s)');

            if (registrations.length === 0) {
                console.log('[EMMA CRON] No records to remind. Exiting tick.');
                return;
            }

            // Step 2: deduplicate emails and send
            const seenEmails = new Set();
            let sent = 0, skipped = 0, failed = 0;

            for (const record of registrations) {
                console.log(`[EMMA CRON] Step 2: Processing orderId=${record.orderId} email=${record.email}`);

                if (seenEmails.has(record.email)) {
                    console.log(`[EMMA CRON]   Skipping duplicate email: ${record.email}`);
                    skipped++;
                    continue;
                }
                seenEmails.add(record.email);

                // Step 3: check booking log — skip only if booking is fully completed (stage 5)
                const bookingLog = await BookingLogs.findOne({ bulkRefId: record.orderId });

                if (bookingLog) {
                    console.log(`[EMMA CRON]   Booking log found. stage=${bookingLog.stage}`);
                    if (bookingLog.stage >= 5) {
                        console.log(`[EMMA CRON]   Booking already completed for ${record.email} — skipping`);
                        skipped++;
                        continue;
                    }
                } else {
                    console.log(`[EMMA CRON]   No booking log found for ${record.email} — will send reminder`);
                }

                const payload = {
                    paymentLink: process.env.BOOKING_AFTER_REG + record.orderId,
                    name: record.firstName,
                    email: record.email
                };
                console.log('[EMMA CRON]   Sending mail to:', payload.email, '| link:', payload.paymentLink);

                try {
                    const info = await emmaRegistrationReminderMail(payload);
                    console.log('[EMMA CRON]   Mail sent. messageId:', info?.messageId);
                    sent++;
                } catch (mailErr) {
                    console.error('[EMMA CRON]   Mail FAILED for', record.email, ':', mailErr.message);
                    failed++;
                }
            }

            console.log(`[EMMA CRON] Done. sent=${sent} skipped=${skipped} failed=${failed}`);

        } catch (error) {
            console.error('[EMMA CRON] Cron tick failed:', error);
        }
    });

    console.log('[EMMA CRON] Scheduled successfully.');

};
