const request = require('supertest');

const app = require('../src/app');
const redis = require('../src/db/redis');
const { AUTH_BASE_PATH, createUser } = require('./helpers/auth');

describe('GET /logout', () => {
  it('logs out successfully and blacklists the token cookie', async () => {
    await createUser();

    const loginResponse = await request(app)
      .post(`${AUTH_BASE_PATH}/login`)
      .send({
        email: 'test@example.com',
        password: 'Password123',
      });

    const tokenCookie = loginResponse.headers['set-cookie'].find((cookie) =>
      cookie.startsWith('token=')
    );
    const token = tokenCookie.split(';')[0].replace('token=', '');

    const response = await request(app)
      .get(`${AUTH_BASE_PATH}/logout`)
      .set('Cookie', loginResponse.headers['set-cookie']);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/logged out/i),
      })
    );
    expect(redis.set).toHaveBeenCalledWith(`Blacklist:${token}`, 'true', 'EX', 24 * 60 * 60);
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringMatching(/^token=;/)])
    );
  });

  it('logs out successfully without a token cookie', async () => {
    const response = await request(app).get(`${AUTH_BASE_PATH}/logout`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/logged out/i),
      })
    );
    expect(redis.set).not.toHaveBeenCalled();
  });
});
