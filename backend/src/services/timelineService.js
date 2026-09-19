const TimelineEvent = require('../models/TimelineEvent');

const addTimelineEvent = async ({
  patientId,
  consultationId,
  eventType,
  title,
  description,
  source = 'SYSTEM',
  badgeColor = 'emerald',
  metadata = {}
}) => {
  try {
    const event = await TimelineEvent.create({
      patientId,
      consultationId,
      eventType,
      title,
      description,
      source,
      badgeColor,
      metadata,
      timestamp: new Date()
    });
    return event;
  } catch (error) {
    console.error('[Timeline Service Error]:', error.message);
    return null;
  }
};

module.exports = { addTimelineEvent };
