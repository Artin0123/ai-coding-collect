# 紀錄各項程式需要的全域規則和 MCP
列出 MCP 的 prompt：
```
列出所有你可以使用的工具以及簡單介紹他們的功能，一行一個，比如：
edit: 編輯檔案
search: 搜尋文字...
回答即可，最後計算共有幾個
```

必備，沒有這個功能就直接刪除：
- 執行終端機命令
- 新增和修改全域規則

附加功能（若有內建就用內建的，包含可手動開啟的功能，關閉不屬於以下項目的內建功能，以下列出內建當前項目的工具）：
- 思考 (Think Tool Server): copilot, cline, codebuddy
- 建立任務待辦清單：copilot, codebuddy, iflow

> 可快速開關 MCP 的工具：cline

補充功能（用於可快速開關 MCP 並保留狀態的程式，以下列出不能關閉當前項目的工具）：
- 瀏覽器控制 (Playwright Mcp)
- Context7

## 需加入的全域規則
[ai_instructions.md](https://gist.github.com/Artin0123/a522b6121b4169a2966fa01fc1a462d3)

## 需加入的 MCP
附加功能和補充功能皆必須和原本內建的功能不重複：
- copilot
- cline: Context7, Playwright Mcp
- codebuddy
- gemini: Think Tool Server
- iflow: Think Tool Server
