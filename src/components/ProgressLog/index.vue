<!-- src\components\ProgressLog\index.vue -->
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
                {{ countDown }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed, onUnmounted, nextTick } from 'vue'

const props = defineProps({
    files: { type: Array, default: () => [] },
    upgradeFunction: { type: Function, required: true },  // 新增升级函数prop
    config: {
        type: Object,
        default: () => ({})
    }
})

// 默认配置
const defaultConfig = {
    // 预置文本
    waitText: '秒后处理下一个文件...',
    anomalousText: '发生异常，停止升级：',
    executeFinishText: '==== 全部执行完成',
    timeConsumingText: '总耗时：',
    successText: '成功',
    errorText: '失败',

    // 颜色规则
    logRules: [
        { test: /=====/i, style: 'orange-bold' },
        { test: /[✗]|error|失败(?!.*=====)/i, style: 'error' },
        { test: /[✓]|success/i, style: 'green' },
        { test: /\|\s*→\s*(进度|progress)：/i, style: 'blue' },
        { test: /→/i, style: 'blue' },   // ← 你要的这条
        { test: /\+/i, style: 'orange-bold' }
    ]
}

// 合并配置
const config = computed(() => ({
    ...defaultConfig,
    ...props.config
}))

const emit = defineEmits(['all-done'])

// 使用传入的升级函数
const  mockSingleFileUpgrade  = props.upgradeFunction

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
    logs.value.push({ time: t, msg: msg })
    if (logs.value.length > 200) logs.value.shift()
    nextTick(() => {
        if (logContainer.value) {
            logContainer.value.scrollTop = logContainer.value.scrollHeight
        }
    })
}

const getLogClass = (log) => {
    const msg = log.msg ?? log
    const rules = config.value.logRules

    for (const { test, style } of rules) {
        const hit = test instanceof RegExp ? test.test(msg)
            : typeof test === 'string' ? msg.includes(test)
                : typeof test === 'function' ? test(msg)
                    : false
        if (hit) return style
    }
    return 'black'
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

    console.log(props.files,"halo");
    

    const startT = Date.now()
    currentProgress.value = 0
    logs.value = []
    totalTime.value = 0
    countDown.value = 0
    currentIndex.value = 0

    // 添加成功失败统计
    let successCount = 0
    let failCount = 0

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
                addLog(`${waitSeconds} ${config.value.waitText}`)
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
        addLog(`${config.value.executeFinishText}(${props.files.length}/${props.files.length})`)
        addLog(`${config.value.timeConsumingText}${totalTime.value} s`)
        // 添加成功失败统计信息
        addLog(`${config.value.successText}(${successCount}) ，${config.value.errorText}(${failCount})`)
        emit('all-done')

    } catch (error) {
        addLog(`${config.value.anomalousText}${error.message}`)
    } finally {
        stopCountDown()
    }
}

watch(() => props.files, runUpgrade, { immediate: true })

onUnmounted(() => {
    logs.value = []
    stopCountDown()
})

defineOptions({
    name: 'ProgressLog'
})
</script>

<style scoped lang="scss">
$black: #000000; // 黑色
$white: #ffffff; // 白色色
$grey: #A9AEB8; // 灰色
$blue: #57A9FB; // 蓝色
$green: #23C343; // 绿色
$error: #F76560; // 红色
$orange: #FF9A2E; // 橙色
$purple: #8D4EDA; // 紫色

/* 样式保持不变 */
.progress-log-section {
    padding-top: 1rem;
}

.progress-container {
    margin-bottom: 1rem;
}

.progress-bar {
    width: 100%;
    height: 20px;
    background: #BFBFBF;
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
    background: linear-gradient(45deg, #3491FA, #57A9FB);
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
    font-size: 12px;
    padding: 10px;
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
        color: $orange;
        font-weight: bold;
    }
}

.log-entry {
    padding: 2px 0;
    display: flex;
    align-items: flex-start;
    word-wrap: break-word;
    word-break: break-all;




    & .black {
        color: $black;

        &-bold {
            color: $black;
            font-weight: bold;
        }
    }

    & .white {
        color: $white;

        &-bold {
            color: $white;
            font-weight: bold;
        }
    }

    & .grey {
        color: $grey;

        &-bold {
            color: $grey;
            font-weight: bold;
        }
    }

    & .blue {
        color: $blue;

        &-bold {
            color: $blue;
            font-weight: bold;
        }
    }

    & .green {
        color: $green;

        &-bold {
            color: $green;
            font-weight: bold;
        }
    }

    & .error {
        color: $error;

        &-bold {
            color: $error;
            font-weight: bold;
        }
    }

    & .orange {
        color: $orange;

        &-bold {
            color: $orange;
            font-weight: bold;
        }
    }


    & .purple {
        color: $purple;

        &-bold {
            color: $purple;
            font-weight: bold;
        }
    }
}
</style>