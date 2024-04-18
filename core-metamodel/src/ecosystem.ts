import {
  TransactionContext, Transaction, HandlerContext,
  GetApi, PostApi, ArgRequired, ArgOptional
} from '@dbos-inc/dbos-sdk';

import { Knex } from 'knex';

export interface Ecosystem {
  id?: number;
  name: string;
  company_name: string;
  last_status?: string;
}

export class EcosystemOperations {

  @Transaction()
  static async insertEcosystem(ctx: TransactionContext<Knex>, eco: Ecosystem) {
    const name = eco.name;
    const exists = await ctx.client<Ecosystem>('ecosystem')
        .select().where({ name }).first();
    if (exists) {
      ctx.logger.warn(`Ecosystem already exists: ${name}`);
      eco.last_status = "Ecosystem already exists";
    } else {
      const rows = await ctx.client<Ecosystem>("ecosystem")
          .insert({name: eco.name, company_name: eco.company_name})
          .returning("id");
      eco.id = rows[0].id;
      eco.last_status = "Ecosystem inserted";
    }
    return eco;
  }

  @Transaction()
  static async updateEcosystem(ctx: TransactionContext<Knex>, eco: Ecosystem) {
    await ctx.client<Ecosystem>("ecosystem")
        .update({ name: eco.name, company_name: eco.company_name })
        .where({ id: eco.id });
    return eco;
  }

  @Transaction({ readOnly: true })
  static async getEcosystemTrans(ctx: TransactionContext<Knex>, name: string): Promise<Ecosystem | undefined> {
    ctx.logger.info(`getting session record ${name}`);
    const ecosystem = await ctx.client<Ecosystem>('ecosystem')
        .select("*")
        .where({ name });
    return ecosystem[0];
  }

  @PostApi('/ecosystem') // Serve this function from HTTP POST requests to the /ecosystem endpoint
  static async createEcosystem(
      ctx: HandlerContext,
      @ArgOptional id: number,
      @ArgRequired name: string,
      @ArgRequired company_name: string) {

    // if id exists, update
    if (id) {
      const eco: Ecosystem = { id, name, company_name };
      return ctx.invoke(EcosystemOperations).updateEcosystem(eco);
    } else {
      // Insert a new row into the 'ecosystem' table.
      const eco: Ecosystem = { name, company_name };
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
