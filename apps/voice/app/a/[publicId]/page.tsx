import { prisma } from '@payaid/db'
import { notFound } from 'next/navigation'

export const revalidate = 60

export default async function PublicVoiceAgentPage({
  params,
}: {
  params: Promise<{ publicId: string }> | { publicId: string }
}) {
  const resolvedParams = params instanceof Promise ? await params : params
  const publicId = decodeURIComponent(resolvedParams.publicId || '').trim()
  if (!publicId) notFound()

  const agent = await prisma.voiceAgent.findFirst({
    where: {
      publicId,
      status: 'active',
    },
    select: {
      publicId: true,
      name: true,
      description: true,
      theme: true,
    },
  })

  if (!agent?.publicId) notFound()

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-6 py-5 border-b border-slate-200">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">PayAid Voice</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{agent.name}</h1>
            {agent.description ? <p className="mt-2 text-sm text-slate-600">{agent.description}</p> : null}
          </div>

          <div className="px-6 py-6">
            <div id="payaid-voice-root" />
            <script
              src="/embed.js"
              data-agent={agent.publicId}
              data-render="inline"
              data-source="share_link"
              suppressHydrationWarning
            />
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Microphone permission is required to start a conversation.
        </p>
      </div>
    </main>
  )
}

