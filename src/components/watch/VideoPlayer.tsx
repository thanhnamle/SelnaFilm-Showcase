import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import type Hls from 'hls.js';
import {
  ChevronLeft, ChevronRight, Loader2, Maximize, Minimize, Pause, PictureInPicture2, Play, RotateCcw, RotateCw, Settings,
  Subtitles, Volume2, VolumeX,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { cn, formatClock } from '@/lib/utils';

interface VideoPlayerProps {
  src: string;
  title: string;
  subtitle?: string;
  poster?: string;
  startAt?: number;
  prevHref?: string;
  nextHref?: string;
  onProgress?: (position: number, duration: number) => void;
  onEnded?: () => void;
  /** The stream can't be played; the parent should try another server. */
  onFatal: () => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SAVE_EVERY_MS = 5000;

const isDubbed = (name = '', lang = '') => {
  const text = `${name} ${lang}`.toLowerCase();
  return text.includes('vi') || text.includes('thuyết minh') || text.includes('thuyet minh') || text.includes('lồng tiếng');
};

/** Circular arrow with "10" inside, like the seek buttons of most streaming players. */
function SeekIcon({ forward }: { forward?: boolean }) {
  const Icon = forward ? RotateCw : RotateCcw;
  return (
    <span className="relative grid place-items-center">
      <Icon className="size-6" strokeWidth={1.75} />
      <span className="absolute pt-px text-[8px] font-bold">10</span>
    </span>
  );
}

export default function VideoPlayer({ src, title, subtitle, poster, startAt = 0, prevHref, nextHref, onProgress, onEnded, onFatal }: VideoPlayerProps) {
  const { t, href } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastSave = useRef(0);
  const fatalSent = useRef(false);
  // Callbacks in refs so a parent re-render never re-initialises the stream.
  const callbacks = useRef({ onProgress, onEnded, onFatal });
  callbacks.current = { onProgress, onEnded, onFatal };

  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [levels, setLevels] = useState<{ height: number }[]>([]);
  const [level, setLevel] = useState(-1);
  const [speed, setSpeed] = useState(1);
  const [coverSub, setCoverSub] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  // ---- Stream setup: hls.js is only downloaded when a video actually plays ----
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    let retries = 0;
    fatalSent.current = false;
    const fail = () => {
      if (fatalSent.current) return;
      fatalSent.current = true;
      hlsRef.current?.destroy();
      callbacks.current.onFatal();
    };

    setWaiting(true);
    setLevels([]);
    setLevel(-1);

    const start = async () => {
      const { default: HlsLib } = await import('hls.js');
      if (cancelled) return;

      if (HlsLib.isSupported()) {
        const hls = new HlsLib({ maxMaxBufferLength: 60, startPosition: startAt > 0 ? startAt : -1 });
        hlsRef.current = hls;
        hls.on(HlsLib.Events.MANIFEST_PARSED, (_event, data) => {
          retries = 0;
          setLevels(data.levels.map((l) => ({ height: l.height })));
          // Prefer the original audio over a Vietnamese dub when both exist.
          if (hls.audioTracks.length > 1) {
            const original = hls.audioTracks.findIndex((track) => !isDubbed(track.name, track.lang));
            if (original !== -1) hls.audioTrack = original;
          }
          video.play().catch(() => setPlaying(false));
        });
        hls.on(HlsLib.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;
          if (data.type === HlsLib.ErrorTypes.NETWORK_ERROR && retries < 3) {
            retries += 1;
            hls.startLoad();
          } else if (data.type === HlsLib.ErrorTypes.MEDIA_ERROR && retries < 3) {
            retries += 1;
            hls.recoverMediaError();
          } else {
            fail();
          }
        });
        hls.loadSource(src);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari / iOS play HLS natively.
        video.src = src;
        video.addEventListener(
          'loadedmetadata',
          () => {
            if (startAt > 0) video.currentTime = startAt;
            video.play().catch(() => setPlaying(false));
          },
          { once: true },
        );
      } else {
        fail();
      }
    };
    void start();

    // A dead or fake playlist never reports a duration.
    const watchdog = setTimeout(() => {
      if (!video.duration || Number.isNaN(video.duration)) fail();
    }, 20000);

    return () => {
      cancelled = true;
      clearTimeout(watchdog);
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.removeAttribute('src');
      video.load();
    };
    // startAt is only read when a new source starts, so it is deliberately not a dependency.
  }, [src]);

  // ---- Controls visibility ----
  const poke = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setControlsVisible(false), 2800);
  }, []);
  useEffect(() => () => clearTimeout(idleTimer.current), []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => undefined);
    else video.pause();
  }, []);

  const seekBy = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (video) video.currentTime = Math.min(Math.max(0, video.currentTime + seconds), video.duration || Infinity);
  }, []);

  const setVol = useCallback((value: number) => {
    const video = videoRef.current;
    if (!video) return;
    const v = Math.min(1, Math.max(0, value));
    video.volume = v;
    video.muted = v === 0;
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void containerRef.current?.requestFullscreen().catch(() => undefined);
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const togglePip = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (document.pictureInPictureElement) {
      void document.exitPictureInPicture().catch(() => undefined);
      return;
    }
    // disablePictureInPicture only hides the browser's own floating PiP button (Firefox); lift it for ours.
    video.disablePictureInPicture = false;
    video.addEventListener('leavepictureinpicture', () => (video.disablePictureInPicture = true), { once: true });
    void video.requestPictureInPicture().catch(() => (video.disablePictureInPicture = true));
  }, []);

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && (e.target as HTMLInputElement).type !== 'range') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const video = videoRef.current;
      if (!video) return;
      const actions: Record<string, () => void> = {
        ' ': togglePlay,
        k: togglePlay,
        ArrowLeft: () => seekBy(-10),
        j: () => seekBy(-10),
        ArrowRight: () => seekBy(10),
        l: () => seekBy(10),
        ArrowUp: () => setVol(video.volume + 0.1),
        ArrowDown: () => setVol(video.volume - 0.1),
        m: () => (video.muted = !video.muted),
        f: toggleFullscreen,
      };
      const action = actions[e.key];
      if (action) {
        e.preventDefault();
        action();
        poke();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, seekBy, setVol, toggleFullscreen, poke]);

  // ---- Media events ----
  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setTime(video.currentTime);
    if (video.buffered.length) setBuffered(video.buffered.end(video.buffered.length - 1));

    // Audio plays but no picture: the stream is broken, move on.
    if (video.currentTime > 2 && video.videoWidth === 0 && !fatalSent.current) {
      fatalSent.current = true;
      callbacks.current.onFatal();
    }

    const now = Date.now();
    if (now - lastSave.current > SAVE_EVERY_MS && video.duration) {
      lastSave.current = now;
      callbacks.current.onProgress?.(video.currentTime, video.duration);
    }
  };

  const saveNow = () => {
    const video = videoRef.current;
    if (video?.duration) callbacks.current.onProgress?.(video.currentTime, video.duration);
  };

  const chooseLevel = (index: number) => {
    if (hlsRef.current) hlsRef.current.currentLevel = index;
    setLevel(index);
    setMenuOpen(false);
  };

  const chooseSpeed = (value: number) => {
    if (videoRef.current) videoRef.current.playbackRate = value;
    setSpeed(value);
    setMenuOpen(false);
  };

  const showChrome = controlsVisible || !playing || menuOpen;
  const progressPct = duration ? (time / duration) * 100 : 0;
  const bufferedPct = duration ? (buffered / duration) * 100 : 0;
  const iconBtn = 'grid size-9 shrink-0 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/10 hover:text-white sm:size-10';
  const edgeBtn = cn(
    'absolute top-1/2 grid size-9 -translate-y-1/2 sm:size-11 place-items-center rounded-full bg-black/35 text-white ring-1 ring-white/15 backdrop-blur-md transition-[opacity,background-color] duration-300 hover:bg-black/60',
    showChrome ? 'opacity-100' : 'pointer-events-none opacity-0',
  );

  return (
    <div
      ref={containerRef}
      className={cn('group/player relative size-full overflow-hidden bg-black select-none', !showChrome && 'cursor-none')}
      onPointerMove={poke}
      onPointerLeave={() => playing && setControlsVisible(false)}
    >
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        disablePictureInPicture
        className="size-full object-contain"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onPlay={() => setPlaying(true)}
        onPause={() => {
          setPlaying(false);
          saveNow();
        }}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onCanPlay={() => setWaiting(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={onTimeUpdate}
        onVolumeChange={(e) => {
          setVolume(e.currentTarget.volume);
          setMuted(e.currentTarget.muted);
        }}
        onEnded={() => {
          saveNow();
          callbacks.current.onEnded?.();
        }}
      />

      {coverSub && (
        <div className="pointer-events-none absolute bottom-[7%] left-1/2 h-[14%] w-[70%] -translate-x-1/2 rounded-xl bg-black/95 blur-[3px]" />
      )}

      {waiting && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <Loader2 className="size-10 animate-spin text-white/80" />
        </div>
      )}

      {!playing && !waiting && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label={t('common.play')}
          className="absolute top-1/2 left-1/2 grid size-20 -translate-1/2 place-items-center rounded-full bg-white/15 text-white shadow-2xl ring-1 ring-white/30 backdrop-blur-md transition-[transform,background-color] hover:scale-105 hover:bg-white/25"
        >
          <Play className="ml-1 size-9 fill-current" />
        </button>
      )}

      {/* Top bar: "Title • Season 1 · Episode 3", centered */}
      <div className={cn('pointer-events-none absolute inset-x-0 top-0 bg-linear-to-b from-black/80 to-transparent px-16 pt-4 pb-10 text-center transition-opacity duration-300 sm:pt-5', showChrome ? 'opacity-100' : 'opacity-0')}>
        <p className="line-clamp-1 font-bold text-white drop-shadow sm:text-lg">
          {title}
          {subtitle && <span className="font-medium text-white/75"> • {subtitle}</span>}
        </p>
      </div>

      {/* Previous / next episode on the edges */}
      {prevHref && (
        <Link to={href(prevHref)} replace aria-label={t('watch.prevEpisode')} title={t('watch.prevEpisode')} className={cn(edgeBtn, 'left-3 sm:left-5')}>
          <ChevronLeft className="size-6" />
        </Link>
      )}
      {nextHref && (
        <Link to={href(nextHref)} replace aria-label={t('watch.nextEpisode')} title={t('watch.nextEpisode')} className={cn(edgeBtn, 'right-3 sm:right-5')}>
          <ChevronRight className="size-6" />
        </Link>
      )}

      {/* Bottom controls */}
      <div className={cn('absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/50 to-transparent px-3 pt-16 pb-2 transition-opacity duration-300 sm:px-5 sm:pb-3', showChrome ? 'opacity-100' : 'pointer-events-none opacity-0')}>
        <div className="group/seek relative mb-1 flex h-5 items-center">
          <div className="pointer-events-none absolute inset-x-0 h-1 rounded-full bg-white/20 transition-[height] group-hover/seek:h-1.5">
            <div className="absolute inset-y-0 left-0 rounded-full bg-white/30" style={{ width: `${bufferedPct}%` }} />
            <div className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-accent to-accent-2" style={{ width: `${progressPct}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={1}
            value={time}
            aria-label="Seek"
            onChange={(e) => {
              const video = videoRef.current;
              if (video) video.currentTime = Number(e.target.value);
              setTime(Number(e.target.value));
            }}
            className="relative h-5 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>

        <div className="flex items-center gap-1">
          <button type="button" onClick={() => seekBy(-10)} className={iconBtn} aria-label="-10s">
            <SeekIcon />
          </button>
          <button type="button" onClick={togglePlay} className={iconBtn} aria-label={playing ? 'Pause' : t('common.play')}>
            {playing ? <Pause className="size-6 fill-current" /> : <Play className="size-6 fill-current" />}
          </button>
          <button type="button" onClick={() => seekBy(10)} className={iconBtn} aria-label="+10s">
            <SeekIcon forward />
          </button>

          <div className="group/vol flex items-center">
            <button type="button" onClick={() => setVol(muted || volume === 0 ? 1 : 0)} className={iconBtn} aria-label="Mute">
              {muted || volume === 0 ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              aria-label="Volume"
              onChange={(e) => setVol(Number(e.target.value))}
              className="hidden h-1 w-0 cursor-pointer appearance-none rounded-full bg-white/30 opacity-0 accent-white transition-[width,opacity] duration-300 group-hover/vol:w-20 group-hover/vol:opacity-100 focus:w-20 focus:opacity-100 sm:block [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
          </div>

          <span className="ml-1 text-xs font-medium whitespace-nowrap text-white/80 tabular-nums sm:ml-2 sm:text-sm">
            {formatClock(time)} <span className="text-white/40">/ {formatClock(duration)}</span>
          </span>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCoverSub((v) => !v)}
              aria-pressed={coverSub}
              title={t('watch.coverSub')}
              className={cn(iconBtn, coverSub && 'bg-white/15 text-accent')}
            >
              <Subtitles className="size-5" />
            </button>

            <div className="relative">
              <button type="button" onClick={() => setMenuOpen((v) => !v)} className={iconBtn} aria-expanded={menuOpen} aria-label="Settings">
                <Settings className={cn('size-5 transition-transform duration-300', menuOpen && 'rotate-45')} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 bottom-12 w-56 animate-rise rounded-2xl border border-white/10 bg-black/85 p-2 text-sm text-white backdrop-blur-xl">
                  {levels.length > 0 && (
                    <>
                      <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-wider text-white/50 uppercase">{t('watch.quality')}</p>
                      <div className="flex flex-wrap gap-1 px-1.5 pb-2">
                        {[{ height: 0, index: -1 }, ...levels.map((l, i) => ({ height: l.height, index: i }))].map(({ height, index }) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => chooseLevel(index)}
                            className={cn('rounded-full px-2.5 py-1 text-xs', level === index ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20')}
                          >
                            {index === -1 ? t('watch.auto') : `${height}p`}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-wider text-white/50 uppercase">{t('watch.speed')}</p>
                  <div className="flex flex-wrap gap-1 px-1.5 pb-1.5">
                    {SPEEDS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => chooseSpeed(value)}
                        className={cn('rounded-full px-2.5 py-1 text-xs', speed === value ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20')}
                      >
                        {value}x
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {document.pictureInPictureEnabled && (
              <button type="button" onClick={togglePip} className={cn(iconBtn, 'max-sm:hidden')} aria-label={t('watch.pip')} title={t('watch.pip')}>
                <PictureInPicture2 className="size-5" />
              </button>
            )}

            <button type="button" onClick={toggleFullscreen} className={iconBtn} aria-label={t('watch.fullscreen')}>
              {fullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
