/**
 * Make a user an admin by email.
 * Usage: pnpm tsx scripts/make-admin.ts user@example.com
 */
import 'dotenv/config'
import mongoose from 'mongoose'

const email = process.argv[2]

if (!email) {
  console.error('Usage: pnpm tsx scripts/make-admin.ts <email>')
  process.exit(1)
}

const MONGODB_URL = process.env.MONGODB_URL
if (!MONGODB_URL) {
  console.error('MONGODB_URL not set in environment')
  process.exit(1)
}

async function main() {
  await mongoose.connect(MONGODB_URL!)

  const UserSchema = new mongoose.Schema({
    email:    String,
    role:     String,
    username: String,
  }, { strict: false })

  const User = mongoose.models.User || mongoose.model('User', UserSchema)

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { $set: { role: 'admin' } },
    { new: true }
  )

  if (!user) {
    console.error(`No user found with email: ${email}`)
    process.exit(1)
  }

  console.log(`✓ ${user.username || user.email} is now an admin`)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
