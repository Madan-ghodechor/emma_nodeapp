import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Room from '../models/Room.model.js';

dotenv.config();

const normalizeId = (id) => String(id);

const run = async () => {
  try {
    await connectDB();

    const rooms = await Room.find().select('_id paymentId paymentIds').lean();

    let scanned = 0;
    let updated = 0;

    for (const room of rooms) {
      scanned += 1;

      const ids = [];
      const seen = new Set();

      if (Array.isArray(room.paymentIds)) {
        for (const id of room.paymentIds) {
          if (!id) continue;
          const key = normalizeId(id);
          if (!seen.has(key)) {
            seen.add(key);
            ids.push(id);
          }
        }
      }

      if (room.paymentId) {
        const key = normalizeId(room.paymentId);
        if (!seen.has(key)) {
          seen.add(key);
          ids.push(room.paymentId);
        }
      }

      const nextPaymentId = ids.length ? ids[ids.length - 1] : null;
      const prevPaymentId = room.paymentId ? normalizeId(room.paymentId) : null;
      const nextPaymentIdStr = nextPaymentId ? normalizeId(nextPaymentId) : null;

      const hasSameSingle = prevPaymentId === nextPaymentIdStr;
      const hasSameArray =
        Array.isArray(room.paymentIds) &&
        room.paymentIds.length === ids.length &&
        room.paymentIds.every((id, i) => normalizeId(id) === normalizeId(ids[i]));

      if (hasSameSingle && hasSameArray) {
        continue;
      }

      await Room.updateOne(
        { _id: room._id },
        {
          $set: {
            paymentId: nextPaymentId,
            paymentIds: ids
          }
        }
      );

      updated += 1;
    }

    console.log(`Backfill complete. scanned=${scanned}, updated=${updated}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Backfill failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

run();
