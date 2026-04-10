import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db/connect'
import User from '@/lib/db/models/User'

export const { auth, handlers, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/login',
    error:  '/auth/login',
  },
  providers: [
    Credentials({
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const schema = z.object({
          email:    z.string().email(),
          password: z.string().min(1),
        })
        const parsed = schema.safeParse(credentials)
        if (!parsed.success) return null

        await connectDB()
        const user = await User.findOne({ email: parsed.data.email }).lean<{
          _id: import('mongoose').Types.ObjectId
          email: string
          passwordHash: string
          username: string
          role: string
          xp: number
          level: number
          avatar: string
        }>()

        if (!user) return null

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) return null

        return {
          id:       user._id.toString(),
          email:    user.email,
          username: user.username,
          role:     user.role,
          xp:       user.xp,
          level:    user.level,
          avatar:   user.avatar ?? '',
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id       = user.id!
        token.username = user.username
        token.role     = user.role
        token.xp       = user.xp
        token.level    = user.level
        token.avatar   = user.avatar
      }
      if (trigger === 'update') {
        await connectDB()
        const fresh = await User.findById(token.id)
          .select('avatar username displayName')
          .lean<{ avatar?: string; username?: string }>()
        if (fresh) {
          token.avatar   = fresh.avatar   ?? token.avatar
          token.username = fresh.username ?? token.username
        }
      }
      return token
    },
    session({ session, token }) {
      session.user.id       = token.id as string
      session.user.username = token.username as string
      session.user.role     = token.role as string
      session.user.xp       = token.xp as number
      session.user.level    = token.level as number
      session.user.avatar   = token.avatar as string
      return session
    },
  },
})
