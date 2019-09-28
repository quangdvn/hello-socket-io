const socket = io();

//* DOM Elements
const $messageForm = document.querySelector('#message-form');
const $messageInput = $messageForm.querySelector('#message-input');
const $messageButton = $messageForm.querySelector('#message-submit');
const $locationButton = document.querySelector('#location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

//* Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector(
  '#location-message-template'
).innerHTML;
const sideBarTemplate = document.querySelector('#side-bar-template').innerHTML;

//* Scrolling
const autoScroll = () => {
  //* New message element
  const $newMessage = $messages.lastElementChild;

  //* Height of the new Message
  const newMessageStyle = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyle.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  //* Visible height of box chat
  const visibleHeight = $messages.offsetHeight;

  //* Total height of box chat
  const containerHeight = $messages.scrollHeight;

  //* Current distance from Top
  const scrollOffSet = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffSet) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

//* Detect Username and Room
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

//* User joining room
socket.emit('join', { username, room }, error => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});

//* Server -> Client
socket.on('message', messInfo => {
  const { display, username, message, createdAt } = messInfo;
  if (display) {
    const renderHTML = Mustache.render(messageTemplate, {
      username,
      message,
      createdAt: moment(createdAt).format('hh:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', renderHTML);
    autoScroll();
  } else {
    console.log(`${moment(createdAt).format('hh:mm a')} - ${message}`);
  }
});

socket.on('locationMessage', ({ username, url, createdAt }) => {
  const renderHTML = Mustache.render(locationMessageTemplate, {
    username,
    url,
    createdAt: moment(createdAt).format('hh:mm a')
  });
  $messages.insertAdjacentHTML('beforeend', renderHTML);
  autoScroll();
});

socket.on('roomData', ({ room, users }) => {
  const renderHTML = Mustache.render(sideBarTemplate, {
    room,
    users
  });
  $sidebar.innerHTML = renderHTML;
});

//* Client -> Server
$messageForm.addEventListener('submit', e => {
  //* Disable form after sending message
  e.preventDefault();
  $messageButton.setAttribute('disabled', 'true');

  const newMessage = e.target.elements['message-input'].value;

  //* Sending data to the server
  socket.emit('sendMessage', newMessage, error => {
    //* Re-enable Send button
    //* Reset and Re-Focus on Input
    $messageButton.removeAttribute('disabled');
    $messageInput.value = '';
    $messageInput.focus();
    if (error) {
      return console.log('Error occured ...');
    } else {
      console.log('Message delivered ...');
    }
  });
});

$locationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Unsupport feature !!!');
  } else {
    //* Disable form after sending location
    $locationButton.setAttribute('disabled', 'true');

    //* Sending data to the server
    navigator.geolocation.getCurrentPosition(position => {
      socket.emit(
        'sendLocation',
        {
          latitude: position.coords.latitude,
          longtitude: position.coords.longitude
        },
        () => {
          //* Re-enable Location button
          $locationButton.removeAttribute('disabled');
          console.log('Location shared ...');
        }
      );
    });
  }
});
