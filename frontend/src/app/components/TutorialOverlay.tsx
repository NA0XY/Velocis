/**
 * TutorialOverlay
 * Renders the spotlight + tooltip card for the guided onboarding tour.
 *
 * Spotlight technique: four semi-transparent overlay rectangles surround
 * the target element, leaving it "cut out". The tooltip card floats
 * adjacent to the spotlight and contains Next / Skip controls.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useTutorial } from '../../lib/tutorial';

const PADDING = 8;   // extra space around the highlighted element (px)
const GAP     = 14;  // gap between spotlight edge and tooltip (px)

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getElementRect(id: string): Rect | null {
  const el = document.getElementById(id);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  // If element is hidden (display:none or zero-size) fall back to centered modal
  if (r.width === 0 || r.height === 0) return null;
  return {
    top:    r.top    - PADDING,
    left:   r.left   - PADDING,
    width:  r.width  + PADDING * 2,
    height: r.height + PADDING * 2,
  };
}

export function TutorialOverlay() {
  const { isActive, currentStep, steps, next, skip } = useTutorial();
  const step = steps[currentStep];

  const [spotlightRect, setSpotlightRect] = useState<Rect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  });

  const tooltipRef = useRef<HTMLDivElement>(null);

  // ─── Recalculate spotlight whenever step or viewport changes ───────────────
  useEffect(() => {
    if (!isActive || !step?.targetId) {
      setSpotlightRect(null);
      return;
    }

    const update = () => {
      const rect = getElementRect(step.targetId!);
      setSpotlightRect(rect);
      if (rect) {
        // Scroll target into view if off-screen
        const el = document.getElementById(step.targetId!);
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };

    update();

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isActive, step?.targetId, currentStep]);

  // ─── Position tooltip adjacent to the spotlight ────────────────────────────
  useLayoutEffect(() => {
    if (!isActive) return;

    // Centred fallback — used for steps with no target, or when target is hidden
    if (!spotlightRect || !tooltipRef.current) {
      setTooltipStyle({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      });
      return;
    }

    const tip   = tooltipRef.current;
    const tw    = tip.offsetWidth  || 320;
    const th    = tip.offsetHeight || 160;
    const pos   = step?.position ?? 'bottom';
    const vw    = window.innerWidth;
    const vh    = window.innerHeight;

    let top  = 0;
    let left = 0;

    switch (pos) {
      case 'bottom':
        top  = spotlightRect.top + spotlightRect.height + GAP;
        left = spotlightRect.left + spotlightRect.width / 2 - tw / 2;
        break;
      case 'top':
        top  = spotlightRect.top - th - GAP;
        left = spotlightRect.left + spotlightRect.width / 2 - tw / 2;
        break;
      case 'left':
        top  = spotlightRect.top + spotlightRect.height / 2 - th / 2;
        left = spotlightRect.left - tw - GAP;
        break;
      case 'right':
        top  = spotlightRect.top + spotlightRect.height / 2 - th / 2;
        left = spotlightRect.left + spotlightRect.width + GAP;
        break;
    }

    // Clamp within viewport
    left = Math.max(16, Math.min(left, vw - tw - 16));
    top  = Math.max(16, Math.min(top,  vh - th - 16));

    setTooltipStyle({ top, left, transform: 'none' });
  }, [spotlightRect, step?.position, currentStep, isActive]);

  // ─── Keyboard support ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip();
      if (e.key === 'Enter' || e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isActive, next, skip]);

  if (!isActive || !step) return null;

  const isLastStep = currentStep === steps.length - 1;

  return (
    // Root: fixed full-screen, highest z-index
    <div className="fixed inset-0" style={{ zIndex: 99999 }}>

      {/* ── Overlay rectangles (spotlight cutout technique) ─────────────────── */}
      {spotlightRect ? (
        <>
          {/* Top */}
          <div
            className="fixed bg-black/70 transition-all duration-300"
            style={{ inset: 0, bottom: `calc(100% - ${spotlightRect.top}px)` }}
          />
          {/* Bottom */}
          <div
            className="fixed bg-black/70 transition-all duration-300"
            style={{ inset: 0, top: spotlightRect.top + spotlightRect.height }}
          />
          {/* Left */}
          <div
            className="fixed bg-black/70 transition-all duration-300"
            style={{
              top:    spotlightRect.top,
              left:   0,
              width:  spotlightRect.left,
              height: spotlightRect.height,
            }}
          />
          {/* Right */}
          <div
            className="fixed bg-black/70 transition-all duration-300"
            style={{
              top:    spotlightRect.top,
              left:   spotlightRect.left + spotlightRect.width,
              right:  0,
              height: spotlightRect.height,
            }}
          />
          {/* Spotlight glow ring — purely decorative, no pointer events */}
          <div
            className="fixed rounded-xl pointer-events-none transition-all duration-300"
            style={{
              top:    spotlightRect.top,
              left:   spotlightRect.left,
              width:  spotlightRect.width,
              height: spotlightRect.height,
              boxShadow:
                '0 0 0 2px rgba(255,255,255,0.85), 0 0 24px 8px rgba(255,255,255,0.12)',
            }}
          />
        </>
      ) : (
        // Full overlay for centred modal steps — no click-to-dismiss so the
        // backdrop appearing under the cursor doesn't accidentally skip the tour
        <div className="fixed inset-0 bg-black/70" />
      )}

      {/* ── Tooltip card ───────────────────────────────────────────────────── */}
      <div
        ref={tooltipRef}
        className="fixed w-[320px] max-w-[calc(100vw-2rem)]
                   bg-white dark:bg-[#111114]
                   border border-zinc-200 dark:border-zinc-800
                   rounded-2xl shadow-2xl p-5
                   transition-[top,left] duration-300"
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Inline styles for the CTA lift+ripple animation */}
        <style>{`
          .tutorial-cta-btn {
            position: relative;
            overflow: visible;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .tutorial-cta-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.22);
          }
          .tutorial-cta-btn:active {
            transform: translateY(-1px);
            box-shadow: 0 5px 10px rgba(0,0,0,0.18);
          }
          .tutorial-cta-btn::after {
            content: '';
            display: inline-block;
            height: 100%;
            width: 100%;
            border-radius: inherit;
            position: absolute;
            top: 0; left: 0;
            z-index: -1;
            background-color: #111111;
            transition: transform 0.4s, opacity 0.4s;
          }
          .tutorial-cta-btn:hover::after {
            transform: scaleX(1.4) scaleY(1.6);
            opacity: 0;
          }
        `}</style>

        {/* Progress dots + close button */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? 'bg-zinc-900 dark:bg-white w-5'
                    : i < currentStep
                    ? 'bg-zinc-400 dark:bg-zinc-500 w-1.5'
                    : 'bg-zinc-200 dark:bg-zinc-700 w-1.5'
                }`}
              />
            ))}
          </div>
          <button
            onClick={skip}
            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800
                       text-zinc-400 dark:text-zinc-500 hover:text-zinc-600
                       dark:hover:text-zinc-300 transition-colors"
            aria-label="Skip tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <h3 className="font-semibold text-[15px] text-zinc-900 dark:text-white mb-1.5 leading-snug">
          {step.title}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-5">
          {step.description}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={skip}
            className="text-sm text-zinc-400 dark:text-zinc-500
                       hover:text-zinc-700 dark:hover:text-zinc-300
                       transition-colors"
          >
            Skip tour
          </button>

          <button
            onClick={next}
            className="tutorial-cta-btn px-4 py-2 bg-[#111111] dark:bg-white
                       text-white dark:text-zinc-900
                       text-sm font-semibold rounded-lg"
          >
            {isLastStep ? 'Done ✓' : 'Next →'}
          </button>
        </div>

        {/* Step counter */}
        <div className="mt-3 text-center text-[11px] text-zinc-300 dark:text-zinc-600">
          {currentStep + 1} / {steps.length}
        </div>
      </div>
    </div>
  );
}
