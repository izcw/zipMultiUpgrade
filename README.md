# zip-multi-upgrade

**多固件 ZIP 包批量升级** 高效组件库，支持 ZIP 文件上传、自动解析、规则匹配、版本比对、文件筛选与一键批量升级。内置 **实时进度条** 与 **日志系统**等.

## 功能特性

- **ZIP 包解析**：上传 `.zip` 包后自动解压并列出内部文件。
- **规则匹配**：支持通过后缀名、命名格式、文件大小范围（min/max/size）等条件自动识别有效固件。
- **版本比对**：与当前设备版本进行比对，仅显示或可选更高版本固件。
- **智能排序**：按规则优先级自动排序文件列表。
- **文件筛选**：支持“全选”、手动勾选、隐藏低版本或未匹配规则的文件。
- **批量升级**：一键升级所有选中固件，自动按顺序执行。
- **进度反馈**：内置 ProgressLog 组件，实时展示整体进度与单文件进度。
- **日志系统**：彩色日志、时间戳、倒计时、自动滚动。
- **高度可配置**：支持自定义解析规则、版本提取逻辑、上传限制等。

## 安装与使用

安装

```sh
pnpm i zip-multi-upgrade
```

引入

```javascript
import { UpgradePackage, ProgressLog } from "zip-multi-upgrade";
```

## UpgradePackage —— ZIP 解析组件

### Props 配置项(config)

| 参数名                 | 类型       | 默认值         | 说明                          |
| --------------------- | ---------- | ------------- | ---------------------         |
| `ListHeight`          | `Number`   | `120`   | 文件列表的可视高度（超出部分滚动显示）  |
| `defaultSelection`    | `enum：'filter' \| 'all' \| 'none'`  | `'filter'`  | 默认选中状态（符合规则 / 全选 / 不选）   |
| `caseSensitive`       | `Boolean`  | `false`       | 是否区分命名规则大小写          |
| `showExceptFiles`     | `Boolean`  | `true`        | 是否显示未匹配规则的文件        |
| `sortCheckedFiles`    | `Boolean`  | `true`        | 选中文件是否按优先级排序        |
| `versionComparison`   | `Boolean`  | `false`       | 是否启用版本号比对              |
| `showLowVersion`      | `Boolean`  | `false`       | 是否显示低版本文件              |
| `disableLowVersion`   | `Boolean`  | `true`        | 是否禁用低版本文件              |
| `maxFileSize`         | `Number`   | `10 * 1024 * 1024` (10MB)  | 上传 ZIP 最大体积  |
| `priorityRules`       | `Array`    | `[]`          | 文件匹配规则配置                 |
| `currentVersions`     | `Array`    | `[]`          | 当前设备版本信息（用于比对）    |
| `parseVersionRule` | `Function` | 内置解析函数      | 自定义文件名版本号解析规则 (默认解析：`_v1.0.0_#SWITCH.bin` `_v版本_规则.后缀`)|

#### priorityRules 匹配规则配置

| 参数名          | 类型      | 示例                   | 说明              |
| :------------- | :------- | :--------------------- | :-------------- |
| `suffix`       | `String` | `BIN`, `APP`           | 文件后缀名（不区分大小写）   |
| `namingformat` | `String` | `SWITCH`, `EDID`       | 文件命名规则（默认区分大小写） |
| `min`          | `Number` | `0`                    | 文件最小体积（字节）      |
| `max`          | `Number` | `819200`               | 文件最大体积（字节）      |
| `size`         | `Array`  | `[128, 256]`           | 文件体积精确匹配筛选包含内容（字节）    |
| `other`        | `Object` | `{ cmd: "reboot", hello: "world"}` | 自定义附加信息         |

#### currentVersions 版本匹配配置（需启用 versionComparison）

| 参数名         | 类型       | 示例             | 说明                              |
| ------------- | ---------- | ----------       | --------------------------------- |
| `suffix`      | `String`   | `BIN` `APP`      | 文件后缀名(不区分大小写)      |
| `namingformat`| `String`   | `SWITCH` `EDID`  | 命名规则（不区分大小写）    |
| `version`     | `String`   | `1.2.3`          | 版本号(会筛选高于此版本的文件)    |

