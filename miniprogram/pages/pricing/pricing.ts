import { Plan } from '../../types/model'
import { plansData } from '../../data/plans'

Component({
  data: {
    plans: plansData as Plan[],
  },
})
