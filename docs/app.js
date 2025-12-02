const translations = {
  en: {
    label: "English",
    colors: "Colors",
    dimension: "Size",
    speed: "Speed",
    time: "Timer",
    start: "Start",
    stop: "Stop",
    mode: "Animation Mode",
    colorChanging: "Color Changing",
  },
  de: {
    label: "Deutsch",
    colors: "Farben",
    dimension: "Größe",
    speed: "Geschwindigkeit",
    time: "Timer",
    start: "Start",
    stop: "Halt",
    mode: "Animationsmodus",
    colorChanging: "Farbwechsel",
  },
  fr: {
    label: "Français",
    colors: "Couleurs",
    dimension: "Taille",
    speed: "Vélocité",
    time: "Minuteur",
    start: "Démarrer",
    stop: "Arrêtez",
    mode: "Mode Animation",
    colorChanging: "Changement de couleur",
  },
  it: {
    label: "Italiano",
    colors: "Colori",
    dimension: "Dimensione",
    speed: "Velocità",
    time: "Timer",
    start: "Avvio",
    stop: "Stop",
    mode: "Modalità animazione",
    colorChanging: "Cambio colore",
  },
  es: {
    label: "Español",
    colors: "Colores",
    dimension: "Dimensión",
    speed: "Velocidad",
    time: "Temporizador",
    start: "Inicia",
    stop: "Para",
    mode: "Modo Animación",
    colorChanging: "Cambio de color",
  },
};

