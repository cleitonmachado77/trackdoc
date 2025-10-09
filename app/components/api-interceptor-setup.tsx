"use client"

import { useEffect } from 'react'
import { setupAPIInterceptor } from '@/lib/api-interceptor'

export function APIInterceptorSetup() {
  useEffect(() => {
    setupAPIInterceptor()
  }, [])

  return null
}