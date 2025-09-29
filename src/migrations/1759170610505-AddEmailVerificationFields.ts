import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailVerificationFields1759170610505 implements MigrationInterface {
    name = 'AddEmailVerificationFields1759170610505'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "properties" RENAME COLUMN "propertyType" TO "regionalSectionId"`);
        await queryRunner.query(`ALTER TYPE "public"."properties_propertytype_enum" RENAME TO "properties_regionalsectionid_enum"`);
        await queryRunner.query(`CREATE TABLE "regional_sections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "propertyCount" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "displayOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d3f1154c9b3e6143ce0660ede9b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."bookings_status_enum" AS ENUM('pending', 'confirmed', 'cancelled', 'completed')`);
        await queryRunner.query(`CREATE TABLE "bookings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "propertyId" uuid NOT NULL, "roomTypeId" uuid NOT NULL, "checkInDate" date NOT NULL, "checkOutDate" date, "totalAmount" numeric(10,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'GHS', "status" "public"."bookings_status_enum" NOT NULL DEFAULT 'pending', "paymentReference" text, "isPaid" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "icon" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "color" character varying(20) NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."room_types_billingperiod_enum" AS ENUM('per_night', 'per_day', 'per_week', 'per_month', 'per_semester', 'per_year')`);
        await queryRunner.query(`ALTER TABLE "room_types" ADD "billingPeriod" "public"."room_types_billingperiod_enum" NOT NULL DEFAULT 'per_night'`);
        await queryRunner.query(`ALTER TABLE "room_types" ADD "additionalImageUrls" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "emailVerificationCode" character varying(4)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "emailVerificationCodeExpiresAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "imageUrl" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "type" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "regionalSectionId"`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "regionalSectionId" uuid`);
        await queryRunner.query(`ALTER TABLE "properties" ADD CONSTRAINT "FK_3c5c254c78cb4afc4bb988e0e37" FOREIGN KEY ("regionalSectionId") REFERENCES "regional_sections"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_38a69a58a323647f2e75eb994de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_cf064476d403971270369232d80" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_2869e3b31e403a2ac2509e4fce1" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_2869e3b31e403a2ac2509e4fce1"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_cf064476d403971270369232d80"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_38a69a58a323647f2e75eb994de"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT "FK_3c5c254c78cb4afc4bb988e0e37"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "regionalSectionId"`);
        await queryRunner.query(`ALTER TABLE "properties" ADD "regionalSectionId" "public"."properties_regionalsectionid_enum" NOT NULL DEFAULT 'hostel'`);
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "type" SET DEFAULT 'hostel'`);
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "type" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "imageUrl" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailVerificationCodeExpiresAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailVerificationCode"`);
        await queryRunner.query(`ALTER TABLE "room_types" DROP COLUMN "additionalImageUrls"`);
        await queryRunner.query(`ALTER TABLE "room_types" DROP COLUMN "billingPeriod"`);
        await queryRunner.query(`DROP TYPE "public"."room_types_billingperiod_enum"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "color"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "icon"`);
        await queryRunner.query(`DROP TABLE "bookings"`);
        await queryRunner.query(`DROP TYPE "public"."bookings_status_enum"`);
        await queryRunner.query(`DROP TABLE "regional_sections"`);
        await queryRunner.query(`ALTER TYPE "public"."properties_regionalsectionid_enum" RENAME TO "properties_propertytype_enum"`);
        await queryRunner.query(`ALTER TABLE "properties" RENAME COLUMN "regionalSectionId" TO "propertyType"`);
    }

}
