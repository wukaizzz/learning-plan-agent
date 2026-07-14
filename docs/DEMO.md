# v1.0.0 Portfolio 演示脚本

目标时长：150–180 秒。录制前使用真实 PostgreSQL 和 DeepSeek 完整演练一次，确保画面内容与 README 一致。

## 录制前检查

```bash
# 前端
pnpm lint
pnpm test:run
pnpm build
pnpm test:e2e

# 后端
pnpm test
pnpm db:health
```

- 清理与演示无关的浏览器标签、终端日志和系统通知。
- 使用全新的 `default-user` 数据，或确认示例空间不存在。
- 后端 `.env` 已设置 `DATABASE_URL`、`DEEPSEEK_API_KEY`，迁移已执行。
- 浏览器缩放为 100%，录制分辨率建议 1920×1080。

## 150–180 秒时间轴

| 时间 | 画面与操作 | 旁白重点 |
| --- | --- | --- |
| 0–15 秒 | 打开学习空间首页，点击“加载示例空间” | 说明项目定位：AI 全栈学习规划 Agent |
| 15–45 秒 | 进入空间，点击“生成初次学习计划” | 展示 SSE 驱动的 Agent 步骤，不是一次性假结果 |
| 45–70 秒 | 打开总览、今日任务、学习计划、时间线 | LLM 负责拆解，确定性调度器负责最终日期，UI Blocks 负责展示 |
| 70–95 秒 | 在 Agent 对话中输入“查询我今天的学习日程” | 展示只读日程查询 Block 和真实计划数据 |
| 95–125 秒 | 输入“把未完成任务顺延一天” | 展示调整预览；强调不会直接修改计划 |
| 125–140 秒 | 点击确认应用 | 后端创建新版本并归档旧计划；也可演示拒绝路径 |
| 140–155 秒 | 刷新页面并返回计划页 | 空间、聊天、计划和任务从 PostgreSQL 恢复 |
| 155–175 秒 | 切到 README 架构图与测试终端 | 展示 LangGraph、SSE、确定性调度、PostgreSQL 和质量门禁 |

## 截图重现

固定 fixture 不依赖真实模型与数据库，适合生成稳定的 README 截图：

```powershell
$env:CAPTURE_PORTFOLIO_SCREENSHOTS='1'
pnpm test:e2e
Remove-Item Env:CAPTURE_PORTFOLIO_SCREENSHOTS
```

输出：

- `docs/screenshots/01-study-spaces.png`
- `docs/screenshots/02-sse-generating.png`
- `docs/screenshots/03-final-plan.png`

正式视频仍应使用真实后端完成，以证明 DeepSeek、LangGraph 和 PostgreSQL 闭环。

## Release 检查表

- [ ] 前后端工作树已人工复核，没有密钥、日志或本地数据库信息。
- [ ] 前端 lint、Vitest、build、Playwright 全绿。
- [ ] 后端测试全绿；配置数据库时 PostgreSQL 用例不再 skipped。
- [ ] README 截图与当前界面一致。
- [ ] 150–180 秒视频已上传并在 README/Release 中链接。
- [ ] 前端仓库创建 `v1.0.0-portfolio` tag 与 Release。
- [ ] 后端仓库创建 `v1.0.0-portfolio` tag 与 Release。
- [ ] 两个 Release 互相链接，并注明 Node `>=20.19`、pnpm 与迁移步骤。
