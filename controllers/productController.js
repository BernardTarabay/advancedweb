const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const asyncHandler = require('../middleware/asyncHandler');

exports.getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().populate('supplier', 'name email');

  res.render('products', {
    products,
    user: req.user,
    success: null
  });
});

exports.getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('supplier', 'name email');

  if (!product) {
    return res.redirect('/products');
  }

  res.render('product-detail', {
    product,
    user: req.user
  });
});

exports.showCreateForm = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find();
  
  res.render('product-form', {
    isEdit: false,
    product: null,
    suppliers,
    user: req.user,
    error: null
  });
});

exports.createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, quantity, supplier: supplierId } = req.body;

  if (!name || !price || !supplierId) {
    const suppliers = await Supplier.find();
    return res.render('product-form', {
      isEdit: false,
      product: null,
      suppliers,
      user: req.user,
      error: 'Missing required fields'
    });
  }

  const supplier = await Supplier.findById(supplierId);

  if (!supplier) {
    const suppliers = await Supplier.find();
    return res.render('product-form', {
      isEdit: false,
      product: null,
      suppliers,
      user: req.user,
      error: 'Invalid supplier'
    });
  }

  const product = await Product.create({
    name,
    description,
    price,
    quantity: quantity || 0,
    supplier: supplierId
  });

  supplier.products.push(product._id);
  await supplier.save();

  res.redirect('/products');
});

exports.showEditForm = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('supplier');
  const suppliers = await Supplier.find();

  if (!product) {
    return res.redirect('/products');
  }

  res.render('product-form', {
    isEdit: true,
    product,
    suppliers,
    user: req.user,
    error: null
  });
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const { supplier: newSupplierId, ...updateData } = req.body;

  if (newSupplierId) {
    const supplier = await Supplier.findById(newSupplierId);

    if (!supplier) {
      const product = await Product.findById(req.params.id).populate('supplier');
      const suppliers = await Supplier.find();
      return res.render('product-form', {
        isEdit: true,
        product,
        suppliers,
        user: req.user,
        error: 'Invalid supplier'
      });
    }

    updateData.supplier = newSupplierId;
  }

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('supplier', 'name email');

  if (!product) {
    return res.redirect('/products');
  }

  res.redirect('/products/' + product._id);
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.redirect('/products');
  }

  await Supplier.findByIdAndUpdate(product.supplier, {
    $pull: { products: product._id }
  });

  await product.deleteOne();

  res.redirect('/products');
});