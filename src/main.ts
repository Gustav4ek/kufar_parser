import axios from "axios";
import jsdom from "jsdom";
import {compareCollections, pause} from "./helpers/utils.js";
import db, {Ad, Collection} from "./helpers/database.js";
const { JSDOM } = jsdom;

(async () => {

  await pause(500)

  let html: string
  try {
    const resp = await axios.get('https://www.kufar.by/l/r~gomel/mobilnye-telefony?query=Iphone+11&utm_filterOrigin=Search_suggester_3&utm_queryOrigin=Manually_typed&utm_suggestionType=Category_only')
    html = resp.data
  } catch (e) {
    if (axios.isAxiosError(e)) {
      console.log(e)
    } else console.log(e)
  }

  const dom = new JSDOM(html)
  const document = dom.window.document
  const items = document.querySelectorAll('[data-testid=kufar-ad]')
  const newAds: Collection<Ad> = {}

  items.forEach(node => {
    let url = node.getAttribute('href')
    let regexId = /item\/(\d+)\?/
    let id = url.match(regexId)

    let priceStr = node.querySelector('.styles_price__G3lbO').textContent
    let regexPrice = /\d+/g
    let  numbers = priceStr.match(regexPrice)
    let price = 0
    if (numbers) {
      price = Number(numbers.join(''))
    }
    if (price === 1) price*1000
    if (isNaN(price)) price = 0

    let title = node.querySelector('.styles_title__F3uIe').textContent

    newAds[id[1]] = {
      id: id[1],
      url: url,
      title: title,
      price: price
    }
  })

  const savedAds = await db.getSavedAds()

  const newIds = compareCollections(savedAds, newAds)

  for (const id of newIds) {
    await db.setNewAd(newAds[id])
    await pause(500)
  }
})()
