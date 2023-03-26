const express = require('express');
const ExpressError = require('./expressError');
const db = require('./db');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const result = await db.query(`SELECT code, name FROM companies `);
        return res.json({ "companies": result.rows });
    } catch (e) {
        return next(e);
    }
});


router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const compResult = await db.query(`SELECT * FROM companies WHERE code = $1`, [code])
        const invResult = await db.query(`SELECT id FROM invoices WHERE comp_code = $1`, [code])
        if (compResult.rows.length === 0) {
            throw new ExpressError(`Can't find company with the code of ${code}`, 404)
        }

        const company = compResult.rows[0];
        const invoices = invResult.rows;

        company.invoices = invoices.map(inv => inv.id);

        return res.send({ company: company });
    } catch (e) {
        return next(e);
    }
})


router.post('/', async (req, res, next) => {
    try {
        const { code, name, description } = req.body;
        const result = await db.query('INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description',
            [code, name, description]);
        return res.status(201).json({ company: result.rows[0] })
    } catch (e) {
        return next(e);
    }
})


router.put('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const { name, description } = req.body;
        const result = await db.query(`UPDATE companies SET name = $2, description = $3 WHERE code = $1 RETURNING code, name, description`,
            [code, name, description]);
        if (result.rows.length === 0) {
            throw new ExpressError(`Can't update company with code of ${code}`, 404)
        }
        return res.send({ company: result.rows[0] })
    } catch (e) {
        return next(e);
    }
})


router.delete('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const result = db.query(`DELETE FROM companies WHERE code = $1`, [code]);
        if (!result.rows) {
            throw new ExpressError(`Company with code of ${code} could not be found`, 404)
        }
        return res.send({ status: 'deleted' })
    } catch (e) {
        return next(e);
    }
})



module.exports = router;