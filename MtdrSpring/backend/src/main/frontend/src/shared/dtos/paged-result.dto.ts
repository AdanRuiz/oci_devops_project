export type PagedResult<T> = {
    items: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}