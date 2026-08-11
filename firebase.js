import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.1/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCKy1aUU0Ep8VyNdX7oZkZGlotFwK0SSQo",
  authDomain: "kaibutsu-scale.firebaseapp.com",
  projectId: "kaibutsu-scale",
  storageBucket: "kaibutsu-scale.firebasestorage.app",
  messagingSenderId: "648691739135",
  appId: "1:648691739135:web:8cf2afa26e0c090885dfca"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// -----------------------------
// ログイン画面
// -----------------------------

const style = document.createElement("style");

style.textContent = `
  #kaibutsu-auth-screen {
    position: fixed;
    inset: 0;
    z-index: 99999;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .kaibutsu-auth-card {
    width: min(420px, 100%);
    background: white;
    border-radius: 18px;
    padding: 28px;
    box-shadow: 0 10px 35px rgba(0,0,0,.12);
  }

  .kaibutsu-auth-card h2 {
    margin: 0 0 6px;
    font-size: 26px;
  }

  .kaibutsu-auth-card p {
    margin: 0 0 20px;
    color: #6b7280;
  }

  .kaibutsu-auth-card label {
    display: block;
    margin-top: 14px;
    margin-bottom: 6px;
    font-weight: 700;
  }

  .kaibutsu-auth-card input {
    width: 100%;
    box-sizing: border-box;
    padding: 14px;
    font-size: 16px;
    border: 1px solid #d1d5db;
    border-radius: 10px;
  }

  #kaibutsu-login-button {
    width: 100%;
    margin-top: 20px;
    padding: 14px;
    border: 0;
    border-radius: 10px;
    background: #111827;
    color: white;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
  }

  #kaibutsu-login-error {
    min-height: 22px;
    margin-top: 12px;
    color: #dc2626;
    font-size: 14px;
  }

  #kaibutsu-user-bar {
    position: fixed;
    right: 12px;
    bottom: 12px;
    z-index: 9000;
    background: rgba(17,24,39,.94);
    color: white;
    border-radius: 12px;
    padding: 8px 10px;
    font-size: 12px;
    display: none;
    align-items: center;
    gap: 8px;
  }

  #kaibutsu-logout-button {
    border: 1px solid rgba(255,255,255,.4);
    background: transparent;
    color: white;
    border-radius: 7px;
    padding: 5px 8px;
    cursor: pointer;
  }
`;

document.head.appendChild(style);

const authScreen = document.createElement("div");
authScreen.id = "kaibutsu-auth-screen";

authScreen.innerHTML = `
  <div class="kaibutsu-auth-card">
    <h2>KAIBUTSU SCALE</h2>
    <p>株式会社開物 社内用</p>

    <form id="kaibutsu-login-form">
      <label for="kaibutsu-email">メールアドレス</label>
      <input
        id="kaibutsu-email"
        type="email"
        autocomplete="username"
        required
      >

      <label for="kaibutsu-password">パスワード</label>
      <input
        id="kaibutsu-password"
        type="password"
        autocomplete="current-password"
        required
      >

      <button id="kaibutsu-login-button" type="submit">
        ログイン
      </button>

      <div id="kaibutsu-login-error"></div>
    </form>
  </div>
`;

document.body.appendChild(authScreen);

const userBar = document.createElement("div");
userBar.id = "kaibutsu-user-bar";

userBar.innerHTML = `
  <span id="kaibutsu-user-email"></span>
  <button id="kaibutsu-logout-button" type="button">ログアウト</button>
`;

document.body.appendChild(userBar);

const loginForm = document.getElementById("kaibutsu-login-form");
const emailInput = document.getElementById("kaibutsu-email");
const passwordInput = document.getElementById("kaibutsu-password");
const loginError = document.getElementById("kaibutsu-login-error");
const loginButton = document.getElementById("kaibutsu-login-button");
const logoutButton = document.getElementById("kaibutsu-logout-button");
const userEmail = document.getElementById("kaibutsu-user-email");

// -----------------------------
// ログイン
// -----------------------------

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  loginError.textContent = "";
  loginButton.disabled = true;
  loginButton.textContent = "ログイン中...";

  try {
    await signInWithEmailAndPassword(
      auth,
      emailInput.value.trim(),
      passwordInput.value
    );

    passwordInput.value = "";
  } catch (error) {
    console.error(error);
    loginError.textContent =
      "メールアドレスまたはパスワードを確認してください。";
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "ログイン";
  }
});

// -----------------------------
// ログアウト
// -----------------------------

logoutButton.addEventListener("click", async () => {
  await signOut(auth);
});

// -----------------------------
// ログイン状態監視
// -----------------------------

onAuthStateChanged(auth, (user) => {
  if (user) {
    authScreen.style.display = "none";
    userBar.style.display = "flex";
    userEmail.textContent = user.email || "";

    window.kaibutsuUser = {
      uid: user.uid,
      email: user.email
    };

    console.log("KAIBUTSU SCALE ログイン:", user.email);
  } else {
    authScreen.style.display = "flex";
    userBar.style.display = "none";
    userEmail.textContent = "";

    window.kaibutsuUser = null;
  }
});
