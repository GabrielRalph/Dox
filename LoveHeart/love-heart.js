import {SvgPlus, SvgPath, Vector} from "../4.js"

function love_x(theta, rad = 1) {
  return rad * 16 * Math.pow(Math.sin(theta), 3)
}
function love_y(theta, rad = 1) {
  return rad * (13 * Math.cos(theta) - 5 * Math.cos(2 * theta) - 2 * Math.cos(3 * theta) - Math.cos(4 * theta));
}
function love(theta, rad) {
  return new Vector(love_x(theta, rad), love_y(theta, rad));
}


class LoveHeartFunction extends SvgPath {
  _res = 0.05;

  set resolution(value) {
    value = parseFloat(value);
    if (Number.isNaN(value)) value = 0.01;
    this._res = value;
  }

  draw(rad = 1) {
    rad = rad / 32;
    this.d.clear();
    this.M(love(0, rad).mul(new Vector(1, -1)));
    for (let i = this._res; i < 2*Math.PI; i+= this._res) {
      this.L(love(i, rad).mul(new Vector(1, -1)))
    }
    this.Z();
  }
}

class LoveHeart extends SvgPlus {
  constructor(el){
    super(el);
    this.innerHTML = "";
    this.svg = this.createChild("svg", {viewBox: "-10 -10 20 20"});
    this.loveHeart = this.svg.createChild(LoveHeartFunction);

    // console.log(sheet);
    // let shadow = this.attachShadow({mode: "open"});

    this.start();
  }

  onconnect(){
    this.start();
  }

  start(){
    let next = (i) => {
      let theta = i / 120;
      let rad = 5;
      rad += 2 * Math.sin(theta) * Math.pow(Math.sin(theta / 6), 3);

      this.loveHeart.draw(rad);
      if (this.isConnected) {
        window.requestAnimationFrame(next)
      }
    }

    window.requestAnimationFrame(next)
  }
}


SvgPlus.defineHTMLElement(LoveHeart);
