import { useEffect, useRef, useState } from 'react';
import './styles.css';

const TOTAL_FRAMES = 100;
const TOTAL_PILLS = 100;

const frames = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
  const num = String(i + 1).padStart(3, '0');
  return `https://res.cloudinary.com/dbhwofvfv/image/upload/q_auto/f_auto/v1778683206/frame_${num}.jpg`;
});

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  const tenths = Math.floor((ms % 1000) / 100);

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
    2,
    '0'
  )}.${tenths}`;
}

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [loadErrors, setLoadErrors] = useState(0);

  const [clicks, setClicks] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(frames[0]);
  const [pills, setPills] = useState([]);

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const startTimeRef = useRef(null);
  const clicksRef = useRef(0);
  const loadedImagesRef = useRef([]);

  const loadProgress = loadedCount / TOTAL_FRAMES;
  const gameProgress = clicks / TOTAL_PILLS;

  useEffect(() => {
    let completed = 0;
    let errors = 0;
    let cancelled = false;

    frames.forEach((src, index) => {
      const img = new Image();

      img.onload = () => {
        if (cancelled) return;

        loadedImagesRef.current[index] = img;

        completed++;
        setLoadedCount(completed);

        if (completed === TOTAL_FRAMES) {
          setLoaded(true);
        }
      };

      img.onerror = () => {
        if (cancelled) return;

        errors++;
        completed++;

        setLoadErrors(errors);
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

  function handleClick(e) {
    if (!loaded) return;
    if (finished) return;
    if (clicksRef.current >= TOTAL_PILLS) return;

    if (!started) {
      setStarted(true);
      startTimeRef.current = Date.now();
    }

    const nextClicks = Math.min(clicksRef.current + 1, TOTAL_PILLS);
    clicksRef.current = nextClicks;

    const nextFrameIndex = Math.min(
      TOTAL_FRAMES - 1,
      Math.round((nextClicks / TOTAL_PILLS) * (TOTAL_FRAMES - 1))
    );

    setClicks(nextClicks);

    // CAMBIO CLAVE: frame directo, sin animación intermedia
    setCurrentFrame(frames[nextFrameIndex]);

    setPills((prev) => [
      ...prev.slice(-24),
      {
        id: Math.random(),
        x: e.clientX,
        y: e.clientY,
      },
    ]);

    if (nextClicks >= TOTAL_PILLS) {
      setFinished(true);
      setElapsed(Date.now() - startTimeRef.current);
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
  }

  return (
    <main className="app" onPointerDown={handleClick}>
      <img className="frame-image" src={currentFrame} draggable="false" />

      <div className="vignette" />

      {!loaded && (
        <section className="loading-screen">
          <img
            className="loading-logo"
            src="/assets/logo.png"
            alt="Recovery Room"
          />

          <h1>¿Preparado para curar todos tus dolores?</h1>

          <div className="loading-bar">
            <div style={{ width: `${loadProgress * 100}%` }} />
          </div>

          <p>
            Cargando tratamiento {loadedCount}/100
            {loadErrors > 0 ? ` · ${loadErrors} errores` : ''}
          </p>
        </section>
      )}

      {loaded && (
        <>
          <section className="hud">
            <div className="hud-top">
              <span>Estado del paciente</span>
              <span>{clicks}/100 dosis</span>
              <span>{formatTime(elapsed)}</span>
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
            <div className="start-message">Pincha para alimentar</div>
          )}

          {pills.map((pill) => (
            <div
              key={pill.id}
              className="pill"
              style={{
                left: pill.x - 35,
                top: pill.y - 35,
                '--mx': `${window.innerWidth / 2 - pill.x}px`,
                '--my': `${window.innerHeight / 2 - pill.y}px`,
              }}
            >
              💊
            </div>
          ))}

          {finished && (
            <section
              className="final-card"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="achievement">Logro desbloqueado</div>

              <h1>Paciente curado</h1>

              <p>Has completado las 100 dosis.</p>

              <div className="timebox">
                <small>Tiempo final</small>
                <span>{formatTime(elapsed)}</span>
              </div>

              <button onPointerDown={restart}>Reiniciar tratamiento</button>
            </section>
          )}
        </>
      )}
    </main>
  );
}
