// ═══════════════════════════════════════════════════════════
//  GLOBAL COMMAND – game.js  (v4)
//  Cơ chế: CHỈ THỦ ĐÔ → VÀNG · Tỉnh → DÂN · 6 AI phe
// ═══════════════════════════════════════════════════════════

const WORLD_WIDTH        = 4000;
const WORLD_HEIGHT       = 2000;
const ECO_TICK_MS        = 15000; // Kinh tế cập nhật mỗi 15 giây
const AI_TICK_MS         = 24000; // AI cân nhắc lại chiến lược mỗi 24 giây
const ARMY_MUSTER_MS     = 800;   // Thời gian gom quân thành một đạo quân
const TRAIN_INTERVAL     = 8000;  // Một lính cần 8 giây huấn luyện
const MOVE_SPEED         = 12;    // Hành quân chậm để tạo thời gian phản ứng
const CAPITAL_GOLD_RATE  = 2;     // Vàng mỗi 15 giây cho mỗi Thủ Đô
const PROVINCE_POP_RATE  = 1;     // Dân mỗi 15 giây tại tỉnh thường
const CAPITAL_POP_RATE   = 2;     // Dân mỗi 15 giây tại Thủ Đô
const TROOP_GOLD_COST    = 8;     // Vàng cần để huấn luyện một lính
const TROOP_POP_COST     = 3;     // Dân cần để huấn luyện một lính
const MAX_TRAINING_QUEUE = 6;     // Giới hạn hàng đợi tại mỗi tỉnh
const MAX_AI_RECRUIT_PER_TICK = 1;
const CAPITAL_MOVE_COST  = 60;
const LOOT_ON_CAPTURE    = 2;     // Thưởng nhỏ khi chiếm tỉnh
const FACTION_GOLD_LOOT_RATE = 0.15;

// ─── 7 phe (1 = player, 2-7 = AI) ──────────────────────────
const FACTIONS = {
    0: { color: 0x2a3f55, name: 'NEUTRAL',    hex: '#3a5a7a' },
    1: { color: 0x00e5ff, name: 'ALLIANCE',   hex: '#00e5ff' },  // Player
    2: { color: 0xff2255, name: 'SYNDICATE',  hex: '#ff2255' },
    3: { color: 0xffcc00, name: 'DOMINION',   hex: '#ffcc00' },
    4: { color: 0xcc44ff, name: 'EMPIRE',     hex: '#cc44ff' },
    5: { color: 0xff7700, name: 'LEGION',     hex: '#ff7700' },
    6: { color: 0x44ff88, name: 'COVENANT',   hex: '#44ff88' },
    7: { color: 0xff44aa, name: 'DYNASTY',    hex: '#ff44aa' }
};

// ─── Loại tỉnh đơn giản ─────────────────────────────────────
const TYPES = {
    basic:   { icon: '○', label: 'Tỉnh',    color: '#8899aa' },
    capital: { icon: '★', label: 'Thủ Đô',  color: '#ffd700' }
};

