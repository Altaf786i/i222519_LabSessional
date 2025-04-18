const request = require('supertest');
const app = require('../index');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('Order Service Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should process a valid order successfully', async () => {
    // Mock menu service response
    axios.get.mockResolvedValueOnce({
      data: [
        { _id: '1', name: 'Coffee', price: 5, stock: 10 },
        { _id: '2', name: 'Tea', price: 3, stock: 15 }
      ]
    });

    // Mock inventory service response
    axios.post.mockResolvedValueOnce({ data: { message: 'Inventory updated' } });

    // Mock customer service response
    axios.post.mockResolvedValueOnce({ data: { message: 'Points updated' } });

    const orderData = {
      customerId: '123',
      items: [
        { itemId: '1', quantity: 2 },
        { itemId: '2', quantity: 1 }
      ]
    };

    const response = await request(app)
      .post('/orders')
      .send(orderData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Order processed successfully');
    expect(response.body).toHaveProperty('totalAmount', 13); // (2 * 5) + (1 * 3)
    expect(response.body).toHaveProperty('pointsEarned', 7); // 13 / 7 = 1.85, floor(1.85) * 7 = 7
  });

  test('should return error for insufficient stock', async () => {
    // Mock menu service response
    axios.get.mockResolvedValueOnce({
      data: [
        { _id: '1', name: 'Coffee', price: 5, stock: 1 }
      ]
    });

    const orderData = {
      customerId: '123',
      items: [
        { itemId: '1', quantity: 2 }
      ]
    };

    const response = await request(app)
      .post('/orders')
      .send(orderData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Insufficient stock for item Coffee');
  });

  test('should return error for invalid item', async () => {
    // Mock menu service response
    axios.get.mockResolvedValueOnce({
      data: [
        { _id: '1', name: 'Coffee', price: 5, stock: 10 }
      ]
    });

    const orderData = {
      customerId: '123',
      items: [
        { itemId: '999', quantity: 1 }
      ]
    };

    const response = await request(app)
      .post('/orders')
      .send(orderData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Item 999 not found');
  });

  test('should handle service errors gracefully', async () => {
    // Mock menu service error
    axios.get.mockRejectedValueOnce(new Error('Service unavailable'));

    const orderData = {
      customerId: '123',
      items: [
        { itemId: '1', quantity: 1 }
      ]
    };

    const response = await request(app)
      .post('/orders')
      .send(orderData);

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Internal server error');
  });
}); 