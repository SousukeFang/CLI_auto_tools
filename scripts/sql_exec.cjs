const mysql = require('mysql2/promise');

// Base configuration. The 'database' property can be overridden.
const baseDbConfig = {
    host: '172.16.5.153',
    user: 'coremail',
    password: '2672512719',
    port: 3308,
    database: 'AI' // Default database
};

async function executeQuery() {
    let dbName = baseDbConfig.database;
    let sql;

    // Check arguments to see if a database name was provided.
    // Usage: node script.js [db_name] "<SQL Query>"
    if (process.argv.length > 3) { // e.g., node script.js db_name "select..."
        dbName = process.argv[2];
        sql = process.argv[3];
    } else if (process.argv.length === 3) { // e.g., node script.js "select..."
        sql = process.argv[2];
    }

    if (!sql) {
        console.error(JSON.stringify({ error: '错误：未提供SQL查询语句。' }));
        process.exit(1);
    }

    // Create the final config for this execution.
    const finalDbConfig = { ...baseDbConfig, database: dbName };

    let connection;
    try {
        connection = await mysql.createConnection(finalDbConfig);
        const [rows, fields] = await connection.execute(sql);
        console.log(JSON.stringify(rows, null, 2));
    } catch (error) {
        console.error(JSON.stringify({ error: `数据库 '${dbName}' 操作失败: ${error.message}` }));
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

executeQuery();