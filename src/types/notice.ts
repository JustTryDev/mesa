/**
 * 공지사항 관련 타입 정의
 */
import type { Tables, TablesInsert, TablesUpdate } from './supabase'

// 기본 타입 (Supabase 스키마 기반)
export type Notice = Tables<'notices'>
export type NoticeInsert = TablesInsert<'notices'>
export type NoticeUpdate = TablesUpdate<'notices'>

export type NoticeCategory = Tables<'notice_categories'>
export type NoticeCategoryInsert = TablesInsert<'notice_categories'>
export type NoticeCategoryUpdate = TablesUpdate<'notice_categories'>

// 카테고리 정보가 포함된 공지사항
export interface NoticeWithCategory extends Notice {
  category: NoticeCategory | null
}

// 공지사항 목록 필터
export interface NoticeFilter {
  categoryId?: string
  isPublished?: boolean
  isPinned?: boolean
  search?: string
}

// 공지사항 정렬
export type NoticeSortField = 'created_at' | 'view_count' | 'title'
export type SortOrder = 'asc' | 'desc'

export interface NoticeSort {
  field: NoticeSortField
  order: SortOrder
}

// 공지사항 폼 데이터
export interface NoticeFormData {
  title: string
  content: string
  detailed_content: string
  category_id: string | null
  is_pinned: boolean
  is_published: boolean
}

// 페이지네이션
export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
