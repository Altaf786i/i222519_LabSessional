const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const MENU_SERVICE_URL = process.env.MENU_SERVICE_URL || 'http://localhost:3001';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3003';
const CUSTOMER_SERVICE_URL = process.env.CUSTOMER_SERVICE_URL || 'http://localhost:3004';

// Order processing endpoint
app.post('/orders', async (req, res) => {
  try {
    const { customerId, items } = req.body;

    // Validate items with menu service
    const menuResponse = await axios.get(`${MENU_SERVICE_URL}/menu`);
    const menuItems = menuResponse.data;
    
    let totalAmount = 0;
    for (const orderItem of items) {
      const menuItem = menuItems.find(item => item._id === orderItem.itemId);
      if (!menuItem) {
        return res.status(400).json({ error: `Item ${orderItem.itemId} not found` });
      }
      if (menuItem.stock < orderItem.quantity) {
        return res.status(400).json({ error: `Insufficient stock for item ${menuItem.name}` });
      }
      totalAmount += menuItem.price * orderItem.quantity;
    }

    // Update inventory
    for (const orderItem of items) {
      await axios.post(`${INVENTORY_SERVICE_URL}/inventory/update`, {
        itemId: orderItem.itemId,
        quantity: -orderItem.quantity
      });
    }

    // Update customer loyalty points (7 points per $7 spent)
    const pointsToAdd = Math.floor(totalAmount / 7) * 7;
    await axios.post(`${CUSTOMER_SERVICE_URL}/customers/update-points`, {
      customerId,
      points: pointsToAdd
    });

    res.status(201).json({
      message: 'Order processed successfully',
      totalAmount,
      pointsEarned: pointsToAdd
    });
  } catch (error) {
    console.error('Order processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
}); 