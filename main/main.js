particlesJS("particles-js", {
    "particles": {
        "number": {
            "value": 30,
            "density": {
                "enable": true,
                "value_area": 800
            }
        },
        "color": {
            "value": ["#ff0000", "#00d009"]
        },
        "shape": {
            "type": "candlestick",
            "stroke": {
                "width": 3,
                "color": "#fff"
            },
            "polygon": {
                "nb_sides": 0
            },
            "image": {
                "src": "none",
                "width": 60,
                "height": 300
            }
        },
        "opacity": {
            "value": 1,
            "random": false,
            "anim": {
                "enable": false,
                "speed": 0.5,
                "opacity_min": 0.7,
                "sync": false
            }
        },
        "size": {
            "value": 5,
            "random": false,
            "anim": {
                "enable": false,
                "speed": 3,
                "size_min": 10,
                "sync": false
            }
        },
        "line_linked": {
            "enable": true,
            "distance": 300,
            "color": "#fff",
            "opacity": 0.4,
            "width": 2
        },
        "move": {
            "enable": true,
            "speed": 1,
            "direction": "none",
            "random": false,
            "straight": false,
            "out_mode": "out",
            "bounce": false,
            "attract": {
                "enable": false,
                "rotateX": 60,
                "rotateY": 120
            }
        }
    },
    "interactivity": {
        "detect_on": "canvas",
        "events": {
            "onhover": {
                "enable": true,
                "mode": ["bubble", "grab"]
            },
            "onclick": {
                "enable": true,
                "mode": "repulse"
            },
            "resize": true
        },
        "modes": {
            "grab": {
                "distance": 500,
                "line_linked": {
                    "opacity": 0.3
                }
            },
            "bubble": {
                "distance": 400,
                "size": 10,
                "duration": 1,
                "opacity": 1,
                "speed": 3
            },
            "repulse": {
                "distance": 500,
                "duration": 1
            },
            "push": {
                "particles_nb": 4
            },
            "remove": {
                "particles_nb": 2
            }
        }
    },
    "retina_detect": true
});

/* ---- stats.js config ---- */

// var count_particles, stats, update;
//
// class Stats {
//
// }
//
// stats = new Stats();
// stats.setMode(0);
// stats.domElement.style.position = 'absolute';
// stats.domElement.style.left = '0px';
// stats.domElement.style.top = '0px';
// document.body.appendChild(stats.domElement);
// update = function() {
//     stats.begin();
//     stats.end();
//     if (window.pJSDom[0].pJS.particles && window.pJSDom[0].pJS.particles.array) {
//         count_particles.innerText = window.pJSDom[0].pJS.particles.array.length;
//     }
//     requestAnimationFrame(update);
// };
// requestAnimationFrame(update);
//

