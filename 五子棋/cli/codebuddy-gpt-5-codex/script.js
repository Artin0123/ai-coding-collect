const BOARD_SIZE=15;
const CELL_SIZE=40;
const PADDING=40;
const STONE_RADIUS=14;
const HUMAN=1;
const AI=2;
const directions=[[0,1],[1,0],[1,1],[1,-1]];
const canvas=document.getElementById("board");
const ctx=canvas.getContext("2d");
const statusEl=document.getElementById("status");
const resetBtn=document.getElementById("reset");
let board;
let currentPlayer;
let gameOver;
init();
canvas.addEventListener("click",handleCanvasClick);
resetBtn.addEventListener("click",init);
function init(){
board=Array.from({length:BOARD_SIZE},()=>Array(BOARD_SIZE).fill(0));
currentPlayer=HUMAN;
gameOver=false;
statusEl.textContent="輪到：黑方";
drawBoard();
}
function handleCanvasClick(event){
if(gameOver||currentPlayer!==HUMAN)return;
const point=locatePoint(event);
if(!point)return;
const {row,col}=point;
if(board[row][col]!==0)return;
makeMove(row,col,HUMAN);
if(gameOver)return;
currentPlayer=AI;
statusEl.textContent="輪到：白方";
setTimeout(()=>{
if(!gameOver)aiMove();
},180);
}
function aiMove(){
let bestScore=-Infinity;
let candidates=[];
for(let r=0;r<BOARD_SIZE;r++){
for(let c=0;c<BOARD_SIZE;c++){
if(board[r][c]!==0)continue;
const score=scoreCell(r,c);
if(score>bestScore){
bestScore=score;
candidates=[[r,c]];
}else if(Math.abs(score-bestScore)<1e-6){
candidates.push([r,c]);
}
}
}
if(candidates.length===0)return;
const [row,col]=candidates[Math.floor(Math.random()*candidates.length)];
makeMove(row,col,AI);
if(gameOver)return;
currentPlayer=HUMAN;
statusEl.textContent="輪到：黑方";
}
function scoreCell(row,col){
const aiLine=maxLineLength(row,col,AI);
if(aiLine>=5)return 1e9;
const humanLine=maxLineLength(row,col,HUMAN);
if(humanLine>=5)return 5e8;
const aiThreat=lineThreat(row,col,AI);
const humanThreat=lineThreat(row,col,HUMAN);
return aiThreat*1.2+humanThreat*1.05+Math.random();
}
function lineThreat(row,col,player){
let total=0;
for(const [dr,dc] of directions){
const forward=countInDirection(row,col,dr,dc,player);
const backward=countInDirection(row,col,-dr,-dc,player);
const openForward=openEnd(row,col,dr,dc,forward);
const openBackward=openEnd(row,col,-dr,-dc,backward);
const count=1+forward+backward;
const openEnds=openForward+openBackward;
total+=patternScore(count,openEnds);
}
return total;
}
function maxLineLength(row,col,player){
let longest=0;
for(const [dr,dc] of directions){
const forward=countInDirection(row,col,dr,dc,player);
const backward=countInDirection(row,col,-dr,-dc,player);
const total=1+forward+backward;
if(total>longest)longest=total;
}
return longest;
}
function countInDirection(row,col,dr,dc,player){
let count=0;
let r=row+dr;
let c=col+dc;
while(inBounds(r,c)&&board[r][c]===player){
count++;
r+=dr;
c+=dc;
}
return count;
}
function openEnd(row,col,dr,dc,steps){
const r=row+dr*(steps+1);
const c=col+dc*(steps+1);
if(!inBounds(r,c))return 0;
return board[r][c]===0?1:0;
}
function patternScore(count,openEnds){
if(count>=5)return 1000000;
if(count===4){
if(openEnds===2)return 100000;
if(openEnds===1)return 10000;
return 0;
}
if(count===3){
if(openEnds===2)return 5000;
if(openEnds===1)return 500;
return 0;
}
if(count===2){
if(openEnds===2)return 400;
if(openEnds===1)return 80;
return 0;
}
if(count===1){
if(openEnds===2)return 30;
if(openEnds===1)return 10;
return 1;
}
return 0;
}
function makeMove(row,col,player){
board[row][col]=player;
drawBoard();
if(checkWin(row,col,player)){
gameOver=true;
statusEl.textContent=player===HUMAN?"黑方勝利":"白方勝利";
return;
}
if(isBoardFull()){
gameOver=true;
statusEl.textContent="平局";
}
}
function checkWin(row,col,player){
for(const [dr,dc] of directions){
let count=1;
count+=countDirection(row,col,dr,dc,player);
count+=countDirection(row,col,-dr,-dc,player);
if(count>=5)return true;
}
return false;
}
function countDirection(row,col,dr,dc,player){
let count=0;
let r=row+dr;
let c=col+dc;
while(inBounds(r,c)&&board[r][c]===player){
count++;
r+=dr;
c+=dc;
}
return count;
}
function isBoardFull(){
for(let r=0;r<BOARD_SIZE;r++){
for(let c=0;c<BOARD_SIZE;c++){
if(board[r][c]===0)return false;
}
}
return true;
}
function locatePoint(event){
const rect=canvas.getBoundingClientRect();
const scaleX=canvas.width/rect.width;
const scaleY=canvas.height/rect.height;
const x=(event.clientX-rect.left)*scaleX;
const y=(event.clientY-rect.top)*scaleY;
const gridX=(x-PADDING)/CELL_SIZE;
const gridY=(y-PADDING)/CELL_SIZE;
const col=Math.round(gridX);
const row=Math.round(gridY);
if(!inBounds(row,col))return null;
const ix=PADDING+col*CELL_SIZE;
const iy=PADDING+row*CELL_SIZE;
const dist=Math.hypot(x-ix,y-iy);
if(dist>CELL_SIZE*0.4)return null;
return {row,col};
}
function inBounds(row,col){
return row>=0&&row<BOARD_SIZE&&col>=0&&col<BOARD_SIZE;
}
function drawBoard(){
ctx.clearRect(0,0,canvas.width,canvas.height);
ctx.fillStyle="#DEB887";
ctx.fillRect(0,0,canvas.width,canvas.height);
ctx.strokeStyle="#8B4513";
ctx.lineWidth=2;
for(let i=0;i<BOARD_SIZE;i++){
const pos=PADDING+i*CELL_SIZE;
ctx.beginPath();
ctx.moveTo(PADDING,pos);
ctx.lineTo(PADDING+(BOARD_SIZE-1)*CELL_SIZE,pos);
ctx.stroke();
ctx.beginPath();
ctx.moveTo(pos,PADDING);
ctx.lineTo(pos,PADDING+(BOARD_SIZE-1)*CELL_SIZE);
ctx.stroke();
}
drawStars();
drawStones();
}
function drawStars(){
const stars=[[3,3],[3,11],[7,7],[11,3],[11,11]];
ctx.fillStyle="#8B4513";
for(const [r,c] of stars){
ctx.beginPath();
ctx.arc(PADDING+c*CELL_SIZE,PADDING+r*CELL_SIZE,4,0,Math.PI*2);
ctx.fill();
}
}
function drawStones(){
for(let r=0;r<BOARD_SIZE;r++){
for(let c=0;c<BOARD_SIZE;c++){
if(board[r][c]===0)continue;
drawStone(r,c,board[r][c]);
}
}
}
function drawStone(row,col,player){
const x=PADDING+col*CELL_SIZE;
const y=PADDING+row*CELL_SIZE;
const gradient=ctx.createRadialGradient(x-6,y-6,6,x,y,STONE_RADIUS);
if(player===HUMAN){
gradient.addColorStop(0,"#4f4f4f");
gradient.addColorStop(0.6,"#1a1a1a");
gradient.addColorStop(1,"#020202");
}else{
gradient.addColorStop(0,"#ffffff");
gradient.addColorStop(0.6,"#dddddd");
gradient.addColorStop(1,"#bcbcbc");
}
ctx.beginPath();
ctx.fillStyle=gradient;
ctx.arc(x,y,STONE_RADIUS,0,Math.PI*2);
ctx.fill();
ctx.strokeStyle="rgba(0,0,0,0.35)";
ctx.lineWidth=1;
ctx.stroke();
}