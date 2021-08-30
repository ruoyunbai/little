
var input = null;
let fixed = false;
let points = null;
let name = null;
var conn;
// let ws = null;
let is_ws_open = false;
// 如果开启input，禁止移动,默认关闭
var input_deny_move_key = false;
// 输入的消息队列
// var input_messages_queue = [];
var show_message_box = null;
let ctx = null;
let canvas = null;
let background = null;
let back_size = {
  x: 5184,
  y: 3456
};
let back_position = {
  x: 0,
  y: 0
};
let back_range = {
  x: 0,
  y: 0,
}
// let size = 50;
// let interval = 30;
let matrix_poi = {
  x: 0,
  y: 0
};
var move_direction = {
  up: false,
  down: false,
  left: false,
  right: false
};
var move_speed = 30;
function initCtx() {
  name = prompt("请取一个名字吧");
  var btn = document.createElement("button")
  btn.setAttribute("id", "btn")
  btn.setAttribute("style", "" +
    "position:fixed;" +
    "left:5px;" +
    "top:0px;" +
    "width:500px;" +
    "height:50;" +
    "background-color:rgba(15,15,15,0.9);" +
    // "border:1px solid rgba(200,200,0,0.5);" +
    "color:rgba(200,200,200,0.8);" +
    "font-size:1.5em;" +
    "cursor:default;" +
    "border-radius:5px;");
  btn.innerHTML = "画面锁定";
  document.body.appendChild(btn);
  btn.addEventListener("click", () => {
    if (btn.innerHTML == "解除画面锁定") {
      btn.innerHTML = "画面锁定"
      fixed = false;
    }
    else {
      btn.innerHTML = "解除画面锁定"
      fixed = true;
    }
  })
  canvas = document.getElementById('space');
  console.log(canvas);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx = document.getElementById('space').getContext('2d');
  ctx.shadowColor = "white";
  ctx.shadowBlur = 10;
  // matrix_poi = {
  //   x: canvas.width / 2,
  //   y: canvas.height / 2
  // }
  background = new Image();
  background.src = "pic/autum.jpg";
  back_range.x = canvas.width - back_size.x;
  back_range.y = canvas.height - back_size.y


  matrix_poi = {
    x: 990,
    y: 420
  }
  // visual.x = canvas.width / 2;
  // visual.y = canvas.height / 2;

  // // 初始化粒子范围
  // points_scope.x.max = canvas.width;
  // points_scope.y.max = canvas.height;

  // // 初始化粒子
  // points = randomPoint();

  // bot_status.bot_id = Math.random().toString(36).substr(2);

  // randomPointsUpdate()
}
function createMessageBubble(value) {
  var bubble = document.createElement('p')
  bubble.innerHTML = "<span style='padding:0 5px;margin:5px 0;display:inline-block;background-color:rgb(200,200,0,0.5);border:1px solid rgba(200,200,200,0.2);border-radius:10px;'>" + value + "</span>";
  show_message_box.appendChild(bubble)

  setTimeout(() => {
    show_message_box.removeChild(bubble)
  }, 1000 * 15);
}
function sendMessage() {
  if (!input || !input.value) {
    return false;
  }

  var value = input.value;
  input.blur();

  // 创建div
  if (show_message_box == null) {
    show_message_box = document.createElement("div");
    show_message_box.setAttribute("style", "position:fixed;" +
      "left:" + (matrix_poi.x) + "px;" +
      "bottom:" + (canvas.height - matrix_poi.y + 20) + "px;" +
      "color:green;" +
      "font-size:2em"
    );
    document.body.appendChild(show_message_box)
  }

  createMessageBubble(value)

  // // 发送文字消息
  sendStatusByWs(value);
}

function createInput() {

  if (input != null) {
    return false;
  }

  input_deny_move_key = true;

  input = document.createElement("input");
  input.setAttribute("style", "position:fixed;" +
    "left:" + (matrix_poi.x) + "px;" +
    "top:" + (matrix_poi.y + 30) + "px;" +
    "background-color:rgba(200,200,200,0.8);" +
    "border:1px solid rgba(200,200,200,0.2);" +
    "border-radius:10px;" +
    "padding:5px;" +
    "outline:none;" +
    "width:150px;" +
    "color:black;" +
    "font-size:12px"
  );
  document.body.appendChild(input)
  input.addEventListener('focus', () => {
  });

  input.addEventListener('blur', () => {
    document.body.removeChild(input);
    input = null;
    input_deny_move_key = false;
    console.log("sad")
  })

  input.focus()
}

