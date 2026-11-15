import { motion } from 'framer-motion';

const ease = [0.22, 1, 0.36, 1] as const;

export function Scene1() {
  return (
    <motion.section
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0, scale: 1.035 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.12, filter: 'blur(8px)' }}
      transition={{ duration: 0.48, ease }}
      style={{ background: 'var(--paper)' }}
    >
      <motion.img
        src={`${import.meta.env.BASE_URL}images/hero-path.jpg`}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        initial={{ opacity: 0.14 }}
        animate={{ opacity: 1, scale: 1.025, x: 0 }}
        transition={{ duration: 4.4, ease: 'linear' }}
        style={{ objectPosition: 'center 48%' }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#f7f4f0]/95 via-[#f7f4f0]/72 to-transparent" />
      <div className="absolute left-[6%] top-[10%] z-10">
        <motion.p
          className="mono-label text-[1.8vmin] font-semibold text-[#6e0000]"
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.04, duration: 0.35 }}
        >
          CAREERPATH <span className="text-[#c49500]">/</span> USC
        </motion.p>
        <div className="mt-[5.5vmin]">
          {['NO', 'STRAIGHT', 'LINE.'].map((word, i) => (
            <motion.div
              key={word}
              className="display-face font-extrabold leading-[0.84] tracking-[-0.055em] text-[#990000]"
              style={{ fontSize: i === 1 ? '12.3vmin' : '16vmin' }}
              initial={{ opacity: 0, scale: 1.36, y: 16, rotate: i === 2 ? 1.2 : -1.2 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
              transition={{ delay: 0.12 + i * 0.42, duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            >
              {word}
            </motion.div>
          ))}
        </div>
        <motion.div
          className="mt-[2.4vmin] h-[.65vmin] w-[19vmin] rounded-full bg-[#ffcc00]"
          initial={{ scaleX: 0, transformOrigin: 'left' }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.5, duration: 0.48, ease }}
        />
        <motion.p
          className="mt-[2.2vmin] max-w-[43vmin] text-[3.15vmin] leading-[1.18] text-[#2a1418]"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.48, duration: 0.45, ease }}
        >
          A career rarely moves in one direction.
        </motion.p>
        <motion.p
          className="mono-label mt-[4.7vmin] text-[1.55vmin] text-[#6e0000]/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.05, duration: 0.35 }}
        >
          SAMPLE JOURNEYS · NOT PROMISES
        </motion.p>
      </div>
      <svg className="absolute right-[21.2%] top-[24.7%] z-10 h-[34vmin] w-[28vmin] overflow-visible" viewBox="0 0 280 340" fill="none" aria-hidden="true">
        <motion.path
          d="M265 12C205 35 225 87 150 112C74 138 222 180 142 213C84 238 113 275 14 326"
          stroke="#FFCC00"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray="1 18"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.55, duration: 2.3, ease: 'easeInOut' }}
        />
        <motion.circle
          cx="265" cy="12" r="11" fill="#FFCC00"
          initial={{ scale: 0, transformOrigin: '265px 12px' }}
          animate={{ scale: [0, 1.2, 1, 1, 16], opacity: [1, 1, 1, 1, 0] }}
          transition={{ times: [0, 0.12, 0.2, 0.8, 1], delay: 0.1, duration: 4.38, ease: 'easeInOut' }}
        />
      </svg>
      <motion.div
        className="absolute bottom-0 left-0 h-[1.4vmin] bg-[#990000]"
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ delay: 0.1, duration: 4.2, ease: 'linear' }}
      />
    </motion.section>
  );
}
