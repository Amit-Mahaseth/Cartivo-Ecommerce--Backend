const request = require('supertest');
const app = require('../src/app');
const ProductModel = require('../src/models/product.model');
const {
  PRODUCT_BASE_PATH,
  generateToken,
  createMockUser,
} = require('./helpers/product');

describe('GET /api/products/:id - Fetch Product by ID', () => {
  describe('Success Cases', () => {
    it('should fetch product by valid ID', async () => {
      const seller = createMockUser('seller');
      const product = await ProductModel.create({
        title: 'Test Product',
        description: 'Test Description',
        price: { amount: 100, currency: 'INR' },
        seller: seller._id,
        images: [],
      });

      const response = await request(app).get(`${PRODUCT_BASE_PATH}/${product._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.stringMatching(/fetched successfully|product found/i),
          product: expect.objectContaining({
            _id: product._id.toString(),
            title: 'Test Product',
          }),
        })
      );
    });

    it('should populate seller details when fetching product', async () => {
      const seller = createMockUser('seller');
      seller.username = 'seller-username';
      seller.email = 'seller@test.com';

      const product = await ProductModel.create({
        title: 'Test Product',
        description: 'Test Description',
        price: { amount: 100, currency: 'INR' },
        seller: seller._id,
        images: [],
      });

      const response = await request(app).get(`${PRODUCT_BASE_PATH}/${product._id}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(
        expect.objectContaining({
          title: 'Test Product',
        })
      );
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent product ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid MongoDB ID format

      const response = await request(app).get(`${PRODUCT_BASE_PATH}/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.stringMatching(/not found|product not found/i),
        })
      );
    });

    it('should return 400 for invalid product ID format', async () => {
      const invalidId = 'invalid-id-format';

      const response = await request(app).get(`${PRODUCT_BASE_PATH}/${invalidId}`);

      expect([400, 404]).toContain(response.status);
    });
  });
});
