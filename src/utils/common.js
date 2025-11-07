// 格式化文件大小
export function formatSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.floor(bytes / Math.pow(k, i)) + ' ' + sizes[i]
}

// 版本比较
export function versionComparator(a, b) {
    const toArr = (v) => (v ? v.split(".").map(Number) : [0, 0, 0]);
    const aa = toArr(a),
        bb = toArr(b);
    for (let i = 0; i < 3; i++) if (aa[i] !== bb[i]) return aa[i] - bb[i];
    return 0;
}