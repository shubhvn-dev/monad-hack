'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useAccount } from 'wagmi'
import { AppShell } from '@/components/AppShell'
import { Send, ExternalLink, Bot, Loader2, Sparkles } from 'lucide-react'
import type { SafeTxResult } from '@/lib/safePropose'

type Role = 'user' | 'agent'
type Message = { role: Role; content: string; safeTx?: SafeTxResult }

const SAFE_BASE = 'https://app.safe.global/transactions/queue?safe=mon'
const SAFE_ADDR = process.env.NEXT_PUBLIC_SAFE_ADDRESS ?? ''

const STARTERS = [
  'What are the top active projects by milestone completion?',
  'Which pending proposals look worth funding?',
  'Recommend projects similar to NeuralStack',
  "What's the current fund balance and AUM?",
]

export default function AgentPage() {
  const { address } = useAccount()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'agent',
      content: "I'm the TrackFund portfolio agent. Ask me about active research, portfolio performance, or say \"fund proposal 2\" to queue an investment.",
    },
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return
    setInput('')
    setLoading(true)

    const userMsg: Message = { role: 'user', content }
    setMessages(prev => [...prev, userMsg])

    try {
      const history = [...messages, userMsg]
        .filter(m => m.role === 'user' || m.role === 'agent')
        .map(m => ({ role: m.role === 'agent' ? 'assistant' : 'user', content: m.content }))

      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, address }),
      })

      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json() as { content: string; safeTx?: SafeTxResult }

      setMessages(prev => [...prev, { role: 'agent', content: data.content, safeTx: data.safeTx ?? undefined }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'agent',
        content: `Error: ${err instanceof Error ? err.message : 'unknown'}`,
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function handleSubmit(e: FormEvent) { e.preventDefault(); send() }

  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', background: '#050505' }}>

        {/* Page header */}
        <div style={{ padding: '24px 32px 0', flexShrink: 0 }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 18px', background: '#0d0d0d',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, marginBottom: 20,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#818cf8', flexShrink: 0,
              }}>
                <Bot size={16} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>TrackFund Portfolio Agent</div>
                <div style={{ fontSize: 12, color: '#444', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <span style={{ width: 5, height: 5, background: '#22c55e', borderRadius: '50%', display: 'inline-block' }} />
                  Online · Monitoring proposals
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span style={{
                  fontSize: 10, padding: '3px 8px', borderRadius: 9999,
                  background: 'rgba(99,102,241,0.1)', color: '#818cf8',
                  fontFamily: 'var(--font-jetbrains)', textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                  claude-3 powered
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', paddingTop: 8, paddingBottom: 20 }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', gap: 10, marginBottom: 16,
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {msg.role === 'agent' && (
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: 'rgba(99,102,241,0.15)',
                    border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: '#818cf8', flexShrink: 0, marginTop: 2,
                  }}>
                    <Bot size={14} />
                  </div>
                )}

                <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: 8, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    padding: '12px 16px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-wrap',
                    ...(msg.role === 'user'
                      ? { background: '#6366f1', color: 'white' }
                      : { background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)', color: 'white' }
                    ),
                  }}>
                    {msg.content}
                  </div>
                  {msg.safeTx && <SafeTxCard tx={msg.safeTx} />}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: '#818cf8', flexShrink: 0, marginTop: 2,
                }}>
                  <Bot size={14} />
                </div>
                <div style={{
                  padding: '14px 18px', background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '18px 18px 18px 4px', display: 'flex', gap: 5, alignItems: 'center',
                }}>
                  {[0, 150, 300].map(d => (
                    <span key={d} style={{
                      width: 6, height: 6, borderRadius: '50%', background: '#444', display: 'inline-block',
                      animation: `bounce 1s ease-in-out ${d}ms infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Starter prompts */}
        {messages.length === 1 && !loading && (
          <div style={{ padding: '0 32px 12px', flexShrink: 0 }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              <div style={{ fontSize: 11, color: '#444', fontFamily: 'var(--font-jetbrains)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={11} color="#444" />
                Suggested questions
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {STARTERS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    style={{
                      textAlign: 'left', padding: '12px 16px',
                      background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 12, color: '#888', fontSize: 13, cursor: 'pointer',
                      transition: 'all 200ms', lineHeight: 1.4,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#111'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.color = 'white' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#0d0d0d'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#888' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input bar */}
        <div style={{
          padding: '12px 32px 20px', flexShrink: 0,
          background: 'rgba(5,5,5,0.9)', backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <form onSubmit={handleSubmit} style={{ maxWidth: 760, margin: '0 auto', display: 'flex', gap: 10 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about portfolio, or say 'fund proposal 0'…"
              disabled={loading}
              style={{
                flex: 1, background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, color: 'white', fontSize: 14, padding: '13px 18px',
                outline: 'none', transition: 'border-color 200ms',
                opacity: loading ? 0.5 : 1,
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                width: 48, height: 48, borderRadius: 12, border: 'none',
                background: loading || !input.trim() ? '#1a1a1a' : '#6366f1',
                color: loading || !input.trim() ? '#444' : 'white',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 200ms', flexShrink: 0,
              }}
            >
              {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  )
}

function SafeTxCard({ tx }: { tx: SafeTxResult }) {
  const [copied, setCopied] = useState(false)

  function copyCalldata() {
    navigator.clipboard.writeText(tx.calldata)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{
      background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.25)',
      borderRadius: 16, padding: '16px 18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 7, height: 7, background: '#6366f1', borderRadius: '50%', animation: 'glow-pulse 2s ease-in-out infinite' }} />
          <span style={{ fontSize: 11, color: '#818cf8', fontFamily: 'var(--font-jetbrains)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Safe TX Queued
          </span>
        </div>
        <span style={{ fontSize: 11, color: '#555', fontFamily: 'var(--font-jetbrains)' }}>
          Nonce #{tx.nonce}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        {[
          { label: 'Proposal', val: `#${tx.proposalId}` },
          { label: 'Recipient', val: `${tx.projectWallet.slice(0, 10)}…${tx.projectWallet.slice(-8)}` },
          { label: 'Safe tx', val: `${tx.safeTxHash.slice(0, 20)}…` },
          { label: 'Signed by', val: `${tx.sender.slice(0, 10)}…${tx.sender.slice(-6)}` },
        ].map(({ label, val }) => (
          <div key={label} style={{ display: 'flex', gap: 10, fontSize: 12, fontFamily: 'var(--font-jetbrains)' }}>
            <span style={{ color: '#444', width: 64, flexShrink: 0 }}>{label}</span>
            <span style={{ color: '#888' }}>{val}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <a
          href={`${SAFE_BASE}:${SAFE_ADDR}`}
          target="_blank" rel="noopener noreferrer"
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '9px 0', borderRadius: 10, border: '1px solid rgba(99,102,241,0.35)',
            color: '#818cf8', fontSize: 13, fontWeight: 600, textDecoration: 'none',
            transition: 'background 200ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          Open in Safe <ExternalLink size={13} />
        </a>
        <button
          onClick={copyCalldata}
          style={{
            padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
            background: 'transparent', color: '#555', fontSize: 13, cursor: 'pointer',
            transition: 'all 200ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#888' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555' }}
        >
          {copied ? '✓ Copied' : 'Copy calldata'}
        </button>
      </div>
    </div>
  )
}
