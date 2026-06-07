import type { LoginInput, SignupInput } from '../types/auth.js'

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: string[] }

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const stringValue = (value: unknown) => {
  return typeof value === 'string' ? value.trim() : ''
}

export const validateSignup = (body: unknown): ValidationResult<SignupInput> => {
  const errors: string[] = []

  if (!isRecord(body)) {
    return { ok: false, errors: ['Request body must be a JSON object.'] }
  }

  const name = stringValue(body.name)
  const email = stringValue(body.email).toLowerCase()
  const password = typeof body.password === 'string' ? body.password : ''

  if (name.length < 2) {
    errors.push('Name must be at least 2 characters long.')
  }

  if (!emailPattern.test(email)) {
    errors.push('Email must be a valid email address.')
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.')
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, data: { name, email, password } }
}

export const validateLogin = (body: unknown): ValidationResult<LoginInput> => {
  const errors: string[] = []

  if (!isRecord(body)) {
    return { ok: false, errors: ['Request body must be a JSON object.'] }
  }

  const email = stringValue(body.email).toLowerCase()
  const password = typeof body.password === 'string' ? body.password : ''

  if (!emailPattern.test(email)) {
    errors.push('Email must be a valid email address.')
  }

  if (password.length === 0) {
    errors.push('Password is required.')
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, data: { email, password } }
}
