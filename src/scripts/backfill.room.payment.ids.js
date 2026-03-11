import Room from '../models/Room.model.js';

const normalizeId = (id) => String(id);

export const backfillRoomPaymentIds = async () => {
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

  return { scanned, updated };
};
