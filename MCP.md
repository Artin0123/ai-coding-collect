# 紀錄各項程式需要的 MCP
prompt: 
```
列出所有你可以使用的工具以及簡單介紹他們的功能，一行一個，比如：
edit: 編輯檔案
search: 搜尋文字...
回答即可，最後計算共有幾個
```

## 功能
必備：  
- 執行終端機命令

附加：  
- 擷取網頁內容 (Fetch) : copilot, codebuddy, iflow, gemini
- 網路搜尋 (Brave Search) : codebuddy, iflow, gemini
- 建立任務待辦清單 (SystemPrompt TaskChecker) : copilot, codebuddy, iflow, cline
- 思考 (Sequential Thinking) : copilot
- 瀏覽器控制 (Playwright Mcp) : cline
- 記憶：codebuddy, iflow

## 需加入的MCP
和原本程式不重複

- copilot: Context7, Brave Search, Playwright Mcp
- cline: Context7, Fetch, Brave Search, Sequential Thinking
- codebuddy: Context7, Sequential Thinking, Playwright Mcp
- iflow: Context7, Sequential Thinking, Playwright Mcp
- gemini: Context7, SystemPrompt TaskChecker, Sequential Thinking, Playwright Mcp
