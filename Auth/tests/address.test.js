    const request = require('supertest');
    const jwt = require('jsonwebtoken');

    const app = require('../src/app');
    const { AUTH_BASE_PATH, createUser, userPayload } = require('./helpers/auth');
    const UserModel = require('../src/models/user.model');
    describe('Address Routes', () => {
      let authToken;
      let userId;
      let user;

      beforeEach(async () => {
        // Create a test user
        user = await createUser();
        userId = user._id.toString();

        // Generate a valid auth token
        authToken = jwt.sign(
          {
            userId: user._id,
            email: user.email,
            role: user.role,
            username: user.username,
          },
          process.env.JWT_SECRET,
          { expiresIn: '1d' }
        );
      });

      describe('POST /user/me/addresses', () => {
        it('should add a new address successfully', async () => {
          const response = await request(app)
            .post(`${AUTH_BASE_PATH}/user/me/addresses`)
            .set('Authorization', `Bearer ${authToken}`)
            .set('Cookie', `token=${authToken}`)
            .send({
              street: '456 New Street',
              city: 'New City',
              state: 'NS',
              zipCode: '54321',
              country: 'New Country',
            });

          expect(response.status).toBe(200);
          expect(response.body).toEqual(
            expect.objectContaining({
              message: 'Address added successfully',
              Address: expect.any(Array),
            })
          );
          expect(response.body.Address.length).toBeGreaterThan(0);
          expect(response.body.Address[response.body.Address.length - 1]).toEqual(
            expect.objectContaining({
              street: '456 New Street',
              city: 'New City',
              state: 'NS',
              zipCode: '54321',
              country: 'New Country',
            })
          );
        });

        it('should add multiple addresses to the same user', async () => {
          // Add first address
          await request(app)
            .post(`${AUTH_BASE_PATH}/user/me/addresses`)
            .set('Authorization', `Bearer ${authToken}`)
            .set('Cookie', `token=${authToken}`)
            .send({
              street: '111 First Ave',
              city: 'City One',
              state: 'C1',
              zipCode: '11111',
              country: 'Country One',
            });

          // Add second address
          const response = await request(app)
            .post(`${AUTH_BASE_PATH}/user/me/addresses`)
            .set('Authorization', `Bearer ${authToken}`)
            .set('Cookie', `token=${authToken}`)
            .send({
              street: '222 Second Ave',
              city: 'City Two',
              state: 'C2',
              zipCode: '22222',
              country: 'Country Two',
            });

          expect(response.status).toBe(200);
          expect(response.body.Address.length).toBeGreaterThanOrEqual(2);
        });

        it('should handle missing required fields', async () => {
          const response = await request(app)
            .post(`${AUTH_BASE_PATH}/user/me/addresses`)
            .set('Authorization', `Bearer ${authToken}`)
            .set('Cookie', `token=${authToken}`)
            .send({
              street: '789 Incomplete St',
              city: 'Incomplete City',
              // missing state, zipCode, country
            });

          // Should reject request with validation error
          expect(response.status).toBe(400);
          expect(response.body.errors).toBeDefined();
        });

        it('should handle server errors gracefully', async () => {
          // Mock UserModel.findOneAndUpdate to throw an error
          const originalFindOneAndUpdate = UserModel.findOneAndUpdate;
          UserModel.findOneAndUpdate = jest.fn().mockRejectedValueOnce(
            new Error('Database error')
          );

          const response = await request(app)
            .post(`${AUTH_BASE_PATH}/user/me/addresses`)
            .set('Authorization', `Bearer ${authToken}`)
            .set('Cookie', `token=${authToken}`)
            .send({
              street: '999 Error St',
              city: 'Error City',
              state: 'ES',
              zipCode: '99999',
              country: 'Error Country',
            });

          expect(response.status).toBe(500);
          expect(response.body.message).toBe('Server error');

          // Restore original method
          UserModel.findOneAndUpdate = originalFindOneAndUpdate;
        });
      });

      describe('GET /user/me/addresses', () => {
        it('should retrieve all user addresses successfully', async () => {
          const response = await request(app)
            .get(`${AUTH_BASE_PATH}/user/me/addresses`)
            .set('Authorization', `Bearer ${authToken}`)
            .set('Cookie', `token=${authToken}`);

          expect(response.status).toBe(200);
          expect(response.body).toEqual(
            expect.objectContaining({
              message: 'Addresses retrieved successfully',
              Address: expect.any(Array),
            })
          );
          expect(response.body.Address.length).toBeGreaterThan(0);
          expect(response.body.Address[0]).toEqual(
            expect.objectContaining({
              street: expect.any(String),
              city: expect.any(String),
              state: expect.any(String),
              zipCode: expect.any(String),
            })
          );
        });

        it('should retrieve addresses with all properties', async () => {
          // First add an address with all fields
          await request(app)
            .post(`${AUTH_BASE_PATH}/user/me/addresses`)
            .set('Authorization', `Bearer ${authToken}`)
            .set('Cookie', `token=${authToken}`)
            .send({
              street: '100 Complete St',
              city: 'Complete City',
              state: 'CC',
              zipCode: '00000',
              country: 'Complete Country',
            });

          const response = await request(app)
            .get(`${AUTH_BASE_PATH}/user/me/addresses`)
            .set('Authorization', `Bearer ${authToken}`)
            .set('Cookie', `token=${authToken}`);

          expect(response.status).toBe(200);
          const lastAddress = response.body.Address[response.body.Address.length - 1];
          expect(lastAddress).toHaveProperty('_id');
          expect(lastAddress).toHaveProperty('street');
          expect(lastAddress).toHaveProperty('city');
          expect(lastAddress).toHaveProperty('state');
          expect(lastAddress).toHaveProperty('zipCode');
        });

        it('should return empty address array for user with no addresses', async () => {
          // Create a new user with no addresses
          const newUser = await createUser({ Address: [] });
          const newToken = jwt.sign(
            {
              userId: newUser._id,
              email: newUser.email,
              role: newUser.role,
              username: newUser.username,
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
          );

          const response = await request(app)
            .get(`${AUTH_BASE_PATH}/user/me/addresses`)
            .set('Authorization', `Bearer ${newToken}`)
            .set('Cookie', `token=${newToken}`);

          expect(response.status).toBe(200);
          expect(response.body.Address).toEqual([]);
        });

        it('should handle server errors gracefully', async () => {
          // Mock UserModel.findById to throw an error
          const originalFindById = UserModel.findById;
          UserModel.findById = jest.fn().mockRejectedValueOnce(
            new Error('Database error')
          );

          const response = await request(app)
            .get(`${AUTH_BASE_PATH}/user/me/addresses`)
            .set('Authorization', `Bearer ${authToken}`)
            .set('Cookie', `token=${authToken}`);

          expect(response.status).toBe(500);
          expect(response.body.message).toBe('Server error');

          // Restore original method
          UserModel.findById = originalFindById;
        });
      });

      describe('DELETE /user/me/addresses/:addressId', () => {
        it('should delete an address successfully', async () => {
          // First get the user's addresses
          const getResponse = await request(app)
            .get(`${AUTH_BASE_PATH}/user/me/addresses`)
            .set('Authorization', `Bearer ${authToken}`)
            .set('Cookie', `token=${authToken}`);

          const addressIdToDelete = getResponse.body.Address[0]._id;
          const initialCount = getResponse.body.Address.length;

          // Delete the address
          const deleteResponse = await request(app)
            .delete(`${AUTH_BASE_PATH}/user/me/addresses/${addressIdToDelete}`)
            .set('Authorization', `Bearer ${authToken}`)
            .set('Cookie', `token=${authToken}`);

          expect(deleteResponse.status).toBe(200);
          expect(deleteResponse.body).toEqual(
            expect.objectContaining({
              message: 'Address deleted successfully',
              Address: expect.any(Array),
            })
          );
          expect(deleteResponse.body.Address.length).toBe(initialCount - 1);
        });

        it('should delete correct address when multiple exist', async () => {
          // Add multiple addresses
          const addr1 = {
            street: 'Address 1 Street',
            city: 'City 1',
            state: 'S1',
            zipCode: '11111',
            country: 'Country 1',
          };

          const addr2 = {
            street: 'Address 2 Street',
            city: 'City 2',
            state: 'S2',
            zipCode: '22222',
            country: 'Country 2',
          };

          await request(app)
            .post(`${AUTH_BASE_PATH}/user/me/addresses`)
            .set('Authorization', `Bearer ${authToken}`)
            .set('Cookie', `token=${authToken}`)
            .send(addr1);

          const addResponse = await request(app)
            .post(`${AUTH_BASE_PATH}/user/me/addresses`)
            .set('Authorization', `Bearer ${authToken}`)
            .set('Cookie', `token=${authToken}`)
            .send(addr2);

          const addressToDelete = addResponse.body.Address[addResponse.body.Address.length - 1]._id;

          // Delete the second address
          const deleteResponse = await request(app)
            .delete(`${AUTH_BASE_PATH}/user/me/addresses/${addressToDelete}`)
            .set('Authorization', `Bearer ${authToken}`)
            .set('Cookie', `token=${authToken}`);

          expect(deleteResponse.status).toBe(200);
          expect(deleteResponse.body.Address).toBeDefined();
          const deleted = deleteResponse.body.Address.some(
            (addr) => addr._id.toString() === addressToDelete.toString()
          );
          expect(deleted).toBe(false);
        });

        it('should handle invalid address ID', async () => {
          const invalidAddressId = 'invalid-id-123';

          const response = await request(app)
            .delete(`${AUTH_BASE_PATH}/user/me/addresses/${invalidAddressId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .set('Cookie', `token=${authToken}`);

          // Should either return error or handle gracefully
          expect([200, 404, 500]).toContain(response.status);
        });

        it('should handle deleting non-existent address ID', async () => {
          // Get valid ObjectId format but one that doesn't exist in user's addresses
          const fakeObjectId = '507f1f77bcf86cd799439011';

          const response = await request(app)
            .delete(`${AUTH_BASE_PATH}/user/me/addresses/${fakeObjectId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .set('Cookie', `token=${authToken}`);

          // Should return 404 or success with addresses unchanged
          expect([200, 404]).toContain(response.status);
        });

        it('should handle server errors gracefully', async () => {
          // Mock UserModel.findByIdAndUpdate to throw an error
          const originalFindByIdAndUpdate = UserModel.findByIdAndUpdate;
          UserModel.findByIdAndUpdate = jest.fn().mockRejectedValueOnce(
            new Error('Database error')
          );

          const response = await request(app)
            .delete(`${AUTH_BASE_PATH}/user/me/addresses/507f1f77bcf86cd799439011`)
            .set('Authorization', `Bearer ${authToken}`)
            .set('Cookie', `token=${authToken}`);

          expect(response.status).toBe(500);
          expect(response.body.message).toBe('Server error');

          // Restore original method
          UserModel.findByIdAndUpdate = originalFindByIdAndUpdate;
        });
      });

      describe('Integration tests', () => {
        it('should handle full address lifecycle: add, retrieve, delete', async () => {
          const newAddress = {
            street: '500 Lifecycle St',
            city: 'Lifecycle City',
            state: 'LC',
            zipCode: '50000',
            country: 'Lifecycle Country',
          };

          // Add address
          const addResponse = await request(app)
            .post(`${AUTH_BASE_PATH}/user/me/addresses`)
            .set('Authorization', `Bearer ${authToken}`)
            .set('Cookie', `token=${authToken}`)
            .send(newAddress);

          expect(addResponse.status).toBe(200);
          const addedAddressId = addResponse.body.Address[addResponse.body.Address.length - 1]._id;

          // Retrieve addresses
          const getResponse = await request(app)
            .get(`${AUTH_BASE_PATH}/user/me/addresses`)
            .set('Authorization', `Bearer ${authToken}`)
            .set('Cookie', `token=${authToken}`);

          expect(getResponse.status).toBe(200);
          const addressExists = getResponse.body.Address.some(
            (addr) => addr._id.toString() === addedAddressId.toString()
          );
          expect(addressExists).toBe(true);

          // Delete address
          const deleteResponse = await request(app)
            .delete(`${AUTH_BASE_PATH}/user/me/addresses/${addedAddressId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .set('Cookie', `token=${authToken}`);

          expect(deleteResponse.status).toBe(200);
          const addressDeleted = deleteResponse.body.Address.some(
            (addr) => addr._id.toString() === addedAddressId.toString()
          );
          expect(addressDeleted).toBe(false);
        });
      });
    });
