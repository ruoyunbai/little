<template>
  <div class="container">
    <!-- 人机对战
    联机对战
    围棋
    棋盘调节
    字母数字 -->

    <div class="importJSON">
      <button @click="exportJSON">导出当前棋局</button>

      <button @click="importJSON">导入历史棋局</button>
      <input type="file" id="file" accept=".json" />
      <p>使用说明：选择之前导出的棋局文件，之后双击导入覆盖当前棋局</p>
    </div>
    <br />
    <div class="showMessage">
      <!-- <p style="font-size: 2em; margin: 0">人机模式</p> -->
      <fieldset>
        <legend>游戏模式</legend>
        <ul>
          <li>
            <label for="easy">玩家对战</label>
            <input
              @click="notshowChossMachines"
              type="radio"
              checked
              id="people"
              name="mode"
              value="玩家对战"
            />
          </li>
          <li>
            <label for="curry">人机</label>
            <input
              @click="showChossMachines"
              type="radio"
              id="machine"
              name="mode"
              value="人机"
            />
          </li>
        </ul>
        
        <fieldset :class="machineButton">
          <legend>选择人机的强度</legend>
          <ul>
            <li>
              <label for="easy">小白</label>
              <input
                type="radio"
                checked
                id="easy"
                name="dif"
                value="小白"
                @click="chooseEasy"
              />
            </li>
            <li>
              <label for="curry">高手</label>
              <input
                type="radio"
                id="curry"
                name="dif"
                value="高手"
                @click="chooseDifficult"
              />
            </li>
          </ul>
        </fieldset>
        <div :class="machineButton">
          <button @click="machineChooseBlack">电脑托管黑子</button>
          <button @click="machineChooseWhite">电脑托管白子</button>
        </div>
      </fieldset>
    </div>

    <div>
      <canvas
        @click="clickBoard"
        @mousemove="showAnimation"
        id="mycanvas"
        v-bind:class="chessboard"
        :width="this.size * 30 + 30"
        :height="this.size * 30 + 30"
      >
      </canvas>
    </div>
    <div>
      <div class="showMessage">
        <p style="font-size: 2em; margin: 0">对局结果：</p>
        <h3 :class="colorStyle">{{ succMessage }}</h3>
      </div>
      <div class="showMessage">
        <h3>执子方：</h3>
        <canvas id="showMessage" height="30" width="100"> </canvas>
      </div>
      <div class="showMessage">
        <h3>操作：</h3>
        <button @click="back">悔棋</button>
      </div>
      <div v-bind:class="analyzeStyle" class="showMessage">
        <h3>战局回顾</h3>
        <label for="back">
          <button @click="analyze">回到棋局起点</button>
        </label>
        <div>
          <button @click="goBack">&lt;</button>
          (&lt;-前一步棋)(后一步棋->)
          <button @click="goForward">></button>
        </div>
      </div>
    </div>
    <br />
    <div class="showMessage">
      <button @click="clear">重新开始对局</button>
    </div>
  </div>
  <p>
    口诀：先手要攻，后手要守， 以攻为守，以守待攻。 攻守转换，慎思变化，
    先行争夺，地破天惊。 守取外势，攻聚内力， 八卦易守，成角易攻。
    阻断分隔，稳如泰山， 不思争先，胜如登天。 初盘争二，终局抢三，
    留三不冲，变化万千。 多个先手，细算次先， 五子要点，次序在前。
    斜线为阴，直线为阳， 阴阳结合，防不胜防。 连三连四，易见为明，
    跳三跳四，暗剑深藏。 己落一子，敌增一兵， 攻其要点，守其必争。
    势已形成，败即降临， 五子精华，一子输赢。
  </p>
</template>

