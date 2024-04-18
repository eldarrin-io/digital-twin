import { TestingRuntime, createTestingRuntime } from "@dbos-inc/dbos-sdk";
import {BusinessServiceOperations, BusinessService, Ecosystem, BusinessCapability} from "./operations";
// @ts-ignore
import request from "supertest";

describe("busServ-operations-test", () => {
  let testRuntime_busServ: TestingRuntime;
  let eco_id = 1;
  let busCap_id = 1;

  beforeAll(async () => {
    testRuntime_busServ = await createTestingRuntime([BusinessServiceOperations]);
    await testRuntime_busServ.queryUserDB("DELETE FROM business_service");
    await testRuntime_busServ.queryUserDB("DELETE FROM business_capability");
    await testRuntime_busServ.queryUserDB("DELETE FROM ecosystem");
    await testRuntime_busServ.queryUserDB<Ecosystem>("insert into ecosystem(name, company_name) values (\'test\', \'test\')");
    let resEco = await testRuntime_busServ.queryUserDB<Ecosystem>("SELECT * FROM ecosystem WHERE name=$1", "test");
    eco_id = resEco[0].id || 0;
    await testRuntime_busServ.queryUserDB<BusinessCapability>("insert into business_capability(name, ecosystem_id) values (\'test\', $1)", eco_id);
    let resBusCap = await testRuntime_busServ.queryUserDB<BusinessCapability>("select * from business_capability where ecosystem_id = $1", eco_id);
    busCap_id = resBusCap[0].id || 0;
  });

  afterAll(async () => {
    await testRuntime_busServ.destroy();
  });

  /**
   * Test the transaction.
   */
  test("test-business_service-insert", async () => {
    const res = await testRuntime_busServ.invoke(BusinessServiceOperations).insertBusinessService("development", eco_id, busCap_id);
    expect(res.id).toBeGreaterThan(0);

    const rows = await testRuntime_busServ.queryUserDB<BusinessService>("SELECT * FROM business_service WHERE name=$1", "development");
    expect(rows[0].name).toBe("development");
  });

  test("test-business_service-insert-unique", async () => {
    await testRuntime_busServ.queryUserDB("DELETE FROM business_service");
    const res = await testRuntime_busServ.invoke(BusinessServiceOperations).insertBusinessService( "dbos-unique", eco_id, busCap_id);
    expect(res.id).toBeGreaterThan(0);

    const busServ2: BusinessService = { name: "dbos-unique", ecosystem_id: eco_id };
    const res2 = await testRuntime_busServ.invoke(BusinessServiceOperations).insertBusinessService("dbos-unique", eco_id, busCap_id);
    expect(res2.id).toBeUndefined();
    expect(res2.last_status).toMatch("BusinessService already exists");

    const busServ3: BusinessService = { name: "dbos-unique", ecosystem_id: eco_id };
    const res3 = await testRuntime_busServ.invoke(BusinessServiceOperations).insertBusinessService("dbos-unique", eco_id, 0);
    expect(res3.id).toBeUndefined();
    expect(res3.last_status).toMatch("BusinessService already exists");
  });

  test("test-business_service-update", async () => {
    const busServ: BusinessService = { name: "dbos-upd", ecosystem_id: eco_id };
    const res = await testRuntime_busServ.invoke(BusinessServiceOperations).insertBusinessService("dbos-upd", eco_id, busCap_id);
    expect(res.id).toBeGreaterThan(0);

    // Check the greet count.
    const rows = await testRuntime_busServ.queryUserDB<BusinessService>("SELECT * FROM business_service WHERE name=$1", "dbos-upd");
    expect(rows[0].name).toBe("dbos-upd");

    busServ.id = res.id;
    busServ.name = "dbos-upd2";

    const res2 = await testRuntime_busServ.invoke(BusinessServiceOperations).updateBusinessService(busServ);
    expect(res2.id).toEqual(res.id);

    const rows2 = await testRuntime_busServ.queryUserDB<BusinessService>("SELECT * FROM business_service WHERE id=$1", res2.id);
    expect(rows2[0].name).toBe("dbos-upd2");

  });

  /**
   * Test the HTTP endpoint.
   */
  test("test-http-business_service-create", async () => {
    const create_busServ: BusinessService = {
      name: "dbos-end",
      ecosystem_id: eco_id
    }
    const res = await request(testRuntime_busServ.getHandlersCallback())
        .post("/business_service")
        .send(create_busServ);
    expect(res.statusCode).toBe(200);

    const resBody : BusinessService = res.body;
    expect(resBody.name).toMatch("dbos-end");

    const create_busServ2: BusinessService = {
      name: "dbos-end2",
      ecosystem_id: eco_id,
      business_capability_id: busCap_id
    }
    const res2 = await request(testRuntime_busServ.getHandlersCallback())
        .post("/business_service")
        .send(create_busServ2);
    expect(res2.statusCode).toBe(200);

    const resBody2 : BusinessService = res2.body;
    expect(resBody2.name).toMatch("dbos-end2");
  });

  test("test-http-business_service-update", async () => {
    const create_busServ: BusinessService = {
      name: "dbos-end-upd",
      ecosystem_id: eco_id
    }
    const res = await request(testRuntime_busServ.getHandlersCallback())
        .post("/business_service")
        .send(create_busServ);
    expect(res.statusCode).toBe(200);

    const resBody : BusinessService = res.body;
    expect(resBody.name).toMatch("dbos-end-upd");

    const update_busServ: BusinessService = create_busServ;
    update_busServ.id = resBody.id;
    update_busServ.name = "dbos-end-upd2";

    const res2 = await request(testRuntime_busServ.getHandlersCallback())
        .post("/business_service")
        .send(update_busServ);
    expect(res2.statusCode).toBe(200);

    const resBody2 : BusinessService = res2.body;
    expect(resBody2.name).toMatch("dbos-end-upd2");
  });

  /**
   * Test the HTTP endpoint.
   */
  test("test-http-business_service-get", async () => {
    await testRuntime_busServ.invoke(BusinessServiceOperations).insertBusinessService("dbos-get", eco_id, busCap_id);

    const res = await request(testRuntime_busServ.getHandlersCallback())
        .get("/business_service/"+ eco_id +"/dbos-get");
    expect(res.statusCode).toBe(200);

    const resBody: BusinessService = res.body;
    expect(resBody.name).toMatch("dbos-get");

    const res2 = await request(testRuntime_busServ.getHandlersCallback())
        .get("/business_service/"+ eco_id +"/dbos-never");
    expect(res2.statusCode).toBe(204);

  });
});
