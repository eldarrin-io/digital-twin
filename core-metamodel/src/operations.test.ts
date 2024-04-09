import { TestingRuntime, createTestingRuntime } from "@dbos-inc/dbos-sdk";
import { EcosystemOperations, ecosystem } from "./operations";
// @ts-ignore
import request from "supertest";

describe("operations-test", () => {
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
  test("test-transaction", async () => {
    const res = await testRuntime.invoke(EcosystemOperations).createEcosystem("dbos", "DBOS Inc.");
    expect(res.id).toBeGreaterThan(0);

    // Check the greet count.
    const rows = await testRuntime.queryUserDB<ecosystem>("SELECT * FROM ecosystem WHERE name=$1", "dbos");
    expect(rows[0].company_name).toBe("DBOS Inc.");
  });

  /**
   * Test the HTTP endpoint.
   */
  test("test-endpoint", async () => {
    const body: ecosystem = {
      id: 0,
      name: "dbos1",
      company_name: "DBOS1 Inc."
    }
    const res = await request(testRuntime.getHandlersCallback())
        .post("/ecosystem")
        .send(body);
    expect(res.statusCode).toBe(200);

    const resBody : ecosystem = res.body;
    expect(resBody.name).toMatch("dbos1");
  });
});
