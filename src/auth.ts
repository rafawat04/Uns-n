import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { Context, Next } from 'hono'

type Env = {
  Bindings: {
    ADMIN_EMAIL?: string
    ADMIN_PASSWORD?: string
    SESSION_COOKIE_NAME?: string
    USER_COOKIE_NAME?: string
  }
}

export type SessionUser = {
  id: string
  email: string
  name: string
  role: 'user' | 'editor' | 'admin'
}

const sessions = new Map<string, SessionUser>()
const DEFAULT_EMAIL = 'admin@unsn.local'
const DEFAULT_PASSWORD = 'admin123'

const getCookieName = (c: Context<Env>) => c.env.SESSION_COOKIE_NAME || 'unsn_session'
const getUserCookieName = (c: Context<Env>) => c.env.USER_COOKIE_NAME || 'unsn_user'

const createSessionId = () => {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export const getCurrentUser = (c: Context<Env>) => {
  const sessionId = getCookie(c, getCookieName(c))
  return sessionId ? sessions.get(sessionId) ?? null : null
}

export const requireAuth = async (c: Context<Env>, next: Next) => {
  const user = getCurrentUser(c)
  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return c.json({ error: 'Authentication required' }, 401)
  }

  c.set('user', user)
  await next()
}

export const login = (c: Context<Env>, email: string, password: string) => {
  const adminEmail = c.env.ADMIN_EMAIL || DEFAULT_EMAIL
  const adminPassword = c.env.ADMIN_PASSWORD || DEFAULT_PASSWORD

  if (email !== adminEmail || password !== adminPassword) {
    return null
  }

  const sessionId = createSessionId()
  const user: SessionUser = {
    id: 'admin',
    email: adminEmail,
    name: 'UNS-N Editor',
    role: 'admin'
  }

  sessions.set(sessionId, user)
  setCookie(c, getCookieName(c), sessionId, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: new URL(c.req.url).protocol === 'https:',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  })

  return user
}

export const getCurrentSiteUser = (c: Context<Env>) => {
  const sessionId = getCookie(c, getUserCookieName(c))
  return sessionId ? sessions.get(sessionId) ?? null : null
}

export const loginSiteUser = (c: Context<Env>, email: string, name?: string) => {
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return null
  }

  const sessionId = createSessionId()
  const user: SessionUser = {
    id: `user-${normalizedEmail}`,
    email: normalizedEmail,
    name: name?.trim() || normalizedEmail.split('@')[0] || 'UNS-N Reader',
    role: 'user'
  }

  sessions.set(sessionId, user)
  setCookie(c, getUserCookieName(c), sessionId, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: new URL(c.req.url).protocol === 'https:',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  })

  return user
}

export const logout = (c: Context<Env>) => {
  const cookieName = getCookieName(c)
  const sessionId = getCookie(c, cookieName)

  if (sessionId) {
    sessions.delete(sessionId)
  }

  deleteCookie(c, cookieName, { path: '/' })
}

export const logoutSiteUser = (c: Context<Env>) => {
  const cookieName = getUserCookieName(c)
  const sessionId = getCookie(c, cookieName)

  if (sessionId) {
    sessions.delete(sessionId)
  }

  deleteCookie(c, cookieName, { path: '/' })
}
