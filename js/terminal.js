export function initTerminal(getRepos) {
  const output = document.getElementById("terminal-output");
  const form = document.getElementById("terminal-form");
  const input = document.getElementById("terminal-input");
  const quickBtns = document.querySelectorAll(".term-cmd-btn");

  if (!output || !form || !input) return;
  const prompt = form.querySelector(".term-prompt").textContent;

  function print(text, cls = "") {
    const div = document.createElement("div");
    if (cls) div.className = cls;
    div.textContent = text;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
  }

  function runCommand(raw) {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;

    print(`${prompt} ${raw}`, "term-line-cmd");

    switch (cmd) {
      case "help":
        print(
          [
            "Available commands:",
            "  whoami    - Identity & focus",
            "  qrz       - Amateur radio station info (BH4HAP)",
            "  f1        - About the Alfa Romeo C42",
            "  repos     - List featured GitHub repositories",
            "  contact   - Public contact channels",
            "  clear     - Clear terminal buffer",
          ].join("\n")
        );
        break;

      case "whoami":
        print(
          [
            "Name      : LIU Xinyu (刘心宇)",
            "Callsign  : BH4HAP (CRAC Class-A)",
            "Base      : Shanghai, China",
            "Focus     : Hardware R&D, Baseband/RF, Embedded (STM32/ESP32/LoongArch/K230)",
          ].join("\n")
        );
        break;

      case "qrz":
        print(
          [
            "Station   : BH4HAP",
            "License   : CRAC Class-A Amateur Radio Operator",
            "Grid      : PM01 (Shanghai)",
            "Morse     : -... .... ....- .... .- .--.",
            "73 de BH4HAP!",
          ].join("\n")
        );
        break;

      case "f1":
        print(
          [
            "Chassis   : Alfa Romeo F1 Team ORLEN C42",
            "Driver    : #24 Zhou Guanyu (周冠宇)",
            "Model     : markste-in/c42, based on the team's AR model",
            "Tip       : Tap the 3D car to pause or resume rotation.",
          ].join("\n")
        );
        break;

      case "repos": {
        const repos = getRepos ? getRepos() : [];
        if (!repos.length) {
          print("No repositories loaded.");
        } else {
          print(
            repos
              .map((r) => `  • ${r.name.padEnd(26)} [${r.language || "Misc"}]  ★${r.stargazers_count || 0}`)
              .join("\n")
          );
        }
        break;
      }

      case "contact":
        print(
          [
            "Email     : tony9193@foxmail.com",
            "GitHub    : https://github.com/Tony9193",
            "Location  : Shanghai, China",
          ].join("\n")
        );
        break;

      case "clear":
        output.innerHTML = "";
        break;

      default:
        print(`command not found: ${cmd}. Type 'help' for available commands.`, "term-line-err");
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    runCommand(input.value);
    input.value = "";
  });

  quickBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      runCommand(btn.dataset.cmd || "");
    });
  });

  // Boot banner
  print("BH4HAP Lab Shell — type 'help' to list commands.", "term-line-dim");
}
