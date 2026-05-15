'use client'

import { useState, useEffect, useCallback } from 'react'

const MEMBERS = ['Stefano', 'Marika', 'Noemi', 'Lorenzo', 'Cristian'] as const
type Member = typeof MEMBERS[number]
type Meal = 'pranzo' | 'cena'

interface Absence {
  id: number
  person: string
  date: string
  meal: Meal
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const MONTH_NAMES = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function todayStr(): string {
  return toDateStr(new Date())
}

function getNext10Days(): Date[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: 10 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return d
  })
}

function dayLabel(d: Date): string {
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
}

function initials(name: string): string {
  return name.slice(0, 2)
}

// ——— Name selector screen ———
function NameSelector({ onSelect }: { onSelect: (name: Member) => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-6">
      <div className="text-4xl mb-4">🍽️</div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Pranzi &amp; Cene</h1>
      <p className="text-gray-500 text-sm mb-10 text-center">Chi sei? Seleziona il tuo nome.</p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {MEMBERS.map(m => (
          <button
            key={m}
            onClick={() => onSelect(m)}
            className="py-4 px-6 bg-white rounded-2xl shadow-sm border border-gray-200 text-lg font-semibold text-gray-800 hover:bg-green-50 hover:border-green-300 hover:text-green-700 active:scale-95 transition-all"
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  )
}

// ——— Avatar cell ———
function Avatar({
  member,
  absent,
  isMe,
  onClick,
}: {
  member: string
  absent: boolean
  isMe: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={isMe ? onClick : undefined}
      disabled={!isMe}
      title={`${member}${absent ? ' — assente' : ' — presente'}`}
      className={[
        'w-10 h-10 rounded-full text-xs font-bold flex items-center justify-center transition-all select-none',
        absent ? 'bg-gray-200 text-gray-400' : 'bg-green-500 text-white',
        isMe ? 'ring-2 ring-offset-1 ring-blue-400 cursor-pointer active:scale-90' : 'cursor-default opacity-90',
      ].join(' ')}
    >
      {initials(member)}
    </button>
  )
}

// ——— Main app ———
export default function Home() {
  const [currentUser, setCurrentUser] = useState<Member | null>(null)
  const [absences, setAbsences] = useState<Absence[]>([])
  const [loading, setLoading] = useState(true)
  const days = getNext10Days()

  // Load identity from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('lunch-user') as Member | null
    if (stored && (MEMBERS as readonly string[]).includes(stored)) {
      setCurrentUser(stored)
    }
  }, [])

  const loadAbsences = useCallback(async () => {
    const from = toDateStr(days[0])
    const to = toDateStr(days[days.length - 1])
    const res = await fetch(`/api/absences?from=${from}&to=${to}`)
    const data = await res.json()
    setAbsences(Array.isArray(data) ? data : [])
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { loadAbsences() }, [loadAbsences])

  const isAbsent = (person: string, date: Date, meal: Meal) =>
    absences.some(a => a.person === person && a.date === toDateStr(date) && a.meal === meal)

  const toggle = async (date: Date, meal: Meal) => {
    if (!currentUser) return
    const dateStr = toDateStr(date)
    const absent = isAbsent(currentUser, date, meal)

    if (absent) {
      // Mark present: delete absence
      setAbsences(prev => prev.filter(a => !(a.person === currentUser && a.date === dateStr && a.meal === meal)))
      await fetch('/api/absences', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person: currentUser, date: dateStr, meal }),
      })
    } else {
      // Mark absent: insert absence (optimistic)
      const temp: Absence = { id: Date.now(), person: currentUser, date: dateStr, meal }
      setAbsences(prev => [...prev, temp])
      const res = await fetch('/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person: currentUser, date: dateStr, meal }),
      })
      if (!res.ok) {
        setAbsences(prev => prev.filter(a => a.id !== temp.id))
      } else {
        const saved: Absence = await res.json()
        setAbsences(prev => prev.map(a => a.id === temp.id ? saved : a))
      }
    }
  }

  const selectUser = (name: Member) => {
    setCurrentUser(name)
    localStorage.setItem('lunch-user', name)
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem('lunch-user')
  }

  if (!currentUser) return <NameSelector onSelect={selectUser} />

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 text-white px-4 py-3 sticky top-0 z-10 shadow">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍽️</span>
            <div>
              <p className="font-bold leading-tight">Pranzi &amp; Cene</p>
              <p className="text-green-100 text-xs">Ciao, {currentUser}!</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-green-200 text-sm hover:text-white px-2 py-1 rounded"
          >
            Cambia nome
          </button>
        </div>
      </header>

      {/* Legend */}
      <div className="max-w-lg mx-auto px-4 pt-3 pb-1 flex gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Presente
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-gray-300 inline-block" /> Assente
        </span>
        <span className="ml-auto flex items-center gap-1">
          <span className="w-3 h-3 rounded-full ring-2 ring-blue-400 inline-block" /> Tu
        </span>
      </div>

      {/* Days grid */}
      <div className="max-w-lg mx-auto px-4 pb-8 pt-2 space-y-3">
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Caricamento...</div>
        ) : (
          days.map(day => {
            const dateStr = toDateStr(day)
            const isToday = dateStr === todayStr()

            return (
              <div
                key={dateStr}
                className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isToday ? 'border-green-400' : 'border-gray-100'}`}
              >
                {/* Day header */}
                <div className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 ${isToday ? 'bg-green-50 text-green-700' : 'text-gray-600 bg-gray-50'}`}>
                  {isToday && <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded font-bold">Oggi</span>}
                  {dayLabel(day)}
                </div>

                {/* Meals */}
                <div className="px-4 py-3 space-y-2.5">
                  {(['pranzo', 'cena'] as Meal[]).map(meal => {
                    const presentCount = MEMBERS.filter(m => !isAbsent(m, day, meal)).length
                    return (
                      <div key={meal} className="flex items-center gap-2">
                        <span className="w-12 text-xs text-gray-400 capitalize shrink-0">{meal}</span>
                        <div className="flex gap-1.5 flex-1">
                          {MEMBERS.map(member => (
                            <Avatar
                              key={member}
                              member={member}
                              absent={isAbsent(member, day, meal)}
                              isMe={member === currentUser}
                              onClick={() => toggle(day, meal)}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-300 w-6 text-right shrink-0">
                          {presentCount}/5
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
