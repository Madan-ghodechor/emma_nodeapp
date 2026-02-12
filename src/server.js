import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import connectDB from './config/db.js';
import { bookingReminderCron } from './cron/reminder.cron.js';


const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();

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