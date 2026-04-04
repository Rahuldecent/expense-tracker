import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const adminEmail = process.env.ADMIN_EMAIL
        const adminPassword = process.env.ADMIN_PASSWORD

        if (!adminEmail || !adminPassword) {
          throw new Error('Admin credentials not configured')
        }

        if (credentials.email.toLowerCase() !== adminEmail.toLowerCase()) {
          throw new Error('Invalid credentials')
        }

        // Support both plain text and bcrypt hashed passwords
        let passwordValid = false
        if (adminPassword.startsWith('$2')) {
          passwordValid = await bcrypt.compare(credentials.password, adminPassword)
        } else {
          passwordValid = credentials.password === adminPassword
        }

        if (!passwordValid) {
          throw new Error('Invalid credentials')
        }

        return {
          id: '1',
          email: adminEmail,
          name: 'Admin',
          role: 'admin',
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
