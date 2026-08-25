import { useState, useEffect, useRef } from "react";
import "./App.css";
import { supabase } from "./supabaseClient"

// =====================================================
// CANCIONES
// =====================================================

const songs = [
  {
    id: "iuTtlb2COtc",
    title: "Nuestra canción",
  },
  {
    id: "Bx3rT9nP7YA",
    title: "Para vos",
  },
  {
    id: "wAjHQXrIj9o",
    title: "Siempre nosotros",
  },
];

// =====================================================
// MUSIC PLAYER
// YouTube + cambio automático de canciones
// Compatible con PC y celular
// =====================================================

function MusicPlayer({
  currentSong,
  setCurrentSong,
  isPlaying,
  setIsPlaying,
  musicOpen,
  setMusicOpen,
}) {

  const iframeRef = useRef(null);

  const youtubeReadyRef = useRef(false);

  const currentIndexRef = useRef(0);

  const shouldPlayRef = useRef(false);

  const changingSongRef = useRef(false);

  // =====================================================
  // ACTUALIZAR ÍNDICE ACTUAL
  // =====================================================

  useEffect(() => {

    const index = songs.findIndex(
      (song) => song.id === currentSong.id
    );

    currentIndexRef.current =
      index >= 0 ? index : 0;

  }, [currentSong.id]);

  // =====================================================
  // ENVIAR MENSAJE A YOUTUBE
  // =====================================================

  const sendYouTubeMessage = (
    event,
    func,
    args = []
  ) => {

    const iframe = iframeRef.current;

    if (
      !iframe ||
      !iframe.contentWindow
    ) {
      return;
    }

    iframe.contentWindow.postMessage(
      JSON.stringify({
        event,
        func,
        args,
        id: "grand-prix-music",
      }),
      "https://www.youtube.com"
    );
  };

  // =====================================================
  // INICIALIZAR COMUNICACIÓN CON YOUTUBE
  // =====================================================

  const initializeYouTube = () => {

    console.log(
      "🎵 Inicializando comunicación con YouTube..."
    );

    youtubeReadyRef.current = true;

    // Le avisamos a YouTube que queremos
    // recibir eventos.

    sendYouTubeMessage(
      "listening"
    );

    sendYouTubeMessage(
      "command",
      "addEventListener",
      ["onReady"]
    );

    sendYouTubeMessage(
      "command",
      "addEventListener",
      ["onStateChange"]
    );

    sendYouTubeMessage(
      "command",
      "addEventListener",
      ["onError"]
    );

    // Si el usuario había tocado reproducir
    // antes de que cargara el iframe.

    if (shouldPlayRef.current) {

      setTimeout(() => {

        sendYouTubeMessage(
          "command",
          "playVideo"
        );

        shouldPlayRef.current =
          false;

        setIsPlaying(true);

      }, 300);
    }
  };

  // =====================================================
  // CAMBIAR CANCIÓN
  // =====================================================

  const loadSong = (
    song,
    autoPlay = false
  ) => {

    if (!song) {
      return;
    }

    console.log(
      "🎵 Cargando:",
      song.title
    );

    changingSongRef.current = true;

    setCurrentSong(song);

    shouldPlayRef.current =
      autoPlay;

    setIsPlaying(false);

    // Si YouTube todavía no está listo,
    // dejamos que el useEffect del iframe
    // lo maneje.

    if (!youtubeReadyRef.current) {

      changingSongRef.current =
        false;

      return;
    }

    // Cargamos directamente el nuevo video.

    sendYouTubeMessage(
      "command",
      "loadVideoById",
      [song.id]
    );

    // Le damos tiempo a YouTube para cargarlo.

    setTimeout(() => {

      if (autoPlay) {

        sendYouTubeMessage(
          "command",
          "playVideo"
        );

        setIsPlaying(true);
      }

      changingSongRef.current =
        false;

    }, 600);
  };

  // =====================================================
  // REPRODUCIR
  // =====================================================

  const playMusic = () => {

    console.log(
      "▶️ Reproducir"
    );

    // En celular puede ocurrir que el iframe
    // todavía no esté listo.

    if (!youtubeReadyRef.current) {

      shouldPlayRef.current = true;

      setIsPlaying(true);

      return;
    }

    sendYouTubeMessage(
      "command",
      "playVideo"
    );

    setIsPlaying(true);
  };

  // =====================================================
  // PAUSAR
  // =====================================================

  const pauseMusic = () => {

    console.log(
      "⏸️ Pausar"
    );

    shouldPlayRef.current =
      false;

    sendYouTubeMessage(
      "command",
      "pauseVideo"
    );

    setIsPlaying(false);
  };

  // =====================================================
  // SIGUIENTE CANCIÓN
  // =====================================================

  const playNextSong = () => {

    if (changingSongRef.current) {
      return;
    }

    const currentIndex =
      currentIndexRef.current;

    let nextIndex =
      currentIndex + 1;

    // Si llegamos al final,
    // volvemos a la primera.

    if (
      nextIndex >= songs.length
    ) {
      nextIndex = 0;
    }

    const nextSong =
      songs[nextIndex];

    console.log(
      "🎵 Terminó la canción"
    );

    console.log(
      "➡️ Siguiente:",
      nextSong.title
    );

    loadSong(
      nextSong,
      true
    );
  };

  // =====================================================
  // ESCUCHAR MENSAJES DE YOUTUBE
  // =====================================================

  useEffect(() => {

    const handleYouTubeMessage = (
      event
    ) => {

      if (
        event.origin !==
          "https://www.youtube.com" &&
        event.origin !==
          "https://www.youtube-nocookie.com"
      ) {
        return;
      }

      let data;

      try {

        data =
          typeof event.data ===
          "string"
            ? JSON.parse(event.data)
            : event.data;

      } catch {
        return;
      }

      if (!data) {
        return;
      }

      // =================================================
      // YOUTUBE LISTO
      // =================================================

      if (
        data.event === "onReady"
      ) {

        console.log(
          "✅ YouTube está listo"
        );

        youtubeReadyRef.current =
          true;

        if (
          shouldPlayRef.current
        ) {

          setTimeout(() => {

            sendYouTubeMessage(
              "command",
              "playVideo"
            );

            shouldPlayRef.current =
              false;

            setIsPlaying(true);

          }, 300);
        }

        return;
      }

      // =================================================
      // ESTADO DEL VIDEO
      // =================================================

      if (
        data.event ===
        "onStateChange"
      ) {

        console.log(
          "🎬 Estado YouTube:",
          data.info
        );

        // -----------------------------------------------
        // 1 = REPRODUCIENDO
        // -----------------------------------------------

        if (
          data.info === 1
        ) {

          setIsPlaying(true);

          return;
        }

        // -----------------------------------------------
        // 2 = PAUSADO
        // -----------------------------------------------

        if (
          data.info === 2
        ) {

          setIsPlaying(false);

          return;
        }

        // -----------------------------------------------
        // 0 = TERMINÓ
        // -----------------------------------------------

        if (
          data.info === 0
        ) {

          setIsPlaying(false);

          console.log(
            "🏁 CANCIÓN TERMINADA"
          );

          // Esperamos un pequeño momento
          // para evitar que YouTube mande
          // eventos duplicados.

          setTimeout(() => {

            playNextSong();

          }, 200);

          return;
        }
      }

      // =================================================
      // ERROR DE YOUTUBE
      // =================================================

      if (
        data.event === "onError"
      ) {

        console.error(
          "❌ Error de YouTube:",
          data.info
        );

      }

    };

    window.addEventListener(
      "message",
      handleYouTubeMessage
    );

    return () => {

      window.removeEventListener(
        "message",
        handleYouTubeMessage
      );

    };

  }, []);

  // =====================================================
  // CUANDO CAMBIA LA CANCIÓN DESDE EL PANEL
  // =====================================================

  const changeSong = (
    song
  ) => {

    if (
      !song ||
      song.id === currentSong.id
    ) {
      return;
    }

    loadSong(
      song,
      false
    );
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>

      {/* =================================================
          YOUTUBE
          ================================================= */}

      <iframe

        ref={iframeRef}

        title="Nuestra música"

        className="youtube-hidden-player"

        src={
          `https://www.youtube.com/embed/${currentSong.id}` +
          `?enablejsapi=1` +
          `&playsinline=1` +
          `&controls=0` +
          `&rel=0` +
          `&modestbranding=1` +
          `&iv_load_policy=3` +
          `&disablekb=1`
        }

        allow="autoplay; encrypted-media"

        allowFullScreen

        onLoad={() => {

          // Esperamos a que YouTube termine
          // de inicializar su API.

          setTimeout(() => {

            initializeYouTube();

          }, 500);

        }}

      />

      {/* =================================================
          REPRODUCTOR VISUAL
          ================================================= */}

      <div className="music-player">

        {/* =================================================
            BOTÓN PLAY / PAUSE
            ================================================= */}

        <button

          type="button"

          className={
            isPlaying
              ? "music-toggle playing"
              : "music-toggle"
          }

          onClick={() => {

            if (isPlaying) {

              pauseMusic();

            } else {

              playMusic();

            }

          }}

          aria-label={
            isPlaying
              ? "Pausar música"
              : "Reproducir música"
          }

        >

          <span className="music-icon">

            {isPlaying
              ? "❚❚"
              : "♪"}

          </span>

          <span className="music-waves">

            <i></i>
            <i></i>
            <i></i>

          </span>

        </button>

        {/* =================================================
            PANEL
            ================================================= */}

        {musicOpen && (

          <div className="music-panel">

            {/* HEADER */}

            <div className="music-header">

              <div>

                <span className="music-small">

                  NUESTRA MÚSICA

                </span>

                <h3>

                  {currentSong.title}

                </h3>

              </div>

              <button

                type="button"

                className="music-close"

                onClick={() => {

                  setMusicOpen(false);

                }}

              >

                ×

              </button>

            </div>

            {/* =================================================
                AHORA SONANDO
                ================================================= */}

            <div className="music-now-playing">

              <span>

                {isPlaying
                  ? "● REPRODUCIENDO"
                  : "Ⅱ EN PAUSA"}

              </span>

              <strong>

                {currentSong.title}

              </strong>

            </div>

            {/* =================================================
                LISTA DE CANCIONES
                ================================================= */}

            <div className="song-selector">

              {songs.map(
                (song, index) => (

                  <button

                    type="button"

                    key={song.id}

                    className={
                      currentSong.id ===
                      song.id
                        ? "song-button active"
                        : "song-button"
                    }

                    onClick={() => {

                      changeSong(
                        song
                      );

                    }}

                  >

                    <span>

                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}

                    </span>

                    <strong>

                      {song.title}

                    </strong>

                    {currentSong.id ===
                      song.id && (

                      <em>

                        {isPlaying
                          ? "♫"
                          : "♪"}

                      </em>

                    )}

                  </button>

                )
              )}

            </div>

            {/* =================================================
                CONTROLES
                ================================================= */}

            <div className="music-controls">

              <button

                type="button"

                onClick={() => {

                  if (isPlaying) {

                    pauseMusic();

                  } else {

                    playMusic();

                  }

                }}

              >

                {isPlaying
                  ? "Pausar"
                  : "Reproducir"}

              </button>

            </div>

            {/* FOOTER */}

            <p className="music-footer">

              Una canción para cada pedacito
              de nuestra historia ♡

            </p>

          </div>

        )}

        {/* =================================================
            NOMBRE DE LA CANCIÓN
            ================================================= */}

        <button

          type="button"

          className="music-open-panel"

          onClick={() => {

            setMusicOpen(
              !musicOpen
            );

          }}

        >

          {currentSong.title}

        </button>

      </div>

    </>
  );
}

// =====================================================
// APP
// =====================================================

