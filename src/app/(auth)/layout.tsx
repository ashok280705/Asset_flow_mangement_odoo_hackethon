import { Boxes, ShieldCheck, BarChart3, Workflow } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#f6f5f2]">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] relative overflow-hidden bg-[#0f3d2e]">
        <div
          className="absolute inset-0 opacity-[0.6]"
          style={{
            background:
              'radial-gradient(120% 80% at 20% 15%, #12503b 0%, #0f3d2e 45%, #0b2c21 100%)',
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center ring-1 ring-white/15">
              <Boxes className="h-5 w-5 text-emerald-300" strokeWidth={2.2} />
            </div>
            <div>
              <div className="font-semibold text-lg tracking-tight">AssetFlow</div>
              <div className="text-[12px] text-emerald-200/70">Enterprise ERP</div>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-[32px] leading-[1.15] font-semibold tracking-tight">
              Track every asset with clarity and control.
            </h2>
            <p className="mt-4 text-[15px] text-emerald-100/70 leading-relaxed">
              A centralized platform for allocation, booking, maintenance, and audits —
              built for teams that value precision.
            </p>

            <div className="mt-10 space-y-4">
              {[
                { icon: Workflow, text: 'Structured lifecycle & approval workflows' },
                { icon: BarChart3, text: 'Real-time KPIs and utilization insights' },
                { icon: ShieldCheck, text: 'Role-based access with full audit trails' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-[14px] text-emerald-50/90">
                  <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center ring-1 ring-white/10 shrink-0">
                    <Icon className="h-[16px] w-[16px] text-emerald-300" />
                  </div>
                  {text}
                </div>
              ))}
            </div>
          </div>

          <div className="text-[12px] text-emerald-200/50">
            © {new Date().getFullYear()} AssetFlow. All rights reserved.
          </div>
        </div>
      </div>

      {/* Form area */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[400px]">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-8">
            <div className="h-9 w-9 rounded-[10px] bg-emerald-600 flex items-center justify-center">
              <Boxes className="h-5 w-5 text-white" strokeWidth={2.2} />
            </div>
            <div className="font-semibold text-lg tracking-tight text-[#1c1b18]">AssetFlow</div>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
