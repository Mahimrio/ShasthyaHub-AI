import { Footer } from '@/components/layout/Footer'

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Footer />
    </>
  )
}
