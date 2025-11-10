let bubbles = []; // 氣泡 (取代 circles)
// 暖色調，模擬高溫和熔岩
let lavaColors = [
  "#ff5733", // 深橘紅
  "#ff8c00", // 暗橘
  "#ffa500", // 亮橙
  "#ffde00", // 金黃
  "#ff0000" // 純紅
];

let pressureWaves = []; // 壓力波 (取代 explosions)
const WAVE_DURATION = 35; // 壓力波持續幀數

function setup() {
  createCanvas(windowWidth, windowHeight);
  background("#301934"); // 深沉的背景色 (接近黑紫)
  colorMode(HSB, 360, 100, 100, 255); // 使用 HSB 顏色模式，更方便處理顏色漸變

  // 產生 100 個氣泡的資料
  for (let i = 0; i < 100; i++) {
    let r = random(40, 120);
    // 速度慢一點，增加流動感
    let speed = map(r, 40, 120, 1.5, 0.2); 
    
    // 隨機選擇基底色 (HSB 模式)
    let baseHue = random([20, 40, 0, 330]); // 紅色、橙色、黃色區域
    let baseSaturation = random(70, 100);
    let baseBrightness = random(80, 100);
    
    bubbles.push({
      startX: random(width), // 紀錄起始 X 位置
      y: random(height),
      r: r, // 半徑
      sizeScale: 1, // 用於變形
      wobbleOffset: random(1000), // 晃動的 Perlin Noise 偏移量
      speed: speed,
      hue: baseHue,
      saturation: baseSaturation,
      brightness: baseBrightness,
      isCompressed: false // 標記是否被擠壓
    });
  }
}

function draw() {
  // 緩慢清除背景，營造熱液體的拖影感
  fill(30, 100, 20, 50); // HSB: 接近黑色的深色，透明度 50
  rect(0, 0, width, height);
  
  noStroke();

  // --- 氣泡運動、繪製與碰撞 ---
  for (let b of bubbles) {
    // 1. 浮動與側向晃動
    b.y -= b.speed;
    
    // 使用 noise 函式創造自然的側向晃動 (x 座標)
    // 晃動幅度與氣泡半徑相關
    let currentX = b.startX + map(noise(b.wobbleOffset), 0, 1, -b.r / 3, b.r / 3);
    b.wobbleOffset += 0.005; // 讓晃動緩慢變化
    
    // 2. 氣泡變形 (擠壓/釋放)
    // sizeScale 接近 1 表示圓形，小於 1 表示被壓扁
    // 使用 lerp 讓變形更流暢
    if (b.isCompressed) {
      b.sizeScale = lerp(b.sizeScale, 0.8, 0.1); // 快速壓扁
    } else {
      b.sizeScale = lerp(b.sizeScale, 1.0, 0.05); // 緩慢恢復
    }
    b.isCompressed = false; // 重置壓縮標記

    // 3. 繪製氣泡 (帶有內部光暈)
    
    // 外部光暈 (使用發光效果)
    drawingContext.shadowOffsetX = 0;
    drawingContext.shadowOffsetY = 0;
    drawingContext.shadowBlur = b.r / 4; 
    drawingContext.shadowColor = color(b.hue, b.saturation, b.brightness, 150);
    
    // 內部顏色
    fill(b.hue, b.saturation, b.brightness, 150); // 高亮度、中等透明度
    ellipse(currentX, b.y, b.r * b.sizeScale, b.r / b.sizeScale); // 橢圓變形
    
    drawingContext.shadowBlur = 0; // 重置光暈

    // 4. 檢查是否進入任一壓力區域 (壓力波中心)
    for (let w of pressureWaves) {
      // 檢查氣泡中心到壓力波中心的距離
      let d = dist(currentX, b.y, w.x, w.y);
      
      // 壓力波作用的半徑 (隨時間擴大)
      let waveRadius = map(w.timer, 0, WAVE_DURATION, 0, 300); 
      let waveThickness = 50; // 壓力波厚度
      
      // 如果氣泡在壓力波的圓環範圍內，觸發變形
      if (d > waveRadius - waveThickness && d < waveRadius + waveThickness) {
        b.isCompressed = true;
        // 調整氣泡的 X 座標以模擬被波推動
        let angle = atan2(b.y - w.y, currentX - w.x); // 計算氣泡與波中心連線的角度
        currentX += cos(angle) * 0.5; // 稍微向外推動
      }
    }

    // 5. 循環 (如果飄到最上方，移到最底部)
    if (b.y < -b.r / 2) {
      b.y = height + b.r / 2;
      b.startX = random(width); // 重設起始 X 位置
    }
  }

  // --- 自動產生壓力波 ---
  // 每 120 幀（約 2 秒）自動產生一個壓力波
  if (frameCount % 120 === 0) {
    pressureWaves.push({
      x: random(width),
      y: random(height),
      timer: 0,
      color1: color(random(lavaColors)), // 外圈顏色
      color2: color(random(lavaColors)) // 內圈顏色
    });
  }

  // --- 繪製壓力波 ---
  for (let w of pressureWaves) {
    if (w.timer < WAVE_DURATION) {
      let alpha = map(w.timer, 0, WAVE_DURATION, 100, 0); // 隨時間消散
      let currentRadius = map(w.timer, 0, WAVE_DURATION, 10, 300); // 隨時間擴大
      
      // 繪製漸變圓環
      for (let i = 0; i < 5; i++) {
        let waveColor = lerpColor(w.color1, w.color2, i / 5); // 顏色在兩者間漸變
        waveColor.setAlpha(alpha);
        
        noFill();
        stroke(waveColor);
        strokeWeight(3 - i * 0.5); // 讓線條稍微變細
        
        // 疊加多個圓環，模擬厚度和漸變
        ellipse(w.x, w.y, (currentRadius + i * 5) * 2, (currentRadius + i * 5) * 2);
      }
      
      w.timer++;
    }
  }

  // 移除已結束的壓力波
  pressureWaves = pressureWaves.filter(w => w.timer < WAVE_DURATION);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background("#301934");
}