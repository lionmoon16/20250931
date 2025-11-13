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
const WAVE_DURATION = 35; // 標準壓力波持續幀數

let score = 0; // 💥 NEW: 遊戲分數

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 使用 HSB 顏色模式，更方便處理顏色漸變和透明度
  colorMode(HSB, 360, 100, 100, 255); 
  background("#301934"); // 深沉的背景色 (接近黑紫)

  // 產生 100 個氣泡的資料
  for (let i = 0; i < 100; i++) {
    let r = random(40, 120);
    let speed = map(r, 40, 120, 1.5, 0.2); 
    
    // 隨機選擇基底色 (HSB 模式)
    let baseHue = random([20, 40, 0, 330]); // 紅色、橙色、黃色區域
    let baseSaturation = random(70, 100);
    let baseBrightness = random(80, 100);
    
    bubbles.push({
      startX: random(width), 
      y: random(height),
      r: r, 
      sizeScale: 1, 
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

  // --- 氣泡運動、繪製與壓力波碰撞 ---
  for (let b of bubbles) {
    // 1. 浮動與側向晃動
    b.y -= b.speed;
    
    // 使用 noise 函式創造自然的側向晃動 (x 座標)
    let currentX = b.startX + map(noise(b.wobbleOffset), 0, 1, -b.r / 3, b.r / 3);
    b.wobbleOffset += 0.005; 
    
    // 2. 氣泡變形 (擠壓/釋放)
    if (b.isCompressed) {
      b.sizeScale = lerp(b.sizeScale, 0.8, 0.1); // 快速壓扁
    } else {
      b.sizeScale = lerp(b.sizeScale, 1.0, 0.05); // 緩慢恢復
    }
    b.isCompressed = false; 

    // 3. 繪製氣泡 (帶有內部光暈)
    drawingContext.shadowOffsetX = 0;
    drawingContext.shadowOffsetY = 0;
    drawingContext.shadowBlur = b.r / 4; 
    drawingContext.shadowColor = color(b.hue, b.saturation, b.brightness, 150);
    
    fill(b.hue, b.saturation, b.brightness, 150); 
    ellipse(currentX, b.y, b.r * b.sizeScale, b.r / b.sizeScale); // 橢圓變形
    
    drawingContext.shadowBlur = 0; 

    // 4. 檢查是否進入任一壓力區域 (壓力波中心)
    for (let w of pressureWaves) {
      // 壓力波只會影響到畫面上方的氣泡 (即未被擊中的氣泡)
      if (w.timer > 0 && b.y < height) { 
        let d = dist(currentX, b.y, w.x, w.y);
        
        // 壓力波作用的半徑與厚度
        let duration = w.duration || WAVE_DURATION;
        let maxRadius = w.maxRadius || 300;
        
        let waveRadius = map(w.timer, 0, duration, 0, maxRadius); 
        let waveThickness = 50; 
        
        // 如果氣泡在壓力波的圓環範圍內，觸發變形
        if (d > waveRadius - waveThickness && d < waveRadius + waveThickness) {
          b.isCompressed = true;
        }
      }
    }

    // 5. 循環 (如果飄到最上方，移到最底部)
    if (b.y < -b.r / 2) {
      b.y = height + b.r / 2;
      b.startX = random(width); // 重設起始 X 位置
    }
  }

  // --- 繪製壓力波並更新計時器 ---
  for (let w of pressureWaves) {
    const duration = w.duration || WAVE_DURATION;
    const maxRadius = w.maxRadius || 300;
    
    if (w.timer < duration) {
      let alpha = map(w.timer, 0, duration, 100, 0); // 隨時間消散
      let currentRadius = map(w.timer, 0, duration, 10, maxRadius); // 隨時間擴大
      
      // 繪製漸變圓環
      for (let i = 0; i < 5; i++) {
        // HSB: 顏色在兩者間漸變
        let waveColor = lerpColor(w.color1, w.color2, i / 5); 
        waveColor.setAlpha(alpha);
        
        noFill();
        stroke(waveColor);
        strokeWeight(3 - i * 0.5); 
        
        ellipse(w.x, w.y, (currentRadius + i * 5) * 2, (currentRadius + i * 5) * 2);
      }
      
      w.timer++;
    }
  }

  // 移除已結束的壓力波
  pressureWaves = pressureWaves.filter(w => w.timer < (w.duration || WAVE_DURATION));

  // --- 顯示分數 ---
  fill(255); 
  textSize(32);
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  text("分數: " + score, 20, 20); 
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background("#301934");
}

/**
 * 💥 滑鼠點擊觸發事件：產生爆破波並計算得分
 */
function mousePressed() {
    // 1. 在點擊位置產生一個標準視覺化的壓力波
    pressureWaves.push({
        x: mouseX,
        y: mouseY,
        timer: 0,
        color1: color(0, 0, 100, 255), // 白色/高亮波
        color2: color(random(lavaColors)),
        duration: 35, // 標準波持續時間
        maxRadius: 300 // 標準波最大半徑
    });

    // 2. 檢查氣泡是否被擊中並加分
    for (let i = 0; i < bubbles.length; i++) {
        let b = bubbles[i];
        // 計算氣泡的當前實際 X 座標 (考慮晃動)
        let currentX = b.startX + map(noise(b.wobbleOffset), 0, 1, -b.r / 3, b.r / 3);
        let d = dist(currentX, b.y, mouseX, mouseY);
        
        // 設定點擊的命中半徑 (氣泡半徑 + 緩衝區 20 像素)
        if (d < b.r / 2 + 20) {
            // 計算得分：氣泡越大，分數越高 (範圍 5 到 20 分)
            let points = floor(map(b.r, 40, 120, 5, 20));
            score += points;

            // 讓氣泡消失 (移到畫面下方，等待 draw 循環將其重置)
            b.y = height + b.r; 
            
            // 氣泡被擊中時，產生一個小而快的「爆破」視覺效果
            pressureWaves.push({
                x: currentX,
                y: b.y - b.r, // 從氣泡消失處發出
                timer: 0,
                // 使用氣泡的顏色來發出爆破波
                color1: color(b.hue, 100, 100, 255), 
                color2: color(b.hue, 50, 80, 255),
                duration: 15, // 較短的持續時間
                maxRadius: 80 // 較小的半徑
            });
        }
    }
}
