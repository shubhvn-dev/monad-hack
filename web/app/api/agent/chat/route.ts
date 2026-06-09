import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { store } from '@/lib/store'
import { getFundStats, getAllProposals } from '@/lib/chainData'
import { buildAndSignSafeTx, type SafeTxResult } from '@/lib/safePropose'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const TOOLS: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'fund_proposal',
      description: 'Prepare a Safe multisig transaction to approve and fund a specific on-chain proposal. Queues for co-signing — does NOT execute immediately. Only call when user explicitly asks to fund/invest.',
      parameters: {
        type: 'object',
        properties: {
          proposal_id:    { type: 'number',  description: 'On-chain proposal ID (integer)' },
          project_wallet: { type: 'string',  description: 'Wallet address to receive MUSD — use the proposer address from proposal data' },
          reason:         { type: 'string',  description: 'One sentence explaining why this proposal qualifies' },
        },
        required: ['proposal_id', 'project_wallet', 'reason'],
      },
    },
  },
]

async function buildSystemPrompt(userAddress?: string): Promise<string> {
  // Sequential to stay under RPC rate limit; gracefully degrade on failure
  const stats     = await getFundStats().catch(() => ({ totalAssets: 'unavailable', musdBalance: 'unavailable' }))
  const proposals = await getAllProposals().catch(() => [])

  const orgs = Array.from(store.orgs.values()).map(org => {
    const projects = Array.from(store.showcase.values()).filter(
      p => p.orgWallet.toLowerCase() === org.wallet.toLowerCase()
    )
    return { ...org, projects }
  })

  const proposalLines = proposals.length
    ? proposals.map(p =>
        `  #${p.id}: "${p.title ?? 'untitled'}" | ${p.requestedAmount} MUSD | ${p.status} | proposer: ${p.proposer}` +
        (p.description ? `\n    ${p.description.slice(0, 120)}` : '')
      ).join('\n')
    : '  (none yet)'

  const orgLines = orgs.map(org => {
    const projectList = org.projects.map(p => {
      const done  = p.milestones.filter(m => m.completedAt).length
      const total = p.milestones.length
      return `    - "${p.title}" [${p.status}] ${p.fundingAmount} MUSD | milestones ${done}/${total} | tags: ${p.tags.join(', ')}`
    }).join('\n')
    return `  ${org.name} (${org.sector}) — ${org.tagline}\n${projectList}`
  }).join('\n\n')

  return `You are the TrackFund AI portfolio agent for the Agentic Research Track on Monad testnet.

You help investors understand the portfolio, discover similar research opportunities, and queue funding transactions.

## Fund Status
- Total Assets Under Management: ${stats.totalAssets} MUSD
- Current MUSD Balance: ${stats.musdBalance} MUSD
${userAddress ? `- Connected Investor Wallet: ${userAddress}` : ''}

## On-Chain Proposals
${proposalLines}

## Portfolio (Research Orgs & Projects)
${orgLines}

## Rules
- When the user asks to fund/invest/approve a specific proposal, call the fund_proposal tool using the proposal's proposer address as project_wallet.
- fund_proposal queues a Safe multisig tx — it is NOT instant execution. Always explain this.
- For recommendations, use tags, sector, and description to find similar work.
- Be concise. Bullet points for lists. Max 3 recommendations at a time.
- If asked about a proposal with no off-chain title, use the metadataHash and proposer as identifiers.`
}

export async function POST(req: NextRequest) {
  try {
    const { messages, address } = await req.json() as {
      messages: Groq.Chat.Completions.ChatCompletionMessageParam[]
      address?: string
    }

    const systemPrompt = await buildSystemPrompt(address)

    const chatMessages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ]

    let safeTx: SafeTxResult | undefined

    // First call
    let response = await groq.chat.completions.create({
      model:      'llama-3.3-70b-versatile',
      messages:   chatMessages,
      tools:      TOOLS,
      tool_choice: 'auto',
      max_tokens: 1024,
      temperature: 0.4,
    })

    let choice = response.choices[0]

    // Handle tool calls (one round)
    if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls?.length) {
      chatMessages.push(choice.message)

      const toolResults: Groq.Chat.Completions.ChatCompletionToolMessageParam[] = []

      for (const call of choice.message.tool_calls) {
        if (call.function.name === 'fund_proposal') {
          const args = JSON.parse(call.function.arguments) as {
            proposal_id: number
            project_wallet: string
            reason: string
          }

          try {
            const tx = await buildAndSignSafeTx(args.proposal_id, args.project_wallet)
            safeTx = tx
            toolResults.push({
              role:         'tool',
              tool_call_id: call.id,
              content: JSON.stringify({
                success: true,
                safeTxHash:    tx.safeTxHash,
                nonce:         tx.nonce,
                sender:        tx.sender,
                message: `Safe transaction prepared. safeTxHash=${tx.safeTxHash}. Nonce=${tx.nonce}. Awaiting co-signature from Safe owners.`,
              }),
            })
          } catch (err: any) {
            toolResults.push({
              role:         'tool',
              tool_call_id: call.id,
              content: JSON.stringify({ success: false, error: err?.message ?? 'unknown' }),
            })
          }
        }
      }

      chatMessages.push(...toolResults)

      // Second call — final response after tool results
      response = await groq.chat.completions.create({
        model:      'llama-3.3-70b-versatile',
        messages:   chatMessages,
        max_tokens: 512,
        temperature: 0.4,
      })
      choice = response.choices[0]
    }

    return NextResponse.json({
      content: choice.message.content ?? '',
      safeTx: safeTx ?? null,
    })
  } catch (e: any) {
    console.error('[/api/agent/chat]', e?.message)
    return NextResponse.json({ error: e?.message ?? 'unknown' }, { status: 500 })
  }
}
