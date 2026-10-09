/**
 * Apex Velocity: Overdrive
 * Ultra-Detailed 3D Supercar Model Builder
 * Inspired by modern exotic mid-engine supercars (Ferrari 458 / F8 Tributo / SF90):
 * - Sculpted wide-body aerodynamic curves with front splitters, side air scoops & rear aero diffuser
 * - Gloss metallic Rosso Corsa paint with clearcoat reflections & twin black racing stripes
 * - High-detail 5-twin-spoke forged alloy wheels with drilled carbon-ceramic brake discs & gold Brembo calipers
 * - Quad circular 3D LED taillights, projector LED headlights, and chrome quad exhaust tips
 * - Ambient occlusion contact shadow plane grounding the car firmly to the tarmac
 */

import * as THREE from 'three';

export class CarModelBuilder {
  static CAR_DEFINITIONS = [
    {
      id: 'apex_gtr',
      name: 'SCUDERIA GT',
      class: 'V8 EXOTIC // ROSSO CORSA SPEC',
      topSpeedKmh: 325,
      acceleration: 35,
      handling: 0.95,
      driftFactor: 0.9,
      specs: { speed: 92, accel: 94, handling: 92, drift: 86 }
    },
    {
      id: 'phantom_v12',
      name: 'PHANTOM V12',
      class: 'HYPERCAR // GIALLO MODENA SPEC',
      topSpeedKmh: 345,
      acceleration: 38,
      handling: 0.88,
      driftFactor: 0.8,
      specs: { speed: 98, accel: 96, handling: 85, drift: 78 }
    },
    {
      id: 'venom_drift',
      name: 'VENOM DRIFT-SPEC',
      class: 'TUNER // DRIFT MASTER SPEC',
      topSpeedKmh: 310,
      acceleration: 33,
      handling: 0.98,
      driftFactor: 1.15,
      specs: { speed: 86, accel: 88, handling: 96, drift: 99 }
    }
  ];

