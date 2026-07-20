import type { Metadata } from 'next'
import Link from 'next/link'
import { BLOG_POSTS } from '@/lib/marketing/content'

export const metadata: Metadata = {
  title: 'Blog & Insights — OGMJ BRANDS',
  description: 'Case studies, guides, and insights on premium business operations, branding, and AI automation.',
}

export default function BlogPage() {
  return (
    <div className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Insights</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Resources for ambitious founders
          </h1>
          <p className="mt-6 text-lg text-slate-300">
            Case studies, guides, and practical insights from the OGMJ team.
          </p>
        </div>

        <div className="space-y-6">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition hover:border-gold/30 hover:-translate-y-0.5"
            >
              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wider text-slate-400">
                <span className="rounded-full bg-gold/10 px-3 py-1 text-gold">{post.category}</span>
                <span>{post.date}</span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-white transition group-hover:text-gold">
                {post.title}
              </h2>
              <p className="mt-3 text-slate-300">{post.excerpt}</p>
              <p className="mt-4 text-sm text-slate-500">By {post.author}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}


