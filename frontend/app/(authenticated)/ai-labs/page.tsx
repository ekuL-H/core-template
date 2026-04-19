'use client'

import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import AppShell from '@/components/layout/AppShell'
import { Send, Bot, User, Loader2, Image, X, Settings, ChevronDown } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  images?: string[]
}

interface Model {
  name: string
  size: number
  details: {
    parameter_size: string
    quantization_level: string
  }
}

export default function AILabsPage() {
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingImages, setPendingImages] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchModels()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchModels = async () => {
    try {
      const data = await api.getModels()
      setModels(data.models || [])
      if (data.models?.length > 0 && !selectedModel) {
        setSelectedModel(data.models[0].name)
      }
    } catch (err) {
      console.error('Failed to fetch models', err)
    }
  }

  const handleSend = async () => {
    if (!input.trim() && pendingImages.length === 0) return
    if (!selectedModel) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      images: pendingImages.length > 0 ? pendingImages : undefined
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setPendingImages([])
    setLoading(true)

    try {
      let data: any

      if (userMessage.images && userMessage.images.length > 0) {
        // Vision request
        data = await api.aiVision(selectedModel, userMessage.content, userMessage.images)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response
        }])
      } else {
        // Chat request
        const chatMessages = [...messages, userMessage].map(m => ({
          role: m.role,
          content: m.content
        }))
        data = await api.aiChat(selectedModel, chatMessages)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message?.content || data.response || 'No response'
        }])
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${err.message || 'Failed to get response'}`
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        setPendingImages(prev => [...prev, base64])
      }
      reader.readAsDataURL(file)
    })

    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removePendingImage = (index: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== index))
  }

  const formatSize = (bytes: number) => {
    const gb = bytes / 1024 / 1024 / 1024
    return gb >= 1 ? `${gb.toFixed(1)}GB` : `${(bytes / 1024 / 1024).toFixed(0)}MB`
  }

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-130px)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <h1 className="text-lg font-semibold text-foreground">AI Labs</h1>

          {/* Model selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md border border-input text-foreground hover:bg-accent transition-colors"
            >
              <Bot className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{selectedModel || 'No models'}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>

            {showModelDropdown && (
              <div className="absolute top-full right-0 mt-1 z-50 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[220px]">
                {models.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No models installed</p>
                )}
                {models.map(model => (
                  <button
                    key={model.name}
                    onClick={() => {
                      setSelectedModel(model.name)
                      setShowModelDropdown(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors ${
                      selectedModel === model.name ? 'text-foreground font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    <div>{model.name}</div>
                    <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {model.details.parameter_size} · {model.details.quantization_level} · {formatSize(model.size)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto min-h-0 border border-border rounded-lg bg-card p-4 mb-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Bot className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Start a conversation</p>
              <p className="text-xs mt-1 opacity-60">Using {selectedModel || 'no model selected'}</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 mb-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2'
                  : 'text-foreground'
              }`}>
                {msg.images && msg.images.length > 0 && (
                  <div className="flex gap-2 mb-2">
                    {msg.images.map((img, j) => (
                      <img
                        key={j}
                        src={`data:image/png;base64,${img}`}
                        className="w-20 h-20 object-cover rounded-md border border-border"
                        alt="Uploaded"
                      />
                    ))}
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 mb-4">
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-xs">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Pending images */}
        {pendingImages.length > 0 && (
          <div className="flex gap-2 mb-2 flex-shrink-0">
            {pendingImages.map((img, i) => (
              <div key={i} className="relative">
                <img
                  src={`data:image/png;base64,${img}`}
                  className="w-16 h-16 object-cover rounded-md border border-border"
                  alt="Pending"
                />
                <button
                  onClick={() => removePendingImage(i)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="flex items-end gap-2 flex-shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            multiple
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-md border border-input text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex-shrink-0"
            title="Attach image"
          >
            <Image className="w-4 h-4" />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={selectedModel ? "Ask anything..." : "No model selected"}
              disabled={!selectedModel || loading}
              rows={1}
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={(!input.trim() && pendingImages.length === 0) || !selectedModel || loading}
            className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </AppShell>
  )
}