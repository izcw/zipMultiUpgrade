## 使用

### 安装

```sh
npm i zip-multi-upgrade
```

### 引入

```javascript
import { UpgradePackage, ProgressLog } from 'zip-multi-upgrade'
import 'zip-multi-upgrade/index.css'
```

## 开发

### 打包

```sh
npm run build:lib
```

### 首先要登录npm
```sh
npm login
```

### 推送到npm
```sh
npm publish --access=public
```


### 本地调试

```sh
npm link
```

```sh
npm link zip-multi-upgrade
```

```sh
npm run build:watch
```
