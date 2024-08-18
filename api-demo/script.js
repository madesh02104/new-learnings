const img = document.querySelector('#giphy-image');
const changeBtn = document.querySelector('.change-btn');
const searchBtn = document.querySelector('.search-btn');
const searchBox = document.querySelector('#search-box');

const apiKey = '8AdBqSYyW7wooodr8NwGdiyROd0G1wQp';
let currentSearch = 'cats'; 

function fetchGif(searchTerm = 'cats') {
  fetch(`https://api.giphy.com/v1/gifs/translate?api_key=${apiKey}&s=${searchTerm}`, { mode: 'cors' })
    .then(response => response.json())
    .then(response => {
      if (response.data.length !== 0) {
        img.src = response.data.images.original.url;
      } else {
        handleNoGifFound();
      }
    })
    .catch(() => handleError());
}

function handleError() {
  img.src = 'https://via.placeholder.com/300x300?text=Error+Loading+GIF';
  alert('Something went wrong. Please try again later.');
}

function handleNoGifFound() {
  img.src = 'https://via.placeholder.com/300x300?text=No+GIF+Found'; 
  alert('No GIF found for the search term.');
}

changeBtn.addEventListener('click', () => {
  fetchGif(currentSearch);
});

searchBtn.addEventListener('click', () => {
  currentSearch = searchBox.value.trim();
  if (currentSearch) {
    fetchGif(currentSearch);
  } else {
    alert('Please enter a search term.');
  }
});

fetchGif(currentSearch);
