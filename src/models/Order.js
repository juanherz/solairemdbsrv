// src/models/Order.js

const mongoose = require('mongoose');
const moment = require('moment'); // Ensure moment is installed

const OrderSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    location: { type: String },
    deliveryDate: { type: Date, required: true, index: true }, // Added index here
    comments: { type: String },
    priority: { type: String, enum: ['Alta', 'Media', 'Baja'], default: 'Media' },
    status: { type: String, enum: ['Pendiente', 'Descartado', 'Completado'], default: 'Pendiente' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },

    // Fields for Income Prediction
    negotiatedPrice: { type: Number, required: true },
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

// Ensure moment is installed in your project
// npm install moment

module.exports = mongoose.model('Order', OrderSchema);
