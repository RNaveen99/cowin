if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register('serviceWorker.js')
      .then((res) => console.log('service worker registered'))
      .catch((err) => console.log('service worker not registered', err));
  });
}

const sound = new Audio('sound/beepSuccess.mp3');
function checkSlot() {
  let d = new Date();
  let cowinURL = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByPin?pincode=124507&date=${d.getDate()}-${
    d.getMonth() + 1
  }-2021`;
  console.log(cowinURL);
  let count = 0;
  axios
    .get(cowinURL)
    .then((res) => {
      let result = res.data.sessions;
      console.log('ok');
      result.forEach((center) => {
        if (center.available_capacity_dose1 > 0) {
          count++;
        }
      });
      if (count > 0) {
        document.querySelector(
          '#info'
        ).innerHTML = `<h3>Count : ${count} </h3>`;
        sound.play();
      } else {
        document.querySelector(
          '#info'
        ).innerHTML = `<h3>Last fetched at ${new Date()}</h3>`;
      }
    })
    .catch((err) => {
      //
    });
}
setInterval(checkSlot, 20000);
