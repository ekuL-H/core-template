// Core types shared across all modules
export interface User {
  id: string
  email: string
  createdAt: string
}

export interface Workspace {
  id: string
  name: string
  module: string
  createdAt: string
}