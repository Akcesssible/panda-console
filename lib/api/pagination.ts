// Bridges Spring Data's Page<T> (zero-indexed) to the UI's pagination shape.
// The existing queries use 1-indexed pages (see lib/queries/*: from = (page-1)*PER_PAGE),
// so the client sends `page = uiPage - 1` and maps the response back.

// Spring Data Page<T> as serialized by Jackson.
export interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number // zero-indexed current page
  size: number
}

export interface UiPage<T> {
  items: T[]
  total: number
  page: number // 1-indexed
  totalPages: number
}

// Convert a 1-indexed UI page number to the zero-indexed value the backend expects.
export function toBackendPage(uiPage: number): number {
  return Math.max(0, uiPage - 1)
}

// Map a SpringPage<TBackend> to a UiPage<TUi>, applying `mapFn` to each element.
export function mapPage<TBackend, TUi>(
  page: SpringPage<TBackend>,
  mapFn: (item: TBackend) => TUi,
): UiPage<TUi> {
  return {
    items: (page.content ?? []).map(mapFn),
    total: page.totalElements ?? 0,
    page: (page.number ?? 0) + 1,
    totalPages: page.totalPages ?? 0,
  }
}