#### parseVersionRule 自定义解析示例

```javascript
parseRuleAndVersion: (fileName) => {
  console.log("当前文件名：", fileName);
  let rule = ""; // 自行解析规则
  let version = ""; // 自行解析版本号
  return { rule, version };
}
```

### 事件回调

| 事件名         | 返回值                                              | 说明            |
| :------------ | :-------------------------------------------------- | :------------ |
| `files-ready` | `{ displayFiles, FilesAll, SelectedFiles, RawZip }` | ZIP 文件解析完成时触发 |
| `selected`    | `{ SelectedFiles, SelectedCount, TotalCount }`      | 文件选择变化时触发     |
| `clear`       | 无                                                  | 用户清空文件列表时触发   |
| `error`       | `Error message`                                     | 上传或解析错误时触发    |

### 方法 (ref 调用)

| 方法名                    | 说明                    |
| :----------------------- | :-------------------- |
| `clearAll()`             | 清空当前文件与选择状态           |
| `refresh()`              | 重新应用匹配规则与版本比对         |
| `getSelectedFiles()`     | 获取当前选中文件信息（含 File 对象） |
| `getFileBinary(name)`    | 获取指定文件的二进制数据          |
| `getAllSelectedBinary()` | 获取所有选中文件的二进制数据        |
| `fileCount`              | 文件总数（计算属性）            |
| `selectedCount`          | 选中文件数量（计算属性）          |
| `hasFiles`               | 是否存在文件（计算属性）          |
| `hasSelected`            | 是否存在选中文件（计算属性）        |
| `getConfig()`            | 获取当前全部配置项             |

### slots 插槽

| 插槽名           | 说明              |
| :-------------- | :-------------- |
| `uploadIcon`    | 上传图标  |
| `deleteIcon`    | 删除图标  |

## ProgressLog —— 日志进度组件

### Props 配置项(config)

| 参数名             | 类型               | 默认值     | 说明          |
| :---------------- | :----------------- | :-------- | :---------- |
| `fontSize`        | `number \| string` | `12`      | 日志字体大小      |
| `showProgressBar` | `Boolean`          | `true`    | 是否显示进度条     |
| `showLog`         | `Boolean`          | `true`    | 是否显示日志      |
| `showTimestamp`   | `Boolean`          | `true`    | 是否显示时间戳     |
| `autoScroll`      | `Boolean`          | `true`    | 是否自动滚动到最新日志 |
| `progressColor`   | `String`           | `#409EFF` | 进度条颜色       |

### 方法 (ref 调用)

| 方法名                 | 参数               | 说明       |
| :-------------------- | :----------------- | :------- |
| `addLog(msg, color)`  | `(String, String)` | 添加一条彩色日志 |
| `setProgress(val)`    | `Number (0-100)`   | 设置进度条数值  |
| `startCountdown(val)` | `Number (>0)`      | 开始倒计时    |
| `stopCountdown()`     | 无                 | 停止倒计时    |
| `clear()`             | 无                 | 清空日志内容   |
| `getLogs()`           | 无                 | 获取当前日志列表 |

#### addLog 可用颜色

| 颜色名                                                                       | 示例说明                 |
| :-------------------------------------------------------------------------- | :------------------- |
| `black` / `white` / `grey` / `green` / `blue` / `red` / `orange` / `purple` | 普通颜色                 |
| `*-bold`                                                                    | 加粗显示（如 `black-bold`） |
| `#xxxxxx`                                                                   | 支持自定义 HEX 色值         |

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

## 开发与发布

构建打包

```bash
npm run build
```

首次登录 npm

```bash
npm login
```

发布到 npm

```bash
npm publish --access=public
```

本地调试

```bash
npm link            # 在组件项目中执行
npm run build:watch # 启动监听打包
```

```bash
npm link zip-multi-upgrade # 在使用项目中执行
```
