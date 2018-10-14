/**
 * Offline Stuff
*/

const registerSW = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch((err) => {
        console.log('ServiceWorker registration failed: ', err);
      });
  }
};

const connectionStatus = (connected) => {
  if (connected) {
    let elAlert = document.getElementById('offline-alert');
    if(elAlert) {
      elAlert.parentElement.removeChild(elAlert);
    }
    DBHelper.checkOfflineReviews().then(reviews => {
      reviews.forEach((review) => DBHelper.removeOfflineReview(review));
    })
  } else {
    let offlineAlert = document.createElement('p');
    offlineAlert.id = 'offline-alert';
    offlineAlert.setAttribute('role', 'alert');
    let offlineAlertText = document.createTextNode("Your connection is lost.");
    offlineAlert.appendChild(offlineAlertText);
    document.body.appendChild(offlineAlert);
  }
}

window.addEventListener('load', () => {
  registerSW();
  if(navigator.onLine) {
    connectionStatus(true)
  } else {
    connectionStatus(false)
  }
});

window.addEventListener('online', () => connectionStatus(true));
window.addEventListener('offline', () => connectionStatus(false));
