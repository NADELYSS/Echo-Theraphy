import { useEffect, useRef, useState } from 'react';

// 벡터 및 수학 유틸리티
class Vector2 {
    constructor(x, y) { this.x = x; this.y = y; }
    add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vector2(this.x - v.x, this.y - v.y); }
    mult(n) { return new Vector2(this.x * n, this.y * n); }
    mag() { return Math.sqrt(this.x*this.x + this.y*this.y); }
    normalize() { 
        let m = this.mag(); 
        return m === 0 ? new Vector2(0,0) : new Vector2(this.x/m, this.y/m); 
    }
    dot(v) { return this.x * v.x + this.y * v.y; }
}

function lineIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den === 0) return null;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
    if (t > 0 && t < 1 && u > 0 && u < 1) {
        return new Vector2(x1 + t * (x2 - x1), y1 + t * (y2 - y1));
    }
    return null;
}

class Boundary {
    constructor(x1, y1, x2, y2) {
        this.a = new Vector2(x1, y1);
        this.b = new Vector2(x2, y2);
        let dx = x2 - x1;
        let dy = y2 - y1;
        this.normal = new Vector2(-dy, dx).normalize();
    }
}

// 레벨 데이터
const LEVELS = [
    {
        message: "화면을 터치(클릭)하여 파동을 일으키고 빛나는 목표 지점으로 이동하세요.",
        start: {x: 0.2, y: 0.5}, goal: {x: 0.8, y: 0.5},
        walls: []
    },
    {
        message: "어둠 속에서 첫 걸음을 내딛어보세요.",
        start: {x: 0.1, y: 0.5}, goal: {x: 0.8, y: 0.5},
        walls: [ [0.4, 0.2, 0.4, 0.8] ]
    },
    {
        message: "때로는 돌아가는 길이 더 빠를 수 있습니다.",
        start: {x: 0.1, y: 0.5}, goal: {x: 0.9, y: 0.5},
        walls: [
            [0.3, 0.0, 0.3, 0.7],
            [0.6, 0.3, 0.6, 1.0]
        ]
    },
    {
        message: "침착하게 주변을 살피면 항상 틈은 존재합니다.",
        start: {x: 0.1, y: 0.8}, goal: {x: 0.9, y: 0.2},
        walls: [
            [0.0, 0.6, 0.7, 0.6],
            [0.3, 0.4, 1.0, 0.4]
        ]
    },
    {
        message: "자신을 믿고 빈틈을 향해 나아가세요.",
        start: {x: 0.1, y: 0.1}, goal: {x: 0.9, y: 0.9},
        walls: [
            [0.3, 0.3, 0.3, 1.0], [0.0, 0.3, 0.15, 0.3],
            [0.6, 0.0, 0.6, 0.7], [0.85, 0.7, 1.0, 0.7]
        ]
    }
];

