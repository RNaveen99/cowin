if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register('serviceWorker.js')
      .then((res) => console.log('service worker registered'))
      .catch((err) => console.log('service worker not registered', err));
  });
}
let calls = 0;
function checkSlot() {
  const sound = new Audio('sound/ring.mp3');
  if (calls % 2 == 0) {
    sound.play();
  }
  calls++;
  document.querySelector('#calls').innerHTML = `Total api calls = ${calls}`;
  let d = new Date();
  let cowinURL = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByPin?pincode=124507&date=${d.getDate()}-${
    d.getMonth() + 1
  }-2021`;
  let count = 0;
  axios
    .get(cowinURL)
    .then((res) => {
      let result = res.data.sessions;
      result.forEach((center) => {
        if (center.available_capacity_dose1 > 0 && center.min_age_limit == 18) {
          count++;
        }
      });
      if (count > 0) {
        sound.play();
      }
      document.querySelector(
        '#info'
      ).innerHTML = `<h3>Centers : ${count} </h3> <h3>Last fetched at ${new Date()}</h3>`;
    })
    .catch((err) => {
      //
    });
}
setInterval(checkSlot, 20000);
