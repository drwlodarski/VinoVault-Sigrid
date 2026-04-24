const NotificationPreferenceModel = require('./notificationPreference.model')

async function findByUserId(userId) {
  return NotificationPreferenceModel.findOne({ userId })
}

async function findOrCreateByUserId(userId) {
  let preference = await NotificationPreferenceModel.findOne({ userId })

  if (!preference) {
    preference = await NotificationPreferenceModel.create({
      userId,
      allowNotifications: true,
    })
  }

  return preference
}

async function updateByUserId(userId, allowNotifications) {
  return NotificationPreferenceModel.findOneAndUpdate(
    { userId },
    { allowNotifications },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  )
}

module.exports = {
  findByUserId,
  findOrCreateByUserId,
  updateByUserId,
}
