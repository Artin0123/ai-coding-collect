後來發現 Dijkstra 和 BFS 的效果是一樣的，懶得重跑了，所以只測試這兩個。

## 分數統計
### cli
- codebuddy-default: 25,20,10,10,30 = 95
- codebuddy-gemini-25-pro: 10,5,10,10,20 = 55
- codebuddy-gpt-5: 10,20,10,10,25 = 75
- gemini-gemini-25-pro: 25,20,5,10,30 = 90
- iflow-deepseek-v32: 17,15,10,10,30 = 82
- iflow-glm-46: 25,15,20,25,30 = 90
- iflow-kimi-k2-0905: 25,20,5,10,30 = 90
- iflow-qwen3-coder: 25,25,10,10,30 = 100
- iflow-qwen3-max: 25,10,0,10,30 = 75

### vsc
- cline-cerebras-qwen-3-coder-480b-free: 25,15,10,5,25 = 80
- cline-code-supernova: 25,10,5,5,30 = 75
- cline-gemini-gemini-25-pro: 25,20,10,10,30 = 95
- cline-grok-code-fast: 25,20,5,5,25 = 80
- cline-openai-com-glm-46: 25,20,10,10,30 = 95
- copilot-gemini-gemini-25-pro: 25,20,5,10,30 = 90

## 高到低前三
### cli
- iflow-qwen3-coder
- codebuddy-default
- gemini-gemini-25-pro
- iflow-glm-46（並列第三）
- iflow-kimi-k2-0905（並列第三）

### vsc
- cline-gemini-gemini-25-pro
- cline-openai-com-glm-46
- copilot-gemini-gemini-25-pro