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

describe("PATCH /api/orders/:id/cancel", () => {
  it("cancels a pending order for the owner", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const orderId = new mongoose.Types.ObjectId().toString();
    const token = createToken({ userId });

    const saveMock = jest.fn().mockResolvedValue(true);
    OrderModel.findById.mockResolvedValue({
      _id: orderId,
      user: userId,
      status: "pending",
      save: saveMock,
    });

    const response = await request(app)
      .patch(`/api/orders/${orderId}/cancel`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Order cancelled successfully");
    expect(OrderModel.findById).toHaveBeenCalledWith(orderId);
    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  it("returns 404 when the order does not exist", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const orderId = new mongoose.Types.ObjectId().toString();
    const token = createToken({ userId });

    OrderModel.findById.mockResolvedValue(null);

    const response = await request(app)
      .patch(`/api/orders/${orderId}/cancel`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Order not found" });
  });
});
