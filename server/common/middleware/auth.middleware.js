const { getAuth } = require('@clerk/express')

function authMiddleware(req, res, next) {
  try {
    const auth = getAuth(req)

    if (!auth || !auth.userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    req.auth = auth
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}

module.exports = { authMiddleware }
