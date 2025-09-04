import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBookingsTable1756952815027 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "bookings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "propertyId" uuid NOT NULL,
                "roomTypeId" uuid NOT NULL,
                "checkInDate" date NOT NULL,
                "checkOutDate" date NOT NULL,
                "guests" integer NOT NULL DEFAULT '1',
                "totalAmount" numeric(10,2) NOT NULL,
                "currency" character varying(3) NOT NULL DEFAULT 'GHS',
                "status" character varying NOT NULL DEFAULT 'pending',
                "specialRequests" text,
                "paymentReference" text,
                "isPaid" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_bookings" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "bookings" 
            ADD CONSTRAINT "FK_bookings_userId" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "bookings" 
            ADD CONSTRAINT "FK_bookings_propertyId" 
            FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "bookings" 
            ADD CONSTRAINT "FK_bookings_roomTypeId" 
            FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_bookings_userId" ON "bookings" ("userId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_bookings_propertyId" ON "bookings" ("propertyId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_bookings_roomTypeId" ON "bookings" ("roomTypeId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_bookings_status" ON "bookings" ("status")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_bookings_status"`);
        await queryRunner.query(`DROP INDEX "IDX_bookings_roomTypeId"`);
        await queryRunner.query(`DROP INDEX "IDX_bookings_propertyId"`);
        await queryRunner.query(`DROP INDEX "IDX_bookings_userId"`);
        await queryRunner.query(`DROP TABLE "bookings"`);
    }

}
