process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('./app');
const db = require('./db');

let testCompany;
let testInvoice;

beforeEach(async () => {
    await db.query('DELETE FROM invoices');
    await db.query('DELETE FROM companies');
    await db.query("SELECT setval('invoices_id_seq', 1, false)");
    const companyResult = await db.query(
        `INSERT INTO companies (code, name, description) VALUES ('test', 'Test Company', 'A test company.') `);
    testCompany = companyResult.rows[0];
    const invoiceResult = await db.query(`
      INSERT INTO invoices (comp_code, amt)
      VALUES ('test', 100)`);
    testInvoice = invoiceResult.rows[0];
});

afterAll(async () => {
    await db.end()
})


describe('GET /invoices', () => {
    test('Get a list with all invoices', async () => {
        const response = await request(app).get('/invoices');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            invoices: [{ id: 1, comp_code: "test" }]
        })
    });
});


describe('GET /invoices/:id', () => {
    test('Get a single invoice by id', async () => {
        const response = await request(app).get(`/invoices/1`);
        expect(response.statusCode).toBe(200);
        expect(response.body.invoice).toEqual({
            id: 1,
            amt: 100,
            paid: false,
            add_date: expect.any(String),
            paid_date: null,
            Company: {
                code: "test",
                name: 'Test Company',
                description: 'A test company.',
            },
        });
    });

    test('Returns a 404 for invalid invoice id', async () => {
        const response = await request(app).get(`/invoices/99999`);
        expect(response.statusCode).toBe(404);
    });
})


describe('POST /invoices', () => {
    test('Create a new invoice', async () => {
        const response = await request(app)
            .post('/invoices')
            .send({ comp_code: "test", amt: 200 });
        expect(response.statusCode).toBe(201);
        expect(response.body.invoice).toEqual({
            id: 2,
            comp_code: "test",
            amt: 200,
            paid: false,
            add_date: expect.any(String),
            paid_date: null,
        });
    });
});


describe('PUT /invoices/:id', () => {
    test('Update an invoice', async () => {
        const response = await request(app)
            .put(`/invoices/1`)
            .send({ amt: 300, paid: true });
        expect(response.statusCode).toBe(200);
        expect(response.body.invoice).toEqual({
            id: 1,
            amt: 300,
            paid: true,
            add_date: expect.any(String),
            paid_date: expect.any(String),
            comp_code: "test"
        });
    });

    test('Returns a 404 for invalid invoice id', async () => {
        const response = await request(app)
            .put(`/invoices/99999`)
            .send({ amt: 300, paid: true });
        expect(response.statusCode).toBe(404);
    });
});


describe('DELETE /invoices/:id', () => {
    test('Deletes a single invoice', async () => {
        const response = await request(app).delete("/invoices/1");
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ status: 'deleted' });
    });

    test('Returns a 404 for invalid invoice id', async () => {
        const response = await request(app)
            .delete(`/invoices/99999`);
        expect(response.statusCode).toBe(404);
    });
});

