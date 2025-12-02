export default function (p) {
    p.setup = function () {
      p.createCanvas(p.windowWidth, p.windowHeight);
      p.noStroke();
    };
  
    p.draw = function () {
      p.background(50, 100, 150); // Example background color
      p.fill(255, 255, 255, 50);
      p.ellipse(p.random(p.width), p.random(p.height), 50, 50);
    };
  
    p.windowResized = function () {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
  }