const mongoose = require('mongoose');

/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid ObjectId, false otherwise
 */
const isValidObjectId = (id) => {
  if (!id) return false;
  if (typeof id !== 'string') return false;
  return mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Converts a value to ObjectId if valid, otherwise returns null
 * @param {string|ObjectId} id - The ID to convert
 * @returns {ObjectId|null} - ObjectId if valid, null otherwise
 */
const toObjectId = (id) => {
  try {
    if (mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    }
    return null;
  } catch (error) {
    console.error('Error converting to ObjectId:', error);
    return null;
  }
};

/**
 * Sanitizes an array of IDs, removing invalid ObjectIds
 * @param {Array} ids - Array of IDs to sanitize
 * @returns {Array} - Array of valid ObjectIds
 */
const sanitizeObjectIdArray = (ids) => {
  if (!Array.isArray(ids)) return [];
  return ids
    .map(id => toObjectId(id))
    .filter(id => id !== null);
};

/**
 * Middleware to validate ObjectId parameters
 * @param {string} paramName - Name of the parameter to validate
 * @returns {Function} - Express middleware function
 */
const validateObjectIdParam = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!isValidObjectId(id)) {
      return res.status(400).json({ 
        message: `Invalid ${paramName} format`,
        error: 'INVALID_OBJECT_ID'
      });
    }
    next();
  };
};

module.exports = {
  isValidObjectId,
  toObjectId,
  sanitizeObjectIdArray,
  validateObjectIdParam
};