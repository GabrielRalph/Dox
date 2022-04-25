import {SvgPlus, Vector} from "./4.js"
// import {makeEditor} from "./TextEditor.js"

class Page extends SvgPlus{
  constructor(html, i) {
    super("div");
    this.props = {
      class: "page"
    }
    this.page = i;
    this.innerHTML = html;
    let background = this.createChild("div", {
      class: "page-background",
    });
    let rel = background.createChild("div");
    let footer = rel.createChild("div", {class: "footer"});
    let header = rel.createChild("div", {class: "header"});
    // makeEditor(footer);
  }

  get length(){
    return Math.ceil(this.scrollWidth / this.clientWidth);
  }

  set page(num){
    this._page = num;
    this.styles = {
      "--page": num,
    }
  }
  get page(){
    return this._page;
  }
}

class DoxPages extends SvgPlus{
  constructor(el){
    super(el);
    // window.addEventListener("resize", () => {
    //   this.update_width();
    // })
    // // this.resizer();
    this.html = this.innerHTML
  }


  set html(html){
    this.innerHTML = "";
    let i = 0;
    let page = new Page(html, i);
    this.appendChild(page);
    i++;
    while (i < page.length) {
      page = new Page(html, i)
      this.appendChild(page);
      i++;
    }
  }


  resizer(){
    let interval = setInterval(() => {
      this.update_width();
    }, 500)
  }


  update_width(){
    let bbox = this.getBoundingClientRect();
    let w = bbox.width + "px";
    this.styles = {"--width": w}
  }
}

SvgPlus.defineHTMLElement(DoxPages)
