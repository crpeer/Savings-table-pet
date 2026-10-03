# Savings Table Pet

一个轻量级、**不涉及真实交易** 的养成式存钱记录应用。  
它只记录你的存钱行为与角色状态，不连接银行、不发起转账。

## Run

这是一个无依赖的前端静态应用，可直接打开或用任意静态服务运行：

```bash
python -m http.server 8080
```

然后访问 `http://localhost:8080`。

## 产品边界与验收标准

- 保持非交易定位：不做银行卡绑定、账户读取、支付/转账/代扣。
- 核心目标：
  - 桌面窗口化桌宠体验
  - 动画状态机与互动反馈
  - 角色养成与多维数值系统
  - 记账系统增强并与养成联动
  - 安卓可落地（同代码基线 + 离线能力）

## 当前功能框架（MVP+）

- **主控制台 + 可浮动桌宠窗口**
  - 桌宠窗口支持拖拽、置顶、收起/展开、尺寸切换
- **动画系统**
  - 宠物状态机：待机 / 巡逻 / 互动 / 高兴
  - 交互动画与可选音效
- **养成数值系统**
  - 饱腹、饮水、心情
  - 等级、经验、亲密度、积分
  - 离线时长衰减与里程碑解锁
- **记账增强系统**
  - 分类、标签、备注
  - 月预算与剩余额度
  - 日/周/月统计
  - 月分类图表
  - 关键词检索（分类/标签/备注）
- **数据能力**
  - 本地持久化（`localStorage`）
  - JSON 导入/导出
- **安卓适配基础**
  - 响应式触控布局
  - PWA 清单与 Service Worker 离线缓存基础能力

## 详细分支系统（建议）

在当前主开发分支持续集成，同时使用短周期功能分支：

- `feature/window-shell`：窗口化壳层、拖拽与置顶
- `feature/pet-animation`：状态机、动画切换、音效控制
- `feature/growth-stats`：等级经验、衰减、里程碑
- `feature/accounting-upgrade`：预算、分类统计、检索
- `feature/android-adaptation`：移动端体验、PWA/离线、容器化适配

流程建议：

1. 每个分支独立开发与回归
2. 通过后合并回当前主开发分支
3. 创建整体验收分支做联调与最终发布确认

## 验收与发布节奏

- 阶段验收：记录、导入导出、状态持久化、动画触发、移动端适配。
- 发布顺序：
  1. 桌面网页 MVP
  2. 安卓版本
  3. 联动打磨与资源扩展（角色皮套/动作）

## 自定义角色与图片资源（预留位置）

在 `assets/` 下放置你自己的图片，然后在 `src/config.js` 中配置：

- `petSkins`: 角色皮套列表（可添加多个）
- `backgroundImage`: 场景背景图
- `actions[*].image`: 行为卡片图片（吃饭/喝水/消费/零花钱）

即使图片缺失，UI 也会显示友好占位，不影响运行。

## 跨设备同步扩展（通过修改 JavaScript）

数据存储适配器位于 `src/storage.js`：

- `localStorageAdapter`：默认本地存储
- `customSyncAdapter`：你可改写为自己的后端同步实现

若要跨设备同步，请自行实现并替换调用（`src/app.js` 里默认使用 `localStorageAdapter`）。
建议实现以下接口：

- `load()`
- `save(state)`
- `exportState()`
- `importState(json)`

## OCR/输入扩展点

`src/input.js` 包含：

- `manualInputAdapter`：当前手动输入解析
- `ocrInputAdapter`：OCR 识别结果解析预留

后续可在 `extractFromImage()` 中接入任意 OCR 服务。

## Project structure

- `index.html`: 页面结构（主控制台 + 桌宠窗口）
- `style.css`: 界面样式与宠物动画
- `manifest.webmanifest`: PWA 清单
- `sw.js`: 离线缓存 Service Worker
- `src/app.js`: UI 绑定、交互、拖拽、动画调度
- `src/config.js`: 角色、动作、分类、里程碑配置
- `src/model.js`: 纯状态变更逻辑（养成/记账/衰减/统计）
- `src/storage.js`: 本地/自定义同步存储适配器
- `src/input.js`: 手动输入/OCR 输入适配层
- `assets/`: 图片资源目录（皮套、背景、动作图）

## Non-goals

本项目有意不实现：

- 银行卡绑定
- 银行账户读取
- 支付/转账/代扣
- 任何资金托管或金融交易
