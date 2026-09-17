let me_data;
let game_data;
let studio_data;
let all_games;
let games_active = []
let games_number = []
let group_search = []
let saved_avatars = []
let certain_game_data;
let certain_user_data;
let active_ccu = 0;
let config;

let is_search_options = false;

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

console.log("test")

async function get_user_data() {
    const response = await fetch("https://playvortex.io/me");
    me_data = await response.json();
}

/*async function get_game_data() {
  const response = await fetch("https://playvortex.io/api/game-stats");
  game_data = await response.json();
}*/
async function get_game_data() {
  console.log("GAME DATA: starting");

  const response = await fetch("https://playvortex.io/api/game-stats");

  console.log("GAME DATA: response received", response.status);

  game_data = await response.json();

  //console.log("GAME DATA: JSON received");
}

async function get_groupsearch_data(search) {
  const response = await fetch(`https://playvortex.io/api/groups?q=${search}&sort=members&page=0`)
  group_search = await response.json()
}

async function get_studio_data() {
  const response = await fetch("https://playvortex.io/api/studio-stats");
  studio_data = await response.json();
}

async function get_all_games() {
  const response = await fetch("https://playvortex.io/api/games");
  all_games = await response.json();
}

async function get_certain_game_data(game_id) {
  const response = await fetch(`https://playvortex.io/api/games/${game_id}`);
  certain_game_data = await response.json();
}

async function get_certain_user_data(user_id) {
  const response = await fetch(`https://playvortex.io/api/users/${user_id}`);
  certain_user_data = await response.json();
}

async function getSavedAvatars() {
  const { savedAvatars = {} } = await browser.storage.local.get("savedAvatars");

  console.log('saved avatars: ', savedAvatars)
  saved_avatars = savedAvatars

}

async function setSavedAvatars(savedAvatars) {

  const { savedAvatars: current_saved_avatars = {} } = await browser.storage.local.get("savedAvatars");

  const newSavedAvatars = { ...current_saved_avatars, ...savedAvatars }

  await browser.storage.local.set({ savedAvatars: newSavedAvatars });
}

async function removeSavedAvatars(savedAvatarName) {
  const { savedAvatars: current_saved_avatars = {} } = await browser.storage.local.get("savedAvatars");

  delete current_saved_avatars[savedAvatarName]

  await browser.storage.local.set({ savedAvatars: current_saved_avatars });
}

async function save_avatar(save_data) {

  const url = "https://playvortex.io/api/clothing/outfit"

  await fetch(url, {
      method: 'PUT',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(save_data)
  })

  .then(response => response.json())
  .then(data => console.log('Avatar updated successfully:', data))
  .catch(error => console.error('Error:', error));

  return;
}

function get_current_avatar_data() {

  let current_data = []

  for (let element of document.querySelector("#market-grid").children) {

    if (element.classList.contains('catalog-section-divider')) {
      currentCategory = element.textContent.trim();
      continue;
    }

    if (element.classList.contains('equipped')) {
      current_data.push(`${currentCategory}/${element.querySelector("img").src.split("/")[6].trim()}`)
    }

    //console.log(`Item: ${element.querySelector(".item-name").textContent.trim()} | Category: ${currentCategory}`);


    element.dataset.category = currentCategory;
  }

  let isShirt = Number(current_data[0].split("/")[1])
  let isPants = Number(current_data[1].split("/")[1])

  if (current_data[0].split("/")[0] != "Shirts" || current_data[1].split("/")[0] != "Pants") {
    // was it no shirt that was true?
    if (current_data[0].split("/")[0] != "Shirts") {
      isShirt = null
      isPants = Number(current_data[0].split("/")[1])
    }

    // was it no pants that was true?
    if (current_data[1].split("/")[0] != "Pants") {
      isPants = null
    }
  }

  // now time for accessories :/

  let accessories_data = []

  const accessories = {
    Hats: false,
    Hair: false,
    Face: false,
    Neck: false,
    Front: false,
    Back: false,
    Waist: false
  }

  for (let element of document.querySelector("#market-grid").children) {

    if (element.classList.contains('catalog-section-divider')) {
      currentCategory = element.textContent.trim();
      continue;
    }

    const blacklistedCategories = ["Shirts", "Pants", "Faces"]

    if (element.classList.contains('equipped') && !blacklistedCategories.includes(currentCategory)) {
      accessories_data.push(`${currentCategory}/${element.querySelector("img").src.split("/")[6].trim()}`)

      if (accessories[currentCategory.split(" ")[0]] != null) {
        accessories[currentCategory.split(" ")[0]] = true
      }
    }


    element.dataset.category = currentCategory;
  }


  const accessories_send = []

  accessories_data.forEach((accessory) => {
    accessories_send.push(Number(accessory.split("/")[1]))
  })

  function hexrgb(element_name) {
    let r = Number(document.querySelector(`#${element_name}`).style.background.split(",")[0].slice(4))
    let g = Number(document.querySelector(`#${element_name}`).style.background.split(",")[1].slice(1))
    let b = Number(document.querySelector(`#${element_name}`).style.background.split(",")[2].slice(1, -1))
    return "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("");
  }

  const data = {
    "shirt_id": isShirt,
    "pant_id": isPants,
    "body_type": document.querySelectorAll(".body-type-btn")[0].classList.contains("active") ? "male" : "female",
    "body_colors": [
      hexrgb("swatch-0"),
      hexrgb("swatch-1"),
      hexrgb("swatch-2"),
      hexrgb("swatch-3"),
      hexrgb("swatch-4"),
      hexrgb("swatch-5")
    ],
    "face_id": Number(document.querySelector(".face-card.equipped").querySelector("img").src.split("/")[6]),
    "accessory_ids": accessories_send
  }

  console.log("data", data)

  return data
}

const formatNumber = (num) =>
  new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);

