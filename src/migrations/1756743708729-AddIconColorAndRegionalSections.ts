class AddIconColorAndRegionalSections1756743708729 {
    name = 'AddIconColorAndRegionalSections1756743708729';

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "regional_sections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "type" character varying(50) NOT NULL, "city" character varying(100) NOT NULL, "description" text, "imageUrl" character varying(255) NOT NULL, "cloudinaryPublicId" character varying(100), "propertyCount" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "displayOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d3f1154c9b3e6143ce0660ede9b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "icon" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "color" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "regionalSectionId" uuid`);
        await queryRunner.query(`ALTER TABLE "properties" ADD CONSTRAINT "FK_3c5c254c78cb4afc4bb988e0e37" FOREIGN KEY ("regionalSectionId") REFERENCES "regional_sections"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT "FK_3c5c254c78cb4afc4bb988e0e37"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "regionalSectionId"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "color"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "icon"`);
        await queryRunner.query(`DROP TABLE "regional_sections"`); 
    }
}

module.exports = AddIconColorAndRegionalSections1756743708729;
