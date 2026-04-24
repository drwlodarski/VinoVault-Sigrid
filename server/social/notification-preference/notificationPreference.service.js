const { findOrCreateByUserId, updateByUserId } = require('./notificationPreference.repository')

async function getNotificationPreferenceForUser(userId) {
  const preference = await findOrCreateByUserId(userId)

  return {
    allowNotifications: preference.allowNotifications,
  }
}

async function updateNotificationPreferenceForUser(userId, allowNotifications) {
  const preference = await updateByUserId(userId, allowNotifications)

  return {
    allowNotifications: preference.allowNotifications,
  }
}

module.exports = {
  getNotificationPreferenceForUser,
  updateNotificationPreferenceForUser,
}
