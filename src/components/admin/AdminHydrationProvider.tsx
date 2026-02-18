/**
 * Admin Zustand Store Hydration Provider
 *
 * Zustand persist의 rehydrate()를 최상위 한 곳에서만 호출하여
 * race condition 방지. 하위 컴포넌트는 useAdminHydration()으로
 * hydration 완료 여부를 확인.
 */
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useAdminTabStore } from '@/stores/useAdminTabStore'

const AdminHydrationContext = createContext(false)

export function AdminHydrationProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    useAdminTabStore.persist.rehydrate()
    setIsHydrated(true)
  }, [])

  return (
    <AdminHydrationContext.Provider value={isHydrated}>
      {children}
    </AdminHydrationContext.Provider>
  )
}

/**
 * Zustand store hydration 완료 여부를 반환하는 훅
 *
 * hydration 전에는 false, 완료 후 true
 */
export const useAdminHydration = () => useContext(AdminHydrationContext)
