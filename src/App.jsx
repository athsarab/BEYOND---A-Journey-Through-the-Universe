import { lazy } from 'react'
import SpaceJourney from './components/SpaceJourney'
import StarExplorer from './components/StarExplorer'
import LazySection from './components/LazySection'
import VideoBackground from './components/VideoBackground'
import VideoStorySections from './components/VideoStorySections'

const StellarEvolution = lazy(() => import('./components/StellarEvolution'))
const ConstellationDetective = lazy(() => import('./components/ConstellationDetective'))
const BlackHoleExplorer = lazy(() => import('./components/BlackHoleExplorer'))

const navItems = [
  { label: 'Explore', href: '#explore' },
  { label: 'Star Atlas', href: '#star-atlas' },
  { label: 'Life of a star', href: '#life-of-a-star' },
  { label: 'Constellations', href: '#constellation-detective' },
  { label: 'Black holes', href: '#black-hole-explorer' },
]

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18">
      <path d="M3 9h11M9.5 4.5 14 9l-4.5 4.5" />
    </svg>
  )
}

function App() {
  return (
    <main className="site-shell">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-video" aria-hidden="true">
          <VideoBackground source="/media/clip1.mp4" poster="/media/nebula-poster.svg" className="hero-video__asset" lazy={false} />
        </div>
        <div className="starfield" aria-hidden="true">
          <div className="stars stars--far" />
          <div className="stars stars--mid" />
          <div className="stars stars--near" />
        </div>
        <div className="hero-vignette" aria-hidden="true" />

        <header className="site-header">
          <a className="wordmark" href="#top" aria-label="BEYOND home">
            BEYOND
          </a>
          <nav aria-label="Primary navigation">
            <ul className="navigation">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <span className="header-index" aria-hidden="true">
            01 / 05
          </span>
        </header>

        <div className="hero-content" id="top">
          <p className="eyebrow">A journey through the universe</p>
          <h1 id="hero-title">
            The universe
            <br />
            is closer than <em>you think.</em>
          </h1>
          <p className="hero-intro">
            Travel across the cosmos. Discover the stars. Understand our place
            in the universe.
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#explore">
              <span>Begin your journey</span>
              <ArrowIcon />
            </a>
            <a className="text-link" href="#star-atlas">
              Explore the stars
            </a>
          </div>
        </div>

        <a className="scroll-cue" href="#explore">
          <span className="scroll-cue__line" aria-hidden="true" />
          <span>Scroll to discover</span>
        </a>
      </section>

      <SpaceJourney />

      <VideoStorySections />

      <StarExplorer />

      <LazySection fallback={<div className="module-placeholder" aria-hidden="true" />}>
        <StellarEvolution />
      </LazySection>

      <LazySection fallback={<div className="module-placeholder" aria-hidden="true" />}>
        <ConstellationDetective />
      </LazySection>

      <LazySection fallback={<div className="module-placeholder" aria-hidden="true" />}>
        <BlackHoleExplorer />
      </LazySection>
    </main>
  )
}

export default App