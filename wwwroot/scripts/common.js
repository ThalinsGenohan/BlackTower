function getRandomNumber(min, max) {
    return (max - min) * Math.random() + min;
}

if (localStorage.lightning === undefined) localStorage.lightning = false; // default false
if (localStorage.rain === undefined) localStorage.rain = true; // default true
