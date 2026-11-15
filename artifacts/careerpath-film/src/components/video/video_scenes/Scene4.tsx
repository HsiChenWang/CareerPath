import { motion } from 'framer-motion';

const ease = [0.22, 1, 0.36, 1] as const;

export function Scene4() {
  return (
    <motion.section
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0, clipPath: 'inset(0 0 0 100%)' }}
      animate={{ opacity: 1, clipPath: 'inset(0 0 0 0%)' }}
      exit={{ opacity: 0, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 84%)', scale: 1.08 }}
      transition={{ duration: 0.62, ease }}
      style={{ background: '#fff4c2' }}
    >
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#990000 0.12vmin, transparent 0.16vmin)', backgroundSize: '2.4vmin 2.4vmin', opacity: 0.08 }} />
      <motion.div
        className="absolute -right-[4%] top-[-10%] h-[120%] w-[40%] rounded-l-[30vmin] bg-[#990000]"
        initial={{ x: '20%', rotate: 8 }}
        animate={{ x: 0, rotate: 0 }}
        transition={{ duration: 0.65, ease }}
      />
      <motion.div
        className="absolute right-[7%] top-[17%] z-10 grid h-[29vmin] w-[29vmin] place-items-center rounded-full border-[.8vmin] border-[#ffcc00] bg-[#6e0000] font-display text-[15vmin] font-bold leading-none text-[#ffcc00]"
        initial={{ scale: 0.55, rotate: -14, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.7, ease }}
      >PS</motion.div>
      <div className="absolute left-[7%] top-[9%] z-20 w-[56%]">
        <motion.p className="mono-label text-[1.65vmin] font-semibold text-[#990000]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>A THOUGHTFUL INTRODUCTION</motion.p>
        <motion.div
          className="card-shadow mt-[2vmin] rounded-[2.2vmin] border border-[#2a1418]/10 bg-[#fffdf7] p-[2.5vmin]"
          initial={{ opacity: 0, x: -44, rotate: -2, scale: 0.94 }}
          animate={{ opacity: 1, x: 0, rotate: 0, scale: 1 }}
          transition={{ delay: 0.12, duration: 0.58, ease }}
        >
          <p className="text-[2.35vmin] leading-[1.34] text-[#2a1418]">
            Hi Priya — I saw you were in Hack SC. I’m exploring product and would love to hear how you chose your first internship.
          </p>
          <motion.div
            className="mt-[1.8vmin] inline-flex items-center gap-[.9vmin] rounded-full bg-[#6e0000] px-[1.3vmin] py-[.8vmin] text-[1.4vmin] font-semibold text-[#fff4c2]"
            initial={{ opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.0, duration: 0.3 }}
          >
            <span className="h-[.9vmin] w-[.9vmin] rounded-full bg-[#ffcc00]" />
            AI drafts. You review before sending.
          </motion.div>
        </motion.div>
      </div>
      <motion.div
        className="absolute bottom-[11%] left-[7%] z-20 flex w-[65%] items-center gap-[2vmin]"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5, duration: 0.48, ease }}
      >
        <div className="h-[.5vmin] flex-1 bg-[#990000]/25">
          <motion.div className="h-full bg-[#990000]" initial={{ scaleX: 0, transformOrigin: 'left' }} animate={{ scaleX: 1 }} transition={{ delay: 2.65, duration: 1.6, ease: 'linear' }} />
        </div>
        <span className="grid h-[2vmin] w-[2vmin] place-items-center rounded-full bg-[#ffcc00] ring-[.5vmin] ring-[#990000]/20" />
      </motion.div>
      <motion.div
        className="absolute bottom-[18%] left-[7%] z-20 flex items-end gap-[2.5vmin]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.62, duration: 0.4, ease }}
      >
        <div>
          <p className="mono-label text-[1.3vmin] text-[#990000]">COFFEE CHAT / THURSDAY</p>
          <p className="mt-[.65vmin] text-[2vmin] font-semibold text-[#2a1418]">Ask about the first project that felt real.</p>
        </div>
        <motion.div
          className="ml-[2vmin] rounded-[1.2vmin] border border-[#990000]/20 bg-[#fffdf7] px-[1.5vmin] py-[1.1vmin]"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 3.9, duration: 0.32 }}
        >
          <p className="mono-label text-[1.2vmin] text-[#990000]">FOLLOW UP</p>
          <p className="mt-[.4vmin] text-[1.65vmin] font-semibold text-[#2a1418]">Thanks for sharing your story.</p>
        </motion.div>
      </motion.div>
      <motion.h2
        className="display-face absolute bottom-[3%] right-[5%] z-20 w-[43%] text-right font-bold leading-[.9] tracking-[-.04em] text-[#fff4c2]"
        style={{ fontSize: '6.2vmin' }}
        initial={{ opacity: 0, scale: 0.78, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 4.08, duration: 0.44, ease }}
      >
        REAL PEOPLE.
        <br />
        REAL NEXT STEPS.
      </motion.h2>
      <motion.div
        className="absolute left-[56%] top-[48%] z-30 h-[1.8vmin] w-[1.8vmin] rounded-full bg-[#ffcc00]"
        initial={{ scale: 0 }}
        animate={{ scale: [1, 1, 30], x: ['0%', '22vw', '22vw'], y: ['0%', '-22vh', '-22vh'], opacity: [1, 1, 0] }}
        transition={{ delay: 4.82, duration: 0.66, ease: 'easeIn' }}
      />
    </motion.section>
  );
}
