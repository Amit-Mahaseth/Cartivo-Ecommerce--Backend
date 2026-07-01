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

const createId = () => new mongoose.Types.ObjectId().toString();

const mockOrderData = {
  _id: createId(),
  user: createId(),
  items: [
    {
      product: {
        _id: createId(),
        title: "Rice Bag 10kg",
        price: { amount: 500, currency: "INR" },
      },
      quantity: 2,
    },
  ],
  shippingAddress: {
    street: "123 Main Street",
    city: "Mumbai",
    state: "MH",
    zipCode: "400001",
    country: "India",
  },
  price: { amount: 1000, currency: "INR" },
  totalAmount: 1000,
  status: "pending",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

let consoleErrorSpy;

beforeEach(() => {
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
  jest.clearAllMocks();
});


function mockPaginatedOrders(mockOrders) {
  const limitMock = jest.fn().mockResolvedValue(mockOrders);

  const skipMock = jest.fn().mockReturnValue({
    limit: limitMock,
  });

  const populateMock = jest.fn().mockReturnValue({
    skip: skipMock,
  });

  OrderModel.find.mockReturnValue({
    populate: populateMock,
  });

  OrderModel.countDocuments.mockResolvedValue(mockOrders.length);

  return { populateMock, skipMock, limitMock };
}
describe("GET /api/orders/me", () => {
  describe("Success Cases", () => {
    it("should return user's orders with populated product details", async () => {
      const userId = createId();
      const token = createToken({ userId });

      const mockOrders = [
        {
          ...mockOrderData,
          user: userId,
          _id: createId(),
        },
      ];
mockPaginatedOrders(mockOrders);
      const response = await request(app)
        .get("/api/orders/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({ orders: mockOrders ,
        meta:{
total:mockOrders.length,
page:1,
limit:10
        }
      });
      expect(OrderModel.find).toHaveBeenCalledWith({ user: userId });
    });

    it("should return multiple orders for a user", async () => {
      const userId = createId();
      const token = createToken({ userId });

      const mockOrders = [
        {
          ...mockOrderData,
          user: userId,
          _id: createId(),
          status: "pending",
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: new Date().toISOString(),
        },
        {
          ...mockOrderData,
          user: userId,
          _id: createId(),
          items: [
            {
              product: {
                _id: createId(),
                title: "Wheat Flour 5kg",
                price: { amount: 300, currency: "INR" },
              },
              quantity: 1,
            },
          ],
          totalAmount: 300,
          price: { amount: 300, currency: "INR" },
          status: "delivered",
          createdAt: "2025-01-15T00:00:00.000Z",
          updatedAt: new Date().toISOString(),
        },
        {
          ...mockOrderData,
          user: userId,
          _id: createId(),
          status: "shipped",
          createdAt: "2025-02-01T00:00:00.000Z",
          updatedAt: new Date().toISOString(),
        },
      ];
mockPaginatedOrders(mockOrders);
      const response = await request(app)
        .get("/api/orders/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.orders).toHaveLength(3);
      expect(response.body.orders[0].status).toBe("pending");
      expect(response.body.orders[1].status).toBe("delivered");
      expect(response.body.orders[2].status).toBe("shipped");
      expect(OrderModel.find).toHaveBeenCalledWith({ user: userId });
    });

    it("should return empty array when user has no orders",async () => {
      const userId = createId();
      const token = createToken({ userId });

    mockPaginatedOrders([]);

      const response = await request(app)
        .get("/api/orders/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body).toEqual({ message: "No orders found" });
      expect(OrderModel.find).toHaveBeenCalledWith({ user: userId });
    });

    it("should return orders with multiple items", async () => {
      const userId = createId();
      const token = createToken({ userId });

      const mockOrders = [
        {
          ...mockOrderData,
          user: userId,
          items: [
            {
              product: {
                _id: createId(),
                title: "Rice Bag",
                price: { amount: 500, currency: "INR" },
              },
              quantity: 2,
            },
            {
              product: {
                _id: createId(),
                title: "Wheat Flour",
                price: { amount: 300, currency: "INR" },
              },
              quantity: 1,
            },
            {
              product: {
                _id: createId(),
                title: "Cooking Oil",
                price: { amount: 250, currency: "INR" },
              },
              quantity: 3,
            },
          ],
          totalAmount: 2300,
          price: { amount: 2300, currency: "INR" },
        },
      ];
mockPaginatedOrders(mockOrders);
      const response = await request(app)
        .get("/api/orders/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.orders[0].items).toHaveLength(3);
      expect(response.body.orders[0].totalAmount).toBe(2300);
    });
  });

  describe("Authentication & Authorization", () => {
    it("should return 401 when no token is provided", async () => {
      const response = await request(app)
        .get("/api/orders/me")
        .expect(401);

      expect(response.body).toHaveProperty("message");
      expect(OrderModel.find).not.toHaveBeenCalled();
    });

    it("should return 401 when invalid token is provided", async () => {
      const response = await request(app)
        .get("/api/orders/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body).toHaveProperty("message");
      expect(OrderModel.find).not.toHaveBeenCalled();
    });

    it("should return 401 when token is expired", async () => {
      const expiredToken = jwt.sign(
        {
          userId: createId(),
          role: "user",
        },
        process.env.JWT_SECRET,
        { expiresIn: "-1h" }
      );

      const response = await request(app)
        .get("/api/orders/me")
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty("message");
      expect(OrderModel.find).not.toHaveBeenCalled();
    });

    it("should return 403 when user role is not 'user'", async () => {
      const adminToken = createToken({ role: "admin" });

      const response = await request(app)
        .get("/api/orders/me")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(403);

      expect(response.body).toHaveProperty("message");
      expect(OrderModel.find).not.toHaveBeenCalled();
    });

    it("should accept Bearer token from Authorization header", async () => {
      const userId = createId();
      const token = createToken({ userId });

      const mockOrders = [mockOrderData];
mockPaginatedOrders(mockOrders);
      const response = await request(app)
        .get("/api/orders/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.orders).toHaveLength(1);
      expect(response.body).toHaveProperty("orders");
    });
  });

  describe("Error Handling", () => {
    it("should return 500 when database query fails", async () => {
      const userId = createId();
      const token = createToken({ userId });

const populateMock = jest.fn().mockReturnValue({
  skip: jest.fn().mockReturnValue({
    limit: jest.fn().mockRejectedValue(
      new Error("Database connection failed")
    ),
  }),
});

OrderModel.find.mockReturnValue({
  populate: populateMock,
});
      const response = await request(app)
        .get("/api/orders/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should handle MongoDB ObjectId parsing error", async () => {
      const token = createToken({ userId: "invalid-id" });

const populateMock = jest.fn().mockReturnValue({
  skip: jest.fn().mockReturnValue({
    limit: jest.fn().mockRejectedValue(
      new Error("Invalid ObjectId")
    ),
  }),
});

OrderModel.find.mockReturnValue({
  populate: populateMock,
});

      const response = await request(app)
        .get("/api/orders/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(500);
    });
  });

  describe("Response Format & Data Integrity", () => {
    it("should return order with correct structure", async () => {
      const userId = createId();
      const token = createToken({ userId });

      const mockOrders = [mockOrderData];
mockPaginatedOrders(mockOrders);
      const response = await request(app)
        .get("/api/orders/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.orders[0]).toHaveProperty("_id");
      expect(response.body.orders[0]).toHaveProperty("user");
      expect(response.body.orders[0]).toHaveProperty("items");
      expect(response.body.orders[0]).toHaveProperty("shippingAddress");
      expect(response.body.orders[0]).toHaveProperty("price");
      expect(response.body.orders[0]).toHaveProperty("totalAmount");
      expect(response.body.orders[0]).toHaveProperty("status");
      expect(response.body.orders[0]).toHaveProperty("createdAt");
      expect(response.body.orders[0]).toHaveProperty("updatedAt");
    });

    it("should return correct shipping address structure", async () => {
      const userId = createId();
      const token = createToken({ userId });

      const mockOrders = [mockOrderData];
mockPaginatedOrders(mockOrders);
      const response = await request(app)
        .get("/api/orders/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      const address = response.body.orders[0].shippingAddress;
      expect(address).toHaveProperty("street");
      expect(address).toHaveProperty("city");
      expect(address).toHaveProperty("state");
      expect(address).toHaveProperty("zipCode");
      expect(address).toHaveProperty("country");
    });

    it("should return correct item structure with populated product", async () => {
      const userId = createId();
      const token = createToken({ userId });

      const mockOrders = [mockOrderData];
mockPaginatedOrders(mockOrders);
      const response = await request(app)
        .get("/api/orders/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      const item = response.body.orders[0].items[0];
      expect(item).toHaveProperty("product");
      expect(item).toHaveProperty("quantity");
      expect(item.product).toHaveProperty("_id");
      expect(item.product).toHaveProperty("title");
      expect(item.product).toHaveProperty("price");
    });

    it("should return correct price structure with currency", async () => {
      const userId = createId();
      const token = createToken({ userId });

      const mockOrders = [mockOrderData];
mockPaginatedOrders(mockOrders);
      const response = await request(app)
        .get("/api/orders/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      const price = response.body.orders[0].price;
      expect(price).toHaveProperty("amount");
      expect(price).toHaveProperty("currency");
      expect(price.currency).toBe("INR");
    });

    it("should return valid order statuses", async () => {
      const userId = createId();
      const token = createToken({ userId });
      const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

      const mockOrders = validStatuses.map((status) => ({
        ...mockOrderData,
        user: userId,
        _id: createId(),
        status,
      }));
mockPaginatedOrders(mockOrders);
      const response = await request(app)
        .get("/api/orders/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      response.body.orders.forEach((order) => {
        expect(validStatuses).toContain(order.status);
      });
    });
  });

  describe("Query Isolation", () => {
    it("should only return orders for the authenticated user", async () => {
      const userId1 = createId();
      const userId2 = createId();
      const token1 = createToken({ userId: userId1 });

      const mockOrders = [
        { ...mockOrderData, user: userId1, _id: createId() },
      ];
mockPaginatedOrders(mockOrders);
      await request(app)
        .get("/api/orders/me")
        .set("Authorization", `Bearer ${token1}`)
        .expect(200);

      // Verify the find was called with correct userId
      expect(OrderModel.find).toHaveBeenCalledWith({ user: userId1 });
      expect(OrderModel.find).not.toHaveBeenCalledWith({ user: userId2 });
    });

it("should call populate with correct path", async () => {
  const userId = createId();
  const token = createToken({ userId });
const limitMock = jest.fn().mockResolvedValue([mockOrderData]);
const skipMock = jest.fn().mockReturnValue({
  limit: limitMock,
});
const populateMock = jest.fn().mockReturnValue({
  skip: skipMock,
});

OrderModel.find.mockReturnValue({
  populate: populateMock,
});

OrderModel.countDocuments.mockResolvedValue(1);

await request(app)
  .get("/api/orders/me")
  .set("Authorization", `Bearer ${token}`)
  .expect(200);

expect(populateMock).toHaveBeenCalledWith("items.product");
});
  });
});
