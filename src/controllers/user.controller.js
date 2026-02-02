
import User from '../models/User.model.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

export const createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    return sendSuccess(res, 'User created successfully', user, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().populate('company', 'name gst');
    return sendSuccess(res, 'Users fetched successfully', users, 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

export const getUserEmails = async (req, res) => {
  try {
    
    const users = await User.find().select('_id email');

    return sendSuccess(res, 'User emails fetched successfully', users, 200);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};