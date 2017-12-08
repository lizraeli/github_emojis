const Bacon = require('baconjs/dist/Bacon.js')
const imageList = document.getElementById('imageList')
const searchInput = document.getElementById('searchInput')
const emojis = require('./emojis.json')

let state = {
  searchText: '',
  emojis: emojis,
  emojiKeys: Object.keys(emojis),
  favEmojis: []
}

const setState = (newState) => {
  state = { ...state, ...newState }
  if (newState.favEmojis) {
    localStorage.setItem('favEmojis', JSON.stringify(newState.favEmojis))
    render(100)
  } else {
    render(300)
  }
}

document.addEventListener("DOMContentLoaded", function (event) {
  if (localStorage.favEmojis) {
    setState({
      favEmojis: JSON.parse(localStorage.favEmojis)
    })
  } else {
    render(100)
  }
})


const showEmojiList = () => {
  const { searchText, emojiKeys } = state;
  const text = searchText.toLowerCase();
  const emojiList =
    emojiKeys
      .filter(key => text.length < 3 ?
        key.startsWith(text) : key.includes(text)
      )
      .map(key => {
        const imgClassNames =
          state.favEmojis.includes(key) ? "fav emoji" : "emoji"

        const itemClassNames =
          state.favEmojis.includes(key) ? "item favitem" : "item"

        return `
          <div class="${itemClassNames}">
            <p> <strong> ${key} </strong> </p>
            <p> <img class="${imgClassNames}" alt=${key} src=${emojis[key]}> </p>
          </div>`
      });

  const firstItem = `
    <div class='item'>
      <p> <strong> Tap or click to add to favorites </strong> </p>
    </div>`

  return emojiList.length === 0 ?
    showNoResults() : [firstItem, ...emojiList].join('')
}

const render = (ms) => {
  const { searchText } = state;
  imageList.classList.add('pre-animation')
  console.log(state)
  setTimeout(() => {
    if (searchText === '') {
      imageList.innerHTML = showFavorites()
    } else {
      imageList.innerHTML = showEmojiList(searchText)
    }
    imageList.classList.remove('pre-animation')
  }, ms)
}

const inputStream = Bacon
  // stream of input events from the search input field
  .fromEvent(searchInput, 'input')
  // Wait 300 ms between events
  .debounce(300)

// Re-render list on each value received from the input stream
inputStream.onValue((e) => {
  setState({ searchText: e.target.value })
})

const clickStream = Bacon
  // stream of click events anywhere in the document
  .fromEvent(document.body, 'click')
  // Only listen to clicks on emojis 
  .filter(e => e.target.classList.contains('emoji'))
  // Getting emoji name from its 'alt' attribute
  .map(e => e.target.alt)

clickStream.onValue((selectedEmoji) => {
  const { favEmojis } = state;
  // If emoji is in favorites, removing it, otherwise adiing it
  if (favEmojis.includes(selectedEmoji)) {
    setState({
      favEmojis: favEmojis.filter(emoji => emoji !== selectedEmoji)
    })
  } else {
    setState({
      favEmojis: [...favEmojis, selectedEmoji]
    })
  }
})

const showFavorites = () => {
  const { favEmojis, emojiKeys } = state;
  const emojiList =
    favEmojis
      .map(key => {
        return `
        <div class='item favitem'>
          <p> <strong> ${key} </strong> </p>
          <p> <img class="fav emoji" alt=${key} src=${emojis[key]}> </p>
        </div>`
      });

  const firstItem = `
    <div class='item'>
      <p> <strong> Your Favorites </strong> </p>
    </div>`

  return emojiList.length === 0 ?
    showEmptyList() : [firstItem, ...emojiList].join('')

}
const showNoResults = () => `
  <div class='item'>
    <p> No Search Results </p>
    <p> 
      <img alt="crying_cat_face" src=${state.emojis['crying_cat_face']}> 
    </p>
  </div>`

const showEmptyList = () => `
  <div class='item'>
    <p> Start Typing Above </p>
    <p> 
      <img alt="keyboard" src=${state.emojis['keyboard']}>
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







