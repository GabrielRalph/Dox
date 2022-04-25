const Props = {
  metaCmds: {
    "b": false,
    "i": false,
  },
  keyCmds: {

  },
  typeset: (element) => {
    if (MathJax) {
      MathJax.typeset([element]);
    }
  },
  allow: () => {
    return true;
  }
}

let selectedInput = null;

class RichText {

  get start(){

  }

  get end(){

  }
}

class InputUpdate extends DocumentFragment {
  constructor(el) {
    super();
    this.element = el;
  }

  // updates based on key press
  evaluateKeyAction(e) {
    let key = e.key;
    let selection = window.get
    if (key.length == 1) {

    }
  }

  // inserts text at location
  insert(value){

  }

  //has the update changed from the element
  get changed() {
    return true;
  }

  // inserts paste clip at selection
  paste(clip) {
  }

  // pushes update to element and sets the selection
  pushUpdate(){
    const event = new Event("update");
    event.newValue = this;
    this.element.dispatchEvent(event);

    // if not prevented
    // update element and selection ...
  }

  set(content){
    //sets entire content
  }
}

function setupInputEventHandlers(element, props) {
  // Before edit takes place
  let meta = false;
  let value = "";

  let updateValue = (update) => {
    if (props.allow(update)) {
      value = update.pushUpdate();

      // push update may be blocked by update event
      if (value != null) {
        const event = new Event("afterupdate");
        element.dispatchEvent(event);
      }
    }
  }

  let keydown = (e) => {
    if (e.key == "Meta") {
      meta = true;
    }

    if (element.editable && element.selected) {

      // coppy element into text fragment
      let update = new InputUpdate(element);

      // if a meta comand is pressed execute cmd function
      let prevent = false;
      if (meta) {
        if (key in props.metaCmds) {
          let cmd = props.metaCmds[key];
          if (cmd instanceof Function) cmd = cmd(update);
          prevent = cmd;
        }

        // if a normal key is pressed run its cmd function
      } else if (key in props.keyCmds) {
        let cmd = props.keyCmds[key];
        if (cmd instanceof Function) cmd = cmd(update);
        prevent = cmd;
      }

      // action is not prevented, evaluate the resultant update
      // and check to see if it is allowed
      if (!prevent) {
        update.evaluateKeyAction(e);
      }

      updateValue(update);

      e.preventDefault();
    }
  }

  let keyup = (e) => {
    if (e.key == "Meta") {
      meta = false;
    }
  });

  let paste = (e) => {
    if (element.selected && element.editable) {
      let clip = (e.clipboardData || window.clipboardData);

      let update = new InputUpdate(element);
      update.paste(element);

      updateValue(update);

      e.preventDefault();
    }
  });

  element.addEventListener("keydown", keydown);
  element.addEventListener("keyup", keyup);
  element.addEventListener("paste", paste);

  Object.defineProperty(element, "value", {
    get: () => textValue,
    set: (v) => {
      let update = new InputUpdate(element);
      update.set(v);

      updateValue(update);
    }
  })
}

class RichInput {

  constructor(el, props) {
    super(el);
    let focused = false;
    let meta = false;
    let value = "";
    let setting = false;
    let selected = false;
    let editable = true;

    let select = () => {
      if (editable && !setting && !selected) {
        setting = true;

        // unselect any other inputs
        if (selectedInput != null) {
          selectedInput.selected = false;
        }

        // current selected input
        selectedInput = this;
        selected = true;

        //set content to text value
        this.innerHTML = this.value;

        //make input editable
        this.setAttribute("contenteditable", true);

        if (!focused) {
          element.focus();
        }

        //finished selecting element
        setting = false;

        //call select event
        const event = new Event("select");
        element.dispatchEvent(event);
      }
    }
    let unselect = () => {
      if (!setting && selected) {
        setting = true;

        selected = false;
        selectedInput = null;

        //make input un editable
        this.setAttribute("contenteditable", false);
        if (focused) {
          element.blur();
        }

        //typeset
        props.typeset(this);

        setting = false;
        const event = new Event("unselect");
        element.dispatchEvent(event);
      }
    }

    let updateValue = (update) => {
      if (props.allow(update)) {
        value = update.pushUpdate();

        // push update may be blocked by update event
        if (value != null) {
          const event = new Event("afterupdate");
          this.dispatchEvent(event);
        }
      }
    }
    let keydown = (e) => {
      if (e.key == "Meta") {
        meta = true;
      }

      if (editable && selected) {

        // coppy element into text fragment
        let update = new InputUpdate(this);

        // if a meta comand is pressed execute cmd function
        let prevent = false;
        if (meta) {
          if (key in props.metaCmds) {
            let cmd = props.metaCmds[key];
            if (cmd instanceof Function) cmd = cmd(update);
            prevent = cmd;
          }

          // if a normal key is pressed run its cmd function
        } else if (key in props.keyCmds) {
          let cmd = props.keyCmds[key];
          if (cmd instanceof Function) cmd = cmd(update);
          prevent = cmd;
        }

        // action is not prevented, evaluate the resultant update
        // and check to see if it is allowed
        if (!prevent) {
          update.evaluateKeyAction(e);
        }

        updateValue(update);

        e.preventDefault();
      }
    }
    let keyup = (e) => {
      if (e.key == "Meta") {
        meta = false;
      }
    });
    let paste = (e) => {
      if (selected && editable) {
        let clip = (e.clipboardData || window.clipboardData);

        let update = new InputUpdate(this);
        update.paste(this);

        updateValue(update);

        e.preventDefault();
      }
    });

    this.addEventListener("keydown", keydown);
    this.addEventListener("keyup", keyup);
    this.addEventListener("paste", paste);
    this.addEventListener("focusin", (e) => {
      focused = true;
    });
    this.addEventListener("focusout", (e) => {
      focused = false;
      if (selected) {
        unselect()
      }
    });

    Object.defineProperty(this, "selected", {
      get: () => selected,
      set: (v) => {
        if (v) {
          select();
        } else {
          unselect();
        }
      }
    });
    Object.defineProperty(this, "editable", {
      get: () => editable,
      set: (v) => {
        if (v) {
          editable = true;
        } else {
          editable = false;
          unselect();
        }
      }
    });
    Object.defineProperty(this, "focused", {
      get: () => focused,
    });
    Object.defineProperty(this, "value", {
      get: () => textValue,
      set: (v) => {
        let update = new InputUpdate(element);
        update.set(v);

        updateValue(update);
      }
    })
  }

  /* sets the format of the selection and any text typed
     there on after
  */
  set format(cssStyle){
    this.format = cssStyle;
  }

  /* gets the number of lines in the value */
  get lines(){

  }

}
