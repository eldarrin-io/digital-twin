import { TestingRuntime, createTestingRuntime } from "@dbos-inc/dbos-sdk";
import {BusinessCapabilityOperations, BusinessCapability, Ecosystem} from "./operations";
// @ts-ignore
import request from "supertest";

describe("buscap-operations-test", () => {
  let testRuntime_buscap: TestingRuntime;
  let eco_id = 1;

  beforeAll(async () => {
    testRuntime_buscap = await createTestingRuntime([BusinessCapabilityOperations]);
    await testRuntime_buscap.queryUserDB("DELETE FROM application_service");
    await testRuntime_buscap.queryUserDB("DELETE FROM business_service");
    await testRuntime_buscap.queryUserDB("DELETE FROM business_capability");
    await testRuntime_buscap.queryUserDB("DELETE FROM ecosystem");
    await testRuntime_buscap.queryUserDB<Ecosystem>("insert into ecosystem(name, company_name) values (\'test\', \'test\')");
    let res = await testRuntime_buscap.queryUserDB<Ecosystem>("SELECT * FROM ecosystem WHERE name=$1", "test");
    eco_id = res[0].id || 0;
  });

  afterAll(async () => {
    await testRuntime_buscap.destroy();
  });

  /**
   * Test the transaction.
   */
  test("test-business_capability-insert", async () => {
    const res = await testRuntime_buscap.invoke(BusinessCapabilityOperations).insertBusinessCapability("development", eco_id);
    expect(res.id).toBeGreaterThan(0);

    const rows = await testRuntime_buscap.queryUserDB<BusinessCapability>("SELECT * FROM business_capability WHERE name=$1", "development");
    expect(rows[0].name).toBe("development");
  });

  test("test-business_capability-insert-unique", async () => {
    await testRuntime_buscap.queryUserDB("DELETE FROM business_capability");
    const res = await testRuntime_buscap.invoke(BusinessCapabilityOperations).insertBusinessCapability( "dbos-unique", eco_id);
    expect(res.id).toBeGreaterThan(0);

    const buscap2: BusinessCapability = { name: "dbos-unique", ecosystem_id: eco_id };
    const res2 = await testRuntime_buscap.invoke(BusinessCapabilityOperations).insertBusinessCapability("dbos-unique", eco_id);
    expect(res2.id).toBeUndefined();
    expect(res2.last_status).toMatch("BusinessCapability already exists");
  });

  test("test-business_capability-update", async () => {
    const buscap: BusinessCapability = { name: "dbos-upd", ecosystem_id: eco_id };
    const res = await testRuntime_buscap.invoke(BusinessCapabilityOperations).insertBusinessCapability("dbos-upd", eco_id);
    expect(res.id).toBeGreaterThan(0);

    // Check the greet count.
    const rows = await testRuntime_buscap.queryUserDB<BusinessCapability>("SELECT * FROM business_capability WHERE name=$1", "dbos-upd");
    expect(rows[0].name).toBe("dbos-upd");

    buscap.id = res.id;
    buscap.name = "dbos-upd2";

    const res2 = await testRuntime_buscap.invoke(BusinessCapabilityOperations).updateBusinessCapability(buscap);
    expect(res2.id).toEqual(res.id);

    const rows2 = await testRuntime_buscap.queryUserDB<BusinessCapability>("SELECT * FROM business_capability WHERE id=$1", res2.id);
    expect(rows2[0].name).toBe("dbos-upd2");

  });

  /**
   * Test the HTTP endpoint.
   */
  test("test-http-business_capability-create", async () => {
    const create_buscap: BusinessCapability = {
      name: "dbos-end",
      ecosystem_id: eco_id
    }
    const res = await request(testRuntime_buscap.getHandlersCallback())
        .post("/business_capability")
        .send(create_buscap);
    expect(res.statusCode).toBe(200);

    const resBody : BusinessCapability = res.body;
    expect(resBody.name).toMatch("dbos-end");
  });

  test("test-http-business_capability-update", async () => {
    const create_buscap: BusinessCapability = {
      name: "dbos-end-upd",
      ecosystem_id: eco_id
    }
    const res = await request(testRuntime_buscap.getHandlersCallback())
        .post("/business_capability")
        .send(create_buscap);
    expect(res.statusCode).toBe(200);

    const resBody : BusinessCapability = res.body;
    expect(resBody.name).toMatch("dbos-end-upd");

    const update_buscap: BusinessCapability = create_buscap;
    update_buscap.id = resBody.id;
    update_buscap.name = "dbos-end-upd2";

    const res2 = await request(testRuntime_buscap.getHandlersCallback())
        .post("/business_capability")
        .send(update_buscap);
    expect(res2.statusCode).toBe(200);

    const resBody2 : BusinessCapability = res2.body;
    expect(resBody2.name).toMatch("dbos-end-upd2");
  });

  /**
   * Test the HTTP endpoint.
   */
  test("test-http-business_capability-get", async () => {
    await testRuntime_buscap.invoke(BusinessCapabilityOperations).insertBusinessCapability("dbos-get", eco_id);

    const res = await request(testRuntime_buscap.getHandlersCallback())
        .get("/business_capability/"+ eco_id +"/dbos-get");
    expect(res.statusCode).toBe(200);

    const resBody: BusinessCapability = res.body;
    expect(resBody.name).toMatch("dbos-get");

    const res2 = await request(testRuntime_buscap.getHandlersCallback())
        .get("/business_capability/"+ eco_id +"/dbos-never");
    expect(res2.statusCode).toBe(204);
  });
});
