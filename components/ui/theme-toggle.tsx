'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

// Versão simplificada para usar como botão simples
export function SimpleThemeToggle() {
    const { setTheme, theme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Button variant="ghost" size="sm" className="h-9 w-9 px-0">
                <Sun className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Alternar tema</span>
            </Button>
        )
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 px-0"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Alternar tema</span>
        </Button>
    )
}

// Versão com dropdown (importação lazy para evitar problemas)
export function ThemeToggle() {
    const { setTheme, theme } = useTheme()
    const [mounted, setMounted] = React.useState(false)
    const [showDropdown, setShowDropdown] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <SimpleThemeToggle />
    }

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 px-0"
                onClick={() => setShowDropdown(!showDropdown)}
            >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Alternar tema</span>
            </Button>

            {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-32 bg-popover border border-border rounded-md shadow-lg z-50">
                    <div className="p-1">
                        <button
                            className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm flex items-center"
                            onClick={() => {
                                setTheme('light')
                                setShowDropdown(false)
                            }}
                        >
                            <Sun className="mr-2 h-4 w-4" />
                            Claro
                        </button>
                        <button
                            className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm flex items-center"
                            onClick={() => {
                                setTheme('dark')
                                setShowDropdown(false)
                            }}
                        >
                            <Moon className="mr-2 h-4 w-4" />
                            Escuro
                        </button>
                        <button
                            className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm flex items-center"
                            onClick={() => {
                                setTheme('system')
                                setShowDropdown(false)
                            }}
                        >
                            <span className="mr-2">💻</span>
                            Sistema
                        </button>
                    </div>
                </div>
            )}

            {showDropdown && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                />
            )}
        </div>
    )
}