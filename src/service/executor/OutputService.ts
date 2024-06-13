import { ExecutorOutputEntity } from '../../orm'
import { getDB } from '../../worker/bridgeExecutor/db'

export interface GetOutputListParam {
  output_index?: number;
  height?: number;
  offset?: number;
  limit: number;
  descending: boolean;
}

export interface GetOutputListResponse {
  count?: number;
  next?: number;
  limit: number;
  outputList: ExecutorOutputEntity[];
}

export async function getOutputList(
  param: GetOutputListParam
): Promise<GetOutputListResponse> {
  const [db] = getDB()
  const queryRunner = db.createQueryRunner('slave')
  try {
    const offset = param.offset ?? 0
    const order = param.descending ? 'DESC' : 'ASC'
    const limit = Number(param.limit) ?? 10

    const qb = queryRunner.manager.createQueryBuilder(
      ExecutorOutputEntity,
      'output'
    )

    if (param.output_index) {
      qb.andWhere('output.output_index = :output_index', {
        output_index: param.output_index
      })
    }

    const outputList = await qb
      .orderBy('output.output_index', order)
      .skip(offset * limit)
      .take(limit)
      .getMany()

    const count = await qb.getCount()
    let next: number | undefined

    if (count > (offset + 1) * limit) {
      next = offset + 1
    }

    return {
      count,
      next,
      limit,
      outputList
    }
  } finally {
    queryRunner.release()
  }
}