async function search() {

  const template = document.createElement("template");

  document.querySelector("#search-form").autocomplete = "off"

  const vp_search_options_container = document.createElement("div")
  vp_search_options_container.id = "vp-search-options-container"
  vp_search_options_container.style.position = "absolute"

  const vp_search_player_container = document.createElement("div")
  vp_search_player_container.id = "vp-search-player-container"
  vp_search_player_container.classList.add("vp-search-container")

  Object.assign(vp_search_player_container.style, {
    width: '455px',
    height: '50px',
    position: 'absolute',
    top: '45px',
    display: 'inherit',
    cursor: 'pointer',
  })

  const vp_search_player_text = document.createElement("div")
  vp_search_player_text.id = "vp-search-player-text"
  vp_search_player_text.textContent = "Search in Players..."

  Object.assign(vp_search_player_text.style, {
    color: '#fff !important',
    margin: '13px 0px 0 20px',
    width: '100%'
  })

  const vp_search_games_container = document.createElement("div")
  vp_search_games_container.id = 'vp-search-games-container'
  vp_search_games_container.classList.add('vp-search-container')

  Object.assign(vp_search_games_container.style, {
    width: '455px',
    height: '50px',
    position: 'absolute',
    top: '95px',
    display: 'inherit',
    color: '#8283ff !important',
    margin: 'auto',
    cursor: 'pointer'
  })

  const vp_search_games_text = document.createElement("div")
  vp_search_games_text.id = "vp-search-games-text"
  vp_search_games_text.textContent = 'Search in Games...'

  Object.assign(vp_search_games_text.style, {
    color: '#fff !important',
    margin: '13px 20px',
  })

  const vp_search_groups_container = document.createElement("div")
  vp_search_groups_container.id = 'vp-search-groups-container'
  vp_search_groups_container.classList.add("vp-search-container")

  Object.assign(vp_search_groups_container.style, {
    width: '455px',
    position: 'absolute',
    top: '145px',
    display: 'inherit',
    color: '#8283ff !important',
    margin: 'auto',
    cursor: 'pointer'
  })

  const vp_search_groups_text = document.createElement("div")
  vp_search_groups_text.id = "vp-search-groups-text"
  vp_search_groups_text.textContent = "Search in Groups..."

  Object.assign(vp_search_groups_text.style, {
    color: '#fff !important',
    margin: '13px 20px'
  })


  //<div style="color: #fff !important;margin: 13px 20px;" id="vp-search-groups-text">Search in Groups...</div></div><div></div></div>
  //<div style="width: 455px;height: 50px;position: absolute;top: 145px;display: inherit;z-index: 100;color: #8283ff !important;margin: auto;cursor: pointer;" id="vp-search-groups-container" class="vp-search-container">
  //<div style="color: #fff !important;margin: 13px 20px;" id="vp-search-games-text">Search in Games...</div></div>
  //<div style="width: 455px;height: 50px;position: absolute;top: 95px;display: inherit;z-index: 100;color: #8283ff !important;margin: auto;cursor: pointer;" id="vp-search-games-container" class="vp-search-container">
  //<div id="vp-search-player-text" style="color: #fff !important;margin: 13px 0px 0 20px;width: 100%;">Search in Players...</div>
  //<div style="width: 455px;height: 50px;position: absolute;top: 45px;display: inherit;z-index: 100;cursor: pointer;" id="vp-search-player-container" class="vp-search-container">

  document.querySelector("#search-form").append(vp_search_options_container)

  vp_search_options_container.append(vp_search_player_container)
  vp_search_options_container.append(vp_search_games_container)
  vp_search_options_container.append(vp_search_groups_container)

  vp_search_player_container.append(vp_search_player_text)
  vp_search_games_container.append(vp_search_games_text)
  vp_search_groups_container.append(vp_search_groups_text)

  document.querySelector("#vp-search-options-container").style.display = "none";

  document.querySelector("#vp-search-player-container").addEventListener("click", () => {
    browser.runtime.sendMessage({
      action: "redirect",
      url: `${window.location.origin}/search?q=${encodeURIComponent(
        document.querySelector("#search-input").value
      )}`

    });
  })

  document.querySelector("#vp-search-groups-container").addEventListener("click", () => {
    browser.runtime.sendMessage({
      action: "redirect",
      url: `${window.location.origin}/search?vp_q_gr=${encodeURIComponent(
        document.querySelector("#search-input").value
      )}`

    });
  })

  document.querySelector("#vp-search-games-container").addEventListener("click", () => {
    browser.runtime.sendMessage({
      action: "redirect",
      url: `${window.location.origin}/search?vp_q_ga=${encodeURIComponent(
        document.querySelector("#search-input").value
      )}`

    });
  })

  document.querySelector("#search-input").addEventListener("click", () => {
    console.log("clicked lol")
    document.querySelector("#vp-search-options-container").style.display = "block";
  })

  document.addEventListener('click', (event) => {
    if (!document.querySelector("#search-input").contains(event.target)) {
      document.querySelector("#vp-search-options-container").style.display = "none";
    }
  })

  if (window.location.pathname.startsWith("/search")) {
    // group search?
    if (window.location.href.includes("/search?vp_q_gr")) {

      console.log("wsg chat")

      document.querySelector(".page").style.maxWidth = "1400px"

      const searchquery = window.location.href.split("=")[1]

      if (searchquery.trim()) {

        await get_groupsearch_data(searchquery);

        document.querySelector(".info-msg").remove()

        const searchgrid = document.createElement("div")

        searchgrid.id = "search_grid_group"
        searchgrid.style.display = "grid";
        searchgrid.style.gridTemplateColumns = "repeat(3, 1fr)"
        searchgrid.style.gap = "0.875rem"

        document.querySelector(".page").append(searchgrid)

        group_search.items.forEach((element) => {

          const grp_card = document.createElement("div")
          grp_card.classList.add("grp-card")

          Object.assign(grp_card.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '1.35rem',
            minWidth: '0',
            padding: '1.25rem',
            background: '#171020',
            border: '1px solid #24242f',
            borderRadius: '14px',
            transition: 'border-color 0.15s'
          });

          const grp_card_link = document.createElement("div")
          grp_card_link.classList.add("grp-card-link")

          grp_card_link.href = `/groups/${element.id}`

          Object.assign(grp_card_link.style, {
            display: 'flex',
            gap: '1rem',
            textDecoration: 'none',
            color: 'inherit',
            flex: '1',
            minHeight: '0'
          })

          const grp_card_icon = document.createElement("img")
          grp_card_icon.classList.add("grp-card-icon")
          grp_card_icon.src = "/group-default.webp"
          grp_card_icon.alt = "Vortex"

          Object.assign(grp_card_icon.style, {
            width: 'clamp(72px, 22%, 100px)',
            aspectRatio: '1',
            height: 'auto',
            borderRadius: '10px',
            objectFit: 'contain',
            background: '#12121b',
            flexShrink: '0'
          })

          const grp_card_text = document.createElement("span")
          grp_card_text.classList.add("gpr-card-text")

          Object.assign(grp_card_text.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.3rem',
            flex: '1',
            minWidth: '0'
          })

          const grp_card_name = document.createElement("span");
          grp_card_name.classList.add("grp-card-name")
          grp_card_name.textContent = element.name

          Object.assign(grp_card_name.style, {
            fontWeight: '700',
            fontSize: '1.125rem',
            color: '#fff',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          })

          const grp_card_desc = document.createElement("span");
          grp_card_desc.classList.add("grp-card-desc")
          grp_card_desc.textContent = element.description.length > 275 ? element.description.slice(0, 150) + "..." : element.description

          Object.assign(grp_card_desc.style, {
            fontSize: '0.875rem',
            lineHeight: '1.45',
            color: '#8a8a9c',
            display: '-webkit-box',
            overflow: 'hidden'
          })

          const grp_card_bottom = document.createElement("div")
          grp_card_bottom.classList.add("grp-card-bottom")

          Object.assign(grp_card_bottom.style, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginTop: 'auto'
          })

          const grp_card_meta = document.createElement("div")
          grp_card_meta.classList.add("grp-card-meta")

          Object.assign(grp_card_meta.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
            minWidth: '0'
          })

          const grp_card_owner = document.createElement("a")
          grp_card_owner.classList.add("grp-card-owner")
          grp_card_owner.href = `/users/${element.owner_id}/profile`
          grp_card_owner.textContent = element.owner_username

          Object.assign(grp_card_owner.style, {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            maxWidth: '100%',
            minWidth: '0',
            fontSize: '0.9375rem',
            fontWeight: '700',
            color: '#a78bfa',
            textDecoration: 'none'
          })

          const crown_icon = document.createElement("i")
          crown_icon.classList.add('fa-solid')
          crown_icon.classList.add('fa-crown')

          const grp_card_members = document.createElement("span")
          grp_card_members.classList.add("grp-card-members")
          grp_card_members.textContent = element.member_count

          Object.assign(grp_card_members.style, {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            minWidth: '0',
            fontSize: '0.875rem',
            color: '#8a8a9c'
          })

          const members_icon = document.createElement("i")
          members_icon.classList.add("fa-solid")
          members_icon.classList.add("fa-user-group")

          const grp_card_join = document.createElement("grp-card-join")
          grp_card_join.classList.add("btn-primary")
          grp_card_join.classList.add("grp-card-join")
          grp_card_join.textContent = 'Join'

          //<button type="button" class="btn-primary grp-card-join">Join</button>

          //<span class="grp-card-members" style="display: inline-flex;align-items: center;gap: 0.5rem;min-width: 0;font-size: 0.875rem;color: #8a8a9c;">

          //<a class="grp-card-owner" href="/users/${element.owner_id}/profile" style="display: inline-flex;align-items: center;gap: 0.45rem;max-width: 100%;min-width: 0;font-size: 0.9375rem;font-weight: 700;color: #a78bfa;text-decoration: none;">

          //<div class="grp-card-meta" style="display: flex;flex-direction: column;gap: 0.2rem;min-width: 0;">

          //<div class="grp-card-bottom" style="display: flex;align-items: center;justify-content: space-between;flex-wrap: wrap;gap: 0.75rem;margin-top: auto;">

          //<span class="grp-card-desc" style="font-size: 0.875rem;line-height: 1.45;color: #8a8a9c;display: -webkit-box;-webkit-line-clamp: 2;line-clamp: 2;-webkit-box-orient: vertical;overflow: hidden;"></span>

          //<span class="grp-card-name" style="font-weight: 700;font-size: 1.125rem;color: #fff;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;">${element.name}</span>

          //<span class="grp-card-text" style="display: flex;flex-direction: column;gap: 0.3rem;flex: 1;min-width: 0;"

          //<img class="grp-card-icon" src="/group-default.webp" alt="Vortex" style="width: clamp(72px, 22%, 100px);aspect-ratio: 1;height: auto;border-radius: 10px;object-fit: contain;background: #12121b;flex-shrink: 0;">

          //<a class="grp-card-link" href="/groups/${element.id}" style="display: flex;gap: 1rem;text-decoration: none;color: inherit;flex: 1;min-height: 0;">

          searchgrid.append(grp_card)

          grp_card.append(grp_card_link)
          grp_card_link.append(grp_card_icon)
          grp_card_link.append(grp_card_text)
          grp_card_text.append(grp_card_name)
          grp_card_text.append(grp_card_desc)

          grp_card.append(grp_card_bottom)
          grp_card_bottom.append(grp_card_meta)

          grp_card_meta.append(grp_card_owner)

          grp_card_owner.prepend(crown_icon)

          grp_card_meta.append(grp_card_members)

          grp_card_members.prepend(members_icon)

          grp_card_bottom.append(grp_card_join)

        })
      } else {
        document.querySelector(".info-msg").textContent = "Search for a group above."
      }
    }
    // game search?
    if (window.location.href.includes("/search?vp_q_ga")) {

      const searchgrid = document.createElement("div")

      const searchquery = window.location.href.split("=")[1]

      if (!searchquery) {
        document.querySelector(".info-msg").textContent = "Search for a game above."
      } else {
        document.querySelector(".info-msg").remove()
      }

      document.querySelector(".page").style.maxWidth = "1400px"

      searchgrid.id = "search_grid_game"
      searchgrid.style.display = "grid";
      searchgrid.style.gridTemplateColumns = "repeat(3, 1fr)"
      searchgrid.style.gap = "0.875rem"

      document.querySelector(".page").append(searchgrid)

      await get_all_games();


      const query = searchquery.toLowerCase().trim()

      // we do NOT want to get each game with the get_certain_game_data function, or its going to be a guaranteed rate limit

      all_games.forEach(async (element) => {

        let match = false

        const game_name_query = element.name.toLowerCase().trim()
        if (game_name_query.includes(query)) {
          match = true
        }

        if (match && searchquery) {

          const grp_card = document.createElement("div")
          grp_card.classList.add("grp-card")

          Object.assign(grp_card.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '1.35rem',
            background: '#171020',
            border: '1px solid #24242f',
            borderRadius: '14px',
            padding: '1rem 0.75rem 0.875rem',
            transition: 'border-color 0.15s'
          })

          const grp_card_link = document.createElement("a")
          grp_card_link.classList.add("grp_card_link")

          Object.assign(grp_card_link.style, {
            display: 'flex',
            gap: '1rem',
            textDecoration: 'none',
            color: 'inherit',
            flex: '1',
            minHeight: '0',
            flexDirection: 'column'
          })

          const grp_card_icon = document.createElement("img")
          grp_card_icon.classList.add("grp-card-icon")
          grp_card_icon.alt = "Vortex"
          grp_card_icon.src = `/assets/thumbnails/${element.id}`

          Object.assign(grp_card_icon.style, {
            aspectRatio: '1',
            height: '200px',
            borderRadius: '10px',
            objectFit: 'contain',
            flexShrink: '0',
            width: '90%'
          })

          const grp_card_text = document.createElement("span")
          grp_card_text.classList.add("grp-card-text")

          Object.assign(grp_card_text.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.3rem',
            flex: '1',
            minWidth: '0'
          })

          const grp_card_name = document.createElement("span")
          grp_card_name.classList.add("grp-card-name")
          grp_card_name.textContent = element.name

          Object.assign(grp_card_name.style, {
            fontWeight: '700',
            fontSize: '1.125rem',
            color: '#fff',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          })

          const grp_card_desc = document.createElement("span")
          grp_card_desc.classList.add("grp-card-desc")
          grp_card_desc.textContent = element.description

          Object.assign(grp_card_desc.style, {
            fontSize: '0.875rem',
            lineHeight: '1.45',
            color: '#8a8a9c',
            display: '-webkit-box',
            overflow: 'hidden'
          })

          const grp_card_bottom = document.createElement("div")
          grp_card_bottom.classList.add("grp-card-bottom")

          Object.assign(grp_card_bottom.style, {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginTop: 'auto'
          })

          const grp_card_meta = document.createElement("div")
          grp_card_meta.classList.add("grp-card-meta")

          Object.assign(grp_card_meta.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
            minWidth: '0'
          })

          const grp_card_owner = document.createElement("a")
          grp_card_owner.classList.add("grp-card-owner")
          grp_card_owner.href = `/users/${element.creator_id}/profile`
          grp_card_owner.textContent = element.creator_name

          Object.assign(grp_card_owner.style, {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            maxWidth: '100%',
            minWidth: '0',
            fontSize: '0.9375rem',
            fontWeight: '700',
            color: '#a87bfa',
            textDecoration: 'none'
          })

          const crown_icon = document.createElement("i")
          crown_icon.classList.add("fa-solid")
          crown_icon.classList.add("fa-crown")

          const grp_card_members = document.createElement("span")
          grp_card_members.classList.add("grp-card-members")
          grp_card_members.textContent = element.player_count

          Object.assign(grp_card_members.style, {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            minWidth: '0',
            fontSize: '0.875rem',
            color: '#8a8a9c'
          })

          const members_icon = document.createElement("i")
          members_icon.classList.add("fa-solid")
          members_icon.classList.add("fa-user-group")

          const page_link = document.createElement("a")
          page_link.href= `/games/${element.id}`

          const page_btn = document.createElement("button")
          page_btn.classList.add("btn-primary")
          page_btn.classList.add("grp-card-join")

          page_btn.textContent = "Go to page";

          searchgrid.append(grp_card)

          grp_card.append(grp_card_link)

          grp_card_link.append(grp_card_icon)
          grp_card_link.append(grp_card_text)

          grp_card_text.append(grp_card_name)
          grp_card_text.append(grp_card_desc)

          grp_card.append(grp_card_bottom)

          grp_card_bottom.append(grp_card_meta)
          grp_card_bottom.append(page_link)

          page_link.append(page_btn)

          grp_card_meta.append(grp_card_owner)

          grp_card_owner.prepend(crown_icon)

          grp_card_meta.append(grp_card_members)

          grp_card_members.prepend(members_icon)

          //<button type="button" class="btn-primary grp-card-join">Go to page</button>
          //<i class="fa-solid fa-user-group"></i>
          //<span class="grp-card-members" style="display: inline-flex;align-items: center;gap: 0.5rem;min-width: 0;font-size: 0.875rem;color: #8a8a9c;">
          //<i class="fa-solid fa-crown"></i>
          //<a class="grp-card-owner" href="/users/${element.creator_id}/profile" style="display: inline-flex;align-items: center;gap: 0.45rem;max-width: 100%;min-width: 0;font-size: 0.9375rem;font-weight: 700;color: #a78bfa;text-decoration: none;">
          //<div class="grp-card-meta" style="display: flex;flex-direction: column;gap: 0.2rem;min-width: 0;">
          //<div class="grp-card-bottom" style="display: flex;align-items: center;justify-content: space-between;flex-wrap: wrap;gap: 0.75rem;margin-top: auto;">
          //<span class="grp-card-desc" style="font-size: 0.875rem;line-height: 1.45;color: #8a8a9c;display: -webkit-box;-webkit-line-clamp: 2;line-clamp: 2;-webkit-box-orient: vertical;overflow: hidden;">${element.description}</span>
          //<span class="grp-card-name" style="font-weight: 700;font-size: 1.125rem;color: #fff;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;">${element.name}</span>
          //<span class="grp-card-text" style="display: flex;flex-direction: column;gap: 0.3rem;flex: 1;min-width: 0;">
          //<img class="grp-card-icon" alt="Vortex" style="aspect-ratio: 1;height: 200px;border-radius: 10px;object-fit: contain;/*! background: #12121b; */flex-shrink: 0;/*! height: auto; */width: 90%;" src="/assets/thumbnails/${element.id}">
          //<a class="grp-card-link" style="display: flex;gap: 1rem;text-decoration: none;color: inherit;flex: 1;min-height: 0;flex-direction: column;">
          //<div class="grp-card" style="display: flex;flex-direction: column;gap: 1.35rem;padding: 1.25rem;background: #171020;border: 1px solid #24242f;border-radius: 14px;transition: border-color 0.15s;">
        }
      })

    }
  }
}

