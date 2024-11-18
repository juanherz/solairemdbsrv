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
      client, // Expecting client ID
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
      client,
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
      payments:
        saleType === 'Contado'
          ? [{ date: saleDate, amount: totalAmount, comments: 'Pagado en efectivo' }]
          : [],
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
    const sales = await Sale.find()
      .populate('createdBy', 'displayName email')
      .populate('client', 'name phone email')
      .populate('items.product', 'name characteristics unit'); // Populate product
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get sales by client ID
router.get('/client/:clientId', requireAuth, checkRole(['admin', 'user']), async (req, res) => {
  try {
    const sales = await Sale.find({ client: req.params.clientId })
      .populate('createdBy', 'displayName email')
      .populate('client', 'name phone email');
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single sale by ID
router.get('/:id', requireAuth, checkRole(['admin', 'user']), async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('createdBy', 'displayName email')
      .populate('client', 'name phone email');
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
      client,
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
        client,
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
      return res.status(404).json({ msg: 'Venta no encontrada' });
    }

    res.json({ msg: 'Venta actualizada exitosamente', sale });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a sale
router.delete('/:id', requireAuth, checkRole(['admin']), async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);
    if (!sale) {
      return res.status(404).json({ msg: 'Venta no encontrada' });
    }
    res.json({ msg: 'Venta eliminada exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record a payment on a sale
router.post('/:id/payments', requireAuth, checkRole(['admin', 'user']), async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ msg: 'Venta no encontrada' });
    }

    const { date, amount, comments } = req.body;

    // Calculate potential new amountPaid
    const newAmountPaid = sale.amountPaid + amount;

    if (newAmountPaid > sale.totalAmount) {
      return res.status(400).json({ msg: 'El monto del pago excede el monto adeudado.' });
    }

    sale.payments.push({ date, amount, comments });

    // After adding the payment, recalculate the status
    const amountPaid = sale.payments.reduce((total, payment) => total + payment.amount, 0);
    const amountOwed = sale.totalAmount - amountPaid;

    if (amountOwed <= 0) {
      sale.status = 'Pagado';
    } else if (amountOwed < sale.totalAmount) {
      sale.status = 'Parcial';
    } else {
      sale.status = 'No Pagado';
    }

    await sale.save();

    res.json({ msg: 'Pago registrado exitosamente', sale });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a payment from a sale
router.delete('/:id/payments/:paymentId', requireAuth, checkRole(['admin']), async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ msg: 'Venta no encontrada' });
    }

    const paymentIndex = sale.payments.findIndex((p) => p._id.toString() === req.params.paymentId);
    if (paymentIndex === -1) {
      return res.status(404).json({ msg: 'Pago no encontrado' });
    }

    sale.payments.splice(paymentIndex, 1);

    // Recalculate amountPaid, amountOwed, and status
    const amountPaid = sale.payments.reduce((total, payment) => total + payment.amount, 0);
    const amountOwed = sale.totalAmount - amountPaid;

    if (amountOwed <= 0) {
      sale.status = 'Pagado';
    } else if (amountOwed < sale.totalAmount) {
      sale.status = 'Parcial';
    } else {
      sale.status = 'No Pagado';
    }

    await sale.save();

    res.json({ msg: 'Pago eliminado exitosamente', sale });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
