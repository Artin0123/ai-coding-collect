# Project Brief: A* and Dijkstra Pathfinding Visualization Tool

## Goals
- Create an interactive HTML-based pathfinding visualizer
- Implement two algorithms: A* and Dijkstra
- Provide real-time animated visualization of algorithm execution
- Allow user interaction for setting start/end points and obstacles
- Display statistics and pathfinding results

## Scope
- Single HTML file with embedded CSS and JS (no external libraries)
- 15x15 grid visualization
- Click/drag interfaces for obstacle creation
- Step-by-step algorithm animation (10ms delay per step)
- Control panel with buttons and algorithm selection
- Statistics display for runtime metrics

## Requirements
### Core Features
- 15x15 grid with customizable start/end/obstacles
- A* algorithm with Manhattan distance heuristic
- Dijkstra algorithm implementation
- Animated visualization (search process → final path)
- Interactive controls: set start/end, clear/reset grid
- Statistics: visited nodes, path length, execution time

### UI/UX
- Centered layout with clean design
- Color-coded grid states
- Button controls with consistent styling
- Status display
- Disabled controls during animation

### Technical Constraints
- Vanilla HTML/CSS/JS only
- No external dependencies
- Responsive to mouse events
- 10ms animation delay
- Proper error handling for no-path scenarios
