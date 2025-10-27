export function formatSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.floor(bytes / Math.pow(k, i)) + ' ' + sizes[i]
}