function App() {

  // ===================================================
  // ESTADOS
  // ===================================================

  const [screen, setScreen] =
    useState("home");

  const [openingEnvelope, setOpeningEnvelope] =
    useState(false);

  const [musicOpen, setMusicOpen] =
    useState(false);

  const [currentSong, setCurrentSong] =
    useState(songs[0]);

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [compatibilityStarted, setCompatibilityStarted] =
    useState(false);

  const [compatibilityResult, setCompatibilityResult] =
    useState(false);

      // ===================================================
  // CONEXIÓN CON SUPABASE
  // ===================================================

  useEffect(() => {

    const testSupabase = async () => {

      const { data, error } = await supabase
        .from("Memories uwu")
        .select("*")
        .limit(1);

      if (error) {

        console.error(
          "Error conectando con Supabase:",
          error
        );

        return;
      }

      console.log(
        "Supabase conectado correctamente:",
        data
      );

    };

    testSupabase();

  }, []);

  // ===================================================
  // NAVEGACIÓN
  // ===================================================

  const goTo = (nextScreen) => {

    setScreen(nextScreen);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  };

  // ===================================================
  // CONTADOR
  // ===================================================

  const startDate =
    new Date(2025, 9, 5);

  const calculateDays = () => {

    const today = new Date();

    const start = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate()
    );

    const current = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const difference =
      current - start;

    return Math.floor(
      difference /
        (1000 * 60 * 60 * 24)
    );

  };

  const daysTogether =
    calculateDays();

  // ===================================================
  // ANIMACIÓN DEL SOBRE
  // ===================================================

  useEffect(() => {

    if (!openingEnvelope) {
      return;
    }

    const timer =
      setTimeout(() => {

        setOpeningEnvelope(false);

        goTo("letter");

      }, 3000);

    return () => {
      clearTimeout(timer);
    };

  }, [openingEnvelope]);

  // ===================================================
  // PORTADA
  // ===================================================

  const HomeScreen = () => {

    return (

      <main className="home">

        <div className="card">

          <p className="eyebrow">
            PARA MI PERSONA FAVORITA
          </p>

          <h1>
            Miku
            <span>&</span>
            Braian
          </h1>

          <p className="message">
            Una pequeña página para guardar
            <br />
            nuestra historia.
          </p>

          <div className="heart">
            ♡
          </div>

          <button
            type="button"
            className="start-button"
            onClick={() => {

              // -----------------------------------------
              // PRIMERO navegamos.
              // La música jamás puede bloquear
              // la navegación.
              // -----------------------------------------

              goTo("mailbox");

              // -----------------------------------------
              // Intentamos reproducir.
              // Si el navegador no permite autoplay,
              // el usuario puede tocar ♪ después.
              // -----------------------------------------

              setTimeout(() => {

                const iframe =
                  document.querySelector(
                    ".youtube-hidden-player"
                  );

                if (
                  iframe &&
                  iframe.contentWindow
                ) {

                  iframe.contentWindow.postMessage(
                    JSON.stringify({
                      event: "command",
                      func: "playVideo",
                      args: [],
                    }),
                    "https://www.youtube.com"
                  );

                  setIsPlaying(true);

                }

              }, 500);

            }}
          >

            Comenzar nuestra historia

            <span>
              →
            </span>

          </button>

          <p className="signature">
            Hecho con amor, para vos ♡
          </p>

        </div>

      </main>

    );

  };

  // ===================================================
  // BUZÓN
  // ===================================================

  const MailboxScreen = () => {

    return (

      <main className="mailbox-page">

        <div className="mailbox-content">

          <p className="eyebrow">
            UNA PEQUEÑA SORPRESA PARA VOS
          </p>

          <h2>
            Hay algo esperándote...
          </h2>

          <p className="mailbox-intro">
            Una carta que escribí
            <br />
            especialmente para vos.
          </p>

          <div className="letter-box">

            <div className="box-top">

              <div className="box-label">
                PARA BRAIAN
              </div>

              <div className="mail-slot">

                <div className="slot-shadow"></div>

              </div>

            </div>

            <div className="box-front">

              <div className="box-decoration">

                <span>
                  ✦
                </span>

                <div></div>

                <span>
                  ✦
                </span>

              </div>

              <div className="box-title">
                UNA CARTA
              </div>

              <div className="box-subtitle">
                para vos ♡
              </div>

            </div>

            <div className="box-side"></div>

            <div className="box-base"></div>

            <div className="hidden-letter">

              <div className="letter-paper">

                <span>
                  Para Braian
                </span>

                <strong>
                  ♡
                </strong>

              </div>

            </div>

          </div>

          <button
            type="button"
            className="letter-button"
            onClick={() => {

              setOpeningEnvelope(false);

              goTo("envelope");

            }}
          >
            💌 Abrir el buzón
          </button>

          <p className="mailbox-hint">
            Tocá cuando estés listo...
          </p>

        </div>

      </main>

    );

  };

  // ===================================================
  // SOBRE
  // ===================================================

  const EnvelopeScreen = () => {

    return (

      <main className="envelope-page">

        <div
          className={
            openingEnvelope
              ? "envelope-content envelope-opening"
              : "envelope-content"
          }
        >

          <p className="eyebrow">
            UNA CARTA PARA VOS
          </p>

          <h2>
            Hay algo que quiero decirte...
          </h2>

          <div className="envelope-wrapper">

            <div className="envelope-scene">

              <div className="letter-from-envelope">

                <div className="mini-letter">

                  <div className="mini-letter-ornament">
                    ✦
                  </div>

                  <div className="mini-letter-title">
                    BRAI
                  </div>

                  <div className="mini-letter-line"></div>

                  <div className="mini-letter-text">
                    Una carta escrita
                    especialmente para vos.
                  </div>

                </div>

              </div>

              <div className="envelope">

                <div className="envelope-back">

                  <div className="envelope-label"></div>

                </div>

                <div className="envelope-front">

                  <div className="envelope-lines"></div>

                </div>

                <div className="envelope-name">
                  Para Braian
                </div>

                <div className="envelope-heart">
                  ♡
                </div>

                <div className="envelope-flap">

                  <div className="flap-seal">
                    ✦
                  </div>

                </div>

              </div>

            </div>

          </div>

          <button
            type="button"
            className="open-envelope-button"
            onClick={() => {
              setOpeningEnvelope(true);
            }}
            disabled={openingEnvelope}
          >

            {openingEnvelope
              ? "Abriendo..."
              : "Abrir la carta"}

            <span>
              →
            </span>

          </button>

          <p className="envelope-hint">
            Hay algo que quiero que leas...
          </p>

        </div>

      </main>

    );

  };

  // ===================================================
  // CARTA
  // ===================================================

  const LetterScreen = () => {

    return (

      <main className="letter-page">

        <div className="letter-container">

          <div className="letter-card">

            <div className="letter-ornament">
              ✦
            </div>

            <div className="letter-heading">
              BRAI
            </div>

            <div className="letter-line"></div>

            <div className="letter-text">

              <p>
                No sé si alguna vez voy a encontrar
                las palabras exactas para explicarte
                todo lo que significás para mí.
              </p>

              <p>
                Pero sí sé que desde que llegaste
                a mi vida hay recuerdos que tienen
                tu nombre, canciones que me hacen
                pensar en vos, lugares que quiero
                conocer con vos y un futuro que
                inevitablemente imagino a tu lado.
              </p>

              <p>
                Te amo en los momentos enormes
                y también en los pequeños.
              </p>

              <p>
                Te amo en nuestras risas, en nuestras
                pavadas, en nuestros abrazos y hasta
                en esos días en los que simplemente
                necesitamos estar juntos.
              </p>

              <p>
                Gracias por ser mi compañero.
              </p>

              <p>
                Gracias por ser mis ojos en mis
                días más difíciles.
              </p>

              <p>
                Gracias por sostenerme cuando yo
                no sé cómo hacerlo sola.
              </p>

              <p>
                Gracias por elegirme.
              </p>

              <p>
                Y gracias por dejarme elegirte
                todos los días.
              </p>

            </div>

            <div className="letter-ending">

              <p>
                Te amo, Pipi.
              </p>

              <span>
                ♡
              </span>

            </div>

            <div className="letter-ornament-bottom">
              ✦
            </div>

          </div>

        </div>

        <button
          type="button"
          className="letter-next-button"
          onClick={() => {
            goTo("counter");
          }}
        >

          Seguir nuestra historia

          <span>
            →
          </span>

        </button>

      </main>

    );

  };

  // ===================================================
  // CONTADOR
  // ===================================================

  const CounterScreen = () => {

    return (

      <main className="counter-page">

        <div className="counter-card">

          <p className="eyebrow">
            NUESTRA HISTORIA
          </p>

          <h2>
            Desde que nos elegimos
          </h2>

          <p className="counter-date">
            05 · 10 · 2025
          </p>

          <div className="counter-heart">
            ♡
          </div>

          <div className="days-number">
            {daysTogether}
          </div>

          <div className="days-label">
            DÍAS JUNTOS
          </div>

          <div className="counter-line"></div>

          <p className="counter-message">
            Y todavía quiero seguir
            <br />
            sumando días a tu lado.
          </p>

          <button
            type="button"
            className="counter-button"
            onClick={() => {
              goTo("compatibility");
            }}
          >

            Continuar nuestra historia

            <span>
              →
            </span>

          </button>

          <p className="counter-signature">
            Miku ♡ Braian
          </p>

        </div>

      </main>

    );

  };

  // ===================================================
  // COMPATIBILIDAD
  // ===================================================

  // ===================================================
// COMPATIBILIDAD
// ===================================================

const CompatibilityScreen = () => {

  return (

    <main className="compatibility-page">

      <div
        className={
          compatibilityResult
            ? "compatibility-card result-visible"
            : "compatibility-card"
        }
      >

        {/* ============================================
            INTRODUCCIÓN
            ============================================ */}

        {!compatibilityStarted && !compatibilityResult && (

          <>
            <p className="eyebrow">
              UNA PEQUEÑA PRUEBA DE AMOR
            </p>

            <h2>
              ¿Qué tan compatibles somos?
            </h2>

            <p className="compatibility-intro">
              Después de todo lo que vivimos,
              <br />
              creo que ya sabemos la respuesta...
            </p>

            <div className="compatibility-names">

              <div className="compatibility-person">
                <span className="name-heart">♡</span>
                <strong>Miku</strong>
              </div>

              <div className="compatibility-plus">
                +
              </div>

              <div className="compatibility-person">
                <strong>Braian</strong>
                <span className="name-heart">♡</span>
              </div>

            </div>

            <div className="compatibility-question">
              <span>¿Listos?</span>
            </div>

            <button
              type="button"
              className="compatibility-button"
              onClick={() => {

                setCompatibilityStarted(true);

                setTimeout(() => {
                  setCompatibilityResult(true);
                }, 2500);

              }}
            >

              Descubrir nuestra compatibilidad

              <span>
                →
              </span>

            </button>

            <p className="compatibility-small">
              El resultado podría cambiar nuestras vidas...
            </p>

          </>

        )}


        {/* ============================================
            ANIMACIÓN DE CÁLCULO
            ============================================ */}

        {compatibilityStarted && !compatibilityResult && (

          <div className="compatibility-loading">

            <div className="loading-hearts">

              <span>♡</span>
              <span>♡</span>
              <span>♡</span>

            </div>

            <p className="eyebrow">
              CALCULANDO...
            </p>

            <h2>
              Analizando nuestra historia
            </h2>

            <p className="loading-text">
              Risas...
            </p>

            <p className="loading-text">
              Abrazos...
            </p>

            <p className="loading-text">
              Pavadas...
            </p>

            <p className="loading-text">
              Momentos inolvidables...
            </p>

            <div className="compatibility-loader">

              <div className="compatibility-loader-fill"></div>

            </div>

            <p className="loading-final-text">
              Un momento...
            </p>

          </div>

        )}


        {/* ============================================
            RESULTADO
            ============================================ */}

        {compatibilityResult && (

          <div className="compatibility-result">

            <p className="eyebrow">
              RESULTADO OFICIAL
            </p>

            <p className="result-label">
              MIKU ♡ BRAIAN
            </p>

            <div className="percentage">
              100<span>%</span>
            </div>

            <div className="result-hearts">

              <span>♡</span>
              <span>♥</span>
              <span>♡</span>

            </div>

            <h3>
              Bueno...
            </h3>

            <p className="result-message">
              Parece que nos vamos
              <br />
              a tener que casar. 💍
            </p>

            <p className="result-description">
              Después de analizar nuestras risas,
              nuestras locuras, nuestras diferencias,
              nuestros momentos y todo lo que somos...
            </p>

            <p className="result-description strong">
              La ciencia no encontró otra explicación.
            </p>

            <div className="marriage-joke">
              <span>♡</span>
              Compatibilidad matrimonial detectada
              <span>♡</span>
            </div>

            <button
              type="button"
              className="compatibility-next"
              onClick={() => {
                goTo("memories");
              }}
            >

              Seguir nuestra historia

              <span>
                →
              </span>

            </button>

            <p className="result-signature">
              Miku ♡ Braian
            </p>

          </div>

        )}

      </div>

    </main>

  );

};

  // ===================================================
// RECUERDOS
// ===================================================

const MemoriesScreen = () => {

  const [memories, setMemories] = useState([]);

  const [loadingMemories, setLoadingMemories] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

const memoriesPerPage = 6;
const indexOfLastMemory =
  currentPage * memoriesPerPage;

const indexOfFirstMemory =
  indexOfLastMemory - memoriesPerPage;

const currentMemories =
  memories.slice(
    indexOfFirstMemory,
    indexOfLastMemory
  );

const totalPages =
  Math.ceil(
    memories.length / memoriesPerPage
  );

  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [userName, setUserName] = useState(
    localStorage.getItem("memoryUser") || ""
  );

  const [createdBy, setCreatedBy] = useState(
    localStorage.getItem("memoryUser") || ""
  );

  const [selectedFile, setSelectedFile] = useState(null);

  const [uploading, setUploading] = useState(false);

  const [selectedMemory, setSelectedMemory] = useState(null);
  
  const [bookOpened, setBookOpened] = useState(false);

  const selectUser = (name) => {

  localStorage.setItem("memoryUser", name);

  setUserName(name);

  setCreatedBy(name);

};
  

  // ===================================================
  // CARGAR RECUERDOS
  // ===================================================

  const loadMemories = async () => {

    setLoadingMemories(true);

    const { data, error } = await supabase
      .from("Memories uwu")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {

      console.error(
        "Error cargando recuerdos:",
        error
      );

      setLoadingMemories(false);
      return;
    }

    setMemories(data || []);
    setLoadingMemories(false);

  };

  // ===================================================
  // CARGAR AL ENTRAR
  // ===================================================

  useEffect(() => {

    loadMemories();

  }, []);
// ===================================================
// ELIMINAR RECUERDO
// ===================================================

const deleteMemory = async (memory) => {

  const confirmed = window.confirm(
    `¿Querés eliminar "${memory.title}" de nuestro libro? ❤️`
  );

  if (!confirmed) {
    return;
  }

  try {

    // -----------------------------------------------
    // OBTENER NOMBRE DEL ARCHIVO
    // -----------------------------------------------

    let fileName = null;

    if (memory.image_url) {

      const url = new URL(memory.image_url);

      const path = url.pathname.split("/storage/v1/object/public/");

      if (path.length > 1) {

        const fullPath = decodeURIComponent(path[1]);

        const bucketPrefix = "Memories uwu/";

        if (fullPath.startsWith(bucketPrefix)) {

          fileName = fullPath.substring(
            bucketPrefix.length
          );

        }

      }

    }

    // -----------------------------------------------
    // BORRAR FOTO DEL STORAGE
    // -----------------------------------------------

    if (fileName) {

      const { error: storageError } =
        await supabase.storage
          .from("Memories uwu")
          .remove([fileName]);

      if (storageError) {

        console.error(
          "Error eliminando imagen:",
          storageError
        );

      }

    }

    // -----------------------------------------------
    // BORRAR RECUERDO DE LA TABLA
    // -----------------------------------------------

    const { error: deleteError } =
      await supabase
        .from("Memories uwu")
        .delete()
        .eq("id", memory.id);

    if (deleteError) {

      console.error(
        "Error eliminando recuerdo:",
        deleteError
      );

      alert(
        "No se pudo eliminar el recuerdo."
      );

      return;
    }

    // -----------------------------------------------
    // ACTUALIZAR PANTALLA
    // -----------------------------------------------

    setMemories((currentMemories) =>
      currentMemories.filter(
        (item) => item.id !== memory.id
      )
    );

  } catch (error) {

    console.error(
      "Error eliminando recuerdo:",
      error
    );

    alert(
      "Ocurrió un error al eliminar el recuerdo."
    );

  }

};
  // ===================================================
  // SUBIR RECUERDO
  // ===================================================

  const addMemory = async () => {

    if (!title.trim()) {
      alert("Poné un título para el recuerdo ❤️");
      return;
    }

    if (!selectedFile) {
      alert("Elegí una foto 📸");
      return;
    }

    try {

      setUploading(true);

      // -----------------------------------------------
      // CREAR NOMBRE ÚNICO PARA LA FOTO
      // -----------------------------------------------

      const fileExtension =
        selectedFile.name.split(".").pop();

      const fileName =
        `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExtension}`;

      // -----------------------------------------------
      // SUBIR FOTO A STORAGE
      // -----------------------------------------------

      const { error: uploadError } =
        await supabase.storage
          .from("Memories uwu")
          .upload(fileName, selectedFile);

      if (uploadError) {

        console.error(
          "Error subiendo imagen:",
          uploadError
        );

        alert(
          "No se pudo subir la foto."
        );

        setUploading(false);
        return;
      }

      // -----------------------------------------------
      // OBTENER URL PÚBLICA
      // -----------------------------------------------

      const { data: publicUrlData } =
        supabase.storage
          .from("Memories uwu")
          .getPublicUrl(fileName);

      const imageUrl =
        publicUrlData.publicUrl;

      // -----------------------------------------------
      // GUARDAR RECUERDO EN LA TABLA
      // -----------------------------------------------

      const { error: insertError } =
        await supabase
          .from("Memories uwu")
          .insert([
            {
              title: title.trim(),
              description: description.trim(),
              image_url: imageUrl,
              created_by: userName,
            },
          ]);

      if (insertError) {

        console.error(
  "ERROR COMPLETO GUARDANDO RECUERDO:",
  JSON.stringify(insertError, null, 2)
);

        alert(
          "La foto se subió, pero no se pudo guardar el recuerdo."
        );

        setUploading(false);
        return;
      }

      // -----------------------------------------------
      // LIMPIAR FORMULARIO
      // -----------------------------------------------

      setTitle("");
setDescription("");
setCreatedBy(userName);
setSelectedFile(null);
setShowForm(false);

      // -----------------------------------------------
      // VOLVER A CARGAR RECUERDOS
      // -----------------------------------------------

      await loadMemories();

      alert("¡Recuerdo guardado! ❤️");

    } catch (error) {

      console.error(
        "Error inesperado:",
        error
      );

      alert(
        "Ocurrió un error al guardar el recuerdo."
      );

    } finally {

      setUploading(false);

    }

  };

  // ===================================================
  // PANTALLA
  // ===================================================

  return (

    <main className="memories-page">

      <div className="memories-container">

        <p className="eyebrow">
          NUESTROS RECUERDOS
        </p>

        <h2 className="memories-title">
          Nuestro libro
        </h2>
{!userName && (

  <div className="memory-user-selection">

    <p>
      Antes de entrar... ¿quién sos? ♡
    </p>

    <button
      type="button"
      onClick={() => selectUser("Miku")}
    >
      🌷 Miku
    </button>

    <button
      type="button"
      onClick={() => selectUser("Braian")}
    >
      💙 Braian
    </button>

  </div>

)}
{userName && (

  <div className="memory-current-user">

    <span>
      Entraste como <strong>{userName}</strong> ♡
    </span>

    <button
      type="button"
      onClick={() => {

        localStorage.removeItem("memoryUser");

        setUserName("");

        setCreatedBy("");

      }}
    >
      Cambiar
    </button>

  </div>

)}{userName && !bookOpened && (

  <div className="memory-book-cover">

    <div className="memory-book-cover-inner">

      <span className="memory-book-small">
        NUESTROS RECUERDOS
      </span>

      <div className="memory-book-icon">
        ♡
      </div>

      <h2>
        Nuestro libro
      </h2>

      <p>
        Todas esas pequeñas cosas
        <br />
        que algún día vamos a mirar
        <br />
        y decir...
      </p>

      <span className="memory-book-question">
        “¿Te acordás?”
      </span>

      <button
        type="button"
        className="memory-book-open"
        onClick={() => setBookOpened(true)}
      >
        Abrir nuestro libro ♡
      </button>

    </div>

  </div>

)}


        {/* ==========================================
            BOTÓN AGREGAR
        ========================================== */}

        {bookOpened && (

  <button
    type="button"
    className="memory-add-button"
    onClick={() => {
      setShowForm(!showForm);
    }}
  >
    ＋ Agregar recuerdo
  </button>

)}

        {/* ==========================================
            FORMULARIO
        ========================================== */}

        {bookOpened && showForm && (

          <div className="memory-form">

            <h3>
              Nuevo recuerdo ♡
            </h3>


            {/* FOTO */}

            <label className="memory-file-label">

  {selectedFile
    ? `📸 ${selectedFile.name}`
    : "📷 Elegir una foto"}

  <input
    type="file"
    accept="image/*"
    onChange={(event) => {

      const file = event.target.files?.[0];

      if (file) {
        setSelectedFile(file);
      }

    }}
  />

</label>

{selectedFile && (

  <div className="memory-preview">

    <img
      src={URL.createObjectURL(selectedFile)}
      alt="Vista previa del recuerdo"
    />

    <button
      type="button"
      onClick={() => setSelectedFile(null)}
    >
      Cambiar foto
    </button>

  </div>

)}


            {/* TÍTULO */}

            <label>
              Título

              <input
                type="text"
                placeholder="Nuestro primer viaje..."
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                }}
              />

            </label>


            {/* DESCRIPCIÓN */}

            <label>
              ¿Qué recordamos?

              <textarea
                placeholder="Contanos un poquito sobre este momento..."
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                }}
              />

            </label>


            {/* QUIÉN LO AGREGÓ */}


