



const speed = 3;

function moveCircle(circle) {
    let left = parseInt(circle.style.left) || 0;
    let top = parseInt(circle.style.top) || 0;

    let x = (Math.random() * speed*2 + 0.5) - speed;
    let y = (Math.random() * speed*2 + 0.5) - speed;

    // Ensure the circle stays within the window boundaries
    left = Math.min(Math.max(left + x, 0), window.innerWidth - circle.offsetWidth);
    top = Math.min(Math.max(top + y, 0), window.innerHeight - circle.offsetHeight);

    circle.style.left = left + "px";
    circle.style.top = top + "px";
}

function animateCircles() {
    const circles = document.querySelectorAll('.circle');
    circles.forEach(circle => {
        moveCircle(circle);
    });
    requestAnimationFrame(animateCircles);
}

document.addEventListener('DOMContentLoaded', () => {
    const circles = document.querySelectorAll('.circle');
    circles.forEach(circle => {
        circle.style.position = 'absolute'; // Ensure circles are positioned absolutely
        circle.style.left = Math.random() * (window.innerWidth - circle.offsetWidth) + "px";
        circle.style.top = Math.random() * (window.innerHeight - circle.offsetHeight) + "px";
    });
    animateCircles();
});