<script>
import FileSaver from "file-saver";
export default {
  name: "go",
  watch: {
    color() {
      this.machine();
    },
    size(newV) {
      this.clear();

      console.log(newV);
    },
    isEnd(newV) {
      if (newV === true) {
        let s = "";
        if (this.successer === -1) {
          s = "白方";
          this.colorStyle = "white";
        } else {
          s = "黑方";
          this.colorStyle = "black";
        }
        this.succMessage = s + "获胜";
        for (let i = 0; i <= this.size; i++) {
          for (let j = 0; j <= this.size; j++) {
            this.board[i][j] = 0;
          }
        }
        this.chessboard = "end";
        this.analyzeStyle = "showMessage";
        this.step = this.history.length;
        console.log(this.step);
      }
    },
  },
  data() {
    return {
      stoneNum: 0,
      difficulty: "easy",
      boardGrade: null,
      machineColor: null,
      lastx: -1,
      lasty: -1,
      size: 19,
      colorStyle: "black",
      mycanvas: null,
      showMessage: null,
      ctx: null,
      ctxs: null,
      chessboard: "blackChessman",
      board: null,
      blackman: null,
      whiteman: null,
      analyzeStyle: "notdis",
      color: "b",
      isEnd: false,
      successer: null,
      succMessage: "还未分出胜负",
      history: [],
      step: 0,
      react: 0,
      d: null,
      machineButton: "notdis",
      gradeTable: null,
      turple: null,
      turpleTable: null,
    };
  },
  methods: {
    machine(){
      if (this.machineButton === "showMessage") {
        if (this.isEnd === false) {
          if (this.machineColor === this.color) {
            this.machinePlay();
          }
        }
      }
    },
    computeGradeAdvanced() {
      for (let x = 1; x <= this.size; x++) {
        for (let y = 1; y <= this.size; y++) {
          if (this.board[x][y] === 0) {
            let grade = 0;
            let dir = { right: [1, 0], down: [0, 1], rd: [1, 1], ld: [-1, 1] };
            for (let key in dir) {
              for (let t = 1; t <= 4; t++) {
                // if (this.inBoard(x + t * dir[key][0], y + t * dir[key][1])) {
                //   grade += this.turple[x + t * dir[key][0]][y + t * dir[key][1]][key];
                // }
                grade += this.turple[x][y][key];
                if (this.inBoard(x - t * dir[key][0], y - t * dir[key][1])) {
                  grade +=
                    this.turple[x - t * dir[key][0]][y - t * dir[key][1]][key];
                }
              }
            }

            this.boardGrade[x][y] = grade;
          }
        }
      }
    },
    computeTurple() {
      let sig = 0;
      if (this.color == "b") sig = 1;
      else sig = -1;
      for (let x = 1; x <= this.size; x++) {
        for (let y = 1; y <= this.size; y++) {
          let dir = { right: [1, 0], down: [0, 1], rd: [1, 1], ld: [-1, 1] };
          for (let key in dir) {
            let x1 = x,
              y1 = y,
              grade = -1,
              numsame = 0,
              numdif = 0;
            if (this.board[x1][y1] === sig) numsame++;
            else {
              if (this.board[x1][y1] === -1 * sig) {
                numdif++;
              }
            }
            // console.log(dir[key]);
            for (let t = 0; t < 4; t++) {
              x1 += dir[key][0];
              y1 += dir[key][1];
              if (!this.inBoard(x1, y1)) {
                // console.log(x1, y1);
                grade = 0;
                break;
              } else {
                if (this.board[x1][y1] === sig) numsame++;
                else {
                  if (this.board[x1][y1] === -1 * sig) {
                    numdif++;
                  }
                }
              }
            }
            if (grade === -1) {
              if (numdif === 0 && numsame === 0) {
                grade = this.turpleTable["none"][0];
              } else {
                if (numdif === 0) {
                  grade = this.turpleTable["same"][numsame];
                } else {
                  if (numsame === 0) {
                    grade = this.turpleTable["diff"][numdif];
                  } else {
                    grade = this.turpleTable["mixed"][0];
                  }
                }
              }
            }
            this.turple[x][y][key] = grade;
          }
        }
      }
    },
    machinePlayAdvanced() {
      if (this.isEnd === false) {
        this.initTurple();
        this.initGrade();
        this.computeTurple();
        this.computeGradeAdvanced();
        let max = 0,
          x1 = 10,
          y1 = 10;
        for (let x = 1; x <= this.size; x++) {
          for (let y = 1; y <= this.size; y++) {
            console.log(x, y, this.boardGrade[x][y]);
            if (this.board[x][y] === 0) {
              if (this.boardGrade[x][y] > max) {
                max = this.boardGrade[x][y];
                x1 = x;
                y1 = y;
              }
            }
          }
        }
        if (this.stoneNum === 0) {
          x1 = 10;
          y1 = 10;
        }
        console.log(x1, y1, max);
        this.drawStone(x1, y1, this.color);
        if (this.color === "b") {
          this.board[x1][y1] = 1;
        } else {
          this.board[x1][y1] = -1;
        }
        // console.log(this.board[x1][y1]);
        this.record(x1, y1);
        this.switchColor();
        this.check();
      }
    },
    chooseEasy() {
      this.difficulty = "easy";
    },
    chooseDifficult() {
      this.difficulty = "difficult";
    },
    boardAround() {
      for (let i = 0; i < this.size; i++) {
        this.board[20][i] = 2;
        this.board[0][i] = 2;
        this.board[i][20] = 2;
        this.board[i][0] = 2;
      }
    },
    inBoard(x, y) {
      if (x >= 1 && x <= 19 && y >= 1 && y <= 19) {
        return true;
      } else return false;
    },
    machinecheck(i, j) {
      let sig = 0;
      if (this.color == "b") sig = 1;
      else sig = -1;

      let dir = [
        [1, 1],
        [1, 0],
        [0, 1],
        [1, -1],
      ];
      let grade = [0, 0, 0, 0];
      for (let t = 0; t < 4; t++) {
        let r = i,
          c = j,
          defender = 0;
        let neg = 0,
          opt = 0;
        while (
          this.inBoard(r + dir[t][0], c + dir[t][1]) &&
          this.board[r + dir[t][0]][c + dir[t][1]] === sig
        ) {
          opt++;
          r += dir[t][0];
          c += dir[t][1];
        }
        if (this.board[r + dir[t][0]][c + dir[t][1]] != 0) defender++;
        r = i;
        c = j;
        while (
          this.inBoard(r - dir[t][0], c - dir[t][1]) &&
          this.board[r - dir[t][0]][c - dir[t][1]] === sig
        ) {
          neg++;
          r -= dir[t][0];
          c -= dir[t][1];
        }
        if (this.board[r - dir[t][0]][c - dir[t][1]] != 0) defender++;
        grade[t] = this.gradeTable[defender][neg + opt + 1];
      }
      let max = 0;
      for (let i = 0; i < 4; i++) {
        max += grade[i];
      }
      return max;
    },
    computeGrade(x, y) {
      this.boardGrade[x][y] = this.machinecheck(x, y);
    },
    machinePlay() {
      if (this.difficulty === "easy") {
        this.boardAround(); //围一圈，便于之后的函数书写
        this.initGrade();
        for (let i = 1; i <= this.size; i++) {
          for (let j = 1; j <= this.size; j++) {
            if (this.board[i][j] === 0) {
              this.computeGrade(i, j);
            }
          }
        }
        let x = 10,
          y = 10,
          max = 0;
        for (let i = 1; i <= this.size; i++) {
          for (let j = 1; j <= this.size; j++) {
            if (this.board[i][j] === 0 && this.boardGrade[i][j] > max) {
              max = this.boardGrade[i][j];
              x = i;
              y = j;
            }
          }
        }
        if (this.stoneNum === 0) {
          x = 10;
          y = 10;
        }
        // console.log("step", this.step);
        // console.log("value", max);
        // console.log(x, y);
        this.drawStone(x, y, this.color);
        if (this.color === "b") {
          this.board[x][y] = 1;
        } else {
          this.board[x][y] = -1;
        }
        // console.log(this.board[x][y]);
        this.record(x, y);
        this.switchColor();
        this.check();
      } else {
        this.machinePlayAdvanced();
      }
    },
    machineChooseWhite() {
      this.machineColor = "w";
      if (this.color === this.machineColor) {
        this.machinePlay();
      }
    },
    machineChooseBlack() {
      this.machineColor = "b";
      if (this.color === this.machineColor) {
        this.machinePlay();
      }
    },
    showChossMachines() {
      this.machineButton = "showMessage";
    },
    notshowChossMachines() {
      this.machineButton = "notdis";
    },
    showAnimation(event) {
      this.d = new Date();

      if (this.d.getMilliseconds() - this.react > 10) {
        this.react = this.d.getMilliseconds();
        if (this.isEnd === false) {
          let x = event.clientX - this.canvas.offsetLeft + 15;
          let y = event.clientY - this.canvas.offsetTop + 15;
          let r = Math.floor((x + 15) / 30);
          let l = Math.floor((y + 15) / 30);
          if (this.lastx != -1) {
            if (this.board[this.lastx][this.lasty] === 0) {
              this.ctx.fillStyle = "rgb(205, 155, 29)";
              // this.ctx.fillStyle = "rgb(0, 255, 0)";
              this.ctx.fillRect(
                this.lastx * 30 - 12,
                this.lasty * 30 - 12,
                24,
                24
              );
              this.ctx.strokeStyle = "rgb(255,255,255,1)";
              this.ctx.lineWidth = 2;

              if (this.lastx != 1) {
                this.ctx.beginPath();
                this.ctx.moveTo(this.lastx * 30 - 15, this.lasty * 30);
                this.ctx.lineTo(this.lastx * 30, this.lasty * 30);

                this.ctx.stroke();
              }
              if (this.lastx != 19) {
                this.ctx.beginPath();
                this.ctx.moveTo(this.lastx * 30 + 15, this.lasty * 30);
                this.ctx.lineTo(this.lastx * 30, this.lasty * 30);

                this.ctx.stroke();
              }
              if (this.lasty != 19) {
                this.ctx.beginPath();
                this.ctx.moveTo(this.lastx * 30, this.lasty * 30 + 15);
                this.ctx.lineTo(this.lastx * 30, this.lasty * 30);

                this.ctx.stroke();
              }
              if (this.lasty != 1) {
                this.ctx.beginPath();
                this.ctx.moveTo(this.lastx * 30, this.lasty * 30 - 15);
                this.ctx.lineTo(this.lastx * 30, this.lasty * 30);

                this.ctx.stroke();
              }

              /*横向线条*/
            }
          }

          if (r >= 1 && r <= this.size && l >= 1 && l <= this.size) {
            if (this.board[r][l] === 0) {
              this.lastx = r;
              this.lasty = l;
              this.drawunreal(r, l);
            }
          }
        }
      } else {
        this.d = new Date();
        this.react = this.d.getMilliseconds();
      }
    },
    drawunreal(r, l) {
      // this.ctx.drawImage(stone, 30 * r - 15, 30 * l - 15);
      this.ctx.strokeStyle = "rgb(255, 0,0)";
      this.ctx.strokeRect(r * 30 - 10, 30 * l - 10, 20, 20);
    },
    exportJSON() {
      const data = JSON.stringify(this.history);
      const blob = new Blob([data], { type: "" });
      FileSaver.saveAs(blob, "gobang_history.json");
    },
    importJSON() {
      const file = document.getElementById("file").files[0];
      const reader = new FileReader();
      reader.readAsText(file);
      const _this = this;
      reader.onload = function () {
        _this.history = JSON.parse(this.result);
      };
      this.initBoard();
      this.isEnd = false;
      this.analyzeStyle = "notdis";
      this.step = 0;
      while (this.step < this.history.length) {
        this.drawStone(
          this.history[this.step].x,
          this.history[this.step].y,
          this.color
        );
        if (this.color === "b")
          this.board[this.history[this.step].x][this.history[this.step].y] = 1;
        else {
          this.board[this.history[this.step].x][this.history[this.step].y] = -1;
        }
        this.switchColor();
        this.check();
        this.step = this.step + 1;
      }
    },
    goBack() {
      if (this.step > 0) {
        this.initBoard();
        this.step--;
        for (let i = 0; i < this.step; i++) {
          this.drawStone(this.history[i].x, this.history[i].y, this.color);
          this.switchColor();
          this.chessboard = "end";
        }
      }
    },
    goForward() {
      if (this.step < this.history.length) {
        this.drawStone(
          this.history[this.step].x,
          this.history[this.step].y,
          this.color
        );
        // console.log(this.history[this.step].x);
        // console.log(this.history[this.step].y);
        // console.log(this.step);
        this.switchColor();
        this.chessboard = "end";
        this.check();

        this.step = this.step + 1;
      }
    },
    analyze() {
      this.initBoard();
      this.step = 0;
    },
    back() {
      if (this.isEnd === false) {
        if (this.history.length === 0) alert("已经无棋可悔");
        else {
          let s = this.history.pop();
          this.board[s.x][s.y] = 0;
          this.drowChessBoard();

          console.log(this.history.length);
          this.color = "b";
          this.ctxs.drawImage(this.blackman, 50, 0);
          this.chessboard = "blackChessman";
          for (let i = 0; i < this.history.length; i++) {
            this.drawStone(this.history[i].x, this.history[i].y, this.color);
            this.switchColor();
          }
        }
      } else {
        this.initBoard();
        let s = this.history.pop();
        this.board[s.x][s.y] = 0;

        console.log(this.history.length);

        for (let i = 0; i < this.history.length; i++) {
          this.drawStone(this.history[i].x, this.history[i].y, this.color);
          this.switchColor();
        }
      }
    },
    record(r, l) {
      this.history.push({ x: r, y: l, color: this.color });
    },
    clear() {
      this.initBoard();
      this.history = [];
      this.isEnd = false;
      this.analyzeStyle = "notdis";
      this.machine();
    },
    initBoard() {
      this.stoneNum = 0;
      this.initArry();
      this.drowChessBoard();
      this.colorStyle = "black";
      this.succMessage = "还未分出胜负";
      this.chessboard = "blackChessman";
      this.ctxs.drawImage(this.blackman, 50, 0);
      this.color = "b";
    },
    drowChessBoard() {
      this.showMessage = document.getElementById("showMessage");
      console.log(this.showMessage);
      this.ctxs = this.showMessage.getContext("2d");
      this.canvas = document.getElementById("mycanvas");
      console.log(this.canvas);
      this.ctx = this.canvas.getContext("2d");
      this.ctx.fillStyle = "rgb(205, 155, 29)";
      // this.ctx.fillStyle = "rgb(205, 155, 29)";
      this.ctx.fillRect(0, 0, this.size * 30 + 30, this.size * 30 + 30);
      this.ctx.strokeStyle = "rgb(255, 255, 255)";
      this.ctx.lineWidth = 2;
      for (let i = 0; i < this.size; i++) {
        /*横向线条*/
        this.ctx.moveTo(30, 30 + i * 30);
        this.ctx.lineTo(this.size * 30, 30 + i * 30);
        this.ctx.stroke();
        /*纵向线条*/
        this.ctx.moveTo(30 + i * 30, 30);
        this.ctx.lineTo(30 + i * 30, this.size * 30);
        this.ctx.stroke();
      }
    },
    initTurple() {
      this.turpleTable = {
        none: [7],
        same: [0, 35, 800, 15000, 800000],
        diff: [0, 15, 400, 1800, 100000],
        mixed: [0],
      };
      this.turple = [
        [
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
        ],
      ];
      for (let i = 0; i < 22; i++) {
        this.turple.push([
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
          { right: -1, down: -1, rd: -1, ld: -1 },
        ]);
      }
    },
    initGrade() {
      this.gradeTable = [
        [0, 20, 100, 500, 2500, 10000],
        [0, 0, 20, 100, 500, 10000],
        [0, 0, 0, 0, 0, 10000],
      ];
      this.boardGrade = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ];
      for (let t = 0; t < 22; t++) {
        this.boardGrade.push([
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ]);
      }
    },
    initArry() {
      this.board = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ];
      for (let t = 0; t < 22; t++) {
        this.board.push([
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ]);
      }
    },
    init() {
      this.stoneNum = 0;
      this.d = new Date();
      this.blackman = new Image();
      this.blackman.src = "pic/stone_1.svg";
      this.whiteman = new Image();
      this.whiteman.src = "pic/stone_-1.svg";
      this.blackman.onload = () => {
        this.ctxs.drawImage(this.blackman, 50, 0);
      };
    },
    clickBoard(event) {
      if (this.isEnd != true) {
        let x = event.clientX - this.canvas.offsetLeft + 15;
        let y = event.clientY - this.canvas.offsetTop + 15;
        let r = Math.floor((x + 15) / 30);
        let l = Math.floor((y + 15) / 30);

        if (r >= 1 && r <= this.size && l >= 1 && l <= this.size) {
          if (this.board[r][l] === 0) {
            this.drawStone(r, l, this.color);
            if (this.color === "b") {
              this.board[r][l] = 1;
            } else {
              this.board[r][l] = -1;
            }
            this.record(r, l);
            this.check();
            this.switchColor();
          }
        }
      }
    },
    drawStone(row, col, color) {
      
      this.stoneNum++;
      let stone = null;
      if (color === "b") {
        stone = this.blackman;
        this.ctx.shadowColor = "black";
      } else {
        stone = this.whiteman;
        this.ctx.shadowColor = "white";
      }

      this.ctx.shadowBlur = 5;
      this.ctx.drawImage(stone, 30 * row - 15, 30 * col - 15);
      this.ctx.shadowBlur = 0;
    },
    switchColor() {
      if (this.color === "b") {       
        this.chessboard = "whiteChessman";
        this.ctxs.drawImage(this.whiteman, 50, 0);
        this.color = "w";
      } else {
        this.chessboard = "blackChessman";
        this.ctxs.drawImage(this.blackman, 50, 0);
        this.color = "b";
      }
    },
    check() {
      
      for (let i = 1; this.isEnd === false && i <= this.size; i++) {
        for (let j = 1; this.isEnd === false && j <= this.size; j++) {
          if (this.board[i][j] != 0) {
            let r = i,
              c = j;
            let dir = [
              [1, 1],
              [1, 0],
              [0, 1],
              [1, -1],
            ];
            for (let t = 0; t < 4; t++) {
              for (let m = 0; m < 4; m++) {
                if (r + dir[t][0] > this.size || r + dir[t][0] < 1) break;
                if (c + dir[t][1] > this.size || c + dir[t][1] < 1) break;
                if (
                  this.board[r + dir[t][0]][c + dir[t][1]] != this.board[r][c]
                )
                  break;
                r += dir[t][0];
                c += dir[t][1];
                if (m === 3) {              
                  this.successer = this.board[r][c];
                  this.isEnd = true;
                }
              }
            }
          }
        }
      }
    },
  },

  mounted() {
   
    this.drowChessBoard();
    this.initArry();
    this.init();
    if(document.getElementById("readme")!=null)
     { document.body.removeChild(document.getElementById("readme"))}
       if(document.getElementById("btn")!=null)
     { document.body.removeChild(document.getElementById("btn"))}
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.blackChessman {
  cursor: url("../../public/pic/stone_1.svg"), pointer;
}
.whiteChessman {
  cursor: url("../../public/pic/stone_-1.svg"), pointer;
}
.end {
  cursor: pointer;
}
.container {
  column-count: 3;
}
button {
  font-size: 20px;
  background-color: rgb(172, 133, 57);
}
.showMessage {
  background-color: rgb(255, 204, 102);
}
.black {
  margin: 0;
  color: black;
}
.white {
  margin: 0;
  color: white;
}

.notdis {
  display: none;
}
.importJSON {
  border: 10px solid rgba(187, 119, 31, 0.931);
  background-color: rgb(245, 218, 132);
}
label {
  font: 0.8em "typewriter", sans-serif;
}
button {
  font: bold 1em sans-serif;
  border: 2px solid #333;
  border-radius: 5px;
  background: none;

  cursor: pointer;

  -webkit-transform: rotate(-1.5deg);
  -moz-transform: rotate(-1.5deg);
  -ms-transform: rotate(-1.5deg);
  -o-transform: rotate(-1.5deg);
  transform: rotate(-1.5deg);
}

button:after {
  content: "";
}

button:hover,
button:focus {
  outline: none;
  background: #000;
  color: #fff;
}
input,
textarea {
  font: 0.9em/1.5em "handwriting", sans-serif;

  border: none;
  padding: 0 10px;
  margin: 0;

  background: none;
}
label {
  font: 1.3em "typewriter", sans-serif;
}
</style>
