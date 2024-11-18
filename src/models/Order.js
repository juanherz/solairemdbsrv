// src/models/Order.js

const mongoose = require('mongoose');
const moment = require('moment'); // Ensure moment is installed

const OrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  description: String,
  quantity: Number,
  unitPrice: Number,
});

const OrderSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    items: [OrderItemSchema], // Modified to include items array
    location: { type: String },
    deliveryDate: { type: Date, required: true, index: true }, // Added index here
    comments: { type: String },
    priority: { type: String, enum: ['Alta', 'Media', 'Baja'], default: 'Media' },
    status: { type: String, enum: ['Pendiente', 'Descartado', 'Completado'], default: 'Pendiente' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },

    // Fields for Income Prediction
    currency: { type: String, enum: ['USD', 'MXN'], required: true },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field to calculate the ISO week number of the deliveryDate
OrderSchema.virtual('weekNumber').get(function () {
  if (this.deliveryDate) {
    // Using moment.js to get the ISO week number
    return moment(this.deliveryDate).isoWeek();
  } else {
    return null;
  }
});

OrderSchema.virtual('negotiatedPrice').get(function () {
    return this.items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  });


module.exports = mongoose.model('Order', OrderSchema);
