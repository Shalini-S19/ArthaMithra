
// ArthaMitra Authentication

function showAuth(type) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  loginForm.hidden = type !== "login";
  registerForm.hidden = type !== "register";

  document.getElementById("loginTab").classList.toggle("active", type === "login");
  document.getElementById("registerTab").classList.toggle("active", type === "register");

  showMessage("");
}

function showMessage(message, success = false) {
  const element = document.getElementById("message");
  element.textContent = message;
  element.style.color = success ? "#176b4b" : "#b42318";
}

// LOGIN
document.getElementById("loginForm").addEventListener("submit", async function(event) {
  event.preventDefault();

  const phone = document.getElementById("loginPhone").value.trim();
  const pin = document.getElementById("loginPin").value.trim();

  if (!/^\d{10}$/.test(phone)) {
    showMessage("Enter a valid 10-digit mobile number.");
    return;
  }

  if (!/^\d{4}$/.test(pin)) {
    showMessage("PIN must contain exactly 4 digits.");
    return;
  }

  try {
    showMessage("Logging in...");

    const result = await api("POST", "/api/login", {
      phone: phone,
      pin: pin
    });

    showMessage(
      "Login successful! Welcome to ArthaMitra. Your account is connected.",
      true
    );

    console.log("Login successful:", result.user);

  } catch (error) {
    showMessage(error.message);
  }
});

// REGISTER
document.getElementById("registerForm").addEventListener("submit", async function(event) {
  event.preventDefault();

  const name = document.getElementById("regName").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const pin = document.getElementById("regPin").value.trim();
  const language = document.getElementById("regLanguage").value;
  const age = Number(document.getElementById("regAge").value);
  const gender = document.getElementById("regGender").value;

  const bank = document.getElementById("regBank").value;
  const insurance = document.getElementById("regInsurance").value;

  if (!/^\d{10}$/.test(phone)) {
    showMessage("Enter a valid 10-digit mobile number.");
    return;
  }

  if (!/^\d{4}$/.test(pin)) {
    showMessage("PIN must contain exactly 4 digits.");
    return;
  }

  if (!name || !age || !gender) {
    showMessage("Please fill in all required details.");
    return;
  }

  try {
    showMessage("Creating your account...");

    const result = await api("POST", "/api/register", {
      name: name,
      phone: phone,
      pin: pin,
      language: language,
      age: age,
      gender: gender,
      has_bank_account: bank === "yes",
      has_insurance: insurance === "yes"
    });

    showMessage(
      "Registration successful! Welcome to ArthaMitra.",
      true
    );

    console.log("Registration successful:", result.user);

  } catch (error) {
    showMessage(error.message);
  }
});