function bindEvent() {
  window.addEventListener('keydown', (evt) => {
    if (input_deny_move_key && evt.code != "Enter") {
      return false;
    }
    switch (evt.code) {
      case "Enter":
        sendMessage();
        break;
      case "Space":
        createInput();
        break;
      case "KeyW":
        move_direction.up = true;
        move_direction.down = false;
        break;
      case "KeyS":
        move_direction.up = false;
        move_direction.down = true;
        break;
      case "KeyD":
        move_direction.right = true;
        move_direction.left = false;
        break;
      case "KeyA":
        move_direction.left = true;
        move_direction.right = false;
        break;
    }
  })

  window.addEventListener('keyup', (evt) => {

    switch (evt.code) {
      case "KeyW":
        move_direction.up = false;
        break;
      case "KeyS":
        move_direction.down = false;
        break;
      case "KeyD":
        move_direction.right = false;
        break;
      case "KeyA":
        move_direction.left = false;
        break;
      // talk pass
    }

    if (evt.code == "KeyW" || evt.code == "KeyS" || evt.code == "KeyD" || evt.code == "KeyA") {
      // random_points_update_key = true;
      // random_points_update_status = 1;
    }
  })

  // 获取当前鼠标位置
  // window.addEventListener("mousemove", (evt) => {
  //   mouse_poi = {
  //     x: evt.x, y: evt.y
  //   }
  // });

  document.body.addEventListener('touchmove', (e) => {
    e.preventDefault();
  });
}
function computeDistance(x, y, x1, y1) {
  return Math.sqrt(Math.pow(x - x1, 2) + Math.pow(y - y1, 2))
}

function matrixMove() {

  var poi_y = matrix_poi.y;
  var poi_x = matrix_poi.x;
  var x_speed = 0;
  var y_speed = 0;

  if (move_direction.up) {
    poi_y = matrix_poi.y - move_speed;
    y_speed = -move_speed;
  } else if (move_direction.down) {
    poi_y = matrix_poi.y + move_speed;
    y_speed = move_speed;
  }

  if (move_direction.left) {
    poi_x = matrix_poi.x - move_speed;
    x_speed = -move_speed;
  } else if (move_direction.right) {
    poi_x = matrix_poi.x + move_speed;
    x_speed = move_speed;
  }

  if (x_speed || y_speed) {
    // zoom('far');
    // 设定martix的移动边界，为半径
    var moveRaidus = 200;

    // // 判断如果移动距离超过了canvas的中心moveRadius，那么停止移动，下一步进行star移动
    // // 1. 移动star
    if (computeDistance(poi_x, poi_y, canvas.width / 2, canvas.height / 2) >= moveRaidus) {
      // 关闭随机移动
      // random_points_update_key = false;
      // random_points_update_status = 0;
      // random_points_update = [
      //   -x_speed,
      //   -y_speed,
      //   0
      // ];

      // real_top_left_poi.x += x_speed;
      // real_top_left_poi.y += y_speed;

      // bot_status.r_x = real_top_left_poi.x;
      // bot_status.r_y = real_top_left_poi.y;
      if (x_speed) {
        if (back_position.x - x_speed > back_range.x && back_position.x - x_speed < 0) {
          back_position.x -= x_speed;
        }
        //  else{
        //   if(poi_y<canvas.height&&poi_y>0){
        //     matrix_poi.y = poi_y;
        //   }
        //   if(poi_x<canvas.width&&poi_x>0){
        //     matrix_poi.x = poi_x;
        //   }
        // }

      }
      if (y_speed) {
        if (back_position.y - y_speed > back_range.y && back_position.y - y_speed < 0) {
          back_position.y -= y_speed;
        }
        // else{
        //   if(poi_y<canvas.height-30&&poi_y>0){
        //     matrix_poi.y = poi_y;
        //   }
        //   if(poi_x<canvas.width-30&&poi_x>0){
        //     matrix_poi.x = poi_x;
        //   }
        // }
      }


    } else {
      // 2. 移动矩形
      if (poi_y < canvas.height && poi_y > 0) {
        matrix_poi.y = poi_y;
      }
      if (poi_x < canvas.width - 30 && poi_x > 0) {
        matrix_poi.x = poi_x;
      }

    }
  } else {
    // zoom('near');
  }

  // 视点跟随
  // visual.x = matrix_poi.x;
  // visual.y = matrix_poi.y;

  // 气泡跟随
  moveBubble();

  drawMatrix(matrix_poi.x, matrix_poi.y);
}


function moveBubble() {
  if (show_message_box != null) {
    show_message_box.setAttribute("style", "position:fixed;" +
      "left:" + (matrix_poi.x) + "px;" +
      "bottom:" + (canvas.height - matrix_poi.y + 20) + "px;" +
      "color:green;" +
      "font-size:2em"
    );
  }
}
function windowFixed() {
  window.scrollTo(0, canvas.offsetTop);
}

