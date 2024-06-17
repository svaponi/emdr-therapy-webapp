const translations = {
    en: {
        label: 'English',
        colors: 'Colors',
        dimension: 'Size',
        speed: 'Speed',
        time: 'Timer',
        start: 'Start',
        stop: 'Stop'
    },
    de: {
        label: 'Deutsch',
        colors: 'Farben',
        dimension: 'Größe',
        speed: 'Geschwindigkeit',
        time: 'Timer',
        start: 'Start',
        stop: 'Halt'
    },
    fr: {
        label: 'Français',
        colors: 'Couleurs',
        dimension: 'Taille',
        speed: 'Vélocité',
        time: 'Minuteur',
        start: 'Démarrer',
        stop: 'Arrêtez'
    },
    it: {
        label: 'Italiano',
        colors: 'Colori',
        dimension: 'Dimensione',
        speed: 'Velocità',
        time: 'Timer',
        start: 'Avvio',
        stop: 'Stop'
    },
    es: {
        label: 'Español',
        colors: 'Colores',
        dimension: 'Dimensión',
        speed: 'Velocidad',
        time: 'Temporizador',
        start: 'Inicia',
        stop: 'Para'
    }
}
document.addEventListener("DOMContentLoaded", () => {
    paper.setup('canvas');

    const speedProps = {
        step: 2,
        min: 2,
        max: 100
    }
    const radiusProps = {
        step: 5,
        min: 10,
        max: 300
    }
    const timeProps = {
        defaultOn: 30,
        defaultOff: 0,
        step: 5,
        min: 5,
        max: 300
    }

    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const speed = document.getElementById('speed');
    const radius = document.getElementById('radius');
    const time = document.getElementById('time');
    const timeSwitch = document.getElementById('time-switch');
    const color = document.getElementById('color');
    const bgColor = document.getElementById('bg-color');
    const beepSound = document.getElementById('beep-sound');
    const lang = document.getElementById('lang');
    const canvas = document.getElementById('canvas');
    const controls = document.getElementById('controls-container');

    // Initialize state
    startBtn.classList.remove("hidden");
    stopBtn.classList.add("hidden");

    speed.setAttribute('step', speedProps.step);
    speed.setAttribute('max', speedProps.max);
    speed.setAttribute('min', speedProps.min);

    radius.setAttribute('step', radiusProps.step);
    radius.setAttribute('max', radiusProps.max);
    radius.setAttribute('min', radiusProps.min);

    time.setAttribute('step', timeProps.step);
    time.setAttribute('max', timeProps.max);
    time.setAttribute('min', timeProps.min);

    let conf = null;
    let ball = null;
    let bg = null;

    const handler = {
        set: (obj, prop, value, receiver) => {
            if (obj[prop] === value) return
            obj[prop] = value;
            console.log(`handler.set`, obj, prop, value);
            if (prop === 'time') {
                time.value = value;
            } else if (prop === 'timeEnabled') {
                timeSwitch.checked = value;
                if (value) {
                    time.disabled = false;
                    conf.time = timeProps.defaultOn;
                } else {
                    time.disabled = true;
                    conf.time = timeProps.defaultOff;
                }
            } else if (prop === 'radius') {
                radius.value = value;
                redrawBall()
            } else if (prop === 'speed') {
                speed.value = value;
            } else if (prop === 'color') {
                color.value = value;
                if (ball) ball.fillColor = value;
            } else if (prop === 'bgColor') {
                bgColor.value = value;
                if (bg) bg.fillColor = value;
            } else if (prop === 'lang') {
                lang.value = value;
                setLang()
            }
            return true;
        }
    }

    conf = new Proxy({}, handler);
    conf.color = '#d43f3a'
    conf.bgColor = '#1f1f1f'
    conf.radius = 50
    conf.speed = 20
    conf.time = 0
    conf.timeEnabled = true
    conf.directionX = 1
    conf.lang = 'en'

    function setLang() {
        const t = translations[conf.lang];
        startBtn.innerText = t.start;
        stopBtn.innerText = t.stop;
        speed.labels[0].innerText = t.speed;
        radius.labels[0].innerText = t.dimension;
        color.labels[0].innerText = t.colors;
        time.labels[0].innerText = t.time;
    }

    function getStartPosition() {
        return [conf.radius, paper.view.bounds.height / 2]
    }

    function redrawBall() {
        let [x, y] = getStartPosition()
        if (ball) {
            y = Math.min(Math.max(ball.position.y, conf.radius), paper.view.bounds.height - conf.radius)
            x = Math.min(Math.max(ball.position.x, conf.radius), paper.view.bounds.width - conf.radius)
            ball.remove();
        }
        ball = new paper.Path.Circle({
            center: [x, y],
            radius: conf.radius,
            fillColor: conf.color
        });
    }

    redrawBall()

    function redrawBg() {
        if (bg) bg.remove();
        const {width, height} = document.fullscreenElement ? document.body : paper.view.bounds;
        // console.log(`redrawBg`, width, height, paper.view.bounds);
        bg = new paper.Path.Rectangle({
            point: [0, 0],
            size: [width, height],
            fillColor: conf.bgColor,
        });
        bg.sendToBack();
    }

    redrawBg()

    const moveBall = () => {
        if (conf.directionX > 0 && ball.position.x + conf.radius >= paper.view.bounds.width || conf.directionX < 0 && ball.position.x - conf.radius <= 0) {
            conf.directionX *= -1;
            beepSound.play();
        }
        const deltaX = Math.round(paper.view.bounds.width - 2 * conf.radius)
        ball.position.x += conf.directionX * conf.speed * deltaX / 1000;
    };

    const startAnimation = () => {
        if (!conf.animation) {
            conf.animation = paper.view.onFrame = (event) => moveBall();
        }
        if (conf.timeEnabled) {
            conf.time = timeProps.defaultOn;
        }
        startBtn.classList.add("hidden");
        stopBtn.classList.remove("hidden");
    };

    const pauseAnimation = () => {
        paper.view.onFrame = null;
        conf.animation = null;
        startBtn.classList.remove("hidden");
        stopBtn.classList.add("hidden");
    };

    const stopAnimation = () => {
        paper.view.onFrame = null;
        conf.animation = null;
        ball.position = getStartPosition();
        paper.view.update();
        startBtn.classList.remove("hidden");
        stopBtn.classList.add("hidden");
    };

    const toggleAnimation = () => {
        if (conf.animation) {
            pauseAnimation()
        } else {
            startAnimation()
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            canvas.requestFullscreen().then(redrawBg).catch(err => {
                alert(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
            })
        } else {
            document.exitFullscreen().then(redrawBg)
        }
    };

    startBtn.addEventListener('click', startAnimation);
    stopBtn.addEventListener('click', stopAnimation);

    speed.addEventListener('input', (event) => {
        conf.speed = parseInt(event.target.value, 10);
    });

    radius.addEventListener('input', (event) => {
        conf.radius = parseInt(event.target.value, 10);
    });

    color.addEventListener('input', (event) => {
        conf.color = event.target.value;
    });

    bgColor.addEventListener('input', (event) => {
        conf.bgColor = event.target.value;
    });

    time.addEventListener('input', (event) => {
        conf.time = parseInt(event.target.value, 10);
    });

    timeSwitch.addEventListener('change', (event) => {
        conf.timeEnabled = event.target.checked
    });

    lang.addEventListener('change', (event) => {
        conf.lang = event.target.value
    });

    canvas.addEventListener('click', (event) => {
        toggleAnimation()
    });

    document.addEventListener('keydown', (event) => {
        console.log(event.code);
        if (event.code === 'Space') {
            toggleFullscreen();
        } else if (event.code === 'Enter' || event.code === 'NumpadEnter') {
            toggleFullscreen();
        }
    });

    paper.view.onResize = () => {
        ball.position = [ball.position.x, paper.view.bounds.height / 2]
        redrawBg()
    };

    setInterval(() => {
        if (conf.animation && conf.timeEnabled) {
            if (conf.time > 0) {
                conf.time -= 1
            } else {
                stopAnimation()
            }
        }
    }, 1000)
});
