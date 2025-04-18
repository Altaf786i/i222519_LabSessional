const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/customers', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Customer Schema
const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  loyaltyPoints: { type: Number, default: 0 }
});

const Customer = mongoose.model('Customer', customerSchema);

// Create customer endpoint
app.post('/customers', async (req, res) => {
  try {
    const { name, email } = req.body;
    const customer = new Customer({ name, email });
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update loyalty points endpoint
app.post('/customers/update-points', async (req, res) => {
  try {
    const { customerId, points } = req.body;
    const customer = await Customer.findById(customerId);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    customer.loyaltyPoints += points;
    await customer.save();
    
    res.status(200).json({
      message: 'Loyalty points updated successfully',
      customerId,
      newPoints: customer.loyaltyPoints
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer points endpoint
app.get('/customers/:id/points', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({ points: customer.loyaltyPoints });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Customer service running on port ${PORT}`);
}); 