<template>
    <div class="progress-log-section">
        <div class="progress-container">
            <div class="progress-bar">
                <div class="progress-text">
                    {{ currentIndex >= props.files.length ? 'successful' : currentProgress + '%' }}
                    （{{ currentIndex }}/{{ props.files.length }}）
                </div>
                <div class="progress-fill" :class="currentIndex >= props.files.length ? '' : 'scroll-animation'"
                    :style="{ width: currentProgress + '%' }"></div>
            </div>
        </div>

        <div ref="logContainer" class="log-container">
            <div v-for="(log, index) in logs" :key="index" class="log-entry">
                <span style="white-space: nowrap;">[{{ log.time }}]&ensp;</span>
                <span :class="getLogClass(log)">{{ log.msg }}</span>
            </div>

            <div v-if="countDown > 0" class="log-entry count-down">
                下文件倒计时：{{ countDown }} 秒
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onUnmounted, nextTick } from 'vue'
import { useMockUpgrade } from '../mockUpgrade'

const props = defineProps({ files: { type: Array, default: () => [] } })
const emit = defineEmits(['all-done'])

const { mockSingleFileUpgrade } = useMockUpgrade()

const logs = ref([])
const currentProgress = ref(0)
const countDown = ref(0)
const totalTime = ref(0)
const logContainer = ref(null)
const currentIndex = ref(0)

const INTERVAL_MS = 10_000

let countDownTimer = null
function startCountDown(seconds) {
    countDown.value = seconds
    countDownTimer = setInterval(() => {
        countDown.value--
        if (countDown.value <= 0) {
            clearInterval(countDownTimer)
            countDownTimer = null
        }
    }, 1000)
}

function stopCountDown() {
    if (countDownTimer) {
        clearInterval(countDownTimer)
        countDownTimer = null
        countDown.value = 0
    }
}

const addLog = msg => {
    const t = new Date().toLocaleTimeString()
    // logs.value.push(`[${t}] ${msg}`)
    logs.value.push({ time: t, msg: msg })
    if (logs.value.length > 200) logs.value.shift()
    nextTick(() => {
        if (logContainer.value) {
            logContainer.value.scrollTop = logContainer.value.scrollHeight
        }
    })
}

const getLogClass = (log) => {
    log = log.msg
    console.log(log);

    // 先检查是否是统计日志（包含"====="的特殊格式）
    if (log.includes('=====') && (log.includes('成功') || log.includes('失败')) || (log.includes('success') || log.includes('error'))) {
        return 'log-summary'
    }
    if (log.includes('✗') || log.includes('error') || (log.includes('失败') && !log.includes('====='))) return 'log-error'
    if (log.includes('✓') || log.includes('success')) return 'log-success'
    if (log.includes('| → 进度：') || log.includes('| → progress：')) return 'log-progress'
    if (log.includes('→')) return 'log-process'
    if (log.includes('+')) return 'log-start'
    return ''
}

async function upgradeFile(file, currentIdx) {
    // 每个文件占据的进度范围
    const progressPerFile = 100 / props.files.length
    const startProgress = currentIdx * progressPerFile

    return await mockSingleFileUpgrade(
        file,
        currentIdx,
        props.files.length,
        addLog,
        (fileProgress) => {
            // 将文件进度映射到总体进度
            currentProgress.value = Math.floor(startProgress + (fileProgress / 100) * progressPerFile)
        }
    )
}

async function runUpgrade() {
    if (!props.files.length) return

    const startT = Date.now()
    currentProgress.value = 0
    logs.value = []
    totalTime.value = 0
    countDown.value = 0
    currentIndex.value = 0

    // 添加成功失败统计
    let successCount = 0
    let failCount = 0

    addLog(`===== 开始批量升级，共 ${props.files.length} 个文件 =====`)

    try {
        for (let i = 0; i < props.files.length; i++) {
            currentIndex.value = i
            const file = props.files[i]
            const isLast = i === props.files.length - 1

            const result = await upgradeFile(file, i)

            // 统计成功失败
            if (result) {
                successCount++
            } else {
                failCount++
            }

            if (!isLast) {
                const waitSeconds = INTERVAL_MS / 1000
                addLog(`等待 ${waitSeconds} 秒后处理下一个文件...`)
                startCountDown(waitSeconds)
                await new Promise(resolve => {
                    const timer = setInterval(() => {
                        if (countDown.value <= 0) {
                            clearInterval(timer)
                            resolve()
                        }
                    }, 100)
                })
            }
        }

        const endT = Date.now()
        totalTime.value = ((endT - startT) / 1000).toFixed(2)
        currentProgress.value = 100
        currentIndex.value = props.files.length  // 设置为文件总数
        addLog(`===== 全部执行完毕(${props.files.length}/${props.files.length}) 总耗时：${totalTime.value} 秒 =====`)
        // 添加成功失败统计信息
        addLog(`===== 成功 ${successCount} 个，失败 ${failCount} 个 =====`)
        emit('all-done')

    } catch (error) {
        addLog(`!!! 升级过程发生异常：${error.message}`)
    } finally {
        stopCountDown()
    }
}

watch(() => props.files, runUpgrade, { immediate: true })

onUnmounted(() => {
    logs.value = []
    stopCountDown()
})
</script>

<style scoped lang="scss">
.progress-log-section {
    padding-top: 1rem;
}

.progress-container {
    margin-bottom: 1rem;
}

.progress-bar {
    width: 100%;
    height: 20px;
    background: #454F28;
    border-radius: 10px;
    position: relative;
    overflow: hidden;
}

.progress-text {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: .75rem;
    font-weight: bold;
    color: #fff;
    z-index: 2;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(45deg, #A2C33F, #8AB033);
    border-radius: 10px;
    transition: width .3s;
    position: relative;
    overflow: hidden;

    &.scroll-animation::before {
        content: "";
        position: absolute;
        inset: 0;
        background-image: repeating-linear-gradient(45deg,
                transparent 0px,
                transparent 8px,
                rgba(255, 255, 255, 0.15) 8px,
                rgba(255, 255, 255, 0.15) 16px);
        background-size: 22.627px 100%;
        animation: scrollStripes 1s linear infinite;
    }
}

@keyframes scrollStripes {
    0% {
        background-position: -22.627px 0;
    }

    100% {
        background-position: 0 0;
    }
}

.log-container {
    max-height: 200px;
    overflow-y: auto;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: .75rem;
    background: rgba(0, 0, 0, .2);
    border-radius: 4px;
    padding: .5rem;
    position: relative;


    &::-webkit-scrollbar {
        width: 4px;
        height: 12px;
    }

    &::-webkit-scrollbar-track {
        background: #141419;
    }

    &::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 10px;

        &:window-inactive {
            background-color: #aaa;
        }
    }

    .count-down {
        color: #ff0;
        font-weight: bold;
    }
}

.log-entry {
    padding: 2px 0;
    // white-space: nowrap;
    // overflow: hidden;
    // text-overflow: ellipsis;
    display: flex;
    align-items: flex-start;

    word-wrap: break-word;
    word-break: break-all;

    & .log-error {
        color: #ff6b6b;
    }

    & .log-success {
        color: #51cf66;
    }

    & .log-progress {
        color: #74c0fc;
    }

    & .log-process {
        color: #4dabf7;
    }

    & .log-start {
        color: #ffd43b;
        font-weight: bold;
    }

    & .log-summary {
        color: #ffd43b;
        /* 统计信息使用黄色 */
        font-weight: bold;
    }
}
</style>