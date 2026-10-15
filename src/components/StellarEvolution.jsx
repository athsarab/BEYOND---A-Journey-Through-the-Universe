import { useMemo, useState } from 'react'
import { stellarStages, astronomySources } from '../data/astronomyData'

function StellarEvolution() {
  const [selectedId, setSelectedId] = useState('main-sequence')
  const [branch, setBranch] = useState('sun')
  const selected = useMemo(() => stellarStages.find((stage) => stage.id === selectedId), [selectedId])

  const selectStage = (stage) => {
    setSelectedId(stage.id)
    if (stage.branch) setBranch(stage.branch)
  }

  return (
    <section className="module module--evolution" id="life-of-a-star" aria-labelledby="evolution-title">
      <div className="module__intro">
        <p className="eyebrow">Module 01 / Stellar evolution</p>
        <h2 id="evolution-title">Every star has a life story.</h2>
        <p>
          Follow the shared beginning, then compare the two very different endings set by a star&apos;s birth mass.
          Select a stage to reveal its physics.
        </p>
      </div>

      <div className="evolution-layout">
        <div className="evolution-timeline" aria-label="Interactive stellar evolution timeline">
          <div className="evolution-branch-toggle" role="tablist" aria-label="Choose a stellar mass path">
            <button type="button" role="tab" aria-selected={branch === 'sun'} className={branch === 'sun' ? 'is-active' : ''} onClick={() => setBranch('sun')}>
              Sun-like path
            </button>
            <button type="button" role="tab" aria-selected={branch === 'massive'} className={branch === 'massive' ? 'is-active' : ''} onClick={() => setBranch('massive')}>
              Massive-star path
            </button>
          </div>
          <div className="evolution-track">
            {stellarStages.map((stage, index) => {
              const visible = !stage.branch || stage.branch === branch
              return (
                <button
                  type="button"
                  key={stage.id}
                  className={`evolution-stage ${selectedId === stage.id ? 'is-selected' : ''} ${visible ? '' : 'is-muted'}`}
                  onClick={() => selectStage(stage)}
                  aria-current={selectedId === stage.id ? 'step' : undefined}
                >
                  <span className="evolution-stage__index">0{index + 1}</span>
                  <span className="evolution-stage__orb" style={{ '--stage-color': stage.color }} />
                  <span className="evolution-stage__label">{stage.label}</span>
                </button>
              )
            })}
          </div>
          <p className="module__note">The shared early stages are the same; branching outcomes depend on initial mass. A supernova is not a universal ending.</p>
        </div>

        <article className="evolution-detail" aria-live="polite">
          <div className="evolution-detail__visual" style={{ '--stage-color': selected.color }}>
            <div className={`evolution-star evolution-star--${selected.id}`} />
            <span>{selected.kicker}</span>
          </div>
          <div className="evolution-detail__copy">
            <p className="eyebrow">{selected.label}</p>
            <h3>{selected.title}</h3>
            <p>{selected.description}</p>
            <ul>
              {selected.facts.map((fact) => <li key={fact}>{fact}</li>)}
            </ul>
          </div>
        </article>
      </div>
      <p className="module__sources"><strong>Sources:</strong> {astronomySources[0]} · {astronomySources[1]}</p>
    </section>
  )
}

export default StellarEvolution