export default function GameCanvas({ levelIndex, onClear, onGameEnd }) {
  const canvasRef = useRef(null);
  const [levelMsg, setLevelMsg] = useState("");

  useEffect(() => {
    // 모든 스테이지 통과 시 렌더링 중단
    if (levelIndex >= LEVELS.length) {
      onGameEnd();
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const lvl = LEVELS[levelIndex];
    setLevelMsg(lvl.message);

    let animationId;
    let boundaries = [];
    let particles = [];
    let player = null;
    let goalPos = null;
    let isLevelCleared = false;
    let isPointerDown = false;

    class Particle {
        constructor(x, y, angle, life = 1.0, decayRate = 0.005) {
            this.pos = new Vector2(x, y);
            this.dir = new Vector2(Math.cos(angle), Math.sin(angle));
            this.speed = 4;
            this.life = life;
            this.decayRate = decayRate + Math.random() * (decayRate * 0.5);
            this.bounces = 0;
            this.maxBounces = 3;
            this.active = true;
        }

        update() {
            if (!this.active) return;
            let nextPos = this.pos.add(this.dir.mult(this.speed));
            let closestDist = Infinity;
            let closestIntersection = null;
            let hitNormal = null;

            for (let b of boundaries) {
                let hit = lineIntersect(this.pos.x, this.pos.y, nextPos.x, nextPos.y, b.a.x, b.a.y, b.b.x, b.b.y);
                if (hit) {
                    let dist = this.pos.sub(hit).mag();
                    if (dist < closestDist) {
                        closestDist = dist; closestIntersection = hit; hitNormal = b.normal;
                    }
                }
            }

            this.prevPos = new Vector2(this.pos.x, this.pos.y);

            if (closestIntersection) {
                this.pos = closestIntersection;
                this.bounces++;
                if (this.bounces > this.maxBounces) {
                    this.active = false;
                } else {
                    let dot = this.dir.dot(hitNormal);
                    if (dot > 0) { hitNormal = hitNormal.mult(-1); dot = this.dir.dot(hitNormal); }
                    this.dir = this.dir.sub(hitNormal.mult(2 * dot));
                    const scatter = (Math.random() - 0.5) * 0.1;
                    const newAngle = Math.atan2(this.dir.y, this.dir.x) + scatter;
                    this.dir = new Vector2(Math.cos(newAngle), Math.sin(newAngle));
                    this.life *= 0.8;
                }
            } else {
                this.pos = nextPos;
            }

            this.life -= this.decayRate;
            if (this.life <= 0) this.active = false;
        }

        draw(ctx) {
            if (!this.active || !this.prevPos) return;
            ctx.beginPath();
            ctx.moveTo(this.prevPos.x, this.prevPos.y);
            ctx.lineTo(this.pos.x, this.pos.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${this.life * 0.8})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }

    function emitEcho(x, y, numRays = 180, life = 1.0, decayRate = 0.005) {
        for (let i = 0; i < numRays; i++) {
            const angle = (i / numRays) * Math.PI * 2;
            particles.push(new Particle(x, y, angle, life, decayRate));
        }
    }

    class Player {
        constructor(x, y) {
            this.pos = new Vector2(x, y);
            this.target = new Vector2(x, y);
            this.speed = 2.5;
            this.isMoving = false;
            this.stepCounter = 0;
        }
        
        setTarget(x, y) {
            let wasMoving = this.isMoving;
            this.target = new Vector2(x, y);
            this.isMoving = true;
            if (!wasMoving) emitEcho(this.pos.x, this.pos.y, 180, 1.5, 0.008); 
        }

        update() {
            if (!this.isMoving) return;
            let dist = this.target.sub(this.pos).mag();
            if (dist <= this.speed) {
                this.pos = new Vector2(this.target.x, this.target.y);
                this.isMoving = false;
                emitEcho(this.pos.x, this.pos.y, 90, 1.0, 0.015);
                return;
            }

            let dir = this.target.sub(this.pos).normalize();
            let nextPos = this.pos.add(dir.mult(this.speed));
            
            let closestDist = Infinity;
            let closestIntersection = null;

            for (let b of boundaries) {
                let hit = lineIntersect(this.pos.x, this.pos.y, nextPos.x, nextPos.y, b.a.x, b.a.y, b.b.x, b.b.y);
                if (hit) {
                    let d = this.pos.sub(hit).mag();
                    if (d < closestDist) {
                        closestDist = d; closestIntersection = hit;
                    }
                }
            }

            if (closestIntersection) {
                this.pos = closestIntersection.sub(dir.mult(2.0));
                this.isMoving = false;
                emitEcho(this.pos.x, this.pos.y, 45, 0.6, 0.02);
                return;
            }

            this.pos = nextPos;
            
            this.stepCounter += this.speed;
            if (this.stepCounter > 35) {
                this.stepCounter = 0;
                emitEcho(this.pos.x, this.pos.y, 60, 0.7, 0.02);
            }
        }
        
        draw(ctx) {
            ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; ctx.fill();
            ctx.beginPath(); ctx.arc(this.pos.x, this.pos.y, 10, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'; ctx.fill();
        }
    }

    const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // 레벨 데이터는 리사이즈 될때마다 비율 반영
        const w = canvas.width;
        const h = canvas.height;
        
        goalPos = new Vector2(w * lvl.goal.x, h * lvl.goal.y);
        
        boundaries = [
            new Boundary(10, 10, w-10, 10), new Boundary(w-10, 10, w-10, h-10),
            new Boundary(w-10, h-10, 10, h-10), new Boundary(10, h-10, 10, 10)
        ];
        lvl.walls.forEach(wall => {
            boundaries.push(new Boundary(w*wall[0], h*wall[1], w*wall[2], h*wall[3]));
        });
        
        // 처음 세팅 시에만 플레이어 위치 지정
        if (!player) {
            player = new Player(w * lvl.start.x, h * lvl.start.y);
            // 시작 파동
            emitEcho(player.pos.x, player.pos.y, 360, 2.0, 0.003);
            ctx.fillStyle = '#05070e';
            ctx.fillRect(0, 0, w, h);
        }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const handlePointerDown = (x, y) => { isPointerDown = true; if (player && !isLevelCleared) player.setTarget(x, y); };
    const handlePointerMove = (x, y) => { if (isPointerDown && player && !isLevelCleared) player.setTarget(x, y); };
    const handlePointerUp = () => { isPointerDown = false; };

    const onMouseDown = (e) => handlePointerDown(e.clientX, e.clientY);
    const onMouseMove = (e) => handlePointerMove(e.clientX, e.clientY);
    const onTouchStart = (e) => handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
    const onTouchMove = (e) => handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    function gameLoop() {
        ctx.fillStyle = 'rgba(5, 7, 14, 0.15)'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (goalPos && !isLevelCleared) {
            const pulse = Math.sin(Date.now() / 500) * 0.5 + 0.5;
            ctx.beginPath(); ctx.arc(goalPos.x, goalPos.y, 20 + pulse * 10, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + pulse * 0.05})`; ctx.fill();
            ctx.beginPath(); ctx.arc(goalPos.x, goalPos.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; ctx.fill();
        }

        if (player) {
            player.update();
            player.draw(ctx);

            if (!isLevelCleared && goalPos) {
                let dist = player.pos.sub(goalPos).mag();
                if (dist < 80) {
                    isLevelCleared = true;
                    emitEcho(goalPos.x, goalPos.y, 360, 2.5, 0.002);
                    onClear(); // Report to parent Game.jsx
                }
            }
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw(ctx);
            if (!particles[i].active) particles.splice(i, 1);
        }

        animationId = requestAnimationFrame(gameLoop);
    }

    gameLoop();

    return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', handleResize);
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', handlePointerUp);
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', handlePointerUp);
    };
  }, [levelIndex, onClear, onGameEnd]);

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 block touch-none" />
      <div className="absolute top-8 left-8 z-10 pointer-events-none fade-in">
        <p className="text-white/80 uppercase tracking-[0.2em] font-light">
          {levelIndex === 0 ? "Tutorial" : `Level ${levelIndex}`}
        </p>
        <p className="text-white/40 text-sm mt-2 font-light tracking-wide">{levelMsg}</p>
      </div>
    </>
  );
}
