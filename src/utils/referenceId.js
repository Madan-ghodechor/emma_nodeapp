import BookingLogs from '../models/Log.Booking.model.js';
import EmmaRegistration from '../models/EmmaRegistration.model.js';
import ReferenceCounter from '../models/ReferenceCounter.model.js';

const REF_PREFIX = 'EC26';
const REF_WIDTH = 5;
const EAST_CONCLAVE_COUNTER_ID = 'east-conclave-2026';

const getSequenceNumber = (value = '') => {
  const number = Number.parseInt(String(value).replace(REF_PREFIX, ''), 10);
  return Number.isNaN(number) ? 0 : number;
};

export const generateEastConclaveId = async () => {
  const counter = await ReferenceCounter.findByIdAndUpdate(
    EAST_CONCLAVE_COUNTER_ID,
    { $inc: { seq: 1 } },
    { new: true }
  ).lean();

  if (counter) {
    return REF_PREFIX + String(counter.seq).padStart(REF_WIDTH, '0');
  }

  const [lastBookingLog, lastRegistration] = await Promise.all([
    BookingLogs
      .findOne({ bulkRefId: { $regex: `^${REF_PREFIX}` } })
      .sort({ bulkRefId: -1 })
      .select('bulkRefId')
      .lean(),
    EmmaRegistration
      .findOne({ orderId: { $regex: `^${REF_PREFIX}` } })
      .sort({ orderId: -1 })
      .select('orderId')
      .lean()
  ]);

  const lastNumber = Math.max(
    getSequenceNumber(lastBookingLog?.bulkRefId),
    getSequenceNumber(lastRegistration?.orderId)
  );
  const nextNumber = lastNumber + 1;

  try {
    await ReferenceCounter.create({
      _id: EAST_CONCLAVE_COUNTER_ID,
      seq: nextNumber
    });

    return REF_PREFIX + String(nextNumber).padStart(REF_WIDTH, '0');
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }

    const createdByParallelRequest = await ReferenceCounter.findByIdAndUpdate(
      EAST_CONCLAVE_COUNTER_ID,
      { $inc: { seq: 1 } },
      { new: true }
    ).lean();

    return REF_PREFIX + String(createdByParallelRequest.seq).padStart(REF_WIDTH, '0');
  }
};
