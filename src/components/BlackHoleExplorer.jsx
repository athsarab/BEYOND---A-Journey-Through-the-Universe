import { useState } from 'react'
import { astronomySources } from '../data/astronomyData'

const hotspots = [
  { id: 'horizon', label: 'Event horizon', title: 'The point of no return', text: 'The event horizon is a boundary in spacetime. Once light or matter crosses it, no signal can reach a distant observer. It is not a solid surface.' },
  { id: 'disk', label: 'Accretion disk', title: 'Matter in a fast, hot orbit', text: 'Gas and dust orbiting a black hole can collide, heat up, and glow brightly. The disk is outside the horizon and is what makes many black holes visible.' },
  { id: 'lens', label: 'Gravitational lensing', title: 'Gravity bends the view', text: 'The black hole curves spacetime, bending light from the disk and background. That is why the far side of the disk can appear above and below the dark center.' },
  { id: 'mass', label: 'Stellar-mass black hole', title: 'A compact remnant', text: 'A stellar-mass black hole can form when a massive star exhausts its fuel and its core collapses. Its mass is typically several times that of the Sun, not infinite.' },
]

function BlackHoleExplorer() {
  const [selectedId, setSelectedId] = useState('horizon')
  const [lensing, setLensing] = useState(true)
  const selected = hotspots.find((hotspot) => hotspot.id === selectedId)

  return (
    <section className="module module--black-hole" id="black-hole-explorer" aria-labelledby="black-hole-title">
      <div className="module__intro">
        <p className="eyebrow">Module 03 / Black-hole explorer</p>
        <h2 id="black-hole-title">Look into the darkness.</h2>
        <p>A scientifically inspired diagram of a black hole: a dark central silhouette, a luminous accretion disk, and optional lensing. It is not a solid planet or a cosmic vacuum cleaner.</p>
      </div>

      <div className="black-hole-layout">
        <div className="black-hole-stage" aria-label="Interactive black-hole visualization">
          <div className={`black-hole-art ${lensing ? 'has-lensing' : ''}`}>
            <div className="lens-arc lens-arc--one" />
            <div className="lens-arc lens-arc--two" />
            <div className="accretion-disk" />
            <div className="black-hole-shadow" />
            <span className="black-hole-marker black-hole-marker--horizon" />
            <span className="black-hole-marker black-hole-marker--disk" />
            <span className="black-hole-marker black-hole-marker--lens" />
          </div>
          <button type="button" className={`module-control module-control--dark ${lensing ? 'is-active' : ''}`} onClick={() => setLensing((value) => !value)} aria-pressed={lensing}>
            {lensing ? 'Gravitational lensing: on' : 'Gravitational lensing: off'}
          </button>
          <p className="black-hole-stage__caption">Illustrative model · not to physical scale</p>
        </div>

        <div className="black-hole-info">
          <div className="hotspot-list" role="tablist" aria-label="Black-hole educational hotspots">
            {hotspots.map((hotspot) => (
              <button type="button" role="tab" key={hotspot.id} aria-selected={selectedId === hotspot.id} className={selectedId === hotspot.id ? 'is-active' : ''} onClick={() => setSelectedId(hotspot.id)}>
                <span className="hotspot-list__dot" />
                {hotspot.label}
              </button>
            ))}
          </div>
          <article className="black-hole-detail" aria-live="polite">
            <p className="eyebrow">Selected hotspot</p>
            <h3>{selected.title}</h3>
            <p>{selected.text}</p>
          </article>
          <div className="misconception-card">
            <strong>Common misconception</strong>
            <p>A black hole does not roam through space sucking up everything nearby. From far away, its gravity behaves like the gravity of any object with the same mass; only matter that comes close enough is captured.</p>
          </div>
        </div>
      </div>
      <p className="module__sources"><strong>Sources:</strong> NASA, “Black Holes” (science.nasa.gov) · {astronomySources[0]}</p>
    </section>
  )
}

export default BlackHoleExplorer