async function navbar() {

  //console.log("TEST SWITCH")

  if (config.profile_username == true) {
    const navbar = document.querySelector(".navbar");
    let username

    if (window.location.pathname === "/home") {
      const greeting_username = document.querySelector("#home-greeting").textContent.split(", ")[1].slice(0, -1)
      username = greeting_username
    } else {
      await get_user_data()
      username = me_data.username
    }

    console.log(username)

    let margin_right = 0;

    username.split("").forEach(() => {
      margin_right += 11
    })
    // each letter adds 11 pixels to the margin to make sure every username is spaced correctly

    document.querySelector("#my-profile").style.marginRight = `${margin_right}px`

    const usertext = document.createElement("a");
    usertext.style.fontSize = "1.2rem";
    usertext.style.fontWeight = "bold";
    usertext.style.textDecoration = "none";
    usertext.style.padding = 0;
    usertext.style.margin = 0;
    usertext.style.position = "absolute";
    usertext.style.color = "white";
    usertext.style.right = "30px";
    usertext.id = "nav-profile-text"
    usertext.textContent = username;

    usertext.href = document.querySelector("#my-profile").href;
    navbar.append(usertext);

    await get_studio_data()

    if (config.vortex_plus_logo == true) {
      document.querySelector(".navbar-logo-img").src = browser.runtime.getURL("images/voprologo.png")
    }
  }

}


