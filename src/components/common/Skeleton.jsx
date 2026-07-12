// Thin wrapper around the .skeleton/skeletonPulse CSS already defined in
// styles/animations.css. width/height accept any CSS length; circle renders
// a fully-round placeholder (avatars/icons) instead of the default rounded
// rectangle (text lines/cards).
function Skeleton({ width = '100%', height = '1em', circle = false, className = '', style }) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{
        display: 'inline-block',
        width,
        height,
        borderRadius: circle ? '9999px' : undefined,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

export default Skeleton;
