import {TransactionContext, Transaction, GetApi, ArgSource, ArgSources, PostApi, ArgRequired} from '@dbos-inc/dbos-sdk';
import { Knex } from 'knex';

// The schema of the database table used in this example.
export interface ecosystem {
  id: number;
  name: string;
  company_name: string;
}

export class EcosystemOperations {

  @PostApi('/ecosystem') // Serve this function from HTTP POST requests to the /ecosystem endpoint
  @Transaction()  // Run this function as a database transaction
  static async createEcosystem(
      ctxt: TransactionContext<Knex>,
      @ArgRequired name: string,
      @ArgRequired company_name: string) {
    const ecosystem: ecosystem = { id: 0, name, company_name };
    // Insert a new row into the 'ecosystem' table.
    const query = "INSERT INTO ecosystem (name, company_name) VALUES (?, ?) RETURNING id;";
    const { rows } = await ctxt.client.raw(query, [name, company_name]) as { rows: { id: number }[] };
    ecosystem.id = rows[0].id;
    return ecosystem;
  }

}
