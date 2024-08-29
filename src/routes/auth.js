require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const requireAuth = require('../middlewares/requireAuth');
const checkRole = require('../middlewares/checkRole');


router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;
  try {
    const displayName = `${firstName} ${lastName}`;
    const user = new User({ displayName, email, password, role });
    await user.save();

    const accessToken = jwt.sign({ userId: user._id }, `${process.env.MONGODB_SECRET_KEY}`, { expiresIn: '7d' });
    res.status(201).json({ accessToken, user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).send({ error: 'Must provide email and password' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User does not exist' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const accessToken = jwt.sign({ userId: user._id }, `${process.env.MONGODB_SECRET_KEY}`, { expiresIn: '7d' });

    res.json({ accessToken, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

});

// Get current user's info
router.get('/my-account', requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const userProfile = {
      id: user._id,
      displayName: user.displayName,
      email: user.email,
      password: user.password,
      photoURL: user.photoURL || '',
      phoneNumber: user.phoneNumber || '',
      country: user.country || '',
      address: user.address || '',
      state: user.state || '',
      city: user.city || '',
      zipCode: user.zipCode || '',
      about: user.about || '',
      role: user.role || '',
      isPublic: user.isPublic || false,
      isVerified: user.isVerified || false,
      status: user.status,
      company: user.company,
    };
    res.json({ accessToken: req.header('Authorization').split(' ')[1], user: userProfile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update current user's account info
router.put('/my-account', requireAuth, async (req, res) => {
  const {
    displayName, email, photoURL, phoneNumber, country,
    address, state, city, zipCode, about, isPublic, isVerified, status, company
  } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update user fields
    if (displayName) user.displayName = displayName;
    if (email && email.trim() !== '') user.email = email; // Prevent empty email
    if (photoURL) user.photoURL = photoURL;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (country) user.country = country;
    if (address) user.address = address;
    if (state) user.state = state;
    if (city) user.city = city;
    if (zipCode) user.zipCode = zipCode;
    if (about) user.about = about;
    if (isPublic !== undefined) user.isPublic = isPublic;
    if (isVerified !== undefined) user.isVerified = isVerified;
    if (status) user.status = status;
    if (company) user.company = company;

    await user.save();

    const userProfile = {
      id: user._id,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      phoneNumber: user.phoneNumber,
      country: user.country,
      address: user.address,
      state: user.state,
      city: user.city,
      zipCode: user.zipCode,
      about: user.about,
      role: user.role,
      isPublic: user.isPublic,
      isVerified: user.isVerified,
      status: user.status,
      company: user.company,
    };

    res.json({ accessToken: req.header('Authorization').split(' ')[1], user: userProfile });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Example of a route that requires admin role
router.get('/admin', requireAuth, checkRole(['admin']), async (req, res) => {
  res.json({ msg: 'Welcome, admin!' });
});

// Example of a route that requires user role
router.get('/user', requireAuth, checkRole(['user']), async (req, res) => {
  res.json({ msg: 'Welcome, user!' });
});


// Route to create a new user
router.post('/create-user', requireAuth, checkRole(['admin']), async (req, res) => {
  const { displayName, email, password, role, phoneNumber, address, country, state, city, zipCode, company } = req.body;
  try {
    const user = new User({
      displayName,
      email,
      password, //: bcrypt.hashSync(password, 8), // Hash password before saving
      role,
      phoneNumber,
      address,
      country,
      state,
      city,
      zipCode,
      company,
      isVerified: false, // Assuming email is not verified by default for new users
      status: 'active', // Default status
    });
    await user.save();
    res.status(201).json({ msg: 'User created successfully', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Route to edit an existing user
router.put('/edit-user/:id', requireAuth, checkRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const { displayName, email, photoURL, phoneNumber, country, address, state, city, zipCode, about, isPublic, role, company, isVerified, status } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update user fields
    if (displayName) user.displayName = displayName;
    if (email && email.trim() !== '') user.email = email; // Prevent empty email
    if (photoURL) user.photoURL = photoURL;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (country) user.country = country;
    if (address) user.address = address;
    if (state) user.state = state;
    if (city) user.city = city;
    if (zipCode) user.zipCode = zipCode;
    if (about) user.about = about;
    if (isPublic !== undefined) user.isPublic = isPublic;
    if (role) user.role = role;
    if (company) user.company = company;
    if (isVerified !== undefined) user.isVerified = isVerified;
    if (status) user.status = status;

    await user.save();
    res.json({ msg: 'User updated successfully', user });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Route to get all users
router.get('/users', requireAuth, checkRole(['admin']), async (req, res) => {
  try {
    const users = await User.find().select('displayName email phoneNumber address country state city zipCode photoURL isVerified status company role _id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to delete a user
router.delete('/delete-user/:id', requireAuth, checkRole(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to delete multiple users
router.delete('/delete-users', requireAuth, checkRole(['admin']), async (req, res) => {
  const { ids } = req.body;
  try {
    await User.deleteMany({ _id: { $in: ids } });
    res.json({ msg: 'Users deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to get a single user by ID
router.get('/user/:id', requireAuth, checkRole(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to change user password by ID
router.put('/change-password/:id', requireAuth, checkRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ msg: 'Password is required' });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.password = password;

    await user.save();
    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
