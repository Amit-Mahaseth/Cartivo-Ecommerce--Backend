const request = require('supertest');
const app = require('../src/app');
const ProductModel = require('../src/models/product.model');
const {
  PRODUCT_BASE_PATH,
  generateToken,
  createMockUser,
} = require('./helpers/product');

describe('DELETE /api/products/:id - Delete Product', () => {
  describe('Authentication & Authorization', () => {
    it('should reject request without token', async () => {
      const seller = createMockUser('seller');
      const product = await ProductModel.create({
        title: 'Test Product',
        description: 'Test Description',
        price: { amount: 100, currency: 'INR' },
        seller: seller._id,
        images: [],
      });

      const response = await request(app).delete(`${PRODUCT_BASE_PATH}/${product._id}`);

      expect(response.status).toBe(401);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.stringMatching(/unauthorized/i),
        })
      );
    });

    it('should reject request with invalid token', async () => {
      const seller = createMockUser('seller');
      const product = await ProductModel.create({
        title: 'Test Product',
        description: 'Test Description',
        price: { amount: 100, currency: 'INR' },
        seller: seller._id,
        images: [],
      });

      const response = await request(app)
        .delete(`${PRODUCT_BASE_PATH}/${product._id}`)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('Success Cases', () => {
    it('should allow seller to delete their own product', async () => {
      const seller = createMockUser('seller');
      const token = generateToken(seller._id, 'seller');

      const product = await ProductModel.create({
        title: 'Test Product',
        description: 'Test Description',
        price: { amount: 100, currency: 'INR' },
        seller: seller._id,
        images: [],
      });

      const response = await request(app)
        .delete(`${PRODUCT_BASE_PATH}/${product._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.stringMatching(/deleted|deleted successfully|removed/i),
        })
      );

      // Verify product is actually deleted
      const deletedProduct = await ProductModel.findById(product._id);
      expect(deletedProduct).toBeNull();
    });

    it('should allow admin to delete any product', async () => {
      const seller = createMockUser('seller');
      const admin = createMockUser('admin');
      const adminToken = generateToken(admin._id, 'admin');

      const product = await ProductModel.create({
        title: 'Test Product',
        description: 'Test Description',
        price: { amount: 100, currency: 'INR' },
        seller: seller._id,
        images: [],
      });

      const response = await request(app)
        .delete(`${PRODUCT_BASE_PATH}/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      // Verify product is deleted
      const deletedProduct = await ProductModel.findById(product._id);
      expect(deletedProduct).toBeNull();
    });
  });

  describe('Authorization Cases', () => {
    it('should reject non-seller/non-admin from deleting others product', async () => {
      const seller = createMockUser('seller');
      const otherSeller = createMockUser('seller');
      const otherToken = generateToken(otherSeller._id, 'seller');

      const product = await ProductModel.create({
        title: 'Test Product',
        description: 'Test Description',
        price: { amount: 100, currency: 'INR' },
        seller: seller._id,
        images: [],
      });

      const response = await request(app)
        .delete(`${PRODUCT_BASE_PATH}/${product._id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.stringMatching(/unauthorized|forbidden|not authorized/i),
        })
      );

      // Verify product still exists
      const existingProduct = await ProductModel.findById(product._id);
      expect(existingProduct).not.toBeNull();
    });

    it('should reject user role from deleting product', async () => {
      const seller = createMockUser('seller');
      const user = createMockUser('user');
      const userToken = generateToken(user._id, 'user');

      const product = await ProductModel.create({
        title: 'Test Product',
        description: 'Test Description',
        price: { amount: 100, currency: 'INR' },
        seller: seller._id,
        images: [],
      });

      const response = await request(app)
        .delete(`${PRODUCT_BASE_PATH}/${product._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent product', async () => {
      const seller = createMockUser('seller');
      const token = generateToken(seller._id, 'seller');
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`${PRODUCT_BASE_PATH}/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.stringMatching(/not found|product not found/i),
        })
      );
    });

    it('should return 400 for invalid product ID format', async () => {
      const seller = createMockUser('seller');
      const token = generateToken(seller._id, 'seller');
      const invalidId = 'invalid-id';

      const response = await request(app)
        .delete(`${PRODUCT_BASE_PATH}/${invalidId}`)
        .set('Authorization', `Bearer ${token}`);

      expect([400, 404]).toContain(response.status);
    });
  });
});
