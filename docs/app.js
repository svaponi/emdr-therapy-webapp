class AudioService {

    context;
    beepFile = 'beep.mov';
    buffers = new Map();
    playing = new Map();

    constructor() {
        this.context = new AudioContext();
        this.preload();
    }

    async preload() {
        await this.getBuffer(this.beepFile);
        return this;
    }


    async beep(params) {
        return this.playSound(this.beepFile, params);
    }

    getBuffer(sound) {

        console.debug('get sound', sound);

        if (this.buffers.has(sound)) {
            const buffer = this.buffers.get(sound);
            return new Promise((resolve) => resolve(buffer));
        }

        const self = this;
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.open('GET', sound, true);
            request.responseType = 'arraybuffer';
            request.onload = function () {
                self.context.decodeAudioData(
                    request.response,
                    (buffer) => {
                        console.debug('loaded sound', sound);
                        self.buffers.set(sound, buffer);
                        resolve(buffer);
                    },
                    (error) => {
                        console.error('cannot load sound', sound, error);
                        reject(error);
                    }
                );
            };
            request.send();
        });
    }

    async playSound(sound, params = {}) {

        //do not play if already playing
        if (this.playing.get(sound)) {
            console.debug('ignore sound (already playing)', sound);
            return Promise.resolve();
        }

        // start playing
        this.playing.set(sound, true);

        const buffer = await this.getBuffer(sound);

        const source = this.context.createBufferSource(); // creates a sound source
        const gainNode = this.context.createGain();
        source.buffer = buffer;                    // tell the source which sound to play
        source.connect(gainNode); // connect the source to gain node
        gainNode.connect(this.context.destination); // connect the gain node to the context's destination (the speakers)

        if (params.playbackRate) {
            source.playbackRate.value = params.playbackRate;
        }
        if (params.gain) {
            gainNode.gain.value = params.gain;
        }
        // waitStart == true: promise resolves when sound starts playing
        // waitStart == false: promise resolves when sound ends playing
        let waitStart = params.waitStart || false;

        // end playing
        const self = this;
        return new Promise((resolve) => {

            source.addEventListener('ended', () => {
                console.debug('ended sound', sound);
                self.playing.delete(sound);
                if (!waitStart) resolve();
            }, {once: true});

            console.debug('play sound', sound, params);
            const startInSeconds = (params.startIn || 0) / 1000;
            source.start(this.context.currentTime + startInSeconds);
            if (waitStart) resolve();
        })
    }
}

