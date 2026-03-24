document.addEventListener("DOMContentLoaded", () => {

  /* Fade In Cards */
  document.querySelectorAll(".fade-in").forEach(card => {
    setTimeout(() => card.classList.add("active"), 200);
  });

  /* Animate Match Scores */
  document.querySelectorAll(".match-card").forEach(card => {

    const score = parseInt(card.dataset.score);
    const scoreText = card.querySelector(".score-text");
    const progressBar = card.querySelector(".progress-fill");

    let current = 0;

    const interval = setInterval(() => {
      if (current >= score) {
        clearInterval(interval);
      } else {
        current++;
        scoreText.textContent = current + "%";
        progressBar.style.width = current + "%";
      }
    }, 15);

  });

  /* Expand Details */
  document.querySelectorAll(".details-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.nextElementSibling.classList.toggle("open");
    });
  });

  /* Save Button Toggle */
  document.querySelectorAll(".save-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.textContent === "Save") {
        btn.textContent = "Saved ✓";
      } else {
        btn.textContent = "Save";
      }
    });
  });

  /* Filter System */
  document.getElementById("applyFilter")
    .addEventListener("click", () => {

      const role = document.getElementById("roleFilter").value;
      const location = document.getElementById("locationFilter").value;

      document.querySelectorAll(".match-card").forEach(card => {

        const roleMatch = role === "all" || card.dataset.role === role;
        const locationMatch = location === "all" || card.dataset.location === location;

        if (roleMatch && locationMatch) {
          card.style.display = "block";
        } else {
          card.style.display = "none";
        }

      });

    });

});