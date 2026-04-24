import { createClerkClient } from '@clerk/backend'
import { User, type IUser } from './models/User'

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
})

export async function findOrCreateUserFromClerk(clerkId: string): Promise<IUser | null> {
  const existingUser = await User.findOne({ clerkId })
  if (existingUser) return existingUser

  const clerkUser = await clerkClient.users.getUser(clerkId)
  const primaryEmail =
    clerkUser.emailAddresses.find((email) => email.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress

  if (!primaryEmail) {
    return null
  }

  return User.findOneAndUpdate(
    { clerkId },
    {
      clerkId,
      email: primaryEmail,
      username: clerkUser.username ?? '',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
}
