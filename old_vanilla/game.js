// 벡터 객체 구성
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

// 2D 선분 간의 교차점 계산 함수
function lineIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den === 0) return null; // 평행함
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
    if (t > 0 && t < 1 && u > 0 && u < 1) {
        return new Vector2(x1 + t * (x2 - x1), y1 + t * (y2 - y1));
    }
    return null;
}

// 장애물(벽) 선분
class Boundary {
    constructor(x1, y1, x2, y2) {
        this.a = new Vector2(x1, y1);
        this.b = new Vector2(x2, y2);
        // 법선 벡터(Normal Vector) 계산
        let dx = x2 - x1;
        let dy = y2 - y1;
        this.normal = new Vector2(-dy, dx).normalize();
    }
}

// 음파 레이(Particle)
class Particle {
    constructor(x, y, angle, life = 1.0, decayRate = 0.005) {
        this.pos = new Vector2(x, y);
        this.dir = new Vector2(Math.cos(angle), Math.sin(angle));
        this.speed = 4;
        this.life = life;
        this.decayRate = decayRate + Math.random() * (decayRate * 0.5); // 서서히 사라짐
        this.bounces = 0;
        this.maxBounces = 3;
        this.active = true;
    }

    update(boundaries) {
        if (!this.active) return;

        let nextPos = this.pos.add(this.dir.mult(this.speed));
        let closestIntersection = null;
        let closestDist = Infinity;
        let hitNormal = null;

        // 모든 벽과 충돌 검사
        for (let b of boundaries) {
            let intersection = lineIntersect(
                this.pos.x, this.pos.y, nextPos.x, nextPos.y,
                b.a.x, b.a.y, b.b.x, b.b.y
            );
            
            if (intersection) {
                let dist = this.pos.sub(intersection).mag();
                if (dist < closestDist) {
                    closestDist = dist;
                    closestIntersection = intersection;
                    hitNormal = b.normal;
                }
            }
        }

        // 렌더링을 위한 과거 위치 저장
        this.prevPos = new Vector2(this.pos.x, this.pos.y);

        if (closestIntersection) {
            this.pos = closestIntersection;
            this.bounces++;
            
            if (this.bounces > this.maxBounces) {
                this.active = false; // 수명 종료
            } else {
                // 입사각 대비 반사각 계산: R = D - 2(D dot N)N
                let dot = this.dir.dot(hitNormal);
                // 양면 반사를 지원하기 위해 노멀 벡터 방향 보정
                if (dot > 0) {
                    hitNormal = hitNormal.mult(-1);
                    dot = this.dir.dot(hitNormal);
                }
                
                this.dir = this.dir.sub(hitNormal.mult(2 * dot));
                // 약간의 난수(산란)를 더해 부드러운 퍼짐 효과 연출
                const scatter = (Math.random() - 0.5) * 0.1;
                const newAngle = Math.atan2(this.dir.y, this.dir.x) + scatter;
                this.dir = new Vector2(Math.cos(newAngle), Math.sin(newAngle));

                // 튕길 때 속도나 생명력을 조금 깎음
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
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.life * 0.8})`; // 은은하게 흰색
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

// 플레이어 로직
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
        
        // 화면을 드래그해서 연속으로 이동 목표를 갱신할 때 파동이 과도하게 터지는 것을 방지
        // 이동을 새로 시작(정지상태에서 출발)할 때만 1회 강하게 발산
        if (!wasMoving) {
            emitEcho(this.pos.x, this.pos.y, 180, 1.5, 0.008); 
        }
    }

    update(boundaries) {
        if (!this.isMoving) return;

        let dist = this.target.sub(this.pos).mag();
        if (dist <= this.speed) {
            this.pos = new Vector2(this.target.x, this.target.y);
            this.isMoving = false;
            // 목적지 도착 시 부드러운 파동 발생
            emitEcho(this.pos.x, this.pos.y, 90, 1.0, 0.015);
            return;
        }

        let dir = this.target.sub(this.pos).normalize();
        let nextPos = this.pos.add(dir.mult(this.speed));
        
        // 벽 충돌 검사
        let closestDist = Infinity;
        let closestIntersection = null;

        for (let b of boundaries) {
            let hit = lineIntersect(
                this.pos.x, this.pos.y, nextPos.x, nextPos.y,
                b.a.x, b.a.y, b.b.x, b.b.y
            );
            if (hit) {
                let d = this.pos.sub(hit).mag();
                if (d < closestDist) {
                    closestDist = d;
                    closestIntersection = hit;
                }
            }
        }

        // 벽과 부딪힌다면 그 자리에 멈춤
        if (closestIntersection) {
            this.pos = closestIntersection.sub(dir.mult(2.0)); // 약간 뒤로 보정해 끼임 방지
            this.isMoving = false;
            emitEcho(this.pos.x, this.pos.y, 45, 0.6, 0.02); // 부딪히면서 약한 파동 발생
            return;
        }

        this.pos = nextPos;
        
        // 발걸음 (주기적으로 작은 파동 발산)
        this.stepCounter += this.speed;
        if (this.stepCounter > 35) {
            this.stepCounter = 0;
            emitEcho(this.pos.x, this.pos.y, 60, 0.7, 0.02);
        }
    }
    
    draw(ctx) {
        // 플레이어 위치 표시 (은은한 흰 빛)
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
    }
}

// 게임 메인 엔진
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let boundaries = [];
let particles = [];
let player = null;
let currentLevelIndex = 0;
let goalPos = null;
let isLevelCleared = false;

// 레벨 데이터 정의
const LEVELS = [
    {
        message: "어둠 속에서 첫 걸음을 내딛어보세요.",
        start: {x: 0.1, y: 0.5},
        goal: {x: 0.8, y: 0.5},
        walls: [
            [0.4, 0.2, 0.4, 0.8] // 가운데 장애물
        ]
    },
    {
        message: "때로는 돌아가는 길이 더 빠를 수 있습니다.",
        start: {x: 0.1, y: 0.5},
        goal: {x: 0.9, y: 0.5},
        walls: [
            [0.3, 0.0, 0.3, 0.7],
            [0.6, 0.3, 0.6, 1.0]
        ]
    },
    {
        message: "침착하게 주변을 살피면 항상 틈은 존재합니다.",
        start: {x: 0.1, y: 0.8},
        goal: {x: 0.9, y: 0.2},
        walls: [
            [0.0, 0.6, 0.7, 0.6],
            [0.3, 0.4, 1.0, 0.4]
        ]
    },
    {
        message: "자신을 믿고 빈틈을 향해 나아가세요.",
        start: {x: 0.1, y: 0.1},
        goal: {x: 0.9, y: 0.9},
        walls: [
            [0.3, 0.3, 0.3, 1.0],
            [0.0, 0.3, 0.15, 0.3],
            [0.6, 0.0, 0.6, 0.7],
            [0.85, 0.7, 1.0, 0.7]
        ]
    }
];

// 창 크기 조절
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // 브라우저 툴바 등에 의한 미세한 리사이즈로 레벨이 리셋되지 않도록 방지
}
window.addEventListener('resize', resize);

function loadLevel(index) {
    if (index >= LEVELS.length) {
        // 모든 레벨 클리어
        document.getElementById('hud-screen').classList.remove('active');
        const clearScreen = document.getElementById('clear-screen');
        clearScreen.querySelector('h2').innerText = "온전한 평온";
        clearScreen.querySelector('p').innerText = "모든 여정을 마쳤습니다.";
        clearScreen.querySelector('button').style.display = 'none';
        clearScreen.classList.add('active');
        return;
    }

    const lvl = LEVELS[index];
    const w = canvas.width;
    const h = canvas.height;
    
    player = new Player(w * lvl.start.x, h * lvl.start.y);
    goalPos = new Vector2(w * lvl.goal.x, h * lvl.goal.y);
    
    boundaries = [];
    // 외곽 테두리
    boundaries.push(new Boundary(10, 10, w-10, 10)); // 상단
    boundaries.push(new Boundary(w-10, 10, w-10, h-10)); // 우측
    boundaries.push(new Boundary(w-10, h-10, 10, h-10)); // 하단
    boundaries.push(new Boundary(10, h-10, 10, 10)); // 좌측

    // 레벨 벽체 생성
    lvl.walls.forEach(wall => {
        boundaries.push(new Boundary(w*wall[0], h*wall[1], w*wall[2], h*wall[3]));
    });

    document.getElementById('level-indicator').innerHTML = `Level ${index + 1}<br><span style="font-size:0.8em; opacity:0.7;">${lvl.message}</span>`;
    
    isLevelCleared = false;
    particles = [];
    
    // 시작 시 큰 파동
    emitEcho(player.pos.x, player.pos.y, 360, 2.0, 0.003);
}

function checkGoal() {
    if (!isLevelCleared && player && goalPos) {
        let dist = player.pos.sub(goalPos).mag();
        if (dist < 80) { // 목표 도달 반경을 넉넉하게 변경
            isLevelCleared = true;
            emitEcho(goalPos.x, goalPos.y, 360, 2.5, 0.002); // 클리어 파동
            
            setTimeout(() => {
                document.getElementById('clear-screen').classList.add('active');
            }, 1000);
        }
    }
}

// 음파 발산 함수
function emitEcho(x, y, numRays = 180, life = 1.0, decayRate = 0.005) {
    for (let i = 0; i < numRays; i++) {
        const angle = (i / numRays) * Math.PI * 2;
        particles.push(new Particle(x, y, angle, life, decayRate));
    }
}

// 조작 이벤트 (터치 및 마우스 드래그 지원)
let isPointerDown = false;

canvas.addEventListener('mousedown', (e) => {
    isPointerDown = true;
    if (player) player.setTarget(e.clientX, e.clientY);
});
canvas.addEventListener('mousemove', (e) => {
    if (isPointerDown && player) player.setTarget(e.clientX, e.clientY);
});
window.addEventListener('mouseup', () => {
    isPointerDown = false;
});

canvas.addEventListener('touchstart', (e) => {
    isPointerDown = true;
    if (player) player.setTarget(e.touches[0].clientX, e.touches[0].clientY);
});
canvas.addEventListener('touchmove', (e) => {
    if (isPointerDown && player) player.setTarget(e.touches[0].clientX, e.touches[0].clientY);
    // e.preventDefault(); // 스크롤 방지를 위해 필요할 수 있지만 css의 touch-action으로 대개 커버됨
});
window.addEventListener('touchend', () => {
    isPointerDown = false;
});

// 메인 루프
function gameLoop() {
    // 잔상 효과
    ctx.fillStyle = 'rgba(5, 7, 14, 0.15)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 목적지 표시 (매우 은은하게 깜빡임)
    if (goalPos && !isLevelCleared) {
        const pulse = Math.sin(Date.now() / 500) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(goalPos.x, goalPos.y, 20 + pulse * 10, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + pulse * 0.05})`;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(goalPos.x, goalPos.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
    }

    if (player) {
        player.update(boundaries);
        player.draw(ctx);
        checkGoal();
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(boundaries);
        particles[i].draw(ctx);
        if (!particles[i].active) {
            particles.splice(i, 1);
        }
    }

    requestAnimationFrame(gameLoop);
}

// 초기화
resize();
ctx.fillStyle = '#05070e';
ctx.fillRect(0, 0, canvas.width, canvas.height);
gameLoop();

// 버튼 연동
document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('hud-screen').classList.add('active');
    currentLevelIndex = 0;
    loadLevel(currentLevelIndex);
});

document.getElementById('next-level-btn').addEventListener('click', () => {
    document.getElementById('clear-screen').classList.remove('active');
    currentLevelIndex++;
    loadLevel(currentLevelIndex);
});
