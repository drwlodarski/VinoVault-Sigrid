const FriendshipModel = require('./friendship.model')

function normalizePair(user1Id, user2Id) {
  return user1Id < user2Id
    ? { userAId: user1Id, userBId: user2Id }
    : { userAId: user2Id, userBId: user1Id }
}

async function findByUsers(user1Id, user2Id) {
  const pair = normalizePair(user1Id, user2Id)
  return FriendshipModel.findOne(pair)
}

async function findOrCreateByUsers(user1Id, user2Id) {
  const pair = normalizePair(user1Id, user2Id)

  let friendship = await FriendshipModel.findOne(pair)
  if (!friendship) {
    friendship = await FriendshipModel.create({
      ...pair,
      status: 'NONE',
      requestedBy: null,
      blockedBy: null,
    })
  }

  return friendship
}

async function findAllByUser(userId) {
  return FriendshipModel.find({
    $or: [{ userAId: userId }, { userBId: userId }],
    status: { $ne: 'NONE' },
  })
}

async function save(friendship) {
  return friendship.save()
}

module.exports = {
  normalizePair,
  findByUsers,
  findOrCreateByUsers,
  findAllByUser,
  save,
}
