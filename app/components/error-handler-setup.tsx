"use client"

import { useEffect } from 'react'
import { setupGlobalErrorHandler } from '@/lib/error-handler'

export function ErrorHandlerSetup() {
  useEffect(() => {
    setupGlobalErrorHandler()
  }, [])

  return null
}