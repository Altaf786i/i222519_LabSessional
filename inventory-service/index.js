const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Inventory Item Schema
const inventoryItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true },
  quantity: { type: Number, required: true }
});

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);

// Update inventory endpoint
app.post('/inventory/update', async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    
    let inventoryItem = await InventoryItem.findOne({ itemId });
    
    if (!inventoryItem) {
      inventoryItem = new InventoryItem({ itemId, quantity });
    } else {
      inventoryItem.quantity += quantity;
    }
    
    await inventoryItem.save();
    
    res.status(200).json({
      message: 'Inventory updated successfully',
      itemId,
      newQuantity: inventoryItem.quantity
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get inventory status endpoint
app.get('/inventory', async (req, res) => {
  try {
    const items = await InventoryItem.find();
    res.json(items);
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
  console.log(`Inventory service running on port ${PORT}`);
}); 