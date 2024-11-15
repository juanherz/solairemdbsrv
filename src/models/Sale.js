// src/models/Sale.js
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  comments: String,
});

const SaleItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
});

const SaleSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  saleNumber: { type: String, required: true, unique: true },
  saleDate: { type: Date, required: true }, // When the sale actually happened
  recordedDate: { type: Date, default: Date.now }, // When it was recorded on the page
  items: [SaleItemSchema],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['Pagado', 'No Pagado', 'Parcial'], default: 'No Pagado' },
  saleType: { type: String, enum: ['Contado', 'Crédito'], default: 'Crédito' }, // Cash or Credit
  national: { type: Boolean, required: true }, // True for national, false for international
  currency: { type: String, enum: ['USD', 'MXN'], required: true }, // Only USD or MXN
  comments: String, // Comments when creating sales or when payments are made
  location: String, // Location where the sale happened
  payments: [PaymentSchema], // Payments made against credit sales
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

// Virtual fields to calculate amount paid and amount owed
SaleSchema.virtual('amountPaid').get(function () {
  return this.payments.reduce((total, payment) => total + payment.amount, 0);
});

SaleSchema.virtual('amountOwed').get(function () {
  return this.totalAmount - this.amountPaid;
});

module.exports = mongoose.model('Sale', SaleSchema);
