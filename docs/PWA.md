# PWA 实现文档

## 概述

Diarum 已经实现了完整的 PWA（Progressive Web App）功能，支持离线使用、应用安装和自动更新。

## 已实现的功能

### 1. 核心 PWA 功能

- ✅ **Web App Manifest** - 应用清单配置
- ✅ **Service Worker** - 离线缓存和后台同步
- ✅ **应用安装** - 支持添加到主屏幕
- ✅ **离线支持** - 缓存策略确保离线可用
- ✅ **自动更新** - 检测并提示用户更新

### 2. 缓存策略

应用使用以下缓存策略：

- **静态资源**：缓存优先（Cache First）
  - HTML、CSS、JavaScript
  - 图片、字体等静态文件

- **API 请求**：网络优先（Network First）
  - 确保数据最新
  - 网络超时后使用缓存
  - 缓存有效期：7 天

- **外部字体**：缓存优先（Cache First）
  - Google Fonts
  - 缓存有效期：365 天

### 3. 用户界面功能

- **安装提示** - 自动提示用户安装应用
- **更新通知** - 检测到新版本时提示更新
- **离线提示** - 网络状态变化提示

## 文件结构

```
site/
├── static/
│   ├── site.webmanifest          # PWA 清单文件
│   ├── android-chrome-192x192.png # 应用图标 192x192
│   ├── android-chrome-512x512.png # 应用图标 512x512
│   └── apple-touch-icon.png       # iOS 图标
├── src/
│   ├── lib/
│   │   ├── utils/
│   │   │   └── pwa.ts             # PWA 工具函数
│   │   └── components/
│   │       ├── PWAInstallPrompt.svelte  # 安装提示组件
│   │       └── PWAUpdatePrompt.svelte   # 更新提示组件
│   └── routes/
│       └── +layout.svelte         # 集成 PWA 功能
└── vite.config.ts                 # PWA 插件配置
```

## 测试 PWA 功能

### 本地测试

1. **构建生产版本**
   ```bash
   cd site
   npm run build
   ```

2. **启动预览服务器**
   ```bash
   npm run preview
   ```

3. **使用 Chrome DevTools 测试**
   - 打开 Chrome DevTools (F12)
   - 转到 Application 标签
   - 检查以下项目：
     - Manifest: 查看应用清单
     - Service Workers: 确认 SW 已注册
     - Cache Storage: 查看缓存内容

### 安装测试

#### 桌面（Chrome/Edge）

1. 访问应用
2. 地址栏右侧会显示安装图标 ➕
3. 或等待底部弹出安装提示
4. 点击"安装"按钮
5. 应用将被添加到应用列表

#### 移动端（Android）

1. 使用 Chrome 访问应用
2. 点击菜单 → "添加到主屏幕"
3. 或等待底部弹出安装提示
4. 确认安装

#### iOS/iPadOS

1. 使用 Safari 访问应用
2. 点击分享按钮
3. 选择"添加到主屏幕"
4. 确认添加

### 离线测试

1. 正常访问应用
2. 打开 Chrome DevTools
3. 转到 Network 标签
4. 勾选 "Offline" 复选框
5. 刷新页面
6. 应用应该仍然可以正常加载

### 更新测试

1. 修改代码后重新构建
2. 已安装的应用会自动检测更新
3. 顶部会显示更新提示
4. 点击"立即更新"应用新版本

## PWA 评分

使用 Lighthouse 检查 PWA 评分：

1. 打开 Chrome DevTools
2. 转到 Lighthouse 标签
3. 选择 "Progressive Web App"
4. 点击 "Analyze page load"

目标评分应该在 90+ 分。

## 生产部署注意事项

### 1. HTTPS 要求

PWA 必须在 HTTPS 环境下运行（localhost 除外）。

### 2. Service Worker 作用域

Service Worker 的作用域设置为根路径 `/`，确保整个应用都被缓存。

### 3. 更新策略

- 用户访问时自动检查更新
- 每 60 分钟检查一次更新
- 检测到更新后提示用户刷新

### 4. 缓存管理

- 自动清理过期缓存
- 限制 API 缓存条目数（最多 50 条）
- 限制字体缓存条目数（最多 10 条）

## 配置选项

### 修改缓存策略

编辑 `site/vite.config.ts` 中的 `workbox.runtimeCaching` 配置：

```typescript
{
  urlPattern: /\/api\/.*/i,
  handler: 'NetworkFirst',  // 可选：NetworkFirst, CacheFirst, StaleWhileRevalidate
  options: {
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 60 * 60 * 24 * 7  // 7 天
    }
  }
}
```

### 修改 Manifest

编辑 `site/static/site.webmanifest` 或 `site/vite.config.ts` 中的 manifest 配置。

### 禁用安装提示

在 `site/src/routes/+layout.svelte` 中移除或注释掉：

```svelte
<PWAInstallPrompt />
```

### 禁用更新提示

在 `site/src/routes/+layout.svelte` 中移除或注释掉：

```svelte
<PWAUpdatePrompt />
```

## 浏览器支持

- ✅ Chrome/Edge 80+
- ✅ Firefox 80+
- ✅ Safari 14+ (部分支持)
- ✅ Android Chrome
- ⚠️ iOS Safari (有限支持)

## 已知限制

1. **iOS Safari**
   - 不支持安装提示 API
   - Service Worker 功能受限
   - 需要手动添加到主屏幕

2. **存储限制**
   - 缓存大小受浏览器限制
   - 建议监控缓存使用情况

## 维护和监控

### 检查 Service Worker 状态

```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Active Service Workers:', registrations);
});
```

### 清除缓存

在浏览器控制台执行：

```javascript
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
});
```

### 取消注册 Service Worker

```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
```

## 故障排除

### Service Worker 未注册

1. 检查是否使用 HTTPS 或 localhost
2. 查看浏览器控制台错误信息
3. 确认构建输出包含 `sw.js` 文件

### 离线功能不工作

1. 检查 Service Worker 是否激活
2. 查看 Cache Storage 是否包含资源
3. 检查网络请求是否被拦截

### 安装提示不显示

1. 确认应用满足 PWA 安装条件
2. iOS Safari 不支持自动提示
3. 某些浏览器可能屏蔽了提示

## 参考资料

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
