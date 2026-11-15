import { motion } from 'framer-motion';

const ease = [0.22, 1, 0.36, 1] as const;

export function Scene5() {
  return (
    <motion.section
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0, clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ opacity: 1, clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ opacity: 1, backgroundColor: '#f7f4f0' }}
      transition={{ duration: 0.6, ease }}
      style={{ background: '#990000' }}
    >
      <motion.div
        className="absolute left-[78%] top-[26%] h-[2.6vmin] w-[2.6vmin] rounded-full bg-[#ffcc00]"
        initial={{ scale: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.08, duration: 0.35, ease }}
      />
      <motion.div
        className="absolute inset-0 bg-[#f7f4f0]"
        initial={{ clipPath: 'circle(0% at 78% 26%)' }}
        animate={{ clipPath: ['circle(0% at 78% 26%)', 'circle(0% at 78% 26%)', 'circle(150% at 78% 26%)'] }}
        transition={{ times: [0, 0.29, 0.47], delay: 0.08, duration: 5.8, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
        <motion.div
          className="display-face absolute text-center font-extrabold leading-[.78] tracking-[-.06em] text-[#fff4c2]"
          style={{ fontSize: '16vmin' }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: [0, 1, 1, 1, 0], scale: [0.72, 1, 1, 1, 0.82], y: [18, 0, 0, 0, -18] }}
          transition={{ times: [0, 0.12, 0.33, 0.78, 0.93], delay: 0.05, duration: 2.45, ease }}
        >
          EXPLORE.
          <br />
          CONNECT.
          <br />
          MOVE FORWARD.
        </motion.div>
        <motion.div
          className="absolute flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: [0, 0, 1, 1, 0], scale: [0.92, 0.92, 1, 1, 0.96], y: [16, 16, 0, 0, -10] }}
          transition={{ times: [0, 0.25, 0.42, 0.84, 1], duration: 5.75, ease }}
        >
          <motion.img
            src={`${import.meta.env.BASE_URL}images/careerpath-mark.svg`}
            alt="CareerPath mark"
            className="h-[11vmin] w-[11vmin]"
            initial={{ scale: 0.4, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 2.18, duration: 0.55, ease }}
          />
          <p className="display-face mt-[1.2vmin] text-[7.2vmin] font-bold tracking-[-.04em] text-[#990000]">CareerPath</p>
          <motion.p
            className="mt-[2.2vmin] text-center font-display text-[4.2vmin] font-semibold leading-[1.05] text-[#2a1418]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.52, duration: 0.48, ease }}
          >Somebody already walked your path.</motion.p>
          <motion.p
            className="mono-label mt-[3vmin] text-[1.5vmin] text-[#6d5653]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.42, duration: 0.35 }}
          >DEMO USES SAMPLE ALUMNI DATA</motion.p>
        </motion.div>
      </div>
      <svg className="absolute bottom-[8%] left-[12%] z-20 h-[10vmin] w-[76%]" viewBox="0 0 1440 150" fill="none" aria-hidden="true">
        <motion.path
          d="M10 110C200 20 390 125 570 65C750 5 920 120 1090 70C1240 25 1320 50 1430 16"
          stroke="#FFCC00" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 17"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 0, 0.65, 0.65, 0] }}
          transition={{ times: [0, 0.3, 0.52, 0.82, 1], duration: 5.8, ease: 'easeInOut' }}
        />
      </svg>
    </motion.section>
  );
}
