const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const asyncHandler = require('../middleware/asyncHandler');

exports.getAllSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find().populate('products', 'name price quantity');

  res.render('suppliers', {
    suppliers,
    user: req.user,
    success: null
  });
});

exports.getSupplierById = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id).populate('products', 'name price quantity');

  if (!supplier) {
    return res.redirect('/suppliers');
  }

  res.render('supplier-detail', {
    supplier,
    user: req.user
  });
});

exports.showCreateForm = asyncHandler(async (req, res) => {
  res.render('supplier-form', {
    isEdit: false,
    supplier: null,
    user: req.user,
    error: null
  });
});

exports.createSupplier = asyncHandler(async (req, res) => {
  const { name, email, phone, address } = req.body;

  if (!name || !email) {
    return res.render('supplier-form', {
      isEdit: false,
      supplier: null,
      user: req.user,
      error: 'Name and email are required'
    });
  }

  const existing = await Supplier.findOne({ email });

  if (existing) {
    return res.render('supplier-form', {
      isEdit: false,
      supplier: null,
      user: req.user,
      error: 'Supplier with this email already exists'
    });
  }

  const supplier = await Supplier.create({
    name,
    email,
    phone,
    address
  });

  res.redirect('/suppliers');
});

exports.showEditForm = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    return res.redirect('/suppliers');
  }

  res.render('supplier-form', {
    isEdit: true,
    supplier,
    user: req.user,
    error: null
  });
});

exports.updateSupplier = asyncHandler(async (req, res) => {
  const { products, ...updateData } = req.body;

  const supplier = await Supplier.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('products', 'name price quantity');

  if (!supplier) {
    return res.redirect('/suppliers');
  }

  res.redirect('/suppliers/' + supplier._id);
});

exports.deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    return res.redirect('/suppliers');
  }

  await Product.deleteMany({ supplier: supplier._id });
  await supplier.deleteOne();

  res.redirect('/suppliers');
});