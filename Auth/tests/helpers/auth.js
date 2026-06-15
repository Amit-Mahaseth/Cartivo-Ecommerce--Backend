const bcrypt = require('bcrypt');

const User = require('../../src/models/user.model');

const AUTH_BASE_PATH = process.env.AUTH_BASE_PATH || '/api/auth';

const userPayload = (overrides = {}) => ({
  username: 'testuser',
  email: 'test@example.com',
  password: 'Password123',
  FullName: {
    firstName: 'Test',
    lastName: 'User',
  },
  phone: '9876543210',
  Address: [
    {
      street: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'Testland',
    },
  ],
  ...overrides,
});

const createUser = async (overrides = {}) => {
  const payload = userPayload(overrides);
  const hashedPassword = await bcrypt.hash(payload.password, 10);

  return User.create({
    ...payload,
    password: hashedPassword,
  });
};

module.exports = {
  AUTH_BASE_PATH,
  createUser,
  userPayload,
};
