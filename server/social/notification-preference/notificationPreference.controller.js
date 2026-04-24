const {
  getNotificationPreferenceForUser,
  updateNotificationPreferenceForUser,
} = require('./notificationPreference.service')

async function getNotificationPreference(req, res, next) {
  try {
    const userId = req.auth.userId

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const preference = await getNotificationPreferenceForUser(userId)

    return res.status(200).json({
      data: preference,
    })
  } catch (error) {
    next(error)
  }
}

async function updateNotificationPreference(req, res, next) {
  try {
    const userId = req.auth.userId
    const { allowNotifications } = req.body

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (typeof allowNotifications !== 'boolean') {
      return res.status(400).json({
        message: 'allowNotifications must be a boolean',
      })
    }

    const updatedPreference = await updateNotificationPreferenceForUser(userId, allowNotifications)

    return res.status(200).json({
      message: 'Notification preference updated successfully',
      data: updatedPreference,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getNotificationPreference,
  updateNotificationPreference,
}
