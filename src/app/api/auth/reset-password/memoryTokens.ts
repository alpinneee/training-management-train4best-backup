// Store tokens in memory as a temporary solution
// This is not persistent across server restarts, but will work for development
export const memoryTokens = new Map<string, { token: string, expires: Date, email: string, userId: string }>(); 