var socket;
let video;

// ml5 PoseNet
let poseNet;
let poses = [];

//图片素材
let RPanimation = [];
let GPanimation = [];
let treasureChests;
let treasureBox;
let w;
let h;

const fireworks = [];
let gravity;

function preload() { //加载食物图片 
  redPotions = loadImage('./assets/red_potions.png');
  greenPotions = loadImage('./assets/green_potions.png'); 
  key = loadImage('./assets/key.png');
  treasureChests = loadImage('./assets/treasure_chests.png');
  virus = loadImage('./assets/virus.png');
}


function setup() {
  //画布大小跟随窗口
  createCanvas(windowHeight*1.78, windowHeight);
  gravity = createVector(0, 0.2);
  noStroke();
  strokeWeight(4);

  //准备camera
  video = createCapture(VIDEO);
  video.size(windowHeight*1.78, windowHeight);
  video.hide(); //让video显示在canvas上而不是堆叠元素

  //调用posenet
  poseNet = ml5.poseNet(video, modelReady);
  poseNet.on("pose", function(results) {
    poses = results;
  });
  

  //裁剪药水素材
  for (let x = 0; x < redPotions.width; x += 16) { //创建食物
    for (let y = 0; y < redPotions.height; y += 16) {
      let img = redPotions.get(x, y, 16, 16); //获取食物图片
      RPanimation.push(img)
    }
    console.log(RPanimation);
  }

  //裁剪药水素材
  for (let x = 0; x < greenPotions.width; x += 16) { //创建食物
    for (let y = 0; y < greenPotions.height; y += 16) {
      let img = greenPotions.get(x, y, 16, 16); //获取食物图片
      GPanimation.push(img)
    }
    console.log(GPanimation);
  }

  //裁剪一个宝箱拿来用
  treasureBox = treasureChests.get(0, 0, 16, 16);

  socket = io.connect('https://rescue-game1.herokuapp.com/');
	//socket = io.connect('http://localhost:3000');
}


function modelReady() {
  select("#status").html("Model Loaded");
}

let time1 = null; //time1是上次产生宝箱的时间
let time2 = null; //time2实时更新
let randomSeconds;
let ifGenerate = false; //生成宝箱标志位

function draw(){
  background(0, 0, 0);
  image(video, 0, 0, width, width * video.height / video.width);

  //hostage = true; //用来测试人质部分
  //console.log('hostage', hostage);
  if(hostage && !loseORwin){    
    $('.my-score').attr('style', 'display:none;');
    if (time1 == null) {
      time1 = second();
    }
    //randomSeconds = Math.round(Math.random() * (3 - 2)) + 2; //随机1～3秒
    randomSeconds = Math.floor(Math.random()*3)+1  //随机1～3s
    time2 = second(); //time2是当前时间
    if (time2 - time1 <= 0){ //处理偶尔second()会出负数...
      time1 = second();
      time2 = second();
    }
    if (time2 - time1 > randomSeconds){
      HPhostage -= Math.floor(Math.random()*3)+1;
      HPvirus += Math.floor(Math.random()*3)+1;
      virusExtend += 3*(Math.floor(Math.random()*3)+1);
      //console.log(virusSize);
      time1 = time2; //重置时间
    }
    drawKeypoints2();
    gameJudge();
  }else if(loseORwin == 'win'){
    if (random(1) < 0.03) {
      fireworks.push(new Firework());
    }
    for (let i = fireworks.length - 1; i >= 0; i--) {
      fireworks[i].update();
      fireworks[i].show();
      if (fireworks[i].done()) {
        fireworks.splice(i, 1);
      }
    }
  }else if(loseORwin == 'lose'){
    background(0, 255, 0);
  }

  else{
    //2～5s 随机一个肩膀产生宝箱
    if (time1 == null) {
      time1 = second();
    }
    randomSeconds = Math.round(Math.random() * (5 - 3)) + 3; //随机数作为秒数
    time2 = second(); //time2是当前时间
    if (time2 - time1 <= 0){ //偶尔second()会出负数...
      time1 = second();
      time2 = second();
    }
    if (time2 - time1 > randomSeconds && selectSide == null){
      console.log('new 📦📦📦📦📦📦📦📦📦📦');
      ifGenerate = true; 
      time1 = time2; //重置时间
    }
    drawKeypoints1();
  }
}

///////////////////////////////////////////////////////////////////////////
let selectSide = null;
//画出所有关键点
function drawKeypoints1() {
  for (let i = 0; i < poses.length; i += 1){   
    const pose = poses[i].pose; 
    for (let j = 0; j < pose.keypoints.length; j += 1) {  
      //draw every point
      const keypoint = pose.keypoints[j];
      // if (keypoint.score > 0.2) {
      //   fill('#fae');
      //   noStroke();
      //   ellipse(keypoint.position.x, keypoint.position.y, 30, 30); //画点
      // }
      //generate box: Yes  display potion: No
      if(ifGenerate && !ifDisplayPotion){ 
        if(Math.random()>=0.5){  //随机选择一边
          selectSide = 'left';
        }else{
          selectSide = 'right';
        }
        console.log('Select side:', selectSide);
        ifGenerate = false;
      }
      //根据边传送位置 画出宝箱 判断🔓状况
      if(selectSide == 'left'){ 
        generateBoxKey(pose.keypoints[5],pose.keypoints[3]);
        lockTheBox(pose.keypoints[5],pose.keypoints[3]);
      }
      else if(selectSide == 'right'){ 
        generateBoxKey(pose.keypoints[6],pose.keypoints[4]);
        lockTheBox(pose.keypoints[6],pose.keypoints[4]);
      }
    }
  }
}

