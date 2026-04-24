const SocialEventModel = require('./socialEvent.model')

async function createEvent(data) {
  return SocialEventModel.create(data)
}

async function findEventById(eventId) {
  return SocialEventModel.findById(eventId)
}

async function findAllEvents() {
  return SocialEventModel.find().sort({ eventDate: 1, createdAt: -1 })
}

async function saveEvent(event) {
  return event.save()
}

async function deleteEventById(eventId) {
  return SocialEventModel.findByIdAndDelete(eventId)
}

module.exports = {
  createEvent,
  findEventById,
  findAllEvents,
  saveEvent,
  deleteEventById,
}
