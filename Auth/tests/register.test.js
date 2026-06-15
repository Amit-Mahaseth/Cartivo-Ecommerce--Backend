const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../src/app');
const User = require('../src/models/user.model');
const { AUTH_BASE_PATH, createUser, userPayload } = require('./helpers/auth');

describe('POST /register', () => {
  it('registers a user successfully', async () => {
    const payload = userPayload();

    const response = await request(app)
      .post(`${AUTH_BASE_PATH}/register`)
      .send(payload);

    expect(response.status).toBe(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.stringMatching(/registered/i),
        user: expect.objectContaining({
          username: payload.username,
          email: payload.email,
        }),
      })
    );

    expect(response.body.user.password).toBeUndefined();

    const savedUser = await User.findOne({
      email: payload.email,
    }).select('+password');

    expect(savedUser).not.toBeNull();
    expect(savedUser.username).toBe(payload.username);

    await expect(
      bcrypt.compare(payload.password, savedUser.password)
    ).resolves.toBe(true);
  });

  it('rejects duplicate username', async () => {
    const existingUser = await createUser();

    const response = await request(app)
      .post(`${AUTH_BASE_PATH}/register`)
      .send(
        userPayload({
          username: existingUser.username,
          email: 'different@example.com',
        })
      );

    expect(response.status).toBe(400);
  });

  it('rejects duplicate email', async () => {
    const existingUser = await createUser();

    const response = await request(app)
      .post(`${AUTH_BASE_PATH}/register`)
      .send(
        userPayload({
          username: 'differentuser',
          email: existingUser.email,
        })
      );

    expect(response.status).toBe(400);
  });

  it('rejects missing required fields', async () => {
    const response = await request(app)
      .post(`${AUTH_BASE_PATH}/register`)
      .send({});

    expect(response.status).toBe(400);
  });
});