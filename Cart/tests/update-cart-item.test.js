const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const mockCartSave = jest.fn();
const mockFindOne = jest.fn();

jest.mock('../src/models/cart.model', () => {
  const CartModel = jest.fn(function CartModel(data) {
    return {
      _id: 'cart-id',
      user: data.user,
      items: [...data.items],
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

describe('PATCH /api/cart/items/:productId', () => {
  let userId;
  let userToken;
  let productId;

  beforeEach(() => {
    userId = new mongoose.Types.ObjectId();
    userToken = generateToken(userId);
    productId = new mongoose.Types.ObjectId();
    mockCartSave.mockResolvedValue(undefined);
  });

  it('should reject request without token', async () => {
    const response = await request(app)
      .patch(`/api/cart/items/${productId}`)
      .send({ quantity: 5 });

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/unauthorized/i),
      })
    );
  });

  it('should reject request with invalid token', async () => {
    const response = await request(app)
      .patch(`/api/cart/items/${productId}`)
      .set('Authorization', 'Bearer invalid-token')
      .send({ quantity: 5 });

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/unauthorized/i),
      })
    );
  });

  it('should reject if quantity is less than one', async () => {
    const response = await request(app)
      .patch(`/api/cart/items/${productId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 0 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringMatching(/quantity/i),
          }),
        ]),
      })
    );
  });

  it('should reject if product not found in cart', async () => {
    const cart = {
      _id: 'cart-id',
      user: userId,
      items: [],
      save: mockCartSave,
    };
    mockFindOne.mockResolvedValue(cart);

    const response = await request(app)
      .patch(`/api/cart/items/${productId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 5 });

    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/product|not found|cart/i),
      })
    );
  });

  it('should update quantity when item exists in cart', async () => {
    const cart = {
      _id: 'cart-id',
      user: userId,
      items: [{ productId: productId.toString(), quantity: 2 }],
      save: mockCartSave,
    };
    mockFindOne.mockResolvedValue(cart);

    const response = await request(app)
      .patch(`/api/cart/items/${productId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 5 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/updated|modified/i),
        data: expect.objectContaining({
          _id: expect.any(String),
          user: userId.toString(),
          items: expect.arrayContaining([
            expect.objectContaining({
              productId: productId.toString(),
              quantity: 5,
            }),
          ]),
        }),
      })
    );

    expect(CartModel.findOne).toHaveBeenCalledWith({ user: userId.toString() });
    expect(mockCartSave).toHaveBeenCalledTimes(1);
  });
});
