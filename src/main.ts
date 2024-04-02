import {pause} from "./helpers/utils.js";
import db, {Task} from "./helpers/database.js";
import {CronJob} from "cron";
import {Kufar} from "./helpers/kufar.js";


function createJob(task: Task) : CronJob {
  console.log('Создаю задачу ' + task.id)

  return new CronJob(task.cron, async () => {
    const kufar = new Kufar(task)
    console.log('Запускаю задачу ' + task.id)

    try {
      const newIds = await kufar.getAdsIds()

      for (const id of newIds) {
        await db.setNewAd(task.id, kufar.updateAds[id])
        await pause(300)
      }
    } catch (e) {
        console.error(e)
    }
  })
}

async function run () {
  const jobs = []
  await pause(5000)
  let fullTasks = []

  try {
    fullTasks = Object.values(await db.getTasks())
    console.log('Получен список задач')
  } catch (e) {
    console.error(e)
  }

  for (const task of fullTasks) {
    const job = createJob(task)
    job.start()
    jobs.push(job)
  }


  db.subscribeToTaskChange().then(()=> {
    jobs.forEach((j: CronJob) => j.stop())
    run()
  })

}

run();
