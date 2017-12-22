const Bacon = require("baconjs/dist/Bacon.js");
const imageList = document.getElementById("imageList");
const searchInput = document.getElementById("searchInput");
const emojis = require("./emojis.json");

const SEARCH = "search",
  SHOW_FAVORITES = "show favorites",
  ADD_TO_FAVORITES = "add to favorites",
  REMOVE_FROM_FAVORITES = "remove from favorites",
  LOAD = "load";

const actions = {
  load: () => ({ message: LOAD }),
  search: text => ({ message: SEARCH, text }),
  showFavorites: () => ({ message: SHOW_FAVORITES }),
  addToFavorites: emoji => ({
    message: ADD_TO_FAVORITES,
    emoji
  }),
  removeFromFavorites: emoji => ({
    message: REMOVE_FROM_FAVORITES,
    emoji
  })
};

const FAVORITES = "favorites",
  EMOJI_LIST = "emoji_list";

let state = {
  searchText: "",
  emojis: emojis,
  show: FAVORITES,
  show_interval: false,
  emojiKeys: Object.keys(emojis),
  favEmojis: []
};

const update = action => {
  console.log(action);
  switch (action.message) {
    case LOAD: {
      if (localStorage.favEmojis) {
        state = { ...state, favEmojis: JSON.parse(localStorage.favEmojis) };
      }
      break;
    }

    case SEARCH: {
      if (action.text) {
        state = {
          ...state,
          searchText: action.text,
          show: EMOJI_LIST,
          show_interval: true
        };
      } else {
        state = { ...state, searchText: "", show: FAVORITES };
      }
      break;
    }

    case SHOW_FAVORITES: {
      state = { ...state, searchText: "", show: FAVORITES };
      break;
    }

    case ADD_TO_FAVORITES: {
      const { favEmojis } = state;
      const newFavEmojis = [...favEmojis, action.emoji];
      state = { ...state, favEmojis: newFavEmojis, show_interval: false };
      localStorage.setItem("favEmojis", JSON.stringify(newFavEmojis));
      break;
    }

    case REMOVE_FROM_FAVORITES: {
      const { favEmojis } = state;
      const newFavEmojis = favEmojis.filter(emoji => emoji !== action.emoji);
      state = { ...state, favEmojis: newFavEmojis, show_interval: false };
      localStorage.setItem("favEmojis", JSON.stringify(newFavEmojis));
      break;
    }
  }

  render();
};

document.addEventListener("DOMContentLoaded", function(event) {
  update(actions.load());
});

const showEmojiList = () => {
  const { searchText, emojiKeys } = state;
  const text = searchText.toLowerCase();
  const emojiList = emojiKeys
    .filter(
      key => (text.length < 3 ? key.startsWith(text) : key.includes(text))
    )
    .map(key => {
      const imgClassNames = state.favEmojis.includes(key)
        ? "fav emoji"
        : "emoji";

      const itemClassNames = state.favEmojis.includes(key)
        ? "item favitem"
        : "item";

      return `
          <div class="${itemClassNames}">
            <p> <strong> ${key} </strong> </p>
            <p> <img class="${imgClassNames}" alt=${key} 
            src=${emojis[key]}> </p>
          </div>`;
    });

  const firstItem = `
    <div class='item'>
      <p> <strong> Tap or click to add to favorites </strong> </p>
    </div>`;

  return emojiList.length === 0
    ? showNoResults()
    : [firstItem, ...emojiList].join("");
};

const render = () => {
  document.getElementById("searchInput").value = state.searchText;

  switch (state.show) {
    case FAVORITES: {
      renderFavorites();
      break;
    }
    case EMOJI_LIST: {
      renderEmojiList();
      break;
    }
  }
};

const renderEmojiList = () => {
  const { searchText, show_interval } = state;
  if (show_interval) {
    imageList.classList.add("pre-animation");
    setTimeout(() => {
      imageList.innerHTML = showEmojiList(searchText);
      imageList.classList.remove("pre-animation");
    }, 300);
  } else {
    imageList.innerHTML = showEmojiList(searchText);
  }
};

const renderFavorites = () => {
  imageList.innerHTML = showFavorites();
};

const inputStream = Bacon
  // stream of input events from the search input field
  .fromEvent(searchInput, "input")
  // Wait 300 ms between events
  .debounce(300)
  // Get the input value
  .map(e => e.target.value);

// Re-render list on each value received from the input stream
inputStream.onValue(text => {
  update(actions.search(text));
});

const emojiClickStream = Bacon
  // stream of click events anywhere in the document
  .fromEvent(document.body, "click")
  // Only listen to clicks on emojis
  .filter(e => e.target.classList.contains("emoji"))
  // Getting emoji name from its 'alt' attribute
  .map(e => e.target.alt);

emojiClickStream.onValue(selectedEmoji => {
  const { favEmojis } = state;
  // If emoji is in favorites, removing it, otherwise adding it
  if (favEmojis.includes(selectedEmoji)) {
    update(actions.removeFromFavorites(selectedEmoji));
  } else {
    update(actions.addToFavorites(selectedEmoji));
  }
});

const favClickStream = Bacon.fromEvent(
  document.getElementById("show-fav"),
  "click"
);

favClickStream.onValue(click => {
  update(actions.showFavorites());
});

const showFavorites = () => {
  const { favEmojis, emojiKeys } = state;
  const emojiList = favEmojis.map(key => {
    return `
        <div class='item favitem'>
          <p> <strong> ${key} </strong> </p>
          <p> <img class="fav emoji" alt=${key} src=${emojis[key]}> </p>
        </div>`;
  });

  const firstItem = `
    <div class='item'>
      <p> <strong> Tap or click to remove from favorites </strong> </p>
    </div>`;

  return emojiList.length === 0
    ? showEmptyList()
    : [firstItem, ...emojiList].join("");
};

const showNoResults = () => `
  <div class='item'>
    <p> No Search Results </p>
    <p> 
      <img alt="crying_cat_face" src=${state.emojis["crying_cat_face"]}> 
    </p>
  </div>`;

const showEmptyList = () => `
  <div class='item'>
    <p> Start Typing Above </p>
    <p> 
      <img alt="keyboard" src=${state.emojis["keyboard"]}>
    </p>
  </div>`;

const showLoading = () => `
  <div class='item'>
    <p> Loading... </p>
  </div>`;

const showError = () => `
  <div class='item'>
    <p> Error Fetching Emojis </p>
  </div>`;
