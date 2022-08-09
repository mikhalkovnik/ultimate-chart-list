console.log("hi");
const background = document.querySelector(".particles-js");
const scroller = document.getElementById("html");
window.addEventListener("scroll", ev => {
    let scrollTop = scroller.scrollTop;
    let elementHeight = window.screen.height;
    let opacity = ((elementHeight - scrollTop) / elementHeight) + 0.3;
    background.style.opacity = `${opacity}`;
});

particlesJS("particles-js", {
    "particles": {
        "number": {
            "value": 20,
            "density": {
                "enable": true,
                "value_area": 600
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
            "distance": 250,
            "color": "#fff",
            "opacity": 1,
            "width": 1
        },
        "move": {
            "enable": true,
            "speed": 0.8,
            "direction": "none",
            "random": true,
            "straight": false,
            "out_mode": "bounce",
            "bounce": false,
            "attract": {
                "enable": false,
                "rotateX": 30,
                "rotateY": 30
            }
        }
    },
    "interactivity": {
        "detect_on": "canvas",
        "events": {
            "onhover": {
                "enable": false,
                "mode": ["bubble", "grab"]
            },
            "onclick": {
                "enable": false,
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



    // console.log(scroller.scrollTop);
//
//     return opacity;
// document.getElementById("html").style.opacity = getOpacity();
