# 免費 AI 工具收集

本專案旨在收集並比較各種免費 AI 程式輔助工具的表現。

## 免費標準
不需要學生或特殊身分，每天平均可以用100次以上的請求，並且在測試範例中不會遇到限制（1次聊天不等於1次請求，比如過程中調用MCP也算1次請求，通常1次聊天會請求5次以上）。

目前省略以下程式或服務，但未來或許值得嘗試：
- Trae: 效果太差，很笨，而且某些模型要排隊。
- Cursor: 免費次數太少。
- Warp: 免費次數太少（一天5次）。
- Rovo Dev: 註冊的時候顯示使用人數已滿。
- ModelScope (API) : 需要中國手機號碼。
- OpenRouter (API) : 免費次數太少（一天50次，需要付費10美元升級每天1000次）。
- Groq (API) : RPM限制。

## 測試項目
- **五子棋遊戲** 
- **尋路演算法視覺化工具**

## 結果
各個項目的資料夾中，包含了 README.md 和生成的原始程式碼。

### cli（皆前三以上）
- iflow-kimi-k2-0905（平均95）
- gemini-gemini-25-pro（平均92.5）
- iflow-glm-46（平均92.5）

### cli（比 vsc 的遞補項目更高或同分）
- codebuddy-default（平均92.5）
- iflow-qwen3-coder（平均90）
- iflow-qwen3-max（平均85）
- iflow-deepseek-v32（平均81）
- codebuddy-gpt-5（平均77.5）

### vsc（皆前三以上）
- cline-openai-com-glm-46（平均92.5，不支援圖片/瀏覽器）

### vsc（遞補）
- cline-grok-code-fast（平均90，不支援圖片/瀏覽器）
- cline-gemini-gemini-25-pro（平均87.5）
- cline-cerebras-qwen-3-coder-480b-free（平均85，不支援圖片/瀏覽器）
- copilot-gemini-gemini-25-pro（平均82.5）
- cline-code-supernova（平均77.5）
