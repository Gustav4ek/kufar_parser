import {FirebaseApp, initializeApp} from 'firebase/app'
import {Database, getDatabase, get, child, ref, set} from 'firebase/database'
import {signInWithEmailAndPassword, getAuth} from 'firebase/auth'
import {conf} from "../../config.js";

class DatabaseService {
  app: FirebaseApp
  db: Database
  constructor() {
    try {
      this.app = initializeApp({
          ...conf.firebase
        }
      )

      const auth = getAuth()
      signInWithEmailAndPassword(auth, conf.authFirebase.email, conf.authFirebase.password)
        .catch(function (error) {
        const { code, message } = error;
        console.log(`${code} - ${message}`);
      });

      this.db = getDatabase(this.app)
      console.log('Инициализированно')
    } catch (e) {
      console.log('Application works without database')
    }
  }

  getSavedAds(): Promise<Collection<Ad>> {
    return new Promise((resolve, reject) => {
      get(child(ref(this.db), 'ads')).then((snapshot) => {
        resolve(snapshot.val() || {})
      }).catch((e) => {
        reject(e)
      })
    })
  }

  setNewAd(ad: Ad): Promise<any> {
    return new Promise((resolve, reject) => {
      set(ref(this.db, 'ads' + '/' + ad.id), ad).then(() => resolve(''))
        .catch(e => reject(e))
    })
  }

}

const db = new DatabaseService()
export default db

export interface Collection<T> {
  [key:string]: T
}

export interface Ad {
  title: string,
  id: string,
  price: number,
  url: string
}
