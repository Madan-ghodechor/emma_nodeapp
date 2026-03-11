import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import connectDB from './config/db.js';
import { bookingReminderCron } from './cron/reminder.cron.js';
import { backfillRoomPaymentIds } from './scripts/backfill.room.payment.ids.js';


const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();

    try {
      const result = await backfillRoomPaymentIds();
      console.log(`Room paymentIds backfill complete. scanned=${result.scanned}, updated=${result.updated}`);
    } catch (error) {
      console.error('Room paymentIds backfill failed:', error);
    }

    if (process.env.ENABLE_CRON === 'true') {
      bookingReminderCron();
    }

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Startup failed:', error);
    process.exit(1);
  }
};

startServer();
