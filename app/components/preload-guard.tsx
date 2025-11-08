"use client"

import React from 'react'
import { ProfileProvider } from './profile-context'

interface PreloadGuardProps {
  children: React.ReactNode
}

export function PreloadGuard({ children }: PreloadGuardProps) {
  return (
    <ProfileProvider>
      {children}
    </ProfileProvider>
  )
}
