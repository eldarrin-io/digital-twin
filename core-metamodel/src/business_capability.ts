import {
  TransactionContext, Transaction, HandlerContext,
  GetApi, PostApi, ArgRequired, ArgOptional
} from '@dbos-inc/dbos-sdk';

import { Knex } from 'knex';

export interface BusinessCapability {
  id?: number;
  name: string;
  ecosystem_id: number;
  last_status?: string;
}

export class BusinessCapabilityOperations {

  @Transaction()
  static async insertBusinessCapability(ctx: TransactionContext<Knex>,
                                        name: string, ecosystem_id: number) {
    const buscap: BusinessCapability = { name, ecosystem_id };
    const exists = await ctx.client<BusinessCapability>('business_capability')
        .select().where({ name }).andWhere({ ecosystem_id }).first();
    if (exists) {
      ctx.logger.warn(`BusinessCapability already exists: ${name}`);
      buscap.last_status = "BusinessCapability already exists";
    } else {
      const rows = await ctx.client<BusinessCapability>("business_capability")
          .insert({name: buscap.name, ecosystem_id: buscap.ecosystem_id})
          .returning("id");
      buscap.id = rows[0].id;
      buscap.last_status = "BusinessCapability inserted";
    }
    return buscap;
  }

  @Transaction()
  static async updateBusinessCapability(ctx: TransactionContext<Knex>, buscap: BusinessCapability) {
    await ctx.client<BusinessCapability>("business_capability")
        .update({ name: buscap.name })
        .where({ id: buscap.id });
    return buscap;
  }

  @Transaction({ readOnly: true })
  static async getBusinessCapabilityTrans(ctx: TransactionContext<Knex>, name: string, ecosystem_id: number): Promise<BusinessCapability | undefined> {
    ctx.logger.info(`getting session rbuscaprd ${name}`);
    const session = await ctx.client<BusinessCapability>('business_capability')
        .select("*")
        .where({ name, ecosystem_id });
    if (!session) { return undefined; }
    return session[0];
  }

  @PostApi('/business_capability') // Serve this function from HTTP POST requests to the /business_capability endpoint
  static async createBusinessCapability(
      ctx: HandlerContext,
      @ArgOptional id: number,
      @ArgRequired name: string,
      @ArgRequired ecosystem_id: number) {

    // if id exists, update
    if (id) {
      const buscap: BusinessCapability = { id, name, ecosystem_id };
      return ctx.invoke(BusinessCapabilityOperations).updateBusinessCapability(buscap);
    } else {
      // Insert a new row into the 'BusinessCapability' table.
      const buscap: BusinessCapability = { name, ecosystem_id };
      return ctx.invoke(BusinessCapabilityOperations).insertBusinessCapability(name, ecosystem_id);
    }
  }

  @GetApi('/business_capability/:ecosystem_id/:name') // Serve this function from HTTP GET requests to the /business_capability/:name endpoint
  static async getBusinessCapability(
      ctx: HandlerContext,
      ecosystem_id: number,
      name: string) {
    // Retrieve the row with the specified name from the 'BusinessCapability' table.
    return ctx.invoke(BusinessCapabilityOperations).getBusinessCapabilityTrans(name, ecosystem_id);
  }
}
