const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/payments', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Payment Schema
const paymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  customerId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  timestamp: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', paymentSchema);

// Process payment endpoint
app.post('/payments', async (req, res) => {
  try {
    const { orderId, customerId, amount } = req.body;
    
    // In a real application, you would integrate with a payment gateway here
    // For this example, we'll simulate a successful payment
    
    const payment = new Payment({
      orderId,
      customerId,
      amount,
      status: 'completed'
    });
    
    await payment.save();
    
    res.status(201).json({
      message: 'Payment processed successfully',
      paymentId: payment._id,
      status: payment.status
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payment history endpoint
app.get('/payments/:customerId', async (req, res) => {
  try {
    const payments = await Payment.find({ customerId: req.params.customerId });
    res.json(payments);
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
  console.log(`Payment service running on port ${PORT}`);
}); 