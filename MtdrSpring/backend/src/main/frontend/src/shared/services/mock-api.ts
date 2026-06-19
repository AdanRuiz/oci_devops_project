import type { ApiResult } from '../dtos/api-result.dto'

const DEFAULT_DELAY_MS = 250

export async function mockApi<T>(
    data: T,
    delayMs: number = DEFAULT_DELAY_MS
): Promise<ApiResult<T>> {
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    return {
        success: true,
        data: structuredClone(data)
    };
}