<div className="memory-created-by">

  <span>
    Este recuerdo lo agrega
  </span>

  <strong>
    {userName} ♡
  </strong>

</div>


            {/* GUARDAR */}

            <button
              type="button"
              className="memory-save-button"
              onClick={addMemory}
              disabled={uploading}
            >

              {uploading
                ? "Guardando recuerdo..."
                : "Guardar recuerdo ♡"}

            </button>

            <button
  type="button"
  className="memory-cancel-button"
  onClick={() => {

    setShowForm(false);

    setTitle("");
    setDescription("");
    setSelectedFile(null);

  }}
  disabled={uploading}
>
  Cancelar
</button>

          </div>

        )}


        {/* ==========================================
            RECUERDOS
        ========================================== */}

        {bookOpened && loadingMemories ? (

          <div className="memories-loading">
            <span>♡</span>
            <p>
              Abriendo nuestro libro...
            </p>
          </div>

        ) : memories.length === 0 ? (

          <div className="memories-empty">

            <div className="memories-empty-heart">
              ♡
            </div>

            <h3>
              Nuestro libro está vacío
            </h3>

            <p>
              Agreguemos nuestro primer recuerdo.
            </p>

          </div>

        ) : (

          <div className="memories-grid">

            {currentMemories.map((memory) => (

             <article
  key={memory.id}
  className="memory-card"
>

  {/* FOTO */}

  {memory.image_url && (

    <div
      className="memory-image-wrapper"
      onClick={() => {
        setSelectedMemory(memory);
      }}
    >

      <img
        src={memory.image_url}
        alt={memory.title}
        className="memory-image"
      />

      <div className="memory-image-overlay">
        Ver foto ♡
      </div>

    </div>

  )}


  {/* CONTENIDO */}

  <div className="memory-content">

    <h3>
      {memory.title}
    </h3>

    {memory.description && (

      <p>
        {memory.description}
      </p>

    )}


    {/* INFORMACIÓN */}

   <div className="memory-footer">

  <div className="memory-note">

    <span className="memory-note-user">
      ♡ {memory.created_by || "Nosotros"}
    </span>

    {memory.created_at && (

      <span className="memory-note-date">
        {new Date(
          memory.created_at
        ).toLocaleDateString("es-AR")}
      </span>

    )}

  </div>


      {/* ELIMINAR */}

      <button
        type="button"
        className="memory-delete-button"
        onClick={() => deleteMemory(memory)}
        aria-label="Eliminar recuerdo"
      >
        🗑️
      </button>

    </div>

  </div>

</article>

            ))}

          </div>

        )}

      </div>
{selectedMemory && (

        <div
          className="memory-lightbox"
          onClick={() => setSelectedMemory(null)}
        >

          <button
            type="button"
            className="memory-lightbox-close"
            onClick={() => setSelectedMemory(null)}
          >
            ×
          </button>

          <div
            className="memory-lightbox-content"
            onClick={(event) => event.stopPropagation()}
          >

            <img
              src={selectedMemory.image_url}
              alt={selectedMemory.title}
              className="memory-lightbox-image"
            />

            <h3>
              {selectedMemory.title}
            </h3>

            {selectedMemory.description && (
              <p>
                {selectedMemory.description}
              </p>
            )}

            <span>
              ♡ {selectedMemory.created_by || "Nosotros"}
            </span>

          </div>

        </div>

      )}      <button
        type="button"
        className="grandprix-access-button"
        onClick={() => goTo("grandprix")}
      >
        🏎️ Grand Prix
        <span>→</span>
      </button>
    </main>

  );
// ============================================================
// 54 RAZONES
// ============================================================

const ReasonsScreen = ({ goTo }) => {

  return (
    <main className="reasons-page">

      <div className="reasons-container">

        <p className="eyebrow">
          PARA VOS ♡
        </p>

        <h2>
          54 razones
        </h2>

        <p>
          Las razones por las que te elegiría
          una y otra vez.
        </p>

        <button
          type="button"
          className="reasons-start-button"
          onClick={() => {
            // Próximamente comenzamos las razones
          }}
        >
          Comenzar ♡
        </button>

        <button
          type="button"
          className="reasons-back-button"
          onClick={() => goTo("grandprix")}
        >
          ← Volver a Grand Prix
        </button>

      </div>

    </main>
  );

};
}// ============================================================
// GRAND PRIX MULTIJUGADOR
// MIKU 🩵 VS BRAIAN 💙
// ============================================================