// ─── 52 thành phố, 7 Thủ Đô (owner 1-7) ────────────────────
const CITIES = [
    // ★ 7 THỦ ĐÔ — khởi đầu nhỏ, khó khăn
    { name:'HANOI',        lat: 21.03, lon: 105.85, owner:1, type:'capital', units:8, pop:30  },
    { name:'BEIJING',      lat: 39.90, lon: 116.41, owner:2, type:'capital', units:8, pop:30  },
    { name:'WASHINGTON',   lat: 38.90, lon: -77.04, owner:3, type:'capital', units:8, pop:30  },
    { name:'MOSCOW',       lat: 55.76, lon:  37.62, owner:4, type:'capital', units:8, pop:30  },
    { name:'SAO PAULO',    lat:-23.55, lon: -46.63, owner:5, type:'capital', units:8, pop:30  },
    { name:'CAIRO',        lat: 30.04, lon:  31.24, owner:6, type:'capital', units:8, pop:30  },
    { name:'MUMBAI',       lat: 19.08, lon:  72.88, owner:7, type:'capital', units:8, pop:30  },

    // ○ CHÂU Á — dân đông, tỉnh giá trị cao
    { name:'HO CHI MINH', lat: 10.82, lon: 106.63, owner:0, type:'basic', units:7, pop:55 },
    { name:'PHNOM PENH',  lat: 11.56, lon: 104.92, owner:0, type:'basic', units:4, pop:40 },
    { name:'VIENTIANE',   lat: 17.97, lon: 102.60, owner:0, type:'basic', units:4, pop:35 },
    { name:'BANGKOK',     lat: 13.76, lon: 100.50, owner:0, type:'basic', units:8, pop:60 },
    { name:'YANGON',      lat: 16.87, lon:  96.13, owner:0, type:'basic', units:5, pop:45 },
    { name:'SINGAPORE',   lat:  1.35, lon: 103.82, owner:0, type:'basic', units:9, pop:40 },
    { name:'JAKARTA',     lat: -6.21, lon: 106.85, owner:0, type:'basic', units:8, pop:75 },
    { name:'MANILA',      lat: 14.60, lon: 120.98, owner:0, type:'basic', units:6, pop:60 },
    { name:'SHANGHAI',    lat: 31.23, lon: 121.47, owner:0, type:'basic', units:10, pop:80 },
    { name:'GUANGZHOU',   lat: 23.13, lon: 113.26, owner:0, type:'basic', units:9, pop:65 },
    { name:'TOKYO',       lat: 35.69, lon: 139.69, owner:0, type:'basic', units:11, pop:80 },
    { name:'OSAKA',       lat: 34.69, lon: 135.50, owner:0, type:'basic', units:6, pop:50 },
    { name:'SEOUL',       lat: 37.57, lon: 126.98, owner:0, type:'basic', units:10, pop:65 },
    { name:'PYONGYANG',   lat: 39.02, lon: 125.75, owner:0, type:'basic', units:5, pop:40 },
    { name:'ULAANBAATAR', lat: 47.91, lon: 106.92, owner:0, type:'basic', units:4, pop:30 },
    { name:'NEW DELHI',   lat: 28.61, lon:  77.21, owner:0, type:'basic', units:10, pop:95 },
    { name:'COLOMBO',     lat:  6.93, lon:  79.85, owner:0, type:'basic', units:4, pop:35 },
    { name:'KARACHI',     lat: 24.86, lon:  67.01, owner:0, type:'basic', units:6, pop:70 },
    { name:'TEHRAN',      lat: 35.69, lon:  51.39, owner:0, type:'basic', units:6, pop:55 },
    { name:'DUBAI',       lat: 25.20, lon:  55.27, owner:0, type:'basic', units:5, pop:35 },
    { name:'RIYADH',      lat: 24.71, lon:  46.68, owner:0, type:'basic', units:5, pop:40 },
    { name:'BAGHDAD',     lat: 33.34, lon:  44.40, owner:0, type:'basic', units:5, pop:45 },
    { name:'ISTANBUL',    lat: 41.01, lon:  28.98, owner:0, type:'basic', units:9, pop:80 },

    // ○ CHÂU ÂU
    { name:'KYIV',        lat: 50.45, lon:  30.52, owner:0, type:'basic', units:6, pop:55 },
    { name:'WARSAW',      lat: 52.23, lon:  21.01, owner:0, type:'basic', units:6, pop:55 },
    { name:'BERLIN',      lat: 52.52, lon:  13.41, owner:0, type:'basic', units:10, pop:70 },
    { name:'PARIS',       lat: 48.86, lon:   2.35, owner:0, type:'basic', units:9, pop:65 },
    { name:'LONDON',      lat: 51.51, lon:  -0.13, owner:0, type:'basic', units:9, pop:70 },
    { name:'MADRID',      lat: 40.42, lon:  -3.70, owner:0, type:'basic', units:6, pop:55 },
    { name:'ROME',        lat: 41.90, lon:  12.50, owner:0, type:'basic', units:6, pop:55 },
    { name:'STOCKHOLM',   lat: 59.33, lon:  18.07, owner:0, type:'basic', units:4, pop:40 },

    // ○ BẮC MỸ
    { name:'NEW YORK',    lat: 40.71, lon: -74.01, owner:0, type:'basic', units:11, pop:80 },
    { name:'LOS ANGELES', lat: 34.05, lon:-118.24, owner:0, type:'basic', units:10, pop:65 },
    { name:'CHICAGO',     lat: 41.88, lon: -87.63, owner:0, type:'basic', units:8, pop:55 },
    { name:'TEXAS',       lat: 31.97, lon: -99.90, owner:0, type:'basic', units:6, pop:50 },
    { name:'TORONTO',     lat: 43.65, lon: -79.35, owner:0, type:'basic', units:6, pop:50 },
    { name:'MEXICO CITY', lat: 19.43, lon: -99.13, owner:0, type:'basic', units:10, pop:90 },
    { name:'HAVANA',      lat: 23.11, lon: -82.37, owner:0, type:'basic', units:4, pop:30 },

    // ○ NAM MỸ
    { name:'BOGOTA',      lat:  4.71, lon: -74.07, owner:0, type:'basic', units:5, pop:50 },
    { name:'RIO',         lat:-22.90, lon: -43.17, owner:0, type:'basic', units:8, pop:70 },
    { name:'BUENOS AIRES',lat:-34.60, lon: -58.38, owner:0, type:'basic', units:8, pop:60 },
    { name:'LIMA',        lat:-12.05, lon: -77.04, owner:0, type:'basic', units:4, pop:45 },

    // ○ CHÂU PHI
    { name:'LAGOS',       lat:  6.52, lon:   3.38, owner:0, type:'basic', units:8, pop:90 },
    { name:'NAIROBI',     lat: -1.29, lon:  36.82, owner:0, type:'basic', units:5, pop:50 },
    { name:'KINSHASA',    lat: -4.44, lon:  15.27, owner:0, type:'basic', units:6, pop:65 },
    { name:'CAPE TOWN',   lat:-33.92, lon:  18.42, owner:0, type:'basic', units:5, pop:40 },
    { name:'ALGIERS',     lat: 36.75, lon:   3.06, owner:0, type:'basic', units:5, pop:45 },

    // ○ CHÂU ĐẠI DƯƠNG
    { name:'SYDNEY',      lat:-33.87, lon: 151.21, owner:0, type:'basic', units:6, pop:50 },
    { name:'AUCKLAND',    lat:-36.85, lon: 174.76, owner:0, type:'basic', units:4, pop:30 }
];

// ═══ MAIN SCENE ═════════════════════════════════════════════
class MainScene extends Phaser.Scene {
    constructor() { super({ key: 'MainScene' }); }

    create() {
        window.gameScene = this;
        this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.isTouchDevice = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
        this.isCompactScreen = window.matchMedia('(max-width: 700px)').matches ||
            (this.isTouchDevice && Math.min(window.innerWidth, window.innerHeight) <= 600);
        this.dragThreshold = this.isTouchDevice ? 14 : 8;
        document.getElementById('map-hint').textContent = this.isTouchDevice
            ? 'Chọn tỉnh xanh → chọn đích · Kéo nền để di chuyển · Chụm để zoom'
            : 'Kéo từ tỉnh xanh tới mục tiêu · Kéo nền để di chuyển · Cuộn để zoom';
        this.cameras.main.setZoom(this.isCompactScreen ? 0.42 : 0.35);

        this.nodes       = [];
        this.activeUnits = [];
        this.selectedNode = null;
        this.isPanning   = false;
        this.dragState   = { on: false, startX:0, startY:0, startNode:null, pX:0, pY:0 };
        this.pinchGesture = false;
        this.pinchDistance = 0;
        this.input.addPointer(2);
        this.ecoTimer    = 0;
        this.aiTimer     = 0;

        // Vàng khởi đầu — ít, phải cố gắng kiếm
        this.gold = { 1:15, 2:15, 3:15, 4:15, 5:15, 6:15, 7:15 };

        // Track xem phe nào còn sống
        this.alive = new Set([1, 2, 3, 4, 5, 6, 7]);

        this.bgGfx   = this.add.graphics().setDepth(-10);
        this.linkGfx = this.add.graphics().setDepth(-5);
        this.dragGfx = this.add.graphics().setDepth(50).setScrollFactor(0);

        this.drawWorldMap();
        this.buildNodes();
        this.updateGoldUI();
        this.updateMobileLabels();
        this.drawLinks();
        this.setupInput();
        this.setupMinimap();

        // Camera intro
        const hanoi = this.nodes.find(n => n.name === 'HANOI');
        this.time.delayedCall(400, () => {
            this.cameras.main.pan(hanoi.x, hanoi.y, 2000, 'Sine.easeInOut');
            this.cameras.main.zoomTo(this.isCompactScreen ? 0.72 : 1.1, 2000);
        });

        this.logEvent('⚔ Cuộc chiến thế giới bắt đầu! Chiếm Thủ Đô để có Vàng.', 'gold');
    }

