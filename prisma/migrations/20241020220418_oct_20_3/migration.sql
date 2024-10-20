-- AlterTable
ALTER TABLE "File" ADD COLUMN     "createdAt" TIMESTAMP(3),
ADD COLUMN     "size" TEXT,
ADD COLUMN     "uploadTime" TEXT;
