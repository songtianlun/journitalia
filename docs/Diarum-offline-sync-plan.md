离线异步同步方案实现计划                                                                                            │
                                                                                                                    │
当前 Diarum 日记应用的同步机制存在以下问题：                                                                        │
1. 使用内存缓存（Svelte Store），页面刷新后未同步数据丢失                                                           │
2. 同步状态不可观测，关闭程序后无法知道是否有未同步数据                                                             │
3. 日记页面右上角无法点击保存，移动设备不友好                                                                       │
4. 没有离线支持和在线状态检测                                                                                       │
                                                                                                                    │
本方案将实现一个可靠、可观测的离线异步同步模块。                                                                    │
                                                                                                                    │
实现方案                                                                                                            │
                                                                                                                    │
1. 新增文件                                                                                                         │
                                                                                                                    │
1.1 持久化存储模块                                                                                                  │
                                                                                                                    │
site/src/lib/stores/persistence.ts                                                                                  │
                                                                                                                    │
使用 localStorage 实现持久化（简单可靠，无需额外依赖）：                                                            │
- 存储未同步的日记条目                                                                                              │
- 存储同步配置（自动保存间隔）                                                                                      │
- 提供初始化和持久化函数                                                                                            │
                                                                                                                    │
interface PersistedEntry {                                                                                          │
  date: string;                                                                                                     │
  content: string;                                                                                                  │
  localUpdatedAt: number;                                                                                           │
  serverUpdatedAt: string | null;                                                                                   │
  isDirty: boolean;                                                                                                 │
}                                                                                                                   │
                                                                                                                    │
1.2 在线状态检测模块                                                                                                │
                                                                                                                    │
site/src/lib/stores/onlineStatus.ts                                                                                 │
                                                                                                                    │
- 通过 /api/version 接口检测在线状态                                                                                │
- 在线状态缓存 3 秒                                                                                                 │
- 监听 navigator.onLine 事件作为快速判断                                                                            │
- 提供手动检测函数                                                                                                  │
                                                                                                                    │
interface OnlineState {                                                                                             │
  isOnline: boolean;                                                                                                │
  lastChecked: number;                                                                                              │
  checking: boolean;                                                                                                │
}                                                                                                                   │
                                                                                                                    │
1.3 同步配置模块                                                                                                    │
                                                                                                                    │
site/src/lib/stores/syncConfig.ts                                                                                   │
                                                                                                                    │
- 可配置自动保存间隔（默认 3s）                                                                                     │
- 可配置缓存天数（默认 3 天）                                                                                       │
- 持久化到 localStorage                                                                                             │
                                                                                                                    │
interface SyncConfig {                                                                                              │
  autoSaveInterval: number;  // 默认 3000ms                                                                         │
  cacheDays: number;         // 默认 3 天                                                                           │
}                                                                                                                   │
                                                                                                                    │
1.4 UI 组件                                                                                                         │
┌────────────────────────────────────────────────┬────────────────────────┐                                         │
│                      文件                      │          说明          │                                         │
├────────────────────────────────────────────────┼────────────────────────┤                                         │
│ site/src/lib/components/ui/SyncSettings.svelte │ 设置页面的同步管理区块 │                                         │
└────────────────────────────────────────────────┴────────────────────────┘                                         │
2. 修改文件                                                                                                         │
                                                                                                                    │
2.1 site/src/lib/stores/diaryCache.ts                                                                               │
                                                                                                                    │
- 集成持久化模块，启动时从 localStorage 恢复                                                                        │
- 每次更新时持久化到 localStorage                                                                                   │
- 同步成功后从持久化存储中移除                                                                                      │
- 使用可配置的同步间隔                                                                                              │
- 新增 cacheStats store 提供统计信息                                                                                │
- 新增 getUnsyncedEntries() 函数                                                                                    │
                                                                                                                    │
2.2 site/src/routes/settings/+page.svelte                                                                           │
                                                                                                                    │
- 添加 "Sync & Cache" 区块                                                                                          │
- 显示在线状态                                                                                                      │
- 显示缓存统计                                                                                                      │
- 显示待同步条目列表                                                                                                │
- 提供手动同步按钮                                                                                                  │
- 提供自动保存间隔配置                                                                                              │
                                                                                                                    │
2.3 site/src/lib/components/ui/SettingsToc.svelte                                                                   │
                                                                                                                    │
- 添加 "Sync & Cache" 导航项                                                                                        │
                                                                                                                    │
2.4 site/src/routes/diary/[date]/+page.svelte                                                                       │
                                                                                                                    │
- 增强同步状态指示器，支持点击手动同步                                                                              │
- 显示离线状态提示                                                                                                  │
                                                                                                                    │
3. 缓存策略                                                                                                         │
                                                                                                                    │
缓存范围                                                                                                            │
                                                                                                                    │
- 默认缓存最近 3 天的日记（可配置）                                                                                 │
- 缓存范围内的日记始终保留在本地                                                                                    │
- 超出缓存范围的日记在同步成功后移除                                                                                │
                                                                                                                    │
