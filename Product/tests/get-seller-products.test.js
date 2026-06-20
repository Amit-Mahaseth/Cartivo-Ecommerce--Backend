const request = require('supertest');
const app = require('../src/app');
const ProductModel = require('../src/models/product.model');
const {
  PRODUCT_BASE_PATH,
  generateToken,
  createMockUser,
} = require('./helpers/product');

describe('GET /api/products/seller - Fetch Seller Products', () => {
  describe('Authentication & Authorization', () => {
    it('should reject request without token', async () => {
      const response = await request(app).get(`${PRODUCT_BASE_PATH}/seller`);

      expect(response.status).toBe(401);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.stringMatching(/unauthorized/i),
        })
      );
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get(`${PRODUCT_BASE_PATH}/seller`)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.stringMatching(/unauthorized/i),
        })
      );
    });

    it('should reject user role from fetching seller products', async () => {
      const user = createMockUser('user');
      const token = generateToken(user._id, 'user');

      const response = await request(app)
        .get(`${PRODUCT_BASE_PATH}/seller`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.stringMatching(/forbidden/i),
        })
      );
    });
  });

  describe('Success Cases', () => {
    it('should fetch only products owned by authenticated seller', async () => {
      const seller = createMockUser('seller');
      const otherSeller = createMockUser('seller');
      const token = generateToken(seller._id, 'seller');

      await ProductModel.create({
        title: 'My Product 1',
        description: 'Seller owned product',
        price: { amount: 100, currency: 'INR' },
        seller: seller._id,
        images: [],
      });

      await ProductModel.create({
        title: 'My Product 2',
        description: 'Another seller owned product',
        price: { amount: 200, currency: 'INR' },
        seller: seller._id,
        images: [],
      });

      await ProductModel.create({
        title: 'Other Seller Product',
        description: 'Should not be returned',
        price: { amount: 300, currency: 'INR' },
        seller: otherSeller._id,
        images: [],
      });

      const response = await request(app)
        .get(`${PRODUCT_BASE_PATH}/seller`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.stringMatching(/seller products fetched successfully/i),
          data: expect.any(Array),
        })
      );
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.map((product) => product.title)).toEqual(
        expect.arrayContaining(['My Product 1', 'My Product 2'])
      );
      expect(response.body.data).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ title: 'Other Seller Product' }),
        ])
      );
    });

    it('should return empty array when seller has no products', async () => {
      const seller = createMockUser('seller');
      const token = generateToken(seller._id, 'seller');

      const response = await request(app)
        .get(`${PRODUCT_BASE_PATH}/seller`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('should fetch seller products with pagination using skip and limit', async () => {
      const seller = createMockUser('seller');
      const token = generateToken(seller._id, 'seller');

      for (let i = 0; i < 5; i++) {
        await ProductModel.create({
          title: `Seller Product ${i}`,
          description: `Description ${i}`,
          price: { amount: 100 + i, currency: 'INR' },
          seller: seller._id,
          images: [],
        });
      }

      const response = await request(app)
        .get(`${PRODUCT_BASE_PATH}/seller`)
        .query({ skip: 0, limit: 2 })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on internal server error', async () => {
      const seller = createMockUser('seller');
      const token = generateToken(seller._id, 'seller');

      jest
        .spyOn(ProductModel, 'find')
        .mockImplementationOnce(() => {
          throw new Error('Database error');
        });

      const response = await request(app)
        .get(`${PRODUCT_BASE_PATH}/seller`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: 'internal server error',
        })
      );

      ProductModel.find.mockRestore();
    });
  });
});
