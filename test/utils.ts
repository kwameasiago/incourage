import { DataSource } from "typeorm";
export async function clearDatabase(dataSource: DataSource) {
    const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
    
        try {
            await queryRunner.query(`DELETE FROM follow;`);
            await queryRunner.query(`DELETE FROM photo_meta_data;`);
            await queryRunner.query(`DELETE FROM sessions;`);
            await queryRunner.query(`DELETE FROM users;`);
            
        } 
        catch (error) {
            console.error("Error clearing database:", error);
        }finally {
            await queryRunner.release();
        }
}