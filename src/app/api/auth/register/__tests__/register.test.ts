import { createMocks } from 'node-mocks-http';
import handler from '../route';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}));

describe('/api/auth/register', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new user successfully', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 1, email: 'test@example.com', fullName: 'Test User' });

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      },
    });

    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toHaveProperty('email', 'test@example.com');
  });

  it('should fail if email already exists', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@example.com' });

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      },
    });

    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toHaveProperty('error');
  });

  it('should fail if data is invalid', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        fullName: '',
        email: 'not-an-email',
        password: '',
      },
    });

    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toHaveProperty('error');
  });
}); 