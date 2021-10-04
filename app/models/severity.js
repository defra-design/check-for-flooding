const severity = [{
  id: 1,
  title: 'Severe flood warning',
  pluralisedTitle: 'Severe flood warnings',
  hash: 'severe',
  pluralisedHash: 'severe',
  subTitle: 'Severe flooding is expected',
  tagline: 'act now',
  isActive: true,
  actionLink: '/what-to-do-in-a-flood#what-to-do-if-you-get-a-severe-flood-warning',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2"><path d="M20.133 1.117c1.292.067 2.5.798 3.159 1.926l16.316 30.251c.14.282.146.318.198.468.097.286.158.584.183.885.166 2.062-1.497 4.103-3.681 4.175H3.672c-.314-.011-.349-.022-.506-.048-.28-.047-.553-.127-.814-.237-1.925-.814-2.951-3.285-1.98-5.243L16.688 3.043c.244-.419.364-.556.598-.796.748-.767 1.637-1.172 2.847-1.13z" fill="#fff"/><path d="M20.026 2.811c.731.019 1.426.433 1.79 1.068l16.283 30.189c.639 1.26-.277 3.02-1.826 3.058H3.707c-1.416-.034-2.521-1.688-1.826-3.058L18.164 3.879a2.07 2.07 0 0 1 1.862-1.068z" fill="#e3000f"/><path d="M19.643 5.681c.069-.128.202-.207.347-.207s.278.079.347.207L35.821 34.41c.065.122.062.27-.009.389s-.199.192-.338.192H4.506c-.139 0-.267-.073-.338-.192s-.075-.267-.009-.389L19.643 5.681z" fill="#fff"/><path d="M17.096 16.51v1.272l2.25-2.586c.131-.153.324-.24.524-.239s.393.088.524.24l6.509 7.525.001.001c.251.289.219.728-.071.978s-.728.219-.979-.071l-.595-.687v3.671c-.203.017-.304.07-.483.181-.199.124-.462.368-.892.566-.286.129-.64.216-1.039.215h-.028a2.48 2.48 0 0 1-1.372-.424c-.325-.217-.52-.385-.693-.459-.116-.051-.225-.084-.42-.085-.276.007-.378.06-.585.187-.2.124-.462.368-.891.565a2.5 2.5 0 0 1-1.039.216c-.581.004-1.059-.203-1.388-.413l-.709-.469a.6.6 0 0 0-.287-.072c-.218-.01-.591.143-1.018.378v-4.018l-.596.685a.69.69 0 0 1-.524.238c-.162 0-.324-.055-.455-.17-.289-.251-.32-.69-.068-.979l2.701-3.106v-3.14h1.623z" fill="#181c1b"/><path d="M7.503 30.719l.17.154a10.59 10.59 0 0 0 1.204.919c.228.146.462.279.705.383a2.04 2.04 0 0 0 .809.19c.798-.02 1.381-.403 1.941-.687.553-.302 1.057-.522 1.398-.512.172.002.289.036.441.109.226.107.505.343.909.598a3.04 3.04 0 0 0 1.659.492c.479.002.898-.102 1.238-.255.511-.234.835-.53 1.101-.698.273-.17.448-.256.834-.263.27.002.438.049.605.123.247.107.501.327.896.588a2.95 2.95 0 0 0 1.672.505c.48.002.899-.102 1.239-.255.512-.234.835-.53 1.102-.698.273-.17.448-.256.833-.263.261-.004.57.107.805.237.117.063.214.128.279.174l.07.053.014.011.049.039c.397.294 1.03.702 1.921.702h.037c.807-.015 1.495-.389 2.089-.76a7.96 7.96 0 0 0 .771-.563l.202-.173 1.586 2.937H5.831l1.672-3.087zm1.711-3.158c.028.049.061.096.1.14a5.78 5.78 0 0 0 .843.785c.393.285.881.596 1.559.609.793-.023 1.332-.391 1.84-.647.502-.277.941-.46 1.196-.448.13.002.208.024.33.083.181.083.433.295.813.538s.926.479 1.594.474c.458.002.865-.099 1.192-.248.492-.226.793-.506 1.023-.648.236-.146.354-.207.671-.215a1.1 1.1 0 0 1 .483.098c.198.084.421.277.794.526a2.85 2.85 0 0 0 1.575.487h.033a2.84 2.84 0 0 0 1.192-.248c.493-.226.795-.505 1.025-.648.236-.147.353-.207.67-.215.197-.004.455.085.655.196.099.055.182.11.236.149l.058.044.062.05a3.94 3.94 0 0 0 .746.444 2.78 2.78 0 0 0 1.129.228c.724.002 1.302-.315 1.681-.633.12-.1.227-.203.32-.3l.724 1.34a.79.79 0 0 0-.089.085h0a3.53 3.53 0 0 1-.328.298c-.258.214-.626.479-.99.674s-.732.314-.917.307c-.493-.011-.679-.14-1.066-.408a3.92 3.92 0 0 0-.589-.39c-.37-.198-.887-.415-1.52-.418-.467-.002-.878.104-1.209.259-.499.236-.811.525-1.079.69a1.48 1.48 0 0 1-.886.267 1.37 1.37 0 0 1-.603-.123c-.249-.107-.502-.327-.897-.589a2.95 2.95 0 0 0-1.673-.504 2.83 2.83 0 0 0-1.21.259c-.499.236-.811.526-1.079.691a1.49 1.49 0 0 1-.884.266c-.49-.007-.735-.168-1.158-.462-.207-.144-.44-.32-.744-.471s-.682-.268-1.107-.266c-.855.01-1.53.39-2.103.688-.565.315-1.054.531-1.236.511 0 0-.003 0-.021-.003-.069-.009-.258-.081-.466-.201-.316-.178-.688-.452-.993-.704l-.611-.555c-.017-.02-.035-.038-.054-.056l.968-1.786z" fill="#00a4cd"/><path d="M22.139 23.029h2.077v2.285h-2.077z" fill="#fff"/></svg>'
}, {
  id: 2,
  title: 'Flood warning',
  pluralisedTitle: 'Flood warnings',
  hash: 'warning',
  pluralisedHash: 'warnings',
  subTitle: 'Flooding is expected',
  tagline: 'act now',
  isActive: true,
  actionLink: '/what-to-do-in-a-flood#what-to-do-if-you-get-a-flood-warning',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2"><path d="M20.133 1.117c1.292.067 2.5.798 3.159 1.926l16.316 30.251c.14.282.146.318.198.468.097.286.158.584.183.885.166 2.062-1.497 4.103-3.681 4.175H3.672c-.314-.011-.349-.022-.506-.048-.28-.047-.553-.127-.814-.237-1.925-.814-2.951-3.285-1.98-5.243L16.688 3.043c.244-.419.364-.556.598-.796.748-.767 1.637-1.172 2.847-1.13z" fill="#fff"/><path d="M20.026 2.811c.731.019 1.426.433 1.79 1.068l16.283 30.189c.639 1.26-.277 3.02-1.826 3.058H3.707c-1.416-.034-2.521-1.688-1.826-3.058L18.164 3.879a2.07 2.07 0 0 1 1.862-1.068z" fill="#e3000f"/><path d="M19.643 5.681c.069-.128.202-.207.347-.207s.278.079.347.207L35.821 34.41c.065.122.062.27-.009.389s-.199.192-.338.192H4.506c-.139 0-.267-.073-.338-.192s-.075-.267-.009-.389L19.643 5.681z" fill="#fff"/><path d="M17.096 16.51v1.272l2.25-2.586c.131-.153.324-.24.524-.239s.393.088.524.24l6.509 7.525.001.001c.251.289.219.728-.071.978s-.728.219-.979-.071l-.595-.687v3.671c-.203.017-.304.07-.483.181-.199.124-.462.368-.892.566-.286.129-.64.216-1.039.215h-.028a2.48 2.48 0 0 1-1.372-.424c-.325-.217-.52-.385-.693-.459-.116-.051-.225-.084-.42-.085-.276.007-.378.06-.585.187-.2.124-.462.368-.891.565a2.5 2.5 0 0 1-1.039.216c-.581.004-1.059-.203-1.388-.413l-.709-.469a.6.6 0 0 0-.287-.072c-.218-.01-.591.143-1.018.378v-4.018l-.596.685a.69.69 0 0 1-.524.238c-.162 0-.324-.055-.455-.17-.289-.251-.32-.69-.068-.979l2.701-3.106v-3.14h1.623z" fill="#181c1b"/><path d="M7.503 30.719l.17.154a10.59 10.59 0 0 0 1.204.919c.228.146.462.279.705.383a2.04 2.04 0 0 0 .809.19c.798-.02 1.381-.403 1.941-.687.553-.302 1.057-.522 1.398-.512.172.002.289.036.441.109.226.107.505.343.909.598a3.04 3.04 0 0 0 1.659.492c.479.002.898-.102 1.238-.255.511-.234.835-.53 1.101-.698.273-.17.448-.256.834-.263.27.002.438.049.605.123.247.107.501.327.896.588a2.95 2.95 0 0 0 1.672.505c.48.002.899-.102 1.239-.255.512-.234.835-.53 1.102-.698.273-.17.448-.256.833-.263.261-.004.57.107.805.237.117.063.214.128.279.174l.07.053.014.011.049.039c.397.294 1.03.702 1.921.702h.037c.807-.015 1.495-.389 2.089-.76a7.96 7.96 0 0 0 .771-.563l.202-.173 1.586 2.937H5.831l1.672-3.087zm1.711-3.158c.028.049.061.096.1.14a5.78 5.78 0 0 0 .843.785c.393.285.881.596 1.559.609.793-.023 1.332-.391 1.84-.647.502-.277.941-.46 1.196-.448.13.002.208.024.33.083.181.083.433.295.813.538s.926.479 1.594.474c.458.002.865-.099 1.192-.248.492-.226.793-.506 1.023-.648.236-.146.354-.207.671-.215a1.1 1.1 0 0 1 .483.098c.198.084.421.277.794.526a2.85 2.85 0 0 0 1.575.487h.033a2.84 2.84 0 0 0 1.192-.248c.493-.226.795-.505 1.025-.648.236-.147.353-.207.67-.215.197-.004.455.085.655.196.099.055.182.11.236.149l.058.044.062.05a3.94 3.94 0 0 0 .746.444 2.78 2.78 0 0 0 1.129.228c.724.002 1.302-.315 1.681-.633.12-.1.227-.203.32-.3l.724 1.34a.79.79 0 0 0-.089.085h0a3.53 3.53 0 0 1-.328.298c-.258.214-.626.479-.99.674s-.732.314-.917.307c-.493-.011-.679-.14-1.066-.408a3.92 3.92 0 0 0-.589-.39c-.37-.198-.887-.415-1.52-.418-.467-.002-.878.104-1.209.259-.499.236-.811.525-1.079.69a1.48 1.48 0 0 1-.886.267 1.37 1.37 0 0 1-.603-.123c-.249-.107-.502-.327-.897-.589a2.95 2.95 0 0 0-1.673-.504 2.83 2.83 0 0 0-1.21.259c-.499.236-.811.526-1.079.691a1.49 1.49 0 0 1-.884.266c-.49-.007-.735-.168-1.158-.462-.207-.144-.44-.32-.744-.471s-.682-.268-1.107-.266c-.855.01-1.53.39-2.103.688-.565.315-1.054.531-1.236.511 0 0-.003 0-.021-.003-.069-.009-.258-.081-.466-.201-.316-.178-.688-.452-.993-.704l-.611-.555c-.017-.02-.035-.038-.054-.056l.968-1.786z" fill="#00a4cd"/><path d="M22.139 23.029h2.077v2.285h-2.077z" fill="#fff"/></svg>'
}, {
  id: 3,
  title: 'Flood alert',
  pluralisedTitle: 'Flood alerts',
  hash: 'alert',
  pluralisedHash: 'alerts',
  subTitle: 'Flooding is possible',
  tagline: 'be prepared',
  isActive: true,
  actionLink: '/what-to-do-in-a-flood#what-to-do-if-you-get-a-flood-alert',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2"><path d="M20.133 1.116c1.292.067 2.507.811 3.159 1.926l16.317 30.253c.139.282.146.317.197.467.091.268.151.546.178.827.2 2.073-1.492 4.162-3.676 4.234H3.671c-.315-.01-.35-.022-.507-.048a3.67 3.67 0 0 1-.814-.237C.436 37.729-.601 35.253.37 33.295L16.687 3.042c.245-.419.364-.556.599-.796.747-.767 1.635-1.172 2.847-1.13z" fill="#fff"/><path d="M20.025 2.81c.732.019 1.427.433 1.791 1.068l16.283 30.191c.639 1.26-.276 3.02-1.826 3.058H3.705c-1.415-.034-2.52-1.688-1.825-3.058L18.163 3.878a2.07 2.07 0 0 1 1.862-1.068z" fill="#f18700"/><path d="M19.643 5.68a.39.39 0 0 1 .346-.207c.145 0 .279.079.347.207l15.485 28.731c.066.122.062.269-.009.389s-.199.192-.338.192H4.505c-.139 0-.267-.073-.339-.192s-.074-.267-.008-.389L19.643 5.68z" fill="#fff"/><path d="M17.132 18.641v1.269l2.244-2.581a.69.69 0 0 1 .524-.238c.2 0 .391.088.523.239l6.496 7.51h0c.251.29.219.727-.071.978s-.727.218-.977-.072l-.593-.685v3.95c-.203.017-.303.071-.482.181-.199.125-.462.368-.89.565-.284.129-.639.216-1.036.214-.01.001-.019.001-.029.001a2.47 2.47 0 0 1-1.369-.424c-.325-.216-.52-.384-.691-.458a.95.95 0 0 0-.42-.084.94.94 0 0 0-.584.186c-.199.124-.461.367-.889.564-.285.13-.638.217-1.037.215-.58.005-1.057-.203-1.385-.411l-.707-.469a.6.6 0 0 0-.287-.072c-.218-.009-.591.144-1.016.378v-4.298l-.595.685c-.137.157-.33.238-.524.238-.161 0-.322-.056-.453-.17-.289-.251-.32-.689-.069-.978l2.696-3.1v-3.133h1.621z" fill="#181c1b"/><path d="M22.164 25.147h2.073v2.28h-2.073z" fill="#fff"/><path d="M34.083 33.747H5.889l1.524-2.813h.447c.303.259.677.551 1.07.803.227.145.46.278.703.382s.496.187.807.19c.797-.02 1.378-.403 1.937-.686.552-.302 1.055-.521 1.395-.511.172.002.289.036.441.109.225.107.504.342.907.597s.961.496 1.655.491c.478.002.897-.102 1.236-.255.51-.233.833-.529 1.099-.696.272-.169.446-.255.832-.262.27.002.437.048.603.122.247.107.5.327.895.587.388.259.956.511 1.668.504.479.001.897-.102 1.237-.255.511-.233.834-.529 1.099-.696.273-.17.447-.256.832-.263.261-.003.569.107.803.237a2.58 2.58 0 0 1 .278.174l.07.053.063.05c.395.293 1.028.7 1.917.7h.036c.806-.015 1.494-.388 2.086-.758.294-.189.555-.386.77-.562l.065-.055h.2l1.519 2.813z" fill="#00a4cd"/></svg>'
}, {
  id: 4,
  title: 'Flood warning removed',
  pluralisedTitle: 'Flood warnings removed',
  hash: 'removed',
  pluralisedHash: 'removed',
  subTitle: 'in the last 24 hours',
  tagline: '',
  isActive: false,
  actionLink: '/what-to-do-in-a-flood',
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2"><path d="M20.133 1.116c1.292.067 2.507.811 3.159 1.926l16.317 30.253c.139.282.146.317.197.467.091.268.151.546.178.827.2 2.073-1.492 4.162-3.676 4.234H3.671c-.315-.01-.35-.022-.507-.048a3.67 3.67 0 0 1-.814-.237C.436 37.729-.601 35.253.37 33.295L16.687 3.042c.245-.419.364-.556.599-.796.747-.767 1.635-1.172 2.847-1.13z" fill="#fff"/><path d="M20.025 2.81c.732.019 1.427.433 1.791 1.068l16.283 30.191c.639 1.26-.276 3.02-1.826 3.058H3.705c-1.415-.034-2.52-1.688-1.825-3.058L18.163 3.878a2.07 2.07 0 0 1 1.862-1.068z" fill="#6f777b"/><path d="M19.643 5.68a.39.39 0 0 1 .346-.207c.145 0 .279.079.347.207l15.485 28.731c.066.122.062.269-.009.389s-.199.192-.338.192H4.505c-.139 0-.267-.073-.339-.192s-.074-.267-.008-.389L19.643 5.68z" fill="#fff"/><path d="M17.132 19.489v1.269l2.244-2.581c.132-.151.323-.238.524-.238a.7.7 0 0 1 .523.24l6.496 7.509v.001a.69.69 0 0 1-.071.977c-.289.25-.727.218-.977-.071l-.593-.686v3.951c-.203.016-.303.071-.482.181-.199.124-.462.367-.89.564-.284.129-.639.216-1.036.214-.01.001-.019.001-.029.001-.58 0-1.056-.213-1.369-.423-.325-.217-.52-.384-.691-.458a.95.95 0 0 0-.42-.084.94.94 0 0 0-.584.186c-.199.124-.461.367-.889.564-.285.129-.638.216-1.037.215-.58.004-1.057-.203-1.385-.412l-.707-.468c-.106-.051-.174-.071-.287-.073-.218-.009-.591.145-1.016.378v-4.297l-.595.684a.69.69 0 0 1-.524.238c-.161 0-.322-.056-.453-.17-.289-.251-.32-.689-.069-.977l2.696-3.101v-3.133h1.621z" fill="#6f777b"/><path d="M22.164 25.995h2.073v2.28h-2.073z" fill="#fff"/></svg>'
}]

module.exports = severity
