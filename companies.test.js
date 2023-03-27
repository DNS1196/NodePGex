process.env.NODE_ENV = 'test';

const request = require('supertest');

const app = require('./app');
const db = require('./db');



let testCompany;
let testInvoice;

beforeEach(async function () {
    await db.query("DELETE FROM companies");
    await db.query('DELETE FROM invoices');
    const result = await db.query(
        `INSERT INTO companies (code, name, description) VALUES ('test', 'Test Company', 'A test company.') `);
    testCompany = result.rows[0];
    const invoiceResult = await db.query(`
      INSERT INTO invoices (comp_code, amt)
      VALUES ('test', 100)`);
    testInvoice = invoiceResult.rows[0];
});

afterAll(async () => {
    await db.end()
})


describe("GET /companies", function () {
    test("Get a list of all companies", async function () {
        const response = await request(app).get(`/companies`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            companies: [{ code: "test", name: "Test Company" }]
        });
    });
});

describe("GET /companies/:code", function () {
    test("Gets a single company", async function () {
        const response = await request(app).get(`/companies/test`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            company: {
                code: "test",
                name: "Test Company",
                description: 'A test company.',
                invoices: [expect.any(Number)]
            }
        });
    })
    test("Responds with 404 for invalid company code", async function () {
        const response = await request(app).get(`/companies/0`);
        expect(response.statusCode).toEqual(404);
    });
})

describe("POST /companies", function () {
    test("Creates a new company", async function () {
        const response = await request(app)
            .post(`/companies`)
            .send({ name: "New Company", description: "A new company." });
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            company: {
                code: 'new-company',
                name: "New Company",
                description: "A new company."
            }
        });
    });
});


describe("PUT /companies/:code", function () {
    test("Updates a single company", async function () {
        const response = await request(app)
            .put(`/companies/test`)
            .send({
                name: "Updated Test Company",
                description: "An updated test company."
            });
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            company: {
                code: "test",
                name: "Updated Test Company",
                description: "An updated test company."
            }
        });
    });

    test("Responds with 404 for invalid company code", async function () {
        const response = await request(app)
            .put(`/companies/0`)
            .send({
                name: "Updated Test Company",
                description: "An updated test company."
            });
        expect(response.statusCode).toEqual(404);
    });
});

describe("DELETE /companies/:code", function () {
    test("Deletes a single a company", async function () {
        const response = await request(app)
            .delete(`/companies/test`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            status: "deleted"
        });
    });

    test("Responds with 404 for deleting invalid company", async function () {
        const response = await request(app)
            .delete(`/companies/0`);
        expect(response.statusCode).toEqual(404);
    });
});