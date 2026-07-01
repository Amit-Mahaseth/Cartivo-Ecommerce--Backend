const request = require('supertest');
const axios = require('axios');
const crypto = require('crypto');

jest.mock('../src/middlewares/auth.middlewares', () =>
  jest.fn(() => (req, res, next) => {
    req.user = {
      userId: 'test-user-id',
      role: 'user',
    };
    next();
  })
);

jest.mock('axios');

jest.mock('../src/models/payment.model', () => ({
  create: jest.fn().mockResolvedValue({
    _id: 'payment123',
    status: 'pending',
    price: {
      amount: 50000,
      currency: 'INR',
    },
  }),
  findOne: jest.fn().mockResolvedValue({
    _id: 'payment123',
    razpayObjectId: 'order_test_123',
    status: 'pending',
    save: jest.fn().mockResolvedValue(true),
  }),
}));

jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => ({
    orders: {
      create: jest.fn().mockResolvedValue({
        id: 'order_test_123',
        amount: 50000,
        currency: 'INR',
      }),
    },
  }));
});

const app = require('../src/app');
describe('POST /api/payment/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.RAZORPAY_KEY_ID = 'test-key';
    process.env.RAZORPAY_KEY_SECRET = 'test-secret';
  });

  it('should create a payment for a valid order id', async () => {
  axios.post.mockResolvedValue({
  data: {
    success: true,
    order: {
      _id: '64f1c2d3e4f567890abc1234',
      totalAmount: 500,
    },
  },
});

    const response = await request(app)
      .post('/api/payment/6a3fa6961f901d7f0b2ce317')
      .set('Authorization', 'Bearer test-token');

    console.log(response.status);
    console.log(response.body);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/payment/i),
      })
    );
  });
});