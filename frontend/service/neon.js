const color1 = "#00F56A";
const color2 = "#00F56Acc";
const colorT1 = "rgba(0, 245, 106, 0.4)"; // 40% opacity
const colorT2 = "rgba(0, 245, 106, 0.3)"; // 30% opacity
function animateNeon(element, maxShadow, interval) {
    let shadowSize = 0;
    let increment = true;

    setInterval(() => {
        element.style.textShadow = `
            0 0 ${shadowSize}px ${colorT2}, 
            0 0 ${shadowSize * 2}px ${colorT1}, 
            0 0 ${shadowSize * 3}px ${colorT1}, 
            0 0 ${shadowSize * 4}px ${colorT1}`;
        if (increment) {
            shadowSize++;
            if (shadowSize >= maxShadow) increment = false;
        } else {
            shadowSize--;
            if (shadowSize <= 0) increment = true;
        }
    }, interval);
}

function animateNeonFrame(element, maxShadow, interval, blinkTimes, restDuration) {
    let shadowSize = maxShadow;
    let decrement = true;
    let blinkCount = 0;
    let isResting = false;

    const animationInterval = setInterval(() => {
        if (isResting) {
            /* during rest we keep max shadow */
            element.style.boxShadow = `
                0 0 ${maxShadow}px ${color2}, 
                0 0 ${maxShadow * 2}px ${color1}, 
                0 0 ${maxShadow * 3}px ${color1}`;
            return;
        }
        /* changing box shadow when is not resting */
        element.style.boxShadow = `
            0 0 ${shadowSize}px ${color2}, 
            0 0 ${shadowSize * 2}px ${color1}, 
            0 0 ${shadowSize * 3}px ${color1}`;
        /* adjusting shadow size incrementing/decrementing */
        if (decrement) {
            shadowSize--;
            if (shadowSize <= 0) {
                decrement = false;
            }
        } else {
            shadowSize++;
            if (shadowSize >= maxShadow) {
                decrement = true;
                blinkCount++;

                if (blinkCount >= blinkTimes) {
                    isResting = true;
                    setTimeout(() => {
                        isResting = false;
                        blinkCount = 0;
                    }, restDuration);
                }
            }
        }
    }, interval);
}

function animateNeonCard(element, maxShadow, interval, blinkTimes, restDuration) {
    let shadowSize = maxShadow;
    let decrement = true;
    let blinkCount = 0;
    let isResting = false;
    let animationInterval;

    function startAnimation() {
        animationInterval = setInterval(() => {
            if (isResting) {
                element.style.boxShadow = `
                    0 0 ${maxShadow}px ${color2}, 
                    0 0 ${maxShadow * 2}px ${color1}, 
                    0 0 ${maxShadow * 3}px ${color1}`;
                return;
            }
            element.style.boxShadow = `
                0 0 ${shadowSize}px ${color2}, 
                0 0 ${shadowSize * 2}px ${color1}, 
                0 0 ${shadowSize * 3}px ${color1}`;
            if (decrement) {
                shadowSize--;
                if (shadowSize <= 0) {
                    decrement = false;
                }
            } else {
                shadowSize++;
                if (shadowSize >= maxShadow) {
                    decrement = true;
                    blinkCount++;

                    if (blinkCount >= blinkTimes) {
                        isResting = true;
                        setTimeout(() => {
                            isResting = false;
                            blinkCount = 0;
                        }, restDuration);
                    }
                }
            }
        }, interval);
    }

    function stopAnimation() {
        clearInterval(animationInterval);
        element.style.boxShadow = 'none';
    }

    element.addEventListener('mouseenter', startAnimation);
    element.addEventListener('mouseleave', stopAnimation);
}

function animateCardHover() {
    const cards = document.querySelectorAll('.card-hover');
    cards.forEach(card => {
        animateNeonCard(card, 10, 35, 2, 1000);
    });
}


document.addEventListener("DOMContentLoaded", () => {
    const neonText = document.getElementById("neon-text");
    const neonFrames = document.querySelectorAll(".blinking-neon-frame");
    const notification = document.getElementById("notification-indicator");

    if (neonText) {
        animateNeon(neonText, 10, 100);
    }
    if (neonFrames) {
        neonFrames.forEach(neonFrame => {
            animateNeonFrame(neonFrame, 10, 35, 2, 1000);
        })
    }
    if (notification) {
        animateNeonFrame(notification, 10, 35, 2, 1000);
    }
    animateCardHover();
});