    // ─── Map ─────────────────────────────────────────────────
    drawWorldMap() {
        this.bgGfx.fillStyle(0x020d1c, 1);
        this.bgGfx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
            .then(r => r.json())
            .then(data => {
                data.features.forEach(f => {
                    const draw = pts => {
                        this.bgGfx.lineStyle(1, 0x003355, 0.7);
                        this.bgGfx.fillStyle(0x061520, 1);
                        this.bgGfx.beginPath();
                        pts.forEach((p,i) => {
                            const x = (p[0]+180)*(WORLD_WIDTH/360);
                            const y = (90-p[1])*(WORLD_HEIGHT/180);
                            i===0 ? this.bgGfx.moveTo(x,y) : this.bgGfx.lineTo(x,y);
                        });
                        this.bgGfx.closePath();
                        this.bgGfx.fillPath(); this.bgGfx.strokePath();
                    };
                    const g = f.geometry;
                    if (g.type==='Polygon') draw(g.coordinates[0]);
                    else if (g.type==='MultiPolygon') g.coordinates.forEach(c=>draw(c[0]));
                });
            }).catch(()=>{});
    }

    buildNodes() {
        CITIES.forEach(city => {
            const x = (city.lon+180)*(WORLD_WIDTH/360);
            const y = (90-city.lat)*(WORLD_HEIGHT/180);
            this.createNode(x, y, city);
        });
    }

    drawLinks() {
        this.linkGfx.clear();
        this.nodes.forEach((a,i) => {
            this.nodes.forEach((b,j) => {
                if (j<=i) return;
                const d = Phaser.Math.Distance.Between(a.x,a.y,b.x,b.y);
                if (d < 400) {
                    this.linkGfx.lineStyle(1, 0x00aaff, d<200?0.1:0.04);
                    this.linkGfx.lineBetween(a.x,a.y,b.x,b.y);
                }
            });
        });
    }

    createNode(x, y, city) {
        const isCapital = city.type === 'capital';
        const R = isCapital ? 30 : 21;
        const fc = FACTIONS[city.owner].color;
        const container = this.add.container(x, y).setDepth(10);
        container.setSize(R*3.5, R*3.5).setInteractive({ useHandCursor: !this.isTouchDevice });

        // Pulse glow
        const pulse = this.add.circle(0, 0, R+8, fc, 0.0);
        pulse.setStrokeStyle(isCapital?3:1.5, fc, 0.5);
        this.tweens.add({ targets:pulse, alpha:0.6, scale:1.5, duration:1600+Math.random()*800, yoyo:true, repeat:-1, ease:'Sine.easeInOut' });

        const shadow = this.add.circle(0, 0, R+2, 0x000000, 0.6);
        const fill   = this.add.circle(0, 0, R, fc, 0.88);
        fill.setStrokeStyle(isCapital?2.5:1.5, 0xffffff, 0.25);

        // Thủ đô có thêm ring ngoài
        let capitalRing = null;
        if (isCapital) {
            capitalRing = this.add.circle(0, 0, R+5);
            capitalRing.setStrokeStyle(2, 0xffd700, 0.7);
        }

        const unitsTxt = this.add.text(0, 0, city.units, {
            fontFamily:'Rajdhani', fontSize: isCapital?'23px':'18px', fontStyle:'bold', color:'#ffffff',
            shadow:{ blur:5, color:'#000', fill:true }
        }).setOrigin(0.5);

        const popTxt = this.add.text(0, R+11, `👤${city.pop}`, {
            fontFamily:'Arial', fontSize:'11px', color:'#55dd88',
            shadow:{ blur:3, color:'#000', fill:true }
        }).setOrigin(0.5);

        const nameTxt = this.add.text(0, -(R+13), city.name, {
            fontFamily:'Rajdhani', fontSize: isCapital?'16px':'14px', fontStyle:'bold', color:'#ffffff',
            shadow:{ blur:5, color:'#000', fill:true }
        }).setOrigin(0.5);

        const iconTxt = this.add.text(R+10, -(R+10), TYPES[city.type].icon, {
            fontFamily:'Arial', fontSize: isCapital?'16px':'12px', color: isCapital?'#ffd700':'#aaaaaa'
        }).setOrigin(0.5);

        // Selection ring
        const sel = this.add.circle(0, 0, R+8);
        sel.setStrokeStyle(2.5, 0xffffff, 0); sel.setVisible(false);

        const parts = [sel, pulse, shadow, fill];
        if (capitalRing) parts.push(capitalRing);
        parts.push(unitsTxt, popTxt, nameTxt, iconTxt);
        container.add(parts);

        const node = {
            container, fill, shadow, pulse, capitalRing, unitsTxt, popTxt, nameTxt, iconTxt, sel,
            name:city.name, x, y, R,
            owner:city.owner, type:city.type,
            units:city.units, pop:city.pop, maxPop:300,
            dispatchQueue:[], dispatchTimer:0, pendingOrders:0,
            trainingQueue:0, trainingTimer:0, trainingMax:0
        };
        this.nodes.push(node);

        container.on('pointerover', ()=>this.showTooltip(node));
        container.on('pointerout',  ()=>this.hideTooltip());
    }

