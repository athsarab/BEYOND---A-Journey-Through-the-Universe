import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import VideoBackground from './VideoBackground'

gsap.registerPlugin(ScrollTrigger)

function SpaceJourney() {
  const journeyRef = useRef(null)

  useLayoutEffect(() => {
    const journey = journeyRef.current
    if (!journey) return undefined

    const context = gsap.context(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduceMotion) {
        journey.classList.add('journey--static')
        return
      }

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: journey,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.1,
          invalidateOnRefresh: true,
        },
      })

      timeline
        .to('.journey__stars', { scale: 1.22, opacity: 0.75, duration: 1.2, ease: 'none' }, 0)
        .to('.journey__caption--one', { opacity: 1, y: 0, duration: 0.22 }, 0.03)
        .to('.journey__caption--one', { opacity: 0, y: -18, duration: 0.18 }, 0.84)
        .to('.journey__nebula', { opacity: 1, scale: 1.08, duration: 0.55, ease: 'power1.inOut' }, 0.62)
        .to('.journey__stars', { opacity: 0.12, scale: 1.45, duration: 0.52 }, 0.62)
        .to('.journey__caption--two', { opacity: 1, y: 0, duration: 0.22 }, 0.9)
        .to('.journey__caption--two', { opacity: 0, y: -18, duration: 0.18 }, 1.72)
        .to('.journey__nebula', { opacity: 0.12, scale: 1.24, duration: 0.5 }, 1.54)
        .to('.journey__star', { opacity: 1, scale: 1.18, duration: 0.75, ease: 'power1.inOut' }, 1.58)
        .to('.journey__star-glow', { opacity: 1, scale: 1.18, duration: 0.75 }, 1.58)
        .to('.journey__caption--three', { opacity: 1, y: 0, duration: 0.22 }, 1.92)
        .to('.journey__caption--three', { opacity: 0, y: -18, duration: 0.18 }, 2.63)
        .to('.journey__star', { scale: 1.7, duration: 0.75, ease: 'power1.inOut' }, 2.5)
        .to('.journey__star-glow', { scale: 1.7, duration: 0.75 }, 2.5)
        .to('.journey__arrival', { opacity: 1, y: 0, duration: 0.3 }, 2.83)
        .to('.journey__progress', { scaleX: 1, duration: 3, ease: 'none' }, 0)
    }, journey)

    return () => context.revert()
  }, [])

  return (
    <section className="space-journey" id="explore" ref={journeyRef} aria-labelledby="journey-title">
      <div className="journey__sticky">
        <div className="journey__canvas" aria-hidden="true">
          <div className="journey__stars">
            <i />
            <i />
            <i />
          </div>
          <div className="journey__nebula">
            <VideoBackground
              source="/media/clip2.mp4"
              poster="/media/nebula-poster.svg"
              className="journey__nebula-video"
            />
          </div>
          <div className="journey__star-glow" />
          <div className="journey__star">
            <span />
          </div>
          <div className="journey__shade" />
        </div>

        <div className="journey__progress" aria-hidden="true" />
        <p className="journey__chapter">A field guide to the cosmos</p>

        <div className="journey__captions">
          <p className="journey__caption journey__caption--one">
            Every point of light tells a story.
          </p>
          <p className="journey__caption journey__caption--two">
            Stars begin their lives inside vast clouds of gas and dust.
          </p>
          <p className="journey__caption journey__caption--three">
            Gravity gathers matter until a star begins to shine.
          </p>
        </div>

        <div className="journey__arrival">
          <p className="eyebrow">Scene 04 / Arrival</p>
          <h2 id="journey-title">A star is a beginning.</h2>
          <p>
            In the pressure and heat of a stellar core, matter becomes light.
            This is where the story of every star takes shape.
          </p>
          <a className="primary-action" href="#star-atlas">
            <span>Explore this star</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <span className="journey__scroll-note">Scroll through the story</span>
      </div>
    </section>
  )
}

export default SpaceJourney
