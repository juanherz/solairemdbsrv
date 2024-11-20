// src/routes/calendar.js

const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const requireAuth = require('../middlewares/requireAuth');
const User = require('../models/User');


// Get all events for the logged-in user
router.get('/events', requireAuth, async (req, res) => {
    try {
      let events;
      if (req.user.role === 'admin') {
        // Admins see all events
        events = await Event.find()
          .populate('createdBy', 'displayName email')
          .populate('users', 'displayName email');
      } else {
        // Users see only events they are assigned to or created
        events = await Event.find({
          $or: [{ createdBy: req.user._id }, { users: req.user._id }],
        })
          .populate('createdBy', 'displayName email')
          .populate('users', 'displayName email');
      }
      res.json({ events });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// Create a new event
router.post('/events/new', requireAuth, async (req, res) => {
  try {
    const { title, description, start, end, allDay, textColor, users } = req.body;

    const event = new Event({
      title,
      description,
      start,
      end,
      allDay,
      textColor,
      createdBy: req.user._id,
      users,
    });

    await event.save();

    // Populate users before returning
    const populatedEvent = await Event.findById(event._id)
    .populate('createdBy', 'displayName email')
    .populate('users', 'displayName email');

    res.status(201).json({ event: populatedEvent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update an event
router.post('/events/update', requireAuth, async (req, res) => {
  try {
    const { eventId, updateEvent } = req.body;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    // Check if the user has permission to update the event
    if (
      req.user.role !== 'admin' &&
      !event.createdBy.equals(req.user._id) &&
      !event.users.includes(req.user._id)
    ) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar este evento' });
    }

    Object.assign(event, updateEvent);
    await event.save();

    // Populate users before returning
    const populatedEvent = await Event.findById(event._id)
    .populate('createdBy', 'displayName email')
    .populate('users', 'displayName email');

    res.json({ event: populatedEvent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an event
router.post('/events/delete', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.body;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    // Check if the user has permission to delete the event
    if (
      req.user.role !== 'admin' &&
      !event.createdBy.equals(req.user._id)
    ) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este evento' });
    }

    await event.remove();

    res.json({ msg: 'Evento eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
