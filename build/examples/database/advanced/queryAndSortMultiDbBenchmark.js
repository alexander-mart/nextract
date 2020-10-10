"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Example: This example shows of working with multiple databases in a single
 * transform, using batched inserts, etc. It also helps with benchmarking large data sets.
 * NOTE:
 * 1) requires setting up the sample MySQL & Postgres databases
 * 2) requires adding the "page" table to MySQL from the Wikipedia SQL export (see README)
 * 3) requires adding the empty "page" table to Postgres using the included page.postgres.sql file
 */
const path = require('path'), Nextract = require(path.resolve(__dirname, '../../../nextract'));
const transform = new Nextract('benchmark');
console.log('Starting transform... ', new Date());
transform.loadPlugins('Core', ['Database', 'Filter', 'Calculator', 'Sort', 'Utils', 'Logger'])
    .then(() => {
    return new Promise((resolve) => {
        //STEP 1: Simulate large join on the database (200k)
        const step1SelectSql = `select page.page_id, page_details_view.page_namespace, page_details_view.page_title, 
        page_details_view.page_counter, page_details_view.page_is_redirect, page_details_view.page_is_new,
        page_details_view.page_random, page_details_view.page_touched, page_details_view.page_latest, page_details_view.page_len
        from page, page as page_details_view 
        where page.page_id = page_details_view.page_id order by page.page_id asc limit 200000`;
        transform.Plugins.Core.Database.selectQuery('nextract_sample', step1SelectSql, {})
            //STEP 2: ETL operations are most often performed on the entire collection. Here we are taking the page_counter of each collection item
            //and raising it by 100.  We could choose to store this new value in new collection properity or simply overwrite the existing one.
            //Here we'll just overwrite the existing one.
            .pipe(transform.Plugins.Core.Calculator.add('page_counter', 100, 'page_counter'))
            //STEP 3: It is always best to reduce the collection down to only the data you really need for performance reasons.
            //So here we pick out only a subject of the current collection properties.
            .pipe(transform.Plugins.Core.Utils.pluckProperties(['page_title', 'page_counter', 'page_random', 'page_latest', 'page_len']))
            //STEP 4: Pass data in to be sorted (1 element is pushed back and it is the expected input for a new stream read call to sortOut)
            .pipe(transform.Plugins.Core.Sort.sortIn(['page_title'], ['asc']))
            .on('data', (sortInDbInfo) => {
            if (sortInDbInfo !== undefined) {
                resolve(sortInDbInfo);
            }
        });
    });
})
    .then((sortInDbInfo) => {
    transform.Plugins.Core.Sort.sortOut(sortInDbInfo)
        //STEP 5: Filter collection for records with page_counter > 100
        .pipe(transform.Plugins.Core.Filter.greaterThan('page_counter', 100))
        //STEP 6: Insert into a 2nd database (to demo cross db support)
        //NOTE: The title prop in wikipedia's MYSQL db is VARBINARY. The equivent in Postgres is bytea. If you want to see the
        //actual page title in Postgres after the INSERT you'll have to cast it back into a string in the SELECT.
        .pipe(transform.Plugins.Core.Database.insertQuery('nextract_pg_sample', 'page', 1000, 10))
        .on('data', (resultingData) => {
        console.log("resultingData", resultingData);
    })
        .on('finish', () => {
        transform.Plugins.Core.Logger.info('Transform finished!', new Date());
    })
        .on('end', () => {
        transform.Plugins.Core.Logger.info('Transform ended!');
        process.exit();
    });
})
    .catch((err) => {
    transform.Plugins.Core.Logger.error('Transform failed: ', err);
    process.exit();
});
