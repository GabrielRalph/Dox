let metaCmds =  {
}
let keyFuncs = {
  "Backspace":
}

class Line extends SvgPlus {
  constructor(line = "") {
    super("div");
    this.innerHTML = "";

    let meta = false;
    element.addEventListener("keydown", (e) => {
      let key = e.key;
      if (key == "Meta") {
        meta = true;
      }
      if (meta) {
        if (key in metaCmds) {
          let cmd = metaCmds[key]();
          if (!cmd) {
            e.preventDefault();
          }
        }
      }
    });

    element.addEventListener("keyup", (e) => {
      if (e.key == "Meta") {
        meta = false;
      }
      textValue = element.innerHTML
    });
  }


}
