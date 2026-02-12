
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import companyRoutes from './routes/company.routes.js';
import userRoutes from './routes/user.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import roomRoutes from './routes/room.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import amountverification from './routes/amount.verification.routes.js';
import logBookingAttempt from './routes/log.booking.attempt.routes.js';
import paymentRecord from './routes/payment.record.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { generateVoucher } from './voucher/generateVoucher.js'

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.send('API is running ');
});

app.use('/api/companies', companyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/verify', amountverification)
app.use('/api/attempt', logBookingAttempt)
app.use('/api/record-payment', paymentRecord)

app.use('/api/admin/', adminRoutes)

app.post('/api/voucher', async (req, res) => {
  const buffer = await generateVoucher(req.body);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename=voucher.pdf',
    'Content-Length': buffer.length
  });

  res.send(buffer);
});


export default app;