angular.module("app", [])
    .constant('translations', {
        en: {
            label: 'English',
            colors: 'Colors',
            dimension: 'Size',
            movement: 'Movement',
            horizontal: 'Horizontal',
            vertical: 'Vertical',
            oblique1: 'Oblique 1',
            oblique2: 'Oblique 2',
            speed: 'Speed',
            time: 'Time',
            start: 'Start',
            stop: 'Stop'
        },
        de: {
            label: 'Deutsch',
            colors: 'Farben',
            dimension: 'Größe',
            movement: 'Bewegung',
            horizontal: 'Horizontal',
            vertical: 'Vertikal',
            oblique1: 'Schräg 1',
            oblique2: 'Schräg 2',
            speed: 'Geschwindigkeit',
            time: 'Zeit',
            start: 'Anfang',
            stop: 'Halt'
        },
        fr: {
            label: 'Français',
            colors: 'Couleurs',
            dimension: 'Taille',
            movement: 'Mouvement',
            horizontal: 'Horizontal',
            vertical: 'Verticale',
            oblique1: 'Oblique 1',
            oblique2: 'Oblique 2',
            speed: 'Vélocité',
            time: 'Temps',
            start: 'Démarrer',
            stop: 'Arrêtez'
        },
        it: {
            label: 'Italiano',
            colors: 'Colori',
            dimension: 'Dimensione',
            movement: 'Movimento',
            horizontal: 'Orizzontale',
            vertical: 'Verticale',
            oblique1: 'Obliquo 1',
            oblique2: 'Obliquo 2',
            speed: 'Velocità',
            time: 'Tempo',
            start: 'Partenza',
            stop: 'Stop'
        },
        es: {
            label: 'Español',
            colors: 'Colores',
            dimension: 'Dimensión',
            movement: 'Movimiento',
            horizontal: 'Horizontal',
            vertical: 'Vertical',
            oblique1: 'Oblicua 1',
            oblique2: 'Oblicua 2',
            speed: 'Velocidad',
            time: 'Tiempo',
            start: 'Inicia',
            stop: 'Para'
        }
    })
    // controller
    .controller('ctrl', ['$scope', '$rootScope', '$window', 'translations', function ($s, $rs, $window, trans) {
        paper.install($window);
        paper.setup('canvas');

        $s.audio = new AudioService();

        function mapKeyboardEvent(e) {
            if (e.code === 'Enter') {
                return "toggleRun"
            }
            if (e.code === 'Space') {
                return "toggleFullscreen"
            }
            if (e.ctrlKey && ['d'].indexOf(e.key) >= 0) {
                return "debug"
            }
            if (e.target === document.body) {
                if (['ArrowUp'].indexOf(e.key) >= 0) {
                    if (e.shiftKey) {
                        return "incRadius"
                    }
                    return "incSpeed"
                }
                if (['ArrowDown'].indexOf(e.key) >= 0) {
                    if (e.shiftKey) {
                        return "decRadius"
                    }
                    return "decSpeed"
                }
            }
        }

        function postResize() {
            $s.redrawBg();
            $s.redrawCircle({postResize: true});
        }

        function toggleFullscreen() {
            document.body.classList.toggle("fullscreen")
            postResize()
        }

        window.addEventListener('resize', postResize);

        const canvas = document.getElementById("canvas")
        canvas.addEventListener('click', (e) => {
            $s.toggleRun()
            $s.$apply()
        });

        // configurazione
        $s.conf = {
            defaultColor: '#d43f3a', // colore circle (rosso originale #d5142b, rosso bootstrap #d9534f / #d43f3a)
            defaultBgColor: '#1f1f1f', // colore sfondo
            border: 0.02, // % di spazio lungo i lati non percorso dal circle
            radius: {
                value: 50, // raggio
                step: 5,
                min: 10,
                max: 300
            },
            speed: {
                value: 20, // incremento o velocità
                step: 2,
                min: 2,
                max: 100
            },
            time: {
                default: 30,
                enabled: true,
                value: 0,
                step: 5,
                min: 5,
                max: 300
            },
            div: 1000, // divisore per calcolare lo spostamento (per ogni frame) in rapporto alla grandezza del playground
            dir2: '1,0', // asse di movimento
            lang: 'en'
        };

        setInterval(() => {
            if ($s.isRunning() && $s.conf.time.enabled) {
                if ($s.conf.time.value > 0) {
                    $s.conf.time.value -= 1
                } else {
                    $s.init()
                }
                $s.$apply()
            }
        }, 1000)

        function getX() {
            return Number($s.conf.dir2.split(',')[0]);
        }

        function getY() {
            return Number($s.conf.dir2.split(',')[1]);
        }

        $s.debug = false;
        // oggetto in movimento
        var circle;
        // rettangolo per colorare lo sfondo
        var bg;
        // utility per invertire x<>y
        var r = {
            x: 'y',
            y: 'x'
        };
        // movimento
        $s.m = {
            d: false, // is dirty (ha corso almeno una volta)
            r: false, // is running
            a: r[$s.conf.dir], // asse di scorrimento
            v: 1 // verso di scorrimento
        };
        $s.updatePlayground = function () {
            // playground, perimetro di gioco
            $s.playgrd = {
                y: {
                    min: Math.round($s.conf.radius.value + ($s.conf.border * view.bounds.height)),
                    max: Math.round(view.bounds.height - ($s.conf.radius.value + ($s.conf.border * view.bounds.height))),
                    delta: Math.round(view.bounds.height - 2 * ($s.conf.radius.value + ($s.conf.border * view.bounds.height)))
                },
                x: {
                    min: Math.round($s.conf.radius.value + ($s.conf.border * view.bounds.width)),
                    max: Math.round(view.bounds.width - ($s.conf.radius.value + ($s.conf.border * view.bounds.width))),
                    delta: Math.round(view.bounds.width - 2 * ($s.conf.radius.value + ($s.conf.border * view.bounds.width)))
                }
            };
        }
        $s.getCoord = function (get, c) {
            if (get() == 0)
                return ($s.playgrd[c].delta / 2) + $s.playgrd[c].min;
            else if (get() == 1)
                return $s.playgrd[c].min;
            else
                return $s.playgrd[c].max;
        }
        $s.getStartPoint = function () {
            var pX, pY;
            pX = $s.getCoord(getX, 'x');
            pY = $s.getCoord(getY, 'y');
            return new Point(pX, pY);
        }
        $s.init = function () {
            $s.m.d = false;
            $s.m.r = false;
            if ($s.circle)
                $s.circle.remove();
            $s.conf.time.value = $s.conf.time.default
            $s.circle = undefined;
            $s.redrawBg();
            $s.redrawCircle({
                reset: true
            });
        };
        $s.redrawCircle = function (options) {
            $s.updatePlayground();
            var pos;
            if ($s.circle) {
                pos = $s.circle.position;
                $s.circle.remove();
            }
            if (!pos || (options && options.reset))
                pos = $s.getStartPoint();

            if (pos && options && options.postResize) {
                if (getX() === 0) {
                    pos.x = $s.playgrd.x.min + ($s.playgrd.x.max - $s.playgrd.x.min) / 2;
                }
                if (getY() === 0) {
                    pos.y = $s.playgrd.y.min + ($s.playgrd.y.max - $s.playgrd.y.min) / 2;
                }
            }

            if (pos.x < $s.playgrd.x.min) pos.x += ($s.playgrd.x.min - pos.x);
            else if (pos.x > $s.playgrd.x.max) pos.x -= (pos.x - $s.playgrd.x.max);
            if (pos.y < $s.playgrd.y.min) pos.y += ($s.playgrd.y.min - pos.y);
            else if (pos.y > $s.playgrd.y.max) pos.y -= (pos.y - $s.playgrd.y.max);
            $s.circle = new Path.Circle(pos, $s.conf.radius.value);
            if (!$s.color) $s.color = $s.conf.defaultColor;
            document.getElementById('color').value = ($s.color);
            document.getElementById('color').style.backgroundColor = $s.color;
            $s.circle.fillColor = $s.color;
        };
        $s.redrawBg = function () {
            if (bg)
                bg.remove();
            if (!$s.bgcolor) $s.bgcolor = $s.conf.defaultBgColor;
            document.getElementById('bgcolor').value = ($s.bgcolor);
            document.getElementById('bgcolor').style.backgroundColor = $s.bgcolor;
            const {width, height} = canvas.getBoundingClientRect();
            paper.view.viewSize = new paper.Size(width, height);
            bg = new Path.Rectangle({
                point: [0, 0],
                size: [width, height],
                fillColor: $s.bgcolor,
                selected: true
            });
            bg.sendToBack();
        }
        $s.start = function () {
            $s.m.r = true;
            $s.m.d = true;
        }
        $s.stop = function () {
            $s.m.r = false;
        }
        $s.isRunning = function () {
            return $s.m.r;
        }
        $s.isDirty = function () {
            return $s.m.d;
        }
        $s.toggleRun = function () {
            if ($s.isRunning()) $s.stop();
            else $s.start();
        }
        view.onFrame = function (event) {
            if (!$s.m.r) return;
            if ($s.debug && event.count % 10 === 0) {
                $s.event = event;
                $s.$apply(); // aggiorno i dati esposti per il DEBUG
            }
            if (getX() !== 0) {
                if ($s.m.v === getX() && $s.circle.position.x < $s.playgrd.x.max) {
                    $s.circle.position.x += $s.conf.speed.value * $s.playgrd.x.delta / $s.conf.div;
                    if ($s.playgrd.x.max - $s.circle.position.x <= $s.conf.radius.value) {
                        $s.audio.beep()
                    }
                } else if ($s.m.v === -getX() && $s.circle.position.x > $s.playgrd.x.min) {
                    $s.circle.position.x -= $s.conf.speed.value * $s.playgrd.x.delta / $s.conf.div;
                    if ($s.circle.position.x - $s.playgrd.x.min <= $s.conf.radius.value) {
                        $s.audio.beep()
                    }
                } else {
                    $s.m.v = -$s.m.v;
                }
            }
            if (getY() !== 0) {
                if ($s.m.v === getY() && $s.circle.position.y < $s.playgrd.y.max)
                    $s.circle.position.y += $s.conf.speed.value * $s.playgrd.y.delta / $s.conf.div;
                else if ($s.m.v === -getY() && $s.circle.position.y > $s.playgrd.y.min)
                    $s.circle.position.y -= $s.conf.speed.value * $s.playgrd.y.delta / $s.conf.div;
                else if (getX() === 0) {
                    // inverto il senso di marcia solo se non è già stato fatto per x
                    $s.m.v = -$s.m.v;
                    $s.audio.beep()
                }
            }
        }
        view.onKeyUp = function (e) {
            const eventName = mapKeyboardEvent(e.event)
            console.log(e.key, eventName, e.event)
            if (eventName) {
                e.preventDefault()
                e.stopPropagation()
            }
            if (eventName === "toggleRun") {
                $s.toggleRun();
                $s.$apply();
            } else if (eventName === "toggleFullscreen") {
                toggleFullscreen();
            } else if (eventName === "toggleDebug") {
                $s.debug = !$s.debug;
                $s.$apply();
            } else if (eventName === "incRadius" && $s.conf.radius.value < $s.conf.radius.max) {
                $s.conf.radius.value += $s.conf.radius.step;
                $s.redrawCircle();
            } else if (eventName === "decRadius" && $s.conf.radius.value > $s.conf.radius.min) {
                $s.conf.radius.value -= $s.conf.radius.step;
                $s.redrawCircle();
            } else if (eventName === "incSpeed" && $s.conf.speed.value < $s.conf.speed.max) {
                $s.conf.speed.value += $s.conf.speed.step;
                $s.$apply();
            } else if (eventName === "decSpeed" && $s.conf.speed.value > $s.conf.speed.min) {
                $s.conf.speed.value -= $s.conf.speed.step;
                $s.$apply();
            }
        }
        $s.init();
        paper.view.draw();
        // Gestione della lingua
        $s.lang = $s.conf.lang;
        $s.trans = trans;
    }])
