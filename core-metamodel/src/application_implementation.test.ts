import { TestingRuntime, createTestingRuntime } from "@dbos-inc/dbos-sdk";
import {ApplicationImplementationOperations, ApplicationImplementation, Ecosystem, ApplicationComponent} from "./operations";
// @ts-ignore
import request from "supertest";

describe("appImpl-operations-test", () => {
  let testRuntime_appImpl: TestingRuntime;
  let eco_id = 1;
  let appComp_id = 1;

  beforeAll(async () => {
    testRuntime_appImpl = await createTestingRuntime([ApplicationImplementationOperations]);
    await testRuntime_appImpl.queryUserDB("DELETE FROM application_implementation");
    await testRuntime_appImpl.queryUserDB("DELETE FROM application_component");
    await testRuntime_appImpl.queryUserDB("DELETE FROM application_service");
    await testRuntime_appImpl.queryUserDB("DELETE FROM business_service");
    await testRuntime_appImpl.queryUserDB("DELETE FROM business_capability");
    await testRuntime_appImpl.queryUserDB("DELETE FROM ecosystem");
    await testRuntime_appImpl.queryUserDB<Ecosystem>("insert into ecosystem(name, company_name) values (\'test\', \'test\')");
    let resEco = await testRuntime_appImpl.queryUserDB<Ecosystem>("SELECT * FROM ecosystem WHERE name=$1", "test");
    eco_id = resEco[0].id || 0;
    await testRuntime_appImpl.queryUserDB<ApplicationComponent>("insert into application_component(name, ecosystem_id) values (\'test\', $1)", eco_id);
    let resBusCap = await testRuntime_appImpl.queryUserDB<ApplicationComponent>("select * from application_component where ecosystem_id = $1", eco_id);
    appComp_id = resBusCap[0].id || 0;
  });

  afterAll(async () => {
    await testRuntime_appImpl.destroy();
  });

  /**
   * Test the transaction.
   */
  test("test-application_implementation-insert", async () => {
    const res = await testRuntime_appImpl.invoke(ApplicationImplementationOperations).insertApplicationImplementation("development", eco_id, appComp_id);
    expect(res.id).toBeGreaterThan(0);

    const rows = await testRuntime_appImpl.queryUserDB<ApplicationImplementation>("SELECT * FROM application_implementation WHERE name=$1", "development");
    expect(rows[0].name).toBe("development");
  });

  test("test-application_implementation-insert-unique", async () => {
    await testRuntime_appImpl.queryUserDB("DELETE FROM application_implementation");
    const res = await testRuntime_appImpl.invoke(ApplicationImplementationOperations).insertApplicationImplementation( "dbos-unique", eco_id, appComp_id);
    expect(res.id).toBeGreaterThan(0);

    const appImpl2: ApplicationImplementation = { name: "dbos-unique", ecosystem_id: eco_id };
    const res2 = await testRuntime_appImpl.invoke(ApplicationImplementationOperations).insertApplicationImplementation("dbos-unique", eco_id, appComp_id);
    expect(res2.id).toBeUndefined();
    expect(res2.last_status).toMatch("ApplicationImplementation already exists");

    const appImpl3: ApplicationImplementation = { name: "dbos-unique", ecosystem_id: eco_id };
    const res3 = await testRuntime_appImpl.invoke(ApplicationImplementationOperations).insertApplicationImplementation("dbos-unique", eco_id, 0);
    expect(res3.id).toBeUndefined();
    expect(res3.last_status).toMatch("ApplicationImplementation already exists");
  });

  test("test-application_implementation-update", async () => {
    const appImpl: ApplicationImplementation = { name: "dbos-upd", ecosystem_id: eco_id };
    const res = await testRuntime_appImpl.invoke(ApplicationImplementationOperations).insertApplicationImplementation("dbos-upd", eco_id, appComp_id);
    expect(res.id).toBeGreaterThan(0);

    // Check the greet count.
    const rows = await testRuntime_appImpl.queryUserDB<ApplicationImplementation>("SELECT * FROM application_implementation WHERE name=$1", "dbos-upd");
    expect(rows[0].name).toBe("dbos-upd");

    appImpl.id = res.id;
    appImpl.name = "dbos-upd2";

    const res2 = await testRuntime_appImpl.invoke(ApplicationImplementationOperations).updateApplicationImplementation(appImpl);
    expect(res2.id).toEqual(res.id);

    const rows2 = await testRuntime_appImpl.queryUserDB<ApplicationImplementation>("SELECT * FROM application_implementation WHERE id=$1", res2.id);
    expect(rows2[0].name).toBe("dbos-upd2");

  });

  /**
   * Test the HTTP endpoint.
   */
  test("test-http-application_implementation-create", async () => {
    const create_appImpl: ApplicationImplementation = {
      name: "dbos-end",
      ecosystem_id: eco_id
    }
    const res = await request(testRuntime_appImpl.getHandlersCallback())
        .post("/application_implementation")
        .send(create_appImpl);
    expect(res.statusCode).toBe(200);

    const resBody : ApplicationImplementation = res.body;
    expect(resBody.name).toMatch("dbos-end");

    const create_appImpl2: ApplicationImplementation = {
      name: "dbos-end2",
      ecosystem_id: eco_id,
      application_component_id: appComp_id
    }
    const res2 = await request(testRuntime_appImpl.getHandlersCallback())
        .post("/application_implementation")
        .send(create_appImpl2);
    expect(res2.statusCode).toBe(200);

    const resBody2 : ApplicationImplementation = res2.body;
    expect(resBody2.name).toMatch("dbos-end2");
  });

  test("test-http-application_implementation-update", async () => {
    const create_appImpl: ApplicationImplementation = {
      name: "dbos-end-upd",
      ecosystem_id: eco_id
    }
    const res = await request(testRuntime_appImpl.getHandlersCallback())
        .post("/application_implementation")
        .send(create_appImpl);
    expect(res.statusCode).toBe(200);

    const resBody : ApplicationImplementation = res.body;
    expect(resBody.name).toMatch("dbos-end-upd");

    const update_appImpl: ApplicationImplementation = create_appImpl;
    update_appImpl.id = resBody.id;
    update_appImpl.name = "dbos-end-upd2";

    const res2 = await request(testRuntime_appImpl.getHandlersCallback())
        .post("/application_implementation")
        .send(update_appImpl);
    expect(res2.statusCode).toBe(200);

    const resBody2 : ApplicationImplementation = res2.body;
    expect(resBody2.name).toMatch("dbos-end-upd2");
  });

  /**
   * Test the HTTP endpoint.
   */
  test("test-http-application_implementation-get", async () => {
    await testRuntime_appImpl.invoke(ApplicationImplementationOperations).insertApplicationImplementation("dbos-get", eco_id, appComp_id);

    const res = await request(testRuntime_appImpl.getHandlersCallback())
        .get("/application_implementation/"+ eco_id +"/dbos-get");
    expect(res.statusCode).toBe(200);

    const resBody: ApplicationImplementation = res.body;
    expect(resBody.name).toMatch("dbos-get");

    const res2 = await request(testRuntime_appImpl.getHandlersCallback())
        .get("/application_implementation/"+ eco_id +"/dbos-never");
    expect(res2.statusCode).toBe(204);

  });
});