const RacingGameScreen = ({ goTo }) => {

  // ==========================================================
  // REFERENCIAS
  // ==========================================================

  const playerCarRef = useRef(null);
  const collisionHandledRef = useRef(false);
  const turboTimeoutRef = useRef(null);
  const turboEndTimeRef = useRef(null);

  // ==========================================================
  // ESTADO GENERAL
  // ==========================================================

  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [raceOver, setRaceOver] = useState(false);
  const [winner, setWinner] = useState(null);

  // ==========================================================
  // JUGADORES
  // ==========================================================

  const [playerRole, setPlayerRole] = useState(null);

  const [playerPosition, setPlayerPosition] = useState(25);
  const [opponentPosition, setOpponentPosition] = useState(75);

  const [raceProgress, setRaceProgress] = useState(0);
  const [opponentProgress, setOpponentProgress] = useState(0);

  // ==========================================================
  // OBJETOS DE LA PISTA
  // ==========================================================

  const [obstacles, setObstacles] = useState([]);
  const [powerUps, setPowerUps] = useState([]);

  // ==========================================================
  // TURBO
  // ==========================================================

  const [turboActive, setTurboActive] = useState(false);

  // ==========================================================
  // CHOQUE
  // ==========================================================

  const [crashAnimation, setCrashAnimation] = useState(false);
  const [crashedPlayer, setCrashedPlayer] = useState(null);
  const [opponentCrashed, setOpponentCrashed] = useState(false);

  // ==========================================================
  // MULTIPLAYER
  // ==========================================================

  const [raceId, setRaceId] = useState(null);
  const [raceCode, setRaceCode] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [waitingForStart, setWaitingForStart] = useState(false);

  const [connectionStatus, setConnectionStatus] =
    useState("DISCONNECTED");

  // ==========================================================
  // CONSTANTES
  // ==========================================================

  const LANES = [25, 50, 75];

  // ==========================================================
  // LIMPIAR ESTADO DE CARRERA
  // ==========================================================

  const resetLocalRace = () => {

    setGameStarted(false);
    setCountdown(null);
    setRaceOver(false);
    setWinner(null);

    setPlayerPosition(
      playerRole === "braian" ? 75 : 25
    );

    setOpponentPosition(
      playerRole === "braian" ? 25 : 75
    );

    setRaceProgress(0);
    setOpponentProgress(0);

    setObstacles([]);
    setPowerUps([]);

    setTurboActive(false);

    setCrashAnimation(false);
    setCrashedPlayer(null);
    setOpponentCrashed(false);

    collisionHandledRef.current = false;

    if (turboTimeoutRef.current) {
      clearTimeout(turboTimeoutRef.current);
      turboTimeoutRef.current = null;
    }
  };

  // ==========================================================
  // CREAR CARRERA
  // ==========================================================

  const createRace = async () => {

    const code =
      `MIKU${Math.floor(100 + Math.random() * 900)}`;

    console.log("🏁 CREANDO CARRERA:", code);

    const { data, error } = await supabase
      .from("races")
      .insert({
        code,
        status: "waiting",

        miku_position: 25,
        braian_position: 75,

        miku_progress: 0,
        braian_progress: 0,

        countdown: null,
        winner: null,

        obstacles: [],
        power_ups: []
      })
      .select()
      .single();

    if (error) {

      console.error(
        "❌ Error creando carrera:",
        error
      );

      alert(
        "No se pudo crear la carrera.\n\n" +
        error.message
      );

      return;
    }

    console.log(
      "✅ CARRERA CREADA:",
      data
    );

    setRaceId(data.id);
    setRaceCode(data.code);

    setPlayerRole("miku");

    setIsMultiplayer(true);

    setOpponentJoined(false);
    setWaitingForStart(true);

    setGameStarted(false);
    setCountdown(null);

    setRaceOver(false);
    setWinner(null);

    setPlayerPosition(25);
    setOpponentPosition(75);

    setRaceProgress(0);
    setOpponentProgress(0);

    setObstacles([]);
    setPowerUps([]);

    setTurboActive(false);

    collisionHandledRef.current = false;
  };

  // ==========================================================
  // UNIRSE A CARRERA
  // ==========================================================

  const joinRace = async () => {

    const cleanCode =
      joinCode.trim().toUpperCase();

    if (!cleanCode) {

      alert(
        "Ingresá el código de la carrera 🏁"
      );

      return;
    }

    console.log(
      "🔎 BUSCANDO:",
      cleanCode
    );

    const { data, error } = await supabase
      .from("races")
      .select("*")
      .eq("code", cleanCode)
      .maybeSingle();

    if (error) {

      console.error(
        "❌ Error buscando carrera:",
        error
      );

      alert(
        "Error buscando la carrera:\n\n" +
        error.message
      );

      return;
    }

    if (!data) {

      alert(
        `No encontramos la carrera "${cleanCode}".`
      );

      return;
    }

    if (data.status !== "waiting") {

      alert(
        "Esta carrera ya comenzó o no está disponible."
      );

      return;
    }

    // --------------------------------------------------------
    // BRAIAN SE UNE
    // --------------------------------------------------------

    const { data: updatedRace, error: updateError } =
      await supabase
        .from("races")
        .update({
          status: "ready",

          braian_position: 75,
          braian_progress: 0
        })
        .eq("id", data.id)
        .select()
        .single();

    if (updateError) {

      console.error(
        "❌ Error uniéndose:",
        updateError
      );

      alert(
        "No pudimos unirte a la carrera.\n\n" +
        updateError.message
      );

      return;
    }

    console.log(
      "💙 BRAIAN SE UNIÓ:",
      updatedRace
    );

    setRaceId(updatedRace.id);
    setRaceCode(updatedRace.code);

    setPlayerRole("braian");

    setIsMultiplayer(true);

    setOpponentJoined(true);
    setWaitingForStart(true);

    setGameStarted(false);
    setCountdown(null);

    setRaceOver(false);

    setWinner(
      updatedRace.winner || null
    );

    setPlayerPosition(75);
    setOpponentPosition(
      Number(updatedRace.miku_position ?? 25)
    );

    setRaceProgress(0);

    setOpponentProgress(
      Number(updatedRace.miku_progress ?? 0)
    );

    setObstacles(
      Array.isArray(updatedRace.obstacles)
        ? updatedRace.obstacles
        : []
    );

    setPowerUps(
      Array.isArray(updatedRace.power_ups)
        ? updatedRace.power_ups
        : []
    );

    collisionHandledRef.current = false;
  };

  // ==========================================================
  // REALTIME
  // ==========================================================

  useEffect(() => {

    if (!raceId) {
      return;
    }

    console.log(
      "📡 CONECTANDO REALTIME:",
      raceId
    );

    const channel = supabase
      .channel(`grand-prix-${raceId}`)

      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "races",
          filter: `id=eq.${raceId}`
        },
        (payload) => {

          const race = payload.new;

          console.log(
            "📡 REALTIME:",
            race
          );

          // ----------------------------------------------------
          // JUGADORES
          // ----------------------------------------------------

          if (
            race.status === "ready" ||
            race.status === "countdown" ||
            race.status === "racing" ||
            race.status === "finished"
          ) {

            setOpponentJoined(true);
          }

          // ----------------------------------------------------
          // POSICIONES
          // ----------------------------------------------------

          if (playerRole === "miku") {

            setOpponentPosition(
              Number(
                race.braian_position ?? 75
              )
            );

            setOpponentProgress(
              Number(
                race.braian_progress ?? 0
              )
            );
          }

          if (playerRole === "braian") {

            setOpponentPosition(
              Number(
                race.miku_position ?? 25
              )
            );

            setOpponentProgress(
              Number(
                race.miku_progress ?? 0
              )
            );
          }

          // ----------------------------------------------------
          // OBSTÁCULOS
          // ----------------------------------------------------

          if (
            Array.isArray(race.obstacles)
          ) {

            setObstacles(
              race.obstacles.map(
                obstacle => ({
                  ...obstacle,
                  createdAt:
                    Number(
                      obstacle.createdAt
                    )
                })
              )
            );
          }

          // ----------------------------------------------------
          // POWER UPS
          // ----------------------------------------------------

          if (
            Array.isArray(race.power_ups)
          ) {

            setPowerUps(
              race.power_ups.map(
                powerUp => ({
                  ...powerUp,
                  createdAt:
                    Number(
                      powerUp.createdAt
                    )
                })
              )
            );
          }

          // ----------------------------------------------------
          // COUNTDOWN
          // ----------------------------------------------------

          if (
            race.countdown !== null &&
            race.status === "countdown"
          ) {

            setCountdown(
              Number(race.countdown)
            );
          }

          // ----------------------------------------------------
          // CARRERA
          // ----------------------------------------------------

          if (
            race.status === "racing"
          ) {

            setCountdown(null);
            setGameStarted(true);
            setWaitingForStart(false);
            setRaceOver(false);
          }

          // ----------------------------------------------------
          // FINAL
          // ----------------------------------------------------

          if (
            race.status === "finished" &&
            race.winner
          ) {

            console.log(
              "🏆 GANADOR:",
              race.winner
            );

            setWinner(
              race.winner
            );

            setGameStarted(false);
            setWaitingForStart(false);
            setCountdown(null);

            const otherPlayer =
              race.winner === "miku"
                ? "braian"
                : "miku";

            if (
              otherPlayer !== playerRole
            ) {

              setOpponentCrashed(true);

              setTimeout(() => {
                setOpponentCrashed(false);
              }, 900);
            }
          }
        }
      )

      .subscribe((status) => {

        console.log(
          "📡 REALTIME STATUS:",
          status
        );

        setConnectionStatus(status);
      });

    return () => {

      console.log(
        "📡 DESCONECTANDO:",
        raceId
      );

      supabase.removeChannel(channel);

      setConnectionStatus(
        "DISCONNECTED"
      );
    };

  }, [
    raceId,
    playerRole
  ]);

  // ==========================================================
  // INICIAR CARRERA MULTIPLAYER
  // ==========================================================

  const startMultiplayerRace = async () => {

    if (!raceId) {
      return;
    }

    if (playerRole !== "miku") {
      return;
    }

    if (!opponentJoined) {

      alert(
        "Todavía estamos esperando a Braian 💙"
      );

      return;
    }

    console.log(
      "🏁 INICIANDO COUNTDOWN"
    );

    setGameStarted(false);
    setWaitingForStart(true);
    setCountdown(3);

    setRaceOver(false);
    setWinner(null);

    setPlayerPosition(25);
    setOpponentPosition(75);

    setRaceProgress(0);
    setOpponentProgress(0);

    setObstacles([]);
    setPowerUps([]);

    collisionHandledRef.current = false;

    const { error } = await supabase
      .from("races")
      .update({
        status: "countdown",
        countdown: 3,

        winner: null,

        miku_position: 25,
        braian_position: 75,

        miku_progress: 0,
        braian_progress: 0,

        obstacles: [],
        power_ups: []
      })
      .eq("id", raceId);

    if (error) {

      console.error(
        "❌ Error iniciando carrera:",
        error
      );

      alert(
        "No se pudo iniciar la carrera."
      );
    }
  };

  // ==========================================================
  // COUNTDOWN MULTIPLAYER
  // SOLO MIKU CONTROLA EL COUNTDOWN
  // ==========================================================

  useEffect(() => {

    if (
      !isMultiplayer ||
      playerRole !== "miku" ||
      !raceId ||
      countdown === null
    ) {
      return;
    }

    if (countdown <= 0) {

      const startRace = async () => {

        console.log(
          "🏁 ¡YA! CARRERA"
        );

        setCountdown(null);
        setGameStarted(true);
        setWaitingForStart(false);

        const { error } =
          await supabase
            .from("races")
            .update({
              status: "racing",
              countdown: null
            })
            .eq("id", raceId);

        if (error) {

          console.error(
            "❌ Error pasando a racing:",
            error
          );
        }
      };

      startRace();

      return;
    }

    const timer = setTimeout(() => {

      const next =
        countdown - 1;

      console.log(
        "⏱️",
        next
      );

      setCountdown(next);

      supabase
        .from("races")
        .update({
          countdown: next
        })
        .eq("id", raceId)
        .then(({ error }) => {

          if (error) {

            console.error(
              "❌ Error countdown:",
              error
            );
          }
        });

    }, 1000);

    return () => {
      clearTimeout(timer);
    };

  }, [
    countdown,
    isMultiplayer,
    playerRole,
    raceId
  ]);

  // ==========================================================
  // COUNTDOWN INDIVIDUAL
  // ==========================================================

  useEffect(() => {

    if (
      isMultiplayer ||
      countdown === null
    ) {
      return;
    }

    if (countdown <= 0) {

      const timer =
        setTimeout(() => {

          setCountdown(null);
          setGameStarted(true);

        }, 400);

      return () => {
        clearTimeout(timer);
      };
    }

    const timer =
      setTimeout(() => {

        setCountdown(
          current => current - 1
        );

      }, 1000);

    return () => {
      clearTimeout(timer);
    };

  }, [
    countdown,
    isMultiplayer
  ]);

  // ==========================================================
  // MOVER JUGADOR
  // ==========================================================

  const movePlayer = async (direction) => {

    if (!gameStarted) {
      return;
    }

    const currentIndex =
      LANES.reduce(
        (closest, lane, index) => {

          return Math.abs(
            lane - playerPosition
          ) <
          Math.abs(
            LANES[closest] -
            playerPosition
          )
            ? index
            : closest;

        },
        0
      );

    const nextIndex =
      direction === "left"
        ? Math.max(
            currentIndex - 1,
            0
          )
        : Math.min(
            currentIndex + 1,
            LANES.length - 1
          );

    const nextPosition =
      LANES[nextIndex];

    // --------------------------------------------------------
    // NO PERMITIR MISMO CARRIL
    // --------------------------------------------------------

    const opponentIndex =
      LANES.reduce(
        (closest, lane, index) => {

          return Math.abs(
            lane - opponentPosition
          ) <
          Math.abs(
            LANES[closest] -
            opponentPosition
          )
            ? index
            : closest;

        },
        0
      );

    if (
      LANES[opponentIndex] ===
      nextPosition
    ) {

      console.log(
        "🚫 Carril ocupado"
      );

      return;
    }

    // --------------------------------------------------------
    // ACTUALIZAR LOCAL
    // --------------------------------------------------------

    setPlayerPosition(
      nextPosition
    );

    // --------------------------------------------------------
    // SINGLE PLAYER
    // --------------------------------------------------------

    if (
      !isMultiplayer ||
      !raceId
    ) {
      return;
    }

    // --------------------------------------------------------
    // MULTIPLAYER
    // --------------------------------------------------------

    const column =
      playerRole === "miku"
        ? "miku_position"
        : "braian_position";

    const { error } =
      await supabase
        .from("races")
        .update({
          [column]:
            nextPosition
        })
        .eq(
          "id",
          raceId
        );

    if (error) {

      console.error(
        "❌ Error posición:",
        error
      );
    }
  };

  // ==========================================================
  // TECLADO
  // ==========================================================

  useEffect(() => {

    const handleKeyDown = (event) => {

      if (
        event.key === "ArrowLeft"
      ) {

        event.preventDefault();

        movePlayer("left");
      }

      if (
        event.key === "ArrowRight"
      ) {

        event.preventDefault();

        movePlayer("right");
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };

  }, [
    gameStarted,
    playerPosition,
    opponentPosition,
    playerRole,
    raceId,
    isMultiplayer
  ]);

  // ==========================================================
  // PROGRESO
  // ==========================================================

  useEffect(() => {

    if (
      !gameStarted ||
      raceOver ||
      winner
    ) {
      return;
    }

    const interval =
      setInterval(() => {

        setRaceProgress(
          current => {

            const speed =
              turboActive
                ? 2
                : 1;

            return Math.min(
              current + speed,
              100
            );
          }
        );

      }, 180);

    return () => {
      clearInterval(interval);
    };

  }, [
    gameStarted,
    raceOver,
    winner,
    turboActive
  ]);

  // ==========================================================
  // SINCRONIZAR PROGRESO
  // ==========================================================

  useEffect(() => {

    if (
      !isMultiplayer ||
      !raceId ||
      !gameStarted
    ) {
      return;
    }

    const column =
      playerRole === "miku"
        ? "miku_progress"
        : "braian_progress";

    supabase
      .from("races")
      .update({
        [column]:
          raceProgress
      })
      .eq(
        "id",
        raceId
      )
      .then(({ error }) => {

        if (error) {

          console.error(
            "❌ Error progreso:",
            error
          );
        }
      });

  }, [
    raceProgress,
    isMultiplayer,
    raceId,
    gameStarted,
    playerRole
  ]);

  // ==========================================================
  // GANADOR POR META
  // ==========================================================

  useEffect(() => {

    if (
      !gameStarted ||
      raceOver ||
      winner
    ) {
      return;
    }

    if (
      raceProgress < 100
    ) {
      return;
    }

    const winnerName =
      playerRole === "braian"
        ? "braian"
        : "miku";

    const declareWinner =
      async () => {

        console.log(
          "🏆 GANADOR:",
          winnerName
        );

        setWinner(
          winnerName
        );

        setGameStarted(false);

        if (
          isMultiplayer &&
          raceId
        ) {

          const { error } =
            await supabase
              .from("races")
              .update({
                winner:
                  winnerName,

                status:
                  "finished"
              })
              .eq(
                "id",
                raceId
              );

          if (error) {

            console.error(
              "❌ Error ganador:",
              error
            );
          }
        }
      };

    declareWinner();

  }, [
    raceProgress,
    gameStarted,
    raceOver,
    winner,
    playerRole,
    isMultiplayer,
    raceId
  ]);

  // ==========================================================
  // GENERAR OBSTÁCULOS
  // SOLO MIKU EN MULTIPLAYER
  // ==========================================================

  useEffect(() => {

    if (
      !gameStarted ||
      raceOver ||
      winner
    ) {
      return;
    }

    if (
      isMultiplayer &&
      playerRole !== "miku"
    ) {
      return;
    }

    const interval =
      setInterval(() => {

        const createdAt =
          Date.now();

        const newObstacle = {

          id:
            `obstacle-${createdAt}-${Math.random()}`,

          left:
            LANES[
              Math.floor(
                Math.random() *
                LANES.length
              )
            ],

          createdAt
        };

        setObstacles(current => {

          const updated = [
            ...current,
            newObstacle
          ];

          if (
            isMultiplayer &&
            raceId &&
            playerRole === "miku"
          ) {

            supabase
              .from("races")
              .update({
                obstacles:
                  updated
              })
              .eq(
                "id",
                raceId
              )
              .then(({ error }) => {

                if (error) {

                  console.error(
                    "❌ Error obstáculos:",
                    error
                  );
                }
              });
          }

          return updated;
        });

      }, 2000);

    return () => {
      clearInterval(interval);
    };

  }, [
    gameStarted,
    raceOver,
    winner,
    isMultiplayer,
    playerRole,
    raceId
  ]);

  // ==========================================================
  // MOVIMIENTO OBSTÁCULOS
  // ==========================================================

  useEffect(() => {

    if (
      !gameStarted ||
      raceOver ||
      winner
    ) {
      return;
    }

    const interval =
      setInterval(() => {

        const now =
          Date.now();

        setObstacles(current => {

          return current
            .map(obstacle => {

              const elapsed =
                now -
                Number(
                  obstacle.createdAt
                );

              const top =
                -10 +
                elapsed * 0.04;

              return {
                ...obstacle,
                top
              };

            })
            .filter(
              obstacle =>
                obstacle.top < 110
            );

        });

      }, 50);

    return () => {
      clearInterval(interval);
    };

  }, [
    gameStarted,
    raceOver,
    winner
  ]);

  // ==========================================================
  // GENERAR POWER UPS
  // ==========================================================

  useEffect(() => {

    if (
      !gameStarted ||
      raceOver ||
      winner
    ) {
      return;
    }

    // Solamente Miku genera
    // los Power-Ups en multiplayer.

    if (
      isMultiplayer &&
      playerRole !== "miku"
    ) {
      return;
    }

    const interval =
      setInterval(() => {

        const createdAt =
          Date.now();

        const newPowerUp = {

          id:
            `turbo-${createdAt}-${Math.random()}`,

          type:
            "turbo",

          left:
            LANES[
              Math.floor(
                Math.random() *
                LANES.length
              )
            ],

          createdAt
        };

        console.log(
          "⚡ POWER-UP:",
          newPowerUp
        );

        setPowerUps(current => {

          const updated = [
            ...current,
            newPowerUp
          ];

          if (
            isMultiplayer &&
            raceId &&
            playerRole === "miku"
          ) {

            supabase
              .from("races")
              .update({
                power_ups:
                  updated
              })
              .eq(
                "id",
                raceId
              )
              .then(({ error }) => {

                if (error) {

                  console.error(
                    "❌ Error Power-Ups:",
                    error
                  );
                }
              });
          }

          return updated;
        });

      }, 2500);

    return () => {
      clearInterval(interval);
    };

  }, [
    gameStarted,
    raceOver,
    winner,
    isMultiplayer,
    playerRole,
    raceId
  ]);

  // ==========================================================
  // MOVIMIENTO POWER UPS
  // ==========================================================

  useEffect(() => {

    if (
      !gameStarted ||
      raceOver ||
      winner
    ) {
      return;
    }

    const interval =
      setInterval(() => {

        const now =
          Date.now();

        setPowerUps(current => {

          return current
            .map(powerUp => {

              const elapsed =
                now -
                Number(
                  powerUp.createdAt
                );

              const top =
                -8 +
                elapsed * 0.045;

              return {
                ...powerUp,
                top
              };

            })
            .filter(
              powerUp =>
                powerUp.top < 110
            );

        });

      }, 50);

    return () => {
      clearInterval(interval);
    };

  }, [
    gameStarted,
    raceOver,
    winner
  ]);

  // ==========================================================
// COLISIONES
// MIKU 🩵 VS BRAIAN 💙
// ==========================================================

useEffect(() => {

  if (
    !gameStarted ||
    raceOver ||
    winner
  ) {
    return;
  }

  const checkCollision = () => {

    const player =
      playerCarRef.current;

    if (!player) {
      return;
    }

    const playerRect =
      player.getBoundingClientRect();

    // ========================================================
    // POWER UPS
    // ========================================================

    const powerUpElements =
      document.querySelectorAll(
        ".racing-power-up"
      );

    for (
      const powerUp
      of powerUpElements
    ) {

      const powerUpRect =
        powerUp.getBoundingClientRect();

      // ------------------------------------------------------
      // COLISIÓN
      // ------------------------------------------------------

      const collision =
        playerRect.left <
          powerUpRect.right &&
        playerRect.right >
          powerUpRect.left &&
        playerRect.top <
          powerUpRect.bottom &&
        playerRect.bottom >
          powerUpRect.top;

      if (!collision) {
        continue;
      }

      const powerUpId =
        powerUp.getAttribute(
          "data-power-up-id"
        );

      console.log(
        "⚡ POWER-UP RECOGIDO POR:",
        playerRole
      );

      // ------------------------------------------------------
      // ELIMINAR POWER-UP LOCALMENTE
      // ------------------------------------------------------

      setPowerUps(current => {

        const updated =
          current.filter(
            item =>
              item.id !== powerUpId
          );

        // ----------------------------------------------------
        // SINCRONIZAR ELIMINACIÓN
        //
        // Miku es quien mantiene la lista global de objetos.
        // ----------------------------------------------------

        if (
          isMultiplayer &&
          raceId &&
          playerRole === "miku"
        ) {

          supabase
            .from("races")
            .update({
              power_ups:
                updated
            })
            .eq(
              "id",
              raceId
            )
            .then(({ error }) => {

              if (error) {

                console.error(
                  "❌ Error eliminando Power-Up:",
                  error
                );

              }

            });

        }

        return updated;

      });

      // ======================================================
      // ACTIVAR / SUMAR TURBO
      // ======================================================

      const now =
        Date.now();

      const TURBO_DURATION =
        3000;

      const currentEnd =
        turboEndTimeRef.current &&
        turboEndTimeRef.current > now
          ? turboEndTimeRef.current
          : now;

      const newEnd =
        currentEnd +
        TURBO_DURATION;

      turboEndTimeRef.current =
        newEnd;

      setTurboActive(
        true
      );

      console.log(
        "⚡ TURBO ACTIVADO:",
        playerRole,
        "duración restante:",
        newEnd - now,
        "ms"
      );

      // ------------------------------------------------------
      // CANCELAR TIMER ANTERIOR
      // ------------------------------------------------------

      if (
        turboTimeoutRef.current
      ) {

        clearTimeout(
          turboTimeoutRef.current
        );

      }

      // ------------------------------------------------------
      // NUEVO TIMER
      // ------------------------------------------------------

      turboTimeoutRef.current =
        setTimeout(() => {

          setTurboActive(
            false
          );

          turboEndTimeRef.current =
            null;

          turboTimeoutRef.current =
            null;

          console.log(
            "⚡ TURBO TERMINADO:",
            playerRole
          );

        }, newEnd - now);

      // Solo podemos recoger un Power-Up
      // en esta comprobación.

      break;

    }

    // ========================================================
    // OBSTÁCULOS
    // ========================================================

    const obstacleElements =
      document.querySelectorAll(
        ".racing-obstacle"
      );

    for (
      const obstacle
      of obstacleElements
    ) {

      const obstacleRect =
        obstacle.getBoundingClientRect();

      // ------------------------------------------------------
      // COLISIÓN
      // ------------------------------------------------------

      const collision =
        playerRect.left <
          obstacleRect.right &&
        playerRect.right >
          obstacleRect.left &&
        playerRect.top <
          obstacleRect.bottom &&
        playerRect.bottom >
          obstacleRect.top;

      if (!collision) {
        continue;
      }

      // ======================================================
      // CHOQUE
      // ======================================================

      console.log(
        "💥 CHOQUE DE:",
        playerRole
      );

      const crashed =
        playerRole === "braian"
          ? "braian"
          : "miku";

      const winnerName =
        crashed === "miku"
          ? "braian"
          : "miku";

      // ------------------------------------------------------
      // EVITAR DOBLE PROCESAMIENTO
      // ------------------------------------------------------

      if (
        collisionHandledRef.current
      ) {
        return;
      }

      collisionHandledRef.current =
        true;

      // ------------------------------------------------------
      // ESTADO LOCAL
      // ------------------------------------------------------

      setCrashedPlayer(
        crashed
      );

      setCrashAnimation(
        true
      );

      setGameStarted(
        false
      );

      // ======================================================
      // MULTIPLAYER
      // ======================================================

      if (
        isMultiplayer &&
        raceId
      ) {

        supabase
          .from("races")
          .update({

            status:
              "finished",

            winner:
              winnerName

          })
          .eq(
            "id",
            raceId
          )
          .then(({ error }) => {

            if (error) {

              console.error(
                "❌ Error registrando choque:",
                error
              );

            } else {

              console.log(
                "🏆 Carrera finalizada por choque:",
                winnerName
              );

            }

          });

      }

      // ======================================================
      // PANTALLA DE CHOQUE
      // ======================================================

      setTimeout(() => {

        setCrashAnimation(
          false
        );

        setRaceOver(
          true
        );

      }, 900);

      break;

    }

  };

  // ==========================================================
  // COMPROBAR COLISIONES CADA 50ms
  // ==========================================================

  const interval =
    setInterval(
      checkCollision,
      50
    );

  return () => {

    clearInterval(
      interval
    );

  };

}, [
  gameStarted,
  raceOver,
  winner,
  playerRole,
  isMultiplayer,
  raceId
]);
  // ==========================================================
  // REINICIAR
  // ==========================================================

  const restartRace = async () => {

    resetLocalRace();

    // --------------------------------------------------------
    // MULTIPLAYER
    // --------------------------------------------------------

    if (
      isMultiplayer &&
      raceId
    ) {

      setWaitingForStart(true);
      setOpponentJoined(true);

      // Solamente Miku reinicia la carrera global.

      if (
        playerRole === "miku"
      ) {

        const { error } =
          await supabase
            .from("races")
            .update({

              status:
                "ready",

              countdown:
                null,

              winner:
                null,

              miku_position:
                25,

              braian_position:
                75,

              miku_progress:
                0,

              braian_progress:
                0,

              obstacles:
                [],

              power_ups:
                []

            })
            .eq(
              "id",
              raceId
            );

        if (error) {

          console.error(
            "❌ Error reiniciando:",
            error
          );
        }
      }

      return;
    }

    // --------------------------------------------------------
    // SINGLE PLAYER
    // --------------------------------------------------------

    setWaitingForStart(false);
  };

  // ==========================================================
  // VOLVER
  // ==========================================================

  const goBack = () => {

  if (typeof goTo === "function") {
    goTo("grandprix");
  }

};

  // ==========================================================
  // PANTALLA GANADOR
  // ==========================================================

  if (winner) {

    return (
      <main className="racing-game-page">

        <div className="racing-winner-screen">

          <div className="racing-winner-icon">
            🏆
          </div>

          <p className="eyebrow">
            GRAND PRIX
          </p>

          <h2>
            {winner === "miku"
              ? "¡Miku ganó!"
              : "¡Braian ganó!"}
          </h2>

          <p className="racing-winner-text">

            {winner === "miku" ? (
              <>
                Parece que hasta en las carreras
                <br />
                estamos destinados a terminar juntos. 🩵
              </>
            ) : (
              <>
                Bueno... esta vez te dejo ganar. 😌
                <br />
                Pero mi premio seguís siendo vos. ♡
              </>
            )}

          </p>

          <div className="racing-result">

            <span>
              🩵 Miku
            </span>

            <strong>
              {winner === "miku"
                ? "1 — 0"
                : "0 — 1"}
            </strong>

            <span>
              💙 Braian
            </span>

          </div>

          <button
            type="button"
            className="racing-start-button"
            onClick={restartRace}
          >
            Otra carrera
            <span>
              ↻
            </span>
          </button>

          <button
            type="button"
            className="racing-back-button"
            onClick={goBack}
          >
            Volver a nuestra historia
          </button>

        </div>

      </main>
    );
  }

  // ==========================================================
  // PANTALLA CHOQUE
  // ==========================================================

  if (raceOver) {

    return (
      <main className="racing-game-page">

        <div className="racing-game-over">

          <div className="racing-crash-icon">
            💥
          </div>

          <p className="eyebrow">
            GRAND PRIX
          </p>

          <h2>
            ¡Choque!
          </h2>

          <p className="racing-game-over-text">

            {crashedPlayer === "miku" ? (
              <>
                Miku se encontró con un obstáculo...
                <br />
                ¡Braian se lleva la victoria! 🏁
              </>
            ) : (
              <>
                Braian se encontró con un obstáculo...
                <br />
                ¡Miku se lleva la victoria! 🩵
              </>
            )}

          </p>

          <button
            type="button"
            className="racing-start-button"
            onClick={restartRace}
          >
            Intentar nuevamente
            <span>
              ↻
            </span>
          </button>

          <button
            type="button"
            className="racing-back-button"
            onClick={goBack}
          >
            Volver a nuestra historia
          </button>

        </div>

      </main>
    );
  }

  // ==========================================================
  // COUNTDOWN
  // ==========================================================

  if (
    countdown !== null
  ) {

    return (
      <main className="racing-game-page">

        <div
          className={`racing-countdown ${
            countdown === 0
              ? "racing-countdown-go"
              : ""
          }`}
        >

          <span>
            {countdown > 0
              ? countdown
              : "¡YA!"}
          </span>

        </div>

      </main>
    );
  }

  // ==========================================================
  // SALA MULTIPLAYER
  // ==========================================================

  if (
    isMultiplayer &&
    waitingForStart
  ) {

    return (
      <main className="racing-game-page">

        <div className="racing-start-screen">

          <p className="eyebrow">
            GRAND PRIX
          </p>

          <div className="racing-title-icon">
            🏎️
          </div>

          <h2>
            Sala de carrera
          </h2>

          {/* ==================================================
              MIKU
          ================================================== */}

          {playerRole === "miku" && (
            <>

              <p>
                Compartile este código a Braian:
              </p>

              <strong className="racing-code">
                {raceCode}
              </strong>

              <div className="racing-waiting">

                <p>
                  Estado de conexión
                </p>

                <span>
                  {connectionStatus === "SUBSCRIBED"
                    ? "🟢 Conectado"
                    : "🟡 Conectando..."}
                </span>

              </div>

              {opponentJoined ? (

                <div className="racing-opponent-ready">

                  <p>
                    💙 Braian se unió
                  </p>

                  <strong>
                    ¡Ya pueden correr! 🏁
                  </strong>

                </div>

              ) : (

                <div className="racing-waiting">

                  <p>
                    Esperando a Braian...
                  </p>

                  <span>
                    🩵 . . . 💙
                  </span>

                </div>
              )}

              <button
                type="button"
                className="racing-start-button"
                disabled={!opponentJoined}
                onClick={startMultiplayerRace}
              >
                {opponentJoined
                  ? "¡Comenzar carrera!"
                  : "Esperando a Braian..."}

                <span>
                  🏁
                </span>

              </button>

            </>
          )}

          {/* ==================================================
              BRAIAN
          ================================================== */}

          {playerRole === "braian" && (
            <>

              <p>
                Te uniste correctamente a la carrera.
              </p>

              <strong className="racing-code">
                {raceCode}
              </strong>

              <div className="racing-opponent-ready">

                <p>
                  💙 Braian está listo
                </p>

                <strong>
                  Esperando a Miku... 🩵
                </strong>

              </div>

              <div className="racing-waiting">

                <p>
                  Conexión
                </p>

                <span>
                  {connectionStatus === "SUBSCRIBED"
                    ? "🟢 Conectado a la carrera"
                    : "🟡 Conectando..."}
                </span>

              </div>

            </>
          )}

        </div>

      </main>
    );
  }

  // ==========================================================
  // PANTALLA INICIAL
  // ==========================================================

  if (!gameStarted) {

    return (
      <main className="racing-game-page">

        <div className="racing-start-screen">

          <p className="eyebrow">
            GRAND PRIX
          </p>

          <div className="racing-title-icon">
            🏎️
          </div>

          <h2>
            ¿Listos para la carrera?
          </h2>

          <p className="racing-intro">

            Miku 🩵 vs Braian 💙

            <br />

            Solo uno puede cruzar primero la meta...

          </p>

          {/* ==================================================
              CARRERA INDIVIDUAL
          ================================================== */}

          <button
            type="button"
            className="racing-start-button"
            onClick={() => {

              setIsMultiplayer(false);
              setPlayerRole(null);

              setRaceId(null);
              setRaceCode("");

              setOpponentJoined(false);
              setWaitingForStart(false);

              setWinner(null);
              setRaceOver(false);

              setGameStarted(false);

              setPlayerPosition(25);
              setOpponentPosition(75);

              setRaceProgress(0);
              setOpponentProgress(0);

              setObstacles([]);
              setPowerUps([]);

              setTurboActive(false);

              setCrashAnimation(false);
              setCrashedPlayer(null);
              setOpponentCrashed(false);

              collisionHandledRef.current =
                false;

              setCountdown(3);

            }}
          >
            Comenzar carrera
            <span>
              →
            </span>
          </button>

          {/* ==================================================
              CREAR MULTIPLAYER
          ================================================== */}

          <button
            type="button"
            className="racing-start-button"
            onClick={createRace}
          >
            Crear carrera para dos
            <span>
              👥
            </span>
          </button>


          {/* ==================================================
              UNIRSE
          ================================================== */}

          <div className="racing-join-box">

            <p className="eyebrow">
              UNIRSE A UNA CARRERA
            </p>

            <input
              type="text"
              value={joinCode}
              onChange={(event) => {

                setJoinCode(
                  event.target.value
                    .toUpperCase()
                );

              }}
              placeholder="MIKU123"
              maxLength={7}
              className="racing-code-input"
            />

            <button
              type="button"
              className="racing-start-button"
              onClick={joinRace}
            >
              Unirme a la carrera
              <span>
                💙
              </span>
            </button>
<button
  type="button"
  className="racing-reasons-button"
  onClick={() => goTo("reasons")}
>
  💌 54 razones
  <span>→</span>
</button>
          </div>

        </div>

      </main>
    );
  }

  // ==========================================================
  // CARRERA
  // ==========================================================

  return (
    <main className="racing-game-page">

      <div className="racing-track-screen">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="racing-header">

          <span>
            GRAND PRIX
          </span>

          <span>
            🏁
          </span>

        </div>

        {/* ==================================================
            PROGRESO
        ================================================== */}

        <div className="racing-progress-container">

          <div className="racing-progress-info">

            <span>
              🩵 Miku
            </span>

            <span>
              {playerRole === "miku"
                ? Math.floor(raceProgress)
                : Math.floor(opponentProgress)}
              %
            </span>

          </div>

          <div className="racing-progress-bar">

            <div
              className="racing-progress-fill"
              style={{
                width:
                  `${
                    playerRole === "miku"
                      ? raceProgress
                      : opponentProgress
                  }%`
              }}
            />

          </div>

          <div className="racing-progress-info">

            <span>
              💙 Braian
            </span>

            <span>
              {playerRole === "braian"
                ? Math.floor(raceProgress)
                : Math.floor(opponentProgress)}
              %
            </span>

          </div>

          <div className="racing-progress-bar">

            <div
              className="
                racing-progress-fill
                racing-progress-braian
              "
              style={{
                width:
                  `${
                    playerRole === "braian"
                      ? raceProgress
                      : opponentProgress
                  }%`
              }}
            />

          </div>

        </div>

        {/* ==================================================
            PISTA
        ================================================== */}

        <div className="racing-track">

          <div
            className={`racing-road ${
              gameStarted
                ? "racing-road-moving"
                : ""
            }`}
          >

            {/* ------------------------------------------------
                LÍNEAS
            ------------------------------------------------ */}

            <div
              className="
                racing-lane-line
                racing-lane-line-one
              "
            />

            <div
              className="
                racing-lane-line
                racing-lane-line-two
              "
            />

            {/* ------------------------------------------------
                VELOCIDAD
            ------------------------------------------------ */}

            {gameStarted && (

              <div className="racing-speed-lines">

                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />

              </div>
            )}

            {/* ------------------------------------------------
                META
            ------------------------------------------------ */}

            <div className="racing-finish-line">
              🏁
            </div>

            {/* ------------------------------------------------
                OBSTÁCULOS
            ------------------------------------------------ */}

            {obstacles.map(
              obstacle => (

                <div
                  key={obstacle.id}
                  className="racing-obstacle"
                  style={{
                    left:
                      `${obstacle.left}%`,

                    top:
                      `${obstacle.top ?? -10}%`
                  }}
                >
                  🚧
                </div>
              )
            )}

            {/* ------------------------------------------------
                POWER UPS
            ------------------------------------------------ */}

            {powerUps.map(
              powerUp => (

                <div
                  key={powerUp.id}
                  data-power-up-id={
                    powerUp.id
                  }
                  className="racing-power-up"
                  style={{
                    left:
                      `${powerUp.left}%`,

                    top:
                      `${powerUp.top ?? -10}%`
                  }}
                >
                  ⚡
                </div>
              )
            )}

            {/* =================================================
                AUTO DEL JUGADOR
            ================================================= */}

            <div
              ref={playerCarRef}
              className={`
                racing-car

                ${
                  playerRole === "braian"
                    ? "racing-car-braian"
                    : "racing-car-miku"
                }

                ${
                  gameStarted
                    ? "racing-car-speeding"
                    : ""
                }

                ${
                  crashAnimation
                    ? "racing-car-crashing"
                    : ""
                }
              `}
              style={{
                left:
                  `${playerPosition}%`,
                top:
                  "82%"
              }}
            >

              <span className="racing-car-name">
                {playerRole === "braian"
                  ? "Braian 💙"
                  : "Miku 🩵"}
              </span>

              <span className="racing-car-emoji">
                🏎️
              </span>

              {turboActive && (

                <span className="racing-turbo-effect">
                  ⚡
                </span>
              )}

            </div>

            {/* =================================================
                AUTO OPONENTE
            ================================================= */}

            <div
              className={`
                racing-car

                ${
                  playerRole === "braian"
                    ? "racing-car-miku"
                    : "racing-car-braian"
                }

                ${
                  gameStarted
                    ? "racing-car-speeding"
                    : ""
                }

                ${
                  opponentCrashed
                    ? "racing-car-crashing"
                    : ""
                }
              `}
              style={{
                left:
                  `${opponentPosition}%`,
                top:
                  "82%"
              }}
            >

              <span className="racing-car-name">
                {playerRole === "braian"
                  ? "Miku 🩵"
                  : "Braian 💙"}
              </span>

              <span className="racing-car-emoji">
                🏎️
              </span>

            </div>

          </div>

        </div>

        {/* ==================================================
            CHOQUE
        ================================================== */}

        {crashAnimation && (

          <div className="racing-crash-effect">
            💥
          </div>
        )}

        {/* ==================================================
            CONTROLES CELULAR
        ================================================== */}

        <div className="racing-controls">

          <button
            type="button"
            className="racing-control-button"
            onClick={() =>
              movePlayer("left")
            }
            aria-label="Mover a la izquierda"
          >
            ←
          </button>

          <button
            type="button"
            className="racing-control-button"
            onClick={() =>
              movePlayer("right")
            }
            aria-label="Mover a la derecha"
          >
            →
          </button>

        </div>

      </div>

    </main>
  );
}// ============================================================
// 54 RAZONES
// ============================================================

