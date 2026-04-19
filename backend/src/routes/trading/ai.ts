import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../../middleware/auth'
import axios from 'axios'

const router = Router()

const OLLAMA_BASE = 'http://localhost:11434'

// List available models
router.get('/models', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const response = await axios.get(`${OLLAMA_BASE}/api/tags`)
    res.json(response.data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch models. Is Ollama running?' })
  }
})

// Chat completion
router.post('/chat', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { model, messages, images } = req.body

    if (!model || !messages) {
      res.status(400).json({ error: 'model and messages are required' })
      return
    }

    const response = await axios.post(`${OLLAMA_BASE}/api/chat`, {
      model,
      messages,
      stream: false
    }, {
      timeout: 300000 // 5 min timeout for slow CPU inference
    })

    res.json(response.data)
  } catch (err: any) {
    console.error('AI chat error:', err.message)
    res.status(500).json({ error: err.message || 'Failed to get AI response' })
  }
})

// Generate with image (vision models)
router.post('/vision', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { model, prompt, images } = req.body

    if (!model || !prompt || !images) {
      res.status(400).json({ error: 'model, prompt, and images are required' })
      return
    }

    const response = await axios.post(`${OLLAMA_BASE}/api/generate`, {
      model,
      prompt,
      images, // base64 encoded images
      stream: false
    }, {
      timeout: 300000
    })

    res.json(response.data)
  } catch (err: any) {
    console.error('AI vision error:', err.message)
    res.status(500).json({ error: err.message || 'Failed to analyse image' })
  }
})

// Pull a new model
router.post('/models/pull', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body
    if (!name) {
      res.status(400).json({ error: 'Model name is required' })
      return
    }

    const response = await axios.post(`${OLLAMA_BASE}/api/pull`, {
      name,
      stream: false
    }, {
      timeout: 600000 // 10 min for large model downloads
    })

    res.json(response.data)
  } catch (err: any) {
    console.error('Model pull error:', err.message)
    res.status(500).json({ error: err.message || 'Failed to pull model' })
  }
})

// Delete a model
router.delete('/models/:name', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.params
    await axios.delete(`${OLLAMA_BASE}/api/delete`, {
      data: { name: name as string }
    })
    res.json({ success: true })
  } catch (err: any) {
    console.error('Model delete error:', err.message)
    res.status(500).json({ error: err.message || 'Failed to delete model' })
  }
})

export default router