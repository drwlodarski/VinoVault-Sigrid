const mongoose = require('mongoose')

const socialEventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    details: {
      type: String,
      required: true,
      trim: true,
    },
    hostUserId: {
      type: String,
      required: true,
      index: true,
    },
    participantUserIds: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
)

const SocialEventModel = mongoose.model('SocialEvent', socialEventSchema)

module.exports = SocialEventModel
