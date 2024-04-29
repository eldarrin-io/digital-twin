const { Knex } = require("knex");

exports.up = async function(knex) {
  // reference tables

  // data tables
  await knex.schema.createTable('ecosystem', table => {
    table.increments('id').primary();
    table.text('name').unique();
    table.text('company_name');
  });

  await knex.schema.createTable('business_capability', table => {
    table.increments('id').primary();
    table.text('name');
    table.text('description');
    table.integer('ecosystem_id').references('ecosystem.id');
    table.unique(['name', 'ecosystem_id']);
  });

  await knex.schema.createTableLike('business_service', 'business_capability');
  await knex.schema.alterTable('business_service', function (table) {
    table.integer('business_capability_id').references('business_capability.id');
  });

  await knex.schema.createTableLike('application_service', 'business_capability');
  await knex.schema.alterTable('application_service', function (table) {
    table.integer('business_service_id').references('business_service.id');
  });

  await knex.schema.createTableLike('application_component', 'business_capability');
  await knex.schema.alterTable('application_component', function (table) {
    table.integer('application_service_id').references('application_service.id');
  });

  await knex.schema.createTableLike('application_implementation', 'business_capability');
  await knex.schema.alterTable('application_implementation', function (table) {
    table.integer('application_component_id').references('application_component.id');
  });

  return knex.schema.createTable('problem', table => {
    table.increments('id').primary();
    table.text('name');
    table.text('description');
    table.integer('ecosystem_id').references('ecosystem.id');
    table.integer('application_implementation').references('application_implementation.id');
    table.unique(['name', 'ecosystem_id']);
  });

};

exports.down = async function(knex) {
  await knex.schema.dropTable('problem');
  await knex.schema.dropTable('application_implementation');
  await knex.schema.dropTable('application_component');
  await knex.schema.dropTable('application_service');
  await knex.schema.dropTable('business_service');
  await knex.schema.dropTable('business_capability');
  return knex.schema.dropTable('ecosystem');

};

