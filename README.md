# 免費 AI 工具收集

本專案旨在收集並比較各種免費 AI 程式輔助工具的表現。

## 程式轉移前需使用的 Prompt
連結（整理專案重點和任務待辦清單）TODO

## 免費標準
不需要學生或特殊身分，並且在測試範例中不報錯（1次聊天不等於1次請求，比如過程中調用MCP也算1次請求，通常1次聊天會請求5次以上）。
上下文視窗 >= 60K (60,000)
TPM >= 60K (60,000)
RPM >= 10
RPD >= 100

目前省略以下程式或服務，但未來或許值得嘗試：
- Trae: 效果太差，很笨，而且某些模型要排隊
- Cursor: 免費次數太少
- Warp: 免費次數太少（一天5次）
- Rovo Dev: 註冊的時候顯示使用人數已滿
- Tencent Cloud CodeBuddy: VSCode 擴充版本，無法添加全域規則
- ModelScope (API): 需要中國手機號碼
- OpenRouter (API): 免費次數太少（一天50次，需要付費10美元升級每天1000次）
- Gemini (API): 2.5 Pro 的 RPM 太低
- Groq (API): 超出速率限制
- Cerebras (API): 超出速率限制
- Mistral (API): service_tier_capacity_exceeded
- chatanywhere (API): 輸入限制太低，需小於 4096 tokens

## 測試項目
- **五子棋遊戲** 
- **尋路演算法視覺化工具**

## 結果
各個項目的資料夾中，包含了 README.md 和生成的原始程式碼。

### CLI（前二）
- iflow-kimi-k2-0905（平均 95）
- gemini-gemini-25-pro（平均 92.5，同分）
- iflow-glm-46（平均 92.5，同分）
- codebuddy-default（平均 92.5，同分）

### VSC（前二）
- cline-code-supernova（平均 87.5）
- copilot-google-gemini-25-flash（平均 85）