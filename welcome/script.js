const m1 = document.getElementById("m-1")
const m2 = document.getElementById("m-2")
const m3 = document.getElementById("m-3")
const m4 = document.getElementById("m-4")
const m5 = document.getElementById("m-5")

const n1 = document.getElementById("n-1")
const n2 = document.getElementById("n-2")
const n3 = document.getElementById("n-3")
const n4 = document.getElementById("n-4")

const dc = document.querySelector(".dc")
const gh = document.querySelector(".gh")


let meterpadding = 0


function progress() {
  meterpadding += 165;
  document.querySelector("#meter").style.paddingRight = `${meterpadding}px`
}

function changetop(top) {
  document.querySelector("#progress-bar").style.marginTop = `${top}px`
}

// i know this function is so unoptomized but im too lazy to make readable optomized

n1.addEventListener("click", () => {
    m1.classList.add("transition-1");

    progress()

    setTimeout(() => {
      m1.style.display = "none"
      m2.classList.add("transition-0");
      m2.querySelector("img").style.borderRadius = "5px"

      setTimeout(() => {
        m2.style.display = "inline";
        changetop("245");
        setTimeout(() => {
          m2.classList.remove("transition-0");
        }, 500);
      }, 500);
    }, 500);
})

n2.addEventListener("click", () => {
    m2.classList.add("transition-1");

    progress()

    setTimeout(() => {
      m2.style.display = "none"
      m3.classList.add("transition-0");

      setTimeout(() => {
        m3.style.display = "inline"
        changetop("170")
        setTimeout(() => {
          m3.classList.remove("transition-0");
        }, 500);
      }, 500);
    }, 500);
})


n3.addEventListener("click", () => {
  m3.classList.add("transition-1");

  progress()

  setTimeout(() => {
    m3.style.display = "none"
    m4.classList.add("transition-0");

    setTimeout(() => {
      m4.style.display = "inline"
      changetop("370")
      setTimeout(() => {
        m4.classList.remove("transition-0");

      }, 500);
    }, 500);
  }, 500);
})

n4.addEventListener("click", () => {
  m4.classList.add("transition-1");

  progress()


  setTimeout(() => {
    m4.style.display = "none"
    m5.classList.add("transition-0");

    setTimeout(() => {
      m5.style.display = "inline"
      changetop("155")
      setTimeout(() => {
        m5.classList.remove("transition-0");
        confetti({
          particleCount: 500,
          spread: 130,
          origin: { y: 0.65 },
          useWorker: false
        })
        let confetti_sfx = new Audio('../audio/confetti-pop-sound.mp3');
        confetti_sfx.play()

      }, 500);
    }, 500);
  }, 500);
})
