import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export type StageSceneMode = 'title' | 'pack' | 'binder' | 'tour' | 'battle';
export type BattleCameraPhase = 'idle' | 'ally_attack' | 'enemy_attack' | 'ultimate';

interface ThreeStageProps {
  mode: StageSceneMode;
  bannerTitle?: string;
  bannerColor: string;
  secondaryColor: string;
  packRipState: 'idle' | 'ripping' | 'opened';
  cameraTrauma?: number;
  battleCameraPhase?: BattleCameraPhase;
  onPackClicked?: () => void;
}

function createPackCoverTexture(
  title: string,
  primaryHex: string,
  secondaryHex: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 700;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 512, 700);
  grad.addColorStop(0, '#0F1424');
  grad.addColorStop(0.45, '#191233');
  grad.addColorStop(1, '#090A12');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 700);

  ctx.save();
  ctx.strokeStyle = primaryHex;
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = 18;
  for (let i = -400; i < 900; i += 56) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 360, 700);
    ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle = primaryHex;
  ctx.lineWidth = 10;
  ctx.strokeRect(22, 22, 468, 656);

  ctx.strokeStyle = secondaryHex;
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 36, 440, 628);

  ctx.fillStyle = primaryHex;
  ctx.fillRect(116, 56, 280, 42);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 22px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('IDOL POCKET 3D', 256, 85);

  const rad = ctx.createRadialGradient(256, 320, 20, 256, 320, 175);
  rad.addColorStop(0, primaryHex);
  rad.addColorStop(0.55, secondaryHex);
  rad.addColorStop(1, 'rgba(15,20,36,0)');
  ctx.fillStyle = rad;
  ctx.beginPath();
  ctx.arc(256, 320, 175, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(256, 315);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 95 : 42;
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#FBBF24';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 32px Outfit, sans-serif';
  ctx.fillText(title.toUpperCase(), 256, 515);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '700 18px sans-serif';
  ctx.fillText('5 FULL-ART SELCA PHOTOCARDS', 256, 555);

  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(136, 585, 240, 44);
  ctx.fillStyle = '#FBBF24';
  ctx.font = '700 16px monospace';
  ctx.fillText('OFFICIAL STAGE FOIL', 256, 613);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createMiniCardTexture(accentHex: string, label: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 256, 384);
  grad.addColorStop(0, accentHex);
  grad.addColorStop(0.6, '#15192B');
  grad.addColorStop(1, '#090A0F');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 384);

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 236, 364);

  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.arc(128, 130, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(128, 265, 78, Math.PI, 0, false);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, 128, 330);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const ThreeStage: React.FC<ThreeStageProps> = ({
  mode,
  bannerTitle = 'NEXT WAVE 2024–2026',
  bannerColor,
  secondaryColor,
  packRipState,
  cameraTrauma = 0,
  battleCameraPhase = 'idle',
  onPackClicked,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    mode,
    bannerTitle,
    bannerColor,
    secondaryColor,
    packRipState,
    cameraTrauma,
    battleCameraPhase,
    onPackClicked,
  });

  useEffect(() => {
    stateRef.current = {
      mode,
      bannerTitle,
      bannerColor,
      secondaryColor,
      packRipState,
      cameraTrauma,
      battleCameraPhase,
      onPackClicked,
    };
  }, [
    mode,
    bannerTitle,
    bannerColor,
    secondaryColor,
    packRipState,
    cameraTrauma,
    battleCameraPhase,
    onPackClicked,
  ]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090a0f);
    scene.fog = new THREE.FogExp2(0x090a0f, 0.045);

    const camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.9, 7.6);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isHeadless,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    if (!isHeadless) {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    }

    // 3-Point Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x9ec5ff, 0x1b1528, 1.1);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e6, 2.2);
    keyLight.position.set(4, 7, 6);
    if (!isHeadless) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xff4fa3, 4.2, 18);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    const accentLight = new THREE.PointLight(0x38bdf8, 3.8, 18);
    accentLight.position.set(4, 2, -2);
    scene.add(accentLight);

    // 1. Concert Stage Pedestal Group
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(0, -1.95, 0);
    scene.add(pedestalGroup);

    const baseDeckMat = new THREE.MeshStandardMaterial({
      color: 0x121626,
      roughness: 0.35,
      metalness: 0.45,
    });
    const baseDeck = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.1, 0.34, 48), baseDeckMat);
    pedestalGroup.add(baseDeck);

    const innerStageMat = new THREE.MeshStandardMaterial({
      color: 0x1b2138,
      roughness: 0.2,
      metalness: 0.55,
    });
    const innerStage = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.65, 0.12, 48),
      innerStageMat
    );
    innerStage.position.y = 0.22;
    pedestalGroup.add(innerStage);

    const neonRingMat = new THREE.MeshBasicMaterial({ color: 0xff4fa3 });
    const neonRing = new THREE.Mesh(new THREE.TorusGeometry(2.58, 0.035, 16, 64), neonRingMat);
    neonRing.rotation.x = Math.PI / 2;
    neonRing.position.y = 0.27;
    pedestalGroup.add(neonRing);

    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.5,
    });
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.02, 12, 64), outerRingMat);
    outerRing.rotation.x = Math.PI / 2;
    outerRing.position.y = 0.19;
    pedestalGroup.add(outerRing);

    // 1b. 3D Concert Battle Stage Laser Pillars & Halo Arch (Visible during Battle Mode)
    const battleArenaGroup = new THREE.Group();
    battleArenaGroup.visible = false;
    pedestalGroup.add(battleArenaGroup);

    const pillarGeo = new THREE.CylinderGeometry(0.06, 0.06, 4.8, 12);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0xff4fa3,
      transparent: true,
      opacity: 0.55,
    });
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(Math.cos(ang) * 3.35, 2.4, Math.sin(ang) * 3.35);
      battleArenaGroup.add(pillar);
    }

    const battleHaloRing = new THREE.Mesh(
      new THREE.TorusGeometry(3.35, 0.04, 16, 64),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 })
    );
    battleHaloRing.rotation.x = Math.PI / 2;
    battleHaloRing.position.y = 3.2;
    battleArenaGroup.add(battleHaloRing);

    const contactShadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.45, 32),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.295;
    pedestalGroup.add(contactShadow);

    // 2. Hero 3D Foil Booster Pack
    const packGroup = new THREE.Group();
    packGroup.position.set(0, 0.12, 0);
    packGroup.scale.setScalar(0.68);
    scene.add(packGroup);

    const packShape = new THREE.Shape();
    const pw = 1.15;
    const ph = 1.58;
    const pr = 0.12;
    packShape.moveTo(-pw + pr, -ph);
    packShape.lineTo(pw - pr, -ph);
    packShape.quadraticCurveTo(pw, -ph, pw, -ph + pr);
    packShape.lineTo(pw, ph - pr);
    packShape.quadraticCurveTo(pw, ph, pw - pr, ph);
    packShape.lineTo(-pw + pr, ph);
    packShape.quadraticCurveTo(-pw, ph, -pw, ph - pr);
    packShape.lineTo(-pw, -ph + pr);
    packShape.quadraticCurveTo(-pw, -ph, -pw + pr, -ph);

    const packExtrudeGeo = new THREE.ExtrudeGeometry(packShape, {
      depth: 0.2,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.07,
      bevelThickness: 0.08,
    });
    packExtrudeGeo.center();

    const packFoilMat = new THREE.MeshStandardMaterial({
      color: 0xff4fa3,
      metalness: isHeadless ? 0.25 : 0.82,
      roughness: 0.22,
    });

    const packBodyMesh = new THREE.Mesh(packExtrudeGeo, packFoilMat);
    packGroup.add(packBodyMesh);

    let currentBannerTitle = stateRef.current.bannerTitle;
    const coverTex = createPackCoverTexture(
      currentBannerTitle,
      stateRef.current.bannerColor,
      stateRef.current.secondaryColor
    );
    coverTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const coverPlateMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: coverTex,
      roughness: 0.24,
      metalness: 0.18,
    });
    const coverPlate = new THREE.Mesh(new THREE.PlaneGeometry(2.08, 2.92), coverPlateMat);
    coverPlate.position.z = 0.19;
    packGroup.add(coverPlate);

    const backPlate = new THREE.Mesh(new THREE.PlaneGeometry(2.08, 2.92), coverPlateMat);
    backPlate.rotation.y = Math.PI;
    backPlate.position.z = -0.19;
    packGroup.add(backPlate);

    // Top Crimped Foil Tear Strip
    const topSealGroup = new THREE.Group();
    topSealGroup.position.set(0, 1.76, 0);
    packGroup.add(topSealGroup);

    const crimpMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: isHeadless ? 0.25 : 0.85,
      roughness: 0.25,
    });
    const topSealBar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.24, 0.08), crimpMat);
    topSealGroup.add(topSealBar);

    const tearLineMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const tearLine = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.04, 0.11), tearLineMat);
    tearLine.position.y = -0.13;
    topSealGroup.add(tearLine);

    const bottomSealBar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 0.08), crimpMat);
    bottomSealBar.position.set(0, -1.74, 0);
    packGroup.add(bottomSealBar);

    // 3. Background Arch of Floating 3D Photocards
    const bgCardsGroup = new THREE.Group();
    bgCardsGroup.position.set(0, 0.25, -1.65);
    scene.add(bgCardsGroup);

    const cardMeshes: THREE.Mesh[] = [];
    const cardGeo = new THREE.BoxGeometry(0.88, 1.32, 0.03);
    const sampleGroups = [
      { hex: '#FF4FA3', name: 'IVE' },
      { hex: '#38BDF8', name: 'NewJeans' },
      { hex: '#A855F7', name: 'aespa' },
      { hex: '#FBBF24', name: 'KiiiKiii' },
      { hex: '#10B981', name: 'RESCENE' },
    ];

    for (let i = 0; i < 5; i++) {
      const item = sampleGroups[i];
      const tex = createMiniCardTexture(item.hex, item.name);
      const cMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: tex,
        roughness: 0.25,
        metalness: 0.2,
      });
      const mesh = new THREE.Mesh(cardGeo, cMat);
      const spread = (i - 2) * 1.35;
      mesh.position.set(spread, Math.abs(i - 2) * -0.18 + 0.3, -Math.abs(i - 2) * 0.45);
      mesh.rotation.z = (2 - i) * 0.11;
      mesh.rotation.y = (2 - i) * 0.16;
      bgCardsGroup.add(mesh);
      cardMeshes.push(mesh);
    }

    // 4. Pooled InstancedMesh Stage Particles (32 Sparkles)
    const PARTICLE_COUNT = 32;
    const particleGeo = new THREE.OctahedronGeometry(0.055, 0);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const particleInstanced = new THREE.InstancedMesh(particleGeo, particleMat, PARTICLE_COUNT);
    particleInstanced.frustumCulled = false;
    scene.add(particleInstanced);

    const particleData = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      angle: (i / PARTICLE_COUNT) * Math.PI * 2,
      radius: 2.1 + (i % 6) * 0.45,
      y: -1.4 + (i % 8) * 0.42,
      speed: 0.25 + (i % 5) * 0.1,
      scale: 0.55 + (i % 4) * 0.25,
    }));

    const dummyObj = new THREE.Object3D();
    const scratchColorPrimary = new THREE.Color();
    const scratchColorSecondary = new THREE.Color();

    let pointerX = 0;
    let pointerY = 0;
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();

    const onPointerMove = (e: PointerEvent) => {
      pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      pointerY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (stateRef.current.mode !== 'pack' || stateRef.current.packRipState !== 'idle') return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseVec, camera);
      const hits = raycaster.intersectObjects([packBodyMesh, coverPlate], false);
      if (hits.length > 0 && stateRef.current.onPackClicked) {
        stateRef.current.onPackClicked();
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    renderer.compile(scene, camera);

    const clock = new THREE.Clock();
    let animId = 0;
    let headlessTimer: ReturnType<typeof setInterval> | null = null;
    let currentCamX = 0;
    let currentCamY = 0.85;
    let currentCamZ = 7.4;

    const stepFrame = () => {
      const dt = Math.min(clock.getDelta(), 0.05) || 0.033;
      const elapsed = clock.getElapsedTime();
      const st = stateRef.current;
      const isDesktop = window.innerWidth >= 900;

      if (st.bannerTitle !== currentBannerTitle) {
        currentBannerTitle = st.bannerTitle;
        const newTex = createPackCoverTexture(
          currentBannerTitle,
          st.bannerColor,
          st.secondaryColor
        );
        coverPlateMat.map?.dispose();
        coverPlateMat.map = newTex;
        coverPlateMat.needsUpdate = true;
      }

      scratchColorPrimary.set(st.bannerColor || '#FF4FA3');
      scratchColorSecondary.set(st.secondaryColor || '#38BDF8');
      packFoilMat.color.lerp(scratchColorPrimary, 1 - Math.exp(-6 * dt));
      neonRingMat.color.lerp(scratchColorPrimary, 1 - Math.exp(-6 * dt));
      rimLight.color.lerp(scratchColorPrimary, 1 - Math.exp(-6 * dt));
      accentLight.color.lerp(scratchColorSecondary, 1 - Math.exp(-6 * dt));

      let targetCamX = pointerX * 0.35;
      let targetCamY = 0.55 + pointerY * 0.18;
      let targetCamZ = isDesktop ? 6.6 : 8.2;
      let targetPackX = 0;

      battleArenaGroup.visible = st.mode === 'battle';

      if (st.mode === 'title') {
        targetPackX = isDesktop ? 1.55 : 0;
        pedestalGroup.position.x = THREE.MathUtils.damp(
          pedestalGroup.position.x,
          targetPackX,
          5,
          dt
        );
        bgCardsGroup.position.x = THREE.MathUtils.damp(
          bgCardsGroup.position.x,
          targetPackX,
          5,
          dt
        );
        packGroup.visible = true;
        bgCardsGroup.visible = true;
      } else if (st.mode === 'pack') {
        targetPackX = 0;
        pedestalGroup.position.x = THREE.MathUtils.damp(pedestalGroup.position.x, 0, 6, dt);
        bgCardsGroup.position.x = THREE.MathUtils.damp(bgCardsGroup.position.x, 0, 6, dt);
        targetCamZ = st.packRipState === 'opened' ? 8.0 : isDesktop ? 6.4 : 7.8;
        packGroup.visible = st.packRipState !== 'opened';
        bgCardsGroup.visible = st.packRipState === 'idle';
      } else if (st.mode === 'battle') {
        // Dynamic 3D Concert Battle Camera Choreography
        pedestalGroup.position.x = THREE.MathUtils.damp(pedestalGroup.position.x, 0, 6, dt);
        packGroup.visible = false;
        bgCardsGroup.visible = false;
        battleArenaGroup.rotation.y = elapsed * 0.35;

        if (st.battleCameraPhase === 'ultimate') {
          targetCamX = Math.sin(elapsed * 4.5) * 1.4;
          targetCamY = 0.45;
          targetCamZ = 5.2;
        } else if (st.battleCameraPhase === 'ally_attack') {
          targetCamX = -0.85;
          targetCamY = 1.05;
          targetCamZ = 6.1;
        } else if (st.battleCameraPhase === 'enemy_attack') {
          targetCamX = 0.85;
          targetCamY = 1.75;
          targetCamZ = 7.5;
        } else {
          targetCamX = Math.sin(elapsed * 0.65) * 0.75 + pointerX * 0.3;
          targetCamY = 1.35 + Math.cos(elapsed * 0.5) * 0.15;
          targetCamZ = 6.9;
        }
      } else {
        pedestalGroup.position.x = THREE.MathUtils.damp(pedestalGroup.position.x, 0, 6, dt);
        bgCardsGroup.position.x = THREE.MathUtils.damp(bgCardsGroup.position.x, 0, 6, dt);
        targetCamZ = 8.4;
        targetCamY = 1.6;
        packGroup.visible = false;
        bgCardsGroup.visible = false;
      }

      currentCamX = THREE.MathUtils.damp(currentCamX, targetCamX, 5.5, dt);
      currentCamY = THREE.MathUtils.damp(currentCamY, targetCamY, 5.5, dt);
      currentCamZ = THREE.MathUtils.damp(currentCamZ, targetCamZ, 5.5, dt);

      const shake = st.cameraTrauma ? st.cameraTrauma * st.cameraTrauma * 0.26 : 0;
      camera.position.set(
        currentCamX + (shake ? (Math.random() - 0.5) * shake : 0),
        currentCamY + (shake ? (Math.random() - 0.5) * shake : 0),
        currentCamZ
      );
      camera.lookAt(0, 0.1, 0);

      if (packGroup.visible) {
        packGroup.position.x = THREE.MathUtils.damp(packGroup.position.x, targetPackX, 6, dt);
        if (st.packRipState === 'ripping') {
          packGroup.rotation.y = Math.sin(elapsed * 42) * 0.18;
          packGroup.position.y = THREE.MathUtils.damp(packGroup.position.y, 0.32, 8, dt);
          topSealGroup.position.y = THREE.MathUtils.damp(topSealGroup.position.y, 3.0, 7, dt);
          topSealGroup.position.x = THREE.MathUtils.damp(topSealGroup.position.x, 1.3, 7, dt);
          topSealGroup.rotation.z = THREE.MathUtils.damp(topSealGroup.rotation.z, -0.6, 7, dt);
        } else {
          topSealGroup.position.set(0, 1.76, 0);
          topSealGroup.rotation.set(0, 0, 0);
          packGroup.position.y = 0.12 + Math.sin(elapsed * 2.0) * 0.09;
          const desiredRotY =
            st.mode === 'title'
              ? Math.sin(elapsed * 0.7) * 0.38 + pointerX * 0.35
              : pointerX * 0.55;
          const desiredRotX = -pointerY * 0.22;
          packGroup.rotation.y = THREE.MathUtils.damp(packGroup.rotation.y, desiredRotY, 6, dt);
          packGroup.rotation.x = THREE.MathUtils.damp(packGroup.rotation.x, desiredRotX, 6, dt);
        }
      }

      if (bgCardsGroup.visible) {
        for (let i = 0; i < cardMeshes.length; i++) {
          const m = cardMeshes[i];
          const baseOffset = Math.abs(i - 2) * -0.18 + 0.3;
          m.position.y = baseOffset + Math.sin(elapsed * 1.8 + i * 0.9) * 0.1;
        }
      }

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particleData[i];
        p.angle += p.speed * dt * (st.mode === 'battle' ? 1.8 : 1.0);
        p.y += p.speed * 0.5 * dt * (st.mode === 'battle' ? 1.6 : 1.0);
        if (p.y > 2.6) p.y = -1.6;

        dummyObj.position.set(
          pedestalGroup.position.x + Math.cos(p.angle) * p.radius,
          p.y,
          Math.sin(p.angle) * p.radius
        );
        dummyObj.rotation.set(elapsed + i, elapsed * 1.2, 0);
        dummyObj.scale.setScalar(p.scale);
        dummyObj.updateMatrix();
        particleInstanced.setMatrixAt(i, dummyObj.matrix);
      }
      particleInstanced.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);
    };

    if (isHeadless) {
      stepFrame();
      headlessTimer = setInterval(stepFrame, 250);
    } else {
      const loop = () => {
        animId = requestAnimationFrame(loop);
        stepFrame();
      };
      animId = requestAnimationFrame(loop);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (headlessTimer) clearInterval(headlessTimer);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      coverTex.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="three-stage-canvas"
      className="fixed inset-0 z-0 overflow-hidden pointer-events-auto"
    />
  );
};
