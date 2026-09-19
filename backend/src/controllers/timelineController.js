const TimelineEvent = require('../models/TimelineEvent');

// @desc Get timeline for a patient / consultation
// @route GET /api/timeline/:patientId
const getTimeline = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { consultationId, eventType } = req.query;

    let query = {
      $or: [
        { patientId },
        { consultationId: patientId } // In case caller passed consultationId
      ]
    };

    if (consultationId) query.consultationId = consultationId;
    if (eventType) query.eventType = eventType;

    const events = await TimelineEvent.find(query).sort({ timestamp: -1 });

    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

// @desc Add manual clinical event to timeline
// @route POST /api/timeline
const addEvent = async (req, res, next) => {
  try {
    const { patientId, consultationId, eventType, title, description, source, badgeColor } = req.body;

    const event = await TimelineEvent.create({
      patientId,
      consultationId,
      eventType: eventType || 'SYSTEM',
      title,
      description,
      source: source || 'DOCTOR_ENTERED',
      badgeColor: badgeColor || 'emerald',
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTimeline,
  addEvent
};
