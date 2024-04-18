import {
  TransactionContext, Transaction, HandlerContext,
  GetApi, PostApi, ArgRequired, ArgOptional
} from '@dbos-inc/dbos-sdk';

import { Knex } from 'knex';

export interface BusinessService {
  id?: number;
  name: string;
  ecosystem_id: number;
  business_capability_id?: number;
  last_status?: string;
}

export class BusinessServiceOperations {

  @Transaction()
  static async insertBusinessService(ctx: TransactionContext<Knex>,
                                        name: string, ecosystem_id: number, business_capability_id: number) {
    const busServ: BusinessService = { name, ecosystem_id, business_capability_id };
    const exists = await ctx.client<BusinessService>('business_service')
        .select().where({ name }).andWhere({ ecosystem_id }).first();
    if (exists) {
      ctx.logger.warn(`BusinessService already exists: ${name}`);
      busServ.last_status = "BusinessService already exists";
      return busServ;
    }
    if (business_capability_id > 0) {
      const rows = await ctx.client<BusinessService>("business_service")
          .insert({
            name: busServ.name,
            ecosystem_id: busServ.ecosystem_id,
            business_capability_id: busServ.business_capability_id
          })
          .returning("id");
      busServ.id = rows[0].id;
      busServ.last_status = "BusinessService inserted";
    } else {
      const rows = await ctx.client<BusinessService>("business_service")
          .insert({
            name: busServ.name,
            ecosystem_id: busServ.ecosystem_id
          })
          .returning("id");
      busServ.id = rows[0].id;
      busServ.last_status = "BusinessService inserted";
    }
    return busServ;
  }


  @Transaction()
  static async updateBusinessService(ctx: TransactionContext<Knex>, busServ: BusinessService) {
    await ctx.client<BusinessService>("business_service")
        .update({ name: busServ.name, business_capability_id: busServ.business_capability_id})
        .where({ id: busServ.id });
    return busServ;
  }

  @Transaction({ readOnly: true })
  static async getBusinessServiceTrans(ctx: TransactionContext<Knex>, name: string, ecosystem_id: number): Promise<BusinessService | undefined> {
    ctx.logger.info(`getting session rbusServrd ${name}`);
    const service = await ctx.client<BusinessService>('business_service')
        .select("*")
        .where({ name, ecosystem_id });
    return service[0];
  }

  @PostApi('/business_service') // Serve this function from HTTP POST requests to the /business_service endpoint
  static async createBusinessService(
      ctx: HandlerContext,
      @ArgOptional id: number,
      @ArgRequired name: string,
      @ArgRequired ecosystem_id: number,
      @ArgOptional business_capability_id: number) {

    // if id exists, update
    if (id) {
      const busServ: BusinessService = { id, name, ecosystem_id, business_capability_id };
      return ctx.invoke(BusinessServiceOperations).updateBusinessService(busServ);
    }

    if (business_capability_id) {
      // Insert a new row into the 'BusinessService' table.
      return ctx.invoke(BusinessServiceOperations).insertBusinessService(name, ecosystem_id, business_capability_id);
    }

    // Insert a new row into the 'BusinessService' table.
    return ctx.invoke(BusinessServiceOperations).insertBusinessService(name, ecosystem_id, 0);

  }

  @GetApi('/business_service/:ecosystem_id/:name') // Serve this function from HTTP GET requests to the /business_service/:name endpoint
  static async getBusinessService(
      ctx: HandlerContext,
      ecosystem_id: number,
      name: string) {
    // Retrieve the row with the specified name from the 'BusinessService' table.
    return ctx.invoke(BusinessServiceOperations).getBusinessServiceTrans(name, ecosystem_id);
  }
}
