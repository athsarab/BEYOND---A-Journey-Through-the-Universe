import React, { Component, Suspense, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'

// --- SCIENTIFIC DATA & APPROXIMATIONS ---
// Sources: Hipparcos Astrometry Catalog (van Leeuwen 2007), CHARA Array interferometric angular diameter,
// Moravveji et al. (2012) asteroseismic analysis of Rigel (Beta Orionis).
const STAR_DATA = {
  name: 'Rigel',
  designation: 'β Orionis (Beta Orionis)',
  constellation: 'Orion',
  spectralType: 'B8 Ia',
  classification: 'Blue-White Supergiant',
  temperature: {
    value: '~12,100 K',
    relativeSun: '2.1× hotter than Sun (5,778 K)',
    note: 'Effective surface temperature based on high-resolution spectrophotometry. Atmospheric pulsation causes slight regional fluctuations between 11,500 K and 12,500 K.',
  },
  radius: {
    value: '~74.1 R☉',
    relativeSun: '74.1 times solar radius (~51.5 million km / 0.34 AU)',
    note: 'Derived from interferometric angular diameter measurements (2.75 ± 0.10 mas). If placed at the center of our solar system, Rigel would engulf Mercury and extend across 70% of the distance to Venus.',
  },
  distance: {
    value: '~860 light-years',
    relativeSun: '~260 parsecs / ~8.14 × 10¹⁵ km',
    note: 'Estimated from Hipparcos parallax re-reduction (π = 3.78 ± 0.34 mas). Due to surface convection jitter and vast atmospheric extent, distance carries an observational uncertainty of approximately ±80 light-years.',
  },
  mass: {
    value: '~21 M☉',
    relativeSun: '21 times the Sun’s mass',
    note: 'Theoretical stellar evolution models estimate initial zero-age main sequence mass around 24 M☉, with ~3 M☉ lost to stellar winds.',
  },
  luminosity: {
    value: '~120,000 L☉',
    relativeSun: 'Over 100,000× more luminous than the Sun',
    note: 'Total bolometric luminosity including massive ultraviolet emissions. Rigel radiates more energy in 4 minutes than our Sun produces in an entire year.',
  },
}

const FACTS = [
  {
    id: 'classification',
    label: 'Spectral Class',
    value: STAR_DATA.spectralType,
    badge: 'Supergiant',
    annotationId: 'photosphere',
    headline: 'Harvard Spectral Type B8 Ia',
    explanation:
      'Rigel is classified as a B8 Ia supergiant. The "B8" designation reflects a surface dominated by neutral helium and singly ionized silicon, generating its intense blue-white radiance. The luminosity class "Ia" denotes an exceptionally bright, high-mass supergiant experiencing severe radiation pressure.',
    scientificSource: 'Harvard Spectral Classification & MK System',
  },
  {
    id: 'temperature',
    label: 'Surface Temp',
    value: STAR_DATA.temperature.value,
    badge: '2.1× the Sun',
    annotationId: 'photosphere',
    headline: 'Effective Temperature ~12,100 K',
    explanation:
      'Rigel’s visible surface radiates at roughly 12,100 Kelvin—more than double the Sun’s 5,778 K. According to Wien’s displacement law, this high temperature pushes its peak radiation into the near-ultraviolet spectrum, rendering the star an icy, luminous blue-white to human eyes.',
    scientificSource: 'Moravveji et al. (2012) High-Resolution Spectroscopy',
  },
  {
    id: 'radius',
    label: 'Stellar Radius',
    value: STAR_DATA.radius.value,
    badge: '51.5M km',
    annotationId: 'corona',
    headline: 'Physical Radius of ~74.1 Solar Radii',
    explanation:
      'With an estimated diameter of over 103 million kilometers, Rigel is enormous. If substituted for our Sun, its scorching surface would swallow Mercury whole and scorch Venus. Because supergiants have diffuse, pulsating atmospheres, this radius is an astronomical average rather than a rigid boundary.',
    scientificSource: 'CHARA Array Interferometry & Hipparcos Angular Diameter',
  },
  {
    id: 'distance',
    label: 'Distance from Earth',
    value: STAR_DATA.distance.value,
    badge: '260 pc',
    annotationId: 'wind',
    headline: 'Approx. 860 Light-Years from Earth',
    explanation:
      'Rigel sits in the Orion constellation roughly 860 light-years (260 parsecs) away. The light reaching your eyes tonight began its interstellar journey during the Middle Ages. Due to the star’s immense distance and convective surface wobbles, astrometric parallax measurements carry a scientific uncertainty of ±10%.',
    scientificSource: 'Hipparcos Astrometry Satellite (van Leeuwen 2007)',
  },
  {
    id: 'luminosity',
    label: 'Bolometric Power',
    value: STAR_DATA.luminosity.value,
    badge: '120,000 L☉',
    annotationId: 'core',
    headline: 'Luminosity ~120,000 Times the Sun',
    explanation:
      'Accounting for both visible and invisible ultraviolet photons (bolometric luminosity), Rigel outputs over 120,000 times the total power of the Sun. In just a few minutes, Rigel expends enough thermonuclear energy to sustain humanity for millions of years.',
    scientificSource: 'Przybilla et al. Quantitative Spectral Analysis',
  },
]

const ANNOTATIONS = [
  {
    id: 'photosphere',
    title: 'Convective Photosphere',
    label: 'Photosphere (~12,100 K)',
    position: [0.92, 0.65, 0.98],
    factId: 'temperature',
    summary: 'The visible optical surface features enormous supersonic convective granules driven by extreme radiative heating.',
  },
  {
    id: 'wind',
    title: 'Radiation-Driven Wind',
    label: 'Stellar Wind Outflow',
    position: [-1.15, 1.05, 0.72],
    factId: 'classification',
    summary: 'Intense ultraviolet radiation pushes an outflowing stellar wind, expelling roughly 10⁻⁶ solar masses into space each year.',
  },
  {
    id: 'core',
    title: 'Thermonuclear Core',
    label: 'Core Fusion Zone',
    position: [0.0, -0.25, 1.45],
    factId: 'luminosity',
    summary: 'Deep inside, hydrogen fuel is depleted. The core is contracting and burning helium under staggering gravitational pressure.',
  },
  {
    id: 'corona',
    title: 'Circumstellar Envelope',
    label: 'Extended Atmosphere',
    position: [-1.02, -0.92, 0.8],
    factId: 'radius',
    summary: 'A diffuse, pulsating envelope extending to 74 solar radii, producing delicate atmospheric limb glow.',
  },
]

// --- PROCEDURAL GLSL SHADERS ---

// Rigel's photorealistic photosphere shader:
// Simplex 3D noise (Stefan Gustavson), domain warping, B8 Ia spectral colors, and physical Eddington limb darkening.
const STAR_SURFACE_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`

const STAR_SURFACE_FRAGMENT = `
  uniform float uTime;
  uniform vec3 uColorBase;
  uniform vec3 uColorMid;
  uniform vec3 uColorHot;
  uniform vec3 uColorCool;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewPosition;

  vec4 permute(vec4 x){ return mod(((x * 34.0) + 1.0) * x, 289.0); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  void main() {
    // Spherical normalized coordinates guarantee zero polar seam or distortion
    vec3 p = normalize(vPosition);
    float t = uTime * 0.045;

    // Convective turbulence: large cells, warped granulation, and fine filament currents
    float n1 = snoise(p * 2.6 + vec3(0.0, t * 0.5, 0.0));
    vec3 warp = vec3(n1 * 0.32);
    float n2 = snoise((p + warp) * 6.2 - vec3(t * 0.35, 0.0, t * 0.25));
    float n3 = snoise((p * 14.0 + vec3(t * 0.7, -t * 0.45, 0.0)));

    float turbulence = n1 * 0.52 + n2 * 0.36 + n3 * 0.12;
    turbulence = clamp(turbulence * 0.5 + 0.5, 0.0, 1.0);

    // Physical Eddington stellar limb darkening:
    // Grazing angle rays emerge from cooler outer layers of the photosphere.
    vec3 viewDir = normalize(vViewPosition);
    float mu = clamp(dot(normalize(vNormal), viewDir), 0.0, 1.0);
    float limbDarkening = 0.50 + 0.50 * pow(mu, 0.68);

    // True B8 Ia spectral color distribution
    vec3 plasmaColor;
    if (turbulence < 0.42) {
      plasmaColor = mix(uColorCool, uColorBase, turbulence / 0.42);
    } else if (turbulence < 0.80) {
      plasmaColor = mix(uColorBase, uColorMid, (turbulence - 0.42) / 0.38);
    } else {
      plasmaColor = mix(uColorMid, uColorHot, (turbulence - 0.80) / 0.20);
    }

    vec3 finalColor = plasmaColor * limbDarkening;

    // Atmospheric ionization rim: subtle glancing edge glow
    float rim = pow(1.0 - mu, 3.6) * 0.65;
    finalColor += vec3(0.68, 0.86, 1.0) * rim;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

// Atmospheric corona sheath shader
const CORONA_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`

const CORONA_FRAGMENT = `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float rim = 1.0 - abs(dot(normalize(vNormal), viewDir));
    float corona = pow(rim, 2.7) * 0.55;
    corona *= (0.94 + 0.06 * sin(uTime * 1.4));
    gl_FragColor = vec4(vec3(0.65, 0.85, 1.0) * corona, corona);
  }
`

// --- 3D SCENE COMPONENTS ---

// 1. Massive Star Mesh & Shaders
function MassiveStar({ comparison, annotations, selectedAnnotationId, onSelectAnnotation }) {
  const meshRef = useRef(null)
  const coronaRef = useRef(null)

  const surfaceMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorCool: { value: new THREE.Color('#1f3e70') },
        uColorBase: { value: new THREE.Color('#4d8bee') },
        uColorMid: { value: new THREE.Color('#94c8ff') },
        uColorHot: { value: new THREE.Color('#ffffff') },
      },
      vertexShader: STAR_SURFACE_VERTEX,
      fragmentShader: STAR_SURFACE_FRAGMENT,
    })
  }, [])

  const coronaMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: CORONA_VERTEX,
      fragmentShader: CORONA_FRAGMENT,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    })
  }, [])

  useEffect(() => {
    return () => {
      surfaceMaterial.dispose()
      coronaMaterial.dispose()
    }
  }, [surfaceMaterial, coronaMaterial])

  useFrame((state, delta) => {
    if (surfaceMaterial.uniforms) {
      surfaceMaterial.uniforms.uTime.value += delta
    }
    if (coronaMaterial.uniforms) {
      coronaMaterial.uniforms.uTime.value += delta
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.04
    }
  })

  // In comparison mode, Rigel shifts slightly to the left so the Sun fits beside it
  const targetX = comparison ? -0.85 : 0
  const starRadius = 1.42

  return (
    <group position={[targetX, 0, 0]}>
      {/* Core Photosphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[starRadius, 64, 64]} />
        <primitive object={surfaceMaterial} attach="material" />
      </mesh>

      {/* Atmospheric Corona Sheath */}
      <mesh ref={coronaRef} scale={1.055}>
        <sphereGeometry args={[starRadius, 48, 48]} />
        <primitive object={coronaMaterial} attach="material" />
      </mesh>

      {/* Outer Ethereal Halo */}
      <mesh scale={1.22}>
        <sphereGeometry args={[starRadius, 32, 32]} />
        <meshBasicMaterial
          color="#82bfff"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Educational Annotations */}
      {annotations && !comparison && (
        <group>
          {ANNOTATIONS.map((annotation) => {
            const isSelected = selectedAnnotationId === annotation.id
            return (
              <AnnotationPin
                key={annotation.id}
                annotation={annotation}
                isSelected={isSelected}
                onSelect={() => onSelectAnnotation(annotation)}
              />
            )
          })}
        </group>
      )}
    </group>
  )
}

// 2. Interactive 3D Annotation Pin
function AnnotationPin({ annotation, isSelected, onSelect }) {
  const [hovered, setHovered] = useState(false)
  const pinRef = useRef(null)

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [])

  useFrame((state) => {
    if (pinRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3 + annotation.position[0]) * 0.12
      pinRef.current.scale.set(scale, scale, scale)
    }
  })

  return (
    <group position={annotation.position}>
      {/* 3D clickable beacon */}
      <mesh
        ref={pinRef}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <sphereGeometry args={[0.038, 16, 16]} />
        <meshBasicMaterial
          color={isSelected ? '#ffffff' : hovered ? '#9bd2ff' : '#64b2ff'}
        />
      </mesh>

      {/* Concentric beacon pulse ring */}
      <mesh>
        <ringGeometry args={[0.05, 0.065, 24]} />
        <meshBasicMaterial
          color={isSelected ? '#ffffff' : '#64b2ff'}
          transparent
          opacity={isSelected ? 0.8 : hovered ? 0.6 : 0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Crisp HTML Label attached to the 3D pin */}
      <Html
        center
        distanceFactor={6.8}
        position={[0, 0.12, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className={`star-pin-tag ${isSelected ? 'star-pin-tag--active' : ''} ${
            hovered ? 'star-pin-tag--hover' : ''
          }`}
          role="button"
          tabIndex={0}
          aria-label={annotation.title}
        >
          <span className="star-pin-tag__dot" />
          <span className="star-pin-tag__label">{annotation.label}</span>
        </div>
      </Html>
    </group>
  )
}

// 3. Scientifically Scaled Solar Comparison Object
function SolarComparisonObject({ comparison }) {
  if (!comparison) return null

  // Rigel radius is 1.42 units = 74.1 R☉.
  // The Sun's true proportional radius is 1.42 / 74.1 ≈ 0.0191 units!
  const sunRadius = 1.42 / 74.1
  const sunPosition = [1.95, 0, 0]

  return (
    <group position={sunPosition}>
      {/* True-scale Sun sphere */}
      <mesh>
        <sphereGeometry args={[sunRadius, 32, 32]} />
        <meshStandardMaterial
          color="#ffeb99"
          emissive="#ffa834"
          emissiveIntensity={3.2}
          roughness={0.2}
        />
      </mesh>

      {/* Subtle solar illumination */}
      <pointLight color="#ffe8a3" intensity={1.5} distance={2.5} />

      {/* Solar targeting beacon & locator ring */}
      <mesh rotation={[0, 0, 0]}>
        <ringGeometry args={[0.045, 0.055, 32]} />
        <meshBasicMaterial
          color="#ffcc66"
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Scale Callout */}
      <Html center position={[0, 0.28, 0]} distanceFactor={6.5}>
        <div className="sun-scale-badge" role="status">
          <span className="sun-scale-badge__title">The Sun</span>
          <span className="sun-scale-badge__desc">1 R☉ · 1.39M km</span>
          <span className="sun-scale-badge__sub">~74× smaller diameter</span>
        </div>
      </Html>
    </group>
  )
}

// 4. Multi-Layered Deep Cosmic Starfield
function StarfieldBackground() {
  const pointsRef = useRef(null)

  const { positions, colors } = useMemo(() => {
    const count = 750
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const colorWhite = new THREE.Color('#eaf2fc')
    const colorCyan = new THREE.Color('#94c4f7')
    const colorAmber = new THREE.Color('#ffe2b8')

    for (let i = 0; i < count; i++) {
      // Distribute randomly in a spherical shell around the camera (r = 30 to 75)
      const radius = 30 + Math.random() * 45
      const theta = 2 * Math.PI * Math.random()
      const phi = Math.acos(2 * Math.random() - 1)

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = radius * Math.cos(phi)

      const rand = Math.random()
      let c = colorWhite
      if (rand < 0.25) c = colorCyan
      else if (rand < 0.40) c = colorAmber

      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }

    return { positions: pos, colors: col }
  }, [])

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.002
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.16}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

// 5. Camera & Orbit Controller with Smooth Transitions
function CameraController({ comparison, controlsRef, autoRotate }) {
  const { camera } = useThree()
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0))

  useFrame((state, delta) => {
    // Smoothly reframe when transitioning between solo and comparison modes
    const desiredX = comparison ? 0.55 : 0
    const desiredZ = comparison ? 6.2 : 4.8

    targetLookAt.current.x = THREE.MathUtils.damp(targetLookAt.current.x, desiredX, 4, delta)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, desiredZ, 3.5, delta)

    if (controlsRef.current) {
      controlsRef.current.target.x = targetLookAt.current.x
      controlsRef.current.update()
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableDamping
      dampingFactor={0.06}
      minDistance={2.6}
      maxDistance={8.0}
      rotateSpeed={0.55}
      zoomSpeed={0.65}
      autoRotate={autoRotate}
      autoRotateSpeed={0.5}
      touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
    />
  )
}

// 6. Complete 3D Star Scene
function StarScene({
  comparison,
  annotations,
  selectedAnnotationId,
  onSelectAnnotation,
  controlsRef,
  autoRotate,
}) {
  return (
    <>
      <color attach="background" args={['#030509']} />
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 0, 0]} intensity={2.5} color="#dbeeff" distance={15} />
      <directionalLight position={[5, 4, 6]} intensity={1.5} color="#ecf4ff" />
      <directionalLight position={[-6, -3, -4]} intensity={0.5} color="#4878a8" />

      <StarfieldBackground />

      <MassiveStar
        comparison={comparison}
        annotations={annotations}
        selectedAnnotationId={selectedAnnotationId}
        onSelectAnnotation={onSelectAnnotation}
      />

      <SolarComparisonObject comparison={comparison} />

      <CameraController
        comparison={comparison}
        controlsRef={controlsRef}
        autoRotate={autoRotate}
      />
    </>
  )
}

// 7. Accessible Static Fallback (for WebGL failure or disabled context)
function StaticFallback({ comparison, selectedFact, onSelectFact, facts }) {
  return (
    <div
      className="star-fallback"
      role="region"
      aria-label="Accessible 2D scientific visualization of Rigel"
    >
      <div className="star-fallback__notice">
        <span className="star-fallback__badge">Accessible 2D Mode</span>
        <p>Interactive 3D WebGL is unavailable on this device. Displaying full scientific visualization and data below.</p>
      </div>

      <div className="star-fallback__diagram">
        {/* SVG Diagram representing Rigel's convection and scale */}
        <svg viewBox="0 0 400 400" className="star-fallback__svg" aria-label="Diagram of Rigel with convection granulation">
          <defs>
            <radialGradient id="rigelGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#94c8ff" />
              <stop offset="70%" stopColor="#4d8bee" />
              <stop offset="90%" stopColor="#1f3e70" />
              <stop offset="100%" stopColor="#030509" stopOpacity="0" />
            </radialGradient>
            <filter id="coronaBlur">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>

          {/* Outer corona */}
          <circle cx="200" cy="200" r="160" fill="rgba(148, 200, 255, 0.12)" filter="url(#coronaBlur)" />
          {/* Stellar Photosphere */}
          <circle cx="200" cy="200" r="130" fill="url(#rigelGlow)" />

          {/* Scale comparison element if active */}
          {comparison && (
            <g transform="translate(355, 200)">
              <circle cx="0" cy="0" r="2" fill="#ffcc00" />
              <circle cx="0" cy="0" r="8" fill="none" stroke="#ffcc00" strokeDasharray="2,2" opacity="0.8" />
              <text x="0" y="24" fill="#ffcc00" fontSize="10" textAnchor="middle">
                Sun (1 R☉)
              </text>
            </g>
          )}

          <text x="200" y="200" fill="#ffffff" fontSize="15" textAnchor="middle" fontFamily="sans-serif" opacity="0.9">
            Rigel (74.1 R☉)
          </text>
          <text x="200" y="222" fill="#d0e4ff" fontSize="11" textAnchor="middle" fontFamily="sans-serif" opacity="0.75">
            ~12,100 K · B8 Ia
          </text>
        </svg>
      </div>

      <div className="star-fallback__facts" aria-label="Star facts in accessible mode">
        <div className="star-fallback__fact-tabs" role="tablist" aria-label="Select a Rigel property">
          {facts.map((fact) => (
            <button
              key={fact.id}
              type="button"
              role="tab"
              aria-selected={selectedFact.id === fact.id}
              className={selectedFact.id === fact.id ? 'star-fallback__fact-tab star-fallback__fact-tab--active' : 'star-fallback__fact-tab'}
              onClick={() => onSelectFact(fact)}
            >
              {fact.label}
            </button>
          ))}
        </div>
        <div className="star-fallback__fact-detail" aria-live="polite">
          <strong>{selectedFact.headline}</strong>
          <p>{selectedFact.explanation}</p>
        </div>
      </div>
    </div>
  )
}

// 8. Robust Error Boundary
class WebglErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.warn('WebGL Rendering Error caught by boundary:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

// --- MAIN STAR EXPLORER COMPONENT ---
export default function StarExplorer() {
  const [webglSupported, setWebglSupported] = useState(null)
  const [comparison, setComparison] = useState(false)
  const [annotations, setAnnotations] = useState(true)
  const [selectedFact, setSelectedFact] = useState(FACTS[0])
  const [selectedAnnotationId, setSelectedAnnotationId] = useState('photosphere')
  const [autoRotate, setAutoRotate] = useState(true)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [zoomNotification, setZoomNotification] = useState('')

  const controlsRef = useRef(null)
  const containerRef = useRef(null)
  const keyboardHelpId = useId()

  // WebGL context check
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const ctx =
        canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')
      setWebglSupported(Boolean(ctx))
    } catch {
      setWebglSupported(false)
    }
  }, [])

  // Sync selected fact with 3D annotation
  const handleSelectFact = useCallback((fact) => {
    setSelectedFact(fact)
    if (fact.annotationId) {
      setSelectedAnnotationId(fact.annotationId)
    }
  }, [])

  // Sync 3D annotation click with information panel
  const handleSelectAnnotation = useCallback((annotation) => {
    setSelectedAnnotationId(annotation.id)
    const matchingFact = FACTS.find((f) => f.id === annotation.factId)
    if (matchingFact) {
      setSelectedFact(matchingFact)
    }
  }, [])

  // Viewport action handlers
  const handleResetView = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
    setZoomNotification('View reset to default orientation.')
  }, [])

  const handleNudgeRotate = useCallback((dx, dy) => {
    if (!controlsRef.current) return
    controlsRef.current.autoRotate = false
    setAutoRotate(false)
    // Small nudge to camera azimuth and polar angles
    const controls = controlsRef.current
    if (controls.setAzimuthalAngle && controls.setPolarAngle) {
      const curAzimuth = controls.getAzimuthalAngle()
      const curPolar = controls.getPolarAngle()
      controls.setAzimuthalAngle(curAzimuth + dx)
      controls.setPolarAngle(Math.max(0.1, Math.min(Math.PI - 0.1, curPolar + dy)))
      controls.update()
    }
  }, [])

  const handleNudgeZoom = useCallback((inward) => {
    if (!controlsRef.current) return
    const controls = controlsRef.current
    const camera = controls.object
    if (!camera) return
    const factor = inward ? 0.85 : 1.18
    const newDistance = THREE.MathUtils.clamp(
      camera.position.length() * factor,
      controls.minDistance,
      controls.maxDistance
    )
    camera.position.setLength(newDistance)
    controls.update()
    setZoomNotification(inward ? 'Zoomed in.' : 'Zoomed out.')
  }, [])

  // Keyboard navigation for full accessibility
  const handleKeyDown = useCallback(
    (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          handleNudgeRotate(0.2, 0)
          break
        case 'ArrowRight':
          e.preventDefault()
          handleNudgeRotate(-0.2, 0)
          break
        case 'ArrowUp':
          e.preventDefault()
          handleNudgeRotate(0, -0.2)
          break
        case 'ArrowDown':
          e.preventDefault()
          handleNudgeRotate(0, 0.2)
          break
        case '+':
        case '=':
          e.preventDefault()
          handleNudgeZoom(true)
          break
        case '-':
        case '_':
          e.preventDefault()
          handleNudgeZoom(false)
          break
        case 'r':
        case 'R':
          e.preventDefault()
          handleResetView()
          break
        case 'a':
        case 'A':
          e.preventDefault()
          setAnnotations((v) => !v)
          break
        case 'c':
        case 'C':
          e.preventDefault()
          setComparison((v) => !v)
          break
        case ' ':
          e.preventDefault()
          setAutoRotate((v) => !v)
          break
        default:
          break
      }
    },
    [handleNudgeRotate, handleNudgeZoom, handleResetView]
  )

  return (
    <section
      className="star-explorer"
      id="star-atlas"
      ref={containerRef}
      aria-labelledby="star-explorer-title"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* SECTION HEADER */}
      <div className="star-explorer__header">
        <div className="star-explorer__titles">
          <p className="eyebrow">Interactive Stellar Astrophysics</p>
          <h2 id="star-explorer-title">Rigel · A Blue Supergiant</h2>
          <p className="star-explorer__tagline">
            Experience Beta Orionis in realistic 3D: an energetic powerhouse churning with
            supersonic radiation pressure and luminous plasma.
          </p>
        </div>
        <div className="star-explorer__badge-cluster" aria-label="Quick stellar classification">
          <span className="star-badge star-badge--primary">{STAR_DATA.spectralType}</span>
          <span className="star-badge">{STAR_DATA.classification}</span>
          <span className="star-badge">{STAR_DATA.constellation}</span>
        </div>
      </div>

      {/* STAGE: 3D VIEWPORT & EDUCATIONAL PANEL */}
      <div className="star-explorer__stage">
        {/* 3D VIEWPORT CONTAINER */}
        <div className="star-explorer__viewport-wrap">
          {/* Screen reader notification for zoom/pan */}
          <span className="sr-only" aria-live="polite">
            {zoomNotification}
          </span>

          {webglSupported === false ? (
            <StaticFallback
              comparison={comparison}
              selectedFact={selectedFact}
              onSelectFact={handleSelectFact}
              facts={FACTS}
            />
          ) : (
            <WebglErrorBoundary
              fallback={
                <StaticFallback
                  comparison={comparison}
                  selectedFact={selectedFact}
                  onSelectFact={handleSelectFact}
                  facts={FACTS}
                />
              }
            >
              <div
                className="star-explorer__canvas-wrap"
                role="region"
                aria-label="3D star viewer: drag to rotate, pinch or scroll to zoom, or use on-screen controls"
              >
                <Canvas
                  dpr={[1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5)]}
                  camera={{ position: [0, 0, 4.8], fov: 42 }}
                  gl={{
                    powerPreference: 'default',
                    antialias: true,
                    alpha: false,
                  }}
                  className="star-explorer__canvas"
                >
                  <Suspense fallback={null}>
                    <StarScene
                      comparison={comparison}
                      annotations={annotations}
                      selectedAnnotationId={selectedAnnotationId}
                      onSelectAnnotation={handleSelectAnnotation}
                      controlsRef={controlsRef}
                      autoRotate={autoRotate}
                    />
                  </Suspense>
                </Canvas>

                {/* VIEWPORT OVERLAY CONTROLS (Separated from educational panel) */}
                <div className="star-explorer__overlay-top" aria-label="Viewer modes">
                  <button
                    type="button"
                    className={`explorer-pill-btn ${annotations ? 'explorer-pill-btn--active' : ''}`}
                    onClick={() => setAnnotations((v) => !v)}
                    aria-pressed={annotations}
                    title="Toggle 3D interactive annotations (Shortcut: A)"
                  >
                    <span className="explorer-pill-btn__dot" />
                    <span>{annotations ? 'Annotations: On' : 'Annotations: Off'}</span>
                  </button>

                  <button
                    type="button"
                    className={`explorer-pill-btn ${comparison ? 'explorer-pill-btn--active' : ''}`}
                    onClick={() => setComparison((v) => !v)}
                    aria-pressed={comparison}
                    title="Toggle true-scale comparison with the Sun (Shortcut: C)"
                  >
                    <span className="explorer-pill-btn__dot explorer-pill-btn__dot--sun" />
                    <span>{comparison ? 'Scale: Rigel vs Sun' : 'Compare with Sun'}</span>
                  </button>
                </div>

                {/* ACCESSIBLE ON-SCREEN MANIPULATION CONTROLS */}
                <div
                  className="star-explorer__manipulation-toolbar"
                  role="toolbar"
                  aria-label="3D camera and rotation controls"
                >
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => handleNudgeRotate(0.25, 0)}
                    aria-label="Rotate left"
                    title="Rotate star left (Left arrow)"
                  >
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12.5 15L7.5 10L12.5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => handleNudgeRotate(-0.25, 0)}
                    aria-label="Rotate right"
                    title="Rotate star right (Right arrow)"
                  >
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M7.5 5L12.5 10L7.5 15" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => handleNudgeRotate(0, -0.22)}
                    aria-label="Tilt up"
                    title="Tilt star upward (Up arrow)"
                  >
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M5 12.5L10 7.5L15 12.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => handleNudgeRotate(0, 0.22)}
                    aria-label="Tilt down"
                    title="Tilt star downward (Down arrow)"
                  >
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M5 7.5L10 12.5L15 7.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  <span className="toolbar-separator" aria-hidden="true" />

                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => handleNudgeZoom(true)}
                    aria-label="Zoom in"
                    title="Zoom in (+ key)"
                  >
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M10 5V15M5 10H15" strokeLinecap="round" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => handleNudgeZoom(false)}
                    aria-label="Zoom out"
                    title="Zoom out (- key)"
                  >
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M5 10H15" strokeLinecap="round" />
                    </svg>
                  </button>

                  <span className="toolbar-separator" aria-hidden="true" />

                  <button
                    type="button"
                    className={`toolbar-btn ${autoRotate ? 'toolbar-btn--active' : ''}`}
                    onClick={() => setAutoRotate((v) => !v)}
                    aria-label={autoRotate ? 'Pause auto-rotation' : 'Start auto-rotation'}
                    title="Toggle auto-rotation (Spacebar)"
                  >
                    {autoRotate ? (
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <rect x="5.5" y="4.5" width="3" height="11" rx="1" />
                        <rect x="11.5" y="4.5" width="3" height="11" rx="1" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6.5 4.5L15.5 10L6.5 15.5V4.5Z" />
                      </svg>
                    )}
                  </button>

                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={handleResetView}
                    aria-label="Reset star view"
                    title="Reset view (R key)"
                  >
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M3.5 10A6.5 6.5 0 1 1 10 16.5M3.5 10V6M3.5 10H7.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className={`toolbar-btn ${showKeyboardHelp ? 'toolbar-btn--active' : ''}`}
                    onClick={() => setShowKeyboardHelp((v) => !v)}
                    aria-label="View keyboard shortcuts"
                    aria-expanded={showKeyboardHelp}
                    title="Keyboard shortcuts help"
                  >
                    <span className="toolbar-btn__kbd-icon">?</span>
                  </button>
                </div>

                {/* KEYBOARD SHORTCUTS MODAL / POPUP */}
                {showKeyboardHelp && (
                  <div className="keyboard-shortcuts-card" id={keyboardHelpId} role="region" aria-label="Keyboard Shortcuts">
                    <div className="keyboard-shortcuts-card__head">
                      <h4>Keyboard & Touch Navigation</h4>
                      <button
                        type="button"
                        onClick={() => setShowKeyboardHelp(false)}
                        aria-label="Close keyboard shortcuts"
                      >
                        ×
                      </button>
                    </div>
                    <dl className="shortcut-list">
                      <div>
                        <dt><kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd></dt>
                        <dd>Orbit & tilt the star</dd>
                      </div>
                      <div>
                        <dt><kbd>+</kbd> / <kbd>-</kbd></dt>
                        <dd>Zoom in / zoom out</dd>
                      </div>
                      <div>
                        <dt><kbd>R</kbd></dt>
                        <dd>Reset view to default</dd>
                      </div>
                      <div>
                        <dt><kbd>A</kbd></dt>
                        <dd>Toggle educational annotations</dd>
                      </div>
                      <div>
                        <dt><kbd>C</kbd></dt>
                        <dd>Toggle true-scale Sun comparison</dd>
                      </div>
                      <div>
                        <dt><kbd>Space</kbd></dt>
                        <dd>Pause or resume auto-rotation</dd>
                      </div>
                    </dl>
                    <p className="shortcut-touch-note">
                      On touchscreen devices, use single-finger drag to rotate, two-finger pinch to zoom, or tap the toolbar buttons above.
                    </p>
                  </div>
                )}

                {/* VISUAL INTERACTION HINT */}
                <div className="star-explorer__interaction-hint" aria-hidden="true">
                  <span>Drag to rotate</span>
                  <span className="hint-sep">·</span>
                  <span>Scroll or pinch to zoom</span>
                  <span className="hint-sep">·</span>
                  <span>Select annotations</span>
                </div>
              </div>
            </WebglErrorBoundary>
          )}
        </div>

        {/* EDUCATIONAL INFORMATION PANEL */}
        <aside
          className="star-explorer__info-panel"
          aria-label="Scientific facts, analysis, and scale comparison"
        >
          {/* SCIENTIFIC FACT SELECTOR BUTTONS */}
          <div className="fact-selector-section">
            <h3 className="section-label">Astrophysical Properties</h3>
            <p className="section-sub">Select any measurement to explore its scientific explanation:</p>
            <div className="fact-cards-grid" role="tablist" aria-label="Selectable star properties">
              {FACTS.map((fact) => {
                const isActive = selectedFact.id === fact.id
                return (
                  <button
                    key={fact.id}
                    type="button"
                    role="tab"
                    id={`fact-tab-${fact.id}`}
                    aria-selected={isActive}
                    aria-controls={`fact-panel-${fact.id}`}
                    className={`fact-card-btn ${isActive ? 'fact-card-btn--active' : ''}`}
                    onClick={() => handleSelectFact(fact)}
                  >
                    <div className="fact-card-btn__header">
                      <span className="fact-card-btn__label">{fact.label}</span>
                      <span className="fact-card-btn__badge">{fact.badge}</span>
                    </div>
                    <div className="fact-card-btn__value">{fact.value}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ACTIVE FACT DETAIL CARD */}
          <div
            className="fact-detail-card"
            id={`fact-panel-${selectedFact.id}`}
            role="tabpanel"
            aria-labelledby={`fact-tab-${selectedFact.id}`}
            aria-live="polite"
          >
            <div className="fact-detail-card__eyebrow">
              <span>Property Deep Dive</span>
              <span className="fact-detail-card__id">{selectedFact.label}</span>
            </div>
            <h4 className="fact-detail-card__title">{selectedFact.headline}</h4>
            <p className="fact-detail-card__text">{selectedFact.explanation}</p>
            <div className="fact-detail-card__source">
              <span className="source-label">Source Reference:</span>
              <span className="source-name">{selectedFact.scientificSource}</span>
            </div>
          </div>

          {/* COMPARISON MODE PANEL */}
          {comparison ? (
            <div className="comparison-card" role="region" aria-label="Scale comparison with the Sun">
              <div className="comparison-card__header">
                <div className="comparison-card__title-wrap">
                  <span className="comparison-badge">Scale Active</span>
                  <h4>True Scale: Rigel vs The Sun</h4>
                </div>
                <button
                  type="button"
                  className="comparison-card__close-btn"
                  onClick={() => setComparison(false)}
                  aria-label="Exit solar comparison mode"
                >
                  Exit Comparison
                </button>
              </div>

              <p className="comparison-card__intro">
                Rigel is an astrophysical giant. At ~74.1 solar radii, our Sun is reduced to a tiny glowing pinprick beside it.
              </p>

              {/* Honest Linear Proportion Visualization */}
              <div
                className="comparison-bar-visual"
                aria-label="Linear diameter comparison: Rigel 74.1 units, Sun 1 unit"
              >
                <div className="comparison-bar comparison-bar--rigel">
                  <div className="comparison-bar__fill" style={{ width: '100%' }} />
                  <span className="comparison-bar__label">Rigel · ~103,000,000 km (74.1 R☉)</span>
                </div>
                <div className="comparison-bar comparison-bar--sun">
                  <div
                    className="comparison-bar__fill comparison-bar__fill--sun"
                    style={{ width: `${(1 / 74.1) * 100}%` }}
                  />
                  <span className="comparison-bar__label">Sun · ~1,392,700 km (1 R☉)</span>
                </div>
              </div>

              {/* Multi-Metric Scientific Comparison Grid */}
              <div className="comparison-metrics-grid">
                <div className="metric-cell">
                  <span className="metric-cell__label">Radius Ratio</span>
                  <strong className="metric-cell__value">74.1 : 1</strong>
                  <span className="metric-cell__sub">Engulfs Mercury’s orbit</span>
                </div>
                <div className="metric-cell">
                  <span className="metric-cell__label">Volume Capacity</span>
                  <strong className="metric-cell__value">~406,000×</strong>
                  <span className="metric-cell__sub">Suns could fit inside Rigel</span>
                </div>
                <div className="metric-cell">
                  <span className="metric-cell__label">Luminosity</span>
                  <strong className="metric-cell__value">~120,000×</strong>
                  <span className="metric-cell__sub">Total bolometric radiation</span>
                </div>
                <div className="metric-cell">
                  <span className="metric-cell__label">Surface Temperature</span>
                  <strong className="metric-cell__value">~12,100 K</strong>
                  <span className="metric-cell__sub">Vs 5,778 K solar surface</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="comparison-cta-card">
              <div className="comparison-cta-card__info">
                <h4>Wonder how Rigel compares to our Sun?</h4>
                <p>Activate Solar Comparison to see the two stars side-by-side at honest physical scale.</p>
              </div>
              <button
                type="button"
                className="primary-action primary-action--compact"
                onClick={() => setComparison(true)}
              >
                <span>Compare with the Sun</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          )}

          {/* SCIENTIFIC ACCURACY & ARTISTIC DISCLAIMER */}
          <div className="star-disclaimer">
            <p>
              <strong>Astrophysical Disclaimer:</strong> All measurements represent published observational
              approximations derived from spectroscopic surveys and optical interferometry. Supergiants undergo
              non-radial pulsations and massive stellar wind shedding, meaning surface borders are naturally diffuse.
              This 3D rendering is an artistic scientific visualization designed to reflect current astrophysical models.
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}
