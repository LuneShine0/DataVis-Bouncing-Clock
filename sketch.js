//Starting values
let hourCircles = [];
let minuteCircles = [];
let secondCircles = [];

let MSec, MMin, MHour;
const gravity = 0.35;

function setup() {
  createCanvas(1920, 1080);
  frameRate(60);
  noStroke();
  MHour = hour();
  MMin = minute();
  MSec = second();
  AdjCount(secondCircles, MSec, 'second');
  AdjCount(minuteCircles, MMin, 'minute');
  AdjCount(hourCircles, MHour, 'hour');
}

function draw() {
  background(9,14,20);
  fill(255,255,255);
  text(`x: ${mouseX} y: ${mouseY}`, 100, 10);
  text(MHour, 10, 10)
  text(MMin, 30, 10);
  text(MSec, 50, 10);
  circleUpdate();
  physicsUpdate(hourCircles);
  physicsUpdate(minuteCircles);
  physicsUpdate(secondCircles);
  resolveInterGroupCollisions();
  drawCircles(hourCircles);
  drawCircles(minuteCircles);
  drawCircles(secondCircles);
  
}

function circleUpdate(){
  const NSec = second();
  const NMin = minute();
  const NHour = hour();

  if(NSec !== MSec){
    if(MSec === 59 && NSec === 0){
      triggerPopFor(secondCircles);
    }
    AdjCount(secondCircles, NSec, 'second');
    MSec = NSec;
  }
  if(NMin !== MMin){
    if(MMin === 59 && NMin === 0){
      triggerPopFor(minuteCircles);
    }
    console.log(NMin);
    AdjCount(minuteCircles, NMin, 'minute');
    MMin = NMin;
  }
  if(NHour !== MHour){
    if(MHour === 23 && NHour === 0){
      triggerPopFor(hourCircles);
    }
    AdjCount(hourCircles, NHour, 'hour');
    MHour = NHour;
  }
}


function AdjCount(arr, count, type){
  let n=0; for(let c of arr) if(!c.dead && !c.popping) n++;
  while(n < count){
    arr.push(Circle.createRandom(type));
    n=0; for(let c of arr) if(!c.dead && !c.popping) n++;}
}


function triggerPopFor(arr){
  for(let c of arr){
    if(!c.dead && !c.popping) c.startPop();
  }
}


function physicsUpdate(list){
  for(let c of list){
    c.update();
  }
  for(let i=list.length-1;i>=0;i--) if(list[i].dead) list.splice(i,1);
}


function drawCircles(list){
  for(let c of list) c.draw();
}

function resolveInterGroupCollisions(){
  const groups = [hourCircles, minuteCircles, secondCircles];
  let all = [];
  for(const g of groups) all = all.concat(g);
  for(let i=0;i<all.length;i++){
    let a = all[i];
    if(a.dead) continue;
    for(let j=i+1;j<all.length;j++){
      let b = all[j];
      if(b.dead) continue;
      Circle.resolveCollision(a,b);
    }
  }
}

class Circle{
  constructor(x,y,r,type){
    this.pos = createVector(x,y);
    this.v = createVector(random(-1,1), random(0,1));
    this.r = r;
    this.baseR = r;
    this.type = type;
    this.popping = false;
    this.popTimer = 0;
    this.popDuration = 24;
    this.dead = false;
    this.color = this.type === 'hour' ? color(255,150,60,220) : (this.type === 'minute' ? color(120,200,255,200) : color(180,255,170,190));
  }

  static createRandom(type){
    const x = random(20, width-20);
    const y = random(-60, -10);
    let r = 8;
    if(type === 'hour') r = 45;
    else if(type === 'minute') r = 28;
    else if(type === 'second') r = 16;
    return new Circle(x,y,r,type);
  }

  startPop(){
    if(this.popping || this.dead) return;
    this.popping = true;
    this.popTimer = 0;
  }

  update(){
    if(this.dead) return;
    if(this.popping){
      this.popTimer++;
      const t = this.popTimer / this.popDuration;
      this.r = lerp(this.baseR, this.baseR * 2.4, t*(2-t));
      this._alpha = lerp(255, 0, t);
      if(this.popTimer >= this.popDuration) this.dead = true;
      return;
    }

    this.v.y += gravity;
    this.pos.add(this.v);

    if(this.pos.x - this.r < 0){
      this.pos.x = this.r;
      this.v.x *= -0.995;
    } else if(this.pos.x + this.r > width){
      this.pos.x = width - this.r;
      this.v.x *= -0.995;
    }
    if(this.pos.y - this.r < 0){
      this.pos.y = this.r;
      this.v.y *= -0.995;
    } else if(this.pos.y + this.r > height){
      this.pos.y = height - this.r;
      this.v.y *= -0.995;
      this.v.x *= 0.995;
      if(abs(this.v.y) < 0.5) this.v.y = 0;
    }
    this.v.limit(25);
  }

  draw(){
    if(this.dead) return;
    push();
    translate(this.pos.x, this.pos.y);
    if(this.popping){
      fill(red(this.color), green(this.color), blue(this.color), this._alpha);
      ellipse(0,0,this.r*2);
      pop();
      return;
    }
    fill(this.color);
    ellipse(0,0,this.r*2);
    pop();
  }

  static resolveCollision(a,b){
    if(a.popping || b.popping) return;
    const dx = b.pos.x - a.pos.x;
    const dy = b.pos.y - a.pos.y;
    const dist = sqrt(dx*dx + dy*dy);
    const minDist = a.r + b.r;
    if(dist > 0 && dist < minDist){
      const overlap = (minDist - dist) / 2;
      const nx = dx / dist;
      const ny = dy / dist;
      a.pos.x -= nx * overlap;
      a.pos.y -= ny * overlap;
      b.pos.x += nx * overlap;
      b.pos.y += ny * overlap;
      const rvx = b.v.x - a.v.x;
      const rvy = b.v.y - a.v.y;
      const relVelAlongNormal = rvx * nx + rvy * ny;
      if(relVelAlongNormal < 0){
        const restitution = 0.995;
        const j = -(1 + restitution) * relVelAlongNormal;
        const impulseX = j * nx * 0.5;
        const impulseY = j * ny * 0.5;
        a.v.x -= impulseX;
        a.v.y -= impulseY;
        b.v.x += impulseX;
        b.v.y += impulseY;
      }
    }
  }
}
