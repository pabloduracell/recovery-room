import { useState, useEffect, useRef } from "react";
import "./styles.css";

const TOTAL_FRAMES = 100;
const TOTAL_PILLS = 100;
const bgMusic = new Audio("/assets/tension.mp3");

bgMusic.loop = true;
bgMusic.volume = 0.18;
const clickSound = new Audio("/assets/click.mp3");
clickSound.volume = 0.35;

const winSound = new Audio("/assets/win.mp3");
winSound.volume = 0.55;

const frames = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
  const num = String(i + 1).padStart(3, "0");
  return `https://res.cloudinary.com/dbhwofvfv/image/upload/q_auto/f_auto/v1778683206/frame_${num}.jpg`;
});

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  const tenths = Math.floor((ms % 1000) / 100);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [ready, setReady] = useState(false);

  const [clicks, setClicks] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(frames[0]);
  const [pills, setPills] = useState([]);

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [bestTime, setBestTime] = useState(null);

  const startTimeRef = useRef(null);
  const clicksRef = useRef(0);

  const loadProgress = loadedCount / TOTAL_FRAMES;
  const gameProgress = clicks / TOTAL_PILLS;

  const bgMusicRef = useRef(null);
  const clickSoundRef = useRef(null);
  const winSoundRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem("best-treatment-time");
    if (stored) setBestTime(Number(stored));
  }, []);

  useEffect(() => {
    let completed = 0;
    let cancelled = false;

    frames.forEach((src) => {
      const img = new Image();

      img.onload = () => {
        if (cancelled) return;

        completed++;
        setLoadedCount(completed);

        if (completed === TOTAL_FRAMES) {
          setLoaded(true);
        }
      };

      img.onerror = () => {
        if (cancelled) return;

        completed++;
        setLoadedCount(completed);

        if (completed === TOTAL_FRAMES) {
          setLoaded(true);
        }
      };

      img.src = src;
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!started || finished) return;

    const interval = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 80);

    return () => clearInterval(interval);
  }, [started, finished]);

  function startGame(e) {
    e.stopPropagation();
  
    setReady(true);
  
    if (bgMusicRef.current) {
      bgMusicRef.current.currentTime = 0;
      bgMusicRef.current.play().catch(() => {});
    }
  }

  function handleClick(e) {
    if (!loaded || !ready || finished) return;
    if (clicksRef.current >= TOTAL_PILLS) return;

    if (!started) {
      setStarted(true);
      startTimeRef.current = Date.now();
    }

    navigator.vibrate?.(15);
    if (clickSoundRef.current) {
      clickSoundRef.current.currentTime = 0;
      clickSoundRef.current.play().catch(() => {});
    }
    clickSound.currentTime = 0;
clickSound.play().catch(() => {});

    const nextClicks = Math.min(clicksRef.current + 1, TOTAL_PILLS);

    clicksRef.current = nextClicks;

    const nextFrameIndex = Math.min(
      TOTAL_FRAMES - 1,
      Math.round((nextClicks / TOTAL_PILLS) * (TOTAL_FRAMES - 1))
    );

    setClicks(nextClicks);
    setCurrentFrame(frames[nextFrameIndex]);

    setPills((prev) => [
      ...prev.slice(-20),
      {
        id: Math.random(),
        x: e.clientX,
        y: e.clientY,
      },
    ]);

    if (nextClicks >= TOTAL_PILLS) {
      const finalTime = Date.now() - startTimeRef.current;
      bgMusic.pause();
winSound.currentTime = 0;
winSound.play().catch(() => {});
if (bgMusicRef.current) {
  bgMusicRef.current.pause();
}

if (winSoundRef.current) {
  winSoundRef.current.currentTime = 0;
  winSoundRef.current.play().catch(() => {});
}

      setFinished(true);
      setElapsed(finalTime);

      if (!bestTime || finalTime < bestTime) {
        setBestTime(finalTime);
        localStorage.setItem(
          "best-treatment-time",
          String(finalTime)
        );
      }
    }
  }

  function restart(e) {
    e.stopPropagation();

    clicksRef.current = 0;

    setClicks(0);
    setStarted(false);
    setFinished(false);
    setElapsed(0);
    setPills([]);
    setCurrentFrame(frames[0]);
    bgMusic.currentTime = 0;

    if (bgMusicRef.current) {
      bgMusicRef.current.currentTime = 0;
      bgMusicRef.current.play().catch(() => {});
    }
  }

  return (
    <main
  className={`app ${started ? "pulse-hit" : ""}`}
  onPointerDown={handleClick}
>
      <img
        className="frame-image"
        src={currentFrame}
        draggable="false"
      />

      <div className="vignette" />
      <div className="ambient-glow" />

      {!loaded && (
        <section className="loading-screen">
          <img
            className="loading-logo"
            src="/assets/logo.png"
            alt="Recovery Room"
          />

          <p className="eyebrow">
            Recovery Room Experience
          </p>

          <img
  src="/assets/ready.png"
  alt="Ready"
  className="ready-image"
/>

          <div className="loading-bar">
            <div
              style={{
                width: `${loadProgress * 100}%`,
              }}
            />
          </div>

          <p className="loading-count">
            Preparando tratamiento · {loadedCount}/100
          </p>
        </section>
      )}

      {loaded && !ready && (
        <section className="intro-screen">
          <img
            className="loading-logo"
            src="/assets/logo.png"
            alt="Recovery Room"
          />

          <p className="eyebrow">
            Tratamiento listo
          </p>

          <img
  src="/assets/ready.png"
  alt="¿Preparado para curar todos tus dolores?"
  className="ready-image"
/>

          <button
            className="start-button"
            onPointerDown={startGame}
          >
            Iniciar tratamiento
          </button>
        </section>
      )}

      {loaded && ready && (
        <>
          <section className="hud">
            <div className="hud-top">
              <div>
                <small>Estado</small>
                <strong>{clicks}/100 dosis</strong>
              </div>

              <div>
                <small>Tiempo</small>
                <strong>{formatTime(elapsed)}</strong>
              </div>

              <div>
                <small>Récord</small>
                <strong>
                  {bestTime
                    ? formatTime(bestTime)
                    : "--:--.-"}
                </strong>
              </div>
            </div>

            <div className="bar">
              <div
                className="bar-fill"
                style={{
                  width: `${gameProgress * 100}%`,
                }}
              />
            </div>
          </section>

          {!started && (
            <div className="start-message">
              Pincha en la pantalla para iniciar tratamiento
            </div>
          )}

          {pills.map((pill) => (
            <div
              key={pill.id}
              className="pill"
              style={{
                left: pill.x - 35,
                top: pill.y - 35,
                "--mx": `${window.innerWidth / 2 - pill.x}px`,
                "--my": `${window.innerHeight / 2 - pill.y}px`,
              }}
            >
              💊
            </div>
          ))}

          {finished && (
            <section
              className="final-card"
              onPointerDown={(e) =>
                e.stopPropagation()
              }
            >
              <div className="achievement">
                Logro desbloqueado
              </div>

              <h1>Paciente curado</h1>

              <p>
                Has completado el tratamiento completo.
              </p>

              <div className="timebox">
                <small>Tiempo final</small>

                <span>
                  {formatTime(elapsed)}
                </span>
              </div>

              {bestTime === elapsed && (
                <div className="record-badge">
                  Nuevo récord personal
                </div>
              )}

              <button onPointerDown={restart}>
                Repetir tratamiento
              </button>
            </section>
          )}
        </>
      )}
    </main>
  );

  useEffect(() => {
    bgMusicRef.current = new Audio("/assets/tension.mp3");
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0.18;
  
    clickSoundRef.current = new Audio("/assets/click.mp3");
    clickSoundRef.current.volume = 0.45;
  
    winSoundRef.current = new Audio("/assets/win.mp3");
    winSoundRef.current.volume = 0.65;
  }, []);
}