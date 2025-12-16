exports.up = function (knex) {
  return knex.schema.table("notifications_permissions", function (table) {
    table.text("cc").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("notifications_permissions", function (table) {
    table.dropColumn("cc");
  });
};
