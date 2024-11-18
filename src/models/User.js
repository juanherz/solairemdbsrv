// src/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  displayName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  photoURL: String,
  phoneNumber: String,
  country: String,
  address: String,
  state: String,
  city: String,
  zipCode: String,
  about: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isPublic: Boolean,
  isVerified: { type: Boolean, default: false },
  status: { type: String, default: 'active' },
  company: String,
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', UserSchema);
