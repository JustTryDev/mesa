/**
 * 사이드바 즐겨찾기 스토어
 *
 * 사용자 ID 단위로 DB에 저장하여 다른 기기에서도 유지.
 * Supabase RLS로 본인 데이터만 접근 가능.
 */
import { create } from 'zustand'
import { getSupabase } from '@/lib/supabase/client'

interface FavoritesStore {
  favorites: string[]
  isLoaded: boolean
  fetchFavorites: () => Promise<void>
  toggleFavorite: (menuId: string) => Promise<void>
  isFavorite: (menuId: string) => boolean
}

export const useFavoritesStore = create<FavoritesStore>()((set, get) => ({
  favorites: [],
  isLoaded: false,

  // DB에서 즐겨찾기 목록 조회
  fetchFavorites: async () => {
    try {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('user_sidebar_favorites')
        .select('menu_ids')
        .eq('user_id', user.id)
        .single()

      set({ favorites: data?.menu_ids || [], isLoaded: true })
    } catch {
      set({ isLoaded: true })
    }
  },

  // 즐겨찾기 추가/제거 토글
  toggleFavorite: async (menuId: string) => {
    const { favorites } = get()
    const isFav = favorites.includes(menuId)
    const newFavorites = isFav
      ? favorites.filter(id => id !== menuId)
      : [...favorites, menuId]

    // 낙관적 업데이트 (UI 즉시 반영)
    set({ favorites: newFavorites })

    try {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('user_sidebar_favorites')
        .upsert({
          user_id: user.id,
          menu_ids: newFavorites,
          updated_at: new Date().toISOString(),
        })
    } catch {
      // DB 실패 시 롤백
      set({ favorites })
    }
  },

  // 즐겨찾기 여부 확인
  isFavorite: (menuId: string) => {
    return get().favorites.includes(menuId)
  },
}))
