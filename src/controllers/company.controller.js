
import Company from '../models/Company.model.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

export const createCompany = async (req, res) => {
  try {
    const company = await Company.create(req.body);
    return sendSuccess(res, 'Company created successfully', company, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find();
    return sendSuccess(res, 'Companies fetched successfully', companies, 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

