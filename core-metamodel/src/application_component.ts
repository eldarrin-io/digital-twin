import {
  TransactionContext, Transaction, HandlerContext,
  GetApi, PostApi, ArgRequired, ArgOptional
} from '@dbos-inc/dbos-sdk';

import { Knex } from 'knex';

export interface ApplicationComponent {
  id?: number;
  name: string;
  ecosystem_id: number;
  application_service_id?: number;
  last_status?: string;
}

export class ApplicationComponentOperations {

  @Transaction()
  static async insertApplicationComponent(ctx: TransactionContext<Knex>,
                                        name: string, ecosystem_id: number, application_service_id: number) {
    const appServ: ApplicationComponent = { name, ecosystem_id, application_service_id };
    const exists = await ctx.client<ApplicationComponent>('application_component')
        .select().where({ name }).andWhere({ ecosystem_id }).first();
    if (exists) {
      ctx.logger.warn(`ApplicationComponent already exists: ${name}`);
      appServ.last_status = "ApplicationComponent already exists";
      return appServ;
    }
    if (application_service_id > 0) {
      const rows = await ctx.client<ApplicationComponent>("application_component")
          .insert({
            name: appServ.name,
            ecosystem_id: appServ.ecosystem_id,
            application_service_id: appServ.application_service_id
          })
          .returning("id");
      appServ.id = rows[0].id;
      appServ.last_status = "ApplicationComponent inserted";
    } else {
      const rows = await ctx.client<ApplicationComponent>("application_component")
          .insert({
            name: appServ.name,
            ecosystem_id: appServ.ecosystem_id
          })
          .returning("id");
      appServ.id = rows[0].id;
      appServ.last_status = "ApplicationComponent inserted";
    }
    return appServ;
  }


  @Transaction()
  static async updateApplicationComponent(ctx: TransactionContext<Knex>, appServ: ApplicationComponent) {
    await ctx.client<ApplicationComponent>("application_component")
        .update({ name: appServ.name, application_service_id: appServ.application_service_id})
        .where({ id: appServ.id });
    return appServ;
  }

  @Transaction({ readOnly: true })
  static async getApplicationComponentTrans(ctx: TransactionContext<Knex>, name: string, ecosystem_id: number): Promise<ApplicationComponent | undefined> {
    ctx.logger.info(`getting session rappServrd ${name}`);
    const service = await ctx.client<ApplicationComponent>('application_component')
        .select("*")
        .where({ name, ecosystem_id });
    return service[0];
  }

  @PostApi('/application_component') // Serve this function from HTTP POST requests to the /application_component endpoint
  static async createApplicationComponent(
      ctx: HandlerContext,
      @ArgOptional id: number,
      @ArgRequired name: string,
      @ArgRequired ecosystem_id: number,
      @ArgOptional application_service_id: number) {

    // if id exists, update
    if (id) {
      const appServ: ApplicationComponent = { id, name, ecosystem_id, application_service_id };
      return ctx.invoke(ApplicationComponentOperations).updateApplicationComponent(appServ);
    }

    if (application_service_id) {
      // Insert a new row into the 'ApplicationComponent' table.
      return ctx.invoke(ApplicationComponentOperations).insertApplicationComponent(name, ecosystem_id, application_service_id);
    }

    // Insert a new row into the 'ApplicationComponent' table.
    return ctx.invoke(ApplicationComponentOperations).insertApplicationComponent(name, ecosystem_id, 0);

  }

  @GetApi('/application_component/:ecosystem_id/:name') // Serve this function from HTTP GET requests to the /application_component/:name endpoint
  static async getApplicationComponent(
      ctx: HandlerContext,
      ecosystem_id: number,
      name: string) {
    // Retrieve the row with the specified name from the 'ApplicationComponent' table.
    return ctx.invoke(ApplicationComponentOperations).getApplicationComponentTrans(name, ecosystem_id);
  }
}
