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
            start: 'Inicia',
            stop: 'Para'
        }
    })
    // controller
    .controller('ctrl', ['$scope', '$rootScope', '$window', 'translations', function ($s, $rs, $window, trans) {
        paper.install($window);
        paper.setup('canvas');

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
            div: 1000, // divisore per calcolare lo spostamento (per ogni frame) in rapporto alla grandezza del playground
            dir2: '1,0', // asse di movimento
            lang: 'en'
        };

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
                if ($s.m.v === getX() && $s.circle.position.x < $s.playgrd.x.max)
                    $s.circle.position.x += $s.conf.speed.value * $s.playgrd.x.delta / $s.conf.div;
                else if ($s.m.v === -getX() && $s.circle.position.x > $s.playgrd.x.min)
                    $s.circle.position.x -= $s.conf.speed.value * $s.playgrd.x.delta / $s.conf.div;
                else $s.m.v = -$s.m.v;
            }
            if (getY() !== 0) {
                if ($s.m.v === getY() && $s.circle.position.y < $s.playgrd.y.max)
                    $s.circle.position.y += $s.conf.speed.value * $s.playgrd.y.delta / $s.conf.div;
                else if ($s.m.v === -getY() && $s.circle.position.y > $s.playgrd.y.min)
                    $s.circle.position.y -= $s.conf.speed.value * $s.playgrd.y.delta / $s.conf.div;
                else if (getX() === 0) // inverto il senso di marcia solo se non è già stato fatto per x
                    $s.m.v = -$s.m.v;
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