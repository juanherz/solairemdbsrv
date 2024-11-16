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

const SaleSchema = new mongoose.Schema(
  {
    // customerName: { type: String, required: true },
    // customerPhone: { type: String },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    saleNumber: { type: String, required: true, unique: true },
    saleDate: { type: Date, required: true },
    recordedDate: { type: Date, default: Date.now },
    items: [SaleItemSchema],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['Pagado', 'No Pagado', 'Parcial'], default: 'No Pagado' },
    saleType: { type: String, enum: ['Contado', 'Crédito'], default: 'Crédito' },
    national: { type: Boolean, required: true },
    currency: { type: String, enum: ['USD', 'MXN'], required: true },
    comments: String,
    location: String,
    payments: [PaymentSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual fields to calculate amount paid and amount owed
SaleSchema.virtual('amountPaid').get(function () {
  return this.payments.reduce((total, payment) => total + payment.amount, 0);
});

SaleSchema.virtual('amountOwed').get(function () {
  return this.totalAmount - this.amountPaid;
});

SaleSchema.pre('save', function (next) {
    if (this.amountOwed === 0) {
      this.status = 'Pagado';
    } else if (this.amountOwed < this.totalAmount) {
      this.status = 'Parcial';
    } else {
      this.status = 'No Pagado';
    }
    next();
  });

module.exports = mongoose.model('Sale', SaleSchema);
