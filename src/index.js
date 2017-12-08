const Bacon = require('baconjs/dist/Bacon.js')
const imageList = document.getElementById('imageList')
const searchInput = document.getElementById('searchInput')

let searchText = '';
let nextSearchText = '';
let changed = false;
let emojis = {};
let emojiKeys = [];

document.addEventListener("DOMContentLoaded", function (event) {
  fetch('https://api.github.com/emojis')
    .then(res => res.json())
    .then(data => {
      emojis = data;
      emojiKeys = Object.keys(emojis);
      imageList.innerHTML = showEmptyList();
    })
    .catch((err) => {
      console.log(err)
      searchInput.setAttribute('disabled', 'true')
      imageList.innerHTML = showError();
    })
})


const showEmojiList = (searchText) => {
  const text = searchText.toLowerCase();
  const emojiList =
    emojiKeys
      .filter(key => text.length < 3 ?
        key.startsWith(text) : key.includes(text)
      )
      .map(key => `
        <div class='item'>
          <p> <strong> ${key} </strong> </p>
          <p> <img alt=${key} src=${emojis[key]}> </p>
        </div>
      `);

  return emojiList.length === 0 ?
    showNoResults() : emojiList.join('')
}


const inputStream = Bacon
  // stream of input events from the search input field
  .fromEvent(searchInput, 'input')
  // Wait 300 ms between events
  .debounce(300)

// Re-render list on each value received from the input stream
inputStream.onValue((e) => {
  const searchText = e.target.value;
  imageList.classList.add('pre-animation')

  setTimeout(() => {
    imageList.innerHTML =
      searchText === '' ? showEmptyList() : showEmojiList(searchText)
    imageList.classList.remove('pre-animation')
  }, 300)
})


const showNoResults = () => `
  <div class='item'>
    <p> No Search Results </p>
    <p> 
      <img alt="crying_cat_face" src=${emojis['crying_cat_face']}> 
    </p>
  </div>`
  
const showEmptyList = () => `
  <div class='item'>
    <p> Start Typing Above </p>
    <p> 
      <img alt="keyboard" src=${emojis['keyboard']}>
    </p>
  </div>`

const showLoading = () => `
  <div class='item'>
    <p> Loading... </p>
  </div>`

const showError = () => `
  <div class='item'>
    <p> Error Fetching Emojis </p>
  </div>`







