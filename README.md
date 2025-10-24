# AI 程式輔助工具收集
本來想只紀錄免費的，但是後來想想反正我平常還是用那些更好的模型或工具，因為用更好的模型或工具 = 省時間試錯，比起為了免費而折騰低階工具更有意義，因此以下列出低價/免費的管道，若能用就先用：

- GitHub Copilot: GitHub 官方 + VSCode 內建 = 主流保證，有學生方案夠了，沒有學生方案就到淘寶等管道買一個，永久號 230 RMB
- Cursor: 有學生方案，只是不容易通過驗證，不過就算有學生方案也不能爽用自選模型，超過一定數量的請求後也會降級成和免費帳號一樣。

## 規則

以下條件需完全符合：

- 模型需為可用的最新世代，比如 gemini 2.5 pro > gemini 2.0 pro
- 若有顯示具體模型名稱，只測試以下的模型家族：
    1. GitHub Copilot 和 Cursor 皆擁有的模型家族：gpt, claude, grok, gemini
    2. CLI 的模型家族（不含前面重複的內容）：deepseek, glm, kimi, qwen
- 若來源是自己在 OpenRouter 上建立的 API key，只測試 GitHub Copilot 提供的免費模型
- 若來源是 Cursor，只測試有思考能力的模型

---

在測試範例中，刪除連續兩次失敗的產品或服務（含輪詢），每天至少要能用 20 次對話或 100 次請求（一次對話不等於一次請求，比如過程中調用 MCP 也算一次請求）

目前省略以下產品或服務，但未來或許值得嘗試：

- Trae: 效果太差，好的模型要排隊
- Qoder: 似乎不能添加全域規則
- Kiro: 每個月 50 credits，五子棋範例中，用最低階的 auto 至少需要 0.7 credits
- Warp: 每個月 150 credits，五子棋範例中，用最低階的 haiku 至少需要 3 credits（而且程式用起來很卡）
- Codebuff: 若邀請全滿，每個月 2000 credits，五子棋範例中，用最低階的 lite 至少需要 18 credits
- Rovo Dev: 無法執行
- CodeBuddy (VSCode extensions): 不能添加全域規則
- ModelScope (API): 需要中國手機號碼
- Groq (API): 卡上限
- chatanywhere (API): 卡上限
- Any Router (API): 不能保證隨時可用
- Agent Router (API): 不能保證隨時可用
- Augment: $
- Claude Code: $
- Codex: $
- CodeBuddy: $

## 測試項目

- **五子棋遊戲** 
- **尋路演算法視覺化工具**

## 結果
各個項目的資料夾中，包含了 README.md 和生成的原始程式碼。
