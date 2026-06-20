const request = require('supertest');
const app = require('../src/app');
const ProductModel = require('../src/models/product.model');
const {
  PRODUCT_BASE_PATH,
  generateToken,
  createMockUser,
} = require('./helpers/product');

describe('PATCH /api/products/:id - Update Product', () => {
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

      const response = await request(app)
        .patch(`${PRODUCT_BASE_PATH}/${product._id}`)
        .send({ title: 'Updated Title' });

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
        .patch(`${PRODUCT_BASE_PATH}/${product._id}`)
        .set('Authorization', 'Bearer invalid-token')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(401);
    });
  });

  describe('Success Cases', () => {
    it('should allow seller to update their own product', async () => {
      const seller = createMockUser('seller');

      const token = generateToken(seller._id, 'seller');
      const product = await ProductModel.create({
        title: 'Original Title',
        description: 'Test Description',
        price: { amount: 100, currency: 'INR' },
        seller: seller._id,
        images: [],
      });

      const response = await request(app)
        .patch(`${PRODUCT_BASE_PATH}/${product._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.stringMatching(/updated|updated successfully/i),
          data: expect.objectContaining({
            title: 'Updated Title',
          }),
        })
      );
    });

    it('should allow admin to update any product', async () => {
      const seller = createMockUser('seller');
      const admin = createMockUser('admin');
      const adminToken = generateToken(admin._id, 'admin');

      const product = await ProductModel.create({
        title: 'Original Title',
        description: 'Test Description',
        price: { amount: 100, currency: 'INR' },
        seller: seller._id,
        images: [],
      });

      const response = await request(app)
        .patch(`${PRODUCT_BASE_PATH}/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated by Admin' });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated by Admin');
    });

    it('should update product description', async () => {
      const seller = createMockUser('seller');
      const token = generateToken(seller._id, 'seller');

      const product = await ProductModel.create({
        title: 'Test Product',
        description: 'Original Description',
        price: { amount: 100, currency: 'INR' },
        seller: seller._id,
        images: [],
      });

      const response = await request(app)
        .patch(`${PRODUCT_BASE_PATH}/${product._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Updated Description' });

      expect(response.status).toBe(200);
      expect(response.body.data.description).toBe('Updated Description');
    });

    it('should update product price', async () => {
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
        .patch(`${PRODUCT_BASE_PATH}/${product._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ priceAmount: 150 });

      expect(response.status).toBe(200);
      expect(response.body.data.price.amount).toBe(150);
    });

    it('should update multiple fields at once', async () => {
      const seller = createMockUser('seller');
      const token = generateToken(seller._id, 'seller');

      const product = await ProductModel.create({
        title: 'Original Title',
        description: 'Original Description',
        price: { amount: 100, currency: 'INR' },
        seller: seller._id,
        images: [],
      });

      const response = await request(app)
        .patch(`${PRODUCT_BASE_PATH}/${product._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Title',
          description: 'New Description',
          priceAmount: 250,
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(
        expect.objectContaining({
          title: 'New Title',
          description: 'New Description',
          price: expect.objectContaining({ amount: 250 }),
        })
      );
    });
  });

  describe('Authorization Cases', () => {
    it('should reject non-seller/non-admin from updating others product', async () => {
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
        .patch(`${PRODUCT_BASE_PATH}/${product._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Unauthorized Update' });

      expect(response.status).toBe(403);
      expect(response.body).toEqual(
        expect.objectContaining({
          message: expect.stringMatching(/unauthorized|forbidden|not authorized/i),
        })
      );
    });

    it('should reject user role from updating product', async () => {
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
        .patch(`${PRODUCT_BASE_PATH}/${product._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Updated' });

      expect(response.status).toBe(403);
    });
  });

  describe('Error Cases', () => {
    it('should return 404 for non-existent product', async () => {
      const seller = createMockUser('seller');
      const token = generateToken(seller._id, 'seller');
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .patch(`${PRODUCT_BASE_PATH}/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' });

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
        .patch(`${PRODUCT_BASE_PATH}/${invalidId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' });

      expect([400, 404]).toContain(response.status);
    });
  });
});
