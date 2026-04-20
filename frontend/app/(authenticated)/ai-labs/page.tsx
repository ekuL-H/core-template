'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import AppShell from '@/components/layout/AppShell'
import { Send, Bot, User, Loader2, Image, X, ChevronDown, Plus, Trash2, Upload, Tag, FileText, ImageIcon, FolderOpen } from 'lucide-react'

type Tab = 'chat' | 'models' | 'datasets' | 'training'

const TABS: { key: Tab; label: string }[] = [
  { key: 'chat', label: 'Chat' },
  { key: 'models', label: 'Models' },
  { key: 'datasets', label: 'Datasets' },
  { key: 'training', label: 'Training' },
]

const DATASET_COLORS = [
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#22c55e', '#f97316', '#ef4444', '#64748b',
]

// ─── Chat types ───
interface Message {
  role: 'user' | 'assistant'
  content: string
  images?: string[]
}

interface Model {
  name: string
  size: number
  details: { parameter_size: string; quantization_level: string }
}

interface Dataset {
  id: string
  name: string
  description: string | null
  type: string
  color: string
  createdAt: string
  _count: { items: number }
}

interface DatasetDetail {
  id: string
  name: string
  description: string | null
  type: string
  color: string
  items: DatasetItem[]
}

interface DatasetItem {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  label: string | null
  notes: string | null
  tags: string[]
  createdAt: string
}

export default function AILabsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('chat')

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center justify-between mb-0">
        <h1 className="text-lg font-semibold text-foreground">AI Labs</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mt-2 mb-0">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-xs font-medium transition-colors relative ${
                activeTab === tab.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'chat' && <ChatTab />}
      {activeTab === 'models' && <ModelsTab />}
      {activeTab === 'datasets' && <DatasetsTab />}
      {activeTab === 'training' && <TrainingTab />}
    </AppShell>
  )
}

