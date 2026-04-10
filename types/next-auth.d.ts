import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
      role: string
      xp: number
      level: number
    } & DefaultSession['user']
  }
  interface User {
    id?: string
    username: string
    role: string
    xp: number
    level: number
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    role: string
    xp: number
    level: number
  }
}
