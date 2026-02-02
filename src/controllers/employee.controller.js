
import axios from 'axios';
import csv from 'csvtojson';
import XLSX from 'xlsx';
import { saveEmployees } from '../services/employeeImport.service.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

export const importEmployees = async (req, res) => {
  try {
    let rows = [];

    // 1️⃣ Handle Excel upload
    if (req.file) {
      const workbook = XLSX.read(req.file.buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet);
    } 
    // 2️⃣ Handle Google Sheet link
    else if (req.body.sheetUrl) {
      const { sheetUrl } = req.body;
      const response = await axios.get(sheetUrl);
      rows = await csv().fromString(response.data);
    } 
    else {
      return sendError(res, 'No Excel file or sheetUrl provided', 400);
    }

    if (!rows || rows.length === 0) {
      return sendError(res, 'No data found in the file or sheet', 400);
    }

    // 3️⃣ Normalize columns
    const formattedRows = rows.map(r => {
      const normalized = {};
      for (const key in r) {
        // normalize: lowercase, remove spaces and underscores
        const newKey = key.toLowerCase().replace(/\s|_/g, '');
        normalized[newKey] = r[key];
      }

      return {
        first_name: normalized.firstname || '',
        last_name: normalized.lastname || '',
        email: normalized.email || '',
        phone: normalized.phone || '',
        gst: normalized.gst || '',
        company: normalized.company || ''
      };
    });

    // 4️⃣ Save employees
    const result = await saveEmployees(formattedRows);

    return sendSuccess(res, 'Employees imported successfully', result);
  } catch (error) {
    return sendError(res, error.message);
  }
};