// ─── Chat Tab ───
function ChatTab() {
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState('')
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingImages, setPendingImages] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchModels() }, [])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const fetchModels = async () => {
    try {
      const data = await api.getModels()
      setModels(data.models || [])
      if (data.models?.length > 0 && !selectedModel) setSelectedModel(data.models[0].name)
    } catch (err) { console.error('Failed to fetch models', err) }
  }

  const handleSend = async () => {
    if (!input.trim() && pendingImages.length === 0) return
    if (!selectedModel) return

    const userMessage: Message = { role: 'user', content: input.trim(), images: pendingImages.length > 0 ? pendingImages : undefined }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setPendingImages([])
    setLoading(true)

    try {
      let data: any
      if (userMessage.images && userMessage.images.length > 0) {
        data = await api.aiVision(selectedModel, userMessage.content, userMessage.images)
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      } else {
        const chatMessages = [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
        data = await api.aiChat(selectedModel, chatMessages)
        setMessages(prev => [...prev, { role: 'assistant', content: data.message?.content || data.response || 'No response' }])
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message || 'Failed to get response'}` }])
    } finally { setLoading(false) }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = () => setPendingImages(prev => [...prev, (reader.result as string).split(',')[1]])
      reader.readAsDataURL(file)
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 220px)' }}>
      {/* Model selector */}
      <div className="flex items-center justify-end py-2 flex-shrink-0">
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
              {models.map(model => (
                <button
                  key={model.name}
                  onClick={() => { setSelectedModel(model.name); setShowModelDropdown(false) }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors ${
                    selectedModel === model.name ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}
                >
                  <div>{model.name}</div>
                  <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {model.details.parameter_size} · {model.details.quantization_level}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
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
              msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2' : 'text-foreground'
            }`}>
              {msg.images && msg.images.length > 0 && (
                <div className="flex gap-2 mb-2">
                  {msg.images.map((img, j) => (
                    <img key={j} src={`data:image/png;base64,${img}`} className="w-20 h-20 object-cover rounded-md border border-border" alt="Uploaded" />
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
              <img src={`data:image/png;base64,${img}`} className="w-16 h-16 object-cover rounded-md border border-border" alt="Pending" />
              <button onClick={() => setPendingImages(prev => prev.filter((_, j) => j !== i))}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-end gap-2 flex-shrink-0">
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple className="hidden" />
        <button onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-md border border-input text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex-shrink-0" title="Attach image">
          <Image className="w-4 h-4" />
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder={selectedModel ? "Ask anything..." : "No model selected"}
          disabled={!selectedModel || loading}
          rows={1}
          className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none disabled:opacity-50"
        />
        <button onClick={handleSend}
          disabled={(!input.trim() && pendingImages.length === 0) || !selectedModel || loading}
          className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Models Tab ───
function ModelsTab() {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [pullName, setPullName] = useState('')
  const [pulling, setPulling] = useState(false)

  useEffect(() => { fetchModels() }, [])

  const fetchModels = async () => {
    setLoading(true)
    try {
      const data = await api.getModels()
      setModels(data.models || [])
    } catch (err) { console.error('Failed to fetch models', err) }
    finally { setLoading(false) }
  }

  const handlePull = async () => {
    if (!pullName.trim()) return
    setPulling(true)
    try {
      await api.pullModel(pullName.trim())
      setPullName('')
      fetchModels()
    } catch (err) { console.error('Failed to pull model', err) }
    finally { setPulling(false) }
  }

  const handleDelete = async (name: string) => {
    try {
      await api.deleteModel(name)
      fetchModels()
    } catch (err) { console.error('Failed to delete model', err) }
  }

  const formatSize = (bytes: number) => {
    const gb = bytes / 1024 / 1024 / 1024
    return gb >= 1 ? `${gb.toFixed(1)}GB` : `${(bytes / 1024 / 1024).toFixed(0)}MB`
  }

  return (
    <div className="mt-4">
      {/* Pull new model */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Model name (e.g. llava:7b, qwen2.5:3b)"
          value={pullName}
          onChange={(e) => setPullName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePull()}
          className="flex-1 max-w-md px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          onClick={handlePull}
          disabled={pulling || !pullName.trim()}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pulling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          {pulling ? 'Pulling...' : 'Pull Model'}
        </button>
      </div>

      {loading && <p className="text-xs text-muted-foreground">Loading models...</p>}

      {!loading && models.length === 0 && (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Bot className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No models installed</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Pull a model to get started</p>
        </div>
      )}

      <div className="space-y-2">
        {models.map(model => (
          <div key={model.name} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-card-foreground">{model.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {model.details.parameter_size} · {model.details.quantization_level} · {formatSize(model.size)}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDelete(model.name)}
              className="p-1 rounded hover:bg-destructive/10"
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Datasets Tab ───
function DatasetsTab() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDataset, setSelectedDataset] = useState<DatasetDetail | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newType, setNewType] = useState('images')
  const [newColor, setNewColor] = useState(DATASET_COLORS[0])

  // Upload state
  const [uploading, setUploading] = useState(false)
  const [uploadLabel, setUploadLabel] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Edit item state
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editNotes, setEditNotes] = useState('')

  useEffect(() => { fetchDatasets() }, [])

  const fetchDatasets = async () => {
    setLoading(true)
    try {
      const data = await api.getDatasets()
      setDatasets(data)
    } catch (err) { console.error('Failed to fetch datasets', err) }
    finally { setLoading(false) }
  }

  const openDataset = async (id: string) => {
    try {
      const data = await api.getDataset(id)
      setSelectedDataset(data)
    } catch (err) { console.error('Failed to fetch dataset', err) }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      const ds = await api.createDataset({ name: newName.trim(), description: newDesc.trim() || undefined, type: newType, color: newColor })
      setShowCreate(false)
      setNewName('')
      setNewDesc('')
      setNewType('images')
      setNewColor(DATASET_COLORS[0])
      fetchDatasets()
      openDataset(ds.id)
    } catch (err) { console.error('Failed to create dataset', err) }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.deleteDataset(id)
      if (selectedDataset?.id === id) setSelectedDataset(null)
      fetchDatasets()
    } catch (err) { console.error('Failed to delete dataset', err) }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedDataset || !e.target.files) return
    setUploading(true)
    try {
      await api.uploadDatasetItems(selectedDataset.id, Array.from(e.target.files), uploadLabel || undefined)
      setUploadLabel('')
      openDataset(selectedDataset.id)
      fetchDatasets()
    } catch (err) { console.error('Failed to upload', err) }
    finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!selectedDataset) return
    try {
      await api.deleteDatasetItem(selectedDataset.id, itemId)
      openDataset(selectedDataset.id)
      fetchDatasets()
    } catch (err) { console.error('Failed to delete item', err) }
  }

  const handleUpdateItem = async (itemId: string) => {
    if (!selectedDataset) return
    try {
      await api.updateDatasetItem(selectedDataset.id, itemId, { label: editLabel, notes: editNotes })
      setEditingItemId(null)
      openDataset(selectedDataset.id)
    } catch (err) { console.error('Failed to update item', err) }
  }

  const formatSize = (bytes: number) => {
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`
    return `${(bytes / 1024).toFixed(0)}KB`
  }

  // Dataset detail view
  if (selectedDataset) {
    return (
      <div className="mt-4">
        {/* Back + info bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedDataset(null)} className="text-xs text-muted-foreground hover:text-foreground">
              ← Back
            </button>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedDataset.color }} />
            <h2 className="text-sm font-semibold text-foreground">{selectedDataset.name}</h2>
            <span className="text-xs text-muted-foreground">{selectedDataset.items.length} items</span>
          </div>
        </div>

        {/* Upload area */}
        <div className="flex items-center gap-2 py-2 border-b border-border mb-3">
          <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/*,.pdf,.txt,.md" multiple className="hidden" />
          <div className="relative flex-1 max-w-xs">
            <Tag className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Label for upload..."
              value={uploadLabel}
              onChange={(e) => setUploadLabel(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            {uploading ? 'Uploading...' : 'Upload Files'}
          </button>
        </div>

        {/* Items grid */}
        {selectedDataset.items.length === 0 && (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No items yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Upload images or documents to get started</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {selectedDataset.items.map(item => (
            <div key={item.id} className="group relative rounded-lg border border-border bg-card overflow-hidden">
              {/* Thumbnail */}
              {item.fileType.startsWith('image/') ? (
                <div className="aspect-square bg-muted">
                  <img
                    src={api.getDatasetItemFile(selectedDataset.id, item.id)}
                    alt={item.fileName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-muted flex items-center justify-center">
                  <FileText className="w-8 h-8 text-muted-foreground/40" />
                </div>
              )}

              {/* Info */}
              <div className="p-2">
                <p className="text-[11px] text-card-foreground truncate">{item.fileName}</p>
                <div className="flex items-center gap-1 mt-1">
                  {item.label && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{item.label}</span>
                  )}
                  <span className="text-[9px] text-muted-foreground">{formatSize(item.fileSize)}</span>
                </div>
              </div>

              {/* Hover actions */}
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { setEditingItemId(item.id); setEditLabel(item.label || ''); setEditNotes(item.notes || '') }}
                  className="p-1 rounded bg-card/80 hover:bg-accent border border-border"
                >
                  <Tag className="w-3 h-3 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1 rounded bg-card/80 hover:bg-destructive/10 border border-border"
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Edit item modal */}
        {editingItemId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-popover rounded-lg border border-border p-6 w-full max-w-sm mx-4">
              <h2 className="text-sm font-semibold text-popover-foreground mb-4">Edit Item</h2>
              <div className="mb-3">
                <label className="text-xs text-muted-foreground mb-1 block">Label</label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="e.g. valid_setup, entry_signal"
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="mb-4">
                <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditingItemId(null)} className="px-3 py-1.5 text-xs rounded-md text-muted-foreground hover:bg-accent">Cancel</button>
                <button onClick={() => handleUpdateItem(editingItemId)} className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Dataset list view
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">Organise training data for your models</p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-3.5 h-3.5" />
          New Dataset
        </button>
      </div>

      {loading && <p className="text-xs text-muted-foreground">Loading datasets...</p>}

      {!loading && datasets.length === 0 && (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <FolderOpen className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No datasets yet</p>
          <button onClick={() => setShowCreate(true)} className="text-xs text-primary hover:text-primary/80 font-medium mt-2">
            Create your first dataset
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {datasets.map(ds => (
          <div
            key={ds.id}
            className="group relative rounded-lg border border-border bg-card overflow-hidden cursor-pointer hover:border-border/80 hover:shadow-sm transition-all"
            onClick={() => openDataset(ds.id)}
          >
            <div className="h-1.5" style={{ backgroundColor: ds.color }} />
            <div className="p-4">
              <h3 className="text-sm font-medium text-card-foreground mb-1">{ds.name}</h3>
              <p className="text-xs text-muted-foreground">
                {ds._count.items} {ds._count.items === 1 ? 'item' : 'items'} · {ds.type}
              </p>
            </div>
            <div className="absolute top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={(e) => { e.stopPropagation(); handleDelete(ds.id) }} className="p-1 rounded hover:bg-destructive/10">
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-popover rounded-lg border border-border p-6 w-full max-w-sm mx-4">
            <h2 className="text-sm font-semibold text-popover-foreground mb-4">New Dataset</h2>
            <input
              type="text" placeholder="Dataset name" value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()} autoFocus
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring mb-3"
            />
            <input
              type="text" placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring mb-3"
            />
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-2">Type</p>
              <div className="flex gap-1.5">
                {['images', 'documents', 'mixed'].map(t => (
                  <button
                    key={t}
                    onClick={() => setNewType(t)}
                    className={`px-3 py-1.5 text-[11px] rounded-md transition-colors ${
                      newType === t ? 'bg-primary text-primary-foreground' : 'border border-input text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Colour</p>
              <div className="flex gap-2">
                {DATASET_COLORS.map(c => (
                  <button key={c} onClick={() => setNewColor(c)}
                    className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                    style={{ backgroundColor: c, borderColor: newColor === c ? 'white' : 'transparent', boxShadow: newColor === c ? `0 0 0 2px ${c}` : 'none' }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowCreate(false); setNewName(''); setNewDesc('') }} className="px-3 py-1.5 text-xs rounded-md text-muted-foreground hover:bg-accent">Cancel</button>
              <button onClick={handleCreate} className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Training Tab ───
function TrainingTab() {
  return (
    <div className="mt-4 text-center py-12">
      <p className="text-sm text-muted-foreground">Training — coming soon</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Fine-tune models on your datasets</p>
    </div>
  )
}