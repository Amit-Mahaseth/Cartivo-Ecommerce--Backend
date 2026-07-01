const request = require('supertest');
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

jest.mock('../src/models/payment.model', () => ({
  findOne: jest.fn().mockResolvedValue({
    _id: 'payment123',
    razpayObjectId: 'order_test_123',
    status: 'pending',
    save: jest.fn().mockResolvedValue(true),
  }),
}));

jest.mock('axios');
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

describe('POST /api/payment/verify', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.RAZORPAY_KEY_SECRET = 'test-secret';
  });

  it('should verify payment signature successfully', async () => {
    const razorpayOrderId = 'order_test_123';
    const razorpayPaymentId = 'payment_test_456';
    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(payload)
      .digest('hex');

    const response = await request(app)
      .post('/api/payment/verify')
      .send({
        razorpayOrderId,
        razorpayPaymentId,
        signature,
      })
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/verified successfully/i),
      })
    );
  });
});
