import {
  TransactionContext, Transaction, HandlerContext,
  GetApi, PostApi, ArgRequired, ArgOptional
} from '@dbos-inc/dbos-sdk';

import { Knex } from 'knex';

export interface ecosystem {
  id?: number;
  name: string;
  company_name: string;
  last_status?: string;
}

export class EcosystemOperations {

  @Transaction()
  static async insertEcosystem(ctx: TransactionContext<Knex>, eco: ecosystem) {
    const name = eco.name;
    const exists = await ctx.client<ecosystem>('ecosystem')
        .select().where({ name }).first();
    if (exists) {
      ctx.logger.warn(`Ecosystem already exists: ${name}`);
      eco.last_status = "Ecosystem already exists";
    } else {
      const rows = await ctx.client<ecosystem>("ecosystem")
          .insert({name: eco.name, company_name: eco.company_name})
          .returning("id");
      eco.id = rows[0].id;
      eco.last_status = "Ecosystem inserted";
    }
    return eco;
  }

  @Transaction()
  static async updateEcosystem(ctx: TransactionContext<Knex>, eco: ecosystem) {
    await ctx.client<ecosystem>("ecosystem")
        .update({ name: eco.name, company_name: eco.company_name })
        .where({ id: eco.id });
    return eco;
  }

  @Transaction({ readOnly: true })
  static async getEcosystemTrans(ctx: TransactionContext<Knex>, name: string): Promise<ecosystem | undefined> {
    ctx.logger.info(`getting session record ${name}`);
    const session = await ctx.client<ecosystem>('ecosystem')
        .select("*")
        .where({ name });
    if (!session) { return undefined; }
    return session[0];
  }

  @PostApi('/ecosystem') // Serve this function from HTTP POST requests to the /ecosystem endpoint
  static async createEcosystem(
      ctx: HandlerContext,
      @ArgOptional id: number,
      @ArgRequired name: string,
      @ArgRequired company_name: string) {

    // if id exists, update
    if (id) {
      const eco: ecosystem = { id, name, company_name };
      return ctx.invoke(EcosystemOperations).updateEcosystem(eco);
    } else {
      // Insert a new row into the 'ecosystem' table.
      const eco: ecosystem = { name, company_name };
      return ctx.invoke(EcosystemOperations).insertEcosystem(eco);
    }
  }

  @GetApi('/ecosystem/:name') // Serve this function from HTTP GET requests to the /ecosystem/:name endpoint
  static async getEcosystem(
      ctx: HandlerContext,
      name: string) {
    // Retrieve the row with the specified name from the 'ecosystem' table.
    return ctx.invoke(EcosystemOperations).getEcosystemTrans(name);
  }
}