读取优先级                                                                                                          │
                                                                                                                    │
1. 优先从本地缓存读取                                                                                               │
2. 在线时后台检查服务器版本                                                                                         │
3. 根据时间戳判断是否需要更新                                                                                       │
                                                                                                                    │
缓存条目状态                                                                                                        │
                                                                                                                    │
interface CacheEntry {                                                                                              │
  content: string;                                                                                                  │
  localUpdatedAt: number;      // 本地修改时间                                                                      │
  serverUpdatedAt: string | null;  // 服务器更新时间                                                                │
  isDirty: boolean;            // 有未同步的本地修改                                                                │
  isInCacheRange: boolean;     // 是否在缓存范围内                                                                  │
}                                                                                                                   │
                                                                                                                    │
4. 同步逻辑                                                                                                         │
                                                                                                                    │
冲突解决策略                                                                                                        │
                                                                                                                    │
- 本地修改时间 > 服务器更新时间 → 上传本地版本                                                                      │
- 本地修改时间 < 服务器更新时间 且 isDirty=false → 下载服务器版本                                                   │
- 本地修改时间 < 服务器更新时间 且 isDirty=true → 保留本地（用户正在编辑优先）                                      │
                                                                                                                    │
同步流程                                                                                                            │
                                                                                                                    │
1. 用户编辑 → 更新内存缓存 → 持久化到 localStorage → 标记 isDirty                                                   │
2. 等待配置的间隔时间                                                                                               │
3. 检测在线状态                                                                                                     │
4. 在线时：                                                                                                         │
  - 获取服务器版本时间戳                                                                                            │
  - 比较本地和服务器时间戳                                                                                          │
  - isDirty=true 且本地较新 → 上传                                                                                  │
  - isDirty=false 且服务器较新 → 下载更新本地                                                                       │
5. 同步完成后：                                                                                                     │
  - 缓存范围内的条目 → 保留在 localStorage                                                                          │
  - 缓存范围外的条目 → 从 localStorage 移除                                                                         │
6. 离线时 → 保持在 localStorage，等待下次在线                                                                       │
                                                                                                                    │
缓存清理时机                                                                                                        │
                                                                                                                    │
- 应用启动时检查并清理超出范围的已同步条目                                                                          │
- 每次同步完成后检查                                                                                                │
- 用户手动清理                                                                                                      │
                                                                                                                    │
4. 设置页面 UI 设计                                                                                                 │
                                                                                                                    │
┌─────────────────────────────────────────────────────────┐                                                         │
│ Sync & Cache                                            │                                                         │
├─────────────────────────────────────────────────────────┤                                                         │
│ Online Status: ● Online / ○ Offline                     │                                                         │
│                                                         │                                                         │
│ Auto-save Interval: [3] seconds                         │                                                         │
│                                                         │                                                         │
│ Cache Statistics:                                       │                                                         │
│   Total cached: 5 | Pending sync: 2                     │                                                         │
│                                                         │                                                         │
│ Pending Items:                                          │                                                         │
│   • 2026-02-11 (Today) - Modified 5 min ago            │                                                          │
│   • 2026-02-10 - Modified 1 hour ago                   │                                                          │
│                                                         │                                                         │
│ [Sync Now]  [Clear Cache]                              │                                                          │
└─────────────────────────────────────────────────────────┘                                                         │
                                                                                                                    │
5. 实现步骤                                                                                                         │
                                                                                                                    │
1. 创建 persistence.ts - localStorage 持久化层                                                                      │
2. 创建 onlineStatus.ts - 在线状态检测                                                                              │
3. 创建 syncConfig.ts - 同步配置                                                                                    │
4. 重构 diaryCache.ts - 集成持久化和可配置间隔                                                                      │
5. 创建 SyncSettings.svelte - 设置页面组件                                                                          │
6. 修改 SettingsToc.svelte - 添加导航项                                                                             │
7. 修改 settings/+page.svelte - 添加同步管理区块                                                                    │
8. 修改 diary/[date]/+page.svelte - 增强同步状态指示器                                                              │
                                                                                                                    │
6. 关键文件路径                                                                                                     │
                                                                                                                    │
- site/src/lib/stores/diaryCache.ts - 核心缓存逻辑                                                                  │
- site/src/lib/stores/theme.ts - 参考 localStorage 使用模式                                                         │
- site/src/routes/settings/+page.svelte - 设置页面                                                                  │
- site/src/lib/components/ui/SettingsToc.svelte - 设置导航                                                          │
- site/src/routes/diary/[date]/+page.svelte - 日记页面                                                              │
                                                                                                                    │
7. 验证方法                                                                                                         │
                                                                                                                    │
1. 编辑日记 → 刷新页面 → 确认内容恢复                                                                               │
2. 编辑日记 → 断网 → 确认离线状态显示                                                                               │
3. 断网编辑 → 联网 → 确认自动同步                                                                                   │
4. 设置页面 → 确认缓存统计正确                                                                                      │
5. 设置页面 → 点击手动同步 → 确认同步成功                                                                           │
6. 修改自动保存间隔 → 确认生效 
