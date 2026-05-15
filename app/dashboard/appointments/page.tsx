'use client'

import React, { useState } from 'react'
import { useAppointments } from '@/lib/hooks'
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AppointmentsPage() {
  const [businessId, setBusinessId] = useState<string>('')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const { appointments, loading, error, createAppointment, updateStatus } = useAppointments(businessId, currentMonth)

  React.useEffect(() => {
    const fetchBusinessId = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: business } = await supabase
          .from('business_users')
          .select('business_id')
          .eq('user_id', user.id)
          .limit(1)
          .single()
        if (business) setBusinessId(business.business_id)
      }
    }
    fetchBusinessId()
  }, [])

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i)

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const getAppointmentsForDay = (day: number) => {
    const targetDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return appointments.filter(apt => {
      const aptDate = new Date(apt.start_time)
      return aptDate.getDate() === day &&
        aptDate.getMonth() === currentMonth.getMonth() &&
        aptDate.getFullYear() === currentMonth.getFullYear()
    })
  }

  if (!businessId) return <div className="p-6">Loading...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#07070A] via-[#0E1116] to-[#07070A] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Appointments & Calendar</h1>
            <p className="text-[#D4AF37]/70">Book and manage appointments</p>
          </div>
          <button className="px-6 py-3 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black rounded-lg font-semibold flex items-center gap-2">
            <Plus className="w-5 h-5" />
            New Appointment
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="col-span-2 backdrop-blur-md bg-[#0E1116]/80 border border-[#D4AF37]/10 rounded-lg p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-2 hover:bg-[#D4AF37]/10 rounded"
              >
                <ChevronLeft className="w-5 h-5 text-[#D4AF37]" />
              </button>
              <h2 className="text-xl font-bold text-white">{monthName}</h2>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-2 hover:bg-[#D4AF37]/10 rounded"
              >
                <ChevronRight className="w-5 h-5 text-[#D4AF37]" />
              </button>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-[#D4AF37] font-semibold text-sm py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {emptyDays.map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {days.map(day => {
                const dayAppointments = getAppointmentsForDay(day)
                const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString()

                return (
                  <div
                    key={day}
                    className={`aspect-square p-2 rounded border cursor-pointer transition ${
                      isToday
                        ? 'bg-[#D4AF37]/20 border-[#D4AF37]'
                        : dayAppointments.length > 0
                        ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50'
                        : 'border-[#D4AF37]/10 hover:bg-[#D4AF37]/5'
                    }`}
                  >
                    <div className="text-white font-semibold text-sm mb-1">{day}</div>
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 2).map((apt, i) => (
                        <div key={i} className="text-xs bg-[#D4AF37]/30 text-[#D4AF37] rounded px-1 py-0.5 truncate">
                          {apt.title}
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="text-xs text-[#D4AF37]/50">+{dayAppointments.length - 2} more</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Upcoming Appointments Sidebar */}
          <div className="backdrop-blur-md bg-[#0E1116]/80 border border-[#D4AF37]/10 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Upcoming</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {appointments.slice(0, 5).map(apt => (
                <div key={apt.id} className="p-3 border border-[#D4AF37]/20 rounded hover:bg-[#D4AF37]/5 transition">
                  <p className="font-semibold text-white text-sm">{apt.title}</p>
                  <div className="flex items-center gap-2 text-[#D4AF37]/70 text-xs mt-2">
                    <Clock className="w-3 h-3" />
                    {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {apt.location && (
                    <div className="flex items-center gap-2 text-[#D4AF37]/70 text-xs mt-1">
                      <MapPin className="w-3 h-3" />
                      {apt.location}
                    </div>
                  )}
                  <select
                    value={apt.status}
                    onChange={(e) => updateStatus(apt.id, e.target.value as any)}
                    className="mt-2 w-full px-2 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded text-xs text-white"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
