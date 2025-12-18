const sequelize = require('../config/database');

async function fixIndexes() {
  const table = 'Students';
  try {
    console.log(`🔍 Checking indexes on ${table} table...`);

    const [indexes] = await sequelize.query(`SHOW INDEXES FROM \`${table}\``);

    if (!indexes || indexes.length === 0) {
      console.log('ℹ️  No indexes found on table.');
      process.exit(0);
    }

    // Group rows by index name to rebuild column order
    const indexMap = new Map(); // name -> { unique, columns: [] }
    for (const row of indexes) {
      if (!indexMap.has(row.Key_name)) {
        indexMap.set(row.Key_name, {
          name: row.Key_name,
          unique: row.Non_unique === 0,
          columns: []
        });
      }
      indexMap.get(row.Key_name).columns[row.Seq_in_index - 1] = row.Column_name;
    }

    // Build index info list
    const indexInfos = Array.from(indexMap.values()).map((info) => ({
      name: info.name,
      unique: info.unique,
      columns: info.columns.filter(Boolean)
    }));

    // Decide which indexes to keep: keep one per column signature, prefer PRIMARY, then unique
    const keptSignatures = new Set();
    const toDrop = [];

    const priority = (idx) => {
      if (idx.name === 'PRIMARY') return 0;
      if (idx.unique) return 1;
      return 2;
    };

    // Sort so we keep highest priority first
    indexInfos.sort((a, b) => priority(a) - priority(b));

    for (const idx of indexInfos) {
      const signature = `${idx.columns.join('|')}`;
      const alreadyKept = keptSignatures.has(signature);

      if (idx.name === 'PRIMARY') {
        keptSignatures.add(signature);
        continue;
      }

      if (!alreadyKept) {
        keptSignatures.add(signature);
      } else {
        toDrop.push(idx);
      }
    }

    if (!toDrop.length) {
      console.log('✅ No redundant indexes to drop.');
      process.exit(0);
    }

    console.log(`⚠️  Found ${toDrop.length} redundant index(es). Dropping...`);
    for (const idx of toDrop) {
      try {
        await sequelize.query(`DROP INDEX \`${idx.name}\` ON \`${table}\``);
        console.log(`   ✅ Dropped index: ${idx.name} (${idx.columns.join(', ')})`);
      } catch (err) {
        console.log(`   ⚠️  Could not drop index ${idx.name}: ${err.message}`);
      }
    }

    console.log('✅ Index cleanup completed.');
    process.exit(0);
  } catch (error) {
    if (error.message && error.message.includes("doesn't exist")) {
      console.log(`ℹ️  Table ${table} does not exist. This is normal for a fresh database.`);
      process.exit(0);
    } else {
      console.error('❌ Error fixing indexes:', error);
      process.exit(1);
    }
  }
}

sequelize
  .authenticate()
  .then(() => {
    console.log('✅ Database connection established');
    return fixIndexes();
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });


