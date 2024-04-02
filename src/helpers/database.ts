import {FirebaseApp, initializeApp} from 'firebase/app'
import {Database, getDatabase, get, child, ref, set, onChildChanged, onChildAdded, onChildRemoved, onChildMoved} from 'firebase/database'
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

  getSavedAds(taskId: string): Promise<Collection<Ad>> {
    return new Promise((resolve, reject) => {
      get(child(ref(this.db), 'ads/' + taskId)).then((snapshot) => {
        resolve(snapshot.val() || {})
      }).catch((e) => {
        reject(e)
      })
    })
  }

  setNewAd(path: string,ad: Ad): Promise<any> {
    return new Promise((resolve, reject) => {
      set(ref(this.db, path + '/' + ad.id), ad).then(() => resolve(''))
        .catch(e => reject(e))
    })
  }

  getTasks():Promise<Collection<Task>> {
    return new Promise((resolve, reject) => {
      get(child(ref(this.db), 'tasks')).then((snapshot) => resolve(snapshot.val()))
        .catch(err => reject(err))
    })
  }
    subscribeToTaskChange () {
      let activatePause = true
      return new Promise(resolve => {
        onChildChanged(ref(this.db,'tasks'), (sn) => resolve(sn.val()))
        onChildMoved(ref(this.db,'tasks'), (sn) => resolve(sn.val()))
        onChildRemoved(ref(this.db,'tasks'), (sn) => resolve(sn.val()))
        onChildAdded(ref(this.db,'tasks'), (sn) => {
          setTimeout(() => {
            activatePause = false
          })
          if (!activatePause) {
            resolve(sn.val())
        }
        })
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

export interface Task {
  id: string,
  cron: string,
  query: string,
  cities: string[],
  category: string
}
