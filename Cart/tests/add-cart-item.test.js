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

const CART_ITEM_PATH = '/api/cart/items';

const generateToken = (userId) => {
  return jwt.sign({ _id: userId, role: 'user' }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
};

const cartItemPayload = (overrides = {}) => ({
  productId: new mongoose.Types.ObjectId().toString(),
  quantity: 2,
  ...overrides,
});

describe('POST /api/cart/items', () => {
  let userId;
  let userToken;

  beforeEach(() => {
    userId = new mongoose.Types.ObjectId();
    userToken = generateToken(userId);
    mockCartSave.mockResolvedValue(undefined);
  });

  it('should reject request without token', async () => {
    const response = await request(app)
      .post(CART_ITEM_PATH)
      .send(cartItemPayload());

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/unauthorized/i),
      })
    );
  });

  it('should reject request with invalid token', async () => {
    const response = await request(app)
      .post(CART_ITEM_PATH)
      .set('Authorization', 'Bearer invalid-token')
      .send(cartItemPayload());

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/unauthorized/i),
      })
    );
  });

  it('should reject item without productId', async () => {
    const payload = cartItemPayload();
    delete payload.productId;

    const response = await request(app)
      .post(CART_ITEM_PATH)
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

 expect(response.status).toBe(400);
expect(response.body).toEqual(
  expect.objectContaining({
    errors: expect.arrayContaining([
      expect.objectContaining({
        msg: expect.stringMatching(/product id/i),
      }),
    ]),
  })

    );
  });

  it('should reject item with quantity less than one', async () => {
    const response = await request(app)
      .post(CART_ITEM_PATH)
      .set('Authorization', `Bearer ${userToken}`)
      .send(cartItemPayload({ quantity: 0 }));

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

  it('should add item to a new cart for authenticated user', async () => {
    const payload = cartItemPayload();
    mockFindOne.mockResolvedValue(null);

    const response = await request(app)
      .post(CART_ITEM_PATH)
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);


    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/cart|item/i),
        data: expect.objectContaining({
          _id: expect.any(String),
          user: userId.toString(),
          items: expect.arrayContaining([
            expect.objectContaining({
              productId: payload.productId,
              quantity: payload.quantity,
            }),
          ]),
        }),
      })
    );

    expect(CartModel.findOne).toHaveBeenCalledWith({ user: userId.toString() });
    expect(CartModel).toHaveBeenCalledWith({
      user: userId.toString(),
      items: []
    });
    expect(mockCartSave).toHaveBeenCalledTimes(1);
  });

  it('should increase quantity when item already exists in cart', async () => {
    const productId = new mongoose.Types.ObjectId();
    const cart = {
      _id: 'cart-id',
      user: userId,
      items: [{ productId, quantity: 1 }],
      save: mockCartSave,
    };
    mockFindOne.mockResolvedValue(cart);

    const response = await request(app)
      .post(CART_ITEM_PATH)
      .set('Cookie', `token=${userToken}`)
      .send({
        productId: productId.toString(),
        quantity: 3,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productId: productId.toString(),
          quantity: 4,
        }),
      ])
    );

    expect(CartModel.findOne).toHaveBeenCalledWith({ user: userId.toString() });
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(4);
    expect(mockCartSave).toHaveBeenCalledTimes(1);
  });
});
