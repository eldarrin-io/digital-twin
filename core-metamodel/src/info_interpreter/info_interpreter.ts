import {
  TransactionContext, Transaction, HandlerContext,
  PostApi, ArgRequired, ArgOptional, Workflow, WorkflowContext, Communicator, CommunicatorContext
} from '@dbos-inc/dbos-sdk';

import { Knex } from 'knex';
import axios from 'axios';

import Imap from 'imap';
import { simpleParser } from 'mailparser';

import { Ecosystem } from '../ecosystem';
import { ApplicationComponent } from '../application_component';
import { ApplicationService } from '../application_service';
import { BusinessService } from '../business_service';
import { BusinessCapability } from '../business_capability';
import { ApplicationImplementation } from '../application_implementation';


export interface InfoBlock {
  id?: number;
  textIn: string;
  last_status?: string;
}

export interface MetaBlock {
  ecosystem_name: string;
  business_capability: string;
  business_service: string;
  application_service: string;
  application_component: string;
  application_implementation: string;
  problem_statement: string;
}

export interface MetaIDBlock {
  ecosystem_id: number;
  business_service_id: number;
  business_capability_id: number;
  application_service_id: number;
  application_component_id: number;
  application_implementation_id: number;
  problem_statement_id: number;
}

export class InfoInterpreter {

  static stringUtoString(string: string | undefined): string {
    if (string === undefined) {
      return "";
    } else {
      return string;
    }
  }

  // string to number
  static stringToNumber(string: string | undefined): number {
    if (string === undefined) {
      return 0;
    } else {
      return parseInt(string);
    }
  }

  // number undefined to number
  static numberUtoNumber(number: number | undefined): number {
    if (number === undefined) {
      return 0;
    } else {
      return number;
    }
  }

