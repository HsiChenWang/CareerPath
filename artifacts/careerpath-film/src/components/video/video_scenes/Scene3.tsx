import { motion } from 'framer-motion';

const ease = [0.22, 1, 0.36, 1] as const;
const milestones = [
  { label: 'FRESHMAN', text: 'Build club', count: '01' },
  { label: 'JUNIOR', text: 'Startup internship', count: '02' },
  { label: 'NOW', text: 'Product Manager', count: '03' },
];

export function Scene3() {
  return (
    <motion.section
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0, scale: 1.08, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: '-4%', rotateY: -7 }}
      transition={{ duration: 0.62, ease }}
      style={{ background: '#f7f4f0', perspective: 1000 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_76%_50%,#fffdf7_0%,#f7f4f0_58%,#efe2d8_100%)]" />
      <motion.div
        className="absolute -right-[7%] top-0 h-full w-[31%] bg-[#990000]"
        initial={{ scaleX: 0, transformOrigin: 'right' }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.1, duration: 0.55, ease }}
      />
      <div className="absolute left-[6%] top-[9%] z-10 w-[36%]">
        <motion.p className="mono-label text-[1.7vmin] font-semibold text-[#990000]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>PATH FINDER / SAMPLE OUTPUT</motion.p>
        <motion.h2
          className="display-face mt-[2vmin] font-bold leading-[.91] tracking-[-.045em] text-[#2a1418]"
          style={{ fontSize: '7.8vmin' }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.42, duration: 0.48, ease }}
        >
          See the steps.
          <br />
          <span className="text-[#990000]">Find your gap.</span>
        </motion.h2>
      </div>
      <motion.div
        className="card-shadow absolute left-[43%] top-[12%] z-10 w-[46%] rounded-[2.3vmin] border border-[#2a1418]/10 bg-[#fffdf7] p-[3vmin]"
        initial={{ opacity: 0, x: 80, rotateY: -10, rotateZ: 2, scale: 0.92 }}
        animate={{ opacity: 1, x: 0, rotateY: 0, rotateZ: 0, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.68, ease }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="flex items-center gap-[1.7vmin]">
          <motion.div
            className="grid h-[8vmin] w-[8vmin] place-items-center rounded-full bg-[#990000] font-display text-[3.3vmin] font-bold text-[#ffcc00]"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.18, 1] }}
            transition={{ delay: 0.22, duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
          >PS</motion.div>
          <div>
            <p className="text-[2.6vmin] font-bold leading-none text-[#2a1418]">Priya Shah</p>
            <p className="mono-label mt-[.8vmin] text-[1.25vmin] text-[#927f78]">VITERBI ’21 · SAMPLE PROFILE</p>
          </div>
          <div className="ml-auto rounded-full bg-[#fff4c2] px-[1.2vmin] py-[.7vmin]">
            <p className="mono-label text-[1.1vmin] text-[#6e0000]">GOAL</p>
            <p className="text-[1.65vmin] font-semibold text-[#2a1418]">Product Manager</p>
          </div>
        </div>
        <div className="relative mt-[3.2vmin] space-y-[1.1vmin]">
          <motion.div className="absolute bottom-[2vmin] left-[2.15vmin] top-[2vmin] w-[.35vmin] origin-top bg-[#ffcc00]" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.75, duration: 2.3, ease: 'easeInOut' }} />
          {milestones.map((row, i) => (
            <motion.div
              key={row.count}
              className="relative flex items-center gap-[1.5vmin] rounded-[1.2vmin] bg-[#f7f4f0] px-[1.5vmin] py-[1.3vmin]"
              initial={{ opacity: 0, x: 34 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.64 + i * 0.56, duration: 0.42, ease }}
            >
              <span className="z-10 grid h-[4.4vmin] w-[4.4vmin] place-items-center rounded-full border-[.45vmin] border-[#990000] bg-[#fffdf7] text-[1.35vmin] font-bold text-[#990000]">{row.count}</span>
              <span className="min-w-0">
                <span className="mono-label block text-[1.1vmin] text-[#990000]">{row.label}</span>
                <span className="block text-[2.1vmin] font-semibold text-[#2a1418]">{row.text}</span>
              </span>
              <span className="ml-auto h-[1.2vmin] w-[1.2vmin] rounded-full bg-[#ffcc00]" />
            </motion.div>
          ))}
        </div>
      </motion.div>
      <motion.div
        className="absolute bottom-[10%] left-[13%] z-20 w-[37%] rounded-[2vmin] border border-[#990000]/15 bg-[#fff4c2] p-[2.2vmin]"
        initial={{ opacity: 0, scale: 0.84, y: 22, rotate: -2 }}
        animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
        transition={{ delay: 3.15, duration: 0.52, ease }}
      >
        <p className="mono-label text-[1.45vmin] font-semibold text-[#990000]">MY GAP / A POSSIBLE NEXT MOVE</p>
        <p className="mt-[.9vmin] font-display text-[3.15vmin] font-semibold leading-[1.05] text-[#2a1418]">Try one project with real users.</p>
      </motion.div>
      <motion.p
        className="absolute bottom-[4%] left-[43%] z-20 text-[1.6vmin] text-[#6d5653]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4.22, duration: 0.38 }}
      >A suggested next step. Your path is yours.</motion.p>
      <svg className="absolute bottom-0 left-0 z-20 h-[17vmin] w-[100%]" viewBox="0 0 1920 240" fill="none" aria-hidden="true">
        <motion.path
          d="M0 210C265 180 360 80 570 116C770 150 880 206 1100 120C1320 35 1450 88 1920 20"
          stroke="#FFCC00" strokeWidth="12" strokeLinecap="round" strokeDasharray="1 28"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.72, duration: 4.9, ease: 'easeInOut' }}
        />
      </svg>
    </motion.section>
  );
}
