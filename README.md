# zip-multi-upgrade

`.zip` 多固件包升级库，支持上传 ZIP 固件包、自动解析文件结构、规则匹配、版本比对、文件筛选与一键批量升级。内置实时进度条与日志输出组件，适用于设备固件批量升级场景。

## 功能特性

- **ZIP 包解析**：上传 `.zip` 包后自动解压并列出内部文件。
- **规则匹配**：通过 `suffix`、`namingformat`、`min/max`、`size`文件大小等条件自动识别有效固件。
- **版本比对**：支持与当前设备版本对比，仅显示/可选高版本固件。
- **智能排序**：按规则优先级自动排序文件。
- **文件筛选**：支持“全选”、手动勾选、隐藏低版本/未匹配文件。
- **批量升级**：一键升级所有选中固件，自动顺序执行。
- **进度反馈**：内置 `ProgressLog` 组件，实时显示整体进度 + 单文件进度。
- **日志系统**：彩色日志、时间戳、倒计时、自动滚动。
- **高度可配置**：支持自定义解析规则、版本提取逻辑、上传限制等。

## 使用指南

安装

```sh
pnpm i zip-multi-upgrade
```

引入

```javascript
import { UpgradePackage, ProgressLog } from "zip-multi-upgrade";
```

## UpgradePackage zip解析组件

### Props配置项 config

| 参数名                   | 类型         | 默认值     | 说明                    |
| --------------------- | ---------- | ------- | --------------------- |
| `ListHeight`          | `Number`   | `120`   | 文件列表显示高度(否则滚动)              |
| `defaultSelectAll`    | `Boolean`  | `true`  | 是否默认全选符合规则的文件         |
| `caseSensitive`       | `Boolean`  | `true`  | 是否区分规则匹配的大小写          |
| `showExceptFiles`     | `Boolean`  | `true`  | 是否显示未匹配规则的文件          |
| `sortCheckedFiles`    | `Boolean`  | `true`  | 选中文件是否按优先级排序          |
| `versionComparison`   | `Boolean`  | `true`  | 是否启用版本号比对             |
| `showLowVersion`      | `Boolean`  | `false` | 是否显示低版本文件             |
| `maxFileSize`         | `Number`   | `10MB`  | 上传zip文件最大限制              |
| `priorityRules`       | `Array`    | `[]`    | 文件匹配规则（后缀、命名、大小、附加说明） |
| `currentVersions`     | `Array`    | `[]`    | 当前设备版本列表              |
| `parseRuleAndVersion` | `Function` | 内置函数    | 解析文件名中的规则与版本号         |

### 事件

| 事件名           | 参数                                                  | 说明               |
| ------------- | --------------------------------------------------- | ---------------- |
| `files-ready` | `{ displayFiles, FilesAll, SelectedFiles, RawZip }` | 当 ZIP 文件解析完成时触发  |
| `selected`    | `{ SelectedFiles, SelectedCount, TotalCount }`      | 当文件选择变化时触发       |
| `clear`       | 无                                                   | 当用户点击删除或清空时触发    |
| `error`       | `String`                                            | 当出现错误（格式或体积等）时触发 |

### 方法ref

| 方法名                      | 功能说明                 |
| ------------------------ | -------------------- |
| `clearAll()`             | 清空当前文件及选择状态          |
| `refresh()`              | 重新应用规则与版本比对          |
| `getSelectedFiles()`     | 获取当前选中的文件信息（含异步文件对象） |
| `getFileBinary(name)`    | 获取指定文件的二进制数据         |
| `getAllSelectedBinary()` | 获取所有已选文件的二进制数据       |
| `fileCount`              | 当前文件数量（计算属性）         |
| `selectedCount`          | 当前选中文件数量（计算属性）       |
| `hasFiles`               | 是否存在文件（计算属性）         |
| `hasSelected`            | 是否存在选中文件（计算属性）       |
| `getConfig()`            | 获取最终合并后的配置           |

## ProgressLog 日志进度组件

### Props配置项 config

| 参数名                 | 类型        | 默认值       | 说明                  |
| ------------------- | --------- | --------- | ------------------- |
| `fontSize`   | `number`  `string` | `12`    | 日志字体大小             |
| `showProgressBar`   | `Boolean` | `true`    | 是否显示进度条             |
| `showLog`           | `Boolean` | `true`    | 是否显示日志             |
| `showTimestamp`     | `Boolean` | `true`    | 是否在日志前显示时间戳         |
| `autoScroll`        | `Boolean` | `true`    | 是否自动滚动到最新日志         |
| `progressColor`     | `String`  | `#409EFF` | 进度条颜色               |

### 方法ref

| 方法名               | 类型   | 参数                       | 功能说明     |
| ------------------- | --------- | ----------------- |-------- |
| `addLog(msg,color)` |  (`String`,`String`)     |  (消息,颜色)       | 添加一条日志记录 |
| `setProgress(val)`  |  `number`    |   0-100                | 设置进度条数值  |
| `clearLogs()`       |   无    |      无             | 清空日志内容   |
| `getLogs()`         |   无    |        无           | 获取当前日志列表 |

#### addLog颜色

| 颜色名      | 说明       |
| ---------- | --------   |
| `black`    | 黑色       |
| `white`    | 白色       |
| `grey`     | 灰色       |
| `green`    | 绿色       |
| `blue`     | 蓝色       |
| `red`      | 红色       |
| `orange`   | 橙色       |
| `purple`   | 紫色       |
| `black-bold`    | 黑色加粗       |
| `white-bold`    | 白色加粗       |
| `grey-bold`     | 灰色加粗       |
| `green-bold`    | 绿色加粗       |
| `blue-bold`     | 蓝色加粗       |
| `red-bold`      | 红色加粗       |
| `orange-bold`   | 橙色加粗       |
| `purple-bold`   | 紫色加粗       |
| `#xxxxxx`   | 另外支持Hex 颜色       |

## 使用示例

```javascript
<template>
  <UpgradePackage
    :config="upgradeConfig"
    @files-ready="onFilesReady"
    @selected="onFilesSelected"
    ref="upgradePackageRef"
  />
</template>
<script setup>
import { ref } from "vue";
import { UpgradePackage } from "zip-multi-upgrade";

const upgradeConfig = ref({
  priorityRules: [
    {
      suffix: "BIN",
      namingformat: "#SWITCH",
      min: 0,
      max: 819200,
      other: {
        cmd: "SWITCH-CMD",
      },
    },
    {
      suffix: "APP",
      namingformat: "MCU",
      other: {
        cmd: "RxConnect",
      },
    },
    {
      suffix: "BIN",
      namingformat: "EDID",
      size: [128, 256],
      other: {
        cmd: "BOOT-CMD",
        a: 1,
        b: 2,
        c: 3,
      },
    },
  ],
});

function onFilesReady(val) {
  console.log("文件已就绪:", val);
}

function onFilesSelected(val) {
  console.log("文件选择:", val.SelectedFiles);
}
</script>
```

##  开发与发布

打包构建

```bash
npm run build
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
