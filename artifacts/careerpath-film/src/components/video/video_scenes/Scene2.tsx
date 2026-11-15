import { motion } from 'framer-motion';

const ease = [0.22, 1, 0.36, 1] as const;
const branches = [
  'M500 420 C390 350 330 270 250 180',
  'M500 420 C420 300 445 230 420 120',
  'M500 420 C550 300 565 230 610 150',
  'M500 420 C630 345 700 290 790 250',
  'M500 420 C615 465 700 500 810 555',
  'M500 420 C420 515 350 565 255 610',
  'M500 420 C490 535 485 590 490 690',
];

export function Scene2() {
  return (
    <motion.section
      className="absolute inset-0 overflow-hidden"
      initial={{ clipPath: 'circle(0% at 78% 26%)', opacity: 0.9 }}
      animate={{ clipPath: 'circle(150% at 78% 26%)', opacity: 1 }}
      exit={{ clipPath: 'circle(0% at 50% 50%)', opacity: 0 }}
      transition={{ duration: 0.68, ease }}
      style={{ background: 'var(--cardinal-deep)' }}
    >
      <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(#ffcc00 1px, transparent 1.5px)', backgroundSize: '3.8vmin 3.8vmin' }} />
      <div className="absolute left-[6%] top-[8%]">
        <motion.p className="mono-label text-[1.8vmin] text-[#ffcc00]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28, duration: 0.3 }}>ONE STORY</motion.p>
        <motion.h2
          className="display-face absolute left-0 top-[5vmin] w-[80vmin] font-bold leading-[.88] tracking-[-.04em] text-[#fff4c2]"
          style={{ fontSize: '9.5vmin' }}
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.95, duration: 0.5, ease }}
        >
          EVERY PATH
          <br />
          <span className="text-[#ffcc00]">LEAVES CLUES.</span>
        </motion.h2>
      </div>
      <svg className="absolute left-[43%] top-[-23%] h-[90%] w-[70%]" viewBox="0 0 1000 760" fill="none" aria-hidden="true">
        {branches.map((d, i) => (
          <motion.path
            key={d}
            d={d}
            stroke={i % 2 ? '#FFF4C2' : '#FFCC00'}
            strokeWidth={i === 3 ? 7 : 4}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 0.7, 0.55] }}
            transition={{ delay: 0.22 + i * 0.11, duration: 1.65, ease: 'easeOut' }}
          />
        ))}
        {[
          [500, 420], [250, 180], [420, 120], [610, 150], [790, 250], [810, 555], [255, 610], [490, 690],
          [360, 310], [660, 390], [370, 510], [640, 565],
        ].map(([cx, cy], i) => (
          <motion.circle
            key={`${cx}-${cy}`}
            cx={cx} cy={cy} r={i === 0 ? 17 : 10}
            fill={i % 3 === 0 ? '#FFCC00' : '#FFF4C2'}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.35, 1], opacity: 1 }}
            transition={{ delay: 0.42 + i * 0.12, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </svg>
      <motion.div
        className="absolute bottom-[9%] left-[7%] flex gap-[2vmin]"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.45, duration: 0.4, ease }}
      >
        {['BUILD CLUB', 'FIRST INTERNSHIP', 'ROLE CHANGE'].map((label, i) => (
          <motion.span
            key={label}
            className="mono-label rounded-full border border-[#fff4c2]/30 bg-[#2a1418]/30 px-[1.4vmin] py-[.9vmin] text-[1.45vmin] text-[#fff4c2]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 2.55 + i * 0.26, duration: 0.28 }}
          >
            {label}
          </motion.span>
        ))}
      </motion.div>
      <motion.p
        className="absolute bottom-[3%] right-[7%] text-[2.2vmin] text-[#fff4c2]/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.55, duration: 0.35 }}
      >
        Common steps, not a required formula.
      </motion.p>
      <motion.div
        className="absolute left-[78%] top-[26%] h-[2.2vmin] w-[2.2vmin] rounded-full bg-[#ffcc00]"
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1, 40], x: ['0%', '-31vw', '-31vw'], y: ['0%', '-10vh', '-10vh'], opacity: [1, 1, 0] }}
        transition={{ delay: 4.25, duration: 0.72, ease: 'easeIn' }}
      />
    </motion.section>
  );
}
