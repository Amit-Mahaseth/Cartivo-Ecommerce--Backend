const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

jest.mock("../src/models/order.model", () => ({
  findById: jest.fn(),
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

describe("PATCH /api/orders/:id/address", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates the shipping address for an order owned by the user", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const orderId = new mongoose.Types.ObjectId().toString();
    const token = createToken({ userId });

    const mockOrder = {
      _id: orderId,
      user: userId,
      status: "pending",
      shippingAddress: {
        street: "Old Street",
        city: "Mumbai",
        state: "MH",
        zipCode: "400001",
        country: "India",
      },
      save: jest.fn().mockResolvedValue(true),
    };

    OrderModel.findById.mockResolvedValue(mockOrder);

    const updatedAddress = {
      street: "New Street",
      city: "Pune",
      state: "MH",
      zipCode: "411001",
      country: "India",
    };

    const response = await request(app)
      .patch(`/api/orders/${orderId}/address`)
      .set("Authorization", `Bearer ${token}`)
      .send({ shippingAddress: updatedAddress });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Address updated successfully");
    expect(mockOrder.save).toHaveBeenCalledTimes(1);
    expect(mockOrder.shippingAddress).toMatchObject(updatedAddress);
    expect(OrderModel.findById).toHaveBeenCalledWith(orderId);
  });
});
