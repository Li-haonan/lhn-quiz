# 个人知识题库

一个为长期学习与知识整理打造的个人在线题库。项目目前收录**电力行业人工智能业务理论**题目，后续会逐步扩展为覆盖不同课程、考试与兴趣主题的个人知识库和复习平台。

> 这个仓库以当前项目的实际用途为准独立维护；文档、品牌和项目说明不沿用最初模板或上游项目的介绍。

## 当前内容

现阶段开放的题库为 2026 年南京市职工技能大赛电力行业人工智能业务理论题库：

| 题型     |    题数 |
| -------- | ------: |
| 单选题   |     366 |
| 多选题   |     237 |
| 判断题   |     286 |
| **合计** | **889** |

题库源文件位于 [`data/raw/power-ai-question-bank-dlut-quality-cleaned.md`](data/raw/power-ai-question-bank-dlut-quality-cleaned.md)，运行时 JSON 由解析脚本生成。标准答案保持原题口径，解析内容经过质量清洗。

## 已有功能

- 顺序、随机、错题重刷、弱点突破和未做题练习
- 按题型、题组与标签组织练习
- 错题本、收藏、掌握度追踪和正确率分析
- 自动保存答题进度，支持学习数据导入与导出
- 使用 IndexedDB 在本地保存数据，支持离线使用
- 响应式界面与键盘快捷操作
- 可选 AI 助手，用于辅助理解题目和生成补充解析

所有学习记录默认保存在当前浏览器本地。使用者可以自行导出备份；项目不会把个人答题记录上传到服务器。

## 项目方向

本项目将作为个人知识题库持续维护，计划逐步完善：

- 接入更多课程、专业知识、证书考试与兴趣主题题库
- 让题库导入、分类、标签和校验流程更加通用
- 增加知识笔记与题目的双向关联
- 改进复习计划、间隔复习与跨学科学习统计
- 保持本地优先，并完善数据迁移和备份能力

具体题库会随个人学习需要调整，因此页面展示和题量以当前版本为准。

## 本地运行

需要 Node.js 18+（CI 使用 Node.js 24）。

```bash
git clone <你的仓库地址>
cd dlut-nihongo-quiz
npm install
npm run dev
```

常用命令：

| 命令                     | 作用                          |
| ------------------------ | ----------------------------- |
| `npm run dev`            | 启动本地开发服务器            |
| `npm run build`          | 执行类型检查并构建生产版本    |
| `npm run test`           | 运行 Vitest 测试              |
| `npm run parse:power-ai` | 将当前 Markdown 题库生成 JSON |
| `npm run parse:all`      | 重新生成项目内全部题库数据    |
| `npm run generate:meta`  | 更新题库数量元数据            |
| `npm run audit:banks`    | 检查题库结构和重复题          |
| `npm run format:check`   | 检查代码格式                  |

> `public/*-question-bank.json` 是生成文件。修改 `data/raw/` 中的源文件后，请运行对应解析命令并更新元数据，不要只手动编辑生成结果。

## 技术栈

- Vue 3、TypeScript、Vite
- Vue Router
- Dexie / IndexedDB
- Vitest

## 项目文档

- [项目结构](docs/project-structure.md)
- [题库维护](docs/question-bank.md)
- [部署说明](docs/deployment.md)
- [贡献指南](CONTRIBUTING.md)
- [安全策略](SECURITY.md)

## 内容、版权与使用说明

- **代码**采用 [Apache License 2.0](LICENSE) 许可。
- **题目、试卷及引用资料**的权利归各自权利人所有；本项目仅用于个人学习、知识整理和非商业交流。
- 若题库中存在错误、过时内容或权利问题，请通过当前仓库的 Issues 联系维护者。
- 请在遵守所在学校、单位和考试规则的前提下使用本项目；本项目不用于协助考试作弊。

## English Summary

**Personal Knowledge Quiz** is a local-first study and question-bank application built with Vue 3, TypeScript, Vite, and Dexie. It currently focuses on a power-industry AI theory bank and is intended to grow into a personal, multi-topic knowledge and review platform. It includes multiple practice modes, a wrong-answer notebook, mastery analytics, offline progress storage, data backup, and optional AI-assisted explanations.
