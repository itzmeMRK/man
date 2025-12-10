// SIMPLE SCROLL REVEAL FOR SERVICE BOXES
const services = document.querySelectorAll(".service");

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

services.forEach(s => observer.observe(s));


// BADGE MICRO-INTERACTION
const badge = document.getElementById("status-badge");

badge.addEventListener("click", () => {
  badge.animate([
    { transform: "scale(1)" },
    { transform: "scale(1.06)" },
    { transform: "scale(1)" }
  ], { duration: 300, easing: "ease-out" });
});

