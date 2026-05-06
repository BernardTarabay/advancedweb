const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },

  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },

  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },

  priceAtOrder: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  }
}, { timestamps: true });

// computed field
orderItemSchema.virtual('lineTotal').get(function () {
  return this.quantity * this.priceAtOrder;
});

// ensure virtuals appear
orderItemSchema.set('toJSON', { virtuals: true });
orderItemSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('OrderItem', orderItemSchema);