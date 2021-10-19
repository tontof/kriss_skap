let hist = [];
const trad = {
  'submit': 'Valider'
};
// from animate.css
const animateCSS = (node, animation, prefix = 'animate__') =>
  // We create a Promise and return it
  new Promise((resolve, reject) => {
    const animationName = `${prefix}${animation}`;
    node.classList.add(`${prefix}animated`, animationName);
    // When the animation ends, we clean the classes and resolve the Promise
    const handleAnimationEnd = (event) => {
      event.stopPropagation();
      node.classList.remove(`${prefix}animated`, animationName);
      resolve('Animation ended');
    };
    
    node.addEventListener('animationend', handleAnimationEnd, {once: true});
  });
// next slide
const next = (selector, {animationIn = 'fadeIn', animationOut = 'fadeOut'} = {}) => {
  hist.push(selector);
  const node = document.querySelector(selector);
  if (node.classList.contains('modal')) {
    animateCSS(node, animationIn);
  } else {
    document.activeElement.blur();
    document.querySelectorAll('section.visible').forEach((elt) => {
      animateCSS(elt, animationOut).then(() => elt.classList.remove('visible'));
    });
    return animateCSS(node, animationIn).then(() => node.classList.add('visible'));
  }
}
// create tag node
const tag = (elt) => document.createElement(elt);
// create text node
const text = (text) => document.createTextNode(text);
const component = (comp) => {
  let result;
  let button;
  switch(comp['type']) {
    case 'title':
    result = tag('h1');
    result.appendChild(text(comp['content']));
    break;
    case 'text':
    result = tag('p');
    result.innerHTML = comp['content'];
    break;
    case 'modal':
    result = tag('section');
    result.className = "modal";
    const modalContent = tag('div');
    comp['content'].forEach((elt) => {
      modalContent.appendChild(component(elt));
    })
    result.appendChild(modalContent);
    break;
    case 'multiform':
    result = tag('form');
    button = tag('button');
    button.type="submit";
    if (comp.submit) {
      button.appendChild(text(comp.submit));
    } else {
      button.appendChild(text(trad['submit']));
    }
    result.onsubmit = (evt) => {
      evt.preventDefault();
      correct = 0;
      comp.forms.forEach((formId) => {
        if (document.getElementById(formId).classList.contains('correct')) {
          correct++;
        }
      });
      if (correct === comp.forms.length) {
        if (comp.correct) {
          next(`#${comp.correct}`);
        }
      } else {
        if (comp.incorrect) {
          next(`#${comp.incorrect}`);
        }
      }
    }
    result.appendChild(button);
    break;
    case 'form':
    result = tag('form');
    comp['content'].forEach((elt) => {
      result.appendChild(component(elt));
    })
    button = tag('button');
    button.type="submit";
    if (comp.submit) {
      button.appendChild(text(comp.submit));
    } else {
      button.appendChild(text(trad['submit']));
    }
    result.onsubmit = (evt) => {
      evt.preventDefault();
      correct = true;
      result.classList.remove('incorrect');
      result.classList.remove('correct');
      result.childNodes.forEach((node) => {
        node.classList.remove('incorrect');
        node.classList.remove('correct');
        if (typeof node.check === "function") {
          if (node.check() === false) {
            node.classList.add('incorrect');
            correct = false;
          } else {
            node.classList.add('correct');
          }
        }
      });
      if (correct) {
        result.classList.add('correct');
        if (comp.correct) {
          next(`#${comp.correct}`);
        }
      } else {
        result.classList.add('incorrect');
        if (comp.incorrect) {
          next(`#${comp.incorrect}`);
        }
      }
    }
    result.appendChild(button);
    break;
    case 'question':
    result = tag('label');
    result.appendChild(text(comp['question']));
    const input = tag('input');
    input.type = "text";
    result.check = () => {
      if ("caseSensitive" in comp && comp["caseSensitive"]) {
        return input.value == comp['answer'];
      } else {
        return input.value.toLowerCase() == comp['answer'].toLowerCase();
      }
    }
    result.appendChild(input);
    break;
    case 'page':
    result = tag('section');
    const content = tag('div');
    result.appendChild(content);
    comp['content'].forEach((elt) => {
      content.appendChild(component(elt));
    });
    if (typeof comp['contentStyle'] === 'object') {
      for (const [key, value] of Object.entries(comp['contentStyle'])) {
        content.style[key] = value;
      }
    }
    break;
  }
  
  if (typeof comp['id'] === 'string') result.id = comp.id;
  if (typeof comp['style'] === 'object') {
    for (const [key, value] of Object.entries(comp['style'])) {
      result.style[key] = value;
    }
  }

  return result;
};
const init = (config) => {
  config['elements'].forEach((elt) => {
    document.body.appendChild(component(elt));
  });
  if (window.location.hash) {
    next(window.location.hash);
  } else {
    next(`#${config.home}`);
  }
}

const loadFileJSON = () => {
  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open('GET', 'escape.json', true);
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == "200") {
      init(JSON.parse(xobj.responseText));
    }
  };
  xobj.send(null);  
}

const loadStaticJSON = () => {
  const escape = {};
  init(escape);
}

window.addEventListener('load', loadFileJSON, {once: true});
