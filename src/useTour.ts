/**
 * useTour — reusable onboarding tour hook powered by driver.js v1.x
 *
 * Features:
 *  - Glassmorphism dark 3D style (via tour.css)
 *  - Auto-skip if localStorage key already set
 *  - Custom skip button + progress badge injected via onPopoverRender
 *  - Per-step onActive hooks (for right-click listeners, etc.)
 *  - onNextAtStep — override "Next" click per step index (for async flows)
 */

import { useEffect, useRef } from 'react'
import { driver } from 'driver.js'
import type { DriveStep, Config, PopoverDOM } from 'driver.js'
import 'driver.js/dist/driver.css'
import './tour.css'

export type { DriveStep }

const TOUR_PREFIX = 'has_seen_tour_'

export interface TourStepHook {
  /** Called once the step's element is highlighted. Return a cleanup fn to run on deselect. */
  onActive?: (driverObj: ReturnType<typeof driver>) => (() => void) | void
}

export interface TourOptions {
  /** Per-step active hooks, keyed by 0-based step index */
  stepHooks?: Record<number, TourStepHook>
  /**
   * Override the Next button for specific step indices.
   * Driver.js won't auto-advance — you must call driverObj.moveNext() yourself.
   */
  onNextAtStep?: Record<number, (driverObj: ReturnType<typeof driver>) => void>
  /** Milliseconds delay before tour initialises (lets the page render first) */
  delay?: number
}

export function useTour(
  tourKey: string,
  steps: DriveStep[],
  options?: TourOptions,
) {
  // Keep latest steps/options in refs so the effect closure stays fresh
  const stepsRef   = useRef(steps)
  const optionsRef = useRef(options)
  useEffect(() => { stepsRef.current   = steps   })
  useEffect(() => { optionsRef.current = options  })

  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const storageKey = TOUR_PREFIX + tourKey
    if (localStorage.getItem(storageKey) === 'true') return

    const delay = options?.delay ?? 1000
    let driverObj!: ReturnType<typeof driver>

    const handleSkip = () => {
      localStorage.setItem(storageKey, 'true')
      driverObj?.destroy()
    }

    const timer = setTimeout(() => {
      const totalSteps = stepsRef.current.length

      driverObj = driver({
        animate: true,
        overlayColor: 'rgb(0, 0, 0)',
        overlayOpacity: 0.6,
        smoothScroll: true,
        allowClose: false,
        stagePadding: 6,
        stageRadius: 4,
        popoverClass: 'driverjs-glass-tour',
        showButtons: ['next', 'previous'],
        nextBtnText: '下一步 →',
        prevBtnText: '← 上一步',
        doneBtnText: '完成探索 ✦',
        steps: stepsRef.current,

        // ── Inject custom header (progress badge + skip btn) ──
        onPopoverRender: (popover: PopoverDOM, { state }) => {
          const currentStep = (state.activeIndex ?? 0) + 1

          const headerRow = document.createElement('div')
          headerRow.className = 'tour-popover-header'

          const progressBadge = document.createElement('span')
          progressBadge.className = 'tour-progress-badge'
          progressBadge.textContent = `${currentStep} / ${totalSteps}`

          const skipBtn = document.createElement('button')
          skipBtn.type = 'button'
          skipBtn.className = 'tour-skip-btn'
          skipBtn.textContent = '✕ 跳过向导'
          skipBtn.addEventListener('click', handleSkip)

          headerRow.appendChild(progressBadge)
          headerRow.appendChild(skipBtn)

          // Insert before title (first semantic child after the hidden close-btn)
          popover.wrapper.insertBefore(headerRow, popover.title)
        },

        // ── Per-step activation hooks ──
        onHighlighted: (_el, _step, { state }) => {
          const idx  = state.activeIndex ?? 0
          const hook = optionsRef.current?.stepHooks?.[idx]
          if (hook?.onActive) {
            cleanupRef.current?.()
            const cleanup = hook.onActive(driverObj)
            cleanupRef.current = typeof cleanup === 'function' ? cleanup : null
          }
        },

        onDeselected: () => {
          cleanupRef.current?.()
          cleanupRef.current = null
        },

        // ── Next button — support per-step overrides ──
        onNextClick: (_el, _step, { state }) => {
          const idx      = state.activeIndex ?? 0
          const override = optionsRef.current?.onNextAtStep?.[idx]
          if (override) {
            override(driverObj)   // caller is responsible for moveNext()
          } else {
            driverObj.moveNext()
          }
        },

        onPrevClick: () => {
          driverObj.movePrevious()
        },

        // ── Mark as seen on any exit ──
        onDestroyStarted: () => {
          localStorage.setItem(storageKey, 'true')
          driverObj.destroy()
        },
        onDestroyed: () => {
          localStorage.setItem(storageKey, 'true')
        },
      } as Config)

      driverObj.drive()
    }, delay)

    return () => {
      clearTimeout(timer)
      cleanupRef.current?.()
      driverObj?.destroy()
    }
    // Tour initialises once per mount for a given tourKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourKey])
}
