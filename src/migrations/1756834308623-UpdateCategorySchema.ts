class UpdateCategorySchema1756834308623 {
    name = 'UpdateCategorySchema1756834308623'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "imageUrl" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "type" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "icon" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "color" SET NOT NULL`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "color" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "icon" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "type" SET DEFAULT 'hostel'`);
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "type" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "imageUrl" SET NOT NULL`);
    }
}

module.exports = UpdateCategorySchema1756834308623;