async function main() {

  if (window.location.pathname === "/home") {

    // rule of thumb here: do the things that dont require a network request first

    // friends

    const page = document.querySelector(".page")
    const friends_section = document.querySelector('#friends-section');

    page.insertBefore(friends_section, page.children[1]);

    // random greeting

    const username = document
            .querySelector("#home-greeting")
            .textContent
            .split(" ")[1]
            .slice(0, -1);

        const greetings = ["Hello", "Hey", "Whats up", "Hows it going"];
        const random_greeting =
            greetings[Math.floor(Math.random() * greetings.length)];

        const full_greeting = `${random_greeting}, ${username}!`;

    document.querySelector("#home-greeting").textContent = full_greeting;

      // add visits

      await get_game_data()

      const game_links = document.querySelectorAll("#games-grid a");

      game_links.forEach(element => {
        const href = element.getAttribute("href");
        const game_number = href.split("/").pop();

        const visits_full = game_data[game_number].visits

        const visits = String(formatNumber(visits_full))

        // so fun fact, now that we are in each game, we can actually see the amount of active ccu by adding everything up.
        // and it doesnt require another request!

        const active_players = Number(game_data[game_number].active)
        active_ccu += active_players

        games_active.push(active_players)
        games_number.push(game_number)


        const visits_template_span = document.createElement("span")
        visits_template_span.classList.add("game-stat-value")
        visits_template_span.style.fontSize = "0.75rem"
        visits_template_span.style.color = "#8a8a9c"

        const visits_template_i = document.createElement("i")
        visits_template_i.classList.add("fa-solid")
        visits_template_i.classList.add("fa-eye")
        visits_template_i.style.fontSize = "0.75rem"

        visits_template_span.append(visits_template_i, document.createTextNode(String(visits)))

        element.querySelector(".game-card-meta").append(visits_template_span)
      });

    await get_studio_data();
    active_ccu += studio_data.active

    console.log(`active ccu: ${active_ccu}`)

    // stats

    await get_all_games() // another request but this one is necessary to see what the game name is

    const game_biggest_ccu = Math.max(...games_active)
    const game_biggest_ccu_id = games_number[games_active.indexOf(game_biggest_ccu)]
    let game_biggest_ccu_name;

    all_games.forEach(game => {
      if (game.id == game_biggest_ccu_id) {
        console.log("game id:", game.id)
        console.log("game name:", game.name)
        game_biggest_ccu_name = game.name
      }
    })

    const home_intro_body = document.querySelector(".home-intro-text")

    const most_popular_game_link = document.createElement("a");

    most_popular_game_link.classList.add("btn-play")
    most_popular_game_link.style.width = "90px"
    most_popular_game_link.href = `/games/${game_biggest_ccu_id}/play`
    most_popular_game_link.textContent = "Play"

    const active_ccu_element = document.createElement("h3");
    const active_ccu_i = document.createElement("i");

    active_ccu_i.classList.add("fa-solid")
    active_ccu_i.classList.add("fa-users")
    active_ccu_i.style.display = "inline"

    active_ccu_element.style.marginBottom = "15px"
    active_ccu_element.style.fontWeight = "normal"

    const most_popular_game_element = document.createElement("h3")
    const most_popular_game_i = document.createElement("i")

    most_popular_game_element.style.fontWeight = "normal"

    most_popular_game_i.classList.add("fa-solid")
    most_popular_game_i.classList.add("fa-users")

    most_popular_game_element.append(document.createTextNode(`Most popular game: ${game_biggest_ccu_name} with `), most_popular_game_i, document.createTextNode(` ${game_biggest_ccu}`))

    active_ccu_element.append(document.createTextNode("Active CCU: "), active_ccu_i, document.createTextNode(` ${active_ccu}`))

    home_intro_body.append(active_ccu_element)
    home_intro_body.append(most_popular_game_element)
    home_intro_body.append(most_popular_game_link)


      // player icons (offline, online, in-game)

    //await get_friends_data()
    // so we can actually use yet another trick, the text actually gets the player data so we
    // read the text and then delete it, so we dont need to make another request

    const friends_links = document.querySelectorAll("#friends-row a");

    friends_links.forEach(element => {
      /*const href = element.getAttribute("href");
      console.log("href: ", href)
      const game_number = href.split("/")[2]
      console.log("game number: ", game_number)*/

      const status_icon_span = document.createElement("span");

      const status_txt = element.querySelector(".friend-status").textContent
      let status
      let offline = false

      if (status_txt == "In Game") {
        status = "in-game"
        status_icon_span.style.background = '#16a34a'
      } else if (status_txt == "Online") {
        status = "online"
        status_icon_span.style.background = '#2563eb'
      } else if (status_txt == "In Studio") {
        status = "in-studio"
        status_icon_span.style.background = '#a78bfa'
      } else if (status_txt == "Offline") {
        status = "offline"
        status_icon_span.style.background = 'gray'
      }

      status_icon_span.classList.add("status-dot")
      status_icon_span.classList.add("in")
      status_icon_span.style.position = "relative"
      status_icon_span.style.bottom = "53px"
      status_icon_span.style.right = "-52px"
      status_icon_span.style.width = "12px"
      status_icon_span.style.height = "12px"

      element.append(status_icon_span)


    });

  }
}

