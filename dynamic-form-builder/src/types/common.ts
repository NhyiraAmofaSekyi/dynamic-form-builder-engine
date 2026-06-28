export interface Page<T> {
  items: T[]
  page: number
  page_size: number
  total_items: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}