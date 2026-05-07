const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Normalize order line items from POST body.
 * - With qs (extended: true): usually an array.
 * - Sometimes a plain object keyed by index.
 * - With extended: false: flat keys like items[0][product].
 */
function normalizeOrderItems(body) {
  const raw = body.items;
  if (Array.isArray(raw) && raw.length) {
    return raw;
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const rows = Object.keys(raw)
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => raw[k])
      .filter(Boolean);
    if (rows.length) return rows;
  }
  const flatKeys = Object.keys(body).filter((k) => /^items\[\d+\]\[(product|quantity)\]$/.test(k));
  if (!flatKeys.length) return [];
  const byIndex = {};
  for (const key of flatKeys) {
    const m = key.match(/^items\[(\d+)\]\[(product|quantity)\]$/);
    if (!m) continue;
    const idx = m[1];
    const field = m[2];
    byIndex[idx] = byIndex[idx] || {};
    byIndex[idx][field] = body[key];
  }
  return Object.keys(byIndex)
    .sort((a, b) => Number(a) - Number(b))
    .map((i) => byIndex[i])
    .filter((row) => row && row.product);
}

exports.getAllOrders = asyncHandler(async (req, res) => {
  const query = req.user.role === 'customer' ? { user: req.user._id } : {};

  const orders = await Order.find(query)
    .populate('user', 'name email')
    .populate({
      path: 'items',
      populate: { path: 'product', select: 'name price' }
    })
    .sort('-createdAt');

  res.render('orders', {
    orders,
    user: req.user,
    success: null
  });
});

exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate({
      path: 'items',
      populate: { path: 'product', select: 'name price supplier' }
    });

  if (!order) {
    return res.redirect('/orders');
  }

  const orderOwnerId = order.user && order.user._id ? order.user._id.toString() : order.user?.toString();
  if (req.user.role === 'customer' && orderOwnerId !== req.user._id.toString()) {
    return res.redirect('/orders');
  }

  res.render('order-detail', {
    order,
    user: req.user
  });
});

exports.showCreateForm = asyncHandler(async (req, res) => {
  const products = await Product.find();

  res.render('order-form', {
    products,
    user: req.user,
    error: null
  });
});

exports.createOrder = asyncHandler(async (req, res) => {
  const items = normalizeOrderItems(req.body);
  const userId = req.user._id;

  if (items.length === 0) {
    const products = await Product.find();
    return res.render('order-form', {
      products,
      user: req.user,
      error: 'Please provide at least one item'
    });
  }

  let totalAmount = 0;
  const orderItems = [];

  // Validate all items before creating the order
  for (const item of items) {
    const quantity = parseInt(item.quantity, 10);
    if (!item.product || !Number.isFinite(quantity) || quantity <= 0) {
      const products = await Product.find();
      return res.render('order-form', {
        products,
        user: req.user,
        error: 'Each item must have a valid product and quantity'
      });
    }

    const product = await Product.findById(item.product);

    if (!product) {
      const products = await Product.find();
      return res.render('order-form', {
        products,
        user: req.user,
        error: `Product not found`
      });
    }

    if (product.quantity < quantity) {
      const products = await Product.find();
      return res.render('order-form', {
        products,
        user: req.user,
        error: `Insufficient stock for ${product.name}. Available: ${product.quantity}`
      });
    }

    totalAmount += product.price * quantity;
  }

  // Create the order after validation
  const order = await Order.create({
    user: userId,
    items: [], // Temporary, will be updated later
    totalAmount: 0, // Temporary, will be updated later
    status: 'pending'
  });

  for (const item of items) {
    const product = await Product.findById(item.product);
    const quantity = parseInt(item.quantity, 10);

    const orderItem = await OrderItem.create({
      order: order._id, // Associate with the created order
      product: product._id,
      quantity,
      priceAtOrder: product.price
    });

    orderItems.push(orderItem._id);

    product.quantity -= quantity;
    await product.save();
  }

  // Update the order with the correct items and total amount
  order.items = orderItems;
  order.totalAmount = totalAmount;
  await order.save();

  res.redirect('/orders/' + order._id);
});

exports.showUpdateForm = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate({
      path: 'items',
      populate: { path: 'product', select: 'name price' }
    });

  if (!order) {
    return res.redirect('/orders');
  }

  res.render('order-update', {
    order,
    user: req.user,
    error: null
  });
});

exports.updateOrder = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status) {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate({
        path: 'items',
        populate: { path: 'product', select: 'name price' }
      });
    return res.render('order-update', {
      order,
      user: req.user,
      error: 'Status is required'
    });
  }

  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (!validStatuses.includes(status)) {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate({
        path: 'items',
        populate: { path: 'product', select: 'name price' }
      });
    return res.render('order-update', {
      order,
      user: req.user,
      error: 'Invalid status'
    });
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!order) {
    return res.redirect('/orders');
  }

  res.redirect('/orders/' + order._id);
});

exports.deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items');

  if (!order) {
    return res.redirect('/orders');
  }

  for (const itemId of order.items) {
    const orderItem = await OrderItem.findById(itemId);

    if (orderItem) {
      await Product.findByIdAndUpdate(orderItem.product, {
        $inc: { quantity: orderItem.quantity }
      });
    }
  }

  await OrderItem.deleteMany({ _id: { $in: order.items } });
  await order.deleteOne();

  res.redirect('/orders');
});