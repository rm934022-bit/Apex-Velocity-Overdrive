/**
 * Apex Velocity: Overdrive
 * Multi-Track Circuit Builder & Themed Environment Generator
 * Supports 5 unique Championship Circuits:
 * - Level 1: Monza Day GP (High-speed sprint with Curva Grande sweepers & Parabolica)
 * - Level 2: Desert Canyon Oasis (Technical sandstone canyon pass with rapid S-curves)
 * - Level 3: Coastal Riviera Drift (Azure seaside cliffside with ocean hairpins & coastal sweepers)
 * - Level 4: Tokyo Midnight Expressway (Elevated cyber viaducts with 90-degree street turns & neon arches)
 * - Level 5: Nürburgring Alpine Ridge (Master 2.5km endurance ring, Karussell bowl & alpine peaks)
 */

import * as THREE from 'three';

export class TrackBuilder {
  static TRACK_DEFINITIONS = {
    1: {
      id: 1,
      name: 'BUDDH GP EXPRESSWAY',
      theme: 'buddh',
      trackWidth: 22.0,
      points: [
        new THREE.Vector3(0, 0, 0),         // Start / Finish Line
        new THREE.Vector3(0, 0, 200),       // Main Straight Speed Trap
        new THREE.Vector3(45, 0, 310),      // Curva Grande Entry
        new THREE.Vector3(140, 0, 370),     // Sweeper Right
        new THREE.Vector3(260, 0, 320),     // Turn 2 Fast Bend
        new THREE.Vector3(300, 0, 200),     // Back Straight Entry
        new THREE.Vector3(300, 0, 50),      // High-Speed Straight
        new THREE.Vector3(250, 0, -70),     // Ascari Chicane Left
        new THREE.Vector3(190, 0, -140),    // Ascari Chicane Right Flick
        new THREE.Vector3(100, 0, -220),    // Hairpin Preparation
        new THREE.Vector3(10, 0, -250),     // Hairpin Apex
        new THREE.Vector3(-80, 0, -210),    // Parabolica Entry
        new THREE.Vector3(-120, 0, -110),   // Parabolica Apex
        new THREE.Vector3(-60, 0, -30)      // Final Corner onto Start Straight
      ]
    },
    2: {
      id: 2,
      name: 'THAR DESERT RALLY',
      theme: 'thar',
      trackWidth: 21.0,
      points: [
        new THREE.Vector3(0, 0, 0),         // Oasis Straight Start
        new THREE.Vector3(0, 0, 160),       // Canyon Pass Entrance
        new THREE.Vector3(-85, 0, 240),     // Sharp Canyon Left Bend
        new THREE.Vector3(-180, 0, 250),    // Canyon Wall Sweeper
        new THREE.Vector3(-260, 0, 170),    // S-Curve 1 Right Flick
        new THREE.Vector3(-220, 0, 70),     // S-Curve 2 Left Flick
        new THREE.Vector3(-290, 0, -30),    // Canyon Gorge Hairpin Entry
        new THREE.Vector3(-260, 0, -150),   // Canyon Hairpin Apex
        new THREE.Vector3(-170, 0, -220),   // Sand Dune Straight
        new THREE.Vector3(-30, 0, -260),    // Fast Sweeper Right
        new THREE.Vector3(110, 0, -210),    // Oasis Chicane Left
        new THREE.Vector3(190, 0, -120),    // Oasis Lake Bend
        new THREE.Vector3(160, 0, 10),      // Ridge Turn Left
        new THREE.Vector3(65, 0, -20)       // Return to Start Straight
      ]
    },
    3: {
      id: 3,
      name: 'GOA COASTAL EXPRESS',
      theme: 'goa',
      trackWidth: 21.5,
      points: [
        new THREE.Vector3(0, 0, 0),         // Boardwalk Straight
        new THREE.Vector3(0, 0, 190),       // Seaside Sprint
        new THREE.Vector3(95, 0, 270),      // Ocean Cliff Bend Right
        new THREE.Vector3(220, 0, 300),     // Riviera Sweeper
        new THREE.Vector3(310, 0, 220),     // Promontory Vista
        new THREE.Vector3(330, 0, 110),     // Switchback Hairpin Entry
        new THREE.Vector3(250, 0, 30),      // Switchback Hairpin Apex
        new THREE.Vector3(170, 0, 60),      // Switchback Exit
        new THREE.Vector3(120, 0, -50),     // Cliffside S-Curve Left
        new THREE.Vector3(180, 0, -150),    // Cliffside S-Curve Right
        new THREE.Vector3(120, 0, -250),    // Marina Hairpin
        new THREE.Vector3(10, 0, -270),     // Marina Waterfront
        new THREE.Vector3(-90, 0, -210),    // Harbor Bridge Approach
        new THREE.Vector3(-110, 0, -100),   // Harbor Bridge Sweeper
        new THREE.Vector3(-55, 0, -30)      // Boardwalk Alignment
      ]
    },
    4: {
      id: 4,
      name: 'MUMBAI SEA LINK BY NIGHT',
      theme: 'mumbai',
      trackWidth: 23.0,
      points: [
        new THREE.Vector3(0, 0, 0),         // Shuto Expressway Start
        new THREE.Vector3(0, 0, 250),       // Long Velocity Straight
        new THREE.Vector3(60, 0, 370),      // 90-Degree Right Intersection
        new THREE.Vector3(180, 0, 420),     // Elevated Viaduct
        new THREE.Vector3(330, 0, 390),     // Neon Arch High-Speed Run
        new THREE.Vector3(410, 0, 260),     // Cloverleaf Interchange
        new THREE.Vector3(390, 0, 100),     // Expressway Inner Loop
        new THREE.Vector3(290, 0, -30),     // Shibuya Corner Left
        new THREE.Vector3(160, 0, -70),     // Underpass Tunnel Entry
        new THREE.Vector3(70, 0, -190),     // Akihabara Chicane
        new THREE.Vector3(-50, 0, -240),    // Street Hairpin
        new THREE.Vector3(-145, 0, -170),   // Ginza Sweeper
        new THREE.Vector3(-120, 0, -50),    // Expressway On-Ramp
        new THREE.Vector3(-45, 0, -10)      // Straightaway Return
      ]
    },
    5: {
      id: 5,
      name: 'HIMALAYAN PASS',
      theme: 'ladakh',
      trackWidth: 20.5,
      points: [
        new THREE.Vector3(0, 0, 0),         // Grandstand Straight
        new THREE.Vector3(0, 0, 220),       // Tiergarten Speed Run
        new THREE.Vector3(-70, 0, 330),     // Hatzenbach S-Curve Entry
        new THREE.Vector3(-150, 0, 400),    // Hocheichen Right Bend
        new THREE.Vector3(-260, 0, 410),    // Flugplatz Crest
        new THREE.Vector3(-370, 0, 330),    // Schwedenkreuz Downhill Sweeper
        new THREE.Vector3(-420, 0, 190),    // Aremberg Right Corner
        new THREE.Vector3(-380, 0, 60),     // Fuchsröhre Compression
        new THREE.Vector3(-270, 0, -40),    // Adenauer Forst Chicane
        new THREE.Vector3(-170, 0, -120),   // Metzgesfeld Left
        new THREE.Vector3(-80, 0, -220),    // Kallenhard Downhill
        new THREE.Vector3(30, 0, -300),     // Wehrseifen Hairpin
        new THREE.Vector3(150, 0, -330),    // Breidscheid Bridge
        new THREE.Vector3(280, 0, -280),    // Ex-Mühle Uphill Climb
        new THREE.Vector3(370, 0, -170),    // Bergwerk Right Bend
        new THREE.Vector3(410, 0, -50),     // Kesselchen High-Speed Ascent
        new THREE.Vector3(350, 0, 80),      // Klostertal Curve
        new THREE.Vector3(250, 0, 170),     // Karussell Banked Bowl
        new THREE.Vector3(130, 0, 180),     // Hohe Acht Alpine Peak
        new THREE.Vector3(65, 0, 80),       // Döttinger Höhe Straight Entry
        new THREE.Vector3(20, 0, -20)       // Final Chicane
      ]
    }
  };

  constructor(scene) {
    this.scene = scene;
    this.currentLevelId = 1;
    this.trackWidth = 22.0;

    // Master container for all circuit meshes (rebuilt per level)
    this.circuitGroup = new THREE.Group();
    this.scene.add(this.circuitGroup);

    this.sampleCount = 260;
    this.sampledPoints = [];
    this.spline = null;

    this.materials = this._createMaterials();

    // Build starter track (Level 1)
    this.buildCircuit(1);
  }

  _createMaterials() {
    // 1. High-Resolution 1024x1024 Asphalt Road Texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#222834';
    ctx.fillRect(0, 0, 1024, 1024);

    // Stone Aggregate speckles
    for (let i = 0; i < 16000; i++) {
      const shade = Math.random();
      ctx.fillStyle = shade > 0.6 ? '#2c3545' : (shade > 0.3 ? '#1a202a' : '#384355');
      ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
    }

    // Rubber Racing Groove Lines
    ctx.fillStyle = 'rgba(10, 14, 22, 0.45)';
    ctx.fillRect(250, 0, 170, 1024);
    ctx.fillRect(604, 0, 170, 1024);

    // Center Dashed White Lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.setLineDash([48, 36]);
    ctx.beginPath();
    ctx.moveTo(512, 0);
    ctx.lineTo(512, 1024);
    ctx.stroke();

    // Solid Track Limit White Lines
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 12;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(48, 0);
    ctx.lineTo(48, 1024);
    ctx.moveTo(976, 0);
    ctx.lineTo(976, 1024);
    ctx.stroke();

    // Outer Yellow Rumble Border Lines
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(24, 0);
    ctx.lineTo(24, 1024);
    ctx.moveTo(1000, 0);
    ctx.lineTo(1000, 1024);
    ctx.stroke();

    const roadTexture = new THREE.CanvasTexture(canvas);
    roadTexture.wrapS = THREE.RepeatWrapping;
    roadTexture.wrapT = THREE.RepeatWrapping;
    roadTexture.repeat.set(1, 56);

    // 2. High-Detail Turf Grass Texture
    const grassCanvas = document.createElement('canvas');
    grassCanvas.width = 512;
    grassCanvas.height = 512;
    const gCtx = grassCanvas.getContext('2d');
    gCtx.fillStyle = '#2e7d32';
    gCtx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) {
      gCtx.fillStyle = Math.random() > 0.5 ? '#388e3c' : '#1b5e20';
      gCtx.fillRect(Math.random() * 512, Math.random() * 512, 2, 3);
    }
    const grassTexture = new THREE.CanvasTexture(grassCanvas);
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(120, 120);