const ReasonsScreen = ({ goTo }) => {

  const reasons = [
    "Porque con vos puedo ser completamente yo.",
    "Porque tu tranquilidad logra calmar mi intensidad.",
    "Porque me gusta cómo me mirás.",
    "Porque tu forma de querer es tranquila, pero profunda.",
    "Porque sos mi lugar seguro.",
    "Porque puedo confiar en vos.",
    "Porque amo nuestras conversaciones.",
    "Porque amo nuestras pavadas.",
    "Porque me hacés reír.",
    "Porque me encanta molestarte.",
    "Porque también me encanta cuando vos me molestás.",
    "Porque amo tu lado introvertido.",
    "Porque amo escucharte hablar de las cosas que te apasionan.",
    "Porque amo nuestros recuerdos.",
    "Porque amo nuestras escapadas.",
    "Porque me gusta descubrir lugares nuevos con vos.",
    "Porque amo nuestras fotos.",
    "Porque amo abrazarte.",
    "Porque amo estar cerca tuyo aunque no hagamos nada.",
    "Porque con vos aprendí que el amor también puede sentirse tranquilo.",
    "Porque me aceptás incluso en mis días difíciles.",
    "Porque conocés mis lados más intensos y aun así elegís quedarte.",
    "Porque soportás mis momentos de hablar demasiado.",
    "Porque amo cómo nos complementamos.",
    "Porque siento que tenemos nuestro propio mundo.",
    "Porque amo llamarte Pipi.",
    "Porque me hacés sentir especial.",
    "Porque me importa tu felicidad.",
    "Porque me importan tus sueños.",
    "Porque quiero estar para vos cuando las cosas no salen bien.",
    "Porque sos parte de mis recuerdos favoritos.",
    "Porque amo la historia que estamos construyendo.",
    "Porque amo quién soy cuando estoy con vos.",
    "Porque me gusta imaginar un futuro donde estés vos.",
    "Porque me gusta tenerte en mis planes.",
    "Porque sos una de las primeras personas a las que quiero contarle las cosas.",
    "Porque quiero compartir mis buenas noticias con vos.",
    "Porque tu presencia puede cambiar completamente mi día.",
    "Porque amo sentir que somos un equipo.",
    "Porque quiero conocer todas tus versiones.",
    "Porque quiero seguir creando recuerdos juntos.",
    "Porque me hacés sonreír incluso sin intentarlo.",
    "Porque puedo reírme de cualquier pavada con vos.",
    "Porque tenemos recuerdos que nadie más podría entender de la misma manera.",
    "Porque sos mi persona favorita para compartir momentos.",
    "Porque quiero seguir creciendo a tu lado.",
    "Porque quiero seguir aprendiendo de vos.",
    "Porque quiero seguir descubriéndote.",
    "Porque me gusta pensar en todo lo que todavía nos falta vivir.",
    "Porque volvería a elegir aquel primer encuentro.",
    "Porque volvería a darte aquel primer beso.",
    "Porque volvería a decirte \"te amo\".",
    "Porque volvería a elegir cada uno de nuestros momentos.",
    "Porque sos vos."
  ];

  const [currentReason, setCurrentReason] = useState(-1);

const [reasonAnimating, setReasonAnimating] = useState(false);
const [showFinalReason, setShowFinalReason] = useState(false);

const startReasons = () => {
  setCurrentReason(0);
};


  const started = currentReason >= 0;

  const nextReason = () => {

  if (
    currentReason >= reasons.length - 1 ||
    reasonAnimating
  ) {
    return;
  }

  setReasonAnimating(true);

  setTimeout(() => {

    setCurrentReason(currentReason + 1);

    setTimeout(() => {
      setReasonAnimating(false);
    }, 50);

  }, 350);

};if (showFinalReason) {

  return (
    <main className="reasons-page reasons-final-page">

      <div className="reasons-final-content">
        <div className="reasons-final-sparkles">
  <span>✦</span>
  <span>✧</span>
  <span>♡</span>
  <span>✦</span>
  <span>·</span>
  <span>✧</span>
  <span>♡</span>
  <span>✦</span>
</div>

<div className="reasons-final-glow" />

        <div className="reasons-final-number">
          54
        </div>

        <p className="reasons-final-label">
          RAZÓN 54
        </p>

        <div className="reasons-final-text">

          <p className="final-line final-line-one">
            Porque,
          </p>

          <p className="final-line final-line-two">
            entre todas las razones que podría escribir,
            <br />
            hay una que las resume todas:
          </p>

          <p className="final-line final-line-three">
            Porque
          </p>

          <p className="final-line final-line-four">
            sos vos. ♡
          </p>
          <div className="reasons-final-actions">

  <button
    type="button"
    className="reasons-scratch-button"
    onClick={() => goTo("scratch")}
  >
    Tengo algo más para vos...
    <span>✦</span>
  </button>

  <button
    type="button"
    className="reasons-restart-button"
    onClick={() => {
      setShowFinalReason(false);
      setCurrentReason(-1);
    }}
  >
    ↻ Volver a empezar
  </button>

  <button
    type="button"
    className="reasons-back-button"
    onClick={() => goTo("grandprix")}
  >
    ← Volver a Grand Prix
  </button>

</div>

        </div>

      </div>

    </main>
  );

}
  if (!started) {

  return (
    <main className="reasons-page">

      <div className="reasons-intro">

        <p className="eyebrow">
          PARA VOS ♡
        </p>

        <h2>
          54 razones
        </h2>

        <p className="reasons-intro-text">
          Las razones por las que te elegiría
          una y otra vez.
        </p>

        <button
          type="button"
          className="reasons-start-button"
          onClick={startReasons}
        >
          Comenzar ♡
        </button>

        {/* ACCESO AL RASPA */}

        <button
          type="button"
          className="reasons-scratch-button"
          onClick={() => goTo("scratch")}
        >
          Tengo un recuerdo para vos...
          <span>✦</span>
        </button>

        <button
          type="button"
          className="reasons-back-button"
          onClick={() => goTo("grandprix")}
        >
          ← Volver a Grand Prix
        </button>

      </div>

    </main>
  );

}

  return (
    <main className="reasons-page">

      <div
  className={`reasons-content ${
    reasonAnimating
      ? "reasons-changing"
      : ""
  }`}
>

        <div className="reasons-number">

          <span>
            {String(currentReason + 1).padStart(2, "0")}
          </span>

        </div>

        <p className="reasons-progress">
          RAZÓN {String(currentReason + 1).padStart(2, "0")} / 54
        </p>

        <div className="reasons-progress-bar">

  <div
    className="reasons-progress-fill"
    style={{
      width: `${((currentReason + 1) / reasons.length) * 100}%`
    }}
  />

</div>

        <article className="reasons-card">

          <div className="reasons-card-symbol">
            ✦
          </div>

          <p>
            {reasons[currentReason]}
          </p>

          <div className="reasons-card-heart">
            ♡
          </div>

        </article>

        {currentReason < reasons.length - 1 ? (

          <button
            type="button"
            className="reasons-next-button"
            onClick={nextReason}
          >
            Otra razón
            <span>→</span>
          </button>

        ) : (

          <button
            type="button"
            className="reasons-next-button"
            onClick={() => {
  setShowFinalReason(true);
}}
          >
            Continuar
            <span>→</span>
          </button>

        )}

      </div>

    </main>
  );

};// ============================================================
// RASPA Y DESCUBRE
// ============================================================

