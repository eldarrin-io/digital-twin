import {
  TransactionContext, Transaction, HandlerContext,
  GetApi, PostApi, ArgRequired, ArgOptional
} from '@dbos-inc/dbos-sdk';

import { Knex } from 'knex';

export interface ApplicationImplementation {
  id?: number;
  name: string;
  ecosystem_id: number;
  application_component_id?: number;
  last_status?: string;
}

export class ApplicationImplementationOperations {

  @Transaction()
  static async insertApplicationImplementation(ctx: TransactionContext<Knex>,
                                        name: string, ecosystem_id: number, application_component_id: number) {
    const appServ: ApplicationImplementation = { name, ecosystem_id, application_component_id };
    const exists = await ctx.client<ApplicationImplementation>('application_implementation')
        .select().where({ name }).andWhere({ ecosystem_id }).first();
    if (exists) {
      ctx.logger.warn(`ApplicationImplementation already exists: ${name}`);
      appServ.last_status = "ApplicationImplementation already exists";
      return appServ;
    }
    if (application_component_id > 0) {
      const rows = await ctx.client<ApplicationImplementation>("application_implementation")
          .insert({
            name: appServ.name,
            ecosystem_id: appServ.ecosystem_id,
            application_component_id: appServ.application_component_id
          })
          .returning("id");
      appServ.id = rows[0].id;
      appServ.last_status = "ApplicationImplementation inserted";
    } else {
      const rows = await ctx.client<ApplicationImplementation>("application_implementation")
          .insert({
            name: appServ.name,
            ecosystem_id: appServ.ecosystem_id
          })
          .returning("id");
      appServ.id = rows[0].id;
      appServ.last_status = "ApplicationImplementation inserted";
    }
    return appServ;
  }


  @Transaction()
  static async updateApplicationImplementation(ctx: TransactionContext<Knex>, appServ: ApplicationImplementation) {
    await ctx.client<ApplicationImplementation>("application_implementation")
        .update({ name: appServ.name, application_component_id: appServ.application_component_id})
        .where({ id: appServ.id });
    return appServ;
  }

  @Transaction({ readOnly: true })
  static async getApplicationImplementationTrans(ctx: TransactionContext<Knex>, name: string, ecosystem_id: number): Promise<ApplicationImplementation | undefined> {
    ctx.logger.info(`getting session rappServrd ${name}`);
    const service = await ctx.client<ApplicationImplementation>('application_implementation')
        .select("*")
        .where({ name, ecosystem_id });
    return service[0];
  }

  @PostApi('/application_implementation') // Serve this function from HTTP POST requests to the /application_implementation endpoint
  static async createApplicationImplementation(
      ctx: HandlerContext,
      @ArgOptional id: number,
      @ArgRequired name: string,
      @ArgRequired ecosystem_id: number,
      @ArgOptional application_component_id: number) {

    // if id exists, update
    if (id) {
      const appServ: ApplicationImplementation = { id, name, ecosystem_id, application_component_id };
      return ctx.invoke(ApplicationImplementationOperations).updateApplicationImplementation(appServ);
    }

    if (application_component_id) {
      // Insert a new row into the 'ApplicationImplementation' table.
      return ctx.invoke(ApplicationImplementationOperations).insertApplicationImplementation(name, ecosystem_id, application_component_id);
    }

    // Insert a new row into the 'ApplicationImplementation' table.
    return ctx.invoke(ApplicationImplementationOperations).insertApplicationImplementation(name, ecosystem_id, 0);

  }

  @GetApi('/application_implementation/:ecosystem_id/:name') // Serve this function from HTTP GET requests to the /application_implementation/:name endpoint
  static async getApplicationImplementation(
      ctx: HandlerContext,
      ecosystem_id: number,
      name: string) {
    // Retrieve the row with the specified name from the 'ApplicationImplementation' table.
    return ctx.invoke(ApplicationImplementationOperations).getApplicationImplementationTrans(name, ecosystem_id);
  }
}
