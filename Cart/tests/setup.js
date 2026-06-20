jest.setTimeout(120000);

beforeEach(() => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
});

afterEach(async () => {
  jest.clearAllMocks();
});
