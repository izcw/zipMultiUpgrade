<!-- src\components\ProgressLog\index.vue -->
<template>
  <div class="progress-log-section" :style="rootStyle">
    <!-- 进度条 -->
    <div class="progress-container" v-if="config.showProgressBar">
      <div class="progress-bar">
        <div class="progress-text">{{ progress }}%</div>
        <div
          class="progress-fill"
          :class="{ 'scroll-animation': progress < 100 }"
          :style="{
            width: progress + '%',
            background: `${config.progressColor}BF`,
          }"
        ></div>
      </div>
    </div>

    <!-- 日志容器 -->
    <div ref="logContainer" class="log-container" v-if="config.showLog">
      <div v-for="(log, i) in logs" :key="i" class="log-entry">
        <span class="time" v-if="config.showTimestamp"
          >[{{ log.time }}]&ensp;</span
        >
        <span :style="getTextStyle(log.color)">{{ log.msg }}</span>
      </div>
      <div v-if="countdown > 0" class="count-down">{{ countdown }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, computed } from "vue";

const props = defineProps({
  config: { type: Object, default: () => ({}) },
});

// 默认配置
const defaultConfig = {
  fontSize: 12, // 字体大小
  showProgressBar: true, // 是否显示进度条
  showLog: true, // 是否显示日志
  showTimestamp: true, //是否在日志前显示时间戳
  autoScroll: true, // 是否自动滚动到最新日志
  progressColor: "#3491fa", // 进度条颜色
};

// 合并配置
const config = computed(() => ({ ...defaultConfig, ...props.config }));

// 状态
const logs = ref([]);
const progress = ref(0);
const countdown = ref(0);
const logContainer = ref(null);
let countdownTimer = null;

const rootStyle = computed(() => ({
  fontSize: `${config.value.fontSize}px`,
}));

// 颜色映射
const COLOR_MAP = {
  black: "#000000",
  white: "#ffffff",
  grey: "#94a1b1",
  green: "#23C343",
  blue: "#57A9FB",
  red: "#F76560",
  orange: "#FF9A2E",
  purple: "#8D4EDA",
};

/**
 * 根据颜色名生成样式
 * 支持 "-bold" 后缀自动加粗
 */
const getTextStyle = (color) => {
  if (!color) return { color: "#000000" };

  // 支持 #hex 直接返回
  if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(color)) return { color };

  // 检查是否带 -bold 后缀
  let fontWeight = "normal";
  let baseColor = color;
  if (color.endsWith("-bold")) {
    fontWeight = "bold";
    baseColor = color.replace(/-bold$/, "");
  }

  const hex = COLOR_MAP[baseColor] || "#000000";
  return { color: hex, fontWeight };
};

// 公开 API
const addLog = (msg, color) => {
  const time = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  logs.value.push({ time, msg, color });
  if (logs.value.length > 300) logs.value.shift();
  scrollToBottom();
};

const setProgress = (percent) => {
  progress.value = Math.min(100, Math.max(0, Math.floor(percent)));
};

const startCountdown = (seconds) => {
  countdown.value = seconds;
  clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) clearInterval(countdownTimer);
  }, 1000);
};

const stopCountdown = () => {
  clearInterval(countdownTimer);
  countdownTimer = null;
  countdown.value = 0;
};

const clear = () => {
  logs.value = [];
  progress.value = 0;
  stopCountdown();
  scrollToBottom();
};

const scrollToBottom = () => {
  if (!config.value.autoScroll) return;
  nextTick(() => {
    if (!logContainer.value) return;
    requestAnimationFrame(
      () => (logContainer.value.scrollTop = logContainer.value.scrollHeight)
    );
  });
};

defineExpose({ addLog, setProgress, startCountdown, stopCountdown, clear });

onMounted(() => clear());
onUnmounted(() => stopCountdown());
</script>

<style scoped lang="scss">
@use "@/styles/index.scss" as *;

.progress-log-section {
  padding: 10px 0;
}
.progress-container {
  margin-bottom: 10px;
}
.progress-bar {
  width: 100%;
  height: 20px;
  background: #bfbfbf;
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
  font-size: 0.75rem;
  font-weight: bold;
  color: #fff;
  z-index: 2;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(45deg, #3491fa, #57a9fb);
  border-radius: 10px;
  transition: width 0.3s;
  position: relative;
  overflow: hidden;
}

// 条纹
.progress-fill.scroll-animation::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    135deg,
    transparent 0,
    transparent 8px,
    rgba(255, 255, 255, 0.15) 8px,
    rgba(255, 255, 255, 0.15) 16px
  );
  background-size: 22.627px 100%;
  animation: scrollStripes 1s linear infinite;
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
  height: 200px;
  max-height: 200px;
  overflow-y: auto;
  padding: 5px;
  box-sizing: border-box;
  position: relative;
  margin: 10px 0;

  @include mini-scrollbar;
}

.count-down {
  color: #ff9a2e;
  font-weight: bold;
}
.log-entry {
  padding: 2px 0;
  display: flex;
  align-items: flex-start;
  word-wrap: break-word;
  word-break: break-all;
}
</style>
