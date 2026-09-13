/**
 * Utility function to get the correct file URL.
 * If the URL is a full URL (http/https), use it directly.
 * Otherwise, construct the backend proxy URL.
 */
export function getFileUrl(path: string | undefined | null): string {
    if (!path) return '';

    // If already a full URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        // Replace direct MinIO localhost URLs with backend proxy
        if (path.includes('localhost:9000') || path.includes(':9000/')) {
            // Extract the path after the bucket name
            const match = path.match(/\/invoices\/(.+)$/);
            if (match) {
                return `/api/files/view?path=${encodeURIComponent(match[1])}`;
            }
        }
        return path;
    }

    // If it's a relative path, use backend proxy
    return `/api/files/view?path=${encodeURIComponent(path)}`;
}

/**
 * Get download URL for a file
 */
export function getFileDownloadUrl(path: string | undefined | null): string {
    if (!path) return '';

    // If already a full URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        // Replace direct MinIO localhost URLs with backend proxy
        if (path.includes('localhost:9000') || path.includes(':9000/')) {
            const match = path.match(/\/invoices\/(.+)$/);
            if (match) {
                return `/api/files/download?path=${encodeURIComponent(match[1])}`;
            }
        }
        return path;
    }

    return `/api/files/download?path=${encodeURIComponent(path)}`;
}
