-- AlterTable
ALTER TABLE "creators" ADD COLUMN     "fileverse_doc_hash" TEXT,
ADD COLUMN     "fileverse_doc_id" TEXT;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "agent_context" TEXT,
ADD COLUMN     "agent_query" TEXT,
ADD COLUMN     "written_to_doc" BOOLEAN NOT NULL DEFAULT false;
