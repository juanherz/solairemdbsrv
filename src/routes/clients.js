// src/routes/clients.js

const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const requireAuth = require('../middlewares/requireAuth');
const checkRole = require('../middlewares/checkRole');

// Create a new client
router.post('/', requireAuth, checkRole(['admin', 'user']), async (req, res) => {
  try {
    const client = new Client({ ...req.body, createdBy: req.user._id });
    await client.save();
    res.status(201).json({ msg: 'Cliente creado exitosamente', client });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all clients
router.get('/', requireAuth, checkRole(['admin', 'user']), async (req, res) => {
  try {
    const clients = await Client.find().sort({ name: 1 });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single client by ID
router.get('/:id', requireAuth, checkRole(['admin', 'user']), async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ msg: 'Cliente no encontrado' });
    }
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a client
router.put('/:id', requireAuth, checkRole(['admin', 'user']), async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!client) {
      return res.status(404).json({ msg: 'Cliente no encontrado' });
    }
    res.json({ msg: 'Cliente actualizado exitosamente', client });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a client
router.delete('/:id', requireAuth, checkRole(['admin']), async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      return res.status(404).json({ msg: 'Cliente no encontrado' });
    }
    res.json({ msg: 'Cliente eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
