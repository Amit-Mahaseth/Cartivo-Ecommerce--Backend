const request = require('supertest');
const app = require('../src/app');
const ProductModel = require('../src/models/product.model');
const { uploadImage } = require('../src/services/imagekit.service');
const {
  PRODUCT_BASE_PATH,
  productPayload,
  generateToken,
  createMockUser,
} = require('./helpers/product');

describe('POST /api/products - Create Product', () => {
  describe('Authentication & Authorization', () => {
    it('should reject request without token', async () => {
      const response = await request(app)
        .post(PRODUCT_BASE_PATH)
        .send(productPayload());

      expect(response.status).toBe(401);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.stringMatching(/unauthorized/i),
        })
      );
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .post(PRODUCT_BASE_PATH)
        .set('Authorization', 'Bearer invalid-token')
        .send(productPayload());

      expect(response.status).toBe(401);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.stringMatching(/unauthorized/i),
        })
      );
    });

    it('should allow seller to create product', async () => {
      const seller = createMockUser('seller');
      const token = generateToken(seller._id, 'seller');

      const response = await request(app)
        .post(PRODUCT_BASE_PATH)
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload());

      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.stringMatching(/product created successfully/i),
        })
      );
    });

    it('should allow admin to create product', async () => {
      const admin = createMockUser('admin');
      const token = generateToken(admin._id, 'admin');

      const response = await request(app)
        .post(PRODUCT_BASE_PATH)
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload());

      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.stringMatching(/product created successfully/i),
        })
      );
    });

    it('should reject user role from creating product', async () => {
      const user = createMockUser('user');
      const token = generateToken(user._id, 'user');

      const response = await request(app)
        .post(PRODUCT_BASE_PATH)
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload());

      expect(response.status).toBe(403);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.stringMatching(/forbidden/i),
        })
      );
    });

    it('should accept token from cookies', async () => {
      const seller = createMockUser('seller');
      const token = generateToken(seller._id, 'seller');

      const response = await request(app)
        .post(PRODUCT_BASE_PATH)
        .set('Cookie', `token=${token}`)
        .send(productPayload());

      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.stringMatching(/product created successfully/i),
        })
      );
    });
  });

  describe('Product Validation', () => {
    let sellerToken;

    beforeEach(() => {
      const seller = createMockUser('seller');
      sellerToken = generateToken(seller._id, 'seller');
    });

    it('should reject product without title', async () => {
      const payload = productPayload();
      delete payload.title;

      const response = await request(app)
        .post(PRODUCT_BASE_PATH)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.stringContaining('Title and priceAmount are required'),
        })
      );
    });

    it('should reject product without priceAmount', async () => {
      const payload = productPayload();
      delete payload.priceAmount;

      const response = await request(app)
        .post(PRODUCT_BASE_PATH)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.stringContaining('Title and priceAmount are required'),
        })
      );
    });

    it('should create product with minimal required fields', async () => {
      const payload = {
        title: 'Simple Product',
        priceAmount: 50,
      };

      const response = await request(app)
        .post(PRODUCT_BASE_PATH)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(
        expect.objectContaining({
          title: 'Simple Product',
          price: expect.objectContaining({
            amount: 50,
            currency: 'INR', // default currency
          }),
        })
      );
    });

    it('should create product with all fields', async () => {
      const payload = productPayload({
        priceAmount: 199.99,
        priceCurrency: 'USD',
      });

      const response = await request(app)
        .post(PRODUCT_BASE_PATH)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(
        expect.objectContaining({
          title: payload.title,
          description: payload.description,
          price: expect.objectContaining({
            amount: payload.priceAmount,
            currency: payload.priceCurrency,
          }),
        })
      );
    });
  });

  describe('Product Creation', () => {
    let sellerToken;
    let sellerId;

    beforeEach(() => {
      const seller = createMockUser('seller');
      sellerId = seller._id;
      sellerToken = generateToken(sellerId, 'seller');
    });

    it('should create product successfully and persist to database', async () => {
      const payload = productPayload();

      const response = await request(app)
        .post(PRODUCT_BASE_PATH)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(payload);

      expect(response.status).toBe(201);

      const savedProduct = await ProductModel.findById(response.body.data._id);
      expect(savedProduct).not.toBeNull();
      expect(savedProduct.title).toBe(payload.title);
      expect(savedProduct.description).toBe(payload.description);
      expect(savedProduct.price.amount).toBe(payload.priceAmount);
      expect(savedProduct.seller.toString()).toBe(sellerId.toString());
    });

    it('should set seller from authenticated user', async () => {
      const payload = productPayload();

      const response = await request(app)
        .post(PRODUCT_BASE_PATH)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.data.seller.toString()).toBe(sellerId.toString());
    });

    it('should use default currency (INR) when not provided', async () => {
      const payload = productPayload();
      delete payload.priceCurrency;

      const response = await request(app)
        .post(PRODUCT_BASE_PATH)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.data.price.currency).toBe('INR');
    });

    it('should return product data in response', async () => {
      const payload = productPayload();

      const response = await request(app)
        .post(PRODUCT_BASE_PATH)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: 'Product Created Successfully',
          data: expect.objectContaining({
            _id: expect.any(String),
            title: payload.title,
            description: payload.description,
            price: expect.objectContaining({
              amount: payload.priceAmount,
              currency: payload.priceCurrency,
            }),
            seller: expect.any(String),
            images: expect.any(Array),
          }),
        })
      );
    });

    it('should initialize images array as empty', async () => {
      const payload = productPayload();

      const response = await request(app)
        .post(PRODUCT_BASE_PATH)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.data.images).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    let sellerToken;

    beforeEach(() => {
      const seller = createMockUser('seller');
      sellerToken = generateToken(seller._id, 'seller');
    });

    it('should return 500 on internal server error', async () => {
      // Mock ProductModel.create to throw an error
      jest
        .spyOn(ProductModel, 'create')
        .mockRejectedValueOnce(new Error('Database error'));

      const payload = productPayload();

      const response = await request(app)
        .post(PRODUCT_BASE_PATH)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(payload);

      expect(response.status).toBe(500);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: 'internal server error',
        })
      );

      // Restore the mock
      ProductModel.create.mockRestore();
    });
  });

  describe('Mocking Database & External Services', () => {
    let sellerToken;

    beforeEach(() => {
      const seller = createMockUser('seller');
      sellerToken = generateToken(seller._id, 'seller');
    });

    it('should use mocked imagekit service without touching real API', async () => {
      const payload = productPayload();

      const response = await request(app)
        .post(PRODUCT_BASE_PATH)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(payload);

      expect(response.status).toBe(201);

      // Verify imagekit mock was not called (no files provided)
      expect(uploadImage).not.toHaveBeenCalled();
    });

    it('should not affect original database', async () => {
      const initialCount = await ProductModel.countDocuments();

      const payload = productPayload();

      await request(app)
        .post(PRODUCT_BASE_PATH)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(payload);

      // Product created in memory-only database, not original database
      expect(await ProductModel.countDocuments()).toBe(initialCount + 1);
    });
  });
});
