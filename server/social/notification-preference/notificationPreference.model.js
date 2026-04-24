const mongoose = require('mongoose')

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    allowNotifications: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

const NotificationPreferenceModel = mongoose.model(
  'NotificationPreference',
  notificationPreferenceSchema
)

module.exports = NotificationPreferenceModel
