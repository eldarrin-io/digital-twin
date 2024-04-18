import {
  TransactionContext, Transaction, HandlerContext,
  GetApi, PostApi, ArgRequired, ArgOptional
} from '@dbos-inc/dbos-sdk';

import { Knex } from 'knex';

export interface ApplicationService {
  id?: number;
  name: string;
  ecosystem_id: number;
  business_service_id?: number;
  last_status?: string;
}

export class ApplicationServiceOperations {

  @Transaction()
  static async insertApplicationService(ctx: TransactionContext<Knex>,
                                        name: string, ecosystem_id: number, business_service_id: number) {
    const appServ: ApplicationService = { name, ecosystem_id, business_service_id };
    const exists = await ctx.client<ApplicationService>('application_service')
        .select().where({ name }).andWhere({ ecosystem_id }).first();
    if (exists) {
      ctx.logger.warn(`ApplicationService already exists: ${name}`);
      appServ.last_status = "ApplicationService already exists";
      return appServ;
    }
    if (business_service_id > 0) {
      const rows = await ctx.client<ApplicationService>("application_service")
          .insert({
            name: appServ.name,
            ecosystem_id: appServ.ecosystem_id,
            business_service_id: appServ.business_service_id
          })
          .returning("id");
      appServ.id = rows[0].id;
      appServ.last_status = "ApplicationService inserted";
    } else {
      const rows = await ctx.client<ApplicationService>("application_service")
          .insert({
            name: appServ.name,
            ecosystem_id: appServ.ecosystem_id
          })
          .returning("id");
      appServ.id = rows[0].id;
      appServ.last_status = "ApplicationService inserted";
    }
    return appServ;
  }


  @Transaction()
  static async updateApplicationService(ctx: TransactionContext<Knex>, appServ: ApplicationService) {
    await ctx.client<ApplicationService>("application_service")
        .update({ name: appServ.name, business_service_id: appServ.business_service_id})
        .where({ id: appServ.id });
    return appServ;
  }

  @Transaction({ readOnly: true })
  static async getApplicationServiceTrans(ctx: TransactionContext<Knex>, name: string, ecosystem_id: number): Promise<ApplicationService | undefined> {
    ctx.logger.info(`getting session rappServrd ${name}`);
    const service = await ctx.client<ApplicationService>('application_service')
        .select("*")
        .where({ name, ecosystem_id });
    return service[0];
  }

  @PostApi('/application_service') // Serve this function from HTTP POST requests to the /application_service endpoint
  static async createApplicationService(
      ctx: HandlerContext,
      @ArgOptional id: number,
      @ArgRequired name: string,
      @ArgRequired ecosystem_id: number,
      @ArgOptional business_service_id: number) {

    // if id exists, update
    if (id) {
      const appServ: ApplicationService = { id, name, ecosystem_id, business_service_id };
      return ctx.invoke(ApplicationServiceOperations).updateApplicationService(appServ);
    }

    if (business_service_id) {
      // Insert a new row into the 'ApplicationService' table.
      return ctx.invoke(ApplicationServiceOperations).insertApplicationService(name, ecosystem_id, business_service_id);
    }

    // Insert a new row into the 'ApplicationService' table.
    return ctx.invoke(ApplicationServiceOperations).insertApplicationService(name, ecosystem_id, 0);

  }

  @GetApi('/application_service/:ecosystem_id/:name') // Serve this function from HTTP GET requests to the /application_service/:name endpoint
  static async getApplicationService(
      ctx: HandlerContext,
      ecosystem_id: number,
      name: string) {
    // Retrieve the row with the specified name from the 'ApplicationService' table.
    return ctx.invoke(ApplicationServiceOperations).getApplicationServiceTrans(name, ecosystem_id);
  }
}
