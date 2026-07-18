/**
 * OGMJ BRANDS — Dashboard Widget Component
 * Reusable widget system for dashboard pages
 * Last Updated: July 1, 2026
 */

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ================================
// WIDGET VARIANTS
// ================================

const dashboardWidgetVariants = cva(
  cn(
    'rounded-2xl border bg-gradient-to-br',
    'from-[#0E1116] to-[#07070A]',
    'p-6 transition-all duration-300',
    'hover:border-[#C8FF00]/40'
  ),
  {
    variants: {
      size: {
        sm: 'col-span-1 row-span-1',
        md: 'col-span-2 row-span-1',
        lg: 'col-span-3 row-span-1',
        xl: 'col-span-4 row-span-2',
        full: 'col-span-full',
      },
      variant: {
        default: 'border-[#C8FF00]/20',
        accent: 'border-[#10B981]/20 hover:border-[#10B981]/40',
        subtle: 'border-[#C8FF00]/10 hover:border-[#C8FF00]/20',
        danger: 'border-red-500/20 hover:border-red-500/40',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
)

// ================================
// WIDGET INTERFACE
// ================================

interface DashboardWidgetProps extends VariantProps<typeof dashboardWidgetVariants> {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  isLoading?: boolean
  error?: string
  className?: string
}

// ================================
// MAIN WIDGET COMPONENT
// ================================

export const DashboardWidget = React.forwardRef<HTMLDivElement, DashboardWidgetProps>(
  (
    {
      title,
      subtitle,
      icon,
      action,
      children,
      isLoading = false,
      error,
      size,
      variant,
      className,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(dashboardWidgetVariants({ size, variant }), className)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3 flex-1">
            {icon && <div className="text-[#C8FF00] flex-shrink-0">{icon}</div>}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">{title}</h3>
              {subtitle && (
                <p className="text-xs text-[#C8FF00]/60 truncate mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          {action && <div className="flex-shrink-0 ml-4">{action}</div>}
        </div>

        {/* Content */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="h-24 flex items-center justify-center">
              <div className="animate-spin text-[#C8FF00]">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    )
  }
)

DashboardWidget.displayName = 'DashboardWidget'

// ================================
// METRIC WIDGET (SPECIALIZED)
// ================================

interface MetricWidgetProps extends Omit<DashboardWidgetProps, 'children'> {
  value: string | number
  valueColor?: string
  change?: {
    value: number
    direction: 'up' | 'down'
    period: string
  }
  loading?: boolean
}

export const MetricWidget = React.forwardRef<HTMLDivElement, MetricWidgetProps>(
  (
    {
      title,
      value,
      valueColor = 'text-[#C8FF00]',
      change,
      icon,
      action,
      error,
      isLoading,
      size = 'md',
      variant = 'default',
      className,
    },
    ref
  ) => {
    return (
      <DashboardWidget
        ref={ref}
        title={title}
        icon={icon}
        action={action}
        isLoading={isLoading}
        error={error}
        size={size}
        variant={variant}
        className={className}
      >
        <div className="space-y-3">
          <div className={cn('text-3xl font-bold', valueColor)}>{value}</div>
          {change && (
            <div
              className={cn(
                'flex items-center gap-2 text-sm font-medium',
                change.direction === 'up' ? 'text-green-400' : 'text-red-400'
              )}
            >
              <span>{change.direction === 'up' ? '↑' : '↓'}</span>
              <span>
                {Math.abs(change.value)}% {change.period}
              </span>
            </div>
          )}
        </div>
      </DashboardWidget>
    )
  }
)

MetricWidget.displayName = 'MetricWidget'

// ================================
// CHART WIDGET (SPECIALIZED)
// ================================

interface ChartWidgetProps extends Omit<DashboardWidgetProps, 'children'> {
  children: React.ReactNode
}

export const ChartWidget = React.forwardRef<HTMLDivElement, ChartWidgetProps>(
  (
    {
      title,
      subtitle,
      icon,
      action,
      children,
      isLoading,
      error,
      size = 'lg',
      variant = 'default',
      className,
    },
    ref
  ) => {
    return (
      <DashboardWidget
        ref={ref}
        title={title}
        subtitle={subtitle}
        icon={icon}
        action={action}
        isLoading={isLoading}
        error={error}
        size={size}
        variant={variant}
        className={className}
      >
        <div className="h-64 w-full">{children}</div>
      </DashboardWidget>
    )
  }
)

ChartWidget.displayName = 'ChartWidget'

// ================================
// TABLE WIDGET (SPECIALIZED)
// ================================

interface TableWidgetProps extends Omit<DashboardWidgetProps, 'children'> {
  columns: Array<{
    key: string
    label: string
    width?: string
  }>
  data: Array<Record<string, any>>
  onRowClick?: (row: Record<string, any>) => void
}

export const TableWidget = React.forwardRef<HTMLDivElement, TableWidgetProps>(
  (
    {
      title,
      icon,
      action,
      columns,
      data,
      onRowClick,
      isLoading,
      error,
      size = 'full',
      variant = 'default',
      className,
    },
    ref
  ) => {
    return (
      <DashboardWidget
        ref={ref}
        title={title}
        icon={icon}
        action={action}
        isLoading={isLoading}
        error={error}
        size={size}
        variant={variant}
        className={cn('p-0', className)}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#C8FF00]/10">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-6 py-3 text-left text-xs font-semibold text-[#C8FF00]/60 uppercase tracking-wider',
                      col.width
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={idx}
                  className={cn(
                    'border-b border-[#C8FF00]/10 hover:bg-[#C8FF00]/5 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 text-sm text-white">
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardWidget>
    )
  }
)

TableWidget.displayName = 'TableWidget'

// ================================
// WIDGET GRID CONTAINER
// ================================

interface WidgetGridProps {
  children: React.ReactNode
  className?: string
}

export const WidgetGrid: React.FC<WidgetGridProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-max',
        className
      )}
    >
      {children}
    </div>
  )
}

WidgetGrid.displayName = 'WidgetGrid'

