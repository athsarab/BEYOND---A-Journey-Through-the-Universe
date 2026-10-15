import { useEffect, useRef } from 'react'

const activeVideos = new Set()

/**
 * @typedef {Object} VideoBackgroundProps
 * @property {string} source
 * @property {string} [poster]
 * @property {string} [className]
 * @property {boolean} [active]
 * @property {boolean} [loop]
 * @property {boolean} [playOnce]
 * @property {boolean} [lazy]
 * @property {() => void} [onEnded]
 */

/**
 * A muted, visibility-aware local video background. Only visible active videos
 * are allowed to play, and every playback listener is removed on unmount.
 * @param {VideoBackgroundProps} props
 */
function VideoBackground({
  source,
  poster,
  className = '',
  active = true,
  loop = true,
  playOnce = false,
  lazy = true,
  onEnded,
}) {
  const videoRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    const wrapper = wrapperRef.current
    if (!video || !wrapper) return undefined

    let isVisible = false
    let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const stop = () => {
      video.pause()
      activeVideos.delete(video)
    }

    const playIfAllowed = () => {
      if (!active || !isVisible || reducedMotion) {
        stop()
        return
      }

      activeVideos.forEach((otherVideo) => {
        if (otherVideo !== video) otherVideo.pause()
      })
      activeVideos.clear()
      activeVideos.add(video)
      video.play().catch(() => {
        // Autoplay can be denied by browser policy; the poster remains visible.
        video.dataset.autoplayBlocked = 'true'
      })
    }

    const handleError = () => {
      video.hidden = true
      wrapper.classList.add('video-background--fallback')
    }
    const handleMotionChange = (event) => {
      reducedMotion = event.matches
      if (reducedMotion) stop()
      else playIfAllowed()
    }
    const observer = 'IntersectionObserver' in window
      ? new IntersectionObserver(
        ([entry]) => {
          isVisible = entry.isIntersecting
          if (isVisible) playIfAllowed()
          else stop()
        },
        { threshold: 0.05 },
      )
      : null

    video.addEventListener('error', handleError)
    video.addEventListener('loadeddata', playIfAllowed)
    if (onEnded) video.addEventListener('ended', onEnded)
    if (observer) observer.observe(wrapper)
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    motionQuery.addEventListener?.('change', handleMotionChange)

    return () => {
      observer?.disconnect()
      motionQuery.removeEventListener?.('change', handleMotionChange)
      video.removeEventListener('error', handleError)
      video.removeEventListener('loadeddata', playIfAllowed)
      if (onEnded) video.removeEventListener('ended', onEnded)
      stop()
    }
  }, [active, onEnded, source])

  return (
    <div ref={wrapperRef} className="video-background-wrap">
      <video
        ref={videoRef}
        className={`video-background ${className}`}
        autoPlay
        muted
        loop={loop && !playOnce}
        playsInline
        preload={lazy ? 'metadata' : 'auto'}
        poster={poster}
        aria-hidden="true"
      >
        <source src={source} type="video/mp4" />
      </video>
    </div>
  )
}

export default VideoBackground
