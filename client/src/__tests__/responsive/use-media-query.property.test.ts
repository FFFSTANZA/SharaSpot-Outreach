import { renderHook } from "@testing-library/react";
import fc from "fast-check";
import { useMediaQuery } from "@/hooks/useMediaQuery";

describe("useMediaQuery property tests", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("returns false when matchMedia is unavailable (SSR simulation)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 2000 }),
        (width) => {
          window.matchMedia = undefined as unknown as (query: string) => MediaQueryList;

          const { result } = renderHook(() =>
            useMediaQuery(`(min-width: ${width}px)`),
          );

          expect(result.current).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("returns correct match state for any valid media query width", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 2000 }),
        fc.boolean(),
        (width, shouldMatch) => {
          window.matchMedia = jest.fn().mockImplementation((query: string) => ({
            matches: shouldMatch,
            media: query,
            onchange: null,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            addListener: jest.fn(),
            removeListener: jest.fn(),
            dispatchEvent: jest.fn(),
          })) as unknown as (query: string) => MediaQueryList;

          const { result } = renderHook(() =>
            useMediaQuery(`(min-width: ${width}px)`),
          );

          expect(result.current).toBe(shouldMatch);

          window.matchMedia = originalMatchMedia;
        },
      ),
      { numRuns: 100 },
    );
  });
});
