import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Pause, Play, Repeat, Volume2, VolumeX } from 'lucide-react';
import VideoTemplate, { SCENE_DURATIONS } from './VideoTemplate';
import { useSceneControls } from './useSceneControls';

const SCENE_DETAILS: Record<string, { title: string; filePath: string }> = {
  scene1: { title: 'No straight line', filePath: 'src/components/video/video_scenes/Scene1.tsx' },
  scene2: { title: 'Every path leaves clues', filePath: 'src/components/video/video_scenes/Scene2.tsx' },
  scene3: { title: 'See the steps', filePath: 'src/components/video/video_scenes/Scene3.tsx' },
  scene4: { title: 'Real people', filePath: 'src/components/video/video_scenes/Scene4.tsx' },
  scene5: { title: 'Somebody walked your path', filePath: 'src/components/video/video_scenes/Scene5.tsx' },
};
const PROGRESS_TICK_MS = 60;

function formatPlaybackTime(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function announceSceneSelection(index: number, sceneKeys: string[]) {
  const key = sceneKeys[index];
  const details = SCENE_DETAILS[key];
  if (!details?.filePath) return;
  window.parent.postMessage({
    type: 'REPLIT_VIDEO_SCENE_SELECTED',
    payload: {
      sceneIndex: index,
      sceneCount: sceneKeys.length,
      sceneTitle: details.title,
      filePath: details.filePath,
      lineNumber: 1,
    },
  }, '*');
}

function PlaybackStatus({
  sceneKeys, activeIndex, activeDuration, activeStartTime, totalDuration, tick, paused, onJumpTo,
}: {
  sceneKeys: string[];
  activeIndex: number;
  activeDuration: number;
  activeStartTime: number;
  totalDuration: number;
  tick: number;
  paused: boolean;
  onJumpTo: (index: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const elapsedBaseRef = useRef(0);

  useEffect(() => {
    setElapsed(0);
    elapsedBaseRef.current = 0;
  }, [tick]);

  useEffect(() => {
    if (paused) return;
    const start = performance.now();
    const id = window.setInterval(() => setElapsed(elapsedBaseRef.current + performance.now() - start), PROGRESS_TICK_MS);
    return () => {
      window.clearInterval(id);
      elapsedBaseRef.current += performance.now() - start;
    };
  }, [tick, paused]);

  const progress = activeDuration > 0 ? Math.min(1, elapsed / activeDuration) : 0;
  const totalElapsed = Math.min(totalDuration, activeStartTime + Math.min(elapsed, activeDuration));

  return (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {sceneKeys.map((key, index) => (
          <button
            key={key}
            onClick={() => onJumpTo(index)}
            aria-label={`Jump to scene ${index + 1}`}
            aria-current={index === activeIndex ? 'true' : undefined}
            className="relative h-2.5 min-w-2 flex-1 overflow-hidden rounded-full bg-white/25 transition-[height] hover:h-3.5"
          >
            <span className="absolute inset-y-0 left-0 rounded-full bg-[#ffcc00]" style={{ width: `${index < activeIndex ? 100 : index === activeIndex ? progress * 100 : 0}%` }} />
          </button>
        ))}
      </div>
      <span className="shrink-0 font-mono text-sm text-white/75">{activeIndex + 1}/{sceneKeys.length}</span>
      <span className="min-w-[10ch] shrink-0 text-right font-mono text-sm tabular-nums text-white/85" role="timer">
        {formatPlaybackTime(totalElapsed)} / {formatPlaybackTime(totalDuration)}
      </span>
    </>
  );
}

export default function VideoWithControls() {
  const isIframed = typeof window !== 'undefined' && window.self !== window.top;
  const controls = useSceneControls(SCENE_DURATIONS);
  const {
    sceneKeys, activeIndex, locked, paused, mountKey, tick, durations,
    activeDuration, activeStartTime, totalDuration, onSceneChange, jumpTo, toggleLock, togglePause,
  } = controls;
  const [muted, setMuted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [tapPinned, setTapPinned] = useState(false);
  const sensorRef = useRef<HTMLDivElement | null>(null);

  const handleJumpTo = useCallback((index: number) => {
    jumpTo(index);
    announceSceneSelection(index, sceneKeys);
  }, [jumpTo, sceneKeys]);

  useEffect(() => {
    if (!paused) return;
    const frozen = document.getAnimations().filter((animation) => animation.playState === 'running');
    frozen.forEach((animation) => animation.pause());
    return () => frozen.forEach((animation) => animation.play());
  }, [paused]);

  useEffect(() => {
    if (!(collapsed && tapPinned)) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') return;
      if (sensorRef.current && !sensorRef.current.contains(event.target as Node)) setTapPinned(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [collapsed, tapPinned]);

  if (!isIframed) return <VideoTemplate />;

  const visible = !collapsed || hovering || tapPinned;
  return (
    <div className="relative h-screen w-full">
      <VideoTemplate
        key={mountKey}
        durations={durations}
        loop
        paused={paused}
        muted={muted}
        onSceneChange={onSceneChange}
      />
      <div
        ref={sensorRef}
        className="absolute bottom-0 left-0 right-0 z-50 flex flex-col justify-end"
        style={{ height: '25%' }}
        onPointerEnter={(event) => { if (event.pointerType === 'mouse') setHovering(true); }}
        onPointerLeave={(event) => { if (event.pointerType === 'mouse') setHovering(false); }}
        onPointerDown={(event) => { if (event.pointerType !== 'mouse' && collapsed) setTapPinned(true); }}
      >
        <div className="w-full flex-1" aria-hidden="true" />
        <div className={`flex items-center gap-2.5 bg-[#2a1418]/80 px-3 py-2.5 backdrop-blur-md transition-all duration-200 ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'}`} aria-hidden={!visible}>
          <button onClick={togglePause} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white" aria-label={paused ? 'Play' : 'Pause'} title={paused ? 'Play' : 'Pause'}>
            {paused ? <Play size={22} /> : <Pause size={22} />}
          </button>
          <button onClick={toggleLock} className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${locked ? 'bg-white/15 text-[#ffcc00]' : 'text-white/75 hover:bg-white/10 hover:text-white'}`} aria-label={locked ? 'Loop current scene: on' : 'Loop current scene: off'} aria-pressed={locked} title={locked ? 'Loop current scene: on' : 'Loop current scene: off'}>
            <Repeat size={21} />
          </button>
          <button onClick={() => setMuted((value) => !value)} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white/75 hover:bg-white/10 hover:text-white" aria-label={muted ? 'Unmute audio' : 'Mute audio'} title={muted ? 'Unmute audio' : 'Mute audio'}>
            {muted ? <VolumeX size={21} /> : <Volume2 size={21} />}
          </button>
          <div className="h-7 w-px shrink-0 bg-white/20" />
          <PlaybackStatus
            sceneKeys={sceneKeys}
            activeIndex={activeIndex}
            activeDuration={activeDuration}
            activeStartTime={activeStartTime}
            totalDuration={totalDuration}
            tick={tick}
            paused={paused}
            onJumpTo={handleJumpTo}
          />
          <button
            onClick={() => { if (!collapsed) { setHovering(false); setTapPinned(false); } setCollapsed((value) => !value); }}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
            aria-label={collapsed ? 'Show controls' : 'Hide controls'}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
          </button>
        </div>
      </div>
    </div>
  );
}
