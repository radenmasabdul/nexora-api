-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "assign_to" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "priority" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assign_to_fkey" FOREIGN KEY ("assign_to") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
