import {
  TransactionContext, Transaction, HandlerContext,
  PostApi, ArgRequired, ArgOptional, Workflow, WorkflowContext, Communicator, CommunicatorContext
} from '@dbos-inc/dbos-sdk';

import { Knex } from 'knex';
import axios from 'axios';

export interface InfoBlock {
  id?: number;
  textIn: string;
  last_status?: string;
}

export interface MetaBlock {
  ecosystem_id: number;
  business_service: string;
  business_capability: string;
  application_service: string;
  application_component: string;
  application_implementation: string;
  problem_statement: string;
}

export class InfoInterpreter {

  // interpret text; this will be a communicator to the AI model
  @Communicator()
  static async interpretText(ctx: CommunicatorContext, infoText: string) {
    await axios.get("https://postman-echo.com/get", {
      params: {
        greeting: infoText
      }
    });
    ctx.logger.info(`Greeting sent to postman!`);
    const metaBlock : MetaBlock = {
      ecosystem_id: 1,
      business_service: "Service",
      business_capability: "Capability",
      application_service: "App Service",
      application_component: "Component",
      application_implementation: "Implementation",
      problem_statement: "Problem"
    };

    return metaBlock;
  }

  // populate database with metablock
  @Transaction()
  static async populateDatabase(ctx: TransactionContext<Knex>, metaBlock: MetaBlock) {
    const rows = await ctx.client<MetaBlock>("metablock")
        .insert(metaBlock)
        .returning("id");
    metaBlock.ecosystem_id = 1;
    return metaBlock;
  }

  @Workflow()
  static async interpretInfoBlock(ctx: WorkflowContext, infoBlockText: string) {
    const noteContent = `Thank you for being awesome!`;
    const metaBlock = await ctx.invoke(InfoInterpreter).interpretText(infoBlockText);
    await ctx.invoke(InfoInterpreter).populateDatabase(metaBlock);
    ctx.logger.info(`Greeting sent to !`);
    return noteContent;
  }


  @PostApi('/infoblock') // Serve this function from HTTP POST requests to the /ecosystem endpoint
  static async populateEcosystemFromInfoBlock(
    ctx: HandlerContext,
    @ArgOptional id: number,
    @ArgRequired textIn: string) {

    return ctx.invoke(InfoInterpreter).interpretInfoBlock(textIn);
  }

}
