import { useState, useEffect, useRef } from "react";
import "./styles.css";

const TOTAL_FRAMES = 100;
const TOTAL_PILLS = 100;
const TIME_LIMIT = 20 * 1000;

const frames = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
  const num = String(i + 1).padStart(3, "0");

  return `https://res.cloudinary.com/dbhwofvfv/image/upload/q_auto/f_auto/v1778683206/frame_${num}.jpg`;
});

function formatTime(ms) {
  const safeMs = Math.max(0, ms);
  const total = Math.floor(safeMs / 1000);
  const seconds = total % 60;
  const tenths = Math.floor((safeMs % 1000) / 100);

  return `${String(seconds).padStart(2, "0")}.${tenths}`;
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
  const [failed, setFailed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [finalTime, setFinalTime] = useState(0);
  const [bestTime, setBestTime] = useState(null);
  const [buttonPressed, setButtonPressed] = useState(false);

  const startTimeRef = useRef(null);
  const clicksRef = useRef(0);

  const bgMusicRef = useRef(null);
  const winSoundRef = useRef(null);
  const introClickRef = useRef(null);

  const loadProgress = loadedCount / TOTAL_FRAMES;
  const gameProgress = clicks / TOTAL_PILLS;

  useEffect(() => {
    bgMusicRef.current = new Audio("/assets/tension.mp3");
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0.18;

    winSoundRef.current = new Audio("/assets/win.mp3");
    winSoundRef.current.volume = 0.65;

    introClickRef.current = new Audio("/assets/intro_clic.mp3");
    introClickRef.current.volume = 0.55;
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("best-treatment-time");

    if (stored) {
      setBestTime(Number(stored));
    }
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
    if (!started || finished || failed) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = TIME_LIMIT - elapsed;

      setTimeLeft(remaining);

      if (remaining <= 0 && clicksRef.current < TOTAL_PILLS) {
        setFailed(true);
        setTimeLeft(0);

        if (bgMusicRef.current) {
          bgMusicRef.current.pause();
        }
      }
    }, 80);

    return () => clearInterval(interval);
  }, [started, finished, failed]);

  function startGame(e) {
    e.stopPropagation();

    setButtonPressed(true);

    if (introClickRef.current) {
      introClickRef.current.currentTime = 0;
      introClickRef.current.play().catch(() => {});
    }

    setTimeout(() => {
      setReady(true);

      if (bgMusicRef.current) {
        bgMusicRef.current.currentTime = 0;
        bgMusicRef.current.play().catch(() => {});
      }
    }, 180);
  }

  function handleClick(e) {
    if (!loaded || !ready || finished || failed) return;
    if (clicksRef.current >= TOTAL_PILLS) return;

    if (!started) {
      setStarted(true);
      startTimeRef.current = Date.now();
      setTimeLeft(TIME_LIMIT);
    }

    navigator.vibrate?.(15);

    const nextClicks = Math.min(
      clicksRef.current + 1,
      TOTAL_PILLS
    );

    clicksRef.current = nextClicks;

    const nextFrameIndex = Math.min(
      TOTAL_FRAMES - 1,
      Math.round(
        (nextClicks / TOTAL_PILLS) * (TOTAL_FRAMES - 1)
      )
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
      const completedTime = Date.now() - startTimeRef.current;

      if (completedTime <= TIME_LIMIT) {
        if (bgMusicRef.current) {
          bgMusicRef.current.pause();
        }

        if (winSoundRef.current) {
          winSoundRef.current.currentTime = 0;
          winSoundRef.current.play().catch(() => {});
        }

        setFinished(true);
        setFinalTime(completedTime);
        setTimeLeft(Math.max(0, TIME_LIMIT - completedTime));

        if (!bestTime || completedTime < bestTime) {
          setBestTime(completedTime);

          localStorage.setItem(
            "best-treatment-time",
            String(completedTime)
          );
        }
      }
    }
  }

  function restart(e) {
    e.stopPropagation();

    if (introClickRef.current) {
      introClickRef.current.currentTime = 0;
      introClickRef.current.play().catch(() => {});
    }

    clicksRef.current = 0;

    setClicks(0);
    setStarted(false);
    setFinished(false);
    setFailed(false);
    setFinalTime(0);
    setTimeLeft(TIME_LIMIT);
    setPills([]);
    setCurrentFrame(frames[0]);

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
            className={`start-button ${
              buttonPressed ? "pressed" : ""
            }`}
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

                <strong>
                  {clicks}/100 dosis
                </strong>
              </div>

              <div>
                <small>Tiempo restante</small>

                <strong>
                  {formatTime(timeLeft)}s
                </strong>
              </div>

              <div>
                <small>Récord</small>

                <strong>
                  {bestTime
                    ? `${formatTime(bestTime)}s`
                    : "--.-s"}
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
                left: pill.x - 20,
                top: pill.y - 20,
                "--mx": `${
                  window.innerWidth / 2 - pill.x
                }px`,
                "--my": `${
                  window.innerHeight / 2 - pill.y
                }px`,
              }}
            >
              <img
                src="/assets/pill.png"
                alt="pill"
                className="pill-image"
                draggable="false"
              />
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
                Misión completada
              </div>

              <h1>Paciente curado</h1>

              <p>
                Has completado el tratamiento antes de que acabara el tiempo.
              </p>

              <div className="timebox">
                <small>Tiempo final</small>

                <span>
                  {formatTime(finalTime)}s
                </span>
              </div>

              {bestTime === finalTime && (
                <div className="record-badge">
                  Nuevo récord personal
                </div>
              )}

              <button
                className="repeat-button"
                onPointerDown={restart}
              >
                Repetir tratamiento
              </button>

              <p className="reward-text">
                Visítanos en nuestro stand y consigue tu recompensa
              </p>
            </section>
          )}

          {failed && (
            <section
              className="final-card"
              onPointerDown={(e) =>
                e.stopPropagation()
              }
            >
              <div className="achievement">
                Tiempo agotado
              </div>

              <h1>Paciente perdido</h1>

              <p>
                No has completado el tratamiento dentro de los 20 segundos.
              </p>

              <div className="timebox">
                <small>Dosis aplicadas</small>

                <span>
                  {clicks}/100
                </span>
              </div>

              <button
                className="repeat-button"
                onPointerDown={restart}
              >
                Reintentar tratamiento
              </button>
            </section>
          )}
        </>
      )}
    </main>
  );
}