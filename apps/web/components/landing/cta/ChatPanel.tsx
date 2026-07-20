"use client"

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react"
import { FadeUp, MIcon } from "./helpers"

type Message = {
  role: "assistant" | "user"
  content: string
}

const seedMessages: Message[] = [
  {
    role: "assistant",
    content:
      "Welcome to OGMJ Brands! I'm your AI business co-pilot. Which of our 26 services can I help you with today?",
  },
  {
    role: "user",
    content: "I need branding, a website, and a sales funnel - all in one place.",
  },
  {
    role: "assistant",
    content:
      "Perfect. With OGMJ Brands you can order all three in one session - select, pay, and track everything from your dashboard. Let's get started.",
  },
]

type ChatPanelProps = {
  initialScroll?: "top" | "bottom"
  animateMessagesIn?: boolean
}

export default function ChatPanel({
  initialScroll = "top",
  animateMessagesIn = false,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(seedMessages)
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = scrollRef.current

    if (!node) {
      return
    }

    node.scrollTop = initialScroll === "bottom" ? node.scrollHeight : 0
  }, [initialScroll])

  function sendMessage() {
    const trimmed = input.trim()

    if (!trimmed) {
      return
    }

    setMessages((current) => [
      ...current,
      { role: "user", content: trimmed },
      {
        role: "assistant",
        content:
          "I can package that into a guided order with service milestones, payment, and dashboard tracking.",
      },
    ])
    setInput("")

    window.requestAnimationFrame(() => {
      const node = scrollRef.current
      if (node) {
        node.scrollTop = node.scrollHeight
      }
    })
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    sendMessage()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-white/10 bg-[rgba(8,8,10,0.6)] backdrop-blur-[24px]">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-[#C8FF00]">
          <MIcon name="auto_awesome" size={14} />
        </div>
        <div>
          <p className="text-sm font-medium text-white">OGMJ Brands</p>
          <p className="text-[11px] text-white/40">Your AI-powered business operating system</p>
        </div>
      </div>

      <div ref={scrollRef} className="scrollbar-hide min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5">
        {messages.map((message, index) => {
          const bubble = (
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                message.role === "user"
                  ? "ml-auto bg-white/15 text-white/90"
                  : "border border-white/5 bg-white/5 text-white/70"
              }`}
            >
              {message.content}
            </div>
          )

          return animateMessagesIn ? (
            <FadeUp key={`${message.role}-${index}`} delay={index * 0.12} y={16}>
              {bubble}
            </FadeUp>
          ) : (
            <div key={`${message.role}-${index}`}>{bubble}</div>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="p-3">
        <div className="liquid-glass flex items-end gap-2 rounded-2xl p-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about our services..."
            rows={1}
            className="min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-white/80 outline-none placeholder:text-white/35"
          />
          <button
            type="submit"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C8FF00] p-2 text-black transition-colors hover:bg-[#e0c04a]"
            aria-label="Send message"
          >
            <MIcon name="arrow_upward" size={16} weight={500} />
          </button>
        </div>
      </form>
    </div>
  )
}

