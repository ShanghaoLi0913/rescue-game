// Video
let video;

// ml5 PoseNet
let poseNet;
let poses = [];

let textures = [];
let w;
let h;
function preload() { //加载食物图片
  //spritesheet = loadImage('Ghostpixxells_pixelfood.png'); 
  can = loadImage('farm-tool.png'); 
  lake = loadImage('lake.png'); 
  gras = loadImage('gras.png'); 
  flowers = loadImage('flowers_plants.png'); 
}

function setup() {
  createCanvas(windowWidth, windowHeight); //画布大小跟随窗口
  //准备camera
  video = createCapture(VIDEO);
  video.size(windowWidth, windowHeight);
  //调用posenet
  poseNet = ml5.poseNet(video, modelReady);
  poseNet.on("pose", function(results) {
    poses = results;
    //console.log(poses);
  });
  video.hide(); //让video显示在canvas上而不是堆叠元素

  //裁剪鲜花素材(4行5列 20个16px的图案组成的雪碧图) 
  w = flowers.width / 5;
  h = flowers.height / 4;
  console.log(flowers.width, flowers.height, w, h);
  for (let x = 0; x < flowers.width; x += w) { 
    for (let y = 0; y < flowers.height; y += h) { 
      console.log('🌟', x, y);
      let img = flowers.get(x, y, w, h); //获取单个鲜花图片
      textures.push(img); //放在textures里
    }
  }
  console.log(textures);
}


function modelReady() {
  select("#status").html("Model Loaded");
}

function draw() {
  background(0, 255, 0);
  image(video, 0, 0, width, width * video.height / video.width);
  //画草坪 default: 25 * 8的草坪
  for(let x = 0; x < 16*25; x += 16){
    for(let y = windowHeight; y > windowHeight - 16*25; y -= 16){
      image(gras, x, y);
    }
  }
  //画湖泊
  image(lake, windowWidth-350, windowHeight-200, 350, 200);
  //画生成的鲜花
  for(let x = 0; x < series.length; x += 1){
    console.log('series', series);
    console.log('posXs', posXs);
    console.log('posYs', posYs);
    image(textures[series[x]], posXs[x], posYs[x], 32, 32);
  }
  drawKeypoints();
  drawSkeleton();
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
  //onsole.log(poses.length);
  for (let i = 0; i < poses.length; i += 1) {   //Loop through all the poses detected
    const pose = poses[i].pose; //For each pose detected, loop through all the keypoints
    for (let j = 0; j < pose.keypoints.length; j += 1) {  //A keypoint is an object describing a body part (e.g., rightArm)
      const keypoint = pose.keypoints[j]; //Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        fill('#fae');
        noStroke();
        ellipse(keypoint.position.x, keypoint.position.y, 30, 30); //画点
      }
      //如果是左手腕 添加🪣 右肩膀
      if(j == 9 & keypoint.score > 0.4 & pose.keypoints[6].position.x > windowWidth/2){ 
        image(can, keypoint.position.x, keypoint.position.y, 50, 50); //左上角位置 大小
      }
      //如果是右手腕 添加🪣 左肩膀
      if(j == 10 & keypoint.score > 0.4 & pose.keypoints[5].position.x < windowWidth/2){ 
        image(can, keypoint.position.x, keypoint.position.y, 50, 50); //左上角位置 大小
      }
    }
  }
}


// A function to draw the skeletons
function drawSkeleton() {
  for (let i = 0; i < poses.length; i += 1) {// Loop through all the skeletons detected
    const skeleton = poses[i].skeleton; //For every skeleton, loop through all body connections
    for (let j = 0; j < skeleton.length; j += 1) {
      const partA = skeleton[j][0]; //fist keypoint
      const partB = skeleton[j][1]; //second keypoint
      if(partB.part=='leftShoulder' && partA.part=='leftHip'){ //左侧body 蓝色线
        //console.log('left body!');
        stroke('rgba(20, 213, 233, 0.8)');
        strokeWeight(10);
        takeWater(partB,partA);
      }
      else if(partB.part=='rightShoulder' && partA.part=='rightHip'){ //右侧body 粉色线
        //console.log('right body!')
        stroke('#fae');
        strokeWeight(10);
        pourWater(partB,partA);
      }
      else{ 
        stroke('rgba(252, 252, 252)');
        strokeWeight(5);
      }
      line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
    }
  }
}

let water = 0;
let $water = document.querySelector('#water')
function takeWater(leftShoulder, leftHip){
    //  计算线的角度: Math.atan2((y1-y0),x1-x0)/0.017453292;
    angle = Math.atan2((leftShoulder.position.y - leftHip.position.y),
    leftShoulder.position.x - leftHip.position.x)/0.017453292;
    //console.log(angle)
    if(angle > -60){
      //console.log('water +1 !!!!');
      water += 1;
      $water.innerHTML = water;
    }
}

let pour = 0;
function pourWater(rightShoulder, rightHip){
  angle = Math.atan2((rightShoulder.position.y - rightHip.position.y),
  rightShoulder.position.x - rightHip.position.x)/0.017453292;
  //console.log(angle)
  if(angle < -120){
    console.log('water -1 !!!!');
    if(water > 0){
      water -= 1;
      if(pour == 30){ //浇水30次 开花
        pour = 0;
        blossom();
      }
      else{ pour += 1;}
    }
    $water.innerHTML = water;
  }
}

let number;
let posXs = [];
let posYs = [];
let series = [];
function blossom(){
  var number = Math.floor(Math.random() * 19);
  var posX = Math.random()*(16*25-0)+0;
  var posY = Math.random()*(windowHeight - (windowHeight-16*25)) + (windowHeight-16*25);
  console.log('🌹🌹', number, posX, posY);
  series.push(number)
  posXs.push(posX);
  posYs.push(posY);
}