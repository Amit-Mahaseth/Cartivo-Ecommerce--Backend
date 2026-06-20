const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const PRODUCT_BASE_PATH = process.env.PRODUCT_BASE_PATH || '/api/products';

const productPayload = (overrides = {}) => ({
  title: 'Test Product',
  description: 'This is a test product',
  priceAmount: 99.99,
  priceCurrency: 'INR',
  ...overrides,
});

const generateToken = (userId, role = 'seller') => {
  const payload = {
    _id: userId,
    role: role,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
};

const createMockUser = (role = 'seller') => {
  return {
    _id: new mongoose.Types.ObjectId(),
    role: role,
    username: `${role}-user`,
    email: `${role}@test.com`,
  };
};

module.exports = {
  PRODUCT_BASE_PATH,
  productPayload,
  generateToken,
  createMockUser,
};