const ScratchScreen = ({ goTo }) => {

  const [revealed, setRevealed] = useState(false);
  const sparkleParticles = [
  { symbol: "✦", className: "sparkle-1" },
  { symbol: "✧", className: "sparkle-2" },
  { symbol: "♡", className: "sparkle-3" },
  { symbol: "·", className: "sparkle-4" },
  { symbol: "✦", className: "sparkle-5" },
  { symbol: "✧", className: "sparkle-6" },
  { symbol: "♡", className: "sparkle-7" },
  { symbol: "·", className: "sparkle-8" }
];

  const canvasRef = useRef(null);
  const isScratchingRef = useRef(false);

  // ============================================================
  // PREPARAR CANVAS
  // ============================================================

  useEffect(() => {

    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d", {
  willReadFrequently: true
});

    const resizeCanvas = () => {

      const rect = canvas.getBoundingClientRect();

      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );

      // ==========================================================
// SUPERFICIE DEL RASPA
// ==========================================================

ctx.globalCompositeOperation = "source-over";

// Fondo degradado
const gradient = ctx.createLinearGradient(
  0,
  0,
  rect.width,
  rect.height
);

gradient.addColorStop(
  0,
  "#d9e9f2"
);

gradient.addColorStop(
  0.5,
  "#c7dce8"
);

gradient.addColorStop(
  1,
  "#b7d0df"
);

ctx.fillStyle = gradient;

ctx.fillRect(
  0,
  0,
  rect.width,
  rect.height
);

// ==========================================================
// BRILLITOS SUTILES
// ==========================================================

const sparkles = [
  [0.12, 0.18],
  [0.82, 0.15],
  [0.22, 0.78],
  [0.88, 0.75],
  [0.72, 0.38],
  [0.15, 0.55]
];

sparkles.forEach(([x, y], index) => {

  ctx.fillStyle =
    index % 2 === 0
      ? "rgba(255,255,255,0.55)"
      : "rgba(255,255,255,0.35)";

  ctx.font =
    index % 2 === 0
      ? "18px serif"
      : "13px serif";

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(
    index % 2 === 0 ? "✦" : "✧",
    rect.width * x,
    rect.height * y
  );

});

// ==========================================================
// TEXTO CENTRAL
// ==========================================================

ctx.fillStyle = "rgba(255,255,255,0.95)";

ctx.font =
  "600 17px 'Cormorant Garamond', Georgia, serif";

ctx.textAlign = "center";
ctx.textBaseline = "middle";

ctx.fillText(
  "RASPÁ PARA DESCUBRIR",
  rect.width / 2,
  rect.height / 2 - 10
);

ctx.font =
  "24px serif";

ctx.fillText(
  "♡",
  rect.width / 2,
  rect.height / 2 + 22
);

    };

    resizeCanvas();

    window.addEventListener(
      "resize",
      resizeCanvas
    );

    return () => {

      window.removeEventListener(
        "resize",
        resizeCanvas
      );

    };

  }, []);

 // ============================================================
// SISTEMA DE RASPADO
// ============================================================

useEffect(() => {

  const canvas = canvasRef.current;

  if (!canvas || revealed) return;

  const ctx = canvas.getContext("2d", {
  willReadFrequently: true
});

  const getPosition = (event) => {

    const rect = canvas.getBoundingClientRect();

    if (
      event.touches &&
      event.touches.length > 0
    ) {

      return {
        x:
          event.touches[0].clientX -
          rect.left,

        y:
          event.touches[0].clientY -
          rect.top
      };

    }

    return {
      x:
        event.clientX -
        rect.left,

      y:
        event.clientY -
        rect.top
    };

  };

  // ==========================================================
  // CALCULAR CUÁNTO SE RASPÓ
  // ==========================================================

  const checkScratchProgress = () => {

    const rect = canvas.getBoundingClientRect();

    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);

    if (!width || !height) return;

    const imageData = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

    let transparentPixels = 0;

    // Revisamos algunos píxeles para no hacerlo pesado
    const step = 12;

    for (
      let y = 0;
      y < canvas.height;
      y += step
    ) {

      for (
        let x = 0;
        x < canvas.width;
        x += step
      ) {

        const index =
          (y * canvas.width + x) * 4;

        const alpha =
          imageData.data[index + 3];

        if (alpha < 50) {
          transparentPixels++;
        }

      }

    }

    const totalPixels =
      Math.ceil(canvas.width / step) *
      Math.ceil(canvas.height / step);

    const progress =
      transparentPixels / totalPixels;

    // ========================================================
    // 60% DESCUBIERTO → REVELAR TODO
    // ========================================================

    if (progress >= 0.60) {

      setRevealed(true);

    }

  };

  // ==========================================================
  // BORRAR
  // ==========================================================

  const erase = (event) => {

    if (!isScratchingRef.current) {
      return;
    }

    event.preventDefault();

    const { x, y } =
      getPosition(event);

    ctx.globalCompositeOperation =
      "destination-out";

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      28,
      0,
      Math.PI * 2
    );

    ctx.fill();

    checkScratchProgress();

  };

  // ==========================================================
  // COMENZAR A RASPAR
  // ==========================================================

  const startScratch = (event) => {

    event.preventDefault();

    isScratchingRef.current = true;

    erase(event);

  };

  // ==========================================================
  // TERMINAR RASPADO
  // ==========================================================

  const stopScratch = () => {

    isScratchingRef.current = false;

  };

  // ==========================================================
  // MOUSE
  // ==========================================================

  canvas.addEventListener(
    "mousedown",
    startScratch
  );

  canvas.addEventListener(
    "mousemove",
    erase
  );

  window.addEventListener(
    "mouseup",
    stopScratch
  );

  // ==========================================================
  // CELULAR
  // ==========================================================

  canvas.addEventListener(
    "touchstart",
    startScratch,
    { passive: false }
  );

  canvas.addEventListener(
    "touchmove",
    erase,
    { passive: false }
  );

  window.addEventListener(
    "touchend",
    stopScratch
  );

  // ==========================================================
  // LIMPIEZA
  // ==========================================================

  return () => {

    canvas.removeEventListener(
      "mousedown",
      startScratch
    );

    canvas.removeEventListener(
      "mousemove",
      erase
    );

    window.removeEventListener(
      "mouseup",
      stopScratch
    );

    canvas.removeEventListener(
      "touchstart",
      startScratch
    );

    canvas.removeEventListener(
      "touchmove",
      erase
    );

    window.removeEventListener(
      "touchend",
      stopScratch
    );

  };

}, [revealed]);
  // ============================================================
  // PANTALLA
  // ============================================================

  return (

    <main className="scratch-page">

      <div className="scratch-content">

        <p className="scratch-eyebrow">
          UN PEQUEÑO RECUERDO ♡
        </p>

        <h2 className="scratch-title">
          Tengo un recuerdo escondido para vos...
        </h2>

        <p className="scratch-subtitle">
          Hay algo acá que quiero que descubras.
        </p>

        {/* =====================================================
            TARJETA
        ===================================================== */}

      <div
  className="scratch-card"
  style={{
    width: "500px",
    maxWidth: "90vw",
    height: "500px",
    margin: "30px auto",
    background: "#eeeeee",
    position: "relative",
    overflow: "visible"
  }}
>
  {revealed && (
  <div className="scratch-sparkles">

    {sparkleParticles.map((particle, index) => (
      <span
        key={index}
        className={`scratch-sparkle ${particle.className}`}
      >
        {particle.symbol}
      </span>
    ))}

  </div>
)}

  {/* FOTO ESCONDIDA */}

  <img
    src="/recuerdos/mi-complice.png"
    alt="Nuestro recuerdo"
    style={{
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block"
    }}
  />

  {/* CAPA PARA RASPAR */}

  {!revealed && (
    
  <canvas
  ref={canvasRef}
  className={`scratch-canvas ${
    revealed
      ? "scratch-canvas-revealed"
      : ""
  }`}
  style={{
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    cursor: revealed
      ? "default"
      : "grab",
    touchAction: "none",
    opacity: revealed ? 0 : 1,
    transition: "opacity 0.8s ease",
    pointerEvents: revealed
      ? "none"
      : "auto"
  }}
/>
  )}

</div>
        {/* INDICACIÓN */}

        {!revealed && (

          <p className="scratch-hint">
            ✦ Deslizá sobre la tarjeta ✦
          </p>

        )}

        {/* =====================================================
            MENSAJE DESPUÉS DE DESCUBRIR
        ===================================================== */}

      {revealed && (

  <div
    className="scratch-reveal-message"
    style={{
      animation:
        "scratchRevealMessage 1.2s ease forwards"
    }}
  >

            <p className="scratch-now">
              Ahora sí...
            </p>

            <h3>
              Mi cómplice. ♡
            </h3>

            <p>
              Me hace feliz saber que tengo a alguien que
              no me mira raro ni me deja sola cuando algo
              me emociona.
            </p>

            <p>
              Alguien que entiende que, aunque algunas de
              mis locuras quizás no sean lo suyo, puede
              compartirlas conmigo.
            </p>

            <p>
              Porque cuando me acompañás en las cosas que
              me hacen feliz, mi emoción se multiplica. ♡
            </p>

            <p className="scratch-boina-message">
              Y aunque probablemente sigas pensando que
              esa boina no te quedaba bien...
            </p>

            <p className="scratch-boina-final">
              Para mí te quedaba perfecta.
            </p>

            <p className="scratch-final-line">
              Porque estabas ahí conmigo. ♡
            </p>

            <p className="scratch-complice">
              Gracias por ser mi cómplice en todas mis locuras.
            </p>

            <button
              type="button"
              className="scratch-continue-button"
              onClick={() => goTo("wheel")}
            >
              Continuar
              <span>→</span>
            </button>

          </div>

        )}

        {/* =====================================================
            VOLVER
        ===================================================== */}

        <button
          type="button"
          className="scratch-back-button"
          onClick={() => goTo("reasons")}
        >
          ← Volver a 54 Razones
        </button>

      </div>

    </main>

  );

};// ============================================================
// RUEDA DE PREMIOS
// ============================================================