document.addEventListener("DOMContentLoaded", () => {
  paper.setup("canvas");

  const speedProps = { step: 2, min: 2, max: 100 };
  const radiusProps = { step: 5, min: 10, max: 300 };
  const timeProps = { defaultOn: 30, defaultOff: 0, step: 5, min: 5, max: 300 };

  const startBtn = document.getElementById("start-btn");
  const stopBtn = document.getElementById("stop-btn");
  const speed = document.getElementById("speed");
  const radius = document.getElementById("radius");
  const time = document.getElementById("time");
  const timeSwitch = document.getElementById("time-switch");
  const color = document.getElementById("color");
  const bgColor = document.getElementById("bg-color");
  const beepSound = document.getElementById("beep-sound");
  const lang = document.getElementById("lang");
  const aniMode = document.getElementById("animation-mode");
  const colorChanging = document.getElementById("color-changing");
  const canvas = document.getElementById("canvas");
  let audioCtx = null;
  let beepBuffer = null;
  let audioInitialized = false;
  let audioUnlocked = false;
  
  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    
    beepSound.volume = 0.01;
    beepSound.play().then(() => {
      beepSound.pause();
      beepSound.currentTime = 0;
      beepSound.volume = 1.0;
      initStereo();
    }).catch(() => {
      initStereo();
    });
  }
  
  function initStereo() {
    if (audioInitialized) return;
    
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      
      const keepAliveGain = audioCtx.createGain();
      keepAliveGain.gain.value = 0.00001;
      keepAliveGain.connect(audioCtx.destination);
      
      const keepAliveOsc = audioCtx.createOscillator();
      keepAliveOsc.frequency.value = 1;
      keepAliveOsc.connect(keepAliveGain);
      keepAliveOsc.start(0);
      
      fetch("beep.mp3")
        .then(r => r.arrayBuffer())
        .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
        .then(decoded => {
          beepBuffer = decoded;
          audioInitialized = true;
        })
        .catch(() => {
          fetch("beep.wav")
            .then(r => r.arrayBuffer())
            .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
            .then(decoded => {
              beepBuffer = decoded;
              audioInitialized = true;
            })
            .catch(() => {});
        });
    } catch (e) {
      audioInitialized = false;
    }
  }
  
  let beepSide = 1;
  function beepStereo() {
    if (!audioUnlocked) {
      unlockAudio();
      setTimeout(() => beepStereo(), 200);
      return;
    }
    
    if (audioInitialized && beepBuffer) {
      playWithStereo();
    } else {
      beepSound.currentTime = 0;
      beepSound.play().catch(() => {});
    }
    
    function playWithStereo() {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
          playBeep();
        });
        return;
      }
      playBeep();
      
      function playBeep() {
        beepSide *= -1;
        
        const source = audioCtx.createBufferSource();
        source.buffer = beepBuffer;
        
        const panner = audioCtx.createStereoPanner();
        panner.pan.value = beepSide;
        
        source.connect(panner);
        panner.connect(audioCtx.destination);
        
        source.start(0);
      }
    }
  }
  
  speed.setAttribute("step", speedProps.step);
  speed.setAttribute("max", speedProps.max);
  speed.setAttribute("min", speedProps.min);
  radius.setAttribute("step", radiusProps.step);
  radius.setAttribute("max", radiusProps.max);
  radius.setAttribute("min", radiusProps.min);
  time.setAttribute("step", timeProps.step);
  time.setAttribute("max", timeProps.max);
  time.setAttribute("min", timeProps.min);

  let conf = null;
  let ball = null;
  let bg = null;

  const handler = {
    set: (obj, prop, value) => {
      obj[prop] = value;
      if (prop === "color" && ball) ball.fillColor = value;
      if (prop === "bgColor" && bg) bg.fillColor = value;
      if (prop === "radius") radius.value = value;
      if (prop === "speed") speed.value = value;
      if (prop === "time") time.value = value;
      if (prop === "timeEnabled") {
        timeSwitch.checked = !!value;
        time.disabled = !value;
        if (value && (!conf.time || conf.time === 0))
          conf.time = timeProps.defaultOn;
        if (!value) conf.time = timeProps.defaultOff;
      }
      if (prop === "lang") setLang();
      if (prop === "animationMode") aniMode.value = value;
      return true;
    },
  };

  conf = new Proxy({}, handler);

  conf.color = "#5ac4af";
  conf.bgColor = "#1f1f1f";
  conf.radius = 50;
  conf.speed = 20;
  conf.time = timeProps.defaultOn;
  conf.timeEnabled = true;
  conf.directionX = 1;
  conf.directionY = 1;
  conf.animationMode = "horizontal";
  conf.colorChanging = false;
  conf.angle = 0;
  conf.lang = "en";
  conf._roundExtreme = null;
  conf.targetX = null;
  conf.driftPerBounce = 30;

  function setLang() {
    const t = translations[conf.lang];
    document.querySelector("label[for='speed']").innerText = t.speed;
    document.querySelector("label[for='radius']").innerText = t.dimension;
    document.querySelector("label[for='color']").innerText = t.colors;
    document.querySelector("label[for='time']").innerText = t.time;
    document.querySelector("label[for='animation-mode']").innerText = t.mode;
    document.querySelector("label[for='color-changing']").innerText =
      t.colorChanging;
    startBtn.innerText = t.start;
    stopBtn.innerText = t.stop;
  }

  function getStartPosition() {
    return [conf.radius, paper.view.bounds.height / 2];
  }

  function redrawBall() {
    let [x, y] = getStartPosition();
    if (ball) {
      y = Math.min(
        Math.max(ball.position.y, conf.radius),
        paper.view.bounds.height - conf.radius
      );
      x = Math.min(
        Math.max(ball.position.x, conf.radius),
        paper.view.bounds.width - conf.radius
      );
      ball.remove();
    }
    ball = new paper.Path.Circle({
      center: [x, y],
      radius: conf.radius,
      fillColor: conf.color,
    });
    conf.targetX = ball.position.x;
  }

  function redrawBg() {
    if (bg) bg.remove();
    bg = new paper.Path.Rectangle({
      point: [0, 0],
      size: [paper.view.bounds.width, paper.view.bounds.height],
      fillColor: conf.bgColor,
    });
    bg.sendToBack();
  }

  redrawBg();
  redrawBall();

  function moveBallHorizontal() {
    if (
      (conf.directionX > 0 &&
        ball.position.x + conf.radius >= paper.view.bounds.width) ||
      (conf.directionX < 0 && ball.position.x - conf.radius <= 0)
    ) {
      conf.directionX *= -1;
      beepStereo();
    }
    const deltaX = Math.round(paper.view.bounds.width - 2 * conf.radius);
    ball.position.x += (conf.directionX * conf.speed * deltaX) / 1000;
  }

  function moveBallVertical() {
    if (
      ball.position.x + conf.radius >= paper.view.bounds.width - 2 ||
      ball.position.x - conf.radius <= 2
    ) {
      conf.directionX *= -1;
    }

    if (
      ball.position.y + conf.radius >= paper.view.bounds.height ||
      ball.position.y - conf.radius <= 0
    ) {
      conf.directionY *= -1;
      beepStereo();

      conf.targetX += conf.driftPerBounce * conf.directionX;
    }

    const dy = paper.view.bounds.height - 2 * conf.radius;
    ball.position.y += (conf.directionY * conf.speed * dy) / 1000;

    conf.targetX = Math.max(
      conf.radius,
      Math.min(conf.targetX, paper.view.bounds.width - conf.radius)
    );

    const lerpFactor = 0.2;
    ball.position.x += (conf.targetX - ball.position.x) * lerpFactor;
  }

  function moveBallRound() {
    const cx = paper.view.bounds.width / 2;
    const cy = paper.view.bounds.height / 2;

    conf.angle += conf.speed / 200;

    const r = Math.max(10, Math.min(cx, cy) - conf.radius - 10);

    const prevY = ball.position.y;

    ball.position.x = cx + Math.cos(conf.angle) * r;
    ball.position.y = cy + Math.sin(conf.angle) * r;

    const crossed =
      (prevY < cy && ball.position.y >= cy) ||
      (prevY > cy && ball.position.y <= cy);

    if (crossed) {
      beepStereo();
    }
  }

  function updateColor() {
    if (!conf.colorChanging) return;
    const hue = (performance.now() / 10) % 360;
    ball.fillColor = `hsl(${hue},100%,50%)`;
  }

  function startAnimation() {
    if (!conf.animation) {
      conf.animation = paper.view.onFrame = () => {
        if (conf.animationMode === "horizontal") moveBallHorizontal();
        else if (conf.animationMode === "vertical") moveBallVertical();
        else if (conf.animationMode === "round") moveBallRound();
        updateColor();
      };
    }
    startBtn.classList.add("hidden");
    stopBtn.classList.remove("hidden");
  }

  function stopAnimation() {
    paper.view.onFrame = null;
    conf.animation = null;
    ball.position = getStartPosition();
    conf.targetX = ball.position.x;
    if (conf.timeEnabled) {
      conf.time = timeProps.defaultOn;
    }
    startBtn.classList.remove("hidden");
    stopBtn.classList.add("hidden");
  }

  startBtn.addEventListener("click", () => {
    unlockAudio();
    startAnimation();
  });

  stopBtn.addEventListener("click", stopAnimation);

  speed.addEventListener("input", (e) => {
    conf.speed = +e.target.value;
  });
  radius.addEventListener("input", (e) => {
    conf.radius = +e.target.value;
    redrawBall();
  });
  color.addEventListener("input", (e) => {
    conf.color = e.target.value;
  });
  bgColor.addEventListener("input", (e) => {
    conf.bgColor = e.target.value;
    redrawBg();
  });
  time.addEventListener("input", (e) => {
    conf.time = +e.target.value;
  });
  timeSwitch.addEventListener("change", (e) => {
    conf.timeEnabled = e.target.checked;
  });
  lang.addEventListener("change", (e) => {
    conf.lang = e.target.value;
  });
  aniMode.addEventListener("change", (e) => {
    conf.animationMode = e.target.value;
  });
  colorChanging.addEventListener("change", (e) => {
    conf.colorChanging = e.target.checked;
  });

  canvas.addEventListener("click", () => {
    unlockAudio();
    if (conf.animation) stopAnimation();
    else startAnimation();
  });

  paper.view.onResize = () => {
    ball.position = [
      Math.min(
        Math.max(ball.position.x, conf.radius),
        paper.view.bounds.width - conf.radius
      ),
      paper.view.bounds.height / 2,
    ];
    conf.targetX = Math.min(
      Math.max(conf.targetX || ball.position.x, conf.radius),
      paper.view.bounds.width - conf.radius
    );
    redrawBg();
  };

  setInterval(() => {
    if (conf.animation && conf.timeEnabled) {
      if (conf.time > 0) {
        conf.time -= 1;
      } else {
        stopAnimation();
      }
    }
  }, 1000);
});
