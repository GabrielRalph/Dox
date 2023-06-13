let overlay = {
  position: "fixed",
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  "pointer-events": "none",
}

let sHighlight = new SvgPlus("div");
let assets = new SvgPlus("div");
document.body.appendChild(assets);
assets.styles = overlay;
let cpe = assets.createChild("svg").createChild("defs").createChild("clipPath",{
  id: "selection-mask",
  clipPathUnits: "objectBoundingBox",
  content: `<path d="M0.5,1
      C 0.5,1,0,0.7,0,0.3
      A 0.25,0.25,1,1,1,0.5,0.3
      A 0.25,0.25,1,1,1,1,0.3
      C 1,0.7,0.5,1,0.5,1 Z" />`
});
sHighlight.styles = overlay;
sHighlight.styles = {
  background: "#00000003",
  "backdrop-filter": "blur(1.2px)",
  // opacity: 0.3,
  "clip-path": "url(#selection-mask)",
}

function updateClip(el = SelectedEditor){
  let bbox = el.getBoundingClientRect();
  let ssize = new Vector(window.innerWidth, window.innerHeight);
  let s = new Vector(bbox);
  let size = new Vector(bbox.width, bbox.height);
  [s, size] = [s, size].map(v => v.div(ssize));
  let r = parseFloat(window.getComputedStyle(el).getPropertyValue("border-radius"));
  r = (new Vector(r)).div(ssize);
  let p = [
    s.add(0, r.y),
    s.add(0, size.y - r.y),
    s.add(r.x, size.y),
    s.add(size.x - r.x, size.y),
    s.add(size.x, size.y - r.y),
    s.add(size.x, r.y),
    s.add(size.x - r.x, 0),
    s.add(r.x, 0)
  ]
  cpe.innerHTML = `<path
  d = "M0,0L1,0L1,1L0,1ZM${p[0]}L${p[1]}A${r},0,0,0,${p[2]}L${p[3]}A${r},0,0,0,${p[4]}L${p[5]}A${r},0,0,0,${p[6]}L${p[7]}A${r},0,0,0,${p[0]}" ><\path>`
}
function highlight(){
  let next = () => {
    if (SelectedEditor != null) {
      updateClip();
      window.requestAnimationFrame(next);
    } else {
      sHighlight.remove();
    }
  }
  window.requestAnimationFrame(next);
  document.body.appendChild(sHighlight);
}