async function games_page() {
  if (window.location.pathname.startsWith("/games/")) {
    const gameid = window.location.pathname.split("/")[2];

    await get_certain_game_data(gameid)
    await get_game_data()

    document.querySelectorAll(".game-stat-value")[1].append(document.createElement("div").textContent = ` (${game_data[gameid].visits})`)

    let i = 0
    let s = 0

    await wait(1000)

    const avatarElements = Array.from(document.querySelectorAll(".server-avatar-grid"));

    certain_game_data.instances.forEach(server => {
      const current_server = avatarElements[s].children
      server.user_ids.forEach(profile_pfp => {
        if (i == 5) { return }

        const profile_element = current_server[i]

        const link_element = document.createElement('a');
        link_element.className = `link-${i}`;
        link_element.href = `/users/${profile_pfp}/profile`

        profile_element.parentNode.insertBefore(link_element, profile_element);
        link_element.appendChild(profile_element);
        i += 1
      })
      s++
      i = 0
    })
  }
}

async function volts_page() {

  if (window.location.pathname === "/volts" && config.theme == "6") {
    console.log("wsg")
    document.querySelectorAll(".volts-card").forEach((element) => { element.children[0].style.filter = "saturate(0)" })
  }

  /*
  await get_user_data()
  if (window.location.pathname.startsWith("/users/")) {
    if (Number(window.location.pathname.split("/")[2]) == me_data.id) {
      const edit_icon_template = document.createElement("template")
      const edit_icon = edit_icon_template.content.firstElementChild

      const waitForButton = setInterval(() => {
        const button = document.querySelector(".btn-secondary");

        if (button) {
          clearInterval(waitForButton);

          button.style.border = "none"
          button.textContent = ""

          button.append(edit_icon)
        }
      }, 100);
    }
  }*/
}

