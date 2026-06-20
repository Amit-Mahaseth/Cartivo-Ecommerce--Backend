const request = require('supertest');

const app = require('../src/app');
const { AUTH_BASE_PATH, createUser } = require('./helpers/auth');

describe('POST /login', () => {
  it('logs in successfully with email and password', async () => {
    await createUser();

    const response = await request(app)
      .post(`${AUTH_BASE_PATH}/login`)
      .send({
        email: 'test@example.com',
        password: 'Password123',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/login|logged in|success/i),
        token: expect.any(String),
        user: expect.objectContaining({
          username: 'testuser',
          email: 'test@example.com',
        }),
      })
    );
    expect(response.body.user.password).toBeUndefined();
  });

  it('rejects an invalid email or username', async () => {
    await createUser();

    const response = await request(app)
      .post(`${AUTH_BASE_PATH}/login`)
      .send({
        email: 'missing@example.com',
        password: 'Password123',
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/invalid|not found|credentials/i),
      })
    );
  });

  it('rejects a wrong password', async () => {
    await createUser();

    const response = await request(app)
      .post(`${AUTH_BASE_PATH}/login`)
      .send({
        email: 'test@example.com',
        password: 'WrongPassword123',
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/invalid|password|credentials/i),
      })
    );
  });
});
