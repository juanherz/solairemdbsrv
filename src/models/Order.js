// src/models/Order.js

const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    location: { type: String },
    deliveryDate: { type: Date, required: true },
    comments: { type: String },
    sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
    priority: { type: String, enum: ['Alta', 'Media', 'Baja'], default: 'Media' },
    status: { type: String, enum: ['Pendiente', 'Descartado', 'Completado'], default: 'Pendiente' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model('Order', OrderSchema);
