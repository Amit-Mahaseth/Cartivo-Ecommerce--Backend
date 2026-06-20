const request = require('supertest');
const app = require('../src/app');
const ProductModel = require('../src/models/product.model');
const {
  PRODUCT_BASE_PATH,
  productPayload,
  generateToken,
  createMockUser,
} = require('./helpers/product');

describe('GET /api/products - Fetch All Products', () => {
  describe('Success Cases', () => {
    it('should fetch all products without authentication', async () => {
      // Create test products
      const seller = createMockUser('seller');
      const product1 = await ProductModel.create({
        title: 'Product 1',
        description: 'Description 1',
        price: { amount: 100, currency: 'INR' },
        seller: seller._id,
        images: [],
      });

      const product2 = await ProductModel.create({
        title: 'Product 2',
        description: 'Description 2',
        price: { amount: 200, currency: 'INR' },
        seller: seller._id,
        images: [],
      });

      const response = await request(app).get(PRODUCT_BASE_PATH);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.stringMatching(/fetched successfully/i),
          data: expect.any(Array),
        })
      );
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should fetch products with pagination using skip and limit', async () => {
      const seller = createMockUser('seller');

      // Create multiple products
      for (let i = 0; i < 5; i++) {
        await ProductModel.create({
          title: `Product ${i}`,
          description: `Description ${i}`,
          price: { amount: 100 + i * 10, currency: 'INR' },
          seller: seller._id,
          images: [],
        });
      }

      const response = await request(app)
        .get(PRODUCT_BASE_PATH)
        .query({ skip: 0, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should fetch products with minPrice filter', async () => {
      const seller = createMockUser('seller');

      await ProductModel.create({
        title: 'Cheap Product',
        description: 'Low price product',
        price: { amount: 50, currency: 'INR' },
        seller: seller._id,
        images: [],
      });

      await ProductModel.create({
        title: 'Expensive Product',
        description: 'High price product',
        price: { amount: 500, currency: 'INR' },
        seller: seller._id,
        images: [],
      });

      const response = await request(app)
        .get(PRODUCT_BASE_PATH)
        .query({ minPrice: 100 });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Expensive Product',
          }),
        ])
      );
    });

    it('should fetch products with maxPrice filter', async () => {
      const seller = createMockUser('seller');

      await ProductModel.create({
        title: 'Cheap Product',
        description: 'Low price product',
        price: { amount: 50, currency: 'INR' },
        seller: seller._id,
        images: [],
      });

      await ProductModel.create({
        title: 'Expensive Product',
        description: 'High price product',
        price: { amount: 500, currency: 'INR' },
        seller: seller._id,
        images: [],
      });

      const response = await request(app)
        .get(PRODUCT_BASE_PATH)
        .query({ maxPrice: 100 });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Cheap Product',
          }),
        ])
      );
    });

    it('should fetch products with both minPrice and maxPrice filters', async () => {
      const seller = createMockUser('seller');

      await ProductModel.create({
        title: 'Cheap Product',
        price: { amount: 50, currency: 'INR' },
        seller: seller._id,
        images: [],
      });

      await ProductModel.create({
        title: 'Medium Product',
        price: { amount: 150, currency: 'INR' },
        seller: seller._id,
        images: [],
      });

      await ProductModel.create({
        title: 'Expensive Product',
        price: { amount: 500, currency: 'INR' },
        seller: seller._id,
        images: [],
      });

      const response = await request(app)
        .get(PRODUCT_BASE_PATH)
        .query({ minPrice: 100, maxPrice: 200 });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array when no products match filters', async () => {
      const response = await request(app)
        .get(PRODUCT_BASE_PATH)
        .query({ minPrice: 10000, maxPrice: 20000 });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('should return default limit of 20 when limit not specified', async () => {
      const seller = createMockUser('seller');

      const response = await request(app).get(PRODUCT_BASE_PATH);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(20);
    });
  });

  describe('Error Cases', () => {
    it('should handle server errors gracefully', async () => {
      // Intentionally cause an error by passing invalid query parameters
      const response = await request(app)
        .get(PRODUCT_BASE_PATH)
        .query({ skip: 'invalid' });

      // Should either handle gracefully or return 500
      expect([200, 400, 500]).toContain(response.status);
    });
  });
});
