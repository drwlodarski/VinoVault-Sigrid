class NoFriendshipState {
  getName() {
    return 'NO_FRIENDSHIP'
  }

  sendRequest(friendship, actorId, targetId) {
    friendship.status = 'PENDING'
    friendship.requestedBy = actorId
    friendship.blockedBy = null
    return friendship
  }

  cancelRequest() {
    throw new Error('Cannot cancel request when there is no friendship request.')
  }

  acceptRequest() {
    throw new Error('Cannot accept request when there is no incoming request.')
  }

  blockUser(friendship, actorId) {
    friendship.status = 'BLOCKED'
    friendship.blockedBy = actorId
    friendship.requestedBy = null
    return friendship
  }

  startChat() {
    throw new Error('Private chat is only allowed for accepted friendship.')
  }

  unblockUser() {
    throw new Error('Cannot unblock user when there is no blocked friendship.')
  }
}

class RequestSentState {
  getName() {
    return 'REQUEST_SENT'
  }

  sendRequest() {
    throw new Error('Friend request already sent.')
  }

  cancelRequest(friendship) {
    friendship.status = 'NONE'
    friendship.requestedBy = null
    friendship.blockedBy = null
    return friendship
  }

  acceptRequest() {
    throw new Error('You cannot accept a request you sent.')
  }

  blockUser(friendship, actorId) {
    friendship.status = 'BLOCKED'
    friendship.blockedBy = actorId
    friendship.requestedBy = null
    return friendship
  }

  startChat() {
    throw new Error('Private chat is only allowed for accepted friendship.')
  }

  unblockUser() {
    throw new Error('Cannot unblock because user is not blocked.')
  }
}

class RequestReceivedState {
  getName() {
    return 'REQUEST_RECEIVED'
  }

  sendRequest() {
    throw new Error('You already have a pending incoming request.')
  }

  cancelRequest(friendship) {
    friendship.status = 'NONE'
    friendship.requestedBy = null
    friendship.blockedBy = null
    return friendship
  }

  acceptRequest(friendship) {
    friendship.status = 'ACCEPTED'
    friendship.requestedBy = null
    friendship.blockedBy = null
    return friendship
  }

  blockUser(friendship, actorId) {
    friendship.status = 'BLOCKED'
    friendship.blockedBy = actorId
    friendship.requestedBy = null
    return friendship
  }

  startChat() {
    throw new Error('Private chat is only allowed for accepted friendship.')
  }

  unblockUser() {
    throw new Error('Cannot unblock because user is not blocked.')
  }
}

class AcceptedFriendshipState {
  getName() {
    return 'ACCEPTED_FRIENDSHIP'
  }

  sendRequest() {
    throw new Error('Users are already friends.')
  }

  cancelRequest() {
    throw new Error('No pending request to cancel.')
  }

  acceptRequest() {
    throw new Error('Users are already friends.')
  }

  blockUser(friendship, actorId) {
    friendship.status = 'BLOCKED'
    friendship.blockedBy = actorId
    friendship.requestedBy = null
    return friendship
  }

  startChat(friendship) {
    return friendship
  }

  unblockUser() {
    throw new Error('Cannot unblock because user is not blocked.')
  }
}

class BlockedFriendshipState {
  getName() {
    return 'BLOCKED_FRIENDSHIP'
  }

  sendRequest() {
    throw new Error('Cannot send friend request because user is blocked.')
  }

  cancelRequest() {
    throw new Error('Cannot cancel request in blocked state.')
  }

  acceptRequest() {
    throw new Error('Cannot accept request in blocked state.')
  }

  blockUser() {
    throw new Error('User is already blocked.')
  }

  startChat() {
    throw new Error('Private chat is not allowed for blocked friendship.')
  }

  unblockUser(friendship, actorId) {
    if (friendship.blockedBy !== actorId) {
      throw new Error('Only the user who blocked can unblock.')
    }

    friendship.status = 'NONE'
    friendship.blockedBy = null
    friendship.requestedBy = null
    return friendship
  }
}

function resolveUserViewState(friendship, currentUserId) {
  if (friendship.status === 'NONE') return new NoFriendshipState()
  if (friendship.status === 'ACCEPTED') return new AcceptedFriendshipState()
  if (friendship.status === 'BLOCKED') return new BlockedFriendshipState()

  if (friendship.status === 'PENDING') {
    if (friendship.requestedBy === currentUserId) {
      return new RequestSentState()
    }
    return new RequestReceivedState()
  }

  throw new Error('Unknown friendship state.')
}

module.exports = {
  resolveUserViewState,
}
