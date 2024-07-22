// import your function
import myName from './myName';
import './style.css';
// !!credits!! icon author : https://www.flaticon.com/packs/tourism-16138565
import Icon from './information.png';
import Data from './data.xml';
import Notes from './data.csv';

function component() {
  const element = document.createElement('div');

  // use your function!
  element.textContent = myName('Madesh');
  element.classList.add('hello');

  // Add the image to our existing div.
  const myIcon = new Image();
  myIcon.src = Icon;

  element.appendChild(myIcon);

  console.log(Data);
  console.log(Notes);

  return element;
}

document.body.appendChild(component());
