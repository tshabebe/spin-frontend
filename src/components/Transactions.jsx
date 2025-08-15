import React, { useEffect, useState, useMemo } from 'react'
import { API_URL } from '../utils/apiUrl'
import { maskUsername } from '../utils/maskUsername'

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
      active ? 'bg-cyan-700 text-cyan-50' : 'bg-cyan-800 text-cyan-200'
    }`}
  >
    {children}
  </button>
)

const Row = ({ children }) => (
  <div className="items-center gap-2 grid grid-cols-4 bg-cyan-900 px-2 py-2 rounded-md text-xs">
    {children}
  </div>
)

const formatDate = (iso) => {
  try {
    const d = new Date(iso)
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`
  } catch {
    return iso
  }
}

const Transactions = ({ token }) => {
  const [activeTab, setActiveTab] = useState('recent') // 'recent' | 'mine'
  const [recent, setRecent] = useState([])
  const [mine, setMine] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token],
  )

  useEffect(() => {
    if (!token) return
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [r1, r2] = await Promise.all([
          fetch(`${API_URL}/api/transactions/recent-credits`, { headers }),
          fetch(`${API_URL}/api/transactions/user-history`, { headers }),
        ])
        if (!r1.ok) throw new Error('Failed to load recent winners')
        if (!r2.ok) throw new Error('Failed to load your transactions')
        const j1 = await r1.json()
        const j2 = await r2.json()
        setRecent(j1.transactions || [])
        setMine(j2.transactions || [])
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token, headers])

  return (
    <div className="flex flex-col gap-3 bg-cyan-900 p-4 rounded-xl">
      <div className="flex gap-2">
        <TabButton
          active={activeTab === 'recent'}
          onClick={() => setActiveTab('recent')}
        >
          Recent
        </TabButton>
        <TabButton
          active={activeTab === 'mine'}
          onClick={() => setActiveTab('mine')}
        >
          Transactions
        </TabButton>
      </div>

      <div className="flex flex-col gap-2 bg-cyan-950 p-2 rounded-lg max-h-72 overflow-y-auto">
        {/* Header */}
        <div className="gap-2 grid grid-cols-4 px-2 text-[11px] text-cyan-300">
          <div>Date</div>
          <div>{activeTab === 'recent' ? 'Winner' : 'Type'}</div>
          <div>Game Id</div>
          <div className="text-right">Amount</div>
        </div>

        {loading ? (
          <div className="py-8 text-cyan-300 text-xs text-center">
            Loading...
          </div>
        ) : error ? (
          <div className="py-8 text-cyan-300 text-xs text-center">{error}</div>
        ) : activeTab === 'recent' ? (
          (recent.length ? recent : []).map((t) => (
            <Row key={`${t.round_id}-${t.createdAt}`}>
              <div className="text-cyan-200">{formatDate(t.createdAt)}</div>
              <div className="text-cyan-100">{maskUsername(t.username)}</div>
              <div className="text-cyan-200">{t.round_id}</div>
              <div className="font-semibold text-cyan-50 text-right">
                {t.amount} ETB
              </div>
            </Row>
          ))
        ) : (
          (mine.length ? mine : []).map((t, idx) => (
            <Row key={`${idx}-${t.createdAt}`}>
              <div className="text-cyan-200">{formatDate(t.createdAt)}</div>
              <div className="text-cyan-100">{t.transaction_type}</div>
              <div className="text-cyan-200">{t.round_id}</div>
              <div
                className={`text-right font-semibold ${
                  t.transaction_type === 'credit'
                    ? 'text-cyan-50'
                    : 'text-cyan-200'
                }`}
              >
                {t.transaction_type === 'debit' ? '-' : ''}
                {t.amount} ETB
              </div>
            </Row>
          ))
        )}

        {!loading &&
        !error &&
        ((activeTab === 'recent' && recent.length === 0) ||
          (activeTab === 'mine' && mine.length === 0)) ? (
          <div className="py-8 text-cyan-300 text-xs text-center">No data</div>
        ) : null}
      </div>
    </div>
  )
}

export default Transactions
