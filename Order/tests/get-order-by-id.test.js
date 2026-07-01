const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

jest.mock("../src/models/order.model");

const app = require("../src/app");
const OrderModel = require("../src/models/order.model");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

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

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/orders/:id", () => {
  it("returns an order for the owner", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const orderId = new mongoose.Types.ObjectId().toString();
    const token = createToken({ userId });

    const mockOrder = {
      _id: orderId,
      user: userId,
      status: "pending",
      items: [],
      shippingAddress: {
        street: "123 Main Street",
        city: "Mumbai",
        state: "MH",
        zipCode: "400001",
        country: "India",
      },
    };

    OrderModel.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockOrder),
    });

    const response = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.order).toEqual(mockOrder);
    expect(OrderModel.findById).toHaveBeenCalledWith(orderId);
  });

  it("returns 404 when the order does not exist", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const orderId = new mongoose.Types.ObjectId().toString();
    const token = createToken({ userId });

    OrderModel.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const response = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Order not found" });
  });

  it("returns 403 when another user tries to access the order", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const orderId = new mongoose.Types.ObjectId().toString();
    const token = createToken({ userId });

    const mockOrder = {
      _id: orderId,
      user: new mongoose.Types.ObjectId().toString(),
      status: "pending",
    };

    OrderModel.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockOrder),
    });

    const response = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: "you are not authorized to view this order" });
  });
});
