const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrderItem'
  }],

  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },

  totalAmount: {
    type: Number,
    required: true,
    min: 0
  }
}, { timestamps: true });

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);