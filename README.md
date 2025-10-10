# 免費 AI 程式輔助工具收集
本專案旨在收集並比較各種免費 AI 程式輔助工具的表現。

## 免費規則
不需要學生或特殊身分，並且在測試範例中，刪除連續兩次失敗的方式（1次聊天不等於1次請求，比如過程中調用MCP也算1次請求，通常1次聊天會請求5次以上）。
上下文視窗 >= 60K (60,000)
TPM >= 60K (60,000)
RPM >= 10
RPD >= 100

目前省略以下程式或服務，但未來或許值得嘗試：
- Trae: 效果太差，很笨，而且某些模型要排隊
- Cursor: 免費次數太少
- Warp: 免費次數太少（平均一天5次）
- Rovo Dev: 註冊的時候顯示使用人數已滿
- Tencent Cloud CodeBuddy: VSCode 擴充版本，無法添加全域規則
- OpenRouter (API): 免費次數太少（一天50次，需要付費10美元升級每天1000次）
- ModelScope (API): 需要中國手機號碼
- Groq (API): Request Entity Too Large
- chatanywhere (API): 輸入限制太低，需小於 4096 tokens

> 目前測試 codebuddy 會限制生成內容：抱歉，我僅支援防禦性資安相關任務。（需再觀察）

## 測試項目
- **五子棋遊戲** 
- **尋路演算法視覺化工具**

## 結果
各個項目的資料夾中，包含了 README.md 和生成的原始程式碼。

### 前三 CLI
- codebuddy-gemini-25-pro 9.0
- codebuddy-gpt-5-codex 9.0
- iflow-glm-46 8.5
- iflow-deepseek-v32 8.5
- iflow-kimi-k2-0905 8.5
- qwen 8.5

### 前三 VSC
- cline-grok-code-fast 8.0
- copilot-google-gemini-25-flash 8.0
- cline-cerebras-qwen-3-coder-free 8.0