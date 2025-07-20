/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("google_sheet_info", (table) => {
    table.increments("id").primary();
    table.string("type");
    table.string("name");
    table.string("sheet_id");
    table.string("year");
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("google_sheet_info");
};
