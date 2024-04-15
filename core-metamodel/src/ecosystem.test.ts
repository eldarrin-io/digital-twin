import { TestingRuntime, createTestingRuntime } from "@dbos-inc/dbos-sdk";
import { EcosystemOperations, ecosystem } from "./operations";
// @ts-ignore
import request from "supertest";

describe("ecosystem-operations-test", () => {
  let testRuntime: TestingRuntime;

  beforeAll(async () => {
    testRuntime = await createTestingRuntime([EcosystemOperations]);
  });

  afterAll(async () => {
    await testRuntime.destroy();
  });

  /**
   * Test the transaction.
   */
  test("test-ecosystem-insert", async () => {
    const eco: ecosystem = { name: "dbos", company_name: "DBOS Inc." };
    const res = await testRuntime.invoke(EcosystemOperations).insertEcosystem(eco);
    expect(res.id).toBeGreaterThan(0);

    // Check the greet count.
    const rows = await testRuntime.queryUserDB<ecosystem>("SELECT * FROM ecosystem WHERE name=$1", "dbos");
    expect(rows[0].company_name).toBe("DBOS Inc.");
  });

  test("test-ecosystem-update", async () => {
    const eco: ecosystem = { name: "dbos-upd", company_name: "DBOS Inc. UPD" };
    const res = await testRuntime.invoke(EcosystemOperations).insertEcosystem(eco);
    expect(res.id).toBeGreaterThan(0);

    // Check the greet count.
    const rows = await testRuntime.queryUserDB<ecosystem>("SELECT * FROM ecosystem WHERE name=$1", "dbos-upd");
    expect(rows[0].company_name).toBe("DBOS Inc. UPD");

    eco.id = res.id;
    eco.company_name = "DBOS Inc. UPD2";

    const res2 = await testRuntime.invoke(EcosystemOperations).updateEcosystem(eco);
    expect(res2.id).toEqual(res.id);

    const rows2 = await testRuntime.queryUserDB<ecosystem>("SELECT * FROM ecosystem WHERE id=$1", res2.id);
    expect(rows2[0].company_name).toBe("DBOS Inc. UPD2");

  });

  /**
   * Test the HTTP endpoint.
   */
  test("test-http-ecosystem-create", async () => {
    const create_eco: ecosystem = {
      name: "dbos-end",
      company_name: "DBOS-end Inc."
    }
    const res = await request(testRuntime.getHandlersCallback())
        .post("/ecosystem")
        .send(create_eco);
    expect(res.statusCode).toBe(200);

    const resBody : ecosystem = res.body;
    expect(resBody.name).toMatch("dbos-end");
  });

  test("test-http-ecosystem-update", async () => {
    const create_eco: ecosystem = {
      name: "dbos-end-upd",
      company_name: "DBOS1 Inc. END UPD"
    }
    const res = await request(testRuntime.getHandlersCallback())
        .post("/ecosystem")
        .send(create_eco);
    expect(res.statusCode).toBe(200);

    const resBody : ecosystem = res.body;
    expect(resBody.name).toMatch("dbos-end-upd");

    const udpate_eco: ecosystem = create_eco;
    udpate_eco.id = resBody.id;

    udpate_eco.company_name = "DBOS1 Inc. END UPD2";
    const res2 = await request(testRuntime.getHandlersCallback())
        .post("/ecosystem")
        .send(udpate_eco);
    expect(res2.statusCode).toBe(200);

    const resBody2 : ecosystem = res2.body;
    expect(resBody2.company_name).toMatch("DBOS1 Inc. END UPD2");
  });

  /**
   * Test the HTTP endpoint.
   */
  test("test-http-ecosystem-get", async () => {
    const eco: ecosystem = { name: "dbos-get", company_name: "DBOS-GET Inc." };
    await testRuntime.invoke(EcosystemOperations).insertEcosystem(eco);

    const res = await request(testRuntime.getHandlersCallback())
        .get("/ecosystem/dbos-get");
    expect(res.statusCode).toBe(200);

    const resBody: ecosystem = res.body;
    expect(resBody.company_name).toMatch("DBOS-GET Inc.");
  });
});
