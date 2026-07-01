const request = require("supertest");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const mongoose = require("mongoose");

jest.mock("axios");
jest.mock("../src/models/order.model", () => ({
  create: jest.fn(),
}));

const app = require("../src/app");
const OrderModel = require("../src/models/order.model");

const createToken = (overrides = {}) =>
  jwt.sign(
    {
      userId: new mongoose.Types.ObjectId().toString(),
      role: "user",
      ...overrides,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

const createId = () => new mongoose.Types.ObjectId().toString();

const shippingAddress = {
  street: "123 Main Street",
  city: "Mumbai",
  state: "MH",
  zipCode: "400001",
  country: "India",
};

let consoleErrorSpy;

beforeEach(() => {
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

const mockCartAndProducts = ({ cartItems, products }) => {
  axios.get.mockImplementation((url) => {
    if (url === "http://localhost:3002/api/cart") {
      return Promise.resolve({
        data: {
          cart: {
            items: cartItems,
          },
        },
      });
    }

    const product = products.find((item) =>
      url === `http://localhost:3001/api/products/${item._id}`
    );

    if (product) {
      return Promise.resolve({
        data: {
          data: product,
        },
      });
    }

    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });
};

describe("POST /api/orders", () => {
  it("creates an order from cart items and does not touch the real database", async () => {
    const userId = createId();
    const productId = createId();
    const token = createToken({ userId });

    mockCartAndProducts({
      cartItems: [{ productId, quantity: 2 }],
      products: [
        {
          _id: productId,
          title: "Rice Bag",
          stock: 10,
          price: {
            amount: 150,
            currency: "INR",
          },
        },
      ],
    });

    OrderModel.create.mockResolvedValue({
      _id: createId(),
      user: userId,
      items: [{ product: productId, quantity: 2 }],
      price: { amount: 300, currency: "INR" },
      totalAmount: 300,
      shippingAddress,
      status: "Pending",
    });

    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingAddress });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Order created successfully");
    expect(OrderModel.create).toHaveBeenCalledTimes(1);
    expect(OrderModel.create).toHaveBeenCalledWith({
      user: userId,
      items: [{ product: productId, quantity: 2 }],
      shippingAddress,
      price: {
        amount: 300,
        currency: "INR",
      },
      totalAmount: 300,
    });
  });

  it("calculates total amount for multiple cart items", async () => {
    const userId = createId();
    const productIdOne = createId();
    const productIdTwo = createId();
    const token = createToken({ userId });

    mockCartAndProducts({
      cartItems: [
        { productId: productIdOne, quantity: 2 },
        { productId: productIdTwo, quantity: 3 },
      ],
      products: [
        {
          _id: productIdOne,
          title: "Rice Bag",
          stock: 10,
          price: { amount: 150, currency: "INR" },
        },
        {
          _id: productIdTwo,
          title: "Milk Pack",
          stock: 10,
          price: { amount: 40, currency: "INR" },
        },
      ],
    });

    OrderModel.create.mockResolvedValue({
      _id: createId(),
      user: userId,
      items: [
        { product: productIdOne, quantity: 2 },
        { product: productIdTwo, quantity: 3 },
      ],
      price: { amount: 420, currency: "INR" },
      totalAmount: 420,
      shippingAddress,
      status: "Pending",
    });

    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingAddress });

    expect(response.status).toBe(201);
    expect(OrderModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          { product: productIdOne, quantity: 2 },
          { product: productIdTwo, quantity: 3 },
        ],
        price: { amount: 420, currency: "INR" },
        totalAmount: 420,
      })
    );
  });

  it("rejects request without token", async () => {
    const response = await request(app)
      .post("/api/orders")
      .send({ shippingAddress });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Unauthorized" });
    expect(axios.get).not.toHaveBeenCalled();
    expect(OrderModel.create).not.toHaveBeenCalled();
  });

  it("rejects non-user roles", async () => {
    const token = createToken({ role: "seller" });

    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingAddress });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: "Forbidden" });
    expect(axios.get).not.toHaveBeenCalled();
    expect(OrderModel.create).not.toHaveBeenCalled();
  });

  it("rejects request when shipping address is incomplete", async () => {
    const token = createToken();
    const invalidAddress = {
      street: "123 Main Street",
      city: "Mumbai",
      state: "MH",
      country: "India",
    };

    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingAddress: invalidAddress });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ msg: "Zip Code is required" }),
      ])
    );
    expect(axios.get).not.toHaveBeenCalled();
    expect(OrderModel.create).not.toHaveBeenCalled();
  });

  it("rejects an empty cart", async () => {
    const token = createToken();

    mockCartAndProducts({
      cartItems: [],
      products: [],
    });

    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingAddress });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Cart is empty" });
    expect(OrderModel.create).not.toHaveBeenCalled();
  });

  it("does not create an order when a cart product cannot be fetched", async () => {
    const productId = createId();
    const token = createToken();

    mockCartAndProducts({
      cartItems: [{ productId, quantity: 1 }],
      products: [],
    });

    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingAddress });

    expect(response.status).toBe(500);
    expect(response.body.message).toContain("Unexpected URL");
    expect(OrderModel.create).not.toHaveBeenCalled();
  });

  it("does not create an order when product stock is insufficient", async () => {
    const productId = createId();
    const token = createToken();

    mockCartAndProducts({
      cartItems: [{ productId, quantity: 5 }],
      products: [
        {
          _id: productId,
          title: "Sugar Pack",
          stock: 2,
          price: { amount: 60, currency: "INR" },
        },
      ],
    });

    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingAddress });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "Product Sugar Pack is out of stock",
    });
    expect(OrderModel.create).not.toHaveBeenCalled();
  });

  it("returns error response when order persistence fails", async () => {
    const productId = createId();
    const token = createToken();

    mockCartAndProducts({
      cartItems: [{ productId, quantity: 1 }],
      products: [
        {
          _id: productId,
          title: "Oil Bottle",
          stock: 5,
          price: { amount: 120, currency: "INR" },
        },
      ],
    });

    OrderModel.create.mockRejectedValue(new Error("Database unavailable"));

    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingAddress });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database unavailable" });
  });
});
