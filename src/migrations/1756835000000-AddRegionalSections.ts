const { MigrationInterface, QueryRunner } = require("typeorm");

class AddRegionalSections1756835000000 {
    name = 'AddRegionalSections1756835000000';

    async up(queryRunner) {
        // Create regional_sections table
        await queryRunner.query(`
            CREATE TABLE "regional_sections" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "propertyCount" integer NOT NULL DEFAULT '0',
                "isActive" boolean NOT NULL DEFAULT true,
                "displayOrder" integer NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_regional_sections" PRIMARY KEY ("id")
            )
        `);

        // Add regionalSectionId to properties table
        await queryRunner.query(`ALTER TABLE "properties" ADD "regionalSectionId" uuid`);
        
        // Add foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "properties" 
            ADD CONSTRAINT "FK_properties_regional_sections" 
            FOREIGN KEY ("regionalSectionId") 
            REFERENCES "regional_sections"("id") 
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        // Insert some default regional sections
        await queryRunner.query(`
            INSERT INTO "regional_sections" ("id", "name", "propertyCount", "isActive", "displayOrder", "createdAt", "updatedAt") 
            VALUES 
            (uuid_generate_v4(), 'Popular in Accra', 0, true, 1, now(), now()),
            (uuid_generate_v4(), 'Top Picks in Kumasi', 0, true, 2, now(), now()),
            (uuid_generate_v4(), 'Featured in Cape Coast', 0, true, 3, now(), now())
        `);
    }

    async down(queryRunner) {
        // Remove foreign key constraint
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT "FK_properties_regional_sections"`);
        
        // Remove regionalSectionId column
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "regionalSectionId"`);
        
        // Drop regional_sections table
        await queryRunner.query(`DROP TABLE "regional_sections"`);
    }
}

module.exports = AddRegionalSections1756835000000; 