const wheelPrizes = [
  "Compartir una cena juntos",
  "Una sesión de fotos para el recuerdo",
  "Una noche de películas juntos",
  "Una merienda solo para nosotros",
  "Una carta escrita especialmente para vos",
  "Una tarde de mimos y abrazos",
  "Una cena de hamburguesas",
  "Una cita sorpresa",
  "Un regalito porque sí",
  "Una nueva aventura juntos",
  "Un día entero dedicado a vos",
  "Ser el amor de mi vida"
];

const WheelScreen = ({ goTo }) => {

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showGrandPrize, setShowGrandPrize] = useState(false);

  const segmentAngle = 360 / wheelPrizes.length;

  const spinWheel = () => {

    if (spinning) return;

  let winnerIndex;

const grandPrizeIndex = wheelPrizes.length - 1;

// 20% de probabilidad de Premio Mayor
if (Math.random() < 0.20) {

  winnerIndex = grandPrizeIndex;

} else {

  // 80% de probabilidad de premio normal
  winnerIndex = Math.floor(
    Math.random() * (wheelPrizes.length - 1)
  );

}

    const extraSpins = 6 + Math.floor(Math.random() * 3);

    const targetAngle =
      extraSpins * 360 +
      (360 - winnerIndex * segmentAngle - segmentAngle / 2);

    setSpinning(true);

    setRotation(prev => prev + targetAngle);

    setTimeout(() => {

      const selectedPrize = wheelPrizes[winnerIndex];

      setWinner(selectedPrize);
      setSpinning(false);

      if (
        selectedPrize === "Ser el amor de mi vida"
      ) {

        setTimeout(() => {
          setShowGrandPrize(true);
        }, 500);

      } else {

        setTimeout(() => {
          setShowResult(true);
        }, 500);

      }

    }, 5200);

  };


  const closeResult = () => {
    setShowResult(false);
    setWinner(null);
  };


  const closeGrandPrize = () => {
    setShowGrandPrize(false);
    setWinner(null);
  };


  return (

    <main className="wheel-page">

      <div className="wheel-background-glow wheel-glow-one" />
      <div className="wheel-background-glow wheel-glow-two" />

      <div className="wheel-content">

        <p className="wheel-eyebrow">
          UN PEQUEÑO PREMIO PARA VOS ♡
        </p>

        <h1 className="wheel-title">
          Una rueda para vos 🎡
        </h1>

        <p className="wheel-subtitle">
          Porque ser mi novio tiene algunos beneficios...
        </p>


        {/* =====================================================
            RUEDA
        ===================================================== */}

        <div className="wheel-wrapper">

          <div className="wheel-pointer">
            ♥
          </div>

          <div
            className="wheel"
            style={{
              transform: `rotate(${rotation}deg)`
            }}
          >

            {wheelPrizes.map((prize, index) => {

              const angle =
                index * segmentAngle;

              return (

                <div
                  key={index}
                  className="wheel-segment"
                  style={{
                    transform:
                      `rotate(${angle}deg) skewY(-60deg)`
                  }}
                >

                  <div
                    className="wheel-segment-content"
                    style={{
                      transform:
                        `skewY(60deg) rotate(${segmentAngle / 2}deg)`
                    }}
                  >

                    <span>
                      {index === 11 ? "♾️" : "♡"}
                    </span>

                  </div>

                </div>

              );

            })}

            <div className="wheel-center">

              <span>
                ♡
              </span>

            </div>

          </div>

        </div>


        {/* =====================================================
            BOTÓN GIRAR
        ===================================================== */}

        <button
          type="button"
          className={`wheel-spin-button ${
            spinning ? "is-spinning" : ""
          }`}
          onClick={spinWheel}
          disabled={spinning}
        >

          {spinning
            ? "La rueda está decidiendo... ✨"
            : "GIRAR LA RUEDA 🎡"
          }

        </button>


        {!spinning && !winner && (

          <p className="wheel-hint">
            Nunca sabés qué premio puede tocarte...
          </p>

        )}


        {/* =====================================================
            VOLVER
        ===================================================== */}

        <button
          type="button"
          className="wheel-back-button"
          onClick={() => goTo("grandPrix")}
        >
          ← Volver a Grand Prix
        </button>
<button
  type="button"
  className="wheel-next-button"
  onClick={() => goTo("beforeAfter")}
>
  Antes de vos... después de vos ♡
  <span>→</span>
</button>
      </div>


      {/* =======================================================
          MODAL RESULTADO NORMAL
      ======================================================= */}

      {showResult && winner && (

        <div
          className="wheel-modal-overlay"
          onClick={closeResult}
        >

          <div
            className="wheel-result-modal"
            onClick={event => event.stopPropagation()}
          >

            <div className="wheel-result-sparkles">
              ✦　♡　✦
            </div>

            <p className="wheel-result-eyebrow">
              LA RUEDA DECIDIÓ...
            </p>

            <h2>
              🎉 ¡Ganaste!
            </h2>

            <div className="wheel-prize-card">

              <span className="wheel-prize-icon">
                🎁
              </span>

              <p>
                {winner}
              </p>

            </div>

            <p className="wheel-result-text">
              Parece que hoy el universo
              decidió darte un pequeño regalo. ♡
            </p>

            <button
              type="button"
              className="wheel-modal-button"
              onClick={closeResult}
            >
              Me gusta mi premio ♡
            </button>

          </div>

        </div>

      )}


      {/* =======================================================
          PREMIO MAYOR
      ======================================================= */}

      {showGrandPrize && winner && (

        <div className="wheel-grand-overlay">

          <div className="wheel-confetti">

            <span>♡</span>
            <span>✦</span>
            <span>♥</span>
            <span>✧</span>
            <span>♡</span>
            <span>★</span>
            <span>♥</span>
            <span>✦</span>
            <span>♡</span>
            <span>✧</span>

          </div>

          <div className="wheel-grand-modal">

            <div className="grand-crown">
              👑
            </div>

            <p className="grand-eyebrow">
              🏆 PREMIO MAYOR
            </p>

            <h2>
              Ser el amor de mi vida.
            </h2>

            <div className="grand-divider">
              ✦ ♡ ✦
            </div>

            <p className="grand-text">
              Premio válido para siempre
            </p>

            <p className="grand-joke">
              o no? xd. ♾️
            </p>

            <p className="grand-final">
              Este premio no se puede devolver,
              cambiar ni cancelar. ♡
            </p>

            <button
              type="button"
              className="grand-close-button"
              onClick={closeGrandPrize}
            >
              Acepto mi destino ♡
            </button>

          </div>

        </div>

      )}

    </main>

  );

};// ============================================================
// ANTES DE VOS / DESPUÉS DE VOS
// ============================================================

const BeforeAfterScreen = ({ goTo }) => {

  const [phase, setPhase] = useState("before");

  const handleContinue = () => {

    if (phase === "before") {
      setPhase("transition");

      setTimeout(() => {
        setPhase("after");
      }, 1800);

      return;
    }

    if (phase === "after") {
      setPhase("final");
    }

  };

  return (

    <main className={`before-after-page phase-${phase}`}>

      <div className="before-after-glow before-after-glow-one" />
      <div className="before-after-glow before-after-glow-two" />

      <div className="before-after-content">

        {/* ====================================================
            ANTES
        ==================================================== */}

        {phase === "before" && (

          <section className="before-after-section before-section">

            <p className="before-after-eyebrow">
              UNA PEQUEÑA HISTORIA ♡
            </p>

            <h1 className="before-after-title">
              Antes de vos...
            </h1>

            <div className="before-after-line">
              <span />
              <i>♡</i>
              <span />
            </div>

            <p className="before-after-text">
              Había muchas cosas que todavía
              no sabía que me faltaban.
            </p>

            <div className="before-after-thoughts">

              <span>
                Días normales.
              </span>

              <span>
                Planes improvisados.
              </span>

              <span>
                Momentos que todavía no sabía
                con quién quería compartir.
              </span>

            </div>

            <button
              type="button"
              className="before-after-button"
              onClick={handleContinue}
            >
              Y entonces apareciste vos
              <span>→</span>
            </button>

          </section>

        )}

        {/* ====================================================
            TRANSICIÓN
        ==================================================== */}

        {phase === "transition" && (

          <section className="before-after-transition">

            <div className="transition-heart">
              ♡
            </div>

            <p>
              Y entonces...
            </p>

          </section>

        )}

        {/* ====================================================
            DESPUÉS
        ==================================================== */}

        {phase === "after" && (

          <section className="before-after-section after-section">

            <p className="before-after-eyebrow">
              DESDE QUE LLEGASTE ♡
            </p>

            <h1 className="before-after-title">
              Después de vos...
            </h1>

            <div className="before-after-line">
              <span />
              <i>✦</i>
              <span />
            </div>

            <div className="after-messages">

              <p>
                Encontré a alguien con quien
                compartir mis locuras.
              </p>

              <p>
                Alguien que hace especiales
                los días normales.
              </p>

              <p>
                Alguien que terminó convirtiéndose
                en mi lugar favorito.
              </p>

              <p>
                Y alguien con quien quiero
                seguir acumulando recuerdos.
              </p>

            </div>

            <button
              type="button"
              className="before-after-button"
              onClick={handleContinue}
            >
              Hay algo más que quiero decirte
              <span>→</span>
            </button>

          </section>

        )}

        {/* ====================================================
            FINAL
        ==================================================== */}

        {phase === "final" && (

          <section className="before-after-final">

            <div className="final-stars">
              ✦　♡　✦
            </div>

            <p className="final-small">
              Y si tuviera que resumirlo todo...
            </p>

            <h2>
              No cambiaste mi vida.
            </h2>

            <h3>
              La hiciste mucho más linda. ♡
            </h3>

            <div className="final-divider">
              ─── ♡ ───
            </div>

            <p className="final-dedication">
              Para vos, Pipi.
            </p>

            <p className="final-note">
              Y para todos los recuerdos que
              todavía nos quedan por vivir.
            </p>

            <button
              type="button"
              className="before-after-button final-button"
              onClick={() => goTo("finalQuestion")}
            >
              Continuar
              <span>→</span>
            </button>

          </section>

        )}

      </div>

    </main>

  );

};// ============================================================
// ÚLTIMO MENSAJE — PREGUNTA FINAL
// ============================================================

