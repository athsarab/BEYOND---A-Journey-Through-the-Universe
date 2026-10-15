import { useCallback, useState } from 'react'
import VideoBackground from './VideoBackground'

function VideoStorySections() {
  const [discoveryReady, setDiscoveryReady] = useState(false)

  const handleDiscoveryEnd = useCallback(() => {
    setDiscoveryReady(true)
  }, [])

  return (
    <>
      <section className="cinematic-scene cinematic-scene--discovery" id="star-discovery" aria-labelledby="discovery-title">
        <VideoBackground source="/media/clip3.mp4" poster="/media/nebula-poster.svg" className="cinematic-scene__video" playOnce onEnded={handleDiscoveryEnd} />
        <div className="cinematic-scene__shade" />
        <div className="cinematic-scene__copy">
          <p className="eyebrow">Scene 03 / Star discovery</p>
          <h2 id="discovery-title">A massive star comes into focus.</h2>
          <p>As a star grows more massive, gravity compresses its core and its radiation reshapes the space around it.</p>
          <a className={`primary-action ${discoveryReady ? '' : 'primary-action--soft'}`} href="#star-atlas">
            <span>Explore this star</span>
            <span aria-hidden="true">→</span>
          </a>
          <p className="cinematic-scene__status" aria-live="polite">
            {discoveryReady ? 'The star is ready to explore.' : 'The interactive star module remains separate below.'}
          </p>
        </div>
      </section>

      <section className="cinematic-scene cinematic-scene--supernova" id="supernova" aria-labelledby="supernova-title">
        <VideoBackground source="/media/clip4.mp4" poster="/media/nebula-poster.svg" className="cinematic-scene__video" playOnce />
        <div className="cinematic-scene__shade cinematic-scene__shade--light" />
        <div className="cinematic-scene__copy cinematic-scene__copy--right">
          <p className="eyebrow">Scene 05 / Core collapse</p>
          <h2 id="supernova-title">When a massive star can no longer hold itself up.</h2>
          <p>After an iron core forms, fusion can no longer provide enough pressure. The core collapses and the outer layers can be blasted outward as a supernova.</p>
          <p className="cinematic-scene__caveat">This is one possible outcome for massive stars, not the fate of every star.</p>
        </div>
      </section>

      <section className="cinematic-scene cinematic-scene--aftermath" id="cosmic-aftermath" aria-labelledby="aftermath-title">
        <VideoBackground source="/media/clip5.mp4" poster="/media/nebula-poster.svg" className="cinematic-scene__video" />
        <div className="cinematic-scene__shade" />
        <div className="cinematic-scene__copy">
          <p className="eyebrow">Scene 06 / Cosmic aftermath</p>
          <h2 id="aftermath-title">The end becomes material for a beginning.</h2>
          <p>Expanding supernova remnants carry oxygen, silicon, iron, and other elements into space. Those ingredients can later become part of new stars, planets, and life.</p>
          <p className="cinematic-scene__caveat">Sun-like stars take a quieter path, leaving white dwarfs rather than exploding as supernovae.</p>
        </div>
      </section>
    </>
  )
}

export default VideoStorySections
