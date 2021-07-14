const TOKEN_ID = '1234567899:AAGIAAGIGIAAEAGIAA-TAGIAAAGIAAAGIAAok4';
const CHAT_ID = '1234567890';
const PIN_CODE = '124507';
const MOBILE_NUMBER = '1234567890';
const SELF_REGISTRATION = 'https://selfregistration.cowin.gov.in';
const WEB_MESSAGES = 'https://messages.google.com/web/';

const puppeteer = require('puppeteer');
const telegram = require('telegram-bot-api');
const bot = new telegram({
  token: TOKEN_ID,
});

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function init() {
  const browser = await puppeteer.launch({ headless: false });
  const cowin = await browser.newPage();
  await cowin.goto(SELF_REGISTRATION, {
    waitUntil: 'networkidle2',
  });

  const webMessage = await browser.newPage();
  await webMessage.goto(WEB_MESSAGES, {
    waitUntil: 'networkidle2',
  });
  return { browser, cowin, webMessage };
}

async function changeTabTo(tabNumber, cowin, webMessage) {
  if (tabNumber == 1) {
    await cowin.bringToFront();
  } else {
    await webMessage.bringToFront();
  }
}

async function readOTP(webMessage) {
  const selector = '.name.ng-star-inserted';
  await webMessage.waitForSelector(selector);

  return await webMessage.evaluate(() => {
    const CONVERSATION_SELECTOR = '.name.ng-star-inserted';
    const MSG_SELECTOR = 'mws-conversation-snippet';
    const COWIN = 'VM-NHPSMS';

    let elements = document.querySelectorAll(CONVERSATION_SELECTOR);
    let contents = document.querySelectorAll(MSG_SELECTOR);

    for (let i = 0; i < elements.length; i++) {
      if (elements[i].innerText == COWIN) {
        return contents[i].innerText.substr(37, 6);
      }
      if (i == 5) break;
    }
    return 0;
  });
}

async function enterMobile(cowin) {
  await cowin.type('#mat-input-0', MOBILE_NUMBER);
  await cowin.evaluate(() => {
    document
      .querySelector('.covid-button-desktop.ion-text-center')
      .firstElementChild.click();
  });
}
async function enterOTP(cowin, OTP) {
  await cowin.type('#mat-input-1', OTP);
  await cowin.evaluate(() => {
    document
      .querySelector('.covid-button-desktop.ion-text-center')
      .firstElementChild.click();
  }, OTP);
}

async function clickSchedule(cowin) {
  await cowin.waitForSelector('.btnlist.ng-star-inserted');
  await cowin.evaluate(() => {
    document.querySelector('.btnlist.ng-star-inserted a').click();
  });
}

async function inputPincodeAndSearch(cowin) {
  //   await cowin.waitForSelector('#mat-input-2');
  await sleep(2000);
  let pincode = PIN_CODE;
  await cowin.type('#mat-input-2', pincode);
  const button = await cowin.$('ion-button');
  await button.click();
}

async function selectCenterAndSlotAndBook(cowin) {
  try {
    await cowin.waitForSelector('span.age-limit');

    return await cowin.evaluate(async () => {
      let slots = document.querySelectorAll('span.age-limit');
      for (let slot of slots) {
        let parent = slot.parentNode.parentNode;
        if (parent.children[0].innerText == 'Booked') {
          continue;
        }
        // if (parent.children[1].innerText != 'COVISHIELD') {
        //   continue;
        // }
        if (parent.children[2].innerText == 'Age 45+') {
          continue;
        }
        slot.click();
        let timeSlots = document.querySelector('.time-slot-list').children;
        timeSlots[0].click();
        document.querySelector('.register-btn.vac-btn').click();
        return true;
      }
    });
  } catch (error) {
    console.log('Error in SCASB');
    console.log(error);
  }
}

async function main() {
  const { browser, cowin, webMessage } = await init();
  let slotBoooked = false;
  let time = 0;
  let flag2 = true;
  while (!slotBoooked) {
    try {
      flag2 = true;
      let oldOTP = await readOTP(webMessage);
      let newOTP;
      await changeTabTo(1, cowin, webMessage);
      await enterMobile(cowin);
      await sleep(12000);
      do {
        await sleep(1000);
        newOTP = await readOTP(webMessage);
      } while (oldOTP == newOTP);
      oldOTP = newOTP;
      await enterOTP(cowin, oldOTP);
      await clickSchedule(cowin);
      try {
        while (!slotBoooked && flag2) {
          await inputPincodeAndSearch(cowin);
          slotBooked = await selectCenterAndSlotAndBook(cowin);
          if (slotBoooked) {
            bot
              .sendMessage({
                chat_id: CHAT_ID,
                text: 'Slot Booked',
                parse_mode: 'HTML',
              })
              .catch((err) => {
                console.log(err);
              });
          }
          console.log(time);
          await sleep(60000);
          time = time + 1;
          if (time == 14) {
            await cowin.evaluate(() => {
              document.querySelector('.logout-text').children[0].click();
            });
            flag2 = false;
            time = 0;
          }
        }
      } catch (err) {
        console.log('Exception');
        console.log(err);
        await cowin.goto(SELF_REGISTRATION, {
          waitUntil: 'networkidle2',
        });
      }
    } catch (err) {
      await cowin.goto(SELF_REGISTRATION, {
        waitUntil: 'networkidle2',
      });
    }
  }
}
main()
  .then(() => {
    console.log('good');
  })
  .catch((err) => {
    console.log('err');
    console.log(err);
  });
