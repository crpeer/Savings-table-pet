# Savings Table Pet

一个轻量级、**不涉及真实交易** 的养成式存钱记录应用。
它只记录你的存钱行为与角色状态，不连接银行、不发起转账。

## Run

这是一个无依赖的前端静态应用，可直接打开或用任意静态服务运行：

```bash
python -m http.server 8080
```

然后访问 `http://localhost:8080`。

## 当前功能框架

- 角色养成界面（可替换皮套）
- 存钱行为按钮：`吃饭`、`喝水`、`消费`、`给零花钱`
- 手动记录金额与备注
- 本地数据持久化（`localStorage`）
- JSON 导入/导出（用于备份或跨设备迁移）
- OCR 输入适配器预留接口（未实现）

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

- `index.html`: 页面结构
- `style.css`: 界面样式
- `src/app.js`: UI 与状态绑定
- `src/config.js`: 角色与动作配置
- `src/model.js`: 纯状态变更逻辑
- `src/storage.js`: 本地/自定义同步存储适配器
- `src/input.js`: 手动输入/OCR 输入适配层
- `assets/`: 图片资源目录（皮套、背景、动作图）

## Non-goals

本项目有意不实现：

- 银行卡绑定
- 银行账户读取
- 支付/转账/代扣
- 任何资金托管或金融交易
