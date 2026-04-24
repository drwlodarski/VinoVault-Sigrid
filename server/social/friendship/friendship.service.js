// src/modules/social/friendship/friendship.service.js
const { findOrCreateByUsers, findAllByUser, save } = require('./friendship.repository')
const { resolveUserViewState } = require('./friendship.states')
const { createClerkClient } = require('@clerk/backend')

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

function mapRelationshipState(friendship, currentUserId) {
  if (friendship.status === 'NONE') return 'NO_FRIENDSHIP'
  if (friendship.status === 'ACCEPTED') return 'ACCEPTED_FRIENDSHIP'
  if (friendship.status === 'BLOCKED') return 'BLOCKED_FRIENDSHIP'

  if (friendship.status === 'PENDING') {
    return friendship.requestedBy === currentUserId ? 'REQUEST_SENT' : 'REQUEST_RECEIVED'
  }

  throw new Error('Unknown friendship status.')
}

async function getFriendshipState(currentUserId, targetUserId) {
  if (currentUserId === targetUserId) {
    throw new Error('Cannot build friendship with yourself.')
  }

  const friendship = await findOrCreateByUsers(currentUserId, targetUserId)

  return {
    targetUserId,
    relationshipState: mapRelationshipState(friendship, currentUserId),
    canChat: friendship.status === 'ACCEPTED',
  }
}

async function sendFriendRequest(currentUserId, targetUserId) {
  const friendship = await findOrCreateByUsers(currentUserId, targetUserId)
  const state = resolveUserViewState(friendship, currentUserId)

  state.sendRequest(friendship, currentUserId, targetUserId)
  await save(friendship)

  return {
    targetUserId,
    relationshipState: mapRelationshipState(friendship, currentUserId),
  }
}

async function cancelFriendRequest(currentUserId, targetUserId) {
  const friendship = await findOrCreateByUsers(currentUserId, targetUserId)
  const state = resolveUserViewState(friendship, currentUserId)

  state.cancelRequest(friendship, currentUserId, targetUserId)
  await save(friendship)

  return {
    targetUserId,
    relationshipState: mapRelationshipState(friendship, currentUserId),
  }
}

async function acceptFriendRequest(currentUserId, targetUserId) {
  const friendship = await findOrCreateByUsers(currentUserId, targetUserId)
  const state = resolveUserViewState(friendship, currentUserId)

  state.acceptRequest(friendship, currentUserId, targetUserId)
  await save(friendship)

  return {
    targetUserId,
    relationshipState: mapRelationshipState(friendship, currentUserId),
  }
}

async function blockUser(currentUserId, targetUserId) {
  const friendship = await findOrCreateByUsers(currentUserId, targetUserId)
  const state = resolveUserViewState(friendship, currentUserId)

  state.blockUser(friendship, currentUserId, targetUserId)
  await save(friendship)

  return {
    targetUserId,
    relationshipState: mapRelationshipState(friendship, currentUserId),
  }
}

async function unblockUser(currentUserId, targetUserId) {
  const friendship = await findOrCreateByUsers(currentUserId, targetUserId)
  const state = resolveUserViewState(friendship, currentUserId)

  state.unblockUser(friendship, currentUserId, targetUserId)
  await save(friendship)

  return {
    targetUserId,
    relationshipState: mapRelationshipState(friendship, currentUserId),
  }
}

async function listFriendships(currentUserId) {
  const friendships = await findAllByUser(currentUserId)

  const uniqueIds = [...new Set(friendships.flatMap((f) => [f.userAId, f.userBId]))]

  const usernameMap = {}
  if (uniqueIds.length > 0) {
    const { data: clerkUsers } = await clerkClient.users.getUserList({
      userId: uniqueIds,
      limit: uniqueIds.length,
    })
    for (const u of clerkUsers) {
      usernameMap[u.id] = u.username || null
    }
  }

  return friendships.map((f) => ({
    userAId: f.userAId,
    userBId: f.userBId,
    userAUsername: usernameMap[f.userAId] || null,
    userBUsername: usernameMap[f.userBId] || null,
    status: f.status,
    requestedBy: f.requestedBy,
    blockedBy: f.blockedBy,
    relationshipState: mapRelationshipState(f, currentUserId),
  }))
}

module.exports = {
  getFriendshipState,
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  blockUser,
  unblockUser,
  listFriendships,
}