//随机在左肩膀或右肩膀产生宝箱
function generateBoxKey(shoulder, ear){
  if (ifDisplayPotion == false){
    if(shoulder.score > 0.2 && ear.score > 0.2) {  //左耳朵画药水
      image(treasureBox, shoulder.position.x-50, shoulder.position.y-50, 100, 100); //左上角位置 大小
      image(key, ear.position.x-50, ear.position.y-50, 100, 100); //左上角位置 大小
    }
  }
}

let time3;
let time4;
function lockTheBox(shoulder, ear){
   //肩膀耳朵位置大差不差的话 判断为解锁成功
  //console.log(abs(ear.position.x - shoulder.position.x), abs(shoulder.position.y - ear.position.y));
  if(abs(ear.position.x - shoulder.position.x) < 30 && abs(shoulder.position.y - ear.position.y) < 100){
    //ifGenerate = false;
    //ifSelectSide = null;
    //console.log('🔓🔓🔓🔓🔓🔓🔓🔓🔓🔓🔓🔓');
    //显示药水作为提示
    if(ifDisplayPotion == false){ 
      console.log('time3333333333!');
      ifDisplayPotion = true;
      time3 = second(); //记录🔓这一刻的时间
      console.log('time3:', time3);
    }
  }
  if(ifDisplayPotion){
    displayPotion(shoulder, ear);
  }
}

let ifDisplayPotion = false;
let GPnum = 0;
let $GPnum= document.querySelector('#green-potion');
let RPnum = 0;
let $RPnum = document.querySelector('#red-potion');
let selectPotion = null;

function displayPotion(shoulder, ear){
  //console.log('🧪 🌡🧪 🌡🧪 🌡🧪 🌡');
  time4 = second();
  //未抽取药水，抽取药水
  if (selectPotion == null){
    if(Math.random()>=0.5){
      selectPotion = 'red';
    }else{
      selectPotion = 'green';
    }
  }
  console.log(time3, time4, '   ',time4-time3);
  //小药水显示2s
  if (time4 - time3 <= 0){ //处理偶尔计时不准
    time3 = second();
    time4 = second();
  }
  if(time4 - time3 <= 2){ 
    if(selectPotion == 'red'){
      image(RPanimation[frameCount % RPanimation.length], shoulder.position.x, shoulder.position.y, 64, 64); 

    }
    else if(selectPotion == 'green'){
      image(GPanimation[frameCount % GPanimation.length], shoulder.position.x, shoulder.position.y, 64, 64); 
    } 
  }else{ //2s后
    if(selectPotion == 'red'){
      RPnum += 1;
      $RPnum.innerHTML = RPnum;
    }else{
      GPnum += 1;
      $GPnum.innerHTML = GPnum;
    }
    socket.emit('update', selectPotion); //发送给sever
    ifDisplayPotion = false;
    selectPotion = null;
    selectSide = null;
    time1 = null //结束这一轮
  }
}




///////////////////////////////////////////////////////////////////////
let HPvirus = 100;
let virusSize;
let virusExtend = 0;
let virusShrink = 0;
let HPhostage = 60;
let hostage = false;

//接收是否被选为了人质
socket.on('kidnap', function(ifKidnap){
  hostage = ifKidnap;
  console.log('🔪🔪🔪');
})

//接收新的帮助
socket.on('saving', function(potion){ 
  console.log(potion);
  if(potion == 'red'){
    HPhostage += 5;
  }else if(potion == 'green'){
    HPvirus -= 10;
    virusShrink = -4*(Math.floor(Math.random()*3)+1);
  }
})

function drawKeypoints2() {
  for (let i = 0; i < poses.length; i += 1){   
    const pose = poses[i].pose; 
    for (let j = 0; j < pose.keypoints.length; j += 1) {  
      //draw every point
      const keypoint = pose.keypoints[j];
      // if (keypoint.score > 0.2) {
      //   fill('#fae');
      //   noStroke();
      //   ellipse(keypoint.position.x, keypoint.position.y, 30, 30); //画点
      // }
      if(loseORwin == false) {
        //根据鼻子的位置和脸的大小画出病毒
        nose = pose.keypoints[0];
        faceWidth = abs(pose.keypoints[4].position.x - pose.keypoints[3].position.x);
        virusSize = faceWidth + virusExtend + virusShrink; //病毒宽度由脸的宽度决定
        //console.log('virusSize', virusSize);
        image(virus, nose.position.x-virusSize/2, nose.position.y-virusSize/2, virusSize, virusSize);
        
        textSize(50);
        textStyle(BOLD);
        //写出红色人质HP
        fill(255, 0, 0);
        text('HP: ' +  HPhostage, nose.position.x - 0.5*faceWidth, nose.position.y - 0.5*faceWidth, 200, 200);
        //写出紫色病毒HP
        fill(128, 0, 128);
        text('HP: ' +  HPvirus, nose.position.x + 0.25*faceWidth, nose.position.y + 0.25*faceWidth, 200, 200);
      }
    }
  }
}

var loseORwin = false;
function gameJudge(){
  if(HPvirus == 0 && HPhostage > 0){
    loseORwin = 'win';
  }
  else if(HPhostage <= 0){
    stroke(500);
    loseORwin = 'lose';
  }
}