const FinalQuestionScreen = ({ goTo }) => {

  const [stage, setStage] = useState("question");

  const [noPosition, setNoPosition] = useState({
    top: "58%",
    left: "58%"
  });

  const [noAttempts, setNoAttempts] = useState(0);

  const moveNoButton = () => {

    const positions = [
      { top: "62%", left: "22%" },
      { top: "42%", left: "72%" },
      { top: "72%", left: "68%" },
      { top: "35%", left: "30%" },
      { top: "70%", left: "38%" },
      { top: "48%", left: "78%" },
      { top: "76%", left: "20%" }
    ];

    const newPosition =
      positions[noAttempts % positions.length];

    setNoPosition(newPosition);

    setNoAttempts(prev => prev + 1);
  };


  const chooseYes = () => {

    setStage("transition");

    setTimeout(() => {
      setStage("letter");
    }, 2200);

  };


  return (

    <main className={`final-page final-stage-${stage}`}>

      {/* ======================================================
          FONDO
          ====================================================== */}

      <div className="final-background-glow final-glow-one" />
      <div className="final-background-glow final-glow-two" />

      {/* ======================================================
          PREGUNTA
          ====================================================== */}

      {stage === "question" && (

        <section className="final-question-section">

          <p className="final-eyebrow">
            Y AHORA, UNA ÚLTIMA PREGUNTA ♡
          </p>

          <h1 className="final-question-title">
            Después de este detalle
            <br />
            improvisado y único...
          </h1>

          <p className="final-question-subtitle">
            Me imagino que me amás.
            <br />
            ¿No? 👀
          </p>


          {/* ==================================================
              PERRITO
              ================================================== */}

          <div className="final-dog-container">

            <div className="final-dog-glow" />

            <div className="final-dog">

              <div className="dog-ear dog-ear-left" />
              <div className="dog-ear dog-ear-right" />

              <div className="dog-head">

                <div className="dog-eye dog-eye-left">
                  <span />
                </div>

                <div className="dog-eye dog-eye-right">
                  <span />
                </div>

                <div className="dog-muzzle">

                  <div className="dog-nose" />

                  <div className="dog-mouth">
                    ♡
                  </div>

                </div>

              </div>

              <div className="dog-body">

                <div className="dog-paw dog-paw-left" />
                <div className="dog-paw dog-paw-right" />

              </div>

            </div>

          </div>


          <p className="final-dog-text">
            Contestá con sinceridad... 🐶
          </p>


          {/* ==================================================
              BOTONES
              ================================================== */}

          <div className="final-buttons">

            <button
              type="button"
              className="final-yes-button"
              onClick={chooseYes}
            >
              Sí ♡
            </button>

            <button
              type="button"
              className="final-no-button"
              onMouseEnter={moveNoButton}
              onTouchStart={moveNoButton}
              onClick={moveNoButton}
              style={{
                top: noPosition.top,
                left: noPosition.left
              }}
            >
              No
            </button>

          </div>

        </section>

      )}


      {/* ======================================================
          TRANSICIÓN
          ====================================================== */}

      {stage === "transition" && (

        <section className="final-transition">

          <div className="final-transition-hearts">
            ♡
          </div>

          <p>
            Sabía que ibas a decir que sí...
          </p>

          <span>
            ✦
          </span>

        </section>

      )}


      {/* ======================================================
          CARTA
          ====================================================== */}

      {stage === "letter" && (

        <section className="final-letter-section">

          <div className="final-letter-decoration">
            ✦ ♡ ✦
          </div>

          <p className="final-letter-eyebrow">
            Y AHORA, UN ÚLTIMO MENSAJE
          </p>

          <article className="final-letter">

            <h1>
              Amor:
            </h1>

            <p>
              Hay tantas cosas que quiero decirte que a veces siento que un “te amo” se queda demasiado pequeño para todo lo que siento por vos.
            </p>

            <p>
              Te amo por quien sos, por cómo me hacés sentir, por cada momento que compartimos y también por todos esos pequeños detalles que quizás vos ni siquiera imaginás que guardo en mi corazón.
            </p>

            <p>
              Y si hay algo que tengo cada vez más claro, es que cuando pienso en mi futuro, inevitablemente aparecés vos.
            </p>

            <p>
              Me gusta imaginar una vida a tu lado.
            </p>

            <p>
              Imaginar nuestros viajes, conocer lugares nuevos, perdernos en alguna ciudad que nunca vimos, sacar fotos, reírnos por cualquier tontería, probar comidas nuevas, tener aventuras que algún día podamos recordar diciendo <em>“¿te acordás de cuando hicimos esto?”</em>.
            </p>

            <p>
              Me imagino nuestras experiencias, nuestros proyectos, nuestras metas y todos esos sueños que todavía ni siquiera sabemos que vamos a tener.
            </p>

            <p>
              Pero también sé que no quiero apurar nada.
            </p>

            <p>
              No quiero correr para llegar a un futuro que todavía tiene que construirse. Quiero disfrutar cada etapa con vos. Quiero que cada cosa llegue cuando tenga que llegar, a su tiempo, de la manera en que tenga que suceder.
            </p>

            <p>
              Porque creo que las cosas más lindas no necesitan ser forzadas.
            </p>

            <p>
              Quiero que primero vivamos, que nos conozcamos cada día un poquito más, que aprendamos el uno del otro, que crezcamos juntos y que construyamos algo tan fuerte que, cuando llegue cada nuevo capítulo, podamos mirarnos y decir: <em>“sí, esto es exactamente donde quiero estar”</em>.
            </p>

            <p>
              Y ojalá algún día lleguen todos esos momentos que imagino.
            </p>

            <p>
              Ojalá algún día podamos mirar atrás y darnos cuenta de que todas esas pequeñas cosas que soñábamos terminaron convirtiéndose en nuestra vida.
            </p>

            <p>
              Ojalá algún día estemos comprometidos no solamente con un anillo o una promesa, sino con algo mucho más importante: <strong>con nosotros</strong>.
            </p>

            <p>
              Con elegirnos incluso cuando las cosas no sean fáciles.
            </p>

            <p>
              Con no rendirnos a la primera dificultad.
            </p>

            <p>
              Con recordar por qué empezamos cuando atravesemos momentos difíciles.
            </p>

            <p>
              Porque no quiero estar solamente para tus días buenos.
            </p>

            <p>
              Quiero estar también para esos días en los que sientas que no podés más.
            </p>

            <p>
              Quiero que, si algún día estás perdido y no sabés qué hacer, recuerdes que no tenés que encontrar todas las respuestas solo.
            </p>

            <p>
              Si alguna vez sentís que no podés avanzar, quiero ser esa persona que se siente a tu lado y te diga:
            </p>

            <blockquote>
              “Está bien. No tenés que poder con todo hoy. Descansá. Yo estoy acá.”
            </blockquote>

            <p>
              Y si alguna vez caés, quiero darte la mano.
            </p>

            <p>
              Si alguna vez te falta fuerza, quiero prestarte un poquito de la mía.
            </p>

            <p>
              Si alguna vez sentís que no podés seguir, quiero ayudarte a levantarte.
            </p>

            <p>
              No para caminar por vos, porque sé que cada uno tiene que hacer su propio camino, sino para caminar <strong>a tu lado</strong>.
            </p>

            <p>
              Para que sepas que no estás solo.
            </p>

            <p>
              Quiero ser tu compañera.
            </p>

            <p>
              La persona que celebre tus logros como si fueran propios, que te abrace cuando algo salga mal, que te recuerde todo lo que sos capaz de hacer cuando vos mismo lo olvides.
            </p>

            <p>
              Quiero alentarte en tus sueños, incluso en aquellos que todavía te dan miedo.
            </p>

            <p>
              Quiero verte crecer, cumplir tus metas, convertirte en todo eso que soñás ser.
            </p>

            <p>
              Y quiero que cuando logres algo importante, puedas buscarme entre todas las personas y encontrarme ahí, mirándote con orgullo, pensando:
            </p>

            <blockquote>
              “Yo sabía que podía hacerlo.”
            </blockquote>

            <p>
              Pero también quiero que sepas algo.
            </p>

            <p>
              No espero que seas perfecto.
            </p>

            <p>
              No espero que nunca tengas miedo, que nunca te equivoques o que siempre sepas qué hacer.
            </p>

            <p>
              Quiero al verdadero vos.
            </p>

            <p>
              Al vos que se ríe, que se enoja, que tiene días malos, que tiene dudas, que sueña, que se equivoca y que vuelve a intentarlo.
            </p>

            <p>
              Quiero acompañarte en todo eso.
            </p>

            <p>
              Y espero que vos también quieras conocer todas mis versiones.
            </p>

            <p>
              La que está feliz, la que tiene miedo, la que se equivoca, la que necesita un abrazo, la que tiene sueños enormes y también la que algunos días simplemente necesita que le digan <em>“vení, estoy acá”</em>.
            </p>

            <p>
              Porque amar para mí no es solamente decir “te amo” cuando todo está bien.
            </p>

            <p>
              Es elegirnos cuando la vida se pone difícil.
            </p>

            <p>
              Es aprender a escucharnos.
            </p>

            <p>
              Es pedir perdón.
            </p>

            <p>
              Es aprender.
            </p>

            <p>
              Es tener paciencia.
            </p>

            <p>
              Es crecer.
            </p>

            <p>
              Es entender que vamos a cambiar con los años, pero que podemos seguir encontrándonos una y otra vez en cada nueva versión del otro.
            </p>

            <p>
              Y si algún día tenemos una vida juntos, quiero que esté llena de recuerdos.
            </p>

            <p>
              De viajes improvisados.
            </p>

            <p>
              De noches hablando hasta tarde.
            </p>

            <p>
              De desayunos juntos.
            </p>

            <p>
              De fotos que nos den vergüenza años después.
            </p>

            <p>
              De cumpleaños.
            </p>

            <p>
              De celebraciones.
            </p>

            <p>
              De días tranquilos.
            </p>

            <p>
              De proyectos.
            </p>

            <p>
              De metas cumplidas.
            </p>

            <p>
              De alguna que otra discusión por una tontería.
            </p>

            <p>
              De abrazos después de un día difícil.
            </p>

            <p>
              De risas que no podamos explicar.
            </p>

            <p>
              Y de muchas historias que algún día podamos contar diciendo:
            </p>

            <blockquote>
              “Mirá todo lo que vivimos juntos.”
            </blockquote>

            <p>
              No sé exactamente qué nos espera.
            </p>

            <p>
              No sé dónde vamos a estar dentro de cinco, diez o veinte años.
            </p>

            <p>
              No sé cuáles serán nuestros planes, qué sueños vamos a cambiar en el camino o qué cosas inesperadas nos va a traer la vida.
            </p>

            <p>
              Pero hay algo que sí sé.
            </p>

            <p className="final-letter-emphasis">
              Quiero descubrirlo con vos.
            </p>

            <p>
              No necesito tener todo planeado.
            </p>

            <p>
              No necesito saber exactamente cuándo va a llegar cada cosa.
            </p>

            <p>
              Solo quiero que, mientras la vida nos vaya llevando, sigamos encontrándonos el uno al otro.
            </p>

            <p>
              Y si algún día tenemos que elegir entre rendirnos o intentar una vez más, espero que nos acordemos de todo lo que sentimos hoy.
            </p>

            <p>
              De todo lo que construimos.
            </p>

            <p>
              De todas las veces que nos elegimos.
            </p>

            <blockquote>
              “No llegamos hasta acá para soltarnos ahora.”
            </blockquote>

            <p>
              Porque yo no quiero un amor que solamente exista en los momentos fáciles.
            </p>

            <p>
              Quiero un amor que tenga raíces.
            </p>

            <p>
              Uno que pueda atravesar tormentas y seguir creciendo.
            </p>

            <p>
              Uno que no tenga miedo de hablar de los sueños, pero que tampoco tenga miedo de construirlos poquito a poquito.
            </p>

            <p>
              Y sobre todo, quiero que nunca dudes de una cosa:
            </p>

            <p className="final-letter-love">
              Te amo.
            </p>

            <p>
              Te amo muchísimo más de lo que muchas veces sé explicar.
            </p>

            <p>
              Y si alguna vez llegás a sentir que no sos suficiente, quiero que mires todo lo que sos desde mis ojos.
            </p>

            <p>
              Quiero que recuerdes que hay alguien que te admira, que cree en vos, que está orgullosa de vos y que te elegiría una y otra vez.
            </p>

            <p>
              Y si alguna vez la vida te hace sentir que estás solo, acordate de mí.
            </p>

            <p>
              Acordate de que en algún lugar existe una persona que te ama profundamente y que, mientras pueda, va a querer caminar a tu lado.
            </p>

            <p>
              No sé cuándo llegarán nuestros viajes.
            </p>

            <p>
              No sé cuándo llegarán nuestros grandes sueños.
            </p>

            <p>
              No sé cuándo llegarán todas esas cosas que alguna vez imaginamos.
            </p>

            <p>
              Pero no tengo apuro.
            </p>

            <p>
              Quiero que lleguen cuando tengan que llegar.
            </p>

            <p>
              Porque quiero disfrutarlas sabiendo que cada una fue construida entre los dos.
            </p>

            <p>
              Y quizás algún día, después de muchos años, estemos sentados juntos mirando hacia atrás y entendamos que todas esas cosas que alguna vez soñamos no llegaron de golpe.
            </p>

            <p>
              Llegaron poquito a poquito.
            </p>

            <p>
              Un día a la vez.
            </p>

            <p>
              Un abrazo a la vez.
            </p>

            <p>
              Una decisión a la vez.
            </p>

            <p>
              Un “te elijo” a la vez.
            </p>

            <p>
              Y ahí quiero estar.
            </p>

            <p className="final-letter-emphasis">
              Al lado tuyo.
            </p>

            <p>
              Porque si pudiera pedirle algo a la vida, no sería una vida perfecta.
            </p>

            <p>
              Sería una vida en la que, incluso cuando las cosas se pongan difíciles, podamos seguir encontrando motivos para quedarnos.
            </p>

            <p>
              Una vida llena de historias.
            </p>

            <p>
              De aprendizajes.
            </p>

            <p>
              De aventuras.
            </p>

            <p>
              De amor.
            </p>

            <p>
              Y de nosotros.
            </p>

            <p>
              Así que, mi amor, si alguna vez dudás de cuánto te amo, volvé a estas palabras.
            </p>

            <p>
              Y recordá que no te prometo que todo siempre será fácil.
            </p>

            <p>
              Te prometo algo mucho más real:
            </p>

            <blockquote>
              <strong>
                mientras los dos queramos seguir construyendo, yo voy a estar dispuesta a intentarlo con vos.
              </strong>
            </blockquote>

            <p>
              A caminar.
            </p>

            <p>
              A aprender.
            </p>

            <p>
              A crecer.
            </p>

            <p>
              A reír.
            </p>

            <p>
              A llorar.
            </p>

            <p>
              A soñar.
            </p>

            <p>
              A levantarte cuando te caigas y dejar que vos me levantes cuando sea yo la que no pueda más.
            </p>

            <p>
              Porque no quiero solamente compartir momentos con vos.
            </p>

            <p className="final-letter-emphasis">
              Quiero compartir la vida.
            </p>

            <p>
              Sin apurarla.
            </p>

            <p>
              Sin exigirle que nos muestre el final.
            </p>

            <p>
              Dejando que cada cosa llegue cuando tenga que llegar.
            </p>

            <p>
              Pero caminando siempre hacia adelante.
            </p>

            <p className="final-letter-together">
              Juntos.
            </p>

            <p className="final-letter-signature">
              Te amo, Pipi.
            </p>

            <p>
              Y ojalá la vida nos regale muchísimos años para descubrir todo lo que todavía nos falta vivir.
            </p>

            <p>
              Porque si algo tengo claro...
            </p>

            <p className="final-letter-last">
              de todas las historias que podría vivir, quiero que la nuestra sea una de las que nunca deje de elegir. 🤍
            </p>

          </article>


          {/* ==================================================
              CIERRE
              ================================================== */}

          <div className="final-ending">

            <div className="final-ending-line">
              ✦ ♡ ✦
            </div>

            <p>
              Fin de este pequeño detalle.
            </p>

            <strong>
              Pero no de nuestra historia. ♡
            </strong>

          </div>
<button
  type="button"
  className="final-home-button"
  onClick={() => goTo("home")}
>
  <span>⌂</span>
  Volver al inicio
</button>
        </section>

      )}

    </main>

  );

};
  // ===================================================
  // RENDER
  // ===================================================

  const renderScreen = () => {
  switch (screen) {

    case "home":
      return <HomeScreen />;

    case "mailbox":
      return <MailboxScreen />;

    case "envelope":
      return <EnvelopeScreen />;

    case "letter":
      return <LetterScreen />;

    case "counter":
      return <CounterScreen />;

    case "compatibility":
      return <CompatibilityScreen />;

    case "memories":
      return <MemoriesScreen />;

    case "grandprix":
  return <RacingGameScreen goTo={goTo} />;

      case "reasons":
  return <ReasonsScreen goTo={goTo} />;
  case "scratch":
  return <ScratchScreen goTo={goTo} />;

  case "wheel":
  return <WheelScreen goTo={goTo} />;

  case "beforeAfter":
  return <BeforeAfterScreen goTo={goTo} />;

  case "finalQuestion":
  return <FinalQuestionScreen goTo={goTo} />;

    default:
      return <HomeScreen />;
  }
};

  // ===================================================
  // APP FINAL
  // ===================================================

  return (

    <div className="app">

      <div className="screen-container">
        {renderScreen()}
      </div>

      <MusicPlayer
        currentSong={currentSong}
        setCurrentSong={setCurrentSong}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        musicOpen={musicOpen}
        setMusicOpen={setMusicOpen}
      />

    </div>

  );
}

export default App;