function commands() {
  const q = new URLSearchParams(window.location.search).get("q");

  if (window.location.pathname === "/search" && q?.startsWith("/volts set ")) {
    const amount = Number(String(window.location).split("+")[2]);
    console.log(amount)

    const success = document.createElement("h1")
    success.textContent = `Vortex command: volts set ${amount} sucessfully ran`

    document.querySelector("#navbar-volts-count").textContent = amount
    alert(success.textContent)
  }
}

function themes(theme) {
  if (theme == "1") { }
  if (theme == "2") {
    document.documentElement.style.setProperty("--background-gradient", "linear-gradient(180deg, hsl(0, 100%, 33.9%) 0%, hsl(354.3, 77.7%, 57.8%) 100%)")
    document.documentElement.style.setProperty("--navbar-bg-gradient", "linear-gradient(to bottom, #c9492c, #911313)")
    document.documentElement.style.setProperty("--navbar-search-bg", "#ab0000")
    document.documentElement.style.setProperty("--navbar-search-icon-color", "#ff8282")
    document.documentElement.style.setProperty("--navbar-search-text-color", "#ffffff")
    document.documentElement.style.setProperty("--play-btn-bg", "red")
    document.documentElement.style.setProperty("--games-bg", "linear-gradient(to bottom, #c9422c, #911313)")
    document.documentElement.style.setProperty("--footer-bg", "#600000")
    document.documentElement.style.setProperty("--bio-box-bg", "#6e0000")
    document.documentElement.style.setProperty("--profile-info-panel-bg", "#6e0000")
    document.documentElement.style.setProperty("--biotext-area-bg", "#800c0c")
    document.documentElement.style.setProperty("--btn-primary-bg", "#ed3a3a")
    document.documentElement.style.setProperty("--btn-primary-bg-hover", "#ba2626")
    document.documentElement.style.setProperty("--game-description-box-bg", "#8f0808")
    document.documentElement.style.setProperty("--server-card-bg", "#520000")
    document.documentElement.style.setProperty("--download-bg", "linear-gradient(180deg, hsl(0, 100%, 16.5%) 0%, hsl(0, 69.6%, 40%) 100%)")
    document.documentElement.style.setProperty("--volts-deg", "100deg")
  }
  if (theme == "3") {
    document.documentElement.style.setProperty("--background-gradient", "linear-gradient(180deg, hsl(19.8, 100%, 33.9%) 0%, hsl(16.9, 77.7%, 57.8%) 100%)")
    document.documentElement.style.setProperty("--navbar-bg-gradient", "linear-gradient(to bottom, #c9512c, #913c13)")
    document.documentElement.style.setProperty("--navbar-search-bg", "#ab3000")
    document.documentElement.style.setProperty("--navbar-search-icon-color", "#ffab82")
    document.documentElement.style.setProperty("--navbar-search-text-color", "#fff")
    document.documentElement.style.setProperty("--play-btn-bg", "orange")
    document.documentElement.style.setProperty("--games-bg", "linear-gradient(to bottom, #c9422c, #913c13)")
    document.documentElement.style.setProperty("--footer-bg", "#602d00")
    document.documentElement.style.setProperty("--bio-box-bg", "#ab3000")
    document.documentElement.style.setProperty("--profile-info-panel-bg", "#ab3000")
    document.documentElement.style.setProperty("--biotext-area-bg", "#80420c")
    document.documentElement.style.setProperty("--btn-primary-bg", "#e36c3e")
    document.documentElement.style.setProperty("--btn-primary-bg-hover", "#da6639")
    document.documentElement.style.setProperty("--game-description-box-bg", "#ab3000")
    document.documentElement.style.setProperty("--server-card-bg", "#7e3f26")
    document.documentElement.style.setProperty("--download-bg", "linear-gradient(180deg, hsl(20, 100%, 16.5%) 0%, hsl(19.9, 69.6%, 40%) 100%)")
    document.documentElement.style.setProperty("--volts-deg", "500deg")
  }
  if (theme == "4") {
    document.documentElement.style.setProperty("--background-gradient", "linear-gradient(180deg, hsl(109.6, 100%, 33.9%) 0%, hsl(149.1, 77.7%, 57.8%) 100%)")
    document.documentElement.style.setProperty("--navbar-bg-gradient", "linear-gradient(to bottom, #89c92c, #13911b)")
    document.documentElement.style.setProperty("--navbar-search-bg", "#00600a")
    document.documentElement.style.setProperty("--navbar-search-icon-color", "#82ff84")
    document.documentElement.style.setProperty("--navbar-search-text-color", "#82ff9b")
    document.documentElement.style.setProperty("--play-btn-bg", "green")
    document.documentElement.style.setProperty("--games-bg", "linear-gradient(to bottom, #82c92c, #1d9113)")
    document.documentElement.style.setProperty("--footer-bg", "#0c6000")
    document.documentElement.style.setProperty("--bio-box-bg", "#036e00")
    document.documentElement.style.setProperty("--profile-info-panel-bg", "#036e00")
    document.documentElement.style.setProperty("--biotext-area-bg", "#0c802e")
    document.documentElement.style.setProperty("--btn-primary-bg", "#5fd434")
    document.documentElement.style.setProperty("--btn-primary-bg-hover", "#46ba26")
    document.documentElement.style.setProperty("--game-description-box-bg", "#036e00")
    document.documentElement.style.setProperty("--server-card-bg", "#0a5200")
    document.documentElement.style.setProperty("--download-bg", "linear-gradient(180deg, hsl(120.7, 100%, 16.5%) 0%, hsl(135.2, 69.6%, 40%) 100%)")
    document.documentElement.style.setProperty("--volts-deg", "200deg")
  }
  if (theme == "5") {
    document.documentElement.style.setProperty("--background-gradient", "linear-gradient(180deg, hsl(306.6, 100%, 33.9%) 0%, hsl(295.3, 77.7%, 57.8%) 100%)")
    document.documentElement.style.setProperty("--navbar-bg-gradient", "linear-gradient(to bottom, #c92c93, #911389)")
    document.documentElement.style.setProperty("--navbar-search-bg", "#880086")
    document.documentElement.style.setProperty("--navbar-search-icon-color", "#ff82c8")
    document.documentElement.style.setProperty("--navbar-search-text-color", "#ff82d4")
    document.documentElement.style.setProperty("--play-btn-bg", "pink")
    document.documentElement.style.setProperty("--games-bg", "linear-gradient(to bottom, #c92c93, #91136c)")
    document.documentElement.style.setProperty("--footer-bg", "#af00a4")
    document.documentElement.style.setProperty("--bio-box-bg", "#970063")
    document.documentElement.style.setProperty("--profile-info-panel-bg", "#970063")
    document.documentElement.style.setProperty("--biotext-area-bg", "#800c5e")
    document.documentElement.style.setProperty("--btn-primary-bg", "#ed3ab8")
    document.documentElement.style.setProperty("--btn-primary-bg-hover", "#c53199")
    document.documentElement.style.setProperty("--game-description-box-bg", "#970063")
    document.documentElement.style.setProperty("--server-card-bg", "#52003d")
    document.documentElement.style.setProperty("--download-bg", "linear-gradient(180deg, hsl(323.6, 100%, 16.5%) 0%, hsl(323.2, 69.6%, 40%) 100%)")
    document.documentElement.style.setProperty("--volts-deg", "400deg")
  }

  if (theme == "6") {
    document.documentElement.style.setProperty("--background-gradient", "linear-gradient(180deg, hsl(0, 0%, 0%) 0%, hsl(0, 0%, 100%) 100%)")
    document.documentElement.style.setProperty("--navbar-bg-gradient", "linear-gradient(to bottom, #000, #fff)")
    document.documentElement.style.setProperty("--navbar-search-bg", "#000")
    document.documentElement.style.setProperty("--navbar-search-icon-color", "#fff")
    document.documentElement.style.setProperty("--navbar-search-text-color", "#fff")
    document.documentElement.style.setProperty("--play-btn-bg", "black")
    document.documentElement.style.setProperty("--games-bg", "linear-gradient(to bottom, #fff, #000)")
    document.documentElement.style.setProperty("--footer-bg", "#000")
    document.documentElement.style.setProperty("--bio-box-bg", "#000")
    document.documentElement.style.setProperty("--profile-info-panel-bg", "#000")
    document.documentElement.style.setProperty("--biotext-area-bg", "#414141")
    document.documentElement.style.setProperty("--btn-primary-bg", "#000")
    document.documentElement.style.setProperty("--btn-primary-bg-hover", "#000")
    document.documentElement.style.setProperty("--game-description-box-bg", "#000")
    document.documentElement.style.setProperty("--server-card-bg", "#232323")
    document.documentElement.style.setProperty("--download-bg", "linear-gradient(180deg, hsl(0, 0%, 26.3%) 0%, hsl(0, 0%, 0%) 100%)")
    document.documentElement.style.setProperty("--volts-deg", "0")

  }
}

