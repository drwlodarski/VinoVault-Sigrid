const mongoose = require('mongoose')

const friendshipSchema = new mongoose.Schema(
  {
    userAId: {
      type: String,
      required: true,
    },
    userBId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['NONE', 'PENDING', 'ACCEPTED', 'BLOCKED'],
      required: true,
      default: 'NONE',
    },
    requestedBy: {
      type: String,
      default: null,
    },
    blockedBy: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
)

friendshipSchema.index({ userAId: 1, userBId: 1 }, { unique: true })

const FriendshipModel = mongoose.model('Friendship', friendshipSchema)

module.exports = FriendshipModel