    // 3. Desert Sand Texture
    const sandCanvas = document.createElement('canvas');
    sandCanvas.width = 512;
    sandCanvas.height = 512;
    const sCtx = sandCanvas.getContext('2d');
    sCtx.fillStyle = '#b45309';
    sCtx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) {
      sCtx.fillStyle = Math.random() > 0.5 ? '#d97706' : '#92400e';
      sCtx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }
    const sandTexture = new THREE.CanvasTexture(sandCanvas);
    sandTexture.wrapS = THREE.RepeatWrapping;
    sandTexture.wrapT = THREE.RepeatWrapping;
    sandTexture.repeat.set(120, 120);

    // 4. Indian National Flag (Tiranga) Canvas Texture
    const flagCanvas = document.createElement('canvas');
    flagCanvas.width = 320;
    flagCanvas.height = 200;
    const fCtx = flagCanvas.getContext('2d');
    // Saffron band (Top)
    fCtx.fillStyle = '#FF9933';
    fCtx.fillRect(0, 0, 320, 67);
    // White band (Middle)
    fCtx.fillStyle = '#FFFFFF';
    fCtx.fillRect(0, 67, 320, 66);
    // India Green band (Bottom)
    fCtx.fillStyle = '#138808';
    fCtx.fillRect(0, 133, 320, 67);
    // Navy Blue Ashoka Chakra in Center
    fCtx.strokeStyle = '#000080';
    fCtx.lineWidth = 2.5;
    fCtx.beginPath();
    fCtx.arc(160, 100, 23, 0, Math.PI * 2);
    fCtx.stroke();
    fCtx.fillStyle = '#000080';
    fCtx.beginPath();
    fCtx.arc(160, 100, 4.5, 0, Math.PI * 2);
    fCtx.fill();
    for (let i = 0; i < 24; i++) {
      const ang = (i / 24) * Math.PI * 2;
      fCtx.beginPath();
      fCtx.moveTo(160, 100);
      fCtx.lineTo(160 + Math.cos(ang) * 22, 100 + Math.sin(ang) * 22);
      fCtx.stroke();
    }
    const tirangaTexture = new THREE.CanvasTexture(flagCanvas);

    // 5. Authentic Indian Truck Tailgate Canvas Texture ("HORN OK PLEASE")
    const truckCanvas = document.createElement('canvas');
    truckCanvas.width = 512;
    truckCanvas.height = 360;
    const tCtx = truckCanvas.getContext('2d');
    tCtx.fillStyle = '#f59e0b'; // Radiant mustard yellow background
    tCtx.fillRect(0, 0, 512, 360);
    // Traditional ornamental border
    tCtx.strokeStyle = '#dc2626';
    tCtx.lineWidth = 14;
    tCtx.strokeRect(8, 8, 496, 344);
    tCtx.strokeStyle = '#1d4ed8';
    tCtx.lineWidth = 5;
    tCtx.strokeRect(22, 22, 468, 316);

    // "HORN OK PLEASE"
    tCtx.fillStyle = '#dc2626';
    tCtx.font = 'bold 54px Arial Black, sans-serif';
    tCtx.textAlign = 'center';
    tCtx.fillText('HORN', 105, 120);
    tCtx.fillStyle = '#0f172a';
    tCtx.font = '900 46px Arial Black, sans-serif';
    tCtx.fillText('OK', 256, 120);
    tCtx.fillStyle = '#dc2626';
    tCtx.font = 'bold 54px Arial Black, sans-serif';
    tCtx.fillText('PLEASE', 405, 120);

    // "★ BLOW HORN ★"
    tCtx.fillStyle = '#047857';
    tCtx.font = 'bold 38px Arial Black, sans-serif';
    tCtx.fillText('★ BLOW HORN ★', 256, 185);

    // "dekho magar pyaar se" (देखा मगर प्यार से)
    tCtx.fillStyle = '#b91c1c';
    tCtx.font = 'bold 30px sans-serif';
    tCtx.fillText('dekho magar pyaar se', 256, 245);

    // "ALL INDIA PERMIT"
    tCtx.fillStyle = '#1e3a8a';
    tCtx.font = '900 24px monospace';
    tCtx.fillText('ALL INDIA PERMIT // MADE BY RAJAMANI', 256, 305);

    const truckTailgateTexture = new THREE.CanvasTexture(truckCanvas);

    // 6. Arabian Sea Deep Ocean Canvas Texture
    const waterCanvas = document.createElement('canvas');
    waterCanvas.width = 512;
    waterCanvas.height = 512;
    const wCtx = waterCanvas.getContext('2d');
    wCtx.fillStyle = '#051829';
    wCtx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 4500; i++) {
      const alpha = 0.06 + Math.random() * 0.15;
      wCtx.fillStyle = `rgba(14, 165, 233, ${alpha})`;
      const wx = Math.random() * 512;
      const wy = Math.random() * 512;
      const wlen = 8 + Math.random() * 32;
      wCtx.fillRect(wx, wy, wlen, 2);
    }
    const waterTexture = new THREE.CanvasTexture(waterCanvas);
    waterTexture.wrapS = THREE.RepeatWrapping;
    waterTexture.wrapT = THREE.RepeatWrapping;
    waterTexture.repeat.set(80, 80);

    // Materials dictionary
    return {
      road: new THREE.MeshStandardMaterial({ map: roadTexture, roughness: 0.82, metalness: 0.12 }),
      grass: new THREE.MeshStandardMaterial({ map: grassTexture, roughness: 0.94, metalness: 0.04 }),
      sand: new THREE.MeshStandardMaterial({ map: sandTexture, roughness: 0.96, metalness: 0.02 }),
      kerbRed: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45, metalness: 0.2 }),
      kerbWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45, metalness: 0.2 }),
      kerbSaffron: new THREE.MeshStandardMaterial({ color: 0xff8800, roughness: 0.45, metalness: 0.2 }),
      kerbGreen: new THREE.MeshStandardMaterial({ color: 0x138808, roughness: 0.45, metalness: 0.2 }),
      guardrail: new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.25 }),
      archSteel: new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.88, roughness: 0.32 }),
      neonCyan: new THREE.MeshBasicMaterial({ color: 0x00f0ff }),
      neonOrange: new THREE.MeshBasicMaterial({ color: 0xff5500 }),
      startGantry: new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 }),
      mountain: new THREE.MeshStandardMaterial({ color: 0x3b5f38, roughness: 0.92, metalness: 0.05 }),
      canyonRock: new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.92, metalness: 0.06 }),
      distantPeak: new THREE.MeshStandardMaterial({ color: 0x5b7f99, roughness: 0.95, metalness: 0.02 }),
      // Indian Themed Materials
      tirangaFlag: new THREE.MeshStandardMaterial({ map: tirangaTexture, side: THREE.DoubleSide, roughness: 0.65 }),
      tirangaSaffron: new THREE.MeshStandardMaterial({ color: 0xff9933, roughness: 0.5, metalness: 0.1 }),
      tirangaWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45, metalness: 0.1 }),
      tirangaGreen: new THREE.MeshStandardMaterial({ color: 0x138808, roughness: 0.5, metalness: 0.1 }),
      sandstoneRed: new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.88, metalness: 0.08 }),
      sandstoneBuff: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.85, metalness: 0.06 }),
      autoYellow: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35, metalness: 0.25 }),
      autoGreen: new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.4, metalness: 0.2 }),
      autoBlack: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75, metalness: 0.2 }),
      chromeMetal: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.95 }),
      goldMetal: new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.25, metalness: 0.9 }),
      glassTranslucent: new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.65 }),
      truckTailgate: new THREE.MeshStandardMaterial({ map: truckTailgateTexture, roughness: 0.65, metalness: 0.15 }),
      truckBlue: new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.3 }),
      truckOrange: new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.45, metalness: 0.25 }),
      truckWood: new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.85, metalness: 0.05 }),
      highwayGreen: new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.5, metalness: 0.2 }),
      palmTrunk: new THREE.MeshStandardMaterial({ color: 0x785338, roughness: 0.9, metalness: 0.05 }),
      palmFrond: new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.75, metalness: 0.05, side: THREE.DoubleSide }),
      coconut: new THREE.MeshStandardMaterial({ color: 0x5b3a29, roughness: 0.9, metalness: 0.05 }),
      gulmoharBloom: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.85, metalness: 0.02 }),
      // Mumbai Sea Link Ocean & Viaduct Materials
      seaWater: new THREE.MeshStandardMaterial({ map: waterTexture, color: 0x07253d, roughness: 0.12, metalness: 0.76 }),
      concreteBridge: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.78, metalness: 0.15 }),
      bridgePylon: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.42, metalness: 0.4 }),
      cableStay: new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    };
  }

  buildCircuit(levelId = 1) {
    this.currentLevelId = levelId;
    const def = TrackBuilder.TRACK_DEFINITIONS[levelId] || TrackBuilder.TRACK_DEFINITIONS[1];
    this.trackWidth = def.trackWidth || 22.0;

    // Clear previous circuit meshes
    while (this.circuitGroup.children.length > 0) {
      const obj = this.circuitGroup.children[0];
      this.circuitGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
    }

    // Build Spline for this level
    this.curvePoints = def.points;
    this.spline = new THREE.CatmullRomCurve3(this.curvePoints, true, 'centripetal', 0.5);

    // Pre-sample spline points
    this.sampleCount = 260;
    this.sampledPoints = [];
    for (let i = 0; i < this.sampleCount; i++) {
      this.sampledPoints.push(this.spline.getPointAt(i / this.sampleCount));
    }

    // Build Visual Track Geometry into this.circuitGroup
    this._buildRoadRibbon();
    this._buildKerbsAndGuardrails(def.theme);
    if (def.theme === 'mumbai') {
      this._buildSeaLinkBridgeViaduct();
    }
    this._buildStartFinishGantry(def);
    this._buildSpeedArches(def.theme);
    this._buildGrandstands(def.theme);
    this._buildTracksideBillboards();
    this._buildIndiaGateArch(def.theme);
    this._buildTirangaFlags();
    this._buildAutoRickshaws(def.theme);
    this._buildIndianMilestones(def.theme);
    this._buildDecoratedTruck(def.theme);
    this._buildIndianHighwaySigns(def.theme);
    this._buildIndianCultureElements(def.theme);
    this._buildTerrainEnvironment(def.theme);
    this._buildThemedMountains(def.theme);

    return { spline: this.spline };
  }

  _buildRoadRibbon() {
    const segments = 280;
    const halfWidth = this.trackWidth / 2;

    const vertices = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) % 1.0;
      const point = this.spline.getPointAt(t);
      const tangent = this.spline.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const leftPt = point.clone().add(normal.clone().multiplyScalar(halfWidth));
      const rightPt = point.clone().add(normal.clone().multiplyScalar(-halfWidth));

      vertices.push(leftPt.x, leftPt.y + 0.05, leftPt.z);
      vertices.push(rightPt.x, rightPt.y + 0.05, rightPt.z);

      const v = (i / segments) * 56;
      uvs.push(0, v, 1, v);

      if (i < segments) {
        const row1 = i * 2;
        const row2 = (i + 1) * 2;
        indices.push(row1, row1 + 1, row2);
        indices.push(row1 + 1, row2 + 1, row2);
      }
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();

    const roadMesh = new THREE.Mesh(roadGeo, this.materials.road);
    roadMesh.receiveShadow = true;
    this.circuitGroup.add(roadMesh);
  }

  _buildKerbsAndGuardrails(theme = 'buddh') {
    const segments = 220;
    const halfWidth = this.trackWidth / 2;
    const isIndianTricolor = (theme === 'buddh' || theme === 'mumbai');

    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const point = this.spline.getPointAt(t);
      const tangent = this.spline.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      let kerbMat;
      if (isIndianTricolor) {
        const step = Math.floor(i / 2) % 3;
        kerbMat = step === 0 ? this.materials.kerbSaffron : (step === 1 ? this.materials.kerbWhite : this.materials.kerbGreen);
      } else {
        kerbMat = (Math.floor(i / 2) % 2 === 0) ? this.materials.kerbRed : this.materials.kerbWhite;
      }

      // 3D Beveled Kerb Rumble Strips
      const kerbGeo = new THREE.BoxGeometry(0.95, 0.16, 2.5);
      const kerbL = new THREE.Mesh(kerbGeo, kerbMat);
      kerbL.position.copy(point).add(normal.clone().multiplyScalar(halfWidth + 0.48));
      kerbL.position.y = 0.08;
      kerbL.rotation.y = Math.atan2(tangent.x, tangent.z);
      this.circuitGroup.add(kerbL);

      const kerbR = new THREE.Mesh(kerbGeo, kerbMat);
      kerbR.position.copy(point).add(normal.clone().multiplyScalar(-halfWidth - 0.48));
      kerbR.position.y = 0.08;
      kerbR.rotation.y = Math.atan2(tangent.x, tangent.z);
      this.circuitGroup.add(kerbR);

      // Galvanized Steel Guardrails with Support Posts
      if (i % 2 === 0) {
        const barrierGeo = new THREE.BoxGeometry(0.22, 0.95, 4.8);
        const railL = new THREE.Mesh(barrierGeo, this.materials.guardrail);
        railL.position.copy(point).add(normal.clone().multiplyScalar(halfWidth + 1.85));
        railL.position.y = 0.48;
        railL.rotation.y = Math.atan2(tangent.x, tangent.z);
        railL.castShadow = true;
        this.circuitGroup.add(railL);

        const railR = new THREE.Mesh(barrierGeo, this.materials.guardrail);
        railR.position.copy(point).add(normal.clone().multiplyScalar(-halfWidth - 1.85));
        railR.position.y = 0.48;
        railR.rotation.y = Math.atan2(tangent.x, tangent.z);
        railR.castShadow = true;
        this.circuitGroup.add(railR);

        // Guardrail Post
        const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.95, 8);
        const postL = new THREE.Mesh(postGeo, this.materials.guardrail);
        postL.position.copy(point).add(normal.clone().multiplyScalar(halfWidth + 1.85));
        postL.position.y = 0.48;
        this.circuitGroup.add(postL);

        const postR = new THREE.Mesh(postGeo, this.materials.guardrail);
        postR.position.copy(point).add(normal.clone().multiplyScalar(-halfWidth - 1.85));
        postR.position.y = 0.48;
        this.circuitGroup.add(postR);
      }
    }
  }

  _createTirangaFlagMesh(poleHeight = 8.5, flagWidth = 3.2, flagHeight = 2.0) {
    const group = new THREE.Group();

    // Metallic silver flagpole
    const poleGeo = new THREE.CylinderGeometry(0.07, 0.09, poleHeight, 10);
    const pole = new THREE.Mesh(poleGeo, this.materials.chromeMetal);
    pole.position.y = poleHeight / 2;
    pole.castShadow = true;
    group.add(pole);

    // Golden sphere finial on top
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), this.materials.goldMetal);
    finial.position.y = poleHeight;
    group.add(finial);

    // Tiranga flag cloth with dynamic flutter ripples
    const flagGeo = new THREE.PlaneGeometry(flagWidth, flagHeight, 8, 2);
    const posAttr = flagGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const wave = Math.sin((vx / flagWidth) * Math.PI * 2.5) * 0.18;
      posAttr.setZ(i, wave);
    }
    flagGeo.computeVertexNormals();

    const flagMesh = new THREE.Mesh(flagGeo, this.materials.tirangaFlag);
    flagMesh.position.set(flagWidth / 2, poleHeight - flagHeight / 2 - 0.25, 0);
    group.add(flagMesh);

    return group;
  }

  _buildStartFinishGantry(def = {}) {
    const point = this.spline.getPointAt(0);
    const tangent = this.spline.getTangentAt(0);
    const angle = Math.atan2(tangent.x, tangent.z);

    const gantry = new THREE.Group();
    gantry.position.copy(point);
    gantry.rotation.y = angle;

    const postH = 8.8;
    const postSpan = this.trackWidth + 6.0;

    // Dual Lattice Pillar Truss
    const pillarGeo = new THREE.BoxGeometry(1.2, postH, 1.2);
    const pillarL = new THREE.Mesh(pillarGeo, this.materials.startGantry);
    pillarL.position.set(-postSpan / 2, postH / 2, 0);
    pillarL.castShadow = true;
    gantry.add(pillarL);

    const pillarR = new THREE.Mesh(pillarGeo, this.materials.startGantry);
    pillarR.position.set(postSpan / 2, postH / 2, 0);
    pillarR.castShadow = true;
    gantry.add(pillarR);

    // Two Tiranga flags on top of gantry pillars
    const flagL = this._createTirangaFlagMesh(5.5, 2.4, 1.5);
    flagL.position.set(-postSpan / 2, postH, 0);
    gantry.add(flagL);

    const flagR = this._createTirangaFlagMesh(5.5, 2.4, 1.5);
    flagR.position.set(postSpan / 2, postH, 0);
    gantry.add(flagR);

    // Overhead Header Truss Span
    const beamGeo = new THREE.BoxGeometry(postSpan + 2.0, 1.8, 2.2);
    const beam = new THREE.Mesh(beamGeo, this.materials.startGantry);
    beam.position.set(0, postH, 0);
    beam.castShadow = true;
    gantry.add(beam);

    // Digital Checkered Timing Display Board with Indian Name
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1024, 256);

    // Checkered Banner
    const squareSize = 32;
    for (let x = 0; x < 1024; x += squareSize) {
      for (let y = 0; y < 64; y += squareSize) {
        if ((x / squareSize + y / squareSize) % 2 === 0) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, y, squareSize, squareSize);
        }
      }
    }

    const title = def.name || 'BUDDH GP EXPRESSWAY';
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 64px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, 512, 142);

    ctx.fillStyle = '#facc15';
    ctx.font = '900 40px Montserrat, sans-serif';
    ctx.fillText('★ MADE BY RAJAMANI ★ BHARAT GP ★', 512, 206);

    const signTexture = new THREE.CanvasTexture(canvas);
    const signGeo = new THREE.PlaneGeometry(postSpan - 2.0, 1.5);
    const signMat = new THREE.MeshBasicMaterial({ map: signTexture });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, postH - 0.1, -1.15);
    sign.rotation.y = Math.PI;
    gantry.add(sign);

    this.circuitGroup.add(gantry);
  }

  _buildSpeedArches(theme = 'buddh') {
    const archPositions = [0.18, 0.38, 0.58, 0.78];
    const archSpan = this.trackWidth + 5.0;
    const archHeight = 8.5;

    archPositions.forEach((t) => {
      const pt = this.spline.getPointAt(t);
      const tangent = this.spline.getTangentAt(t).normalize();
      const angle = Math.atan2(tangent.x, tangent.z);

      const archGroup = new THREE.Group();
      archGroup.position.copy(pt);
      archGroup.rotation.y = angle;

      const postGeo = new THREE.BoxGeometry(1.0, archHeight, 1.2);
      const pL = new THREE.Mesh(postGeo, this.materials.archSteel);
      pL.position.set(-archSpan / 2, archHeight / 2, 0);
      archGroup.add(pL);

      const pR = new THREE.Mesh(postGeo, this.materials.archSteel);
      pR.position.set(archSpan / 2, archHeight / 2, 0);
      archGroup.add(pR);

      const topGeo = new THREE.BoxGeometry(archSpan, 1.0, 1.2);
      const pTop = new THREE.Mesh(topGeo, this.materials.archSteel);
      pTop.position.set(0, archHeight, 0);
      archGroup.add(pTop);

      const neonMat = (theme === 'mumbai') ? this.materials.neonCyan : (t > 0.5 ? this.materials.neonOrange : this.materials.neonCyan);
      const neonH = new THREE.Mesh(new THREE.BoxGeometry(archSpan * 0.95, 0.16, 0.2), neonMat);
      neonH.position.set(0, archHeight - 0.55, 0);
      archGroup.add(neonH);

      this.circuitGroup.add(archGroup);
    });
  }

  _buildGrandstands(theme = 'buddh') {
    const standsGroup = new THREE.Group();
    const gantryPt = this.spline.getPointAt(0.04);
    const tangent = this.spline.getTangentAt(0.04);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const angle = Math.atan2(tangent.x, tangent.z);

    // Place safely 18m outside track edge (grandstand width is 14m, half-width is 7m)
    // Closest edge is (trackWidth/2 + 18 - 7) = trackWidth/2 + 11m, completely clear of the track!
    const offsetDist = this.trackWidth / 2 + 18.0;
    standsGroup.position.copy(gantryPt).add(normal.clone().multiplyScalar(offsetDist));
    standsGroup.rotation.y = angle;

    // Box Geometry: Width=14 (along local X, away from track), Height=7.5, Depth=70 (along local Z, parallel to straight)
    const baseGeo = new THREE.BoxGeometry(14, 7.5, 70);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 3.75;
    standsGroup.add(base);

    // Cantilevered Roof: Width=16 (along X), Height=0.45, Depth=72 (along Z)
    const roofGeo = new THREE.BoxGeometry(16, 0.45, 72);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.6 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 9.8, 0);
    standsGroup.add(roof);

    // Front Grandstand Welcome Banner (faces the track at local +X = 7.05)
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 1024;
    bannerCanvas.height = 128;
    const bCtx = bannerCanvas.getContext('2d');
    bCtx.fillStyle = '#0f172a';
    bCtx.fillRect(0, 0, 1024, 128);

    // Tricolor stripe
    bCtx.fillStyle = '#FF9933';
    bCtx.fillRect(0, 0, 1024, 12);
    bCtx.fillStyle = '#FFFFFF';
    bCtx.fillRect(0, 12, 1024, 12);
    bCtx.fillStyle = '#138808';
    bCtx.fillRect(0, 24, 1024, 12);

    bCtx.fillStyle = '#facc15';
    bCtx.font = '900 48px Montserrat, sans-serif';
    bCtx.textAlign = 'center';
    bCtx.fillText('★ MADE BY RAJAMANI ★ GRAND PRIX OF INDIA ★', 512, 86);

    const bannerTex = new THREE.CanvasTexture(bannerCanvas);
    const bannerMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(68, 2.8),
      new THREE.MeshBasicMaterial({ map: bannerTex, side: THREE.DoubleSide })
    );
    bannerMesh.position.set(7.05, 8.2, 0);
    bannerMesh.rotation.y = Math.PI / 2;
    standsGroup.add(bannerMesh);

    // 5 Tiranga flags waving proud along the grandstand roof (spaced along Z)
    for (let f = 0; f < 5; f++) {
      const flagMesh = this._createTirangaFlagMesh(6.0, 2.6, 1.6);
      flagMesh.position.set(0, 9.8, (f - 2) * 14.0);
      standsGroup.add(flagMesh);
    }

    this.circuitGroup.add(standsGroup);
  }

  _buildTracksideBillboards() {
    const sponsors = [
      { name: 'MRF TYRES', subtitle: 'RACING TYRES // MADE BY RAJAMANI', color: '#dc2626', t: 0.12, side: 1 },
      { name: 'TATA MOTORS', subtitle: 'POWER & SPEED // MADE BY RAJAMANI', color: '#2563eb', t: 0.28, side: -1 },
      { name: 'MAHINDRA RACING', subtitle: 'FORMULA-E // MADE BY RAJAMANI', color: '#e11d48', t: 0.46, side: 1 },
      { name: 'INDIAN OIL SERVO', subtitle: '100 OCTANE // MADE BY RAJAMANI', color: '#ea580c', t: 0.68, side: -1 },
      { name: 'JK TYRE SPEEDWAY', subtitle: 'CHAMPIONSHIP // MADE BY RAJAMANI', color: '#facc15', t: 0.84, side: 1 }
    ];

    sponsors.forEach(sp => {
      const pt = this.spline.getPointAt(sp.t);
      const tangent = this.spline.getTangentAt(sp.t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const angle = Math.atan2(tangent.x, tangent.z);

      const group = new THREE.Group();
      // Place safely outside the road
      const offsetDist = (this.trackWidth / 2 + 9.5) * sp.side;
      group.position.copy(pt).add(normal.clone().multiplyScalar(offsetDist));
      group.rotation.y = angle;

      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(0, 0, 1024, 256);

      // Top Tiranga ribbon
      ctx.fillStyle = '#FF9933';
      ctx.fillRect(0, 0, 1024, 10);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 10, 1024, 10);
      ctx.fillStyle = '#138808';
      ctx.fillRect(0, 20, 1024, 10);

      // Sponsor neon border
      ctx.strokeStyle = sp.color;
      ctx.lineWidth = 6;
      ctx.strokeRect(12, 38, 1000, 206);

      // Gold Star accent header
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 26px Montserrat, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ OFFICIAL CHAMPIONSHIP SPONSOR ★', 512, 74);

      // Giant bold "MADE BY RAJAMANI"
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 64px Montserrat, Arial Black, sans-serif';
      ctx.fillText('MADE BY RAJAMANI', 512, 142);

      // Sponsor Branding line
      ctx.fillStyle = sp.color;
      ctx.font = 'bold 36px Montserrat, sans-serif';
      ctx.fillText(sp.subtitle || sp.name, 512, 200);

      // Bottom subtle ticker
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('BHARAT VELOCITY // APEX MOTORSPORT INDIA', 512, 230);

      const texture = new THREE.CanvasTexture(canvas);
      const board = new THREE.Mesh(
        new THREE.PlaneGeometry(14, 4.0),
        new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide, roughness: 0.3 })
      );
      board.position.set(0, 5.0, 0);

      // Orient billboard parallel to track along Z, angled slightly toward oncoming cars (coming from -Z)
      board.rotation.y = (sp.side === 1) ? (Math.PI / 2 - 0.25) : (-Math.PI / 2 + 0.25);
      group.add(board);

      // Support posts aligned along Z at edges of board
      const postGeo = new THREE.CylinderGeometry(0.18, 0.18, 5.0, 8);
      const postL = new THREE.Mesh(postGeo, this.materials.guardrail);
      postL.position.set(0, 2.5, -5.2);
      group.add(postL);

      const postR = new THREE.Mesh(postGeo, this.materials.guardrail);
      postR.position.set(0, 2.5, 5.2);
      group.add(postR);

      this.circuitGroup.add(group);
    });
  }

  _buildIndiaGateArch(theme = 'buddh') {
    // Grand Indian Torana / India Gate Style Monumental Sandstone Gateway Arch
    const pt = this.spline.getPointAt(0.08);
    const tangent = this.spline.getTangentAt(0.08).normalize();
    const angle = Math.atan2(tangent.x, tangent.z);

    const archGroup = new THREE.Group();
    archGroup.position.copy(pt);
    archGroup.rotation.y = angle;

    const span = this.trackWidth + 8.0;
    const archH = 13.0;

    // Dual monumental sandstone piers
    const pWidth = 3.6;
    const pDepth = 4.2;
    const pierGeo = new THREE.BoxGeometry(pWidth, archH, pDepth);

    const pierL = new THREE.Mesh(pierGeo, this.materials.sandstoneRed);
    pierL.position.set(-span / 2, archH / 2, 0);
    pierL.castShadow = true;
    archGroup.add(pierL);

    const pierR = new THREE.Mesh(pierGeo, this.materials.sandstoneRed);
    pierR.position.set(span / 2, archH / 2, 0);
    pierR.castShadow = true;
    archGroup.add(pierR);

    // Decorative Plinth & Cornice Moldings
    const moldingGeo = new THREE.BoxGeometry(pWidth + 0.6, 0.8, pDepth + 0.6);
    const moldL1 = new THREE.Mesh(moldingGeo, this.materials.sandstoneBuff);
    moldL1.position.set(-span / 2, 0.4, 0);
    archGroup.add(moldL1);

    const moldR1 = new THREE.Mesh(moldingGeo, this.materials.sandstoneBuff);
    moldR1.position.set(span / 2, 0.4, 0);
    archGroup.add(moldR1);

    const moldL2 = new THREE.Mesh(moldingGeo, this.materials.sandstoneBuff);
    moldL2.position.set(-span / 2, archH * 0.72, 0);
    archGroup.add(moldL2);

    const moldR2 = new THREE.Mesh(moldingGeo, this.materials.sandstoneBuff);
    moldR2.position.set(span / 2, archH * 0.72, 0);
    archGroup.add(moldR2);

    // Overhead Sandstone Lintel Beam
    const lintelGeo = new THREE.BoxGeometry(span + pWidth + 1.0, 2.8, pDepth + 0.4);
    const lintel = new THREE.Mesh(lintelGeo, this.materials.sandstoneRed);
    lintel.position.set(0, archH + 1.4, 0);
    lintel.castShadow = true;
    archGroup.add(lintel);

    // Upper Attic Crown
    const atticGeo = new THREE.BoxGeometry(span * 0.82, 1.8, pDepth);
    const attic = new THREE.Mesh(atticGeo, this.materials.sandstoneBuff);
    attic.position.set(0, archH + 3.7, 0);
    archGroup.add(attic);

    // Stepped Chhatri Finials atop each pier
    [-span / 2, span / 2].forEach(posX => {
      const finialGroup = new THREE.Group();
      finialGroup.position.set(posX, archH + 2.8, 0);

      for (let c = 0; c < 4; c++) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 6), this.materials.sandstoneBuff);
        const ca = (c / 4) * Math.PI * 2;
        col.position.set(Math.cos(ca) * 1.0, 0.7, Math.sin(ca) * 1.0);
        finialGroup.add(col);
      }
      const dome = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), this.materials.sandstoneRed);
      dome.position.y = 1.4;
      finialGroup.add(dome);

      const kalash = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.9, 8), this.materials.goldMetal);
      kalash.position.y = 2.7;
      finialGroup.add(kalash);

      archGroup.add(finialGroup);
    });

    // Central Ashoka Chakra Carved Medallion
    const chakraGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.25, 24);
    const chakraM = new THREE.Mesh(chakraGeo, this.materials.goldMetal);
    chakraM.rotation.x = Math.PI / 2;
    chakraM.position.set(0, archH + 3.7, pDepth / 2 + 0.15);
    archGroup.add(chakraM);

    // Front & Back Inscription Canvas Banners
    const gateCanvas = document.createElement('canvas');
    gateCanvas.width = 1024;
    gateCanvas.height = 200;
    const gCtx = gateCanvas.getContext('2d');
    gCtx.fillStyle = '#b45309';
    gCtx.fillRect(0, 0, 1024, 200);

    // Tricolor border ribbon
    gCtx.fillStyle = '#FF9933';
    gCtx.fillRect(0, 0, 1024, 18);
    gCtx.fillStyle = '#FFFFFF';
    gCtx.fillRect(0, 18, 1024, 18);
    gCtx.fillStyle = '#138808';
    gCtx.fillRect(0, 36, 1024, 18);

    gCtx.fillStyle = '#fef08a';
    gCtx.font = 'bold 54px serif';
    gCtx.textAlign = 'center';
    gCtx.fillText('★ स्वागतम् ★ MADE BY RAJAMANI ★', 512, 118);
    gCtx.font = 'bold 34px Montserrat, sans-serif';
    gCtx.fillStyle = '#ffffff';
    gCtx.fillText('BHARAT VELOCITY // GRAND PRIX OF INDIA', 512, 172);

    const gateTex = new THREE.CanvasTexture(gateCanvas);
    const gateMat = new THREE.MeshBasicMaterial({ map: gateTex });
    const bannerGeo = new THREE.PlaneGeometry(span * 0.75, 2.0);

    const bannerF = new THREE.Mesh(bannerGeo, gateMat);
    bannerF.position.set(0, archH + 1.4, -pDepth / 2 - 0.25);
    bannerF.rotation.y = Math.PI;
    archGroup.add(bannerF);

    const bannerB = new THREE.Mesh(bannerGeo, gateMat);
    bannerB.position.set(0, archH + 1.4, pDepth / 2 + 0.25);
    archGroup.add(bannerB);

    // 2 Tiranga flags on top of the arch
    const flagL = this._createTirangaFlagMesh(6.0, 2.8, 1.8);
    flagL.position.set(-span * 0.35, archH + 4.6, 0);
    archGroup.add(flagL);

    const flagR = this._createTirangaFlagMesh(6.0, 2.8, 1.8);
    flagR.position.set(span * 0.35, archH + 4.6, 0);
    archGroup.add(flagR);

    this.circuitGroup.add(archGroup);
  }

  _buildTirangaFlags() {
    // Flagpoles along the starting straight
    const positions = [0.01, 0.03, 0.97, 0.99];
    const halfWidth = this.trackWidth / 2;
    positions.forEach((t, idx) => {
      const pt = this.spline.getPointAt(t);
      const tangent = this.spline.getTangentAt(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const angle = Math.atan2(tangent.x, tangent.z);

      const side = idx % 2 === 0 ? 1 : -1;
      const flagMesh = this._createTirangaFlagMesh(7.5, 2.8, 1.8);
      flagMesh.position.copy(pt).add(normal.clone().multiplyScalar((halfWidth + 4.2) * side));
      flagMesh.rotation.y = angle;
      this.circuitGroup.add(flagMesh);
    });
  }

  _createAutoRickshaw(isKaaliPeeli = false, plateText = 'DL 1R 8829') {
    const rickshaw = new THREE.Group();

    const bodyMat = isKaaliPeeli ? this.materials.autoYellow : this.materials.autoGreen;
    const roofMat = isKaaliPeeli ? this.materials.autoBlack : this.materials.autoYellow;

    // 1. Lower Chassis Fairing
    const chassisGeo = new THREE.BoxGeometry(1.35, 0.45, 2.3);
    const chassis = new THREE.Mesh(chassisGeo, bodyMat);
    chassis.position.y = 0.42;
    chassis.castShadow = true;
    rickshaw.add(chassis);

    // Front Nose / Mudguard
    const noseGeo = new THREE.BoxGeometry(0.85, 0.48, 0.7);
    const nose = new THREE.Mesh(noseGeo, bodyMat);
    nose.position.set(0, 0.45, 1.3);
    nose.castShadow = true;
    rickshaw.add(nose);

    // 2. Yellow / Black Canopy Roof
    const roofGeo = new THREE.BoxGeometry(1.38, 0.14, 2.35);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 1.74;
    roof.castShadow = true;
    rickshaw.add(roof);

    // Canopy Soft Trim / Eaves
    const trimGeo = new THREE.BoxGeometry(1.42, 0.08, 2.4);
    const trim = new THREE.Mesh(trimGeo, this.materials.autoBlack);
    trim.position.y = 1.68;
    rickshaw.add(trim);

    // 4 Canopy Support Pillars
    const pillarGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.25, 6);
    [
      [-0.64, 1.1, -1.05],
      [0.64, 1.1, -1.05],
      [-0.64, 1.1, 0.95],
      [0.64, 1.1, 0.95]
    ].forEach(([px, py, pz]) => {
      const p = new THREE.Mesh(pillarGeo, this.materials.chromeMetal);
      p.position.set(px, py, pz);
      rickshaw.add(p);
    });

    // 3. Front Windshield Glass
    const windGeo = new THREE.BoxGeometry(1.15, 0.7, 0.04);
    const wind = new THREE.Mesh(windGeo, this.materials.glassTranslucent);
    wind.position.set(0, 1.25, 0.95);
    wind.rotation.x = -0.15;
    rickshaw.add(wind);

    // Windshield Wiper
    const wiper = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.45, 0.03), this.materials.autoBlack);
    wiper.position.set(0.12, 1.26, 0.98);
    wiper.rotation.z = 0.4;
    rickshaw.add(wiper);

    // 4. Chrome Round Headlamp
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 12), this.materials.chromeMetal);
    lamp.rotation.x = Math.PI / 2;
    lamp.position.set(0, 0.58, 1.68);
    rickshaw.add(lamp);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfff3a0 }));
    bulb.position.set(0, 0.58, 1.74);
    rickshaw.add(bulb);

    // 5. Interior: Seats & Handlebar
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const dSeat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.45), seatMat);
    dSeat.position.set(0, 0.65, 0.4);
    rickshaw.add(dSeat);

    const pSeat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 0.65), seatMat);
    pSeat.position.set(0, 0.68, -0.65);
    rickshaw.add(pSeat);

    const pBack = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.15), seatMat);
    pBack.position.set(0, 1.0, -1.05);
    rickshaw.add(pBack);

    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8), this.materials.chromeMetal);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 0.88, 0.95);
    rickshaw.add(bar);

    const meter = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: 0xd97706 }));
    meter.position.set(0.22, 0.82, 0.95);
    rickshaw.add(meter);

    // 6. Wheels (1 Front Center, 2 Rear)
    const wheelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.16, 14);
    wheelGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });

    const fWheel = new THREE.Mesh(wheelGeo, tireMat);
    fWheel.position.set(0, 0.25, 1.3);
    fWheel.castShadow = true;
    rickshaw.add(fWheel);

    const rlWheel = new THREE.Mesh(wheelGeo, tireMat);
    rlWheel.position.set(-0.64, 0.25, -0.65);
    rlWheel.castShadow = true;
    rickshaw.add(rlWheel);

    const rrWheel = new THREE.Mesh(wheelGeo, tireMat);
    rrWheel.position.set(0.64, 0.25, -0.65);
    rrWheel.castShadow = true;
    rickshaw.add(rrWheel);

    // 7. Indian Number Plate (Yellow Taxi Plate)
    const plateCanvas = document.createElement('canvas');
    plateCanvas.width = 256;
    plateCanvas.height = 96;
    const pCtx = plateCanvas.getContext('2d');
    pCtx.fillStyle = '#facc15';
    pCtx.fillRect(0, 0, 256, 96);
    pCtx.strokeStyle = '#000000';
    pCtx.lineWidth = 6;
    pCtx.strokeRect(4, 4, 248, 88);
    pCtx.fillStyle = '#000000';
    pCtx.font = 'bold 36px monospace';
    pCtx.textAlign = 'center';
    pCtx.fillText(plateText, 128, 60);

    const plateTex = new THREE.CanvasTexture(plateCanvas);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.2), new THREE.MeshBasicMaterial({ map: plateTex }));
    plate.position.set(0, 0.42, -1.16);
    plate.rotation.y = Math.PI;
    rickshaw.add(plate);

    const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    [-0.52, 0.52].forEach(tx => {
      const tLight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.05), tailMat);
      tLight.position.set(tx, 0.52, -1.16);
      rickshaw.add(tLight);
    });

    return rickshaw;
  }

  _buildAutoRickshaws(theme = 'buddh') {
    const isMumbai = (theme === 'mumbai');
    const locations = [
      { t: 0.05, side: -1, offset: 16.0, plate: isMumbai ? 'MH 02 BK 4020' : 'DL 1R 8829' },
      { t: 0.32, side: 1, offset: 18.5, plate: isMumbai ? 'MH 01 AB 9911' : (theme === 'goa' ? 'GA 08 T 1947' : 'RJ 19 TA 3311') },
      { t: 0.54, side: -1, offset: 17.0, plate: isMumbai ? 'MH 04 CD 3210' : 'UP 16 AZ 5544' },
      { t: 0.82, side: 1, offset: 19.0, plate: isMumbai ? 'MH 02 XY 7788' : 'DL 1R 2026' }
    ];

    locations.forEach(loc => {
      const pt = this.spline.getPointAt(loc.t);
      const tangent = this.spline.getTangentAt(loc.t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const angle = Math.atan2(tangent.x, tangent.z);

      const rickshaw = this._createAutoRickshaw(isMumbai, loc.plate);
      rickshaw.position.copy(pt).add(normal.clone().multiplyScalar((this.trackWidth / 2 + loc.offset) * loc.side));
      rickshaw.position.y = 0;
      rickshaw.rotation.y = angle + (loc.side === 1 ? -Math.PI / 2 : Math.PI / 2) + (Math.random() - 0.5) * 0.4;
      this.circuitGroup.add(rickshaw);
    });
  }

  _createMilestoneTexture(highway, dest, dist, color = '#facc15') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');

    // Domed Yellow/Green Top Cap
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(128, 110, 110, Math.PI, 0, false);
    ctx.lineTo(238, 110);
    ctx.lineTo(18, 110);
    ctx.fill();

    // Highway text in cap
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px Arial Black, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(highway, 128, 92);

    // White Lower Body
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(18, 110, 220, 240);

    // Dividing black border line
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(18, 110);
    ctx.lineTo(238, 110);
    ctx.stroke();

    // Destination
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 30px Arial, sans-serif';
    ctx.fillText(dest, 128, 175);

    // Distance in km or ft
    ctx.font = '900 52px Arial Black, sans-serif';
    ctx.fillText(dist, 128, 255);

    return new THREE.CanvasTexture(canvas);
  }

  _buildIndianMilestones(theme = 'buddh') {
    const milestoneConfig = {
      buddh: { highway: 'NH 44', dest: 'DELHI', distBase: 35, color: '#facc15' },
      thar: { highway: 'NH 11', dest: 'JAISALMER', distBase: 18, color: '#facc15' },
      goa: { highway: 'NH 66', dest: 'PANAJI', distBase: 12, color: '#16a34a' },
      mumbai: { highway: 'NH 48', dest: 'MUMBAI', distBase: 14, color: '#facc15' },
      ladakh: { highway: 'BRO', dest: 'KHARDUNG LA', distBase: 18380, isFeet: true, color: '#facc15' }
    }[theme] || { highway: 'NH 44', dest: 'INDIA', distBase: 25, color: '#facc15' };

    const halfWidth = this.trackWidth / 2;
    const count = 18;

    for (let i = 0; i < count; i++) {
      const t = (i / count);
      const pt = this.spline.getPointAt(t);
      const tangent = this.spline.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const angle = Math.atan2(tangent.x, tangent.z);

      const side = (i % 2 === 0) ? 1 : -1;
      const offsetDist = halfWidth + 2.8;
      const stonePos = pt.clone().add(normal.clone().multiplyScalar(offsetDist * side));

      const stoneGroup = new THREE.Group();
      stoneGroup.position.copy(stonePos);
      stoneGroup.position.y = 0;
      stoneGroup.rotation.y = angle + (side === 1 ? 0 : Math.PI);

      const stoneBodyGeo = new THREE.BoxGeometry(0.65, 0.7, 0.35);
      const stoneBody = new THREE.Mesh(stoneBodyGeo, this.materials.tirangaWhite);
      stoneBody.position.y = 0.35;
      stoneBody.castShadow = true;
      stoneGroup.add(stoneBody);

      const capGeo = new THREE.CylinderGeometry(0.325, 0.325, 0.35, 16, 1, false, 0, Math.PI);
      capGeo.rotateZ(Math.PI / 2);
      capGeo.rotateY(Math.PI / 2);
      const capMat = milestoneConfig.color === '#16a34a' ? this.materials.tirangaGreen : this.materials.autoYellow;
      const stoneCap = new THREE.Mesh(capGeo, capMat);
      stoneCap.position.y = 0.7;
      stoneGroup.add(stoneCap);

      const dist = milestoneConfig.isFeet ? `${milestoneConfig.distBase} FT` : `${Math.max(1, milestoneConfig.distBase - i * 2)} KM`;
      const tex = this._createMilestoneTexture(milestoneConfig.highway, milestoneConfig.dest, dist, milestoneConfig.color);
      const faceGeo = new THREE.PlaneGeometry(0.62, 0.88);
      const faceMesh = new THREE.Mesh(faceGeo, new THREE.MeshBasicMaterial({ map: tex }));
      faceMesh.position.set(0, 0.48, 0.18);
      stoneGroup.add(faceMesh);

      this.circuitGroup.add(stoneGroup);
    }
  }

  _createIndianTruck(truckNumber = 1) {
    const truck = new THREE.Group();
    const isOrange = truckNumber % 2 === 0;
    const cabMat = isOrange ? this.materials.truckOrange : this.materials.truckBlue;

    // 1. Cab Body
    const cabGeo = new THREE.BoxGeometry(2.4, 2.1, 2.3);
    const cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(0, 1.7, 2.2);
    cab.castShadow = true;
    truck.add(cab);

    // Front Bonnet Nose
    const noseGeo = new THREE.BoxGeometry(2.2, 1.2, 1.4);
    const nose = new THREE.Mesh(noseGeo, cabMat);
    nose.position.set(0, 1.25, 3.9);
    nose.castShadow = true;
    truck.add(nose);

    // Chrome Radiator Grille
    const grillGeo = new THREE.BoxGeometry(1.6, 0.9, 0.1);
    const grill = new THREE.Mesh(grillGeo, this.materials.chromeMetal);
    grill.position.set(0, 1.25, 4.62);
    truck.add(grill);

    // Dual Round Chrome Headlamps
    [-0.85, 0.85].forEach(lx => {
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 12), this.materials.chromeMetal);
      lamp.rotation.x = Math.PI / 2;
      lamp.position.set(lx, 1.05, 4.62);
      truck.add(lamp);

      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfff59d }));
      bulb.position.set(lx, 1.05, 4.68);
      truck.add(bulb);
    });

    // Windshield Sun-Visor
    const visorGeo = new THREE.BoxGeometry(2.45, 0.35, 0.4);
    const visor = new THREE.Mesh(visorGeo, this.materials.sandstoneBuff);
    visor.position.set(0, 2.75, 3.2);
    truck.add(visor);

    // Cab Windshield Glass
    const windGeo = new THREE.BoxGeometry(2.1, 0.85, 0.05);
    const wind = new THREE.Mesh(windGeo, this.materials.glassTranslucent);
    wind.position.set(0, 2.1, 3.25);
    wind.rotation.x = -0.1;
    truck.add(wind);

    // Vertical Chrome Exhaust Chimney
    const exGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8);
    const exPipe = new THREE.Mesh(exGeo, this.materials.chromeMetal);
    exPipe.position.set(1.15, 2.4, 1.0);
    truck.add(exPipe);

    // 2. High-Walled Wooden Cargo Bed
    const bedGeo = new THREE.BoxGeometry(2.55, 2.4, 5.2);
    const bed = new THREE.Mesh(bedGeo, this.materials.truckWood);
    bed.position.set(0, 1.9, -1.7);
    bed.castShadow = true;
    truck.add(bed);

    // Decorative side color slats
    [-1.29, 1.29].forEach(sx => {
      for (let s = 0; s < 3; s++) {
        const slatGeo = new THREE.BoxGeometry(0.04, 0.22, 5.1);
        const slatMat = s === 0 ? this.materials.autoYellow : (s === 1 ? this.materials.truckOrange : this.materials.autoGreen);
        const slat = new THREE.Mesh(slatGeo, slatMat);
        slat.position.set(sx, 1.2 + s * 0.55, -1.7);
        truck.add(slat);
      }
    });

    // 3. Tailboard with Authentic "HORN OK PLEASE"
    const tailGeo = new THREE.PlaneGeometry(2.5, 2.3);
    const tailBoard = new THREE.Mesh(tailGeo, this.materials.truckTailgate);
    tailBoard.position.set(0, 1.9, -4.32);
    tailBoard.rotation.y = Math.PI;
    truck.add(tailBoard);

    // 4. Wheels (6 Heavy Duty Truck Wheels)
    const tWheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.32, 16);
    tWheelGeo.rotateZ(Math.PI / 2);
    const tTireMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.92 });

    [
      [-1.15, 0.48, 3.4],  // Front Left
      [1.15, 0.48, 3.4],   // Front Right
      [-1.18, 0.48, -1.4], // Rear Left 1
      [1.18, 0.48, -1.4],  // Rear Right 1
      [-1.18, 0.48, -2.8], // Rear Left 2
      [1.18, 0.48, -2.8]   // Rear Right 2
    ].forEach(([wx, wy, wz]) => {
      const w = new THREE.Mesh(tWheelGeo, tTireMat);
      w.position.set(wx, wy, wz);
      w.castShadow = true;
      truck.add(w);
    });

    // Front Bumper with Nazar Battu
    const bumperGeo = new THREE.BoxGeometry(2.5, 0.35, 0.3);
    const bumper = new THREE.Mesh(bumperGeo, this.materials.chromeMetal);
    bumper.position.set(0, 0.45, 4.65);
    truck.add(bumper);

    const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 8), this.materials.autoBlack);
    tassel.position.set(0, 0.15, 4.65);
    truck.add(tassel);

    return truck;
  }

  _buildDecoratedTruck(theme = 'buddh') {
    const truckPlacements = [
      { t: 0.24, side: 1, offset: 22.0, num: 1 },
      { t: 0.74, side: -1, offset: 22.0, num: 2 }
    ];

    truckPlacements.forEach(tp => {
      const pt = this.spline.getPointAt(tp.t);
      const tangent = this.spline.getTangentAt(tp.t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const angle = Math.atan2(tangent.x, tangent.z);

      const truck = this._createIndianTruck(tp.num);
      truck.position.copy(pt).add(normal.clone().multiplyScalar((this.trackWidth / 2 + tp.offset) * tp.side));
      truck.position.y = 0;
      truck.rotation.y = angle + (tp.side === 1 ? -0.2 : 0.2);
      this.circuitGroup.add(truck);
    });
  }

  _createHighwaySignTexture(line1Hindi, line2Eng, subText) {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    // Forest Highway Green (Official NHAI standard green)
    ctx.fillStyle = '#065f46';
    ctx.fillRect(0, 0, 800, 300);

    // Reflective white border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.strokeRect(14, 14, 772, 272);

    // Hindi Heading
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(line1Hindi, 400, 85);

    // English Name
    ctx.font = 'bold 44px Montserrat, Arial Black, sans-serif';
    ctx.fillText(line2Eng, 400, 160);

    // Yellow Accent Subtext
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 30px Arial, sans-serif';
    ctx.fillText(subText, 400, 230);

    return new THREE.CanvasTexture(canvas);
  }

  _buildIndianHighwaySigns(theme = 'buddh') {
    const signs = {
      buddh: [
        { t: 0.22, l1: 'राष्ट्रीय राजमार्ग 48', l2: 'NH-48 EXPRESSWAY', sub: 'SPEED LIMIT 120 // MADE BY RAJAMANI' },
        { t: 0.65, l1: 'बुद्ध इंटरनेशनल सर्किट', l2: 'GREATER NOIDA', sub: 'YAMUNA EXP // MADE BY RAJAMANI' }
      ],
      thar: [
        { t: 0.25, l1: 'पधारो म्हारे देश', l2: 'WELCOME TO RAJASTHAN', sub: 'NH-11 // MADE BY RAJAMANI' },
        { t: 0.72, l1: 'सोनार किला // जैसलमेर', l2: 'GOLDEN FORT VIEWPOINT', sub: 'DESERT PASS // MADE BY RAJAMANI' }
      ],
      goa: [
        { t: 0.20, l1: 'गोवा पर्यटन // NH-66', l2: 'WELCOME TO SUNNY GOA', sub: 'KONKAN ROUTE // MADE BY RAJAMANI' },
        { t: 0.62, l1: 'कलंगूट और बागा बीच', l2: 'COASTAL SCENIC ROUTE', sub: 'SCENIC DRIVE // MADE BY RAJAMANI' }
      ],
      mumbai: [
        { t: 0.16, l1: 'बांद्रा-वर्ली सी लिंक', l2: 'BANDRA-WORLI SEA LINK', sub: 'SEA LINK // MADE BY RAJAMANI' },
        { t: 0.55, l1: 'मरीन ड्राइव // क्वीन्स नेकलेस', l2: 'MARINE DRIVE EXPRESSWAY', sub: 'QUEENS NECKLACE // MADE BY RAJAMANI' }
      ],
      ladakh: [
        { t: 0.20, l1: 'सीमा सड़क संगठन // BRO', l2: 'PROJECT HIMANK', sub: 'BRO HIMANK // MADE BY RAJAMANI' },
        { t: 0.60, l1: 'खारदुंग ला दर्रा // 18380 FT', l2: 'HIGHEST MOTORABLE ROAD', sub: '18380 FT // MADE BY RAJAMANI' }
      ]
    }[theme] || [];

    signs.forEach(s => {
      const pt = this.spline.getPointAt(s.t);
      const tangent = this.spline.getTangentAt(s.t).normalize();
      const angle = Math.atan2(tangent.x, tangent.z);

      const gantryGroup = new THREE.Group();
      gantryGroup.position.copy(pt);
      gantryGroup.rotation.y = angle;

      const span = this.trackWidth + 6.0;
      const gHeight = 9.2;

      const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, gHeight, 8), this.materials.archSteel);
      pL.position.set(-span / 2, gHeight / 2, 0);
      gantryGroup.add(pL);

      const pR = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, gHeight, 8), this.materials.archSteel);
      pR.position.set(span / 2, gHeight / 2, 0);
      gantryGroup.add(pR);

      const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(span + 1.0, 0.5, 0.5), this.materials.archSteel);
      crossBeam.position.set(0, gHeight, 0);
      gantryGroup.add(crossBeam);

      const signTex = this._createHighwaySignTexture(s.l1, s.l2, s.sub);
      const signGeo = new THREE.PlaneGeometry(span * 0.72, 2.6);
      const signMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.35 });

      const signF = new THREE.Mesh(signGeo, signMat);
      signF.position.set(0, gHeight - 1.0, -0.3);
      signF.rotation.y = Math.PI;
      gantryGroup.add(signF);

      this.circuitGroup.add(gantryGroup);
    });
  }

  _buildPrayerFlags() {
    const flagColors = [0x2563eb, 0xffffff, 0xdc2626, 0x16a34a, 0xfacc15];
    const halfWidth = this.trackWidth / 2;

    const sectors = [
      { start: 0.30, end: 0.48, step: 0.015 },
      { start: 0.68, end: 0.86, step: 0.015 }
    ];

    sectors.forEach(sec => {
      let colorIndex = 0;
      for (let t = sec.start; t <= sec.end; t += sec.step) {
        const pt = this.spline.getPointAt(t);
        const tangent = this.spline.getTangentAt(t);
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        const angle = Math.atan2(tangent.x, tangent.z);

        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.8, 6), this.materials.guardrail);
        pole.position.copy(pt).add(normal.clone().multiplyScalar(halfWidth + 2.2));
        pole.position.y = 1.4;
        this.circuitGroup.add(pole);

        for (let f = 0; f < 4; f++) {
          const col = flagColors[(colorIndex++) % flagColors.length];
          const flagGeo = new THREE.PlaneGeometry(0.45, 0.35);
          const flagMat = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide });
          const flagMesh = new THREE.Mesh(flagGeo, flagMat);
          flagMesh.position.copy(pt).add(normal.clone().multiplyScalar(halfWidth + 2.2 + (f * 0.4 - 0.6)));
          flagMesh.position.y = 2.4 - f * 0.2;
          flagMesh.rotation.y = angle + 0.3;
          this.circuitGroup.add(flagMesh);
        }
      }
    });
  }

  _buildCoconutPalms(count = 55) {
    let placed = 0;
    let attempts = 0;

    while (placed < count && attempts < 400) {
      attempts++;
      const angle = Math.random() * Math.PI * 2;
      const rad = 65 + Math.random() * 420;
      const x = 110 + Math.cos(angle) * rad;
      const z = 45 + Math.sin(angle) * rad;

      if (this.getDistanceFromTrack(new THREE.Vector3(x, 0, z)) < 22.0) continue;

      placed++;
      const palmGroup = new THREE.Group();
      palmGroup.position.set(x, 0, z);

      const trunkH = 10 + Math.random() * 5;
      const curveDir = Math.random() * Math.PI * 2;
      const segments = 6;
      let prevPt = new THREE.Vector3(0, 0, 0);

      for (let s = 1; s <= segments; s++) {
        const segH = trunkH / segments;
        const progress = s / segments;
        const lean = Math.sin(progress * 1.4) * 2.5;
        const currPt = new THREE.Vector3(
          Math.cos(curveDir) * lean,
          progress * trunkH,
          Math.sin(curveDir) * lean
        );

        const segMid = prevPt.clone().add(currPt).multiplyScalar(0.5);
        const segLen = prevPt.distanceTo(currPt);
        const trunkMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.24, 0.32, segLen, 7),
          this.materials.palmTrunk
        );
        trunkMesh.position.copy(segMid);
        trunkMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), currPt.clone().sub(prevPt).normalize());
        trunkMesh.castShadow = true;
        palmGroup.add(trunkMesh);
        prevPt = currPt;
      }

      const crownPt = prevPt;
      for (let c = 0; c < 5; c++) {
        const coco = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), this.materials.coconut);
        const ca = (c / 5) * Math.PI * 2;
        coco.position.set(crownPt.x + Math.cos(ca) * 0.35, crownPt.y - 0.2, crownPt.z + Math.sin(ca) * 0.35);
        palmGroup.add(coco);
      }

      for (let f = 0; f < 8; f++) {
        const fa = (f / 8) * Math.PI * 2;
        const frondLen = 4.2 + Math.random() * 1.5;
        const frondGeo = new THREE.PlaneGeometry(1.2, frondLen);
        frondGeo.translate(0, frondLen / 2, 0);
        const frond = new THREE.Mesh(frondGeo, this.materials.palmFrond);
        frond.position.copy(crownPt);
        frond.rotation.y = fa;
        frond.rotation.x = 0.95;
        frond.castShadow = true;
        palmGroup.add(frond);
      }

      this.circuitGroup.add(palmGroup);
    }
  }

  _buildFortSandstoneTowers(count = 8) {
    const positions = [
      new THREE.Vector3(-140, 0, 180),
      new THREE.Vector3(-240, 0, 20),
      new THREE.Vector3(-120, 0, -180),
      new THREE.Vector3(80, 0, -160),
      new THREE.Vector3(140, 0, -40),
      new THREE.Vector3(55, 0, 80)
    ];

    positions.forEach((pos, idx) => {
      const towerR = 7.5;
      if (this.getDistanceFromTrack(pos) < this.trackWidth / 2 + towerR + 8.0) return;

      const towerGroup = new THREE.Group();
      towerGroup.position.copy(pos);

      const towerH = 18.0 + (idx % 3) * 4.0;

      const bastion = new THREE.Mesh(
        new THREE.CylinderGeometry(towerR * 0.88, towerR, towerH, 12),
        this.materials.sandstoneRed
      );
      bastion.position.y = towerH / 2;
      bastion.castShadow = true;
      towerGroup.add(bastion);

      const parapet = new THREE.Mesh(
        new THREE.CylinderGeometry(towerR * 0.96, towerR * 0.96, 2.2, 12, 1, true),
        this.materials.sandstoneBuff
      );
      parapet.position.y = towerH + 1.1;
      towerGroup.add(parapet);

      const chhatriGroup = new THREE.Group();
      chhatriGroup.position.y = towerH + 0.2;

      for (let c = 0; c < 6; c++) {
        const ca = (c / 6) * Math.PI * 2;
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3.2, 6), this.materials.sandstoneBuff);
        col.position.set(Math.cos(ca) * 3.8, 1.6, Math.sin(ca) * 3.8);
        chhatriGroup.add(col);
      }

      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(4.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        this.materials.sandstoneBuff
      );
      dome.position.y = 3.2;
      chhatriGroup.add(dome);

      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.6, 8), this.materials.goldMetal);
      spire.position.y = 7.6;
      chhatriGroup.add(spire);

      towerGroup.add(chhatriGroup);
      this.circuitGroup.add(towerGroup);
    });
  }

  _createStayCableMesh(ptA, ptB, mat) {
    const dist = ptA.distanceTo(ptB);
    const mid = ptA.clone().add(ptB).multiplyScalar(0.5);
    const dir = ptB.clone().sub(ptA).normalize();
    const geo = new THREE.CylinderGeometry(0.065, 0.065, dist, 6);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(mid);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return mesh;
  }

  _buildSeaLinkCablePylons() {
    const pylonPoints = [0.07, 0.35];
    const pylonH = 44.0;
    const span = this.trackWidth + 6.0;

    pylonPoints.forEach(t => {
      const pt = this.spline.getPointAt(t);
      const tangent = this.spline.getTangentAt(t).normalize();
      const angle = Math.atan2(tangent.x, tangent.z);

      const pylonGroup = new THREE.Group();
      pylonGroup.position.copy(pt);
      pylonGroup.rotation.y = angle;

      // 1. Massive Concrete Caisson Foundations (Submerged in water at Y = -2.2)
      [-span / 2, span / 2].forEach(cx => {
        const caissonGeo = new THREE.BoxGeometry(6.8, 14.0, 12.0);
        const caisson = new THREE.Mesh(caissonGeo, this.materials.concreteBridge);
        caisson.position.set(cx, -6.0, 0);
        caisson.castShadow = true;
        pylonGroup.add(caisson);

        // Plinth rim above water line
        const plinth = new THREE.Mesh(
          new THREE.CylinderGeometry(3.6, 4.0, 1.8, 16),
          this.materials.bridgePylon
        );
        plinth.position.set(cx, 0.2, 0);
        pylonGroup.add(plinth);
      });

      // 2. Twin Soaring A-Frame Pylon Tower Legs
      const legBaseX = span / 2;
      const legLen = Math.hypot(legBaseX, pylonH);
      const legAngle = Math.atan2(legBaseX, pylonH);
      const legGeo = new THREE.BoxGeometry(2.4, legLen, 2.8);

      const legL = new THREE.Mesh(legGeo, this.materials.bridgePylon);
      legL.position.set(-legBaseX / 2, pylonH / 2, 0);
      legL.rotation.z = -legAngle;
      legL.castShadow = true;
      pylonGroup.add(legL);

      const legR = new THREE.Mesh(legGeo, this.materials.bridgePylon);
      legR.position.set(legBaseX / 2, pylonH / 2, 0);
      legR.rotation.z = legAngle;
      legR.castShadow = true;
      pylonGroup.add(legR);

      // 3. Lower & Upper Cross-Tie Struts
      const lowerStrut = new THREE.Mesh(
        new THREE.BoxGeometry(span + 4.0, 2.2, 4.5),
        this.materials.concreteBridge
      );
      lowerStrut.position.set(0, -1.2, 0);
      pylonGroup.add(lowerStrut);

      const upperStrut = new THREE.Mesh(
        new THREE.BoxGeometry(span * 0.72, 1.8, 3.2),
        this.materials.bridgePylon
      );
      upperStrut.position.set(0, 11.5, 0);
      upperStrut.castShadow = true;
      pylonGroup.add(upperStrut);

      // Overhead Sign on upper strut
      const signCanvas = document.createElement('canvas');
      signCanvas.width = 1024;
      signCanvas.height = 128;
      const sCtx = signCanvas.getContext('2d');
      sCtx.fillStyle = '#0f172a';
      sCtx.fillRect(0, 0, 1024, 128);

      sCtx.strokeStyle = '#00f0ff';
      sCtx.lineWidth = 6;
      sCtx.strokeRect(6, 6, 1012, 116);

      sCtx.fillStyle = '#00f0ff';
      sCtx.font = 'bold 36px Montserrat, sans-serif';
      sCtx.textAlign = 'center';
      sCtx.fillText('★ BANDRA - WORLI SEA LINK ★', 512, 52);

      sCtx.fillStyle = '#facc15';
      sCtx.font = '900 38px Montserrat, sans-serif';
      sCtx.fillText('MADE BY RAJAMANI', 512, 102);

      const signTex = new THREE.CanvasTexture(signCanvas);
      const signMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(span * 0.68, 1.5),
        new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
      );
      signMesh.position.set(0, 11.5, -1.65);
      signMesh.rotation.y = Math.PI;
      pylonGroup.add(signMesh);

      const signMeshBack = signMesh.clone();
      signMeshBack.position.set(0, 11.5, 1.65);
      signMeshBack.rotation.y = 0;
      pylonGroup.add(signMeshBack);

      // 4. Apex Finial & Tricolor LED Aviation Beacon (at Y = 44 to 48m)
      const apexFinial = new THREE.Mesh(
        new THREE.ConeGeometry(0.8, 3.5, 8),
        this.materials.goldMetal
      );
      apexFinial.position.set(0, pylonH + 1.75, 0);
      pylonGroup.add(apexFinial);

      const ledTricolor = [
        { color: 0xff9933, y: pylonH + 3.8 },
        { color: 0xffffff, y: pylonH + 4.6 },
        { color: 0x138808, y: pylonH + 5.4 }
      ];
      ledTricolor.forEach(led => {
        const beacon = new THREE.Mesh(
          new THREE.SphereGeometry(0.35, 8, 8),
          new THREE.MeshBasicMaterial({ color: led.color })
        );
        beacon.position.set(0, led.y, 0);
        pylonGroup.add(beacon);
      });

      // 5. Authentic Stay Cables (Harp / Fan Stay Array)
      const deckAnchorOffset = this.trackWidth / 2 + 1.2;
      const stayCount = 8;
      const cableMat = this.materials.cableStay;

      for (let i = 1; i <= stayCount; i++) {
        const pylonAnchorY = 22.0 + (i / stayCount) * 19.0;
        const deckAnchorZ = (i * 9.5); // Spaced from 9.5m to 76m along deck

        [-1, 1].forEach(side => {
          const pTop = new THREE.Vector3(side * 0.9, pylonAnchorY, 0);

          // Forward Stay Cable
          const pFwd = new THREE.Vector3(side * deckAnchorOffset, 0.6, deckAnchorZ);
          pylonGroup.add(this._createStayCableMesh(pTop, pFwd, cableMat));

          // Backward Stay Cable
          const pBwd = new THREE.Vector3(side * deckAnchorOffset, 0.6, -deckAnchorZ);
          pylonGroup.add(this._createStayCableMesh(pTop, pBwd, cableMat));

          // Stay Cable Anchorage Fairing Blocks on the deck
          [deckAnchorZ, -deckAnchorZ].forEach(zPos => {
            const fairing = new THREE.Mesh(
              new THREE.BoxGeometry(0.65, 0.8, 1.4),
              this.materials.chromeMetal
            );
            fairing.position.set(side * deckAnchorOffset, 0.4, zPos);
            pylonGroup.add(fairing);
          });
        });
      }

      this.circuitGroup.add(pylonGroup);
    });
  }

  _buildSeaLinkBridgeViaduct() {
    const segments = 160;
    const bridgeW = this.trackWidth + 3.6;
    const deckDepth = 2.2;

    // 1. Continuous Solid Concrete Viaduct Box Girder Deck & Parapets
    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const nextT = ((i + 1) % segments) / segments;
      const pt = this.spline.getPointAt(t);
      const nextPt = this.spline.getPointAt(nextT);
      const tangent = this.spline.getTangentAt(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const angle = Math.atan2(tangent.x, tangent.z);
      const segLen = pt.distanceTo(nextPt);
      const midPt = pt.clone().add(nextPt).multiplyScalar(0.5);

      // Box Girder Deck Slab directly underneath the road
      const deckMesh = new THREE.Mesh(
        new THREE.BoxGeometry(bridgeW, deckDepth, segLen * 1.04),
        this.materials.concreteBridge
      );
      deckMesh.position.set(midPt.x, -deckDepth / 2, midPt.z);
      deckMesh.rotation.y = angle;
      deckMesh.castShadow = true;
      deckMesh.receiveShadow = true;
      this.circuitGroup.add(deckMesh);

      // Outer Bridge Parapet Walls & Glowing Cyan LED Edge Strips
      [-1, 1].forEach(side => {
        const parapetDist = (bridgeW / 2 - 0.28) * side;
        const parapetPos = midPt.clone().add(normal.clone().multiplyScalar(parapetDist));

        const parapet = new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 1.35, segLen * 1.04),
          this.materials.concreteBridge
        );
        parapet.position.set(parapetPos.x, 0.65, parapetPos.z);
        parapet.rotation.y = angle;
        this.circuitGroup.add(parapet);

        const ledStrip = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.12, segLen * 1.04),
          this.materials.neonCyan
        );
        ledStrip.position.set(parapetPos.x, 1.35, parapetPos.z);
        ledStrip.rotation.y = angle;
        this.circuitGroup.add(ledStrip);
      });
    }

    // 2. Concrete Support Piers plunging down into the ocean
    const pierCount = 38;
    const colHeight = 11.0;
    const colGeo = new THREE.CylinderGeometry(1.3, 1.5, colHeight, 14);

    for (let p = 0; p < pierCount; p++) {
      const t = p / pierCount;
      const pt = this.spline.getPointAt(t);
      const tangent = this.spline.getTangentAt(t).normalize();
      const angle = Math.atan2(tangent.x, tangent.z);

      const pierGroup = new THREE.Group();
      pierGroup.position.set(pt.x, 0, pt.z);
      pierGroup.rotation.y = angle;

      // Heavy Concrete Crosshead Beam beneath deck
      const crosshead = new THREE.Mesh(
        new THREE.BoxGeometry(bridgeW + 1.2, 1.8, 3.8),
        this.materials.concreteBridge
      );
      crosshead.position.set(0, -2.1, 0);
      crosshead.castShadow = true;
      pierGroup.add(crosshead);

      // Twin Columns into the ocean
      [-this.trackWidth * 0.26, this.trackWidth * 0.26].forEach(cx => {
        const col = new THREE.Mesh(colGeo, this.materials.concreteBridge);
        col.position.set(cx, -2.1 - colHeight / 2, 0);
        col.castShadow = true;
        pierGroup.add(col);
      });

      // Submerged Base Footing
      const footing = new THREE.Mesh(
        new THREE.BoxGeometry(bridgeW + 1.8, 3.2, 6.8),
        this.materials.concreteBridge
      );
      footing.position.set(0, -2.1 - colHeight + 1.5, 0);
      pierGroup.add(footing);

      this.circuitGroup.add(pierGroup);
    }
  }

  _buildGulmoharTrees(count = 45) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3319, roughness: 0.9 });
    const bloomMat = this.materials.gulmoharBloom;
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 });

    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts < 350) {
      attempts++;
      const angle = Math.random() * Math.PI * 2;
      const rad = 70 + Math.random() * 440;
      const x = 110 + Math.cos(angle) * rad;
      const z = 45 + Math.sin(angle) * rad;

      if (this.getDistanceFromTrack(new THREE.Vector3(x, 0, z)) < 22.0) continue;

      placed++;
      const treeGroup = new THREE.Group();
      treeGroup.position.set(x, 0, z);

      const treeH = 9.0 + Math.random() * 4.5;
      const trunkH = treeH * 0.42;

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.85, trunkH, 7), trunkMat);
      trunk.position.y = trunkH / 2;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      const crownBase = new THREE.Mesh(new THREE.DodecahedronGeometry(treeH * 0.45, 1), foliageMat);
      crownBase.position.y = trunkH + treeH * 0.3;
      crownBase.scale.set(1.4, 0.65, 1.4);
      crownBase.castShadow = true;
      treeGroup.add(crownBase);

      const crownBloom = new THREE.Mesh(new THREE.DodecahedronGeometry(treeH * 0.42, 1), bloomMat);
      crownBloom.position.y = trunkH + treeH * 0.38;
      crownBloom.scale.set(1.35, 0.55, 1.35);
      crownBloom.castShadow = true;
      treeGroup.add(crownBloom);

      this.circuitGroup.add(treeGroup);
    }
  }

  _buildIndianCultureElements(theme = 'buddh') {
    if (theme === 'thar') {
      this._buildFortSandstoneTowers(8);
    } else if (theme === 'ladakh') {
      this._buildPrayerFlags();
    } else if (theme === 'mumbai') {
      this._buildSeaLinkCablePylons();
    }
  }

  _buildTerrainEnvironment(theme = 'buddh') {
    if (theme === 'mumbai') {
      // 1. Expansive Arabian Sea Ocean Water Surface below the bridge
      const waterGeo = new THREE.PlaneGeometry(4500, 4500, 4, 4);
      const water = new THREE.Mesh(waterGeo, this.materials.seaWater);
      water.rotation.x = -Math.PI / 2;
      water.position.y = -2.2; // 2.2 meters below the bridge deck
      water.receiveShadow = true;
      this.circuitGroup.add(water);

      // 2. Mumbai Skyline with glowing skyscrapers & Queen's Necklace promenade
      this._buildMumbaiCoastlineAndSkyline();
      return;
    }

    const groundGeo = new THREE.PlaneGeometry(3800, 3800);
    const isDesert = (theme === 'canyon' || theme === 'thar');
    const groundMat = isDesert ? this.materials.sand : this.materials.grass;
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.circuitGroup.add(ground);

    if (isDesert) {
      this._buildDesertRockFormations();
    } else if (theme === 'goa') {
      this._buildCoconutPalms(55);
    } else if (theme === 'buddh') {
      this._buildGulmoharTrees(42);
      this._buildForestTrees(theme);
    } else {
      this._buildForestTrees(theme);
    }
  }

  _buildMumbaiCoastlineAndSkyline() {
    const cityGroup = new THREE.Group();

    // 1. Glowing Skyscraper Window Grid Canvas Texture
    const winCanvas = document.createElement('canvas');
    winCanvas.width = 256;
    winCanvas.height = 512;
    const wCtx = winCanvas.getContext('2d');
    wCtx.fillStyle = '#090d16';
    wCtx.fillRect(0, 0, 256, 512);

    for (let wy = 6; wy < 504; wy += 14) {
      for (let wx = 6; wx < 250; wx += 15) {
        if (Math.random() > 0.22) {
          const colors = ['#fef08a', '#38bdf8', '#ffffff', '#fed7aa', '#93c5fd'];
          wCtx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
          wCtx.fillRect(wx, wy, 10, 8);
        }
      }
    }
    const winTex = new THREE.CanvasTexture(winCanvas);
    winTex.wrapS = THREE.RepeatWrapping;
    winTex.wrapT = THREE.RepeatWrapping;

    const bldgMat = new THREE.MeshStandardMaterial({
      map: winTex,
      roughness: 0.35,
      metalness: 0.65
    });

    // Coastal Skyscraper Clusters (Nariman Point & Worli Skyline across Mahim Bay)
    const bldgPositions = [
      { x: -320, z: -380, w: 32, h: 120, d: 35 },
      { x: -260, z: -420, w: 28, h: 160, d: 30 },
      { x: -190, z: -460, w: 40, h: 140, d: 36 },
      { x: -110, z: -480, w: 34, h: 195, d: 32 },
      { x: -40, z: -510, w: 45, h: 175, d: 40 },
      { x: 50, z: -490, w: 36, h: 220, d: 38 },
      { x: 130, z: -460, w: 32, h: 155, d: 34 },
      { x: 210, z: -420, w: 42, h: 180, d: 36 },
      { x: 290, z: -370, w: 30, h: 145, d: 32 },

      { x: 520, z: 200, w: 38, h: 170, d: 36 },
      { x: 540, z: 280, w: 44, h: 210, d: 40 },
      { x: 500, z: 360, w: 36, h: 185, d: 34 },
      { x: 440, z: 450, w: 40, h: 150, d: 38 },
      { x: 360, z: 520, w: 48, h: 190, d: 42 },
      { x: 260, z: 560, w: 35, h: 165, d: 35 },
      { x: 160, z: 580, w: 42, h: 230, d: 40 },
      { x: 60, z: 560, w: 36, h: 180, d: 36 },
      { x: -60, z: 520, w: 34, h: 140, d: 32 }
    ];

    bldgPositions.forEach(bp => {
      const bldg = new THREE.Mesh(
        new THREE.BoxGeometry(bp.w, bp.h, bp.d),
        bldgMat
      );
      bldg.position.set(bp.x, bp.h / 2 - 2.0, bp.z);
      cityGroup.add(bldg);

      // Rooftop Spire & Warning Beacon
      const spire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.8, 18, 6),
        this.materials.chromeMetal
      );
      spire.position.set(bp.x, bp.h - 2.0 + 9, bp.z);
      cityGroup.add(spire);

      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.85, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      beacon.position.set(bp.x, bp.h - 2.0 + 18, bp.z);
      cityGroup.add(beacon);

      // Neon rooftop architectural edge
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(bp.w + 0.6, 0.8, bp.d + 0.6),
        new THREE.MeshBasicMaterial({ color: bp.h > 180 ? 0x00f0ff : 0xfacc15 })
      );
      edge.position.set(bp.x, bp.h - 2.0, bp.z);
      cityGroup.add(edge);
    });

    // 2. Queen's Necklace Promenade Streetlights along coastal arc
    const lightArcCount = 28;
    for (let i = 0; i < lightArcCount; i++) {
      const a = (i / lightArcCount) * Math.PI * 0.9 - 2.4;
      const lx = Math.cos(a) * 440;
      const lz = Math.sin(a) * 440;

      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 10, 6),
        this.materials.guardrail
      );
      post.position.set(lx, 3.0, lz);
      cityGroup.add(post);

      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.9, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      bulb.position.set(lx, 8.2, lz);
      cityGroup.add(bulb);
    }

    this.circuitGroup.add(cityGroup);
  }

  _buildForestTrees(theme) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3319, roughness: 0.9 });
    const foliageMatOak = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.85 });
    const foliageMatPine = new THREE.MeshStandardMaterial({ color: (theme === 'ladakh' || theme === 'nurburgring') ? 0x144218 : 0x1b5e20, roughness: 0.82 });

    let placedTrees = 0;
    let attempts = 0;
    while (placedTrees < 140 && attempts < 800) {
      attempts++;
      const angle = Math.random() * Math.PI * 2;
      const rad = 75 + Math.random() * 480;
      const x = 110 + Math.cos(angle) * rad;
      const z = 45 + Math.sin(angle) * rad;

      if (this.getDistanceFromTrack(new THREE.Vector3(x, 0, z)) < 20.0) continue;

      placedTrees++;
      const isPine = placedTrees % 2 === 0;
      const height = isPine ? (10 + Math.random() * 7) : (8 + Math.random() * 5);

      const treeGroup = new THREE.Group();
      treeGroup.position.set(x, 0, z);

      const trunkH = height * 0.45;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.65, trunkH, 7), trunkMat);
      trunk.position.y = trunkH / 2;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      if (isPine) {
        for (let t = 0; t < 3; t++) {
          const coneH = height * 0.45;
          const coneR = (3 - t) * 1.35;
          const cone = new THREE.Mesh(new THREE.ConeGeometry(coneR, coneH, 8), foliageMatPine);
          cone.position.y = trunkH * 0.7 + t * (coneH * 0.55);
          cone.castShadow = true;
          treeGroup.add(cone);
        }
      } else {
        const dome1 = new THREE.Mesh(new THREE.DodecahedronGeometry(height * 0.45, 1), foliageMatOak);
        dome1.position.y = trunkH + height * 0.35;
        dome1.castShadow = true;
        treeGroup.add(dome1);
      }

      this.circuitGroup.add(treeGroup);
    }
  }

  _buildDesertRockFormations() {
    const rockMat = this.materials.canyonRock;
    let placedRocks = 0;
    let attempts = 0;
    while (placedRocks < 80 && attempts < 500) {
      attempts++;
      const angle = Math.random() * Math.PI * 2;
      const rad = 80 + Math.random() * 460;
      const x = 100 + Math.cos(angle) * rad;
      const z = 50 + Math.sin(angle) * rad;

      if (this.getDistanceFromTrack(new THREE.Vector3(x, 0, z)) < 22.0) continue;

      placedRocks++;
      const rockH = 14 + Math.random() * 24;
      const rockR = 10 + Math.random() * 16;
      const rock = new THREE.Mesh(new THREE.CylinderGeometry(rockR * 0.6, rockR, rockH, 6), rockMat);
      rock.position.set(x, rockH / 2 - 2, z);
      rock.castShadow = true;
      this.circuitGroup.add(rock);
    }
  }

  _buildThemedMountains(theme = 'buddh') {
    if (theme === 'mumbai') {
      // In Mumbai Sea Link, the bay skyline replaces mountains
      return;
    }

    const mountainGroup = new THREE.Group();
    const count = 30;
    const ringRadius = 780;
    const isDesert = (theme === 'canyon' || theme === 'thar');
    const isLadakh = (theme === 'ladakh' || theme === 'nurburgring');

    let mat;
    if (isDesert) {
      mat = this.materials.canyonRock;
    } else if (isLadakh) {
      mat = this.materials.distantPeak;
    } else {
      mat = this.materials.mountain;
    }

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = 110 + Math.cos(angle) * ringRadius;
      const z = 45 + Math.sin(angle) * ringRadius;
      const mHeight = isLadakh ? (160 + Math.random() * 120) : (120 + Math.random() * 95);
      const mRadius = 140 + Math.random() * 85;

      const mountain = new THREE.Mesh(new THREE.ConeGeometry(mRadius, mHeight, 7), mat);
      mountain.position.set(x, mHeight / 2 - 30, z);
      mountainGroup.add(mountain);

      if (isLadakh && mHeight > 190) {
        const snowH = mHeight * 0.28;
        const snowCone = new THREE.Mesh(
          new THREE.ConeGeometry(mRadius * 0.28, snowH, 7),
          this.materials.tirangaWhite
        );
        snowCone.position.set(x, mHeight - 30 - snowH / 2, z);
        mountainGroup.add(snowCone);
      }
    }

    this.circuitGroup.add(mountainGroup);
  }

  // --- Public Spatial Distance & Heading Helpers ---
  getClosestTrackInfo(pos) {
    let minDistSq = Infinity;
    let closestIndex = 0;
    const px = pos.x;
    const pz = pos.z;

    for (let i = 0; i < this.sampleCount; i++) {
      const pt = this.sampledPoints[i];
      const dx = px - pt.x;
      const dz = pz - pt.z;
      const dSq = dx * dx + dz * dz;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        closestIndex = i;
      }
    }

    const dist = Math.sqrt(minDistSq);
    const closestPt = this.sampledPoints[closestIndex];
    const progressPct = Math.min(100, Math.max(0, Math.round((closestIndex / this.sampleCount) * 100)));

    return {
      distance: dist,
      closestPoint: closestPt,
      index: closestIndex,
      progressPct: progressPct,
      normal: closestPt.clone().sub(pos).normalize()
    };
  }

  getDistanceFromTrack(pos) {
    return this.getClosestTrackInfo(pos).distance;
  }

  getTrackProgressPct(pos) {
    return this.getClosestTrackInfo(pos).progressPct;
  }

  getTrackWidthAt(pos) {
    return this.trackWidth;
  }

  getNormalTowardsTrack(pos) {
    return this.getClosestTrackInfo(pos).normal;
  }

  getTrackSpline() {
    return this.spline;
  }
}
