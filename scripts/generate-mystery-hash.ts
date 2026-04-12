import bcrypt from 'bcryptjs'

const password = process.argv[2]
if (!password) {
  console.log('Usage: pnpm tsx scripts/generate-mystery-hash.ts YOUR_PASSWORD')
  process.exit(1)
}

const hash = await bcrypt.hash(password, 12)
console.log('Add to .env.local:')
console.log(`MYSTERY_BOX_PASSWORD_HASH=${hash}`)