    // ─── Input ───────────────────────────────────────────────
    setupInput() {
        // Fallback cho Safari/iOS: một số phiên bản không cập nhật worldX/worldY
        // ổn định khi canvas đang pan/zoom; kiểm tra tap từ tọa độ DOM sau sự kiện Phaser.
        const canvas=this.game.canvas;
        const domPointers=new Set();
        const tapStarts=new Map();
        canvas.addEventListener('pointerdown', event => {
            domPointers.add(event.pointerId);
            if (domPointers.size===1) tapStarts.set(event.pointerId,{x:event.clientX,y:event.clientY});
            else tapStarts.clear();
        }, true);
        canvas.addEventListener('pointerup', event => {
            const start=tapStarts.get(event.pointerId);
            const wasMultiTouch=domPointers.size>1;
            tapStarts.delete(event.pointerId);
            domPointers.delete(event.pointerId);
            if (!start || wasMultiTouch || this.pinchGesture ||
                Phaser.Math.Distance.Between(start.x,start.y,event.clientX,event.clientY)>18) return;

            const before=this.selectedNode;
            window.setTimeout(() => {
                // Nếu Phaser đã xử lý tap, không chạy lần thứ hai.
                if (this.selectedNode!==before) return;
                const rect=canvas.getBoundingClientRect();
                const gameX=(event.clientX-rect.left)*(this.scale.width/rect.width);
                const gameY=(event.clientY-rect.top)*(this.scale.height/rect.height);
                const worldPoint=this.cameras.main.getWorldPoint(gameX,gameY);
                const node=this.nodeAt(worldPoint.x,worldPoint.y);
                if (node && before && before.owner===1 && node!==before) {
                    this.dispatch(before,node);
                    this.deselectNode();
                } else if (node) this.selectNode(node);
                else this.deselectNode();
            },0);
        });
        canvas.addEventListener('pointercancel', event => {
            tapStarts.delete(event.pointerId);
            domPointers.delete(event.pointerId);
        }, true);

        this.input.on('pointerdown', p => {
            document.getElementById('map-hint')?.classList.add('hidden');
            const activePointers = this.input.pointers.filter(pointer => pointer.isDown);
            if (activePointers.length >= 2) {
                this.pinchGesture = true;
                this.dragState.on = false;
                this.dragState.startNode = null;
                this.isPanning = false;
                this.pinchDistance = Phaser.Math.Distance.Between(
                    activePointers[0].x, activePointers[0].y,
                    activePointers[1].x, activePointers[1].y
                );
                this.dragGfx.clear();
                return;
            }
            this.dragState.startX=p.x; this.dragState.startY=p.y;
            const worldPoint = this.cameras.main.getWorldPoint(p.x, p.y);
            const node = this.nodeAt(worldPoint.x, worldPoint.y);
            if (node && node.owner===1) this.dragState.startNode=node;
            else this.isPanning=true;
        });

        this.input.on('pointermove', p => {
            const activePointers = this.input.pointers.filter(pointer => pointer.isDown);
            if (this.pinchGesture && activePointers.length >= 2) {
                const [a, b] = activePointers;
                const nextDistance = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
                if (this.pinchDistance > 0 && nextDistance > 0) {
                    const centerX = (a.x + b.x) / 2;
                    const centerY = (a.y + b.y) / 2;
                    const cam = this.cameras.main;
                    const worldBefore = cam.getWorldPoint(centerX, centerY);
                    cam.setZoom(Phaser.Math.Clamp(cam.zoom * (nextDistance / this.pinchDistance), 0.22, 2.2));
                    const worldAfter = cam.getWorldPoint(centerX, centerY);
                    cam.scrollX += worldBefore.x - worldAfter.x;
                    cam.scrollY += worldBefore.y - worldAfter.y;
                    this.updateMobileLabels();
                }
                this.pinchDistance = nextDistance;
                return;
            }
            if (!p.isDown) return;
            const d = Phaser.Math.Distance.Between(this.dragState.startX,this.dragState.startY,p.x,p.y);
            if (d>this.dragThreshold) {
                if (this.dragState.startNode) { this.dragState.on=true; this.dragState.pX=p.x; this.dragState.pY=p.y; }
                else if (this.isPanning) {
                    this.cameras.main.scrollX -= (p.x-p.prevPosition.x)/this.cameras.main.zoom;
                    this.cameras.main.scrollY -= (p.y-p.prevPosition.y)/this.cameras.main.zoom;
                    this.updateMobileLabels();
                }
            }
        });

        this.input.on('pointerup', p => {
            if (this.pinchGesture) {
                if (!this.input.pointers.some(pointer => pointer.isDown)) {
                    this.pinchGesture = false;
                    this.pinchDistance = 0;
                    this.dragState.startNode = null;
                    this.dragState.on = false;
                    this.isPanning = false;
                }
                return;
            }
            const d = Phaser.Math.Distance.Between(this.dragState.startX,this.dragState.startY,p.x,p.y);
            if (d<this.dragThreshold) {
                const worldPoint = this.cameras.main.getWorldPoint(p.x, p.y);
                const node = this.nodeAt(worldPoint.x, worldPoint.y);
                if (node && this.isTouchDevice && this.selectedNode &&
                    this.selectedNode.owner===1 && node!==this.selectedNode) {
                    const source = this.selectedNode;
                    this.dispatch(source, node);
                    this.deselectNode();
                } else if (node) this.selectNode(node);
                else this.deselectNode();
            } else if (this.dragState.on && this.dragState.startNode) {
                const worldPoint = this.cameras.main.getWorldPoint(p.x, p.y);
                const tgt = this.nodeAt(worldPoint.x, worldPoint.y);
                if (tgt && tgt!==this.dragState.startNode) this.dispatch(this.dragState.startNode, tgt);
            }
            this.dragState.on=false; this.dragState.startNode=null; this.isPanning=false;
            this.dragGfx.clear();
        });

        this.input.on('wheel', (p,_,_2,dY) => {
            this.zoomMapBy(-dY*0.001);
        });
    }

