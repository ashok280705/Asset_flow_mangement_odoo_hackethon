import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { CommandPalette } from '@/components/CommandPalette'
import { SessionProvider } from '@/components/SessionProvider'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession()
  if (!user) redirect('/login')

  const session = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId ?? null,
  }
  const u = { name: user.name, email: user.email, role: user.role }

  return (
    <SessionProvider value={session}>
      <div className="flex min-h-screen bg-[#f6f5f2]">
        <Sidebar user={u} />
        <div className="flex-1 min-w-0 flex flex-col">
          <TopBar user={u} />
          <main className="flex-1 overflow-auto">
            <div className="px-6 lg:px-8 py-8 max-w-[1400px] mx-auto w-full af-fade-in">
              {children}
            </div>
          </main>
        </div>
        <CommandPalette />
      </div>
    </SessionProvider>
  )
}
