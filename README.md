# zip-multi-upgrade

`.zip` 多固件包升级库，支持上传 ZIP 固件包、筛选与自动识别固件、一键升级操作，并内置实时进度条和日志输出。

## 功能特性

- 多固件管理：支持上传包含多个固件文件的 ZIP 包，自动解析文件结构。
- 固件筛选：可手动选择或自动识别需要升级的固件，支持按关键字筛选。
- 一键升级：支持一键执行批量升级操作，自动按顺序处理各固件。
- 进度显示：内置进度条组件，实时反馈每个固件的升级进度。
- 日志打印：自带日志面板，实时打印升级状态、错误信息与成功提示。
- 自动检测：自动判断 ZIP 包结构、固件版本与目标设备是否匹配。

## 使用指南

安装

```sh
pnpm i zip-multi-upgrade
```

引入

```javascript
import { UpgradePackage, ProgressLog } from 'zip-multi-upgrade'
import 'zip-multi-upgrade/index.css'
```

使用示例

```javascript
<template>
  <div>
    <!-- 固件包上传与文件筛选组件 -->
    <UpgradePackage
      :upgradeFunction="handleUpgrade"
      @upgrade-start="onUpgradeStart"
      @all-done="onAllDone"
    />

    <!-- 日志与进度显示组件 -->
    <ProgressLog ref="logRef" />
  </div>
</template>

<script setup>
// 引入组件
import { UpgradePackage, ProgressLog } from 'zip-multi-upgrade'
import 'zip-multi-upgrade/index.css'

// 模拟固件升级函数
const handleUpgrade = async (file) => {
  console.log('🚀 开始升级固件:', file.name)
  await new Promise((resolve) => setTimeout(resolve, 2000))
  console.log('✅ 升级完成:', file.name)
  return true
}

const onUpgradeStart = () => {
  console.log('开始批量升级')
}

const onAllDone = () => {
  console.log('所有固件升级完成！')
}
</script>

```

## 事件

### UpgradePackage

#### Props

| 参数名                 | 类型         | 默认值         | 说明                  |
| ------------------- | ---------- | ----------- | ------------------- |
| `autoFilter`        | `Boolean`  | `false`     | 是否自动筛选固件文件          |
| `upgradeFunction`   | `Function` | `undefined` | 固件升级逻辑函数，返回 Promise |
| `countdownInterval` | `Number`   | `3`         | 每个固件间的倒计时秒数         |
| `showProgress`      | `Boolean`  | `true`      | 是否显示进度条             |
| `showLog`           | `Boolean`  | `true`      | 是否显示日志输出区域          |

#### Emits

| 事件名                | 参数                           | 描述         |
| ------------------ | ---------------------------- | ---------- |
| `upload-success`   | `(files: FirmwareFile[])`    | ZIP 上传解析成功 |
| `file-select`      | `(selected: FirmwareFile[])` | 选择文件变化     |
| `upgrade-start`    | `(files: FirmwareFile[])`    | 开始批量升级     |
| `upgrade-progress` | `(progress: number)`         | 升级总进度变化    |
| `upgrade-finish`   | `(file: FirmwareFile)`       | 单个固件升级完成   |
| `all-done`         | `()`                         | 全部升级完成     |
| `log`              | `(message: string)`          | 日志输出事件     |

### ProgressLog

#### Props

| 参数名             | 类型        | 默认值    | 说明        |
| --------------- | --------- | ------ | --------- |
| `logBufferSize` | `Number`  | `500`  | 日志最大缓存数   |
| `autoScroll`    | `Boolean` | `true` | 是否自动滚动到底部 |

#### 方法

| 方法名                               | 参数 | 描述      |
| --------------------------------- | -- | ------- |
| `appendLog(message: string)`      | -  | 添加日志条目  |
| `clearLogs()`                     | -  | 清空日志    |
| `startCountDown(seconds: number)` | -  | 启动倒计时显示 |

## 开发

打包构建

```bash
npm run build:lib
```

登录npm（首次登录）

```bash
npm login
```

发布npm

```bash
npm publish --access=public
```

本地调试

```bash
npm link # 在组件项目中执行
npm run build:watch # 启动监听打包
```

```bash
npm link zip-multi-upgrade # 在使用项目中执行
```
