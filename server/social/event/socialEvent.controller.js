const {
  createSocialEvent,
  getAllSocialEvents,
  getSocialEventById,
  joinSocialEvent,
  leaveSocialEvent,
  deleteSocialEvent,
} = require('./socialEvent.service')

async function createEvent(req, res, next) {
  try {
    const currentUserId = req.auth.userId

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const event = await createSocialEvent(currentUserId, req.body)

    return res.status(201).json({
      message: 'Event created successfully',
      data: event,
    })
  } catch (error) {
    next(error)
  }
}

async function getEvents(req, res, next) {
  try {
    const currentUserId = req.auth.userId
    const events = await getAllSocialEvents(currentUserId)

    return res.status(200).json({
      data: events,
    })
  } catch (error) {
    next(error)
  }
}

async function getEventDetails(req, res, next) {
  try {
    const currentUserId = req.auth?.userId
    const eventId = req.params.eventId
    const event = await getSocialEventById(eventId, currentUserId)

    return res.status(200).json({
      data: event,
    })
  } catch (error) {
    next(error)
  }
}

async function joinEvent(req, res, next) {
  try {
    const currentUserId = req.auth.userId
    const eventId = req.params.eventId

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const event = await joinSocialEvent(currentUserId, eventId)

    return res.status(200).json({
      message: 'Joined event successfully',
      data: event,
    })
  } catch (error) {
    next(error)
  }
}

async function leaveEvent(req, res, next) {
  try {
    const currentUserId = req.auth.userId
    const eventId = req.params.eventId

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const event = await leaveSocialEvent(currentUserId, eventId)

    return res.status(200).json({
      message: 'Left event successfully',
      data: event,
    })
  } catch (error) {
    next(error)
  }
}

async function deleteEvent(req, res, next) {
  try {
    const currentUserId = req.auth.userId
    const eventId = req.params.eventId

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    await deleteSocialEvent(currentUserId, eventId)

    return res.status(200).json({ message: 'Event deleted successfully' })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createEvent,
  getEvents,
  getEventDetails,
  joinEvent,
  leaveEvent,
  deleteEvent,
}
