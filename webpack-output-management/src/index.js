// import your function
import myName from './myName';
import printMe from './print.js';

function component() {
  const element = document.createElement('div');
  const btn = document.createElement('button');
  btn.innerHTML = 'Click me and check the console!';
  btn.onclick = printMe;

  element.appendChild(btn);

  // use your function!
  element.textContent = myName('Madesh');
  return element;
}

document.body.appendChild(component());