  @Communicator()
  static async getEmails(ctx: CommunicatorContext) {
    const myPromise: Promise<string> = new Promise((resolve, reject) => {
      const imap = new Imap({
        user: InfoInterpreter.stringUtoString(ctx.getConfig('email_address')),
        password: InfoInterpreter.stringUtoString(ctx.getConfig('email_password')),
        host: InfoInterpreter.stringUtoString(ctx.getConfig('email_host')),
        port: InfoInterpreter.stringToNumber(ctx.getConfig('email_port')),
        tls: true,
      });

      imap.once('ready', () => {
        imap.openBox('INBOX', false, () => {
          imap.search(['UNSEEN'], (err, results) => {
            if (err) {
              ctx.logger.error(err);
              reject("error");
              return;
            }

            if (results.length === 0) {
              ctx.logger.info("No unseen emails.");
              resolve("No unseen emails.");
            } else {

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
                        ctx.logger.info(parsed.text);
                        ctx.logger.info(parsed.subject);
                        resolve(InfoInterpreter.stringUtoString(parsed.text));
                      })
                      .catch(err => {
                        ctx.logger.error(err);
                        reject("error3");
                      });
                  });
                });

                msg.once('attributes', attrs => {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  const { uid } = attrs;
                  imap.addFlags(uid, ['\\Seen'], () => {
                    // Mark the email as read after processing
                    ctx.logger.info("marked read");
                    //return "b";
                  });
                });
              });

              f.once('error', ex => {
                ctx.logger.error(ex);
                reject(ex);
                //return Promise.reject(ex);
              });

              f.once('end', () => {
                ctx.logger.info("finished");
                imap.end();
                //return "d";
              });
            }
          });
        });
      });

      imap.once('error', (err: Error) => {
        ctx.logger.error(err);
        reject(err);
        //return "e";
      });

      imap.once('end', () => {
        ctx.logger.info("conn end");
        //return "f";
      });

      imap.connect();
    });

    return myPromise;

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
      ecosystem_name: "adbosaa",
      business_service: "aServiceaa",
      business_capability: "aCapabilityaa",
      application_service: "aApp Serviceaa",
      application_component: "aComponentaa",
      application_implementation: "aImplementationaa",
      problem_statement: "aProblemaa"
    };

    // Artifical Stupid Smoke and Mirrors
    if (infoText.toLowerCase().indexOf("experian") > -1) {
      return {
        ecosystem_name: "Experian",
        business_capability: "Deliver Software",
        business_service: "DevOps",
        application_service: "Platform Engineering",
        application_component: "harness.io",
        application_implementation: "UK SaaS",
        problem_statement: "Overly complex build pipelines"
      };
    }

    if (infoText.toLowerCase().indexOf("chef") > -1) {
      return {
        ecosystem_name: "Experian",
        business_capability: "Deliver Software",
        business_service: "DevOps",
        application_service: "Platform Engineering",
        application_component: "Chef",
        application_implementation: "UK On Premise",
        problem_statement: "Lack of documentation"
      };
    }

    if (infoText.toLowerCase().indexOf("dbos") > -1) {
      return {
        ecosystem_name: "DBOS",
        business_capability: "Collate Ecosystem Information",
        business_service: "Digital Twin",
        application_service: "Backend Service",
        application_component: "DBOS",
        application_implementation: "AWS UK",
        problem_statement: "No front end capability implemented"
      };
    }

    if (infoText.toLowerCase().indexOf("capital one") > -1) {
      return {
        ecosystem_name: "Capital One",
        business_service: "Banking",
        business_capability: "Banking",
        application_service: "Banking",
        application_component: "Banking",
        application_implementation: "Banking",
        problem_statement: "Banking"
      };
    }

    return metaBlock;
  }

  // populate ecosystem if missing
  @Transaction()
  static async populateEcosystem(ctx: TransactionContext<Knex>, ecosystem: Ecosystem) {
    const exists = await ctx.client<Ecosystem>('ecosystem')
      .select().where('name', '=', ecosystem.name).first();
    if (exists) {
      ctx.logger.warn(`Ecosystem already exists: ${exists.id}`);
      ecosystem.id = exists.id;
      ecosystem.last_status = "Ecosystem already exists";
      return ecosystem;
    }
    const rows = await ctx.client<Ecosystem>("ecosystem")
      .insert({ name: ecosystem.name, company_name: ecosystem.company_name })
      .returning("id");
    ecosystem.id = rows[0].id;
    ctx.logger.info(`Ecosystem inserted: ${rows[0].id}`);
    ecosystem.last_status = "Ecosystem inserted";
    return ecosystem;
  }

  // populate business capability if missing
  @Transaction()
  static async populateBusinessCapability(ctx: TransactionContext<Knex>, businessCapability: BusinessCapability) {
    const exists = await ctx.client<BusinessCapability>('business_capability')
      .select().where('name', '=', businessCapability.name).first();
    if (exists) {
      businessCapability.id = exists.id;
      businessCapability.last_status = "BusinessCapability already exists";
      return businessCapability;
    }
    const rows = await ctx.client<BusinessCapability>("business_capability")
      .insert({ name: businessCapability.name, ecosystem_id: businessCapability.ecosystem_id })
      .returning("id");
    businessCapability.id = rows[0].id;
    businessCapability.last_status = "BusinessCapability inserted";
    return businessCapability;
  }

  // populate business service if missing
  @Transaction()
  static async populateBusinessService(ctx: TransactionContext<Knex>, businessService: BusinessService) {
    const exists = await ctx.client<BusinessService>('business_service')
      .select().where('name', '=', businessService.name).first();
    if (exists) {
      businessService.id = exists.id;
      businessService.last_status = "BusinessService already exists";
      return businessService;
    }
    const rows = await ctx.client<BusinessService>("business_service")
      .insert({ name: businessService.name, ecosystem_id: businessService.ecosystem_id, business_capability_id: businessService.business_capability_id })
      .returning("id");
    businessService.id = rows[0].id;
    businessService.last_status = "BusinessService inserted";
    return businessService;
  }

  // populate application service if missing
  @Transaction()
  static async populateApplicationService(ctx: TransactionContext<Knex>, applicationService: ApplicationService) {
    const exists = await ctx.client<ApplicationService>('application_service')
      .select().where('name', '=', applicationService.name).first();
    if (exists) {
      applicationService.id = exists.id;
      applicationService.last_status = "ApplicationService already exists";
      return applicationService;
    }
    const rows = await ctx.client<ApplicationService>("application_service")
      .insert({ name: applicationService.name, ecosystem_id: applicationService.ecosystem_id, business_service_id: applicationService.business_service_id})
      .returning("id");
    applicationService.id = rows[0].id;
    applicationService.last_status = "ApplicationService inserted";
    return applicationService;
  }

  // populate application component if missing
  @Transaction()
  static async populateApplicationComponent(ctx: TransactionContext<Knex>, applicationComponent: ApplicationComponent) {
    const exists = await ctx.client<ApplicationComponent>('application_component')
      .select().where('name', '=', applicationComponent.name).first();
    if (exists) {
      applicationComponent.id = exists.id;
      applicationComponent.last_status = "ApplicationComponent already exists";
      return applicationComponent;
    }
    const rows = await ctx.client<ApplicationComponent>("application_component")
      .insert({ name: applicationComponent.name, ecosystem_id: applicationComponent.ecosystem_id, application_service_id: applicationComponent.application_service_id })
      .returning("id");
    applicationComponent.id = rows[0].id;
    applicationComponent.last_status = "ApplicationComponent inserted";
    return applicationComponent;
  }

  // populate application implementation if missing
  @Transaction()
  static async populateApplicationImplementation(ctx: TransactionContext<Knex>, applicationImplementation: ApplicationImplementation) {
    const exists = await ctx.client<ApplicationImplementation>('application_implementation')
      .select().where('name', '=', applicationImplementation.name).first();
    if (exists) {
      applicationImplementation.id = exists.id;
      applicationImplementation.last_status = "ApplicationImplementation already exists";
      return applicationImplementation;
    }
    const rows = await ctx.client<ApplicationImplementation>("application_implementation")
      .insert({ name: applicationImplementation.name, ecosystem_id: applicationImplementation.ecosystem_id, application_component_id: applicationImplementation.application_component_id })
      .returning("id");
    applicationImplementation.id = rows[0].id;
    applicationImplementation.last_status = "ApplicationImplementation inserted";
    return applicationImplementation;
  }

  // populate problem statement if missing
  @Transaction()
  static async populateProblemStatement(ctx: TransactionContext<Knex>, problemStatement: ApplicationImplementation) {
    const exists = await ctx.client<ApplicationImplementation>('problem_statement')
      .select().where('name', '=', problemStatement.name).first();
    if (exists) {
      problemStatement.last_status = "ProblemStatement already exists";
      return problemStatement;
    }
    const rows = await ctx.client<ApplicationImplementation>("problem_statement")
      .insert({ name: problemStatement.name, ecosystem_id: problemStatement.ecosystem_id })
      .returning("id");
    problemStatement.id = rows[0].id;
    problemStatement.last_status = "ProblemStatement inserted";
    return problemStatement;
  }


  // populate database with metablock
  @Workflow()
  static async populateDatabase(ctx: WorkflowContext, metaBlock: MetaBlock) {
    const metaIDBlock : MetaIDBlock = {
      ecosystem_id: 0,
      business_service_id: 0,
      business_capability_id: 0,
      application_service_id: 0,
      application_component_id: 0,
      application_implementation_id: 0,
      problem_statement_id: 0
    };

    const eco = await ctx.invoke(InfoInterpreter).populateEcosystem({ name: metaBlock.ecosystem_name, company_name: "DBOS Inc." });
    ctx.logger.info(`Ecosystem: ` + eco.name);
    metaIDBlock.ecosystem_id = eco.id || 99;

    return metaIDBlock;
  }

  @Workflow()
  static async interpretInfoBlock(ctx: WorkflowContext, infoBlockText: string) {
    if (infoBlockText === "test") {
      infoBlockText = await ctx.invoke(InfoInterpreter).getEmails();
      ctx.logger.info(`Received ` + infoBlockText);
    }
    if (infoBlockText === "") {
      return;
    }
    const metaBlock = await ctx.invoke(InfoInterpreter).interpretText(infoBlockText);
    ctx.logger.info(`Application Service: ` + metaBlock.application_service);


    const ecosystem = { name: metaBlock.ecosystem_name, company_name: "DBOS Inc." };
    const eco = await ctx.invoke(InfoInterpreter).populateEcosystem(ecosystem);

    const businessCapability = { name: metaBlock.business_capability, ecosystem_id: eco.id || 0};
    const busCap = await ctx.invoke(InfoInterpreter).populateBusinessCapability(businessCapability);

    const businessService = { name: metaBlock.business_service, ecosystem_id: eco.id || 0, business_capability_id: busCap.id || 0};
    const busServ = await ctx.invoke(InfoInterpreter).populateBusinessService(businessService);

    const applicationService = { name: metaBlock.application_service, ecosystem_id: eco.id || 0, business_service_id: busServ.id || 0};
    const appServ = await ctx.invoke(InfoInterpreter).populateApplicationService(applicationService);

    const applicationComponent = { name: metaBlock.application_component, ecosystem_id: eco.id || 0, application_service_id: appServ.id || 0};
    const appComp = await ctx.invoke(InfoInterpreter).populateApplicationComponent(applicationComponent);

    const applicationImplementation = { name: metaBlock.application_implementation, ecosystem_id: eco.id || 0, application_component_id: appComp.id || 0};
    const appImpl = await ctx.invoke(InfoInterpreter).populateApplicationImplementation(applicationImplementation);

    const metaIDBlock : MetaIDBlock = {
      ecosystem_id: eco.id || 0,
      business_service_id: busServ.id || 0,
      business_capability_id: busCap.id || 0,
      application_service_id: appServ.id || 0,
      application_component_id: appComp.id || 0,
      application_implementation_id: appImpl.id || 0,
      problem_statement_id: 0
    };

    ctx.logger.info(`Ecosystem: ` + eco.id + " " + busServ.id + " " + busCap.id + " " + appServ.id + " " + appComp.id + " " + appImpl.id);

    return metaIDBlock;
  }


  @PostApi('/infoblock') // Serve this function from HTTP POST requests to the /ecosystem endpoint
  static async populateEcosystemFromInfoBlock(
    ctx: HandlerContext,
    @ArgOptional id: number,
    @ArgRequired textIn: string) {

    return await ctx.invoke(InfoInterpreter).interpretInfoBlock(textIn);
  }

}
