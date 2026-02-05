/**
 * Mobile device detection utility
 * Used by VirtualJoystick and OrientationWarning components
 */

/**
 * Detects if the current device is a mobile device.
 * Checks for touch capability and screen size to determine mobile status.
 *
 * @returns true if the device is likely a mobile device, false otherwise
 */
export function isMobileDevice(): boolean {
  // Server-side rendering check
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for touch capability
  const hasTouchScreen =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - msMaxTouchPoints is IE-specific
    navigator.msMaxTouchPoints > 0;

  // Check screen size (typical mobile breakpoint)
  const isSmallScreen = window.innerWidth <= 768;

  // Check for mobile user agent patterns as a fallback
  const mobileUserAgentPattern =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const hasMobileUserAgent = mobileUserAgentPattern.test(navigator.userAgent);

  // Device is considered mobile if it has touch AND (small screen OR mobile user agent)
  // This helps distinguish touch-enabled laptops from actual mobile devices
  return hasTouchScreen && (isSmallScreen || hasMobileUserAgent);
}

/**
 * Checks if the device supports touch input.
 * Unlike isMobileDevice(), this returns true for touch-enabled laptops as well.
 *
 * @returns true if touch input is supported, false otherwise
 */
export function hasTouchSupport(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - msMaxTouchPoints is IE-specific
    navigator.msMaxTouchPoints > 0
  );
}