async function spoilers() {

  if (config.streamer_mode == true) {

    document.querySelector(".settings-main-panel").style.filter = "opacity(0)"

    if (document.querySelector(".vp-spoiler")) {
      document.querySelectorAll(".vp-spoiler").forEach((element) => {
        element.classList.remove("vp-spoiler")
      })
    }

    // spoilers
    if (window.location.pathname == "/settings/account" || window.location.pathname == "/settings") {
      // hide email preview and date of birth

      document.querySelector("#current-dob-display").classList.add("vp-spoiler")


      document.querySelector("#current-email-display").classList.add("vp-spoiler")

    }
    // INSANELY important -- hide ip
    document.querySelectorAll(".sidebar-tab")[2].classList.add("disabled")

    const sidebartab_i = document.createElement("i")
    sidebartab_i.classList.add("fa-solid")
    sidebartab_i.classList.add("fa-clock-rotate-left");

    document.querySelectorAll(".sidebar-tab")[2].textContent = ''
    document.querySelectorAll(".sidebar-tab")[2].append(sidebartab_i, ` Sessions (Streamer mode)`)


    if (window.location.pathname == "/settings/sessions") {

      document.querySelectorAll(".row-desc").forEach((element) => {

        if (element.textContent == "Devices currently signed in to your account.") {
        } else {

          element.classList.add("vp-spoiler")
        }
      })
    }

    if (window.location.pathname == "/settings/security") {
      function addspoiler() {
        document.querySelector("#twofa-status-icon").classList.add("vp-spoiler")
        document.querySelector("#twofa-status-icon").classList.add("hidden")
        document.querySelector("#twofa-status-icon").classList.remove("disabled")
        document.querySelector("#twofa-status-icon").classList.remove("enabled")
        document.querySelector("#twofa-status-icon").style.width = "18px"
        document.querySelector("#twofa-status-icon").children[0].style.display = 'none'
      }
      addspoiler()

      document.querySelector("#twofa-status-icon").addEventListener("click", () => {
        if (document.querySelector("#twofa-status-icon").classList.contains("hidden")) {
          document.querySelector("#twofa-status-icon").classList.remove("hidden")
          document.querySelector("#twofa-status-icon").classList.add("disabled")
          document.querySelector("#twofa-status-icon").children[0].style.display = "inline"
        } else {
          addspoiler()
        }
      })
    }

    await wait(50);
    document.querySelector(".settings-main-panel").style.filter = "opacity(1)"
  }
}

