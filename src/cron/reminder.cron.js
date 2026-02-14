// cron/reminder.cron.js
import cron from 'node-cron';
import BookingLogs from '../models/Log.Booking.model.js';
import { reminderMail } from '../services/reminder.mail.service.js'

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