function canvasHandle() {
  if (fixed == true) { windowFixed() }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(background, back_position.x, back_position.y)
  ctx.beginPath();
  ctx.strokeStyle = "rgb(255, 255, 255)";
  ctx.lineWidth = 2;
  ctx.shadowBlur = 0;

  ctx.shadowBlur = 10;
  // immediateUpdate();

  // points = updatePoints(points, random_points_update);

  // drawn(ctx, points);
  matrixMove();

  // 维护状态
  // bot_status.x = visual.x;
  // bot_status.y = visual.y;

  // 尝试同步消息


  sendStatusByWs();

  createGuestBot();

  window.requestAnimationFrame(canvasHandle);
}
function createGuestBot() {
  for (let i = 0; points != null && i < points.length; i++) {
    if (points[i].name != name) {
      console.log(points[i].name)
      drawMatrix(points[i].x, points[i].y)
      if (points[i].msg != "") {
        var show_message_box = document.createElement("div");
        show_message_box.setAttribute("style", "position:fixed;" +
          "left:" + (points[i].x) + "px;" +
          "bottom:" + (canvas.height - points[i].y +10) + "px;" +
          "color:green;" +
          "font-size:2em"
        )
        document.body.appendChild(show_message_box)
        var value = points[i].msg
        var bubble = document.createElement('p')
        bubble.innerHTML = "<span style='padding:0 5px;margin:5px 0;display:inline-block;background-color:rgb(200,200,0,0.5);border:1px solid rgba(200,200,200,0.2);border-radius:10px;'>" + value + "</span>";
        show_message_box.appendChild(bubble)
        setTimeout(() => {
          show_message_box.removeChild(bubble)
        }, 1000 * 15);
      }
    }
  }
}
function drawMatrix(x = canvas.width / 2, y = canvas.height / 2) {
  // 矩形
  // ctx.fillStyle = "rgb(200,0,0)"
  // ctx.fillRect(x, y, 50, 30);

  // 眼睛
  ctx.beginPath();

  ctx.arc(x, y, 15, 0, 2 * Math.PI);
  ctx.fillStyle = "rgb(255,255,255)";
  ctx.fill();

  // 瞳孔
  // ctx.beginPath()
  // var pupil = moveEye(x, y, 8);

  // // 维护botstatus eye
  // bot_status.e_x = pupil[0];
  // bot_status.e_y = pupil[1];

  // ctx.arc(pupil[0], pupil[1], 4, 0, 2 * Math.PI);
  // ctx.fillStyle = "rgb(0,0,0)";
  // ctx.fill()

  // ctx.font = "12px Arial";
  // ctx.fillStyle = "rgb(200,200,200)";
  // ctx.fillText(bot_status.name, x - 8, y + 20)

}
function createReadme() {
  var readme = document.createElement("div")
  readme.setAttribute("id", "readme")
  readme.setAttribute("style", "" +
    "position:fixed;" +
    "left:5px;" +
    "bottom:0px;" +
    "width:500px;" +
    "height:50;" +
    "background-color:rgba(15,15,15,0.9);" +
    // "border:1px solid rgba(200,200,0,0.5);" +
    "color:rgba(200,200,200,0.8);" +
    "font-size:1.5em;" +
    "cursor:default;" +
    "border-radius:5px;");
  readme.innerHTML = "" +
    "<p>欢迎进入五子棋秋日聊天室</p>" +
    "<p>在这里畅所欲言并寻找您的棋友吧</p>" +
    "<p>操作方式：</p>" +
    "<p>1. W A S D进行上下左右</p>" +
    "<p>2. 空格开启聊天框，回车发送消息</p>"
    ;

  document.body.appendChild(readme)
  setTimeout(() => {
    document.body.removeChild(readme)
  }, 1000 * 60);
}

function sendStatusByWs(m = "") {
  if (m == "") {
    if (!is_ws_open) {
      return false;
    }
    let msg = "";
    msg = name + '!' + matrix_poi.x + '!' + matrix_poi.y;

    conn.send(msg)
  } else {
    if (!is_ws_open) {
      return false;
    }
    let msg = "";
    msg = name + '!' + matrix_poi.x + '!' + matrix_poi.y + '!';
    msg += m;
    conn.send(msg)
  }
}
// function createGuestBot(){

// }
function createWebSocket() {
  // ws = new WebSocket("ws://" + location.hostname + ":9000/ws")
  conn = new WebSocket("ws://" + "8.130.31.124:8077" + "/ws");
  console.log(document.location.host)

  conn.onopen = function () {
    console.info("ws open")
    is_ws_open = true;
  };
  conn.onmessage = function (evt) {
    points = [];
    var messages = String(evt.data).split('|');
    console.log(messages)
    for (var i = 0; i < messages.length; i++) {
      let ms = messages[i].split('!');
      let point = {
        name: ms[0],
        x: Number(ms[1]),
        y: Number(ms[2])
      }
      console.log(ms)
      if (ms.length === 4) point.msg = ms[3];
      else point.msg = ""
      points.push(point);
    }
  };
  conn.onclose = function () {
    console.info("ws close")
  }
}

export default function () {
  initCtx();
  bindEvent();
  // initTools();
  // initLocalStorage();
  createWebSocket();
  // setInterval(sendStatusByWs,80);
  createReadme();
  window.requestAnimationFrame(canvasHandle);

}