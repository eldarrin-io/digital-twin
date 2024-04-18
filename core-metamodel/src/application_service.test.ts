import { TestingRuntime, createTestingRuntime } from "@dbos-inc/dbos-sdk";
import {ApplicationServiceOperations, ApplicationService, Ecosystem, BusinessCapability} from "./operations";
// @ts-ignore
import request from "supertest";

describe("appServ-operations-test", () => {
  let testRuntime_appServ: TestingRuntime;
  let eco_id = 1;
  let busServ_id = 1;

  beforeAll(async () => {
    testRuntime_appServ = await createTestingRuntime([ApplicationServiceOperations]);
    await testRuntime_appServ.queryUserDB("DELETE FROM application_service");
    await testRuntime_appServ.queryUserDB("DELETE FROM business_service");
    await testRuntime_appServ.queryUserDB("DELETE FROM business_capability");
    await testRuntime_appServ.queryUserDB("DELETE FROM ecosystem");
    await testRuntime_appServ.queryUserDB<Ecosystem>("insert into ecosystem(name, company_name) values (\'test\', \'test\')");
    let resEco = await testRuntime_appServ.queryUserDB<Ecosystem>("SELECT * FROM ecosystem WHERE name=$1", "test");
    eco_id = resEco[0].id || 0;
    await testRuntime_appServ.queryUserDB<BusinessCapability>("insert into business_service(name, ecosystem_id) values (\'test\', $1)", eco_id);
    let resBusCap = await testRuntime_appServ.queryUserDB<BusinessCapability>("select * from business_service where ecosystem_id = $1", eco_id);
    busServ_id = resBusCap[0].id || 0;
  });

  afterAll(async () => {
    await testRuntime_appServ.destroy();
  });

  /**
   * Test the transaction.
   */
  test("test-application_service-insert", async () => {
    const res = await testRuntime_appServ.invoke(ApplicationServiceOperations).insertApplicationService("development", eco_id, busServ_id);
    expect(res.id).toBeGreaterThan(0);

    const rows = await testRuntime_appServ.queryUserDB<ApplicationService>("SELECT * FROM application_service WHERE name=$1", "development");
    expect(rows[0].name).toBe("development");
  });

  test("test-application_service-insert-unique", async () => {
    await testRuntime_appServ.queryUserDB("DELETE FROM application_service");
    const res = await testRuntime_appServ.invoke(ApplicationServiceOperations).insertApplicationService( "dbos-unique", eco_id, busServ_id);
    expect(res.id).toBeGreaterThan(0);

    const appServ2: ApplicationService = { name: "dbos-unique", ecosystem_id: eco_id };
    const res2 = await testRuntime_appServ.invoke(ApplicationServiceOperations).insertApplicationService("dbos-unique", eco_id, busServ_id);
    expect(res2.id).toBeUndefined();
    expect(res2.last_status).toMatch("ApplicationService already exists");

    const appServ3: ApplicationService = { name: "dbos-unique", ecosystem_id: eco_id };
    const res3 = await testRuntime_appServ.invoke(ApplicationServiceOperations).insertApplicationService("dbos-unique", eco_id, 0);
    expect(res3.id).toBeUndefined();
    expect(res3.last_status).toMatch("ApplicationService already exists");
  });

  test("test-application_service-update", async () => {
    const appServ: ApplicationService = { name: "dbos-upd", ecosystem_id: eco_id };
    const res = await testRuntime_appServ.invoke(ApplicationServiceOperations).insertApplicationService("dbos-upd", eco_id, busServ_id);
    expect(res.id).toBeGreaterThan(0);

    // Check the greet count.
    const rows = await testRuntime_appServ.queryUserDB<ApplicationService>("SELECT * FROM application_service WHERE name=$1", "dbos-upd");
    expect(rows[0].name).toBe("dbos-upd");

    appServ.id = res.id;
    appServ.name = "dbos-upd2";

    const res2 = await testRuntime_appServ.invoke(ApplicationServiceOperations).updateApplicationService(appServ);
    expect(res2.id).toEqual(res.id);

    const rows2 = await testRuntime_appServ.queryUserDB<ApplicationService>("SELECT * FROM application_service WHERE id=$1", res2.id);
    expect(rows2[0].name).toBe("dbos-upd2");

  });

  /**
   * Test the HTTP endpoint.
   */
  test("test-http-application_service-create", async () => {
    const create_appServ: ApplicationService = {
      name: "dbos-end",
      ecosystem_id: eco_id
    }
    const res = await request(testRuntime_appServ.getHandlersCallback())
        .post("/application_service")
        .send(create_appServ);
    expect(res.statusCode).toBe(200);

    const resBody : ApplicationService = res.body;
    expect(resBody.name).toMatch("dbos-end");

    const create_appServ2: ApplicationService = {
      name: "dbos-end2",
      ecosystem_id: eco_id,
      business_service_id: busServ_id
    }
    const res2 = await request(testRuntime_appServ.getHandlersCallback())
        .post("/application_service")
        .send(create_appServ2);
    expect(res2.statusCode).toBe(200);

    const resBody2 : ApplicationService = res2.body;
    expect(resBody2.name).toMatch("dbos-end2");
  });

  test("test-http-application_service-update", async () => {
    const create_appServ: ApplicationService = {
      name: "dbos-end-upd",
      ecosystem_id: eco_id
    }
    const res = await request(testRuntime_appServ.getHandlersCallback())
        .post("/application_service")
        .send(create_appServ);
    expect(res.statusCode).toBe(200);

    const resBody : ApplicationService = res.body;
    expect(resBody.name).toMatch("dbos-end-upd");

    const update_appServ: ApplicationService = create_appServ;
    update_appServ.id = resBody.id;
    update_appServ.name = "dbos-end-upd2";

    const res2 = await request(testRuntime_appServ.getHandlersCallback())
        .post("/application_service")
        .send(update_appServ);
    expect(res2.statusCode).toBe(200);

    const resBody2 : ApplicationService = res2.body;
    expect(resBody2.name).toMatch("dbos-end-upd2");
  });

  /**
   * Test the HTTP endpoint.
   */
  test("test-http-application_service-get", async () => {
    await testRuntime_appServ.invoke(ApplicationServiceOperations).insertApplicationService("dbos-get", eco_id, busServ_id);

    const res = await request(testRuntime_appServ.getHandlersCallback())
        .get("/application_service/"+ eco_id +"/dbos-get");
    expect(res.statusCode).toBe(200);

    const resBody: ApplicationService = res.body;
    expect(resBody.name).toMatch("dbos-get");

    const res2 = await request(testRuntime_appServ.getHandlersCallback())
        .get("/application_service/"+ eco_id +"/dbos-never");
    expect(res2.statusCode).toBe(204);

  });
});
