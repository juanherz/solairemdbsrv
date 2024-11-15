// src/routes/sales.js
const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const requireAuth = require('../middlewares/requireAuth');
const checkRole = require('../middlewares/checkRole');

// Create a new sale
router.post('/', requireAuth, checkRole(['admin', 'user']), async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      saleNumber,
      saleDate,
      items,
      saleType,
      national,
      currency,
      comments,
      location,
    } = req.body;

    // Calculate total amount
    const totalAmount = items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);

    const sale = new Sale({
      customerName,
      customerPhone,
      saleNumber,
      saleDate,
      items,
      totalAmount,
      status: saleType === 'Contado' ? 'Pagado' : 'No Pagado',
      saleType,
      national,
      currency,
      comments,
      location,
      createdBy: req.user._id,
      payments: saleType === 'Contado' ? [{ date: saleDate, amount: totalAmount, comments: 'Pagado en efectivo' }] : [],
    });

    await sale.save();
    res.status(201).json({ msg: 'Venta creada exitosamente', sale });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all sales
router.get('/', requireAuth, checkRole(['admin', 'user']), async (req, res) => {
  try {
    const sales = await Sale.find().populate('createdBy', 'displayName email');
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single sale by ID
router.get('/:id', requireAuth, checkRole(['admin', 'user']), async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('createdBy', 'displayName email');
    if (!sale) {
      return res.status(404).json({ msg: 'Venta no encontrada' });
    }
    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a sale
router.put('/:id', requireAuth, checkRole(['admin', 'user']), async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      saleNumber,
      saleDate,
      items,
      saleType,
      national,
      currency,
      comments,
      location,
    } = req.body;

    // Calculate total amount
    const totalAmount = items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);

    const sale = await Sale.findByIdAndUpdate(
      req.params.id,
      {
        customerName,
        customerPhone,
        saleNumber,
        saleDate,
        items,
        totalAmount,
        saleType,
        national,
        currency,
        comments,
        location,
      },
      { new: true }
    );

    if (!sale) {
      return res.status(404).json({ msg: 'Sale not found' });
    }

    res.json({ msg: 'Sale updated successfully', sale });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a sale
router.delete('/:id', requireAuth, checkRole(['admin']), async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);
    if (!sale) {
      return res.status(404).json({ msg: 'Sale not found' });
    }
    res.json({ msg: 'Sale deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record a payment on a sale
router.post('/:id/payments', requireAuth, checkRole(['admin', 'user']), async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ msg: 'Sale not found' });
    }

    const { date, amount, comments } = req.body;

    sale.payments.push({ date, amount, comments });
    await sale.save();

    res.json({ msg: 'Payment recorded successfully', sale });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get sales by customer name
router.get('/customer/:customerName', requireAuth, checkRole(['admin', 'user']), async (req, res) => {
  try {
    const sales = await Sale.find({ customerName: req.params.customerName });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
