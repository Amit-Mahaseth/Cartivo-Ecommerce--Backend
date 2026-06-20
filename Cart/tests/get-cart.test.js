const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const mockFindOne = jest.fn();
const mockCartSave = jest.fn();

jest.mock('../src/models/cart.model', () => {
  const CartModel = jest.fn(function (data) {
    return {
      user: data.user,
      items: data.items,
      save: mockCartSave,
    };
  });

  CartModel.findOne = mockFindOne;

  return CartModel;
});

const app = require('../src/app');
const CartModel = require('../src/models/cart.model');

const generateToken = (userId) => {
  return jwt.sign({ _id: userId, role: 'user' }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
};

describe('GET /api/cart', () => {
  let userId;
  let userToken;

beforeEach(() => {
  userId = new mongoose.Types.ObjectId();
  userToken = generateToken(userId);

  mockFindOne.mockReset();
  mockCartSave.mockReset();
});

  it('should reject request without token', async () => {
    const response = await request(app)
      .get('/api/cart');

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/unauthorized/i),
      })
    );
  });

  it('should reject request with invalid token', async () => {
    const response = await request(app)
      .get('/api/cart')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/unauthorized/i),
      })
    );
  });

  it('should return user cart when it exists', async () => {
    const cart = {
      _id: 'cart-id',
      user: userId.toString(),
      items: [
        {
          productId: new mongoose.Types.ObjectId().toString(),
          quantity: 2,
        },
        {
          productId: new mongoose.Types.ObjectId().toString(),
          quantity: 1,
        },
      ],
    };
    mockFindOne.mockResolvedValue(cart);

    const response = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/cart|success/i),
        data: expect.objectContaining({
          _id: expect.any(String),
          user: userId.toString(),
          items: expect.arrayContaining([
            expect.objectContaining({
              productId: expect.any(String),
              quantity: expect.any(Number),
            }),
          ]),
        }),
      })
    );

    expect(CartModel.findOne).toHaveBeenCalledWith({ user: userId.toString() });
    expect(CartModel.findOne).toHaveBeenCalledTimes(1);
  });

  it('should create and return an empty cart when user has no cart', async () => {
    mockFindOne.mockResolvedValue(null);
mockCartSave.mockResolvedValue();
    const response = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/cart|empty|not found/i),
        data: expect.objectContaining({
          items: expect.any(Array),
        }),
      })
    );

    expect(CartModel.findOne).toHaveBeenCalledWith({ user: userId.toString() });
    
    expect(CartModel.findOne).toHaveBeenCalledTimes(1);
      expect(CartModel).toHaveBeenCalledWith({
    user: userId.toString(),
    items: [],
  });
   expect(mockCartSave).toHaveBeenCalledTimes(1);
  });

  it('should return cart with correct user information', async () => {
    const productId = new mongoose.Types.ObjectId();
    const cart = {
      _id: new mongoose.Types.ObjectId(),
      user: userId.toString(),
      items: [
        {
          productId: productId.toString(),
          quantity: 5,
        },
      ],
    };
    mockFindOne.mockResolvedValue(cart);

    const response = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user).toBe(userId.toString());
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].productId).toBe(productId.toString());
    expect(response.body.data.items[0].quantity).toBe(5);

    expect(CartModel.findOne).toHaveBeenCalledWith({ user: userId.toString() });
  });
});
