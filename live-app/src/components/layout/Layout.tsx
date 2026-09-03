import Header from './Header'
import Footer from './Footer'
import MobileNav from './MobileNav'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-surface-light">
      <Header />
      <main className="flex-1 pt-14 pb-16 md:pb-8">
        {children}
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
