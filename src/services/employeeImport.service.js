
import Employee from '../models/Employee.model.js';

export const saveEmployees = async (rows) => {
  if (!rows || rows.length === 0) return { inserted: 0, skipped: 0, insertedEmployees: [], skippedKeys: [] };

  // 1️⃣ Prepare keys for duplicate check
  const emailsAndCompanies = rows.map(r => ({ email: r.email, company: r.company }));

  // 2️⃣ Find existing employees (email + company)
  const existingEmployees = await Employee.find(
    { $or: emailsAndCompanies },
    { email: 1, company: 1 }
  );

  const existingKeys = existingEmployees.map(e => `${e.email}-${e.company}`);

  // 3️⃣ Filter out duplicates
  const newEmployees = rows
    .filter(r => !existingKeys.includes(`${r.email}-${r.company}`))
    .map(r => ({
      firstName: r.first_name,
      lastName: r.last_name,
      email: r.email,
      phone: r.phone,
      gst: r.gst,
      company: r.company
    }));

  // 4️⃣ Insert all new employees at once
  const insertedEmployees = newEmployees.length > 0 ? await Employee.insertMany(newEmployees) : [];

  return {
    inserted: insertedEmployees.length,
    skipped: rows.length - insertedEmployees.length,
    insertedEmployees,
    skippedKeys: existingKeys
  };
};


