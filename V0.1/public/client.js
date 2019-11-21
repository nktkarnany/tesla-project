(function () {
    let socket = io.connect(window.location.hostname + ':' + 3000);

    const lights = { turnedOn: 0 };
    
    let lastLight = 0;

    function setLight(value, id) {
        socket.emit('status', {
            on: value,
            id: id,
        });
    }

    onBtn.addEventListener('click', start);


    function start() {
        TweenMax.to(lights, 2, { turnedOn: 11, snap: { turnedOn: 1 }, onUpdate: onUpdateLights, repeat: -1, yoyo: true, ease: Power3.easeInOut });
    }

    function onUpdateLights() {
        setLight(true, lights.turnedOn);
        if (lights.turnedOn !== lastLight) {
            setLight(false, lastLight);
        }
        console.log(lights.turnedOn, lastLight);
        lastLight = lights.turnedOn;
    }

    socket.on('connect', function (data) {
        socket.emit('join', 'Client is connected!');
    });

    socket.on('status', function (data) {
        if (data.on) {
            light.style.backgroundColor = "yellow";
        } else {
            light.style.backgroundColor = "black";
        }
    });
}());
