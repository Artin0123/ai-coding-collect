## Project Brief

**Project Goal:** Create a fully functional HTML, CSS, and JavaScript Gomoku (Five-in-a-row) game with an AI opponent.

**Game Rules:**
- Standard 15x15 board with 5 star points.
- Pieces must be placed on intersections.
- Player (black) goes first, AI (white) goes second.
- Five in a row (horizontal, vertical, or diagonal) wins.
- Cannot place a piece on an occupied intersection.

**UI Design Specifications:**
- Background color: #F5E6D3 (beige)
- Board color: #DEB887 (light brown)
- Board lines: #8B4513 (dark brown), 2px width.
- Pieces should display fully on the outermost lines.
- Board centered, clean and aesthetic interface.
- Black and white pieces: gradient with reflection effect.
- Restart button:
  - Background: #4A90E2
  - Text: #FFFFFF

**Functional Requirements:**
- Click to place pieces.
- AI responds automatically after player's move.
- Display win message and stop game on win.
- 'Restart' button resets the game.
- Display current turn (Black/White).

**AI Strategy:**
- Consider offense and defense.
- Prevent player from connecting five, while trying to connect its own five.

**Technical Constraints:**
- Pure HTML, CSS, JavaScript.
- No external libraries or storage mechanisms.
- Three files: `index.html`, `style.css`, `script.js`.
