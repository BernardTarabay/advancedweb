const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // still holds OrderItems (correct design)
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrderItem',
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

// Add custom validation to ensure items array is not empty
orderSchema.path('items').validate(function (value) {
  return value && value.length > 0;
}, 'Order must have at least one item.');

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);