    zoomMap(factor) {
        this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom * factor, 0.22, 2.2));
        this.updateMobileLabels();
    }
    zoomMapBy(amount) {
        this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom + amount, 0.22, 2.2));
        this.updateMobileLabels();
    }
    focusPlayerCapital() {
        const capital = this.nodes.find(node => node.owner===1 && node.type==='capital');
        if (!capital) return;
        this.cameras.main.pan(capital.x, capital.y, 350, 'Sine.easeOut');
        this.cameras.main.zoomTo(this.isCompactScreen ? 0.72 : 1.1, 350);
        this.updateMobileLabels();
    }

    updateMobileLabels() {
        if (!this.isCompactScreen || !this.cameras?.main || !this.nodes?.length) return;
        const camera = this.cameras.main;
        const zoom = camera.zoom;
        const allowAll = zoom >= 1.15;
        const candidates = this.nodes
            .filter(node => node === this.selectedNode || node.owner === 1 || node.type === 'capital' || allowAll)
            .sort((a, b) => {
                const priority = node => node === this.selectedNode ? 1000 : node.owner === 1 ? 100 : node.type === 'capital' ? 80 : 10;
                return priority(b) - priority(a);
            });
        const occupied = [];
        this.nodes.forEach(node => { node.nameTxt.setVisible(false); node.popTxt.setVisible(false); });
        candidates.forEach(node => {
            const width = Math.max(node.nameTxt.width * zoom, 24) + 8;
            const height = Math.max(node.nameTxt.height * zoom, 12) + 5;
            const x = (node.x - camera.scrollX) * zoom;
            const y = (node.y - node.R - 13 - camera.scrollY) * zoom;
            if (x < -width || x > camera.width + width || y < -height || y > camera.height + height) return;
            const box = { left:x-width/2, right:x+width/2, top:y-height/2, bottom:y+height/2 };
            const overlaps = occupied.some(other => box.left < other.right && box.right > other.left &&
                box.top < other.bottom && box.bottom > other.top);
            if (overlaps && node !== this.selectedNode) return;
            node.nameTxt.setVisible(true);
            occupied.push(box);
        });
    }

    nodeAt(wx, wy) {
        let nearest=null, nearestDistance=Infinity;
        for (const n of this.nodes) {
            const distance=Phaser.Math.Distance.Between(wx,wy,n.x,n.y);
            if (distance <= n.R+(this.isTouchDevice?30:18) && distance < nearestDistance) {
                nearest=n;
                nearestDistance=distance;
            }
        }
        return nearest;
    }

    // ─── Minimap ─────────────────────────────────────────────
    setupMinimap() {
        this.minimapCtx = document.getElementById('minimap').getContext('2d');
        document.getElementById('minimap').addEventListener('pointerdown', event => {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * WORLD_WIDTH;
            const y = ((event.clientY - rect.top) / rect.height) * WORLD_HEIGHT;
            this.cameras.main.pan(x, y, 250, 'Sine.easeOut');
            this.updateMobileLabels();
            event.preventDefault();
            event.stopPropagation();
        });
        this.time.addEvent({ delay:600, callback:this.drawMinimap, callbackScope:this, loop:true });
    }

    drawMinimap() {
        const ctx=this.minimapCtx, W=200, H=100;
        ctx.clearRect(0,0,W,H);
        ctx.fillStyle='#020d1c'; ctx.fillRect(0,0,W,H);
        this.nodes.forEach(n => {
            const mx=(n.x/WORLD_WIDTH)*W, my=(n.y/WORLD_HEIGHT)*H;
            ctx.beginPath();
            ctx.arc(mx, my, n.type==='capital'?4.5:2, 0, Math.PI*2);
            ctx.fillStyle = FACTIONS[n.owner].hex;
            ctx.fill();
            if (n.type==='capital') { ctx.strokeStyle=FACTIONS[n.owner].hex; ctx.lineWidth=1; ctx.stroke(); }
        });
        const cam=this.cameras.main;
        const vx=(cam.scrollX/WORLD_WIDTH)*W, vy=(cam.scrollY/WORLD_HEIGHT)*H;
        const vw=(cam.width/cam.zoom/WORLD_WIDTH)*W, vh=(cam.height/cam.zoom/WORLD_HEIGHT)*H;
        ctx.strokeStyle='rgba(0,255,255,0.5)'; ctx.lineWidth=1;
        ctx.strokeRect(vx,vy,vw,vh);
    }

    // ─── Tooltip ─────────────────────────────────────────────
    showTooltip(node) {
        if (this.isTouchDevice) return;
        const t=document.getElementById('node-tooltip');
        const f=FACTIONS[node.owner], tp=TYPES[node.type];
        let extra = '';
        if (node.type==='capital') {
            const goldPerSec = (CAPITAL_GOLD_RATE / (ECO_TICK_MS/1000)).toFixed(1);
            extra = `<br><span style="color:#ffd700">💰 +${goldPerSec}/s</span>`;
        }
        t.innerHTML=`<strong>${node.name}</strong>
            <span style="color:${f.hex}">${f.name}</span> · <span style="color:${tp.color}">${tp.label}</span><br>
            ⚔ ${Math.floor(node.units)} quân &nbsp; 👥 ${Math.floor(node.pop)} dân${extra}
            ${node.trainingQueue>0?`<br>⏳ Luyện: ${node.trainingQueue}`:''}`;
        t.style.display='block';
        document.addEventListener('mousemove', this._ttMove=e=>{
            t.style.left=(e.clientX+14)+'px'; t.style.top=(e.clientY-44)+'px';
        });
    }
    hideTooltip() {
        document.getElementById('node-tooltip').style.display='none';
        document.removeEventListener('mousemove', this._ttMove);
    }

    // ─── Select ──────────────────────────────────────────────
    selectNode(node) {
        if (this.selectedNode) this.selectedNode.sel.setVisible(false);
        this.selectedNode=node;
        node.sel.setVisible(true); node.sel.setStrokeStyle(2.5,0xffffff,0.9);
        this.updateMobileLabels();
        const panel=document.getElementById('province-panel');
        panel.style.display='block';
        setTimeout(()=>panel.classList.add('open'),10);
        this.refreshPanel();
    }
    deselectNode() {
        if (this.selectedNode) this.selectedNode.sel.setVisible(false);
        this.selectedNode=null;
        this.updateMobileLabels();
        document.getElementById('province-panel').classList.remove('open');
    }

    refreshPanel() {
        const n=this.selectedNode; if (!n) return;
        const f=FACTIONS[n.owner], tp=TYPES[n.type];

        document.getElementById('p-title').textContent=n.name;
        document.getElementById('p-faction').innerHTML=`Phe: <span style="color:${f.hex};font-weight:bold">${f.name}</span>`;
        const badge=document.getElementById('p-type-badge');
        badge.textContent=`${tp.icon} ${tp.label}`;
        badge.style.color=tp.color; badge.style.borderColor=tp.color+'55';

        document.getElementById('p-units').textContent=Math.floor(n.units);
        document.getElementById('p-pop').textContent=`${Math.floor(n.pop)} / ${n.maxPop}`;

        // Training bar
        const tb=document.getElementById('training-block');
        if (n.trainingQueue>0) {
            tb.style.display='block';
            document.getElementById('training-count').textContent=n.trainingQueue;
            const pct=n.trainingMax>0?(n.trainingMax-n.trainingQueue)/n.trainingMax*100:0;
            document.getElementById('training-bar').style.width=pct+'%';
        } else tb.style.display='none';

        // Income display cho thủ đô
        const incomeEl=document.getElementById('capital-income-info');
        if (n.type==='capital' && n.owner===1) {
            const goldPerSec=(CAPITAL_GOLD_RATE/(ECO_TICK_MS/1000)).toFixed(1);
            incomeEl.style.display='block';
            incomeEl.innerHTML=`💰 Thu nhập: <strong>+${goldPerSec} Vàng/s</strong><br><small style="color:#4a7a9b">Tỉnh chỉ đẻ Dân, không đẻ Vàng</small>`;
        } else incomeEl.style.display='none';

        const actions=document.getElementById('p-actions');
        const warning=document.getElementById('p-warning');
        if (n.owner===1) {
            actions.style.display='block'; warning.style.display='none';
            const g=this.gold[1];
            const queueRoom=Math.max(0, MAX_TRAINING_QUEUE-n.trainingQueue);
            const maxBuy=Math.min(Math.floor(n.pop/TROOP_POP_COST), Math.floor(g/TROOP_GOLD_COST), queueRoom);
            document.getElementById('recruit-input').max=Math.max(1, maxBuy);
            document.getElementById('recruit-hint').textContent=`Tối đa ${maxBuy} · ${TROOP_GOLD_COST} Vàng + ${TROOP_POP_COST} Dân/lính · ${TRAIN_INTERVAL/1000}s/lính`;
            document.getElementById('btn-cap').disabled = g<CAPITAL_MOVE_COST || n.type==='capital';
            document.getElementById('btn-cap').textContent = n.type==='capital'
                ? '★ Đây là Thủ Đô của bạn' : `★ Dời Đô về đây (${CAPITAL_MOVE_COST} Vàng)`;
        } else {
            actions.style.display='none'; warning.style.display='block';
        }
    }

    // ─── Tuyển quân ──────────────────────────────────────────
    buyTroops(mode) {
        const n=this.selectedNode; if (!n||n.owner!==1) return;
        const queueRoom=Math.max(0, MAX_TRAINING_QUEUE-n.trainingQueue);
        const affordable=Math.floor(this.gold[1]/TROOP_GOLD_COST);
        let amt=0;
        if (mode==='max') amt=Math.min(Math.floor(n.pop/TROOP_POP_COST), affordable, queueRoom);
        else {
            const v=parseInt(document.getElementById('recruit-input').value)||0;
            amt=Math.min(v, Math.floor(n.pop/TROOP_POP_COST), affordable, queueRoom);
        }
        if (amt<=0) return;
        this.gold[1]-=amt*TROOP_GOLD_COST; n.pop-=amt*TROOP_POP_COST;
        n.trainingQueue+=amt; n.trainingMax+=amt;
        this.updateNodeVisuals(n); this.refreshPanel(); this.updateGoldUI();
        this.logEvent(`🔨 Huấn luyện ${amt} lính tại ${n.name}`, 'cyan');
    }

    // ─── Chỉ còn Dời Đô (không còn Xây Dựng) ────────────────
    relocateCapital() {
        const n=this.selectedNode;
        if (!n||this.gold[1]<CAPITAL_MOVE_COST||n.type==='capital') return;
        this.gold[1]-=CAPITAL_MOVE_COST;
        // Thủ đô cũ → tỉnh thường
        this.nodes.forEach(nd=>{ if(nd.owner===1&&nd.type==='capital'){nd.type='basic'; this.updateNodeVisuals(nd);} });
        n.type='capital';
        // Thêm viền vàng cho thủ đô mới
        if (!n.capitalRing) {
            n.capitalRing = this.add.circle(0,0,n.R+5);
            n.capitalRing.setStrokeStyle(2,0xffd700,0.7);
            n.container.add(n.capitalRing);
        }
        this.updateNodeVisuals(n); this.refreshPanel(); this.updateGoldUI();
        this.logEvent(`👑 Thủ Đô dời về ${n.name}!`, 'gold');
    }

    // ─── Dispatch ────────────────────────────────────────────
    dispatch(from, to) {
        const mode=window.exactDispatchMode;
        let amt=(mode==='all') ? from.units : Math.min(from.units, parseInt(mode)||0);
        if (amt<=0) return;
        from.units-=amt; this.updateNodeVisuals(from);
        from.dispatchQueue.push({ target:to, count:amt });
        from.pendingOrders++;
        this.logEvent(`⚑ Tập hợp ${amt} quân: ${from.name} → ${to.name}`, 'cyan');
        if (this.selectedNode===from) this.refreshPanel();
    }

    // ─── AI – Thông minh và chiến lược hơn ──────────────────
    processAI() {
        // Xáo trộn thứ tự để AI đánh nhau nhiều hơn
        const fids = [...this.alive].filter(f=>f!==1);
        Phaser.Utils.Array.Shuffle(fids);

        fids.forEach(fid => {
            const mine   = this.nodes.filter(n=>n.owner===fid);
            // Tuyển quân tại một tỉnh mỗi lượt; không lặp ngân sách qua mọi tỉnh.
            const recruitNode = mine
                .filter(n=>n.pop>=TROOP_POP_COST && n.trainingQueue<MAX_TRAINING_QUEUE)
                .sort((a,b)=>((b.type==='capital')-(a.type==='capital')) || (a.units-b.units))[0];
            if (recruitNode) {
                const available = Math.min(
                    Math.floor(this.gold[fid]/TROOP_GOLD_COST),
                    Math.floor(recruitNode.pop/TROOP_POP_COST),
                    MAX_TRAINING_QUEUE-recruitNode.trainingQueue,
                    MAX_AI_RECRUIT_PER_TICK
                );
                if (available>0) {
                    recruitNode.pop-=available*TROOP_POP_COST;
                    recruitNode.trainingQueue+=available;
                    recruitNode.trainingMax+=available;
                    this.gold[fid]-=available*TROOP_GOLD_COST;
                    this.updateNodeVisuals(recruitNode);
                }
            }

            // Tìm mục tiêu tấn công — AI ĐỐI ĐẦU VỚI TẤT CẢ KẺ THÙ (kể cả AI khác)
            const attackers = mine.filter(n=>n.units>=10 && n.pendingOrders===0 && n.trainingQueue===0);
            attackers.forEach(node => {
                // Ưu tiên tấn công Thủ Đô của phe khác
                const allEnemies = this.nodes
                    .filter(n=>n.owner!==fid && n.owner!==0)
                    .sort((a,b) => {
                        // Điểm ưu tiên: Thủ Đô > ít lính > gần
                        const scoreA = (a.type==='capital'?1000:0) - a.units - Phaser.Math.Distance.Between(node.x,node.y,a.x,a.y)*0.02;
                        const scoreB = (b.type==='capital'?1000:0) - b.units - Phaser.Math.Distance.Between(node.x,node.y,b.x,b.y)*0.02;
                        return scoreB - scoreA;
                    })
                    .slice(0, 5); // Chỉ xét 5 mục tiêu gần nhất

                const nearEnemies = allEnemies.filter(e => Phaser.Math.Distance.Between(node.x,node.y,e.x,e.y)<1800);
                if (nearEnemies.length===0) return;

                const tgt = nearEnemies[0];
                const needed = Math.ceil(tgt.units + tgt.trainingQueue + 2);
                const sendAmt = Math.min(node.units-2, needed + Math.floor(Math.random()*2));

                // Chỉ hành quân khi có đủ quân vượt qua phòng thủ và lực lượng đang huấn luyện.
                if (sendAmt > needed) {
                    node.units -= sendAmt;
                    node.dispatchQueue.push({ target:tgt, count:sendAmt });
                    node.pendingOrders++;
                    this.updateNodeVisuals(node);
                }
            });

            // Chiếm tỉnh trung lập gần nhất nếu có lính dư
            const colonizers = mine.filter(n=>n.units>=7 && n.pendingOrders===0);
            colonizers.forEach(node => {
                const neutral = this.nodes
                    .filter(n=>n.owner===0)
                    .sort((a,b)=>Phaser.Math.Distance.Between(node.x,node.y,a.x,a.y)-Phaser.Math.Distance.Between(node.x,node.y,b.x,b.y))
                    [0];
                if (!neutral) return;
                const dist = Phaser.Math.Distance.Between(node.x,node.y,neutral.x,neutral.y);
                if (dist<900 && node.units >= neutral.units+4) {
                    const send = neutral.units + 1;
                    node.units-=send; node.dispatchQueue.push({target:neutral, count:send}); node.pendingOrders++;
                    this.updateNodeVisuals(node);
                }
            });
        });
    }

    // ─── Economy ─────────────────────────────────────────────
    economyLoop() {
        this.nodes.forEach(n => {
            if (n.owner===0) return;
            // Thủ Đô: sinh Vàng + Dân
            if (n.type==='capital') {
                this.gold[n.owner] = (this.gold[n.owner]||0) + CAPITAL_GOLD_RATE;
                n.pop = Math.min(n.maxPop, n.pop + CAPITAL_POP_RATE);
            } else {
                // Tỉnh thường: chỉ sinh Dân
                n.pop = Math.min(n.maxPop, n.pop + PROVINCE_POP_RATE);
            }
            this.updateNodeVisuals(n);
        });

        this.updateGoldUI();

        if (this.selectedNode) this.refreshPanel();
    }

    updateGoldUI() {
        document.getElementById('gold-value').textContent=(this.gold[1]||0)+' 💰';
        const capitals=this.nodes ? this.nodes.filter(n=>n.owner===1&&n.type==='capital').length : 1;
        const income=document.getElementById('gold-income');
        if (income) {
            income.textContent=`+${(capitals*CAPITAL_GOLD_RATE/(ECO_TICK_MS/1000)).toFixed(1)}/s · ${capitals} Thủ Đô`;
            income.style.color=capitals>0?'#2ecc71':'#e74c3c';
        }
    }

    // ─── One visible marker per marching army ────────────────
    spawnArmy(from, to, count) {
        const color=FACTIONS[from.owner].color;
        const radius=Math.min(54, 12+Math.sqrt(count)*3);
        const halo=this.add.circle(0,0,radius+5,color,0.14).setStrokeStyle(2,color,0.8);
        const core=this.add.circle(0,0,radius,color,0.94).setStrokeStyle(1.5,0xffffff,0.6);
        const fontSize=Math.round(Math.min(18,Math.max(11,radius*0.78)));
        const countText=this.add.text(0,0,String(count),{
            fontFamily:'Orbitron',fontSize:`${fontSize}px`,fontStyle:'bold',color:'#ffffff',
            stroke:'#061321',strokeThickness:3
        }).setOrigin(0.5);
        const marker=this.add.container(from.x,from.y,[halo,core,countText]).setDepth(40);
        marker.setSize((radius+5)*2,(radius+5)*2);
        this.activeUnits.push({ x:from.x, y:from.y, target:to, owner:from.owner, count, from, marker });
    }

    handleArrival(u) {
        const target=u.target;
        if (target.owner===u.owner) {
            target.units+=u.count;
            if (u.owner===1) this.logEvent(`🛡 Đạo quân ${u.count} đã tiếp viện ${target.name}`, 'cyan');
        } else {
            const defenders=Math.ceil(target.units);
            if (u.count>defenders) {
                const old=target.owner;
                const wc=FACTIONS[u.owner], lc=FACTIONS[old];

                // Đổi chủ
                target.owner=u.owner;
                target.units=u.count-defenders;
                target.trainingQueue=0;
                target.trainingTimer=0;
                target.trainingMax=0;
                target.fill.setFillStyle(FACTIONS[u.owner].color);
                target.pulse.setFillStyle(FACTIONS[u.owner].color);
                target.pulse.setStrokeStyle(target.type==='capital'?3:1.5, FACTIONS[u.owner].color, 0.5);
                if (target.capitalRing) target.capitalRing.setStrokeStyle(2,0xffd700,0.7);

                // Thưởng cướp bóc
                if (u.owner===1) { this.gold[1]+=LOOT_ON_CAPTURE; this.updateGoldUI(); }

                // Thủ Đô bị chiếm → phe đó bị tiêu diệt
                if (target.type==='capital') {
                    this.logEvent(`💥 ${wc.name} chiếm Thủ Đô của ${lc.name}! Còn ${target.units} quân.`, 'gold');
                    this.destroyFaction(old, u.owner);
                } else {
                    this.logEvent(`${wc.name} chiếm ${target.name} với ${target.units} quân còn lại`, u.owner===1?'cyan':'red');
                }

                // Tỉnh mới chiếm không còn xây dựng gì, chỉ là tỉnh thường
                if (target.type !== 'capital') target.type='basic';
            } else {
                target.units=Math.max(1,defenders-u.count);
                if (u.owner===1) this.logEvent(`⚔ Đạo quân ${u.count} không vượt qua được ${target.name}`, 'red');
            }
        }
        if (u.from) u.from.pendingOrders=Math.max(0,u.from.pendingOrders-1);
        this.updateNodeVisuals(target);
        if (this.selectedNode===target) this.refreshPanel();
    }

    destroyFaction(loserId, winnerId) {
        this.alive.delete(loserId);
        const wc=FACTIONS[winnerId], lc=FACTIONS[loserId];

        // Toàn bộ lãnh thổ của kẻ thua → kẻ thắng
        this.nodes.forEach(n => {
            if (n.owner!==loserId) return;
            n.owner=winnerId;
            n.type=(n.type==='capital'?'basic':n.type); // Thủ đô bị phá → tỉnh thường
            n.fill.setFillStyle(FACTIONS[winnerId].color);
            n.pulse.setFillStyle(FACTIONS[winnerId].color);
            n.pulse.setStrokeStyle(1.5, FACTIONS[winnerId].color, 0.4);
            if (n.capitalRing) n.capitalRing.setVisible(false);
            this.updateNodeVisuals(n);
        });
        const seizedGold=Math.floor((this.gold[loserId]||0)*FACTION_GOLD_LOOT_RATE);
        this.gold[winnerId]=(this.gold[winnerId]||0)+seizedGold;
        this.gold[loserId]=0;
        this.updateGoldUI();

        this.logEvent(`💀 ${lc.name} bị ${wc.name} tiêu diệt! ${this.alive.size-1} phe còn lại.`, 'gold');

        // Điều kiện thắng/thua
        const humanAlive = this.alive.has(1);
        if (!humanAlive) {
            document.getElementById('overlay-title').textContent='💀 THỦ ĐÔ THẤT THỦ';
            document.getElementById('overlay-sub').textContent=`${lc.name} đã bị tiêu diệt bởi ${wc.name}.`;
            document.getElementById('overlay-box').classList.remove('win');
            document.getElementById('overlay-screen').classList.add('show');
        } else if (this.alive.size===1 && this.alive.has(1)) {
            document.getElementById('overlay-title').textContent='🌍 THẾ GIỚI THỐNG NHẤT!';
            document.getElementById('overlay-sub').textContent='Alliance đã chinh phục toàn bộ thế giới!';
            document.getElementById('overlay-box').classList.add('win');
            document.getElementById('overlay-screen').classList.add('show');
        }
    }

    updateNodeVisuals(n) {
        n.unitsTxt.setText(Math.floor(n.units));
        n.popTxt.setText(`👤${Math.floor(n.pop)}`);
        n.nameTxt.setColor(n.owner>0 ? FACTIONS[n.owner].hex : '#667788');
        n.iconTxt.setText(TYPES[n.type]?.icon || '○');
        if (n.capitalRing) n.capitalRing.setVisible(n.type==='capital');
        this.updateMobileLabels();
    }

    // ─── Event Log ───────────────────────────────────────────
    logEvent(msg, type='cyan') {
        const log=document.getElementById('event-log');
        const el=document.createElement('div');
        el.className=`event-item${type==='red'?' red':type==='gold'?' gold':''}`;
        el.textContent=msg; log.prepend(el);
        while (log.children.length>6) log.removeChild(log.lastChild);
        setTimeout(()=>{ if(el.parentNode) el.remove(); }, 7000);
    }

    // ─── Update loop ─────────────────────────────────────────
    update(time, delta) {
        const speed=window.gameSpeed||0;

        // Vẽ đường kéo thả
        this.dragGfx.clear();
        if (this.dragState.on && this.dragState.startNode) {
            const from=this.dragState.startNode;
            const wp=this.cameras.main.getWorldPoint(this.dragState.pX, this.dragState.pY);
            this.dragGfx.setScrollFactor(1);
            this.dragGfx.lineStyle(4, FACTIONS[from.owner].color, 0.75);
            this.dragGfx.beginPath();
            this.dragGfx.moveTo(from.x,from.y); this.dragGfx.lineTo(wp.x,wp.y);
            this.dragGfx.strokePath();
            // Mũi tên nhỏ ở đầu
            const ang=Phaser.Math.Angle.Between(from.x,from.y,wp.x,wp.y);
            this.dragGfx.fillStyle(FACTIONS[from.owner].color, 0.9);
            this.dragGfx.fillTriangle(
                wp.x+Math.cos(ang)*12, wp.y+Math.sin(ang)*12,
                wp.x+Math.cos(ang+2.4)*8, wp.y+Math.sin(ang+2.4)*8,
                wp.x+Math.cos(ang-2.4)*8, wp.y+Math.sin(ang-2.4)*8
            );
        }

        if (speed<=0) return;
        const dt=delta*speed;

        // Timers
        this.ecoTimer+=dt; if(this.ecoTimer>=ECO_TICK_MS){this.ecoTimer-=ECO_TICK_MS; this.economyLoop();}
        this.aiTimer+=dt;  if(this.aiTimer>=AI_TICK_MS){this.aiTimer-=AI_TICK_MS; this.processAI();}

        // Node updates
        this.nodes.forEach(node=>{
            // Huấn luyện
            if (node.trainingQueue>0) {
                node.trainingTimer+=dt;
                while(node.trainingTimer>=TRAIN_INTERVAL && node.trainingQueue>0){
                    node.trainingTimer-=TRAIN_INTERVAL;
                    node.trainingQueue--; node.units++;
                    this.updateNodeVisuals(node);
                    if(this.selectedNode===node) this.refreshPanel();
                }
                if(node.trainingQueue===0) node.trainingMax=0;
            }
            // Dispatch
            if (node.dispatchQueue.length>0) {
                node.dispatchTimer+=dt;
                if(node.dispatchTimer>=ARMY_MUSTER_MS){
                    node.dispatchTimer=0;
                    const task=node.dispatchQueue.shift();
                    this.spawnArmy(node, task.target, task.count);
                }
            }
        });

        // Di chuyển lính
        for (let i=this.activeUnits.length-1; i>=0; i--) {
            const u=this.activeUnits[i];
            const dist=Phaser.Math.Distance.Between(u.x,u.y,u.target.x,u.target.y);
            if (dist<u.target.R) {
                this.handleArrival(u); u.marker.destroy(); this.activeUnits.splice(i,1);
            } else {
                const mv=(MOVE_SPEED*dt)/1000;
                const ang=Phaser.Math.Angle.Between(u.x,u.y,u.target.x,u.target.y);
                u.x+=Math.cos(ang)*mv; u.y+=Math.sin(ang)*mv;
                u.marker.setPosition(u.x,u.y);
            }
        }
    }
}

const game = new Phaser.Game({
    type:Phaser.AUTO, width:window.innerWidth, height:window.innerHeight,
    parent:'game-container', backgroundColor:'#020d1c',
    scene:MainScene,
    scale:{ mode:Phaser.Scale.RESIZE, autoCenter:Phaser.Scale.CENTER_BOTH },
    render:{ antialias:true, pixelArt:false }
});
