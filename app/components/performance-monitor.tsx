"use client"

import { useState, useEffect, memo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Clock, Database, Zap, AlertTriangle, CheckCircle } from "lucide-react"

interface PerformanceMetrics {
  loadTime: number
  queryCount: number
  memoryUsage: number
  renderTime: number
  cacheHitRate: number
}

const PerformanceMonitor = memo(function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    queryCount: 0,
    memoryUsage: 0,
    renderTime: 0,
    cacheHitRate: 0
  })
  const [isVisible, setIsVisible] = useState(false)
  const [startTime] = useState(Date.now())

  useEffect(() => {
    // Simular coleta de métricas
    const interval = setInterval(() => {
      setMetrics({
        loadTime: Date.now() - startTime,
        queryCount: Math.floor(Math.random() * 10) + 5,
        memoryUsage: Math.random() * 50 + 20,
        renderTime: Math.random() * 100 + 50,
        cacheHitRate: Math.random() * 40 + 60
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [startTime])

  const getPerformanceStatus = (metric: string, value: number) => {
    switch (metric) {
      case 'loadTime':
        if (value < 1000) return { status: 'excellent', color: 'bg-green-500' }
        if (value < 2000) return { status: 'good', color: 'bg-yellow-500' }
        return { status: 'poor', color: 'bg-red-500' }
      
      case 'queryCount':
        if (value < 5) return { status: 'excellent', color: 'bg-green-500' }
        if (value < 10) return { status: 'good', color: 'bg-yellow-500' }
        return { status: 'poor', color: 'bg-red-500' }
      
      case 'memoryUsage':
        if (value < 30) return { status: 'excellent', color: 'bg-green-500' }
        if (value < 50) return { status: 'good', color: 'bg-yellow-500' }
        return { status: 'poor', color: 'bg-red-500' }
      
      case 'cacheHitRate':
        if (value > 80) return { status: 'excellent', color: 'bg-green-500' }
        if (value > 60) return { status: 'good', color: 'bg-yellow-500' }
        return { status: 'poor', color: 'bg-red-500' }
      
      default:
        return { status: 'unknown', color: 'bg-gray-500' }
    }
  }

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 bg-background/80 backdrop-blur-sm"
      >
        <Activity className="h-4 w-4 mr-2" />
        Performance
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 bg-background/95 backdrop-blur-sm border shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Monitor de Performance
          </CardTitle>
          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Tempo de Carregamento */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm">Tempo de Carregamento</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-mono">{metrics.loadTime}ms</span>
            <div className={`w-2 h-2 rounded-full ${getPerformanceStatus('loadTime', metrics.loadTime).color}`} />
          </div>
        </div>

        {/* Número de Queries */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-purple-600" />
            <span className="text-sm">Queries Ativas</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-mono">{metrics.queryCount}</span>
            <div className={`w-2 h-2 rounded-full ${getPerformanceStatus('queryCount', metrics.queryCount).color}`} />
          </div>
        </div>

        {/* Uso de Memória */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-orange-600" />
            <span className="text-sm">Memória</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-mono">{metrics.memoryUsage.toFixed(1)}MB</span>
            <div className={`w-2 h-2 rounded-full ${getPerformanceStatus('memoryUsage', metrics.memoryUsage).color}`} />
          </div>
        </div>

        {/* Taxa de Cache */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm">Cache Hit Rate</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-mono">{metrics.cacheHitRate.toFixed(1)}%</span>
            <div className={`w-2 h-2 rounded-full ${getPerformanceStatus('cacheHitRate', metrics.cacheHitRate).color}`} />
          </div>
        </div>

        {/* Status Geral */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status Geral</span>
            <Badge variant="outline" className="text-xs">
              {metrics.loadTime < 1000 && metrics.queryCount < 8 && metrics.memoryUsage < 40 ? (
                <span className="text-green-600">Excelente</span>
              ) : metrics.loadTime < 2000 && metrics.queryCount < 12 && metrics.memoryUsage < 60 ? (
                <span className="text-yellow-600">Bom</span>
              ) : (
                <span className="text-red-600">Precisa Otimização</span>
              )}
            </Badge>
          </div>
        </div>

        {/* Dicas de Otimização */}
        {(metrics.loadTime > 2000 || metrics.queryCount > 10 || metrics.memoryUsage > 50) && (
          <div className="pt-2 border-t">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                {metrics.loadTime > 2000 && <div>• Otimize o tempo de carregamento</div>}
                {metrics.queryCount > 10 && <div>• Reduza o número de queries</div>}
                {metrics.memoryUsage > 50 && <div>• Monitore o uso de memória</div>}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

export default PerformanceMonitor