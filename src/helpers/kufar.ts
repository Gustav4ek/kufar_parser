import db, {Ad, Collection, Task} from "./database.js";
import axios from "axios";
import  { JSDOM } from "jsdom"
import {compareCollections} from "./utils.js";

export class Kufar {
  private baseUrl = 'https://www.kufar.by'
  private _updateAds: Collection<Ad>
  private _task: Task

  constructor(task: Task) {
    this._task = task
  }

  get updateAds() {
    return this._updateAds
  }

  async getAdsIds(): Promise<string[]> {
    const savedAds = await db.getSavedAds(this._task.id)

    for (const city of this._task.cities) {
      const html = await this.fetchAds(this.baseUrl, city, this._task.category)
      this._updateAds = {...this._updateAds, ...this.getAdsFromDom(html)}
      console.log('Добавили информацию для города ' + city)
    }

    const newIds = compareCollections(savedAds, this._updateAds)
    console.log('Обнаружено ' + newIds.length + 'новых объявлений')
    return newIds
  }

  private async fetchAds(baseUrl: string, city: string, category: string): Promise<string> {
    let html: string;
    try {
      const resp = await axios.get(`${baseUrl}/l/r~${city}/${category}?query=Iphone+11&utm_filterOrigin=Search_suggester_3&utm_queryOrigin=Manually_typed&utm_suggestionType=Category_only`, {responseType: 'document'})
      html = resp.data
    } catch (e) {
      if (axios.isAxiosError(e)) {
        console.log(e)
      } else console.log(e)
    }
    return html
  }


  private getAdsFromDom(html: string) {
    const dom = new JSDOM(html)
    const document = dom.window.document
    const items = document.querySelectorAll('[data-testid=kufar-ad]')
    const ads : Collection<Ad> = {}

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
      if (price < 500) {
        ads[id[1]] = {
          id: id[1],
          url: url,
          title: title,
          price: price
        }
      }

    })

    return ads
  }
}