async function user_page() {

  if (window.location.pathname.startsWith("/users/")) {
    await get_certain_user_data(window.location.pathname.split("/")[2])

    function formatDate(timestamp) {
      const date = new Date(timestamp);

      return date.toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }

    document.querySelectorAll(".join-date-value")[1].textContent = formatDate(certain_user_data.created_at)
    document.querySelector(".profile-last-seen").append(document.createElement("div").textContent = ` (${formatDate(certain_user_data.last_seen)})`)
  }
}

async function avatar_page() {

  const saveavatarbtn = document.createElement("button")
  saveavatarbtn.classList.add("btn-primary")
  saveavatarbtn.textContent = "Save avatar as..."
  saveavatarbtn.style.width = "100%"
  saveavatarbtn.style.marginTop = "3px"

  saveavatarbtn.addEventListener("click", async () => {

    let userInput = prompt("(VoPro) Please enter the name you want to set the saved avatar as.");

    if (userInput.trim() === "") {
      alert("(VoPro) You need to enter a name for the saved avatar.")
    } else {
      await setSavedAvatars({ [userInput.trim()]: get_current_avatar_data() })
      await save_avatar(get_current_avatar_data())
      window.location.reload()
    }
  })

  const savedavatarstxt = document.createElement("div")
  savedavatarstxt.style.margin = "10px 0 10px"
  savedavatarstxt.style.textAlign = "center"
  savedavatarstxt.textContent = "Saved Avatars"

  const savedAvatarsContainer = document.createElement("div")

  savedAvatarsContainer.style.display = 'grid'
  savedAvatarsContainer.style.gridTemplateColumns = 'repeat(2, minmax(50%, 1fr))'
  savedAvatarsContainer.style.rowGap = '7px'

  document.querySelector(".avatar-panel").append(saveavatarbtn)
  document.querySelector(".avatar-panel").append(savedavatarstxt)
  document.querySelector(".avatar-panel").append(savedAvatarsContainer)

  if (window.location.pathname == "/catalog") {

    await getSavedAvatars()

    for (const [name, data] of Object.entries(saved_avatars)) {
      console.log(`Name: ${name}`);
      console.log("-----------------");

      const avatarbtn = document.createElement("button")
      avatarbtn.classList.add("btn-primary")
      avatarbtn.textContent = name
      avatarbtn.style.width = "90%"
      avatarbtn.style.position = 'relative'

      avatarbtn.addEventListener("click", async () => {
        await save_avatar(data)
        window.location.reload()
      })

      const trash_icon = document.createElement("i")
      trash_icon.classList.add("fa-solid")
      trash_icon.classList.add("fa-trash")

      trash_icon.style.position = "absolute"
      trash_icon.style.right = "5px"

      trash_icon.style.display = "none"

      trash_icon.addEventListener("mouseenter", () => {
        trash_icon.style.color = "#e74c3c !important"
      })

      trash_icon.addEventListener("mouseleave", () => {
        trash_icon.style.color = "white !important"
      })

      trash_icon.addEventListener("click", () => {
        removeSavedAvatars(name)
      })

      avatarbtn.append(trash_icon)

      avatarbtn.addEventListener("mouseenter", () => {
        trash_icon.style.display = 'inline-block'
      })

      avatarbtn.addEventListener("mouseleave", () => {
        trash_icon.style.display = 'none'
      })


      savedAvatarsContainer.append(avatarbtn)
    }
  }

}

/*const observer = new MutationObserver(() => {
  setTimeout(() => { document.querySelector(".settings-main-panel").style.filter = "opacity(0)" }, 50)
  spoilers()
  setTimeout(() => { document.querySelector(".settings-main-panel").style.filter = "opacity(1)" }, 50)

});

observer.observe(document, { childList: true, subtree: true });*/


async function init() {
  if (config.mastertoggle == true) {
    spoilers()
    const link = document.createElement("link");
        link.id = "vortex-custom-styles";
        link.rel = "stylesheet";
        link.type = "text/css";
        link.href = browser.runtime.getURL("styles.css");
        document.head.appendChild(link);
    themes(config.theme)
    navbar();
    main();
    search();
    games_page();
    avatar_page();
    user_page();
    volts_page();
    getSavedAvatars()

    //setSavedAvatars({"Voxel Hair": { shirt_id: 7, pant_id: null, body_type: "male", body_colors: ["#dc8add", "#7a6bd5", "#8f61e3", "#8f61e3", "#510cf4", "#510cf4"], face_id: 52, accessory_ids: [] }})

    if (config.streamer_mode) {
      document.querySelectorAll(".sidebar-tab").forEach((element) => {
        element.addEventListener("click", async () => {
          document.querySelector(".settings-main-panel").style.filter = "opacity(0)"
          spoilers()
          await wait(50);
          setTimeout(() => { document.querySelector(".settings-main-panel").style.filter = "opacity(1)" }, 1000);
        })
      })
    }
  }
}

async function loadLocalConfig() {
  const storage = await browser.storage.local.get("userConfig");
  const userOverrides = storage.userConfig || {};

  const defaults = {
    "mastertoggle": true,
    "profile_username": true,
    "vortex_plus_logo": true,
    "streamer_mode": false,
    "theme": "1",
  };

  config = { ...defaults, ...userOverrides };

  console.log("config:", config)
  console.log("profile username:", config.profileusername)
  console.log("profile theme:")

  init()
}

async function initloadLocalConfig() {
  await loadLocalConfig()
}

initloadLocalConfig()
