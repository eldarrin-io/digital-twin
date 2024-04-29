import { TestingRuntime, createTestingRuntime } from "@dbos-inc/dbos-sdk";
import {ApplicationComponentOperations, ApplicationComponent, Ecosystem, ApplicationService} from "./operations";
// @ts-ignore
import request from "supertest";

describe("appComp-operations-test", () => {
  let testRuntime_appComp: TestingRuntime;
  let eco_id = 1;
  let busServ_id = 1;

  beforeAll(async () => {
    testRuntime_appComp = await createTestingRuntime([ApplicationComponentOperations]);
    await testRuntime_appComp.queryUserDB("DELETE FROM application_implementation");
    await testRuntime_appComp.queryUserDB("DELETE FROM application_component");
    await testRuntime_appComp.queryUserDB("DELETE FROM application_service");
    await testRuntime_appComp.queryUserDB("DELETE FROM business_service");
    await testRuntime_appComp.queryUserDB("DELETE FROM business_capability");
    await testRuntime_appComp.queryUserDB("DELETE FROM ecosystem");
    await testRuntime_appComp.queryUserDB<Ecosystem>("insert into ecosystem(name, company_name) values (\'test\', \'test\')");
    let resEco = await testRuntime_appComp.queryUserDB<Ecosystem>("SELECT * FROM ecosystem WHERE name=$1", "test");
    eco_id = resEco[0].id || 0;
    await testRuntime_appComp.queryUserDB<ApplicationService>("insert into application_service(name, ecosystem_id) values (\'test\', $1)", eco_id);
    let resBusCap = await testRuntime_appComp.queryUserDB<ApplicationService>("select * from application_service where ecosystem_id = $1", eco_id);
    busServ_id = resBusCap[0].id || 0;
  });

  afterAll(async () => {
    await testRuntime_appComp.destroy();
  });

  /**
   * Test the transaction.
   */
  test("test-application_component-insert", async () => {
    const res = await testRuntime_appComp.invoke(ApplicationComponentOperations).insertApplicationComponent("development", eco_id, busServ_id);
    expect(res.id).toBeGreaterThan(0);

    const rows = await testRuntime_appComp.queryUserDB<ApplicationComponent>("SELECT * FROM application_component WHERE name=$1", "development");
    expect(rows[0].name).toBe("development");
  });

  test("test-application_component-insert-unique", async () => {
    await testRuntime_appComp.queryUserDB("DELETE FROM application_component");
    const res = await testRuntime_appComp.invoke(ApplicationComponentOperations).insertApplicationComponent( "dbos-unique", eco_id, busServ_id);
    expect(res.id).toBeGreaterThan(0);

    const appComp2: ApplicationComponent = { name: "dbos-unique", ecosystem_id: eco_id };
    const res2 = await testRuntime_appComp.invoke(ApplicationComponentOperations).insertApplicationComponent("dbos-unique", eco_id, busServ_id);
    expect(res2.id).toBeUndefined();
    expect(res2.last_status).toMatch("ApplicationComponent already exists");

    const appComp3: ApplicationComponent = { name: "dbos-unique", ecosystem_id: eco_id };
    const res3 = await testRuntime_appComp.invoke(ApplicationComponentOperations).insertApplicationComponent("dbos-unique", eco_id, 0);
    expect(res3.id).toBeUndefined();
    expect(res3.last_status).toMatch("ApplicationComponent already exists");
  });

  test("test-application_component-update", async () => {
    const appComp: ApplicationComponent = { name: "dbos-upd", ecosystem_id: eco_id };
    const res = await testRuntime_appComp.invoke(ApplicationComponentOperations).insertApplicationComponent("dbos-upd", eco_id, busServ_id);
    expect(res.id).toBeGreaterThan(0);

    // Check the greet count.
    const rows = await testRuntime_appComp.queryUserDB<ApplicationComponent>("SELECT * FROM application_component WHERE name=$1", "dbos-upd");
    expect(rows[0].name).toBe("dbos-upd");

    appComp.id = res.id;
    appComp.name = "dbos-upd2";

    const res2 = await testRuntime_appComp.invoke(ApplicationComponentOperations).updateApplicationComponent(appComp);
    expect(res2.id).toEqual(res.id);

    const rows2 = await testRuntime_appComp.queryUserDB<ApplicationComponent>("SELECT * FROM application_component WHERE id=$1", res2.id);
    expect(rows2[0].name).toBe("dbos-upd2");

  });

  /**
   * Test the HTTP endpoint.
   */
  test("test-http-application_component-create", async () => {
    const create_appComp: ApplicationComponent = {
      name: "dbos-end",
      ecosystem_id: eco_id
    }
    const res = await request(testRuntime_appComp.getHandlersCallback())
        .post("/application_component")
        .send(create_appComp);
    expect(res.statusCode).toBe(200);

    const resBody : ApplicationComponent = res.body;
    expect(resBody.name).toMatch("dbos-end");

    const create_appComp2: ApplicationComponent = {
      name: "dbos-end2",
      ecosystem_id: eco_id,
      application_service_id: busServ_id
    }
    const res2 = await request(testRuntime_appComp.getHandlersCallback())
        .post("/application_component")
        .send(create_appComp2);
    expect(res2.statusCode).toBe(200);

    const resBody2 : ApplicationComponent = res2.body;
    expect(resBody2.name).toMatch("dbos-end2");
  });

  test("test-http-application_component-update", async () => {
    const create_appComp: ApplicationComponent = {
      name: "dbos-end-upd",
      ecosystem_id: eco_id
    }
    const res = await request(testRuntime_appComp.getHandlersCallback())
        .post("/application_component")
        .send(create_appComp);
    expect(res.statusCode).toBe(200);

    const resBody : ApplicationComponent = res.body;
    expect(resBody.name).toMatch("dbos-end-upd");

    const update_appComp: ApplicationComponent = create_appComp;
    update_appComp.id = resBody.id;
    update_appComp.name = "dbos-end-upd2";

    const res2 = await request(testRuntime_appComp.getHandlersCallback())
        .post("/application_component")
        .send(update_appComp);
    expect(res2.statusCode).toBe(200);

    const resBody2 : ApplicationComponent = res2.body;
    expect(resBody2.name).toMatch("dbos-end-upd2");
  });

  /**
   * Test the HTTP endpoint.
   */
  test("test-http-application_component-get", async () => {
    await testRuntime_appComp.invoke(ApplicationComponentOperations).insertApplicationComponent("dbos-get", eco_id, busServ_id);

    const res = await request(testRuntime_appComp.getHandlersCallback())
        .get("/application_component/"+ eco_id +"/dbos-get");
    expect(res.statusCode).toBe(200);

    const resBody: ApplicationComponent = res.body;
    expect(resBody.name).toMatch("dbos-get");

    const res2 = await request(testRuntime_appComp.getHandlersCallback())
        .get("/application_component/"+ eco_id +"/dbos-never");
    expect(res2.statusCode).toBe(204);

  });
});
