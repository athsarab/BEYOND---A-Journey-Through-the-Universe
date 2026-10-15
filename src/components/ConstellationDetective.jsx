import { useMemo, useState } from 'react'
import { constellationLines, constellationStars, astronomySources } from '../data/astronomyData'

function ConstellationDetective() {
  const [linesVisible, setLinesVisible] = useState(false)
  const [selectedStarId, setSelectedStarId] = useState(null)
  const [challenge, setChallenge] = useState(false)
  const [feedback, setFeedback] = useState('')
  const selectedStar = useMemo(() => constellationStars.find((star) => star.id === selectedStarId), [selectedStarId])

  const handleChallenge = (star) => {
    setSelectedStarId(star.id)
    if (star.constellation === 'Orion') setFeedback('Correct. These stars form Orion as seen from Earth, even though they sit at very different distances.')
  }

  return (
    <section className="module module--constellation" id="constellation-detective" aria-labelledby="constellation-title">
      <div className="module__intro module__intro--wide">
        <p className="eyebrow">Module 02 / Constellation detective</p>
        <h2 id="constellation-title">A pattern is not a place.</h2>
        <p>Reveal the familiar outline of Orion, then inspect the measurements beneath the pattern. The sky is a projection: a constellation&apos;s stars may be hundreds or thousands of light-years apart.</p>
      </div>

      <div className="constellation-layout">
        <div className="constellation-map-wrap">
          <div className="constellation-map" role="img" aria-label="Interactive star map of Orion">
            <div className="map-grid" aria-hidden="true" />
            <svg viewBox="0 0 100 100" aria-hidden="true">
              {linesVisible && constellationLines.map(([from, to]) => {
                const a = constellationStars.find((star) => star.id === from)
                const b = constellationStars.find((star) => star.id === to)
                return <line key={`${from}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
              })}
            </svg>
            {constellationStars.map((star) => (
              <button
                type="button"
                key={star.id}
                className={`map-star ${selectedStarId === star.id ? 'is-selected' : ''}`}
                style={{ left: `${star.x}%`, top: `${star.y}%`, '--star-size': `${Math.max(0.65, 1.8 - star.magnitude / 2)}rem` }}
                onClick={() => (challenge ? handleChallenge(star) : setSelectedStarId(star.id))}
                aria-label={`${star.name}, magnitude ${star.magnitude}, ${star.distance} light-years away`}
              >
                <span />
                <small>{star.name}</small>
              </button>
            ))}
            <span className="map-caption">ORION · APPARENT SKY PLANE</span>
          </div>
          <div className="constellation-controls">
            <button type="button" className={`module-control ${linesVisible ? 'is-active' : ''}`} onClick={() => setLinesVisible((value) => !value)} aria-pressed={linesVisible}>
              {linesVisible ? 'Hide connecting lines' : 'Reveal connecting lines'}
            </button>
            <button type="button" className={`module-control ${challenge ? 'is-active' : ''}`} onClick={() => { setChallenge((value) => !value); setFeedback('') }} aria-pressed={challenge}>
              {challenge ? 'Exit discovery challenge' : 'Start discovery challenge'}
            </button>
          </div>
          {challenge && <p className="challenge-prompt">Discovery challenge: select any star in Orion and read the clue that appears.</p>}
          {feedback && <p className="challenge-feedback" role="status">{feedback}</p>}
        </div>

        <aside className="constellation-reading" aria-live="polite">
          <p className="eyebrow">Read the depth</p>
          {selectedStar ? (
            <>
              <h3>{selectedStar.name}</h3>
              <p className="constellation-distance">{selectedStar.distance} light-years</p>
              <p>{selectedStar.name} appears in Orion&apos;s outline from Earth, but its measured distance places it at a different depth in space. Its celestial coordinates are RA {selectedStar.ra.toFixed(3)}°, Dec {selectedStar.dec.toFixed(3)}°.</p>
              <dl className="constellation-stats">
                <div><dt>Apparent brightness</dt><dd>Magnitude {selectedStar.magnitude}</dd></div>
                <div><dt>Constellation</dt><dd>{selectedStar.constellation}</dd></div>
              </dl>
            </>
          ) : (
            <>
              <h3>Choose a star</h3>
              <p>Each point is a real star with a measured position and an estimated distance. Select one to separate the sky&apos;s apparent geometry from its true depth.</p>
            </>
          )}
          <p className="constellation-reading__note">Positions shown are a simplified educational projection of Orion, not a navigational chart.</p>
        </aside>
      </div>
      <p className="module__sources"><strong>Sources:</strong> {astronomySources[1]} · {astronomySources[2]}</p>
    </section>
  )
}

export default ConstellationDetective
