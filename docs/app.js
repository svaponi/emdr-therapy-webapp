const translations = {
    en: {
        label: 'English',
        colors: 'Colors',
        dimension: 'Size',
        speed: 'Speed',
        time: 'Timer',
        start: 'Start',
        stop: 'Stop',
        shape: 'Shape'
    },
    de: {
        label: 'Deutsch',
        colors: 'Farben',
        dimension: 'Größe',
        speed: 'Geschwindigkeit',
        time: 'Timer',
        start: 'Start',
        stop: 'Halt',
        shape: 'Form'
    },
    fr: {
        label: 'Français',
        colors: 'Couleurs',
        dimension: 'Taille',
        speed: 'Vélocité',
        time: 'Minuteur',
        start: 'Démarrer',
        stop: 'Arrêtez',
        shape: 'Forme'
    },
    it: {
        label: 'Italiano',
        colors: 'Colori',
        dimension: 'Dimensione',
        speed: 'Velocità',
        time: 'Timer',
        start: 'Avvio',
        stop: 'Stop',
        shape: 'Forma'
    },
    es: {
        label: 'Español',
        colors: 'Colores',
        dimension: 'Dimensión',
        speed: 'Velocidad',
        time: 'Temporizador',
        start: 'Inicia',
        stop: 'Para',
        shape: 'Forma'
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
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const shapeButton = document.getElementById('shape-button');
    const currentShape = document.getElementById('current-shape');
    const shapePickerContainer = document.getElementById('shape-picker-container');
    const emojiPicker = document.getElementById('emoji-picker');

    // Shape/Emoji picker functionality
    shapeButton.addEventListener('click', () => {
        shapePickerContainer.classList.remove('hidden');
        setTimeout(() => {
            shapePickerContainer.classList.add('visible');
        }, 10);
        
        // Play a subtle sound for accessibility
        try {
            const openSound = new Audio();
            openSound.src = 'beep.mp3';
            openSound.volume = 0.1;
            openSound.play();
        } catch (e) {
            console.log('Audio not supported');
        }
        
        // Close other menus/popups if open
        event.stopPropagation();
    });

    emojiPicker.addEventListener('emoji-click', event => {
        console.log(event.detail);
        currentShape.textContent = event.detail.unicode;
        conf.shapeType = 'emoji';
        conf.shapeEmoji = event.detail.unicode;
        
        // Close the emoji picker
        shapePickerContainer.classList.remove('visible');
        setTimeout(() => {
            shapePickerContainer.classList.add('hidden');
        }, 300);
        
        // Redraw with new shape
        redrawBall();
        
        // Play a success sound for selection
        try {
            const selectSound = new Audio();
            selectSound.src = 'beep.mp3';
            selectSound.volume = 0.2;
            selectSound.play();
        } catch (e) {
            console.log('Audio not supported');
        }
    });

    // Close emoji picker when clicking outside
    document.addEventListener('click', (event) => {
        if (!shapePickerContainer.contains(event.target) && event.target !== shapeButton) {
            shapePickerContainer.classList.remove('visible');
            setTimeout(() => {
                shapePickerContainer.classList.add('hidden');
            }, 300);
        }
    });

    // Hamburger menu functionality
    hamburgerBtn.addEventListener('click', () => {
        controls.classList.add('open');
        // Play a subtle sound for accessibility
        try {
            const openSound = new Audio();
            openSound.src = 'beep.mp3';
            openSound.volume = 0.1;
            openSound.play();
        } catch (e) {
            console.log('Audio not supported');
        }
    });

    closeMenuBtn.addEventListener('click', () => {
        controls.classList.remove('open');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
        if (!controls.contains(event.target) && event.target !== hamburgerBtn) {
            controls.classList.remove('open');
        }
    });

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
            } else if (prop === 'shapeType' || prop === 'shapeEmoji') {
                // These are handled directly in the redrawBall function
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
    conf.shapeType = 'circle'
    conf.shapeEmoji = '●'

    function setLang() {
        const t = translations[conf.lang];
        startBtn.innerText = t.start;
        stopBtn.innerText = t.stop;
        speed.labels[0].innerText = t.speed;
        radius.labels[0].innerText = t.dimension;
        color.labels[0].innerText = t.colors;
        time.labels[0].innerText = t.time;
        document.querySelector('label[for="shape-select"]').innerText = t.shape;
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
        
        if (conf.shapeType === 'emoji') {
            // Create a text item for emoji
            ball = new paper.PointText({
                point: [x, y + (conf.radius / 2)], // Adjust position for emoji center
                content: conf.shapeEmoji,
                fillColor: conf.color,
                fontSize: conf.radius * 2,
                justification: 'center'
            });
        } else {
            // Default circle
            ball = new paper.Path.Circle({
                center: [x, y],
                radius: conf.radius,
                fillColor: conf.color
            });
        }
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
        
        // Close menu when starting animation
        controls.classList.remove('open');
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
        // Check if the click is on the canvas and not on the controls
        if (!controls.contains(event.target) && event.target !== hamburgerBtn) {
            toggleAnimation();
        }
    });

    document.addEventListener('keydown', (event) => {
        console.log(event.code);
        if (event.code === 'Space') {
            toggleFullscreen();
        } else if (event.code === 'Enter' || event.code === 'NumpadEnter') {
            toggleFullscreen();
        } else if (event.code === 'Escape') {
            controls.classList.remove('open');
            // Also close emoji picker if open
            shapePickerContainer.classList.remove('visible');
            setTimeout(() => {
                shapePickerContainer.classList.add('hidden');
            }, 300);
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
