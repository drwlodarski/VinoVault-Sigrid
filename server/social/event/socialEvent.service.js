const {
  createEvent,
  findEventById,
  findAllEvents,
  saveEvent,
  deleteEventById,
} = require('./socialEvent.repository')
const { createClerkClient } = require('@clerk/backend')

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

async function fetchUsernameMap(userIds) {
  const unique = [...new Set(userIds.filter(Boolean))]
  if (!unique.length) return {}
  const { data: users } = await clerkClient.users.getUserList({
    userId: unique,
    limit: unique.length,
  })
  return Object.fromEntries(users.map((u) => [u.id, u.username || null]))
}

async function createSocialEvent(currentUserId, payload) {
  const { name, location, eventDate, date, details } = payload
  const resolvedDate = eventDate || date

  if (!name || !location || !resolvedDate || !details) {
    throw new Error('name, location, date, and details are required.')
  }

  const event = await createEvent({
    name: name.trim(),
    location: location.trim(),
    eventDate: new Date(resolvedDate),
    details: details.trim(),
    hostUserId: currentUserId,
    participantUserIds: [currentUserId],
  })

  return event
}

async function getAllSocialEvents(currentUserId) {
  const events = await findAllEvents()
  const usernameMap = await fetchUsernameMap(events.map((e) => e.hostUserId))
  return events.map((event) => ({
    ...event.toObject(),
    hostUsername: usernameMap[event.hostUserId] || null,
    joined: event.participantUserIds.includes(currentUserId),
  }))
}

async function getSocialEventById(eventId, currentUserId) {
  const event = await findEventById(eventId)

  if (!event) {
    throw new Error('Event not found.')
  }

  const usernameMap = await fetchUsernameMap([event.hostUserId])
  return {
    ...event.toObject(),
    hostUsername: usernameMap[event.hostUserId] || null,
    joined: currentUserId ? event.participantUserIds.includes(currentUserId) : false,
  }
}

async function joinSocialEvent(currentUserId, eventId) {
  const event = await findEventById(eventId)

  if (!event) {
    throw new Error('Event not found.')
  }

  if (event.participantUserIds.includes(currentUserId)) {
    throw new Error('User already joined this event.')
  }

  event.participantUserIds.push(currentUserId)
  await saveEvent(event)

  return event
}

async function leaveSocialEvent(currentUserId, eventId) {
  const event = await findEventById(eventId)

  if (!event) {
    throw new Error('Event not found.')
  }

  if (event.hostUserId === currentUserId) {
    throw new Error('Host cannot leave their own event.')
  }

  if (!event.participantUserIds.includes(currentUserId)) {
    throw new Error('User is not a participant of this event.')
  }

  event.participantUserIds = event.participantUserIds.filter((userId) => userId !== currentUserId)

  await saveEvent(event)

  return event
}

async function deleteSocialEvent(currentUserId, eventId) {
  const event = await findEventById(eventId)

  if (!event) {
    throw new Error('Event not found.')
  }

  if (event.hostUserId !== currentUserId) {
    throw new Error('Only the host can delete this event.')
  }

  await deleteEventById(eventId)
}

module.exports = {
  createSocialEvent,
  getAllSocialEvents,
  getSocialEventById,
  joinSocialEvent,
  leaveSocialEvent,
  deleteSocialEvent,
}
