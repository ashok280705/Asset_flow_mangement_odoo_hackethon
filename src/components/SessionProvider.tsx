'use client'
import { createContext, useContext } from 'react'

export interface Session {
  id: string
  name: string
  email: string
  role: string
  departmentId: string | null
}

const SessionContext = createContext<Session | null>(null)

export function SessionProvider({ value, children }: { value: Session; children: React.ReactNode }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): Session {
  const ctx = useContext(SessionContext)
  if (!ctx) {
    // Safe fallback so a mis-mounted consumer degrades to least privilege
    // rather than crashing the whole screen.
    return { id: '', name: '', email: '', role: 'EMPLOYEE', departmentId: null }
  }
  return ctx
}

// ── role predicates (mirror src/lib/rbac.ts semantics on the client) ──
export const roleIs = {
  admin: (r: string) => r === 'ADMIN',
  assetManager: (r: string) => r === 'ASSET_MANAGER',
  deptHead: (r: string) => r === 'DEPARTMENT_HEAD',
  employee: (r: string) => r === 'EMPLOYEE',
  /** ADMIN or ASSET_MANAGER */
  manager: (r: string) => r === 'ADMIN' || r === 'ASSET_MANAGER',
  /** can approve within a scope: managers + department heads */
  approver: (r: string) => r === 'ADMIN' || r === 'ASSET_MANAGER' || r === 'DEPARTMENT_HEAD',
}

/** Convenience hook returning the current role and derived permission flags. */
export function usePermissions() {
  const { role, departmentId, id } = useSession()
  return {
    id,
    role,
    departmentId,
    isAdmin: roleIs.admin(role),
    isManager: roleIs.manager(role),
    isApprover: roleIs.approver(role),
    isDeptHead: roleIs.deptHead(role),
    isEmployee: roleIs.employee(role),
  }
}