  static buildCar(carId = 'apex_gtr', bodyColor = 0xdc2020, underglowColor = 'none') {
    const root = new THREE.Group();

    // =========================================================================
    // 1. HIGH-PERFORMANCE AUTOMOTIVE PBR MATERIALS
    // =========================================================================
    // Gloss Metallic Exterior Paint with Clearcoat Sheen
    const matPaint = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.14,
      metalness: 0.68
    });

    // Satin Matte Racing Stripe
    const matStripe = new THREE.MeshStandardMaterial({
      color: 0x111317,
      roughness: 0.3,
      metalness: 0.5
    });

    // Lightweight Exposed Carbon Fiber
    const matCarbon = new THREE.MeshStandardMaterial({
      color: 0x141820,
      roughness: 0.38,
      metalness: 0.45
    });

    // Deep Smoked Cockpit Canopy Glass
    const matGlass = new THREE.MeshStandardMaterial({
      color: 0x0c111a,
      roughness: 0.04,
      metalness: 0.92,
      transparent: true,
      opacity: 0.78
    });

    // Dark Honeycomb Grille Mesh
    const matGrille = new THREE.MeshStandardMaterial({
      color: 0x080a0f,
      roughness: 0.7,
      metalness: 0.2
    });

    // Polished Chrome Exhausts & Emblems
    const matChrome = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.08,
      metalness: 0.96
    });

    // Forged Alloy Wheels (Gunmetal Anthracite)
    const matWheelAlloy = new THREE.MeshStandardMaterial({
      color: 0x242a35,
      roughness: 0.2,
      metalness: 0.88
    });

    // Cross-Drilled Steel Brake Rotor
    const matBrakeDisc = new THREE.MeshStandardMaterial({
      color: 0xa8b4c4,
      roughness: 0.25,
      metalness: 0.9
    });

    // Brembo Racing Yellow / Gold Brake Calipers
    const matBrakeCaliper = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.2,
      metalness: 0.65
    });

    // Headlight Crystal Projectors & DRL Halos
    const matHeadlightLens = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.95,
      roughness: 0.1
    });

    // Ferrari-Style Quad Circular 3D LED Taillights
    const matRoundTaillight = new THREE.MeshStandardMaterial({
      color: 0xff0022,
      emissive: 0xee0011,
      emissiveIntensity: 1.1,
      roughness: 0.2
    });

    // Optional Neon Underglow
    const matUnderglow = new THREE.MeshBasicMaterial({
      color: underglowColor !== 'none' ? underglowColor : 0x000000,
      transparent: true,
      opacity: underglowColor !== 'none' ? 0.85 : 0
    });

    // =========================================================================
    // 2. CONTACT AMBIENT OCCLUSION SHADOW (GROUNDS THE CAR ON THE ROAD)
    // =========================================================================
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    const grad = sCtx.createRadialGradient(128, 128, 30, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.45)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 5.0),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.02;
    root.add(contactShadow);

    // =========================================================================
    // 3. SCULPTED CHASSIS & AERODYNAMIC BODYWORK
    // =========================================================================
    // Main Lower Monocoque Tub
    const tubGeo = new THREE.BoxGeometry(2.02, 0.38, 4.35);
    const tub = new THREE.Mesh(tubGeo, matPaint);
    tub.position.y = 0.38;
    tub.castShadow = true;
    tub.receiveShadow = true;
    root.add(tub);

    // Sculpted Front Fenders & Nose Cone
    const noseGeo = new THREE.BoxGeometry(1.88, 0.22, 1.4);
    const nose = new THREE.Mesh(noseGeo, matPaint);
    nose.position.set(0, 0.44, 1.55);
    nose.rotation.x = 0.08;
    nose.castShadow = true;
    root.add(nose);

    // Front Bumper Lower Air Dam with Grille Mouth
    const frontGrille = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.16, 0.15), matGrille);
    frontGrille.position.set(0, 0.24, 2.22);
    root.add(frontGrille);

    // Carbon Fiber Front Splitter with Aerodynamic Winglets
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.05, 0.85), matCarbon);
    splitter.position.set(0, 0.18, 2.05);
    splitter.castShadow = true;
    root.add(splitter);

    // Splitter Left & Right Vertical Endplates
    const wingletL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.35), matCarbon);
    wingletL.position.set(-1.03, 0.24, 2.2);
    root.add(wingletL);

    const wingletR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.35), matCarbon);
    wingletR.position.set(1.03, 0.24, 2.2);
    root.add(wingletR);

    // Sculpted Muscular Front Wheel Arches
    const archGeo = new THREE.BoxGeometry(0.24, 0.22, 1.0);
    const archFL = new THREE.Mesh(archGeo, matPaint);
    archFL.position.set(-1.0, 0.52, 1.35);
    archFL.castShadow = true;
    root.add(archFL);

    const archFR = new THREE.Mesh(archGeo, matPaint);
    archFR.position.set(1.0, 0.52, 1.35);
    archFR.castShadow = true;
    root.add(archFR);

    // Sculpted Wide-Body Rear Wheel Arches
    const archRL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 1.15), matPaint);
    archRL.position.set(-1.02, 0.55, -1.35);
    archRL.castShadow = true;
    root.add(archRL);

    const archRR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 1.15), matPaint);
    archRR.position.set(1.02, 0.55, -1.35);
    archRR.castShadow = true;
    root.add(archRR);

    // Side Air Intake Scoops (feeding mid-mounted engine)
    const scoopL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.7), matGrille);
    scoopL.position.set(-1.02, 0.42, -0.6);
    root.add(scoopL);

    const scoopR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.7), matGrille);
    scoopR.position.set(1.02, 0.42, -0.6);
    root.add(scoopR);

    // Carbon Fiber Aerodynamic Side Skirts
    const skirtL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 2.3), matCarbon);
    skirtL.position.set(-1.03, 0.18, 0);
    root.add(skirtL);

    const skirtR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 2.3), matCarbon);
    skirtR.position.set(1.03, 0.18, 0);
    root.add(skirtR);

    // =========================================================================
    // 4. TWIN CENTER RACING STRIPES & HOOD VENTS
    // =========================================================================
    const stripeGeo = new THREE.BoxGeometry(0.22, 0.015, 4.3);
    const stripeL = new THREE.Mesh(stripeGeo, matStripe);
    stripeL.position.set(-0.16, 0.58, 0);
    root.add(stripeL);

    const stripeR = new THREE.Mesh(stripeGeo, matStripe);
    stripeR.position.set(0.16, 0.58, 0);
    root.add(stripeR);

    // Dual Recessed Hood Air Vents
    const hoodVentL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.45), matCarbon);
    hoodVentL.position.set(-0.48, 0.54, 1.25);
    root.add(hoodVentL);

    const hoodVentR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.45), matCarbon);
    hoodVentR.position.set(0.48, 0.54, 1.25);
    root.add(hoodVentR);

    // =========================================================================
    // 5. GREENHOUSE CANOPY, TINTED GLASS & COCKPIT SILHOUETTE
    // =========================================================================
    // Sleek Teardrop Cockpit Canopy Glass
    const cabinGeo = new THREE.BoxGeometry(1.42, 0.42, 2.05);
    const cabin = new THREE.Mesh(cabinGeo, matGlass);
    cabin.position.set(0, 0.76, -0.15);
    cabin.castShadow = true;
    root.add(cabin);

    // Windshield Roof Header & A-Pillars (Carbon/Black)
    const roofCap = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.04, 1.1), matPaint);
    roofCap.position.set(0, 0.98, -0.2);
    roofCap.castShadow = true;
    root.add(roofCap);

    // Interior Racing Bucket Seat Headrests (visible through tinted canopy)
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x181a20, roughness: 0.8 });
    const seatL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.22), seatMat);
    seatL.position.set(-0.35, 0.72, -0.25);
    root.add(seatL);

    const seatR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.22), seatMat);
    seatR.position.set(0.35, 0.72, -0.25);
    root.add(seatR);

    // Aerodynamic Wing Mirrors
    const mirrorGeo = new THREE.BoxGeometry(0.22, 0.08, 0.12);
    const mirrorL = new THREE.Mesh(mirrorGeo, matPaint);
    mirrorL.position.set(-0.94, 0.74, 0.42);
    root.add(mirrorL);

    const mirrorR = new THREE.Mesh(mirrorGeo, matPaint);
    mirrorR.position.set(0.94, 0.74, 0.42);
    root.add(mirrorR);

    // Rear Mid-Engine Transparent Glass Deck
    const engineCover = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.04, 1.25), matGlass);
    engineCover.position.set(0, 0.64, -1.25);
    root.add(engineCover);

    // Twin Red V8 Intake Plenums (visible under engine glass)
    const plenumMat = new THREE.MeshStandardMaterial({ color: 0xc92a2a, metalness: 0.6, roughness: 0.3 });
    const plenumL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.85, 12), plenumMat);
    plenumL.rotation.x = Math.PI / 2;
    plenumL.position.set(-0.2, 0.58, -1.25);
    root.add(plenumL);

    const plenumR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.85, 12), plenumMat);
    plenumR.rotation.x = Math.PI / 2;
    plenumR.position.set(0.2, 0.58, -1.25);
    root.add(plenumR);

    // =========================================================================
    // 6. REAR AERO DIFFUSER, DUCKTAIL SPOILER & QUAD EXHAUSTS
    // =========================================================================
    // Carbon Fiber Ducktail / GT Wing Spoiler
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.06, 0.45), matCarbon);
    spoiler.position.set(0, 0.68, -2.15);
    spoiler.castShadow = true;
    root.add(spoiler);

    // Rear Lower Aggressive Diffuser with 4 Vertical Aerodynamic Fins
    const diffuserBase = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.06, 0.8), matCarbon);
    diffuserBase.position.set(0, 0.18, -2.05);
    root.add(diffuserBase);

    const finGeo = new THREE.BoxGeometry(0.04, 0.14, 0.6);
    [-0.6, -0.2, 0.2, 0.6].forEach(x => {
      const fin = new THREE.Mesh(finGeo, matCarbon);
      fin.position.set(x, 0.18, -2.05);
      root.add(fin);
    });

    // Quad Chrome Exhaust Pipes (Dual Twin Center Tips)
    const exhaustGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.28, 16);
    const exhaustMat = matChrome;

    const exhaustPipes = [
      { x: -0.38, y: 0.32, z: -2.25 },
      { x: -0.22, y: 0.32, z: -2.25 },
      { x: 0.22, y: 0.32, z: -2.25 },
      { x: 0.38, y: 0.32, z: -2.25 }
    ];

    exhaustPipes.forEach(p => {
      const pipe = new THREE.Mesh(exhaustGeo, exhaustMat);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(p.x, p.y, p.z);
      root.add(pipe);
    });

    // =========================================================================
    // 7. LIGHTING FIXTURES (PROJECTOR HEADLIGHTS & QUAD TAILLIGHTS)
    // =========================================================================
    // Dual Front LED Projector Headlights
    const hlGeo = new THREE.BoxGeometry(0.32, 0.07, 0.45);
    const hlL = new THREE.Mesh(hlGeo, matHeadlightLens);
    hlL.position.set(-0.72, 0.48, 1.95);
    hlL.rotation.y = -0.15;
    root.add(hlL);

    const hlR = new THREE.Mesh(hlGeo, matHeadlightLens);
    hlR.position.set(0.72, 0.48, 1.95);
    hlR.rotation.y = 0.15;
    root.add(hlR);

    // Quad Circular Ferrari LED Taillights
    const tailGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.06, 24);
    tailGeo.rotateX(Math.PI / 2);

    const taillights = [
      { x: -0.74, y: 0.48, z: -2.2 },
      { x: -0.46, y: 0.48, z: -2.2 },
      { x: 0.46, y: 0.48, z: -2.2 },
      { x: 0.74, y: 0.48, z: -2.2 }
    ];

    taillights.forEach(t => {
      const lamp = new THREE.Mesh(tailGeo, matRoundTaillight);
      lamp.position.set(t.x, t.y, t.z);
      root.add(lamp);
    });

    // =========================================================================
    // 8. HIGH-DETAIL WHEELS (FORGED ALLOY RIMS, DRILLED ROTORS & BREMBO CALIPERS)
    // =========================================================================
    const wheelRadius = 0.38;
    const wheelWidth = 0.28;

    // Performance Rubber Tire with Sidewall Profile
    const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 28);
    tireGeo.rotateZ(Math.PI / 2);
    const matTire = new THREE.MeshStandardMaterial({
      color: 0x141820,
      roughness: 0.88,
      metalness: 0.08
    });

    // Drilled Brake Rotor
    const rotorGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.04, 20);
    rotorGeo.rotateZ(Math.PI / 2);

    // Yellow Brembo Caliper
    const caliperGeo = new THREE.BoxGeometry(0.09, 0.15, 0.14);

    const makeWheelAssembly = (x, z) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, wheelRadius, z);

      const rotatingMesh = new THREE.Group();

      // Tire Tread
      const tire = new THREE.Mesh(tireGeo, matTire);
      tire.castShadow = true;
      rotatingMesh.add(tire);

      // Deep-Dish 5-Twin-Spoke Forged Alloy Rim
      const rimBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(wheelRadius * 0.78, wheelRadius * 0.78, wheelWidth * 0.95, 18),
        matWheelAlloy
      );
      rimBarrel.rotateZ(Math.PI / 2);
      rotatingMesh.add(rimBarrel);

      // 5 Sculpted Spoke Pairs
      const spokeGeo = new THREE.BoxGeometry(wheelWidth * 0.92, 0.045, wheelRadius * 1.35);
      for (let s = 0; s < 5; s++) {
        const spoke = new THREE.Mesh(spokeGeo, matWheelAlloy);
        spoke.rotation.x = (s * Math.PI) / 5;
        rotatingMesh.add(spoke);
      }

      // Center Hub with Crest Cap
      const hubCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, wheelWidth * 1.02, 16),
        matBrakeCaliper
      );
      hubCap.rotateZ(Math.PI / 2);
      rotatingMesh.add(hubCap);

      pivot.add(rotatingMesh);

      // Stationary Cross-Drilled Rotor
      const rotor = new THREE.Mesh(rotorGeo, matBrakeDisc);
      pivot.add(rotor);

      // Stationary Brembo Caliper
      const caliper = new THREE.Mesh(caliperGeo, matBrakeCaliper);
      caliper.position.set(x > 0 ? 0.07 : -0.07, 0.14, 0);
      pivot.add(caliper);

      root.add(pivot);
      return { pivot, rotatingMesh };
    };

    const wheels = {
      fl: makeWheelAssembly(-1.02, 1.4),
      fr: makeWheelAssembly(1.02, 1.4),
      rl: makeWheelAssembly(-1.04, -1.35),
      rr: makeWheelAssembly(1.04, -1.35)
    };

    // =========================================================================
    // 9. NITRO EXHAUST FLAMES & GLOW LIGHTS
    // =========================================================================
    const flameGeo = new THREE.ConeGeometry(0.12, 0.9, 12);
    flameGeo.rotateX(-Math.PI / 2);

    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.92
    });

    const flameL = new THREE.Mesh(flameGeo, flameMat);
    flameL.position.set(-0.3, 0.32, -2.75);
    flameL.visible = false;
    root.add(flameL);

    const flameR = new THREE.Mesh(flameGeo, flameMat);
    flameR.position.set(0.3, 0.32, -2.75);
    flameR.visible = false;
    root.add(flameR);

    // Subtle exhaust glow on road
    const flameLight = new THREE.PointLight(0x00d4ff, 0, 4);
    flameLight.position.set(0, 0.32, -2.65);
    root.add(flameLight);

    return {
      root,
      materials: {
        matPaint,
        matUnderglow,
        matTaillight: matRoundTaillight,
        matRoundTaillight
      },
      wheels,
      taillights,
      exhaustFlames: [flameL, flameR],
      flameLight
    };
  }
}
