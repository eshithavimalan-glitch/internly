document.addEventListener("DOMContentLoaded", () => {

  /* Fade In Animation */
  document.querySelectorAll(".fade-in").forEach(card => {
    setTimeout(() => card.classList.add("active"), 200);
  });

  /* Score Animation */
  const scoreBar = document.getElementById("scoreBar");
  const scoreText = document.getElementById("scoreText");
  let score = 88;
  let current = 0;

  const interval = setInterval(() => {
    if (current >= score) {
      clearInterval(interval);
    } else {
      current++;
      scoreText.textContent = current + "%";
      scoreBar.style.width = current + "%";
    }
  }, 15);

  /* Expand Details */
  const detailsBtn = document.getElementById("detailsBtn");
  const detailsSection = document.getElementById("detailsSection");

  detailsBtn.addEventListener("click", () => {
    detailsSection.classList.toggle("open");
  });

  /* Edit Profile */
  const editBtn = document.getElementById("editBtn");
  const saveBtn = document.getElementById("saveBtn");

  const nameText = document.getElementById("nameText");
  const emailText = document.getElementById("emailText");

  const nameInput = document.getElementById("nameInput");
  const emailInput = document.getElementById("emailInput");

  editBtn.addEventListener("click", () => {
    nameText.style.display = "none";
    emailText.style.display = "none";
    nameInput.style.display = "inline";
    emailInput.style.display = "inline";
    saveBtn.classList.remove("hidden");
  });

  saveBtn.addEventListener("click", () => {
    nameText.textContent = nameInput.value;
    emailText.textContent = emailInput.value;

    nameText.style.display = "inline";
    emailText.style.display = "inline";
    nameInput.style.display = "none";
    emailInput.style.display = "none";

    saveBtn.classList.add("hidden");
  });

  /* Upload Navigation */
  document.getElementById("uploadNewBtn")
    .addEventListener("click", () => {
      window.location.href = "resume-upload.html";
    });

});