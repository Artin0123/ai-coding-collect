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

附加功能（若程式有內建就用內建的，關閉其它的內建功能）：
- 思考 (Think Tool Server): copilot, cline
- 建立任務待辦清單：copilot, codebuddy, iflow

> 可快速開關 MCP 的工具：cline

用於可快速開關 MCP 並保留狀態的程式：
- 瀏覽器控制 (Playwright Mcp)
- 擷取網頁內容 (Fetch)
- 網路搜尋 (Brave Search)
- 圖片分析 (Gemini Vision)
- Context7

## 需加入的全域規則
提示可用的工具、查網頁前需回報勿瞎掰：
```
TODO
```
建立任務待辦清單 (cline, gemini):
```
TODO
```

## 需加入的 MCP
附加的功能必須和原本內建的功能（包含可手動開啟的功能）不重複：
- copilot
- cline: Context7, Fetch, Brave Search, Playwright Mcp, Gemini Vision
- gemini: Think Tool Server
- codebuddy: Think Tool Server
- iflow: Think Tool Server
