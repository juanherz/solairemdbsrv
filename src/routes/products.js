// src/routes/products.js

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const requireAuth = require('../middlewares/requireAuth');
const checkRole = require('../middlewares/checkRole');

// Create a new product
router.post('/', requireAuth, checkRole(['admin', 'user']), async (req, res) => {
  try {
    const product = new Product({ ...req.body, createdBy: req.user._id });
    await product.save();
    res.status(201).json({ msg: 'Producto creado exitosamente', product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all products
router.get('/', requireAuth, checkRole(['admin', 'user']), async (req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single product by ID
router.get('/:id', requireAuth, checkRole(['admin', 'user']), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a product
router.put('/:id', requireAuth, checkRole(['admin', 'user']), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }
    res.json({ msg: 'Producto actualizado exitosamente', product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a product
router.delete('/:id', requireAuth, checkRole(['admin']), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }
    res.json({ msg: 'Producto eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
