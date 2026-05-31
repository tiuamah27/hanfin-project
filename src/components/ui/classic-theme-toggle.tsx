import { type ButtonHTMLAttributes, type CSSProperties, useId } from "react";

export interface ClassicProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  duration?: number;
  [key: `data-${string}`]: string | number | boolean | null | undefined;
}

export function Classic({
  duration = 400,
  className,
  type = "button",
  title = "Toggle theme",
  "aria-label": ariaLabel = "Toggle theme",
  ...props
}: ClassicProps) {
  const toggleId = useId();
  const clipMainId = `toggles.dev-classic-main-${toggleId}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .classic-toggle-path {
          transition-property: d, translate;
          transition-duration: var(--toggles-dot-dev--duration);
        }
        .dark .classic-toggle-path {
          transition-delay: calc(var(--toggles-dot-dev--duration) * 0.15);
          d: path('M0 2h13a1 1 0 0010 10v14H0Z');
        }
        @supports not (d: path('M0 0')) {
          .dark .classic-toggle-path {
            transform: translate(-3.25px, 0.5px);
          }
        }
        .classic-toggle-circle {
          transform-origin: center;
          transition-property: transform;
          transition-duration: var(--toggles-dot-dev--duration);
        }
        .dark .classic-toggle-circle {
          transform: scale(1.7);
        }
        .classic-toggle-ray {
          transform-box: view-box;
          transform-origin: center;
          transition: transform var(--toggles-dot-dev--duration), opacity var(--toggles-dot-dev--duration);
          transition-delay: calc(var(--toggles-dot-dev--duration) * 0.15);
        }
        .dark .classic-toggle-ray {
          transition-delay: 0s;
          transform: scale(0);
          opacity: 0;
        }
      `}} />
      <button
        type={type}
        title={title}
        aria-label={ariaLabel}
        className={className}
        {...props}
      >
        <svg
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          aria-hidden="true"
          style={
            { "--toggles-dot-dev--duration": `${duration}ms` } as CSSProperties
          }
        >
          <defs>
            <clipPath id={clipMainId}>
              <path
                d={"M0 0h25a1 1 0 0010 10v14H0Z"}
                className="classic-toggle-path"
              />
            </clipPath>
          </defs>
          <g stroke={"currentColor"} strokeLinecap={"round"}>
            <circle
              cx={12}
              cy={12}
              r={5}
              fill={"currentColor"}
              clipPath={`url(#${clipMainId})`}
              className="classic-toggle-circle"
            />
            <path d={"M12 1.4v2.4"} fill={"none"} strokeWidth={2} strokeLinejoin={"round"} strokeMiterlimit={0} paintOrder={"stroke markers fill"} className="classic-toggle-ray" />
            <path d={"m20.3 3.7-2.5 2.5"} fill={"none"} strokeWidth={2} strokeLinejoin={"round"} strokeMiterlimit={0} paintOrder={"stroke markers fill"} className="classic-toggle-ray" />
            <path d={"M22.6 12h-2.4"} fill={"none"} strokeWidth={2} strokeLinejoin={"round"} strokeMiterlimit={0} paintOrder={"stroke markers fill"} className="classic-toggle-ray" />
            <path d={"M12 22.6v-2.4"} fill={"none"} strokeWidth={2} strokeLinejoin={"round"} strokeMiterlimit={0} paintOrder={"stroke markers fill"} className="classic-toggle-ray" />
            <path d={"M1.4 12h2.4"} fill={"none"} strokeWidth={2} strokeLinejoin={"round"} strokeMiterlimit={0} paintOrder={"stroke markers fill"} className="classic-toggle-ray" />
            <path d={"m20.3 20.3-2.5-2.5"} fill={"none"} strokeWidth={2} strokeLinejoin={"round"} strokeMiterlimit={0} paintOrder={"stroke markers fill"} className="classic-toggle-ray" />
            <path d={"m3.7 20.3 2.5-2.5"} fill={"none"} strokeWidth={2} strokeLinejoin={"round"} strokeMiterlimit={0} paintOrder={"stroke markers fill"} className="classic-toggle-ray" />
            <path d={"m3.7 3.7 2.5 2.5"} fill={"none"} strokeWidth={2} strokeLinejoin={"round"} strokeMiterlimit={0} paintOrder={"stroke markers fill"} className="classic-toggle-ray" />
          </g>
        </svg>
      </button>
    </>
  );
}
