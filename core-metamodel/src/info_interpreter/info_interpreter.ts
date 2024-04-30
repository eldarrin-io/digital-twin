import {
  TransactionContext, Transaction, HandlerContext,
  PostApi, ArgRequired, ArgOptional, Workflow, WorkflowContext, Communicator, CommunicatorContext
} from '@dbos-inc/dbos-sdk';

import { Knex } from 'knex';
import axios from 'axios';

import Imap from 'imap';
import { simpleParser } from 'mailparser';

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

interface ImapConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

const imapConfig: ImapConfig = {
  user: 'digital.twin@eldarrin.io',
  password: 'password',
  host: 'emailserver',
  port: 993,
  tls: true,
};

export class InfoInterpreter {

  @Communicator()
  static async getEmails(ctx: CommunicatorContext) {
    const myPromise: Promise<string> = new Promise((resolve, reject) => {
      // This Promise resolves to a string
    });

    try {
      const value = await myPromise;
      console.log('Promise resolved with value: ' + value);
    } catch (error) {
      console.error('Promise rejected with error: ' + error);
    }

    const a = await Promise<string>;

    const imap = new Imap(imapConfig);

    imap.once('ready', () => {
      imap.openBox('INBOX', false, () => {
        imap.search(['UNSEEN'], (err, results) => {
          if (err) {
            ctx.logger.error(err);
            return;
          }

          if (results.length === 0) {
            ctx.logger.info("No unseen emails.");
            return;
          }

          const f = imap.fetch(results, { bodies: '' });

          f.on('message', msg => {
            msg.on('body', stream => {

              let data = '';

              stream.on('data', chunk => {
                data += chunk;
              });

              stream.once('end', () => {

                simpleParser(data)
                  .then(parsed => {
                    a = parsed.text;
                    return parsed.text;
                  })
                  .catch(err => {
                    ctx.logger.error(err);
                    return "a";
                  });
              });
            });

            msg.once('attributes', attrs => {
              const { uid } = attrs;
              imap.addFlags(uid, ['\\Seen'], () => {
                // Mark the email as read after processing
                ctx.logger.info("marked read");
                return "b";
              });
            });
          });

          f.once('error', ex => {
            ctx.logger.error(ex);
            return Promise.reject(ex);
          });

          f.once('end', () => {
            ctx.logger.info("finished");
            imap.end();
            return "d";
          });
        });
      });
    });

    imap.once('error', (err: Error) => {
      ctx.logger.error(err);
      return "e";
    });

    imap.once('end', () => {
      ctx.logger.info("conn end");
      return "f";
    });

    imap.connect();

    //return "g";

  }


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
    const a = await ctx.invoke(InfoInterpreter).getEmails();

    //await ctx.invoke(InfoInterpreter).populateDatabase(metaBlock);
    ctx.logger.info(`Greeting sent to !` + a);
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
