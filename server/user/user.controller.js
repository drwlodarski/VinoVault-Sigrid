const { createClerkClient } = require('@clerk/backend')

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

async function getMe(req, res, next) {
  try {
    const userId = req.auth.userId
    const clerkUser = await clerkClient.users.getUser(userId)

    return res.status(200).json({
      data: {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        username: clerkUser.username || '',
        profile: {},
      },
    })
  } catch (error) {
    next(error)
  }
}

async function updateUsername(req, res, next) {
  try {
    const userId = req.auth.userId
    const { username } = req.body

    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ message: 'username is required' })
    }

    const trimmed = username.trim()

    const updated = await clerkClient.users.updateUser(userId, {
      username: trimmed,
    })

    return res.status(200).json({
      data: {
        clerkId: updated.id,
        email: updated.emailAddresses[0]?.emailAddress || '',
        username: updated.username || '',
        profile: {},
      },
    })
  } catch (error) {
    if (error?.errors?.[0]?.code === 'form_identifier_exists') {
      return res.status(409).json({ message: 'Username already taken' })
    }
    next(error)
  }
}

module.exports = { getMe, updateUsername }
