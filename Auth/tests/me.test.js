const request = require('supertest');

const app = require('../src/app');
const { AUTH_BASE_PATH, createUser } = require('./helpers/auth');

describe('GET /me', () => {
  it('returns the current user from the auth token cookie', async () => {
    await createUser();

    const loginResponse = await request(app)
      .post(`${AUTH_BASE_PATH}/login`)
      .send({
        email: 'test@example.com',
        password: 'Password123',
      });

    const response = await request(app)
      .get(`${AUTH_BASE_PATH}/me`)
      .set('Cookie', loginResponse.headers['set-cookie']);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/current user/i),
        user: expect.objectContaining({
          email: 'test@example.com',
          username: 'testuser',
          role: 'user',
          userId: expect.any(String),
        }),
      })
    );
  });

  it('rejects requests without a token cookie', async () => {
    const response = await request(app).get(`${AUTH_BASE_PATH}/me`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/unauthorized/i),
      })
    );
  });
});
