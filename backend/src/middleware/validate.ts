import { Request, Response, NextFunction } from 'express'

const MAX_STRING_LENGTH = 500
const MAX_TEXT_LENGTH = 5000

// Fields that can be longer (descriptions, notes, etc)
const LONG_TEXT_FIELDS = ['description', 'notes', 'bio', 'content']

// Trim all string values and enforce max lengths
export const sanitizeBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        // Trim whitespace
        req.body[key] = req.body[key].trim()

        // Check length
        const maxLen = LONG_TEXT_FIELDS.includes(key) ? MAX_TEXT_LENGTH : MAX_STRING_LENGTH
        if (req.body[key].length > maxLen) {
          res.status(400).json({ error: `${key} must be ${maxLen} characters or less` })
          return
        }
      }
    }
  }
  next()
}