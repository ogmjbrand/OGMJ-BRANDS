import MarketingHeader from './MarketingHeader'
import MarketingFooter from './MarketingFooter'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#04060A] text-white">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  )
}
