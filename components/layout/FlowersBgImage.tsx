export default function FlowersBgImage() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/flowersIcon.png"
      alt=""
      aria-hidden
      className="w-full md:w-1/2"
      style={{
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: 0.45,
        pointerEvents: 'none',
        zIndex: -1,
      }}
    />
  )
}
