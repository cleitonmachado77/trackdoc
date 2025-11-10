// Declarações de tipos para componentes de UI
// Este arquivo corrige problemas de tipagem dos componentes

import * as React from 'react'

declare module '@/components/ui/dialog' {
  export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string
  }
  
  export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
    className?: string
  }
}

declare module '@/components/ui/label' {
  export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    htmlFor?: string
    className?: string
  }
}

declare module '@/components/ui/button' {
  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
    disabled?: boolean
    className?: string
  }
}

declare module '@/components/ui/badge' {
  export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'outline' | 'secondary' | 'destructive'
    className?: string
  }
}

declare module '@/components/ui/tabs' {
  export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: string
    onValueChange?: (value: string) => void
    defaultValue?: string
    className?: string
  }
  
  export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string
  }
  
  export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    value: string
    disabled?: boolean
    className?: string
  }
  
  export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string
    className?: string
  }
}

declare module 'lucide-react' {
  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    className?: string
    size?: number | string
    color?: string
    strokeWidth?: number | string
  }
}
