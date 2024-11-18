// src/routes/orders.js

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const requireAuth = require('../middlewares/requireAuth');
const checkRole = require('../middlewares/checkRole');
// Missing import for Sale model
const Sale = require('../models/Sale'); // Add this line

// Create a new order
router.post('/', requireAuth, checkRole(['admin', 'user']), async (req, res) => {
  try {
    const {
      client,
      product,
      quantity,
      location,
      deliveryDate,
      comments,
      priority,
      negotiatedPrice,
      currency,
    } = req.body;

    const order = new Order({
      client,
      product,
      quantity,
      location,
      deliveryDate,
      comments,
      priority,
      negotiatedPrice,
      currency,
      createdBy: req.user._id,
    });

    await order.save();
    res.status(201).json({ msg: 'Pedido creado exitosamente', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all orders
router.get('/', requireAuth, checkRole(['admin', 'user']), async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('client', 'name phone email')
      .populate('product', 'name characteristics unit')
      .populate('createdBy', 'displayName email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single order by ID
router.get('/:id', requireAuth, checkRole(['admin', 'user']), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('client', 'name phone email')
      .populate('product', 'name characteristics unit')
      .populate('createdBy', 'displayName email');

    if (!order) {
      return res.status(404).json({ msg: 'Pedido no encontrado' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an order
router.put('/:id', requireAuth, checkRole(['admin', 'user']), async (req, res) => {
  try {
    const {
      client,
      product,
      quantity,
      location,
      deliveryDate,
      comments,
      priority,
      status,
      negotiatedPrice,
      currency,
    } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        client,
        product,
        quantity,
        location,
        deliveryDate,
        comments,
        priority,
        status,
        negotiatedPrice,
        currency,
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ msg: 'Pedido no encontrado' });
    }

    res.json({ msg: 'Pedido actualizado exitosamente', order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an order
router.delete('/:id', requireAuth, checkRole(['admin']), async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ msg: 'Pedido no encontrado' });
    }

    res.json({ msg: 'Pedido eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a sale from an order
router.post('/:id/create-sale', requireAuth, checkRole(['admin', 'user']), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('client')
      .populate('product');

    if (!order) {
      return res.status(404).json({ msg: 'Pedido no encontrado' });
    }

    // Check if a sale has already been created from this order
    if (order.sale) {
      return res.status(400).json({ msg: 'Ya se ha creado una venta para este pedido' });
    }

    // Create a new sale using the order details
    const sale = new Sale({
      client: order.client._id,
      saleNumber: `VENTA-${Date.now()}`,
      saleDate: new Date(),
      items: [
        {
          product: order.product._id,
          description: order.product.name,
          quantity: order.quantity,
          unitPrice: order.negotiatedPrice / order.quantity, // Adjusted to use negotiatedPrice
        },
      ],
      totalAmount: order.negotiatedPrice, // Adjusted to use negotiatedPrice
      status: 'No Pagado',
      saleType: 'Crédito', // Default or based on your requirements
      national: true, // Default or based on your requirements
      currency: order.currency, // Use currency from the order
      comments: order.comments,
      location: order.location,
      createdBy: req.user._id,
      order: order._id, // Link to the order
    });

    await sale.save();

    // Update the order to link it to the sale
    order.sale = sale._id;
    order.status = 'Completed'; // Mark the order as completed
    await order.save();

    res.status(201).json({ msg: 'Venta creada exitosamente a partir del pedido', sale });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
